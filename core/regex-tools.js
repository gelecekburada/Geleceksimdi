/*
 * BARegex — helpers for the Regex Builder page: match finder, replace preview,
 * token-by-token explanation (EN/TR) and a library of common patterns.
 * Pure functions, no DOM, so they can be tested in Node.
 */
(function (root) {
  "use strict";

  var MAX_MATCHES = 2000;

  function findMatches(pattern, flags, text, limit) {
    limit = limit || MAX_MATCHES;
    var re;
    try {
      var f = String(flags || "").replace(/[^dgimsuyv]/g, "");
      var all = f.indexOf("g") !== -1;
      if (f.indexOf("g") === -1) { f += "g"; }
      f = f.split("").filter(function (c, i, a) { return a.indexOf(c) === i; }).join("");
      re = new RegExp(pattern, f);
    } catch (e) {
      return { matches: [], truncated: false, error: e.message };
    }
    var matches = [], m, truncated = false;
    while ((m = re.exec(text)) !== null) {
      matches.push({
        index: m.index,
        end: m.index + m[0].length,
        text: m[0],
        groups: m.slice(1).map(function (g) { return g === undefined ? null : g; }),
        named: m.groups ? Object.assign({}, m.groups) : {}
      });
      if (m[0] === "") { re.lastIndex++; }
      if (!all && matches.length === 1) { break; }
      if (matches.length >= limit) { truncated = true; break; }
    }
    return { matches: matches, truncated: truncated, error: null };
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* HTML with <mark> around every non-empty match; alternate classes for neighbours. */
  function highlight(text, matches) {
    var out = "", pos = 0, alt = false;
    matches.forEach(function (m) {
      if (m.end <= m.index) { return; }
      out += escapeHtml(text.slice(pos, m.index));
      out += '<mark class="mark' + (alt ? " alt" : "") + '">' + escapeHtml(text.slice(m.index, m.end)) + "</mark>";
      pos = m.end;
      alt = !alt;
    });
    return out + escapeHtml(text.slice(pos));
  }

  function replacePreview(pattern, flags, text, replacement) {
    try {
      var f = String(flags || "").replace(/[^dgimsuyv]/g, "");
      return { output: text.replace(new RegExp(pattern, f), replacement), error: null };
    } catch (e) {
      return { output: "", error: e.message };
    }
  }

  /* ---------------------------- explanation ---------------------------- */

  var D = {
    en: {
      start: "Start of the text (or of a line with the m flag)",
      end: "End of the text (or of a line with the m flag)",
      wordb: "Word boundary", nwordb: "Not a word boundary",
      any: "Any character except a line break (any character with the s flag)",
      digit: "A digit (0-9)", ndigit: "Anything but a digit",
      word: "A letter, digit or underscore", nword: "Anything but a letter, digit or underscore",
      space: "A whitespace character", nspace: "Anything but whitespace",
      nl: "A line break", tab: "A tab", cr: "A carriage return",
      lit: function (c) { return "The character " + c; },
      esc: function (c) { return "The literal character " + c; },
      unicode: function (h) { return "The character with code " + h; },
      cls: function (b) { return "Any one of: " + b; },
      ncls: function (b) { return "Any one character except: " + b; },
      group: "Capturing group", ncgroup: "Non-capturing group",
      named: function (n) { return "Capturing group named " + n; },
      ahead: "Positive lookahead (must be followed by)", nahead: "Negative lookahead (must not be followed by)",
      behind: "Positive lookbehind (must be preceded by)", nbehind: "Negative lookbehind (must not be preceded by)",
      close: "End of group", alt: "Or",
      star: "Zero or more times", plus: "One or more times", opt: "Zero or one time (optional)",
      range: function (a, b) { return b === undefined ? "Exactly " + a + " times" : (b === "" ? a + " or more times" : "Between " + a + " and " + b + " times"); },
      lazy: "as few as possible (lazy)",
      back: function (n) { return "The same text as capturing group " + n; },
      backn: function (n) { return "The same text as the group named " + n; }
    },
    tr: {
      start: "Metnin başı (m bayrağıyla satır başı)",
      end: "Metnin sonu (m bayrağıyla satır sonu)",
      wordb: "Kelime sınırı", nwordb: "Kelime sınırı değil",
      any: "Satır sonu hariç herhangi bir karakter (s bayrağıyla her karakter)",
      digit: "Bir rakam (0-9)", ndigit: "Rakam olmayan herhangi bir karakter",
      word: "Bir harf, rakam veya alt çizgi", nword: "Harf, rakam veya alt çizgi olmayan karakter",
      space: "Bir boşluk karakteri", nspace: "Boşluk olmayan karakter",
      nl: "Satır sonu", tab: "Sekme (tab)", cr: "Satır başı (carriage return)",
      lit: function (c) { return "Şu karakter: " + c; },
      esc: function (c) { return "Düz karakter: " + c; },
      unicode: function (h) { return "Kod numarası " + h + " olan karakter"; },
      cls: function (b) { return "Şunlardan herhangi biri: " + b; },
      ncls: function (b) { return "Şunlar dışında herhangi bir karakter: " + b; },
      group: "Yakalama grubu", ncgroup: "Yakalamayan grup",
      named: function (n) { return n + " adlı yakalama grubu"; },
      ahead: "Olumlu ileri bakış (ardından gelmeli)", nahead: "Olumsuz ileri bakış (ardından gelmemeli)",
      behind: "Olumlu geri bakış (öncesinde olmalı)", nbehind: "Olumsuz geri bakış (öncesinde olmamalı)",
      close: "Grubun sonu", alt: "Veya",
      star: "Sıfır veya daha fazla kez", plus: "Bir veya daha fazla kez", opt: "Sıfır veya bir kez (isteğe bağlı)",
      range: function (a, b) { return b === undefined ? "Tam " + a + " kez" : (b === "" ? a + " veya daha fazla kez" : a + " ile " + b + " kez arası"); },
      lazy: "mümkün olduğunca az (tembel)",
      back: function (n) { return n + ". yakalama grubuyla aynı metin"; },
      backn: function (n) { return n + " adlı grupla aynı metin"; }
    }
  };

  function explain(pattern, lang) {
    var d = D[lang === "tr" ? "tr" : "en"];
    var out = [], i = 0, n = pattern.length;
    function push(tok, desc) { out.push({ token: tok, text: desc }); }
    while (i < n) {
      var c = pattern.charAt(i);
      if (c === "\\") {
        var nx = pattern.charAt(i + 1);
        var two = "\\" + nx;
        var map = { d: d.digit, D: d.ndigit, w: d.word, W: d.nword, s: d.space, S: d.nspace, b: d.wordb, B: d.nwordb, n: d.nl, t: d.tab, r: d.cr };
        if (map[nx]) { push(two, map[nx]); i += 2; continue; }
        if (nx === "u" && /^[0-9a-fA-F]{4}/.test(pattern.slice(i + 2))) { push(pattern.slice(i, i + 6), d.unicode("U+" + pattern.slice(i + 2, i + 6).toUpperCase())); i += 6; continue; }
        if (nx === "x" && /^[0-9a-fA-F]{2}/.test(pattern.slice(i + 2))) { push(pattern.slice(i, i + 4), d.unicode("U+00" + pattern.slice(i + 2, i + 4).toUpperCase())); i += 4; continue; }
        if (nx === "k" && pattern.charAt(i + 2) === "<") {
          var e = pattern.indexOf(">", i);
          if (e > -1) { push(pattern.slice(i, e + 1), d.backn(pattern.slice(i + 3, e))); i = e + 1; continue; }
        }
        if (/[1-9]/.test(nx)) { push(two, d.back(nx)); i += 2; continue; }
        push(two, d.esc(nx)); i += 2; continue;
      }
      if (c === "[") {
        var j = i + 1, neg = false;
        if (pattern.charAt(j) === "^") { neg = true; j++; }
        var start = j;
        while (j < n && (pattern.charAt(j) !== "]" || j === start)) { if (pattern.charAt(j) === "\\") { j++; } j++; }
        var body = pattern.slice(start, j);
        push(pattern.slice(i, j + 1), neg ? d.ncls(body) : d.cls(body));
        i = j + 1; continue;
      }
      if (c === "(") {
        var rest = pattern.slice(i);
        var g;
        if ((g = /^\(\?<([A-Za-z_$][\w$]*)>/.exec(rest))) { push(g[0], d.named(g[1])); i += g[0].length; continue; }
        if (rest.indexOf("(?:") === 0) { push("(?:", d.ncgroup); i += 3; continue; }
        if (rest.indexOf("(?=") === 0) { push("(?=", d.ahead); i += 3; continue; }
        if (rest.indexOf("(?!") === 0) { push("(?!", d.nahead); i += 3; continue; }
        if (rest.indexOf("(?<=") === 0) { push("(?<=", d.behind); i += 4; continue; }
        if (rest.indexOf("(?<!") === 0) { push("(?<!", d.nbehind); i += 4; continue; }
        push("(", d.group); i++; continue;
      }
      if (c === ")") { push(")", d.close); i++; continue; }
      if (c === "|") { push("|", d.alt); i++; continue; }
      if (c === "^") { push("^", d.start); i++; continue; }
      if (c === "$") { push("$", d.end); i++; continue; }
      if (c === ".") { push(".", d.any); i++; continue; }
      if (c === "*" || c === "+" || c === "?") {
        var q = pattern.charAt(i + 1) === "?" ? "?" : "";
        var base = c === "*" ? d.star : c === "+" ? d.plus : d.opt;
        push(c + q, base + (q ? ", " + d.lazy : ""));
        i += 1 + q.length; continue;
      }
      if (c === "{") {
        var r = /^\{(\d+)(?:,(\d*))?\}/.exec(pattern.slice(i));
        if (r) {
          var lazy = pattern.charAt(i + r[0].length) === "?" ? "?" : "";
          var desc = r[2] === undefined ? d.range(r[1]) : d.range(r[1], r[2]);
          push(r[0] + lazy, desc + (lazy ? ", " + d.lazy : ""));
          i += r[0].length + lazy.length; continue;
        }
      }
      push(c, d.lit(c)); i++;
    }
    return out;
  }

  /* ---------------------------- pattern library ---------------------------- */

  var LIBRARY = [
    { id: "email", en: "Email address", tr: "E-posta adresi", pattern: "[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+", flags: "g", sample: "Write to ayse@example.com or info@sirket.com.tr today." },
    { id: "url", en: "Web address (URL)", tr: "Web adresi (URL)", pattern: "https?:\\/\\/[^\\s/$.?#].[^\\s]*", flags: "gi", sample: "See https://baforge.ai/docs and http://example.com/a?b=1 for details." },
    { id: "trphone", en: "Turkish mobile phone", tr: "Türkiye cep telefonu", pattern: "(?:\\+90|0)?\\s?5\\d{2}\\s?\\d{3}\\s?\\d{2}\\s?\\d{2}", flags: "g", sample: "Call 0532 123 45 67 or +90 505 987 65 43." },
    { id: "date-dmy", en: "Date dd.mm.yyyy", tr: "Tarih gg.aa.yyyy", pattern: "\\b(0[1-9]|[12]\\d|3[01])\\.(0[1-9]|1[0-2])\\.(\\d{4})\\b", flags: "g", sample: "From 01.02.2026 until 31.12.2026." },
    { id: "date-iso", en: "ISO date yyyy-mm-dd", tr: "ISO tarih yyyy-aa-gg", pattern: "\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b", flags: "g", sample: "Created 2026-10-16, updated 2026-11-01." },
    { id: "ipv4", en: "IPv4 address", tr: "IPv4 adresi", pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b", flags: "g", sample: "Servers: 192.168.1.10, 10.0.0.255 and 999.1.1.1." },
    { id: "hex", en: "Hex colour", tr: "Hex renk kodu", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "g", sample: "Use #2563eb, #fff and #12345g." },
    { id: "int", en: "Whole numbers", tr: "Tam sayılar", pattern: "-?\\b\\d+\\b", flags: "g", sample: "Items: 12, -7 and 305." },
    { id: "html-tag", en: "HTML tag", tr: "HTML etiketi", pattern: "<\\/?[a-zA-Z][^>]*>", flags: "g", sample: "<p class=\"a\">Hello <b>world</b></p>" },
    { id: "uuid", en: "UUID", tr: "UUID", pattern: "\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b", flags: "gi", sample: "id=3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90 ok" },
    { id: "spaces", en: "Repeated whitespace", tr: "Tekrarlayan boşluk", pattern: "\\s{2,}", flags: "g", sample: "Too   many    spaces   here." }
  ];

  var api = { findMatches: findMatches, highlight: highlight, replacePreview: replacePreview, explain: explain, LIBRARY: LIBRARY, MAX_MATCHES: MAX_MATCHES };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  if (root) { root.BARegex = api; }
})(typeof window !== "undefined" ? window : null);
