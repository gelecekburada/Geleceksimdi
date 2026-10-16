/* Tests for the accounts / usage / admin API using an in-memory fake of Supabase. */
const assert = require("assert");
const fake = require("./fake-supabase");
const { db, reset } = fake, { U1, U2, AD, OFF } = fake.ids;
const NOW = fake.NOW;
const realNow = Date.now; Date.now = () => NOW;
let failRestSet = (v) => { fake.state.failRest = v; };
let otpCalls = fake.state.otpCalls;
const tokens = fake.tokens;

const sb = require("../api/_lib/sb");
const guard = require("../api/_lib/guard");
const me = require("../api/me"), track = require("../api/track"), feedback = require("../api/feedback");
const login = require("../api/auth-login"), refresh = require("../api/auth-refresh"), admin = require("../api/admin");

function mk(method, { token, body, query, headers } = {}) {
  const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  const req = { method, body, query: query || {}, headers: Object.assign({}, token ? { authorization: "Bearer " + token } : {}, headers || {}) };
  return { req, res };
}
async function run(fn, method, opts) { const { req, res } = mk(method, opts); await fn(req, res); return res; }

let n = 0;
async function t(name, fn) { reset(); try { await fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }

(async () => {
  await t("istanbul day start", () => {
    assert.strictEqual(sb.istanbulDayStart(Date.parse("2026-10-16T22:30:00Z")), "2026-10-16T21:00:00.000Z");
    assert.strictEqual(sb.istanbulDayStart(Date.parse("2026-10-16T20:59:00Z")), "2026-10-15T21:00:00.000Z");
  });
  await t("keyHeaders: JWT keys also go in Authorization, new keys only in apikey", () => {
    assert.ok(sb.keyHeaders("eyJabc").Authorization);
    assert.ok(!sb.keyHeaders("sb_secret_x").Authorization);
  });

  await t("guard: anonymous allowed and logged by default", async () => {
    const { req, res } = mk("POST", { body: {} });
    assert.strictEqual(await guard(req, res, "user-story"), true);
    assert.strictEqual(db.usage_events.length, 1); assert.strictEqual(db.usage_events[0].user_id, null);
  });
  await t("guard: anonymous blocked when AI_REQUIRE_LOGIN=1", async () => {
    process.env.AI_REQUIRE_LOGIN = "1";
    try { const { req, res } = mk("POST", { body: { language: "en" } }); assert.strictEqual(await guard(req, res, "x"), false); assert.strictEqual(res.statusCode, 401); assert.strictEqual(res.body.code, "login_required"); assert.ok(/sign in/i.test(res.body.error)); }
    finally { delete process.env.AI_REQUIRE_LOGIN; }
  });
  await t("guard: signed-in user counted, blocked at the limit", async () => {
    for (let i = 0; i < 3; i++) { const { req, res } = mk("POST", { token: "tok-" + U1, body: {} }); assert.strictEqual(await guard(req, res, "uat"), true); }
    const { req, res } = mk("POST", { token: "tok-" + U1, body: { language: "tr" } });
    assert.strictEqual(await guard(req, res, "uat"), false); assert.strictEqual(res.statusCode, 429); assert.strictEqual(res.body.code, "limit_reached");
    assert.strictEqual(db.usage_events.filter((e) => e.user_id === U1).length, 3, "blocked call must not be logged");
    const o = mk("POST", { token: "tok-" + U2, body: {} }); assert.strictEqual(await guard(o.req, o.res, "uat"), true, "limit is per user");
  });
  await t("guard: yesterday's calls do not count", async () => {
    for (let i = 0; i < 3; i++) db.usage_events.push({ id: 100 + i, user_id: U1, kind: "ai", tool: "x", created_at: "2026-10-15T10:00:00Z" });
    const { req, res } = mk("POST", { token: "tok-" + U1, body: {} }); assert.strictEqual(await guard(req, res, "x"), true);
  });
  await t("guard: admin has no limit; disabled account blocked", async () => {
    for (let i = 0; i < 10; i++) { const { req, res } = mk("POST", { token: "tok-" + AD, body: {} }); assert.strictEqual(await guard(req, res, "x"), true); }
    const { req, res } = mk("POST", { token: "tok-" + OFF, body: {} }); assert.strictEqual(await guard(req, res, "x"), false); assert.strictEqual(res.statusCode, 403);
  });
  await t("guard: signed-in user fails closed when the usage store is down", async () => {
    failRestSet(true); const { req, res } = mk("POST", { token: "tok-" + U1, body: {} });
    assert.strictEqual(await guard(req, res, "x"), false); assert.strictEqual(res.statusCode, 503);
  });
  await t("guard: no Supabase config keeps the old behaviour", async () => {
    const s = process.env.SUPABASE_URL; delete process.env.SUPABASE_URL;
    try { const { req, res } = mk("POST", { body: {} }); assert.strictEqual(await guard(req, res, "x"), true); assert.strictEqual(db.usage_events.length, 0); } finally { process.env.SUPABASE_URL = s; }
  });

  await t("me: needs sign-in, returns profile + usage", async () => {
    assert.strictEqual((await run(me, "GET")).statusCode, 401);
    db.usage_events.push({ id: 1, user_id: U1, kind: "ai", tool: "x", created_at: new Date(NOW).toISOString() });
    const r = await run(me, "GET", { token: "tok-" + U1 });
    assert.strictEqual(r.statusCode, 200); assert.strictEqual(r.body.email, "u1@x.com"); assert.strictEqual(r.body.ai_used_today, 1); assert.strictEqual(r.body.daily_ai_limit, 3); assert.strictEqual(r.body.role, "user");
    assert.ok(db.profiles.find((p) => p.id === U1).last_seen_at, "last_seen updated");
  });
  await t("track: only for active signed-in users, validates tool name", async () => {
    assert.strictEqual((await run(track, "POST", { body: { tool: "uat" } })).body.ok, false);
    assert.strictEqual((await run(track, "POST", { token: "tok-" + OFF, body: { tool: "uat" } })).body.ok, false);
    assert.strictEqual((await run(track, "POST", { token: "tok-" + U1, body: { tool: "../x" } })).statusCode, 400);
    assert.strictEqual((await run(track, "POST", { token: "tok-" + U1, body: { tool: "uat" } })).body.ok, true);
    assert.deepStrictEqual(db.usage_events.map((e) => [e.user_id, e.kind, e.tool]), [[U1, "page", "uat"]]);
  });
  await t("feedback: validation, anonymous and signed-in", async () => {
    assert.strictEqual((await run(feedback, "POST", { body: { message: "ab" } })).statusCode, 400);
    assert.strictEqual((await run(feedback, "POST", { body: { message: "x".repeat(4001) } })).statusCode, 400);
    assert.strictEqual((await run(feedback, "POST", { body: { message: "Button broken", category: "bug", page: "/uat.html" } })).statusCode, 200);
    assert.strictEqual((await run(feedback, "POST", { token: "tok-" + U1, body: { message: "Great idea here", category: "weird" } })).statusCode, 200);
    assert.strictEqual(db.feedback[0].user_id, null); assert.strictEqual(db.feedback[1].user_id, U1); assert.strictEqual(db.feedback[1].category, "other"); assert.strictEqual(db.feedback[1].email, "u1@x.com");
  });
  await t("feedback: throttled per IP", async () => {
    let last; for (let i = 0; i < 6; i++) last = await run(feedback, "POST", { body: { message: "message " + i }, headers: { "x-forwarded-for": "9.9.9.9" } });
    assert.strictEqual(last.statusCode, 429);
  });

  await t("login: sign-up creates a confirmed user, no email is sent, signs in at once", async () => {
    assert.strictEqual((await run(login, "POST", { body: { action: "signup", email: "nope", password: "12345678" } })).statusCode, 400);
    assert.strictEqual((await run(login, "POST", { body: { action: "signup", email: "n@x.com", password: "short" } })).statusCode, 400);
    const ok = await run(login, "POST", { body: { action: "signup", email: " New@X.com ", password: "sifre-12345" } });
    assert.strictEqual(ok.statusCode, 200); assert.ok(ok.body.session.access_token && ok.body.session.refresh_token && ok.body.session.expires_at);
    assert.strictEqual(otpCalls.length, 0);
    assert.ok(fake.db.profiles.some((p) => p.email === "new@x.com" && p.role === "user"));
    assert.ok(!JSON.stringify(ok.body).includes("service-key") && !JSON.stringify(ok.body).includes("anon-key"));
    const dup = await run(login, "POST", { body: { action: "signup", email: "new@x.com", password: "baska-sifre-1" } });
    assert.strictEqual(dup.statusCode, 409); assert.strictEqual(dup.body.code, "exists");
  });
  await t("login: sign-in with password, wrong password, and the token works", async () => {
    await run(login, "POST", { body: { action: "signup", email: "p@x.com", password: "dogru-sifre-1" } });
    const ok = await run(login, "POST", { body: { action: "signin", email: "p@x.com", password: "dogru-sifre-1" } });
    assert.strictEqual(ok.statusCode, 200);
    const info = await run(require("../api/me"), "GET", { token: ok.body.session.access_token });
    assert.strictEqual(info.statusCode, 200); assert.strictEqual(info.body.email, "p@x.com");
    const bad = await run(login, "POST", { body: { action: "signin", email: "p@x.com", password: "yanlis" } });
    assert.strictEqual(bad.statusCode, 401); assert.strictEqual(bad.body.code, "bad_credentials");
    assert.strictEqual((await run(login, "POST", { body: { action: "signin", email: "yok@x.com", password: "whatever12" } })).statusCode, 401);
    assert.strictEqual((await run(login, "POST", { body: { action: "signin", email: "p@x.com", password: "" } })).statusCode, 400);
  });
  await t("login: throttled after 10 tries", async () => {
    let last; for (let i = 0; i < 11; i++) last = await run(login, "POST", { body: { action: "signin", email: "t@t.com", password: "x12345678" }, headers: { "x-forwarded-for": "1.1.1.1" } });
    assert.strictEqual(last.statusCode, 429);
  });
  await t("refresh: good and bad token", async () => {
    assert.strictEqual((await run(refresh, "POST", { body: { refresh_token: "good-refresh" } })).body.refresh_token, "r2");
    assert.strictEqual((await run(refresh, "POST", { body: { refresh_token: "nope" } })).statusCode, 401);
    assert.strictEqual((await run(refresh, "POST", { body: {} })).statusCode, 400);
  });

  await t("admin: only active admins", async () => {
    assert.strictEqual((await run(admin, "GET")).statusCode, 401);
    assert.strictEqual((await run(admin, "GET", { token: "tok-" + U1 })).statusCode, 403);
    assert.strictEqual((await run(admin, "GET", { token: "tok-" + AD, query: { view: "users" } })).body.users.length, 4);
    db.profiles.find((p) => p.id === AD).is_active = false;
    assert.strictEqual((await run(admin, "GET", { token: "tok-" + AD })).statusCode, 403);
  });
  await t("admin: overview, ai and feedback views", async () => {
    db.usage_events.push({ id: 1, user_id: U1, kind: "ai", tool: "uat", created_at: "2026-10-16T09:00:00Z" }, { id: 2, user_id: U1, kind: "page", tool: "uat", created_at: "2026-10-16T09:00:00Z" }, { id: 3, user_id: null, kind: "ai", tool: "uat", created_at: "2026-10-16T09:01:00Z" });
    db.feedback.push({ id: 1, status: "open", message: "hi", created_at: "2026-10-16T08:00:00Z" });
    const o = (await run(admin, "GET", { token: "tok-" + AD })).body;
    assert.strictEqual(o.users_total, 4); assert.strictEqual(o.admins, 1); assert.strictEqual(o.feedback_open, 1); assert.strictEqual(o.active_users_7d, 1);
    assert.strictEqual(o.tools[0].tool, "uat"); assert.strictEqual(o.ai_14d.length, 14); assert.strictEqual(o.ai_14d[13].count, 2);
    const ai = (await run(admin, "GET", { token: "tok-" + AD, query: { view: "ai" } })).body;
    assert.strictEqual(ai.rows[0].email, "u1@x.com"); assert.strictEqual(ai.rows[0].today, 1); assert.strictEqual(ai.anonymous_today, 1);
    assert.strictEqual((await run(admin, "GET", { token: "tok-" + AD, query: { view: "feedback" } })).body.feedback.length, 1);
  });
  await t("admin: setUser changes and protects itself", async () => {
    const r = await run(admin, "POST", { token: "tok-" + AD, body: { action: "setUser", id: U1, daily_ai_limit: 50, role: "admin" } });
    assert.strictEqual(r.statusCode, 200); assert.strictEqual(db.profiles.find((p) => p.id === U1).daily_ai_limit, 50); assert.strictEqual(db.profiles.find((p) => p.id === U1).role, "admin");
    assert.strictEqual((await run(admin, "POST", { token: "tok-" + AD, body: { action: "setUser", id: AD, role: "user" } })).statusCode, 400);
    assert.strictEqual((await run(admin, "POST", { token: "tok-" + AD, body: { action: "setUser", id: AD, is_active: false } })).statusCode, 400);
    assert.strictEqual((await run(admin, "POST", { token: "tok-" + AD, body: { action: "setUser", id: U1, daily_ai_limit: -1 } })).statusCode, 400);
    assert.strictEqual((await run(admin, "POST", { token: "tok-" + AD, body: { action: "setUser", id: U1, role: "root" } })).statusCode, 400);
    assert.strictEqual((await run(admin, "POST", { token: "tok-" + AD, body: { action: "setUser", id: "not-a-uuid", role: "user" } })).statusCode, 400);
    assert.strictEqual((await run(admin, "POST", { token: "tok-" + U2, body: { action: "setUser", id: U1, role: "admin" } })).statusCode, 403);
  });
  await t("admin: feedback status", async () => {
    db.feedback.push({ id: 5, status: "open", message: "x", created_at: "2026-10-16T08:00:00Z" });
    assert.strictEqual((await run(admin, "POST", { token: "tok-" + AD, body: { action: "feedbackStatus", id: 5, status: "done" } })).statusCode, 200);
    assert.strictEqual(db.feedback[0].status, "done");
    assert.strictEqual((await run(admin, "POST", { token: "tok-" + AD, body: { action: "feedbackStatus", id: 5, status: "weird" } })).statusCode, 400);
  });

  Date.now = realNow;
  console.log("accounts: " + n + " checks ALL PASSED");
})().catch((e) => { console.error(e); process.exit(1); });
