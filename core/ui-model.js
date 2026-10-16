/*
 * BAUiModel — data model + SVG renderer for the UI (wireframe) Designer.
 * doc = { frame: {w,h}, items: [{id,type,x,y,w,h,text}] }
 */
(function (root) {
  "use strict";

  var GRID = 8;
  var FRAMES = { mobile: { w: 360, h: 640 }, tablet: { w: 768, h: 1024 }, desktop: { w: 1024, h: 640 } };

  var TYPES = {
    heading:  { w: 240, h: 36,  text: "Page title" },
    text:     { w: 240, h: 44,  text: "Some descriptive text goes here." },
    button:   { w: 120, h: 40,  text: "Button" },
    input:    { w: 240, h: 40,  text: "Label" },
    textarea: { w: 240, h: 88,  text: "Comments" },
    select:   { w: 240, h: 40,  text: "Choose…" },
    checkbox: { w: 200, h: 28,  text: "Checkbox" },
    radio:    { w: 200, h: 28,  text: "Option" },
    image:    { w: 160, h: 120, text: "Image" },
    card:     { w: 280, h: 160, text: "Card" },
    navbar:   { w: 360, h: 48,  text: "App name" },
    table:    { w: 320, h: 120, text: "Name | Status | Date" },
    divider:  { w: 240, h: 8,   text: "" }
  };

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function snap(v) { return Math.round(v / GRID) * GRID; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function create(frameKey) { var f = FRAMES[frameKey] || FRAMES.mobile; return { frame: { w: f.w, h: f.h }, items: [], seq: 0 }; }

  function add(doc, type, x, y) {
    var d = TYPES[type];
    if (!d) { throw new Error("Unknown component: " + type); }
    var it = { id: "c" + (++doc.seq), type: type, x: 0, y: 0, w: d.w, h: d.h, text: d.text };
    it.w = Math.min(it.w, doc.frame.w);
    it.x = clamp(snap(x === undefined ? 16 : x), 0, doc.frame.w - it.w);
    it.y = clamp(snap(y === undefined ? 16 : y), 0, doc.frame.h - it.h);
    doc.items.push(it);
    return it;
  }
  function find(doc, id) { return doc.items.filter(function (i) { return i.id === id; })[0] || null; }
  function move(doc, id, x, y) {
    var it = find(doc, id); if (!it) { return null; }
    it.x = clamp(snap(x), 0, Math.max(0, doc.frame.w - it.w));
    it.y = clamp(snap(y), 0, Math.max(0, doc.frame.h - it.h));
    return it;
  }
  function resize(doc, id, w, h) {
    var it = find(doc, id); if (!it) { return null; }
    it.w = clamp(snap(w), 16, doc.frame.w - it.x);
    it.h = clamp(snap(h), 8, doc.frame.h - it.y);
    return it;
  }
  function setText(doc, id, text) { var it = find(doc, id); if (it) { it.text = text; } return it; }
  function remove(doc, id) { var n = doc.items.length; doc.items = doc.items.filter(function (i) { return i.id !== id; }); return doc.items.length < n; }
  function duplicate(doc, id) {
    var it = find(doc, id); if (!it) { return null; }
    var c = add(doc, it.type, it.x + 16, it.y + 16);
    c.w = it.w; c.h = it.h; c.text = it.text;
    c.x = clamp(c.x, 0, doc.frame.w - c.w); c.y = clamp(c.y, 0, doc.frame.h - c.h);
    return c;
  }
  function toFront(doc, id) { var it = find(doc, id); if (!it) { return; } doc.items = doc.items.filter(function (i) { return i !== it; }).concat([it]); }
  function toBack(doc, id) { var it = find(doc, id); if (!it) { return; } doc.items = [it].concat(doc.items.filter(function (i) { return i !== it; })); }
  function setFrame(doc, key) {
    var f = FRAMES[key]; if (!f) { return; }
    doc.frame = { w: f.w, h: f.h };
    doc.items.forEach(function (it) {
      it.w = Math.min(it.w, f.w); it.h = Math.min(it.h, f.h);
      it.x = clamp(it.x, 0, f.w - it.w); it.y = clamp(it.y, 0, f.h - it.h);
    });
  }

  /* validate + normalise a document loaded from JSON */
  function load(json) {
    var d = typeof json === "string" ? JSON.parse(json) : json;
    if (!d || !d.frame || !Array.isArray(d.items)) { throw new Error("Not a UI Designer file"); }
    var doc = { frame: { w: clamp(+d.frame.w || 360, 120, 2000), h: clamp(+d.frame.h || 640, 120, 3000) }, items: [], seq: 0 };
    d.items.forEach(function (i) {
      if (!TYPES[i.type]) { return; }
      var it = add(doc, i.type, +i.x || 0, +i.y || 0);
      it.w = clamp(+i.w || it.w, 16, doc.frame.w); it.h = clamp(+i.h || it.h, 8, doc.frame.h);
      it.x = clamp(snap(+i.x || 0), 0, doc.frame.w - it.w); it.y = clamp(snap(+i.y || 0), 0, doc.frame.h - it.h);
      it.text = String(i.text == null ? "" : i.text).slice(0, 500);
    });
    return doc;
  }

  function fit(text, w, size) {
    var max = Math.max(1, Math.floor((w - 16) / (size * 0.56)));
    text = String(text);
    return text.length > max ? text.slice(0, Math.max(1, max - 1)) + "…" : text;
  }
  function wrapLines(text, w, size, maxLines) {
    var max = Math.max(4, Math.floor((w - 16) / (size * 0.56))), out = [], cur = "";
    String(text).split(/\s+/).forEach(function (wd) {
      if (cur && (cur + " " + wd).length > max) { out.push(cur); cur = wd; } else { cur = cur ? cur + " " + wd : wd; }
    });
    if (cur) { out.push(cur); }
    return out.slice(0, maxLines);
  }

  var C = { line: "#98a2b3", fill: "#fff", ink: "#172033", mute: "#667085", primary: "#2563eb", soft: "#eef2f7" };

  function drawItem(it) {
    var x = it.x, y = it.y, w = it.w, h = it.h, t = it.text, s = "";
    function tx(px, py, str, size, weight, fill, anchor) {
      return '<text x="' + px + '" y="' + py + '" font-size="' + (size || 14) + '"' + (weight ? ' font-weight="' + weight + '"' : "") +
        ' fill="' + (fill || C.ink) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ">" + esc(str) + "</text>";
    }
    switch (it.type) {
      case "heading": s = tx(x + 4, y + h / 2 + 7, fit(t, w, 22), 22, 700); break;
      case "text": s = wrapLines(t, w, 14, Math.max(1, Math.floor(h / 18))).map(function (l, i) { return tx(x + 4, y + 16 + i * 18, l, 14, 0, C.mute); }).join(""); break;
      case "button": s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="' + C.primary + '"/>' + tx(x + w / 2, y + h / 2 + 5, fit(t, w, 14), 14, 700, "#fff", "middle"); break;
      case "input": s = tx(x, y - 5 + 0, "", 1) + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + C.fill + '" stroke="' + C.line + '"/>' + tx(x + 10, y + h / 2 + 5, fit(t, w, 14), 14, 0, C.mute); break;
      case "textarea": s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + C.fill + '" stroke="' + C.line + '"/>' + tx(x + 10, y + 22, fit(t, w, 14), 14, 0, C.mute); break;
      case "select": s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + C.fill + '" stroke="' + C.line + '"/>' + tx(x + 10, y + h / 2 + 5, fit(t, w - 24, 14), 14, 0, C.mute) + '<path d="M' + (x + w - 22) + " " + (y + h / 2 - 3) + "l6 6 6-6" + '" fill="none" stroke="' + C.mute + '" stroke-width="2"/>'; break;
      case "checkbox": s = '<rect x="' + x + '" y="' + (y + h / 2 - 9) + '" width="18" height="18" rx="4" fill="' + C.fill + '" stroke="' + C.line + '"/>' + tx(x + 28, y + h / 2 + 5, fit(t, w - 28, 14), 14); break;
      case "radio": s = '<circle cx="' + (x + 9) + '" cy="' + (y + h / 2) + '" r="9" fill="' + C.fill + '" stroke="' + C.line + '"/><circle cx="' + (x + 9) + '" cy="' + (y + h / 2) + '" r="4" fill="' + C.primary + '"/>' + tx(x + 28, y + h / 2 + 5, fit(t, w - 28, 14), 14); break;
      case "image": s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + C.soft + '" stroke="' + C.line + '"/><path d="M' + x + " " + y + "L" + (x + w) + " " + (y + h) + "M" + (x + w) + " " + y + "L" + x + " " + (y + h) + '" stroke="' + C.line + '"/>' + tx(x + w / 2, y + h / 2 + 5, fit(t, w, 13), 13, 0, C.mute, "middle"); break;
      case "card": s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="' + C.fill + '" stroke="' + C.line + '"/>' + tx(x + 14, y + 26, fit(t, w - 20, 15), 15, 700); break;
      case "navbar": s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + C.primary + '"/>' + tx(x + 14, y + h / 2 + 5, fit(t, w - 60, 16), 16, 700, "#fff") + '<path d="M' + (x + w - 34) + " " + (y + h / 2 - 7) + "h20M" + (x + w - 34) + " " + (y + h / 2) + "h20M" + (x + w - 34) + " " + (y + h / 2 + 7) + 'h20" stroke="#fff" stroke-width="2"/>'; break;
      case "divider": s = '<path d="M' + x + " " + (y + h / 2) + "h" + w + '" stroke="' + C.line + '" stroke-width="2"/>'; break;
      case "table": {
        var cols = String(t).split("|").map(function (c) { return c.trim(); }).filter(Boolean); if (!cols.length) { cols = ["Column"]; }
        var cw = w / cols.length, rows = Math.max(2, Math.floor(h / 28));
        s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + C.fill + '" stroke="' + C.line + '"/><rect x="' + x + '" y="' + y + '" width="' + w + '" height="28" fill="' + C.soft + '" stroke="' + C.line + '"/>';
        cols.forEach(function (c, i) { s += tx(x + i * cw + 8, y + 19, fit(c, cw, 13), 13, 700); });
        for (var r = 1; r < rows; r++) { s += '<path d="M' + x + " " + (y + r * 28) + "h" + w + '" stroke="' + C.line + '" opacity="0.5"/>'; for (var k = 0; k < cols.length; k++) { s += '<rect x="' + (x + k * cw + 8) + '" y="' + (y + r * 28 + 10) + '" width="' + Math.max(12, cw - 28) + '" height="6" rx="3" fill="' + C.soft + '"/>'; } }
        break;
      }
    }
    /* input / textarea / select show their label above the box */
    if (it.type === "input" || it.type === "textarea" || it.type === "select") { /* label is the placeholder text inside */ }
    return s;
  }

  /* opts: {selectedId, editor} — editor adds data-id hit targets and handles */
  function toSvg(doc, opts) {
    opts = opts || {};
    var W = doc.frame.w, H = doc.frame.h;
    var body = '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff" stroke="#667085" stroke-width="1.5" rx="' + (doc.frame.w <= 420 ? 18 : 6) + '"/>';
    doc.items.forEach(function (it) {
      var g = drawItem(it);
      body += opts.editor
        ? '<g data-id="' + it.id + '" style="cursor:move">' + g + '<rect data-id="' + it.id + '" x="' + it.x + '" y="' + it.y + '" width="' + it.w + '" height="' + it.h + '" fill="transparent"/></g>'
        : "<g>" + g + "</g>";
    });
    if (opts.editor && opts.selectedId) {
      var s = find(doc, opts.selectedId);
      if (s) {
        body += '<rect x="' + (s.x - 2) + '" y="' + (s.y - 2) + '" width="' + (s.w + 4) + '" height="' + (s.h + 4) + '" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4 3" pointer-events="none"/>' +
          '<rect data-handle="1" x="' + (s.x + s.w - 12) + '" y="' + (s.y + s.h - 12) + '" width="12" height="12" fill="#2563eb" style="cursor:nwse-resize"/>';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" font-family="Arial, Helvetica, sans-serif">' + body + "</svg>";
  }

  var api = { TYPES: TYPES, FRAMES: FRAMES, GRID: GRID, create: create, add: add, find: find, move: move, resize: resize, setText: setText, remove: remove, duplicate: duplicate, toFront: toFront, toBack: toBack, setFrame: setFrame, load: load, toSvg: toSvg };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  if (root) { root.BAUiModel = api; }
})(typeof window !== "undefined" ? window : null);
