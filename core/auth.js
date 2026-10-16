/*
 * BAAuth — browser side of accounts (loaded by nav.js on every page).
 *  - keeps the Supabase session (email + password sign-in) in localStorage `baforge-auth`
 *  - adds "Authorization: Bearer <token>" to same-origin /api/ calls when signed in
 *  - shows a Sign in / account chip in the nav and a small Feedback button
 *  - records page views for signed-in users
 * The browser never sees a Supabase key: all auth calls go through /api/auth-*.
 */
(function (root) {
  "use strict";
  if (root.BAAuth) { return; }

  var KEY = "baforge-auth";
  var origFetch = root.fetch ? root.fetch.bind(root) : null;
  var refreshing = null;
  var meCache = null;
  var listeners = [];

  function lang() { try { return localStorage.getItem("baforge-language") === "tr" ? "tr" : "en"; } catch (e) { return "en"; } }

  var TXT = {
    en: {
      signIn: "Sign in", account: "My account", feedback: "Feedback", admin: "Admin panel",
      fbTitle: "Send feedback", fbBug: "Something is broken", fbIdea: "I have an idea", fbOther: "Other",
      fbPlaceholder: "Tell us what happened or what you would like to see…", fbSend: "Send", fbCancel: "Cancel",
      fbThanks: "Thank you! Your message was sent.", fbFail: "Could not send. Please try again.", fbShort: "Please write a few words."
    },
    tr: {
      signIn: "Giriş yap", account: "Hesabım", feedback: "Geri bildirim", admin: "Yönetim paneli",
      fbTitle: "Geri bildirim gönder", fbBug: "Bir şey bozuk", fbIdea: "Bir fikrim var", fbOther: "Diğer",
      fbPlaceholder: "Ne olduğunu veya ne görmek istediğinizi yazın…", fbSend: "Gönder", fbCancel: "Vazgeç",
      fbThanks: "Teşekkürler! Mesajınız gönderildi.", fbFail: "Gönderilemedi. Lütfen tekrar deneyin.", fbShort: "Lütfen birkaç kelime yazın."
    }
  };

  /* ---------------------------- session storage ---------------------------- */

  function readSession() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.access_token ? s : null; } catch (e) { return null; }
  }
  function writeSession(s) {
    try { if (s) { localStorage.setItem(KEY, JSON.stringify(s)); } else { localStorage.removeItem(KEY); } } catch (e) { /* storage blocked */ }
    meCache = null;
    listeners.forEach(function (fn) { try { fn(s); } catch (e) { /* ignore */ } });
  }

  /* Tokens arrive in the URL hash after the user clicks the email link. */
  function takeHashSession() {
    var h = String(location.hash || "");
    if (h.indexOf("access_token=") === -1) { return false; }
    var p = new URLSearchParams(h.replace(/^#/, ""));
    var at = p.get("access_token"), rt = p.get("refresh_token");
    if (!at || !rt) { return false; }
    var exp = parseInt(p.get("expires_at") || "", 10) || Math.floor(Date.now() / 1000) + (parseInt(p.get("expires_in") || "3600", 10) || 3600);
    writeSession({ access_token: at, refresh_token: rt, expires_at: exp });
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
    return true;
  }
  function hashError() {
    var p = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
    return p.get("error_description") || p.get("error") || "";
  }

  function refresh(session) {
    if (refreshing) { return refreshing; }
    refreshing = origFetch("/api/auth-refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: session.refresh_token }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.access_token) { writeSession(d); return d; }
        writeSession(null); return null;
      })
      .catch(function () { return session; })
      .then(function (v) { refreshing = null; return v; });
    return refreshing;
  }

  function getToken() {
    var s = readSession();
    if (!s) { return Promise.resolve(null); }
    if (s.expires_at && s.expires_at - 60 < Date.now() / 1000) {
      return refresh(s).then(function (n) { return n ? n.access_token : null; });
    }
    return Promise.resolve(s.access_token);
  }

  /* ----------------------------- fetch wrapper ----------------------------- */

  function isApiCall(input) {
    var u = typeof input === "string" ? input : (input && input.url) || "";
    if (/^\/api\//.test(u)) { return true; }
    try { var a = new URL(u, location.href); return a.origin === location.origin && /^\/api\//.test(a.pathname); } catch (e) { return false; }
  }

  if (origFetch) {
    root.fetch = function (input, init) {
      if (!isApiCall(input) || !readSession()) { return origFetch(input, init); }
      return getToken().then(function (tok) {
        if (!tok) { return origFetch(input, init); }
        init = Object.assign({}, init || {});
        var h = new Headers(init.headers || (typeof input !== "string" && input && input.headers) || {});
        if (!h.has("Authorization")) { h.set("Authorization", "Bearer " + tok); }
        init.headers = h;
        return origFetch(input, init);
      });
    };
  }

  /* --------------------------------- API ---------------------------------- */

  function me(force) {
    if (!force && meCache) { return meCache; }
    if (!readSession()) { return Promise.resolve(null); }
    meCache = origFetch ? getToken().then(function (tok) {
      if (!tok) { return null; }
      return origFetch("/api/me", { headers: { Authorization: "Bearer " + tok } }).then(function (r) {
        if (r.status === 401) { writeSession(null); return null; }
        return r.ok ? r.json() : null;
      });
    }).catch(function () { return null; }) : Promise.resolve(null);
    return meCache;
  }

  function signOut() { writeSession(null); }
  function onChange(fn) { listeners.push(fn); }

  /* action: "signin" | "signup". Resolves { ok, error, code }; on success the session is stored. */
  function credentials(action, email, password) {
    return origFetch("/api/auth-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: action, email: email, password: password, language: lang() }) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.ok && d.session && d.session.access_token) { writeSession(d.session); return { ok: true, error: "", code: "" }; }
          return { ok: false, error: d.error || "", code: d.code || "" };
        });
      });
  }

  root.BAAuth = { me: me, signOut: signOut, onChange: onChange, credentials: credentials, getToken: getToken, isSignedIn: function () { return !!readSession(); }, hashError: hashError, takeHashSession: takeHashSession };

  takeHashSession();

  /* ------------------------------ nav + widgets ----------------------------- */

  function css() {
    if (document.getElementById("baforge-auth-css")) { return; }
    var st = document.createElement("style");
    st.id = "baforge-auth-css";
    st.textContent =
      ".baforge-account{display:inline-flex;align-items:center;height:32px;padding:0 12px;border:1px solid rgba(255,255,255,.2);border-radius:8px;background:rgba(255,255,255,.08);color:#fff;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;flex:0 0 auto;max-width:170px;overflow:hidden;text-overflow:ellipsis}" +
      ".baforge-account:hover{background:rgba(255,255,255,.18)}" +
      ".baforge-account.in{background:#2563eb;border-color:#2563eb}" +
      ".baforge-nav-inner .baforge-language{gap:8px}" +
      "@media (max-width:1050px){.baforge-nav-inner .baforge-links{max-width:calc(100vw - 400px)}}" +
      "@media (max-width:850px){.baforge-nav-inner .baforge-account{display:none}}" +
      ".baforge-fb-btn{position:fixed;right:16px;bottom:16px;z-index:9990;height:40px;padding:0 16px;border:0;border-radius:999px;background:#172033;color:#fff;font:700 13px Arial,Helvetica,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(16,24,40,.28)}" +
      ".baforge-fb-btn:hover{background:#2563eb}" +
      ".baforge-fb-back{position:fixed;inset:0;z-index:9991;background:rgba(16,24,40,.5);display:flex;align-items:center;justify-content:center;padding:16px}" +
      ".baforge-fb{width:min(440px,100%);background:#fff;color:#172033;border-radius:16px;padding:20px;font-family:Arial,Helvetica,sans-serif;box-shadow:0 24px 60px rgba(16,24,40,.35)}" +
      ".baforge-fb h2{margin:0 0 12px;font-size:17px}" +
      ".baforge-fb select,.baforge-fb textarea{width:100%;border:1px solid #d0d5dd;border-radius:10px;padding:10px;font:inherit;font-size:14px;margin-bottom:10px;box-sizing:border-box;background:#fff;color:#172033}" +
      ".baforge-fb textarea{min-height:110px;resize:vertical}" +
      ".baforge-fb .row{display:flex;gap:8px;justify-content:flex-end}" +
      ".baforge-fb button{height:38px;padding:0 16px;border-radius:10px;border:1px solid #d0d5dd;background:#fff;color:#172033;font:700 14px Arial,Helvetica,sans-serif;cursor:pointer}" +
      ".baforge-fb button.go{background:#2563eb;border-color:#2563eb;color:#fff}" +
      ".baforge-fb .msg{min-height:20px;font-size:13px;font-weight:700;margin:0 0 8px}" +
      ".baforge-fb .msg.err{color:#b42318}.baforge-fb .msg.ok{color:#16a34a}" +
      "@media print{.baforge-fb-btn{display:none}}";
    document.head.appendChild(st);
  }

  function pageSlug() {
    var m = /\/([a-z0-9-]+)\.html$/i.exec(location.pathname);
    return m ? m[1].toLowerCase() : (location.pathname === "/" ? "home" : "");
  }

  function renderChip() {
    var T = TXT[lang()];
    var holder = document.querySelector(".baforge-nav-inner .baforge-language");
    var mobile = document.getElementById("baforgeMobileMenu");
    if (!holder) { return; }
    var chip = document.getElementById("baforgeAccountChip");
    if (!chip) {
      chip = document.createElement("a");
      chip.id = "baforgeAccountChip";
      chip.className = "baforge-account";
      chip.href = "/login.html";
      holder.insertBefore(chip, holder.firstChild);
    }
    var mlink = document.getElementById("baforgeAccountMobile");
    if (!mlink && mobile) {
      mlink = document.createElement("a");
      mlink.id = "baforgeAccountMobile";
      mlink.href = "/login.html";
      mlink.className = "baforge-mobile-link";
      mobile.appendChild(mlink);
    }
    function paint(info) {
      var signed = !!info;
      chip.className = "baforge-account" + (signed ? " in" : "");
      var label = signed ? (info.email || T.account) : T.signIn;
      chip.textContent = label; chip.title = signed ? T.account : T.signIn;
      if (mlink) { mlink.textContent = signed ? T.account + " (" + (info.email || "") + ")" : T.signIn; }
    }
    paint(null);
    if (readSession()) { me().then(function (info) { paint(info); }); }
  }

  function feedbackWidget() {
    var T = TXT[lang()];
    if (document.getElementById("baforgeFbBtn") || /\/(login|admin)\.html$/.test(location.pathname)) { return; }
    var btn = document.createElement("button");
    btn.id = "baforgeFbBtn"; btn.type = "button"; btn.className = "baforge-fb-btn"; btn.textContent = "💬 " + T.feedback;
    btn.addEventListener("click", function () {
      var back = document.createElement("div");
      back.className = "baforge-fb-back";
      back.innerHTML =
        '<div class="baforge-fb" role="dialog" aria-modal="true" aria-label="' + T.fbTitle + '">' +
        "<h2>" + T.fbTitle + "</h2>" +
        '<select id="fbCat"><option value="bug">' + T.fbBug + '</option><option value="idea">' + T.fbIdea + '</option><option value="other">' + T.fbOther + "</option></select>" +
        '<textarea id="fbMsg" maxlength="4000" placeholder="' + T.fbPlaceholder + '"></textarea>' +
        '<div class="msg" id="fbStatus" role="status"></div>' +
        '<div class="row"><button type="button" id="fbCancel">' + T.fbCancel + '</button><button type="button" class="go" id="fbSend">' + T.fbSend + "</button></div></div>";
      document.body.appendChild(back);
      var msg = back.querySelector("#fbMsg"), st = back.querySelector("#fbStatus");
      msg.focus();
      function close() { if (back.parentNode) { back.parentNode.removeChild(back); } document.removeEventListener("keydown", esc); }
      function esc(e) { if (e.key === "Escape") { close(); } }
      document.addEventListener("keydown", esc);
      back.addEventListener("click", function (e) { if (e.target === back) { close(); } });
      back.querySelector("#fbCancel").addEventListener("click", close);
      back.querySelector("#fbSend").addEventListener("click", function () {
        var text = msg.value.trim();
        st.className = "msg";
        if (text.length < 3) { st.className = "msg err"; st.textContent = T.fbShort; return; }
        var send = back.querySelector("#fbSend"); send.disabled = true;
        fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: back.querySelector("#fbCat").value, message: text, page: location.pathname, language: lang() }) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (x) {
            if (x.ok) { st.className = "msg ok"; st.textContent = T.fbThanks; setTimeout(close, 1400); }
            else { st.className = "msg err"; st.textContent = x.d.error || T.fbFail; send.disabled = false; }
          })
          .catch(function () { st.className = "msg err"; st.textContent = T.fbFail; send.disabled = false; });
      });
    });
    document.body.appendChild(btn);
  }

  function trackView() {
    var slug = pageSlug();
    if (!slug || !readSession() || !origFetch) { return; }
    try { if (sessionStorage.getItem("baforge-tracked") === slug) { return; } sessionStorage.setItem("baforge-tracked", slug); } catch (e) { /* ignore */ }
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: slug }) }).catch(function () { /* best effort */ });
  }

  /* nav.js builds the nav asynchronously; wait for it if it is not there yet. */
  function whenNav(fn) {
    if (document.querySelector(".baforge-nav-inner .baforge-language")) { fn(); return; }
    var tries = 0, t = setInterval(function () {
      tries++;
      if (document.querySelector(".baforge-nav-inner .baforge-language")) { clearInterval(t); fn(); }
      else if (tries > 50) { clearInterval(t); }
    }, 100);
  }

  function start() { css(); whenNav(renderChip); feedbackWidget(); trackView(); }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } else { start(); }
})(window);
