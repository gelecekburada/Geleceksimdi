const assert = require("assert");
const M = require("../core/mock-data.js");
let n = 0;
function t(name, fn) { try { fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }

const fields = M.PRESETS.customers;

t("same seed gives same rows, different seed differs", () => {
  const a = M.generate(fields, 20, { seed: 7 }), b = M.generate(fields, 20, { seed: 7 }), c = M.generate(fields, 20, { seed: 8 });
  assert.deepStrictEqual(a, b);
  assert.notDeepStrictEqual(a, c);
});
t("count honoured and capped", () => {
  assert.strictEqual(M.generate(fields, 5, {}).length, 5);
  assert.strictEqual(M.generate(fields, 999999, {}).length, 10000);
  assert.strictEqual(M.generate(fields, 0, {}).length, 0);
});
t("sequence starts where told", () => {
  const r = M.generate([{ name: "id", type: "sequence", start: 100 }], 3, {});
  assert.deepStrictEqual(r.map(x => x.id), [100, 101, 102]);
});
t("every type produces a value", () => {
  M.TYPES.forEach(ty => {
    const r = M.generate([{ name: "v", type: ty, options: "a,b" }], 3, { seed: 1 });
    r.forEach(x => assert.ok(x.v !== null && x.v !== undefined && x.v !== "", ty));
  });
});
t("int/float/date ranges respected", () => {
  M.generate([{ name: "v", type: "int", min: 5, max: 7 }], 200, {}).forEach(x => assert.ok(x.v >= 5 && x.v <= 7));
  M.generate([{ name: "v", type: "float", min: 1, max: 2 }], 200, {}).forEach(x => assert.ok(x.v >= 1 && x.v <= 2));
  M.generate([{ name: "v", type: "date", min: "2026-01-01", max: "2026-01-31" }], 200, {}).forEach(x => assert.ok(x.v >= "2026-01-01" && x.v <= "2026-01-31"));
});
t("enum only picks listed options", () => {
  M.generate([{ name: "s", type: "enum", options: "x, y ,z" }], 50, {}).forEach(x => assert.ok(["x", "y", "z"].includes(x.s)));
});
t("emails are ascii and example.com only", () => {
  M.generate([{ name: "e", type: "email" }], 100, { locale: "tr" }).forEach(x => assert.ok(/^[a-z0-9.]+@example\.com$/.test(x.e), x.e));
});
t("uuid shape", () => {
  M.generate([{ name: "u", type: "uuid" }], 20, {}).forEach(x => assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(x.u), x.u));
});
t("turkish locale uses turkish names", () => {
  const names = M.generate([{ name: "n", type: "firstName" }], 100, { locale: "tr" }).map(x => x.n);
  assert.ok(names.some(x => /[ışğüöç]/i.test(x)) || names.includes("Ahmet"));
});
t("csv quoting", () => {
  const out = M.format([{ a: 'x,"y"', b: 1 }], "csv");
  assert.strictEqual(out, 'a,b\n"x,""y""",1');
});
t("sql escaping and types", () => {
  const out = M.format([{ name: "O'Neil", n: 3, ok: true, z: null }], "sql", { table: "t" });
  assert.strictEqual(out, "INSERT INTO t (name, n, ok, z) VALUES ('O''Neil', 3, TRUE, NULL);");
});
t("json and ndjson parse back", () => {
  const rows = M.generate(fields, 4, {});
  assert.deepStrictEqual(JSON.parse(M.format(rows, "json")), rows);
  assert.deepStrictEqual(M.format(rows, "ndjson").split("\n").map(JSON.parse), rows);
});
t("unknown format throws", () => { assert.throws(() => M.format([], "xml")); });

console.log("mock-data: " + n + " checks ALL PASSED");
