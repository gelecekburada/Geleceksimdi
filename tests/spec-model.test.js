const assert = require("assert");
const S = require("../core/spec-model.js");
let n = 0;
function t(name, fn) { try { fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }

t("page text: lines by baseline, columns separated, order top to bottom", () => {
  const txt = S.pageTextFromItems([
    { str: "Alt satır", x: 10, y: 100, w: 50 },
    { str: "Alan", x: 10, y: 200, w: 30 },
    { str: "Tip", x: 120, y: 200.5, w: 20 },
    { str: "Kod", x: 43, y: 200, w: 20 },
    { str: "  ", x: 0, y: 1, w: 1 }
  ]);
  assert.strictEqual(txt, "Alan Kod | Tip\nAlt satır");
});

t("chunks keep page order, page markers and stay under the limit", () => {
  const pages = [];
  for (let i = 1; i <= 10; i++) { pages.push({ n: i, text: ("satır " + i + "\n").repeat(300) }); }
  const ch = S.buildChunks(pages, { maxChars: 5000, overlap: 200 });
  assert.ok(ch.length > 2);
  assert.strictEqual(ch[0].from, 1);
  assert.strictEqual(ch[ch.length - 1].to, 10);
  ch.forEach((c) => { assert.ok(c.text.length <= 5000 + 200); assert.ok(c.text.indexOf("[[Sayfa " + c.from + "]]") === 0); });
  assert.strictEqual(ch[0].context, "");
  assert.ok(ch[1].context.length > 0 && ch[1].context.length <= 200);
  // every page ends up in exactly one chunk
  const seen = [].concat(...ch.map((c) => c.pages.map((p) => p.n)));
  assert.deepStrictEqual(seen, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

t("empty pages are skipped, a huge page is split in parts", () => {
  const ch = S.buildChunks([{ n: 1, text: "   " }, { n: 2, text: ("x".repeat(100) + "\n").repeat(1000) }], { maxChars: 20000 });
  assert.ok(ch.length >= 2);
  assert.ok(ch.every((c) => c.pages.every((p) => p.n === 2)));
  assert.ok(ch[1].text.indexOf("(devam") > -1);
});

t("splitChunk halves by pages, then by text, then gives up", () => {
  const ch = S.buildChunks([{ n: 1, text: "a\n".repeat(500) }, { n: 2, text: "b\n".repeat(500) }, { n: 3, text: "c\n".repeat(500) }], { maxChars: 100000 })[0];
  const [a, b] = S.splitChunk(ch);
  assert.strictEqual(a.pages.length + b.pages.length, 3);
  assert.ok(b.context.length > 0);
  const single = S.splitChunk(a.pages.length > 1 ? { pages: [a.pages[0]], context: "" } : a);
  assert.ok(single === null || single.length === 2);
  assert.strictEqual(S.splitChunk({ pages: [{ n: 1, text: "kısa" }], context: "" }), null);
  const big = S.splitChunk({ pages: [{ n: 4, text: ("y".repeat(60) + "\n").repeat(100) }], context: "" });
  assert.strictEqual(big.length, 2);
  assert.ok(big[1].text.indexOf("(devam 2)") > -1 && big[0].from === 4);
});

const raw = {
  documentInfo: { title: "FAS Mesaj Kılavuzu", version: "1.2" },
  messages: [{ code: "pak.008", name: "Giden ödeme", direction: "FAS → TCMB", page: 5, quote: "Bu mesaj ödeme talimatı için kullanılır" }, { name: "", code: "" }, null],
  fields: [
    { message: "pak.008", path: "Document/FIToFICstmrCdtTrf/GrpHdr/MsgId", type: "Max35Text", presence: "Zorunlu", page: "6", quote: "MsgId Max35Text" },
    { message: "pak.008", path: "Document/GrpHdr/NbOfTxs", type: "Max15NumericText", presence: "M", allowedValues: ["1"], page: 6 }
  ],
  rules: [
    { category: "VALIDATION", statement: "Tutar sıfırdan büyük olmalıdır.", errorCode: "E101", page: 7, quote: "Tutar sıfırdan büyük olmalıdır" },
    { category: "weird", statement: "Mesaj kesim saatinden önce gönderilmelidir.", page: 8 },
    { statement: "" }
  ],
  constraints: [{ kind: "limit", statement: "Mesaj boyutu 500 KB'ı aşamaz", value: "500 KB", page: 3 }],
  errors: [{ code: "E101", description: "Geçersiz tutar" }],
  flows: [{ name: "Ödeme akışı", steps: ["Banka mesajı gönderir", { actor: "TCMB", action: "Doğrular", message: "pacs.002" }, 5, {}] }],
  glossary: [{ term: "FAS", definition: "Ödeme sistemi" }],
  ambiguities: ["Kesim saati belirtilmemiş", { text: "Zaman dilimi belirsiz", page: 9 }]
};

t("normalize coerces the AI answer into known shapes", () => {
  const f = S.normalizeFindings(raw, 1);
  assert.strictEqual(f.info.version, "1.2");
  assert.strictEqual(f.messages.length, 1);
  assert.strictEqual(f.fields[0].presence, "M");
  assert.strictEqual(f.fields[0].sources[0].page, 6);
  assert.strictEqual(f.fields[1].allowed, "1");
  assert.deepStrictEqual(f.rules.map((r) => r.category), ["validation", "other"]);
  assert.strictEqual(f.flows[0].steps.length, 2);
  assert.strictEqual(f.ambiguities.length, 2);
  assert.deepStrictEqual(S.normalizeFindings(null, 1).rules, []);
  assert.deepStrictEqual(S.normalizeFindings({ rules: "nope", messages: 5 }, 2).messages, []);
});

t("merge dedupes across chunks and documents, keeps sources, gives stable ids", () => {
  const a = S.normalizeFindings(raw, 1);
  const b = S.normalizeFindings({
    messages: [{ code: "PAK.008", name: "", purpose: "Ödeme talimatı", page: 20 }],
    rules: [{ category: "validation", statement: "tutar sıfırdan büyük olmalıdır", page: 30 }, { category: "limit", statement: "Günlük limit aşılamaz", page: 31 }],
    fields: [{ message: "pak.008", path: "document/fitoficstmrcdttrf/grphdr/msgid", description: "Mesaj no", page: 6 }]
  }, 2);
  const m = S.merge([a, b]);
  assert.strictEqual(m.messages.length, 1);
  assert.strictEqual(m.messages[0].purpose, "Ödeme talimatı"); // blank filled from the duplicate
  assert.strictEqual(m.messages[0].sources.length, 2);
  assert.strictEqual(m.rules.length, 3);
  assert.strictEqual(m.rules[0].sources.length, 2);
  assert.strictEqual(m.rules[0].sources[1].doc, 2);
  assert.strictEqual(m.fields.length, 2);
  assert.strictEqual(m.fields[0].description, "Mesaj no");
  assert.deepStrictEqual(m.rules.map((r) => r.id), ["R-001", "R-002", "R-003"]);
  assert.ok(m.rules.every((r) => r.status === "pending"));
});

t("quote check: ok / other page / missing / too short", () => {
  const pages = { 5: "Bu mesaj ödeme   talimatı\niçin kullanılır.", 6: "Başka | sayfa metni burada duruyor" };
  assert.strictEqual(S.verifyQuote("Bu mesaj ödeme talimatı için kullanılır", 5, pages).state, "ok");
  assert.strictEqual(S.verifyQuote("başka sayfa metni burada duruyor", 5, pages).state, "other");
  assert.strictEqual(S.verifyQuote("başka sayfa metni burada duruyor", 5, pages).page, 6);
  assert.strictEqual(S.verifyQuote("olmayan uydurma cümle burada", 5, pages).state, "missing");
  assert.strictEqual(S.verifyQuote("kısa", 5, pages).state, "none");
  assert.strictEqual(S.verifyQuote("İSTANBUL ödeme", 1, { 1: "istanbul ödeme" }).state, "ok");
});

t("quote check handles line-break hyphenation", () => {
  assert.strictEqual(S.verifyQuote("uygulanabilir olmalıdır", 1, { 1: "uygula-\nnabilir olmalıdır" }).state, "ok");
});

t("annotate marks every finding and stats counts unverified", () => {
  const m = S.merge([S.normalizeFindings(raw, 1)]);
  S.annotate(m, { 1: { 5: "Bu mesaj ödeme talimatı için kullanılır", 7: "Tutar sıfırdan büyük olmalıdır", 6: "MsgId Max35Text" } });
  assert.strictEqual(m.messages[0].check, "ok");
  assert.strictEqual(m.rules[0].check, "ok");
  assert.strictEqual(m.rules[1].check, "none");
  const s = S.stats(m);
  assert.strictEqual(s.rules, 2);
  assert.strictEqual(s.unverified, 0);
  m.rules[1].sources[0].quote = "bu cümle dokümanda yok kesinlikle";
  S.annotate(m, { 1: {} });
  assert.strictEqual(S.stats(m).unverified >= 1, true);
});

t("compact summary respects its budget and says what it left out", () => {
  const big = { rules: [], fields: [], messages: [], constraints: [], errors: [], flows: [], ambiguities: [] };
  for (let i = 0; i < 400; i++) { big.rules.push({ id: "R-" + i, category: "business", title: "", statement: "x".repeat(250), errorCode: "" }); }
  const c = S.compactForSynthesis(big, 20000);
  assert.ok(c.text.length <= 21000);
  assert.ok(c.omitted.length > 0);
  const small = S.compactForSynthesis(S.merge([S.normalizeFindings(raw, 1)]), 20000);
  assert.ok(small.omitted.length === 0 && small.text.indexOf("R-001") > -1 && small.text.indexOf("pak.008") > -1);
});


console.log("spec-model: " + n + " checks ALL PASSED");
