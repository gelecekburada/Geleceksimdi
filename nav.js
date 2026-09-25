(function () {
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

  const savedLanguage =
    localStorage.getItem("baforge-language") || "en";

  /* =========================================================
     SHARED STYLES
  ========================================================= */

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
      grid-template-columns: repeat(2, minmax(0, 1fr));
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

    /* QUICK ACTIONS */

    .baforge-actions {
      max-width: 1180px;
      margin: 0 auto;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      background: #f8fafc;
    }

    .baforge-actions::-webkit-scrollbar {
      display: none;
    }

    .baforge-action {
      flex-shrink: 0;
      padding: 7px 11px;
      border: 1px solid #dbe3ef;
      border-radius: 8px;
      background: white;
      color: #475467;
      font-size: 11px;
      font-weight: 700;
      text-decoration: none;
      transition: 0.2s ease;
    }

    .baforge-action:hover {
      color: #2563eb;
      border-color: #bfdbfe;
      background: #eff6ff;
      transform: translateY(-1px);
    }

    /* NEXT STEP */

    .baforge-next-step {
      max-width: 1100px;
      margin: 28px auto 45px;
      padding: 22px 24px;
      border: 1px solid #dbeafe;
      border-radius: 16px;
      background: linear-gradient(135deg, #eff6ff, #f5f3ff);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .baforge-next-copy {
      min-width: 0;
    }

    .baforge-next-label {
      margin-bottom: 5px;
      color: #2563eb;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .baforge-next-title {
      color: #172033;
      font-size: 17px;
      font-weight: 800;
    }

    .baforge-next-button {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 0 17px;
      border-radius: 10px;
      background: #2563eb;
      color: white;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      transition: 0.2s ease;
    }

    .baforge-next-button:hover {
      background: #1d4ed8;
      transform: translateY(-2px);
    }

    .tool-card {
      cursor: pointer;
    }

    .tool-card .tool-link {
      transition: 0.2s ease;
    }

    .tool-card:hover .tool-link {
      transform: translateX(4px);
    }

    /* MOBILE */

    @media (max-width: 1050px) {

      .baforge-nav-inner {
        padding: 0 14px;
      }

      .baforge-links {
        max-width: calc(100vw - 230px);
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

      .baforge-actions {
        padding: 9px 16px;
      }

      .baforge-next-step {
        margin: 22px 16px 35px;
        padding: 19px;
        align-items: flex-start;
        flex-direction: column;
      }

      .baforge-next-button {
        width: 100%;
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


  /* =========================================================
     TRANSLATIONS
  ========================================================= */

  const navText = {

    en: {
      home: "Home",
      analyzer: "Analyzer",
      requirement: "Requirement",
      story: "User Story",
      criteria: "Acceptance Criteria",
      uat: "UAT Test Cases",
      testData: "Test Data",
      processFlow: "Process Flow",
      traceability: "Traceability",
      document: "BA Document",
      language: "Language",

      next: "Next Step",

      analyzerNext: "Continue to Requirement",
      requirementNext: "Continue to User Story",
      storyNext: "Continue to Acceptance Criteria",
      criteriaNext: "Continue to UAT Test Cases",
      uatNext: "Continue to Test Data",
      testDataNext: "Continue to Process Flow",
      processFlowNext: "Continue to Traceability",
      traceabilityNext: "Continue to BA Document"
    },

    tr: {
      home: "Ana Sayfa",
      analyzer: "Analyzer",
      requirement: "Requirement",
      story: "User Story",
      criteria: "Acceptance Criteria",
      uat: "UAT Test Case'leri",
      testData: "Test Data",
      processFlow: "Process Flow",
      traceability: "Traceability",
      document: "BA Document",
      language: "Dil",

      next: "Sonraki Adım",

      analyzerNext: "Requirement'a Devam Et",
      requirementNext: "User Story'ye Devam Et",
      storyNext: "Acceptance Criteria'ya Devam Et",
      criteriaNext: "UAT Test Case'lerine Devam Et",
      uatNext: "Test Data'ya Devam Et",
      testDataNext: "Process Flow'a Devam Et",
      processFlowNext: "Traceability'ye Devam Et",
      traceabilityNext: "BA Document'a Devam Et"
    }

  };


  function getLanguage() {
    return localStorage.getItem("baforge-language") || savedLanguage;
  }


  function setLanguage(language) {

    localStorage.setItem(
      "baforge-language",
      language
    );

    const pageLanguage =
      document.getElementById("language");

    if (
      pageLanguage &&
      pageLanguage.value !== language
    ) {

      pageLanguage.value = language;

      pageLanguage.dispatchEvent(
        new Event("change", {
          bubbles: true
        })
      );

    }

    document.documentElement.lang =
      language;

    updateSharedText(language);
  }


  /* =========================================================
     NAVIGATION
  ========================================================= */

  const language = getLanguage();

  const text =
    navText[language] || navText.en;

  const nav =
    document.createElement("nav");

  nav.className =
    "baforge-nav";

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
            currentPage === "home"
              ? "active"
              : ""
          }"
          data-nav="home">
          ${text.home}
        </a>

        <a
          href="/requirement-analyzer.html"
          class="baforge-link ${
            currentPage === "requirement-analyzer"
              ? "active"
              : ""
          }"
          data-nav="analyzer">
          ${text.analyzer}
        </a>

        <a
          href="/requirement.html"
          class="baforge-link ${
            currentPage === "requirement"
              ? "active"
              : ""
          }"
          data-nav="requirement">
          ${text.requirement}
        </a>

        <a
          href="/user-story.html"
          class="baforge-link ${
            currentPage === "user-story"
              ? "active"
              : ""
          }"
          data-nav="story">
          ${text.story}
        </a>

        <a
          href="/acceptance-criteria.html"
          class="baforge-link ${
            currentPage === "acceptance-criteria"
              ? "active"
              : ""
          }"
          data-nav="criteria">
          ${text.criteria}
        </a>

        <a
          href="/uat.html"
          class="baforge-link ${
            currentPage === "uat"
              ? "active"
              : ""
          }"
          data-nav="uat">
          ${text.uat}
        </a>

        <a
          href="/test-data.html"
          class="baforge-link ${
            currentPage === "test-data"
              ? "active"
              : ""
          }"
          data-nav="testData">
          ${text.testData}
        </a>

        <a
          href="/process-flow.html"
          class="baforge-link ${
            currentPage === "process-flow"
              ? "active"
              : ""
          }"
          data-nav="processFlow">
          ${text.processFlow}
        </a>

        <a
          href="/traceability.html"
          class="baforge-link ${
            currentPage === "traceability"
              ? "active"
              : ""
          }"
          data-nav="traceability">
          ${text.traceability}
        </a>

        <a
          href="/document.html"
          class="baforge-link ${
            currentPage === "document"
              ? "active"
              : ""
          }"
          data-nav="document">
          ${text.document}
        </a>

      </div>

      <div class="baforge-language">

        <span
          class="baforge-language-label"
          data-nav="language">
          ${text.language}
        </span>

        <select
          class="baforge-language-select"
          id="baforgeLanguage"
          aria-label="${text.language}">

          <option value="tr">TR</option>
          <option value="en">EN</option>

        </select>

      </div>

      <button
        class="baforge-menu-button"
        id="baforgeMenuButton"
        type="button"
        aria-label="Menu"
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
        }"
        data-nav="home">
        ${text.home}
      </a>

      <a
        href="/requirement-analyzer.html"
        class="baforge-mobile-link ${
          currentPage === "requirement-analyzer"
            ? "active"
            : ""
        }"
        data-nav="analyzer">
        ${text.analyzer}
      </a>

      <a
        href="/requirement.html"
        class="baforge-mobile-link ${
          currentPage === "requirement"
            ? "active"
            : ""
        }"
        data-nav="requirement">
        ${text.requirement}
      </a>

      <a
        href="/user-story.html"
        class="baforge-mobile-link ${
          currentPage === "user-story"
            ? "active"
            : ""
        }"
        data-nav="story">
        ${text.story}
      </a>

      <a
        href="/acceptance-criteria.html"
        class="baforge-mobile-link ${
          currentPage === "acceptance-criteria"
            ? "active"
            : ""
        }"
        data-nav="criteria">
        ${text.criteria}
      </a>

      <a
        href="/uat.html"
        class="baforge-mobile-link ${
          currentPage === "uat"
            ? "active"
            : ""
        }"
        data-nav="uat">
        ${text.uat}
      </a>

      <a
        href="/test-data.html"
        class="baforge-mobile-link ${
          currentPage === "test-data"
            ? "active"
            : ""
        }"
        data-nav="testData">
        ${text.testData}
      </a>

      <a
        href="/process-flow.html"
        class="baforge-mobile-link ${
          currentPage === "process-flow"
            ? "active"
            : ""
        }"
        data-nav="processFlow">
        ${text.processFlow}
      </a>

      <a
        href="/traceability.html"
        class="baforge-mobile-link ${
          currentPage === "traceability"
            ? "active"
            : ""
        }"
        data-nav="traceability">
        ${text.traceability}
      </a>

      <a
        href="/document.html"
        class="baforge-mobile-link ${
          currentPage === "document"
            ? "active"
            : ""
        }"
        data-nav="document">
        ${text.document}
      </a>

    </div>
  `;


  document.body.insertBefore(
    nav,
    document.body.firstChild
  );


  /* =========================================================
     MOBILE MENU
  ========================================================= */

  const menuButton =
    document.getElementById(
      "baforgeMenuButton"
    );

  const mobileMenu =
    document.getElementById(
      "baforgeMobileMenu"
    );


  menuButton.addEventListener(
    "click",
    function () {

      const isOpen =
        mobileMenu.classList.toggle(
          "open"
        );

      menuButton.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      menuButton.textContent =
        isOpen
          ? "✕"
          : "☰";
    }
  );


  /* =========================================================
     LANGUAGE SELECTOR
  ========================================================= */

  const globalLanguage =
    document.getElementById(
      "baforgeLanguage"
    );

  globalLanguage.value =
    language;

  globalLanguage.addEventListener(
    "change",
    function () {
      setLanguage(
        this.value
      );
    }
  );


  /* =========================================================
     SYNC EXISTING PAGE LANGUAGE
  ========================================================= */

  const pageLanguage =
    document.getElementById(
      "language"
    );

  if (pageLanguage) {

    pageLanguage.value =
      language;

    pageLanguage.addEventListener(
      "change",
      function () {

        localStorage.setItem(
          "baforge-language",
          this.value
        );

        globalLanguage.value =
          this.value;

        updateSharedText(
          this.value
        );

      }
    );

    pageLanguage.dispatchEvent(
      new Event(
        "change",
        {
          bubbles: true
        }
      )
    );
  }


  /* =========================================================
     QUICK ACTIONS
  ========================================================= */

  if (currentPage !== "home") {

    const actions =
      document.createElement("div");

    actions.className =
      "baforge-actions";

    const actionMap = {

      "requirement-analyzer": `
        <a
          class="baforge-action"
          href="/requirement.html">
          → ${text.requirement}
        </a>
      `,

      "requirement": `
        <a
          class="baforge-action"
          href="/requirement-analyzer.html">
          ← ${text.analyzer}
        </a>

        <a
          class="baforge-action"
          href="/user-story.html">
          → ${text.story}
        </a>
      `,

      "user-story": `
        <a
          class="baforge-action"
          href="/requirement.html">
          ← ${text.requirement}
        </a>

        <a
          class="baforge-action"
          href="/acceptance-criteria.html">
          → ${text.criteria}
        </a>
      `,

      "acceptance-criteria": `
        <a
          class="baforge-action"
          href="/user-story.html">
          ← ${text.story}
        </a>

        <a
          class="baforge-action"
          href="/uat.html">
          → ${text.uat}
        </a>
      `,

      "uat": `
        <a
          class="baforge-action"
          href="/acceptance-criteria.html">
          ← ${text.criteria}
        </a>

        <a
          class="baforge-action"
          href="/test-data.html">
          → ${text.testData}
        </a>
      `,

      "test-data": `
        <a
          class="baforge-action"
          href="/uat.html">
          ← ${text.uat}
        </a>

        <a
          class="baforge-action"
          href="/process-flow.html">
          → ${text.processFlow}
        </a>
      `,

      "process-flow": `
        <a
          class="baforge-action"
          href="/test-data.html">
          ← ${text.testData}
        </a>

        <a
          class="baforge-action"
          href="/traceability.html">
          → ${text.traceability}
        </a>
      `,

      "traceability": `
        <a
          class="baforge-action"
          href="/process-flow.html">
          ← ${text.processFlow}
        </a>

        <a
          class="baforge-action"
          href="/document.html">
          → ${text.document}
        </a>
      `,

      "document": `
        <a
          class="baforge-action"
          href="/traceability.html">
          ← ${text.traceability}
        </a>
      `
    };


    actions.innerHTML =
      actionMap[currentPage] || "";


    document.body.insertBefore(
      actions,
      document.body.children[1]
    );
  }


  /* =========================================================
     NEXT STEP
  ========================================================= */

  function addNextStep() {

    if (
      currentPage === "home" ||
      currentPage === "document"
    ) {
      return;
    }

    const next =
      document.createElement("section");

    next.className =
      "baforge-next-step";

    let title = "";
    let href = "";

    if (
      currentPage ===
      "requirement-analyzer"
    ) {
      title =
        text.analyzerNext;
      href =
        "/requirement.html";
    }

    if (
      currentPage ===
      "requirement"
    ) {
      title =
        text.requirementNext;
      href =
        "/user-story.html";
    }

    if (
      currentPage ===
      "user-story"
    ) {
      title =
        text.storyNext;
      href =
        "/acceptance-criteria.html";
    }

    if (
      currentPage ===
      "acceptance-criteria"
    ) {
      title =
        text.criteriaNext;
      href =
        "/uat.html";
    }

    if (
      currentPage ===
      "uat"
    ) {
      title =
        text.uatNext;
      href =
        "/test-data.html";
    }

    if (
      currentPage ===
      "test-data"
    ) {
      title =
        text.testDataNext;
      href =
        "/process-flow.html";
    }

    if (
      currentPage ===
      "process-flow"
    ) {
      title =
        text.processFlowNext;
      href =
        "/traceability.html";
    }

    if (
      currentPage ===
      "traceability"
    ) {
      title =
        text.traceabilityNext;
      href =
        "/document.html";
    }

    if (!href) {
      return;
    }

    next.innerHTML = `

      <div class="baforge-next-copy">

        <div class="baforge-next-label">
          ${text.next}
        </div>

        <div class="baforge-next-title">
          ${title}
        </div>

      </div>

      <a
        href="${href}"
        class="baforge-next-button">
        ${title} →
      </a>

    `;

    document.body.appendChild(
      next
    );
  }

  addNextStep();


  /* =========================================================
     HOMEPAGE TRANSLATION
  ========================================================= */

  function updateHomeLanguage(lang) {

    if (
      currentPage !== "home"
    ) {
      return;
    }

    const isTr =
      lang === "tr";


    const eyebrow =
      document.querySelector(
        ".eyebrow"
      );

    const heroTitle =
      document.querySelector(
        ".hero h1"
      );

    const heroText =
      document.querySelector(
        ".hero p"
      );

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
          ? "Requirement'tan BA Document'a"
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
        "Requirement",
        "İş gereksinimini yapılandırın."
      ],

      [
        "User Story",
        "Gereksinimi kullanıcı ihtiyacına dönüştürün."
      ],

      [
        "Acceptance Criteria",
        "Ölçülebilir kabul koşullarını tanımlayın."
      ],

      [
        "UAT Test Cases",
        "Gereksinimleri uygulanabilir testlere dönüştürün."
      ],

      [
        "Test Data",
        "Test senaryoları için veri oluşturun."
      ],

      [
        "Process Flow",
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

        if (
          workflowData[index]
        ) {

          el.textContent =
            workflowData[index][0];

        }

      }
    );


    workflowDescriptions.forEach(
      (el, index) => {

        if (
          workflowData[index]
        ) {

          el.textContent =
            workflowData[index][1];

        }

      }
    );

  }


  /* =========================================================
     SHARED TEXT UPDATE
  ========================================================= */

  function updateSharedText(
    lang
  ) {

    const t =
      navText[lang] ||
      navText.en;


    document
      .querySelectorAll(
        '[data-nav="home"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.home;
        }
      );


    document
      .querySelectorAll(
        '[data-nav="analyzer"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.analyzer;
        }
      );


    document
      .querySelectorAll(
        '[data-nav="requirement"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.requirement;
        }
      );


    document
      .querySelectorAll(
        '[data-nav="story"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.story;
        }
      );


    document
      .querySelectorAll(
        '[data-nav="criteria"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.criteria;
        }
      );


    document
      .querySelectorAll(
        '[data-nav="uat"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.uat;
        }
      );


    document
      .querySelectorAll(
        '[data-nav="testData"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.testData;
        }
      );


    document
      .querySelectorAll(
        '[data-nav="processFlow"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.processFlow;
        }
      );


    document
      .querySelectorAll(
        '[data-nav="traceability"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.traceability;
        }
      );


    document
      .querySelectorAll(
        '[data-nav="document"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.document;
        }
      );


    document
      .querySelectorAll(
        '[data-nav="language"]'
      )
      .forEach(
        el => {
          el.textContent =
            t.language;
        }
      );


    updateHomeLanguage(
      lang
    );

  }


  updateSharedText(
    language
  );

})();
