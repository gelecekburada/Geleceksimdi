/* A fully populated model for tests (built with the fake model answers, not real AI output). */
const S = require("../core/spec-model.js"), Sc = require("../core/spec-schema.js"), fake = require("./fake-openai");
module.exports = function make() {
  const text = "[[Sayfa 3]]\npak.008 - Müşteri ödeme talimatı\nTutar sıfırdan büyük olmalıdır E101\nMsgId | Max35Text | M | Mesaj numarası\nMesaj boyutu en fazla 500 KB olabilir\nE101 Geçersiz tutar\nKesim saati belirsiz mi?\n[[Sayfa 4]]\nH31 - İade mesajı\nİade tutarı orijinal tutarı aşmamalıdır\n";
  const prompt = "<document>\n" + text + "\n</document>";
  const merged = S.merge([S.normalizeFindings(fake.extractAnswer(prompt), 1)]);
  merged.flows.push({ name: "Gelen ödeme akışı", steps: [{ actor: "TCMB", action: "Mesajı gönderir", message: "pak.008" }, { actor: "FAS", action: "Doğrular ve muhasebeleştirir", message: "" }], sources: [{ doc: 1, page: 3, quote: "Tutar sıfırdan büyük olmalıdır" }], id: "FL-001", status: "pending" });
  S.annotate(merged, { 1: { 3: text.split("[[Sayfa 4]]")[0], 4: "H31 - İade mesajı" } });
  const m = Sc.fromFindings(merged, [{ no: 1, name: "TCMB.pdf", role: "main", pages: 48 }, { no: 2, name: "ic.pdf", role: "extra", pages: 5 }], { title: "FAS PAK Entegrasyonu", version: "1.0", date: "2026-10-16", author: "Test Analist", background: "Banka X" });
  Sc.absorb(m, fake.synthAnswer("R-001 R-002"));
  Sc.absorb(m, fake.designAnswer());
  m.changeLog = [{ id: "1.0", date: "2026-10-16", author: "Test Analist", summary: "İlk sürüm" }];
  return Sc.assignIds(m);
};
