/*
 * End-to-end hand-off checks across the BA workflow pages.
 * Run with:  node tests/chain.test.js
 * Real page JavaScript + real API handlers run in a simulated browser;
 * the AI service is replaced by canned answers. No network is used.
 */
const assert = require("assert");
const L = require("./chainlib");

const names = ["FR-01 Users", "FR-02 Stock", "FR-03 Barcode", "FR-04 Reports", "NFR-1 Security", "NFR-2 Speed", "NFR-3 Usability"];
const det = names.map((n, i) => ({
  title: n, requirement: `Requirement text number ${i + 1} for the system.`, summary: "s",
  requirementType: i < 4 ? "Functional" : "Non-Functional", priority: "High",
  clarityScore: 50 + i, completenessScore: 40 + i, testabilityScore: 30 + i,
  ambiguities: [], missingInformation: [], assumptions: [], businessRules: [], openQuestions: [], edgeCases: [],
}));
const first = det[0];
L.ss.setItem("baforge-selected-requirements", JSON.stringify(det));
L.ss.setItem("baforge-current-requirement", JSON.stringify({ id: "req_1", title: first.title, description: first.requirement,
  requirement: first.requirement, summary: "s", requirementType: "Functional", priority: "High", analysis: { clarityScore: 50, completenessScore: 40, testabilityScore: 30 } }));

let failed = 0;
const check = (name, fn) => { try { fn(); console.log("PASS", name); } catch (e) { failed++; console.log("FAIL", name, "-", e.message); } };

(async () => {
  const TAIL = "window.__t={get set(){return requirementSet},selectRequirementIndex};";
  const w = L.page("requirement.html", {}, { tail: TAIL });
  check("Workspace shows all 7 requirements", () => assert.strictEqual(w.window.__t.set.length, 7));
  w.window.__t.selectRequirementIndex(2, { skipConfirm: true });
  w.el("continueButton").click(); await L.tick();

  const u = L.page("user-story.html");
  check("User Story receives the selected requirement", () => assert.ok(u.el("requirement").value.includes("number 3")));
  L.canned({ "user-story": { story: "As a Clerk, I want to scan, So that stock updates.", businessValue: "v",
    acceptanceCriteria: [{ id: "AC-1", given: "g", when: "w", then: "t" }], businessRules: [], assumptions: [], dependencies: [], edgeCases: [], openQuestions: [] } });
  u.el("generateButton").click(); await L.tick();
  check("User Story generates a story", () => assert.ok(u.el("story").value.startsWith("As a Clerk")));
  u.el("continueButton").click(); await L.tick();
  check("User Story hands over to Acceptance Criteria", () => assert.ok(L.ss.getItem("baforge-current-acceptance-criteria")));

  const a = L.page("acceptance-criteria.html");
  L.canned({ "acceptance-criteria": { acceptanceCriteria: [{ id: "AC-001", type: "positive", given: "g", when: "w", then: "t" }], testabilityScore: 80 } });
  a.el("generate").click(); await L.tick();
  let threw = null;
  try { a.el("continue").click(); } catch (e) { threw = e; }
  check("Acceptance Criteria Continue does not throw", () => assert.strictEqual(threw, null, threw && threw.message));
  check("Acceptance Criteria hands over to UAT", () => assert.ok(L.ss.getItem("baforge-uat-context")));

  const uat = L.page("uat.html", { type: { value: "Functional" }, number: { value: "2" }, focus: { value: "All" }, priority: { value: "All" } });
  L.canned({ generate: [{ id: "UAT-001", title: "t", objective: "o", preconditions: "p", steps: ["s"], expectedResult: "e", priority: "High", testData: {} }] });
  uat.el("generateButton").click(); await L.tick();
  check("UAT generates test cases", () => assert.ok(L.ss.getItem("baforge-uat-generated") || L.ls.getItem("baforge-uat-generated")));

  const td = L.page("test-data.html");
  L.canned({ generate: [{ id: "TD-001", title: "t", objective: "o", preconditions: "p", steps: ["s"], expectedResult: "e", priority: "High", testData: { a: 1 } }] });
  td.el("generateButton").click(); await L.tick();
  const tdBody = L.apiCalls.slice(-1)[0].body.requirement;
  check("Test Data request has no doubled 'Requirement:' prefix", () => assert.ok(!/Requirement:\s*Requirement:/i.test(tdBody)));

  const tr = L.page("traceability.html");
  check("Traceability does not claim full traceability with 7 requirements and 1 story", () =>
    assert.ok(!/Full traceability|\u2713/.test(tr.el("status").textContent)));

  const dc = L.page("document.html");
  dc.el("generateButton").click(); await L.tick();
  const html = (dc.el("documentContent").innerHTML || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  check("Document lists all 7 requirements", () => assert.ok(html.includes("Requirements in Scope (7)")));
  check("Document details the selected requirement (FR-03), not the first", () => {
    const i = html.indexOf("1. Requirement");
    assert.ok(html.slice(i, i + 200).includes("FR-03"));
  });

  if (failed) { console.log(failed + " check(s) failed"); process.exit(1); }
  console.log("All checks passed");
})();
