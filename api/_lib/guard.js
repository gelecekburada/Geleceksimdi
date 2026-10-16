/*
 * guard(req, res, tool) — call at the top of every AI endpoint.
 * Returns true if the request may continue. Otherwise it has already answered.
 *
 *   - Supabase not configured  -> old behaviour (allowed).
 *   - Signed-in user           -> must be active and under the daily AI limit; the call is logged.
 *   - Anonymous                -> allowed and logged, unless AI_REQUIRE_LOGIN=1 (then 401).
 */
"use strict";
const sb = require("./sb");

const MSG = {
  login_required: {
    tr: "Bu özelliği kullanmak için giriş yapmanız gerekiyor.",
    en: "Please sign in to use this feature."
  },
  account_disabled: {
    tr: "Hesabınız devre dışı. Lütfen yönetici ile iletişime geçin.",
    en: "Your account is disabled. Please contact the administrator."
  },
  limit_reached: {
    tr: "Bugünkü yapay zekâ kullanım limitinize ulaştınız. Yarın yeniden deneyin.",
    en: "You have reached today's AI usage limit. Please try again tomorrow."
  },
  service_error: {
    tr: "Kullanım kontrolü şu an yapılamıyor. Lütfen biraz sonra tekrar deneyin.",
    en: "Usage check is unavailable right now. Please try again shortly."
  }
};

function deny(req, res, status, code) {
  const l = sb.lang(req);
  sb.send(res, status, { error: MSG[code][l], code });
  return false;
}

async function guard(req, res, tool) {
  if (!sb.configured()) { return true; }
  const requireLogin = process.env.AI_REQUIRE_LOGIN === "1";
  const token = sb.bearer(req);
  try {
    const user = token ? await sb.authUser(token) : null;

    if (!user) {
      if (requireLogin) { return deny(req, res, 401, "login_required"); }
      await sb.logEvent(null, "ai", tool);
      return true;
    }

    const profile = await sb.getProfile(user.id);
    if (!profile) { return deny(req, res, 403, "account_disabled"); }
    if (!profile.is_active) { return deny(req, res, 403, "account_disabled"); }

    if (profile.role !== "admin") {
      const used = await sb.aiCountToday(user.id);
      if (used === null) { return deny(req, res, 503, "service_error"); }
      if (used >= profile.daily_ai_limit) { return deny(req, res, 429, "limit_reached"); }
    }
    await sb.logEvent(user.id, "ai", tool);
    return true;
  } catch (e) {
    /* A broken usage store must not take the whole product down for anonymous users;
       signed-in users and the login-required mode fail closed. */
    if (requireLogin || token) { return deny(req, res, 503, "service_error"); }
    return true;
  }
}

module.exports = guard;
