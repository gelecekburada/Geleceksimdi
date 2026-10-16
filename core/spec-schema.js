/*
 * SpecSchema — the one description of the analysis document.
 *
 * The same table definitions drive (1) the Word export, (2) reading an edited Word file back,
 * (3) checking what the AI proposes. Because export and import share this list, a document
 * written out and read back gives the same model (tests/spec-roundtrip.test.js proves it).
 *
 * model = {
 *   meta:{title,version,date,author,background}, docs:[{no,name,role,pages}], info:{title,version,date,publisher,purpose},
 *   overview:{purpose,scope,outOfScope}, actors[], assumptions[], messages[], fields[], rules[], constraints[], errors[],
 *   flows[], glossary[], ambiguities[],
 *   accounting:{summary, entries[], receipt[], returns[], reconciliation[]}, approvals[], authorization[], screens[],
 *   notifications[], audit[], nonFunctional[], tests[], gaps[], questions[],
 *   design:{architecture[], interfaces[], tables[], mapping[], states[], transitions[], processing[], config[], jobs[], samples[], security[]},
 *   recommendations[], changeLog[]
 * }
 */
(function (root) {
  "use strict";

  /* column helper: [prop, trLabel, enLabel, widthPercent, kind, extra] */
  function C(p, tr, en, w, kind, extra) { var o = { p: p, tr: tr, en: en, w: w, kind: kind || "text" }; if (extra) { Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); } return o; }
  var ID = C("id", "No", "ID", 5, "id");
  var SRC = C("sources", "Kaynak", "Source", 12, "src");
  var ST = C("status", "Durum", "Status", 9, "status");
  var OR = C("origin", "Tür", "Type", 6, "origin");
  var REFS = C("refs", "İlgili", "Related", 7, "refs");

  var ENUMS = {
    category: { validation: ["Doğrulama", "Validation"], format: ["Biçim", "Format"], business: ["İş kuralı", "Business rule"], timing: ["Zamanlama", "Timing"], limit: ["Limit", "Limit"], security: ["Güvenlik", "Security"], "error-handling": ["Hata yönetimi", "Error handling"], reconciliation: ["Mutabakat", "Reconciliation"], other: ["Diğer", "Other"] },
    priority: { high: ["Yüksek", "High"], medium: ["Orta", "Medium"], low: ["Düşük", "Low"] },
    sampleKind: { valid: ["Geçerli", "Valid"], invalid: ["Hatalı", "Invalid"] },
    origin: { document: ["Doküman", "Document"], proposal: ["Öneri", "Proposal"] },
    status: { pending: ["Onay bekliyor", "Pending approval"], approved: ["Onaylandı", "Approved"], rejected: ["Reddedildi", "Rejected"] }
  };

  /* Table sections. path = where the array lives in the model. */
  var SECTIONS = [
    { key: "actors", path: "actors", prefix: "AK", cols: [ID, C("name", "Aktör", "Actor", 25), C("role", "Rol / sorumluluk", "Role / responsibility", 60), ST] },
    { key: "assumptions", path: "assumptions", prefix: "VR", cols: [ID, C("text", "Varsayım", "Assumption", 85), ST] },
    { key: "messages", path: "messages", prefix: "MSG", src: true, cols: [ID, C("code", "Kod", "Code", 9), C("name", "Ad", "Name", 14), C("direction", "Yön", "Direction", 9), C("purpose", "Amaç", "Purpose", 24), C("trigger", "Tetikleyici", "Trigger", 18), SRC, ST] },
    { key: "fields", path: "fields", prefix: "F", src: true, group: "message", cols: [ID, C("path", "Alan / XML yolu", "Field / XML path", 16), C("name", "Ad", "Name", 8), C("type", "Tip", "Type", 7), C("length", "Uzunluk", "Length", 5), C("occurrence", "Adet", "Occurs", 4), C("presence", "M/O/C", "M/O/C", 4, "presence"), C("allowed", "Değerler", "Values", 8), C("format", "Biçim", "Format", 6), C("description", "Açıklama", "Description", 14), C("rules", "Kurallar", "Rules", 10), SRC, ST] },
    { key: "rules", path: "rules", prefix: "R", src: true, cols: [ID, C("category", "Kategori", "Category", 6, "enum", { enum: "category" }), C("title", "Başlık", "Title", 8), C("statement", "Kural", "Rule", 24, "text", { max: 1200 }), C("condition", "Koşul", "Condition", 12), C("action", "Aksiyon", "Action", 12), C("errorCode", "Hata kodu", "Error code", 5), C("appliesTo", "Uygulandığı yer", "Applies to", 6), SRC, ST] },
    { key: "constraints", path: "constraints", prefix: "C", src: true, cols: [ID, C("kind", "Tür", "Kind", 10), C("statement", "İfade", "Statement", 50, "text", { max: 1000 }), C("value", "Değer", "Value", 12), SRC, ST] },
    { key: "errors", path: "errors", prefix: "E", src: true, cols: [ID, C("code", "Kod", "Code", 8), C("description", "Açıklama", "Description", 28), C("cause", "Neden", "Cause", 20), C("handling", "Ele alma", "Handling", 20), SRC, ST] },
    { key: "flows", path: "flows", prefix: "FL", src: true, cols: [ID, C("name", "Akış", "Flow", 60), SRC, ST] },
    { key: "glossary", path: "glossary", prefix: "G", src: true, cols: [ID, C("term", "Terim", "Term", 18), C("definition", "Tanım", "Definition", 55), SRC, ST] },
    { key: "ambiguities", path: "ambiguities", prefix: "Q", src: true, cols: [ID, C("text", "Belirsiz / çelişkili ifade", "Unclear / contradictory statement", 70), SRC, ST] },

    { key: "states", path: "design.states", prefix: "DU", cols: [ID, C("code", "Durum", "State", 16), C("description", "Açıklama", "Description", 62), C("final", "Son durum mu?", "Final?", 8), ST] },
    { key: "transitions", path: "design.transitions", prefix: "GC", cols: [ID, C("from", "Önceki durum", "From", 13), C("event", "Olay", "Event", 20), C("to", "Sonraki durum", "To", 13), C("guard", "Koşul", "Guard", 18), C("action", "Yapılacak", "Action", 21), ST] },
    { key: "processing", path: "design.processing", prefix: "IS", cols: [ID, C("step", "Adım", "Step", 22), C("detail", "Ayrıntı", "Detail", 55, "text", { max: 1500 }), REFS, ST] },
    { key: "entries", path: "accounting.entries", prefix: "MH", cols: [ID, C("event", "Olay", "Event", 16), C("debit", "Borç", "Debit", 11), C("credit", "Alacak", "Credit", 11), C("amount", "Tutar", "Amount", 10), C("timing", "Zamanlama", "Timing", 11), C("notes", "Not", "Note", 13), OR, REFS, ST] },
    { key: "receipt", path: "accounting.receipt", prefix: "DK", cols: [ID, C("item", "Konu", "Topic", 20), C("detail", "Ayrıntı", "Detail", 50), OR, REFS, ST] },
    { key: "returns", path: "accounting.returns", prefix: "IA", cols: [ID, C("item", "Konu", "Topic", 20), C("detail", "Ayrıntı", "Detail", 50), OR, REFS, ST] },
    { key: "reconciliation", path: "accounting.reconciliation", prefix: "MU", cols: [ID, C("item", "Konu", "Topic", 20), C("detail", "Ayrıntı", "Detail", 50), OR, REFS, ST] },
    { key: "mapping", path: "design.mapping", prefix: "ES", cols: [ID, C("source", "Kaynak (mesaj alanı)", "Source (message field)", 24), C("target", "Hedef (tablo.kolon / sistem)", "Target (table.column / system)", 24), C("transform", "Dönüşüm / kural", "Transformation / rule", 28), REFS, ST] },
    { key: "tables", path: "design.tables", prefix: "T", cols: [ID, C("name", "Tablo", "Table", 20), C("purpose", "Amaç", "Purpose", 40), C("notes", "İndeks / not", "Indexes / note", 25), ST] },
    { key: "architecture", path: "design.architecture", prefix: "MM", cols: [ID, C("name", "Bileşen", "Component", 18), C("responsibility", "Sorumluluk", "Responsibility", 50), C("notes", "Not", "Note", 20), ST] },
    { key: "interfaces", path: "design.interfaces", prefix: "AR", cols: [ID, C("name", "Arayüz", "Interface", 13), C("direction", "Yön", "Direction", 9), C("protocol", "Protokol / biçim", "Protocol / format", 12), C("trigger", "Tetikleyici", "Trigger", 12), C("payload", "İçerik", "Payload", 14), C("auth", "Kimlik doğrulama", "Authentication", 10), C("retry", "Yeniden deneme / hata", "Retry / failure", 14), ST] },
    { key: "config", path: "design.config", prefix: "PR", cols: [ID, C("key", "Parametre", "Parameter", 22), C("default", "Varsayılan", "Default", 14), C("description", "Açıklama", "Description", 50), ST] },
    { key: "jobs", path: "design.jobs", prefix: "ZI", cols: [ID, C("name", "İş", "Job", 22), C("schedule", "Zamanlama", "Schedule", 18), C("purpose", "Amaç", "Purpose", 45), ST] },
    { key: "security", path: "design.security", prefix: "GV", cols: [ID, C("item", "Konu", "Topic", 22), C("detail", "Ayrıntı", "Detail", 63), ST] },
    { key: "samples", path: "design.samples", prefix: "OR", cols: [ID, C("title", "Örnek", "Sample", 14), C("kind", "Tür", "Kind", 7, "enum", { enum: "sampleKind" }), C("message", "Mesaj", "Message", 9), C("content", "İçerik", "Content", 40, "text", { max: 6000, mono: true }), C("expected", "Beklenen sonuç", "Expected result", 20), ST] },
    { key: "approvals", path: "approvals", prefix: "ON", cols: [ID, C("step", "Adım", "Step", 15), C("rule", "Kural", "Rule", 28), C("who", "Kim", "Who", 12), C("condition", "Koşul", "Condition", 14), OR, REFS, ST] },
    { key: "authorization", path: "authorization", prefix: "YT", cols: [ID, C("role", "Rol", "Role", 15), C("screen", "Ekran / işlem", "Screen / action", 22), C("rights", "Haklar", "Rights", 20), C("note", "Not", "Note", 22), OR, ST] },
    { key: "screens", path: "screens", prefix: "EK", cols: [ID, C("name", "Ekran", "Screen", 12), C("purpose", "Amaç", "Purpose", 16), C("fields", "Alanlar", "Fields", 20), C("actions", "Aksiyonlar", "Actions", 12), C("rules", "Kurallar", "Rules", 17), OR, REFS, ST] },
    { key: "notifications", path: "notifications", prefix: "BD", cols: [ID, C("event", "Olay", "Event", 26), C("channel", "Kanal", "Channel", 11), C("to", "Alıcı", "Recipient", 16), C("note", "Not", "Note", 22), OR, ST] },
    { key: "audit", path: "audit", prefix: "DI", cols: [ID, C("item", "Konu", "Topic", 22), C("detail", "Ayrıntı", "Detail", 63), ST] },
    { key: "nonFunctional", path: "nonFunctional", prefix: "FO", cols: [ID, C("item", "Konu", "Topic", 22), C("detail", "Ayrıntı", "Detail", 63), ST] },
    { key: "tests", path: "tests", prefix: "TS", cols: [ID, C("title", "Senaryo", "Scenario", 18), C("steps", "Adımlar", "Steps", 32, "text", { max: 1200 }), C("expected", "Beklenen sonuç", "Expected result", 24), REFS, ST] },
    { key: "gaps", path: "gaps", prefix: "EKS", cols: [ID, C("text", "Boşluk / çelişki", "Gap / contradiction", 68), REFS, ST] },
    { key: "questions", path: "questions", prefix: "AS", cols: [ID, C("question", "Soru", "Question", 38), C("why", "Neden gerekli", "Why it matters", 26), C("owner", "Sorumlu", "Owner", 12), ST] },
    { key: "recommendations", path: "recommendations", prefix: "ON-", cols: [ID, C("title", "Öneri", "Recommendation", 20), C("why", "Gerekçe", "Rationale", 40), C("priority", "Öncelik", "Priority", 8, "enum", { enum: "priority" }), C("area", "Alan", "Area", 12), ST] },
    { key: "changeLog", path: "changeLog", prefix: "", cols: [C("id", "Sürüm", "Version", 8, "id"), C("date", "Tarih", "Date", 12), C("author", "Yazan", "Author", 15), C("summary", "Değişiklik", "Change", 65, "text", { max: 3000 })] }
  ];
  /* recommendations get their own prefix */
  SECTIONS.forEach(function (s) { if (s.key === "recommendations") { s.prefix = "AN"; } });

  /* key/value sections (label | value). */
  var KV = [
    { key: "meta", path: "meta", rows: [["title", "Doküman başlığı", "Document title"], ["version", "Sürüm", "Version"], ["date", "Tarih", "Date"], ["author", "Hazırlayan", "Prepared by"]] },
    { key: "info", path: "info", rows: [["title", "Kaynak doküman başlığı", "Source document title"], ["version", "Kaynak sürümü", "Source version"], ["date", "Kaynak tarihi", "Source date"], ["publisher", "Yayımlayan", "Publisher"], ["purpose", "Kaynak dokümanın amacı", "Source document purpose"]] },
    { key: "overview", path: "overview", rows: [["purpose", "Amaç", "Purpose"], ["scope", "Kapsam", "Scope"], ["outOfScope", "Kapsam dışı", "Out of scope"]] },
    { key: "accountingSummary", path: "accounting", rows: [["summary", "Muhasebeleştirme özeti", "Accounting summary"]] }
  ];

  var DOCS_COLS = [C("no", "No", "No", 8), C("name", "Dosya", "File", 60), C("role", "Rol", "Role", 16), C("pages", "Sayfa", "Pages", 10)];
  var STEP_COLS = [C("no", "Sıra", "No", 6), C("actor", "Aktör", "Actor", 18), C("action", "İşlem", "Action", 56), C("message", "Mesaj", "Message", 14)];
  var COLUMN_COLS = [C("name", "Kolon", "Column", 18), C("type", "Tip", "Type", 14), C("nullable", "Null?", "Null?", 7), C("key", "Anahtar", "Key", 10), C("description", "Açıklama", "Description", 30), C("source", "Kaynak / eşleme", "Source / mapping", 21)];

  /* Heading structure of the document. Strings in `h` are [tr, en]. */
  var LAYOUT = [
    { h: ["Doküman bilgileri ve sürüm", "Document information and version"], items: [{ kv: "meta" }, { special: "docs" }, { kv: "info" }, { sec: "changeLog" }] },
    { h: ["Amaç ve kapsam", "Purpose and scope"], items: [{ kv: "overview" }, { sec: "actors" }, { sec: "assumptions" }] },
    { h: ["Mesaj kataloğu", "Message catalogue"], items: [{ sec: "messages" }] },
    { h: ["Alan tanımları", "Field definitions"], note: ["M: zorunlu, O: opsiyonel, C: koşullu.", "M: mandatory, O: optional, C: conditional."], items: [{ special: "fields" }] },
    { h: ["İş kuralları ve doğrulamalar", "Business rules and validations"], items: [{ sec: "rules" }] },
    { h: ["Kısıtlar ve limitler", "Constraints and limits"], items: [{ sec: "constraints" }] },
    { h: ["Hata kodları", "Error codes"], items: [{ sec: "errors" }] },
    { h: ["Süreç akışları", "Process flows"], items: [{ sec: "flows" }, { special: "steps" }] },
    { h: ["Durum modeli", "State model"], items: [{ sec: "states" }, { sec: "transitions" }] },
    { h: ["İşlem adımları (sunucu tarafı)", "Processing steps (server side)"], items: [{ sec: "processing" }] },
    { h: ["Muhasebe entegrasyonu", "Accounting integration"], items: [{ kv: "accountingSummary" }, { sec: "entries", sub: ["Muhasebe kayıtları", "Accounting entries"] }, { sec: "receipt", sub: ["Dekont", "Receipt (dekont)"] }, { sec: "returns", sub: ["İade işlemleri", "Returns"] }, { sec: "reconciliation", sub: ["Mutabakat", "Reconciliation"] }] },
    { h: ["Mesaj alanı → sistem eşlemesi", "Message field → system mapping"], items: [{ sec: "mapping" }] },
    { h: ["Veri modeli", "Data model"], items: [{ sec: "tables" }, { special: "columns" }] },
    { h: ["Mimari ve arayüzler", "Architecture and interfaces"], items: [{ sec: "architecture", sub: ["Bileşenler", "Components"] }, { sec: "interfaces", sub: ["Arayüzler", "Interfaces"] }] },
    { h: ["Onay akışları", "Approval flows"], items: [{ sec: "approvals" }] },
    { h: ["Rol ve ekran bazlı yetki matrisi", "Role and screen authorization matrix"], items: [{ sec: "authorization" }] },
    { h: ["Ekran gereksinimleri", "Screen requirements"], items: [{ sec: "screens" }] },
    { h: ["Bildirimler", "Notifications"], items: [{ sec: "notifications" }] },
    { h: ["Parametreler ve zamanlanmış işler", "Parameters and scheduled jobs"], items: [{ sec: "config", sub: ["Parametreler", "Parameters"] }, { sec: "jobs", sub: ["Zamanlanmış işler", "Scheduled jobs"] }] },
    { h: ["Güvenlik, denetim izi ve fonksiyonel olmayan gereksinimler", "Security, audit trail and non-functional requirements"], items: [{ sec: "security", sub: ["Güvenlik ve loglama", "Security and logging"] }, { sec: "audit", sub: ["Denetim izi", "Audit trail"] }, { sec: "nonFunctional", sub: ["Fonksiyonel olmayan gereksinimler", "Non-functional requirements"] }] },
    { h: ["Örnek mesajlar", "Sample messages"], items: [{ sec: "samples" }] },
    { h: ["Test senaryoları", "Test scenarios"], items: [{ sec: "tests" }] },
    { h: ["Dokümandaki boşluklar ve belirsizlikler", "Gaps and ambiguities in the document"], items: [{ sec: "gaps", sub: ["Boşluk ve çelişkiler", "Gaps and contradictions"] }, { sec: "ambiguities", sub: ["Belirsiz ifadeler", "Unclear statements"] }] },
    { h: ["Açık sorular", "Open questions"], items: [{ sec: "questions" }] },
    { h: ["Analist önerileri", "Analyst recommendations"], note: ["Kaynak dokümanda olmayan, ancak böyle bir çözümde bulunması önerilen unsurlar.", "Items not in the source document that a solution like this should normally have."], items: [{ sec: "recommendations" }] },
    { h: ["Sözlük", "Glossary"], items: [{ sec: "glossary" }] }
  ];

  var BY_KEY = {};
  SECTIONS.forEach(function (s) { BY_KEY[s.key] = s; });
  var KV_BY_KEY = {};
  KV.forEach(function (k) { KV_BY_KEY[k.key] = k; });

  /* ---------- helpers ---------- */

  function squish(s) { return String(s == null ? "" : s).replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").trim(); }
  function clip(s, max) { s = squish(s); return max && s.length > max ? s.slice(0, max) : s; }
  function lc(s) { return String(s == null ? "" : s).replace(/[İIı]/g, "i").toLowerCase().trim(); }
  function getPath(o, path) { return path.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, path, v) {
    var ks = path.split("."), cur = o;
    for (var i = 0; i < ks.length - 1; i++) { if (!cur[ks[i]] || typeof cur[ks[i]] !== "object") { cur[ks[i]] = {}; } cur = cur[ks[i]]; }
    cur[ks[ks.length - 1]] = v;
  }

  function emptyModel() {
    var m = {
      meta: { title: "", version: "1.0", date: "", author: "", background: "" }, docs: [], info: {},
      overview: { purpose: "", scope: "", outOfScope: "" }, accounting: { summary: "" }, design: {}
    };
    SECTIONS.forEach(function (s) { setPath(m, s.path, []); });
    return m;
  }

  function items(model, key) { var a = getPath(model, BY_KEY[key].path); return Array.isArray(a) ? a : []; }

  function enumValue(enumName, text) {
    var e = ENUMS[enumName], t = lc(text);
    if (!t) { return ""; }
    for (var v in e) { if (lc(v) === t || lc(e[v][0]) === t || lc(e[v][1]) === t) { return v; } }
    return null;
  }
  function enumLabel(enumName, value, lang) { var e = ENUMS[enumName][value]; return e ? e[lang === "en" ? 1 : 0] : value || ""; }

  function presenceValue(v) {
    var s = lc(v);
    if (!s) { return ""; }
    if (/^(m|z|zorunlu|mandatory|required)\b/.test(s) || s === "m") { return "M"; }
    if (/^(c|k|ko[sş]ullu|conditional)\b/.test(s)) { return "C"; }
    if (/^(o|opsiyonel|isteğe|istege|optional)\b/.test(s)) { return "O"; }
    return clip(v, 20);
  }

  function parseRefs(v) {
    if (Array.isArray(v)) { return v.map(function (x) { return clip(x, 20); }).filter(Boolean); }
    return String(v == null ? "" : v).split(/[,;\s]+/).map(function (x) { return x.replace(/^\(|\)$/g, ""); }).filter(Boolean).slice(0, 30);
  }

  /* sources <-> text. One line per source: `D1 s.5 ✓ “quote”` */
  function sourcesToText(list, check, checkPage) {
    return (list || []).map(function (s, i) {
      var mark = i === 0 ? (check === "ok" ? " ✓" : check === "other" ? " ✓(s." + checkPage + ")" : check === "missing" ? " ⚠" : "") : "";
      return "D" + (s.doc || 1) + (s.page ? " s." + s.page : "") + mark + (s.quote ? " “" + s.quote.replace(/[“”]/g, '"') + "”" : "");
    }).join("\n");
  }
  function textToSources(text) {
    var out = { sources: [], check: "none" };
    String(text || "").split("\n").forEach(function (line, i) {
      var m = /^\s*[Dd](\d)\s*(?:s\.?\s*(\d+))?\s*(✓\(s\.(\d+)\)|✓|⚠)?\s*(?:[“"](.*)[”"])?\s*$/.exec(line.trim());
      if (!m) { return; }
      out.sources.push({ doc: parseInt(m[1], 10) === 2 ? 2 : 1, page: m[2] ? parseInt(m[2], 10) : null, quote: clip(m[5] || "", 400) });
      if (i === 0 || out.check === "none") {
        if (m[3] === "✓") { out.check = "ok"; } else if (m[3] && m[3].indexOf("✓(") === 0) { out.check = "other"; out.checkPage = parseInt(m[4], 10); } else if (m[3] === "⚠") { out.check = "missing"; }
      }
    });
    return out;
  }

  /* value -> cell text */
  function cellText(item, col, lang) {
    var v = item[col.p];
    switch (col.kind) {
      case "src": return sourcesToText(item.sources, item.check, item.checkPage);
      case "status": return enumLabel("status", v || "pending", lang);
      case "origin": return enumLabel("origin", v || "proposal", lang);
      case "enum": return enumLabel(col.enum, v, lang);
      case "refs": return (v || []).join(", ");
      case "presence": return v || "";
      default: return v == null ? "" : String(v);
    }
  }

  /* cell text -> value; returns undefined when the text is not understood (caller keeps the old value) */
  function parseCell(text, col, item) {
    switch (col.kind) {
      case "src": { var s = textToSources(text); item.sources = s.sources; item.check = s.check; if (s.checkPage) { item.checkPage = s.checkPage; } else { delete item.checkPage; } return undefined; }
      case "status": { var st = enumValue("status", text); return st || "pending"; }
      case "origin": { var o = enumValue("origin", text); return o || "proposal"; }
      case "enum": { var e = enumValue(col.enum, text); return e === null ? clip(text, 40) : e; }
      case "refs": return parseRefs(text);
      case "presence": return presenceValue(text);
      case "id": return clip(text, 40);
      default: return col.mono ? String(text == null ? "" : text).replace(/\r/g, "").replace(/\s+$/, "").slice(0, col.max || 800) : clip(text, col.max || 800);
    }
  }

  /* One property of raw AI data -> clean value for column c. */
  function coerceValue(c, v) {
    switch (c.kind) {
      case "id": return clip(v, 40);
      case "status": return enumValue("status", v) || "pending";
      case "origin": return enumValue("origin", v) || "proposal";
      case "enum": { var e = enumValue(c.enum, v); return e === null || e === "" ? (c.enum === "category" ? "other" : c.enum === "priority" ? "medium" : "valid") : e; }
      case "refs": return parseRefs(v);
      case "presence": return presenceValue(v);
      default: {
        var t = Array.isArray(v) ? v.map(function (x) { return typeof x === "string" ? x : JSON.stringify(x); }).join(c.mono ? "\n" : ", ") : (v && typeof v === "object" ? JSON.stringify(v) : v);
        return c.mono ? String(t == null ? "" : t).replace(/\s+$/, "").slice(0, c.max || 800) : clip(t, c.max || 800);
      }
    }
  }

  /* Turn raw AI data into a clean item of section `sec`. */
  function coerceItem(sec, raw) {
    if (!raw || typeof raw !== "object") { return null; }
    var it = {}, any = false;
    sec.cols.forEach(function (c) {
      if (c.kind === "src") { return; }
      it[c.p] = coerceValue(c, raw[c.p]);
      if (c.kind === "text" && it[c.p] && c.p !== "id") { any = true; }
    });
    if (!it.status && hasStatus(sec)) { it.status = "pending"; }
    return any ? it : null;
  }

  function coerceSteps(v) {
    return (Array.isArray(v) ? v : []).map(function (s) {
      if (typeof s === "string") { return { actor: "", action: clip(s, 400), message: "" }; }
      return s && typeof s === "object" ? { actor: clip(s.actor, 120), action: clip(s.action, 400), message: clip(s.message, 80) } : null;
    }).filter(function (s) { return s && s.action; });
  }
  function coerceColumns(v) {
    return (Array.isArray(v) ? v : []).map(function (c) {
      if (!c || typeof c !== "object" || !clip(c.name, 80)) { return null; }
      return { name: clip(c.name, 80), type: clip(c.type, 60), nullable: clip(c.nullable === true ? "Evet" : c.nullable === false ? "Hayır" : c.nullable, 12), key: clip(c.key, 40), description: clip(c.description, 400), source: clip(c.source, 300) };
    }).filter(Boolean);
  }

  function hasStatus(sec) { return sec.cols.some(function (c) { return c.kind === "status"; }); }
  function assignIds(model) {
    SECTIONS.forEach(function (s) {
      if (!s.prefix) { return; }
      var list = items(model, s.key), max = 0, re = new RegExp("^" + s.prefix.replace(/[-]/g, "\\-") + "-(\\d+)$");
      list.forEach(function (it) { var m = re.exec(it.id || ""); if (m) { max = Math.max(max, parseInt(m[1], 10)); } });
      list.forEach(function (it) { if (!it.id) { max++; it.id = s.prefix + "-" + (max < 10 ? "00" : max < 100 ? "0" : "") + max; } if (!it.status && hasStatus(s)) { it.status = "pending"; } });
    });
    return model;
  }

  /* Fill a model from the AI's answer. rawRoot uses the same paths as the model. Only listed keys are read. */
  function absorb(model, rawRoot, keys) {
    rawRoot = rawRoot && typeof rawRoot === "object" ? rawRoot : {};
    function pick(path) { return getPath(rawRoot, path); }
    var set = {};
    (keys || SECTIONS.map(function (s) { return s.key; })).forEach(function (k) { set[k] = true; });
    SECTIONS.forEach(function (s) {
      if (!set[s.key] || s.src) { return; }
      var raw = pick(s.path);
      if (!Array.isArray(raw)) { return; }
      var list = [];
      raw.forEach(function (r) {
        var it = coerceItem(s, typeof r === "string" ? textItem(s, r) : r);
        if (!it) { return; }
        if (s.key === "tables") { it.columns = coerceColumns(r.columns); }
        list.push(it);
      });
      setPath(model, s.path, list);
    });
    ["overview", "accounting"].forEach(function (k) {
      var kv = KV_BY_KEY[k === "overview" ? "overview" : "accountingSummary"], raw = pick(k);
      if (!raw || typeof raw !== "object") { return; }
      kv.rows.forEach(function (r) { if (typeof raw[r[0]] === "string" || typeof raw[r[0]] === "number") { model[k][r[0]] = clip(raw[r[0]], 2000); } });
    });
    return model;
  }
  function textItem(sec, text) { var o = {}; var tc = sec.cols.filter(function (c) { return c.kind === "text"; })[0]; if (tc) { o[tc.p] = text; } return o; }

  /* merged findings (spec-model.merge) -> the document model */
  function fromFindings(merged, docs, meta) {
    var m = emptyModel();
    ["messages", "fields", "rules", "constraints", "errors", "flows", "glossary", "ambiguities"].forEach(function (k) {
      m[k] = (merged[k] || []).map(function (it) { return JSON.parse(JSON.stringify(it)); });
    });
    m.info = Object.assign({}, merged.info || {});
    m.docs = (docs || []).map(function (d) { return { no: d.no, name: d.name, role: d.role === "extra" ? "extra" : "main", pages: d.pages || 0 }; });
    m.meta = Object.assign(m.meta, meta || {});
    return assignIds(m);
  }

  var api = {
    fromFindings: fromFindings, coerceValue: coerceValue, SECTIONS: SECTIONS, KV: KV, LAYOUT: LAYOUT, ENUMS: ENUMS, BY_KEY: BY_KEY, KV_BY_KEY: KV_BY_KEY,
    DOCS_COLS: DOCS_COLS, STEP_COLS: STEP_COLS, COLUMN_COLS: COLUMN_COLS,
    emptyModel: emptyModel, items: items, getPath: getPath, setPath: setPath, assignIds: assignIds,
    cellText: cellText, parseCell: parseCell, coerceItem: coerceItem, coerceSteps: coerceSteps, coerceColumns: coerceColumns, absorb: absorb,
    enumValue: enumValue, enumLabel: enumLabel, presenceValue: presenceValue, parseRefs: parseRefs, sourcesToText: sourcesToText, textToSources: textToSources, clip: clip, lc: lc
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; } else { root.SpecSchema = api; }
})(typeof window !== "undefined" ? window : globalThis);
