/*
 * DocxLite — builds a real .docx (Word) file in the browser or in Node with no libraries.
 * A .docx is a ZIP of XML files; this writes the ZIP (stored, no compression) and the XML.
 *
 *   var bytes = DocxLite.build({
 *     title, subtitle, footer, landscape: true,
 *     blocks: [ {t:"h1",text}, {t:"h2",text}, {t:"p",text}, {t:"note",text}, {t:"bullets",items:[..]},
 *               {t:"numbered",items:[..]}, {t:"table", head:[..], rows:[[..]], widths:[..percent..]}, {t:"pagebreak"} ]
 *   });   // Uint8Array
 *
 * Text may contain "\n" (line break) and **bold** segments.
 */
(function (root) {
  "use strict";

  /* ---------- zip ---------- */

  var crcTable = null;
  function crc32(bytes) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) { c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; }
        crcTable[n] = c >>> 0;
      }
    }
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) { crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8); }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function utf8(s) { return new TextEncoder().encode(s); }

  function zip(files) { // files: [{name, data(Uint8Array)}]
    var parts = [], central = [], offset = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    var dosTime = 0, dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1; // fixed: file contents decide, not the clock
    files.forEach(function (f) {
      var name = utf8(f.name), crc = crc32(f.data), size = f.data.length;
      var local = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate), u32(crc), u32(size), u32(size), u16(name.length), u16(0));
      parts.push(new Uint8Array(local), name, f.data);
      central.push({ name: name, crc: crc, size: size, offset: offset });
      offset += local.length + name.length + size;
    });
    var cdStart = offset, cdSize = 0;
    central.forEach(function (c) {
      var rec = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate), u32(c.crc), u32(c.size), u32(c.size), u16(c.name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.offset));
      parts.push(new Uint8Array(rec), c.name);
      cdSize += rec.length + c.name.length;
    });
    parts.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(cdSize), u32(cdStart), u16(0))));
    var total = parts.reduce(function (a, p) { return a + p.length; }, 0), out = new Uint8Array(total), pos = 0;
    parts.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  /* ---------- xml ---------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function runs(text, base) {
    // "**bold**" segments and "\n" line breaks
    base = base || "";
    var out = "", lines = String(text == null ? "" : text).split("\n");
    lines.forEach(function (line, li) {
      if (li) { out += "<w:r><w:br/></w:r>"; }
      line.split("**").forEach(function (seg, i) {
        if (!seg) { return; }
        var rpr = base + (i % 2 ? "<w:b/>" : "");
        out += "<w:r>" + (rpr ? "<w:rPr>" + rpr + "</w:rPr>" : "") + '<w:t xml:space="preserve">' + esc(seg) + "</w:t></w:r>";
      });
    });
    return out;
  }

  function para(text, style, extra) {
    return "<w:p><w:pPr>" + (style ? '<w:pStyle w:val="' + style + '"/>' : "") + (extra || "") + "</w:pPr>" + runs(text) + "</w:p>";
  }

  function table(b, totalWidth) {
    var head = b.head || [], rows = b.rows || [], cols = head.length || (rows[0] ? rows[0].length : 1);
    var pct = b.widths && b.widths.length === cols ? b.widths : Array.apply(null, Array(cols)).map(function () { return 100 / cols; });
    var sum = pct.reduce(function (a, v) { return a + v; }, 0);
    var w = pct.map(function (p) { return Math.max(500, Math.round(totalWidth * p / sum)); });
    var x = '<w:tbl><w:tblPr><w:tblStyle w:val="LiteTable"/><w:tblW w:w="' + totalWidth + '" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>' + (b.caption ? '<w:tblCaption w:val="' + esc(b.caption) + '"/>' : "") + '</w:tblPr><w:tblGrid>';
    w.forEach(function (v) { x += '<w:gridCol w:w="' + v + '"/>'; });
    x += "</w:tblGrid>";
    var mono = b.mono || [];
    var MONO = '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="16"/><w:szCs w:val="16"/>';
    function cell(text, i, isHead) {
      return '<w:tc><w:tcPr><w:tcW w:w="' + w[i] + '" w:type="dxa"/>' + (isHead ? '<w:shd w:val="clear" w:color="auto" w:fill="1F3A5F"/>' : "") + "</w:tcPr>" +
        "<w:p><w:pPr><w:pStyle w:val=\"Cell\"/></w:pPr>" + runs(text, isHead ? '<w:b/><w:color w:val="FFFFFF"/>' : mono.indexOf(i) > -1 ? MONO : "") + "</w:p></w:tc>";
    }
    if (head.length) {
      x += '<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>' + head.map(function (h, i) { return cell(h, i, true); }).join("") + "</w:tr>";
    }
    rows.forEach(function (r) {
      var cells = [];
      for (var i = 0; i < cols; i++) { cells.push(cell(r[i] == null ? "" : r[i], i, false)); }
      x += "<w:tr><w:trPr><w:cantSplit/></w:trPr>" + cells.join("") + "</w:tr>";
    });
    return x + "</w:tbl>" + '<w:p><w:pPr><w:spacing w:after="80"/></w:pPr></w:p>';
  }

  var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

  function stylesXml() {
    function h(id, name, size, color, before, after) {
      return '<w:style w:type="paragraph" w:styleId="' + id + '"><w:name w:val="' + name + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="' + before + '" w:after="' + after + '"/><w:outlineLvl w:val="' + (parseInt(id.slice(-1), 10) - 1) + '"/></w:pPr><w:rPr><w:b/><w:color w:val="' + color + '"/><w:sz w:val="' + size + '"/></w:rPr></w:style>';
    }
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ' + NS + ">" +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="tr-TR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
      h("Heading1", "heading 1", 32, "1F3A5F", 360, 140) + h("Heading2", "heading 2", 26, "1F3A5F", 260, 100) + h("Heading3", "heading 3", 23, "2F5E8E", 200, 80) +
      '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="1200" w:after="160"/></w:pPr><w:rPr><w:b/><w:color w:val="1F3A5F"/><w:sz w:val="52"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:color w:val="555555"/><w:sz w:val="26"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Note"><w:name w:val="Note"/><w:basedOn w:val="Normal"/><w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="C58B00"/></w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="FFF6DD"/><w:ind w:left="140"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Cell"><w:name w:val="Cell"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="30" w:after="30" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="540" w:hanging="270"/><w:spacing w:after="40"/></w:pPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:color w:val="777777"/><w:sz w:val="17"/></w:rPr></w:style>' +
      '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>' +
      '<w:style w:type="table" w:styleId="LiteTable"><w:name w:val="Lite Table"/><w:basedOn w:val="TableNormal"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="B7C1CC"/><w:left w:val="single" w:sz="4" w:space="0" w:color="B7C1CC"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="B7C1CC"/><w:right w:val="single" w:sz="4" w:space="0" w:color="B7C1CC"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="B7C1CC"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="B7C1CC"/></w:tblBorders><w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>' +
      "</w:styles>";
  }

  function build(spec) {
    var landscape = spec.landscape !== false;
    var pw = landscape ? 16838 : 11906, ph = landscape ? 11906 : 16838, margin = 1000;
    var contentW = pw - margin * 2;
    var body = "";
    if (spec.title) {
      body += para(spec.title, "Title");
      if (spec.subtitle) { body += para(spec.subtitle, "Subtitle"); }
    }
    var brk = ""; // a page break is applied to the next paragraph, so it never leaves a blank page behind
    (spec.blocks || []).forEach(function (b) {
      if (!b) { return; }
      var pb = brk; if (b.t !== "pagebreak") { brk = ""; }
      if (b.t === "h1" || b.t === "h2" || b.t === "h3") { body += para(b.text, { h1: "Heading1", h2: "Heading2", h3: "Heading3" }[b.t], pb); }
      else if (b.t === "p") { body += para(b.text, "", pb + (b.keep ? "<w:keepNext/>" : "")); }
      else if (b.t === "note") { body += para(b.text, "Note", pb); }
      else if (b.t === "bullets") { (b.items || []).forEach(function (it) { body += "<w:p><w:pPr><w:pStyle w:val=\"ListParagraph\"/></w:pPr>" + runs("•  " + it) + "</w:p>"; }); }
      else if (b.t === "numbered") { (b.items || []).forEach(function (it, i) { body += "<w:p><w:pPr><w:pStyle w:val=\"ListParagraph\"/></w:pPr>" + runs((i + 1) + ".  " + it) + "</w:p>"; }); }
      else if (b.t === "table") { body += table(b, contentW); }
      else if (b.t === "pagebreak") { brk = "<w:pageBreakBefore/>"; }
    });
    if (!body) { body = para(""); }
    var sect = '<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="' + pw + '" w:h="' + ph + '"' + (landscape ? ' w:orient="landscape"' : "") + '/><w:pgMar w:top="' + margin + '" w:right="' + margin + '" w:bottom="' + margin + '" w:left="' + margin + '" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr>';
    var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + NS + "><w:body>" + body + sect + "</w:body></w:document>";
    var footerXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ' + NS + '><w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr>' + runs((spec.footer || "") + (spec.footer ? "  ·  " : "")) +
      '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
    var docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>';
    var core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + esc(spec.title || "") + "</dc:title><dc:creator>BAForge AI</dc:creator></cp:coreProperties>";
    return zip([
      { name: "[Content_Types].xml", data: utf8(ct) },
      { name: "_rels/.rels", data: utf8(rels) },
      { name: "word/document.xml", data: utf8(documentXml) },
      { name: "word/_rels/document.xml.rels", data: utf8(docRels) },
      { name: "word/styles.xml", data: utf8(stylesXml()) },
      { name: "word/footer1.xml", data: utf8(footerXml) },
      { name: "docProps/core.xml", data: utf8(core) }
    ]);
  }


  /* ---------- reading a .docx back ---------- */

  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

  function inflateRaw(bytes) {
    if (typeof DecompressionStream === "undefined") {
      return Promise.reject(new Error("This browser cannot open compressed Word files (DecompressionStream missing)."));
    }
    var ds = new DecompressionStream("deflate-raw");
    var w = ds.writable.getWriter();
    w.write(bytes); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }

  /* returns Promise<{ "word/document.xml": Uint8Array, ... }> for the requested names */
  function unzip(bytes, wanted) {
    var eocd = -1;
    for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 65600); i--) { if (u32(bytes, i) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) { return Promise.reject(new Error("Not a valid Word (.docx) file.")); }
    var count = u16(bytes, eocd + 10), pos = u32(bytes, eocd + 16), found = {};
    for (var n = 0; n < count; n++) {
      if (u32(bytes, pos) !== 0x02014b50) { break; }
      var method = u16(bytes, pos + 10), csize = u32(bytes, pos + 20), nlen = u16(bytes, pos + 28), elen = u16(bytes, pos + 30), clen = u16(bytes, pos + 32), lho = u32(bytes, pos + 42);
      var name = new TextDecoder().decode(bytes.subarray(pos + 46, pos + 46 + nlen));
      if (wanted.indexOf(name) > -1) { found[name] = { method: method, csize: csize, lho: lho }; }
      pos += 46 + nlen + elen + clen;
    }
    var out = {}, jobs = Object.keys(found).map(function (name) {
      var f = found[name], start = f.lho + 30 + u16(bytes, f.lho + 26) + u16(bytes, f.lho + 28);
      var data = bytes.subarray(start, start + f.csize);
      if (f.method === 0) { out[name] = data; return Promise.resolve(); }
      if (f.method === 8) { return inflateRaw(data).then(function (d) { out[name] = d; }); }
      return Promise.reject(new Error("Unsupported compression in the Word file."));
    });
    return Promise.all(jobs).then(function () { return out; });
  }

  /* tiny XML reader: enough for WordprocessingML (no DOM needed, works in Node too) */
  function unescapeXml(s) {
    return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, function (m, e) {
      if (e === "amp") { return "&"; } if (e === "lt") { return "<"; } if (e === "gt") { return ">"; } if (e === "quot") { return '"'; } if (e === "apos") { return "'"; }
      var code = e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return isFinite(code) ? String.fromCodePoint(code) : m;
    });
  }
  function parseXml(xml) {
    var root = { name: "#root", attrs: {}, children: [], text: "" }, stack = [root];
    var re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g, m;
    while ((m = re.exec(xml))) {
      var top = stack[stack.length - 1];
      if (m[1] !== undefined) { top.children.push({ name: "#text", text: m[1] }); }
      else if (m[3]) {
        if (m[2]) { if (stack.length > 1) { stack.pop(); } }
        else {
          var attrs = {}, ar = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, a;
          while ((a = ar.exec(m[4]))) { attrs[a[1]] = unescapeXml(a[2] !== undefined ? a[2] : a[3]); }
          var node = { name: m[3], attrs: attrs, children: [] };
          top.children.push(node);
          if (!m[5]) { stack.push(node); }
        }
      } else if (m[6] !== undefined) { top.children.push({ name: "#text", text: unescapeXml(m[6]) }); }
    }
    return root;
  }

  function runText(node) {
    var out = "";
    (function walk(n) {
      if (n.name === "w:del" || n.name === "w:instrText" || n.name === "w:tbl") { return; }
      if (n.name === "w:t") { n.children.forEach(function (c) { out += c.text || ""; }); return; }
      if (n.name === "w:tab") { out += "\t"; return; }
      if (n.name === "w:br" || n.name === "w:cr") { if (!(n.attrs && n.attrs["w:type"] === "page")) { out += "\n"; } return; }
      if (n.name === "w:noBreakHyphen") { out += "-"; return; }
      (n.children || []).forEach(walk);
    })(node);
    return out;
  }
  function paraStyle(p) {
    var ppr = p.children.filter(function (c) { return c.name === "w:pPr"; })[0];
    var st = ppr && ppr.children.filter(function (c) { return c.name === "w:pStyle"; })[0];
    return st ? st.attrs["w:val"] : "";
  }
  function cellString(tc) {
    return tc.children.filter(function (c) { return c.name === "w:p"; }).map(runText).join("\n");
  }

  /* bytes -> Promise<[ {t:"p", style, text} | {t:"table", caption, rows:[[string]]} ]> */
  function read(bytes) {
    return unzip(bytes, ["word/document.xml"]).then(function (files) {
      if (!files["word/document.xml"]) { throw new Error("This file has no Word document inside."); }
      var tree = parseXml(new TextDecoder().decode(files["word/document.xml"]));
      var body = null;
      (function find(n) { if (n.name === "w:body") { body = n; } else { (n.children || []).forEach(find); } })(tree);
      if (!body) { throw new Error("This file has no Word document inside."); }
      var blocks = [];
      (function walk(n) {
        n.children.forEach(function (c) {
          if (c.name === "w:p") { blocks.push({ t: "p", style: paraStyle(c), text: runText(c) }); }
          else if (c.name === "w:tbl") {
            var pr = c.children.filter(function (x) { return x.name === "w:tblPr"; })[0];
            var cap = pr && pr.children.filter(function (x) { return x.name === "w:tblCaption"; })[0];
            var rows = c.children.filter(function (x) { return x.name === "w:tr"; }).map(function (tr) {
              return tr.children.filter(function (x) { return x.name === "w:tc"; }).map(cellString);
            });
            blocks.push({ t: "table", caption: cap ? cap.attrs["w:val"] || "" : "", rows: rows });
          } else if (c.name !== "w:sectPr" && c.children && c.children.length) { walk(c); }
        });
      })(body);
      return blocks;
    });
  }

  var api = { build: build, read: read, _zip: zip, _crc32: crc32, _parseXml: parseXml };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; } else { root.DocxLite = api; }
})(typeof window !== "undefined" ? window : globalThis);
