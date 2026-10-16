/*
 * Page shell shared by every BA and tool screen.
 * Gives all screens the same order:  hero -> "how to use" box -> (ad slot) -> the tool -> (ad slot) -> suggested screens.
 *  - An existing help box (details.rules / details.help / .info-box) is MOVED under the hero; pages without one get a generated box.
 *  - Ad slots stay invisible (zero height) until ads are switched on: set  window.BA_ADS = true  (or <html data-ads="on">).
 *  - Suggestions point to the next workflow step and to related screens.
 */
(function () {
  "use strict";

  var L = function () { try { return localStorage.getItem("baforge-language") === "tr" ? "tr" : "en"; } catch (e) { return "en"; } };

  var M = {
    "requirement-analyzer": ["🔍", "Requirement Analyzer", "Gereksinim Analizi", "Find gaps and risks in a requirement before development.", "Geliştirmeden önce gereksinimdeki eksik ve riskleri bulun."],
    "requirement": ["📋", "Requirement Workspace", "Gereksinim Tanımı", "Refine one requirement into a clean, testable statement.", "Bir gereksinimi net ve test edilebilir hale getirin."],
    "user-story": ["📝", "User Story", "Kullanıcı Hikâyesi", "Turn a requirement into an Agile user story.", "Gereksinimi çevik bir kullanıcı hikâyesine dönüştürün."],
    "acceptance-criteria": ["✓", "Acceptance Criteria", "Kabul Kriterleri", "Write Given/When/Then criteria for a story.", "Hikâye için Given/When/Then kriterleri üretin."],
    "uat": ["🧪", "UAT Test Cases", "UAT Test Senaryoları", "Generate UAT test cases in seconds.", "Saniyeler içinde UAT test senaryoları üretin."],
    "test-data": ["🗂️", "Test Data", "Test Verisi", "Create realistic positive, negative and boundary data.", "Gerçekçi pozitif, negatif ve sınır test verisi üretin."],
    "process-flow": ["🔀", "Process Flow", "Süreç Akışı", "Describe a business process with decisions and exceptions.", "Karar ve istisnalarla iş sürecini tanımlayın."],
    "traceability": ["🔗", "Traceability", "İzlenebilirlik", "See how requirements connect to tests and flows.", "Gereksinimlerin test ve akışlarla bağını görün."],
    "document": ["📄", "BA Document", "BA Dokümanı", "Compile everything into one Business Analysis document.", "Her şeyi tek bir Business Analysis dokümanında birleştirin."],
    "json-xml": ["🔄", "JSON ↔ XML", "JSON ↔ XML", "Convert between JSON and XML instantly.", "JSON ile XML arasında anında dönüştürün."],
    "sql-beautifier": ["🧹", "SQL Beautifier", "SQL Düzenleyici", "Format messy SQL into readable code.", "Dağınık SQL'i okunur hale getirin."],
    "regex-builder": ["🔎", "Regex Builder", "Regex Oluşturucu", "Build and test regular expressions.", "Düzenli ifadeleri oluşturun ve deneyin."],
    "json-schema": ["📐", "JSON Schema", "JSON Şema", "Generate a JSON Schema from sample JSON.", "Örnek JSON'dan şema üretin."],
    "mock-data": ["🎲", "Mock Data", "Sahte Veri", "Generate realistic sample records.", "Gerçekçi örnek kayıtlar üretin."],
    "api-designer": ["🔌", "API Designer", "API Tasarımcısı", "Design an API and export OpenAPI.", "API tasarlayın ve OpenAPI olarak dışa aktarın."],
    "flowchart": ["🔀", "Flowchart", "Akış Şeması", "Draw a flowchart from simple text.", "Basit metinden akış şeması çizin."],
    "er-diagram": ["🗃️", "ER Diagram", "ER Diyagramı", "Model tables and relations.", "Tabloları ve ilişkileri modelleyin."],
    "uml-designer": ["🧩", "UML Designer", "UML Tasarımcısı", "Draw UML diagrams from text.", "Metinden UML diyagramları çizin."],
    "bpmn-designer": ["⚙️", "BPMN Designer", "BPMN Tasarımcısı", "Draw BPMN-style process diagrams.", "BPMN tarzı süreç diyagramları çizin."],
    "ui-designer": ["🖼️", "UI Designer", "Arayüz Tasarımcısı", "Sketch screens and export them.", "Ekran taslağı çizin ve dışa aktarın."]
  };

  var NEXT = { /* page -> suggested screens, first one is the natural next step */
    "requirement-analyzer": ["requirement", "user-story", "uat"],
    "requirement": ["user-story", "acceptance-criteria", "requirement-analyzer"],
    "user-story": ["acceptance-criteria", "uat", "requirement"],
    "acceptance-criteria": ["uat", "test-data", "user-story"],
    "uat": ["test-data", "traceability", "acceptance-criteria"],
    "test-data": ["process-flow", "mock-data", "uat"],
    "process-flow": ["traceability", "flowchart", "bpmn-designer"],
    "traceability": ["document", "process-flow", "uat"],
    "document": ["requirement-analyzer", "uat", "traceability"],
    "json-xml": ["json-schema", "mock-data", "api-designer"],
    "sql-beautifier": ["mock-data", "er-diagram", "json-xml"],
    "regex-builder": ["json-xml", "sql-beautifier", "test-data"],
    "json-schema": ["mock-data", "api-designer", "json-xml"],
    "mock-data": ["json-schema", "test-data", "api-designer"],
    "api-designer": ["json-schema", "mock-data", "flowchart"],
    "flowchart": ["bpmn-designer", "uml-designer", "process-flow"],
    "er-diagram": ["uml-designer", "sql-beautifier", "mock-data"],
    "uml-designer": ["flowchart", "er-diagram", "bpmn-designer"],
    "bpmn-designer": ["flowchart", "process-flow", "uml-designer"],
    "ui-designer": ["flowchart", "user-story", "uat"]
  };

  /* Used only when a page has no help box of its own. */
  var HOWTO = {
    "user-story": {
      en: ["Paste a requirement or use the output of Requirement Workspace.", "Choose language, detail level and priority, then generate.", "Edit the story and continue to Acceptance Criteria."],
      tr: ["Bir gereksinim yapıştırın veya Gereksinim Tanımı çıktısını kullanın.", "Dil, detay seviyesi ve önceliği seçip üretin.", "Hikâyeyi düzenleyin ve Kabul Kriterleri adımına geçin."]
    },
    "acceptance-criteria": {
      en: ["Paste a user story or use the one from the previous step.", "Pick language, detail level, priority and source type, then generate.", "Review the Given/When/Then criteria and continue to UAT."],
      tr: ["Bir kullanıcı hikâyesi yapıştırın veya önceki adımdakini kullanın.", "Dil, detay, öncelik ve kaynak türünü seçip üretin.", "Given/When/Then kriterlerini gözden geçirip UAT'a geçin."]
    },
    "uat": {
      en: ["Enter the requirement or acceptance criteria to test.", "Choose test type, number of cases and detail level, then generate.", "Review the cases, export them and continue to Test Data."],
      tr: ["Test edilecek gereksinimi veya kabul kriterlerini girin.", "Test tipi, senaryo sayısı ve detayı seçip üretin.", "Senaryoları inceleyin, dışa aktarın ve Test Verisi adımına geçin."]
    },
    "test-data": {
      en: ["Describe the requirement or use the previous step's context.", "Choose scenario type, data domain and number of records.", "Generate, copy or export the data and continue to Process Flow."],
      tr: ["Gereksinimi yazın veya önceki adımın bağlamını kullanın.", "Senaryo tipi, veri alanı ve kayıt sayısını seçin.", "Veriyi üretip kopyalayın veya dışa aktarın, Süreç Akışı'na geçin."]
    },
    "process-flow": {
      en: ["Name the process and describe the business context.", "Pick the output language and detail level, then generate.", "Review actors, decisions and exceptions, then continue to Traceability."],
      tr: ["Sürecin adını ve iş bağlamını yazın.", "Çıktı dilini ve detay seviyesini seçip üretin.", "Aktör, karar ve istisnaları gözden geçirip İzlenebilirlik'e geçin."]
    },
    "traceability": {
      en: ["Artifacts you created in earlier steps are detected automatically.", "Check the coverage numbers and the chain to spot gaps.", "Fill the gaps in the earlier screens, then continue to the BA Document."],
      tr: ["Önceki adımlarda ürettiğiniz çıktılar otomatik algılanır.", "Kapsama sayılarına ve zincire bakarak eksikleri görün.", "Eksikleri ilgili ekranda tamamlayıp BA Dokümanı'na geçin."]
    },
    "document": {
      en: ["Set the document title, language and detail level.", "Add an optional objective, then generate the document.", "Download the result as a Word document."],
      tr: ["Doküman başlığı, dil ve detay seviyesini belirleyin.", "İsterseniz amacı yazın, ardından dokümanı üretin.", "Sonucu Word dokümanı olarak indirin."]
    }
  };

  var T = {
    en: { how: "How to use this screen", next: "Next step", more: "Try these too", open: "Open →", ad: "Advertisement" },
    tr: { how: "Bu ekran nasıl kullanılır?", next: "Sıradaki adım", more: "Bunları da deneyin", open: "Aç →", ad: "Reklam" }
  };

  var page = (/\/([a-z0-9-]+)\.html$/i.exec(location.pathname) || [])[1];
  if (!page || !M[page]) { return; }

  var css = document.createElement("style");
  css.textContent =
    ".ba-howto{margin:0 0 18px}" +
    ".ba-howto details,.ba-howto details.help,.ba-howto details.rules{background:#fff;border:1px solid #e4e7ec;border-radius:14px;padding:0;box-shadow:0 6px 20px rgba(16,24,40,.05)}" +
    ".ba-howto summary{cursor:pointer;font-weight:700;font-size:15px;padding:13px 18px;color:#101828;list-style:none;display:flex;align-items:center;gap:8px}" +
    ".ba-howto summary::-webkit-details-marker{display:none}" +
    ".ba-howto summary::before{content:'ⓘ';color:#2563eb;font-size:17px}" +
    ".ba-howto summary::after{content:'▾';margin-left:auto;color:#667085;transition:transform .2s}" +
    ".ba-howto details[open] summary::after{transform:rotate(180deg)}" +
    ".ba-howto ol,.ba-howto ul{margin:0;padding:0 18px 16px 38px;color:#475467;font-size:14px;line-height:1.7}" +
    ".ba-howto .info-box{margin:0}" +
    ".ba-ad{display:none;margin:18px auto;max-width:970px;min-height:90px;text-align:center;font-size:11px;color:#98a2b3}" +
    "html[data-ads=on] .ba-ad{display:block}" +
    ".ba-next{max-width:1240px;margin:34px auto 0;padding:0 25px 10px}.ba-ad[data-slot=bottom]{padding:0 25px}" +
    ".ba-next h2{font-size:18px;margin:0 0 12px;color:#101828}" +
    ".ba-next-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}" +
    ".ba-next-card{display:flex;gap:12px;align-items:flex-start;background:#fff;border:1px solid #e4e7ec;border-radius:14px;padding:14px 16px;text-decoration:none;color:#172033;box-shadow:0 6px 20px rgba(16,24,40,.05);transition:transform .15s,border-color .15s}" +
    ".ba-next-card:hover{transform:translateY(-2px);border-color:#2563eb}" +
    ".ba-next-card.primary{border-color:#2563eb;background:linear-gradient(180deg,#eff6ff,#fff)}" +
    ".ba-next-ico{font-size:24px;line-height:1}.ba-next-card b{display:block;font-size:15px;margin-bottom:2px}" +
    ".ba-next-card span.d{display:block;font-size:13px;color:#667085;line-height:1.45}" +
    ".ba-next-card em{display:inline-block;margin-top:6px;font-style:normal;font-size:12px;font-weight:700;color:#2563eb}" +
    ".ba-next-tag{font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px;display:block}" +
    "@media (max-width:720px){.ba-next{padding:0 16px 10px}}@media (max-width:820px){.ba-next-grid{grid-template-columns:1fr}}" +
    "@media print{.ba-ad,.ba-next{display:none !important}}";
  document.head.appendChild(css);

  var slotTop, slotBottom, nextEl, howEl, genHow;

  function adEl(pos) {
    var a = document.createElement("aside");
    a.className = "ba-ad"; a.setAttribute("data-slot", pos); a.setAttribute("aria-label", T[L()].ad);
    return a;
  }

  function build() {
    var main = document.querySelector("main") || document.querySelector(".container");
    var hero = main && main.querySelector(".hero");
    if (!main || !hero) { return false; }
    if (main.querySelector(".ba-howto")) { return true; }

    var wrap = document.createElement("div");
    wrap.className = "ba-howto";
    hero.parentNode.insertBefore(wrap, hero.nextSibling);

    var existing = main.querySelector("details.rules, details.help, section.info-box");
    if (existing) {
      existing.removeAttribute("open");
      wrap.appendChild(existing);
      genHow = null;
    } else if (HOWTO[page]) {
      genHow = document.createElement("details");
      wrap.appendChild(genHow);
    }
    slotTop = adEl("top");
    wrap.parentNode.insertBefore(slotTop, wrap.nextSibling);

    slotBottom = adEl("bottom");
    nextEl = document.createElement("section");
    nextEl.className = "ba-next";
    document.body.appendChild(slotBottom);
    document.body.appendChild(nextEl);
    render();
    return true;
  }

  function render() {
    var l = L(), t = T[l], idx = l === "tr" ? 2 : 1, di = l === "tr" ? 4 : 3;
    if (genHow) {
      var steps = HOWTO[page][l].map(function (s) { return "<li>" + s + "</li>"; }).join("");
      genHow.innerHTML = "<summary>" + t.how + "</summary><ol>" + steps + "</ol>";
    }
    var list = NEXT[page] || [], isBA = !!HOWTO[page] || page === "requirement" || page === "requirement-analyzer";
    nextEl.innerHTML =
      "<h2>" + t.more + "</h2><div class='ba-next-grid'>" +
      list.map(function (k, i) {
        var m = M[k];
        return "<a class='ba-next-card" + (i === 0 && isBA ? " primary" : "") + "' href='/" + k + ".html'>" +
          "<span class='ba-next-ico'>" + m[0] + "</span><div>" +
          (i === 0 && isBA ? "<span class='ba-next-tag'>" + t.next + "</span>" : "") +
          "<b>" + m[idx] + "</b><span class='d'>" + m[di] + "</span><em>" + t.open + "</em></div></a>";
      }).join("") + "</div>";
  }

  /* history / prev-next blocks added by other scripts must not end up below the suggestions */
  function keepLast() {
    if (!nextEl) { return; }
    var b = document.body, last = b.lastElementChild;
    if (last !== nextEl) { b.appendChild(slotBottom); b.appendChild(nextEl); }
  }

  function start() {
    setTimeout(keepLast, 600); setTimeout(keepLast, 1800);
    window.addEventListener("load", function () { setTimeout(keepLast, 100); });
    var tries = 0;
    (function tick() {
      if (build() || ++tries > 40) { return; }
      setTimeout(tick, 100);
    })();
  }

  window.addEventListener("baforge:language-changed", function () { if (nextEl) { setTimeout(render, 0); } });
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } else { start(); }
})();
