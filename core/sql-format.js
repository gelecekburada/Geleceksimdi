/*
 * BASqlFormat — a dependency-free SQL beautifier / minifier.
 * Dialect-neutral: handles the common SELECT / INSERT / UPDATE / DELETE /
 * CREATE TABLE shapes, CTEs, subqueries, joins, CASE and comments.
 * It only changes whitespace and (optionally) keyword case; it never
 * reorders or rewrites the statement.
 */
(function (root) {
  "use strict";

  var KEYWORDS = ("SELECT FROM WHERE GROUP BY ORDER HAVING LIMIT OFFSET FETCH UNION ALL INTERSECT EXCEPT MINUS " +
    "INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ALTER DROP INDEX VIEW AS ON JOIN INNER LEFT RIGHT FULL OUTER CROSS NATURAL " +
    "AND OR NOT IN IS NULL LIKE ILIKE BETWEEN EXISTS ANY SOME DISTINCT TOP CASE WHEN THEN ELSE END ASC DESC WITH RECURSIVE " +
    "PRIMARY KEY FOREIGN REFERENCES UNIQUE CHECK DEFAULT CONSTRAINT IF ADD COLUMN RETURNING USING OVER PARTITION " +
    "ROWS RANGE UNBOUNDED PRECEDING FOLLOWING CURRENT ROW TRUE FALSE TRUNCATE BEGIN COMMIT ROLLBACK").split(" ");

  var FUNCTIONS = ("COUNT SUM AVG MIN MAX COALESCE NULLIF IFNULL ISNULL CAST CONVERT UPPER LOWER TRIM LTRIM RTRIM LENGTH LEN SUBSTRING SUBSTR " +
    "CONCAT REPLACE ROUND FLOOR CEIL CEILING ABS NOW GETDATE DATE YEAR MONTH DAY EXTRACT ROW_NUMBER RANK DENSE_RANK LAG LEAD " +
    "STRING_AGG GROUP_CONCAT ARRAY_AGG").split(" ");

  var kwSet = {}, fnSet = {};
  KEYWORDS.forEach(function (k) { kwSet[k] = true; });
  FUNCTIONS.forEach(function (k) { fnSet[k] = true; });

  /* Clauses that start a new line at the current base indent. Longest first. */
  var CLAUSES = [
    "UNION ALL", "INTERSECT ALL", "EXCEPT ALL", "UNION", "INTERSECT", "EXCEPT", "MINUS",
    "INSERT INTO", "DELETE FROM", "GROUP BY", "ORDER BY", "PARTITION BY",
    "SELECT", "FROM", "WHERE", "HAVING", "LIMIT", "OFFSET", "FETCH", "VALUES", "UPDATE", "SET", "RETURNING",
    "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "CREATE VIEW", "CREATE INDEX", "TRUNCATE TABLE", "WITH"
  ];

  var JOINS = [
    "NATURAL LEFT OUTER JOIN", "NATURAL RIGHT OUTER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN",
    "NATURAL LEFT JOIN", "NATURAL RIGHT JOIN", "NATURAL JOIN", "CROSS JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "JOIN"
  ];

  var LIST_CLAUSES = { "SELECT": 1, "GROUP BY": 1, "ORDER BY": 1, "SET": 1, "RETURNING": 1 };

  /* ----------------------------- tokenizer ----------------------------- */

  function tokenize(sql) {
    var tokens = [], i = 0, n = sql.length;
    while (i < n) {
      var c = sql.charAt(i);
      if (/\s/.test(c)) { i++; continue; }

      if (c === "-" && sql.charAt(i + 1) === "-") {
        var e = sql.indexOf("\n", i);
        if (e === -1) { e = n; }
        tokens.push({ t: "linecomment", v: sql.slice(i, e).replace(/\s+$/, "") });
        i = e; continue;
      }
      if (c === "/" && sql.charAt(i + 1) === "*") {
        var e2 = sql.indexOf("*/", i + 2);
        if (e2 === -1) { e2 = n - 2; }
        tokens.push({ t: "blockcomment", v: sql.slice(i, e2 + 2) });
        i = e2 + 2; continue;
      }
      if (c === "'") {
        var j = i + 1;
        while (j < n) {
          if (sql.charAt(j) === "'") {
            if (sql.charAt(j + 1) === "'") { j += 2; continue; }
            break;
          }
          j++;
        }
        tokens.push({ t: "string", v: sql.slice(i, j + 1) });
        i = j + 1; continue;
      }
      if (c === '"' || c === "`" || c === "[") {
        var close = c === "[" ? "]" : c;
        var k = sql.indexOf(close, i + 1);
        if (k === -1) { k = n - 1; }
        tokens.push({ t: "quoted", v: sql.slice(i, k + 1) });
        i = k + 1; continue;
      }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(sql.charAt(i + 1)))) {
        var m = /^(?:0x[0-9a-fA-F]+|\d*\.?\d+(?:[eE][+-]?\d+)?)/.exec(sql.slice(i));
        tokens.push({ t: "number", v: m[0] });
        i += m[0].length; continue;
      }
      if (/[A-Za-z_@#$À-￿]/.test(c)) {
        var w = /^[A-Za-z0-9_@#$À-￿]+/.exec(sql.slice(i))[0];
        tokens.push({ t: "word", v: w });
        i += w.length; continue;
      }
      if (c === "(" || c === ")" || c === "," || c === ";" || c === ".") {
        tokens.push({ t: c, v: c });
        i++; continue;
      }
      var op = /^(?:<=>|<>|!=|<=|>=|\|\||::|->>|->|=>|:=|[+\-*\/%=<>!&|^~?:])/.exec(sql.slice(i));
      if (op) {
        tokens.push({ t: "op", v: op[0] });
        i += op[0].length; continue;
      }
      tokens.push({ t: "op", v: c });
      i++;
    }
    return tokens;
  }

  /* Merge multi-word clauses and joins into single "clause"/"join" tokens. */
  function groupClauses(tokens) {
    var out = [], i = 0;
    function words(from, count) {
      var parts = [];
      for (var x = from; x < tokens.length && parts.length < count; x++) {
        if (tokens[x].t !== "word") { return null; }
        parts.push(tokens[x].v.toUpperCase());
      }
      return parts.length === count ? parts : null;
    }
    while (i < tokens.length) {
      var tk = tokens[i], matched = false;
      if (tk.t === "word") {
        var lists = [["join", JOINS], ["clause", CLAUSES]];
        for (var li = 0; li < lists.length && !matched; li++) {
          var kind = lists[li][0], list = lists[li][1];
          for (var ci = 0; ci < list.length; ci++) {
            var parts = list[ci].split(" ");
            var got = words(i, parts.length);
            if (got && got.join(" ") === list[ci]) {
              out.push({ t: kind, v: list[ci], orig: tokens.slice(i, i + parts.length).map(function (x) { return x.v; }).join(" ") });
              i += parts.length;
              matched = true;
              break;
            }
          }
        }
      }
      if (!matched) { out.push(tk); i++; }
    }
    return out;
  }

  /* ----------------------------- formatter ----------------------------- */

  function format(sql, opts) {
    opts = opts || {};
    var indentUnit = opts.indent === "tab" ? "\t" : new Array((opts.indent === undefined ? 2 : opts.indent) + 1).join(" ");
    var keywordCase = opts.keywordCase || "upper"; /* upper | lower | keep */
    var leadingComma = opts.comma === "leading";

    if (typeof sql !== "string" || !sql.trim()) { throw new Error("Input is empty"); }

    var tokens = groupClauses(tokenize(sql));
    var lines = [];
    var line = "";
    var stack = []; /* paren contexts */
    var clause = "";
    var caseDepth = 0;
    var betweenPending = false;
    var prev = null;

    function ind(l) { var s = ""; for (var q = 0; q < l; q++) { s += indentUnit; } return s; }

    function flush() {
      if (line.trim() !== "") { lines.push(line.replace(/\s+$/, "")); }
      line = "";
    }

    function newline(l) {
      flush();
      line = ind(l);
    }

    function kw(v) {
      if (keywordCase === "upper") { return v.toUpperCase(); }
      if (keywordCase === "lower") { return v.toLowerCase(); }
      return v;
    }

    function textOf(tk, next) {
      if (tk.t === "clause" || tk.t === "join") { return kw(tk.orig || tk.v); }
      if (tk.t === "word") {
        var up = tk.v.toUpperCase();
        if (kwSet[up]) { return kw(tk.v); }
        if (next && next.t === "(" && fnSet[up]) { return kw(tk.v); }
        return tk.v;
      }
      return tk.v;
    }

    function append(str, tk) {
      var cur = line;
      var needSpace = true;
      if (cur.trim() === "") { needSpace = false; }
      else if (tk.t === "," || tk.t === ")" || tk.t === ";" || tk.t === ".") { needSpace = false; }
      else if (prev && (prev.t === "(" || prev.t === ".")) { needSpace = false; }
      else if (tk.t === "(" && prev && (prev.t === "word" && !kwSet[prev.v.toUpperCase()] || prev.t === "quoted") &&
               !((clause === "INSERT INTO" || clause === "CREATE TABLE") && !stack.length)) { needSpace = false; }
      else if (tk.t === "(" && prev && prev.t === "word" && fnSet[prev.v.toUpperCase()]) { needSpace = false; }
      else if (tk.t === "op" && tk.v === "::") { needSpace = false; }
      else if (prev && prev.t === "op" && prev.v === "::") { needSpace = false; }
      line += (needSpace ? " " : "") + str;
    }

    function base() { return stack.length ? stack[stack.length - 1].base : 0; }
    function inInline() { return stack.length && stack[stack.length - 1].kind === "inline"; }

    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i], next = tokens[i + 1];
      var up = tk.t === "word" ? tk.v.toUpperCase() : "";

      if (tk.t === "linecomment") {
        if (line.trim() !== "") { line += " " + tk.v; flush(); line = ind(base() + (clause && LIST_CLAUSES[clause] ? 1 : 0)); }
        else { line = ind(base()) + tk.v; flush(); }
        prev = tk; continue;
      }
      if (tk.t === "blockcomment") { append(tk.v, tk); prev = tk; continue; }

      if (tk.t === ";") {
        append(";", tk);
        flush();
        if (!stack.length) { lines.push(""); }
        clause = ""; caseDepth = 0;
        prev = tk; continue;
      }

      if (tk.t === "clause") {
        var inl = inInline();
        if (!inl) {
          newline(base());
          clause = tk.v;
          if (tk.v === "WITH") { clause = "WITH"; }
        }
        append(textOf(tk), tk);
        if (!inl && LIST_CLAUSES[tk.v]) { newline(base() + 1); }
        prev = tk; continue;
      }

      if (tk.t === "join") {
        if (!inInline()) { newline(base()); clause = "JOIN"; }
        append(textOf(tk), tk);
        prev = tk; continue;
      }

      if (tk.t === "word" && up === "ON" && !inInline() && (clause === "JOIN" || clause === "FROM")) {
        newline(base() + 1);
        clause = "ON";
        append(textOf(tk), tk);
        prev = tk; continue;
      }

      if (tk.t === "word" && up === "BETWEEN") { betweenPending = true; }

      if (tk.t === "word" && (up === "AND" || up === "OR") && !inInline() && caseDepth === 0 &&
          (clause === "WHERE" || clause === "HAVING" || clause === "ON" || clause === "JOIN")) {
        if (up === "AND" && betweenPending) {
          betweenPending = false;
          append(textOf(tk), tk);
        } else {
          newline(base() + 1);
          append(textOf(tk), tk);
        }
        prev = tk; continue;
      }

      if (tk.t === "word" && up === "CASE") {
        caseDepth++;
        append(textOf(tk), tk);
        stack.push({ kind: "case", base: base(), lineLevel: currentLevelOfLine() });
        prev = tk; continue;
      }
      if (tk.t === "word" && stack.length && stack[stack.length - 1].kind === "case") {
        var ctx = stack[stack.length - 1];
        if (up === "WHEN" || up === "ELSE") {
          newline(ctx.lineLevel + 1);
          append(textOf(tk), tk);
          prev = tk; continue;
        }
        if (up === "END") {
          newline(ctx.lineLevel);
          append(textOf(tk), tk);
          stack.pop(); caseDepth--;
          prev = tk; continue;
        }
      }

      if (tk.t === "(") {
        var isSub = next && (next.t === "clause" && next.v === "SELECT" || (next.t === "word" && next.v.toUpperCase() === "SELECT"));
        var isWith = next && next.t === "clause" && next.v === "SELECT";
        if (isSub || isWith) {
          append("(", tk);
          stack.push({ kind: "sub", base: base() + 1, outerClause: clause });
          clause = "";
        } else if (clause === "CREATE TABLE" && !stack.length) {
          append("(", tk);
          stack.push({ kind: "create", base: base() });
          newline(base() + 1);
        } else {
          append("(", tk);
          stack.push({ kind: "inline", base: base(), outerClause: clause });
        }
        prev = tk; continue;
      }

      if (tk.t === ")") {
        var top = stack.pop();
        if (top && (top.kind === "sub")) {
          newline(top.base - 1);
          clause = top.outerClause || "";
          append(")", tk);
        } else if (top && top.kind === "create") {
          newline(top.base);
          append(")", tk);
        } else {
          append(")", tk);
          if (top) { clause = top.outerClause || clause; }
        }
        prev = tk; continue;
      }

      if (tk.t === ",") {
        var topc = stack.length ? stack[stack.length - 1] : null;
        if (topc && topc.kind === "inline") { append(",", tk); prev = tk; continue; }
        if (topc && topc.kind === "case") { append(",", tk); prev = tk; continue; }
        var listMode = (topc && topc.kind === "create") || LIST_CLAUSES[clause] || clause === "VALUES" || clause === "FROM" || clause === "WITH";
        if (listMode) {
          var lvl = (topc && topc.kind === "create") ? topc.base + 1 : base() + (clause === "WITH" ? 0 : 1);
          if (leadingComma && (topc && topc.kind === "create" || LIST_CLAUSES[clause])) {
            newline(lvl);
            line += ", ";
            prev = { t: "(" }; /* no extra space after the leading comma */
            continue;
          }
          append(",", tk);
          newline(lvl);
        } else {
          append(",", tk);
        }
        prev = tk; continue;
      }

      append(textOf(tk, next), tk);
      prev = tk;
    }
    flush();
    while (lines.length && lines[lines.length - 1] === "") { lines.pop(); }
    return lines.join("\n");

    function currentLevelOfLine() {
      var m = /^[\t ]*/.exec(line)[0];
      if (!m) { return 0; }
      return indentUnit === "\t" ? m.length : Math.round(m.length / indentUnit.length);
    }
  }

  function minify(sql) {
    if (typeof sql !== "string" || !sql.trim()) { throw new Error("Input is empty"); }
    var tokens = tokenize(sql).filter(function (t) { return t.t !== "linecomment" && t.t !== "blockcomment"; });
    var out = "", prev = null;
    tokens.forEach(function (tk) {
      var space = out !== "";
      if (tk.t === "," || tk.t === ")" || tk.t === ";" || tk.t === ".") { space = false; }
      if (prev && (prev.t === "(" || prev.t === ".")) { space = false; }
      if (tk.t === "(" && prev && (prev.t === "word" && !kwSet[prev.v.toUpperCase()] || prev.t === "quoted")) { space = false; }
      if (tk.t === "(" && prev && prev.t === "word" && fnSet[prev.v.toUpperCase()]) { space = false; }
      out += (space ? " " : "") + tk.v;
      prev = tk;
    });
    return out;
  }

  var api = { format: format, minify: minify, _tokenize: tokenize };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  if (root) { root.BASqlFormat = api; }
})(typeof window !== "undefined" ? window : null);
