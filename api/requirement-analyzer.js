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
      String(body.instruction || requirement || "").trim();

    const language =
      body.language || "en";

    const detail =
      body.detail || "Professional";

    const source =
      body.source || null;


    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

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
      TEXT IS OPTIONAL.

      The user may provide:
      - text only
      - PDF only
      - image only
      - text + PDF
      - text + image
    */

    if (!hasText && !hasSource) {

      return res.status(400).json({
        error:
          language === "tr"
            ? "Lütfen analiz için metin yazın veya bir PDF/görsel ekleyin."
            : "Please provide text or attach a PDF/image for analysis."
      });

    }


    // -----------------------------------------
    // TEXT VALIDATION
    // -----------------------------------------

    if (hasText) {

      const words =
        requirement
          .split(/\s+/)
          .filter(Boolean);


      if (
        requirement.length < 15 ||
        words.length < 3
      ) {

        /*
          If a file is also attached, short text
          is allowed because it may simply be
          an instruction such as:

          "Focus on pages 4-7"
        */

        if (!hasSource) {

          return res.status(400).json({
            error:
              language === "tr"
                ? "Lütfen en az 15 karakter ve 3 kelime içeren açık bir gereksinim girin."
                : "Please provide a clear requirement with at least 15 characters and 3 words."
          });

        }

      }

    }


    const outputLanguage =
      language === "tr"
        ? "Turkish"
        : "English";


    // -----------------------------------------
    // DETAIL INSTRUCTIONS
    // -----------------------------------------

    let detailInstruction = "";


    if (detail === "Basic") {

      detailInstruction = `
Generate a concise analysis.

Keep each list focused on the most important items.
Avoid unnecessary explanations.
`;

    } else if (detail === "Comprehensive") {

      detailInstruction = `
Generate a comprehensive professional BA analysis.

Identify relevant:
- ambiguities
- missing information
- assumptions
- business rules
- open questions
- edge cases

Be thorough, but do not invent facts that are not supported by the source.
`;

    } else {

      detailInstruction = `
Generate a professional Business Analyst level analysis.

Focus on practical information that can be used for:
- refinement
- development
- testing
- stakeholder clarification
- downstream BA artifacts
`;

    }


    // -----------------------------------------
    // SOURCE TYPE
    // -----------------------------------------

    let sourceType =
      "text";


    if (hasSource) {

      const type =
        String(
          source.type || ""
        ).toLowerCase();

      const name =
        String(
          source.name || ""
        ).toLowerCase();


      if (
        type === "application/pdf" ||
        name.endsWith(".pdf")
      ) {

        sourceType =
          "pdf";

      } else if (
        type.startsWith("image/")
      ) {

        sourceType =
          "image";

      }

    }


    // -----------------------------------------
    // ANALYSIS PROMPT
    // -----------------------------------------

    const prompt = `

You are an expert Senior Business Analyst and Requirements Engineer.

You are analyzing a business requirement and/or an attached source document.

SOURCE TYPE:

${sourceType}

USER INSTRUCTION:

${instruction || "No additional instruction was provided."}


IMPORTANT:

If a PDF or image is attached, inspect the source itself.

The user may intentionally provide ONLY a document without writing a requirement.

In that case:

1. Read the document/image.
2. Identify relevant business requirements.
3. Identify explicit business rules.
4. Identify important constraints.
5. Identify ambiguities.
6. Identify missing information.
7. Identify open questions.
8. Identify edge cases.
9. Determine whether multiple requirements exist.

If the user provides an instruction such as:

"Analyze pages 4-7"

"Focus on transaction limits"

"Look for approval rules"

"Check the requirements related to IBAN"

then focus the analysis accordingly.

Do NOT require the user to manually copy the document text.

If page numbers are explicitly mentioned by the user, use them as the requested scope.

Do NOT invent page references when they are not available.

Do NOT invent facts.

Do NOT invent business rules.

Do NOT invent numeric limits.

Do NOT invent transaction limits.

Do NOT invent dates.

Do NOT invent regulatory requirements.

Do NOT invent user roles unless the source indicates them.

Do NOT assume technical implementation.

Do NOT turn missing information into a confirmed business rule.

Business rules must contain only rules explicitly stated or directly supported by the source.

Edge cases may be proposed as scenarios to consider, but must NOT be presented as confirmed business rules.

Scores must reflect the quality of the actual requirement/source information.

Be critical but practical.

Avoid duplicate items.

${detailInstruction}


MULTIPLE REQUIREMENTS:

If the source contains multiple clearly distinguishable requirements, identify them.

Return them under "detectedRequirements".

Each detected requirement should contain:

- title
- requirement
- summary
- requirementType
- priority

Do not create artificial requirements simply by splitting every sentence.

Only include distinct business requirements.


OUTPUT LANGUAGE:

All human-readable output must be in ${outputLanguage}.


Return ONLY valid JSON.

Do not return Markdown.
Do not return code fences.
Do not add explanations before or after the JSON.


The JSON must have exactly this structure:

{
  "title": "short requirement title",

  "summary": "clear summary",

  "primaryRequirement": "the main requirement identified from the input",

  "requirementType": "Functional | Non-Functional | Business Rule | Regulatory | Data | Integration | Process | Other",

  "priority": "High | Medium | Low | Unknown",

  "clarityScore": 0,

  "completenessScore": 0,

  "testabilityScore": 0,

  "ambiguities": [
    "..."
  ],

  "missingInformation": [
    "..."
  ],

  "assumptions": [
    "..."
  ],

  "businessRules": [
    "..."
  ],

  "openQuestions": [
    "..."
  ],

  "edgeCases": [
    "..."
  ],

  "analystNotes": [
    "..."
  ],

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


SCORING GUIDANCE:

clarityScore:
How clearly the requirement expresses the intended behavior or business need.

completenessScore:
How much necessary business information is actually provided.

testabilityScore:
How easily the requirement can be converted into objective test scenarios.

Score range:
0-100.


90-100:
Very clear and sufficiently detailed.

70-89:
Mostly clear but some clarification is needed.

40-69:
Partially defined with meaningful gaps.

0-39:
Highly ambiguous or insufficiently defined.


For priority:

Use "Unknown" when the source does not provide enough information to determine priority.

Do not invent priority based only on the domain.


For requirementType:

Choose the type that best represents the actual wording/source.

Do not classify something as regulatory merely because it concerns banking or finance unless regulatory behavior is explicitly stated.


IMPORTANT:

A document may contain information that is NOT a requirement.

Do not turn every paragraph, heading or sentence into a requirement.

Distinguish between:

- requirement
- business rule
- explanatory information
- assumption
- open question
- background information

`;


    // -----------------------------------------
    // OPENAI INPUT
    // -----------------------------------------

    const input = [];


    /*
      TEXT / INSTRUCTION
    */

    input.push({
      role: "user",

      content: [
        {
          type: "input_text",
          text: prompt
        }
      ]

    });


    /*
      ATTACHED SOURCE

      PDF:
      input_file

      IMAGE:
      input_image
    */

    if (hasSource) {

      const sourceData =
        source.data;


      const sourceMime =
        String(
          source.type || ""
        ).toLowerCase();


      const sourceName =
        String(
          source.name || ""
        ).toLowerCase();


      const isPdf =
        sourceMime ===
          "application/pdf" ||
        sourceName.endsWith(".pdf");


      if (isPdf) {

        input[0].content.push({

          type:
            "input_file",

          filename:
            source.name ||
            "document.pdf",

          file_data:
            sourceData

        });

      } else {

        input[0].content.push({

          type:
            "input_image",

          image_url:
            sourceData

        });

      }

    }


    // -----------------------------------------
    // OPENAI REQUEST
    // -----------------------------------------

    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {

          method:
            "POST",

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

              input

            })

        }
      );


    const data =
      await response.json();


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


    // -----------------------------------------
    // EXTRACT MODEL OUTPUT
    // -----------------------------------------

    const text =
      data.output
        ?.flatMap(
          item =>
            item.content || []
        )
        ?.filter(
          item =>
            item.type ===
            "output_text"
        )
        ?.map(
          item =>
            item.text
        )
        ?.join("") ||
      "";


    if (!text) {

      return res.status(500).json({

        error:
          "No output received from OpenAI"

      });

    }


    // -----------------------------------------
    // CLEAN JSON
    // -----------------------------------------

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


    // -----------------------------------------
    // PARSE JSON
    // -----------------------------------------

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


    // -----------------------------------------
    // HELPERS
    // -----------------------------------------

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
        !Array.isArray(value)
      ) {

        return [];

      }


      return value
        .map(
          cleanString
        )
        .filter(
          Boolean
        );

    }


    function cleanScore(
      value
    ) {

      const score =
        Number(value);


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


    // -----------------------------------------
    // DETECTED REQUIREMENTS
    // -----------------------------------------

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


    // -----------------------------------------
    // NORMALIZE RESULT
    // -----------------------------------------

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


    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

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
        "Internal server error"

    });

  }

};
