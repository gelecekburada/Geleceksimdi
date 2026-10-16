/*
 * BAMock — seeded fake-data generator (no real people, no real ID numbers).
 * Same seed + same fields => same rows, so test data is reproducible.
 */
(function (root) {
  "use strict";

  var POOLS = {
    en: {
      first: ["James", "Mary", "Oliver", "Emma", "Noah", "Olivia", "Liam", "Sophia", "Lucas", "Mia", "Henry", "Grace", "Jack", "Ella", "Daniel", "Chloe"],
      last: ["Smith", "Johnson", "Brown", "Taylor", "Wilson", "Clark", "Walker", "Hall", "Young", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson"],
      city: ["London", "Manchester", "Toronto", "Sydney", "Dublin", "Boston", "Seattle", "Austin", "Leeds", "Denver"],
      country: ["United Kingdom", "Canada", "Australia", "Ireland", "United States"],
      company: ["Northwind", "Contoso", "Fabrikam", "Acme Corp", "Globex", "Initech", "Umbrella Ltd", "Stark Works"]
    },
    tr: {
      first: ["Ahmet", "Ayşe", "Mehmet", "Fatma", "Mustafa", "Elif", "Emre", "Zeynep", "Can", "Selin", "Burak", "Deniz", "Cem", "Merve", "Kerem", "Ece"],
      last: ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Koç", "Kurt", "Erdoğan"],
      city: ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Eskişehir", "Trabzon"],
      country: ["Türkiye", "Almanya", "Hollanda", "Fransa", "Birleşik Krallık"],
      company: ["Anadolu Yazılım", "Boğaziçi Teknoloji", "Ege Lojistik", "Marmara Gıda", "Kızılay Elektrik", "Toros Danışmanlık", "Ortak Sistemler", "Yıldız Ticaret"]
    }
  };
  var WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(" ");
  var ASCII = { "ı": "i", "İ": "I", "ş": "s", "Ş": "S", "ğ": "g", "Ğ": "G", "ü": "u", "Ü": "U", "ö": "o", "Ö": "O", "ç": "c", "Ç": "C" };

  var TYPES = [
    "sequence", "uuid", "firstName", "lastName", "fullName", "email", "phone", "city", "country", "company",
    "int", "float", "bool", "date", "datetime", "text", "enum", "url", "ipv4"
  ];

  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ascii(s) { return s.replace(/[ıİşŞğĞüÜöÖçÇ]/g, function (c) { return ASCII[c]; }); }
  function pad(n, w) { n = String(n); while (n.length < w) { n = "0" + n; } return n; }

  function make(type, f, ctx) {
    var r = ctx.r, P = POOLS[ctx.locale] || POOLS.en;
    function pick(a) { return a[Math.floor(r() * a.length)]; }
    function int(lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }
    switch (type) {
      case "sequence": return (Number(f.start) || 1) + ctx.i;
      case "uuid": {
        var h = ""; for (var k = 0; k < 32; k++) { h += Math.floor(r() * 16).toString(16); }
        return h.slice(0, 8) + "-" + h.slice(8, 12) + "-4" + h.slice(13, 16) + "-" + "89ab"[Math.floor(r() * 4)] + h.slice(17, 20) + "-" + h.slice(20, 32);
      }
      case "firstName": return pick(P.first);
      case "lastName": return pick(P.last);
      case "fullName": return pick(P.first) + " " + pick(P.last);
      case "email": return ascii((pick(P.first) + "." + pick(P.last)).toLowerCase()) + int(1, 99) + "@example.com";
      case "phone": return ctx.locale === "tr" ? "+90 555 " + pad(int(0, 999), 3) + " " + pad(int(0, 99), 2) + " " + pad(int(0, 99), 2) : "+1 555 01" + pad(int(0, 99), 2);
      case "city": return pick(P.city);
      case "country": return pick(P.country);
      case "company": return pick(P.company);
      case "int": { var lo = f.min === undefined || f.min === "" ? 0 : Number(f.min), hi = f.max === undefined || f.max === "" ? 1000 : Number(f.max); if (hi < lo) { hi = lo; } return int(lo, hi); }
      case "float": { var l2 = f.min === undefined || f.min === "" ? 0 : Number(f.min), h2 = f.max === undefined || f.max === "" ? 1000 : Number(f.max); return Math.round((l2 + r() * (h2 - l2)) * 100) / 100; }
      case "bool": return r() < 0.5;
      case "date": case "datetime": {
        var from = Date.parse(f.min || "2024-01-01"), to = Date.parse(f.max || "2026-12-31");
        if (isNaN(from)) { from = Date.parse("2024-01-01"); }
        if (isNaN(to) || to < from) { to = from + 86400000; }
        var d = new Date(from + Math.floor(r() * (to - from + 1)));
        var iso = d.toISOString();
        return type === "date" ? iso.slice(0, 10) : iso.slice(0, 19) + "Z";
      }
      case "text": { var n = int(3, Math.max(3, Number(f.max) || 8)), w = []; for (var j = 0; j < n; j++) { w.push(pick(WORDS)); } var s = w.join(" "); return s.charAt(0).toUpperCase() + s.slice(1) + "."; }
      case "enum": { var opts = String(f.options || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); return opts.length ? pick(opts) : ""; }
      case "url": return "https://example.com/" + ascii(pick(P.last).toLowerCase()) + "/" + int(1, 9999);
      case "ipv4": return int(1, 223) + "." + int(0, 255) + "." + int(0, 255) + "." + int(1, 254);
      default: return null;
    }
  }

  function generate(fields, count, opts) {
    opts = opts || {};
    count = Math.max(0, Math.min(10000, parseInt(count, 10) || 0));
    var seed = opts.seed === undefined || opts.seed === "" ? 12345 : Number(opts.seed) || 12345;
    var r = rng(seed), rows = [];
    for (var i = 0; i < count; i++) {
      var row = {};
      fields.forEach(function (f) {
        if (!f.name) { return; }
        row[f.name] = make(f.type, f, { r: r, i: i, locale: opts.locale === "tr" ? "tr" : "en" });
      });
      rows.push(row);
    }
    return rows;
  }

  function csvCell(v) {
    if (v === null || v === undefined) { return ""; }
    var s = String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function sqlVal(v) {
    if (v === null || v === undefined) { return "NULL"; }
    if (typeof v === "number") { return String(v); }
    if (typeof v === "boolean") { return v ? "TRUE" : "FALSE"; }
    return "'" + String(v).replace(/'/g, "''") + "'";
  }
  function ident(s) { return /^[A-Za-z_][A-Za-z0-9_]*$/.test(s) ? s : '"' + s.replace(/"/g, '""') + '"'; }

  function format(rows, fmt, opts) {
    opts = opts || {};
    var cols = rows.length ? Object.keys(rows[0]) : [];
    if (fmt === "json") { return JSON.stringify(rows, null, 2); }
    if (fmt === "ndjson") { return rows.map(function (r) { return JSON.stringify(r); }).join("\n"); }
    if (fmt === "csv") {
      return [cols.map(csvCell).join(",")].concat(rows.map(function (r) { return cols.map(function (c) { return csvCell(r[c]); }).join(","); })).join("\n");
    }
    if (fmt === "sql") {
      var table = ident(opts.table || "my_table");
      return rows.map(function (r) {
        return "INSERT INTO " + table + " (" + cols.map(ident).join(", ") + ") VALUES (" + cols.map(function (c) { return sqlVal(r[c]); }).join(", ") + ");";
      }).join("\n");
    }
    throw new Error("Unknown format: " + fmt);
  }

  var PRESETS = {
    customers: [
      { name: "id", type: "sequence", start: 1 }, { name: "full_name", type: "fullName" }, { name: "email", type: "email" },
      { name: "phone", type: "phone" }, { name: "city", type: "city" }, { name: "created_at", type: "date", min: "2025-01-01", max: "2026-10-01" }, { name: "active", type: "bool" }
    ],
    orders: [
      { name: "order_id", type: "uuid" }, { name: "customer_id", type: "int", min: 1, max: 50 }, { name: "total", type: "float", min: 5, max: 500 },
      { name: "status", type: "enum", options: "new,paid,shipped,cancelled" }, { name: "ordered_at", type: "datetime", min: "2026-01-01", max: "2026-10-16" }
    ],
    employees: [
      { name: "emp_no", type: "sequence", start: 1000 }, { name: "first_name", type: "firstName" }, { name: "last_name", type: "lastName" },
      { name: "company", type: "company" }, { name: "salary_grade", type: "int", min: 1, max: 10 }, { name: "hired", type: "date", min: "2015-01-01", max: "2026-06-30" }
    ]
  };

  var api = { generate: generate, format: format, TYPES: TYPES, PRESETS: PRESETS, _rng: rng };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  if (root) { root.BAMock = api; }
})(typeof window !== "undefined" ? window : null);
