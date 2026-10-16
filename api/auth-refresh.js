/* POST /api/auth-refresh {refresh_token} -> new session tokens. */
"use strict";
const sb = require("./_lib/sb");

module.exports = async (req, res) => {
  if (req.method !== "POST") { return sb.send(res, 405, { error: "Method not allowed" }); }
  if (!sb.configured()) { return sb.send(res, 503, { error: "Not configured" }); }
  const rt = String((req.body || {}).refresh_token || "");
  if (!rt || rt.length > 500) { return sb.send(res, 400, { error: "Missing refresh token" }); }
  const c = sb.cfg();
  const r = await sb.call(c.url + "/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    headers: Object.assign({ "Content-Type": "application/json" }, sb.keyHeaders(c.anon)),
    body: JSON.stringify({ refresh_token: rt })
  });
  if (!r.ok || !r.data || !r.data.access_token) { return sb.send(res, 401, { error: "Session expired" }); }
  const d = r.data;
  return sb.send(res, 200, {
    access_token: d.access_token, refresh_token: d.refresh_token,
    expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600)
  });
};
