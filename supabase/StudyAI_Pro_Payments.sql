-- StudyAI Pro payment records (Razorpay one-time orders)
-- Run in Supabase SQL Editor. Never paste gateway secrets into this file.
-- Amounts are paise: INR 99 = 9900; INR 999 = 99900.
create extension if not exists pgcrypto;
create table if not exists public.studyai_payment_orders (
 id uuid primary key default gen_random_uuid(),
 razorpay_order_id text not null unique,
 user_id uuid not null references auth.users(id) on delete restrict,
 plan text not null check(plan in ('month','year')),
 amount integer not null check((plan='month' and amount=9900) or (plan='year' and amount=99900)),
 currency text not null default 'INR' check(currency='INR'),
 status text not null default 'created' check(status in ('created','paid','failed','refunded')),
 razorpay_payment_id text unique,
 created_at timestamptz not null default now(),
 paid_at timestamptz,
 expires_at timestamptz
);
create table if not exists public.studyai_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete restrict,
 plan text not null check(plan in ('month','year')),
 status text not null default 'active' check(status in ('active','expired','refunded')),
 razorpay_order_id text not null unique references public.studyai_payment_orders(razorpay_order_id),
 razorpay_payment_id text not null unique,
 starts_at timestamptz not null,
 expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create index if not exists studyai_subscriptions_user_active_idx on public.studyai_subscriptions(user_id,status,expires_at desc);
alter table public.studyai_payment_orders enable row level security;
alter table public.studyai_subscriptions enable row level security;
revoke all on table public.studyai_payment_orders from anon,authenticated;
revoke all on table public.studyai_subscriptions from anon,authenticated;
grant select,insert,update on table public.studyai_payment_orders to service_role;
grant select,insert,update on table public.studyai_subscriptions to service_role;
create or replace function public.studyai_activate_paid_order(p_razorpay_order_id text,p_payment_id text,p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
 v_order public.studyai_payment_orders%rowtype;
 v_start timestamptz;
 v_expiry timestamptz;
 v_last timestamptz;
 v_days integer;
 v_existing timestamptz;
begin
 select * into v_order from public.studyai_payment_orders where razorpay_order_id=p_razorpay_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if v_order.user_id<>p_user_id then raise exception 'Order user mismatch'; end if;
 v_days:=case v_order.plan when 'month' then 30 when 'year' then 365 else 0 end;
 if v_days=0 or v_order.amount<>case v_order.plan when 'month' then 9900 when 'year' then 99900 else -1 end then raise exception 'Invalid plan amount'; end if;
 if v_order.status='paid' then
   if v_order.razorpay_payment_id<>p_payment_id then raise exception 'Order already paid with another payment'; end if;
   select s.expires_at into v_existing from public.studyai_subscriptions s where s.razorpay_order_id=p_razorpay_order_id;
   return jsonb_build_object('ok',true,'already_processed',true,'expires_at',v_existing);
 end if;
 if v_order.status<>'created' then raise exception 'Order is not awaiting payment'; end if;
 if exists(select 1 from public.studyai_payment_orders p where p.razorpay_payment_id=p_payment_id and p.razorpay_order_id<>p_razorpay_order_id) then raise exception 'Payment already used'; end if;
 select max(s.expires_at) into v_last from public.studyai_subscriptions s where s.user_id=p_user_id and s.status='active' and s.expires_at>now();
 v_start:=greatest(now(),coalesce(v_last,now()));
 v_expiry:=v_start+make_interval(days=>v_days);
 insert into public.studyai_subscriptions(user_id,plan,status,razorpay_order_id,razorpay_payment_id,starts_at,expires_at)
 values(p_user_id,v_order.plan,'active',p_razorpay_order_id,p_payment_id,v_start,v_expiry);
 update public.studyai_payment_orders set status='paid',razorpay_payment_id=p_payment_id,paid_at=now(),expires_at=v_expiry where razorpay_order_id=p_razorpay_order_id;
 return jsonb_build_object('ok',true,'already_processed',false,'expires_at',v_expiry);
end;
$$;
revoke all on function public.studyai_activate_paid_order(text,text,uuid) from public,anon,authenticated;
grant execute on function public.studyai_activate_paid_order(text,text,uuid) to service_role;
