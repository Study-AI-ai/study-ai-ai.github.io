/* StudyAI backend v2: queue + multi-provider fallback + cache + per-IP daily limit.
   Env vars (Render > Environment). Kam se kam ek key zaroori:
     GEMINI_API_KEYS      key1,key2,...   (GEMINI_MODEL optional)
     GROQ_API_KEYS        key1,key2,...   (GROQ_MODEL optional)
     OPENROUTER_API_KEYS  key1,key2,...   (OPENROUTER_MODEL optional)
     PER_KEY_CONCURRENCY  default 2       (ek key par ek saath kitni calls)
     DAILY_LIMIT_PER_IP   default 60
   Model naam providers badalte rehte hain: agar error aaye to unki docs se current free model naam dekh kar env me daalo. */
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "200kb", verify: (req, res, buf) => { req.rawBody = Buffer.from(buf); } }));

const PER_KEY = +process.env.PER_KEY_CONCURRENCY || 2;
const DAILY_LIMIT = +process.env.DAILY_LIMIT_PER_IP || 60;
const MAX_AGE = 8 * 60 * 1000;      // ek sawal ko zyada se zyada 8 min tak koshish
const CALL_TIMEOUT = 90 * 1000;     // ek AI call ka timeout

/* ---------- providers ---------- */
const providers = [];
function add(name, keys, model, kind, url) {
  (keys || "").split(",").map(s => s.trim()).filter(Boolean).forEach((key, i) =>
    providers.push({ id: name + "#" + (i + 1), kind, url, key, model, cool: 0, busy: 0 }));
}
add("gemini", process.env.GEMINI_API_KEYS, process.env.GEMINI_MODEL || "gemini-2.0-flash", "gemini");
add("groq", process.env.GROQ_API_KEYS, process.env.GROQ_MODEL || "llama-3.3-70b-versatile", "openai", "https://api.groq.com/openai/v1/chat/completions");
add("openrouter", process.env.OPENROUTER_API_KEYS, process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free", "openai", "https://openrouter.ai/api/v1/chat/completions");
console.log("Providers loaded:", providers.map(p => p.id).join(", ") || "NONE (env keys daalo)");

async function callProvider(p, system, message) {
  let r, data;
  const signal = AbortSignal.timeout(CALL_TIMEOUT);
  if (p.kind === "gemini") {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${p.key}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: message }] }]
      })
    });
  } else {
    r = await fetch(p.url, {
      method: "POST", signal,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + p.key },
      body: JSON.stringify({ model: p.model, messages: [{ role: "system", content: system }, { role: "user", content: message }] })
    });
  }
  const txt = await r.text();
  try { data = JSON.parse(txt); } catch (e) { data = null; }
  if (!r.ok) {
    const err = new Error("provider " + r.status);
    err.status = r.status;
    err.retryAfter = (+r.headers.get("retry-after") || 0) * 1000;
    throw err;
  }
  let reply = "";
  if (p.kind === "gemini") reply = (data?.candidates?.[0]?.content?.parts || []).map(x => x.text || "").join("");
  else reply = data?.choices?.[0]?.message?.content || "";
  reply = String(reply).trim();
  if (!reply) { const e = new Error("empty"); e.status = 502; throw e; }
  return reply;
}

/* ---------- cache ---------- */
const cache = new Map(); // key -> reply
const CACHE_MAX = 3000;
const ckey = j => crypto.createHash("sha1").update([j.cls, j.system, j.message.toLowerCase().replace(/\s+/g, " ").trim()].join("|")).digest("hex");
function cacheSet(k, v) { if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value); cache.set(k, v); }

/* ---------- queue ---------- */
const jobs = new Map();
const queue = []; // job ids, FIFO
let rr = 0;

function pickProvider() {
  const now = Date.now();
  for (let i = 0; i < providers.length; i++) {
    const p = providers[(rr + i) % providers.length];
    if (p.cool <= now && p.busy < PER_KEY) { rr = (rr + i + 1) % providers.length; return p; }
  }
  return null;
}

function pump() {
  while (queue.length) {
    const p = pickProvider();
    if (!p) return;
    const job = jobs.get(queue.shift());
    if (!job || job.status !== "queued") continue;
    run(job, p);
  }
}

async function run(job, p) {
  job.status = "running"; p.busy++; job.tries++;
  try {
    const reply = await callProvider(p, job.sys, job.message);
    job.status = "done"; job.reply = reply; cacheSet(job.ck, reply);
  } catch (e) {
    const s = e.status || 0;
    if (s === 429) p.cool = Date.now() + (e.retryAfter || 60000);
    else if (s === 401 || s === 403 || s === 404) p.cool = Date.now() + 10 * 60000; // galat key/model
    else p.cool = Date.now() + 8000;
    console.log("fail", p.id, s || e.name);
    if (Date.now() - job.created > MAX_AGE || job.tries >= 12) { job.status = "error"; job.error = "busy"; }
    else { job.status = "queued"; queue.unshift(job.id); } // line me sabse aage wapas
  } finally { p.busy--; pump(); }
}

setInterval(() => {
  pump();
  const now = Date.now();
  for (const [id, j] of jobs) if (now - j.created > 15 * 60000) jobs.delete(id);
}, 2000);

/* ---------- per-IP daily limit ---------- */
const usage = new Map();
function allowed(ip) {
  const day = new Date().toISOString().slice(0, 10);
  const u = usage.get(ip);
  if (!u || u.day !== day) { usage.set(ip, { day, n: 1 }); return true; }
  if (u.n >= DAILY_LIMIT) return false;
  u.n++; return true;
}
setInterval(() => { const day = new Date().toISOString().slice(0, 10); for (const [k, v] of usage) if (v.day !== day) usage.delete(k); }, 3600000);

/* ---------- helpers ---------- */
function makeJob(body) {
  const message = String(body.message || "").slice(0, 8000);
  const cls = String(body.class || "10").slice(0, 3);
  const ctx = String(body.screenContext || "").slice(0, 300);
  const system = String(body.systemPrompt || "").slice(0, 3000);
  const j = { id: crypto.randomUUID(), message, cls, system, created: Date.now(), tries: 0, status: "queued" };
  j.sys = (system ? system + "\n" : "") + `Student ki class: ${cls}.` + (ctx ? ` Screen: ${ctx}.` : "");
  j.ck = ckey(j);
  return j;
}
function position(id) { const i = queue.indexOf(id); return i < 0 ? 0 : i + 1; }

function submit(req, res) {
  if (!providers.length) return { err: [500, "Server me AI keys set nahi hain"] };
  const message = String((req.body || {}).message || "").trim();
  if (!message) return { err: [400, "message khali hai"] };
  const j = makeJob(req.body);
  const hit = cache.get(j.ck);
  if (hit) { j.status = "done"; j.reply = hit; jobs.set(j.id, j); return { job: j }; }
  if (!allowed(req.ip)) return { err: [429, "Aaj ki limit poori ho gayi. Kal dobara try karo."] };
  jobs.set(j.id, j); queue.push(j.id); pump();
  return { job: j };
}

/* ---------- routes ---------- */
// Naya (recommended): turant id milti hai, app poll karti hai
app.post("/api/job", (req, res) => {
  const { job, err } = submit(req, res);
  if (err) return res.status(err[0]).json({ error: err[1] });
  res.json({ id: job.id, status: job.status, position: position(job.id) });
});
app.get("/api/job/:id", (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j) return res.status(404).json({ status: "missing" });
  if (j.status === "done") return res.json({ status: "done", reply: j.reply });
  if (j.status === "error") return res.json({ status: "error", error: j.error });
  res.json({ status: j.status, position: position(j.id) });
});

// Purana sync endpoint (purani app chalti rahe): 55 sec tak intezar
app.post("/api/chat", async (req, res) => {
  const { job, err } = submit(req, res);
  if (err) return res.status(err[0]).json({ error: err[1] });
  const end = Date.now() + 55000;
  while (Date.now() < end) {
    if (job.status === "done") return res.json({ reply: job.reply });
    if (job.status === "error") break;
    await new Promise(r => setTimeout(r, 500));
  }
  res.status(503).json({ error: "busy" });
});

app.get("/", (req, res) => res.json({ ok: true, queue: queue.length, providers: providers.length, cached: cache.size }));

/* STUDYAI_RAZORPAY_INTEGRATION — disabled by default until adult-managed setup is complete. */
const SAI_PLANS = Object.freeze({
  month: { amount: 9900, days: 30, name: "StudyAI Pro · 30 days" },
  year: { amount: 99900, days: 365, name: "StudyAI Pro Max · 365 days" }
});
const SAI_SB_URL = String(process.env.SUPABASE_URL || "https://xrziavazhzbiejdzioiz.supabase.co").replace(/\/+$/, "");
const SAI_SB_ANON = process.env.SUPABASE_ANON_KEY || "sb_publishable_FBBST75QSQBYnkk1X2wn-Q_7hlJawpi";
const SAI_SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SAI_RZP_ID = process.env.RAZORPAY_KEY_ID || "";
const SAI_RZP_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const SAI_RZP_WEBHOOK = process.env.RAZORPAY_WEBHOOK_SECRET || "";
const SAI_PAYMENTS_ON = process.env.PRO_PAYMENTS_ENABLED === "true";

function saiPaymentsReady() {
  return SAI_PAYMENTS_ON && !!(SAI_SB_URL && SAI_SB_ANON && SAI_SB_SERVICE && SAI_RZP_ID && SAI_RZP_SECRET && SAI_RZP_WEBHOOK);
}
function saiSafeHexEqual(a, b) {
  try {
    if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
    const x = Buffer.from(a, "hex"), y = Buffer.from(b, "hex");
    return crypto.timingSafeEqual(x, y);
  } catch (_) { return false; }
}
async function saiProUser(req) {
  const token = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: [401, "Sign in to your StudyAI account first."] };
  try {
    const r = await fetch(SAI_SB_URL + "/auth/v1/user", {
      headers: { apikey: SAI_SB_ANON, Authorization: "Bearer " + token },
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) return { error: [401, "Your login session expired. Sign in again."] };
    const user = await r.json().catch(() => null);
    return user && user.id ? { user } : { error: [401, "Sign in to your StudyAI account first."] };
  } catch (_) { return { error: [503, "Could not verify your account. Please retry."] }; }
}
function saiAdminHeaders(extra = {}) {
  return Object.assign({ apikey: SAI_SB_SERVICE, Authorization: "Bearer " + SAI_SB_SERVICE, "Content-Type": "application/json" }, extra);
}
async function saiDb(path, options = {}) {
  return fetch(SAI_SB_URL + "/rest/v1/" + path, Object.assign({ headers: saiAdminHeaders(), signal: AbortSignal.timeout(12000) }, options));
}
function saiRzpHeaders(extra = {}) {
  return Object.assign({ Authorization: "Basic " + Buffer.from(SAI_RZP_ID + ":" + SAI_RZP_SECRET).toString("base64"), "Content-Type": "application/json" }, extra);
}
async function saiFetchPayment(id) {
  const r = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(id), { headers: saiRzpHeaders(), signal: AbortSignal.timeout(15000) });
  const p = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Payment provider verification failed.");
  return p;
}
async function saiFindOrder(orderId, userId) {
  const q = new URLSearchParams({ select: "razorpay_order_id,user_id,plan,amount,currency,status,razorpay_payment_id,expires_at", razorpay_order_id: "eq." + orderId });
  if (userId) q.set("user_id", "eq." + userId);
  const r = await saiDb("studyai_payment_orders?" + q.toString());
  if (!r.ok) throw new Error("Could not read the StudyAI order.");
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}
async function saiActivate(order, paymentId) {
  const r = await saiDb("rpc/studyai_activate_paid_order", { method: "POST", body: JSON.stringify({ p_razorpay_order_id: order.razorpay_order_id, p_payment_id: paymentId, p_user_id: order.user_id }) });
  const x = await r.json().catch(() => ({}));
  if (!r.ok || x.ok !== true) throw new Error("Verified payment could not be recorded. Support review is required.");
  return x;
}

app.get("/api/pro/config", (req, res) => { res.set("Cache-Control", "no-store"); res.json({ enabled: saiPaymentsReady(), currency: "INR" }); });
app.post("/api/pro/create-order", async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!saiPaymentsReady()) return res.status(503).json({ error: "Checkout is disabled until the merchant, database and server settings are complete." });
  const auth = await saiProUser(req);
  if (auth.error) return res.status(auth.error[0]).json({ error: auth.error[1] });
  const key = String((req.body || {}).plan || ""), plan = SAI_PLANS[key];
  if (!plan) return res.status(400).json({ error: "Choose a valid StudyAI plan." });
  try {
    const ro = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST", headers: saiRzpHeaders(),
      body: JSON.stringify({ amount: plan.amount, currency: "INR", receipt: "sai_" + Date.now().toString(36) + "_" + crypto.randomBytes(4).toString("hex"), notes: { studyai_user_id: auth.user.id, studyai_plan: key } }),
      signal: AbortSignal.timeout(15000)
    });
    const d = await ro.json().catch(() => ({}));
    if (!ro.ok || !d.id) { console.error("StudyAI gateway order error:", ro.status); return res.status(502).json({ error: "Secure checkout could not start. Please retry later." }); }
    const saved = await saiDb("studyai_payment_orders", {
      method: "POST", headers: saiAdminHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({ razorpay_order_id: d.id, user_id: auth.user.id, plan: key, amount: plan.amount, currency: "INR", status: "created" })
    });
    if (!saved.ok) { console.error("StudyAI order storage failed:", saved.status, await saved.text().catch(() => "")); return res.status(503).json({ error: "Payment setup is incomplete. Do not pay yet; contact StudyAI support." }); }
    return res.json({ key_id: SAI_RZP_ID, order_id: d.id, amount: plan.amount, currency: "INR", name: "StudyAI", description: plan.name });
  } catch (e) { console.error("StudyAI create-order failure:", e.message); return res.status(502).json({ error: "Secure checkout is temporarily unavailable." }); }
});
app.post("/api/pro/verify-payment", async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!saiPaymentsReady()) return res.status(503).json({ error: "Checkout is not enabled." });
  const auth = await saiProUser(req);
  if (auth.error) return res.status(auth.error[0]).json({ error: auth.error[1] });
  const b = req.body || {}, orderId = String(b.razorpay_order_id || ""), paymentId = String(b.razorpay_payment_id || ""), signature = String(b.razorpay_signature || "");
  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) return res.status(400).json({ error: "Payment response is incomplete. Do not pay again until status is checked." });
  try {
    const order = await saiFindOrder(orderId, auth.user.id);
    if (!order) return res.status(404).json({ error: "This order does not belong to your StudyAI account." });
    const expected = crypto.createHmac("sha256", SAI_RZP_SECRET).update(orderId + "|" + paymentId).digest("hex");
    if (!saiSafeHexEqual(expected, signature)) return res.status(400).json({ error: "Payment signature verification failed." });
    const p = await saiFetchPayment(paymentId);
    if (p.order_id !== orderId || p.status !== "captured" || Number(p.amount) !== Number(order.amount) || p.currency !== "INR") return res.status(400).json({ error: "Provider has not confirmed a captured payment for this exact plan." });
    if (order.status === "paid") {
      if (order.razorpay_payment_id !== paymentId) return res.status(409).json({ error: "This order was already processed." });
      return res.json({ ok: true, already_processed: true, plan: order.plan, expires_at: order.expires_at });
    }
    const saved = await saiActivate(order, paymentId);
    return res.json({ ok: true, plan: order.plan, expires_at: saved.expires_at });
  } catch (e) { console.error("StudyAI verify failure:", e.message); return res.status(503).json({ error: "Payment verification could not finish. Keep your payment reference and contact support before retrying." }); }
});
app.get("/api/pro/status", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const auth = await saiProUser(req);
  if (auth.error) return res.status(auth.error[0]).json({ error: auth.error[1] });
  if (!SAI_SB_SERVICE) return res.status(503).json({ error: "Subscription status is not configured." });
  try {
    const q = new URLSearchParams({ select: "plan,status,starts_at,expires_at,razorpay_order_id", user_id: "eq." + auth.user.id, status: "eq.active", expires_at: "gt." + new Date().toISOString(), order: "expires_at.desc", limit: "1" });
    const r = await saiDb("studyai_subscriptions?" + q.toString());
    if (!r.ok) return res.status(503).json({ error: "Subscription status is not available." });
    const rows = await r.json().catch(() => []);
    return res.json({ active: Array.isArray(rows) && rows.length > 0, subscription: Array.isArray(rows) ? rows[0] || null : null });
  } catch (_) { return res.status(503).json({ error: "Subscription status is not available." }); }
});
app.post("/api/pro/razorpay-webhook", async (req, res) => {
  if (!SAI_PAYMENTS_ON || !SAI_RZP_WEBHOOK || !SAI_RZP_SECRET || !SAI_SB_SERVICE) return res.status(503).json({ error: "Payment webhook is not configured." });
  const signature = String(req.headers["x-razorpay-signature"] || ""), raw = req.rawBody;
  if (!raw || !signature) return res.status(400).json({ error: "Webhook signature is missing." });
  const expected = crypto.createHmac("sha256", SAI_RZP_WEBHOOK).update(raw).digest("hex");
  if (!saiSafeHexEqual(expected, signature)) return res.status(400).json({ error: "Webhook signature is invalid." });
  const body = req.body || {};
  if (String(body.event || "") !== "payment.captured") return res.json({ ok: true, ignored: true });
  const data = body.payload?.payment?.entity;
  if (!data?.order_id || !data?.id) return res.status(400).json({ error: "Webhook payment details are missing." });
  try {
    const order = await saiFindOrder(String(data.order_id), null);
    if (!order) return res.status(404).json({ error: "StudyAI order not found." });
    const p = await saiFetchPayment(String(data.id));
    if (p.order_id !== order.razorpay_order_id || p.status !== "captured" || Number(p.amount) !== Number(order.amount) || p.currency !== "INR") return res.status(400).json({ error: "Captured payment does not match this StudyAI order." });
    await saiActivate(order, String(data.id));
    return res.json({ ok: true });
  } catch (e) { console.error("StudyAI webhook error:", e.message); return res.status(503).json({ error: "Webhook could not be processed; provider may retry." }); }
});
/* END STUDYAI_RAZORPAY_INTEGRATION */


app.listen(process.env.PORT || 3000, () => console.log("StudyAI backend ready"));
