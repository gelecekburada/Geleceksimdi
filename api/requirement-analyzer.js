module.exports = async (req, res) => {

  // =========================================================
  // METHOD
  // =========================================================

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }


  try {

    // =========================================================
    // ENVIRONMENT
    // =========================================================

    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {

      console.error(
        "OPENAI_API_KEY is missing."
      );

      return res.status(500).json({
        error:
          "OpenAI API anahtarı sunucuda tanımlı değil."
      });

    }


    // =========================================================
    // BODY
    // =========================================================

    const body =
      req.body || {};


    const requirement =
      String(
        body.requirement || ""
      ).trim();


    const instruction =
      String(
        body.instruction || ""
      ).trim();


    const language =
      body.language === "tr"
        ? "tr"
        : "en";


    const detail =
      String(
        body.detail || "Professional"
      );


    const source =
      body.source &&
      typeof body.source === "object"
        ? body.source
        : null;


    // =========================================================
    // VALIDATION
    // =========================================================

    if (
      ![
        "tr",
        "en"
      ].includes(language)
    ) {

      return res.status(400).json({
        error:
          "Invalid language."
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
        error:
          "Invalid detail level."
      });

    }


    // =========================================================
    // TEXT / SOURCE DETECTION
    // =========================================================

    const hasText =
      requirement.length > 0;


    const hasSource =
      Boolean(
        source &&
        typeof source.data === "string" &&
        source.data.trim().length > 0
      );


    // =========================================================
    // EMPTY REQUEST
    // =========================================================

    if (
      !hasText &&
      !hasSource
    ) {

      return res.status(400).json({

        error:
          language === "tr"
            ? "Analiz için metin girin veya PDF/görsel ekleyin."
            : "Please provide text or attach a PDF/image."

      });

    }


    // =========================================================
    // TEXT VALIDATION
    // =========================================================

    /*
      Text-only analysis requires a meaningful requirement.

      When an attachment exists, text can be:

      - empty
      - "4-7. sayfaları incele"
      - "IBAN kurallarına odaklan"
      - "Sadece ödeme limitlerini bul"
    */

    if (
      hasText &&
      !hasSource
    ) {

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
    // SOURCE INFORMATION
    // =========================================================

    let sourceType =
      "text";


    let sourceMime =
      "";


    let sourceName =
      "";


    let sourceData =
      "";


    if (hasSource) {

      sourceMime =
        String(
          source.type || ""
        )
          .trim()
          .toLowerCase();


      sourceName =
        String(
          source.name || ""
        )
          .trim();


      sourceData =
        String(
          source.data || ""
        )
          .trim();


      // -------------------------------------------------------
      // SOURCE DATA URL VALIDATION
      // -------------------------------------------------------

      if (
        !sourceData.startsWith(
          "data:"
        )
      ) {

        return res.status(400).json({

          error:
            language === "tr"
              ? "Dosya verisi geçersiz."
              : "Invalid file data."

        });

      }


      // -------------------------------------------------------
      // PDF
      // -------------------------------------------------------

      const isPdf =
        sourceMime === "application/pdf" ||
        sourceName
          .toLowerCase()
          .endsWith(".pdf") ||
        sourceData
          .toLowerCase()
          .startsWith(
            "data:application/pdf"
          );


      // -------------------------------------------------------
      // IMAGE
      // -------------------------------------------------------

      const isImage =
        sourceMime.startsWith(
          "image/"
        ) ||
        sourceData
          .toLowerCase()
          .startsWith(
            "data:image/"
          );


      if (isPdf) {

        sourceType =
          "pdf";

      } else if (isImage) {

        sourceType =
          "image";

      } else {

        return res.status(400).json({

          error:
            language === "tr"
              ? "Desteklenmeyen dosya türü. Yalnızca PDF veya görsel kullanılabilir."
              : "Unsupported file type. Only PDF or image files are supported."

        });

      }

    }


    // =========================================================
    // PAYLOAD SIZE PROTECTION
    // =========================================================

    /*
      Vercel Function request body limit is approximately 4.5 MB.

      Because the frontend sends the file as Base64 inside JSON,
      the encoded payload is larger than the original file.

      We therefore reject oversized Base64 data here with a
      readable error instead of sending it to OpenAI.
    */

    if (hasSource) {

      const MAX_SOURCE_DATA_CHARS =
        4_000_000;


      if (
        sourceData.length >
        MAX_SOURCE_DATA_CHARS
      ) {

        return res.status(413).json({

          error:
            language === "tr"
              ? "Dosya çok büyük. Lütfen daha küçük bir PDF veya görsel kullanın."
              : "The file is too large. Please use a smaller PDF or image."

        });

      }

    }


    // =========================================================
    // OUTPUT LANGUAGE
    // =========================================================

    const outputLanguage =
      language === "tr"
        ? "Turkish"
        : "English";


    // =========================================================
    // DETAIL INSTRUCTION
    // =========================================================

    let detailInstruction =
      "";


    if (
      detail === "Basic"
    ) {

      detailInstruction = `

Generate a concise analysis.

Keep lists focused on the most important findings.

Avoid unnecessary explanations.

`;

    } else if (
      detail === "Comprehensive"
    ) {

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
    // USER REQUEST
    // =========================================================

    const userRequest =
      instruction ||
      requirement ||
      (
        sourceType === "pdf"
          ? (
              language === "tr"
                ? "Ekli PDF dokümanını analiz et."
                : "Analyze the attached PDF document."
            )
          : sourceType === "image"
            ? (
                language === "tr"
                  ? "Ekli görseli analiz et."
                  : "Analyze the attached image."
              )
            : (
                language === "tr"
                  ? "Sağlanan gereksinimi analiz et."
                  : "Analyze the provided requirement."
              )
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

The primary requirement should represent the most central
requirement identified from the source.

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

=========================================================
PRIORITY
=========================================================

For priority:

Use "Unknown" when the source does not provide enough
information to determine priority.

Do NOT invent priority based only on the domain.

=========================================================
REQUIREMENT TYPE
=========================================================

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
      "priority": "Unknown",
      "clarityScore": 0,
      "completenessScore": 0,
      "testabilityScore": 0,
      "ambiguities": [],
      "missingInformation": [],
      "assumptions": [],
      "businessRules": [],
      "openQuestions": [],
      "edgeCases": []
    }
  ]
}

For EVERY item in detectedRequirements, score and analyze THAT
requirement on its own, using the same 0-100 scoring rules as above.
The per-requirement scores and lists must describe only that one
requirement, not the whole document. They may differ from the
document-level scores and from each other.

`;


    // =========================================================
    // OPENAI INPUT
    // =========================================================

    const content = [];


    // ---------------------------------------------------------
    // ATTACHMENT FIRST
    // ---------------------------------------------------------

    if (hasSource) {

      if (
        sourceType === "pdf"
      ) {

        /*
          IMPORTANT:

          Do NOT send "detail" here.

          detail is not part of the PDF input_file object.
        */

        content.push({

          type:
            "input_file",

          filename:
            sourceName ||
            "document.pdf",

          file_data:
            sourceData

        });

      }


      if (
        sourceType === "image"
      ) {

        content.push({

          type:
            "input_image",

          image_url:
            sourceData,

          detail:
            "high"

        });

      }

    }


    // ---------------------------------------------------------
    // INSTRUCTION / PROMPT
    // ---------------------------------------------------------

    content.push({

      type:
        "input_text",

      text:
        prompt

    });


    const input = [

      {
        role:
          "user",

        content

      }

    ];


    // =========================================================
    // OPENAI REQUEST
    // =========================================================

    const controller =
      new AbortController();


    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        120000
      );


    let response;


    try {

      response =
        await fetch(
          "https://api.openai.com/v1/responses",
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Authorization":
                `Bearer ${apiKey}`

            },

            body:
              JSON.stringify({

                model:
                  "gpt-5.6-luna",

                input,

                store:
                  false

              }),

            signal:
              controller.signal

          }
        );

    } catch (error) {

      clearTimeout(
        timeout
      );


      console.error(
        "OpenAI network error:",
        error
      );


      if (
        error?.name ===
        "AbortError"
      ) {

        return res.status(504).json({

          error:
            language === "tr"
              ? "Analiz zaman aşımına uğradı. Lütfen tekrar deneyin."
              : "The analysis timed out. Please try again."

        });

      }


      return res.status(502).json({

        error:
          language === "tr"
            ? "OpenAI servisine ulaşılamadı."
            : "Could not reach the OpenAI service."

      });

    }


    clearTimeout(
      timeout
    );


    // =========================================================
    // OPENAI RESPONSE
    // =========================================================

    let data;


    try {

      data =
        await response.json();

    } catch (error) {

      console.error(
        "OpenAI response JSON error:",
        error
      );


      return res.status(502).json({

        error:
          language === "tr"
            ? "OpenAI servisinden geçerli yanıt alınamadı."
            : "Invalid response received from OpenAI."

      });

    }


    // =========================================================
    // OPENAI ERROR
    // =========================================================

    if (
      !response.ok
    ) {

      console.error(
        "OpenAI API error:",
        data
      );


      const apiError =
        data?.error?.message ||
        "OpenAI request failed";


      return res.status(
        response.status >= 400 &&
        response.status < 600
          ? response.status
          : 502
      ).json({

        error:
          apiError

      });

    }


    // =========================================================
    // EXTRACT OUTPUT
    // =========================================================

    let outputText =
      String(
        data?.output_text ||
        ""
      ).trim();


    // ---------------------------------------------------------
    // FALLBACK
    // ---------------------------------------------------------

    if (
      !outputText &&
      Array.isArray(
        data?.output
      )
    ) {

      outputText =
        data.output
          .flatMap(
            item =>
              Array.isArray(
                item?.content
              )
                ? item.content
                : []
          )
          .filter(
            item =>
              item?.type ===
              "output_text"
          )
          .map(
            item =>
              item?.text || ""
          )
          .join("")
          .trim();

    }


    if (
      !outputText
    ) {

      console.error(
        "OpenAI returned no text:",
        data
      );


      return res.status(500).json({

        error:
          language === "tr"
            ? "Yapay zekâ analiz sonucu döndürmedi."
            : "The AI returned no analysis result."

      });

    }


    // =========================================================
    // CLEAN JSON
    // =========================================================

    let cleanText =
      outputText.trim();


    /*
      Remove Markdown code fences if the model
      accidentally returns them.
    */

    if (
      cleanText.startsWith(
        "```"
      )
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
        "Invalid JSON from model:"
      );

      console.error(
        cleanText
      );


      return res.status(500).json({

        error:
          language === "tr"
            ? "Yapay zekâ geçerli bir analiz formatı döndürmedi."
            : "The AI returned an invalid analysis format."

      });

    }


    // =========================================================
    // HELPERS
    // =========================================================

    function cleanString(
      value
    ) {

      return String(
        value ?? ""
      ).trim();

    }


    function cleanArray(
      value
    ) {

      if (
        !Array.isArray(
          value
        )
      ) {

        return [];

      }


      return value

        .map(
          item =>
            cleanString(
              item
            )
        )

        .filter(
          Boolean
        );

    }


    function cleanOptionalScore(
      value
    ) {

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      const score =
        Number(value);

      if (!Number.isFinite(score)) {
        return null;
      }

      return Math.max(
        0,
        Math.min(
          100,
          Math.round(score)
        )
      );

    }


    function cleanScore(
      value
    ) {

      const score =
        Number(
          value
        );


      if (
        !Number.isFinite(
          score
        )
      ) {

        return 0;

      }


      return Math.max(
        0,
        Math.min(
          100,
          Math.round(
            score
          )
        )
      );

    }


    function normalizeRequirementType(
      value
    ) {

      const normalized =
        cleanString(
          value
        );


      const map = {

        "Functional":
          "Functional",

        "Non-Functional":
          "Non-Functional",

        "Business Rule":
          "Business Rule",

        "Regulatory":
          "Regulatory",

        "Data":
          "Data",

        "Integration":
          "Integration",

        "Process":
          "Process",

        "Other":
          "Other"

      };


      return (
        map[
          normalized
        ] ||
        "Other"
      );

    }


    function normalizePriority(
      value
    ) {

      const normalized =
        cleanString(
          value
        );


      const allowed = [

        "High",

        "Medium",

        "Low",

        "Unknown"

      ];


      return allowed.includes(
        normalized
      )
        ? normalized
        : "Unknown";

    }


    // =========================================================
    // DETECTED REQUIREMENTS
    // =========================================================

    const detectedRequirements =
      Array.isArray(
        result?.detectedRequirements
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
                  normalizeRequirementType(
                    item?.requirementType
                  ),

                priority:
                  normalizePriority(
                    item?.priority
                  ),

                // Per-requirement analysis. A missing or invalid score
                // stays null ("no data"), it is never turned into a 0.
                clarityScore:
                  cleanOptionalScore(
                    item?.clarityScore
                  ),

                completenessScore:
                  cleanOptionalScore(
                    item?.completenessScore
                  ),

                testabilityScore:
                  cleanOptionalScore(
                    item?.testabilityScore
                  ),

                ambiguities:
                  cleanArray(
                    item?.ambiguities
                  ),

                missingInformation:
                  cleanArray(
                    item?.missingInformation
                  ),

                assumptions:
                  cleanArray(
                    item?.assumptions
                  ),

                businessRules:
                  cleanArray(
                    item?.businessRules
                  ),

                openQuestions:
                  cleanArray(
                    item?.openQuestions
                  ),

                edgeCases:
                  cleanArray(
                    item?.edgeCases
                  )

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
          result?.title
        ) ||
        "Requirement",


      summary:
        cleanString(
          result?.summary
        ),


      primaryRequirement:
        cleanString(
          result?.primaryRequirement
        ) ||
        requirement ||
        "",


      requirementType:
        normalizeRequirementType(
          result?.requirementType
        ),


      priority:
        normalizePriority(
          result?.priority
        ),


      clarityScore:
        cleanScore(
          result?.clarityScore
        ),


      completenessScore:
        cleanScore(
          result?.completenessScore
        ),


      testabilityScore:
        cleanScore(
          result?.testabilityScore
        ),


      ambiguities:
        cleanArray(
          result?.ambiguities
        ),


      missingInformation:
        cleanArray(
          result?.missingInformation
        ),


      assumptions:
        cleanArray(
          result?.assumptions
        ),


      businessRules:
        cleanArray(
          result?.businessRules
        ),


      openQuestions:
        cleanArray(
          result?.openQuestions
        ),


      edgeCases:
        cleanArray(
          result?.edgeCases
        ),


      analystNotes:
        cleanArray(
          result?.analystNotes
        ),


      detectedRequirements

    };


    // =========================================================
    // FINAL RESPONSE
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
