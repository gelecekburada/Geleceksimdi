/*
 * SpecModel — the logic behind the functional-analysis screen (spec-analyzer.html).
 * Pure functions, no DOM: runs in the browser and in Node (tests).
 *
 * Flow:  PDF pages -> chunks -> (AI, per chunk) findings -> merge/dedupe -> quote check
 *        -> compact summary -> (AI) proposals for things the PDF does not say.
 *
 * Everything that comes from the AI is untrusted: normalize() coerces it into a known
 * shape, and every finding that carries a verbatim quote is checked against the real
 * PDF text so the analyst can see which findings are really in the document.
 */
(function (root) {
  "use strict";

  var CATEGORIES = ["validation", "format", "business", "timing", "limit", "security", "error-handling", "reconciliation", "other"];

  /* ---------- text helpers ---------- */

  function squish(s) {
    return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  }
  function str(v, max) {
    var s = squish(v);
    return max && s.length > max ? s.slice(0, max) : s;
  }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function pageNo(v) {
    var n = parseInt(v, 10);
    return isFinite(n) && n > 0 && n < 100000 ? n : null;
  }
  /* Case folding that treats I, İ, ı and i as the same letter (Turkish and English text mix in specs). */
  function fold(s) { return String(s == null ? "" : s).replace(/[İIı]/g, "i").toLowerCase().replace(/\u0307/g, ""); }
  function key(s) { return fold(squish(s)).replace(/[^\p{L}\p{N}]+/gu, ""); }

  /*
   * PDF text items -> readable lines. Items on the same baseline form one line;
   * a wide horizontal gap becomes " | " so table columns stay apart.
   * item: { str, x, y, w }
   */
  function pageTextFromItems(items) {
    var rows = [];
    arr(items).forEach(function (it) {
      if (!it || typeof it.str !== "string" || !it.str.trim()) { return; }
      var row = null;
      for (var i = rows.length - 1; i >= 0 && i >= rows.length - 6; i--) {
        if (Math.abs(rows[i].y - it.y) <= 2.5) { row = rows[i]; break; }
      }
      if (!row) { row = { y: it.y, items: [] }; rows.push(row); }
      row.items.push(it);
    });
    rows.sort(function (a, b) { return b.y - a.y; });
    return rows.map(function (r) {
      r.items.sort(function (a, b) { return a.x - b.x; });
      var out = "", end = null;
      r.items.forEach(function (it) {
        if (end !== null) {
          var gap = it.x - end;
          if (gap > 14) { out += " | "; } else if (gap > 1.2 && !/\s$/.test(out)) { out += " "; }
        }
        out += it.str;
        end = it.x + (it.w || 0);
      });
      return out.replace(/[ \t]+/g, " ").trim();
    }).filter(Boolean).join("\n");
  }

  /* ---------- chunking ---------- */

  function pageBlock(n, text, part) {
    return "[[Sayfa " + n + (part ? " (devam " + part + ")" : "") + "]]\n" + text + "\n";
  }

  function splitLong(text, max) {
    var lines = String(text).split("\n"), parts = [], cur = "";
    lines.forEach(function (ln) {
      while (ln.length > max) {
        if (cur) { parts.push(cur); cur = ""; }
        parts.push(ln.slice(0, max)); ln = ln.slice(max);
      }
      if (cur.length + ln.length + 1 > max && cur) { parts.push(cur); cur = ""; }
      cur += (cur ? "\n" : "") + ln;
    });
    if (cur) { parts.push(cur); }
    return parts;
  }

  /*
   * pages: [{n, text}] in order. Returns chunks:
   * { id, from, to, pages:[{n,text}], text, context }  (context = tail of the previous chunk)
   */
  function buildChunks(pages, opts) {
    opts = opts || {};
    var max = opts.maxChars || 22000, overlap = opts.overlap == null ? 1200 : opts.overlap;
    var units = []; // {n, text, part}
    arr(pages).forEach(function (p) {
      var t = String(p.text || "");
      if (!t.trim()) { return; }
      if (t.length > max * 1.5) {
        splitLong(t, max).forEach(function (part, i) { units.push({ n: p.n, text: part, part: i ? i + 1 : 0 }); });
      } else { units.push({ n: p.n, text: t, part: 0 }); }
    });
    var chunks = [], cur = null;
    function flush() { if (cur) { chunks.push(cur); cur = null; } }
    units.forEach(function (u) {
      var block = pageBlock(u.n, u.text, u.part);
      if (cur && cur.text.length + block.length > max) { flush(); }
      if (!cur) { cur = { pages: [], text: "", from: u.n, to: u.n }; }
      cur.pages.push({ n: u.n, text: u.text, part: u.part });
      cur.text += block; cur.to = u.n;
    });
    flush();
    chunks.forEach(function (c, i) {
      c.id = i + 1;
      c.context = i && overlap ? chunks[i - 1].text.slice(-overlap) : "";
    });
    return chunks;
  }

  /* Used when a chunk fails: cut it in two and retry the halves. null = cannot split further. */
  function splitChunk(chunk) {
    var pg = chunk.pages || [];
    var a, b;
    if (pg.length > 1) {
      var mid = Math.ceil(pg.length / 2);
      a = pg.slice(0, mid); b = pg.slice(mid);
    } else if (pg.length === 1 && pg[0].text.length > 3000) {
      var t = pg[0].text, cut = t.indexOf("\n", Math.floor(t.length / 2));
      if (cut < 0) { cut = Math.floor(t.length / 2); }
      a = [{ n: pg[0].n, text: t.slice(0, cut), part: pg[0].part || 0 }];
      b = [{ n: pg[0].n, text: t.slice(cut), part: (pg[0].part || 1) + 1 }];
    } else { return null; }
    function mk(list, ctx) {
      var text = list.map(function (p) { return pageBlock(p.n, p.text, p.part); }).join("");
      return { id: chunk.id, pages: list, text: text, from: list[0].n, to: list[list.length - 1].n, context: ctx };
    }
    var first = mk(a, chunk.context || "");
    var second = mk(b, first.text.slice(-1200));
    return [first, second];
  }

  /* ---------- normalizing AI output ---------- */

  function presence(v) {
    var s = squish(v).toLocaleLowerCase("tr");
    if (!s) { return ""; }
    if (/^(m\b|zorunlu|mandatory|required|1\.\.)/.test(s)) { return "M"; }
    if (/^(c\b|ko[sş]ullu|conditional)/.test(s)) { return "C"; }
    if (/^(o\b|opsiyonel|isteğe|istege|optional|0\.\.)/.test(s)) { return "O"; }
    return str(v, 20);
  }

  function category(v) {
    var s = squish(v).toLowerCase();
    return CATEGORIES.indexOf(s) > -1 ? s : "other";
  }

  function withSource(o, doc, raw) {
    o.sources = [{ doc: doc, page: pageNo(raw.page), quote: str(raw.quote, 400) }];
    return o;
  }

  function normalizeFindings(raw, doc) {
    raw = raw && typeof raw === "object" ? raw : {};
    doc = doc === 2 ? 2 : 1;
    var out = { info: {}, messages: [], fields: [], rules: [], constraints: [], errors: [], flows: [], glossary: [], ambiguities: [] };
    var di = raw.documentInfo && typeof raw.documentInfo === "object" ? raw.documentInfo : {};
    ["title", "version", "date", "publisher", "purpose"].forEach(function (k) { if (di[k]) { out.info[k] = str(di[k], 400); } });

    arr(raw.messages).forEach(function (m) {
      if (!m || (!squish(m.code) && !squish(m.name))) { return; }
      out.messages.push(withSource({
        code: str(m.code, 60), name: str(m.name, 200), direction: str(m.direction, 120),
        purpose: str(m.purpose, 800), trigger: str(m.trigger, 600)
      }, doc, m));
    });
    arr(raw.fields).forEach(function (f) {
      if (!f || (!squish(f.path) && !squish(f.name))) { return; }
      out.fields.push(withSource({
        message: str(f.message, 60), path: str(f.path, 300), name: str(f.name, 200), type: str(f.type, 80),
        length: str(f.length, 60), occurrence: str(f.occurrence, 40), presence: presence(f.presence),
        format: str(f.format, 300), allowed: str(Array.isArray(f.allowedValues) ? f.allowedValues.join(", ") : f.allowedValues, 600),
        description: str(f.description, 800), rules: str(Array.isArray(f.rules) ? f.rules.join(" ") : f.rules, 800)
      }, doc, f));
    });
    arr(raw.rules).forEach(function (r) {
      if (!r || !squish(r.statement)) { return; }
      out.rules.push(withSource({
        category: category(r.category), title: str(r.title, 200), statement: str(r.statement, 1200),
        condition: str(r.condition, 600), action: str(r.action, 600), errorCode: str(r.errorCode, 60), appliesTo: str(r.appliesTo, 200)
      }, doc, r));
    });
    arr(raw.constraints).forEach(function (c) {
      if (!c || !squish(c.statement)) { return; }
      out.constraints.push(withSource({ kind: str(c.kind, 80), statement: str(c.statement, 1000), value: str(c.value, 200) }, doc, c));
    });
    arr(raw.errors).forEach(function (e) {
      if (!e || (!squish(e.code) && !squish(e.description))) { return; }
      out.errors.push(withSource({ code: str(e.code, 60), description: str(e.description, 600), cause: str(e.cause, 600), handling: str(e.handling, 600) }, doc, e));
    });
    arr(raw.flows).forEach(function (fl) {
      if (!fl || !squish(fl.name)) { return; }
      var steps = arr(fl.steps).map(function (s) {
        if (typeof s === "string") { return { actor: "", action: str(s, 400), message: "" }; }
        return s && typeof s === "object" ? { actor: str(s.actor, 120), action: str(s.action, 400), message: str(s.message, 80) } : null;
      }).filter(function (s) { return s && s.action; });
      out.flows.push(withSource({ name: str(fl.name, 200), steps: steps }, doc, fl));
    });
    arr(raw.glossary).forEach(function (g) {
      if (!g || !squish(g.term)) { return; }
      out.glossary.push(withSource({ term: str(g.term, 120), definition: str(g.definition, 600) }, doc, g));
    });
    arr(raw.ambiguities).forEach(function (a) {
      var t = typeof a === "string" ? a : a && a.text;
      if (!squish(t)) { return; }
      out.ambiguities.push(withSource({ text: str(t, 800) }, doc, a && typeof a === "object" ? a : {}));
    });
    return out;
  }

  /* ---------- merging ---------- */

  var KEYERS = {
    messages: function (m) { return key(m.code || m.name); },
    fields: function (f) { return key(f.message) + "|" + key(f.path || f.name); },
    rules: function (r) { return key(r.statement).slice(0, 140); },
    constraints: function (c) { return key(c.statement).slice(0, 140); },
    errors: function (e) { return key(e.code) ? key(e.code) : key(e.description).slice(0, 100); },
    flows: function (f) { return key(f.name); },
    glossary: function (g) { return key(g.term); },
    ambiguities: function (a) { return key(a.text).slice(0, 120); }
  };
  var PREFIX = { messages: "MSG", fields: "F", rules: "R", constraints: "C", errors: "E", flows: "FL", glossary: "G", ambiguities: "Q" };

  function fillBlanks(into, from) {
    Object.keys(from).forEach(function (k) {
      if (k === "sources" || k === "id" || k === "status") { return; }
      if ((into[k] === "" || into[k] == null || (Array.isArray(into[k]) && !into[k].length)) && from[k]) { into[k] = from[k]; }
    });
  }

  function pad(n) { return (n < 10 ? "00" : n < 100 ? "0" : "") + n; }

  function merge(list) {
    var out = { info: {}, messages: [], fields: [], rules: [], constraints: [], errors: [], flows: [], glossary: [], ambiguities: [] };
    var seen = {};
    Object.keys(KEYERS).forEach(function (k) { seen[k] = {}; });
    arr(list).forEach(function (f) {
      if (!f) { return; }
      Object.keys(f.info || {}).forEach(function (k) { if (!out.info[k]) { out.info[k] = f.info[k]; } });
      Object.keys(KEYERS).forEach(function (k) {
        arr(f[k]).forEach(function (item) {
          var kk = KEYERS[k](item);
          if (!kk || kk === "|") { return; }
          var hit = seen[k][kk];
          if (hit) {
            fillBlanks(hit, item);
            item.sources.forEach(function (s) {
              if (hit.sources.length < 4 && !hit.sources.some(function (x) { return x.doc === s.doc && x.page === s.page; })) { hit.sources.push(s); }
            });
          } else {
            seen[k][kk] = item; out[k].push(item);
          }
        });
      });
    });
    Object.keys(PREFIX).forEach(function (k) {
      out[k].forEach(function (it, i) { it.id = PREFIX[k] + "-" + pad(i + 1); it.status = it.status || "pending"; });
    });
    return out;
  }

  /* ---------- quote verification ---------- */

  function squash(s) {
    return fold(String(s == null ? "" : s).replace(/-\s*\n\s*/g, ""))
      .replace(/[\s |"'`´‘’“”«»]+/g, "");
  }

  /* pages: { "5": "page text", ... } for one document. Returns { state, page? } */
  function verifyQuote(quote, page, pages) {
    var q = squash(quote);
    if (q.length < 8) { return { state: "none" }; }
    if (page && pages[page] != null && squash(pages[page]).indexOf(q) > -1) { return { state: "ok", page: page }; }
    var ks = Object.keys(pages);
    for (var i = 0; i < ks.length; i++) {
      if (squash(pages[ks[i]]).indexOf(q) > -1) { return { state: "other", page: parseInt(ks[i], 10) }; }
    }
    return { state: "missing" };
  }

  /* docPages: { 1: {"1": text, ...}, 2: {...} }. Sets item.check = ok | other | missing | none (best over its sources). */
  function annotate(merged, docPages) {
    var rank = { ok: 3, other: 2, missing: 1, none: 0 };
    Object.keys(PREFIX).forEach(function (k) {
      merged[k].forEach(function (it) {
        var best = { state: "none" };
        it.sources.forEach(function (s) {
          var r = verifyQuote(s.quote, s.page, docPages[s.doc] || {});
          if (rank[r.state] > rank[best.state]) { best = r; }
        });
        it.check = best.state;
        if (best.state === "other") { it.checkPage = best.page; }
      });
    });
    return merged;
  }

  function stats(merged) {
    var o = {};
    Object.keys(PREFIX).forEach(function (k) { o[k] = merged[k].length; });
    var bad = 0, all = 0;
    Object.keys(PREFIX).forEach(function (k) {
      merged[k].forEach(function (it) { if (it.check === "missing") { bad++; } if (it.check) { all++; } });
    });
    o.unverified = bad;
    return o;
  }

  /* ---------- summary sent to the second AI pass ---------- */

  function compactForSynthesis(m, budget) {
    budget = budget || 60000;
    var parts = [], used = 0, omitted = [];
    function add(title, lines) {
      var block = "## " + title + "\n", n = 0;
      for (var i = 0; i < lines.length; i++) {
        if (used + block.length + lines[i].length + 1 > budget) { omitted.push(title + ": " + (lines.length - i) + " satır"); break; }
        block += lines[i] + "\n"; n++;
      }
      used += block.length; parts.push(block);
    }
    add("MESAJLAR", m.messages.map(function (x) { return x.id + " " + x.code + " " + x.name + " | " + x.direction + " | " + x.purpose; }));
    add("KURALLAR", m.rules.map(function (x) { return x.id + " [" + x.category + "] " + (x.title ? x.title + ": " : "") + x.statement.slice(0, 260) + (x.errorCode ? " (hata " + x.errorCode + ")" : ""); }));
    add("KISITLAR", m.constraints.map(function (x) { return x.id + " " + x.kind + ": " + x.statement.slice(0, 220); }));
    add("HATA KODLARI", m.errors.map(function (x) { return x.id + " " + x.code + " " + x.description.slice(0, 160); }));
    add("AKIŞLAR", m.flows.map(function (x) { return x.id + " " + x.name + ": " + x.steps.map(function (s) { return s.actor ? s.actor + ": " + s.action : s.action; }).join(" -> ").slice(0, 400); }));
    add("ALANLAR", m.fields.map(function (x) { return x.id + " " + x.message + " " + (x.path || x.name) + " " + x.type + " " + x.presence + (x.allowed ? " {" + x.allowed.slice(0, 80) + "}" : ""); }));
    add("BELİRSİZLİKLER", m.ambiguities.map(function (x) { return x.id + " " + x.text.slice(0, 200); }));
    return { text: parts.join("\n"), omitted: omitted };
  }

  /* Business sections as short lines: context for the technical-design pass. */
  function compactBusiness(m, budget) {
    budget = budget || 20000;
    var out = "", used = 0;
    function add(title, list, fn) {
      if (!list || !list.length) { return; }
      var block = "## " + title + "\n";
      for (var i = 0; i < list.length; i++) {
        if (list[i].status === "rejected") { continue; }
        var l = fn(list[i]).slice(0, 320) + "\n";
        if (used + block.length + l.length > budget) { break; }
        block += l;
      }
      used += block.length; out += block;
    }
    var a = m.accounting || {};
    if (a.summary) { out += "## MUHASEBE ÖZETİ\n" + a.summary.slice(0, 600) + "\n"; used += out.length; }
    add("MUHASEBE KAYITLARI", a.entries, function (x) { return x.id + " " + x.event + ": borç " + x.debit + " / alacak " + x.credit + " / tutar " + x.amount + " / " + x.timing; });
    add("DEKONT", a.receipt, function (x) { return x.id + " " + x.item + ": " + x.detail; });
    add("İADE", a.returns, function (x) { return x.id + " " + x.item + ": " + x.detail; });
    add("MUTABAKAT", a.reconciliation, function (x) { return x.id + " " + x.item + ": " + x.detail; });
    add("ONAY", m.approvals, function (x) { return x.id + " " + x.step + ": " + x.rule + " (" + x.who + ")"; });
    add("EKRANLAR", m.screens, function (x) { return x.id + " " + x.name + ": " + x.purpose + " | alanlar: " + x.fields; });
    add("BİLDİRİM", m.notifications, function (x) { return x.id + " " + x.event + " -> " + x.to; });
    add("YETKİ", m.authorization, function (x) { return x.id + " " + x.role + " / " + x.screen + ": " + x.rights; });
    return out;
  }

  var api = {
    CATEGORIES: CATEGORIES, squish: squish, pageTextFromItems: pageTextFromItems, buildChunks: buildChunks, splitChunk: splitChunk,
    normalizeFindings: normalizeFindings, merge: merge, verifyQuote: verifyQuote, annotate: annotate, stats: stats,
    compactForSynthesis: compactForSynthesis, compactBusiness: compactBusiness
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; } else { root.SpecModel = api; }
})(typeof window !== "undefined" ? window : globalThis);
