/* GET /api/me -> profile and today's AI usage for the signed-in user. */
"use strict";
const sb = require("./_lib/sb");

async function handler(req, res) {
  if (req.method !== "GET") { return sb.send(res, 405, { error: "Method not allowed" }); }
  if (!sb.configured()) { return sb.send(res, 200, { enabled: false }); }
  const user = await sb.authUser(sb.bearer(req));
  if (!user) { return sb.send(res, 401, { error: "Not signed in" }); }
  let profile = await sb.getProfile(user.id);
  if (!profile) { return sb.send(res, 403, { error: "No profile" }); }

  /* keep last_seen fresh without writing on every call */
  const stale = !profile.last_seen_at || Date.now() - Date.parse(profile.last_seen_at) > 300000;
  if (stale) { await sb.rest("profiles?id=eq." + encodeURIComponent(user.id), { method: "PATCH", body: { last_seen_at: new Date().toISOString() }, prefer: "return=minimal" }); }

  const used = await sb.aiCountToday(user.id);
  return sb.send(res, 200, {
    enabled: true,
    id: profile.id, email: profile.email, role: profile.role, is_active: profile.is_active,
    daily_ai_limit: profile.daily_ai_limit, ai_used_today: used === null ? 0 : used
  });
}

module.exports = async (req, res) => {
  try { return await handler(req, res); } catch (e) { console.error("api/me failed:", e && e.message ? e.message : String(e)); return sb.send(res, 503, { error: "Service unavailable" }); }
};
