/*
 * "Son 5 işlem" (core/history.js) checks.  Run with:  node tests/history.test.js
 * Simulated browser (not a real one); AI answers are canned.
 */
const assert = require("assert");
const L = require("./chainlib");

let failed = 0;
const check = (name, fn) => Promise.resolve().then(fn).then(
  () => console.log("PASS", name),
  (e) => { failed++; console.log("FAIL", name, "-", e.message); });

const hist = (page) => JSON.parse(L.ls.getItem("baforge-history-" + page) || "[]");

(async () => {
  /* ---- UAT: 6 runs keep only the newest 5 ---- */
  const uat = L.page("uat.html", { type: { value: "Functional" }, number: { value: "2" }, focus: { value: "All" }, priority: { value: "All" } });
  await check("UAT page loads without script errors", () => assert.deepStrictEqual(uat.errors, []));
  for (let i = 1; i <= 6; i++) {
    uat.el("requirement").value = `Requirement number ${i} must work for the user`;
    L.canned({ generate: [{ id: "UAT-" + i, title: "case " + i, objective: "o", preconditions: "p", steps: ["s"], expectedResult: "e", priority: "High", testData: {} }] });
    uat.el("generateButton").click(); await L.tick();
  }
  await check("UAT keeps exactly 5 entries, newest first", () => {
    const h = hist("uat");
    assert.strictEqual(h.length, 5);
    assert.ok(h[0].label.includes("number 6"));
    assert.ok(h[4].label.includes("number 2"));
  });
  await check("UAT restore puts the old input and result back", () => {
    const h = hist("uat");
    uat.el("requirement").value = "something else entirely typed now";
    assert.strictEqual(uat.window.BAHistory.restore(h[3].id), true);
    assert.ok(uat.el("requirement").value.includes("number 3"));
    assert.ok(String(uat.el("resultsBody").innerHTML).includes("case 3"));
  });
  await check("UAT delete + clear work", () => {
    const h = hist("uat");
    uat.window.BAHistory.remove(h[0].id);
    assert.strictEqual(hist("uat").length, 4);
    uat.window.BAHistory.clear();
    assert.strictEqual(hist("uat").length, 0);
  });

  /* ---- Test Data ---- */
  const td = L.page("test-data.html");
  await check("Test Data page loads without script errors", () => assert.deepStrictEqual(td.errors, []));
  for (let i = 1; i <= 2; i++) {
    td.el("context").value = `Transfer money between accounts, variant ${i}`;
    L.canned({ generate: [{ id: "TD-" + i, title: "row " + i, objective: "o", preconditions: "p", steps: ["s"], expectedResult: "e", priority: "High", testData: { a: i } }] });
    td.el("generateButton").click(); await L.tick();
  }
  await check("Test Data records each generation", () => assert.strictEqual(hist("test-data").length, 2));
  await check("Test Data restore brings the older result back", () => {
    const h = hist("test-data");
    td.el("context").value = "other";
    assert.strictEqual(td.window.BAHistory.restore(h[1].id), true);
    assert.ok(td.el("context").value.includes("variant 1"));
  });

  /* ---- User Story ---- */
  const us = L.page("user-story.html");
  await check("User Story page loads without script errors", () => assert.deepStrictEqual(us.errors, []));
  for (let i = 1; i <= 2; i++) {
    us.el("requirement").value = `The system shall let a clerk scan item ${i} quickly`;
    L.canned({ "user-story": { story: `As a Clerk ${i}, I want to scan, So that stock updates.`, businessValue: "v",
      acceptanceCriteria: [{ id: "AC-1", given: "g", when: "w", then: "t" }], businessRules: [], assumptions: [], dependencies: [], edgeCases: [], openQuestions: [] } });
    us.el("generateButton").click(); await L.tick();
  }
  await check("User Story records each generation", () => assert.strictEqual(hist("user-story").length, 2));
  await check("User Story restore brings the older story back", () => {
    const h = hist("user-story");
    us.el("story").value = "overwritten";
    assert.strictEqual(us.window.BAHistory.restore(h[1].id), true);
    assert.ok(us.el("story").value.includes("Clerk 1"), us.el("story").value);
  });

  /* ---- Acceptance Criteria ---- */
  const ac = L.page("acceptance-criteria.html");
  await check("Acceptance Criteria page loads without script errors", () => assert.deepStrictEqual(ac.errors, []));
  for (let i = 1; i <= 2; i++) {
    ac.el("req") && 0;
    const reqEl = ac.window.document.getElementById("requirement") || ac.el("requirement");
    reqEl.value = `Customer can reset the password number ${i} by email`;
    L.canned({ "acceptance-criteria": { acceptanceCriteria: [{ id: "AC-00" + i, type: "positive", given: "g", when: "w", then: "t" }], testabilityScore: 70 + i } });
    ac.el("generate").click(); await L.tick();
  }
  await check("Acceptance Criteria records each generation", () => assert.strictEqual(hist("acceptance-criteria").length, 2));

  await check("Acceptance Criteria restore brings the older result back", () => {
    const h = hist("acceptance-criteria");
    assert.strictEqual(ac.window.BAHistory.restore(h[1].id), true);
    assert.ok(ac.window.document.getElementById("requirement").value.includes("number 1"));
  });

  /* ---- Safety ---- */
  await check("Corrupt stored history does not break the page", () => {
    L.ls.setItem("baforge-history-uat", "{not json");
    const p = L.page("uat.html", { type: { value: "Functional" }, number: { value: "2" }, focus: { value: "All" }, priority: { value: "All" } });
    assert.deepStrictEqual(p.errors, []);
    assert.strictEqual(JSON.stringify(p.window.BAHistory.list("uat")), "[]");
  });

  console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
  process.exit(failed ? 1 : 0);
})();
