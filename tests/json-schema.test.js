const assert = require("assert");
const S = require("../core/json-schema.js");
let n = 0;
function t(name, fn) { try { fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }

const sample = { id: 1, name: "Ayşe", price: 9.5, active: true, tags: ["a", "b"], email: "a@b.co", created: "2026-10-16T10:00:00Z", note: null, addr: { city: "X", zip: 34000 } };

t("basic inference", () => {
  const s = S.infer(sample);
  assert.strictEqual(s.$schema, S.DRAFTS["2020-12"]);
  assert.strictEqual(s.type, "object");
  assert.strictEqual(s.properties.id.type, "integer");
  assert.strictEqual(s.properties.price.type, "number");
  assert.strictEqual(s.properties.tags.items.type, "string");
  assert.strictEqual(s.properties.email.format, "email");
  assert.strictEqual(s.properties.created.format, "date-time");
  assert.strictEqual(s.properties.note.type, "null");
  assert.strictEqual(s.properties.addr.properties.zip.type, "integer");
  assert.strictEqual(s.required.length, 9);
});
t("round trip: sample validates against its own schema", () => {
  assert.deepStrictEqual(S.validate(S.infer(sample), sample), []);
});
t("merge samples: optional + union types", () => {
  const s = S.infer([{ a: 1, b: "x" }, { a: 2.5 }, { a: null }]);
  assert.deepStrictEqual(s.properties.a.type, ["null", "number"]);
  assert.deepStrictEqual(s.required, ["a"]);
});
t("required modes", () => {
  const smp = [{ a: 1 }, { a: 1, b: 2 }];
  assert.deepStrictEqual(S.infer(smp, { required: "all" }).required, ["a", "b"]);
  assert.strictEqual(S.infer(smp, { required: "none" }).required, undefined);
});
t("additionalProperties false is enforced", () => {
  const s = S.infer({ a: 1 }, { additionalProperties: false });
  assert.ok(S.validate(s, { a: 1, z: 2 }).length > 0);
});
t("format dropped if samples disagree", () => {
  const s = S.infer([{ v: "a@b.co" }, { v: "hello" }]);
  assert.strictEqual(s.properties.v.format, undefined);
});
t("formats can be turned off", () => {
  assert.strictEqual(S.infer({ e: "a@b.co" }, { formats: false }).properties.e.format, undefined);
});
t("draft 07 + title", () => {
  const s = S.infer({ a: 1 }, { draft: "07", title: "Thing" });
  assert.ok(s.$schema.indexOf("draft-07") > 0 && s.title === "Thing");
});
t("array root and mixed arrays", () => {
  const s = S.infer([[1, "a", 2.5]]);
  assert.strictEqual(s.type, "array");
  assert.deepStrictEqual(s.items.type, ["number", "string"]);
});
t("validator catches wrong type and missing required", () => {
  const s = S.infer({ a: 1, b: "x" });
  assert.ok(S.validate(s, { a: "no", b: "x" })[0].indexOf("expected integer") > 0);
  assert.ok(S.validate(s, { a: 1 })[0].indexOf("missing required") > 0);
});
t("parseSamples single, ndjson, invalid", () => {
  assert.strictEqual(S.parseSamples('{"a":1}').multi, false);
  const r = S.parseSamples('{"a":1}\n{"a":2}');
  assert.ok(r.multi && r.samples.length === 2);
  assert.throws(() => S.parseSamples("{bad"));
});

console.log("json-schema: " + n + " checks ALL PASSED");
