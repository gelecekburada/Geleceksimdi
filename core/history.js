/*
 * BAHistory — "Son 5 işlem" / "Last 5 operations"
 *
 * Keeps the last 5 successful generations of a screen in this browser
 * (localStorage, key `baforge-history-<page>`). No account or server needed.
 *
 * Usage on a page:
 *   BAHistory.init({
 *     page: "uat",
 *     label: () => "short title for the entry",
 *     capture: () => ({ ...everything needed to restore... }),
 *     restore: (data) => { ...put it back on screen... }
 *   });
 *   BAHistory.record();   // call after a successful generation
 */
(function () {
  "use strict";

  var MAX_ENTRIES = 5;
  var MAX_ENTRY_CHARS = 400000;
  var cfg = null;

  var TEXT = {
    tr: {
      title: "Son 5 işlem",
      empty: "Henüz kayıtlı işlem yok. Bir sonuç üretince burada görünür.",
      restore: "Geri yükle",
      remove: "Sil",
      clear: "Tümünü temizle",
      note: "Bu liste yalnızca bu tarayıcıda saklanır.",
      untitled: "Başlıksız işlem"
    },
    en: {
      title: "Last 5 operations",
      empty: "No saved operations yet. They appear here after you generate a result.",
      restore: "Restore",
      remove: "Delete",
      clear: "Clear all",
      note: "This list is stored in this browser only.",
      untitled: "Untitled operation"
    }
  };

  function lang() {
    try {
      var l = localStorage.getItem("baforge-language");
      return l === "tr" ? "tr" : "en";
    } catch (e) {
      return "en";
    }
  }

  function tx(key) {
    return TEXT[lang()][key];
  }

  function storageKey(page) {
    return "baforge-history-" + page;
  }

  function read(page) {
    try {
      var raw = localStorage.getItem(storageKey(page));
      if (!raw) return [];
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list.slice(0, MAX_ENTRIES) : [];
    } catch (e) {
      return [];
    }
  }

  function write(page, list) {
    try {
      localStorage.setItem(storageKey(page), JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shorten(s, n) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  function fmtTime(ts) {
    try {
      return new Date(ts).toLocaleString(lang() === "tr" ? "tr-TR" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "";
    }
  }

  function list(page) {
    return read(page || (cfg && cfg.page));
  }

  function push(page, entry) {
    var items = read(page);
    items.unshift(entry);
    items = items.slice(0, MAX_ENTRIES);
    /* Quota guard: drop oldest entries until the write succeeds. */
    while (items.length && !write(page, items)) {
      items.pop();
    }
    return items;
  }

  function record() {
    if (!cfg) return null;
    var data;
    try {
      data = cfg.capture();
    } catch (e) {
      return null;
    }
    if (!data) return null;
    if (JSON.stringify(data).length > MAX_ENTRY_CHARS) return null;

    var label = "";
    try {
      label = cfg.label ? cfg.label(data) : "";
    } catch (e) {}

    var entry = {
      id: "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ts: Date.now(),
      label: shorten(label, 90),
      data: data
    };
    push(cfg.page, entry);
    render();
    return entry;
  }

  function restore(id) {
    if (!cfg) return false;
    var found = read(cfg.page).filter(function (x) {
      return x.id === id;
    })[0];
    if (!found) return false;
    try {
      cfg.restore(JSON.parse(JSON.stringify(found.data)));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(id) {
    if (!cfg) return;
    write(
      cfg.page,
      read(cfg.page).filter(function (x) {
        return x.id !== id;
      })
    );
    render();
  }

  function clearAll() {
    if (!cfg) return;
    try {
      localStorage.removeItem(storageKey(cfg.page));
    } catch (e) {}
    render();
  }

  function styles() {
    if (document.getElementById("baforge-history-style")) return;
    var st = document.createElement("style");
    st.id = "baforge-history-style";
    st.textContent =
      ".ba-history{max-width:1100px;margin:24px auto;padding:0 16px;font-family:inherit}" +
      ".ba-history details{background:rgba(128,138,160,.1);border:1px solid rgba(128,138,160,.4);border-radius:14px;padding:12px 16px}" +
      ".ba-history summary{cursor:pointer;font-weight:700;color:inherit}" +
      ".ba-history ul{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:8px}" +
      ".ba-history li{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:10px 12px;border-radius:10px;background:rgba(128,138,160,.12)}" +
      ".ba-history .ba-h-text{flex:1 1 220px;min-width:0}" +
      ".ba-history .ba-h-label{display:block;overflow-wrap:anywhere}" +
      ".ba-history .ba-h-time{display:block;font-size:12px;opacity:.65}" +
      ".ba-history button{cursor:pointer;border:1px solid rgba(128,138,160,.6);background:transparent;color:inherit;border-radius:8px;padding:6px 12px;font:inherit;font-size:13px}" +
      ".ba-history button:hover{background:rgba(128,138,160,.25)}" +
      ".ba-history .ba-h-empty,.ba-history .ba-h-note{font-size:13px;opacity:.7;margin:10px 0 0}";
    document.head.appendChild(st);
  }

  function mount() {
    var el = document.getElementById("baforge-history");
    if (el) return el;
    el = document.createElement("section");
    el.id = "baforge-history";
    el.className = "ba-history";
    var anchor = document.querySelector(".baforge-workflow-nav");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(el, anchor);
    } else {
      document.body.appendChild(el);
    }
    return el;
  }

  function render() {
    if (!cfg) return;
    var el = mount();
    var items = read(cfg.page);
    var wasOpen = !!el.querySelector("details[open]");
    var html = '<details' + (wasOpen ? " open" : "") + "><summary>" +
      esc(tx("title")) + " (" + items.length + "/" + MAX_ENTRIES + ")</summary>";
    if (!items.length) {
      html += '<p class="ba-h-empty">' + esc(tx("empty")) + "</p>";
    } else {
      html += "<ul>";
      items.forEach(function (it) {
        html +=
          '<li><span class="ba-h-text"><span class="ba-h-label">' +
          esc(it.label || tx("untitled")) +
          '</span><span class="ba-h-time">' + esc(fmtTime(it.ts)) + "</span></span>" +
          '<span><button type="button" data-h-restore="' + esc(it.id) + '">' + esc(tx("restore")) + "</button> " +
          '<button type="button" data-h-remove="' + esc(it.id) + '">' + esc(tx("remove")) + "</button></span></li>";
      });
      html += "</ul>" +
        '<p class="ba-h-note"><button type="button" data-h-clear="1">' + esc(tx("clear")) + "</button> " +
        esc(tx("note")) + "</p>";
    }
    html += "</details>";
    el.innerHTML = html;
    Array.prototype.forEach.call(el.querySelectorAll("[data-h-restore]"), function (b) {
      b.addEventListener("click", function () {
        restore(b.getAttribute("data-h-restore"));
      });
    });
    Array.prototype.forEach.call(el.querySelectorAll("[data-h-remove]"), function (b) {
      b.addEventListener("click", function () {
        remove(b.getAttribute("data-h-remove"));
      });
    });
    var c = el.querySelector("[data-h-clear]");
    if (c) c.addEventListener("click", clearAll);
  }

  function init(config) {
    cfg = config;
    styles();
    render();
  }

  window.BAHistory = {
    init: init,
    record: record,
    list: list,
    restore: restore,
    remove: remove,
    clear: clearAll,
    render: render,
    MAX_ENTRIES: MAX_ENTRIES
  };
})();
