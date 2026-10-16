/*
 * Turkish text layer for the BA screens that were written in English only
 * (Acceptance Criteria, Test Data, Process Flow, Traceability, BA Document).
 * Exact-match dictionary + a few patterns. Applies to existing and newly rendered text;
 * switching back to English restores the original text. AI-generated content is never touched
 * (it already follows the output-language select).
 */
(function () {
  "use strict";
  var D = {
    "BA WORKSPACE": "BA ÇALIŞMA ALANI",
    "Build Professional Acceptance Criteria": "Profesyonel Kabul Kriterleri Oluşturun",
    "Transform your user story into clear, testable, and traceable acceptance criteria.": "Kullanıcı hikâyenizi net, test edilebilir ve izlenebilir kabul kriterlerine dönüştürün.",
    "Workflow Progress": "Akış İlerlemesi",
    "Requirement": "Gereksinim", "User Story": "Kullanıcı Hikâyesi", "Acceptance Criteria": "Kabul Kriterleri",
    "UAT Test Cases": "UAT Test Senaryoları", "Test Data": "Test Verisi", "Process Flow": "Süreç Akışı",
    "Traceability": "İzlenebilirlik", "BA Document": "BA Dokümanı",
    "Acceptance Criteria Input": "Kabul Kriterleri Girdisi",
    "Start from the User Story generated in the previous workflow step or enter a story manually.": "Önceki adımda üretilen Kullanıcı Hikâyesi ile başlayın veya hikâyeyi elle girin.",
    "User Story context loaded": "Kullanıcı Hikâyesi bağlamı yüklendi",
    "The User Story and related information from the previous workflow step have been transferred.": "Önceki adımdaki Kullanıcı Hikâyesi ve ilgili bilgiler aktarıldı.",
    "User Story / Requirement": "Kullanıcı Hikâyesi / Gereksinim",
    "Language": "Dil", "Detail Level": "Detay Seviyesi", "Basic": "Temel", "Professional": "Profesyonel", "Comprehensive": "Kapsamlı",
    "Priority": "Öncelik", "Medium": "Orta", "High": "Yüksek", "Critical": "Kritik", "Low": "Düşük",
    "Source Type": "Kaynak Türü", "Manual Input": "Elle Giriş",
    "Generate Acceptance Criteria": "Kabul Kriterleri Oluştur", "Clear": "Temizle",
    "Acceptance Criteria Workspace": "Kabul Kriterleri Çalışma Alanı",
    "Review, refine, and save the generated acceptance criteria.": "Üretilen kabul kriterlerini inceleyin, düzenleyin ve kaydedin.",
    "Testability Score": "Test Edilebilirlik Puanı", "out of 100": "100 üzerinden", "Testability Assessment": "Test Edilebilirlik Değerlendirmesi",
    "+ Add Criterion": "+ Kriter Ekle", "ID": "No", "Type": "Tür", "Given": "Given (Koşul)", "When": "When (Eylem)", "Then": "Then (Sonuç)",
    "No acceptance criteria were generated.": "Henüz kabul kriteri üretilmedi.",
    "Coverage Summary": "Kapsam Özeti", "No items added yet.": "Henüz öğe eklenmedi.",
    "Business Rules": "İş Kuralları", "+ Add Rule": "+ Kural Ekle", "Assumptions": "Varsayımlar", "+ Add Assumption": "+ Varsayım Ekle",
    "Open Questions": "Açık Sorular", "+ Add Question": "+ Soru Ekle",
    "Acceptance Criteria Ready": "Kabul Kriterleri Hazır", "Save your work before continuing to UAT.": "UAT'a geçmeden önce çalışmanızı kaydedin.",
    "Reset": "Sıfırla", "Regenerate": "Yeniden Üret", "Save Draft": "Taslağı Kaydet", "Continue to UAT →": "UAT'a Devam Et →",
    "No saved operations yet. They appear here after you generate a result.": "Henüz kayıtlı işlem yok. Sonuç ürettikten sonra burada görünür.",
    "← Previous Step: User Story": "← Önceki Adım: Kullanıcı Hikâyesi",
    "Continue to UAT Test Cases →": "UAT Test Senaryolarına Devam Et →",
    "Example: As a customer, I want to transfer money to another bank account using an IBAN so that I can send money securely.": "Örnek: Bir müşteri olarak, parayı güvenle gönderebilmek için IBAN kullanarak başka bir banka hesabına transfer yapmak istiyorum.",
    "Test Data Generator": "Test Verisi Üretici", "Generate": "Üret", "Professional Test Data": "Profesyonel Test Verisi",
    "Create realistic, structured and scenario-focused test data for functional, negative and boundary testing.": "Fonksiyonel, negatif ve sınır testleri için gerçekçi, yapılandırılmış ve senaryo odaklı test verisi üretin.",
    "← UAT Test Cases": "← UAT Test Senaryoları", "Process Flow →": "Süreç Akışı →",
    "Test Data Context": "Test Verisi Bağlamı",
    "Start directly or use context from the previous workflow step. You can edit the context before generating data.": "Doğrudan başlayın veya önceki adımın bağlamını kullanın. Veri üretmeden önce bağlamı düzenleyebilirsiniz.",
    "Requirement / Test Context": "Gereksinim / Test Bağlamı", "Scenario Type": "Senaryo Tipi", "All Scenarios": "Tüm Senaryolar",
    "Positive": "Pozitif", "Negative": "Negatif", "Boundary": "Sınır", "Data Domain": "Veri Alanı", "Auto Detect": "Otomatik Algıla",
    "Banking / Payments": "Bankacılık / Ödemeler", "Customer": "Müşteri", "API / Integration": "API / Entegrasyon", "Generic": "Genel",
    "Number of Records": "Kayıt Sayısı", "Output Language": "Çıktı Dili", "Generate Test Data": "Test Verisi Üret",
    "AI is generating professional test data...": "Yapay zekâ test verisini üretiyor...",
    "Generated Test Data": "Üretilen Test Verisi", "Structured synthetic data generated from the selected scenarios.": "Seçilen senaryolardan üretilen yapılandırılmış sentetik veri.",
    "Copy Data": "Veriyi Kopyala", "← Previous Step: UAT Test Cases": "← Önceki Adım: UAT Test Senaryoları",
    "Continue to Process Flow →": "Süreç Akışına Devam Et →",
    "Example: A customer wants to transfer money to another bank account using an IBAN. The transfer should be completed when the IBAN is valid. Invalid or incomplete IBAN information should be rejected.": "Örnek: Bir müşteri IBAN kullanarak başka bir banka hesabına para transferi yapmak istiyor. IBAN geçerliyse transfer tamamlanmalıdır. Geçersiz veya eksik IBAN bilgisi reddedilmelidir.",
    "Process Flow Generator": "Süreç Akışı Üretici", "Turn Requirements Into": "Gereksinimleri Dönüştürün:", "Process Flows": "Süreç Akışları",
    "Generate structured business processes with actors, decision points, alternative paths and exception flows.": "Aktörler, karar noktaları, alternatif yollar ve istisna akışlarıyla yapılandırılmış iş süreçleri üretin.",
    "← Test Data": "← Test Verisi", "Traceability →": "İzlenebilirlik →",
    "Process Context": "Süreç Bağlamı", "Start directly or use context transferred from previous workflow steps.": "Doğrudan başlayın veya önceki adımlardan aktarılan bağlamı kullanın.",
    "Process Name": "Süreç Adı", "Requirement / Business Context": "Gereksinim / İş Bağlamı", "Generate Process Flow": "Süreç Akışı Üret",
    "Generated Process Flow": "Üretilen Süreç Akışı", "Structured business process.": "Yapılandırılmış iş süreci.",
    "Start / End": "Başlangıç / Bitiş", "Process Step": "Süreç Adımı", "Decision": "Karar", "Negative / Exception Branch": "Negatif / İstisna Dalı",
    "Actors & Systems": "Aktörler ve Sistemler", "Decision Points": "Karar Noktaları", "Process Steps": "Süreç Adımları",
    "Step": "Adım", "Actor / System": "Aktör / Sistem", "Action": "Eylem", "Expected Result": "Beklenen Sonuç",
    "Alternative Flows": "Alternatif Akışlar", "Exception Flows": "İstisna Akışları", "Copy Process Flow": "Süreç Akışını Kopyala",
    "Save to Workspace": "Çalışma Alanına Kaydet", "Continue to Traceability →": "İzlenebilirliğe Devam Et →",
    "← Previous Step: Test Data": "← Önceki Adım: Test Verisi", "Example: IBAN Money Transfer": "Örnek: IBAN ile Para Transferi",
    "Describe the business process, validations, decisions, successful outcomes and exception scenarios.": "İş sürecini, doğrulamaları, kararları, başarılı sonuçları ve istisna senaryolarını anlatın.",
    "Traceability Matrix": "İzlenebilirlik Matrisi", "Connect Requirements to": "Gereksinimleri Bağlayın:", "Delivery Artifacts": "Teslimat Çıktıları",
    "Trace the relationship between Requirements, User Stories, Acceptance Criteria, UAT Test Cases, Test Data and Process Flows in one structured workspace.": "Gereksinimler, Kullanıcı Hikâyeleri, Kabul Kriterleri, UAT Test Senaryoları, Test Verisi ve Süreç Akışları arasındaki ilişkiyi tek bir yapıda izleyin.",
    "← Process Flow": "← Süreç Akışı", "BA Document →": "BA Dokümanı →",
    "⚠ No workflow artifacts were detected in the current browser workspace.": "⚠ Bu tarayıcı çalışma alanında henüz akış çıktısı bulunamadı.",
    "Traceability Overview": "İzlenebilirlik Özeti", "Artifacts detected from the current BAForge workspace.": "Mevcut BAForge çalışma alanında bulunan çıktılar.",
    "Requirements": "Gereksinimler", "User Stories": "Kullanıcı Hikâyeleri", "Test Cases": "Test Senaryoları", "Stage Coverage": "Aşama Kapsamı",
    "Traceability Gaps": "İzlenebilirlik Boşlukları", "Traceability Chain": "İzlenebilirlik Zinciri",
    "Requirement → User Story → Acceptance Criteria → UAT → Test Data → Process Flow": "Gereksinim → Kullanıcı Hikâyesi → Kabul Kriterleri → UAT → Test Verisi → Süreç Akışı",
    "Missing": "Eksik", "Connected artifacts detected from the current workspace.": "Çalışma alanında bulunan bağlantılı çıktılar.",
    "No workflow artifacts could be detected yet.": "Henüz akış çıktısı bulunamadı.",
    "Coverage Analysis": "Kapsam Analizi", "Identify completed workflow areas and missing downstream artifacts.": "Tamamlanan akış alanlarını ve eksik sonraki çıktıları belirleyin.",
    "Workflow Coverage": "Akış Kapsamı", "Refresh Traceability": "İzlenebilirliği Yenile", "Copy Matrix": "Matrisi Kopyala",
    "Save Traceability": "İzlenebilirliği Kaydet", "Continue to BA Document →": "BA Dokümanına Devam Et →",
    "← Previous Step: Process Flow": "← Önceki Adım: Süreç Akışı",
    "BA Document Generator": "BA Doküman Üretici", "Turn BA Artifacts Into a": "BA Çıktılarını Dönüştürün:", "Professional Document.": "Profesyonel Doküman.",
    "Compile the available requirements, user stories, acceptance criteria, UAT scenarios, test data and process flows into a structured Business Analysis document.": "Mevcut gereksinimleri, kullanıcı hikâyelerini, kabul kriterlerini, UAT senaryolarını, test verisini ve süreç akışlarını yapılandırılmış bir İş Analizi dokümanında birleştirin.",
    "← Traceability": "← İzlenebilirlik", "Document Configuration": "Doküman Ayarları",
    "Define the document title and presentation preferences.": "Doküman başlığını ve sunum tercihlerini belirleyin.",
    "Document Title": "Doküman Başlığı", "Document Objective": "Doküman Amacı", "Generate BA Document": "BA Dokümanı Üret",
    "Available BA Artifacts": "Mevcut BA Çıktıları", "The document is generated from artifacts currently available in the browser workspace.": "Doküman, tarayıcı çalışma alanındaki mevcut çıktılardan üretilir.",
    "Not Available": "Mevcut Değil", "Available": "Mevcut", "Business Analysis Document": "İş Analizi Dokümanı", "Document Type": "Doküman Türü",
    "Business Analysis": "İş Analizi", "Generated": "Üretildi", "Detail": "Detay", "Click": "Tıklayın", "to compile the available BA artifacts.": "mevcut BA çıktılarını derlemek için.",
    "Copy Document": "Dokümanı Kopyala", "Print / Save as PDF": "Yazdır / PDF Olarak Kaydet", "Back to BAForge Home →": "BAForge Ana Sayfaya Dön →",
    "← Previous Step: Traceability": "← Önceki Adım: İzlenebilirlik", "Enter document title": "Doküman başlığını girin",
    "Optional: Describe the purpose of this document.": "İsteğe bağlı: Bu dokümanın amacını açıklayın."
  };
  var PAT = [
    [/^(.+) is missing$/, function (m) { return (D[m[1]] || m[1]) + " eksik"; }],
    [/^No (.+) artifact was detected\.$/, function (m) { return (D[m[1]] || m[1]) + " çıktısı bulunamadı."; }],
    [/^(\d+) records?$/, function (m) { return m[1] + " kayıt"; }],
    [/^(\d+) artifacts?$/, function (m) { return m[1] + " çıktı"; }],
    [/^Last (\d+) operations \((\d+)\/(\d+)\)$/, function (m) { return "Son " + m[1] + " işlem (" + m[2] + "/" + m[3] + ")"; }]
  ];

  /* English jargon left inside the pages' own Turkish strings */
  var TERMS = [
    [/acceptance criteria'lar[ıi]nı/gi, "kabul kriterlerini"], [/acceptance criteria'lar[ıi]/gi, "kabul kriterlerini"],
    [/acceptance criteria'lara/gi, "kabul kriterlerine"], [/Acceptance Criteria/g, "Kabul Kriterleri"], [/acceptance criteria/g, "kabul kriterleri"],
    [/User Story'nizi/g, "Kullanıcı Hikâyenizi"], [/User Story'yi/g, "Kullanıcı Hikâyesini"], [/User Story/g, "Kullanıcı Hikâyesi"],
    [/Workflow/g, "Akış"], [/workflow/g, "akış"], [/Criterion/g, "Kriter"], [/\bRule\b/g, "Kural"], [/Coverage/g, "Kapsam"],
    [/Test Verileri/g, "Test Verisi"], [/Business Analysis/g, "İş Analizi"]
  ];

  function lang() { try { return localStorage.getItem("baforge-language") === "tr" ? "tr" : "en"; } catch (e) { return "en"; } }
  function tr(s) {
    var k = s.replace(/\s+/g, " ").trim();
    if (!k) { return null; }
    if (D[k] !== undefined) { return D[k]; }
    for (var i = 0; i < PAT.length; i++) { var m = PAT[i][0].exec(k); if (m) { return PAT[i][1](m); } }
    if (k.length <= 90) {
      var r = k;
      TERMS.forEach(function (t) { r = r.replace(t[0], t[1]); });
      if (r !== k) { return r; }
    }
    return null;
  }

  var orig = new WeakMap(), skipSel = ".baforge-nav-inner,.baforge-fb,.baforge-fb-back,.baforge-fb-btn,.ba-next,.ba-howto,script,style,textarea,pre,code";
  var busy = false;

  function textNode(n) {
    var p = n.parentElement;
    if (!p || p.closest(skipSel) || p.closest("td,li")) { return; }
    if (p.tagName === "OPTION" && !p.hasAttribute("value")) { p.setAttribute("value", n.nodeValue.replace(/\s+/g, " ").trim()); } /* keep the option value stable */
    var o = orig.get(n);
    if (o !== undefined && n.nodeValue !== o.tr) { o = undefined; orig.delete(n); } /* page changed it again */
    if (lang() === "tr") {
      if (o) { return; }
      var t = tr(n.nodeValue);
      if (t !== null) { orig.set(n, { en: n.nodeValue, tr: leading(n.nodeValue) + t + trailing(n.nodeValue) }); n.nodeValue = orig.get(n).tr; }
    } else if (o) { n.nodeValue = o.en; orig.delete(n); }
  }
  function leading(s) { return /^\s*/.exec(s)[0]; }
  function trailing(s) { return /\s*$/.exec(s)[0]; }

  var skipAttr = ".baforge-nav-inner,.baforge-fb,.baforge-fb-back,.baforge-fb-btn,.ba-next,.ba-howto";
  function attrs(el) {
    if (el.closest && el.closest(skipAttr)) { return; }
    ["placeholder", "title"].forEach(function (a) {
      var v = el.getAttribute && el.getAttribute(a);
      if (!v) { return; }
      var key = "data-ba-en-" + a;
      if (lang() === "tr") { if (el.hasAttribute(key)) { return; } var t = tr(v); if (t !== null) { el.setAttribute(key, v); el.setAttribute(a, t); } }
      else if (el.hasAttribute(key)) { el.setAttribute(a, el.getAttribute(key)); el.removeAttribute(key); }
    });
  }

  function walk(root) {
    if (!root) { return; }
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1) { return; }
    attrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) { list.push(n); }
    list.forEach(textNode);
    Array.prototype.forEach.call(root.querySelectorAll("[placeholder],[title]"), attrs);
  }

  function run(root) { if (busy) { return; } busy = true; try { walk(root || document.body); } finally { busy = false; } }

  function start() {
    if (typeof MutationObserver === "undefined" || typeof NodeFilter === "undefined") { return; }
    run();
    new MutationObserver(function (muts) {
      if (busy) { return; }
      busy = true;
      try { muts.forEach(function (m) { if (m.type === "characterData") { textNode(m.target); } else { m.addedNodes.forEach(walk); if (m.target.nodeType === 1) { attrs(m.target); } } }); }
      finally { busy = false; }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title"] });
    window.addEventListener("baforge:language-changed", function () { setTimeout(function () { run(); }, 0); });
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } else { start(); }
})();
