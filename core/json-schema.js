/*
 * BASchema — infer a JSON Schema from one or more JSON samples, plus a small
 * validator (used for round-trip checks and the "does my sample pass" test).
 */
(function (root) {
  "use strict";

  var DRAFTS = {
    "2020-12": "https://json-schema.org/draft/2020-12/schema",
    "07": "http://json-schema.org/draft-07/schema#"
  };

  function detectFormat(s) {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.test(s)) { return "date-time"; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { return "date"; }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) { return "email"; }
    if (/^https?:\/\/[^\s]+$/i.test(s)) { return "uri"; }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) { return "uuid"; }
    if (/^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/.test(s)) { return "ipv4"; }
    return null;
  }

  function inferOne(v) {
    if (v === null) { return { t: { null: 1 } }; }
    if (typeof v === "boolean") { return { t: { boolean: 1 } }; }
    if (typeof v === "number") { return { t: Number.isInteger(v) ? { integer: 1 } : { number: 1 } }; }
    if (typeof v === "string") { return { t: { string: 1 }, fmt: detectFormat(v), fmtN: 1 }; }
    if (Array.isArray(v)) {
      var items = null;
      v.forEach(function (x) { items = merge(items, inferOne(x)); });
      return { t: { array: 1 }, items: items };
    }
    var props = {}, seen = {};
    Object.keys(v).forEach(function (k) { props[k] = inferOne(v[k]); seen[k] = 1; });
    return { t: { object: 1 }, props: props, seen: seen, count: 1 };
  }

  function merge(a, b) {
    if (!a) { return b; }
    if (!b) { return a; }
    var t = {};
    Object.keys(a.t).forEach(function (k) { t[k] = 1; });
    Object.keys(b.t).forEach(function (k) { t[k] = 1; });
    if (t.integer && t.number) { delete t.integer; }
    var r = { t: t };
    /* string format only survives if every string sample agreed */
    if (t.string) {
      var aS = a.t.string, bS = b.t.string;
      if (aS && bS) { r.fmt = a.fmt === b.fmt ? a.fmt : null; }
      else { r.fmt = aS ? a.fmt : b.fmt; }
    }
    if (a.items || b.items) { r.items = merge(a.items || null, b.items || null); }
    if (a.props || b.props) {
      r.props = {}; r.seen = {}; r.count = (a.count || 0) + (b.count || 0);
      [a, b].forEach(function (x) {
        if (!x.props) { return; }
        Object.keys(x.props).forEach(function (k) {
          r.props[k] = merge(r.props[k] || null, x.props[k]);
          r.seen[k] = (r.seen[k] || 0) + (x.seen[k] || 0);
        });
      });
    }
    return r;
  }

  function build(node, o) {
    var s = {};
    var types = Object.keys(node.t);
    var order = ["null", "boolean", "integer", "number", "string", "array", "object"];
    types.sort(function (x, y) { return order.indexOf(x) - order.indexOf(y); });
    s.type = types.length === 1 ? types[0] : types;
    if (node.t.string && node.fmt && o.formats) { s.format = node.fmt; }
    if (node.t.array && node.items) { s.items = build(node.items, o); }
    if (node.t.object && node.props) {
      s.properties = {};
      Object.keys(node.props).forEach(function (k) { s.properties[k] = build(node.props[k], o); });
      var req = Object.keys(node.props).filter(function (k) {
        if (o.required === "all") { return true; }
        if (o.required === "none") { return false; }
        return node.seen[k] === node.count;
      });
      if (req.length) { s.required = req; }
      if (o.additionalProperties === false) { s.additionalProperties = false; }
    }
    return s;
  }

  function infer(samples, opts) {
    opts = opts || {};
    var o = {
      draft: DRAFTS[opts.draft] ? opts.draft : "2020-12",
      required: opts.required || "common",
      additionalProperties: opts.additionalProperties,
      formats: opts.formats !== false,
      title: opts.title || ""
    };
    if (!Array.isArray(samples)) { samples = [samples]; }
    if (!samples.length) { throw new Error("No samples"); }
    var node = null;
    samples.forEach(function (s) { node = merge(node, inferOne(s)); });
    var body = build(node, o);
    var out = { $schema: DRAFTS[o.draft] };
    if (o.title) { out.title = o.title; }
    Object.keys(body).forEach(function (k) { out[k] = body[k]; });
    return out;
  }

  /* ------------------------------ validator ------------------------------ */

  function typeOf(v) {
    if (v === null) { return "null"; }
    if (Array.isArray(v)) { return "array"; }
    if (typeof v === "number") { return Number.isInteger(v) ? "integer" : "number"; }
    return typeof v;
  }

  function validate(schema, data, path, errs) {
    path = path || "$"; errs = errs || [];
    var types = schema.type === undefined ? null : [].concat(schema.type);
    if (types) {
      var t = typeOf(data);
      var ok = types.indexOf(t) !== -1 || (t === "integer" && types.indexOf("number") !== -1);
      if (!ok) { errs.push(path + ": expected " + types.join("|") + ", got " + t); return errs; }
    }
    if (schema.enum && schema.enum.map(function (x) { return JSON.stringify(x); }).indexOf(JSON.stringify(data)) === -1) {
      errs.push(path + ": not in enum");
    }
    if (schema.format && typeof data === "string" && detectFormat(data) !== schema.format) {
      errs.push(path + ": does not look like " + schema.format);
    }
    if (Array.isArray(data) && schema.items) {
      data.forEach(function (x, i) { validate(schema.items, x, path + "[" + i + "]", errs); });
    }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      var props = schema.properties || {};
      (schema.required || []).forEach(function (k) {
        if (!Object.prototype.hasOwnProperty.call(data, k)) { errs.push(path + ": missing required '" + k + "'"); }
      });
      Object.keys(data).forEach(function (k) {
        if (props[k]) { validate(props[k], data[k], path + "." + k, errs); }
        else if (schema.additionalProperties === false) { errs.push(path + ": unexpected property '" + k + "'"); }
      });
    }
    return errs;
  }

  /* Parse one JSON document, or fall back to one document per non-empty line. */
  function parseSamples(text) {
    try { return { samples: [JSON.parse(text)], multi: false }; }
    catch (e1) {
      var lines = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
      if (lines.length > 1) {
        try { return { samples: lines.map(function (l) { return JSON.parse(l); }), multi: true }; } catch (e2) { /* fall through */ }
      }
      throw e1;
    }
  }

  var api = { infer: infer, validate: function (s, d) { return validate(s, d); }, parseSamples: parseSamples, detectFormat: detectFormat, DRAFTS: DRAFTS };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  if (root) { root.BASchema = api; }
})(typeof window !== "undefined" ? window : null);
