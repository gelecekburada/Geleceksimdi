/*
 * Test düzeneği (depo dışı): requirement.html'in gerçek JS'ini sahte bir
 * tarayıcı ortamında çalıştırır. Depodaki hiçbir dosyayı değiştirmez;
 * sayfanın iç durumunu görmek için yalnızca bellekteki kopyaya küçük bir
 * "dışa aç" satırı ekler.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const REPO = path.join(__dirname, "..");

class MemoryStorage {
  constructor(init) { this.m = new Map(Object.entries(init || {})); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  clear() { this.m.clear(); }
  key(i) { return Array.from(this.m.keys())[i] ?? null; }
  get length() { return this.m.size; }
  dump() { return Object.fromEntries(this.m); }
}

function makeEl(tag) {
  const el = {
    tagName: String(tag || "div").toUpperCase(),
    children: [],
    style: {},
    dataset: {},
    attrs: {},
    value: "",
    textContent: "",
    innerHTML: "",
    disabled: false,
    checked: false,
    href: "",
    className: "",
    hidden: false,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { el.children.push(c); return c; },
    append(...cs) { cs.forEach((c) => el.children.push(c)); },
    remove() {}, addEventListener() {}, removeEventListener() {},
    setAttribute(k, v) { el.attrs[k] = v; }, getAttribute(k) { return el.attrs[k] ?? null; },
    removeAttribute(k) { delete el.attrs[k]; },
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    focus() {}, blur() {}, click() {}, select() {}, scrollIntoView() {},
    closest() { return null; }, contains() { return false; },
    insertAdjacentHTML() {}, dispatchEvent() {}, replaceChildren() { el.children = []; },
  };
  Object.defineProperty(el, "options", { get() { return el.children; } });
  return new Proxy(el, {
    get(t, p) {
      if (p in t) return t[p];
      if (typeof p === "symbol") return undefined;
      return undefined;
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}

function runPage({ file = "requirement.html", local = {}, session = {}, lang, tail = "", patch = true }) {
  const localStorage = new MemoryStorage(local);
  const sessionStorage = new MemoryStorage(session);
  if (lang) localStorage.setItem("baforge-language", lang);

  const els = new Map();
  const logs = [];
  const document = {
    getElementById(id) { if (!els.has(id)) els.set(id, makeEl("div")); return els.get(id); },
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    createElement(t) { return makeEl(t); },
    createTextNode(t) { return { textContent: t }; },
    addEventListener() {}, removeEventListener() {},
    body: makeEl("body"), head: makeEl("head"), documentElement: makeEl("html"),
    readyState: "complete", title: "", cookie: "",
  };
  const window = {
    document, localStorage, sessionStorage,
    location: { pathname: "/" + file, href: "", search: "", hash: "", assign() {}, replace() {}, reload() {} },
    navigator: { language: "tr-TR", userAgent: "node-harness" },
    confirm() { return true; }, alert() {}, prompt() { return null; },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    setTimeout: (f) => { try { f(); } catch (e) { logs.push("timeout-err:" + e.message); } return 0; },
    clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    requestAnimationFrame: (f) => { try { f(); } catch (e) {} return 0; },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    getComputedStyle: () => ({}), history: { replaceState() {}, pushState() {} },
    CustomEvent: function (n, o) { this.type = n; this.detail = o && o.detail; },
    Event: function (n) { this.type = n; },
    console: {
      log: (...a) => logs.push("log:" + a.join(" ")),
      warn: (...a) => logs.push("warn:" + a.map(String).join(" ")),
      error: (...a) => logs.push("error:" + a.map(String).join(" ")),
      info() {}, debug() {},
    },
    URL, URLSearchParams, Blob: function () {}, FileReader: function () {},
    fetch: () => Promise.reject(new Error("no network in harness")),
    structuredClone: (v) => JSON.parse(JSON.stringify(v)),
  };
  window.window = window; window.self = window; window.top = window; window.globalThis = window;
  const ctx = vm.createContext(window);
  window.console = ctx.console;

  const html = fs.readFileSync(path.join(REPO, file), "utf8");
  const scripts = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1]; const body = m[2];
    const src = /src="([^"]+)"/.exec(attrs);
    if (src) {
      if (src[1] === "/nav.js") continue; // gezinme çubuğu bu testte gerekli değil
      scripts.push({ name: src[1], code: fs.readFileSync(path.join(REPO, src[1]), "utf8") });
    } else if (body.trim()) {
      let code = body;
      if (patch && tail) {
        const idx = code.lastIndexOf("})();");
        code = code.slice(0, idx) + "\n" + tail + "\n" + code.slice(idx);
      }
      scripts.push({ name: "inline:" + file, code });
    }
  }
  const errors = [];
  for (const s of scripts) {
    try { vm.runInContext(s.code, ctx, { filename: s.name }); }
    catch (e) { errors.push(s.name + " -> " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e)); }
  }
  return { ctx, window, els, localStorage, sessionStorage, logs, errors, el: (id) => document.getElementById(id) };
}

module.exports = { runPage, MemoryStorage };
