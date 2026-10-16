/*
 * SpecReport — turns the analysis state into the blocks DocxLite writes as a Word document.
 * Rejected items are left out. Every row says where it comes from (document page, quote
 * check result) or that it is a proposal the analyst still has to confirm.
 */
(function (root) {
  "use strict";

  var T = {
    tr: {
      title: "Fonksiyonel Analiz Dokümanı", docNo: "Doküman", sources: "Kaynak dokümanlar", main: "ana kaynak", extra: "ek doküman", pages: "sayfa",
      prepared: "Hazırlayan", date: "Tarih", status: "Durum", pending: "Onay bekliyor", approved: "Onaylandı",
      howTitle: "Bu doküman nasıl okunmalı",
      how1: "**Doküman** etiketli satırlar kaynak PDF'ten çıkarılmıştır; \"Kaynak\" sütunu sayfayı gösterir. ✓ işareti, yapay zekânın verdiği alıntının PDF metninde gerçekten bulunduğunu; ⚠ işareti bulunamadığını gösterir (elle kontrol edin).",
      how2: "**Öneri** etiketli satırlar kaynak dokümanda yer almaz. Analist tarafından hazırlanmış önerilerdir ve iş birimi onayına tabidir.",
      how3: "Reddedilen satırlar bu dokümana alınmamıştır. \"Onay bekliyor\" durumundaki satırlar henüz gözden geçirilmemiştir.",
      trust: "Güven özeti", counts: "Çıkarılan öğe sayısı", unverified: "Alıntısı doğrulanamayan öğe", proposals: "Öneri niteliğindeki satır", decided: "Gözden geçirilen", total: "toplam",
      s1: "Amaç ve kapsam", purpose: "Amaç", scope: "Kapsam", outOfScope: "Kapsam dışı", actors: "Aktörler", assumptions: "Varsayımlar",
      s2: "Mesaj kataloğu", code: "Kod", name: "Ad", direction: "Yön", purposeShort: "Amaç", trigger: "Tetikleyici", source: "Kaynak",
      s3: "Alan tanımları", message: "Mesaj", path: "Alan / XML yolu", type: "Tip", length: "Uzunluk", occ: "Adet", presence: "Z/O/K", values: "Değerler / biçim", desc: "Açıklama ve kurallar",
      presenceNote: "Z: zorunlu, O: opsiyonel, K: koşullu.",
      s4: "İş kuralları ve doğrulamalar", id: "No", category: "Kategori", rule: "Kural", cond: "Koşul → Aksiyon", err: "Hata kodu",
      s5: "Kısıtlar ve limitler", kind: "Tür", statement: "İfade", value: "Değer",
      s6: "Hata kodları", description: "Açıklama", cause: "Neden", handling: "Ele alma",
      s7: "Süreç akışları", s8: "Muhasebe entegrasyonu", entry: "Muhasebe kaydı", event: "Olay", debit: "Borç", credit: "Alacak", amount: "Tutar", timing: "Zamanlama", notes: "Not", origin: "Tür",
      receipt: "Dekont", returns: "İade işlemleri", recon: "Mutabakat", item: "Konu", detail: "Ayrıntı",
      s9: "Onay akışları", step: "Adım", who: "Kim", condition: "Koşul",
      s10: "Rol ve ekran bazlı yetki matrisi", role: "Rol", screen: "Ekran / işlem", rights: "Haklar",
      s11: "Ekran gereksinimleri", purposeS: "Amaç", fields: "Alanlar", actions: "Aksiyonlar",
      s12: "Bildirimler", channel: "Kanal", to: "Alıcı", s13: "Denetim izi ve fonksiyonel olmayan gereksinimler", audit: "Denetim izi", nfr: "Fonksiyonel olmayan gereksinimler",
      s14: "Test senaryoları", steps: "Adımlar", expected: "Beklenen sonuç", refs: "İlgili kural",
      s15: "Dokümandaki boşluklar ve belirsizlikler", gaps: "Boşluk / çelişki", ambig: "Belirsiz ifadeler",
      s16: "Açık sorular", question: "Soru", why: "Neden gerekli", owner: "Sorumlu",
      s17: "Sözlük", term: "Terim", definition: "Tanım",
      docKind: "Doküman", propKind: "Öneri", none: "Bu bölümde onaylanmış veya bekleyen kayıt yok.", notChecked: "doğrulanamadı",
      cat: { validation: "Doğrulama", format: "Biçim", business: "İş kuralı", timing: "Zamanlama", limit: "Limit", security: "Güvenlik", "error-handling": "Hata yönetimi", reconciliation: "Mutabakat", other: "Diğer" }
    },
    en: {
      title: "Functional Analysis Document", docNo: "Document", sources: "Source documents", main: "main source", extra: "supporting document", pages: "pages",
      prepared: "Prepared by", date: "Date", status: "Status", pending: "Pending approval", approved: "Approved",
      howTitle: "How to read this document",
      how1: "Rows tagged **Document** were extracted from the source PDF; the \"Source\" column shows the page. ✓ means the quote given by the AI was found in the PDF text; ⚠ means it was not found (check manually).",
      how2: "Rows tagged **Proposal** are not in the source document. They are analyst proposals and need business approval.",
      how3: "Rejected rows are not included. Rows marked \"Pending approval\" have not been reviewed yet.",
      trust: "Confidence summary", counts: "Items extracted", unverified: "Items whose quote could not be verified", proposals: "Proposal rows", decided: "Reviewed", total: "total",
      s1: "Purpose and scope", purpose: "Purpose", scope: "Scope", outOfScope: "Out of scope", actors: "Actors", assumptions: "Assumptions",
      s2: "Message catalogue", code: "Code", name: "Name", direction: "Direction", purposeShort: "Purpose", trigger: "Trigger", source: "Source",
      s3: "Field definitions", message: "Message", path: "Field / XML path", type: "Type", length: "Length", occ: "Occurs", presence: "M/O/C", values: "Values / format", desc: "Description and rules",
      presenceNote: "M: mandatory, O: optional, C: conditional.",
      s4: "Business rules and validations", id: "ID", category: "Category", rule: "Rule", cond: "Condition → Action", err: "Error code",
      s5: "Constraints and limits", kind: "Kind", statement: "Statement", value: "Value",
      s6: "Error codes", description: "Description", cause: "Cause", handling: "Handling",
      s7: "Process flows", s8: "Accounting integration", entry: "Accounting entries", event: "Event", debit: "Debit", credit: "Credit", amount: "Amount", timing: "Timing", notes: "Note", origin: "Type",
      receipt: "Receipt (dekont)", returns: "Returns", recon: "Reconciliation", item: "Topic", detail: "Detail",
      s9: "Approval flows", step: "Step", who: "Who", condition: "Condition",
      s10: "Role and screen authorization matrix", role: "Role", screen: "Screen / action", rights: "Rights",
      s11: "Screen requirements", purposeS: "Purpose", fields: "Fields", actions: "Actions",
      s12: "Notifications", channel: "Channel", to: "Recipient", s13: "Audit trail and non-functional requirements", audit: "Audit trail", nfr: "Non-functional requirements",
      s14: "Test scenarios", steps: "Steps", expected: "Expected result", refs: "Related rule",
      s15: "Gaps and ambiguities in the document", gaps: "Gap / contradiction", ambig: "Unclear statements",
      s16: "Open questions", question: "Question", why: "Why it matters", owner: "Owner",
      s17: "Glossary", term: "Term", definition: "Definition",
      docKind: "Document", propKind: "Proposal", none: "No approved or pending records in this section.", notChecked: "not verified",
      cat: { validation: "Validation", format: "Format", business: "Business rule", timing: "Timing", limit: "Limit", security: "Security", "error-handling": "Error handling", reconciliation: "Reconciliation", other: "Other" }
    }
  };

  function live(list) { return (list || []).filter(function (x) { return x && x.status !== "rejected"; }); }

  function src(it, L) {
    if (!it.sources || !it.sources.length) { return ""; }
    var s = it.sources.map(function (x) { return "D" + x.doc + (x.page ? " s." + x.page : ""); }).join(", ");
    var mark = it.check === "ok" ? " ✓" : it.check === "other" ? " ✓ (s." + it.checkPage + ")" : it.check === "missing" ? " ⚠" : "";
    return s + mark;
  }

  function stat(it, L) { return it.status === "approved" ? L.approved : L.pending; }
  function kind(it, L) { return it.origin === "document" ? L.docKind : L.propKind; }
  function withNote(text, it) { return it.note ? text + "\n**Not:** " + it.note : text; }

  function build(state, lang) {
    var L = T[lang === "en" ? "en" : "tr"];
    var m = state.merged || {}, sy = state.synth || null, meta = state.meta || {};
    var docs = state.docs || [];
    var blocks = [];

    function section(title, rows, head, widths, extraNote) {
      blocks.push({ t: "h1", text: title });
      if (extraNote) { blocks.push({ t: "p", text: extraNote }); }
      if (!rows.length) { blocks.push({ t: "note", text: L.none }); return; }
      blocks.push({ t: "table", head: head, rows: rows, widths: widths });
    }

    /* cover facts */
    var facts = [];
    docs.forEach(function (d) { facts.push(["D" + d.no, d.name + " (" + (d.role === "extra" ? L.extra : L.main) + ", " + d.pages + " " + L.pages + ")"]); });
    var info = m.info || {};
    if (info.title) { facts.push([L.docNo, [info.title, info.version, info.date, info.publisher].filter(Boolean).join(" · ")]); }
    if (meta.author) { facts.push([L.prepared, meta.author]); }
    facts.push([L.date, meta.date || new Date().toISOString().slice(0, 10)]);
    blocks.push({ t: "h2", text: L.sources });
    blocks.push({ t: "table", head: [L.docNo, ""], rows: facts, widths: [18, 82] });

    blocks.push({ t: "h2", text: L.howTitle });
    blocks.push({ t: "bullets", items: [L.how1, L.how2, L.how3] });

    /* confidence summary */
    var kinds = ["messages", "fields", "rules", "constraints", "errors", "flows", "glossary"];
    var cnt = 0, bad = 0, decided = 0, all = 0, props = 0;
    kinds.forEach(function (k) {
      (m[k] || []).forEach(function (it) { if (it.status === "rejected") { return; } cnt++; all++; if (it.check === "missing") { bad++; } if (it.status === "approved") { decided++; } });
    });
    if (sy) {
      [sy.accounting.entries, sy.accounting.receipt, sy.accounting.returns, sy.accounting.reconciliation, sy.approvals, sy.authorization, sy.screens, sy.notifications].forEach(function (list) {
        live(list).forEach(function (it) { if (it.origin !== "document") { props++; } all++; if (it.status === "approved") { decided++; } });
      });
    }
    blocks.push({ t: "h2", text: L.trust });
    blocks.push({ t: "table", head: ["", ""], widths: [60, 40], rows: [[L.counts, String(cnt)], [L.unverified, String(bad)], [L.proposals, String(props)], [L.decided, decided + " / " + all + " " + L.total]] });
    blocks.push({ t: "pagebreak" });

    /* 1 overview */
    if (sy) {
      blocks.push({ t: "h1", text: L.s1 });
      var o = sy.overview;
      if (o.purpose) { blocks.push({ t: "h3", text: L.purpose }); blocks.push({ t: "p", text: o.purpose }); }
      if (o.scope) { blocks.push({ t: "h3", text: L.scope }); blocks.push({ t: "p", text: o.scope }); }
      if (o.outOfScope) { blocks.push({ t: "h3", text: L.outOfScope }); blocks.push({ t: "p", text: o.outOfScope }); }
      if (o.actors.length) { blocks.push({ t: "h3", text: L.actors }); blocks.push({ t: "table", head: [L.name, L.role], widths: [25, 75], rows: o.actors.map(function (a) { return [a.name, a.role]; }) }); }
      if (o.assumptions.length) { blocks.push({ t: "h3", text: L.assumptions }); blocks.push({ t: "bullets", items: o.assumptions }); }
    }

    /* 2 messages */
    section(L.s2, live(m.messages).map(function (x) { return [x.id, x.code, x.name, x.direction, withNote(x.purpose + (x.trigger ? "\n**" + L.trigger + ":** " + x.trigger : ""), x), src(x, L), stat(x, L)]; }),
      [L.id, L.code, L.name, L.direction, L.purposeShort, L.source, L.status], [6, 11, 18, 12, 33, 10, 10]);

    /* 3 fields */
    section(L.s3, live(m.fields).map(function (x) {
      return [x.id, x.message, (x.path || x.name) + (x.path && x.name && x.name !== x.path ? "\n" + x.name : ""), x.type, x.length, x.occurrence, x.presence,
        [x.allowed, x.format].filter(Boolean).join("\n"), withNote([x.description, x.rules].filter(Boolean).join("\n"), x), src(x, L), stat(x, L)];
    }), [L.id, L.message, L.path, L.type, L.length, L.occ, L.presence, L.values, L.desc, L.source, L.status], [5, 7, 19, 8, 7, 5, 5, 14, 18, 6, 6], L.presenceNote);

    /* 4 rules */
    section(L.s4, live(m.rules).map(function (x) {
      return [x.id, L.cat[x.category] || x.category, withNote((x.title ? "**" + x.title + "**\n" : "") + x.statement, x), [x.condition, x.action].filter(Boolean).join(" → "), x.errorCode, src(x, L), stat(x, L)];
    }), [L.id, L.category, L.rule, L.cond, L.err, L.source, L.status], [6, 9, 40, 20, 6, 9, 10]);

    /* 5 constraints, 6 errors */
    section(L.s5, live(m.constraints).map(function (x) { return [x.id, x.kind, withNote(x.statement, x), x.value, src(x, L), stat(x, L)]; }), [L.id, L.kind, L.statement, L.value, L.source, L.status], [6, 10, 50, 12, 11, 11]);
    section(L.s6, live(m.errors).map(function (x) { return [x.id, x.code, x.description, x.cause, x.handling, src(x, L), stat(x, L)]; }), [L.id, L.code, L.description, L.cause, L.handling, L.source, L.status], [6, 8, 28, 22, 22, 7, 7]);

    /* 7 flows */
    blocks.push({ t: "h1", text: L.s7 });
    var flows = live(m.flows);
    if (!flows.length) { blocks.push({ t: "note", text: L.none }); }
    flows.forEach(function (f) {
      blocks.push({ t: "h3", text: f.id + " — " + f.name + "  (" + src(f, L) + ")" });
      blocks.push({ t: "numbered", items: f.steps.map(function (s) { return (s.actor ? "**" + s.actor + ":** " : "") + s.action + (s.message ? " [" + s.message + "]" : ""); }) });
    });

    if (sy) {
      /* 8 accounting */
      blocks.push({ t: "h1", text: L.s8 });
      if (sy.accounting.summary) { blocks.push({ t: "p", text: sy.accounting.summary }); }
      function sub(title, list, head, rowFn, widths) {
        blocks.push({ t: "h2", text: title });
        var rows = live(list).map(rowFn);
        if (!rows.length) { blocks.push({ t: "note", text: L.none }); } else { blocks.push({ t: "table", head: head, rows: rows, widths: widths }); }
      }
      sub(L.entry, sy.accounting.entries, [L.id, L.event, L.debit, L.credit, L.amount, L.timing, L.notes, L.origin, L.status],
        function (x) { return [x.id, x.event, x.debit, x.credit, x.amount, x.timing, withNote(x.notes + (x.refs.length ? "\n(" + x.refs.join(", ") + ")" : ""), x), kind(x, L), stat(x, L)]; }, [6, 17, 13, 13, 12, 12, 14, 7, 6]);
      [[L.receipt, sy.accounting.receipt], [L.returns, sy.accounting.returns], [L.recon, sy.accounting.reconciliation]].forEach(function (p) {
        sub(p[0], p[1], [L.id, L.item, L.detail, L.origin, L.status], function (x) { return [x.id, x.item, withNote(x.detail + (x.refs.length ? "\n(" + x.refs.join(", ") + ")" : ""), x), kind(x, L), stat(x, L)]; }, [7, 25, 52, 8, 8]);
      });

      section(L.s9, live(sy.approvals).map(function (x) { return [x.id, x.step, withNote(x.rule, x), x.who, x.condition, kind(x, L), stat(x, L)]; }), [L.id, L.step, L.rule, L.who, L.condition, L.origin, L.status], [6, 18, 35, 14, 15, 6, 6]);
      section(L.s10, live(sy.authorization).map(function (x) { return [x.id, x.role, x.screen, x.rights, withNote(x.note, x), kind(x, L), stat(x, L)]; }), [L.id, L.role, L.screen, L.rights, L.notes, L.origin, L.status], [6, 16, 24, 20, 22, 6, 6]);
      section(L.s11, live(sy.screens).map(function (x) { return [x.id, x.name, x.purpose, x.fields, x.actions, withNote(x.rules, x), kind(x, L), stat(x, L)]; }), [L.id, L.name, L.purposeS, L.fields, L.actions, L.rule, L.origin, L.status], [6, 14, 18, 20, 12, 18, 6, 6]);
      section(L.s12, live(sy.notifications).map(function (x) { return [x.id, x.event, x.channel, x.to, withNote(x.note, x), kind(x, L), stat(x, L)]; }), [L.id, L.event, L.channel, L.to, L.notes, L.origin, L.status], [6, 28, 12, 18, 24, 6, 6]);

      blocks.push({ t: "h1", text: L.s13 });
      if (sy.audit.length) { blocks.push({ t: "h3", text: L.audit }); blocks.push({ t: "bullets", items: sy.audit }); }
      if (sy.nonFunctional.length) { blocks.push({ t: "h3", text: L.nfr }); blocks.push({ t: "bullets", items: sy.nonFunctional }); }
      if (!sy.audit.length && !sy.nonFunctional.length) { blocks.push({ t: "note", text: L.none }); }

      section(L.s14, live(sy.tests).map(function (x) { return [x.id, x.title, x.steps, x.expected, x.refs.join(", "), stat(x, L)]; }), [L.id, L.name, L.steps, L.expected, L.refs, L.status], [6, 20, 32, 24, 10, 8]);

      blocks.push({ t: "h1", text: L.s15 });
      var gaps = live(sy.gaps), amb = live(m.ambiguities);
      if (!gaps.length && !amb.length) { blocks.push({ t: "note", text: L.none }); }
      if (gaps.length) { blocks.push({ t: "h3", text: L.gaps }); blocks.push({ t: "table", head: [L.id, L.gaps, L.refs, L.status], widths: [8, 70, 12, 10], rows: gaps.map(function (x) { return [x.id, withNote(x.text, x), x.refs.join(", "), stat(x, L)]; }) }); }
      if (amb.length) { blocks.push({ t: "h3", text: L.ambig }); blocks.push({ t: "table", head: [L.id, L.ambig, L.source, L.status], widths: [8, 70, 12, 10], rows: amb.map(function (x) { return [x.id, withNote(x.text, x), src(x, L), stat(x, L)]; }) }); }

      section(L.s16, live(sy.questions).map(function (x) { return [x.id, x.question, x.why, x.owner, stat(x, L)]; }), [L.id, L.question, L.why, L.owner, L.status], [6, 40, 28, 14, 12]);
    }

    section(L.s17, live(m.glossary).map(function (x) { return [x.term, x.definition, src(x, L)]; }), [L.term, L.definition, L.source], [20, 68, 12]);

    return { title: meta.title || L.title, subtitle: (info.title ? info.title + " — " : "") + (meta.date || new Date().toISOString().slice(0, 10)), footer: "BAForge AI · " + (meta.title || L.title), landscape: true, blocks: blocks };
  }

  var api = { build: build, TEXT: T };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; } else { root.SpecReport = api; }
})(typeof window !== "undefined" ? window : globalThis);
