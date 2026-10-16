/* In-memory fake of the Supabase endpoints our API uses (auth + PostgREST subset). Test-only. */
const assert = require("assert");
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://fake.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "service-key";

let NOW = Date.parse("2026-10-16T12:00:00Z");
const db = { profiles: [], usage_events: [], feedback: [] };
const tokens = {}, passwords = {};
let nextId = 1, failRest = false;
const otpCalls = [];
const state = { get otpCalls() { return otpCalls; }, set failRest(v) { failRest = v; }, get now() { return NOW; }, set now(v) { NOW = v; } };

function addUser(id, email, over) {
  const p = Object.assign({ id, email, role: "user", is_active: true, daily_ai_limit: 3, created_at: "2026-10-01T00:00:00Z", last_seen_at: null }, over || {});
  db.profiles.push(p); tokens["tok-" + id] = { id, email }; return p;
}
const U1 = "11111111-1111-1111-1111-111111111111", U2 = "22222222-2222-2222-2222-222222222222", AD = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", OFF = "00000000-0000-0000-0000-000000000000";

function reset() {
  db.profiles.length = 0; db.usage_events.length = 0; db.feedback.length = 0; for (const k in tokens) delete tokens[k]; for (const k in passwords) delete passwords[k];
  otpCalls.length = 0; failRest = false; nextId = 1;
  addUser(U1, "u1@x.com"); addUser(U2, "u2@x.com"); addUser(AD, "admin@x.com", { role: "admin" }); addUser(OFF, "off@x.com", { is_active: false });
}

function filterRows(rows, params) {
  let out = rows.slice();
  for (const [k, v] of params) {
    if (["select", "order"].includes(k)) continue;
    const m = /^(eq|gte)\.(.*)$/.exec(v); if (!m) continue;
    out = out.filter((r) => m[1] === "eq" ? String(r[k]) === m[2] : String(r[k]) >= m[2]);
  }
  return out;
}

global.fetch = async (url, opts = {}) => {
  const u = new URL(url), h = opts.headers || {};
  const json = (status, body, headers = {}) => ({ ok: status < 400, status, text: async () => body === undefined ? "" : JSON.stringify(body), headers: { get: (n) => headers[n.toLowerCase()] || null } });
  if (u.pathname === "/auth/v1/user") {
    const t = /^Bearer (.+)$/.exec(h.Authorization || ""); const user = t && tokens[t[1]];
    return user ? json(200, user) : json(401, { msg: "bad jwt" });
  }
  if (u.pathname === "/auth/v1/otp") { otpCalls.push({ url: String(url), body: JSON.parse(opts.body), headers: h }); return json(200, {}); }
  if (u.pathname === "/auth/v1/admin/users" && opts.method === "POST") {
    assert.ok(h.apikey === "service-key", "admin create must use the service key");
    const b = JSON.parse(opts.body); assert.strictEqual(b.email_confirm, true);
    if (db.profiles.some((p) => p.email === b.email)) return json(422, { msg: "A user with this email address has already been registered", error_code: "email_exists" });
    const id = "99999999-0000-0000-0000-" + String(1000 + nextId++).padStart(12, "0"); addUser(id, b.email); passwords[b.email] = b.password; return json(200, { id, email: b.email });
  }
  if (u.pathname === "/auth/v1/token" && u.searchParams.get("grant_type") === "password") {
    const b = JSON.parse(opts.body), p = db.profiles.find((x) => x.email === b.email);
    if (!p || passwords[b.email] !== b.password) return json(400, { error: "invalid_grant", error_description: "Invalid login credentials" });
    return json(200, { access_token: "tok-" + p.id, refresh_token: "r-" + p.id, expires_in: 3600 });
  }
  if (u.pathname === "/auth/v1/token") {
    const b = JSON.parse(opts.body); return b.refresh_token === "good-refresh" ? json(200, { access_token: "tok-" + U1, refresh_token: "r2", expires_in: 3600 }) : json(400, { error: "bad" });
  }
  if (u.pathname.startsWith("/rest/v1/")) {
    if (failRest) return json(500, { message: "boom" });
    assert.ok(h.apikey === "service-key", "REST must use the service key");
    const table = u.pathname.split("/")[3], rows = db[table];
    const method = opts.method || "GET";
    if (method === "POST") { const b = JSON.parse(opts.body); const row = Object.assign({ id: nextId++, created_at: new Date(NOW).toISOString() }, b); rows.push(row); return json(201); }
    const matched = filterRows(rows, u.searchParams);
    if (method === "PATCH") {
      const b = JSON.parse(opts.body); matched.forEach((r) => Object.assign(r, b));
      return json(200, h.Prefer === "return=representation" ? matched : undefined);
    }
    if (h.Prefer === "count=exact") return json(200, matched.slice(0, 1), { "content-range": "0-0/" + matched.length });
    const range = /^(\d+)-(\d+)$/.exec(h.Range || ""); let out = matched;
    if (range) out = matched.slice(+range[1], +range[2] + 1);
    return json(200, out);
  }
  throw new Error("unexpected fetch " + url);
};


module.exports = { db, tokens, passwords, state, reset, addUser, ids: { U1, U2, AD, OFF }, get NOW() { return NOW; } };
