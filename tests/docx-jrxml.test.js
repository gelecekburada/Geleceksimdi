/* Word (.docx) -> JasperReports (.jrxml) converter checks.  Run with:  node tests/docx-jrxml.test.js */
const assert = require("assert");
const D = require("../core/docx-lite.js");
const C = require("../core/docx-jrxml.js");

let failed = 0, passed = 0;
async function check(name, fn) {
  try { await fn(); passed++; console.log("PASS", name); } catch (e) { failed++; console.log("FAIL", name, "-", e.message); }
}
const enc = (s) => new TextEncoder().encode(s);
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

/* a hand-written .docx: body is WordprocessingML for <w:body>, extra = more zip parts */
function docx(body, extra) {
  const files = [
    { name: "[Content_Types].xml", data: enc('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>') },
    { name: "word/document.xml", data: enc('<?xml version="1.0" encoding="UTF-8"?><w:document ' + NS + "><w:body>" + body + "</w:body></w:document>") }
  ];
  Object.keys(extra || {}).forEach((k) => files.push({ name: k, data: typeof extra[k] === "string" ? enc(extra[k]) : extra[k] }));
  return D._zip(files);
}
const p = (inner, ppr) => "<w:p>" + (ppr ? "<w:pPr>" + ppr + "</w:pPr>" : "") + inner + "</w:p>";
const r = (text, rpr) => "<w:r>" + (rpr ? "<w:rPr>" + rpr + "</w:rPr>" : "") + '<w:t xml:space="preserve">' + text + "</w:t></w:r>";
const exprs = (x) => [...x.matchAll(/<textFieldExpression><!\[CDATA\[([\s\S]*?)\]\]><\/textFieldExpression>/g)].map((m) => m[1]);
const wellFormed = (x) => { const t = D._parseXml(x); assert.ok(t.children.some((c) => c.name === "jasperReport"), "has jasperReport root"); };

(async () => {
  await check("document from DocxLite converts: headings, table, footer page number", async () => {
    const bytes = D.build({
      title: "Rapor", footer: "BAForge", landscape: false,
      blocks: [{ t: "h1", text: "1. Giriş" }, { t: "p", text: "Normal **kalın** metin" }, { t: "table", head: ["Kod", "Durum"], rows: [["R-1", "Açık"]] }, { t: "pagebreak" }, { t: "p", text: "Son" }]
    });
    const res = await C.convert(bytes, { name: "Rapor" });
    wellFormed(res.jrxml);
    assert.ok(res.jrxml.includes('name="Rapor" pageWidth="595" pageHeight="842"'));
    assert.ok(res.jrxml.includes("<pageFooter>"));
    assert.ok(res.jrxml.includes("$V{PAGE_NUMBER}"));
    assert.ok(res.jrxml.includes("<break>"));
    assert.strictEqual(res.stats.tables, 1);
    const e = exprs(res.jrxml);
    assert.ok(e.includes('"1. Giriş"'));
    assert.ok(e.some((s) => s.includes('<style isBold=\\"true\\">kalın</style>')), "bold run uses styled markup");
    assert.ok(res.jrxml.includes('<box padding="3"><pen lineWidth="0.5"'), "bordered table cells");
  });

  await check("placeholders become fields, also when split across runs", async () => {
    const body = p(r("Sayın ") + r("${müş") + r("teri adı}", "<w:b/>") + r(", tutar {{ Tutar }} ve «Kod»."));
    const res = await C.convert(docx(body));
    assert.deepStrictEqual(res.stats.fields.sort(), ["Kod", "Tutar", "müşteri_adı"].sort());
    assert.ok(res.jrxml.includes('<field name="müşteri_adı" class="java.lang.String"/>'));
    const e = exprs(res.jrxml)[0];
    assert.ok(e.includes('($F{müşteri_adı} == null ? "" : String.valueOf($F{müşteri_adı}))'));
    assert.ok(res.warnings.some((w) => w.includes("müşteri adı")), "renamed placeholder is reported");
    assert.ok(res.jrxml.includes("$V{REPORT_COUNT}"), "each record starts on a new page");
  });

  await check("placeholders can become parameters, and $P{x} stays a parameter", async () => {
    const res = await C.convert(docx(p(r("A ${x} B $P{y} C $F{z}"))), { placeholderKind: "parameter" });
    assert.deepStrictEqual(res.stats.parameters.sort(), ["x", "y"]);
    assert.deepStrictEqual(res.stats.fields, ["z"]);
    assert.ok(res.jrxml.indexOf("<parameter") < res.jrxml.indexOf("<field"), "parameters before fields");
  });

  await check("placeholders off: text kept, and $F{ is hidden from JasperReports", async () => {
    const res = await C.convert(docx(p(r("Fiyat $F{x} \"tırnak\" \\ ters"))), { placeholders: false });
    const e = exprs(res.jrxml)[0];
    assert.strictEqual(e, '"Fiyat \\u0024F{x} \\"tırnak\\" \\\\ ters"');
    assert.deepStrictEqual(res.stats.fields, []);
  });

  await check("MERGEFIELD (simple and complex) and DATE fields", async () => {
    const simple = '<w:fldSimple w:instr=" MERGEFIELD Ad \\* MERGEFORMAT "><w:r><w:t>«Ad»</w:t></w:r></w:fldSimple>';
    const complex = '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> MERGEFIELD  "Soy Ad" </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>«Soy Ad»</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>';
    const date = '<w:fldSimple w:instr=\' DATE \\@ "dd/MM/yyyy" \'><w:r><w:t>27/11/2026</w:t></w:r></w:fldSimple>';
    const res = await C.convert(docx(p(r("Merhaba ") + simple + r(" ") + complex + r(" ") + date)));
    const e = exprs(res.jrxml)[0];
    assert.ok(e.includes("$F{Ad}") && e.includes("$F{Soy_Ad}"));
    assert.ok(!e.includes("«"), "Word's display text is not repeated");
    assert.ok(e.includes('new java.text.SimpleDateFormat("dd/MM/yyyy").format(new java.util.Date())'));
  });

  await check("Page X of Y uses one auto-evaluated field", async () => {
    const fld = (k) => '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> ' + k + ' </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>';
    const body = p(r("Metin")) + '<w:sectPr><w:footerReference w:type="default" r:id="rF"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="708"/></w:sectPr>';
    const res = await C.convert(docx(body, {
      "word/_rels/document.xml.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rF" Type="footer" Target="footer1.xml"/></Relationships>',
      "word/footer1.xml": "<w:ftr " + NS + ">" + p(r("Sayfa ") + fld("PAGE") + r(" / ") + fld("NUMPAGES"), '<w:jc w:val="center"/>') + "</w:ftr>"
    }));
    assert.ok(res.jrxml.includes('<textField evaluationTime="Auto"'));
    assert.ok(res.jrxml.includes('"Sayfa " + $V{BAF_CURRENT_PAGE} + " / " + $V{PAGE_NUMBER}'));
    assert.ok(res.jrxml.includes('<variable name="BAF_CURRENT_PAGE" class="java.lang.Integer" resetType="Page"'));
    assert.ok(res.jrxml.includes('textAlignment="Center"'));
    // footer sits at the bottom margin like in Word: bottomMargin = footer distance (35pt), band fills up to the 71pt margin
    assert.ok(res.jrxml.includes('bottomMargin="35"'));
    assert.ok(/<pageFooter>\s*<band height="36"/.test(res.jrxml));
  });

  await check("merged cells, shading and column widths", async () => {
    const tc = (t, pr) => "<w:tc>" + (pr ? "<w:tcPr>" + pr + "</w:tcPr>" : "") + p(r(t)) + "</w:tc>";
    const tbl = '<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="2000"/><w:gridCol w:w="4000"/><w:gridCol w:w="2000"/></w:tblGrid>' +
      "<w:tr>" + tc("Başlık", '<w:gridSpan w:val="2"/><w:shd w:val="clear" w:fill="1F3A5F"/>') + tc("A", '<w:vMerge w:val="restart"/>') + "</w:tr>" +
      "<w:tr>" + tc("x") + tc("y") + tc("", "<w:vMerge/>") + "</w:tr></w:tbl>";
    const res = await C.convert(docx(tbl));
    const x = res.jrxml;
    assert.ok(x.includes('<reportElement x="0" y="0" width="300" height="'), "span of 2 grid columns = 100+200pt");
    assert.ok(x.includes('mode="Opaque" backcolor="#1F3A5F"'));
    assert.ok(x.includes("<bottomPen lineWidth=\"0.0\"/>"), "restart cell opens downwards");
    assert.ok(x.includes("<topPen lineWidth=\"0.0\"/>"), "continued cell has no top line");
  });

  await check("lists are numbered from numbering.xml", async () => {
    const numbering = '<w:numbering ' + NS + '><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1)"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="%1.%2"/></w:lvl></w:abstractNum><w:num w:numId="5"><w:abstractNumId w:val="0"/></w:num></w:numbering>';
    const li = (t, lvl) => p(r(t), '<w:numPr><w:ilvl w:val="' + lvl + '"/><w:numId w:val="5"/></w:numPr>');
    const res = await C.convert(docx(li("bir", 0) + li("alt", 1) + li("alt2", 1) + li("iki", 0), { "word/numbering.xml": numbering }));
    const e = exprs(res.jrxml);
    assert.deepStrictEqual(e, ['"1)  bir"', '"1.a  alt"', '"1.b  alt2"', '"2)  iki"']);
    assert.ok(res.jrxml.includes('<reportElement x="18" y="0"'), "list indent (720-360 twips = 18pt)");
  });

  await check("pictures are embedded, unsupported formats are reported", async () => {
    const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"));
    const pic = (id) => '<w:r><w:drawing><wp:inline xmlns:wp="x"><wp:extent cx="1270000" cy="635000"/><a:graphic xmlns:a="y"><a:graphicData><pic:pic xmlns:pic="z"><pic:blipFill><a:blip r:embed="' + id + '"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    const res = await C.convert(docx(p(pic("rI1"), '<w:jc w:val="center"/>') + p(pic("rI2")), {
      "word/_rels/document.xml.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rI1" Type="image" Target="media/image1.png"/><Relationship Id="rI2" Type="image" Target="media/image2.emf"/></Relationships>',
      "word/media/image1.png": png, "word/media/image2.emf": enc("EMF")
    }), { lang: "en" });
    assert.strictEqual(res.stats.images, 1);
    assert.ok(res.jrxml.includes("java.util.Base64.getDecoder().decode"));
    assert.ok(res.jrxml.includes(Buffer.from(png).toString("base64")));
    assert.ok(res.jrxml.includes('width="100" height="50"'), "EMU size -> points");
    assert.ok(res.warnings.some((w) => /EMF/.test(w)));
    const off = await C.convert(docx(p(pic("rI1")), {
      "word/_rels/document.xml.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rI1" Type="image" Target="media/image1.png"/></Relationships>', "word/media/image1.png": png
    }), { images: false });
    assert.ok(!off.jrxml.includes("<image"));
  });

  await check("one font for everything when chosen", async () => {
    const res = await C.convert(docx(p(r("a", '<w:rFonts w:ascii="Calibri"/>'))), { font: "DejaVu Sans" });
    assert.ok(res.jrxml.includes('fontName="DejaVu Sans"') && !res.jrxml.includes("Calibri"));
  });

  await check("every element stays inside its band and the page", async () => {
    const long = "Uzun metin ".repeat(900);
    const res = await C.convert(docx(p(r(long)) + p(r("kısa"))));
    const W = +/columnWidth="(\d+)"/.exec(res.jrxml)[1];
    [...res.jrxml.matchAll(/<band height="(\d+)"[^>]*>([\s\S]*?)<\/band>/g)].forEach((b) => {
      [...b[2].matchAll(/<reportElement x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g)].forEach((m) => {
        assert.ok(+m[2] + +m[4] <= +b[1], "inside band height");
        assert.ok(+m[1] + +m[3] <= W, "inside column width");
      });
    });
    assert.ok(res.warnings.length === 1, "tall paragraph is reported");
  });

  await check("old .doc and non-Word files are refused with a clear message", async () => {
    await assert.rejects(C.convert(Uint8Array.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0, 0])), /\.doc/);
    await assert.rejects(C.convert(enc("hello world")), /docx/);
  });

  await check("Java strings escape quotes, backslashes and control characters", async () => {
    assert.strictEqual(C._javaStr('a"b\\c\nd\u0001'), '"a\\"b\\\\c\\nd\\u0001"');
    assert.ok(C._javaStr("x".repeat(9000)).split(" + ").length === 3, "long text is split into parts");
  });

  console.log("\n" + passed + " passed, " + failed + " failed");
  process.exit(failed ? 1 : 0);
})();
