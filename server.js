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
app.use(express.json({ limit: "200kb" }));

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
app.listen(process.env.PORT || 3000, () => console.log("StudyAI backend ready"));
