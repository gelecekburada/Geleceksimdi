const assert = require("assert");
const R = require("../core/regex-tools.js");

let n = 0;
function t(name, fn) { fn(); n++; }

t("finds all matches with g", () => {
  const r = R.findMatches("\\d+", "g", "a1 b22 c333");
  assert.deepStrictEqual(r.matches.map(m => m.text), ["1", "22", "333"]);
});
t("without g only first", () => {
  const r = R.findMatches("\\d+", "", "a1 b22");
  assert.strictEqual(r.matches.length, 1);
});
t("groups and named groups", () => {
  const r = R.findMatches("(?<y>\\d{4})-(\\d{2})", "g", "2026-10");
  assert.strictEqual(r.matches[0].named.y, "2026");
  assert.strictEqual(r.matches[0].groups[1], "10");
});
t("invalid pattern returns error", () => {
  assert.ok(R.findMatches("(", "g", "x").error);
});
t("empty matches do not loop forever", () => {
  const r = R.findMatches("x*", "g", "abc");
  assert.ok(r.matches.length <= 4);
});
t("highlight escapes html", () => {
  const r = R.findMatches("b", "g", "<a>b</a>");
  const h = R.highlight("<a>b</a>", r.matches);
  assert.ok(h.indexOf("&lt;a&gt;") === 0 && h.indexOf('<mark class="mark">b</mark>') > 0);
});
t("replace preview", () => {
  assert.strictEqual(R.replacePreview("(\\w+)@", "g", "a@b", "$1 at ").output, "a at b");
  assert.ok(R.replacePreview("(", "g", "a", "").error);
});
t("explain EN and TR", () => {
  const e = R.explain("^(\\d{2,4})-[a-z]+$", "en").map(x => x.token);
  assert.deepStrictEqual(e, ["^", "(", "\\d", "{2,4}", ")", "-", "[a-z]", "+", "$"]);
  assert.ok(R.explain("\\d+", "tr")[0].text.indexOf("rakam") > -1);
});
t("library patterns all match their sample", () => {
  R.LIBRARY.forEach(p => {
    const r = R.findMatches(p.pattern, p.flags, p.sample);
    assert.ok(!r.error && r.matches.length > 0, p.id);
  });
});
t("date library rejects invalid month", () => {
  const lib = R.LIBRARY.find(p => p.id === "date-dmy");
  assert.strictEqual(R.findMatches(lib.pattern, "g", "31.13.2026").matches.length, 0);
});

console.log("regex-tools: " + n + " checks ALL PASSED");
