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
        overflow-x: auto;
        scrollbar-width: none;
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
      language: t("nav.language"),
      menu: t("nav.menu")
    };

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

        <div class="baforge-links">

          <a
            href="/"
            class="baforge-link ${
              currentPage === "home" ? "active" : ""
            }">
            ${navText.home}
          </a>

          <a
            href="/requirement-analyzer.html"
            class="baforge-link ${
              currentPage === "requirement-analyzer"
                ? "active"
                : ""
            }">
            ${navText.analyzer}
          </a>

          <a
            href="/requirement.html"
            class="baforge-link ${
              currentPage === "requirement"
                ? "active"
                : ""
            }">
            ${navText.requirement}
          </a>

          <a
            href="/user-story.html"
            class="baforge-link ${
              currentPage === "user-story"
                ? "active"
                : ""
            }">
            ${navText.story}
          </a>

          <a
            href="/acceptance-criteria.html"
            class="baforge-link ${
              currentPage === "acceptance-criteria"
                ? "active"
                : ""
            }">
            ${navText.criteria}
          </a>

          <a
            href="/uat.html"
            class="baforge-link ${
              currentPage === "uat"
                ? "active"
                : ""
            }">
            ${navText.uat}
          </a>

          <a
            href="/test-data.html"
            class="baforge-link ${
              currentPage === "test-data"
                ? "active"
                : ""
            }">
            ${navText.testData}
          </a>

          <a
            href="/process-flow.html"
            class="baforge-link ${
              currentPage === "process-flow"
                ? "active"
                : ""
            }">
            ${navText.processFlow}
          </a>

          <a
            href="/traceability.html"
            class="baforge-link ${
              currentPage === "traceability"
                ? "active"
                : ""
            }">
            ${navText.traceability}
          </a>

          <a
            href="/document.html"
            class="baforge-link ${
              currentPage === "document"
                ? "active"
                : ""
            }">
            ${navText.document}
          </a>

        </div>

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

        <a
          href="/"
          class="baforge-mobile-link ${
            currentPage === "home"
              ? "active"
              : ""
          }">
          ${navText.home}
        </a>

        <a
          href="/requirement-analyzer.html"
          class="baforge-mobile-link ${
            currentPage === "requirement-analyzer"
              ? "active"
              : ""
          }">
          ${navText.analyzer}
        </a>

        <a
          href="/requirement.html"
          class="baforge-mobile-link ${
            currentPage === "requirement"
              ? "active"
              : ""
          }">
          ${navText.requirement}
        </a>

        <a
          href="/user-story.html"
          class="baforge-mobile-link ${
            currentPage === "user-story"
              ? "active"
              : ""
          }">
          ${navText.story}
        </a>

        <a
          href="/acceptance-criteria.html"
          class="baforge-mobile-link ${
            currentPage === "acceptance-criteria"
              ? "active"
              : ""
          }">
          ${navText.criteria}
        </a>

        <a
          href="/uat.html"
          class="baforge-mobile-link ${
            currentPage === "uat"
              ? "active"
              : ""
          }">
          ${navText.uat}
        </a>

        <a
          href="/test-data.html"
          class="baforge-mobile-link ${
            currentPage === "test-data"
              ? "active"
              : ""
          }">
          ${navText.testData}
        </a>

        <a
          href="/process-flow.html"
          class="baforge-mobile-link ${
            currentPage === "process-flow"
              ? "active"
              : ""
          }">
          ${navText.processFlow}
        </a>

        <a
          href="/traceability.html"
          class="baforge-mobile-link ${
            currentPage === "traceability"
              ? "active"
              : ""
          }">
          ${navText.traceability}
        </a>

        <a
          href="/document.html"
          class="baforge-mobile-link ${
            currentPage === "document"
              ? "active"
              : ""
          }">
          ${navText.document}
        </a>

      </div>
    `;

    document.body.insertBefore(
      nav,
      document.body.firstChild
    );

    /* =======================================================
       MOBILE MENU
    ======================================================= */

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

      const headings =
        document.querySelectorAll(
          ".section-heading h2"
        );

      if (headings[0]) {
        headings[0].textContent =
          isTr
            ? "BA / QA Araç Seti"
            : "BA / QA Toolkit";
      }

      if (headings[1]) {
        headings[1].textContent =
          isTr
            ? "Gereksinimden BA Dokümanına"
            : "From Requirement to BA Document";
      }

      const workflowTitles =
        document.querySelectorAll(
          ".workflow-step h3"
        );

      const workflowDescriptions =
        document.querySelectorAll(
          ".workflow-step p"
        );

      const workflowTR = [

        [
          "Gereksinim",
          "İş gereksinimini yapılandırın."
        ],

        [
          "Kullanıcı Hikâyesi",
          "Gereksinimi kullanıcı ihtiyacına dönüştürün."
        ],

        [
          "Kabul Kriterleri",
          "Ölçülebilir kabul koşullarını tanımlayın."
        ],

        [
          "UAT Test Senaryoları",
          "Gereksinimleri uygulanabilir testlere dönüştürün."
        ],

        [
          "Test Verileri",
          "Test senaryoları için veri oluşturun."
        ],

        [
          "Süreç Akışı",
          "İş sürecini ve karar noktalarını görselleştirin."
        ]

      ];

      const workflowEN = [

        [
          "Requirement",
          "Structure the business requirement."
        ],

        [
          "User Story",
          "Turn the requirement into a user need."
        ],

        [
          "Acceptance Criteria",
          "Define measurable acceptance conditions."
        ],

        [
          "UAT Test Cases",
          "Turn requirements into executable tests."
        ],

        [
          "Test Data",
          "Create realistic test data."
        ],

        [
          "Process Flow",
          "Visualize the process and decision points."
        ]

      ];

      const workflowData =
        isTr
          ? workflowTR
          : workflowEN;

      workflowTitles.forEach(
        (el, index) => {

          if (workflowData[index]) {
            el.textContent =
              workflowData[index][0];
          }
        }
      );

      workflowDescriptions.forEach(
        (el, index) => {

          if (workflowData[index]) {
            el.textContent =
              workflowData[index][1];
          }
        }
      );
    }

    updateHomeLanguage(language);

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
