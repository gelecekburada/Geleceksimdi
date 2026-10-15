/* JSON <-> XML converter checks.  Run with:  node tests/json-xml.test.js */
const assert = require("assert");
const { jsonToXml, xmlToJson } = require("../core/json-xml.js");

let failed = 0;
const check = (name, fn) => { try { fn(); console.log("PASS", name); } catch (e) { failed++; console.log("FAIL", name, "-", e.message); } };
const j2x = (o, opts) => jsonToXml(typeof o === "string" ? o : JSON.stringify(o), Object.assign({ declaration: false }, opts)).output;
const x2j = (x) => JSON.parse(xmlToJson(x).output);

check("object -> XML with single root key", () =>
  assert.strictEqual(j2x({ user: { name: "Ada", age: 36 } }), "<user>\n  <name>Ada</name>\n  <age>36</age>\n</user>"));
check("array -> repeated elements", () =>
  assert.strictEqual(j2x({ list: { item: [1, 2] } }), "<list>\n  <item>1</item>\n  <item>2</item>\n</list>"));
check("attributes and #text", () =>
  assert.strictEqual(j2x({ a: { "@id": "7", "#text": "hi" } }), '<a id="7">hi</a>'));
check("null -> empty element, empty object -> empty element", () => {
  assert.strictEqual(j2x({ a: { b: null, c: {} } }), "<a>\n  <b/>\n  <c/>\n</a>");
});
check("special characters are escaped", () =>
  assert.strictEqual(j2x({ a: 'x < y & "z" > w', b: 1 }, { rootName: "r" }).includes("x &lt; y &amp; \"z\" &gt; w"), true));
check("attribute quotes are escaped", () =>
  assert.strictEqual(j2x({ a: { "@t": 'say "hi"' } }), '<a t="say &quot;hi&quot;"/>'));
check("multi-key object gets the root name", () =>
  assert.ok(j2x({ a: 1, b: 2 }, { rootName: "data" }).startsWith("<data>")));
check("top-level array wraps items", () =>
  assert.strictEqual(j2x("[1,2]"), "<root>\n  <item>1</item>\n  <item>2</item>\n</root>"));
check("invalid names are repaired with a warning", () => {
  const r = jsonToXml('{"r":{"1st key":"v"}}', { declaration: false });
  assert.ok(r.output.includes("<_1st_key>v</_1st_key>"));
  assert.ok(r.warnings.length === 1);
});
check("XML declaration is added by default and can be turned off", () => {
  assert.ok(jsonToXml('{"a":1}').output.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(!jsonToXml('{"a":1}', { declaration: false }).output.startsWith("<?xml"));
});
check("indent 4 and no-indent are respected", () => {
  assert.ok(j2x({ a: { b: 1 } }, { indent: 4 }).includes("\n    <b>"));
  assert.strictEqual(j2x({ a: { b: 1 } }, { indent: 0 }), "<a><b>1</b></a>");
});
check("invalid JSON gives a clear error", () =>
  assert.throws(() => jsonToXml("{bad"), /Invalid JSON/));
check("empty input is rejected both ways", () => {
  assert.throws(() => jsonToXml("  "), /empty/);
  assert.throws(() => xmlToJson(""), /empty/);
});

check("XML -> JSON basics", () =>
  assert.deepStrictEqual(x2j("<user><name>Ada</name><age>36</age></user>"), { user: { name: "Ada", age: "36" } }));
check("repeated elements become an array", () =>
  assert.deepStrictEqual(x2j("<l><i>1</i><i>2</i><i>3</i></l>"), { l: { i: ["1", "2", "3"] } }));
check("attributes become @keys, text with attributes becomes #text", () =>
  assert.deepStrictEqual(x2j('<a id="7">hi</a>'), { a: { "@id": "7", "#text": "hi" } }));
check("empty and self-closing elements become null", () =>
  assert.deepStrictEqual(x2j("<a><b/><c></c></a>"), { a: { b: null, c: null } }));
check("entities and character references are decoded", () =>
  assert.deepStrictEqual(x2j("<a>&lt;x&gt; &amp; &quot;q&quot; &#65;&#x42;</a>"), { a: '<x> & "q" AB' }));
check("CDATA, comments, prolog and DOCTYPE are handled", () =>
  assert.deepStrictEqual(
    x2j('<?xml version="1.0"?><!DOCTYPE a><!-- c --><a><![CDATA[<raw & text>]]><!-- x --></a>'),
    { a: "<raw & text>" }));
check("single-quoted attributes and namespaces", () =>
  assert.deepStrictEqual(x2j("<ns:a xmlns:ns='u' ns:k='v'/>"), { "ns:a": { "@xmlns:ns": "u", "@ns:k": "v" } }));
check("whitespace between elements is ignored", () =>
  assert.deepStrictEqual(x2j("<a>\n  <b>1</b>\n  <c>2</c>\n</a>"), { a: { b: "1", c: "2" } }));
check("unicode text survives", () =>
  assert.deepStrictEqual(x2j("<a>Şirket ğüöç 日本</a>"), { a: "Şirket ğüöç 日本" }));

check("mismatched closing tag reports line and column", () => {
  try { xmlToJson("<a>\n  <b>x</c>\n</a>"); assert.fail("no error"); }
  catch (e) { assert.ok(/Mismatched closing tag <\/c>, expected <\/b>/.test(e.message)); assert.strictEqual(e.line, 2); }
});
check("unclosed element is an error", () => assert.throws(() => xmlToJson("<a><b></b>"), /not closed/));
check("content after root is an error", () => assert.throws(() => xmlToJson("<a/><b/>"), /after the root/));
check("duplicate attribute is an error", () => assert.throws(() => xmlToJson('<a x="1" x="2"/>'), /Duplicate attribute/));
check("unquoted attribute is an error", () => assert.throws(() => xmlToJson("<a x=1/>"), /quoted/));
check("unknown entity is an error", () => assert.throws(() => xmlToJson("<a>&nope;</a>"), /Unknown entity/));
check("plain text is not XML", () => assert.throws(() => xmlToJson("hello"), /Expected an XML element/));

check("round trip: JSON -> XML -> JSON keeps structure (values as strings)", () => {
  const src = { order: { "@id": "A1", customer: { name: "Ayşe", vip: "true" }, line: [{ sku: "x", qty: "2" }, { sku: "y", qty: "5" }], note: null } };
  const xml = j2x(src);
  assert.deepStrictEqual(x2j(xml), src);
});
check("round trip: XML -> JSON -> XML is stable", () => {
  const xml = '<a id="1">\n  <b>1</b>\n  <b>2</b>\n  <c/>\n</a>';
  assert.strictEqual(j2x(JSON.parse(xmlToJson(xml).output)), xml);
});
check("deeply nested document converts", () => {
  let o = "x"; for (let i = 0; i < 200; i++) o = { n: o };
  const xml = j2x(o); assert.ok(xml.includes("<n>"));
  assert.deepStrictEqual(x2j(xml), o);
});

console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
