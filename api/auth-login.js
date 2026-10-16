/* POST /api/auth-login {email, language?} -> sends a magic-link email via Supabase Auth. */
"use strict";
const sb = require("./_lib/sb");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hits = new Map(); // tiny per-instance throttle: 5 requests / 10 min per IP+email

module.exports = async (req, res) => {
  if (req.method !== "POST") { return sb.send(res, 405, { error: "Method not allowed" }); }
  const l = sb.lang(req);
  if (!sb.configured()) {
    return sb.send(res, 503, { error: l === "tr" ? "Giriş sistemi henüz yapılandırılmadı." : "Sign-in is not configured yet." });
  }
  const email = String((req.body || {}).email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return sb.send(res, 400, { error: l === "tr" ? "Geçerli bir e-posta adresi girin." : "Please enter a valid email address." });
  }

  const ip = String((req.headers["x-forwarded-for"] || "")).split(",")[0].trim() || "unknown";
  const key = ip + "|" + email, now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < 600000);
  if (recent.length >= 5) {
    return sb.send(res, 429, { error: l === "tr" ? "Çok fazla deneme. Birkaç dakika sonra tekrar deneyin." : "Too many attempts. Please try again in a few minutes." });
  }
  recent.push(now); hits.set(key, recent);
  if (hits.size > 5000) { hits.clear(); }

  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
  const redirect = host ? proto + "://" + host + "/login.html" : "";

  const c = sb.cfg();
  const r = await sb.call(c.url + "/auth/v1/otp" + (redirect ? "?redirect_to=" + encodeURIComponent(redirect) : ""), {
    method: "POST",
    headers: Object.assign({ "Content-Type": "application/json" }, sb.keyHeaders(c.anon)),
    body: JSON.stringify({ email, create_user: true })
  });
  if (!r.ok) {
    const rate = r.status === 429;
    return sb.send(res, rate ? 429 : 502, {
      error: rate
        ? (l === "tr" ? "E-posta gönderim sınırına ulaşıldı. Biraz sonra tekrar deneyin." : "Email sending limit reached. Please try again later.")
        : (l === "tr" ? "Giriş bağlantısı gönderilemedi." : "Could not send the sign-in link.")
    });
  }
  return sb.send(res, 200, { ok: true });
};
