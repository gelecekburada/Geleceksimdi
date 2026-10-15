/*
 * BAJsonXml — JSON <-> XML conversion that runs fully in the browser.
 *
 * Conventions (documented on the page too):
 *  - XML attributes <-> JSON keys starting with "@"   ("@id": "7")
 *  - Text next to attributes/children <-> key "#text"
 *  - Repeated sibling elements <-> JSON arrays
 *  - Empty element <-> null
 *  - XML values stay strings (no number/boolean guessing)
 * Works in the browser and in Node (module.exports) so it can be tested.
 */
(function (root) {
  "use strict";

  /* ------------------------------ helpers ------------------------------ */

  function lineCol(text, index) {
    var line = 1, col = 1;
    for (var i = 0; i < index && i < text.length; i++) {
      if (text.charAt(i) === "\n") { line++; col = 1; } else { col++; }
    }
    return { line: line, col: col };
  }

  function fail(text, index, message) {
    var p = lineCol(text, index);
    var e = new Error(message + " (line " + p.line + ", column " + p.col + ")");
    e.line = p.line;
    e.col = p.col;
    throw e;
  }

  function decodeEntities(str, text, at) {
    return str.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, function (m, g) {
      if (g.charAt(0) === "#") {
        var code = g.charAt(1) === "x" || g.charAt(1) === "X"
          ? parseInt(g.slice(2), 16)
          : parseInt(g.slice(1), 10);
        if (!isFinite(code) || code < 0 || code > 0x10ffff) {
          fail(text, at, "Invalid character reference " + m);
        }
        return String.fromCodePoint(code);
      }
      var map = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
      if (Object.prototype.hasOwnProperty.call(map, g)) { return map[g]; }
      fail(text, at, "Unknown entity " + m);
    });
  }

  function escapeText(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttr(s) {
    return escapeText(s).replace(/"/g, "&quot;");
  }

  var NAME_START = /[^\s<>\/=!?"'&0-9.\-]/;
  var NAME_CHAR = /[^\s<>\/=!?"'&]/;

  /* ------------------------------ XML parser ------------------------------ */

  function parseXml(text) {
    var i = 0, n = text.length;

    function startsWith(s) { return text.substr(i, s.length) === s; }

    function skipWs() { while (i < n && /\s/.test(text.charAt(i))) { i++; } }

    function skipUntil(end, what) {
      var j = text.indexOf(end, i);
      if (j === -1) { fail(text, i, "Unterminated " + what); }
      i = j + end.length;
    }

    function skipMisc() {
      for (;;) {
        skipWs();
        if (startsWith("<?")) { skipUntil("?>", "processing instruction"); }
        else if (startsWith("<!--")) { skipUntil("-->", "comment"); }
        else if (startsWith("<!DOCTYPE")) {
          var j = i, depth = 0;
          while (j < n) {
            var c = text.charAt(j);
            if (c === "[") { depth++; }
            else if (c === "]") { depth--; }
            else if (c === ">" && depth <= 0) { break; }
            j++;
          }
          if (j >= n) { fail(text, i, "Unterminated DOCTYPE"); }
          i = j + 1;
        } else { return; }
      }
    }

    function readName() {
      var start = i;
      if (i >= n || !NAME_START.test(text.charAt(i))) { fail(text, i, "Invalid or missing name"); }
      i++;
      while (i < n && NAME_CHAR.test(text.charAt(i))) { i++; }
      return text.slice(start, i);
    }

    function parseElement() {
      var open = i;
      i++; /* < */
      var name = readName();
      var attrs = [];
      var seen = {};
      for (;;) {
        skipWs();
        if (startsWith("/>")) {
          i += 2;
          return { name: name, attrs: attrs, items: [] };
        }
        if (text.charAt(i) === ">") { i++; break; }
        if (i >= n) { fail(text, open, "Element <" + name + "> is not closed"); }
        var an = readName();
        skipWs();
        if (text.charAt(i) !== "=") { fail(text, i, "Attribute " + an + " needs a value"); }
        i++;
        skipWs();
        var q = text.charAt(i);
        if (q !== '"' && q !== "'") { fail(text, i, "Attribute value must be quoted"); }
        var close = text.indexOf(q, i + 1);
        if (close === -1) { fail(text, i, "Unterminated attribute value"); }
        if (Object.prototype.hasOwnProperty.call(seen, an)) { fail(text, i, "Duplicate attribute " + an); }
        seen[an] = true;
        attrs.push([an, decodeEntities(text.slice(i + 1, close), text, i)]);
        i = close + 1;
      }
      var items = [];
      for (;;) {
        if (i >= n) { fail(text, open, "Element <" + name + "> is not closed"); }
        if (startsWith("</")) {
          var cstart = i;
          i += 2;
          var cn = readName();
          skipWs();
          if (text.charAt(i) !== ">") { fail(text, i, "Malformed closing tag"); }
          i++;
          if (cn !== name) {
            fail(text, cstart, "Mismatched closing tag </" + cn + ">, expected </" + name + ">");
          }
          return { name: name, attrs: attrs, items: items };
        }
        if (startsWith("<!--")) { skipUntil("-->", "comment"); continue; }
        if (startsWith("<![CDATA[")) {
          var s = i + 9;
          var e = text.indexOf("]]>", s);
          if (e === -1) { fail(text, i, "Unterminated CDATA section"); }
          items.push({ text: text.slice(s, e) });
          i = e + 3;
          continue;
        }
        if (startsWith("<?")) { skipUntil("?>", "processing instruction"); continue; }
        if (text.charAt(i) === "<") {
          items.push({ el: parseElement() });
          continue;
        }
        var t = i;
        while (i < n && text.charAt(i) !== "<") { i++; }
        items.push({ text: decodeEntities(text.slice(t, i), text, t) });
      }
    }

    skipMisc();
    if (i >= n) { fail(text, 0, "No XML element found"); }
    if (text.charAt(i) !== "<") { fail(text, i, "Expected an XML element"); }
    var rootEl = parseElement();
    skipMisc();
    if (i < n) { fail(text, i, "Unexpected content after the root element"); }
    return rootEl;
  }

  function nodeToJson(node) {
    var obj = {};
    var hasAttrs = node.attrs.length > 0;
    node.attrs.forEach(function (a) { obj["@" + a[0]] = a[1]; });

    var textParts = [];
    var childCount = 0;
    var groups = {};
    var order = [];
    node.items.forEach(function (it) {
      if (it.el) {
        childCount++;
        var k = it.el.name;
        if (!groups[k]) { groups[k] = []; order.push(k); }
        groups[k].push(nodeToJson(it.el));
      } else {
        textParts.push(it.text);
      }
    });
    var joined = textParts.join("");
    var trimmed = joined.trim();

    if (!hasAttrs && childCount === 0) {
      return trimmed === "" ? null : trimmed;
    }
    if (trimmed !== "") { obj["#text"] = trimmed; }
    order.forEach(function (k) {
      obj[k] = groups[k].length === 1 ? groups[k][0] : groups[k];
    });
    return obj;
  }

  function xmlToJson(text, opts) {
    opts = opts || {};
    var indent = opts.indent === undefined ? 2 : opts.indent;
    if (typeof text !== "string" || !text.trim()) { throw new Error("Input is empty"); }
    var tree = parseXml(text);
    var result = {};
    result[tree.name] = nodeToJson(tree);
    return { output: JSON.stringify(result, null, indent), warnings: [] };
  }

  /* ------------------------------ JSON -> XML ------------------------------ */

  function safeName(raw, warnings) {
    var name = String(raw);
    var fixed = name.replace(/[\s<>\/=!?"'&]/g, "_");
    if (!fixed) { fixed = "_"; }
    if (!NAME_START.test(fixed.charAt(0))) { fixed = "_" + fixed; }
    if (/^xml/i.test(fixed) && fixed !== name) { /* keep as is */ }
    if (fixed !== name) {
      warnings.push('"' + name + '" is not a valid XML name; written as "' + fixed + '"');
    }
    return fixed;
  }

  function scalar(v) { return v === null ? "" : String(v); }

  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }

  function elementXml(name, value, depth, pad, warnings) {
    var ind = pad ? new Array(depth + 1).join(pad) : "";
    var nl = pad ? "\n" : "";
    var tag = safeName(name, warnings);

    if (Array.isArray(value)) {
      return value.map(function (item) {
        return elementXml(name, item, depth, pad, warnings);
      }).join(nl);
    }
    if (value === null || value === undefined) {
      return ind + "<" + tag + "/>";
    }
    if (!isObj(value)) {
      return ind + "<" + tag + ">" + escapeText(scalar(value)) + "</" + tag + ">";
    }

    var attrs = "";
    var text = null;
    var kids = [];
    Object.keys(value).forEach(function (k) {
      var v = value[k];
      if (k.charAt(0) === "@" && k.length > 1) {
        if (isObj(v) || Array.isArray(v)) {
          warnings.push('Attribute "' + k + '" must be a simple value; skipped');
          return;
        }
        attrs += " " + safeName(k.slice(1), warnings) + '="' + escapeAttr(scalar(v)) + '"';
      } else if (k === "#text") {
        text = scalar(v);
      } else {
        kids.push(k);
      }
    });

    if (!kids.length) {
      if (text === null || text === "") { return ind + "<" + tag + attrs + "/>"; }
      return ind + "<" + tag + attrs + ">" + escapeText(text) + "</" + tag + ">";
    }
    var inner = kids.map(function (k) {
      return elementXml(k, value[k], depth + 1, pad, warnings);
    }).filter(function (x) { return x !== ""; });
    var head = ind + "<" + tag + attrs + ">";
    var body = (text !== null && text !== "" ? ind + (pad || "") + escapeText(text) + nl : "") + inner.join(nl);
    return head + nl + body + nl + ind + "</" + tag + ">";
  }

  function jsonToXml(text, opts) {
    opts = opts || {};
    var indent = opts.indent === undefined ? 2 : opts.indent;
    var pad = typeof indent === "number" ? new Array(indent + 1).join(" ") : indent;
    var rootName = opts.rootName || "root";
    var header = opts.declaration === false ? "" : '<?xml version="1.0" encoding="UTF-8"?>';
    var warnings = [];

    if (typeof text !== "string" || !text.trim()) { throw new Error("Input is empty"); }
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Invalid JSON: " + e.message);
    }

    var body;
    var keys = isObj(data) ? Object.keys(data) : [];
    if (isObj(data) && keys.length === 1 && keys[0] !== "#text" && keys[0].charAt(0) !== "@" && !Array.isArray(data[keys[0]])) {
      body = elementXml(keys[0], data[keys[0]], 0, pad, warnings);
    } else if (Array.isArray(data)) {
      body = elementXml(rootName, { item: data }, 0, pad, warnings);
    } else {
      body = elementXml(rootName, data, 0, pad, warnings);
    }
    return { output: (header ? header + (pad ? "\n" : "") : "") + body, warnings: warnings };
  }

  var api = { jsonToXml: jsonToXml, xmlToJson: xmlToJson, _parseXml: parseXml };

  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  if (root) { root.BAJsonXml = api; }
})(typeof window !== "undefined" ? window : null);
