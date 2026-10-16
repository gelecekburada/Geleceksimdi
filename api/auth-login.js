/*
 * POST /api/auth-login {action: "signin"|"signup", email, password, language?}
 *   -> { ok:true, session:{access_token, refresh_token, expires_at} }
 * Email + password sign-in through Supabase Auth. Sign-up creates an already-confirmed user with the
 * service key (no email is sent, so the email-sending limit never blocks it) and signs in at once.
 */
"use strict";
const sb = require("./_lib/sb");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hits = new Map(); // tiny per-instance throttle: 10 requests / 10 min per IP+email

module.exports = async (req, res) => {
  if (req.method !== "POST") { return sb.send(res, 405, { error: "Method not allowed" }); }
  const l = sb.lang(req), tr = l === "tr";
  if (!sb.configured()) {
    return sb.send(res, 503, { error: tr ? "Giriş sistemi henüz yapılandırılmadı." : "Sign-in is not configured yet." });
  }
  const b = req.body || {};
  const action = b.action === "signup" ? "signup" : "signin";
  const email = String(b.email || "").trim().toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return sb.send(res, 400, { error: tr ? "Geçerli bir e-posta adresi girin." : "Please enter a valid email address." });
  }
  if (action === "signup" && (password.length < 8 || password.length > 72)) {
    return sb.send(res, 400, { error: tr ? "Şifre en az 8, en fazla 72 karakter olmalı." : "The password must be 8 to 72 characters." });
  }
  if (!password || password.length > 72) {
    return sb.send(res, 400, { error: tr ? "Şifrenizi yazın." : "Enter your password." });
  }

  const ip = String((req.headers["x-forwarded-for"] || "")).split(",")[0].trim() || "unknown";
  const key = ip + "|" + email, now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < 600000);
  if (recent.length >= 10) {
    return sb.send(res, 429, { error: tr ? "Çok fazla deneme. Birkaç dakika sonra tekrar deneyin." : "Too many attempts. Please try again in a few minutes." });
  }
  recent.push(now); hits.set(key, recent);
  if (hits.size > 5000) { hits.clear(); }

  const c = sb.cfg();
  if (action === "signup") {
    const created = await sb.call(c.url + "/auth/v1/admin/users", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, sb.keyHeaders(c.service)),
      body: JSON.stringify({ email, password, email_confirm: true })
    });
    if (!created.ok) {
      const exists = created.status === 422 || /already|registered|exists/i.test(JSON.stringify(created.data || {}));
      if (exists) { return sb.send(res, 409, { error: tr ? "Bu e-posta ile zaten bir hesap var. Giriş yapın." : "An account with this email already exists. Sign in instead.", code: "exists" }); }
      return sb.send(res, 502, { error: tr ? "Hesap oluşturulamadı." : "Could not create the account." });
    }
  }

  const r = await sb.call(c.url + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: Object.assign({ "Content-Type": "application/json" }, sb.keyHeaders(c.anon)),
    body: JSON.stringify({ email, password })
  });
  if (!r.ok || !r.data || !r.data.access_token) {
    if (r.status === 429) { return sb.send(res, 429, { error: tr ? "Çok fazla deneme. Biraz sonra tekrar deneyin." : "Too many attempts. Please try again later." }); }
    return sb.send(res, 401, { error: tr ? "E-posta veya şifre hatalı." : "Wrong email or password.", code: "bad_credentials" });
  }
  const d = r.data;
  return sb.send(res, 200, { ok: true, session: { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600) } });
};
