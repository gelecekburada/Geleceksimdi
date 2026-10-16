/*
 * BAOpenApi — build an OpenAPI 3.0.3 document from a simple endpoint list,
 * serialise it to YAML/JSON, and run a few sanity checks.
 * Body schemas are inferred from JSON samples via BASchema (core/json-schema.js).
 */
(function (root) {
  "use strict";

  var SchemaLib = (typeof require === "function" && typeof module !== "undefined") ? require("./json-schema.js") : root.BASchema;
  var METHODS = ["get", "post", "put", "patch", "delete"];

  function bodySchema(sample) {
    var parsed = JSON.parse(sample);
    var s = SchemaLib.infer([parsed], { required: "all", formats: true });
    delete s.$schema;
    return toOas30(s);
  }

  /* JSON Schema -> OpenAPI 3.0 schema: no "null" type, use nullable instead. */
  function toOas30(s) {
    var o = {};
    Object.keys(s).forEach(function (k) {
      if (k === "type" && Array.isArray(s.type)) {
        var types = s.type.filter(function (t) { return t !== "null"; });
        if (types.length < s.type.length) { o.nullable = true; }
        if (types.length === 1) { o.type = types[0]; }
        else if (types.length > 1) { o.oneOf = types.map(function (t) { return { type: t }; }); }
      } else if (k === "type" && s.type === "null") {
        o.nullable = true; o.type = "string";
      } else if (k === "properties") {
        o.properties = {};
        Object.keys(s.properties).forEach(function (p) { o.properties[p] = toOas30(s.properties[p]); });
      } else if (k === "items") {
        o.items = toOas30(s.items);
      } else { o[k] = s[k]; }
    });
    return o;
  }

  function pathParams(path) {
    var out = [], re = /\{([^}]+)\}/g, m;
    while ((m = re.exec(path)) !== null) { out.push(m[1]); }
    return out;
  }

  function build(spec) {
    var errors = [];
    var doc = {
      openapi: "3.0.3",
      info: { title: spec.title || "My API", version: spec.version || "1.0.0" },
      paths: {}
    };
    if (spec.description) { doc.info.description = spec.description; }
    if (spec.serverUrl) { doc.servers = [{ url: spec.serverUrl }]; }
    var ids = {};

    (spec.endpoints || []).forEach(function (e, idx) {
      var label = "#" + (idx + 1) + " " + (e.method || "").toUpperCase() + " " + (e.path || "");
      var method = String(e.method || "").toLowerCase();
      if (METHODS.indexOf(method) === -1) { errors.push(label + ": unknown method"); return; }
      if (!e.path || e.path.charAt(0) !== "/") { errors.push(label + ": path must start with /"); return; }
      var op = {};
      if (e.tag) { op.tags = [e.tag]; }
      if (e.summary) { op.summary = e.summary; }
      var opId = e.operationId || (method + e.path.replace(/\{([^}]+)\}/g, "By_$1").replace(/[^A-Za-z0-9]+(.)?/g, function (_, c) { return c ? c.toUpperCase() : ""; }));
      if (ids[opId]) { errors.push(label + ": duplicate operationId " + opId); }
      ids[opId] = 1;
      op.operationId = opId;

      var params = [];
      pathParams(e.path).forEach(function (n) {
        var given = (e.params || []).filter(function (p) { return p.name === n && p.in === "path"; })[0];
        params.push({ name: n, in: "path", required: true, schema: { type: given && given.type || "string" } });
      });
      (e.params || []).forEach(function (p) {
        if (!p.name || p.in === "path") { return; }
        var x = { name: p.name, in: p.in === "header" ? "header" : "query", schema: { type: p.type || "string" } };
        if (p.required) { x.required = true; }
        params.push(x);
      });
      if (params.length) { op.parameters = params; }

      if (e.requestBody && e.requestBody.trim()) {
        if (method === "get" || method === "delete") { errors.push(label + ": " + method.toUpperCase() + " should not have a request body"); }
        try {
          op.requestBody = { required: true, content: { "application/json": { schema: bodySchema(e.requestBody) } } };
        } catch (er) { errors.push(label + ": request body is not valid JSON"); }
      }

      op.responses = {};
      var rs = (e.responses && e.responses.length) ? e.responses : [{ code: method === "post" ? "201" : "200", description: "Success" }];
      rs.forEach(function (r) {
        var code = String(r.code || "200");
        if (!/^[1-5]\d\d$|^default$/.test(code)) { errors.push(label + ": invalid status code " + code); return; }
        var resp = { description: r.description || "Response" };
        if (r.body && r.body.trim()) {
          try { resp.content = { "application/json": { schema: bodySchema(r.body) } }; }
          catch (er2) { errors.push(label + ": response " + code + " body is not valid JSON"); }
        }
        op.responses[code] = resp;
      });

      doc.paths[e.path] = doc.paths[e.path] || {};
      if (doc.paths[e.path][method]) { errors.push(label + ": duplicate endpoint"); }
      doc.paths[e.path][method] = op;
    });

    if (!Object.keys(doc.paths).length) { errors.push("No valid endpoints yet"); }
    return { doc: doc, errors: errors };
  }

  /* ------------------------------ YAML ------------------------------ */

  function scalar(v) {
    if (v === null) { return "null"; }
    if (typeof v === "number" || typeof v === "boolean") { return String(v); }
    var s = String(v);
    if (s === "" || /^[\s]|[\s]$/.test(s) || /^(true|false|null|yes|no|on|off|~)$/i.test(s) || /^[-+]?[\d.]+(e[-+]?\d+)?$/i.test(s) ||
        /^[-?:,\[\]{}#&*!|>'"%@`]/.test(s) || /: |\s#|\n/.test(s) || /:$/.test(s)) {
      return JSON.stringify(s);
    }
    return s;
  }

  function toYaml(v, indent) {
    indent = indent || 0;
    var pad = new Array(indent + 1).join(" ");
    if (Array.isArray(v)) {
      if (!v.length) { return "[]"; }
      return v.map(function (x) {
        if (x && typeof x === "object") {
          var inner = toYaml(x, indent + 2).replace(/^\s+/, "");
          return pad + "- " + inner;
        }
        return pad + "- " + scalar(x);
      }).join("\n");
    }
    if (v && typeof v === "object") {
      var keys = Object.keys(v);
      if (!keys.length) { return "{}"; }
      return keys.map(function (k) {
        var val = v[k], key = scalar(k);
        if (val && typeof val === "object" && (Array.isArray(val) ? val.length : Object.keys(val).length)) {
          return pad + key + ":\n" + toYaml(val, Array.isArray(val) ? indent + 2 : indent + 2);
        }
        return pad + key + ": " + (val && typeof val === "object" ? toYaml(val, 0) : scalar(val));
      }).join("\n");
    }
    return pad + scalar(v);
  }

  var api = { build: build, toYaml: function (o) { return toYaml(o, 0) + "\n"; }, toJson: function (o) { return JSON.stringify(o, null, 2); }, METHODS: METHODS, pathParams: pathParams };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  if (root) { root.BAOpenApi = api; }
})(typeof window !== "undefined" ? window : null);
