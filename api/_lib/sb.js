/*
 * Tiny Supabase helper using plain fetch (the project has no npm dependencies).
 * Environment: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 * Nothing here ever logs or returns a key.
 */
"use strict";

const ISTANBUL_OFFSET_MS = 3 * 3600 * 1000; // Turkey has no DST (UTC+3)

function cfg() {
  return {
    url: String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
    anon: process.env.SUPABASE_ANON_KEY || "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  };
}

function configured() {
  const c = cfg();
  return Boolean(c.url && c.anon && c.service);
}

/* New-style keys (sb_...) go in `apikey` only; legacy JWT keys also go in Authorization. */
function keyHeaders(key) {
  const h = { apikey: key };
  if (/^eyJ/.test(key)) { h.Authorization = "Bearer " + key; }
  return h;
}

async function call(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch (e) { data = { raw: text.slice(0, 200) }; } }
  return { ok: res.ok, status: res.status, data };
}

/* Server-side REST access with the service key (bypasses RLS). */
function rest(path, { method = "GET", body, prefer, headers } = {}) {
  const c = cfg();
  const h = Object.assign({ "Content-Type": "application/json" }, keyHeaders(c.service), headers || {});
  if (prefer) { h.Prefer = prefer; }
  return call(c.url + "/rest/v1/" + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
}

function bearer(req) {
  const h = (req.headers && (req.headers.authorization || req.headers.Authorization)) || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : "";
}

/* Returns { id, email } for a valid user access token, otherwise null. */
async function authUser(token) {
  if (!token) { return null; }
  const c = cfg();
  const r = await call(c.url + "/auth/v1/user", { headers: Object.assign({}, keyHeaders(c.anon), { Authorization: "Bearer " + token }) });
  if (!r.ok || !r.data || !r.data.id) { return null; }
  return { id: r.data.id, email: r.data.email || "" };
}

async function getProfile(id) {
  const r = await rest("profiles?id=eq." + encodeURIComponent(id) + "&select=*");
  if (!r.ok) { throw new Error("profile lookup failed"); }
  return Array.isArray(r.data) && r.data[0] ? r.data[0] : null;
}

/* Start of "today" in Istanbul, as an ISO string in UTC. */
function istanbulDayStart(now) {
  const t = (now === undefined ? Date.now() : now) + ISTANBUL_OFFSET_MS;
  const day = Math.floor(t / 86400000) * 86400000;
  return new Date(day - ISTANBUL_OFFSET_MS).toISOString();
}

/* PostgREST returns the total in Content-Range; re-implemented here so we can read the header. */
async function countRows(path) {
  const c = cfg();
  const res = await fetch(c.url + "/rest/v1/" + path, {
    headers: Object.assign({ Prefer: "count=exact", Range: "0-0" }, keyHeaders(c.service))
  });
  if (!res.ok) { return null; }
  const range = res.headers.get("content-range") || "";
  const m = /\/(\d+|\*)$/.exec(range);
  return m && m[1] !== "*" ? parseInt(m[1], 10) : 0;
}

function aiCountToday(userId, now) {
  return countRows(
    "usage_events?select=id&kind=eq.ai&user_id=eq." + encodeURIComponent(userId) + "&created_at=gte." + encodeURIComponent(istanbulDayStart(now))
  );
}

function logEvent(userId, kind, tool) {
  return rest("usage_events", { method: "POST", body: { user_id: userId || null, kind, tool: String(tool || "unknown").slice(0, 60) }, prefer: "return=minimal" });
}

function send(res, status, body) {
  res.status(status).json(body);
}

function lang(req) {
  const b = req.body || {};
  return b.language === "en" || (req.query && req.query.language === "en") ? "en" : "tr";
}

module.exports = {
  cfg, configured, keyHeaders, call, rest, bearer, authUser, getProfile,
  istanbulDayStart, countRows, aiCountToday, logEvent, send, lang
};
