/*
 * Local test server: serves the static site and runs the real /api/* handlers
 * against the in-memory fake Supabase (tests/fake-supabase.js). Test-only.
 *   node tests/devserver.js 8802
 * Extra routes for browser tests: POST /__fake/reset, /__fake/login-link?email=...
 */
const http = require("http"), fs = require("fs"), path = require("path");
const fake = require("./fake-supabase");
const root = path.join(__dirname, "..");
const port = parseInt(process.argv[2] || "8802", 10);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
fake.reset();

function readBody(req) { return new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b)); }); }

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/__fake/reset") { fake.reset(); res.end("ok"); return; }
  if (u.pathname === "/__fake/state") { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ db: fake.db, otp: fake.state.otpCalls })); return; }
  if (u.pathname === "/__fake/token") { // a ready-made session for a fake user
    const id = u.searchParams.get("id"); res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ access_token: "tok-" + id, refresh_token: "good-refresh", expires_at: Math.floor(Date.now() / 1000) + 3600 })); return;
  }
  if (u.pathname.startsWith("/api/")) {
    const name = u.pathname.slice(5);
    let handler; try { handler = require("../api/" + name.replace(/[^a-z-]/g, "") + ".js"); } catch (e) { res.statusCode = 404; res.end("no such api"); return; }
    const raw = await readBody(req); let body; try { body = raw ? JSON.parse(raw) : undefined; } catch (e) { body = undefined; }
    const query = Object.fromEntries(u.searchParams);
    const out = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { res.statusCode = this.statusCode; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(b)); } };
    await handler({ method: req.method, headers: req.headers, body, query }, out); return;
  }
  let p = path.join(root, u.pathname === "/" ? "index.html" : u.pathname);
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.statusCode = 404; res.end("not found"); return; }
  res.setHeader("content-type", MIME[path.extname(p)] || "application/octet-stream"); res.end(fs.readFileSync(p));
}).listen(port, () => console.log("devserver on " + port));
