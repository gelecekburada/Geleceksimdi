/*
 * Admin API (admin role only).
 *   GET  /api/admin?view=overview|users|ai|feedback
 *   POST /api/admin {action:"setUser", id, role?, is_active?, daily_ai_limit?}
 *   POST /api/admin {action:"feedbackStatus", id, status}
 */
"use strict";
const sb = require("./_lib/sb");

const PAGE = 1000;           // Supabase returns at most 1000 rows per request
const MAX_PAGES = 20;        // -> at most 20,000 rows per view (enough for early scale)
const DAY = 86400000;

async function fetchAll(path) {
  const rows = [];
  const c = sb.cfg();
  for (let i = 0; i < MAX_PAGES; i++) {
    const r = await sb.rest(path, { headers: { Range: i * PAGE + "-" + ((i + 1) * PAGE - 1) } });
    if (!r.ok || !Array.isArray(r.data)) { throw new Error("query failed"); }
    rows.push(...r.data);
    if (r.data.length < PAGE) { return { rows, truncated: false }; }
  }
  void c;
  return { rows, truncated: true };
}

function dayKey(iso) { return new Date(Date.parse(iso) + 3 * 3600000).toISOString().slice(0, 10); } // Istanbul day

function lastDays(n, now) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { out.push(dayKey(new Date(now - i * DAY).toISOString())); }
  return out;
}

/* ---- pure aggregation (unit-tested) ---- */

function summarize(profiles, events, feedbackOpen, now) {
  const days = lastDays(14, now);
  const aiPerDay = Object.fromEntries(days.map((d) => [d, 0]));
  const pagePerDay = Object.fromEntries(days.map((d) => [d, 0]));
  const tools = {};
  const active7 = new Set();
  const since7 = now - 7 * DAY;
  events.forEach((e) => {
    const t = Date.parse(e.created_at), k = dayKey(e.created_at);
    if (e.kind === "ai" && k in aiPerDay) { aiPerDay[k]++; }
    if (e.kind === "page" && k in pagePerDay) { pagePerDay[k]++; }
    if (!tools[e.tool]) { tools[e.tool] = { tool: e.tool, pages: 0, ai: 0 }; }
    tools[e.tool][e.kind === "ai" ? "ai" : "pages"]++;
    if (e.user_id && t >= since7) { active7.add(e.user_id); }
  });
  return {
    users_total: profiles.length,
    users_active: profiles.filter((p) => p.is_active).length,
    admins: profiles.filter((p) => p.role === "admin").length,
    new_users_7d: profiles.filter((p) => Date.parse(p.created_at) >= since7).length,
    active_users_7d: active7.size,
    ai_14d: days.map((d) => ({ day: d, count: aiPerDay[d] })),
    pages_14d: days.map((d) => ({ day: d, count: pagePerDay[d] })),
    tools: Object.values(tools).sort((a, b) => (b.pages + b.ai) - (a.pages + a.ai)),
    feedback_open: feedbackOpen
  };
}

function aiByUser(profiles, events, now, dayStartIso) {
  const start = Date.parse(dayStartIso), since7 = now - 7 * DAY;
  const by = {};
  let anonToday = 0, anon7 = 0;
  events.forEach((e) => {
    if (e.kind !== "ai") { return; }
    const t = Date.parse(e.created_at);
    if (!e.user_id) { if (t >= start) { anonToday++; } if (t >= since7) { anon7++; } return; }
    const u = by[e.user_id] || (by[e.user_id] = { today: 0, d7: 0 });
    if (t >= start) { u.today++; }
    if (t >= since7) { u.d7++; }
  });
  const rows = profiles.map((p) => ({
    id: p.id, email: p.email, role: p.role, is_active: p.is_active, daily_ai_limit: p.daily_ai_limit,
    today: (by[p.id] || {}).today || 0, d7: (by[p.id] || {}).d7 || 0
  })).sort((a, b) => b.d7 - a.d7 || b.today - a.today);
  return { rows, anonymous_today: anonToday, anonymous_7d: anon7 };
}

function validateUserPatch(body, selfId) {
  const patch = {};
  if (body.role !== undefined) {
    if (!["user", "admin"].includes(body.role)) { return { error: "Bad role" }; }
    patch.role = body.role;
  }
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") { return { error: "Bad is_active" }; }
    patch.is_active = body.is_active;
  }
  if (body.daily_ai_limit !== undefined) {
    const n = Number(body.daily_ai_limit);
    if (!Number.isInteger(n) || n < 0 || n > 10000) { return { error: "Bad limit" }; }
    patch.daily_ai_limit = n;
  }
  if (!Object.keys(patch).length) { return { error: "Nothing to change" }; }
  if (body.id === selfId && (patch.role === "user" || patch.is_active === false)) {
    return { error: "You cannot remove your own admin access or disable yourself." };
  }
  return { patch };
}

async function requireAdmin(req, res) {
  const user = await sb.authUser(sb.bearer(req));
  if (!user) { sb.send(res, 401, { error: "Not signed in" }); return null; }
  let p;
  try { p = await sb.getProfile(user.id); } catch (e) { sb.send(res, 503, { error: "Service unavailable" }); return null; }
  if (!p || !p.is_active || p.role !== "admin") { sb.send(res, 403, { error: "Admins only" }); return null; }
  return p;
}

const handler = async (req, res) => {
  if (!sb.configured()) { return sb.send(res, 503, { error: "Not configured" }); }
  const admin = await requireAdmin(req, res);
  if (!admin) { return; }
  const now = Date.now();
  try {
    if (req.method === "GET") {
      const view = String((req.query || {}).view || "overview");
      const profiles = (await fetchAll("profiles?select=*&order=created_at.desc")).rows;

      if (view === "users") { return sb.send(res, 200, { users: profiles }); }

      if (view === "feedback") {
        const fb = await fetchAll("feedback?select=*&order=created_at.desc");
        return sb.send(res, 200, { feedback: fb.rows.slice(0, 500), truncated: fb.truncated || fb.rows.length > 500 });
      }

      const since = new Date(now - 30 * DAY).toISOString();
      const ev = await fetchAll("usage_events?select=user_id,kind,tool,created_at&created_at=gte." + encodeURIComponent(since));

      if (view === "ai") {
        return sb.send(res, 200, Object.assign(aiByUser(profiles, ev.rows, now, sb.istanbulDayStart(now)), { truncated: ev.truncated }));
      }
      const open = await sb.countRows("feedback?select=id&status=eq.open");
      return sb.send(res, 200, Object.assign(summarize(profiles, ev.rows, open || 0, now), { truncated: ev.truncated }));
    }

    if (req.method === "POST") {
      const b = req.body || {};
      if (b.action === "setUser") {
        if (!/^[0-9a-f-]{36}$/i.test(String(b.id || ""))) { return sb.send(res, 400, { error: "Bad id" }); }
        const v = validateUserPatch(b, admin.id);
        if (v.error) { return sb.send(res, 400, { error: v.error }); }
        const r = await sb.rest("profiles?id=eq." + encodeURIComponent(b.id), { method: "PATCH", body: v.patch, prefer: "return=representation" });
        if (!r.ok || !Array.isArray(r.data) || !r.data.length) { return sb.send(res, 404, { error: "User not found" }); }
        return sb.send(res, 200, { user: r.data[0] });
      }
      if (b.action === "feedbackStatus") {
        const id = Number(b.id);
        if (!Number.isInteger(id) || id < 1 || !["open", "done"].includes(b.status)) { return sb.send(res, 400, { error: "Bad request" }); }
        const r = await sb.rest("feedback?id=eq." + id, { method: "PATCH", body: { status: b.status }, prefer: "return=representation" });
        if (!r.ok || !Array.isArray(r.data) || !r.data.length) { return sb.send(res, 404, { error: "Not found" }); }
        return sb.send(res, 200, { feedback: r.data[0] });
      }
      return sb.send(res, 400, { error: "Unknown action" });
    }
    return sb.send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return sb.send(res, 502, { error: "Data could not be loaded" });
  }
};

module.exports = handler;
module.exports._summarize = summarize;
module.exports._aiByUser = aiByUser;
module.exports._validateUserPatch = validateUserPatch;
