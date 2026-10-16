/*
 * SpecRevise — everything about changing an existing analysis:
 *   compact(model, instruction, budget)   what the AI gets to see (relevant parts first)
 *   validateOps(model, rawOps)            AI answer -> safe operations (invalid ones are returned with a reason)
 *   preview(model, ops)                   before/after text for the review list
 *   applyOps(model, ops)                  new model with the accepted operations applied
 *   diffModels(before, after)             what the analyst changed by hand in Word
 *   bumpVersion / logEntry                version number and change log line
 * The AI never writes to the document directly: it proposes, the analyst accepts each change.
 */
(function (root) {
  "use strict";
  var S = typeof require === "function" && typeof module !== "undefined" && module.exports ? require("./spec-schema.js") : root.SpecSchema;

  var MAX_OPS = 80;
  var TEXT_TARGETS = { "overview.purpose": 2000, "overview.scope": 2000, "overview.outOfScope": 2000, "accounting.summary": 2000, "meta.title": 200 };
  var HIDDEN = { id: 1, status: 1, src: 1 };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function findItem(model, key, id) { return S.items(model, key).filter(function (x) { return x.id === id; })[0]; }
  function editableCols(sec) { return sec.cols.filter(function (c) { return !HIDDEN[c.kind]; }); }
  function sectionLabel(key, lang) {
    var out = key;
    S.LAYOUT.forEach(function (sect) { sect.items.forEach(function (it) { if (it.sec === key) { out = (it.sub || sect.h)[lang === "en" ? 1 : 0]; } if (it.special === "fields" && key === "fields") { out = sect.h[lang === "en" ? 1 : 0]; } }); });
    return out;
  }

  /* ---------- what the AI sees ---------- */

  function line(sec, it) {
    var parts = [];
    editableCols(sec).forEach(function (c) {
      var v = S.cellText(it, c, "en");
      if (v === "" || v == null) { return; }
      parts.push(c.p + "=" + String(v).replace(/\s+/g, " ").slice(0, c.p === "statement" || c.p === "detail" || c.p === "content" ? 420 : 220));
    });
    if (sec.key === "fields" && it.message) { parts.unshift("message=" + it.message); }
    if (sec.key === "flows" && it.steps && it.steps.length) { parts.push("steps=" + it.steps.map(function (s, i) { return (i + 1) + ". " + (s.actor ? s.actor + ": " : "") + s.action; }).join(" | ").slice(0, 500)); }
    if (sec.key === "tables" && it.columns && it.columns.length) { parts.push("columns=" + it.columns.map(function (c) { return c.name + " " + c.type; }).join(", ").slice(0, 500)); }
    return it.id + " | " + parts.join(" | ");
  }

  function tokens(s) { return S.lc(s).split(/[^\p{L}\p{N}.]+/u).filter(function (w) { return w.length >= 4; }); }

  function compact(model, instruction, budget) {
    budget = budget || 70000;
    var ins = S.lc(instruction), insTokens = tokens(instruction), ids = (String(instruction).match(/\b[A-Z]{1,3}-\d{3}\b/g) || []);
    var order = [], rel = {};
    S.SECTIONS.forEach(function (sec) {
      if (sec.key === "changeLog") { return; }
      var list = S.items(model, sec.key).filter(function (x) { return x.status !== "rejected"; });
      if (!list.length) { return; }
      var score = 0;
      list.forEach(function (it) { if (ids.indexOf(it.id) > -1) { score += 5; } });
      var labels = sectionLabel(sec.key, "tr") + " " + sectionLabel(sec.key, "en") + " " + sec.key;
      tokens(labels).forEach(function (w) { if (ins.indexOf(w.slice(0, Math.max(4, w.length - 2))) > -1) { score += 3; } });
      list.forEach(function (it) {
        var hay = S.lc([it.path, it.name, it.code, it.title, it.key, it.term].join(" "));
        insTokens.forEach(function (w) { if (w.length >= 5 && hay.indexOf(w) > -1) { score += 2; } });
      });
      rel[sec.key] = score; order.push({ sec: sec, list: list, score: score });
    });
    order.sort(function (a, b) { return b.score - a.score; });
    var out = "", omitted = [], used = 0;
    ["overview"].forEach(function (k) {
      var o = model[k] || {};
      var l = "[overview] " + Object.keys(o).filter(function (p) { return o[p]; }).map(function (p) { return p + "=" + String(o[p]).slice(0, 400); }).join(" | ") + "\n";
      out += l; used += l.length;
    });
    if (model.accounting && model.accounting.summary) { var al = "[accounting.summary] " + model.accounting.summary.slice(0, 400) + "\n"; out += al; used += al.length; }
    order.forEach(function (o) {
      var head = "\n[" + o.sec.key + "]\n", block = head, cut = 0;
      for (var i = 0; i < o.list.length; i++) {
        var l = line(o.sec, o.list[i]) + "\n";
        if (used + block.length + l.length > budget) { cut = o.list.length - i; break; }
        block += l;
      }
      used += block.length; out += block;
      if (cut) { omitted.push(o.sec.key + ": " + cut + " rows"); }
    });
    return { text: out, omitted: omitted };
  }

  /* ---------- validating what the AI proposes ---------- */

  function why(o) { return S.clip(o && o.why, 300); }

  function validateOps(model, rawOps) {
    var ops = [], invalid = [];
    (Array.isArray(rawOps) ? rawOps : []).slice(0, MAX_OPS).forEach(function (r, i) {
      function bad(reason) { invalid.push({ index: i, reason: reason, raw: r }); }
      if (!r || typeof r !== "object") { return bad("not an object"); }
      var kind = String(r.op || "").toLowerCase();
      if (kind === "settext") {
        var t = String(r.target || ""), max = TEXT_TARGETS[t];
        if (!max) { return bad("unknown target " + t); }
        var val = S.clip(r.value, max);
        if (!val) { return bad("empty value"); }
        var cur = S.getPath(model, t) || "";
        if (cur === val) { return bad("no change"); }
        return ops.push({ op: "setText", target: t, value: val, why: why(r) });
      }
      var sec = S.BY_KEY[String(r.section || "")];
      if (!sec || sec.key === "changeLog") { return bad("unknown section " + r.section); }
      if (kind === "remove") {
        var rm = findItem(model, sec.key, String(r.id || ""));
        if (!rm) { return bad("no such id " + r.id); }
        if (rm.status === "rejected") { return bad("already removed"); }
        return ops.push({ op: "remove", section: sec.key, id: rm.id, why: why(r) });
      }
      if (kind === "update") {
        var it = findItem(model, sec.key, String(r.id || ""));
        if (!it) { return bad("no such id " + r.id); }
        var set = {}, n = 0, src = r.set && typeof r.set === "object" ? r.set : {};
        editableCols(sec).forEach(function (c) {
          if (!(c.p in src)) { return; }
          var v = S.coerceValue(c, src[c.p]);
          if (JSON.stringify(v) !== JSON.stringify(it[c.p])) { set[c.p] = v; n++; }
        });
        if (sec.key === "flows" && Array.isArray(src.steps)) { var st = S.coerceSteps(src.steps); if (JSON.stringify(st) !== JSON.stringify(it.steps || [])) { set.steps = st; n++; } }
        if (sec.key === "tables" && Array.isArray(src.columns)) { var cl = S.coerceColumns(src.columns); if (JSON.stringify(cl) !== JSON.stringify(it.columns || [])) { set.columns = cl; n++; } }
        if (sec.key === "fields" && src.message && !set.message) { set.message = S.clip(src.message, 60); n++; }
        if (!n) { return bad("nothing to change"); }
        return ops.push({ op: "update", section: sec.key, id: it.id, set: set, why: why(r) });
      }
      if (kind === "add") {
        var item = S.coerceItem(sec, r.item);
        if (!item) { return bad("empty item"); }
        delete item.id;
        if (sec.key === "fields") {
          item.message = S.clip(r.item && r.item.message, 60);
          if (!item.message || !item.path) { return bad("field needs message and path"); }
        }
        if (sec.key === "flows") { item.steps = S.coerceSteps(r.item && r.item.steps); }
        if (sec.key === "tables") { item.columns = S.coerceColumns(r.item && r.item.columns); }
        if (sec.src) { item.sources = []; item.check = "none"; }
        if (sec.cols.some(function (c) { return c.kind === "origin"; })) { item.origin = "proposal"; }
        item.status = "pending";
        return ops.push({ op: "add", section: sec.key, item: item, why: why(r) });
      }
      bad("unknown operation " + r.op);
    });
    return { ops: ops, invalid: invalid };
  }

  /* ---------- showing and applying ---------- */

  function show(c, it) { return S.cellText(it, c, "tr"); }

  function preview(model, ops, lang) {
    return ops.map(function (op) {
      var res = { op: op.op, section: op.section || op.target, why: op.why, label: op.section ? sectionLabel(op.section, lang) : op.target };
      if (op.op === "setText") { res.id = op.target; res.changes = [{ p: op.target, from: String(S.getPath(model, op.target) || ""), to: op.value }]; return res; }
      var sec = S.BY_KEY[op.section];
      if (op.op === "add") {
        res.id = ""; res.changes = editableCols(sec).filter(function (c) { return op.item[c.p]; }).map(function (c) { return { p: lang === "en" ? c.en : c.tr, from: "", to: show(c, op.item) }; });
        return res;
      }
      var it = findItem(model, op.section, op.id);
      res.id = op.id;
      if (op.op === "remove") { res.changes = editableCols(sec).filter(function (c) { return it[c.p]; }).slice(0, 4).map(function (c) { return { p: lang === "en" ? c.en : c.tr, from: show(c, it), to: "" }; }); return res; }
      res.changes = Object.keys(op.set).map(function (p) {
        var c = sec.cols.filter(function (x) { return x.p === p; })[0];
        if (!c) { return { p: p, from: p === "steps" ? (it.steps || []).map(function (s) { return s.action; }).join("; ") : (it.columns || []).map(function (x) { return x.name; }).join(", "), to: p === "steps" ? op.set.steps.map(function (s) { return s.action; }).join("; ") : (op.set.columns || []).map(function (x) { return x.name; }).join(", ") }; }
        var cur = {}; cur[p] = op.set[p];
        return { p: lang === "en" ? c.en : c.tr, from: show(c, it), to: show(c, cur) };
      });
      return res;
    });
  }

  function applyOps(model, ops) {
    var m = clone(model);
    ops.forEach(function (op) {
      if (op.op === "setText") { S.setPath(m, op.target, op.value); return; }
      var sec = S.BY_KEY[op.section], list = S.items(m, op.section);
      if (op.op === "add") {
        var item = clone(op.item);
        if (sec.key === "fields") {
          var last = -1; list.forEach(function (x, i) { if (x.message === item.message) { last = i; } });
          list.splice(last + 1 || list.length, 0, item);
        } else { list.push(item); }
        return;
      }
      var it = list.filter(function (x) { return x.id === op.id; })[0];
      if (!it) { return; }
      if (op.op === "remove") { it.status = "rejected"; return; }
      Object.keys(op.set).forEach(function (p) { it[p] = clone(op.set[p]); });
    });
    S.assignIds(m);
    return m;
  }

  /* ---------- manual (Word) changes ---------- */

  function diffModels(before, after, lang) {
    var out = [];
    S.SECTIONS.forEach(function (sec) {
      if (sec.key === "changeLog") { return; }
      var a = S.items(before, sec.key), b = S.items(after, sec.key), amap = {}, bmap = {};
      a.forEach(function (x) { if (x.id) { amap[x.id] = x; } });
      b.forEach(function (x) { if (x.id) { bmap[x.id] = x; } });
      b.forEach(function (x) {
        var o = amap[x.id];
        if (!o) { out.push({ kind: "add", section: sec.key, label: sectionLabel(sec.key, lang), id: x.id, title: titleOf(sec, x) }); return; }
        var ch = [];
        editableCols(sec).concat(sec.cols.filter(function (c) { return c.kind === "status"; })).forEach(function (c) {
          var from = S.cellText(o, c, lang), to = S.cellText(x, c, lang);
          if (from !== to) { ch.push({ p: lang === "en" ? c.en : c.tr, from: from, to: to }); }
        });
        if (sec.key === "flows" && JSON.stringify(o.steps || []) !== JSON.stringify(x.steps || [])) { ch.push({ p: "steps", from: (o.steps || []).length + "", to: (x.steps || []).length + "" }); }
        if (sec.key === "tables" && JSON.stringify(o.columns || []) !== JSON.stringify(x.columns || [])) { ch.push({ p: "columns", from: (o.columns || []).length + "", to: (x.columns || []).length + "" }); }
        if (ch.length) { out.push({ kind: "change", section: sec.key, label: sectionLabel(sec.key, lang), id: x.id, title: titleOf(sec, x), changes: ch }); }
      });
      a.forEach(function (x) { if (x.id && !bmap[x.id] && x.status !== "rejected") { out.push({ kind: "remove", section: sec.key, label: sectionLabel(sec.key, lang), id: x.id, title: titleOf(sec, x) }); } });
    });
    ["overview", "meta"].forEach(function (k) {
      Object.keys(after[k] || {}).forEach(function (p) {
        if (k === "meta" && p === "background") { return; }
        var from = (before[k] || {})[p] || "", to = after[k][p] || "";
        if (from !== to) { out.push({ kind: "change", section: k, label: k, id: k + "." + p, title: k + "." + p, changes: [{ p: p, from: from, to: to }] }); }
      });
    });
    return out;
  }
  function titleOf(sec, it) {
    var c = editableCols(sec)[0];
    var main = it.statement || it.name || it.path || it.code || it.title || it.text || it.step || it.event || it.question || it.item || it.key || it.term || (c ? it[c.p] : "") || "";
    return String(main).replace(/\s+/g, " ").slice(0, 120);
  }

  /* ---------- version and change log ---------- */

  function bumpVersion(v) {
    var m = /^(\d+)\.(\d+)$/.exec(String(v || "").trim());
    return m ? m[1] + "." + (parseInt(m[2], 10) + 1) : "1.0";
  }
  function logEntry(model, summary, author, date) {
    var version = (model.changeLog || []).length ? bumpVersion(model.meta && model.meta.version) : (model.meta && model.meta.version) || "1.0";
    return { id: version, date: date || new Date().toISOString().slice(0, 10), author: S.clip(author || (model.meta && model.meta.author) || "", 120), summary: S.clip(summary, 3000) };
  }

  var api = { compact: compact, validateOps: validateOps, preview: preview, applyOps: applyOps, diffModels: diffModels, bumpVersion: bumpVersion, logEntry: logEntry, sectionLabel: sectionLabel, MAX_OPS: MAX_OPS };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; } else { root.SpecRevise = api; }
})(typeof window !== "undefined" ? window : globalThis);
