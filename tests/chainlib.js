const { runPage, MemoryStorage } = require("./run-page");
const path = require("path");
const REPO = path.join(__dirname, "..");
const ls = new MemoryStorage(), ss = new MemoryStorage();
let canned = {}; // apiName -> object model returns
let lastApi = null;
// Fake OpenAI
global.fetch = async (url, opts) => {
  if (!String(url).includes("api.openai.com")) throw new Error("unexpected fetch " + url);
  const out = canned[lastApi];
  if (out === undefined) throw new Error("no canned output for " + lastApi);
  const text = typeof out === "string" ? out : JSON.stringify(out);
  return { ok: true, status: 200, json: async () => ({ output: [{ content: [{ type: "output_text", text }] }], output_text: text }), text: async () => JSON.stringify({ output: [{ content: [{ type: "output_text", text }] }], output_text: text }) };
};
process.env.OPENAI_API_KEY = "test-key";
const apiCalls = [];
function pageFetch(url, opts) {
  const m = String(url).match(/\/api\/([a-z-]+)/);
  if (!m) return Promise.reject(new Error("fetch " + url));
  const name = m[1]; lastApi = name;
  const mod = require(path.join(REPO, "api", name + ".js"));
  const handler = mod.default || mod;
  const body = opts && opts.body ? JSON.parse(opts.body) : {};
  apiCalls.push({ name, body });
  return new Promise((resolve) => {
    let status = 200;
    const res = { status(c) { status = c; return res; }, setHeader() {}, json(o) { resolve({ ok: status < 400, status, text: async () => JSON.stringify(o), json: async () => o }); return res; } };
    Promise.resolve(handler({ method: "POST", body, headers: {} }, res)).catch((e) => resolve({ ok: false, status: 500, text: async () => JSON.stringify({ error: String(e) }) }));
  });
}
const base = { language: { value: "tr" }, detail: { value: "Professional" } };
function page(file, elements = {}, extra = {}) {
  return runPage({ file, ls, ss, lang: "tr", fetchImpl: pageFetch, elements: { ...base, ...elements }, ...extra });
}
const tick = () => new Promise((r) => setTimeout(r, 30));
module.exports = { page, ls, ss, canned: (c) => Object.assign(canned, c), tick, apiCalls };
