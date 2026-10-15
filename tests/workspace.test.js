/*
 * Requirement Workspace checks. Run with:  node tests/workspace.test.js
 * Runs the real page JavaScript in a simulated browser (no real browser,
 * no network). Exits with a non-zero code if any check fails.
 */
const assert = require("assert");
const { runPage } = require("./run-page");

const TAIL = `window.__t = {
  get set(){return requirementSet}, get cur(){return currentRequirement},
  selectRequirementIndex, saveRequirement, clearRequirement
};`;

const detected = [
  { title: "Login", requirement: "Users sign in with email and password.", summary: "login", requirementType: "Functional", priority: "High",
    clarityScore: 90, completenessScore: 80, testabilityScore: 70, ambiguities: ["x"] },
  { title: "Reset", requirement: "Users can reset a forgotten password.", summary: "reset", requirementType: "Functional", priority: "Low",
    clarityScore: 40, completenessScore: 30, testabilityScore: 20, ambiguities: ["y", "z"] },
  { title: "Speed", requirement: "Login finishes within 2 seconds.", summary: "perf", requirementType: "Non-Functional", priority: "Medium" },
];
const first = detected[0];
const current = { id: "req_1", title: first.title, description: first.requirement, requirement: first.requirement,
  summary: first.summary, requirementType: "Functional", priority: "High",
  analysis: { clarityScore: 90, completenessScore: 80, testabilityScore: 70, ambiguities: ["x"] } };
const session = {
  "baforge-selected-requirements": JSON.stringify(detected),
  "baforge-current-requirement": JSON.stringify(current),
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("PASS", name); }
  catch (e) { failed++; console.log("FAIL", name, "-", e.message); }
}
const open = (extra = {}) => runPage({ session, tail: TAIL, lang: "en", ...extra });

check("3 transferred requirements give exactly 3 records", () => {
  assert.strictEqual(open().window.__t.set.length, 3);
});
check("each record keeps its own scores; missing scores stay empty", () => {
  const r = open(); const T = r.window.__t;
  T.selectRequirementIndex(1, { skipConfirm: true });
  assert.strictEqual(r.el("clarityScore").textContent, 40);
  T.selectRequirementIndex(2, { skipConfirm: true });
  assert.strictEqual(r.el("clarityScore").textContent, "—");
});
check("reload does not add records", () => {
  const r = open(); r.window.__t.selectRequirementIndex(1, { skipConfirm: true });
  const n = runPage({ local: r.localStorage.dump(), session: r.sessionStorage.dump(), tail: TAIL, lang: "en" });
  assert.strictEqual(n.window.__t.set.length, 3);
});
check("saving twice keeps one artifact with scores", () => {
  const r = open(); const T = r.window.__t;
  T.saveRequirement(true); T.saveRequirement(true);
  const arts = r.window.BAArtifactStore.getByType("requirement");
  assert.strictEqual(arts.length, 1);
  assert.strictEqual(arts[0].content.analysis.clarityScore, 90);
  assert.strictEqual(JSON.stringify(arts[0].content.analysis.ambiguities), '["x"]');
});
check("Clear removes the list for good", () => {
  const r = open(); r.window.__t.clearRequirement();
  const n = runPage({ local: r.localStorage.dump(), session: r.sessionStorage.dump(), tail: TAIL, lang: "en" });
  assert.strictEqual(n.window.__t.set.length, 0);
});

if (failed) { console.log(failed + " check(s) failed"); process.exit(1); }
console.log("All checks passed");
