const assert = require("assert");
const O = require("../core/openapi.js");
let n = 0;
function t(name, fn) { try { fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }

const spec = {
  title: "Shop API", version: "1.2.0", serverUrl: "https://api.example.com/v1", description: "Orders: list & create",
  endpoints: [
    { method: "get", path: "/orders/{id}", summary: "Get an order", tag: "orders", params: [{ name: "expand", in: "query", type: "boolean" }], responses: [{ code: "200", description: "OK", body: '{"id": 1, "total": 9.5, "note": null}' }, { code: "404", description: "Not found" }] },
    { method: "post", path: "/orders", summary: "Create", tag: "orders", requestBody: '{"sku":"A-1","qty":2}', responses: [{ code: "201", description: "Created", body: '{"id": 5}' }] }
  ]
};

t("builds valid structure", () => {
  const r = O.build(spec);
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.doc.openapi, "3.0.3");
  assert.strictEqual(r.doc.paths["/orders/{id}"].get.parameters[0].in, "path");
  assert.strictEqual(r.doc.paths["/orders/{id}"].get.parameters[0].required, true);
  assert.strictEqual(r.doc.paths["/orders"].post.requestBody.content["application/json"].schema.properties.qty.type, "integer");
  assert.strictEqual(r.doc.paths["/orders"].post.responses["201"].description, "Created");
});
t("null becomes nullable (OpenAPI 3.0)", () => {
  const s = O.build(spec).doc.paths["/orders/{id}"].get.responses["200"].content["application/json"].schema;
  assert.strictEqual(s.properties.note.nullable, true);
  assert.ok(!JSON.stringify(s).includes('"null"'));
  assert.strictEqual(s.$schema, undefined);
});
t("operationIds are unique and stable", () => {
  const r = O.build(spec);
  assert.strictEqual(r.doc.paths["/orders/{id}"].get.operationId, "getOrdersById");
  assert.strictEqual(r.doc.paths["/orders"].post.operationId, "postOrders");
});
t("default success code per method", () => {
  const r = O.build({ endpoints: [{ method: "post", path: "/x" }, { method: "get", path: "/y" }] });
  assert.ok(r.doc.paths["/x"].post.responses["201"]);
  assert.ok(r.doc.paths["/y"].get.responses["200"]);
});
t("validation errors", () => {
  const r = O.build({ endpoints: [
    { method: "get", path: "nope" },
    { method: "get", path: "/a", requestBody: '{"a":1}' },
    { method: "post", path: "/b", requestBody: "{bad" },
    { method: "get", path: "/c", responses: [{ code: "99" }] },
    { method: "get", path: "/d" }, { method: "get", path: "/d" }
  ] });
  const text = r.errors.join("\n");
  assert.ok(text.includes("must start with /"));
  assert.ok(text.includes("should not have a request body"));
  assert.ok(text.includes("not valid JSON"));
  assert.ok(text.includes("invalid status code"));
  assert.ok(text.includes("duplicate"));
});
t("no endpoints reported", () => { assert.ok(O.build({ endpoints: [] }).errors.length); });
t("path params collected", () => { assert.deepStrictEqual(O.pathParams("/a/{x}/b/{y}"), ["x", "y"]); });

/* YAML: tiny reader to prove round trip for the shapes we emit */
function parseYaml(text) {
  const lines = text.split("\n").filter(l => l.trim());
  let i = 0;
  function val(s) {
    if (s === "[]") return []; if (s === "{}") return {};
    if (s === "true") return true; if (s === "false") return false; if (s === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    if (s[0] === '"') return JSON.parse(s);
    return s;
  }
  function block(indent) {
    if (lines[i].trim().startsWith("- ")) {
      const arr = [];
      while (i < lines.length && lines[i].search(/\S/) === indent && lines[i].trim().startsWith("- ")) {
        const rest = lines[i].trim().slice(2);
        if (/^[^"\s][^:]*:( |$)/.test(rest) || /^"[^"]*":( |$)/.test(rest)) {
          lines[i] = " ".repeat(indent + 2) + rest; arr.push(block(indent + 2));
        } else { arr.push(val(rest)); i++; }
      }
      return arr;
    }
    const obj = {};
    while (i < lines.length && lines[i].search(/\S/) === indent) {
      const m = /^\s*("(?:[^"\\]|\\.)*"|[^:]+):(?: (.*))?$/.exec(lines[i]);
      const key = m[1][0] === '"' ? JSON.parse(m[1]) : m[1];
      i++;
      if (m[2] !== undefined && m[2] !== "") obj[key] = val(m[2]);
      else {
        const next = lines[i] ? lines[i].search(/\S/) : -1;
        if (next > indent) obj[key] = block(next);
        else if (next === indent && lines[i].trim().startsWith("- ")) obj[key] = block(next);
        else obj[key] = null;
      }
    }
    return obj;
  }
  return block(0);
}

t("YAML round-trips the generated document", () => {
  const doc = O.build(spec).doc;
  assert.deepStrictEqual(parseYaml(O.toYaml(doc)), JSON.parse(JSON.stringify(doc)));
});
t("YAML quotes tricky strings", () => {
  const y = O.toYaml({ a: "yes", b: "12", c: "x: y", d: "# no", e: "", f: "/orders/{id}", g: "ok" });
  assert.ok(y.includes('a: "yes"') && y.includes('b: "12"') && y.includes('c: "x: y"') && y.includes('d: "# no"') && y.includes('e: ""'));
  assert.ok(y.includes("f: /orders/{id}") && y.includes("g: ok"));
});
t("JSON output parses", () => { JSON.parse(O.toJson(O.build(spec).doc)); });

console.log("openapi: " + n + " checks ALL PASSED");
