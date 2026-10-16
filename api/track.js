/* POST /api/track {tool} -> records a page view for a signed-in, active user. */
"use strict";
const sb = require("./_lib/sb");

async function handler(req, res) {
  if (req.method !== "POST") { return sb.send(res, 405, { error: "Method not allowed" }); }
  if (!sb.configured()) { return sb.send(res, 200, { ok: true }); }
  const user = await sb.authUser(sb.bearer(req));
  if (!user) { return sb.send(res, 200, { ok: false }); }
  const tool = String((req.body || {}).tool || "").toLowerCase();
  if (!/^[a-z0-9-]{1,40}$/.test(tool)) { return sb.send(res, 400, { error: "Bad tool" }); }
  const profile = await sb.getProfile(user.id);
  if (!profile || !profile.is_active) { return sb.send(res, 200, { ok: false }); }
  await sb.logEvent(user.id, "page", tool);
  return sb.send(res, 200, { ok: true });
}

module.exports = async (req, res) => {
  try { return await handler(req, res); } catch (e) { return sb.send(res, 200, { ok: false }); }
};
