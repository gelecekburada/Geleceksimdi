(function () {

  const currentPath =
    window.location.pathname
      .split("/")
      .pop() || "index.html";

  const pages = {
    uat: {
      file: "index.html",
      label: "🧪 UAT Test Cases"
    },

    story: {
      file: "user-story.html",
      label: "📝 User Story"
    },

    criteria: {
      file: "acceptance-criteria.html",
      label: "✓ Acceptance Criteria"
    }
  };

  function injectStyles() {

    const style =
      document.createElement("style");

    style.textContent = `
      .baforge-nav {
        position: sticky;
        top: 0;
        z-index: 9999;
        width: 100%;
        background: #111827;
        color: white;
        box-shadow: 0 3px 14px rgba(0,0,0,0.15);
      }

      .baforge-nav-inner {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 18px;
        min-height: 62px;

        display: flex;
        align-items: center;
        gap: 18px;
      }

      .baforge-brand {
        color: white;
        text-decoration: none;
        font-size: 19px;
        font-weight: 800;
        white-space: nowrap;
        margin-right: 8px;
      }

      .baforge-brand span {
        color: #60a5fa;
      }

      .baforge-links {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .baforge-links::-webkit-scrollbar {
        display: none;
      }

      .baforge-link {
        color: #cbd5e1;
        text-decoration: none;
        padding: 9px 12px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.15s ease;
      }

      .baforge-link:hover {
        background: #1f2937;
        color: white;
      }

      .baforge-link.active {
        background: #2563eb;
        color: white;
      }

      .baforge-actions {
        max-width: 1100px;
        margin: 14px auto 0;
        padding: 0 18px;
        display: flex;
        gap: 10px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .baforge-actions::-webkit-scrollbar {
        display: none;
      }

      .baforge-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        padding: 9px 13px;
        border-radius: 8px;

        background: white;
        color: #1e40af;

        border: 1px solid #bfdbfe;

        text-decoration: none;
        font-size: 12px;
        font-weight: 700;

        white-space: nowrap;
      }

      .baforge-action:hover {
        background: #eff6ff;
      }

      .baforge-nav-spacer {
        height: 1px;
      }

      @media (max-width: 700px) {

        .baforge-nav-inner {
          min-height: 56px;
          padding: 0 12px;
          gap: 8px;
        }

        .baforge-brand {
          font-size: 17px;
        }

        .baforge-link {
          font-size: 12px;
          padding: 8px 9px;
        }

        .baforge-actions {
          padding: 0 12px;
          margin-top: 10px;
        }

      }
    `;

    document.head.appendChild(style);
  }

  function getCurrentPage() {

    if (
      currentPath === "user-story.html"
    ) {
      return "story";
    }

    if (
      currentPath ===
      "acceptance-criteria.html"
    ) {
      return "criteria";
    }

    return "uat";
  }

  function createNav() {

    const current =
      getCurrentPage();

    const nav =
      document.createElement("nav");

    nav.className =
      "baforge-nav";

    nav.innerHTML = `

      <div class="baforge-nav-inner">

        <a
          href="/"
          class="baforge-brand"
        >
          BA<span>Forge</span> AI
        </a>

        <div class="baforge-links">

          <a
            href="/user-story.html"
            class="baforge-link ${
              current === "story"
                ? "active"
                : ""
            }"
          >
            📝 User Story
          </a>

          <a
            href="/acceptance-criteria.html"
            class="baforge-link ${
              current === "criteria"
                ? "active"
                : ""
            }"
          >
            ✓ Acceptance Criteria
          </a>

          <a
            href="/"
            class="baforge-link ${
              current === "uat"
                ? "active"
                : ""
            }"
          >
            🧪 UAT Test Cases
          </a>

        </div>

      </div>
    `;

    document.body.prepend(nav);

    return nav;
  }

  function createQuickActions() {

    const current =
      getCurrentPage();

    const actions =
      document.createElement("div");

    actions.className =
      "baforge-actions";

    let html = "";

    if (current === "story") {

      html = `
        <a
          class="baforge-action"
          href="/acceptance-criteria.html"
        >
          ✓ Acceptance Criteria Oluştur →
        </a>

        <a
          class="baforge-action"
          href="/"
        >
          🧪 UAT Test Cases Oluştur →
        </a>
      `;

    } else if (current === "criteria") {

      html = `
        <a
          class="baforge-action"
          href="/user-story.html"
        >
          📝 User Story Oluştur →
        </a>

        <a
          class="baforge-action"
          href="/"
        >
          🧪 UAT Test Cases Oluştur →
        </a>
      `;

    } else {

      html = `
        <a
          class="baforge-action"
          href="/user-story.html"
        >
          📝 User Story Oluştur →
        </a>

        <a
          class="baforge-action"
          href="/acceptance-criteria.html"
        >
          ✓ Acceptance Criteria Oluştur →
        </a>
      `;
    }

    actions.innerHTML = html;

    const nav =
      document.querySelector(
        ".baforge-nav"
      );

    if (nav) {
      nav.after(actions);
    }
  }

  function init() {

    if (
      document.querySelector(
        ".baforge-nav"
      )
    ) {
      return;
    }

    injectStyles();

    createNav();

    createQuickActions();
  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }

})();