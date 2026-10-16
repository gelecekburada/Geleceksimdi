const assert = require("assert");
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const S = require("../core/spec-model.js"), R = require("../core/spec-report.js"), D = require("../core/docx-lite.js"), fake = require("./fake-openai");
let n = 0;
function t(name, fn) { try { fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }

const text = "[[Sayfa 3]]\npak.008 - Müşteri ödeme talimatı\nTutar sıfırdan büyük olmalıdır E101\nMsgId | Max35Text | M | Mesaj numarası\nMesaj boyutu en fazla 500 KB olabilir\nE101 Geçersiz tutar\nKesim saati belirsiz mi?\n";
const prompt = "<document>\n" + text + "\n</document>";
const merged = S.merge([S.normalizeFindings(fake.extractAnswer(prompt), 1)]);
S.annotate(merged, { 1: { 3: text } });
const synth = S.normalizeSynthesis(fake.synthAnswer("R-001 R-002"));
const state = { docs: [{ no: 1, name: "TCMB.pdf", role: "main", pages: 48 }], merged, synth, meta: { author: "Test Analist", date: "2026-10-16" } };

t("report has every section and honest labels", () => {
  const spec = R.build(state, "tr");
  const text = JSON.stringify(spec);
  ["Mesaj kataloğu", "Alan tanımları", "İş kuralları", "Muhasebe entegrasyonu", "Dekont", "İade işlemleri", "Onay akışları", "yetki matrisi", "Test senaryoları", "Açık sorular"].forEach((s) => assert.ok(text.includes(s), s));
  assert.ok(text.includes("Öneri") && text.includes("Onay bekliyor"));
  assert.ok(text.includes("✓"));
  assert.ok(text.includes("pak.008"));
});

t("rejected rows are left out, approved rows are marked", () => {
  const s2 = JSON.parse(JSON.stringify(state));
  s2.merged.rules[0].status = "rejected"; s2.merged.messages[0].status = "approved";
  s2.synth.approvals[0].status = "rejected";
  const text = JSON.stringify(R.build(s2, "tr"));
  assert.ok(!text.includes(s2.merged.rules[0].statement));
  assert.ok(!text.includes("İade onayı"));
  assert.ok(text.includes("Onaylandı"));
});

t("notes and unverified quotes are visible; English works", () => {
  const s2 = JSON.parse(JSON.stringify(state));
  s2.merged.rules[0].note = "Muhasebe ile teyit edilecek";
  s2.merged.rules[0].sources[0].quote = "bu cümle pdf içinde hiç yok";
  S.annotate(s2.merged, { 1: { 3: text } });
  const j = JSON.stringify(R.build(s2, "tr"));
  assert.ok(j.includes("Muhasebe ile teyit edilecek") && j.includes("⚠"));
  assert.ok(JSON.stringify(R.build(s2, "en")).includes("Functional Analysis Document") || JSON.stringify(R.build(s2, "en")).includes("Message catalogue"));
});

t("works with no second pass yet (extraction only)", () => {
  const spec = R.build({ docs: state.docs, merged, synth: null, meta: {} }, "tr");
  assert.ok(JSON.stringify(spec).includes("Mesaj kataloğu"));
  assert.ok(!JSON.stringify(spec).includes("Muhasebe entegrasyonu"));
});

t("the real .docx opens in Word-compatible readers and renders", () => {
  const bytes = D.build(R.build(state, "tr"));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rp-")), f = path.join(dir, "r.docx");
  fs.writeFileSync(f, bytes);
  const py = "import sys,docx\nd=docx.Document(sys.argv[1])\nprint(len(d.tables))\nprint(' '.join(c.text for t in d.tables for r in t.rows for c in r.cells)[:20000])";
  const out = cp.execFileSync("python3", ["-c", py, f]).toString();
  assert.ok(parseInt(out, 10) >= 8, out.slice(0, 50));
  assert.ok(out.includes("Tutar sıfırdan büyük olmalıdır") && out.includes("Gelen ödeme") && out.includes("Hesap planı kodları"));
  cp.execFileSync("soffice", ["--headless", "--convert-to", "pdf", "--outdir", dir, f], { timeout: 120000, stdio: "pipe" });
  const pages = parseInt(cp.execFileSync("sh", ["-c", "pdfinfo " + path.join(dir, "r.pdf") + " | grep Pages | awk '{print $2}'"]).toString(), 10);
  assert.ok(pages >= 3, "pages " + pages);
  fs.copyFileSync(path.join(dir, "r.pdf"), path.join(os.tmpdir(), "spec-report-sample.pdf"));
});

console.log("spec-report: " + n + " checks ALL PASSED");
