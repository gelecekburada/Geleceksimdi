/*
 * BADiagram — text-to-diagram engine for the Design tools.
 * Parsers: flowchart, ER, UML class, BPMN. One layered layout + SVG renderer.
 * Pure functions (no DOM) so everything can be tested in Node.
 */
(function (root) {
  "use strict";

  var FONT = 13, CH = 7.3, LINE = 17;
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function wrap(text, max) {
    var words = String(text).split(/\s+/), lines = [], cur = "";
    words.forEach(function (w) {
      if (cur && (cur + " " + w).length > max) { lines.push(cur); cur = w; } else { cur = cur ? cur + " " + w : w; }
    });
    if (cur) { lines.push(cur); }
    return lines.length ? lines : [""];
  }
  function textW(lines) { return Math.max.apply(null, lines.map(function (l) { return l.length; })) * CH; }

  /* ---------------------------------------------------------------- layout */

  /*
   * nodes: [{id,w,h}]  edges: [{from,to}]  opts: {dir:"TD"|"LR", gapMain, gapCross, dummies:true}
   * returns {pos:{id:{x,y,w,h,layer}}, via:[[box,...] per input edge], width, height, dir}
   * Long edges get invisible dummy nodes in the layers they cross, so they are ordered
   * next to real nodes instead of through them (Sugiyama-style).
   */
  function layout(nodes, edges, opts) {
    opts = opts || {};
    var dir = opts.dir === "LR" ? "LR" : "TD";
    var gapMain = opts.gapMain || 60, gapCross = opts.gapCross || 36;
    var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });
    var es = [];
    edges.forEach(function (e, i) { if (byId[e.from] && byId[e.to] && e.from !== e.to) { es.push({ from: e.from, to: e.to, i: i }); } });

    /* break cycles: DFS, reverse back edges for layering only */
    var state = {}, dag = [];
    function visit(id) {
      state[id] = 1;
      es.forEach(function (e) {
        if (e.from !== id) { return; }
        if (state[e.to] === 1) { dag.push({ from: e.to, to: e.from, i: e.i, rev: true }); }
        else { dag.push({ from: e.from, to: e.to, i: e.i, rev: false }); if (!state[e.to]) { visit(e.to); } }
      });
      state[id] = 2;
    }
    nodes.forEach(function (n) { if (!state[n.id]) { visit(n.id); } });

    var inn = {};
    nodes.forEach(function (n) { inn[n.id] = []; });
    dag.forEach(function (e) { inn[e.to].push(e.from); });

    /* longest-path layering */
    var layer = {};
    function depth(id) {
      if (layer[id] !== undefined) { return layer[id]; }
      layer[id] = 0;
      var d = 0;
      inn[id].forEach(function (q) { d = Math.max(d, depth(q) + 1); });
      layer[id] = d; return d;
    }
    nodes.forEach(function (n) { depth(n.id); });
    if (opts.layerOf) { nodes.forEach(function (n) { var l = opts.layerOf(n); if (l !== undefined) { layer[n.id] = l; } }); }

    /* dummy nodes for edges that cross more than one layer */
    var all = nodes.slice(), ord = [], chains = {}, dn = 0;
    dag.forEach(function (e) {
      var span = layer[e.to] - layer[e.from];
      if (opts.dummies === false || span <= 1) { ord.push({ from: e.from, to: e.to }); return; }
      var prev = e.from, chain = [];
      for (var k = 1; k < span; k++) {
        var d = { id: "__d" + (dn++), w: 12, h: 12, dummy: true };
        all.push(d); byId[d.id] = d; layer[d.id] = layer[e.from] + k; chain.push(d.id);
        ord.push({ from: prev, to: d.id }); prev = d.id;
      }
      ord.push({ from: prev, to: e.to });
      chains[e.i] = { ids: chain, rev: e.rev };
    });
    var out2 = {}, inn2 = {};
    all.forEach(function (n) { out2[n.id] = []; inn2[n.id] = []; });
    ord.forEach(function (e) { out2[e.from].push(e.to); inn2[e.to].push(e.from); });

    var layers = [];
    all.forEach(function (n) { (layers[layer[n.id]] = layers[layer[n.id]] || []).push(n.id); });
    layers = layers.map(function (l) { return l || []; });

    /* barycentre ordering */
    var idx = {};
    function reindex() { layers.forEach(function (l) { l.forEach(function (id, i) { idx[id] = i; }); }); }
    reindex();
    function bary(id, nbrs) {
      if (!nbrs[id].length) { return idx[id]; }
      return nbrs[id].reduce(function (sum, x) { return sum + idx[x]; }, 0) / nbrs[id].length;
    }
    for (var pass = 0; pass < 4; pass++) {
      for (var i = 1; i < layers.length; i++) {
        layers[i].sort(function (a, b) { return bary(a, inn2) - bary(b, inn2); }); reindex();
      }
      for (var j = layers.length - 2; j >= 0; j--) {
        layers[j].sort(function (a, b) { return bary(a, out2) - bary(b, out2); }); reindex();
      }
    }

    /* coordinates: "main" axis = layers, "cross" axis = within layer */
    var main = dir === "TD" ? "h" : "w", cross = dir === "TD" ? "w" : "h";
    var layerSize = layers.map(function (l) { return Math.max.apply(null, [0].concat(l.map(function (id) { return byId[id][main]; }))); });
    var layerCross = layers.map(function (l) { return l.reduce(function (sum, id) { return sum + byId[id][cross] + gapCross; }, -gapCross); });
    var maxCross = Math.max.apply(null, [0].concat(layerCross));
    var all_ = {}, m = 0;
    layers.forEach(function (l, li) {
      var c = (maxCross - layerCross[li]) / 2;
      l.forEach(function (id) {
        var n = byId[id];
        var mainPos = m + (layerSize[li] - n[main]) / 2;
        all_[id] = dir === "TD" ? { x: c, y: mainPos, w: n.w, h: n.h, layer: li } : { x: mainPos, y: c, w: n.w, h: n.h, layer: li };
        c += n[cross] + gapCross;
      });
      m += layerSize[li] + gapMain;
    });
    var pos = {}, width = 0, height = 0;
    nodes.forEach(function (n) { pos[n.id] = all_[n.id]; width = Math.max(width, all_[n.id].x + n.w); height = Math.max(height, all_[n.id].y + n.h); });
    var via = edges.map(function (e, i) {
      var c = chains[i]; if (!c) { return []; }
      var ids = c.rev ? c.ids.slice().reverse() : c.ids;
      return ids.map(function (id) { return all_[id]; });
    });
    return { pos: pos, via: via, width: width, height: height, dir: dir };
  }

  /* ----------------------------------------------------------- svg helpers */

  var STYLE =
    "<style>text{font-family:Arial,Helvetica,sans-serif;font-size:" + FONT + "px;fill:#172033}" +
    ".n{fill:#fff;stroke:#2563eb;stroke-width:1.6}.d{fill:#fff7ed;stroke:#ea580c;stroke-width:1.6}" +
    ".t{fill:#eff6ff;stroke:#2563eb;stroke-width:1.6}.e{stroke:#475467;stroke-width:1.4;fill:none}" +
    ".lbl{font-size:12px;fill:#475467}.hd{font-weight:700}.mut{fill:#667085}.bg{fill:#fff}" +
    ".lane{fill:#f8fafc;stroke:#cbd5e1}.lane2{fill:#fff;stroke:#cbd5e1}</style>";

  function defs() {
    return "<defs>" +
      '<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#475467"/></marker>' +
      '<marker id="open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="none" stroke="#475467" stroke-width="1.4"/></marker>' +
      '<marker id="tri" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0 0L11 6L0 12z" fill="#fff" stroke="#475467" stroke-width="1.4"/></marker>' +
      '<marker id="dia" viewBox="0 0 16 10" refX="15" refY="5" markerWidth="16" markerHeight="10" orient="auto-start-reverse"><path d="M0 5L8 0L16 5L8 10z" fill="#475467"/></marker>' +
      '<marker id="diaO" viewBox="0 0 16 10" refX="15" refY="5" markerWidth="16" markerHeight="10" orient="auto-start-reverse"><path d="M0 5L8 0L16 5L8 10z" fill="#fff" stroke="#475467" stroke-width="1.4"/></marker>' +
      "</defs>";
  }

  function svgDoc(w, h, body, pad) {
    pad = pad === undefined ? 24 : pad;
    var W = Math.ceil(w + pad * 2), H = Math.ceil(h + pad * 2);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">' +
      STYLE + defs() + '<rect class="bg" width="' + W + '" height="' + H + '"/><g transform="translate(' + pad + "," + pad + ')">' + body + "</g></svg>";
  }

  function textBlock(lines, cx, cy, cls) {
    var y0 = cy - ((lines.length - 1) * LINE) / 2;
    return lines.map(function (l, i) {
      return '<text x="' + cx + '" y="' + (y0 + i * LINE + 4.5) + '" text-anchor="middle"' + (cls ? ' class="' + cls + '"' : "") + ">" + esc(l) + "</text>";
    }).join("");
  }

  function anchor(p, toward, shape) {
    var cx = p.x + p.w / 2, cy = p.y + p.h / 2, dx = toward.x - cx, dy = toward.y - cy;
    if (!dx && !dy) { return { x: cx, y: cy }; }
    if (shape === "circle" || shape === "event") {
      var r = p.w / 2, len = Math.sqrt(dx * dx + dy * dy);
      return { x: cx + dx / len * r, y: cy + dy / len * r };
    }
    if (shape === "diamond") {
      var k = 1 / (Math.abs(dx) / (p.w / 2) + Math.abs(dy) / (p.h / 2));
      return { x: cx + dx * k, y: cy + dy * k };
    }
    var sx = Math.abs(dx) / (p.w / 2), sy = Math.abs(dy) / (p.h / 2), s = Math.max(sx, sy);
    return { x: cx + dx / s, y: cy + dy / s };
  }

  /* orthogonal connector between two placed boxes, optionally through waypoint boxes */
  function route(a, b, dir, shapeA, shapeB, via) {
    var chain = [a].concat(via || [], [b]), pts = [], i;
    var adjacent = dir === "TD" ? b.y > a.y + a.h - 1 : b.x > a.x + a.w - 1;
    var backward = dir === "TD" ? b.y + b.h < a.y + 1 : b.x + b.w < a.x + 1;
    if (!(chain.length > 2) && !adjacent && !backward) {
      var cb = { x: b.x + b.w / 2, y: b.y + b.h / 2 }, ca = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
      return [anchor(a, cb, shapeA), anchor(b, ca, shapeB)];
    }
    function push(p) { var l = pts[pts.length - 1]; if (!l || Math.abs(l.x - p.x) > 0.1 || Math.abs(l.y - p.y) > 0.1) { pts.push(p); } }
    for (i = 0; i < chain.length - 1; i++) {
      var u = chain[i], v = chain[i + 1];
      var uc = { x: u.x + u.w / 2, y: u.y + u.h / 2 }, vc = { x: v.x + v.w / 2, y: v.y + v.h / 2 };
      if (dir === "TD") {
        var dn = vc.y >= uc.y, ey = dn ? u.y + u.h : u.y, ny = dn ? v.y : v.y + v.h, my = (ey + ny) / 2;
        push({ x: uc.x, y: ey }); push({ x: uc.x, y: my }); push({ x: vc.x, y: my }); push({ x: vc.x, y: ny });
      } else {
        var rt = vc.x >= uc.x, ex = rt ? u.x + u.w : u.x, nx = rt ? v.x : v.x + v.w, mx = (ex + nx) / 2;
        push({ x: ex, y: uc.y }); push({ x: mx, y: uc.y }); push({ x: mx, y: vc.y }); push({ x: nx, y: vc.y });
      }
    }
    return pts;
  }
  function pathD(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + Math.round(p.x * 10) / 10 + " " + Math.round(p.y * 10) / 10; }).join(""); }
  function midLabel(pts) {
    var best = 0, bi = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      var l = Math.abs(pts[i + 1].x - pts[i].x) + Math.abs(pts[i + 1].y - pts[i].y);
      if (l >= best) { best = l; bi = i; }
    }
    return { x: (pts[bi].x + pts[bi + 1].x) / 2, y: (pts[bi].y + pts[bi + 1].y) / 2 };
  }
  function labelSvg(text, p) {
    if (!text) { return ""; }
    var w = text.length * 6.4 + 8;
    return '<rect class="bg" x="' + (p.x - w / 2) + '" y="' + (p.y - 9) + '" width="' + w + '" height="16" rx="3" opacity="0.92"/>' +
      '<text class="lbl" x="' + p.x + '" y="' + (p.y + 3.5) + '" text-anchor="middle">' + esc(text) + "</text>";
  }
  function edgeSvg(pts, label, attrs) {
    return '<path class="e" d="' + pathD(pts) + '"' + (attrs || "") + "/>" + labelSvg(label, midLabel(pts));
  }

  function lines_(src) { return String(src).replace(/\r/g, "").split("\n"); }
  function stripComment(l) { return l.replace(/\s*%%.*$/, "").replace(/(^|\s)\/\/.*$/, ""); }

  /* ------------------------------------------------------------- flowchart */

  var NODE_RE = /^([A-Za-z0-9_]+)\s*(?:\[\[(.+?)\]\]|\[(.+?)\]|\(\((.+?)\)\)|\((.+?)\)|\{(.+?)\})?$/;

  function parseFlow(src) {
    var dir = "TD", nodes = {}, order = [], edges = [], errors = [];
    function node(tok, ln) {
      var m = NODE_RE.exec(tok.trim());
      if (!m) { errors.push("Line " + ln + ": cannot read node '" + tok.trim() + "'"); return null; }
      var id = m[1], n = nodes[id];
      if (!n) { n = nodes[id] = { id: id, text: id, shape: "rect" }; order.push(id); }
      if (m[2] !== undefined) { n.text = m[2]; n.shape = "sub"; }
      else if (m[3] !== undefined) { n.text = m[3]; n.shape = "rect"; }
      else if (m[4] !== undefined) { n.text = m[4]; n.shape = "circle"; }
      else if (m[5] !== undefined) { n.text = m[5]; n.shape = "round"; }
      else if (m[6] !== undefined) { n.text = m[6]; n.shape = "diamond"; }
      return id;
    }
    lines_(src).forEach(function (raw, i) {
      var ln = i + 1, line = stripComment(raw).trim();
      if (!line) { return; }
      var h = /^(?:flowchart|graph)\s+(TD|TB|LR|RL|BT)\b/i.exec(line);
      if (h) { dir = /LR|RL/i.test(h[1]) ? "LR" : "TD"; return; }
      /* split on arrows, keeping optional |label| or -- label --> forms */
      var parts = line.split(/\s*(?:--\s+([^->|][^>]*?)\s+-->|(?:-{2,}|={2,})>(?:\|([^|]*)\|)?|-\.->(?:\|([^|]*)\|)?)\s*/);
      /* parts: node, lbl1, lbl2, lbl3, node, ... */
      var ids = [], labels = [];
      for (var k = 0; k < parts.length; k += 4) {
        var id = node(parts[k] || "", ln);
        if (id === null) { return; }
        ids.push(id);
        if (k + 4 < parts.length + 3) { labels.push(parts[k + 1] || parts[k + 2] || parts[k + 3] || ""); }
      }
      for (var q = 0; q < ids.length - 1; q++) { edges.push({ from: ids[q], to: ids[q + 1], label: (labels[q] || "").trim() }); }
      if (ids.length === 1 && /-->|---/.test(line)) { errors.push("Line " + ln + ": arrow without a target"); }
    });
    return { dir: dir, nodes: order.map(function (id) { return nodes[id]; }), edges: edges, errors: errors };
  }

  function sizeFlow(n) {
    var lines = wrap(n.text, n.shape === "diamond" ? 16 : 24), w = textW(lines), h = lines.length * LINE;
    n.lines = lines;
    if (n.shape === "diamond") { n.w = Math.max(110, w * 1.55 + 24); n.h = Math.max(70, h * 1.9 + 20); }
    else if (n.shape === "circle") { n.w = n.h = Math.max(64, Math.max(w, h) + 28); }
    else { n.w = Math.max(100, w + 32); n.h = Math.max(44, h + 22); }
  }

  function renderFlow(model, opts) {
    model.nodes.forEach(sizeFlow);
    var L = layout(model.nodes, model.edges, { dir: (opts && opts.dir) || model.dir });
    var body = "", byId = {};
    model.nodes.forEach(function (n) { byId[n.id] = n; });
    model.edges.forEach(function (e, ei) {
      if (!L.pos[e.from] || !L.pos[e.to]) { return; }
      var pts = e.from === e.to ? [] : route(L.pos[e.from], L.pos[e.to], L.dir, byId[e.from].shape, byId[e.to].shape, L.via[ei]);
      if (pts.length) { body += edgeSvg(pts, e.label, ' marker-end="url(#arrow)"'); }
    });
    model.nodes.forEach(function (n) {
      var p = L.pos[n.id], cx = p.x + p.w / 2, cy = p.y + p.h / 2, s = "";
      if (n.shape === "diamond") { s = '<polygon class="d" points="' + cx + "," + p.y + " " + (p.x + p.w) + "," + cy + " " + cx + "," + (p.y + p.h) + " " + p.x + "," + cy + '"/>'; }
      else if (n.shape === "circle") { s = '<circle class="n" cx="' + cx + '" cy="' + cy + '" r="' + p.w / 2 + '"/>'; }
      else if (n.shape === "round") { s = '<rect class="n" x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="' + p.h / 2 + '"/>'; }
      else if (n.shape === "sub") { s = '<rect class="t" x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="4"/><line class="e" x1="' + (p.x + 8) + '" y1="' + p.y + '" x2="' + (p.x + 8) + '" y2="' + (p.y + p.h) + '"/><line class="e" x1="' + (p.x + p.w - 8) + '" y1="' + p.y + '" x2="' + (p.x + p.w - 8) + '" y2="' + (p.y + p.h) + '"/>'; }
      else { s = '<rect class="n" x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="6"/>'; }
      body += s + textBlock(n.lines, cx, cy);
    });
    return svgDoc(L.width, L.height, body);
  }

  /* -------------------------------------------------------------------- ER */

  var CARD = "(?:0\\.\\.1|1\\.\\.\\*|0\\.\\.\\*|1|N|\\*)";
  var REL_RE = new RegExp("^(\\S+)\\s+(" + CARD + ")\\s*--\\s*(" + CARD + ")\\s+(\\S+)(?:\\s*:\\s*(.*))?$");

  function parseER(src) {
    var ents = {}, order = [], rels = [], errors = [], cur = null;
    lines_(src).forEach(function (raw, i) {
      var ln = i + 1, line = stripComment(raw);
      if (!line.trim()) { return; }
      var indented = /^\s+/.test(line), t = line.trim();
      if (indented) {
        if (!cur) { errors.push("Line " + ln + ": attribute without an entity above it"); return; }
        var m = /^(\S+)(?:\s+(.*))?$/.exec(t);
        cur.attrs.push({ name: m[1], tags: (m[2] || "").trim().toUpperCase() });
        return;
      }
      var r = REL_RE.exec(t);
      if (r) {
        [r[1], r[4]].forEach(function (nm) { if (!ents[nm]) { ents[nm] = { name: nm, attrs: [] }; order.push(nm); } });
        rels.push({ a: r[1], ca: r[2], cb: r[3], b: r[4], label: (r[5] || "").trim() });
        cur = null; return;
      }
      if (/\s/.test(t)) { errors.push("Line " + ln + ": cannot read '" + t + "'. Use 'Customer 1--* Order : places'"); return; }
      cur = ents[t] || (ents[t] = { name: t, attrs: [] });
      if (order.indexOf(t) === -1) { order.push(t); }
    });
    return { entities: order.map(function (k) { return ents[k]; }), rels: rels, errors: errors };
  }

  var ROW = 22;
  function sizeER(e) {
    var w = e.name.length * 8.2 + 32;
    e.attrs.forEach(function (a) { w = Math.max(w, (a.name.length + (a.tags ? a.tags.length + 3 : 0)) * CH + 28); });
    e.w = Math.max(130, w); e.h = 30 + Math.max(1, e.attrs.length) * ROW + 6;
  }

  function renderER(model, opts) {
    model.entities.forEach(sizeER);
    var L = layout(model.entities.map(function (e) { return { id: e.name, w: e.w, h: e.h }; }),
      model.rels.map(function (r) { return { from: r.a, to: r.b }; }), { dir: (opts && opts.dir) || "LR", gapMain: 90, gapCross: 40 });
    var body = "";
    model.rels.forEach(function (r, ri) {
      var A = L.pos[r.a], B = L.pos[r.b];
      if (r.a === r.b) {
        body += '<path class="e" d="M' + (A.x + A.w) + " " + (A.y + 20) + "h30v-20h-" + (30 + A.w / 2) + 'v20"/>' + labelSvg(r.label, { x: A.x + A.w + 40, y: A.y + 10 });
        return;
      }
      var pts = route(A, B, L.dir, null, null, L.via[ri]);
      body += edgeSvg(pts, r.label);
      var s = pts[0], e = pts[pts.length - 1], s2 = pts[1], e2 = pts[pts.length - 2];
      body += cardLabel(r.ca, s, s2) + cardLabel(r.cb, e, e2);
    });
    model.entities.forEach(function (e) {
      var p = L.pos[e.name], y = p.y + 30;
      body += '<rect class="n" x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="6"/>' +
        '<path d="M' + p.x + " " + (p.y + 30) + "h" + p.w + '" class="e"/>' +
        '<text class="hd" x="' + (p.x + p.w / 2) + '" y="' + (p.y + 20) + '" text-anchor="middle">' + esc(e.name) + "</text>";
      (e.attrs.length ? e.attrs : [{ name: "", tags: "" }]).forEach(function (a, i) {
        var ty = y + i * ROW + 16, isKey = /\bPK\b/.test(a.tags);
        body += '<text x="' + (p.x + 12) + '" y="' + ty + '"' + (isKey ? ' class="hd"' : "") + ">" + esc(a.name) + "</text>";
        if (a.tags) { body += '<text class="lbl" x="' + (p.x + p.w - 10) + '" y="' + ty + '" text-anchor="end">' + esc(a.tags) + "</text>"; }
      });
    });
    return svgDoc(L.width, L.height, body);
  }
  function cardLabel(c, p, toward) {
    var dx = toward.x - p.x, dy = toward.y - p.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var x = p.x + dx / len * 16 + (Math.abs(dy) > Math.abs(dx) ? 10 : 0), y = p.y + dy / len * 16 + (Math.abs(dx) >= Math.abs(dy) ? -6 : 0);
    return '<text class="lbl hd" x="' + x + '" y="' + y + '" text-anchor="middle">' + esc(c === "N" ? "*" : c) + "</text>";
  }

  /* ------------------------------------------------------------------- UML */

  var UREL_RE = /^(\S+)\s+(?:"([^"]*)"\s+)?(<\|--|<\|\.\.|\*--|o--|-->|\.\.>|\.\.\|>|--)\s+(?:"([^"]*)"\s+)?(\S+)(?:\s*:\s*(.*))?$/;

  function parseUML(src) {
    var cls = {}, order = [], rels = [], errors = [], cur = null;
    function get(n) { if (!cls[n]) { cls[n] = { name: n, kind: "class", attrs: [], methods: [] }; order.push(n); } return cls[n]; }
    lines_(src).forEach(function (raw, i) {
      var ln = i + 1, line = stripComment(raw);
      if (!line.trim()) { return; }
      var t = line.trim();
      if (/^\s+/.test(line)) {
        if (!cur) { errors.push("Line " + ln + ": member without a class above it"); return; }
        (/\(/.test(t) ? cur.methods : cur.attrs).push(t); return;
      }
      var h = /^(class|interface|abstract|enum)\s+(\S+)$/i.exec(t);
      if (h) { cur = get(h[2]); cur.kind = h[1].toLowerCase(); return; }
      var r = UREL_RE.exec(t);
      if (r) { get(r[1]); get(r[5]); rels.push({ a: r[1], ma: r[2] || "", op: r[3], mb: r[4] || "", b: r[5], label: (r[6] || "").trim() }); cur = null; return; }
      errors.push("Line " + ln + ": cannot read '" + t + "'. Use 'class Name', indented members, or 'A <|-- B'");
    });
    return { classes: order.map(function (k) { return cls[k]; }), rels: rels, errors: errors };
  }

  function sizeUML(c) {
    var w = c.name.length * 8.2 + 32, hdr = c.kind === "class" ? 30 : 44;
    c.attrs.concat(c.methods).forEach(function (m) { w = Math.max(w, m.length * CH + 20); });
    c.hdr = hdr; c.w = Math.max(140, w);
    c.h = hdr + Math.max(1, c.attrs.length) * 20 + 8 + Math.max(1, c.methods.length) * 20 + 8;
  }

  var UMARK = {
    "<|--": { start: "tri", dash: false }, "<|..": { start: "tri", dash: true }, "*--": { start: "dia", dash: false }, "o--": { start: "diaO", dash: false },
    "-->": { end: "open", dash: false }, "..>": { end: "open", dash: true }, "..|>": { end: "tri", dash: true }, "--": { dash: false }
  };

  function renderUML(model, opts) {
    model.classes.forEach(sizeUML);
    var L = layout(model.classes.map(function (c) { return { id: c.name, w: c.w, h: c.h }; }),
      model.rels.map(function (r) { return { from: r.a, to: r.b }; }), { dir: (opts && opts.dir) || "TD", gapMain: 70, gapCross: 40 });
    var body = "";
    model.rels.forEach(function (r, ri) {
      var A = L.pos[r.a], B = L.pos[r.b], mk = UMARK[r.op];
      if (r.a === r.b) { return; }
      var pts = route(A, B, L.dir, null, null, L.via[ri]);
      body += '<path class="e" d="' + pathD(pts) + '"' + (mk.dash ? ' stroke-dasharray="6 4"' : "") +
        (mk.start ? ' marker-start="url(#' + mk.start + ')"' : "") + (mk.end ? ' marker-end="url(#' + mk.end + ')"' : "") + "/>" + labelSvg(r.label, midLabel(pts));
      if (r.ma) { body += cardLabel(r.ma, pts[0], pts[1]); }
      if (r.mb) { body += cardLabel(r.mb, pts[pts.length - 1], pts[pts.length - 2]); }
    });
    model.classes.forEach(function (c) {
      var p = L.pos[c.name], y = p.y + c.hdr;
      body += '<rect class="n" x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '"/>';
      if (c.kind !== "class") { body += '<text class="lbl" x="' + (p.x + p.w / 2) + '" y="' + (p.y + 15) + '" text-anchor="middle">«' + esc(c.kind) + "»</text>"; }
      body += '<text class="hd" x="' + (p.x + p.w / 2) + '" y="' + (p.y + c.hdr - 10) + '" text-anchor="middle"' + (c.kind === "abstract" ? ' font-style="italic"' : "") + ">" + esc(c.name) + "</text>" +
        '<path class="e" d="M' + p.x + " " + y + "h" + p.w + '"/>';
      var ay = y + 4;
      (c.attrs.length ? c.attrs : [""]).forEach(function (a, i) { body += '<text x="' + (p.x + 10) + '" y="' + (ay + i * 20 + 14) + '">' + esc(a) + "</text>"; });
      var my = ay + Math.max(1, c.attrs.length) * 20 + 4;
      body += '<path class="e" d="M' + p.x + " " + my + "h" + p.w + '"/>';
      (c.methods.length ? c.methods : [""]).forEach(function (m, i) { body += '<text x="' + (p.x + 10) + '" y="' + (my + 4 + i * 20 + 14) + '">' + esc(m) + "</text>"; });
    });
    return svgDoc(L.width, L.height, body);
  }

  /* ------------------------------------------------------------------ BPMN */

  var BP_NODE = /^(start|end|task|xor|and|event|subprocess)\s+([A-Za-z0-9_]+)\s*:\s*(.+)$/i;
  var BP_FLOW = /^([A-Za-z0-9_]+)\s*->\s*([A-Za-z0-9_]+)(?:\s*:\s*(.*))?$/;

  function parseBPMN(src) {
    var lanes = [], nodes = {}, order = [], flows = [], errors = [], lane = null;
    lines_(src).forEach(function (raw, i) {
      var ln = i + 1, t = stripComment(raw).trim();
      if (!t) { return; }
      var l = /^lane\s+(.+)$/i.exec(t);
      if (l) { lane = l[1].trim(); if (lanes.indexOf(lane) === -1) { lanes.push(lane); } return; }
      var n = BP_NODE.exec(t);
      if (n) {
        if (nodes[n[2]]) { errors.push("Line " + ln + ": duplicate id '" + n[2] + "'"); return; }
        if (!lane) { lane = "Process"; lanes.push(lane); }
        nodes[n[2]] = { id: n[2], type: n[1].toLowerCase(), text: n[3].trim(), lane: lane };
        order.push(n[2]); return;
      }
      var f = BP_FLOW.exec(t);
      if (f) { flows.push({ from: f[1], to: f[2], label: (f[3] || "").trim(), ln: ln }); return; }
      errors.push("Line " + ln + ": cannot read '" + t + "'. Use 'task t1: Text' or 't1 -> t2'");
    });
    flows = flows.filter(function (f) {
      var ok = nodes[f.from] && nodes[f.to];
      if (!ok) { errors.push("Line " + f.ln + ": flow uses an id that is not defined (" + (!nodes[f.from] ? f.from : f.to) + ")"); }
      return ok;
    });
    /* sanity checks a BA would want */
    var inc = {}, outg = {};
    flows.forEach(function (f) { outg[f.from] = (outg[f.from] || 0) + 1; inc[f.to] = (inc[f.to] || 0) + 1; });
    var warnings = [];
    order.forEach(function (id) {
      var n = nodes[id];
      if (n.type === "start" && inc[id]) { warnings.push("Start event '" + id + "' has an incoming flow"); }
      if (n.type === "end" && outg[id]) { warnings.push("End event '" + id + "' has an outgoing flow"); }
      if (n.type !== "start" && !inc[id]) { warnings.push("'" + id + "' has no incoming flow"); }
      if (n.type !== "end" && !outg[id]) { warnings.push("'" + id + "' has no outgoing flow"); }
      if ((n.type === "xor") && (outg[id] || 0) === 1) { warnings.push("Gateway '" + id + "' has only one outgoing path"); }
    });
    if (!order.some(function (id) { return nodes[id].type === "start"; }) && order.length) { warnings.push("No start event"); }
    if (!order.some(function (id) { return nodes[id].type === "end"; }) && order.length) { warnings.push("No end event"); }
    return { lanes: lanes, nodes: order.map(function (k) { return nodes[k]; }), flows: flows, errors: errors, warnings: warnings };
  }

  function sizeBP(n) {
    if (n.type === "start" || n.type === "end" || n.type === "event") { n.w = n.h = 40; n.lines = wrap(n.text, 14); return; }
    if (n.type === "xor" || n.type === "and") { n.w = n.h = 50; n.lines = wrap(n.text, 14); return; }
    n.lines = wrap(n.text, 20); n.w = Math.max(110, textW(n.lines) + 28); n.h = Math.max(54, n.lines.length * LINE + 24);
  }

  function renderBPMN(model) {
    model.nodes.forEach(sizeBP);
    var L = layout(model.nodes, model.flows, { dir: "LR", gapMain: 70, gapCross: 20, dummies: false });
    /* lane bands: rows sized by tallest stack in that lane */
    var laneRows = {}, laneNodes = {};
    model.lanes.forEach(function (ln) { laneNodes[ln] = []; });
    model.nodes.forEach(function (n) { laneNodes[n.lane].push(n); });
    /* x from layout, y re-stacked per lane+layer */
    var cell = {}, laneH = {};
    model.nodes.forEach(function (n) { var k = n.lane + "|" + L.pos[n.id].layer; (cell[k] = cell[k] || []).push(n); });
    model.lanes.forEach(function (ln) {
      var mx = 0;
      Object.keys(cell).forEach(function (k) {
        if (k.split("|")[0] !== ln) { return; }
        var h = cell[k].reduce(function (s, n) { return s + n.h + 16; }, -16);
        mx = Math.max(mx, h);
      });
      laneH[ln] = Math.max(100, mx + 40);
    });
    var y0 = 0, laneY = {};
    model.lanes.forEach(function (ln) { laneY[ln] = y0; y0 += laneH[ln]; });
    var P = {};
    Object.keys(cell).forEach(function (k) {
      var ln = k.split("|")[0], arr = cell[k];
      var total = arr.reduce(function (s, n) { return s + n.h + 16; }, -16), y = laneY[ln] + (laneH[ln] - total) / 2;
      arr.forEach(function (n) { var p = L.pos[n.id]; P[n.id] = { x: p.x + 36, y: y, w: n.w, h: n.h }; y += n.h + 16; });
    });
    var width = L.width + 36, height = y0, body = "";
    model.lanes.forEach(function (ln, i) {
      body += '<rect class="' + (i % 2 ? "lane2" : "lane") + '" x="0" y="' + laneY[ln] + '" width="' + width + '" height="' + laneH[ln] + '"/>' +
        '<rect class="lane" x="0" y="' + laneY[ln] + '" width="28" height="' + laneH[ln] + '"/>' +
        '<text class="hd" transform="translate(18,' + (laneY[ln] + laneH[ln] / 2) + ') rotate(-90)" text-anchor="middle">' + esc(ln) + "</text>";
    });
    var byId = {}; model.nodes.forEach(function (n) { byId[n.id] = n; });
    model.flows.forEach(function (f) {
      var sh = function (n) { return n.type === "xor" || n.type === "and" ? "diamond" : (n.type === "start" || n.type === "end" || n.type === "event") ? "circle" : "rect"; };
      var pts = route(P[f.from], P[f.to], "LR", sh(byId[f.from]), sh(byId[f.to]));
      body += edgeSvg(pts, f.label, ' marker-end="url(#arrow)"');
    });
    model.nodes.forEach(function (n) {
      var p = P[n.id], cx = p.x + p.w / 2, cy = p.y + p.h / 2, s = "";
      if (n.type === "start") { s = '<circle cx="' + cx + '" cy="' + cy + '" r="18" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>'; }
      else if (n.type === "end") { s = '<circle cx="' + cx + '" cy="' + cy + '" r="18" fill="#fee2e2" stroke="#b42318" stroke-width="4"/>'; }
      else if (n.type === "event") { s = '<circle cx="' + cx + '" cy="' + cy + '" r="18" class="n"/><circle cx="' + cx + '" cy="' + cy + '" r="14" class="n"/>'; }
      else if (n.type === "xor" || n.type === "and") {
        s = '<polygon class="d" points="' + cx + "," + p.y + " " + (p.x + p.w) + "," + cy + " " + cx + "," + (p.y + p.h) + " " + p.x + "," + cy + '"/>';
        s += n.type === "xor"
          ? '<path class="e" d="M' + (cx - 8) + " " + (cy - 8) + "L" + (cx + 8) + " " + (cy + 8) + "M" + (cx + 8) + " " + (cy - 8) + "L" + (cx - 8) + " " + (cy + 8) + '" stroke-width="2.4"/>'
          : '<path class="e" d="M' + cx + " " + (cy - 10) + "v20M" + (cx - 10) + " " + cy + 'h20" stroke-width="2.4"/>';
      } else if (n.type === "subprocess") {
        s = '<rect class="t" x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="8"/><rect class="e" x="' + (cx - 6) + '" y="' + (p.y + p.h - 15) + '" width="12" height="12"/><path class="e" d="M' + (cx - 3) + " " + (p.y + p.h - 9) + "h6M" + cx + " " + (p.y + p.h - 12) + 'v6"/>';
      } else { s = '<rect class="t" x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="8"/>'; }
      body += s;
      if (n.type === "task" || n.type === "subprocess") { body += textBlock(n.lines, cx, cy - (n.type === "subprocess" ? 4 : 0)); }
      else { body += textBlock(n.lines, cx, p.y + p.h + 14 + (n.lines.length - 1) * LINE / 2, "lbl"); }
    });
    return svgDoc(width, height, body);
  }

  /* -------------------------------------------------------------- facade */

  var KINDS = {
    flowchart: { parse: parseFlow, render: renderFlow },
    er: { parse: parseER, render: renderER },
    uml: { parse: parseUML, render: renderUML },
    bpmn: { parse: parseBPMN, render: renderBPMN }
  };

  function build(kind, src, opts) {
    var k = KINDS[kind];
    if (!k) { throw new Error("Unknown diagram kind " + kind); }
    var model = k.parse(src);
    var empty = !(model.nodes || model.entities || model.classes || []).length;
    if (model.errors.length || empty) {
      return { svg: "", errors: model.errors.concat(empty && !model.errors.length ? ["Nothing to draw yet"] : []), warnings: [], model: model };
    }
    return { svg: k.render(model, opts || {}), errors: [], warnings: model.warnings || [], model: model };
  }

  var api = { build: build, layout: layout, _route: route, parseFlow: parseFlow, parseER: parseER, parseUML: parseUML, parseBPMN: parseBPMN };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  if (root) { root.BADiagram = api; }
})(typeof window !== "undefined" ? window : null);
