/* POST /api/feedback {category, message, page} -> stores feedback (sign-in optional). */
"use strict";
const sb = require("./_lib/sb");

const hits = new Map(); // 5 messages / 10 min per IP

module.exports = async (req, res) => {
  if (req.method !== "POST") { return sb.send(res, 405, { error: "Method not allowed" }); }
  const l = sb.lang(req);
  if (!sb.configured()) { return sb.send(res, 503, { error: l === "tr" ? "Geri bildirim henüz açık değil." : "Feedback is not enabled yet." }); }
  const b = req.body || {};
  const message = String(b.message || "").trim();
  const category = ["bug", "idea", "other"].includes(b.category) ? b.category : "other";
  if (message.length < 3) { return sb.send(res, 400, { error: l === "tr" ? "Lütfen birkaç kelime yazın." : "Please write a few words." }); }
  if (message.length > 4000) { return sb.send(res, 400, { error: l === "tr" ? "Mesaj çok uzun (en fazla 4000 karakter)." : "Message is too long (max 4000 characters)." }); }

  const ip = String((req.headers["x-forwarded-for"] || "")).split(",")[0].trim() || "unknown", now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 600000);
  if (recent.length >= 5) { return sb.send(res, 429, { error: l === "tr" ? "Çok fazla mesaj. Biraz sonra tekrar deneyin." : "Too many messages. Please try again later." }); }
  recent.push(now); hits.set(ip, recent); if (hits.size > 5000) { hits.clear(); }

  const user = await sb.authUser(sb.bearer(req));
  const page = String(b.page || "").slice(0, 120);
  const r = await sb.rest("feedback", {
    method: "POST", prefer: "return=minimal",
    body: { user_id: user ? user.id : null, email: user ? user.email : null, category, message, page }
  });
  if (!r.ok) { return sb.send(res, 502, { error: l === "tr" ? "Mesaj kaydedilemedi." : "Could not save your message." }); }
  return sb.send(res, 200, { ok: true });
};
