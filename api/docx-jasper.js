/*
 * POST /api/docx-jasper  { instruction, outline, language }  ->  { ok, rules, summary[], unsupported[] }
 *
 * Turns a plain-language formatting instruction for the Word -> JasperReports converter
 * ("body text 10pt, headings bold and blue, margins 2 cm") into the small rule object that
 * core/docx-jrxml.js applies. Only the instruction and a short outline of the document's shape
 * (heading levels, fonts, sizes, whether it has tables) are sent to the AI, never the document text.
 */
"use strict";

const { cleanRules } = require("../core/docx-jrxml.js");

const MAX_INSTRUCTION = 2000;

function clip(v, n) { return String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, n); }

function buildPrompt(instruction, outline, lang) {
  return `You configure a converter that turns a Word document into a JasperReports report template.
The user wrote formatting instructions. Translate them into JSON settings. You never see the document text, only its outline.

Document outline (JSON): ${JSON.stringify(outline)}

Return ONLY a JSON object, no markdown, with these optional keys:
{
  "rules": [ {
    "target": "all" | "body" | "headings" | "heading1".."heading6" | "title" | "lists" | "tables" | "tableHeader" | "tableBody" | "header" | "footer",
    "contains": "only paragraphs or cells that contain this text (optional)",
    "fontSize": points (number), "fontSizeDelta": points to add or subtract, "fontScale": factor (1.2 = 20% bigger),
    "fontName": "font family", "bold": true|false, "italic": true|false, "underline": true|false, "strike": true|false, "uppercase": true,
    "color": "#RRGGBB", "background": "#RRGGBB" (table cells only), "align": "left"|"center"|"right"|"justify",
    "spaceBefore": points, "spaceAfter": points, "lineSpacing": factor (1 = single, 1.5, 2)
  } ],
  "page": { "size": "A3"|"A4"|"A5"|"Letter"|"Legal", "orientation": "portrait"|"landscape", "marginsMm": { "top": mm, "bottom": mm, "left": mm, "right": mm } },
  "tables": { "borders": true|false, "borderWidth": points, "borderColor": "#RRGGBB" },
  "remove": { "images": true, "header": true, "footer": true, "pageBreaks": true, "emptyParagraphs": true },
  "replace": [ { "find": "exact text", "replace": "new text" } ],
  "summary": [ "one short line per change you made, in ${lang === "tr" ? "Turkish" : "English"}" ],
  "unsupported": [ "each requested thing you could NOT express with these settings, in ${lang === "tr" ? "Turkish" : "English"}" ]
}

Rules:
- Use only the keys above. Leave out anything the user did not ask for.
- "body" = normal paragraphs and list items (not headings, title, tables, header, footer). "all" = everything.
- Order rules from general to specific; later rules override earlier ones.
- "yazı", "metin", "text", "font size" without a target means "all" unless headings are treated separately in the same instruction, then "body".
- Convert units: 1 cm = 10 mm, 1 inch = 25.4 mm. Font sizes are points ("punto", "pt", "px" treat as points).
- Colour names become hex (kırmızı/red #C00000, mavi/blue #1F4E79, lacivert/navy #1F3A5F, yeşil/green #2E7D32, siyah/black #000000, gri/grey #666666, turuncu/orange #E36C09, mor/purple #6A1B9A).
- "büyüt/bigger" without a number: fontScale 1.2. "küçült/smaller": fontScale 0.85.
- Never invent document content. If something cannot be done (charts, adding new text sections, database queries, conditional logic), list it in "unsupported".
- If the instruction is not about formatting this document, return {"summary": [], "unsupported": ["<short reason>"]}.

<instruction>
${instruction}
</instruction>`;
}

function extractJson(text) {
  let t = String(text || "").trim();
  if (t.startsWith("```")) { t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim(); }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b < a) { throw new Error("no object"); }
  return JSON.parse(t.slice(a, b + 1));
}

function cleanOutline(o) {
  o = o && typeof o === "object" ? o : {};
  const num = (v) => (isFinite(Number(v)) ? Number(v) : 0);
  return {
    page: { widthPt: num(o.page && o.page.widthPt), heightPt: num(o.page && o.page.heightPt) },
    headings: (Array.isArray(o.headings) ? o.headings : []).map(num).filter((n) => n >= 1 && n <= 9).slice(0, 9),
    title: !!o.title, lists: !!o.lists, tables: num(o.tables), images: num(o.images), header: !!o.header, footer: !!o.footer,
    fonts: (Array.isArray(o.fonts) ? o.fonts : []).map((f) => clip(f, 40)).slice(0, 8),
    sizes: (Array.isArray(o.sizes) ? o.sizes : []).map(num).slice(0, 12)
  };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { return res.status(405).json({ error: "Method not allowed" }); }
  const body = req.body || {};
  const lang = body.language === "en" ? "en" : "tr";
  const L = (tr, en) => (lang === "tr" ? tr : en);

  if (JSON.stringify(body).length > 20000) { return res.status(413).json({ error: L("İstek çok büyük.", "Request is too large.") }); }
  const instruction = clip(body.instruction, MAX_INSTRUCTION + 1).trim();
  if (instruction.length < 3) { return res.status(400).json({ error: L("Lütfen bir talimat yazın.", "Please write an instruction.") }); }
  if (instruction.length > MAX_INSTRUCTION) { return res.status(413).json({ error: L("Talimat en fazla 2000 karakter olabilir.", "The instruction can be at most 2000 characters.") }); }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { return res.status(503).json({ error: L("Yapay zekâ servisi yapılandırılmamış.", "The AI service is not configured.") }); }

  if (!(await require("./_lib/guard")(req, res, "docx-jasper"))) { return; }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        input: [{ role: "user", content: [{ type: "input_text", text: buildPrompt(instruction, cleanOutline(body.outline), lang) }] }],
        store: false
      }),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timer);
    console.error("OpenAI network error:", error && error.message);
    return res.status(error && error.name === "AbortError" ? 504 : 502).json({
      error: error && error.name === "AbortError" ? L("Yapay zekâ yanıtı zaman aşımına uğradı.", "The AI request timed out.") : L("Yapay zekâ servisine ulaşılamadı.", "Could not reach the AI service.")
    });
  }
  clearTimeout(timer);

  let data = null;
  try { data = await response.json(); } catch (e) { data = null; }
  if (!response.ok) {
    console.error("OpenAI request failed:", response.status, data && data.error && data.error.message);
    return res.status(502).json({ error: L("Yapay zekâ servisi isteği reddetti (durum " + response.status + ").", "The AI service rejected the request (status " + response.status + ").") });
  }
  let out = String((data && data.output_text) || "").trim();
  if (!out && data && Array.isArray(data.output)) {
    out = data.output.flatMap((i) => (i && Array.isArray(i.content) ? i.content : [])).filter((c) => c && c.type === "output_text").map((c) => c.text || "").join("").trim();
  }
  let parsed;
  try { parsed = extractJson(out); } catch (e) {
    console.error("Invalid JSON from model (docx-jasper): length " + out.length);
    return res.status(502).json({ error: L("Yapay zekâ yanıtı okunamadı. Talimatı biraz farklı yazıp tekrar deneyin.", "The AI answer could not be read. Rephrase the instruction and try again.") });
  }

  const rules = cleanRules(parsed);
  const lines = (v) => (Array.isArray(v) ? v : []).map((s) => clip(s, 200).trim()).filter(Boolean).slice(0, 20);
  return res.status(200).json({ ok: true, rules, summary: lines(parsed.summary), unsupported: lines(parsed.unsupported) });
};

module.exports._buildPrompt = buildPrompt;
module.exports._extractJson = extractJson;
