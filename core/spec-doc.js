/*
 * SpecDoc — model <-> Word.
 *   build(model, lang)            -> spec for DocxLite.build()
 *   fromBlocks(blocks, base)      -> { model, found, warnings }  (blocks come from DocxLite.read())
 *   applyImport(base, imported)   -> a new model: sections present in the Word file replace the old ones,
 *                                    sections the Word file does not contain stay as they were.
 *
 * Tables carry a caption (Word "alt text title") such as `sec:rules` or `fields:PAK.008`. If Word drops the
 * caption, the table is still recognised by its header labels and the nearest heading.
 */
(function (root) {
  "use strict";
  var S = typeof require === "function" && typeof module !== "undefined" && module.exports ? require("./spec-schema.js") : root.SpecSchema;

  var T = {
    tr: {
      title: "Fonksiyonel Analiz Dokümanı", sources: "Kaynak dokümanlar", how: "Bu doküman nasıl okunmalı",
      how1: "**Doküman** etiketli satırlar kaynak PDF'ten çıkarılmıştır. \"Kaynak\" sütunu sayfayı ve PDF'ten alınan kısa alıntıyı gösterir. ✓ işareti, alıntının PDF metninde gerçekten bulunduğunu; ⚠ işareti bulunamadığını gösterir (elle kontrol edin).",
      how2: "**Öneri** etiketli satırlar ve **Kaynak** sütunu boş olan satırlar kaynak dokümanda yer almaz; analist önerisi ya da eklemesidir ve iş birimi onayına tabidir.",
      how3: "Bu dosyayı Word'de düzeltebilirsiniz: hücreleri değiştirin, satır ekleyin veya silin, \"Durum\" sütununa Onaylandı / Reddedildi yazın. Düzenlenmiş dosyayı ekrana geri yükleyince değişiklikler okunur. Tabloların başlık satırını ve sütun sırasını değiştirmeyin.",
      trust: "Güven özeti", counts: "Kaynaktan çıkarılan öğe", unverified: "Alıntısı doğrulanamayan öğe", proposals: "Öneri niteliğindeki satır", reviewed: "Onaylanan satır", total: "toplam",
      none: "Bu bölümde kayıt yok.", field: "Alan", value: "Değer", main: "ana kaynak", extra: "ek doküman", pages: "sayfa", docWord: "Kaynak"
    },
    en: {
      title: "Functional Analysis Document", sources: "Source documents", how: "How to read this document",
      how1: "Rows tagged **Document** were extracted from the source PDF. The \"Source\" column shows the page and a short quote. ✓ means the quote was found in the PDF text; ⚠ means it was not found (check manually).",
      how2: "Rows tagged **Proposal**, and rows with an empty **Source** column, are not in the source document; they are analyst proposals or additions and need business approval.",
      how3: "You can correct this file in Word: change cells, add or delete rows, write Approved / Rejected in the \"Status\" column. Upload the edited file back to the screen and the changes are read. Do not change the header row or the column order of the tables.",
      trust: "Confidence summary", counts: "Items extracted from the source", unverified: "Items whose quote could not be verified", proposals: "Proposal rows", reviewed: "Approved rows", total: "total",
      none: "No records in this section.", field: "Field", value: "Value", main: "main source", extra: "supporting document", pages: "pages", docWord: "Source"
    }
  };

  function live(list) { return (list || []).filter(function (x) { return x && x.status !== "rejected"; }); }
  function idx(lang) { return lang === "en" ? 1 : 0; }
  function label(col, lang) { return lang === "en" ? col.en : col.tr; }

  function secTable(sec, list, lang, caption) {
    var cols = sec.cols, mono = [];
    cols.forEach(function (c, i) { if (c.mono) { mono.push(i); } });
    return {
      t: "table", caption: caption || "sec:" + sec.key, head: cols.map(function (c) { return label(c, lang); }), widths: cols.map(function (c) { return c.w; }), mono: mono,
      rows: live(list).map(function (it) { return cols.map(function (c) { return S.cellText(it, c, lang); }); })
    };
  }

  function build(model, lang) {
    lang = lang === "en" ? "en" : "tr";
    var L = T[lang], blocks = [], meta = model.meta || {}, n = 0;
    var date = meta.date || new Date().toISOString().slice(0, 10);

    /* reading guide + confidence */
    blocks.push({ t: "h2", text: L.how });
    blocks.push({ t: "bullets", items: [L.how1, L.how2, L.how3] });
    var cnt = 0, bad = 0, props = 0, appr = 0, all = 0;
    S.SECTIONS.forEach(function (s) {
      live(S.items(model, s.key)).forEach(function (it) {
        if (s.key === "changeLog") { return; }
        all++;
        if (s.src) { cnt++; if (it.check === "missing") { bad++; } }
        if (it.origin === "proposal" || (s.src && !(it.sources || []).length)) { props++; }
        if (it.status === "approved") { appr++; }
      });
    });
    blocks.push({ t: "h2", text: L.trust });
    blocks.push({ t: "table", caption: "trust", head: [L.field, L.value], widths: [70, 30], rows: [[L.counts, String(cnt)], [L.unverified, String(bad)], [L.proposals, String(props)], [L.reviewed, appr + " / " + all + " " + L.total]] });
    blocks.push({ t: "pagebreak" });

    function kvTable(kv) {
      var data = S.getPath(model, kv.path) || {};
      blocks.push({ t: "table", caption: "kv:" + kv.key, head: [L.field, L.value], widths: [28, 72], rows: kv.rows.map(function (r) { return [lang === "en" ? r[2] : r[1], data[r[0]] == null ? "" : String(data[r[0]]).replace(/\r/g, "")]; }) });
    }

    S.LAYOUT.forEach(function (sect) {
      // skip a whole heading if everything in it is empty (the document shows only what exists)
      var hasAny = sect.items.some(function (it) {
        if (it.kv) { var d = S.getPath(model, S.KV_BY_KEY[it.kv].path) || {}; return S.KV_BY_KEY[it.kv].rows.some(function (r) { return d[r[0]] || it.kv === "meta"; }); }
        if (it.special === "docs") { return (model.docs || []).length > 0; }
        if (it.special === "fields") { return live(model.fields).length > 0 || live(model.messages).length > 0; }
        if (it.special === "steps") { return live(model.flows).length > 0; }
        if (it.special === "columns") { return live(S.items(model, "tables")).length > 0; }
        return live(S.items(model, it.sec)).length > 0;
      });
      if (!hasAny) { return; }
      n++;
      blocks.push({ t: "h1", text: n + ". " + sect.h[idx(lang)] });
      if (sect.note) { blocks.push({ t: "p", text: sect.note[idx(lang)], keep: true }); }
      sect.items.forEach(function (it) {
        if (it.kv) { kvTable(S.KV_BY_KEY[it.kv]); return; }
        if (it.special === "docs") {
          blocks.push({ t: "h3", text: L.sources });
          blocks.push({ t: "table", caption: "docs", head: S.DOCS_COLS.map(function (c) { return label(c, lang); }), widths: S.DOCS_COLS.map(function (c) { return c.w; }),
            rows: (model.docs || []).map(function (d) { return ["D" + d.no, d.name, d.role === "extra" ? L.extra : L.main, String(d.pages || "")]; }) });
          return;
        }
        if (it.special === "fields") {
          var sec = S.BY_KEY.fields, groups = [], seen = {};
          live(model.messages).forEach(function (m) { var k = m.code || m.name; if (!seen[k]) { seen[k] = { code: k, name: m.name, list: [] }; groups.push(seen[k]); } });
          live(model.fields).forEach(function (f) { var k = f.message || "-"; if (!seen[k]) { seen[k] = { code: k, name: "", list: [] }; groups.push(seen[k]); } seen[k].list.push(f); });
          var cols = sec.cols.filter(function (c) { return c.p !== "message"; });
          groups.forEach(function (g) {
            blocks.push({ t: "h3", text: g.code + (g.name ? " — " + g.name : "") });
            var sub = { key: sec.key, cols: cols };
            blocks.push(secTable(sub, g.list, lang, "fields:" + g.code));
          });
          return;
        }
        if (it.special === "steps") {
          live(model.flows).forEach(function (f) {
            blocks.push({ t: "h3", text: f.id + " — " + f.name });
            blocks.push({ t: "table", caption: "steps:" + f.id, head: S.STEP_COLS.map(function (c) { return label(c, lang); }), widths: S.STEP_COLS.map(function (c) { return c.w; }),
              rows: (f.steps || []).map(function (s, i) { return [String(i + 1), s.actor, s.action, s.message]; }) });
          });
          return;
        }
        if (it.special === "columns") {
          live(S.items(model, "tables")).forEach(function (t) {
            blocks.push({ t: "h3", text: t.id + " — " + t.name });
            blocks.push({ t: "table", caption: "cols:" + t.id, head: S.COLUMN_COLS.map(function (c) { return label(c, lang); }), widths: S.COLUMN_COLS.map(function (c) { return c.w; }),
              rows: (t.columns || []).map(function (c) { return [c.name, c.type, c.nullable, c.key, c.description, c.source]; }) });
          });
          return;
        }
        var s = S.BY_KEY[it.sec];
        if (!live(S.items(model, it.sec)).length) { return; }
        if (it.sub) { blocks.push({ t: "h2", text: it.sub[idx(lang)] }); }
        blocks.push(secTable(s, S.items(model, it.sec), lang));
      });
    });

    return { title: meta.title || L.title, subtitle: (meta.version ? (lang === "en" ? "Version " : "Sürüm ") + meta.version + " · " : "") + date, footer: "BAForge AI · " + (meta.title || L.title), landscape: true, blocks: blocks };
  }

  /* ---------- reading back ---------- */

  function norm(s) { return S.lc(String(s || "").replace(/\s+/g, " ")); }

  function headerMap(headRow, cols) {
    var map = {}, used = {};
    cols.forEach(function (c) {
      for (var i = 0; i < headRow.length; i++) {
        if (used[i]) { continue; }
        var h = norm(headRow[i]);
        if (h && (h === norm(c.tr) || h === norm(c.en))) { map[c.p] = i; used[i] = true; break; }
      }
    });
    return map;
  }

  function matchScore(headRow, cols) {
    var m = headerMap(headRow, cols), got = Object.keys(m).length;
    return got >= Math.max(2, cols.length - 1) && got >= headRow.filter(function (h) { return norm(h); }).length - 1 ? got : 0;
  }

  function rowToItem(row, cols, map) {
    var it = {}, any = false;
    cols.forEach(function (c) {
      if (map[c.p] === undefined) { return; }
      var raw = row[map[c.p]] == null ? "" : row[map[c.p]];
      if (c.kind !== "id" && c.kind !== "status" && c.kind !== "origin" && String(raw).trim()) { any = true; }
      var v = S.parseCell(raw, c, it);
      if (v !== undefined) { it[c.p] = v; }
    });
    if (!any) { return null; }
    if (!it.status && cols.some(function (c) { return c.kind === "status"; })) { it.status = "pending"; }
    return it;
  }

  /* Several sections share the same columns (e.g. audit / security): the heading above the table decides. */
  function pickByHeading(cands, h2, h1) {
    function clean(h) { return norm(String(h || "").replace(/^\d+\.\s*/, "")); }
    var wanted = [clean(h2), clean(h1)].filter(Boolean);
    for (var w = 0; w < wanted.length; w++) {
      for (var i = 0; i < cands.length; i++) {
        var key = cands[i].key, hit = false;
        S.LAYOUT.forEach(function (sect) {
          sect.items.forEach(function (it) {
            if (it.sec !== key) { return; }
            var labels = [it.sub ? it.sub[0] : null, it.sub ? it.sub[1] : null, it.sub ? null : sect.h[0], it.sub ? null : sect.h[1]].filter(Boolean).map(norm);
            if (labels.indexOf(wanted[w]) > -1) { hit = true; }
          });
        });
        if (hit) { return cands[i]; }
      }
    }
    return null;
  }

  function fromBlocks(blocks, base) {
    var model = S.emptyModel(), found = {}, warnings = [], lastHeading = "", lastH1 = "", lastH2 = "";
    var steps = {}, columns = {}, fieldGroupsSeen = false;
    var unknown = 0;

    (blocks || []).forEach(function (b) {
      if (b.t === "p") {
        if (/^Heading|^heading/.test(b.style || "") && b.text.trim()) {
          lastHeading = b.text.trim();
          if (/1$/.test(b.style)) { lastH1 = lastHeading; lastH2 = ""; } else if (/2$/.test(b.style)) { lastH2 = lastHeading; }
        }
        return;
      }
      if (b.t !== "table" || !b.rows.length) { return; }
      var cap = b.caption || "", head = b.rows[0], data = b.rows.slice(1);
      var kind = "", key = "", group = "";

      var m = /^(sec|kv|fields|steps|cols):(.*)$/.exec(cap);
      if (m) { kind = m[1]; key = m[2]; }
      else if (cap === "docs") { kind = "docs"; }
      else if (cap === "trust") { return; }
      else {
        // caption lost: recognise by header labels
        var best = null, bestScore = 0;
        var tied = [];
        S.SECTIONS.forEach(function (s) {
          var sc = matchScore(head, s.cols);
          if (sc > bestScore) { best = s; bestScore = sc; tied = [s]; } else if (sc === bestScore && sc > 0) { tied.push(s); }
        });
        if (tied.length > 1) { best = pickByHeading(tied, lastH2, lastH1) || best; }
        var fieldsSec = S.BY_KEY.fields, fcols = fieldsSec.cols.filter(function (c) { return c.p !== "message"; });
        var fsc = matchScore(head, fcols);
        if (fsc >= bestScore && fsc > 0) { kind = "fields"; key = (lastHeading.split(" — ")[0] || "").trim(); }
        else if (matchScore(head, S.STEP_COLS) > bestScore) { kind = "steps"; key = (lastHeading.split(" — ")[0] || "").trim(); }
        else if (matchScore(head, S.COLUMN_COLS) > bestScore) { kind = "cols"; key = (lastHeading.split(" — ")[0] || "").trim(); }
        else if (matchScore(head, S.DOCS_COLS) > 0 && /^D\d$/i.test((data[0] || [""])[0].trim())) { kind = "docs"; }
        else if (best) { kind = "sec"; key = best.key; }
        else if (head.length === 2 && data.length && S.KV.some(function (kv) { return kv.rows.some(function (r) { return norm(r[1]) === norm(data[0][0]) || norm(r[2]) === norm(data[0][0]); }); })) {
          var kvm = S.KV.filter(function (kv) { return kv.rows.some(function (r) { return norm(r[1]) === norm(data[0][0]) || norm(r[2]) === norm(data[0][0]); }); })[0];
          kind = "kv"; key = kvm.key;
        } else { unknown++; return; }
      }

      if (kind === "kv") {
        var kv = S.KV_BY_KEY[key]; if (!kv) { unknown++; return; }
        var target = S.getPath(model, kv.path) || {};
        data.forEach(function (r) {
          var lab = norm(r[0]);
          kv.rows.forEach(function (def) {
            if (lab === norm(def[1]) || lab === norm(def[2])) {
              var val = String(r[1] == null ? "" : r[1]).replace(/\r/g, "").trim();
              if (val || def[0] in target) { target[def[0]] = val; }
            }
          });
        });
        S.setPath(model, kv.path, target); found["kv:" + key] = true; return;
      }
      if (kind === "docs") {
        var dm = headerMap(head, S.DOCS_COLS);
        model.docs = data.map(function (r) {
          var no = parseInt(String(r[dm.no !== undefined ? dm.no : 0] || "").replace(/\D/g, ""), 10);
          var role = String(r[dm.role !== undefined ? dm.role : 2] || "");
          return no ? { no: no, name: String(r[dm.name !== undefined ? dm.name : 1] || "").trim(), role: /ek|support|extra/i.test(role) ? "extra" : "main", pages: parseInt(r[dm.pages !== undefined ? dm.pages : 3], 10) || 0 } : null;
        }).filter(Boolean);
        found.docs = true; return;
      }
      if (kind === "steps") {
        var sm = headerMap(head, S.STEP_COLS);
        steps[key] = data.map(function (r) { return { actor: S.clip(r[sm.actor], 120), action: S.clip(r[sm.action], 400), message: S.clip(r[sm.message], 80) }; }).filter(function (s) { return s.action; });
        found.steps = true; return;
      }
      if (kind === "cols") {
        var cm = headerMap(head, S.COLUMN_COLS);
        columns[key] = data.map(function (r) { return { name: S.clip(r[cm.name], 80), type: S.clip(r[cm.type], 60), nullable: S.clip(r[cm.nullable], 12), key: S.clip(r[cm.key], 40), description: S.clip(r[cm.description], 400), source: S.clip(r[cm.source], 300) }; }).filter(function (c) { return c.name; });
        found.columns = true; return;
      }
      var sec = kind === "fields" ? S.BY_KEY.fields : S.BY_KEY[key];
      if (!sec) { unknown++; return; }
      var cols = kind === "fields" ? sec.cols.filter(function (c) { return c.p !== "message"; }) : sec.cols;
      var map = headerMap(head, cols);
      if (!Object.keys(map).length) { unknown++; return; }
      var target2 = S.items(model, sec.key);
      data.forEach(function (r) {
        var it = rowToItem(r, cols, map);
        if (!it) { return; }
        if (kind === "fields") { it.message = key === "-" ? "" : key; fieldGroupsSeen = true; }
        target2.push(it);
      });
      S.setPath(model, sec.path, target2);
      found[sec.key] = true;
    });

    /* flows and data-model tables need their nested lists put back */
    S.items(model, "flows").forEach(function (f) { if (f.id && steps[f.id]) { f.steps = steps[f.id]; } else { f.steps = f.steps || []; } });
    S.items(model, "tables").forEach(function (t) { if (t.id && columns[t.id]) { t.columns = columns[t.id]; } else { t.columns = t.columns || []; } });
    if (fieldGroupsSeen) { found.fields = true; }
    if (unknown) { warnings.push({ code: "unknown_tables", count: unknown }); }
    S.assignIds(model);
    return { model: model, found: found, warnings: warnings, steps: steps, columns: columns };
  }

  /* Combine the previous model with what the Word file contained. */
  function applyImport(base, imp) {
    var out = JSON.parse(JSON.stringify(base || S.emptyModel()));
    var m = imp.model, byId = {};
    function baseItem(key, id) { return S.items(base || {}, key).filter(function (x) { return x.id === id; })[0]; }
    S.SECTIONS.forEach(function (s) {
      if (!imp.found[s.key]) { return; }
      var list = S.items(m, s.key);
      list.forEach(function (it) {
        var old = it.id ? baseItem(s.key, it.id) : null;
        if (old) {
          // keep what the Word file cannot show
          if (s.src && (!it.sources || !it.sources.length) && old.sources) { it.sources = old.sources; it.check = old.check; }
          if (s.key === "flows" && !(imp.found.steps && imp.steps[it.id])) { it.steps = old.steps || []; }
          if (s.key === "tables" && !(imp.found.columns && imp.columns[it.id])) { it.columns = old.columns || []; }
        }
        if (s.src && !it.sources) { it.sources = []; it.check = "none"; }
      });
      S.setPath(out, s.path, list);
    });
    ["meta", "info", "overview"].forEach(function (k) { if (imp.found["kv:" + k]) { out[k] = Object.assign({}, out[k] || {}, m[k]); } });
    if (imp.found["kv:accountingSummary"]) { out.accounting = out.accounting || {}; out.accounting.summary = m.accounting.summary; }
    if (imp.found.docs) { out.docs = m.docs; }
    if (base && base.meta && base.meta.background && !(out.meta && out.meta.background)) { out.meta.background = base.meta.background; }
    S.assignIds(out);
    return out;
  }

  var api = { build: build, fromBlocks: fromBlocks, applyImport: applyImport, TEXT: T };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; } else { root.SpecDoc = api; }
})(typeof window !== "undefined" ? window : globalThis);
