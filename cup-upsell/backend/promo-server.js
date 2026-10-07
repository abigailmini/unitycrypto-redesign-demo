/* =====================================================================
   XYZ Cup — minimal promo-code backend (REFERENCE IMPLEMENTATION)
   ---------------------------------------------------------------------
   Node + Express, zero external DB (JSON file) so it runs anywhere.
   Swap the `store` for Postgres/Supabase in production.

   Endpoints (match xyz-cup-upsell.js CFG.api):
     POST /promo/issue   {tier}            -> {code, pct, expiresAt}
     POST /promo/redeem  {code}            -> {ok, redemption}
     POST /promo/email   {email,code,...}  -> {ok}
     GET  /promo/validate?code=XYZ         -> {valid, pct, expiresAt, redeemed}
     GET  /promo/stats                     -> conversion funnel counts

   Run:  node promo-server.js   (PORT env, default 4780)
   ===================================================================== */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 4780;
const DB = path.join(__dirname, "promo-db.json");
const TTL_HOURS = Number(process.env.CODE_TTL_HOURS || 48);
const TIERS = { 10: true, 20: true, 30: true }; // allowed discount %

/* -------- tiny JSON store (replace with Postgres/Supabase in prod) -------- */
function read() {
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); }
  catch (e) { return { codes: {}, events: [] }; }
}
function write(db) { fs.writeFileSync(DB, JSON.stringify(db, null, 2)); }
function logEvent(db, type, data) { db.events.push({ type, data, at: new Date().toISOString() }); }

function genCode(pct) {
  const n = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `XYZCUP${pct}${n}`;
}
function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise((resolve) => {
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch (e) { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "OPTIONS") return json(res, 204, {});
  const db = read();

  try {
    // ---- issue a code ----
    if (req.method === "POST" && u.pathname === "/promo/issue") {
      const { tier } = await body(req);
      const pct = TIERS[tier] ? Number(tier) : 10;
      const code = genCode(pct);
      const expiresAt = Date.now() + TTL_HOURS * 3600e3;
      db.codes[code] = { pct, expiresAt, issuedAt: Date.now(), redeemed: false, redeemedAt: null };
      logEvent(db, "issue", { code, pct });
      write(db);
      return json(res, 200, { code, pct, expiresAt });
    }

    // ---- validate (checkout can call this to apply discount) ----
    if (req.method === "GET" && u.pathname === "/promo/validate") {
      const code = u.searchParams.get("code");
      const rec = db.codes[code];
      if (!rec) return json(res, 200, { valid: false });
      const valid = Date.now() < rec.expiresAt && !rec.redeemed;
      return json(res, 200, { valid, pct: rec.pct, expiresAt: rec.expiresAt, redeemed: rec.redeemed });
    }

    // ---- redeem (call at successful X Mode purchase) ----
    if (req.method === "POST" && u.pathname === "/promo/redeem") {
      const { code } = await body(req);
      const rec = db.codes[code];
      if (!rec) return json(res, 404, { ok: false, reason: "unknown" });
      if (rec.redeemed) return json(res, 409, { ok: false, reason: "already_redeemed" });
      if (Date.now() > rec.expiresAt) return json(res, 410, { ok: false, reason: "expired" });
      rec.redeemed = true; rec.redeemedAt = Date.now();
      logEvent(db, "redeem", { code, pct: rec.pct });
      write(db);
      return json(res, 200, { ok: true, redemption: rec });
    }

    // ---- email the voucher (wire to your ESP; stubbed to log) ----
    if (req.method === "POST" && u.pathname === "/promo/email") {
      const payload = await body(req);
      logEvent(db, "email_requested", { email: payload.email, code: payload.code });
      write(db);
      // TODO: integrate real ESP (Supabase/Resend/SES). FundedXYZ already has
      // subaccount email infra (lib/fundedxyz-subaccounts/emails.ts in ufc-user-dashboard).
      console.log(`[promo/email] would send ${payload.code} (${payload.pct}% off) to ${payload.email}`);
      return json(res, 200, { ok: true, sent: Boolean(payload.email) });
    }

    // ---- funnel stats ----
    if (req.method === "GET" && u.pathname === "/promo/stats") {
      const codes = Object.values(db.codes);
      const byType = db.events.reduce((m, e) => ((m[e.type] = (m[e.type] || 0) + 1), m), {});
      return json(res, 200, {
        issued: codes.length,
        redeemed: codes.filter((c) => c.redeemed).length,
        active: codes.filter((c) => !c.redeemed && Date.now() < c.expiresAt).length,
        conversionRate: codes.length ? +(codes.filter((c) => c.redeemed).length / codes.length).toFixed(3) : 0,
        events: byType
      });
    }

    return json(res, 404, { error: "not_found" });
  } catch (e) {
    return json(res, 500, { error: String(e) });
  }
});

server.listen(PORT, () => console.log(`XYZ Cup promo backend on :${PORT}  (TTL ${TTL_HOURS}h)`));
