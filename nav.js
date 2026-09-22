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

  const styles = `
    .baforge-nav {
      position: sticky;
      top: 0;
      z-index: 9999;
      width: 100%;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .baforge-nav-inner {
      max-width: 1180px;
      min-height: 68px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      gap: 28px;
    }

    .baforge-brand {
      flex-shrink: 0;
      color: white;
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .baforge-brand span {
      color: #60a5fa;
    }

    .baforge-links {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .baforge-links::-webkit-scrollbar {
      display: none;
    }

    .baforge-link {
      white-space: nowrap;
      padding: 9px 13px;
      border-radius: 9px;
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 600;
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

    .baforge-actions {
      max-width: 1180px;
      margin: 0 auto;
      padding: 10px 24px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .baforge-actions::-webkit-scrollbar {
      display: none;
    }

    .baforge-action {
      flex-shrink: 0;
      padding: 7px 11px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      color: #475467;
      font-size: 12px;
      font-weight: 600;
      transition: 0.2s ease;
    }

    .baforge-action:hover {
      color: #2563eb;
      border-color: #bfdbfe;
      background: #eff6ff;
    }

    @media (max-width: 700px) {
      .baforge-nav-inner {
        min-height: 60px;
        padding: 0 16px;
        gap: 12px;
      }

      .baforge-brand {
        font-size: 17px;
      }

      .baforge-links {
        margin-left: 0;
      }

      .baforge-link {
        padding: 8px 10px;
        font-size: 12px;
      }

      .baforge-actions {
        padding: 8px 16px;
      }
    }
  `;

  const style = document.createElement("style");
  style.textContent = styles;
  document.head.appendChild(style);

  const nav = document.createElement("nav");
  nav.className = "baforge-nav";

  nav.innerHTML = `
    <div class="baforge-nav-inner">

      <a href="/" class="baforge-brand">
        BA<span>Forge</span> AI
      </a>

      <div class="baforge-links">

        <a
          href="/"
          class="baforge-link ${currentPage === "home" ? "active" : ""}">
          Home
        </a>

        <a
          href="/user-story.html"
          class="baforge-link ${currentPage === "user-story" ? "active" : ""}">
          User Story
        </a>

        <a
          href="/acceptance-criteria.html"
          class="baforge-link ${currentPage === "acceptance-criteria" ? "active" : ""}">
          Acceptance Criteria
        </a>

        <a
          href="/uat.html"
          class="baforge-link ${currentPage === "uat" ? "active" : ""}">
          UAT Test Cases
        </a>

      </div>

    </div>
  `;

  document.body.insertBefore(nav, document.body.firstChild);


  // Quick actions on tool pages
  if (currentPage !== "home") {

    const actions = document.createElement("div");
    actions.className = "baforge-actions";

    if (currentPage === "user-story") {
      actions.innerHTML = `
        <a class="baforge-action" href="/acceptance-criteria.html">
          → Acceptance Criteria
        </a>
        <a class="baforge-action" href="/uat.html">
          → UAT Test Cases
        </a>
      `;
    }

    if (currentPage === "acceptance-criteria") {
      actions.innerHTML = `
        <a class="baforge-action" href="/user-story.html">
          → User Story
        </a>
        <a class="baforge-action" href="/uat.html">
          → UAT Test Cases
        </a>
      `;
    }

    if (currentPage === "uat") {
      actions.innerHTML = `
        <a class="baforge-action" href="/user-story.html">
          → User Story
        </a>
        <a class="baforge-action" href="/acceptance-criteria.html">
          → Acceptance Criteria
        </a>
      `;
    }

    document.body.insertBefore(actions, document.body.children[1]);
  }

})();