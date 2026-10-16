/* SQL formatter checks.  Run with:  node tests/sql-format.test.js */
const assert = require("assert");
const S = require("../core/sql-format.js");
let failed = 0;
const check = (name, fn) => { try { fn(); console.log("PASS", name); } catch (e) { failed++; console.log("FAIL", name, "-", e.message); } };
const norm = (s) => S._tokenize(s).filter((t) => !/comment/.test(t.t)).map((t) => t.v.toUpperCase()).join(" ");

check("basic SELECT layout", () => assert.strictEqual(
  S.format("select a,b from t where x=1 and y=2 order by a desc"),
  "SELECT\n  a,\n  b\nFROM t\nWHERE x = 1\n  AND y = 2\nORDER BY\n  a DESC"));
check("joins put ON on its own indented line", () => assert.strictEqual(
  S.format("select * from a inner join b on a.id=b.id left join c on c.id=a.id"),
  "SELECT\n  *\nFROM a\nINNER JOIN b\n  ON a.id = b.id\nLEFT JOIN c\n  ON c.id = a.id"));
check("BETWEEN ... AND does not break the line", () =>
  assert.ok(S.format("select 1 from t where d between 1 and 5 and e=2").includes("WHERE d BETWEEN 1 AND 5\n  AND e = 2")));
check("subquery is indented and closed on its own line", () => assert.strictEqual(
  S.format("select * from (select id from u) x"),
  "SELECT\n  *\nFROM (\n  SELECT\n    id\n  FROM u\n) x"));
check("CTE formatting", () => assert.ok(S.format("with x as (select 1) select * from x").startsWith("WITH x AS (\n  SELECT\n    1\n)\nSELECT")));
check("CASE WHEN is laid out vertically", () => assert.strictEqual(
  S.format("select case when a=1 then 'x' else 'y' end k from t"),
  "SELECT\n  CASE\n    WHEN a = 1 THEN 'x'\n    ELSE 'y'\n  END k\nFROM t"));
check("function calls and IN lists stay inline", () =>
  assert.ok(S.format("select coalesce(a,0) from t where id in (1,2,3)").includes("COALESCE(a, 0)") &&
            S.format("select 1 from t where id in (1,2,3)").includes("IN (1, 2, 3)")));
check("string contents and quoted identifiers are never touched", () => {
  const out = S.format("select 'select from where' as \"Order By\" from t");
  assert.ok(out.includes("'select from where'") && out.includes('"Order By"'));
});
check("escaped quotes inside strings survive", () => assert.ok(S.format("select 'it''s' from t").includes("'it''s'")));
check("INSERT with multiple rows", () => assert.strictEqual(
  S.format("insert into t (a,b) values (1,2),(3,4)"), "INSERT INTO t (a, b)\nVALUES (1, 2),\n  (3, 4)"));
check("UPDATE and DELETE", () => assert.strictEqual(
  S.format("update t set a=1,b=2 where id=3; delete from t where id=3;"),
  "UPDATE t\nSET\n  a = 1,\n  b = 2\nWHERE id = 3;\n\nDELETE FROM t\nWHERE id = 3;"));
check("CREATE TABLE puts one column per line", () => assert.strictEqual(
  S.format("create table u (id int primary key, name varchar(50) not null)"),
  "CREATE TABLE u (\n  id int PRIMARY KEY,\n  name varchar(50) NOT NULL\n)"));
check("comments are kept", () => {
  const out = S.format("select a -- why\nfrom t /* note */ where x=1");
  assert.ok(out.includes("-- why") && out.includes("/* note */"));
});
check("keyword case options", () => {
  assert.ok(S.format("SELECT a FROM t", { keywordCase: "lower" }).startsWith("select"));
  assert.ok(S.format("select a from t", { keywordCase: "keep" }).startsWith("select"));
});
check("indent options: 4 spaces and tab", () => {
  assert.ok(S.format("select a from t", { indent: 4 }).includes("\n    a"));
  assert.ok(S.format("select a from t", { indent: "tab" }).includes("\n\ta"));
});
check("leading comma style", () =>
  assert.strictEqual(S.format("select a,b from t", { comma: "leading" }), "SELECT\n  a\n  , b\nFROM t"));
check("formatting is idempotent", () => {
  const q = "select a,b,count(*) c from t1 inner join t2 on t1.id=t2.id where x in (select id from z) and y=1 group by a,b having count(*)>1 order by a";
  const once = S.format(q);
  assert.strictEqual(S.format(once), once);
});
check("formatting never changes the statement itself (same tokens)", () => {
  const q = "select a,b,count(*) c from t1 inner join t2 on t1.id=t2.id where x in (select id from z) and y between 1 and 5 group by a,b having count(*)>1 order by a desc limit 5";
  assert.strictEqual(norm(S.format(q)), norm(q));
});
check("minify removes comments and extra whitespace", () =>
  assert.strictEqual(S.minify("select  a ,\n b\nfrom t -- x\nwhere  a = 1"), "select a, b from t where a = 1"));
check("empty input is rejected", () => { assert.throws(() => S.format("  "), /empty/); assert.throws(() => S.minify(""), /empty/); });
console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
