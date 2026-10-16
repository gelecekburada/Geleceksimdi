/*
 * Page controller for spec-analyzer.html.
 * PDFs are read in the browser (pdf.js); only text goes to /api/spec-analyzer.
 * The analysis lives in one model (SpecSchema); Word files are written and read back with SpecDoc.
 */
(function () {
  "use strict";

  var $ = BATool.$, esc = BATool.esc;
  var S = SpecSchema, M = SpecModel, Doc = SpecDoc, Rv = SpecRevise;

  /* ---------- texts ---------- */

  var DICT = {
    tr: {
      pageTitle: "BAForge AI - Fonksiyonel Analiz Oluşturucu",
      title: "Fonksiyonel Analiz Oluşturucu",
      subtitle: "Spesifikasyon PDF'inizi yükleyin: mesaj yapısı, alan tanımları, kurallar, kısıtlar, muhasebe/dekont/iade, onay ve yetki, ekranlar, veri modeli, durum geçişleri, işlem adımları, örnek mesajlar ve testlerle bir yazılımcının geliştirebileceği Word dokümanı çıkarılır. Word'de düzeltip geri yükleyebilir, ayrıca talimat yazabilirsiniz.",
      h1: "1 · Kaynaklar ve talimatlar",
      privacy: "<b>Gizlilik:</b> PDF dosyanız sunucuya yüklenmez; metni tarayıcınızda okunur. Analiz için yalnızca <b>metin parçaları</b> yapay zekâ servisine (OpenAI) gönderilir. Belge gizli ise kurumunuzun iznini kontrol edin.",
      consent: "Bu belgenin metninin yapay zekâ servisine gönderilmesinde sakınca olmadığını onaylıyorum.",
      zone1: "Ana kaynak (PDF)", zone1Hint: "Örn. TCMB'nin mesaj kılavuzu. Sürükleyip bırakabilirsiniz.",
      zone2: "Ek kaynak (PDF, isteğe bağlı)", zone2Hint: "Kurum içi doküman, önceki sürüm ya da örnek mesajlar. Çıkan satırlarda hangi dokümandan geldiği etiketlenir (D1, D2).",
      zoneW: "Düzenlediğiniz analiz (Word)", zoneWHint: "Bu ekrandan aldığınız Word dosyasını düzeltip geri yükleyin. Hücre değişiklikleri, eklenen ve silinen satırlar okunur.",
      choose: "Dosya seç", remove: "Kaldır",
      bgTitle: "Kurum bağlamı", bgTemplate: "Şablonu ekle",
      bgPlaceholder: "Dokümanda olmayan ama analiz için gereken bilgiler: muhasebe sistemi, teknoloji, mevcut ekran/yetki yapısı, iade süreci...",
      bgTemplateText: "Kurum / birim:\nMuhasebe sistemi ve hesap planı yapısı:\nTeknoloji (dil, veritabanı, kuyruk/ESB):\nGelen mesajların işlenmesi (otomatik mi, operatör müdahalesi var mı):\nİade süreci (kim başlatır, onay gerekir mi):\nMevcut ekranlar ve yetki modeli:\nÖnemli limitler / kesim saatleri:",
      insTitle: "Değişiklik talimatları", insHint: "Her satıra bir talimat yazın. Örn: \"F-012 alanını zorunlu yap\", \"İade için ikinci onay kuralı ekle\", \"R-004 kuralını sil\".",
      insPlaceholder: "Örn:\nMsgId alanı zorunlu olsun\nİade (H31) mesajı için muhasebe kaydını tersine çevir\nYetki matrisine Denetçi rolü ekle (sadece görüntüleme)",
      docTitle: "Doküman başlığı", docAuthor: "Hazırlayan",
      analyze: "PDF'i analiz et", apply: "Talimatları uygula", download: "Word indir", clearAll: "Baştan başla",
      progress: "İlerleme", cancel: "İptal", retry: "Eksik kısımları yeniden dene",
      accept: "Seçilenleri uygula", discard: "Vazgeç",
      result: "Analiz", search: "Ara", onlyPending: "Yalnızca onay bekleyen satırlar",
      howTitle: "Nasıl çalışır?",
      howList: "<li>PDF'ler tarayıcıda metne çevrilir ve bölümlere ayrılır; her bölümden mesajlar, alanlar, kurallar, kısıtlar, hata kodları ve akışlar çıkarılır. Her bulgunun yanında <b>sayfa numarası ve PDF'ten kısa alıntı</b> bulunur; alıntı PDF metninde gerçekten aranır (✓ bulundu, ⚠ bulunamadı).</li><li>Sonra dokümanda <b>olmayan</b> konular (muhasebe, dekont, iade, onay, yetki, ekranlar, veri modeli, durum geçişleri, işlem adımları, örnek mesajlar, testler, öneriler) yapay zekâ tarafından <b>öneri</b> olarak hazırlanır ve ayrı etiketlenir.</li><li>Her satırı <b>Onaylandı / Reddedildi</b> olarak işaretleyebilirsiniz. Reddedilenler Word'e yazılmaz.</li><li>Word'de düzeltip geri yükleyebilirsiniz; değişiklikler okunur, ne değiştiği gösterilir. \"Değişiklik talimatları\" kutusuna yazdıklarınız yapay zekâ tarafından değişiklik önerisine çevrilir; siz tek tek onaylarsınız.</li><li>Her değişiklikte sürüm numarası artar ve Word'ün sonundaki değişiklik kaydına eklenir.</li><li><b>Önemli:</b> Yapay zekâ hata yapabilir. Kaynak sayfası ve alıntı bunun için vardır; ⚠ işaretli ve \"Öneri\" etiketli satırları mutlaka gözden geçirin.</li>",
      reading: "PDF okunuyor…", readOk: "{p} sayfa, {c} karakter", scanned: "Bu PDF'ten çok az metin çıktı; taranmış (görüntü) bir belge olabilir. Metin katmanı olan bir PDF kullanın.",
      notPdf: "Yalnızca PDF dosyası seçin.", notDocx: "Yalnızca Word (.docx) dosyası seçin.", tooBig: "Dosya çok büyük (en fazla 60 MB).",
      needConsent: "Devam etmek için gizlilik onayını işaretleyin.", needPdf: "Önce ana kaynak PDF'ini seçin.",
      confirmOverwrite: "Mevcut analiz silinip PDF'ten yeniden oluşturulacak. Devam edilsin mi?",
      stRead: "PDF'ler okunuyor", stChunk: "{d} · bölüm {i}/{n} (sayfa {a}–{b})", stBusiness: "İş analizi ve muhasebe/onay/yetki önerileri", stDesign: "Teknik tasarım ve analist önerileri", stMerge: "Bulgular birleştiriliyor ve alıntılar doğrulanıyor", stDone: "Tamamlandı",
      failedChunks: "Okunamayan bölümler: {list}. Diğer kısımlar hazır; \"Eksik kısımları yeniden dene\" ile tamamlayabilirsiniz.",
      limitHit: "Günlük yapay zekâ limitinize ulaşıldı ya da giriş gerekiyor: {msg}",
      partialReady: "Kaynaktan çıkarma bitti ({m} mesaj, {f} alan, {r} kural). Öneriler (muhasebe, onay, yetki, teknik tasarım) arka planda hazırlanıyor…",
      analyzed: "Analiz hazır: {m} mesaj, {f} alan, {r} kural. Önerilen satırlar \"Öneri\" etiketlidir; gözden geçirip onaylayın.",
      noFindings: "PDF'ten hiçbir bulgu çıkarılamadı. Dosyanın metin içerdiğinden emin olun.",
      cancelled: "İptal edildi.", stepFailed: "Bu adım tamamlanamadı: {msg}",
      applying: "Talimatlar yapay zekâya gönderiliyor…", needModel: "Önce bir analiz oluşturun ya da Word dosyası yükleyin.", needIns: "Talimat yazın.",
      pendOps: "Önerilen değişiklikler ({n})", pendWord: "Word dosyasındaki değişiklikler", pendWordNone: "Word dosyasında bu ekrandaki analizden farklı bir şey bulunamadı.",
      pendWordFound: "{a} yeni, {c} değişen, {r} silinen satır bulundu. Kabul ederseniz analiz bu dosyadaki haline getirilir.",
      invalidOps: "{n} öneri uygulanamadı (var olmayan satır, geçersiz alan gibi):", aiNotes: "Yapay zekâ notu: ",
      opUpdate: "değişiklik", opAdd: "ekleme", opRemove: "silme", opText: "metin",
      chgAdd: "Eklendi", chgRemove: "Silindi", chgChange: "Değişti",
      appliedOps: "{n} değişiklik uygulandı. Sürüm {v}.", wordApplied: "Word dosyası içe aktarıldı. Sürüm {v}.",
      wordNotSpec: "Bu dosya bu ekranın ürettiği bir analiz dokümanına benzemiyor (tanınan tablo yok).", wordBad: "Word dosyası okunamadı: {msg}", wordUnknown: "{n} tablo tanınmadı ve atlandı.",
      wordLog: "Word dosyasından içe aktarıldı ({file}): {a} eklenen, {c} değişen, {r} silinen satır.", wordFirst: "Word dosyasından yüklendi ({file}).",
      insLog: "Talimat: {ins} ({n} değişiklik uygulandı)", firstLog: "İlk sürüm: PDF'ten oluşturuldu ({docs}).",
      restored: "Önceki çalışmanız yüklendi ({date}).", cleared: "Temizlendi.",
      tNum: "Satır", tApproved: "Onaylanan", tPending: "Onay bekleyen", tRejected: "Reddedilen", tUnverified: "Alıntısı doğrulanamayan", tProposal: "Öneri / ekleme",
      tabOverview: "Özet", tabSource: "Kaynaktan çıkanlar", tabBusiness: "İş analizi", tabTech: "Teknik tasarım", tabReview: "Boşluk, soru, öneri", tabHistory: "Sürüm geçmişi",
      approveAll: "Tümünü onayla", noRows: "Kayıt yok.", sourceDoc: "Doküman", sourceProp: "Öneri", message: "Mesaj",
      stPending: "Onay bekliyor", stApproved: "Onaylandı", stRejected: "Reddedildi",
      steps: "Adımlar", columns: "Kolonlar", docsHdr: "Kaynak dokümanlar", ovHdr: "Doküman bilgileri",
      downloaded: "Word dosyası indirildi: {name}", saveFail: "Çalışma bu tarayıcıda saklanamadı (Word'ü indirmeyi unutmayın).",
      mainRole: "ana kaynak", extraRole: "ek doküman"
    },
    en: {
      pageTitle: "BAForge AI - Functional Spec Builder",
      title: "Functional Spec Builder",
      subtitle: "Upload your specification PDF: a Word document a developer can build from is produced, with message structure, field definitions, rules, constraints, accounting/receipt/returns, approvals and authorization, screens, data model, state transitions, processing steps, sample messages and tests. Correct it in Word and upload it back, or write instructions.",
      h1: "1 · Sources and instructions",
      privacy: "<b>Privacy:</b> your PDF is not uploaded; its text is read in your browser. Only <b>text parts</b> are sent to the AI service (OpenAI) for analysis. If the document is confidential, check your organization's permission.",
      consent: "I confirm that sending this document's text to the AI service is acceptable.",
      zone1: "Main source (PDF)", zone1Hint: "E.g. the central bank's message guide. You can drag and drop.",
      zone2: "Supporting source (PDF, optional)", zone2Hint: "Internal document, earlier version or sample messages. Rows show which document they came from (D1, D2).",
      zoneW: "Your edited analysis (Word)", zoneWHint: "Upload the Word file from this screen after correcting it. Changed cells, added and deleted rows are read.",
      choose: "Choose file", remove: "Remove",
      bgTitle: "Your institution context", bgTemplate: "Insert template",
      bgPlaceholder: "Facts the document does not contain but the analysis needs: accounting system, technology, existing screens/authorization, returns process...",
      bgTemplateText: "Institution / unit:\nAccounting system and chart-of-accounts structure:\nTechnology (language, database, queue/ESB):\nHow incoming messages are processed (automatic or operator involved):\nReturns process (who starts it, approval needed):\nExisting screens and authorization model:\nImportant limits / cut-off times:",
      insTitle: "Change instructions", insHint: "One instruction per line. E.g. \"make field F-012 mandatory\", \"add a second approval rule for returns\", \"delete rule R-004\".",
      insPlaceholder: "E.g.:\nMake the MsgId field mandatory\nFor the return message, reverse the accounting entry\nAdd an Auditor role (view only) to the authorization matrix",
      docTitle: "Document title", docAuthor: "Prepared by",
      analyze: "Analyze the PDF", apply: "Apply instructions", download: "Download Word", clearAll: "Start over",
      progress: "Progress", cancel: "Cancel", retry: "Retry the missing parts",
      accept: "Apply selected", discard: "Discard",
      result: "Analysis", search: "Search", onlyPending: "Only rows waiting for approval",
      howTitle: "How does it work?",
      howList: "<li>PDFs are turned into text in your browser and cut into sections; messages, fields, rules, constraints, error codes and flows are extracted from each. Every finding carries the <b>page number and a short quote from the PDF</b>; the quote is searched in the PDF text (✓ found, ⚠ not found).</li><li>Then topics the document does <b>not</b> contain (accounting, receipt, returns, approvals, authorization, screens, data model, state transitions, processing steps, sample messages, tests, recommendations) are prepared by the AI as <b>proposals</b> and labelled separately.</li><li>Mark each row <b>Approved / Rejected</b>. Rejected rows are not written to Word.</li><li>Correct the Word file and upload it back; changes are read and shown. What you write in the \"Change instructions\" box is turned into proposed changes by the AI; you accept them one by one.</li><li>Every change raises the version number and is added to the change log at the end of the Word file.</li><li><b>Important:</b> the AI can make mistakes. The source page and quote exist for that; always review rows marked ⚠ and labelled \"Proposal\".</li>",
      reading: "Reading the PDF…", readOk: "{p} pages, {c} characters", scanned: "Very little text came out of this PDF; it may be a scanned (image) document. Use a PDF with a text layer.",
      notPdf: "Choose a PDF file.", notDocx: "Choose a Word (.docx) file.", tooBig: "The file is too large (60 MB max).",
      needConsent: "Tick the privacy confirmation to continue.", needPdf: "Choose the main source PDF first.",
      confirmOverwrite: "The current analysis will be deleted and rebuilt from the PDF. Continue?",
      stRead: "Reading the PDFs", stChunk: "{d} · section {i}/{n} (pages {a}–{b})", stBusiness: "Business analysis and accounting/approval/authorization proposals", stDesign: "Technical design and analyst recommendations", stMerge: "Merging findings and verifying quotes", stDone: "Done",
      failedChunks: "Sections that could not be read: {list}. The rest is ready; use \"Retry the missing parts\" to complete it.",
      limitHit: "Your daily AI limit was reached or you need to sign in: {msg}",
      partialReady: "Source extraction finished ({m} messages, {f} fields, {r} rules). Proposals (accounting, approvals, authorization, technical design) are being prepared in the background…",
      analyzed: "Analysis ready: {m} messages, {f} fields, {r} rules. Proposed rows are labelled \"Proposal\"; review and approve them.",
      noFindings: "No findings could be extracted from the PDF. Make sure the file contains text.",
      cancelled: "Cancelled.", stepFailed: "This step could not be completed: {msg}",
      applying: "Sending the instructions to the AI…", needModel: "Create an analysis first or upload a Word file.", needIns: "Write an instruction.",
      pendOps: "Proposed changes ({n})", pendWord: "Changes found in the Word file", pendWordNone: "Nothing in the Word file differs from the analysis on screen.",
      pendWordFound: "{a} new, {c} changed and {r} deleted rows were found. If you accept, the analysis becomes what this file says.",
      invalidOps: "{n} proposals could not be applied (unknown row, invalid field and similar):", aiNotes: "AI note: ",
      opUpdate: "change", opAdd: "addition", opRemove: "removal", opText: "text",
      chgAdd: "Added", chgRemove: "Deleted", chgChange: "Changed",
      appliedOps: "{n} changes applied. Version {v}.", wordApplied: "Word file imported. Version {v}.",
      wordNotSpec: "This file does not look like an analysis document produced by this screen (no recognised table).", wordBad: "The Word file could not be read: {msg}", wordUnknown: "{n} tables were not recognised and were skipped.",
      wordLog: "Imported from Word file ({file}): {a} added, {c} changed, {r} deleted rows.", wordFirst: "Loaded from Word file ({file}).",
      insLog: "Instructions: {ins} ({n} changes applied)", firstLog: "First version: built from PDF ({docs}).",
      restored: "Your previous work was restored ({date}).", cleared: "Cleared.",
      tNum: "Rows", tApproved: "Approved", tPending: "Pending", tRejected: "Rejected", tUnverified: "Quote not verified", tProposal: "Proposal / addition",
      tabOverview: "Summary", tabSource: "From the source", tabBusiness: "Business analysis", tabTech: "Technical design", tabReview: "Gaps, questions, recommendations", tabHistory: "Version history",
      approveAll: "Approve all", noRows: "No records.", sourceDoc: "Document", sourceProp: "Proposal", message: "Message",
      stPending: "Pending approval", stApproved: "Approved", stRejected: "Rejected",
      steps: "Steps", columns: "Columns", docsHdr: "Source documents", ovHdr: "Document information",
      downloaded: "Word file downloaded: {name}", saveFail: "The work could not be stored in this browser (remember to download the Word file).",
      mainRole: "main source", extraRole: "supporting document"
    }
  };

  var D = BATool.applyI18n(DICT);
  var LANG = BATool.lang();
  function t(k, v) {
    var s = D[k] != null ? D[k] : k;
    if (v) { Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); }); }
    return s;
  }

  /* ---------- state ---------- */

  var state = {
    slots: { 1: null, 2: null },     // { name, pages:[{n,text}], chars }
    model: null,
    pending: null,                   // { kind: "ops"|"word", ... }
    run: null,                       // analysis run (kept for retry)
    tab: "overview",
    busy: false,
    abort: null
  };

  var TABS = [
    { id: "overview", label: "tabOverview" },
    { id: "source", label: "tabSource", secs: ["messages", "fields", "rules", "constraints", "errors", "flows", "glossary", "ambiguities"] },
    { id: "business", label: "tabBusiness", secs: ["actors", "assumptions", "entries", "receipt", "returns", "reconciliation", "approvals", "authorization", "screens", "notifications", "audit", "nonFunctional", "tests"] },
    { id: "tech", label: "tabTech", secs: ["states", "transitions", "processing", "mapping", "tables", "architecture", "interfaces", "config", "jobs", "security", "samples"] },
    { id: "review", label: "tabReview", secs: ["gaps", "questions", "recommendations"] },
    { id: "history", label: "tabHistory", secs: ["changeLog"] }
  ];

  var LABELS = { actors: ["Aktörler", "Actors"], assumptions: ["Varsayımlar", "Assumptions"], states: ["Durumlar", "States"], transitions: ["Durum geçişleri", "State transitions"], changeLog: ["Değişiklik kaydı", "Change log"] };
  function secLabel(key) { return LABELS[key] ? LABELS[key][LANG === "en" ? 1 : 0] : Rv.sectionLabel(key, LANG); }

  function status(kind, msg) { BATool.status(kind, msg); }
  function warn(list) { BATool.warnings(list); }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* ---------- saving the work in this browser (IndexedDB; the model can be large) ---------- */

  var DB = { name: "baforge-spec", store: "work" };
  function idb(fn) {
    return new Promise(function (resolve, reject) {
      try {
        var rq = indexedDB.open(DB.name, 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore(DB.store); };
        rq.onerror = function () { reject(rq.error); };
        rq.onsuccess = function () {
          var tx = rq.result.transaction(DB.store, "readwrite"), st = tx.objectStore(DB.store), out = fn(st);
          tx.oncomplete = function () { resolve(out && out.result !== undefined ? out.result : undefined); };
          tx.onerror = function () { reject(tx.error); };
        };
      } catch (e) { reject(e); }
    });
  }
  var saveTimer = null;
  function saveNow() {
    clearTimeout(saveTimer);
    if (!state.model) { return; }
    idb(function (st) { return st.put({ model: state.model, savedAt: new Date().toISOString() }, "current"); }).catch(function () { /* storage may be unavailable (private window) */ });
  }
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); }
  function load() { return idb(function (st) { return st.get("current"); }).catch(function () { return null; }); }
  function wipe() { return idb(function (st) { return st.delete("current"); }).catch(function () {}); }

  /* ---------- reading files ---------- */

  var pdfjs = null;
  function loadPdfJs() {
    if (pdfjs) { return Promise.resolve(pdfjs); }
    return import("/vendor/pdfjs/pdf.min.mjs").then(function (m) {
      m.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
      pdfjs = m; return m;
    });
  }

  function readPdf(file, onProgress) {
    return Promise.all([loadPdfJs(), file.arrayBuffer()]).then(function (r) {
      var lib = r[0];
      return lib.getDocument({ data: new Uint8Array(r[1]), isEvalSupported: false }).promise.then(function (doc) {
        var pages = [], chars = 0, i = 0;
        function next() {
          i++;
          if (i > doc.numPages) { return Promise.resolve({ pages: pages, chars: chars, count: doc.numPages }); }
          return doc.getPage(i).then(function (page) {
            return page.getTextContent().then(function (tc) {
              var items = tc.items.filter(function (it) { return typeof it.str === "string"; }).map(function (it) { return { str: it.str, x: it.transform[4], y: it.transform[5], w: it.width }; });
              var text = M.pageTextFromItems(items);
              chars += text.length; pages.push({ n: i, text: text });
              if (onProgress) { onProgress(i, doc.numPages); }
              page.cleanup();
            });
          }).then(next);
        }
        return next();
      });
    });
  }

  function slotUi(slot) {
    var s = state.slots[slot];
    $("name" + slot).textContent = s ? s.name : "";
    $("meta" + slot).textContent = s ? t("readOk", { p: s.count, c: s.chars }) : "";
    $("warn" + slot).textContent = s && s.chars < 40 * s.count ? t("scanned") : "";
    var clr = document.querySelector('[data-clear="' + slot + '"]'); if (clr) { clr.hidden = !s; }
    refreshButtons();
  }

  function pickPdf(slot, file) {
    if (!file) { return; }
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") { status("error", t("notPdf")); return; }
    if (file.size > 60 * 1024 * 1024) { status("error", t("tooBig")); return; }
    $("name" + slot).textContent = file.name; $("meta" + slot).textContent = t("reading"); $("warn" + slot).textContent = "";
    readPdf(file, function (i, n) { $("meta" + slot).textContent = t("reading") + " " + i + "/" + n; }).then(function (r) {
      state.slots[slot] = { name: file.name, pages: r.pages, chars: r.chars, count: r.count };
      slotUi(slot);
      if (slot === 1 && !$("metaTitle").value) { $("metaTitle").value = file.name.replace(/\.pdf$/i, ""); }
      status("", "");
    }).catch(function (e) {
      state.slots[slot] = null; slotUi(slot);
      status("error", t("stepFailed", { msg: (e && e.message) || "PDF" }));
    });
  }

  function pickWord(file) {
    if (!file) { return; }
    if (!/\.docx$/i.test(file.name)) { status("error", t("notDocx")); return; }
    $("nameW").textContent = file.name; $("metaW").textContent = t("reading"); $("warnW").textContent = "";
    file.arrayBuffer().then(function (ab) { return DocxLite.read(new Uint8Array(ab)); }).then(function (blocks) {
      var imp = Doc.fromBlocks(blocks, state.model);
      if (!Object.keys(imp.found).length) { $("metaW").textContent = ""; status("error", t("wordNotSpec")); return; }
      var merged = Doc.applyImport(state.model, imp);
      var diff = state.model ? Rv.diffModels(state.model, merged, LANG) : null;
      $("metaW").textContent = "";
      state.pending = { kind: "word", model: merged, diff: diff, file: file.name };
      var w = [];
      imp.warnings.forEach(function (x) { if (x.code === "unknown_tables") { w.push(t("wordUnknown", { n: x.count })); } });
      warn(w); status("", "");
      renderPending();
    }).catch(function (e) {
      $("metaW").textContent = ""; status("error", t("wordBad", { msg: (e && e.message) || "" }));
    });
  }

  /* ---------- AI calls ---------- */

  function callApi(body, signal) {
    return fetch("/api/spec-analyzer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ language: LANG }, body)), signal: signal }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.error || ("HTTP " + r.status)); e.status = r.status; e.code = j.code || ""; throw e; }
        if (j.result && typeof j.result === "object") { Object.defineProperty(j.result, "_partial", { value: !!j.partial, enumerable: false }); }
        return j.result;
      });
    });
  }
  function isFatal(e) { return e && e.code !== "upstream" && (e.status === 401 || e.status === 403 || e.status === 429 || e.status === 500 && /anahtar|key/i.test(e.message) || e.status === 503); }
  function isSplittable(e) { return e && (["incomplete", "bad_json", "too_long", "timeout", "empty"].indexOf(e.code) > -1 || e.status === 422 || e.status === 413 || e.status === 504); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* One slice -> a list of normalized findings. A slice the AI cannot finish is cut in two. */
  function extractSlice(docNo, role, label, chunk, signal, depth) {
    var attempts = 0;
    function go() {
      attempts++;
      return callApi({ stage: "extract", docLabel: label, docNo: docNo, docRole: role, from: chunk.from, to: chunk.to, text: chunk.text, context: chunk.context }, signal).then(function (raw) {
        var own = [M.normalizeFindings(raw, docNo)];
        /* the answer came back cut off: keep what was read, and read the two halves again to fill the gap */
        if (raw && raw._partial && (depth || 0) < 2) {
          var halves = M.splitChunk(chunk);
          if (halves) {
            return extractSlice(docNo, role, label, halves[0], signal, (depth || 0) + 1).then(function (a) {
              return extractSlice(docNo, role, label, halves[1], signal, (depth || 0) + 1).then(function (b) { return own.concat(a, b); });
            }).catch(function (e) { if (isFatal(e) || (signal && signal.aborted)) { throw e; } return own; });
          }
        }
        return own;
      }).catch(function (e) {
        if (signal && signal.aborted) { throw e; }
        if (isFatal(e)) { throw e; }
        if (isSplittable(e) && (depth || 0) < 3) {
          var halves = M.splitChunk(chunk);
          if (halves) {
            return extractSlice(docNo, role, label, halves[0], signal, (depth || 0) + 1).then(function (a) {
              return extractSlice(docNo, role, label, halves[1], signal, (depth || 0) + 1).then(function (b) { return a.concat(b); });
            });
          }
        }
        if (attempts < 4) { return sleep(1500 * attempts).then(go); }
        throw e;
      });
    }
    return go();
  }

  function pool(items, limit, worker) {
    var i = 0, active = 0, failed = null;
    return new Promise(function (resolve) {
      function pump() {
        if (failed || (i >= items.length && active === 0)) { if (active === 0) { resolve(); } return; }
        while (active < limit && i < items.length && !failed) {
          (function (idx) {
            active++;
            worker(items[idx], idx).catch(function (e) { if (isFatal(e) || (state.abort && state.abort.signal.aborted)) { failed = e; } }).then(function () { active--; pump(); });
          })(i++);
        }
      }
      pump();
    }).then(function () { if (failed) { throw failed; } });
  }

  /* ---------- the analysis ---------- */

  function setProgress(done, total) { $("bar").style.width = (total ? Math.round(100 * done / total) : 0) + "%"; }
  function drawProgress() {
    var run = state.run; if (!run) { return; }
    var rows = [];
    run.jobs.forEach(function (j) {
      var mark = j.status === "done" ? '<span class="ok">✓</span>' : j.status === "failed" ? '<span class="bad">✗</span>' : j.status === "running" ? '<span class="run">…</span>' : "·";
      rows.push("<li>" + mark + " " + esc(t("stChunk", { d: "D" + j.docNo, i: j.index, n: j.of, a: j.chunk.from, b: j.chunk.to })) + (j.error ? ' <span class="bad">— ' + esc(j.error) + "</span>" : "") + "</li>");
    });
    [["business", "stBusiness"], ["design", "stDesign"]].forEach(function (p) {
      var st = run[p[0]]; var mark = st === "done" ? '<span class="ok">✓</span>' : st === "failed" ? '<span class="bad">✗</span>' : st === "running" ? '<span class="run">…</span>' : "·";
      rows.push("<li>" + mark + " " + esc(t(p[1])) + (run[p[0] + "Error"] ? ' <span class="bad">— ' + esc(run[p[0] + "Error"]) + "</span>" : "") + "</li>");
    });
    $("plist").innerHTML = rows.join("");
    var total = run.jobs.length + 2, done = run.jobs.filter(function (j) { return j.status === "done"; }).length + (run.business === "done" ? 1 : 0) + (run.design === "done" ? 1 : 0);
    setProgress(done, total);
  }

  function docsLine() {
    return [1, 2].filter(function (n) { return state.slots[n]; }).map(function (n) { return n + ": " + state.slots[n].name + " (" + (n === 1 ? "main" : "supporting") + ", " + state.slots[n].count + " pages)"; }).join("; ");
  }

  function startRun() {
    var run = { jobs: [], business: "", design: "", findings: null, model: null, signal: null };
    [1, 2].forEach(function (n) {
      var s = state.slots[n]; if (!s) { return; }
      var chunks = M.buildChunks(s.pages, { maxChars: 6000, overlap: 600 });
      chunks.forEach(function (c, i) { run.jobs.push({ docNo: n, role: n === 1 ? "main" : "extra", label: s.name, chunk: c, index: i + 1, of: chunks.length, status: "pending", findings: null, error: "" }); });
    });
    return run;
  }

  function analyze() {
    if (state.busy) { return; }
    if (!$("consent").checked) { status("error", t("needConsent")); return; }
    if (!state.slots[1]) { status("error", t("needPdf")); return; }
    var resume = state.run && state.run.retry;
    if (!resume) {
      if (state.model && !window.confirm(t("confirmOverwrite"))) { return; }
      state.run = startRun();
    }
    state.run.retry = false;
    var run = state.run;
    if (!run.jobs.length) { status("error", t("noFindings")); return; }

    state.busy = true; state.abort = new AbortController(); var signal = state.abort.signal;
    $("progressCard").hidden = false; $("btnRetry").hidden = true; $("btnCancel").hidden = false;
    status("", ""); warn([]); refreshButtons(); drawProgress();

    var todo = run.jobs.filter(function (j) { return j.status !== "done"; });
    pool(todo, 12, function (job) {
      job.status = "running"; job.error = ""; drawProgress();
      return extractSlice(job.docNo, job.role, job.label, job.chunk, signal, 0).then(function (f) { job.findings = f; job.status = "done"; drawProgress(); })
        .catch(function (e) { job.status = "failed"; job.error = e && e.message || "error"; drawProgress(); throw e; });
    }).then(function () {
      if (signal.aborted) { throw new Error("aborted"); }
      var failed = run.jobs.filter(function (j) { return j.status !== "done"; });
      if (failed.length === run.jobs.length) { throw new Error(t("noFindings")); }
      return failed;
    }).then(function (failed) {
      /* merge in document order, check the quotes against the real PDF text */
      var all = [];
      run.jobs.forEach(function (j) { if (j.findings) { all = all.concat(j.findings); } });
      var merged = M.merge(all);
      var docPages = {};
      [1, 2].forEach(function (n) { if (state.slots[n]) { docPages[n] = {}; state.slots[n].pages.forEach(function (p) { docPages[n][p.n] = p.text; }); } });
      M.annotate(merged, docPages);
      var docs = [1, 2].filter(function (n) { return state.slots[n]; }).map(function (n) { return { no: n, name: state.slots[n].name, role: n === 1 ? "main" : "extra", pages: state.slots[n].count }; });
      var meta = { title: $("metaTitle").value.trim() || (merged.info && merged.info.title) || state.slots[1].name.replace(/\.pdf$/i, ""), author: $("metaAuthor").value.trim(), date: today(), version: "1.0", background: $("background").value.trim() };
      if (!state.model || !run.model) { run.model = S.fromFindings(merged, docs, meta); } else { /* retry: keep later sections, refresh findings */
        var fresh = S.fromFindings(merged, docs, meta);
        ["messages", "fields", "rules", "constraints", "errors", "flows", "glossary", "ambiguities"].forEach(function (k) { run.model[k] = fresh[k]; });
        run.model.info = fresh.info;
      }
      state.model = run.model;
      if (!S.items(state.model, "messages").length && !S.items(state.model, "rules").length && !S.items(state.model, "fields").length) { throw new Error(t("noFindings")); }
      run.failedList = failed.map(function (j) { return "D" + j.docNo + " s." + j.chunk.from + "–" + j.chunk.to; });
      /* the source findings are ready: show them now, then prepare the proposals in parallel */
      addFirstLogIfNeeded(); state.tab = "source"; render(); saveNow();
      status("", t("partialReady", { m: S.items(state.model, "messages").length, f: S.items(state.model, "fields").length, r: S.items(state.model, "rules").length }));
      var settle = function (pr) { return pr.then(function () { return null; }, function (e) { if (signal.aborted || isFatal(e)) { throw e; } return e; }); };
      return Promise.all([settle(stageBusiness(run, signal)), settle(stageDesign(run, signal))]).then(function (errs) {
        S.assignIds(state.model);
        if (errs.some(Boolean)) { var f = errs.filter(Boolean)[0]; throw f; }
        finishRun(run);
      });
    }).catch(function (e) {
      if (signal.aborted) { status("", t("cancelled")); } else if (isFatal(e)) { status("error", t("limitHit", { msg: e.message })); } else { status("error", t("stepFailed", { msg: e && e.message })); }
      if (state.model) { addFirstLogIfNeeded(); render(); save(); }
      $("btnRetry").hidden = false; run.retry = true;
    }).then(function () {
      state.busy = false; state.abort = null; $("btnCancel").hidden = true; drawProgress(); refreshButtons();
    });
  }

  function stageBusiness(run, signal) {
    if (run.business === "done") { return Promise.resolve(); }
    run.business = "running"; run.businessError = ""; drawProgress();
    var c = M.compactForSynthesis(state.model, 60000);
    return callApi({ stage: "synthesize", docs: docsLine(), background: $("background").value, summary: c.text, omitted: c.omitted.join("; ") }, signal).then(function (raw) {
      S.absorb(state.model, raw, ["actors", "assumptions", "entries", "receipt", "returns", "reconciliation", "approvals", "authorization", "screens", "notifications", "audit", "nonFunctional", "tests", "gaps", "questions"]);
      S.assignIds(state.model); run.business = "done"; drawProgress();
    }).catch(function (e) { run.business = "failed"; run.businessError = e && e.message; drawProgress(); throw e; });
  }

  function stageDesign(run, signal) {
    if (run.design === "done") { return Promise.resolve(); }
    run.design = "running"; run.designError = ""; drawProgress();
    var c = M.compactForSynthesis(state.model, 60000), b = "";
    return callApi({ stage: "design", docs: docsLine(), background: $("background").value, summary: c.text, omitted: c.omitted.join("; ") }, signal).then(function (raw) {
      S.absorb(state.model, raw, ["states", "transitions", "processing", "mapping", "tables", "architecture", "interfaces", "config", "jobs", "security", "samples", "recommendations"]);
      S.assignIds(state.model); run.design = "done"; drawProgress();
    }).catch(function (e) { run.design = "failed"; run.designError = e && e.message; drawProgress(); throw e; });
  }

  function addFirstLogIfNeeded() {
    if (state.model && !(state.model.changeLog || []).length) {
      state.model.changeLog = [Rv.logEntry(state.model, t("firstLog", { docs: docsLine() }), state.model.meta.author, today())];
      state.model.changeLog[0].id = state.model.meta.version || "1.0";
    }
  }

  function finishRun(run) {
    addFirstLogIfNeeded();
    var w = [];
    if (run.failedList && run.failedList.length) { w.push(t("failedChunks", { list: run.failedList.join(", ") })); run.retry = true; $("btnRetry").hidden = false; }
    warn(w);
    status("ok", t("analyzed", { m: S.items(state.model, "messages").length, f: S.items(state.model, "fields").length, r: S.items(state.model, "rules").length }));
    state.tab = "overview"; render(); saveNow();
  }

  /* ---------- instructions (revise) ---------- */

  function applyInstructions() {
    if (state.busy) { return; }
    if (!state.model) { status("error", t("needModel")); return; }
    var ins = $("instruction").value.trim();
    if (ins.length < 5) { status("error", t("needIns")); return; }
    if (!$("consent").checked) { status("error", t("needConsent")); return; }
    state.busy = true; refreshButtons(); status("", t("applying"));
    var c = Rv.compact(state.model, ins, 70000);
    callApi({ stage: "revise", instruction: ins, model: c.text, omitted: c.omitted.join("; ") }).then(function (raw) {
      var v = Rv.validateOps(state.model, raw && raw.ops);
      state.pending = { kind: "ops", ops: v.ops, preview: Rv.preview(state.model, v.ops, LANG), invalid: v.invalid, notes: raw && raw.notes || "", instruction: ins };
      status("", ""); renderPending();
    }).catch(function (e) { status("error", isFatal(e) ? t("limitHit", { msg: e.message }) : t("stepFailed", { msg: e && e.message })); })
      .then(function () { state.busy = false; refreshButtons(); });
  }

  function commit(model, summary) {
    var entry = Rv.logEntry(model, summary, $("metaAuthor").value.trim() || (model.meta && model.meta.author), today());
    model.changeLog = (model.changeLog || []).concat([entry]);
    model.meta.version = entry.id;
    return entry;
  }

  function acceptPending() {
    var p = state.pending; if (!p) { return; }
    if (p.kind === "ops") {
      var chosen = [];
      Array.prototype.forEach.call(document.querySelectorAll("#pendList input[data-i]"), function (cb) { if (cb.checked) { chosen.push(p.ops[parseInt(cb.getAttribute("data-i"), 10)]); } });
      if (!chosen.length) { discardPending(); return; }
      var next = Rv.applyOps(state.model, chosen);
      var e = commit(next, t("insLog", { ins: p.instruction.replace(/\s+/g, " ").slice(0, 300), n: chosen.length }));
      state.model = next; $("instruction").value = "";
      status("ok", t("appliedOps", { n: chosen.length, v: e.id }));
    } else {
      var hadModel = !!state.model, d = p.diff || [];
      var next2 = p.model;
      if (!hadModel || d.length) {
        var cnt = { add: 0, change: 0, remove: 0 }; d.forEach(function (x) { cnt[x.kind]++; });
        var e2 = commit(next2, hadModel ? t("wordLog", { file: p.file, a: cnt.add, c: cnt.change, r: cnt.remove }) : t("wordFirst", { file: p.file }));
        status("ok", t("wordApplied", { v: e2.id }));
      } else { status("ok", t("pendWordNone")); }
      state.model = next2;
      if (next2.meta) { if (next2.meta.title) { $("metaTitle").value = next2.meta.title; } if (next2.meta.author) { $("metaAuthor").value = next2.meta.author; } }
    }
    state.pending = null; $("pendingCard").hidden = true; render(); saveNow();
  }
  function discardPending() { state.pending = null; $("pendingCard").hidden = true; status("", ""); }

  function renderPending() {
    var p = state.pending; if (!p) { $("pendingCard").hidden = true; return; }
    var html = "", opLabel = { update: t("opUpdate"), add: t("opAdd"), remove: t("opRemove"), setText: t("opText") };
    if (p.kind === "ops") {
      $("pendTitle").textContent = t("pendOps", { n: p.ops.length });
      p.preview.forEach(function (pv, i) {
        html += '<div class="pitem"><label><input type="checkbox" data-i="' + i + '" checked /> <span><span class="tag">' + esc(opLabel[pv.op] || pv.op) + "</span> " + esc(pv.label) + (pv.id ? " · " + esc(pv.id) : "") + "</span></label>";
        html += '<div class="chg">' + pv.changes.map(function (c) {
          return "<div><b>" + esc(c.p) + ":</b> " + (c.from ? "<del>" + esc(c.from) + "</del> " : "") + (c.to ? "<ins>" + esc(c.to) + "</ins>" : "") + "</div>";
        }).join("") + (pv.why ? '<div style="color:var(--muted)">' + esc(pv.why) + "</div>" : "") + "</div></div>";
      });
      if (p.invalid.length) { html += '<details class="rules"><summary>' + esc(t("invalidOps", { n: p.invalid.length })) + "</summary><ul>" + p.invalid.map(function (x) { return "<li>" + esc(x.reason) + "</li>"; }).join("") + "</ul></details>"; }
      $("pendNotes").textContent = p.notes ? t("aiNotes") + p.notes : "";
      $("btnAccept").disabled = !p.ops.length;
    } else {
      $("pendTitle").textContent = t("pendWord");
      var d = p.diff;
      if (d && !d.length) { $("pendNotes").textContent = t("pendWordNone"); }
      else if (d) {
        var c = { add: 0, change: 0, remove: 0 }; d.forEach(function (x) { c[x.kind]++; });
        $("pendNotes").textContent = t("pendWordFound", { a: c.add, c: c.change, r: c.remove });
        d.slice(0, 200).forEach(function (x) {
          html += '<div class="pitem"><span class="tag">' + esc(x.kind === "add" ? t("chgAdd") : x.kind === "remove" ? t("chgRemove") : t("chgChange")) + "</span> " + esc(x.label) + " · " + esc(x.id) + " — " + esc(x.title || "");
          if (x.changes) { html += '<div class="chg">' + x.changes.map(function (c) { return "<div><b>" + esc(c.p) + ":</b> " + (c.from ? "<del>" + esc(String(c.from).slice(0, 300)) + "</del> " : "") + (c.to ? "<ins>" + esc(String(c.to).slice(0, 300)) + "</ins>" : "") + "</div>"; }).join("") + "</div>"; }
          html += "</div>";
        });
        if (d.length > 200) { html += '<div class="hint">… +' + (d.length - 200) + "</div>"; }
      } else { $("pendNotes").textContent = t("wordFirst", { file: p.file }); }
      $("btnAccept").disabled = false;
    }
    $("pendList").innerHTML = html;
    $("pendingCard").hidden = false;
    $("pendingCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- showing the analysis ---------- */

  function counts() {
    var c = { total: 0, approved: 0, pending: 0, rejected: 0, unverified: 0, proposals: 0 };
    S.SECTIONS.forEach(function (s) {
      if (s.key === "changeLog") { return; }
      S.items(state.model, s.key).forEach(function (it) {
        c.total++; c[it.status === "approved" ? "approved" : it.status === "rejected" ? "rejected" : "pending"]++;
        if (it.check === "missing") { c.unverified++; }
        if (it.status !== "rejected" && (it.origin === "proposal" || (s.src && !(it.sources || []).length))) { c.proposals++; }
      });
    });
    return c;
  }

  function sourcesHtml(it) {
    if (!it.sources || !it.sources.length) { return '<span class="tag prop">' + esc(t("sourceProp")) + "</span>"; }
    return it.sources.map(function (s, i) {
      var mark = i === 0 ? (it.check === "ok" ? ' <span class="chk-ok">✓</span>' : it.check === "other" ? ' <span class="chk-other">✓ s.' + esc(it.checkPage) + "</span>" : it.check === "missing" ? ' <span class="chk-bad">⚠</span>' : "") : "";
      return "<div>D" + s.doc + (s.page ? " s." + s.page : "") + mark + (s.quote ? '<div class="sub">“' + esc(s.quote) + "”</div>" : "") + "</div>";
    }).join("");
  }

  function cellHtml(it, c, sec) {
    switch (c.kind) {
      case "src": return sourcesHtml(it);
      case "status": return '<select class="st" data-act="status" data-sec="' + sec.key + '" data-id="' + esc(it.id) + '" aria-label="' + esc(t("stPending")) + '">' + ["pending", "approved", "rejected"].map(function (v) { return '<option value="' + v + '"' + ((it.status || "pending") === v ? " selected" : "") + ">" + esc(S.enumLabel("status", v, LANG)) + "</option>"; }).join("") + "</select>";
      case "origin": return '<span class="tag' + (it.origin === "document" ? "" : " prop") + '">' + esc(S.enumLabel("origin", it.origin || "proposal", LANG)) + "</span>";
      default: return esc(S.cellText(it, c, LANG));
    }
  }

  function renderSection(sec, q, onlyPending) {
    var all = S.items(state.model, sec.key), list = all.filter(function (it) {
      if (onlyPending && (it.status || "pending") !== "pending") { return false; }
      if (!q) { return true; }
      return JSON.stringify(it).toLowerCase().indexOf(q) > -1;
    });
    if (!all.length) { return ""; }
    var cols = sec.cols.slice(), extra = sec.key === "fields";
    var head = (extra ? "<th>" + esc(t("message")) + "</th>" : "") + cols.map(function (c) { return "<th>" + esc(LANG === "en" ? c.en : c.tr) + "</th>"; }).join("");
    var body = list.map(function (it) {
      var rej = it.status === "rejected" ? ' class="rej"' : "";
      var row = "<tr" + rej + ">" + (extra ? "<td>" + esc(it.message) + "</td>" : "") + cols.map(function (c) { return '<td class="' + (c.mono ? "mono" : "") + '">' + cellHtml(it, c, sec) + "</td>"; }).join("") + "</tr>";
      if (sec.key === "flows" && it.steps && it.steps.length) {
        row += '<tr><td colspan="' + (cols.length + (extra ? 1 : 0)) + '"><div class="sub"><b>' + esc(t("steps")) + ":</b>\n" + it.steps.map(function (s, i) { return (i + 1) + ". " + (s.actor ? s.actor + ": " : "") + s.action + (s.message ? " [" + s.message + "]" : ""); }).map(esc).join("\n") + "</div></td></tr>";
      }
      if (sec.key === "tables" && it.columns && it.columns.length) {
        row += '<tr><td colspan="' + cols.length + '"><div class="sub"><b>' + esc(t("columns")) + ":</b>\n" + it.columns.map(function (c) { return c.name + " " + c.type + (c.nullable ? " (" + c.nullable + ")" : "") + (c.key ? " [" + c.key + "]" : "") + (c.description ? " — " + c.description : ""); }).map(esc).join("\n") + "</div></td></tr>";
      }
      return row;
    }).join("");
    var hasStatus = sec.cols.some(function (c) { return c.kind === "status"; });
    return '<details class="sec" open><summary>' + esc(secLabel(sec.key)) + ' <span class="count">' + list.length + (list.length !== all.length ? " / " + all.length : "") + "</span>" +
      (hasStatus ? ' <button type="button" class="btn small" data-act="approveAll" data-sec="' + sec.key + '">' + esc(t("approveAll")) + "</button>" : "") + "</summary>" +
      '<div class="body table-wrap"><table class="grid"><thead><tr>' + head + "</tr></thead><tbody>" + (body || "") + "</tbody></table></div></details>";
  }

  function overviewHtml() {
    var m = state.model, h = "";
    function kv(def) {
      var d = S.getPath(m, def.path) || {}, rows = def.rows.filter(function (r) { return d[r[0]]; });
      if (!rows.length) { return ""; }
      return '<dl class="kv">' + rows.map(function (r) { return "<dt>" + esc(LANG === "en" ? r[2] : r[1]) + "</dt><dd>" + esc(d[r[0]]) + "</dd>"; }).join("") + "</dl>";
    }
    h += '<details class="sec" open><summary>' + esc(t("ovHdr")) + '</summary><div class="body">' + kv(S.KV_BY_KEY.meta) + "<br>" + kv(S.KV_BY_KEY.info) + "<br>" + kv(S.KV_BY_KEY.overview) + kv(S.KV_BY_KEY.accountingSummary) + "</div></details>";
    if ((m.docs || []).length) {
      h += '<details class="sec" open><summary>' + esc(t("docsHdr")) + '</summary><div class="body"><dl class="kv">' + m.docs.map(function (d) { return "<dt>D" + d.no + "</dt><dd>" + esc(d.name + " (" + (d.role === "extra" ? t("extraRole") : t("mainRole")) + ", " + d.pages + ")") + "</dd>"; }).join("") + "</dl></div></details>";
    }
    return h;
  }

  function render() {
    var has = !!state.model;
    $("resultCard").hidden = !has;
    refreshButtons();
    if (!has) { return; }
    var c = counts();
    $("tiles").innerHTML = [["tNum", c.total, ""], ["tApproved", c.approved, ""], ["tPending", c.pending, ""], ["tRejected", c.rejected, ""], ["tUnverified", c.unverified, c.unverified ? "warn" : ""], ["tProposal", c.proposals, ""]]
      .map(function (x) { return '<div class="tile ' + x[2] + '"><b>' + x[1] + "</b><span>" + esc(t(x[0])) + "</span></div>"; }).join("");
    $("tabs").innerHTML = TABS.map(function (tb) { return '<button type="button" role="tab" data-tab="' + tb.id + '" aria-selected="' + (state.tab === tb.id) + '">' + esc(t(tb.label)) + "</button>"; }).join("");
    var q = $("filter").value.trim().toLowerCase(), only = $("onlyPending").checked, tab = TABS.filter(function (x) { return x.id === state.tab; })[0] || TABS[0], html = "";
    if (tab.id === "overview") { html = overviewHtml(); }
    else { html = tab.secs.map(function (k) { return renderSection(S.BY_KEY[k], q, only); }).join(""); }
    $("panel").innerHTML = html || '<p class="hint">' + esc(t("noRows")) + "</p>";
    $("metaTitle").value = $("metaTitle").value || (state.model.meta && state.model.meta.title) || "";
    $("metaAuthor").value = $("metaAuthor").value || (state.model.meta && state.model.meta.author) || "";
  }

  function refreshButtons() {
    $("btnAnalyze").disabled = state.busy || !state.slots[1];
    $("btnApply").disabled = state.busy || !state.model;
    $("btnDownload").disabled = state.busy || !state.model;
  }

  /* ---------- Word out ---------- */

  function download() {
    if (!state.model) { return; }
    state.model.meta.title = $("metaTitle").value.trim() || state.model.meta.title;
    state.model.meta.author = $("metaAuthor").value.trim() || state.model.meta.author;
    var bytes = DocxLite.build(Doc.build(state.model, LANG));
    var name = (state.model.meta.title || "analysis").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) + "-v" + (state.model.meta.version || "1.0") + ".docx";
    var blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
    status("ok", t("downloaded", { name: name })); save();
  }

  /* ---------- wiring ---------- */

  function clearSlot(n) { state.slots[n] = null; $("file" + n).value = ""; $("name" + n).textContent = ""; $("meta" + n).textContent = ""; $("warn" + n).textContent = ""; slotUi(n); }

  function wire() {
    ["1", "2"].forEach(function (n) {
      $("file" + n).addEventListener("change", function () { pickPdf(parseInt(n, 10), this.files[0]); this.value = ""; });
    });
    $("fileW").addEventListener("change", function () { pickWord(this.files[0]); this.value = ""; });
    document.addEventListener("click", function (e) {
      var pick = e.target.closest("[data-pick]"); if (pick) { $(pick.getAttribute("data-pick") === "W" ? "fileW" : "file" + pick.getAttribute("data-pick")).click(); return; }
      var clr = e.target.closest("[data-clear]"); if (clr) { clearSlot(parseInt(clr.getAttribute("data-clear"), 10)); return; }
      var tab = e.target.closest("[data-tab]"); if (tab) { state.tab = tab.getAttribute("data-tab"); render(); return; }
      var all = e.target.closest('[data-act="approveAll"]');
      if (all) {
        e.preventDefault(); S.items(state.model, all.getAttribute("data-sec")).forEach(function (it) { if (it.status !== "rejected") { it.status = "approved"; } });
        render(); save(); return;
      }
    });
    document.addEventListener("change", function (e) {
      var sel = e.target.closest('[data-act="status"]');
      if (sel) {
        var it = S.items(state.model, sel.getAttribute("data-sec")).filter(function (x) { return x.id === sel.getAttribute("data-id"); })[0];
        if (it) { it.status = sel.value; save(); render(); }
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll(".zone"), function (z) {
      z.addEventListener("dragover", function (e) { e.preventDefault(); z.classList.add("drag"); });
      z.addEventListener("dragleave", function () { z.classList.remove("drag"); });
      z.addEventListener("drop", function (e) {
        e.preventDefault(); z.classList.remove("drag");
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0], slot = z.getAttribute("data-slot");
        if (!f) { return; }
        if (slot === "W") { pickWord(f); } else { pickPdf(parseInt(slot, 10), f); }
      });
    });
    $("btnAnalyze").addEventListener("click", analyze);
    $("btnRetry").addEventListener("click", analyze);
    $("btnApply").addEventListener("click", applyInstructions);
    $("btnDownload").addEventListener("click", download);
    $("btnAccept").addEventListener("click", acceptPending);
    $("btnDiscard").addEventListener("click", discardPending);
    $("btnCancel").addEventListener("click", function () { if (state.abort) { state.abort.abort(); } });
    $("btnClear").addEventListener("click", function () {
      if (!window.confirm(LANG === "tr" ? "Tüm çalışma (analiz, yüklenen dosyalar) silinecek. Devam edilsin mi?" : "The whole work (analysis, loaded files) will be deleted. Continue?")) { return; }
      state.model = null; state.run = null; state.pending = null; clearSlot(1); clearSlot(2);
      $("instruction").value = ""; $("background").value = ""; $("metaTitle").value = ""; $("metaAuthor").value = "";
      $("progressCard").hidden = true; $("pendingCard").hidden = true; warn([]); wipe(); render(); status("", t("cleared"));
    });
    $("bgTemplate").addEventListener("click", function () { var b = $("background"); b.value = (b.value ? b.value + "\n" : "") + t("bgTemplateText"); b.focus(); });
    $("filter").addEventListener("input", BATool.debounce(render, 200));
    $("onlyPending").addEventListener("change", render);
    $("consent").addEventListener("change", function () { try { localStorage.setItem("baforge-spec-consent", this.checked ? "1" : ""); } catch (e) {} });
    ["metaTitle", "metaAuthor"].forEach(function (id) { $(id).addEventListener("input", function () { if (state.model) { state.model.meta[id === "metaTitle" ? "title" : "author"] = this.value; save(); } }); });
    $("background").addEventListener("input", function () { if (state.model) { state.model.meta.background = this.value; save(); } });
  }

  function init() {
    try { $("consent").checked = localStorage.getItem("baforge-spec-consent") === "1"; } catch (e) {}
    wire(); render();
    load().then(function (saved) {
      if (saved && saved.model && !state.model) {
        state.model = saved.model; $("background").value = (saved.model.meta && saved.model.meta.background) || "";
        state.tab = "overview"; render();
        status("", t("restored", { date: (saved.savedAt || "").slice(0, 16).replace("T", " ") }));
      }
    });
  }

  window.addEventListener("pagehide", saveNow);
  window.SpecPage = { _state: state };
  init();
})();
