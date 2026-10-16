/*
 * BADiagramPage.init(cfg) — shared page for the text-driven design tools
 * (Flowchart, ER, UML, BPMN). Needs BATool, BADiagram, BAHistory (optional).
 *   cfg: { page, kind, dir: bool, defaultDir, sample, dict: {en:{...},tr:{...}} }
 *   dict keys: pageTitle,title,subtitle,syntax(array of strings),hint
 */
(function (root) {
  "use strict";

  var COMMON = {
    en: {
      source: "Diagram text", preview: "Preview", direction: "Direction", td: "Top to bottom", lr: "Left to right",
      svg: "Download SVG", png: "Download PNG", copy: "Copy text", sample: "Load sample", clear: "Clear",
      rulesTitle: "How to write it", copied: "Text copied.", copyFail: "Could not copy.",
      ok: "Diagram updated.", empty: "Type or load a sample to see the diagram.", fixFirst: "Fix this to see the diagram:",
      pngFail: "Could not create the PNG. Try SVG instead.", zoomIn: "Zoom in", zoomOut: "Zoom out", fit: "Fit"
    },
    tr: {
      source: "Diyagram metni", preview: "Önizleme", direction: "Yön", td: "Yukarıdan aşağı", lr: "Soldan sağa",
      svg: "SVG indir", png: "PNG indir", copy: "Metni kopyala", sample: "Örnek yükle", clear: "Temizle",
      rulesTitle: "Nasıl yazılır", copied: "Metin kopyalandı.", copyFail: "Kopyalanamadı.",
      ok: "Diyagram güncellendi.", empty: "Diyagramı görmek için yazın veya örnek yükleyin.", fixFirst: "Diyagramı görmek için şunu düzeltin:",
      pngFail: "PNG oluşturulamadı. SVG deneyin.", zoomIn: "Yakınlaştır", zoomOut: "Uzaklaştır", fit: "Sığdır"
    }
  };

  function init(cfg) {
    var $ = BATool.$;
    var dict = { en: Object.assign({}, COMMON.en, cfg.dict.en), tr: Object.assign({}, COMMON.tr, cfg.dict.tr) };
    var L = BATool.lang();
    var T = dict[L];
    var zoom = 1, lastSvg = "", lastOk = null;

    var app = $("app");
    app.innerHTML =
      '<section class="hero"><h1 data-t="title"></h1><p data-t="subtitle"></p></section>' +
      '<section class="card">' +
      '<div class="toolbar">' +
      (cfg.dir ? '<label class="field"><span data-t="direction"></span><select id="dir"><option value="TD" data-t="td"></option><option value="LR" data-t="lr"></option></select></label>' : "") +
      '<div class="segmented" role="group" aria-label="zoom"><button type="button" id="zOut" data-t-title="zoomOut">−</button><button type="button" id="zFit" data-t="fit"></button><button type="button" id="zIn" data-t-title="zoomIn">+</button></div>' +
      "</div>" +
      '<div class="panes">' +
      '<div class="pane"><h2 data-t="source"></h2><textarea id="src" spellcheck="false" aria-label="Diagram text"></textarea></div>' +
      '<div class="pane"><h2 data-t="preview"></h2><div class="preview" id="preview" aria-live="polite"></div></div>' +
      "</div>" +
      '<div class="actions">' +
      '<button type="button" class="btn primary" id="svgButton" data-t="svg"></button>' +
      '<button type="button" class="btn" id="pngButton" data-t="png"></button>' +
      '<button type="button" class="btn" id="copyButton" data-t="copy"></button>' +
      '<button type="button" class="btn" id="sampleButton" data-t="sample"></button>' +
      '<button type="button" class="btn" id="clearButton" data-t="clear"></button>' +
      "</div>" +
      '<div class="status" id="status" role="status" aria-live="polite"></div>' +
      '<ul class="warnings" id="warnings"></ul>' +
      "</section>" +
      '<details class="rules" open><summary data-t="rulesTitle"></summary><ul id="rulesList"></ul></details>';

    BATool.applyI18n(dict);
    $("rulesList").innerHTML = T.syntax.map(function (r) { return "<li>" + r + "</li>"; }).join("");

    var src = $("src"), preview = $("preview");
    if (cfg.dir) { $("dir").value = cfg.defaultDir || "TD"; }

    function applyZoom() {
      var svg = preview.querySelector("svg");
      if (!svg) { return; }
      var w = svg.getAttribute("data-w"), h = svg.getAttribute("data-h");
      svg.setAttribute("width", Math.round(w * zoom)); svg.setAttribute("height", Math.round(h * zoom));
    }

    function draw() {
      var text = src.value;
      BATool.warnings([]);
      if (!text.trim()) { preview.innerHTML = ""; lastSvg = ""; lastOk = null; BATool.status("", T.empty); return; }
      var r;
      try { r = BADiagram.build(cfg.kind, text, { dir: cfg.dir ? $("dir").value : undefined }); }
      catch (e) { r = { svg: "", errors: [e.message || String(e)], warnings: [] }; }
      if (r.errors.length) {
        lastSvg = ""; lastOk = null;
        preview.innerHTML = "";
        BATool.status("error", T.fixFirst);
        BATool.warnings(r.errors);
        return;
      }
      lastSvg = r.svg;
      preview.innerHTML = r.svg;
      var svg = preview.querySelector("svg");
      svg.setAttribute("data-w", svg.getAttribute("width")); svg.setAttribute("data-h", svg.getAttribute("height"));
      applyZoom();
      BATool.status("ok", T.ok);
      BATool.warnings(r.warnings);
      lastOk = { text: text, dir: cfg.dir ? $("dir").value : null };
    }

    var drawSoon = BATool.debounce(draw, 250);
    src.addEventListener("input", drawSoon);
    if (cfg.dir) { $("dir").addEventListener("change", draw); }

    /* history: record when the user pauses typing on a valid diagram */
    var recordSoon = BATool.debounce(function () {
      if (!window.BAHistory || !lastOk) { return; }
      var top = BAHistory.list(cfg.page)[0];
      if (!top || top.data.text !== lastOk.text || top.data.dir !== lastOk.dir) { BAHistory.record(); }
    }, 1500);
    src.addEventListener("input", recordSoon);
    if (cfg.dir) { $("dir").addEventListener("change", recordSoon); }

    $("zIn").addEventListener("click", function () { zoom = Math.min(3, zoom + 0.25); applyZoom(); });
    $("zOut").addEventListener("click", function () { zoom = Math.max(0.25, zoom - 0.25); applyZoom(); });
    $("zFit").addEventListener("click", function () {
      var svg = preview.querySelector("svg"); if (!svg) { return; }
      zoom = Math.min(1, (preview.clientWidth - 8) / svg.getAttribute("data-w")); applyZoom();
    });

    function plainSvg() {
      /* export without the zoom size so the file opens at natural size */
      var tmp = document.createElement("div"); tmp.innerHTML = lastSvg;
      return '<?xml version="1.0" encoding="UTF-8"?>\n' + tmp.innerHTML;
    }

    $("svgButton").addEventListener("click", function () {
      if (!lastSvg) { BATool.status("error", T.empty); return; }
      BATool.download(cfg.kind + ".svg", plainSvg(), "image/svg+xml");
    });
    $("pngButton").addEventListener("click", function () {
      if (!lastSvg) { BATool.status("error", T.empty); return; }
      var img = new Image(), url = URL.createObjectURL(new Blob([plainSvg()], { type: "image/svg+xml" }));
      img.onload = function () {
        var w = img.naturalWidth || 800, h = img.naturalHeight || 600, c = document.createElement("canvas");
        c.width = w * 2; c.height = h * 2;
        var ctx = c.getContext("2d"); ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (!b) { BATool.status("error", T.pngFail); return; }
          var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = cfg.kind + ".png";
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
        }, "image/png");
      };
      img.onerror = function () { BATool.status("error", T.pngFail); };
      img.src = url;
    });
    $("copyButton").addEventListener("click", function () {
      if (!src.value) { BATool.status("error", T.empty); return; }
      BATool.copy(src.value, function () { BATool.status("ok", T.copied); }, function () { BATool.status("error", T.copyFail); });
    });
    $("sampleButton").addEventListener("click", function () { src.value = cfg.sample; draw(); recordSoon(); });
    $("clearButton").addEventListener("click", function () { src.value = ""; draw(); src.focus(); });

    if (window.BAHistory) {
      BAHistory.init({
        page: cfg.page,
        label: function (d) { return d.text; },
        capture: function () { return lastOk; },
        restore: function (d) { src.value = d.text; if (cfg.dir && d.dir) { $("dir").value = d.dir; } draw(); }
      });
    }

    src.value = cfg.sample;
    draw();
  }

  root.BADiagramPage = { init: init };
})(window);
