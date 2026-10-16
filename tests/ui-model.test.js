const assert = require("assert");
const U = require("../core/ui-model.js");
let n = 0;
function t(name, fn) { try { fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }

t("add snaps to grid and stays inside the frame", () => {
  const d = U.create("mobile");
  const a = U.add(d, "button", 13, 5);
  assert.strictEqual(a.x % 8, 0); assert.strictEqual(a.y % 8, 0);
  const b = U.add(d, "button", 9999, 9999);
  assert.ok(b.x + b.w <= d.frame.w && b.y + b.h <= d.frame.h);
  assert.throws(() => U.add(d, "nope"));
});
t("wide components shrink to narrow frame", () => {
  const d = U.create("mobile");
  assert.ok(U.add(d, "table", 0, 0).w <= 360);
});
t("move and resize are clamped", () => {
  const d = U.create("mobile"); const a = U.add(d, "card", 0, 0);
  U.move(d, a.id, -50, 5000); assert.ok(a.x === 0 && a.y + a.h <= d.frame.h);
  U.resize(d, a.id, 99999, 99999); assert.ok(a.x + a.w <= d.frame.w && a.y + a.h <= d.frame.h);
  U.resize(d, a.id, 1, 1); assert.ok(a.w >= 16 && a.h >= 8);
  assert.strictEqual(U.move(d, "zzz", 1, 1), null);
});
t("remove, duplicate, z-order", () => {
  const d = U.create("mobile"); const a = U.add(d, "text"), b = U.add(d, "button");
  const c = U.duplicate(d, a.id); assert.strictEqual(c.text, a.text); assert.notStrictEqual(c.id, a.id);
  U.toFront(d, a.id); assert.strictEqual(d.items[d.items.length - 1].id, a.id);
  U.toBack(d, a.id); assert.strictEqual(d.items[0].id, a.id);
  assert.ok(U.remove(d, b.id)); assert.ok(!U.remove(d, b.id));
});
t("ids stay unique after deletes", () => {
  const d = U.create("mobile"); const a = U.add(d, "text"); U.remove(d, a.id);
  const b = U.add(d, "text"); assert.notStrictEqual(a.id, b.id);
});
t("changing frame re-fits items", () => {
  const d = U.create("desktop"); const a = U.add(d, "card", 900, 400);
  U.setFrame(d, "mobile"); assert.ok(a.x + a.w <= 360 && a.y + a.h <= 640);
});
t("svg export contains texts, escapes markup, no editor ids", () => {
  const d = U.create("mobile"); const a = U.add(d, "heading"); U.setText(d, a.id, "A <b> & C");
  U.add(d, "table"); U.add(d, "navbar", 0, 0);
  const svg = U.toSvg(d);
  assert.ok(svg.startsWith("<svg") && svg.includes("A &lt;b&gt; &amp; C") && !svg.includes("data-id"));
  const body = svg.replace(/<[^>]+>/g, ""); assert.ok(!/[<>]/.test(body));
});
t("editor svg adds hit targets and a resize handle", () => {
  const d = U.create("mobile"); const a = U.add(d, "button");
  const svg = U.toSvg(d, { editor: true, selectedId: a.id });
  assert.ok(svg.includes('data-id="' + a.id + '"') && svg.includes("data-handle"));
});
t("every component type renders", () => {
  const d = U.create("tablet");
  Object.keys(U.TYPES).forEach(k => U.add(d, k, 8, 8));
  assert.ok(U.toSvg(d).length > 1000);
});
t("load round-trips and rejects junk", () => {
  const d = U.create("mobile"); U.add(d, "input", 16, 80); U.setText(d, "c1", "Email");
  const back = U.load(JSON.stringify(d));
  assert.strictEqual(back.items.length, 1); assert.strictEqual(back.items[0].text, "Email"); assert.strictEqual(back.items[0].y, 80);
  assert.throws(() => U.load("{}")); assert.throws(() => U.load("not json"));
  assert.strictEqual(U.load({ frame: { w: 360, h: 640 }, items: [{ type: "evil", x: 0, y: 0 }] }).items.length, 0);
});

console.log("ui-model: " + n + " checks ALL PASSED");
