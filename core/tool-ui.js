/*
 * BATool — small helpers shared by the standalone tool pages.
 * Language comes from localStorage `baforge-language` (same as nav.js).
 */
(function (root) {
  "use strict";

  function lang() {
    try {
      return localStorage.getItem("baforge-language") === "tr" ? "tr" : "en";
    } catch (e) {
      return "en";
    }
  }

  function $(id) {
    return document.getElementById(id);
  }

  /*
   * Apply a { en: {key: text}, tr: {...} } dictionary:
   *   [data-t]              -> textContent
   *   [data-t-html]         -> innerHTML (trusted, static strings only)
   *   [data-t-placeholder]  -> placeholder
   *   [data-t-title]        -> title attribute
   * Returns the dictionary for the active language.
   */
  function applyI18n(dict) {
    var L = lang();
    var d = dict[L] || dict.en;
    document.documentElement.lang = L;
    if (d.pageTitle) { document.title = d.pageTitle; }
    function each(attr, fn) {
      Array.prototype.forEach.call(document.querySelectorAll("[" + attr + "]"), function (el) {
        var v = d[el.getAttribute(attr)];
        if (v !== undefined) { fn(el, v); }
      });
    }
    each("data-t", function (el, v) { el.textContent = v; });
    each("data-t-html", function (el, v) { el.innerHTML = v; });
    each("data-t-placeholder", function (el, v) { el.setAttribute("placeholder", v); });
    each("data-t-title", function (el, v) { el.setAttribute("title", v); });
    return d;
  }

  function status(kind, msg, id) {
    var el = $(id || "status");
    if (!el) { return; }
    el.className = "status" + (kind ? " " + kind : "");
    el.setAttribute("role", kind === "error" ? "alert" : "status");
    el.textContent = msg || "";
  }

  function warnings(list, id) {
    var ul = $(id || "warnings");
    if (!ul) { return; }
    ul.innerHTML = "";
    (list || []).forEach(function (w) {
      var li = document.createElement("li");
      li.textContent = w;
      ul.appendChild(li);
    });
  }

  function copy(text, onOk, onFail) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      (ok ? onOk : onFail)();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onOk, fallback);
    } else {
      fallback();
    }
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  root.BATool = { lang: lang, $: $, applyI18n: applyI18n, status: status, warnings: warnings, copy: copy, download: download, esc: esc, debounce: debounce };
})(window);
