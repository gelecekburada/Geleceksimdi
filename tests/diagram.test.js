const assert = require("assert");
const D = require("../core/diagram.js");
let n = 0;
function t(name, fn) { try { fn(); n++; } catch (e) { console.error("FAIL " + name); throw e; } }

function wellFormed(svg) {
  assert.ok(svg.startsWith("<svg") && svg.endsWith("</svg>"));
  /* every opened tag type balances (cheap XML sanity: no stray '<' inside text) */
  const body = svg.replace(/<[^>]+>/g, "");
  assert.ok(!/[<>]/.test(body), "stray angle bracket in text");
}

const FLOW = `flowchart TD
A[Start] --> B{Valid?}
B -->|Yes| C(Process order)
B -->|No| D[Reject]
C --> E((End))
D --> E`;

t("flow parse: nodes, shapes, labels", () => {
  const m = D.parseFlow(FLOW);
  assert.deepStrictEqual(m.errors, []);
  assert.strictEqual(m.nodes.length, 5);
  const shape = id => m.nodes.find(x => x.id === id).shape;
  assert.deepStrictEqual(["A", "B", "C", "E"].map(shape), ["rect", "diamond", "round", "circle"]);
  assert.strictEqual(m.edges.find(e => e.from === "B" && e.to === "C").label, "Yes");
  assert.strictEqual(m.edges.length, 5);
});
t("flow chain on one line and LR direction", () => {
  const m = D.parseFlow("graph LR\nA --> B --> C");
  assert.strictEqual(m.dir, "LR");
  assert.strictEqual(m.edges.length, 2);
});
t("flow comments and text-on-arrow", () => {
  const m = D.parseFlow("A --> B %% note\nB -- go on --> C");
  assert.deepStrictEqual(m.errors, []);
  assert.strictEqual(m.edges[1].label, "go on");
});
t("flow renders svg with every node text", () => {
  const r = D.build("flowchart", FLOW);
  assert.deepStrictEqual(r.errors, []);
  wellFormed(r.svg);
  ["Start", "Valid?", "Process order", "Reject", "End"].forEach(s => assert.ok(r.svg.includes(s), s));
  assert.ok(r.svg.includes("<polygon"));
});
t("flow layout: layers go downward, no overlaps", () => {
  const nodes = ["a", "b", "c", "d"].map(id => ({ id, w: 100, h: 40 }));
  const L = D.layout(nodes, [{ from: "a", to: "b" }, { from: "a", to: "c" }, { from: "b", to: "d" }, { from: "c", to: "d" }], { dir: "TD" });
  assert.ok(L.pos.a.y < L.pos.b.y && L.pos.b.y < L.pos.d.y);
  const ids = Object.keys(L.pos);
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const p = L.pos[ids[i]], q = L.pos[ids[j]];
    const overlap = p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;
    assert.ok(!overlap, ids[i] + " overlaps " + ids[j]);
  }
});
t("layout survives cycles", () => {
  const L = D.layout([{ id: "a", w: 50, h: 30 }, { id: "b", w: 50, h: 30 }], [{ from: "a", to: "b" }, { from: "b", to: "a" }], {});
  assert.ok(isFinite(L.width) && L.width > 0);
});
t("flow bad line gives error, empty gives message", () => {
  assert.ok(D.build("flowchart", "A[oops --> B").errors.length > 0);
  assert.deepStrictEqual(D.build("flowchart", "").errors, ["Nothing to draw yet"]);
});

const ER = `Customer
  id PK
  name
  email UK
Order
  id PK
  customer_id FK
Customer 1--* Order : places`;

t("ER parse + render", () => {
  const m = D.parseER(ER);
  assert.deepStrictEqual(m.errors, []);
  assert.strictEqual(m.entities.length, 2);
  assert.strictEqual(m.entities[0].attrs[0].tags, "PK");
  assert.strictEqual(m.rels[0].ca, "1");
  assert.strictEqual(m.rels[0].cb, "*");
  const r = D.build("er", ER);
  wellFormed(r.svg);
  ["Customer", "customer_id", "places", "FK"].forEach(s => assert.ok(r.svg.includes(s), s));
});
t("ER errors", () => {
  assert.ok(D.parseER("  id PK").errors[0].includes("without an entity"));
  assert.ok(D.parseER("Two words here").errors[0].includes("cannot read"));
});
t("ER relation creates missing entities", () => {
  assert.strictEqual(D.parseER("A 1--N B").entities.length, 2);
});

const UML = `interface Shape
  +area(): number
class Circle
  -r: number
  +area(): number
class Canvas
  -items: Shape[]
Shape <|-- Circle
Canvas o-- Shape : holds
Canvas "1" --> "*" Circle`;

t("UML parse + render", () => {
  const m = D.parseUML(UML);
  assert.deepStrictEqual(m.errors, []);
  assert.strictEqual(m.classes.length, 3);
  assert.strictEqual(m.classes[0].kind, "interface");
  assert.strictEqual(m.classes[1].attrs.length, 1);
  assert.strictEqual(m.classes[1].methods.length, 1);
  assert.strictEqual(m.rels.length, 3);
  assert.strictEqual(m.rels[2].ma, "1");
  const r = D.build("uml", UML);
  wellFormed(r.svg);
  assert.ok(r.svg.includes("«interface»") && r.svg.includes("marker-start=\"url(#tri)\"") && r.svg.includes("url(#diaO)"));
});
t("UML errors", () => {
  assert.ok(D.parseUML("+x: int").errors.length || D.parseUML("  +x: int").errors.length);
  assert.ok(D.parseUML("nonsense here").errors[0].includes("cannot read"));
});

const BP = `lane Customer
  start s: Order placed
  task t1: Fill the form
lane Clerk
  task t2: Check data
  xor g1: Valid?
  task t3: Approve
  end e1: Done
  end e2: Rejected
s -> t1
t1 -> t2
t2 -> g1
g1 -> t3 : yes
g1 -> e2 : no
t3 -> e1`;

t("BPMN parse + render + lanes", () => {
  const m = D.parseBPMN(BP);
  assert.deepStrictEqual(m.errors, []);
  assert.deepStrictEqual(m.warnings, []);
  assert.deepStrictEqual(m.lanes, ["Customer", "Clerk"]);
  assert.strictEqual(m.nodes.length, 7);
  const r = D.build("bpmn", BP);
  wellFormed(r.svg);
  ["Customer", "Clerk", "Fill the form", "yes"].forEach(s => assert.ok(r.svg.includes(s), s));
});
t("BPMN lane order: Customer band above Clerk band", () => {
  const svg = D.build("bpmn", BP).svg;
  assert.ok(svg.indexOf("Customer") < svg.indexOf("Clerk"));
});
t("BPMN warnings and errors", () => {
  const m = D.parseBPMN("task a: A\ntask b: B\na -> b\nb -> zz\nxor g: G");
  assert.ok(m.errors.some(e => e.includes("not defined")));
  assert.ok(m.warnings.some(w => w.includes("No start")));
  assert.ok(m.warnings.some(w => w.includes("'g' has no incoming")));
  assert.ok(D.parseBPMN("task a: A\ntask a: B").errors[0].includes("duplicate"));
});
t("unknown kind throws", () => { assert.throws(() => D.build("nope", "x")); });

t("long edges are routed around intermediate nodes", () => {
  ["TD", "LR"].forEach(dir => {
    const nodes = ["a", "b", "c", "d", "e"].map(id => ({ id, w: 100, h: 40 }));
    const edges = [["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"], ["a", "e"], ["a", "d"]].map(([from, to]) => ({ from, to }));
    const L = D.layout(nodes, edges, { dir });
    [4, 5].forEach(ei => {
      const e = edges[ei];
      const pts = D._route(L.pos[e.from], L.pos[e.to], dir, "rect", "rect", L.via[ei]);
      for (let i = 0; i < pts.length - 1; i++) {
        ["b", "c", "d"].filter(id => id !== e.from && id !== e.to).forEach(id => {
          const r = L.pos[id], p = pts[i], q = pts[i + 1];
          const x1 = Math.min(p.x, q.x), x2 = Math.max(p.x, q.x), y1 = Math.min(p.y, q.y), y2 = Math.max(p.y, q.y);
          const hit = x1 < r.x + r.w && x2 > r.x && y1 < r.y + r.h && y2 > r.y;
          assert.ok(!hit, dir + " edge " + e.from + "->" + e.to + " crosses node " + id);
        });
      }
    });
  });
});

console.log("diagram: " + n + " checks ALL PASSED");
