(function () {
  "use strict";

  /* =========================================================
     BAForge AI — Shared Navigation
     Centralized navigation + i18n
  ========================================================= */

  const path = window.location.pathname;

  let currentPage = "home";

  if (path.endsWith("/requirement-analyzer.html")) {
    currentPage = "requirement-analyzer";
  } else if (path.endsWith("/requirement.html")) {
    currentPage = "requirement";
  } else if (path.endsWith("/user-story.html")) {
    currentPage = "user-story";
  } else if (path.endsWith("/acceptance-criteria.html")) {
    currentPage = "acceptance-criteria";
  } else if (path.endsWith("/uat.html")) {
    currentPage = "uat";
  } else if (path.endsWith("/test-data.html")) {
    currentPage = "test-data";
  } else if (path.endsWith("/process-flow.html")) {
    currentPage = "process-flow";
  } else if (path.endsWith("/traceability.html")) {
    currentPage = "traceability";
  } else if (path.endsWith("/document.html")) {
    currentPage = "document";
  } else if (path.endsWith("/json-xml.html")) {
    currentPage = "json-xml";
  } else if (path.endsWith("/sql-beautifier.html")) {
    currentPage = "sql-beautifier";
  } else if (path.endsWith("/regex-builder.html")) {
    currentPage = "regex-builder";
  } else if (path.endsWith("/json-schema.html")) {
    currentPage = "json-schema";
  } else if (path.endsWith("/mock-data.html")) {
    currentPage = "mock-data";
  } else if (path.endsWith("/api-designer.html")) {
    currentPage = "api-designer";
  } else if (path.endsWith("/flowchart.html")) {
    currentPage = "flowchart";
  } else if (path.endsWith("/er-diagram.html")) {
    currentPage = "er-diagram";
  } else if (path.endsWith("/uml-designer.html")) {
    currentPage = "uml-designer";
  } else if (path.endsWith("/bpmn-designer.html")) {
    currentPage = "bpmn-designer";
  } else if (path.endsWith("/ui-designer.html")) {
    currentPage = "ui-designer";
  } else if (path.endsWith("/spec-analyzer.html")) {
    currentPage = "spec-analyzer";
  } else if (path.endsWith("/login.html")) {
    currentPage = "login";
  } else if (path.endsWith("/admin.html")) {
    currentPage = "admin";
  }

  /* =========================================================
     I18N LOADER
  ========================================================= */

  function loadI18n() {
    return new Promise((resolve) => {
      if (window.BAForgeI18n || window.BAI18n) {
        resolve();
        return;
      }

      const existing = document.querySelector(
        'script[src="/core/i18n.js"]'
      );

      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", resolve, { once: true });
        return;
      }

      const script = document.createElement("script");

      script.src = "/core/i18n.js";

      script.onload = resolve;
      script.onerror = resolve;

      document.head.appendChild(script);
    });
  }

  /* =========================================================
     FALLBACK TRANSLATIONS
  ========================================================= */

  const fallback = {

    en: {
      nav: {
        home: "Home",
        analyzer: "Analyzer",
        requirement: "Requirement",
        userStory: "User Story",
        acceptanceCriteria: "Acceptance Criteria",
        uat: "UAT Test Cases",
        testData: "Test Data",
        processFlow: "Process Flow",
        traceability: "Traceability",
        document: "BA Document",
        workspace: "Requirement Workspace",
        specAnalyzer: "Functional Spec Builder",
        groupRequirement: "Requirement",
        groupWorkflow: "BA Workflow",
        groupDev: "Developer Tools",
        jsonXml: "JSON ↔ XML Converter",
        sqlBeautifier: "SQL Beautifier",
        regexBuilder: "Regex Builder",
        jsonSchema: "JSON Schema Generator",
        mockData: "Mock Data Generator",
        apiDesigner: "API Designer",
        groupDesign: "Design Tools",
        flowchartD: "Flowchart Designer",
        erDiagram: "ER Diagram Designer",
        umlDesigner: "UML Designer",
        bpmnDesigner: "BPMN Designer",
        uiDesigner: "UI Designer",
        language: "Language",
        menu: "Menu"
      },

      workflow: {
        previousStep: "Previous Step",
        nextStep: "Next Step",

        analyzerToRequirement:
          "Continue to Requirement",

        requirementToUserStory:
          "Continue to User Story",

        userStoryToAcceptanceCriteria:
          "Continue to Acceptance Criteria",

        acceptanceCriteriaToUat:
          "Continue to UAT Test Cases",

        uatToTestData:
          "Continue to Test Data",

        testDataToProcessFlow:
          "Continue to Process Flow",

        processFlowToTraceability:
          "Continue to Traceability",

        traceabilityToDocument:
          "Continue to BA Document"
      }
    },

    tr: {
      nav: {
        home: "Ana Sayfa",
        analyzer: "Analizör",
        requirement: "Gereksinim",
        userStory: "Kullanıcı Hikâyesi",
        acceptanceCriteria: "Kabul Kriterleri",
        uat: "UAT Test Senaryoları",
        testData: "Test Verileri",
        processFlow: "Süreç Akışı",
        traceability: "İzlenebilirlik",
        document: "BA Dokümanı",
        workspace: "Gereksinim Çalışma Alanı",
        specAnalyzer: "Fonksiyonel Analiz Oluşturucu",
        groupRequirement: "Gereksinim",
        groupWorkflow: "BA Akışı",
        groupDev: "Geliştirici Araçları",
        jsonXml: "JSON ↔ XML Dönüştürücü",
        sqlBeautifier: "SQL Güzelleştirici",
        regexBuilder: "Regex Oluşturucu",
        jsonSchema: "JSON Schema Oluşturucu",
        mockData: "Sahte Veri Üretici",
        apiDesigner: "API Tasarımcısı",
        groupDesign: "Tasarım Araçları",
        flowchartD: "Akış Şeması Tasarımcısı",
        erDiagram: "ER Diyagram Tasarımcısı",
        umlDesigner: "UML Tasarımcısı",
        bpmnDesigner: "BPMN Tasarımcısı",
        uiDesigner: "Arayüz Tasarımcısı",
        language: "Dil",
        menu: "Menü"
      },

      workflow: {
        previousStep: "Önceki Adım",
        nextStep: "Sonraki Adım",

        analyzerToRequirement:
          "Gereksinime Devam Et",

        requirementToUserStory:
          "Kullanıcı Hikâyesine Devam Et",

        userStoryToAcceptanceCriteria:
          "Kabul Kriterlerine Devam Et",

        acceptanceCriteriaToUat:
          "UAT Test Senaryolarına Devam Et",

        uatToTestData:
          "Test Verilerine Devam Et",

        testDataToProcessFlow:
          "Süreç Akışına Devam Et",

        processFlowToTraceability:
          "İzlenebilirliğe Devam Et",

        traceabilityToDocument:
          "BA Dokümanına Devam Et"
      }
    }
  };

  /* =========================================================
     INITIALIZE
  ========================================================= */

  loadI18n().then(init);

  function init() {

    const i18n =
      window.BAForgeI18n ||
      window.BAI18n ||
      null;

    let language =
      localStorage.getItem("baforge-language") || "en";

    if (language !== "tr" && language !== "en") {
      language = "en";
    }

    /* Keep the page language attribute in sync on every page. */
    document.documentElement.lang = language;

    if (i18n) {
      try {
        language =
          i18n.getLanguage() || language;
      } catch (error) {
        console.warn(
          "BAForge i18n language read failed.",
          error
        );
      }
    }

    /* =======================================================
       TRANSLATION HELPER
    ======================================================= */

    function t(key) {

      if (i18n) {
        try {

          const result = i18n.t(key);

          if (
            result !== undefined &&
            result !== null &&
            result !== key
          ) {
            return result;
          }

        } catch (error) {
          console.warn(
            "BAForge i18n lookup failed:",
            key,
            error
          );
        }
      }

      const parts = key.split(".");

      let value = fallback[language];

      for (let i = 0; i < parts.length; i++) {

        if (
          value === undefined ||
          value === null
        ) {
          return key;
        }

        value = value[parts[i]];
      }

      return (
        value !== undefined &&
        value !== null
      )
        ? value
        : key;
    }

    /* =======================================================
       DOCUMENT LANGUAGE
    ======================================================= */

    document.documentElement.lang = language;

    /* =======================================================
       SHARED STYLES
    ======================================================= */

    const styles = `
      * {
        box-sizing: border-box;
      }

      .baforge-nav {
        position: sticky;
        top: 0;
        z-index: 9999;
        width: 100%;
        background: rgba(15, 23, 42, 0.98);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 5px 24px rgba(15,23,42,0.12);
      }

      .baforge-nav-inner {
        max-width: 1280px;
        min-height: 64px;
        margin: 0 auto;
        padding: 0 18px;
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .baforge-brand {
        flex-shrink: 0;
        color: white;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.04em;
        text-decoration: none;
        padding-right: 8px;
      }

      .baforge-brand span {
        color: #60a5fa;
      }

      .baforge-links {
        display: flex;
        align-items: center;
        gap: 3px;
        margin-left: auto;
        overflow: visible;
        max-width: calc(100vw - 250px);
        white-space: nowrap;
      }

      .baforge-links::-webkit-scrollbar {
        display: none;
      }

      .baforge-link {
        flex-shrink: 0;
        white-space: nowrap;
        padding: 8px 9px;
        border-radius: 8px;
        color: #cbd5e1;
        font-size: 11px;
        font-weight: 600;
        text-decoration: none;
        transition: 0.2s ease;
      }

      .baforge-link:hover {
        color: white;
        background: rgba(255,255,255,0.08);
      }

      .baforge-link.active {
        color: white;
        background: #2563eb;
      }

      .baforge-dd {
        position: relative;
        flex-shrink: 0;
      }

      .baforge-dd-btn {
        border: 0;
        background: transparent;
        font-family: inherit;
        cursor: pointer;
        font-size: 12px;
      }

      .baforge-dd-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        min-width: 230px;
        padding: 6px;
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.99);
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: 0 12px 32px rgba(15,23,42,0.35);
        z-index: 10000;
      }

      .baforge-dd.open .baforge-dd-menu {
        display: block;
      }

      @media (hover: hover) {
        .baforge-dd:hover .baforge-dd-menu {
          display: block;
        }
      }

      .baforge-dd-item {
        display: block;
        padding: 9px 12px;
        border-radius: 8px;
        color: #cbd5e1;
        font-size: 12.5px;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
      }

      .baforge-dd-item:hover {
        color: white;
        background: rgba(255,255,255,0.08);
      }

      .baforge-dd-item.active {
        color: white;
        background: #2563eb;
      }

      .baforge-mobile-heading {
        grid-column: 1 / -1;
        margin-top: 6px;
        padding: 4px 4px 0;
        color: #94a3b8;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .06em;
        text-transform: uppercase;
      }

      .baforge-language {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .baforge-language-label {
        color: #94a3b8;
        font-size: 10px;
        font-weight: 600;
      }

      .baforge-language-select {
        height: 32px;
        padding: 0 8px;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        background: rgba(255,255,255,0.08);
        color: white;
        font-size: 11px;
        cursor: pointer;
        outline: none;
      }

      .baforge-language-select option {
        color: #172033;
        background: white;
      }

      .baforge-menu-button {
        display: none;
        width: 38px;
        height: 38px;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 9px;
        background: rgba(255,255,255,0.08);
        color: white;
        font-size: 20px;
        cursor: pointer;
      }

      .baforge-mobile-menu {
        display: none;
        max-width: 1180px;
        margin: 0 auto;
        padding: 0 16px 14px;
      }

      .baforge-mobile-menu.open {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 6px;
      }

      .baforge-mobile-link {
        padding: 11px 13px;
        border-radius: 9px;
        color: #cbd5e1;
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        background: rgba(255,255,255,0.03);
      }

      .baforge-mobile-link:hover,
      .baforge-mobile-link.active {
        color: white;
        background: #2563eb;
      }

      /* =====================================================
         WORKFLOW NAVIGATION
      ===================================================== */

      .baforge-workflow-nav {
        max-width: 1100px;
        margin: 28px auto 45px;
        padding: 0 18px;
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        gap: 12px;
      }

      .baforge-workflow-nav.is-analyzer {
        justify-content: flex-end;
      }

      .baforge-workflow-button {
        min-height: 44px;
        padding: 0 16px;
        border: 1px solid #dbe3ef;
        border-radius: 10px;
        background: white;
        color: #475467;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        font-size: 12px;
        font-weight: 700;
        transition: 0.2s ease;
      }

      .baforge-workflow-button:hover {
        color: #2563eb;
        border-color: #bfdbfe;
        background: #eff6ff;
        transform: translateY(-1px);
      }

      .baforge-workflow-button.next {
        background: #2563eb;
        border-color: #2563eb;
        color: white;
      }

      .baforge-workflow-button.next:hover {
        background: #1d4ed8;
        border-color: #1d4ed8;
        color: white;
      }

      @media (max-width: 1050px) {

        .baforge-nav-inner {
          padding: 0 14px;
        }

        .baforge-links {
          max-width:
            calc(100vw - 230px);
        }

        .baforge-link {
          font-size: 10px;
          padding: 7px 7px;
        }
      }

      @media (max-width: 850px) {

        .baforge-nav-inner {
          min-height: 60px;
          padding: 0 16px;
        }

        .baforge-links {
          display: none;
        }

        .baforge-menu-button {
          display: block;
          margin-left: auto;
        }

        .baforge-language {
          margin-left: auto;
        }

        .baforge-language-label {
          display: none;
        }

        .baforge-workflow-nav {
          margin: 22px 16px 35px;
          padding: 0;
          flex-direction: column;
        }

        .baforge-workflow-button {
          width: 100%;
        }

        .baforge-workflow-nav.is-analyzer {
          align-items: stretch;
        }
      }

      @media (max-width: 500px) {

        .baforge-brand {
          font-size: 17px;
        }

        .baforge-language-select {
          height: 32px;
        }

        .baforge-menu-button {
          width: 36px;
          height: 36px;
        }

        .baforge-mobile-menu.open {
          grid-template-columns: 1fr;
        }
      }
    `;

    const style = document.createElement("style");
    style.textContent = styles;
    document.head.appendChild(style);

    /* =======================================================
       NAV TEXT
    ======================================================= */

    const navText = {
      home: t("nav.home"),
      analyzer: t("nav.analyzer"),
      requirement: t("nav.requirement"),
      story: t("nav.userStory"),
      criteria: t("nav.acceptanceCriteria"),
      uat: t("nav.uat"),
      testData: t("nav.testData"),
      processFlow: t("nav.processFlow"),
      traceability: t("nav.traceability"),
      document: t("nav.document"),
      workspace: t("nav.workspace"),
      specAnalyzer: t("nav.specAnalyzer"),
      groupRequirement: t("nav.groupRequirement"),
      groupWorkflow: t("nav.groupWorkflow"),
      groupDev: t("nav.groupDev"),
      jsonXml: t("nav.jsonXml"),
      sqlBeautifier: t("nav.sqlBeautifier"),
      regexBuilder: t("nav.regexBuilder"),
      jsonSchema: t("nav.jsonSchema"),
      mockData: t("nav.mockData"),
      apiDesigner: t("nav.apiDesigner"),
      groupDesign: t("nav.groupDesign"),
      flowchartD: t("nav.flowchartD"),
      erDiagram: t("nav.erDiagram"),
      umlDesigner: t("nav.umlDesigner"),
      bpmnDesigner: t("nav.bpmnDesigner"),
      uiDesigner: t("nav.uiDesigner"),
      language: t("nav.language"),
      menu: t("nav.menu")
    };

    /* =======================================================
       MENU MODEL
       Product navigation (categories) lives here. Workflow
       navigation (steps, Previous/Next) is configured separately
       below and is NOT driven by this list.
    ======================================================= */

    const menuGroups = [
      {
        label: navText.groupRequirement,
        items: [
          ["requirement-analyzer", "/requirement-analyzer.html", navText.analyzer],
          ["requirement", "/requirement.html", navText.workspace]
        ]
      },
      {
        label: navText.groupWorkflow,
        items: [
          ["requirement", "/requirement.html", "1 · " + navText.requirement],
          ["user-story", "/user-story.html", "2 · " + navText.story],
          ["acceptance-criteria", "/acceptance-criteria.html", "3 · " + navText.criteria],
          ["uat", "/uat.html", "4 · " + navText.uat],
          ["test-data", "/test-data.html", "5 · " + navText.testData],
          ["process-flow", "/process-flow.html", "6 · " + navText.processFlow],
          ["traceability", "/traceability.html", "7 · " + navText.traceability],
          ["document", "/document.html", "8 · " + navText.document]
        ]
      },
      {
        label: navText.groupDev,
        items: [
          ["json-xml", "/json-xml.html", navText.jsonXml],
          ["sql-beautifier", "/sql-beautifier.html", navText.sqlBeautifier],
          ["regex-builder", "/regex-builder.html", navText.regexBuilder],
          ["json-schema", "/json-schema.html", navText.jsonSchema],
          ["mock-data", "/mock-data.html", navText.mockData],
          ["api-designer", "/api-designer.html", navText.apiDesigner]
        ]
      }
      ,{
        label: navText.groupDesign,
        items: [
          ["flowchart", "/flowchart.html", navText.flowchartD],
          ["er-diagram", "/er-diagram.html", navText.erDiagram],
          ["uml-designer", "/uml-designer.html", navText.umlDesigner],
          ["bpmn-designer", "/bpmn-designer.html", navText.bpmnDesigner],
          ["ui-designer", "/ui-designer.html", navText.uiDesigner]
        ]
      }
    ];

    function menuLink(item, cls) {
      return '<a href="' + item[1] + '" class="' + cls +
        (currentPage === item[0] ? " active" : "") + '">' +
        item[2] + "</a>";
    }

    const desktopLinksHtml =
      menuLink(["home", "/", navText.home], "baforge-link") +
      menuGroups.map(function (g) {
        const active = g.items.some(function (i) {
          return i[0] === currentPage;
        });
        return '<div class="baforge-dd">' +
          '<button type="button" class="baforge-link baforge-dd-btn' +
          (active ? " active" : "") +
          '" aria-haspopup="true" aria-expanded="false">' +
          g.label + ' <span aria-hidden="true">▾</span></button>' +
          '<div class="baforge-dd-menu">' +
          g.items.map(function (i) {
            return menuLink(i, "baforge-dd-item");
          }).join("") +
          "</div></div>";
      }).join("");

    const mobileLinksHtml =
      menuLink(["home", "/", navText.home], "baforge-mobile-link") +
      menuGroups.map(function (g) {
        return '<div class="baforge-mobile-heading">' + g.label + "</div>" +
          g.items.map(function (i) {
            return menuLink(i, "baforge-mobile-link");
          }).join("");
      }).join("");

    /* =======================================================
       CREATE NAV
    ======================================================= */

    const nav = document.createElement("nav");

    nav.className = "baforge-nav";

    nav.innerHTML = `

      <div class="baforge-nav-inner">

        <a
          href="/"
          class="baforge-brand">
          BA<span>Forge</span> AI
        </a>

        <div class="baforge-links">${desktopLinksHtml}</div>

        <div class="baforge-language">

          <span
            class="baforge-language-label">
            ${navText.language}
          </span>

          <select
            class="baforge-language-select"
            id="baforgeLanguage"
            aria-label="${navText.language}">

            <option value="tr">TR</option>
            <option value="en">EN</option>

          </select>

        </div>

        <button
          class="baforge-menu-button"
          id="baforgeMenuButton"
          type="button"
          aria-label="${navText.menu}"
          aria-expanded="false">
          ☰
        </button>

      </div>

      <div
        class="baforge-mobile-menu"
        id="baforgeMobileMenu">
        ${mobileLinksHtml}
      </div>
    `;

    document.body.insertBefore(
      nav,
      document.body.firstChild
    );

    /* =======================================================
       UNIFIED WORKFLOW STEPPER
       One progress bar on every workflow page, replacing the
       differing page-local ones (hidden via CSS below).
    ======================================================= */

    (function buildUnifiedStepper() {

      const steps = [
        ["requirement", "step_requirement", "/requirement.html", "Requirement", "Gereksinim"],
        ["user-story", "step_story", "/user-story.html", "User Story", "Kullanıcı Hikâyesi"],
        ["acceptance-criteria", "step_ac", "/acceptance-criteria.html", "Acceptance Criteria", "Kabul Kriterleri"],
        ["uat", "step_uat", "/uat.html", "UAT", "UAT"],
        ["test-data", "step_td", "/test-data.html", "Test Data", "Test Verisi"],
        ["process-flow", "step_pf", "/process-flow.html", "Process Flow", "Süreç Akışı"],
        ["traceability", "step_tr", "/traceability.html", "Traceability", "İzlenebilirlik"],
        ["document", "step_doc", "/document.html", "BA Document", "BA Dokümanı"]
      ];

      const index = steps.findIndex(function (x) {
        return x[0] === currentPage;
      });

      if (index === -1) {
        return;
      }

      const stateIds = {
        requirement: "requirement",
        "user-story": "user_story",
        "acceptance-criteria": "acceptance_criteria",
        uat: "uat",
        "test-data": "test_data",
        "process-flow": "process_flow",
        traceability: "traceability",
        document: "document"
      };

      let done = [];

      try {
        const st = JSON.parse(
          sessionStorage.getItem("baforge-workflow-state")
        );
        if (st && Array.isArray(st.completedSteps)) {
          done = st.completedSteps;
        }
      } catch (error) {}

      if (!document.getElementById("baforge-stepper-style")) {
        const st = document.createElement("style");
        st.id = "baforge-stepper-style";
        st.textContent =
          "body.baforge-has-stepper .workflow-wrapper," +
          "body.baforge-has-stepper section.workflow," +
          "body.baforge-has-stepper div.workflow{display:none !important}" +
          ".baforge-stepper{display:flex;gap:6px;overflow-x:auto;padding:10px 16px;margin:0 auto;max-width:1200px;-webkit-overflow-scrolling:touch}" +
          ".baforge-stepper a{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;text-decoration:none;font-size:13px;color:inherit;border:1px solid rgba(128,138,160,.45);opacity:.8;white-space:nowrap}" +
          ".baforge-stepper a .n{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:rgba(128,138,160,.3);font-size:11px;font-weight:700}" +
          ".baforge-stepper a.done{opacity:1}" +
          ".baforge-stepper a.done .n{background:#22c55e;color:#04200f}" +
          ".baforge-stepper a.current{opacity:1;border-color:#818cf8;background:rgba(129,140,248,.18);font-weight:700}" +
          ".baforge-stepper a.current .n{background:#818cf8;color:#0b0b1a}";
        document.head.appendChild(st);
      }

      const bar = document.createElement("nav");
      bar.className = "baforge-stepper";
      bar.setAttribute("aria-label", language === "tr" ? "İş akışı adımları" : "Workflow steps");

      steps.forEach(function (x, i) {
        const a = document.createElement("a");
        a.href = x[2];
        const isCurrent = i === index;
        const isDone = !isCurrent && done.indexOf(stateIds[x[0]]) !== -1;
        a.className = isCurrent ? "current" : (isDone ? "done" : "");
        if (isCurrent) {
          a.setAttribute("aria-current", "step");
        }
        const n = document.createElement("span");
        n.className = "n";
        n.textContent = isDone ? "✓" : String(i + 1);
        a.appendChild(n);
        a.appendChild(document.createTextNode(language === "tr" ? x[4] : x[3]));
        bar.appendChild(a);
      });

      nav.parentNode.insertBefore(bar, nav.nextSibling);
      document.body.classList.add("baforge-has-stepper");

    })();

    /* =======================================================
       MOBILE MENU
    ======================================================= */

    const dropdowns = Array.prototype.slice.call(
      nav.querySelectorAll(".baforge-dd")
    );

    function closeDropdowns(except) {
      dropdowns.forEach(function (dd) {
        if (dd !== except) {
          dd.classList.remove("open");
          const b = dd.querySelector(".baforge-dd-btn");
          if (b) {
            b.setAttribute("aria-expanded", "false");
          }
        }
      });
    }

    dropdowns.forEach(function (dd) {
      const b = dd.querySelector(".baforge-dd-btn");
      if (!b) {
        return;
      }
      b.addEventListener("click", function (event) {
        event.stopPropagation();
        const open = dd.classList.toggle("open");
        b.setAttribute("aria-expanded", String(open));
        closeDropdowns(dd);
      });
    });

    document.addEventListener("click", function () {
      closeDropdowns(null);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeDropdowns(null);
      }
    });

    const menuButton =
      document.getElementById("baforgeMenuButton");

    const mobileMenu =
      document.getElementById("baforgeMobileMenu");

    if (menuButton && mobileMenu) {

      menuButton.addEventListener(
        "click",
        function () {

          const isOpen =
            mobileMenu.classList.toggle("open");

          menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
          );

          menuButton.textContent =
            isOpen ? "✕" : "☰";
        }
      );
    }

    /* =======================================================
       LANGUAGE SELECTOR
    ======================================================= */

    const globalLanguage =
      document.getElementById("baforgeLanguage");

    if (globalLanguage) {

      globalLanguage.value = language;

      globalLanguage.addEventListener(
        "change",
        function () {
          changeLanguage(this.value);
        }
      );
    }

    const pageLanguage =
      document.getElementById("language");

    if (pageLanguage) {

      pageLanguage.value = language;

      pageLanguage.addEventListener(
        "change",
        function () {
          changeLanguage(this.value);
        }
      );
    }

    /* =======================================================
       LANGUAGE CHANGE
    ======================================================= */

    function changeLanguage(lang) {

      if (lang !== "tr" && lang !== "en") {
        return;
      }

      localStorage.setItem(
        "baforge-language",
        lang
      );

      document.documentElement.lang = lang;

      if (i18n) {

        try {

          if (
            typeof i18n.setLanguage ===
            "function"
          ) {
            i18n.setLanguage(lang);
          } else if (
            typeof i18n.changeLanguage ===
            "function"
          ) {
            i18n.changeLanguage(lang);
          }

        } catch (error) {

          console.warn(
            "BAForge language change failed.",
            error
          );
        }
      }

      window.dispatchEvent(
        new CustomEvent(
          "baforge:language-changed",
          {
            detail: {
              language: lang
            }
          }
        )
      );

      /*
       * Page-specific selectors are synchronized
       * without triggering recursive changes.
       */

      if (
        pageLanguage &&
        pageLanguage.value !== lang
      ) {
        pageLanguage.value = lang;
      }

      if (i18n) {

        try {

          if (
            typeof i18n.apply ===
            "function"
          ) {
            i18n.apply();
          }

        } catch (error) {

          console.warn(
            "BAForge i18n apply failed.",
            error
          );
        }
      }

      /*
       * Navigation labels are generated from
       * the current language, therefore a reload
       * keeps every page synchronized.
       */

      window.location.reload();
    }

    /* =======================================================
       WORKFLOW NAVIGATION
       
       IMPORTANT:
       - Analyzer is pre-work.
       - Analyzer gets NO shared bottom navigation.
       - Its own page will contain one
         "Gereksinime Devam Et" action.
       - Other workflow pages get Previous + Next.
    ======================================================= */

    const workflow = {

      requirement: {
        previous: null,
        next: {
          href: "/user-story.html",
          label: t(
            "workflow.requirementToUserStory"
          )
        }
      },

      "user-story": {
        previous: {
          href: "/requirement.html",
          label: t("nav.requirement")
        },
        next: {
          href: "/acceptance-criteria.html",
          label: t(
            "workflow.userStoryToAcceptanceCriteria"
          )
        }
      },

      "acceptance-criteria": {
        previous: {
          href: "/user-story.html",
          label: t("nav.userStory")
        },
        next: {
          href: "/uat.html",
          label: t(
            "workflow.acceptanceCriteriaToUat"
          )
        }
      },

      uat: {
        previous: {
          href: "/acceptance-criteria.html",
          label: t("nav.acceptanceCriteria")
        },
        next: {
          href: "/test-data.html",
          label: t(
            "workflow.uatToTestData"
          )
        }
      },

      "test-data": {
        previous: {
          href: "/uat.html",
          label: t("nav.uat")
        },
        next: {
          href: "/process-flow.html",
          label: t(
            "workflow.testDataToProcessFlow"
          )
        }
      },

      "process-flow": {
        previous: {
          href: "/test-data.html",
          label: t("nav.testData")
        },
        next: {
          href: "/traceability.html",
          label: t(
            "workflow.processFlowToTraceability"
          )
        }
      },

      traceability: {
        previous: {
          href: "/process-flow.html",
          label: t("nav.processFlow")
        },
        next: {
          href: "/document.html",
          label: t(
            "workflow.traceabilityToDocument"
          )
        }
      },

      document: {
        previous: {
          href: "/traceability.html",
          label: t("nav.traceability")
        },
        next: null
      }
    };

    const WORKFLOW_STEP_BY_PAGE = {
      requirement: "requirement",
      "user-story": "user_story",
      "acceptance-criteria": "acceptance_criteria",
      uat: "uat",
      "test-data": "test_data",
      "process-flow": "process_flow",
      traceability: "traceability",
      document: "document"
    };

    function markWorkflowStepDone(page, nextHref) {

      try {

        const step =
          WORKFLOW_STEP_BY_PAGE[page];

        if (!step) {
          return;
        }

        const nextPage =
          String(nextHref || "")
            .replace(/^\//, "")
            .replace(/\.html.*$/, "");

        const nextStep =
          WORKFLOW_STEP_BY_PAGE[nextPage] || step;

        let state = null;

        try {
          state = JSON.parse(
            sessionStorage.getItem(
              "baforge-workflow-state"
            )
          );
        } catch (error) {
          state = null;
        }

        if (
          !state ||
          typeof state !== "object"
        ) {
          state = {};
        }

        const done =
          Array.isArray(state.completedSteps)
            ? state.completedSteps
            : [];

        if (!done.includes(step)) {
          done.push(step);
        }

        state.completedSteps = done;
        state.currentStep = nextStep;

        sessionStorage.setItem(
          "baforge-workflow-state",
          JSON.stringify(state)
        );

      } catch (error) {
        /* Progress tracking must never block navigation. */
      }

    }

    function addWorkflowNavigation() {

      /*
       * Analyzer is intentionally excluded.
       * Requirement has no previous workflow step.
       * Document has no next workflow step.
       */

      if (
        currentPage === "home" ||
        currentPage === "requirement-analyzer"
      ) {
        return;
      }

      const config =
        workflow[currentPage];

      if (!config) {
        return;
      }

      const section =
        document.createElement("section");

      section.className =
        "baforge-workflow-nav";

      if (currentPage === "requirement") {
        section.classList.add("is-analyzer");
      }

      if (config.previous) {

        const previous =
          document.createElement("a");

        previous.className =
          "baforge-workflow-button previous";

        previous.href =
          config.previous.href;

        previous.textContent =
          `← ${t("workflow.previousStep")}: ${config.previous.label}`;

        section.appendChild(previous);
      }

      if (config.next) {

        const next =
          document.createElement("a");

        next.className =
          "baforge-workflow-button next";

        next.href =
          config.next.href;

        next.textContent =
          `${config.next.label} →`;

        /*
         * Going forward marks the current step as completed in the shared
         * workflow state, so progress is tracked on every page, not only
         * on Requirement and Acceptance Criteria.
         */
        next.addEventListener(
          "click",
          function () {
            markWorkflowStepDone(
              currentPage,
              config.next.href
            );
          }
        );

        section.appendChild(next);
      }

      document.body.appendChild(section);
    }

    addWorkflowNavigation();

    /* =======================================================
       CENTRAL I18N APPLY
    ======================================================= */

    if (i18n) {

      try {

        if (
          typeof i18n.apply ===
          "function"
        ) {
          i18n.apply();
        }

      } catch (error) {

        console.warn(
          "BAForge i18n initial apply failed.",
          error
        );
      }
    }

    /* =======================================================
       HOME PAGE LANGUAGE SUPPORT
    ======================================================= */

    function updateHomeLanguage(lang) {

      if (currentPage !== "home") {
        return;
      }

      const isTr = lang === "tr";

      const eyebrow =
        document.querySelector(".eyebrow");

      const heroTitle =
        document.querySelector(".hero h1");

      const heroText =
        document.querySelector(".hero p");

      const heroPrimary =
        document.querySelector(
          ".hero-actions .btn-primary"
        );

      const heroSecondary =
        document.querySelector(
          ".hero-actions .btn-secondary"
        );

      if (eyebrow) {
        eyebrow.innerHTML =
          isTr
            ? '<span class="eyebrow-dot"></span> Yapay Zeka Destekli BA & QA Platformu'
            : '<span class="eyebrow-dot"></span> AI-powered Business Analysis & QA Toolkit';
      }

      if (heroTitle) {
        heroTitle.innerHTML =
          isTr
            ? 'Gereksinimleri <span>Yapılandırılmış Çıktılara</span> Dönüştür.'
            : 'Turn Requirements Into <span>Structured Artifacts.</span>';
      }

      if (heroText) {
        heroText.textContent =
          isTr
            ? "BAForge AI, Business Analyst ve QA profesyonellerinin gereksinimleri User Story, Acceptance Criteria, UAT Test Case, Test Data ve Process Flow çıktılarıyla yapılandırmasına yardımcı olur."
            : "BAForge AI helps Business Analysts and QA professionals transform requirements into structured User Stories, Acceptance Criteria, UAT Test Cases, Test Data and Process Flows.";
      }

      if (heroPrimary) {
        heroPrimary.textContent =
          isTr
            ? "User Story ile Başla →"
            : "Start with User Story →";
      }

      if (heroSecondary) {
        heroSecondary.textContent =
          isTr
            ? "Araçları Keşfet"
            : "Explore Tools";
      }

      /* Home page texts are tagged with data-i18n in index.html. */
      const homeText = {
        "en": {
          "analyzer.t": "Requirement Analyzer",
          "analyzer.d": "Optional pre-analysis: scores clarity, completeness and testability and finds ambiguities before you start.",
          "analyzer.l": "Open Analyzer →",
          "workspace.step": "Step 1",
          "workspace.t": "Requirement Workspace",
          "workspace.d": "Create or refine requirements directly, no analysis needed. The first step of the BA Workflow.",
          "workspace.l": "Open Workspace →",
          "story.step": "Step 2",
          "story.t": "User Story Generator",
          "story.d": "Turn a requirement into a structured User Story with business value, rules, assumptions and edge cases.",
          "story.l": "Open Generator →",
          "ac.step": "Step 3",
          "ac.t": "Acceptance Criteria",
          "ac.d": "Convert requirements into testable Given / When / Then criteria and find coverage gaps.",
          "ac.l": "Open Generator →",
          "uat.step": "Step 4",
          "uat.t": "UAT Test Cases",
          "uat.d": "Generate professional UAT test cases from your requirements.",
          "uat.l": "Open Generator →",
          "td.step": "Step 5",
          "td.t": "Test Data Generator",
          "td.d": "Create realistic synthetic data sets for QA and UAT.",
          "td.l": "Open Generator →",
          "pf.step": "Step 6",
          "pf.t": "Process & Flow Generator",
          "pf.d": "Model the business process as steps, decisions and alternative flows.",
          "pf.l": "Open Generator →",
          "tr.step": "Step 7",
          "tr.t": "Traceability Matrix",
          "tr.d": "See how requirements, stories, criteria and tests connect.",
          "tr.l": "Open Matrix →",
          "doc.step": "Step 8",
          "doc.t": "BA Document Generator",
          "doc.d": "Assemble your work into a structured BA document.",
          "doc.l": "Open Generator →",
          "json.t": "JSON ↔ XML Converter",
          "json.d": "Convert between JSON and XML in your browser. Nothing is sent to a server.",
          "json.l": "Open Converter →",
          "sql.t": "SQL Beautifier",
          "sql.d": "Format or minify SQL queries. Nothing is sent to a server.",
          "sql.l": "Open Beautifier →",
          "spec.t": "Functional Spec Builder",
          "spec.d": "Turn a specification PDF into a functional analysis Word document a developer can build from, then refine it with edits and instructions.",
          "spec.l": "Open Builder →",
          "rx.t": "Regex Builder",
          "rx.d": "Test patterns with live highlighting and a plain-language explanation.",
          "rx.l": "Open Builder →",
          "jsc.t": "JSON Schema Generator",
          "jsc.d": "Generate a JSON Schema from one or more JSON samples.",
          "jsc.l": "Open Generator →",
          "mock.t": "Mock Data Generator",
          "mock.d": "Create fake test data as JSON, CSV, SQL or NDJSON.",
          "mock.l": "Open Generator →",
          "api.t": "API Designer",
          "api.d": "Design endpoints and export an OpenAPI 3.0.3 document.",
          "api.l": "Open Designer →",
          "g.design": "Design Tools",
          "fc.t": "Flowchart Designer",
          "fc.d": "Write the flow as text and get a flowchart. Export as SVG or PNG.",
          "fc.l": "Open Designer →",
          "er.t": "ER Diagram Designer",
          "er.d": "Describe tables and relationships as text and get an ER diagram.",
          "er.l": "Open Designer →",
          "uml.t": "UML Designer",
          "uml.d": "Create UML class diagrams from simple text.",
          "uml.l": "Open Designer →",
          "bpmn.t": "BPMN Designer",
          "bpmn.d": "Model a process with lanes, tasks and gateways, with basic checks.",
          "bpmn.l": "Open Designer →",
          "ui.t": "UI Designer",
          "ui.d": "Sketch screen wireframes by dragging components.",
          "ui.l": "Open Designer →",
          "tools.k": "Tools",
          "tools.h": "Everything You Can Open Today",
          "tools.p": "Open any tool directly. The BA Workflow tools can also be used one after another, step by step.",
          "g.req": "Requirement",
          "g.wf": "BA Workflow",
          "v1.t": "Built for Business Analysts",
          "v1.p": "BAForge AI focuses on the practical artifacts Business Analysts create throughout the delivery lifecycle.",
          "v2.t": "Designed for QA Collaboration",
          "v2.p": "Move from requirements to acceptance testing without losing the original business context.",
          "cta.t": "Ready to turn your requirement into something usable?",
          "cta.p": "Start with a User Story and continue through Acceptance Criteria and UAT Test Cases.",
          "cta.b": "Create Your First User Story →",
          "foot": "Business Analysis & QA Toolkit",
          "vf1": "Structured analysis",
          "vf2": "Testable requirements",
          "vf3": "Business rules & assumptions",
          "vf4": "Edge cases & open questions",
          "vf5": "Given / When / Then",
          "vf6": "Positive & negative scenarios",
          "vf7": "Boundary & validation coverage",
          "vf8": "UAT-ready test cases",
          "g.dev": "Developer Tools",
          "w1.t": "Requirement",
          "w1.d": "Start with the business requirement.",
          "w2.t": "User Story",
          "w2.d": "Structure the requirement clearly.",
          "w3.t": "Acceptance Criteria",
          "w3.d": "Define measurable conditions.",
          "w4.t": "UAT Test Cases",
          "w4.d": "Turn requirements into executable tests.",
          "w5.t": "Test Data",
          "w5.d": "Prepare realistic synthetic data.",
          "w6.t": "Process Flow",
          "w6.d": "Model the process and its decisions.",
          "w7.t": "Traceability",
          "w7.d": "Connect requirements to tests.",
          "w8.t": "BA Document",
          "w8.d": "Assemble the final document.",
          "wf.k": "Workflow",
          "wf.h": "From Requirement to BA Document",
          "wf.p": "A connected eight-step workflow for turning business requirements into structured and testable delivery artifacts."
        },
        "tr": {
          "analyzer.t": "Gereksinim Analizörü",
          "analyzer.d": "İsteğe bağlı ön analiz: netlik, bütünlük ve test edilebilirlik puanlarını verir, belirsizlikleri bulur.",
          "analyzer.l": "Analizörü Aç →",
          "workspace.step": "Adım 1",
          "workspace.t": "Gereksinim Çalışma Alanı",
          "workspace.d": "Gereksinimleri doğrudan oluşturun veya düzenleyin, analiz gerekmez. BA Akışı'nın ilk adımı.",
          "workspace.l": "Çalışma Alanını Aç →",
          "story.step": "Adım 2",
          "story.t": "Kullanıcı Hikâyesi Üretici",
          "story.d": "Bir gereksinimi iş değeri, kurallar, varsayımlar ve uç durumlarla yapılandırılmış bir Kullanıcı Hikâyesine dönüştürün.",
          "story.l": "Üreticiyi Aç →",
          "ac.step": "Adım 3",
          "ac.t": "Kabul Kriterleri",
          "ac.d": "Gereksinimleri test edilebilir Given / When / Then kriterlerine çevirin ve kapsam boşluklarını bulun.",
          "ac.l": "Üreticiyi Aç →",
          "uat.step": "Adım 4",
          "uat.t": "UAT Test Senaryoları",
          "uat.d": "Gereksinimlerinizden profesyonel UAT test senaryoları üretin.",
          "uat.l": "Üreticiyi Aç →",
          "td.step": "Adım 5",
          "td.t": "Test Verisi Üretici",
          "td.d": "QA ve UAT için gerçekçi, sentetik veri setleri oluşturun.",
          "td.l": "Üreticiyi Aç →",
          "pf.step": "Adım 6",
          "pf.t": "Süreç ve Akış Üretici",
          "pf.d": "İş sürecini adımlar, kararlar ve alternatif akışlar olarak modelleyin.",
          "pf.l": "Üreticiyi Aç →",
          "tr.step": "Adım 7",
          "tr.t": "İzlenebilirlik Matrisi",
          "tr.d": "Gereksinim, hikâye, kriter ve testlerin birbirine nasıl bağlandığını görün.",
          "tr.l": "Matrisi Aç →",
          "doc.step": "Adım 8",
          "doc.t": "BA Doküman Üretici",
          "doc.d": "Çalışmanızı yapılandırılmış bir BA dokümanında birleştirin.",
          "doc.l": "Üreticiyi Aç →",
          "json.t": "JSON ↔ XML Dönüştürücü",
          "json.d": "JSON ve XML arasında tarayıcınızda dönüştürün. Hiçbir şey sunucuya gönderilmez.",
          "json.l": "Dönüştürücüyü Aç →",
          "sql.t": "SQL Güzelleştirici",
          "sql.d": "SQL sorgularını biçimlendirin veya sıkıştırın. Hiçbir şey sunucuya gönderilmez.",
          "sql.l": "Güzelleştiriciyi Aç →",
          "spec.t": "Fonksiyonel Analiz Oluşturucu",
          "spec.d": "Bir spesifikasyon PDF'inden yazılımcının geliştirebileceği Word fonksiyonel analiz dokümanı çıkarın; düzenleme ve talimatlarla iyileştirin.",
          "spec.l": "Oluşturucuyu Aç →",
          "rx.t": "Regex Oluşturucu",
          "rx.d": "Desenleri canlı vurgu ve sade açıklamayla test edin.",
          "rx.l": "Oluşturucuyu Aç →",
          "jsc.t": "JSON Schema Oluşturucu",
          "jsc.d": "Bir veya daha fazla JSON örneğinden JSON Schema üretin.",
          "jsc.l": "Oluşturucuyu Aç →",
          "mock.t": "Sahte Veri Üretici",
          "mock.d": "JSON, CSV, SQL veya NDJSON olarak sahte test verisi üretin.",
          "mock.l": "Üreticiyi Aç →",
          "api.t": "API Tasarımcısı",
          "api.d": "Endpoint'leri tasarlayın, OpenAPI 3.0.3 belgesi olarak dışa aktarın.",
          "api.l": "Tasarımcıyı Aç →",
          "g.design": "Tasarım Araçları",
          "fc.t": "Akış Şeması Tasarımcısı",
          "fc.d": "Akışı metin olarak yazın, akış şemasını alın. SVG veya PNG olarak aktarın.",
          "fc.l": "Tasarımcıyı Aç →",
          "er.t": "ER Diyagram Tasarımcısı",
          "er.d": "Tabloları ve ilişkileri metin olarak yazın, ER diyagramı alın.",
          "er.l": "Tasarımcıyı Aç →",
          "uml.t": "UML Tasarımcısı",
          "uml.d": "Basit metinden UML sınıf diyagramları oluşturun.",
          "uml.l": "Tasarımcıyı Aç →",
          "bpmn.t": "BPMN Tasarımcısı",
          "bpmn.d": "Süreci kulvar, görev ve geçitlerle modelleyin; temel kontrollerle.",
          "bpmn.l": "Tasarımcıyı Aç →",
          "ui.t": "Arayüz Tasarımcısı",
          "ui.d": "Bileşenleri sürükleyerek ekran taslakları çizin.",
          "ui.l": "Tasarımcıyı Aç →",
          "tools.k": "Araçlar",
          "tools.h": "Bugün Açabileceğiniz Her Şey",
          "tools.p": "Herhangi bir aracı doğrudan açın. BA Akışı araçları isterseniz adım adım, art arda da kullanılabilir.",
          "g.req": "Gereksinim",
          "g.wf": "BA Akışı",
          "v1.t": "İş Analistleri İçin Tasarlandı",
          "v1.p": "BAForge AI, iş analistlerinin teslimat süreci boyunca ürettiği pratik çıktılara odaklanır.",
          "v2.t": "QA Ekipleriyle İş Birliği İçin",
          "v2.p": "İş bağlamını kaybetmeden gereksinimden kabul testine ilerleyin.",
          "cta.t": "Gereksiniminizi kullanılabilir hale getirmeye hazır mısınız?",
          "cta.p": "Bir Kullanıcı Hikâyesi ile başlayın, Kabul Kriterleri ve UAT Test Senaryolarıyla devam edin.",
          "cta.b": "İlk Kullanıcı Hikâyenizi Oluşturun →",
          "foot": "İş Analizi ve QA Araç Seti",
          "vf1": "Yapılandırılmış analiz",
          "vf2": "Test edilebilir gereksinimler",
          "vf3": "İş kuralları ve varsayımlar",
          "vf4": "Uç durumlar ve açık sorular",
          "vf5": "Given / When / Then",
          "vf6": "Pozitif ve negatif senaryolar",
          "vf7": "Sınır ve doğrulama kapsamı",
          "vf8": "UAT'a hazır test senaryoları",
          "g.dev": "Geliştirici Araçları",
          "w1.t": "Gereksinim",
          "w1.d": "İş gereksinimiyle başlayın.",
          "w2.t": "Kullanıcı Hikâyesi",
          "w2.d": "Gereksinimi net biçimde yapılandırın.",
          "w3.t": "Kabul Kriterleri",
          "w3.d": "Ölçülebilir koşulları tanımlayın.",
          "w4.t": "UAT Test Senaryoları",
          "w4.d": "Gereksinimleri uygulanabilir testlere dönüştürün.",
          "w5.t": "Test Verisi",
          "w5.d": "Gerçekçi sentetik veri hazırlayın.",
          "w6.t": "Süreç Akışı",
          "w6.d": "Süreci ve karar noktalarını modelleyin.",
          "w7.t": "İzlenebilirlik",
          "w7.d": "Gereksinimleri testlere bağlayın.",
          "w8.t": "BA Dokümanı",
          "w8.d": "Nihai dokümanı oluşturun.",
          "wf.k": "Akış",
          "wf.h": "Gereksinimden BA Dokümanına",
          "wf.p": "İş gereksinimlerini yapılandırılmış ve test edilebilir teslimat çıktılarına dönüştüren, bağlantılı sekiz adımlı bir akış."
        }
      };

      const dict = homeText[isTr ? "tr" : "en"];

      document.querySelectorAll("[data-i18n]").forEach(
        (el) => {

          const value = dict[el.getAttribute("data-i18n")];

          if (value !== undefined) {
            el.textContent = value;
          }
        }
      );
    }

    updateHomeLanguage(language);

    /* Accounts: sign-in chip, feedback button, Authorization header on /api calls. */
    if (!window.BAAuth && !document.querySelector('script[src="/core/auth.js"]')) {
      const authScript = document.createElement("script");
      authScript.src = "/core/auth.js";
      document.head.appendChild(authScript);
    }

    /* =======================================================
       GLOBAL LANGUAGE EVENTS
    ======================================================= */

    window.dispatchEvent(
      new CustomEvent(
        "baforge:language-ready",
        {
          detail: {
            language
          }
        }
      )
    );
  }

})();
