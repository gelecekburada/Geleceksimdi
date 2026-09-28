module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const body = req.body || {};

    const requirement =
      String(body.requirement || "").trim();

    const instruction =
      String(body.instruction || "").trim();

    const language =
      body.language || "en";

    const detail =
      body.detail || "Professional";

    const source =
      body.source || null;


    // =========================================================
    // VALIDATION
    // =========================================================

    if (!["tr", "en"].includes(language)) {

      return res.status(400).json({
        error: "Invalid language."
      });

    }


    if (
      ![
        "Basic",
        "Professional",
        "Comprehensive"
      ].includes(detail)
    ) {

      return res.status(400).json({
        error: "Invalid detail level."
      });

    }


    const hasText =
      requirement.length > 0;


    const hasSource =
      source &&
      typeof source === "object" &&
      typeof source.data === "string" &&
      source.data.length > 0;


    /*
      Valid combinations:

      1. Text only
      2. PDF only
      3. Image only
      4. Text + PDF
      5. Text + Image
      6. Instruction + PDF
      7. Instruction + Image
    */

    if (!hasText && !hasSource) {

      return res.status(400).json({
        error:
          language === "tr"
            ? "Lütfen analiz için metin yazın veya bir PDF/görsel ekleyin."
            : "Please provide text or attach a PDF/image for analysis."
      });

    }


    // =========================================================
    // TEXT VALIDATION
    // =========================================================

    /*
      Text is required only when there is NO attachment.

      If a PDF/image exists, the text may be:

      "4-7. sayfaları incele"

      or

      "IBAN kurallarına odaklan"

      or

      completely empty.
    */

    if (hasText && !hasSource) {

      const words =
        requirement
          .split(/\s+/)
          .filter(Boolean);


      if (
        requirement.length < 15 ||
        words.length < 3
      ) {

        return res.status(400).json({
          error:
            language === "tr"
              ? "Lütfen en az 15 karakter ve 3 kelime içeren açık bir gereksinim girin."
              : "Please provide a clear requirement with at least 15 characters and 3 words."
        });

      }

    }


    // =========================================================
    // LANGUAGE
    // =========================================================

    const outputLanguage =
      language === "tr"
        ? "Turkish"
        : "English";


    // =========================================================
    // DETAIL
    // =========================================================

    let detailInstruction = "";


    if (detail === "Basic") {

      detailInstruction = `
Generate a concise analysis.

Keep lists focused on the most important findings.
Avoid unnecessary explanations.
`;

    } else if (detail === "Comprehensive") {

      detailInstruction = `
Generate a comprehensive professional Business Analysis.

Be thorough when identifying:

- ambiguities
- missing information
- assumptions
- business rules
- open questions
- edge cases
- distinct requirements

Do not invent information.
`;

    } else {

      detailInstruction = `
Generate a professional Senior Business Analyst level analysis.

Focus on information useful for:

- requirements refinement
- development
- testing
- stakeholder clarification
- downstream BA artifacts
`;

    }


    // =========================================================
    // SOURCE TYPE
    // =========================================================

    let sourceType = "text";


    let sourceMime = "";

    let sourceName = "";

    let sourceData = "";


    if (hasSource) {

      sourceMime =
        String(
          source.type || ""
        ).toLowerCase();

      sourceName =
        String(
          source.name || ""
        ).trim();

      sourceData =
        String(
          source.data || ""
        ).trim();


      if (
        sourceMime === "application/pdf" ||
        sourceName.toLowerCase().endsWith(".pdf") ||
        sourceData.startsWith("data:application/pdf")
      ) {

        sourceType = "pdf";

      } else if (
        sourceMime.startsWith("image/") ||
        sourceData.startsWith("data:image/")
      ) {

        sourceType = "image";

      } else {

        return res.status(400).json({
          error:
            language === "tr"
              ? "Desteklenmeyen dosya türü."
              : "Unsupported file type."
        });

      }

    }


    // =========================================================
    // USER REQUEST
    // =========================================================

    const userRequest =
      instruction ||
      requirement ||
      (
        sourceType === "pdf"
          ? "Analyze the attached PDF."
          : sourceType === "image"
            ? "Analyze the attached image."
            : "Analyze the provided requirement."
      );


    // =========================================================
    // ANALYSIS PROMPT
    // =========================================================

    const prompt = `

You are an expert Senior Business Analyst and Requirements Engineer.

You have been given a user request and may also have an attached document or image.

=========================================================
SOURCE
=========================================================

Source type:
${sourceType}

Source filename:
${sourceName || "Not provided"}

IMPORTANT:

If an attachment exists, the ATTACHMENT IS THE PRIMARY SOURCE OF TRUTH.

You MUST inspect and analyze the actual attached PDF or image before producing the analysis.

Do not analyze only the user's instruction.

The user's instruction tells you WHAT TO LOOK FOR in the attachment.

=========================================================
USER REQUEST
=========================================================

${userRequest}

=========================================================
HOW TO INTERPRET THE REQUEST
=========================================================

If the user says:

"4-7. sayfaları incele"

then inspect those pages.

If the user says:

"Para transferi kurallarına bak"

then inspect the attachment for rules related to money transfers.

If the user says:

"IBAN ile ilgili gereksinimleri bul"

then identify requirements related to IBAN.

If the user provides only a PDF/image and no text:

Analyze the attachment itself.

Do NOT ask the user to copy the document text.

=========================================================
IMPORTANT ANALYSIS RULES
=========================================================

Do NOT invent facts.

Do NOT invent requirements.

Do NOT invent business rules.

Do NOT invent numeric limits.

Do NOT invent transaction limits.

Do NOT invent dates.

Do NOT invent regulatory requirements.

Do NOT invent user roles.

Do NOT assume technical implementation.

Do NOT turn missing information into a confirmed rule.

Only identify a business rule when it is explicitly stated
or directly supported by the attachment.

Edge cases may be proposed as scenarios to consider,
but they must NOT be presented as confirmed business rules.

Distinguish carefully between:

- actual requirement
- business rule
- explanatory information
- background information
- assumption
- open question
- ambiguity

A document may contain many paragraphs that are NOT requirements.

Do not turn every paragraph or sentence into a requirement.

=========================================================
MULTIPLE REQUIREMENTS
=========================================================

If the attachment contains multiple clearly distinguishable
business requirements, identify them under:

detectedRequirements

Do NOT create artificial requirements simply by splitting
every sentence.

Only include genuinely distinct requirements.

=========================================================
SCORING
=========================================================

clarityScore:

How clearly the requirement or source expresses the intended
business behavior or need.

completenessScore:

How much necessary business information is actually provided.

testabilityScore:

How easily the identified requirement can be converted
into objective test scenarios.

Score range:

0-100.

Use:

90-100 = very clear and sufficiently detailed

70-89 = mostly clear with some clarification needed

40-69 = partially defined with meaningful gaps

0-39 = highly ambiguous or insufficiently defined


For priority:

Use "Unknown" when the source does not provide enough
information to determine priority.

Do NOT invent priority based only on the domain.

For requirementType:

Choose the type that best represents the actual source.

Possible values:

Functional
Non-Functional
Business Rule
Regulatory
Data
Integration
Process
Other

Do NOT classify something as regulatory merely because
it concerns banking or finance.

=========================================================
OUTPUT LANGUAGE
=========================================================

All human-readable output must be in:

${outputLanguage}

=========================================================
DETAIL LEVEL
=========================================================

${detailInstruction}

=========================================================
OUTPUT
=========================================================

Return ONLY valid JSON.

Do not return Markdown.

Do not return code fences.

Do not add explanations before or after the JSON.

The JSON must have exactly this structure:

{
  "title": "short requirement title",

  "summary": "clear summary",

  "primaryRequirement": "the main requirement identified from the source",

  "requirementType": "Functional | Non-Functional | Business Rule | Regulatory | Data | Integration | Process | Other",

  "priority": "High | Medium | Low | Unknown",

  "clarityScore": 0,

  "completenessScore": 0,

  "testabilityScore": 0,

  "ambiguities": [],

  "missingInformation": [],

  "assumptions": [],

  "businessRules": [],

  "openQuestions": [],

  "edgeCases": [],

  "analystNotes": [],

  "detectedRequirements": [
    {
      "title": "...",
      "requirement": "...",
      "summary": "...",
      "requirementType": "Functional",
      "priority": "Unknown"
    }
  ]
}

`;


    // =========================================================
    // BUILD OPENAI INPUT
    // =========================================================

    const content = [];


    /*
      IMPORTANT:
      Put the attachment FIRST so the model receives the
      actual source before the natural-language instruction.
    */

    if (hasSource) {

      if (sourceType === "pdf") {

        content.push({

          type: "input_file",

          filename:
            sourceName ||
            "document.pdf",

          file_data:
            sourceData,

          detail:
            "high"

        });

      } else if (sourceType === "image") {

        content.push({

          type: "input_image",

          image_url:
            sourceData,

          detail:
            "high"

        });

      }

    }


    /*
      Put the instruction AFTER the attachment.
    */

    content.push({

      type: "input_text",

      text: prompt

    });


    const input = [

      {
        role: "user",

        content

      }

    ];


    // =========================================================
    // OPENAI REQUEST
    // =========================================================

    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${process.env.OPENAI_API_KEY}`

          },

          body:
            JSON.stringify({

              model:
                "gpt-5.6-luna",

              input,

              store:
                false

            })

        }
      );


    const data =
      await response.json();


    // =========================================================
    // OPENAI ERROR
    // =========================================================

    if (!response.ok) {

      console.error(
        "OpenAI error:",
        data
      );


      return res.status(
        response.status
      ).json({

        error:
          data?.error?.message ||
          "OpenAI request failed"

      });

    }


    // =========================================================
    // EXTRACT OUTPUT
    // =========================================================

    let text =
      String(
        data.output_text || ""
      ).trim();


    /*
      Fallback for Responses API output
    */

    if (!text) {

      text =
        data.output
          ?.flatMap(
            item =>
              item.content || []
          )
          ?.filter(
            item =>
              item.type === "output_text"
          )
          ?.map(
            item =>
              item.text || ""
          )
          ?.join("")
          ?.trim() || "";

    }


    if (!text) {

      return res.status(500).json({

        error:
          "No output received from OpenAI"

      });

    }


    // =========================================================
    // CLEAN JSON
    // =========================================================

    let cleanText =
      text.trim();


    if (
      cleanText.startsWith("```")
    ) {

      cleanText =
        cleanText
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          )
          .trim();

    }


    // =========================================================
    // PARSE JSON
    // =========================================================

    let result;


    try {

      result =
        JSON.parse(
          cleanText
        );

    } catch (error) {

      console.error(
        "Invalid JSON from model:",
        cleanText
      );


      return res.status(500).json({

        error:
          "AI returned invalid JSON"

      });

    }


    // =========================================================
    // HELPERS
    // =========================================================

    function cleanString(value) {

      return String(
        value ?? ""
      ).trim();

    }


    function cleanArray(value) {

      if (
        !Array.isArray(value)
      ) {

        return [];

      }


      return value

        .map(
          item =>
            cleanString(item)
        )

        .filter(
          Boolean
        );

    }


    function cleanScore(value) {

      const score =
        Number(value);


      if (
        !Number.isFinite(score)
      ) {

        return 0;

      }


      return Math.max(
        0,
        Math.min(
          100,
          Math.round(score)
        )
      );

    }


    // =========================================================
    // DETECTED REQUIREMENTS
    // =========================================================

    const detectedRequirements =
      Array.isArray(
        result.detectedRequirements
      )

        ? result.detectedRequirements

            .map(
              item => ({

                title:
                  cleanString(
                    item?.title
                  ) ||
                  "Requirement",

                requirement:
                  cleanString(
                    item?.requirement
                  ),

                summary:
                  cleanString(
                    item?.summary
                  ),

                requirementType:
                  cleanString(
                    item?.requirementType
                  ) ||
                  "Other",

                priority:
                  cleanString(
                    item?.priority
                  ) ||
                  "Unknown"

              })
            )

            .filter(
              item =>
                item.requirement
            )

        : [];


    // =========================================================
    // NORMALIZE RESULT
    // =========================================================

    const normalized = {

      title:
        cleanString(
          result.title
        ) ||
        "Requirement",

      summary:
        cleanString(
          result.summary
        ),

      primaryRequirement:
        cleanString(
          result.primaryRequirement
        ) ||
        requirement ||
        "",

      requirementType:
        cleanString(
          result.requirementType
        ) ||
        "Other",

      priority:
        cleanString(
          result.priority
        ) ||
        "Unknown",

      clarityScore:
        cleanScore(
          result.clarityScore
        ),

      completenessScore:
        cleanScore(
          result.completenessScore
        ),

      testabilityScore:
        cleanScore(
          result.testabilityScore
        ),

      ambiguities:
        cleanArray(
          result.ambiguities
        ),

      missingInformation:
        cleanArray(
          result.missingInformation
        ),

      assumptions:
        cleanArray(
          result.assumptions
        ),

      businessRules:
        cleanArray(
          result.businessRules
        ),

      openQuestions:
        cleanArray(
          result.openQuestions
        ),

      edgeCases:
        cleanArray(
          result.edgeCases
        ),

      analystNotes:
        cleanArray(
          result.analystNotes
        ),

      detectedRequirements

    };


    // =========================================================
    // RESPONSE
    // =========================================================

    return res.status(200).json(
      normalized
    );


  } catch (error) {

    console.error(
      "Requirement Analyzer API error:",
      error
    );


    return res.status(500).json({

      error:
        error?.message ||
        "Internal server error"

    });

  }

};
