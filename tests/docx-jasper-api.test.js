/* /api/generate {tool:"docx-jasper"} checks with a fake AI service.  Run with:  node tests/docx-jasper-api.test.js */
const assert = require("assert");
process.env.OPENAI_API_KEY = "test-key-not-real";
delete process.env.SUPABASE_URL; // guard: no accounts configured -> allowed
const generate = require("../api/generate.js");
const handler = (req, res) => { req.body = Object.assign({ tool: "docx-jasper" }, req.body); return generate(req, res); };

let failed = 0, passed = 0;
async function check(name, fn) { try { await fn(); passed++; console.log("PASS", name); } catch (e) { failed++; console.log("FAIL", name, "-", e.message); } }

let next = null, calls = [];
const realFetch = global.fetch;
global.fetch = async (url, opts) => {
  if (String(url).indexOf("api.openai.com") < 0) { return realFetch(url, opts); }
  const body = JSON.parse(opts.body);
  calls.push(body.input[0].content[0].text);
  const r = typeof next === "function" ? next() : next;
  return { ok: r.status < 400, status: r.status, json: async () => r.body };
};
const reply = (obj) => ({ status: 200, body: { output_text: typeof obj === "string" ? obj : JSON.stringify(obj) } });

function call(body) {
  return new Promise((resolve) => {
    const res = { code: 200, status(c) { this.code = c; return this; }, json(o) { resolve({ code: this.code, body: o }); return this; }, setHeader() {}, end(s) { resolve({ code: this.code, body: JSON.parse(s || "{}") }); } };
    handler({ method: "POST", headers: {}, body }, res);
  });
}

(async () => {
  await check("instruction becomes cleaned rules", async () => {
    next = reply("```json\n" + JSON.stringify({
      rules: [{ target: "body", fontSize: 10 }, { target: "headings", bold: true, color: "1f4e79" }, { target: "nope", fontSize: 12 }, { target: "all", fontSize: 500 }],
      page: { marginsMm: { top: 20, left: 20, right: 20, bottom: 20 }, size: "A9" },
      summary: ["Gövde metni 10 punto", "Başlıklar kalın ve mavi"], unsupported: []
    }) + "\n```");
    calls = [];
    const r = await call({ instruction: "yazılar 10 punto, başlıklar kalın mavi, kenarlar 2 cm", outline: { headings: [1, 2], fonts: ["Calibri"], sizes: [11] }, language: "tr" });
    assert.strictEqual(r.code, 200);
    assert.deepStrictEqual(r.body.rules.rules, [{ target: "body", fontSize: 10 }, { target: "headings", bold: true, color: "#1F4E79" }, { target: "all", fontSize: 96 }]);
    assert.deepStrictEqual(r.body.rules.page, { marginsMm: { top: 20, bottom: 20, left: 20, right: 20 } });
    assert.deepStrictEqual(r.body.summary, ["Gövde metni 10 punto", "Başlıklar kalın ve mavi"]);
    assert.ok(calls[0].includes("yazılar 10 punto") && calls[0].includes('"headings":[1,2]'));
  });

  await check("only the outline is sent, never document text", async () => {
    next = reply({ summary: [] }); calls = [];
    await call({ instruction: "başlıklar 14 punto", outline: { headings: [1], secret: "Gizli müşteri metni", fonts: ["Arial"] }, language: "tr" });
    assert.ok(!calls[0].includes("Gizli müşteri metni"));
  });

  await check("empty, too long and bad method are refused", async () => {
    assert.strictEqual((await call({ instruction: "  " })).code, 400);
    assert.strictEqual((await call({ instruction: "x".repeat(2001) })).code, 413);
    const r = await new Promise((resolve) => handler({ method: "GET", headers: {}, body: {} }, { status(c) { return { json: (o) => resolve(c) }; } }));
    assert.strictEqual(r, 405);
  });

  await check("unreadable or failed AI answers give a clear error", async () => {
    next = reply("bu json değil");
    const a = await call({ instruction: "başlıklar kırmızı", language: "tr" });
    assert.strictEqual(a.code, 502); assert.ok(/okunamadı/.test(a.body.error));
    next = { status: 500, body: { error: { message: "boom" } } };
    const b = await call({ instruction: "headings red", language: "en" });
    assert.strictEqual(b.code, 502); assert.ok(/rejected/.test(b.body.error) && !/boom/.test(b.body.error));
  });

  await check("missing API key is reported without calling the AI", async () => {
    const k = process.env.OPENAI_API_KEY; delete process.env.OPENAI_API_KEY; calls = [];
    const r = await call({ instruction: "başlıklar kırmızı" });
    process.env.OPENAI_API_KEY = k;
    assert.strictEqual(r.code, 503); assert.strictEqual(calls.length, 0);
  });

  console.log("\n" + passed + " passed, " + failed + " failed");
  process.exit(failed ? 1 : 0);
})();
