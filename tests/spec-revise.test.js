const assert = require("assert");
const R = require("../core/spec-revise.js"), S = require("../core/spec-schema.js"), fake = require("./fake-openai");
const make = require("./fixture-model.js");
let n = 0;
function t(name, fn) { try { fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }
const clone = (x) => JSON.parse(JSON.stringify(x));

t("compact puts the parts the instruction is about first and reports what it left out", () => {
  const m = make();
  for (let i = 0; i < 300; i++) { m.rules.push({ id: "R-9" + i, category: "business", title: "", statement: "dolgu kural " + "x".repeat(300), condition: "", action: "", errorCode: "", appliesTo: "", sources: [], check: "none", status: "pending" }); }
  S.assignIds(m);
  const c = R.compact(m, "MsgId alanını zorunlu yap ve R-001 kuralını düzelt", 9000);
  assert.ok(c.text.length <= 9500);
  assert.ok(c.text.indexOf("MsgId") > -1 && c.text.indexOf("R-001 |") > -1);
  assert.ok(c.omitted.length > 0 && /rules/.test(c.omitted.join()));
  assert.ok(c.text.indexOf("[fields]") < c.text.indexOf("[rules]") || c.text.indexOf("[rules]") < c.text.indexOf("[fields]"));
});

t("validate: good operations pass, bad ones come back with a reason", () => {
  const m = make();
  const raw = fake.reviseAnswer("<instructions>\nupdate rules R-001 statement=Yeni kural metni; category=security\nadd rules statement=Eklenen kural; category=timing\nremove messages MSG-002\nsettext overview.purpose=Yeni amaç\nupdate rules R-999 statement=yok\nadd bogus statement=x\nupdate rules R-001 statement=Yeni kural metni; category=security\n</instructions>").ops;
  raw.push({ op: "explode" }, null, { op: "update", section: "rules", id: "R-001", set: { id: "R-777", status: "approved", sources: [] } });
  const v = R.validateOps(m, raw);
  assert.strictEqual(v.ops.length, 5, JSON.stringify(v.invalid));
  assert.strictEqual(v.ops[0].set.category, "security");
  assert.ok(!("id" in v.ops[0].set) && !("status" in v.ops[0].set));
  assert.deepStrictEqual(v.ops[1].item.sources, []); assert.strictEqual(v.ops[1].item.status, "pending");
  assert.strictEqual(v.invalid.length, 5);
  assert.ok(v.invalid.some((x) => /no such id/.test(x.reason)) && v.invalid.some((x) => /unknown section/.test(x.reason)) && v.invalid.some((x) => /unknown operation|not an object|nothing to change/.test(x.reason)));
});

t("validate: fields need message and path, text targets are whitelisted, no-op changes are dropped, cap on count", () => {
  const m = make();
  const v = R.validateOps(m, [
    { op: "add", section: "fields", item: { path: "A/B" } },
    { op: "add", section: "fields", item: { message: "pak.008", path: "Document/Amt", type: "Decimal", presence: "zorunlu" } },
    { op: "setText", target: "meta.author", value: "x" },
    { op: "setText", target: "overview.purpose", value: m.overview.purpose },
    { op: "update", section: "rules", id: "R-001", set: { statement: m.rules[0].statement } }
  ]);
  assert.strictEqual(v.ops.length, 1);
  assert.strictEqual(v.ops[0].item.presence, "M");
  assert.strictEqual(v.invalid.length, 4);
  const many = Array.from({ length: 200 }, (_, i) => ({ op: "add", section: "rules", item: { statement: "k" + i } }));
  assert.strictEqual(R.validateOps(m, many).ops.length, R.MAX_OPS);
});

t("apply: update, add (fields land next to their message), remove is a soft delete, original untouched", () => {
  const m = make(), before = clone(m);
  const { ops } = R.validateOps(m, [
    { op: "update", section: "rules", id: "R-001", set: { statement: "Güncel metin" } },
    { op: "add", section: "fields", item: { message: "pak.008", path: "Document/Amt", type: "Decimal" } },
    { op: "add", section: "rules", item: { statement: "Yeni kural" } },
    { op: "remove", section: "messages", id: "MSG-002" },
    { op: "setText", target: "overview.purpose", value: "Yeni amaç" },
    { op: "update", section: "tables", id: "T-001", set: { columns: [{ name: "x", type: "int" }] } }
  ]);
  const out = R.applyOps(m, ops);
  assert.deepStrictEqual(m, before);
  assert.strictEqual(out.rules[0].statement, "Güncel metin");
  assert.strictEqual(out.fields.length, 2); assert.strictEqual(out.fields[1].path, "Document/Amt"); assert.ok(/^F-\d{3}$/.test(out.fields[1].id));
  assert.deepStrictEqual(out.rules[out.rules.length - 1].sources, []);
  assert.strictEqual(out.messages[1].status, "rejected");
  assert.strictEqual(out.overview.purpose, "Yeni amaç");
  assert.strictEqual(out.design.tables[0].columns.length, 1);
});

t("preview shows before and after in the chosen language", () => {
  const m = make();
  const { ops } = R.validateOps(m, [{ op: "update", section: "rules", id: "R-001", set: { category: "security" } }, { op: "add", section: "rules", item: { statement: "Yeni" } }, { op: "remove", section: "messages", id: "MSG-001" }]);
  const p = R.preview(m, ops, "tr");
  assert.strictEqual(p[0].changes[0].p, "Kategori"); assert.strictEqual(p[0].changes[0].to, "Güvenlik"); assert.strictEqual(p[0].changes[0].from, "Doğrulama");
  assert.ok(p[1].changes.some((c) => c.to === "Yeni"));
  assert.ok(p[2].changes.length > 0 && p[2].changes[0].to === "");
  assert.strictEqual(R.preview(m, ops, "en")[0].changes[0].p, "Category");
});

t("diff finds what was changed by hand: changed, added, removed, status, overview", () => {
  const a = make(), b = clone(a);
  b.rules[0].statement = "Elle değişti"; b.rules[0].status = "approved";
  b.messages.splice(1, 1);
  b.constraints.push({ id: "C-050", kind: "limit", statement: "yeni kısıt", value: "", sources: [], check: "none", status: "pending" });
  b.overview.scope = "Değişti";
  const d = R.diffModels(a, b, "tr");
  assert.strictEqual(d.filter((x) => x.kind === "change" && x.section === "rules").length, 1);
  assert.ok(d.find((x) => x.section === "rules").changes.some((c) => c.p === "Durum" && c.to === "Onaylandı"));
  assert.strictEqual(d.filter((x) => x.kind === "remove").length, 1);
  assert.strictEqual(d.filter((x) => x.kind === "add").length, 1);
  assert.ok(d.some((x) => x.id === "overview.scope"));
  assert.deepStrictEqual(R.diffModels(a, clone(a), "tr"), []);
});

t("versions and change log", () => {
  assert.strictEqual(R.bumpVersion("1.0"), "1.1"); assert.strictEqual(R.bumpVersion("2.9"), "2.10"); assert.strictEqual(R.bumpVersion("x"), "1.0");
  const m = make();
  const e = R.logEntry(m, "Talimat uygulandı", "Ali", "2026-10-17");
  assert.strictEqual(e.id, "1.1"); assert.strictEqual(e.author, "Ali");
  const fresh = S.emptyModel(); fresh.meta.version = "1.0";
  assert.strictEqual(R.logEntry(fresh, "İlk sürüm").id, "1.0");
});

console.log("spec-revise: " + n + " checks ALL PASSED");
