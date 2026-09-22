(function () {
  const path = window.location.pathname;

  let currentPage = "home";

  if (path.endsWith("/user-story.html")) {
    currentPage = "user-story";
  } else if (path.endsWith("/acceptance-criteria.html")) {
    currentPage = "acceptance-criteria";
  } else if (path.endsWith("/uat.html")) {
    currentPage = "uat";
  }

  const savedLanguage = localStorage.getItem("baforge-language") || "en";

  /* =========================================================
     SHARED STYLES
  ========================================================= */

  const styles = `
    .baforge-nav {
      position: sticky;
      top: 0;
      z-index: 9999;
      width: 100%;
      background: rgba(15, 23, 42, 0.97);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 5px 24px rgba(15,23,42,0.12);
    }

    .baforge-nav-inner {
      max-width: 1180px;
      min-height: 68px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .baforge-brand {
      flex-shrink: 0;
      color: white;
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.04em;
      text-decoration: none;
    }

    .baforge-brand span {
      color: #60a5fa;
    }

    .baforge-links {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
    }

    .baforge-link {
      white-space: nowrap;
      padding: 9px 12px;
      border-radius: 9px;
      color: #cbd5e1;
      font-size: 13px;
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
      gap: 7px;
    }

    .baforge-language-label {
      color: #94a3b8;
      font-size: 11px;
      font-weight: 600;
    }

    .baforge-language-select {
      height: 34px;
      padding: 0 9px;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      background: rgba(255,255,255,0.08);
      color: white;
      font-size: 12px;
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
      gap: 6px;
    }

    .baforge-mobile-link {
      padding: 12px 14px;
      border-radius: 9px;
      color: #cbd5e1;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
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
      padding: 12px 24px;
      display: flex;
      align-items: center;
      gap: 9px;
      overflow-x: auto;
      scrollbar-width: none;
      background: #f8fafc;
    }

    .baforge-actions::-webkit-scrollbar {
      display: none;
    }

    .baforge-action {
      flex-shrink: 0;
      padding: 8px 12px;
      border: 1px solid #dbe3ef;
      border-radius: 9px;
      background: white;
      color: #475467;
      font-size: 12px;
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

    /* HOMEPAGE TOOL CARDS */

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
    }
  `;

  const style = document.createElement("style");
  style.textContent = styles;
  document.head.appendChild(style);


  /* =========================================================
     TRANSLATIONS FOR SHARED NAV
  ========================================================= */

  const navText = {
    en: {
      home: "Home",
      story: "User Story",
      criteria: "Acceptance Criteria",
      uat: "UAT Test Cases",
      language: "Language",
      next: "Next Step",
      storyNext: "Continue with Acceptance Criteria",
      criteriaNext: "Continue with UAT Test Cases",
      uatNext: "Go back to User Story"
    },

    tr: {
      home: "Ana Sayfa",
      story: "User Story",
      criteria: "Acceptance Criteria",
      uat: "UAT Test Case'leri",
      language: "Dil",
      next: "Sonraki Adım",
      storyNext: "Acceptance Criteria'ya Devam Et",
      criteriaNext: "UAT Test Case'lerine Devam Et",
      uatNext: "User Story'ye Dön"
    }
  };

  function getLanguage() {
    return localStorage.getItem("baforge-language") || savedLanguage;
  }

  function setLanguage(language) {
    localStorage.setItem("baforge-language", language);

    const pageLanguage = document.getElementById("language");

    if (pageLanguage && pageLanguage.value !== language) {
      pageLanguage.value = language;

      pageLanguage.dispatchEvent(
        new Event("change", { bubbles: true })
      );
    }

    document.documentElement.lang = language;

    updateSharedText(language);
  }


  /* =========================================================
     NAVIGATION
  ========================================================= */

  const language = getLanguage();
  const text = navText[language];

  const nav = document.createElement("nav");
  nav.className = "baforge-nav";

  nav.innerHTML = `
    <div class="baforge-nav-inner">

      <a href="/" class="baforge-brand">
        BA<span>Forge</span> AI
      </a>

      <div class="baforge-links">

        <a href="/"
           class="baforge-link ${currentPage === "home" ? "active" : ""}"
           data-nav="home">
          ${text.home}
        </a>

        <a href="/user-story.html"
           class="baforge-link ${currentPage === "user-story" ? "active" : ""}"
           data-nav="story">
          ${text.story}
        </a>

        <a href="/acceptance-criteria.html"
           class="baforge-link ${currentPage === "acceptance-criteria" ? "active" : ""}"
           data-nav="criteria">
          ${text.criteria}
        </a>

        <a href="/uat.html"
           class="baforge-link ${currentPage === "uat" ? "active" : ""}"
           data-nav="uat">
          ${text.uat}
        </a>

      </div>

      <div class="baforge-language">
        <span class="baforge-language-label" data-nav="language">
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

    <div class="baforge-mobile-menu" id="baforgeMobileMenu">

      <a href="/"
         class="baforge-mobile-link ${currentPage === "home" ? "active" : ""}"
         data-nav="home">
        ${text.home}
      </a>

      <a href="/user-story.html"
         class="baforge-mobile-link ${currentPage === "user-story" ? "active" : ""}"
         data-nav="story">
        ${text.story}
      </a>

      <a href="/acceptance-criteria.html"
         class="baforge-mobile-link ${currentPage === "acceptance-criteria" ? "active" : ""}"
         data-nav="criteria">
        ${text.criteria}
      </a>

      <a href="/uat.html"
         class="baforge-mobile-link ${currentPage === "uat" ? "active" : ""}"
         data-nav="uat">
        ${text.uat}
      </a>

    </div>
  `;

  document.body.insertBefore(nav, document.body.firstChild);


  /* =========================================================
     MOBILE MENU
  ========================================================= */

  const menuButton =
    document.getElementById("baforgeMenuButton");

  const mobileMenu =
    document.getElementById("baforgeMobileMenu");

  menuButton.addEventListener("click", function () {

    const isOpen =
      mobileMenu.classList.toggle("open");

    menuButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    menuButton.textContent =
      isOpen ? "✕" : "☰";
  });


  /* =========================================================
     LANGUAGE SELECTOR
  ========================================================= */

  const globalLanguage =
    document.getElementById("baforgeLanguage");

  globalLanguage.value = language;

  globalLanguage.addEventListener(
    "change",
    function () {
      setLanguage(this.value);
    }
  );


  /* =========================================================
     SYNC EXISTING PAGE LANGUAGE
  ========================================================= */

  const pageLanguage =
    document.getElementById("language");

  if (pageLanguage) {
    pageLanguage.value = language;

    pageLanguage.addEventListener(
      "change",
      function () {
        localStorage.setItem(
          "baforge-language",
          this.value
        );

        globalLanguage.value = this.value;

        updateSharedText(this.value);
      }
    );

    pageLanguage.dispatchEvent(
      new Event("change", { bubbles: true })
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

    if (currentPage === "user-story") {

      actions.innerHTML = `
        <a class="baforge-action"
           href="/acceptance-criteria.html">
          → ${text.criteria}
        </a>

        <a class="baforge-action"
           href="/uat.html">
          → ${text.uat}
        </a>
      `;

    } else if (currentPage === "acceptance-criteria") {

      actions.innerHTML = `
        <a class="baforge-action"
           href="/user-story.html">
          ← ${text.story}
        </a>

        <a class="baforge-action"
           href="/uat.html">
          → ${text.uat}
        </a>
      `;

    } else if (currentPage === "uat") {

      actions.innerHTML = `
        <a class="baforge-action"
           href="/user-story.html">
          ← ${text.story}
        </a>

        <a class="baforge-action"
           href="/acceptance-criteria.html">
          ← ${text.criteria}
        </a>
      `;
    }

    document.body.insertBefore(
      actions,
      document.body.children[1]
    );
  }


  /* =========================================================
     NEXT STEP
  ========================================================= */

  function addNextStep() {

    if (currentPage === "home") {
      return;
    }

    const next =
      document.createElement("section");

    next.className =
      "baforge-next-step";

    let title = "";
    let href = "";

    if (currentPage === "user-story") {
      title = text.storyNext;
      href = "/acceptance-criteria.html";
    }

    if (currentPage === "acceptance-criteria") {
      title = text.criteriaNext;
      href = "/uat.html";
    }

    if (currentPage === "uat") {
      title = text.uatNext;
      href = "/user-story.html";
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

    document.body.appendChild(next);
  }

  addNextStep();


  /* =========================================================
     HOMEPAGE TRANSLATION
  ========================================================= */

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
      document.querySelector(".hero-actions .btn-primary");

    const heroSecondary =
      document.querySelector(".hero-actions .btn-secondary");

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
          ? "BAForge AI, Business Analyst ve QA profesyonellerinin gereksinimleri User Story, Acceptance Criteria ve UAT Test Case'lerine hızlı ve düzenli şekilde dönüştürmesine yardımcı olur."
          : "BAForge AI helps Business Analysts and QA professionals transform requirements into User Stories, Acceptance Criteria and UAT Test Cases — faster and with better structure.";
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
      document.querySelectorAll(".section-heading h2");

    if (headings[0]) {
      headings[0].textContent =
        isTr ? "BA / QA Araç Seti" : "BA / QA Toolkit";
    }

    if (headings[1]) {
      headings[1].textContent =
        isTr
          ? "Gereksinimden UAT'a"
          : "From Requirement to UAT";
    }

    const toolCards =
      document.querySelectorAll(".tool-card");

    const cardData = isTr
      ? [
          [
            "User Story Generator",
            "Bir iş gereksinimini business value, acceptance criteria, business rules, varsayımlar ve edge case'lerle yapılandırılmış User Story'ye dönüştürün."
          ],
          [
            "Acceptance Criteria",
            "Gereksinimleri test edilebilir Given / When / Then acceptance criteria'lara dönüştürün ve kapsam boşluklarını görün."
          ],
          [
            "UAT Test Case'leri",
            "Business rule, validation, negative, edge case, regression ve API odaklı UAT test case'leri oluşturun."
          ]
        ]
      : [
          [
            "User Story Generator",
            "Transform a business requirement into a structured User Story with business value, acceptance criteria, rules, assumptions and edge cases."
          ],
          [
            "Acceptance Criteria",
            "Convert requirements into testable Given / When / Then acceptance criteria and identify coverage gaps and open questions."
          ],
          [
            "UAT Test Cases",
            "Generate structured UAT test cases covering business rules, validation, negative scenarios, edge cases, regression and API testing."
          ]
        ];

    toolCards.forEach((card, index) => {

      const h3 =
        card.querySelector("h3");

      const p =
        card.querySelector("p");

      const link =
        card.querySelector(".tool-link");

      if (h3) {
        h3.textContent =
          cardData[index][0];
      }

      if (p) {
        p.textContent =
          cardData[index][1];
      }

      if (link) {
        link.textContent =
          isTr
            ? "Aracı Aç →"
            : "Open Generator →";
      }
    });

    const workflowTitles =
      document.querySelectorAll(".workflow-step h3");

    const workflowDescriptions =
      document.querySelectorAll(".workflow-step p");

    const workflowTR = [
      ["Gereksinim", "İş gereksinimiyle başlayın."],
      ["User Story", "Gereksinimi net şekilde yapılandırın."],
      ["Acceptance Criteria", "Ölçülebilir koşulları tanımlayın."],
      ["UAT Test Case'leri", "Gereksinimleri uygulanabilir testlere dönüştürün."]
    ];

    const workflowEN = [
      ["Requirement", "Start with a business requirement."],
      ["User Story", "Structure the requirement clearly."],
      ["Acceptance Criteria", "Define measurable conditions."],
      ["UAT Test Cases", "Turn requirements into executable tests."]
    ];

    const workflowData =
      isTr ? workflowTR : workflowEN;

    workflowTitles.forEach((el, index) => {
      if (workflowData[index]) {
        el.textContent =
          workflowData[index][0];
      }
    });

    workflowDescriptions.forEach((el, index) => {
      if (workflowData[index]) {
        el.textContent =
          workflowData[index][1];
      }
    });
  }


  /* =========================================================
     SHARED TEXT UPDATE
  ========================================================= */

  function updateSharedText(lang) {

    const t =
      navText[lang] || navText.en;

    document
      .querySelectorAll('[data-nav="home"]')
      .forEach(el => {
        el.textContent = t.home;
      });

    document
      .querySelectorAll('[data-nav="story"]')
      .forEach(el => {
        el.textContent = t.story;
      });

    document
      .querySelectorAll('[data-nav="criteria"]')
      .forEach(el => {
        el.textContent = t.criteria;
      });

    document
      .querySelectorAll('[data-nav="uat"]')
      .forEach(el => {
        el.textContent = t.uat;
      });

    document
      .querySelectorAll('[data-nav="language"]')
      .forEach(el => {
        el.textContent = t.language;
      });

    updateHomeLanguage(lang);
  }


  updateSharedText(language);

})();