/*
 * Test-only stand-in for api.openai.com/v1/responses. It does NOT judge text like a real model:
 * it builds findings from lines of the slice it is given (so quotes are real and can be verified)
 * and returns a canned second pass. Use it to test plumbing, never to judge answer quality.
 */
"use strict";
const state = { mode: "ok", calls: [], failNext: 0 };

function reset() { state.mode = "ok"; state.calls = []; state.failNext = 0; }

function extractAnswer(prompt) {
  const doc = (prompt.match(/<document>\n([\s\S]*?)\n<\/document>/) || [, ""])[1];
  const out = { documentInfo: { title: "", version: "", date: "", publisher: "", purpose: "" }, messages: [], fields: [], rules: [], constraints: [], errors: [], flows: [], glossary: [], ambiguities: [] };
  let page = 1;
  doc.split("\n").forEach((line) => {
    const pm = line.match(/^\[\[Sayfa (\d+)/);
    if (pm) { page = parseInt(pm[1], 10); return; }
    const t = line.trim();
    if (!t) { return; }
    const msg = t.match(/^(pak\.\d{3}|pacs\.\d{3}|H31)\b\s*[-–:]\s*(.+)$/i);
    if (msg) { out.messages.push({ code: msg[1], name: msg[2].slice(0, 80), direction: "", purpose: msg[2], trigger: "", page, quote: t.slice(0, 160) }); return; }
    const row = t.split(" | ");
    if (row.length >= 4) { out.fields.push({ message: "pak.008", path: row[0], name: row[0], type: row[1], length: "", occurrence: "1..1", presence: row[2], format: "", allowedValues: [], description: row[3], rules: "", page, quote: t.slice(0, 160) }); return; }
    if (/olmalıdır|must|zorunludur/i.test(t)) { out.rules.push({ category: /saat|time/i.test(t) ? "timing" : "validation", title: "", statement: t, condition: "", action: "", errorCode: (t.match(/\b[A-Z]{1,3}\d{3}\b/) || [""])[0], appliesTo: "", page, quote: t.slice(0, 160) }); return; }
    if (/en fazla|aşamaz|max/i.test(t)) { out.constraints.push({ kind: "limit", statement: t, value: "", page, quote: t.slice(0, 160) }); return; }
    if (/^[A-Z]{1,3}\d{3}\b/.test(t)) { out.errors.push({ code: t.split(/\s+/)[0], description: t, cause: "", handling: "", page, quote: t.slice(0, 160) }); return; }
    if (/belirsiz|\?/.test(t)) { out.ambiguities.push({ text: t, page }); }
  });
  return out;
}

function synthAnswer(prompt) {
  const ids = Array.from(new Set(prompt.match(/\bR-\d{3}\b/g) || []));
  return {
    overview: { purpose: "Test amacı", scope: "Test kapsamı", outOfScope: "Kapsam dışı örnek" },
    actors: [{ name: "Operasyon", role: "Mesajları izler" }],
    assumptions: ["Varsayım 1", { text: "Varsayım 2" }],
    accounting: {
      summary: "Gelen ödeme muhasebeleşir.",
      entries: [{ event: "Gelen ödeme", debit: "Muhabir hesap", credit: "Müşteri hesabı", amount: "Tutar alanı", timing: "Mesaj doğrulanınca", notes: "", origin: "proposal", refs: ids.slice(0, 1) }],
      receipt: [{ item: "Dekont numarası", detail: "Yıl + sıra no", origin: "proposal", refs: [] }],
      returns: [{ item: "İade bağlantısı", detail: "Orijinal işlem referansı ile eşlenir", origin: "proposal", refs: [] }],
      reconciliation: [{ item: "Gün sonu mutabakat", detail: "TCMB ekstresi ile", origin: "proposal", refs: [] }]
    },
    approvals: [{ step: "İade onayı", rule: "İkinci kişi onaylar", who: "Yönetici", condition: "Tutar > eşik", origin: "proposal", refs: [] }],
    authorization: [{ role: "Operatör", screen: "Gelen mesajlar", rights: ["view", "create"], note: "", origin: "proposal" }],
    screens: [{ name: "Gelen mesaj listesi", purpose: "İzleme", fields: ["Mesaj no", "Tutar"], actions: "Detay", rules: "", origin: "proposal", refs: [] }],
    notifications: [{ event: "Hatalı mesaj", channel: "E-posta", to: "Operasyon", note: "", origin: "proposal" }],
    audit: [{ item: "Tüm durum değişiklikleri", detail: "Kim, ne zaman" }],
    nonFunctional: [{ item: "Performans", detail: "1000 mesaj/dk" }],
    tests: ids.slice(0, 2).map((r, i) => ({ title: "Kural testi " + (i + 1), steps: ["Mesaj gönder", "Sonucu izle"], expected: "Beklenen sonuç", refs: [r] })),
    gaps: [{ text: "Kesim saati belirtilmemiş", refs: [] }],
    questions: [{ question: "Hesap planı kodları nedir?", why: "Muhasebe girişi için", owner: "Muhasebe" }]
  };
}

function designAnswer() {
  return {
    design: {
      architecture: [{ name: "Mesaj alıcı", responsibility: "TCMB'den gelen XML'i alır, imza ve şema doğrular", notes: "" }],
      interfaces: [{ name: "FAS gelen kuyruk", direction: "Gelen", protocol: "XML / kuyruk", trigger: "Mesaj geldiğinde", payload: "pak.008", auth: "Karşılıklı sertifika", retry: "3 deneme, sonra hata kuyruğu" }],
      tables: [{ name: "fas_mesaj", purpose: "Gelen/giden mesajlar", notes: "İndeks: msg_id (tekil)", columns: [
        { name: "id", type: "bigint", nullable: false, key: "PK", description: "Teknik anahtar", source: "" },
        { name: "msg_id", type: "varchar(35)", nullable: false, key: "UQ", description: "Mesaj numarası", source: "MsgId" }
      ] }],
      mapping: [{ source: "pak.008 / MsgId", target: "fas_mesaj.msg_id", transform: "Aynen", refs: ["R-001"] }],
      states: [{ code: "ALINDI", description: "Mesaj alındı", final: "Hayır" }, { code: "MUHASEBELESTI", description: "Kayıt atıldı", final: "Evet" }],
      transitions: [{ from: "ALINDI", event: "Doğrulama başarılı", to: "MUHASEBELESTI", guard: "Hata yok", action: "Muhasebe kaydı at" }],
      processing: [{ step: "Mükerrer kontrol", detail: "msg_id daha önce işlendiyse mesajı reddet", refs: ["R-001"] }],
      config: [{ key: "fas.kesim.saati", default: "17:00", description: "Gün içi kesim saati" }],
      jobs: [{ name: "Gün sonu mutabakat", schedule: "Her gün 18:30", purpose: "TCMB ekstresi ile karşılaştırma" }],
      samples: [{ title: "Geçerli ödeme", kind: "valid", message: "pak.008", content: "<Document>\n  <MsgId>ABC123</MsgId>\n</Document>", expected: "Kabul edilir" }],
      security: [{ item: "Loglama", detail: "Kişisel veri maskelenir" }]
    },
    recommendations: [{ title: "Mükerrer mesaj kontrolü", why: "Aynı mesaj iki kez gelirse çift muhasebe kaydı oluşur", priority: "high", area: "Güvenilirlik" }]
  };
}

function reviseAnswer(prompt) {
  const ins = (prompt.match(/<instructions>\n([\s\S]*?)\n<\/instructions>/) || [, ""])[1];
  const ops = [], notes = [];
  const kv = (str) => { const o = {}; str.split(";").forEach((p) => { const i = p.indexOf("="); if (i > 0) { o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); } }); return o; };
  ins.split("\n").forEach((line) => {
    const t = line.trim(); if (!t) { return; }
    let m;
    if ((m = /^update (\w+) (\S+) (.+)$/.exec(t))) { ops.push({ op: "update", section: m[1], id: m[2], set: kv(m[3]), why: "talimat" }); }
    else if ((m = /^add (\w+) (.+)$/.exec(t))) { ops.push({ op: "add", section: m[1], item: kv(m[2]), why: "talimat" }); }
    else if ((m = /^remove (\w+) (\S+)$/.exec(t))) { ops.push({ op: "remove", section: m[1], id: m[2], why: "talimat" }); }
    else if ((m = /^settext (\S+)=(.+)$/.exec(t))) { ops.push({ op: "setText", target: m[1], value: m[2], why: "talimat" }); }
    else { notes.push("Anlaşılamadı: " + t); }
  });
  return { ops, notes: notes.join(" ") };
}

function install() {
  const real = global.fetch;
  global.fetch = async function (url, opts) {
    if (String(url).indexOf("api.openai.com") < 0) { return real.apply(this, arguments); }
    const body = JSON.parse(opts.body);
    const prompt = body.input[0].content[0].text;
    const stage = prompt.indexOf("<instructions>") > -1 ? "revise" : prompt.indexOf("TECHNICAL DESIGN") > -1 ? "design" : prompt.indexOf("<findings>") > -1 ? "synthesize" : "extract";
    const answer = () => (stage === "extract" ? extractAnswer(prompt) : stage === "synthesize" ? synthAnswer(prompt) : stage === "design" ? designAnswer() : reviseAnswer(prompt));
    state.calls.push({ stage, chars: prompt.length, model: body.model, prompt });
    if (state.failNext > 0) { state.failNext--; return json(500, { error: { message: "boom" } }); }
    if (state.mode === "http500") { return json(500, { error: { message: "boom" } }); }
    if (state.mode === "incomplete") { return json(200, { status: "incomplete", output_text: "" }); }
    if (state.mode === "badjson") { return json(200, { output_text: "bu json değil" }); }
    if (state.mode === "empty") { return json(200, { output_text: "" }); }
    if (state.mode === "fenced") { return json(200, { output_text: "```json\n" + JSON.stringify(answer()) + "\n```" }); }
    if (state.mode === "outputarray") {
      return json(200, { output: [{ content: [{ type: "output_text", text: JSON.stringify(answer()) }] }] });
    }
    return json(200, { output_text: JSON.stringify(answer()) });
  };
  return function uninstall() { global.fetch = real; };
}

function json(status, obj) { return { ok: status < 400, status, json: async () => obj }; }

module.exports = { state, reset, install, extractAnswer, synthAnswer, designAnswer, reviseAnswer };
