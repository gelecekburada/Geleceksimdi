const assert = require("assert");
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const D = require("../core/docx-lite.js"), Doc = require("../core/spec-doc.js"), S = require("../core/spec-schema.js");
const make = require("./fixture-model.js");
let n = 0;
async function t(name, fn) { try { await fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }
const clone = (x) => JSON.parse(JSON.stringify(x));
function strip(m) { const c = clone(m); delete c.meta.background; return c; }
async function roundtrip(model, lang, edit) {
  const bytes = D.build(Doc.build(model, lang));
  let blocks = await D.read(bytes);
  if (edit) { blocks = edit(blocks) || blocks; }
  return { blocks, imp: Doc.fromBlocks(blocks, model), bytes };
}
const table = (blocks, cap) => blocks.find((b) => b.t === "table" && b.caption === cap);

(async () => {
  await t("what we write is what we read back (Turkish)", async () => {
    const model = make();
    const { imp } = await roundtrip(model, "tr");
    const back = Doc.applyImport(null, imp);
    assert.deepStrictEqual(strip(back), strip(model));
    assert.deepStrictEqual(imp.warnings, []);
  });

  await t("same in English", async () => {
    const model = make();
    const { imp } = await roundtrip(model, "en");
    assert.deepStrictEqual(strip(Doc.applyImport(null, imp)), strip(model));
  });

  await t("edits made in Word come back: changed cell, new row, deleted row, status words", async () => {
    const model = make();
    const { imp } = await roundtrip(model, "tr", (blocks) => {
      const rules = table(blocks, "sec:rules");
      rules.rows[1][rules.rows[0].indexOf("Kural")] = "Tutar sıfırdan büyük olmalıdır (güncel)";
      rules.rows[1][rules.rows[0].indexOf("Durum")] = "Onaylandı";
      const nr = rules.rows[1].map(() => ""); nr[rules.rows[0].indexOf("Kural")] = "Yeni kural eklendi"; nr[rules.rows[0].indexOf("Kategori")] = "Güvenlik";
      rules.rows.push(nr);
      const msgs = table(blocks, "sec:messages"); msgs.rows.splice(2, 1);
      const f = blocks.find((b) => b.caption && b.caption.indexOf("fields:") === 0);
      f.rows[1][f.rows[0].indexOf("M/O/C")] = "Zorunlu";
    });
    const out = Doc.applyImport(model, imp);
    assert.strictEqual(out.rules[0].statement, "Tutar sıfırdan büyük olmalıdır (güncel)");
    assert.strictEqual(out.rules[0].status, "approved");
    assert.strictEqual(out.rules[0].sources.length, 1); // source column untouched
    const added = out.rules[out.rules.length - 1];
    assert.strictEqual(added.statement, "Yeni kural eklendi"); assert.strictEqual(added.category, "security");
    assert.ok(/^R-\d{3}$/.test(added.id) && added.id !== out.rules[0].id);
    assert.strictEqual(out.messages.length, model.messages.length - 1);
    assert.strictEqual(out.fields[0].presence, "M");
  });

  await t("columns may be moved or removed; headers decide, not position", async () => {
    const model = make();
    const { imp } = await roundtrip(model, "tr", (blocks) => {
      const c = table(blocks, "sec:constraints");
      c.rows = c.rows.map((r) => { const x = r.slice(); const i = 1, j = 2; [x[i], x[j]] = [x[j], x[i]]; return x; });
    });
    const out = Doc.applyImport(model, imp);
    assert.strictEqual(out.constraints[0].statement, model.constraints[0].statement);
  });

  await t("a section missing from the Word file stays as it was", async () => {
    const model = make();
    const { imp } = await roundtrip(model, "tr", (blocks) => blocks.filter((b) => b.caption !== "sec:rules" && b.caption !== "steps:FL-001"));
    const out = Doc.applyImport(model, imp);
    assert.deepStrictEqual(out.rules, model.rules);
    assert.deepStrictEqual(out.flows[0].steps, model.flows[0].steps);
  });

  await t("captions lost by Word: tables are still recognised by header and nearest heading", async () => {
    const model = make();
    const { imp } = await roundtrip(model, "tr", (blocks) => { blocks.forEach((b) => { if (b.t === "table" && b.caption !== "docs") { b.caption = ""; } }); });
    const back = Doc.applyImport(null, imp);
    assert.deepStrictEqual(back.rules, model.rules);
    assert.deepStrictEqual(back.fields, model.fields);
    assert.deepStrictEqual(back.flows, model.flows);
    assert.deepStrictEqual(back.design.tables, model.design.tables);
    assert.deepStrictEqual(back.overview, model.overview);
    assert.deepStrictEqual(back.meta.title, model.meta.title);
    ["audit", "nonFunctional"].forEach((k) => assert.deepStrictEqual(back[k], model[k], k));
    assert.deepStrictEqual(back.design.security, model.design.security);
    ["receipt", "returns", "reconciliation"].forEach((k) => assert.deepStrictEqual(back.accounting[k], model.accounting[k], k));
  });

  await t("rejected rows are not written; empty sections do not appear", async () => {
    const model = make(); model.rules[0].status = "rejected"; model.gaps = []; model.glossary = [];
    const spec = Doc.build(model, "tr");
    const txt = JSON.stringify(spec);
    assert.ok(txt.indexOf(model.rules[0].statement) < 0);
    assert.ok(!spec.blocks.some((b) => b.caption === "sec:gaps" || b.caption === "sec:glossary"));
  });

  await t("headings are numbered and the sample XML cell is monospaced", async () => {
    const spec = Doc.build(make(), "tr");
    const h = spec.blocks.filter((b) => b.t === "h1").map((b) => b.text);
    assert.ok(/^1\. /.test(h[0]) && h.length > 8);
    assert.ok(spec.blocks.find((b) => b.caption === "sec:samples").mono.length === 1);
  });

  await t("a file re-saved by another word processor (compressed) still reads back", async () => {
    const model = make();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rt-")), src = path.join(dir, "a.docx"), out = path.join(dir, "out");
    fs.writeFileSync(src, D.build(Doc.build(model, "tr")));
    fs.mkdirSync(out);
    cp.execFileSync("soffice", ["--headless", "--convert-to", "docx:MS Word 2007 XML", "--outdir", out, src], { timeout: 120000, stdio: "pipe" });
    const blocks = await D.read(new Uint8Array(fs.readFileSync(path.join(out, "a.docx"))));
    const imp = Doc.fromBlocks(blocks, model);
    const back = Doc.applyImport(null, imp);
    const captions = blocks.filter((b) => b.t === "table" && b.caption).length;
    console.log("  (after re-save: tables with captions kept: " + captions + " of " + blocks.filter((b) => b.t === "table").length + ")");
    assert.deepStrictEqual(back.rules, model.rules);
    assert.deepStrictEqual(back.fields, model.fields);
    assert.deepStrictEqual(back.messages, model.messages);
    assert.deepStrictEqual(back.design.samples, model.design.samples);
    assert.deepStrictEqual(back.flows, model.flows);
    assert.deepStrictEqual(back.overview, model.overview);
    assert.deepStrictEqual(back.audit, model.audit);
    assert.deepStrictEqual(back.design.security, model.design.security);
    assert.deepStrictEqual(back.accounting.returns, model.accounting.returns);
    assert.deepStrictEqual(back.accounting.reconciliation, model.accounting.reconciliation);
  });

  console.log("spec-roundtrip: " + n + " checks ALL PASSED");
})().catch((e) => { console.error(e); process.exit(1); });
