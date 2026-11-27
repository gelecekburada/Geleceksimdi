/*
 * DocxJrxml — turns a Word (.docx) file into a JasperReports report template (.jrxml, JasperReports 6.x format).
 * Runs in the browser and in Node with no libraries (uses DocxLite's zip and XML reader). Nothing leaves the machine.
 *
 *   DocxJrxml.convert(bytes, {
 *     name: "Invoice",            // report name (from the file name)
 *     placeholders: true,         // MERGEFIELD, ${x}, {{x}}, «x», $F{x}, $P{x}  ->  report fields / parameters
 *     placeholderKind: "field",   // "field" ($F) or "parameter" ($P) for placeholders that do not say which
 *     images: true,               // embed pictures (PNG, JPEG, GIF, BMP)
 *     headerFooter: true,         // Word header/footer -> page header/footer
 *     font: "",                   // "" = keep Word fonts, otherwise one font for everything (e.g. "DejaVu Sans")
 *     lang: "tr" | "en"           // language of the warnings
 *   }) -> Promise<{ jrxml, model, stats, warnings }>
 *
 * Everything is measured in points (1/72 inch), the unit JasperReports uses. Word stores twips (1/20 pt) and EMU (1/12700 pt).
 */
(function (root) {
  "use strict";

  var DL = root.DocxLite || (typeof require === "function" ? require("./docx-lite.js") : null);

  /* ---------- messages ---------- */

  var MSG = {
    en: {
      notDocx: "This is not a Word .docx file.",
      oldDoc: "This is an old Word .doc file. Open it in Word and use File > Save As > Word Document (.docx), then try again.",
      noBody: "This file has no Word document inside.",
      imgFormat: function (n, f) { return n + " picture(s) in " + f + " format were skipped (JasperReports cannot show this format). Save them as PNG in Word to keep them."; },
      imgLinked: function (n) { return n + " linked picture(s) (not stored inside the file) were skipped."; },
      imgOff: function (n) { return n + " picture(s) were left out because \"Include pictures\" is off."; },
      imgCell: function (n) { return n + " picture(s) inside table cells were skipped."; },
      shapes: function (n) { return n + " chart, shape or SmartArt object(s) were skipped."; },
      textbox: function (n) { return n + " text box(es) were added as normal paragraphs below their anchor."; },
      nested: function (n) { return n + " nested table(s) were flattened into plain text inside their cell."; },
      sections: "The document has several sections; the page size and margins of the last section were used.",
      columns: "The document uses text columns; the report uses a single column.",
      notes: "Footnotes, endnotes and comments are not included.",
      firstPage: "Word has a different first-page or even-page header/footer; the default one was used on every page.",
      tall: function (n) { return n + " block(s) were taller than one page and were shortened to fit (long text still grows onto the next page)."; },
      fieldNames: function (list) { return "Placeholder names were adjusted to be valid: " + list + "."; }
    },
    tr: {
      notDocx: "Bu bir Word .docx dosyası değil.",
      oldDoc: "Bu eski bir Word .doc dosyası. Word'de açıp Dosya > Farklı Kaydet > Word Belgesi (.docx) olarak kaydedin ve tekrar deneyin.",
      noBody: "Bu dosyanın içinde Word belgesi yok.",
      imgFormat: function (n, f) { return n + " görsel " + f + " biçiminde olduğu için atlandı (JasperReports bu biçimi gösteremez). Korumak için Word'de PNG olarak kaydedin."; },
      imgLinked: function (n) { return n + " bağlantılı görsel (dosyanın içinde saklanmayan) atlandı."; },
      imgOff: function (n) { return "\"Görselleri ekle\" kapalı olduğu için " + n + " görsel eklenmedi."; },
      imgCell: function (n) { return "Tablo hücrelerindeki " + n + " görsel atlandı."; },
      shapes: function (n) { return n + " grafik, şekil veya SmartArt nesnesi atlandı."; },
      textbox: function (n) { return n + " metin kutusu, bağlı olduğu yerin altına normal paragraf olarak eklendi."; },
      nested: function (n) { return n + " iç içe tablo, hücresinin içinde düz metne çevrildi."; },
      sections: "Belgede birden fazla bölüm var; son bölümün sayfa boyutu ve kenar boşlukları kullanıldı.",
      columns: "Belgede metin sütunları var; rapor tek sütun olarak oluşturuldu.",
      notes: "Dipnotlar, son notlar ve yorumlar dahil edilmedi.",
      firstPage: "Word'de ilk sayfa veya çift sayfalar için farklı üst/alt bilgi var; her sayfada varsayılan olan kullanıldı.",
      tall: function (n) { return n + " blok bir sayfadan uzun olduğu için sığacak şekilde kısaltıldı (uzun metin yine de sonraki sayfaya taşar)."; },
      fieldNames: function (list) { return "Yer tutucu adları geçerli olacak şekilde düzeltildi: " + list + "."; }
    }
  };

  /* ---------- small tree helpers (DocxLite._parseXml nodes: {name, attrs, children} / {name:"#text", text}) ---------- */

  function kid(n, name) {
    var c = n && n.children;
    if (!c) { return null; }
    for (var i = 0; i < c.length; i++) { if (c[i].name === name) { return c[i]; } }
    return null;
  }
  function kids(n, name) { return ((n && n.children) || []).filter(function (c) { return c.name === name; }); }
  function val(n, a) { return n && n.attrs ? n.attrs[a || "w:val"] : undefined; }
  function on(n) {
    if (!n) { return undefined; }
    var v = n.attrs && n.attrs["w:val"];
    return !(v === "0" || v === "false" || v === "off" || v === "none");
  }
  function num(v) { var x = parseFloat(v); return isFinite(x) ? x : undefined; }
  function find(n, name) {
    if (!n) { return null; }
    if (n.name === name) { return n; }
    var c = n.children || [];
    for (var i = 0; i < c.length; i++) { var f = find(c[i], name); if (f) { return f; } }
    return null;
  }
  function findAll(n, name, out) {
    out = out || [];
    if (!n) { return out; }
    if (n.name === name) { out.push(n); return out; }
    (n.children || []).forEach(function (c) { findAll(c, name, out); });
    return out;
  }
  function textOf(n) {
    var s = "";
    (n.children || []).forEach(function (c) { s += c.name === "#text" ? c.text || "" : textOf(c); });
    return s;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function parse(bytes) { return DL._parseXml(new TextDecoder().decode(bytes)); }

  /* ---------- Word properties ---------- */

  function readRpr(r) {
    var o = {};
    if (!r) { return o; }
    var e;
    if ((e = kid(r, "w:b"))) { o.b = on(e); }
    if ((e = kid(r, "w:i"))) { o.i = on(e); }
    if ((e = kid(r, "w:u"))) { o.u = val(e) !== "none"; }
    if ((e = kid(r, "w:strike"))) { o.s = on(e); }
    if ((e = kid(r, "w:dstrike")) && on(e)) { o.s = true; }
    if ((e = kid(r, "w:sz")) && num(val(e))) { o.sz = num(val(e)) / 2; }
    if ((e = kid(r, "w:color")) && /^[0-9A-Fa-f]{6}$/.test(val(e) || "")) { o.color = "#" + val(e).toUpperCase(); }
    if ((e = kid(r, "w:color")) && val(e) === "auto") { o.color = null; }
    if ((e = kid(r, "w:rFonts"))) {
      var f = e.attrs["w:ascii"] || e.attrs["w:hAnsi"];
      if (f) { o.font = f; } else if (e.attrs["w:asciiTheme"] || e.attrs["w:hAnsiTheme"]) { o.fontTheme = e.attrs["w:asciiTheme"] || e.attrs["w:hAnsiTheme"]; }
    }
    if ((e = kid(r, "w:caps"))) { o.caps = on(e); }
    if ((e = kid(r, "w:vanish"))) { o.hidden = on(e); }
    return o;
  }
  function mergeR(dst, src) {
    Object.keys(src || {}).forEach(function (k) {
      if (k === "font") { delete dst.fontTheme; }
      if (k === "fontTheme") { delete dst.font; }
      dst[k] = src[k];
    });
    return dst;
  }

  function readPpr(p) {
    var o = {};
    if (!p) { return o; }
    var e;
    if ((e = kid(p, "w:jc"))) { o.jc = val(e); }
    if ((e = kid(p, "w:spacing"))) {
      if (num(e.attrs["w:before"]) !== undefined) { o.before = num(e.attrs["w:before"]) / 20; }
      if (num(e.attrs["w:after"]) !== undefined) { o.after = num(e.attrs["w:after"]) / 20; }
      if (num(e.attrs["w:line"]) !== undefined && (!e.attrs["w:lineRule"] || e.attrs["w:lineRule"] === "auto")) { o.line = num(e.attrs["w:line"]) / 240; }
    }
    if ((e = kid(p, "w:ind"))) {
      var l = num(e.attrs["w:left"] !== undefined ? e.attrs["w:left"] : e.attrs["w:start"]);
      var r = num(e.attrs["w:right"] !== undefined ? e.attrs["w:right"] : e.attrs["w:end"]);
      if (l !== undefined) { o.left = l / 20; }
      if (r !== undefined) { o.right = r / 20; }
      if (num(e.attrs["w:firstLine"]) !== undefined) { o.firstLine = num(e.attrs["w:firstLine"]) / 20; o.hanging = 0; }
      if (num(e.attrs["w:hanging"]) !== undefined) { o.hanging = num(e.attrs["w:hanging"]) / 20; o.firstLine = 0; }
    }
    if ((e = kid(p, "w:numPr"))) {
      if (val(kid(e, "w:numId")) !== undefined) { o.numId = val(kid(e, "w:numId")); }
      if (val(kid(e, "w:ilvl")) !== undefined) { o.ilvl = parseInt(val(kid(e, "w:ilvl")), 10) || 0; }
    }
    if ((e = kid(p, "w:pageBreakBefore"))) { o.pbb = on(e); }
    if ((e = kid(p, "w:outlineLvl"))) { o.outline = parseInt(val(e), 10); }
    return o;
  }

  function readBorders(b) {
    if (!b) { return null; }
    var seen = false, any = false;
    ["top", "left", "bottom", "right", "insideH", "insideV", "start", "end"].forEach(function (k) {
      var e = kid(b, "w:" + k);
      if (e) { seen = true; var v = val(e); if (v && v !== "none" && v !== "nil") { any = true; } }
    });
    return seen ? any : null;
  }

  function parseStyles(tree) {
    var st = { byId: {}, defR: {}, defP: {}, defaultPara: null, defaultTable: null };
    var styles = find(tree, "w:styles");
    if (!styles) { return st; }
    var dd = kid(styles, "w:docDefaults");
    if (dd) {
      st.defR = readRpr(kid(kid(dd, "w:rPrDefault"), "w:rPr"));
      st.defP = readPpr(kid(kid(dd, "w:pPrDefault"), "w:pPr"));
    }
    kids(styles, "w:style").forEach(function (s) {
      var id = s.attrs["w:styleId"];
      if (!id) { return; }
      var tblPr = kid(s, "w:tblPr");
      st.byId[id] = {
        type: s.attrs["w:type"], name: val(kid(s, "w:name")) || id, basedOn: val(kid(s, "w:basedOn")),
        p: readPpr(kid(s, "w:pPr")), r: readRpr(kid(s, "w:rPr")), borders: tblPr ? readBorders(kid(tblPr, "w:tblBorders")) : null
      };
      if (s.attrs["w:default"] === "1" || s.attrs["w:default"] === "true") {
        if (s.attrs["w:type"] === "paragraph") { st.defaultPara = id; }
        if (s.attrs["w:type"] === "table") { st.defaultTable = id; }
      }
    });
    return st;
  }
  function chain(st, id) {
    var out = [], seen = {};
    while (id && st.byId[id] && !seen[id]) { seen[id] = 1; out.unshift(st.byId[id]); id = st.byId[id].basedOn; }
    return out;
  }

  function parseNumbering(tree) {
    var res = { abs: {}, nums: {} }, nb = find(tree, "w:numbering");
    if (!nb) { return res; }
    kids(nb, "w:abstractNum").forEach(function (a) {
      var lv = {};
      kids(a, "w:lvl").forEach(function (l) {
        lv[l.attrs["w:ilvl"]] = {
          fmt: val(kid(l, "w:numFmt")) || "decimal", text: val(kid(l, "w:lvlText")) || "",
          start: num(val(kid(l, "w:start"))) !== undefined ? num(val(kid(l, "w:start"))) : 1, p: readPpr(kid(l, "w:pPr"))
        };
      });
      res.abs[a.attrs["w:abstractNumId"]] = lv;
    });
    kids(nb, "w:num").forEach(function (n) { res.nums[n.attrs["w:numId"]] = val(kid(n, "w:abstractNumId")); });
    return res;
  }

  function parseTheme(tree) {
    var t = { minor: null, major: null }, mi = find(tree, "a:minorFont"), ma = find(tree, "a:majorFont");
    var a = mi && kid(mi, "a:latin"), b = ma && kid(ma, "a:latin");
    if (a && a.attrs.typeface) { t.minor = a.attrs.typeface; }
    if (b && b.attrs.typeface) { t.major = b.attrs.typeface; }
    return t;
  }

  function parseRels(tree) {
    var out = {};
    findAll(tree, "Relationship").forEach(function (r) {
      out[r.attrs.Id] = { target: r.attrs.Target || "", type: r.attrs.Type || "", external: r.attrs.TargetMode === "External" };
    });
    return out;
  }
  function relPath(base, target) { // base "word/document.xml", target "media/image1.png" -> "word/media/image1.png"
    if (target.charAt(0) === "/") { return target.slice(1); }
    var parts = base.split("/"); parts.pop();
    target.split("/").forEach(function (p) { if (p === "..") { parts.pop(); } else if (p && p !== ".") { parts.push(p); } });
    return parts.join("/");
  }

  /* ---------- numbering text ---------- */

  function roman(n) {
    var m = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]], s = "";
    m.forEach(function (p) { while (n >= p[0]) { s += p[1]; n -= p[0]; } });
    return s;
  }
  function letter(n) { var s = ""; while (n > 0) { n--; s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26); } return s; }
  function fmtNum(n, fmt) {
    if (fmt === "lowerLetter") { return letter(n); }
    if (fmt === "upperLetter") { return letter(n).toUpperCase(); }
    if (fmt === "lowerRoman") { return roman(n); }
    if (fmt === "upperRoman") { return roman(n).toUpperCase(); }
    if (fmt === "decimalZero") { return (n < 10 ? "0" : "") + n; }
    return String(n);
  }
  function bulletChar(t) {
    var c = (t || "").charAt(0), code = c ? c.charCodeAt(0) : 0;
    if (!c) { return "•"; }
    if (c === "o") { return "◦"; }
    if (code === 0xF0A7 || code === 0xF06E) { return "▪"; }
    if (code === 0xF0D8) { return "➢"; }
    if (code === 0xF0FC) { return "✓"; }
    if (code >= 0xF000 && code <= 0xF0FF) { return "•"; }
    return c;
  }

  /* ---------- Java / XML text ---------- */

  function xmlEsc(s) {
    return String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function cdata(s) { return "<![CDATA[" + String(s).replace(/\]\]>/g, "]]]]><![CDATA[>") + "]]>"; }
  function javaChunk(s) {
    return '"' + s.replace(/[\\"\u0000-\u001f]/g, function (c) {
      if (c === "\\") { return "\\\\"; }
      if (c === '"') { return '\\"'; }
      if (c === "\n") { return "\\n"; }
      if (c === "\r") { return "\\r"; }
      if (c === "\t") { return "\\t"; }
      return "\\u" + ("000" + c.charCodeAt(0).toString(16)).slice(-4);
    })
      // JasperReports reads $F{ $P{ $V{ $R{ $X{ anywhere in an expression, even inside a Java string, so hide the "$"
      .replace(/\$(?=[PFVRX]\{)/g, "\\u0024") + '"';
  }
  function javaStr(s) {
    var out = [];
    for (var i = 0; i < s.length; i += 4000) {
      var end = i + 4000;
      if (end < s.length && /[\ud800-\udbff]/.test(s.charAt(end - 1))) { end--; }
      out.push(javaChunk(s.slice(i, end)));
      i = end - 4000;
    }
    return out.length ? out.join(" + ") : '""';
  }
  function cleanName(raw) {
    var n = String(raw || "").trim().replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_]/gu, "");
    if (/^\p{N}/u.test(n)) { n = "_" + n; }
    return n;
  }

  /* ---------- reading the Word content into blocks ---------- */

  var PH_RE = /\$F\{([^}\n]+)\}|\$P\{([^}\n]+)\}|\$V\{([A-Za-z_][\w]*)\}|\$\{([^}\n]+)\}|\{\{\s*([^}\n]+?)\s*\}\}|«([^»\n]+)»/g;

  function Reader(ctx) {
    var st = ctx.st, opts = ctx.opts;

    function finalR(R) {
      var o = {
        font: opts.font || R.font || (R.fontTheme && /major/i.test(R.fontTheme) ? ctx.theme.major : ctx.theme.minor) || ctx.theme.minor || "Arial",
        sz: R.sz || 10, b: !!R.b, i: !!R.i, u: !!R.u, s: !!R.s, color: R.color || null
      };
      o.key = [o.font, o.sz, o.b, o.i, o.u, o.s, o.color].join("|");
      return o;
    }

    function fieldToken(instr) {
      var m = /^\s*([A-Za-z]+)\b\s*([\s\S]*)$/.exec(instr || "");
      if (!m) { return null; }
      var kw = m[1].toUpperCase(), rest = m[2].trim();
      if (kw === "MERGEFIELD" && opts.placeholders) {
        var nm = /^"([^"]+)"|^(\S+)/.exec(rest);
        var raw = nm ? (nm[1] || nm[2]).trim() : "", clean = cleanName(raw);
        if (!clean) { return null; }
        if (clean !== raw) { ctx.renamed[raw] = clean; }
        return { kind: "ph", name: clean };
      }
      if (kw === "PAGE") { return { kind: "page" }; }
      if (kw === "NUMPAGES" || kw === "SECTIONPAGES") { return { kind: "pages" }; }
      if (kw === "DATE" || kw === "TIME") {
        var pic = /\\@\s*"([^"]+)"/.exec(rest) || /\\@\s*(\S+)/.exec(rest);
        var fmt = pic ? pic[1] : (kw === "DATE" ? "dd.MM.yyyy" : "HH:mm");
        return { kind: "date", fmt: fmt.replace(/AM\/PM|am\/pm/g, "a") };
      }
      return null;
    }

    /* paragraph -> blocks: {t:"p"}, {t:"img"}, {t:"break"} */
    function para(p, inCell) {
      var pPr = kid(p, "w:pPr"), styleId = val(kid(pPr, "w:pStyle")) || st.defaultPara;
      var ch = chain(st, styleId), P = Object.assign({}, st.defP), R = mergeR({}, st.defR), styleHasSize = false;
      ch.forEach(function (s) { Object.assign(P, s.p); mergeR(R, s.r); if (s.r.sz) { styleHasSize = true; } });
      Object.assign(P, readPpr(pPr));
      var sname = ((st.byId[styleId] && st.byId[styleId].name) || styleId || "").toLowerCase();
      var hm = /(?:heading|başlık|baslik)\s*(\d)/.exec(sname) || /^(?:heading|baslik|başlık)(\d)$/i.exec(styleId || "");
      var level = hm ? parseInt(hm[1], 10) : (P.outline !== undefined && P.outline < 9 ? P.outline + 1 : 0);
      if (!styleHasSize) {
        if (sname === "title" || sname === "konu başlığı") { R.sz = 24; R.b = true; }
        else if (level) { R.sz = [18, 15, 13, 12, 11, 11, 11, 11, 11][level - 1]; R.b = true; }
      }

      var segs = [], blocks = [];
      if (P.pbb && !inCell) { blocks.push({ t: "break" }); }

      function walk(n) {
        (n.children || []).forEach(function (c) {
          switch (c.name) {
            case "w:r": run(c); break;
            case "w:hyperlink": case "w:smartTag": case "w:ins": case "w:customXml": case "w:dir": case "w:bdo": case "w:moveTo": walk(c); break;
            case "w:sdt": walk(kid(c, "w:sdtContent") || {}); break;
            case "w:fldSimple": {
              var tok = fieldToken(c.attrs["w:instr"]);
              if (tok) { var r1 = find(c, "w:r"); segs.push({ tok: tok, r: runR(r1) }); } else { walk(c); }
              break;
            }
            default: break; // w:pPr, w:del, w:moveFrom, bookmarks, proofing marks
          }
        });
      }
      function runR(r) {
        var rPr = r && kid(r, "w:rPr"), x = mergeR({}, R);
        var rs = val(kid(rPr, "w:rStyle"));
        if (rs) { chain(st, rs).forEach(function (s) { mergeR(x, s.r); }); }
        mergeR(x, readRpr(rPr));
        return x;
      }
      function push(text, r) { if (text) { segs.push({ text: r.caps ? text.toLocaleUpperCase("tr") : text, r: r }); } }
      function run(r) {
        var Rr = runR(r), F = ctx.fld;
        (r.children || []).forEach(function (c) {
          if (c.name === "w:fldChar") {
            var t = c.attrs["w:fldCharType"];
            if (t === "begin") { F.push({ instr: "", phase: "instr", r: Rr }); }
            else if (t === "separate" || t === "end") {
              var f = F[F.length - 1];
              if (f && f.phase === "instr") {
                f.tok = fieldToken(f.instr);
                var skipOuter = F.slice(0, -1).some(function (g) { return g.phase === "instr" || (g.phase === "result" && g.tok); });
                if (f.tok && !skipOuter) { segs.push({ tok: f.tok, r: f.r }); }
                f.phase = "result";
              }
              if (t === "end") { F.pop(); }
            }
            return;
          }
          if (c.name === "w:instrText") { var g = F[F.length - 1]; if (g && g.phase === "instr") { g.instr += textOf(c); } return; }
          if (F.some(function (h) { return h.phase === "instr" || (h.phase === "result" && h.tok); })) { return; }
          switch (c.name) {
            case "w:t": if (!Rr.hidden) { push(textOf(c), Rr); } break;
            case "w:tab": case "w:ptab": push("\t", Rr); break;
            case "w:br":
              if (c.attrs["w:type"] === "page") { segs.push({ br: true }); } else { push("\n", Rr); }
              break;
            case "w:cr": push("\n", Rr); break;
            case "w:noBreakHyphen": push("-", Rr); break;
            case "w:sym": {
              var code = parseInt(c.attrs["w:char"] || "", 16);
              push(code && code < 0xF000 ? String.fromCharCode(code) : "•", Rr);
              break;
            }
            case "w:drawing": case "w:pict": case "w:object": picture(c); break;
            default: break;
          }
        });
      }
      function picture(c) {
        var boxes = findAll(c, "w:txbxContent");
        if (boxes.length) { ctx.count.textbox += boxes.length; boxes.forEach(function (b) { ctx.pendingBoxes.push(b); }); }
        var blip = find(c, "a:blip"), vimg = find(c, "v:imagedata");
        if (blip || vimg) {
          var rid = blip ? (blip.attrs["r:embed"] || blip.attrs["r:link"]) : (vimg.attrs["r:id"] || vimg.attrs["o:relid"]);
          var w = 0, h = 0, ext = find(c, "wp:extent");
          if (ext) { w = num(ext.attrs.cx) / 12700; h = num(ext.attrs.cy) / 12700; }
          else {
            var shape = find(c, "v:shape"), style = shape ? shape.attrs.style || "" : "";
            var mw = /width:\s*([\d.]+)(pt|px|in|cm)?/.exec(style), mh = /height:\s*([\d.]+)(pt|px|in|cm)?/.exec(style);
            var u = function (m) { if (!m) { return 0; } var v = parseFloat(m[1]); return m[2] === "in" ? v * 72 : m[2] === "cm" ? v * 28.35 : m[2] === "px" ? v * 0.75 : v; };
            w = u(mw); h = u(mh);
          }
          segs.push({ img: { rid: rid, linked: blip ? !blip.attrs["r:embed"] : false, w: w || 100, h: h || 100 } });
        } else if (!boxes.length) {
          ctx.count.shapes++;
        }
      }

      walk(p);

      // turn text placeholders into tokens (they may be split over several runs with the same or different formatting)
      segs = placeholders(mergeText(segs));

      var list = null;
      if (P.numId && P.numId !== "0") { list = listPrefix(P.numId, P.ilvl || 0); }

      var cur = [], made = false;
      function flush(force) {
        if (!cur.length && !force) { return; }
        var b = { t: "p", segs: cur, P: P, R: finalR(R), level: level };
        if (list && !made) { b.list = list; }
        blocks.push(b); made = true; cur = [];
      }
      segs.forEach(function (s) {
        if (s.br) { if (inCell) { cur.push({ text: "\n", r: s.r || R }); return; } flush(false); blocks.push({ t: "break" }); return; }
        if (s.img) {
          if (inCell) { ctx.count.imgCell++; return; }
          flush(false); blocks.push({ t: "img", img: s.img, jc: P.jc, P: P }); return;
        }
        cur.push(s);
      });
      if (cur.length || !made) {
        // a paragraph that only held a page break or a picture does not leave an empty line behind
        var onlyMarks = !cur.length && blocks.some(function (b) { return b.t === "break" || b.t === "img"; });
        if (!onlyMarks) { flush(true); }
      }
      blocks.forEach(function (b) {
        if (b.segs) { b.segs = b.segs.map(function (s) { return s.text !== undefined ? { text: s.text.replace(/\t/g, "    "), r: finalR(s.r) } : { tok: s.tok, r: finalR(s.r) }; }); }
      });
      // text boxes found in this paragraph follow it as plain paragraphs
      while (ctx.pendingBoxes.length && !inCell) {
        var box = ctx.pendingBoxes.shift();
        kids(box, "w:p").forEach(function (bp) { Array.prototype.push.apply(blocks, para(bp, false)); });
      }
      return blocks;
    }

    function mergeText(segs) {
      var out = [];
      segs.forEach(function (s) {
        var last = out[out.length - 1];
        if (s.text !== undefined && last && last.text !== undefined && JSON.stringify(last.r) === JSON.stringify(s.r)) { last.text += s.text; }
        else { out.push(s.text !== undefined ? { text: s.text, r: s.r } : s); }
      });
      return out;
    }

    function placeholders(segs) {
      if (!opts.placeholders) { return segs; }
      var out = [], i = 0;
      while (i < segs.length) {
        if (segs[i].text === undefined) { out.push(segs[i]); i++; continue; }
        var group = [];
        while (i < segs.length && segs[i].text !== undefined) { group.push(segs[i]); i++; }
        var full = group.map(function (s) { return s.text; }).join(""), starts = [], pos = 0;
        group.forEach(function (s) { starts.push(pos); pos += s.text.length; });
        var segAt = function (o) { for (var k = group.length - 1; k >= 0; k--) { if (starts[k] <= o) { return k; } } return 0; };
        var emitText = function (a, b) {
          for (var k = 0; k < group.length; k++) {
            var s0 = starts[k], e0 = s0 + group[k].text.length, x = Math.max(a, s0), y = Math.min(b, e0);
            if (x < y) { out.push({ text: full.slice(x, y), r: group[k].r }); }
          }
        };
        var m, last = 0;
        PH_RE.lastIndex = 0;
        while ((m = PH_RE.exec(full))) {
          var kind = m[1] !== undefined ? "field" : m[2] !== undefined ? "param" : m[3] !== undefined ? "var" : "ph";
          var raw = m[1] || m[2] || m[3] || m[4] || m[5] || m[6];
          var name = kind === "var" ? raw : cleanName(raw);
          if (!name) { continue; }
          if (kind !== "var" && name !== raw.trim()) { ctx.renamed[raw.trim()] = name; }
          emitText(last, m.index);
          out.push({ tok: { kind: kind, name: name }, r: group[segAt(m.index)].r });
          last = m.index + m[0].length;
        }
        emitText(last, full.length);
      }
      return out;
    }

    function listPrefix(numId, ilvl) {
      var absId = ctx.num.nums[numId], lvls = ctx.num.abs[absId] || {}, lv = lvls[ilvl];
      if (!lv) { return { text: "•", ind: (ilvl + 1) * 18 }; }
      var c = ctx.counters[numId] || (ctx.counters[numId] = []);
      for (var k = 0; k < ilvl; k++) { if (c[k] === undefined) { c[k] = lvls[k] ? lvls[k].start : 1; } }
      c[ilvl] = c[ilvl] === undefined ? lv.start : c[ilvl] + 1;
      c.length = ilvl + 1;
      var text;
      if (lv.fmt === "bullet") { text = bulletChar(lv.text); }
      else if (lv.fmt === "none") { text = ""; }
      else {
        text = lv.text.replace(/%(\d)/g, function (m0, d) {
          var i = parseInt(d, 10) - 1;
          return fmtNum(c[i] !== undefined ? c[i] : 1, lvls[i] ? lvls[i].fmt : "decimal");
        });
      }
      return { text: text, ind: lv.p.left, hanging: lv.p.hanging };
    }

    /* table -> {t:"table"} */
    function table(tbl) {
      var tblPr = kid(tbl, "w:tblPr"), grid = kids(kid(tbl, "w:tblGrid"), "w:gridCol").map(function (g) { return (num(g.attrs["w:w"]) || 0) / 20; });
      var borders = readBorders(kid(tblPr, "w:tblBorders"));
      if (borders === null) {
        var sid = val(kid(tblPr, "w:tblStyle")) || st.defaultTable;
        chain(st, sid).forEach(function (s) { if (s.borders !== null && s.borders !== undefined) { borders = s.borders; } });
      }
      var rows = kids(tbl, "w:tr").map(function (tr) {
        var trPr = kid(tr, "w:trPr"), hEl = kid(trPr, "w:trHeight");
        var cells = [], gi = parseInt(val(kid(trPr, "w:gridBefore")) || "0", 10) || 0;
        kids(tr, "w:tc").concat([]).forEach(function (tc) {
          var tcPr = kid(tc, "w:tcPr"), span = parseInt(val(kid(tcPr, "w:gridSpan")) || "1", 10) || 1;
          var vmEl = kid(tcPr, "w:vMerge"), vm = vmEl ? (val(vmEl) === "restart" ? "restart" : "cont") : null;
          var shd = kid(tcPr, "w:shd"), fill = shd && /^[0-9A-Fa-f]{6}$/.test(shd.attrs["w:fill"] || "") ? "#" + shd.attrs["w:fill"].toUpperCase() : null;
          if (fill === "#FFFFFF") { fill = null; }
          var segs = [], jc = null, first = true;
          (tc.children || []).forEach(function (c) {
            var blocks = [];
            if (c.name === "w:p") { blocks = para(c, true); }
            else if (c.name === "w:sdt") { kids(kid(c, "w:sdtContent"), "w:p").forEach(function (sp) { blocks = blocks.concat(para(sp, true)); }); }
            else if (c.name === "w:tbl") {
              ctx.count.nested++;
              blocks = [{ t: "p", segs: [{ text: nestedText(c), r: finalR(R0()) }], P: {}, R: finalR(R0()) }];
            }
            blocks.forEach(function (b) {
              if (b.t !== "p") { return; }
              if (!first) { segs.push({ text: "\n", r: b.R }); }
              if (first) { jc = b.P.jc; first = false; }
              if (b.list) { segs.push({ text: b.list.text + "  ", r: b.R }); }
              Array.prototype.push.apply(segs, b.segs);
            });
          });
          cells.push({ gi: gi, span: span, vm: vm, fill: fill, segs: segs, jc: jc, R: segs.length ? segs[0].r : finalR(R0()) });
          gi += span;
        });
        return { cells: cells, minH: hEl ? (num(val(hEl)) || 0) / 20 : 0, exactH: hEl && hEl.attrs["w:hRule"] === "exact" };
      });
      var cols = rows.reduce(function (m, r) { return Math.max(m, r.cells.reduce(function (a, c) { return Math.max(a, c.gi + c.span); }, 0)); }, 0);
      while (grid.length < cols) { grid.push(0); }
      return { t: "table", grid: grid, rows: rows, borders: !!borders, jc: val(kid(tblPr, "w:jc")) };
    }
    function R0() { var r = mergeR({}, st.defR); chain(st, st.defaultPara).forEach(function (s) { mergeR(r, s.r); }); return r; }
    function nestedText(tbl) {
      return kids(tbl, "w:tr").map(function (tr) {
        return kids(tr, "w:tc").map(function (tc) { return findAll(tc, "w:t").map(textOf).join(""); }).join(" | ");
      }).join("\n");
    }

    /* container (body, header, footer) -> blocks */
    function container(n) {
      var out = [];
      (n.children || []).forEach(function (c) {
        if (c.name === "w:p") { Array.prototype.push.apply(out, para(c, false)); }
        else if (c.name === "w:tbl") { out.push(table(c)); }
        else if (c.name === "w:sdt") { Array.prototype.push.apply(out, container(kid(c, "w:sdtContent") || {})); }
        else if (c.name === "w:customXml") { Array.prototype.push.apply(out, container(c)); }
      });
      return out;
    }

    return { container: container };
  }

  /* ---------- layout: blocks -> bands of positioned elements ---------- */

  function lineH(size, spacing) { return size * 1.2 * (spacing && spacing > 1.05 ? spacing : 1); }

  function estimate(segs, width, spacing) {
    var size = 0, bold = false, text = "";
    segs.forEach(function (s) {
      size = Math.max(size, s.r.sz); if (s.r.b) { bold = true; }
      text += s.text !== undefined ? s.text : s.tok.kind === "date" ? "00.00.0000" : s.tok.kind === "page" || s.tok.kind === "pages" ? "00" : "XXXXXXXXXXXX";
    });
    size = size || 10;
    var cw = size * (bold ? 0.52 : 0.47), per = Math.max(1, Math.floor(width / cw));
    var lines = text.split("\n").reduce(function (n, l) { // greedy word wrap, like a text layout would do
      var count = 1, used = 0;
      l.split(" ").forEach(function (w) {
        var len = w.length;
        while (len > per) { if (used) { count++; } used = 0; len -= per; count++; }
        if (used && used + 1 + len > per) { count++; used = len; } else { used += (used ? 1 : 0) + len; }
      });
      return n + count;
    }, 0);
    return Math.ceil(lines * lineH(size, spacing) + 2);
  }

  function hasContent(segs) { return segs.some(function (s) { return s.tok || (s.text && s.text.trim()); }); }

  function base(segs, fallback) {
    var weight = {}, pick = null, best = -1, byKey = {};
    segs.forEach(function (s) {
      var k = s.r.key; byKey[k] = s.r;
      weight[k] = (weight[k] || 0) + (s.text !== undefined ? s.text.length : 1);
    });
    Object.keys(weight).forEach(function (k) { if (weight[k] > best) { best = weight[k]; pick = byKey[k]; } });
    return { r: pick || fallback, styled: Object.keys(weight).length > 1 };
  }

  function align(jc) {
    if (jc === "center") { return "Center"; }
    if (jc === "right" || jc === "end") { return "Right"; }
    if (jc === "both" || jc === "distribute") { return "Justified"; }
    return "Left";
  }

  function textEl(segs, x, y, w, h, P, fallbackR, extra) {
    var b = base(segs, fallbackR), e = {
      k: "text", x: x, y: y, w: w, h: h, segs: segs, r: b.r, styled: b.styled, align: align(P.jc),
      line: P.line && Math.abs(P.line - 1) > 0.1 ? Math.round(P.line * 100) / 100 : 0,
      firstLine: P.firstLine > 0 ? Math.round(P.firstLine) : 0,
      auto: segs.some(function (s) { return s.tok && s.tok.kind === "pages"; })
    };
    return Object.assign(e, extra || {});
  }

  function layoutBlocks(blocks, W, maxH, ctx, media) {
    var bands = [];
    blocks.forEach(function (b) {
      if (b.t === "break") { bands.push({ brk: true, h: 1, els: [] }); return; }
      if (b.t === "p") {
        var P = b.P, segs = b.segs.slice(), left = P.left || 0, hang = P.hanging || 0;
        if (b.list) {
          if (P.left === undefined && b.list.ind !== undefined) { left = b.list.ind; hang = b.list.hanging || 0; }
          if (P.left === undefined && b.list.ind === undefined) { left = 18; }
          if (b.list.text) { segs.unshift({ text: b.list.text + "  ", r: b.R }); }
        }
        var x = clamp(Math.round(left - hang), 0, W - 20), w = Math.max(20, Math.round(W - x - clamp(P.right || 0, 0, W / 2)));
        var before = Math.round(clamp(P.before || 0, 0, 48)), after = Math.round(clamp(P.after || 0, 0, 48));
        if (!hasContent(segs)) { bands.push({ h: Math.max(1, Math.round(lineH(b.R.sz, P.line) + before + after)), els: [] }); return; }
        var h = estimate(segs, w - (P.firstLine > 0 ? P.firstLine : 0) * 0.5, P.line);
        if (before + h + after > maxH) { ctx.count.tall++; h = Math.max(10, maxH - before - after); if (h < 10) { before = after = 0; h = maxH; } }
        bands.push({ h: before + h + after, els: [textEl(segs, x, before, w, h, P, b.R)] });
        return;
      }
      if (b.t === "img") {
        var m = media[b.img.rid];
        if (!m || !m.ok) { return; }
        var iw = b.img.w, ih = b.img.h, sc = Math.min(1, W / iw, maxH / ih);
        iw = Math.max(1, Math.round(iw * sc)); ih = Math.max(1, Math.round(ih * sc));
        var ix = b.jc === "center" ? Math.round((W - iw) / 2) : (b.jc === "right" || b.jc === "end") ? W - iw : clamp(Math.round((b.P && b.P.left) || 0), 0, W - iw);
        bands.push({ h: ih, els: [{ k: "image", x: ix, y: 0, w: iw, h: ih, mime: m.mime, data: m.data }] });
        return;
      }
      if (b.t === "table") {
        var total = b.grid.reduce(function (a, v) { return a + v; }, 0), cols = b.grid.length;
        var widths = total > 0 ? b.grid.map(function (v) { return v || 20; }) : b.grid.map(function () { return W / Math.max(1, cols); });
        total = widths.reduce(function (a, v) { return a + v; }, 0);
        var sc2 = total > W ? W / total : 1, xs = [0], cum = 0;
        widths.forEach(function (v) { cum += v; xs.push(Math.min(W, Math.round(cum * sc2))); });
        var tw = xs[xs.length - 1], off = b.jc === "center" ? Math.floor((W - tw) / 2) : (b.jc === "right" || b.jc === "end") ? W - tw : 0;
        b.rows.forEach(function (row, ri) {
          var next = b.rows[ri + 1], els = [], rh = Math.round(row.minH) || 0;
          row.cells.forEach(function (c) {
            var cw = Math.max(4, xs[Math.min(c.gi + c.span, xs.length - 1)] - xs[Math.min(c.gi, xs.length - 1)]);
            if (c.vm !== "cont" && hasContent(c.segs)) { rh = Math.max(rh, estimate(c.segs, cw - 6) + 6); }
          });
          rh = Math.max(rh, 14);
          if (rh > maxH) { ctx.count.tall++; rh = maxH; }
          row.cells.forEach(function (c) {
            var cx = off + xs[Math.min(c.gi, xs.length - 1)], cw = Math.max(4, xs[Math.min(c.gi + c.span, xs.length - 1)] - xs[Math.min(c.gi, xs.length - 1)]);
            var contBelow = next && next.cells.some(function (n) { return n.gi === c.gi && n.vm === "cont"; });
            var segs = c.vm === "cont" ? [] : c.segs;
            els.push(textEl(segs.length ? segs : [{ text: "", r: c.R }], cx, 0, cw, rh, { jc: c.jc }, c.R, {
              cell: true, border: b.borders, noTop: b.borders && c.vm === "cont", noBottom: b.borders && (c.vm === "restart" || c.vm === "cont") && contBelow, bg: c.fill
            }));
          });
          bands.push({ h: rh, els: els, rowStretch: true });
        });
      }
    });
    return bands;
  }

  function stack(bands) { // header/footer: one band holding everything one under the other
    var els = [], y = 0;
    bands.forEach(function (b) {
      if (b.brk) { return; }
      b.els.forEach(function (e) { els.push(Object.assign({}, e, { y: e.y + y, cell: false })); });
      y += b.h;
    });
    return { h: Math.round(y), els: els };
  }

  /* ---------- JRXML writer ---------- */

  function tokExpr(t, auto) {
    if (t.kind === "field") { return "($F{" + t.name + "} == null ? \"\" : String.valueOf($F{" + t.name + "}))"; }
    if (t.kind === "param") { return "($P{" + t.name + "} == null ? \"\" : String.valueOf($P{" + t.name + "}))"; }
    if (t.kind === "var") { return "$V{" + t.name + "}"; }
    if (t.kind === "page") { return auto ? "$V{BAF_CURRENT_PAGE}" : "$V{PAGE_NUMBER}"; }
    if (t.kind === "pages") { return "$V{PAGE_NUMBER}"; }
    if (t.kind === "date") { return "new java.text.SimpleDateFormat(" + javaStr(t.fmt) + ").format(new java.util.Date())"; }
    return '""';
  }

  function styleAttrs(r, b) {
    var a = "";
    if (r.font !== b.font) { a += ' fontName="' + xmlEsc(r.font) + '"'; }
    if (r.sz !== b.sz) { a += ' size="' + fontSize(r.sz) + '"'; }
    if (r.b !== b.b) { a += ' isBold="' + r.b + '"'; }
    if (r.i !== b.i) { a += ' isItalic="' + r.i + '"'; }
    if (r.u !== b.u) { a += ' isUnderline="' + r.u + '"'; }
    if (r.s !== b.s) { a += ' isStrikeThrough="' + r.s + '"'; }
    if (r.color !== b.color) { a += ' forecolor="' + (r.color || "#000000") + '"'; }
    return a;
  }

  function expression(e) {
    var parts = [], lit = "";
    function flush() { if (lit) { parts.push(javaStr(lit)); lit = ""; } }
    e.segs.forEach(function (s) {
      var a = e.styled ? styleAttrs(s.r, e.r) : "", open = a ? "<style" + a + ">" : "", close = a ? "</style>" : "";
      if (s.text !== undefined) { lit += open + (e.styled ? s.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : s.text) + close; }
      else { lit += open; flush(); parts.push(tokExpr(s.tok, e.auto)); lit += close; }
    });
    flush();
    if (!parts.length) { return '""'; }
    if (parts[0].charAt(0) !== '"') { parts.unshift('""'); }
    return parts.join(" + ");
  }

  function fontSize(v) { var r = Math.round(v * 2) / 2; return String(r % 1 ? r.toFixed(1) : r); }

  function textXml(e, pad) {
    var re = '<reportElement x="' + e.x + '" y="' + e.y + '" width="' + e.w + '" height="' + e.h + '"' +
      (e.cell ? ' stretchType="RelativeToBandHeight"' : "") +
      (e.bg ? ' mode="Opaque" backcolor="' + e.bg + '"' : "") +
      (e.r.color ? ' forecolor="' + e.r.color + '"' : "") + "/>";
    var box = "";
    if (e.border) {
      box = '<box padding="3"><pen lineWidth="0.5" lineColor="#000000"/>' + (e.noTop ? '<topPen lineWidth="0.0"/>' : "") + (e.noBottom ? '<bottomPen lineWidth="0.0"/>' : "") + "</box>";
    } else if (e.cell) { box = '<box padding="3"/>'; }
    var f = '<font fontName="' + xmlEsc(e.r.font) + '" size="' + fontSize(e.r.sz) + '"' +
      (e.r.b ? ' isBold="true"' : "") + (e.r.i ? ' isItalic="true"' : "") + (e.r.u ? ' isUnderline="true"' : "") + (e.r.s ? ' isStrikeThrough="true"' : "") + "/>";
    var para = e.line || e.firstLine ? "<paragraph" + (e.line ? ' lineSpacing="Proportional" lineSpacingSize="' + e.line + '"' : "") + (e.firstLine ? ' firstLineIndent="' + e.firstLine + '"' : "") + "/>" : "";
    var te = '<textElement textAlignment="' + e.align + '"' + (e.cell ? ' verticalAlignment="Top"' : "") + (e.styled ? ' markup="styled"' : "") + ">" + f + para + "</textElement>";
    var attrs = e.auto ? ' evaluationTime="Auto"' : ' isStretchWithOverflow="true"';
    return pad + "<textField" + attrs + ' isBlankWhenNull="true">\n' +
      pad + "  " + re + "\n" + (box ? pad + "  " + box + "\n" : "") + pad + "  " + te + "\n" +
      pad + "  <textFieldExpression>" + cdata(expression(e)) + "</textFieldExpression>\n" + pad + "</textField>\n";
  }

  function b64(bytes) {
    if (typeof Buffer !== "undefined") { return Buffer.from(bytes).toString("base64"); }
    var s = "", CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) { s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH)); }
    return btoa(s);
  }

  function imageXml(e, pad) {
    var data = b64(e.data), chunks = [];
    for (var i = 0; i < data.length; i += 30000) { chunks.push('"' + data.slice(i, i + 30000) + '"'); }
    var ex = "new java.io.ByteArrayInputStream(java.util.Base64.getDecoder().decode(String.join(\"\", new String[] {" + chunks.join(",\n") + "})))";
    return pad + '<image scaleImage="RetainShape" onErrorType="Blank">\n' +
      pad + '  <reportElement x="' + e.x + '" y="' + e.y + '" width="' + e.w + '" height="' + e.h + '"/>\n' +
      pad + "  <imageExpression>" + cdata(ex) + "</imageExpression>\n" + pad + "</image>\n";
  }

  function bandXml(b, W, pad, printWhen) {
    if (b.brk) {
      return pad + '<band height="1">\n' + pad + '  <break>\n' + pad + '    <reportElement x="0" y="0" width="' + W + '" height="1"' + (printWhen ? ">\n" + pad + "      <printWhenExpression>" + cdata(printWhen) + "</printWhenExpression>\n" + pad + "    </reportElement>\n" : "/>\n") + pad + "  </break>\n" + pad + "</band>\n";
    }
    if (!b.els.length) { return pad + '<band height="' + b.h + '" splitType="Stretch"/>\n'; }
    return pad + '<band height="' + b.h + '" splitType="' + (b.rowStretch ? "Prevent" : "Stretch") + '">\n' +
      b.els.map(function (e) { return e.k === "image" ? imageXml(e, pad + "  ") : textXml(e, pad + "  "); }).join("") + pad + "</band>\n";
  }

  /* ---------- main ---------- */

  function convert(bytes, options) {
    var opts = Object.assign({ name: "Report", placeholders: true, placeholderKind: "field", images: true, headerFooter: true, font: "", lang: "tr" }, options || {});
    var T = MSG[opts.lang] || MSG.tr;
    if (!(bytes instanceof Uint8Array)) { bytes = new Uint8Array(bytes); }
    if (bytes.length > 8 && bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) { return Promise.reject(new Error(T.oldDoc)); }
    if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4B) { return Promise.reject(new Error(T.notDocx)); }

    var ctx = {
      opts: opts, fld: [], counters: {}, pendingBoxes: [], renamed: {},
      count: { textbox: 0, shapes: 0, nested: 0, imgCell: 0, tall: 0 }
    };
    var MAIN = "word/document.xml";
    var files;

    return DL._unzip(bytes, [MAIN, "word/styles.xml", "word/numbering.xml", "word/_rels/document.xml.rels", "word/theme/theme1.xml", "word/footnotes.xml", "word/comments.xml"])
      .then(function (f) {
        files = f;
        if (!files[MAIN]) { throw new Error(T.noBody); }
        var doc = parse(files[MAIN]), body = find(doc, "w:body");
        if (!body) { throw new Error(T.noBody); }
        ctx.st = parseStyles(files["word/styles.xml"] ? parse(files["word/styles.xml"]) : null);
        ctx.num = parseNumbering(files["word/numbering.xml"] ? parse(files["word/numbering.xml"]) : null);
        ctx.theme = parseTheme(files["word/theme/theme1.xml"] ? parse(files["word/theme/theme1.xml"]) : null);
        ctx.rels = files["word/_rels/document.xml.rels"] ? parseRels(parse(files["word/_rels/document.xml.rels"])) : {};
        ctx.body = body;
        ctx.sect = kid(body, "w:sectPr") || findAll(body, "w:sectPr").pop() || null;
        ctx.manySections = findAll(body, "w:sectPr").length > 1;
        ctx.notes = !!find(body, "w:footnoteReference") || !!find(body, "w:endnoteReference") || !!find(body, "w:commentReference");

        // header and footer parts
        var parts = [], hf = { header: null, footer: null };
        if (opts.headerFooter && ctx.sect) {
          ["header", "footer"].forEach(function (k) {
            var ref = kids(ctx.sect, "w:" + k + "Reference").filter(function (r) { return (r.attrs["w:type"] || "default") === "default"; })[0];
            var rel = ref && ctx.rels[ref.attrs["r:id"]];
            if (rel) { hf[k] = relPath(MAIN, rel.target); parts.push(hf[k], hf[k].replace(/([^/]+)$/, "_rels/$1.rels")); }
          });
          ctx.diffFirst = !!kid(ctx.sect, "w:titlePg") || kids(ctx.sect, "w:headerReference").some(function (r) { return r.attrs["w:type"] === "even"; });
        }
        ctx.hf = hf;
        return parts.length ? DL._unzip(bytes, parts) : {};
      })
      .then(function (more) {
        Object.assign(files, more);
        var reader = Reader(ctx);
        var bodyBlocks = reader.container(ctx.body);
        var hfBlocks = {};
        ["header", "footer"].forEach(function (k) {
          var p = ctx.hf[k];
          if (p && files[p]) {
            var tree = parse(files[p]), rootEl = find(tree, k === "header" ? "w:hdr" : "w:ftr");
            ctx.fld = []; ctx.counters = {};
            hfBlocks[k] = { blocks: rootEl ? reader.container(rootEl) : [], part: p, rels: files[p.replace(/([^/]+)$/, "_rels/$1.rels")] ? parseRels(parse(files[p.replace(/([^/]+)$/, "_rels/$1.rels")])) : {} };
          }
        });

        // pictures: collect the media files we need
        var wanted = {}, imgs = [];
        function collectImgs(blocks, part, rels) {
          blocks.forEach(function (b) {
            if (b.t !== "img") { return; }
            var key = part + "#" + b.img.rid, rel = rels[b.img.rid];
            b.img.rid = key;
            imgs.push(b);
            if (rel && !rel.external && !b.img.linked) { wanted[key] = relPath(part, rel.target); } else { wanted[key] = null; }
          });
        }
        collectImgs(bodyBlocks, MAIN, ctx.rels);
        Object.keys(hfBlocks).forEach(function (k) { collectImgs(hfBlocks[k].blocks, hfBlocks[k].part, hfBlocks[k].rels); });
        var paths = Object.keys(wanted).map(function (k) { return wanted[k]; }).filter(Boolean);
        var load = opts.images && paths.length ? DL._unzip(bytes, paths) : Promise.resolve({});
        return load.then(function (mediaFiles) {
          return build(ctx, opts, T, bodyBlocks, hfBlocks, imgs, wanted, mediaFiles);
        });
      });
  }

  function mimeOf(path, data) {
    var ext = (path.split(".").pop() || "").toLowerCase();
    if (data && data.length > 4) {
      if (data[0] === 0x89 && data[1] === 0x50) { return "image/png"; }
      if (data[0] === 0xFF && data[1] === 0xD8) { return "image/jpeg"; }
      if (data[0] === 0x47 && data[1] === 0x49) { return "image/gif"; }
      if (data[0] === 0x42 && data[1] === 0x4D) { return "image/bmp"; }
    }
    return ext;
  }

  function build(ctx, opts, T, bodyBlocks, hfBlocks, imgs, wanted, mediaFiles) {
    var warnings = [], media = {}, skippedFmt = {}, linked = 0, off = 0;
    imgs.forEach(function (b) {
      var p = wanted[b.img.rid];
      if (p === null) { linked++; return; }
      if (!opts.images) { off++; return; }
      var data = mediaFiles[p], mime = mimeOf(p, data);
      if (data && /^image\/(png|jpeg|gif|bmp)$/.test(mime)) { media[b.img.rid] = { ok: true, mime: mime, data: data }; }
      else { var f = String(mime).replace("image/", "").toUpperCase() || "?"; skippedFmt[f] = (skippedFmt[f] || 0) + 1; }
    });

    // page setup (Word: twips) -> points
    var sect = ctx.sect, pg = kid(sect, "w:pgSz"), mar = kid(sect, "w:pgMar");
    var pw = Math.round((num(pg && pg.attrs["w:w"]) || 11906) / 20), ph = Math.round((num(pg && pg.attrs["w:h"]) || 16838) / 20);
    var m = function (k, d) { var v = num(mar && mar.attrs["w:" + k]); return Math.max(0, Math.round((v !== undefined ? v : d) / 20)); };
    var top = m("top", 1417), bottom = m("bottom", 1417), left = m("left", 1417), right = m("right", 1417), hDist = m("header", 708), fDist = m("footer", 708);
    var W = Math.max(50, pw - left - right);
    var cols = kid(sect, "w:cols");
    if (cols && parseInt(cols.attrs["w:num"] || "1", 10) > 1) { warnings.push(T.columns); }
    if (ctx.manySections) { warnings.push(T.sections); }
    if (ctx.notes) { warnings.push(T.notes); }

    var head = hfBlocks.header ? stack(layoutBlocks(hfBlocks.header.blocks, W, ph / 3, ctx, media)) : null;
    var foot = hfBlocks.footer ? stack(layoutBlocks(hfBlocks.footer.blocks, W, ph / 3, ctx, media)) : null;
    if (head && !head.els.length) { head = null; }
    if (foot && !foot.els.length) { foot = null; }
    if ((head || foot) && ctx.diffFirst) { warnings.push(T.firstPage); }
    var topMargin = top, bottomMargin = bottom;
    if (head) { topMargin = Math.min(top, hDist); head.h = Math.max(head.h, top - topMargin); }
    if (foot) {
      bottomMargin = Math.min(bottom, fDist);
      var fh = Math.max(foot.h, bottom - bottomMargin), shift = fh - foot.h;
      foot.els.forEach(function (e) { e.y += shift; });
      foot.h = fh;
    }
    var maxH = ph - topMargin - bottomMargin - (head ? head.h : 0) - (foot ? foot.h : 0);
    if (maxH < 40) { // header/footer would eat the page: keep the Word margins instead
      maxH = Math.max(40, ph - top - bottom);
      head = null; foot = null; topMargin = top; bottomMargin = bottom;
    }
    var bands = layoutBlocks(bodyBlocks, W, maxH, ctx, media);
    while (bands.length && bands[bands.length - 1].brk) { bands.pop(); }
    while (bands.length && bands[0].brk) { bands.shift(); }

    // names used by placeholders
    var fields = {}, params = {}, needPage = false;
    function scan(list) {
      list.forEach(function (b) {
        b.els.forEach(function (e) {
          if (e.k !== "text") { return; }
          e.segs.forEach(function (s) {
            if (!s.tok) { return; }
            if (s.tok.kind === "ph") { s.tok.kind = opts.placeholderKind === "parameter" ? "param" : "field"; }
            if (s.tok.kind === "field") { fields[s.tok.name] = 1; }
            if (s.tok.kind === "param") { params[s.tok.name] = 1; }
          });
          if (e.auto && e.segs.some(function (s) { return s.tok && s.tok.kind === "page"; })) { needPage = true; }
        });
      });
    }
    scan(bands); if (head) { scan([head]); } if (foot) { scan([foot]); }
    var fieldNames = Object.keys(fields), paramNames = Object.keys(params);
    var renamed = Object.keys(ctx.renamed).map(function (k) { return "\"" + k + "\" → " + ctx.renamed[k]; });
    if (renamed.length) { warnings.push(T.fieldNames(renamed.join(", "))); }

    // counts -> warnings
    var c = ctx.count;
    Object.keys(skippedFmt).forEach(function (f) { warnings.push(T.imgFormat(skippedFmt[f], f)); });
    if (linked) { warnings.push(T.imgLinked(linked)); }
    if (off) { warnings.push(T.imgOff(off)); }
    if (c.imgCell) { warnings.push(T.imgCell(c.imgCell)); }
    if (c.shapes) { warnings.push(T.shapes(c.shapes)); }
    if (c.textbox) { warnings.push(T.textbox(c.textbox)); }
    if (c.nested) { warnings.push(T.nested(c.nested)); }
    if (c.tall) { warnings.push(T.tall(c.tall)); }

    var name = cleanName(opts.name) || "Report";
    var x = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      "<!-- Created with BAForge AI - Word to JasperReports converter (JasperReports 6.x format) -->\n" +
      '<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"' +
      ' name="' + xmlEsc(name) + '" pageWidth="' + pw + '" pageHeight="' + ph + '" columnWidth="' + W + '" leftMargin="' + left + '" rightMargin="' + right + '" topMargin="' + topMargin + '" bottomMargin="' + bottomMargin + '">\n' +
      '  <property name="com.jaspersoft.studio.data.defaultdataadapter" value="One Empty Record"/>\n';
    paramNames.forEach(function (p) { x += '  <parameter name="' + xmlEsc(p) + '" class="java.lang.String"/>\n'; });
    fieldNames.forEach(function (f) { x += '  <field name="' + xmlEsc(f) + '" class="java.lang.String"/>\n'; });
    if (needPage) {
      x += '  <variable name="BAF_CURRENT_PAGE" class="java.lang.Integer" resetType="Page" calculation="Nothing">\n    <variableExpression>' + cdata("$V{PAGE_NUMBER}") + "</variableExpression>\n  </variable>\n";
    }
    if (head) { x += "  <pageHeader>\n" + bandXml(head, W, "    ") + "  </pageHeader>\n"; }
    if (bands.length) {
      x += "  <detail>\n";
      // with a data source of several records every record prints the whole document, each from a new page
      if (fieldNames.length) { x += bandXml({ brk: true }, W, "    ", "Boolean.valueOf($V{REPORT_COUNT}.intValue() > 1)"); }
      bands.forEach(function (b) { x += bandXml(b, W, "    "); });
      x += "  </detail>\n";
    }
    if (foot) { x += "  <pageFooter>\n" + bandXml(foot, W, "    ") + "  </pageFooter>\n"; }
    x += "</jasperReport>\n";

    var stats = {
      paragraphs: bodyBlocks.filter(function (b) { return b.t === "p"; }).length,
      tables: bodyBlocks.filter(function (b) { return b.t === "table"; }).length,
      images: Object.keys(media).length,
      pageBreaks: bands.filter(function (b) { return b.brk; }).length,
      fields: fieldNames, parameters: paramNames,
      header: !!head, footer: !!foot
    };
    var model = { page: { w: pw, h: ph, top: topMargin, bottom: bottomMargin, left: left, right: right, W: W, maxH: maxH }, header: head, footer: foot, bands: bands };
    return { jrxml: x, model: model, stats: stats, warnings: warnings };
  }

  var api = { convert: convert, _javaStr: javaStr, _expression: expression };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; } else { root.DocxJrxml = api; }
})(typeof window !== "undefined" ? window : globalThis);
