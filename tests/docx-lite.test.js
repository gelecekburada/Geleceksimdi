const assert = require("assert");
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const D = require("../core/docx-lite.js");
let n = 0;
function t(name, fn) { try { fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }

const bytes = D.build({
  title: "Fonksiyonel Analiz — Test", subtitle: "Çok satırlı\nalt başlık", footer: "BAForge AI",
  blocks: [
    { t: "h1", text: "1. Giriş" }, { t: "p", text: "Normal **kalın** metin & <özel> \"karakterler\" ğüşiöçİ" },
    { t: "note", text: "Bu bir uyarıdır." }, { t: "bullets", items: ["bir", "iki"] }, { t: "numbered", items: ["adım 1", "adım 2"] },
    { t: "h2", text: "Tablo" },
    { t: "table", head: ["Kod", "Açıklama", "Durum"], widths: [15, 70, 15], rows: [["R-001", "Tutar > 0\nikinci satır", "Onaylandı"], ["R-002", "x\u0001y", ""]] },
    { t: "pagebreak" }, { t: "h3", text: "Son" }
  ]
});

t("starts like a zip and has the required parts", () => {
  assert.strictEqual(bytes[0], 0x50); assert.strictEqual(bytes[1], 0x4b);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dx-"));
  const f = path.join(dir, "t.docx"); fs.writeFileSync(f, bytes);
  assert.ok(/No errors detected/.test(cp.execFileSync("unzip", ["-t", f]).toString()));
  const list = cp.execFileSync("unzip", ["-Z1", f]).toString().split("\n");
  ["[Content_Types].xml", "word/document.xml", "word/styles.xml", "word/footer1.xml"].forEach((p) => assert.ok(list.includes(p), p));
  fs.writeFileSync(path.join(dir, "path.txt"), f);
  global.__docx = f;
});

t("every XML part is well formed", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dx2-"));
  cp.execFileSync("unzip", ["-q", global.__docx, "-d", dir]);
  const py = "import sys,glob,xml.dom.minidom as m\nfor f in glob.glob(sys.argv[1]+'/**/*.*ml',recursive=True)+glob.glob(sys.argv[1]+'/**/*.rels',recursive=True)+glob.glob(sys.argv[1]+'/_rels/.rels'):\n    m.parse(f)\nprint('ok')";
  assert.ok(/ok/.test(cp.execFileSync("python3", ["-c", py, dir]).toString()));
});

t("python-docx opens it and sees the text, table and styles", () => {
  const py = "import sys,docx\nd=docx.Document(sys.argv[1])\nprint('|'.join(p.text for p in d.paragraphs))\nt=d.tables[0]\nprint(len(t.rows),len(t.columns),t.cell(1,1).text.replace('\\n','/'),t.cell(2,1).text)\nprint([p.style.name for p in d.paragraphs][:3])\nprint(d.sections[0].orientation)";
  const out = cp.execFileSync("python3", ["-c", py, global.__docx]).toString();
  assert.ok(out.includes("1. Giriş") && out.includes("Normal kalın metin & <özel>") && out.includes("ğüşiöçİ"), out);
  assert.ok(out.includes("3 3 Tutar > 0/ikinci satır xy"), out);
  assert.ok(out.includes("Title"), out);
  assert.ok(out.includes("LANDSCAPE"), out);
});

t("LibreOffice renders it to a PDF with all the text", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dx3-"));
  cp.execFileSync("soffice", ["--headless", "--convert-to", "pdf", "--outdir", dir, global.__docx], { timeout: 120000, stdio: "pipe" });
  const txt = cp.execFileSync("pdftotext", [path.join(dir, "t.pdf"), "-"]).toString();
  assert.ok(txt.includes("Fonksiyonel Analiz") && txt.includes("Onaylandı") && txt.includes("ikinci satır") && txt.includes("Son"), txt);
  assert.ok(/BAForge AI\s+·\s+1/.test(txt.replace(/\n/g, " ")) || txt.includes("BAForge AI"), "footer");
});

t("crc32 matches the known check value", () => {
  assert.strictEqual(D._crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

t("empty document still builds", () => { assert.ok(D.build({ blocks: [] }).length > 500); });

console.log("docx-lite: " + n + " checks ALL PASSED");
