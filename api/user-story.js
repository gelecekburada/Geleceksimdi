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

    const language =
      body.language || "en";

    const detail =
      body.detail || "Professional";

    const words =
      requirement
        .split(/\s+/)
        .filter(Boolean);

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

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

    const outputLanguage =
      language === "tr"
        ? "Turkish"
        : "English";

    // -----------------------------------------
    // DETAIL
    // -----------------------------------------

    let detailInstruction = "";

    if (detail === "Basic") {

      detailInstruction = `
Keep the output concise.
Generate only the most important business information.
`;
    }

    if (detail === "Professional") {

      detailInstruction = `
Create a professional Business Analyst / Product Owner level output.

The result should be clear enough to be used in an Agile backlog.
`;
    }

    if (detail === "Comprehensive") {

      detailInstruction = `
Create a comprehensive BA-level analysis.

Identify:
- Business value
- Acceptance criteria
- Business rules
- Assumptions
- Dependencies
- Edge cases
- Missing information
- Questions that should be clarified before development
`;
    }

    // -----------------------------------------
    // PROMPT
    // -----------------------------------------

    const prompt = `
You are a senior Business Analyst and Agile Product Owner.

Transform the requirement below into a professional User Story.

Requirement:
${requirement}

Detail level:
${detail}

${detailInstruction}

IMPORTANT:

1. Stay strictly within the provided requirement.
2. Do not invent unrelated business functionality.
3. Identify the most reasonable user/persona.
4. Clearly describe the user's goal.
5. Clearly describe the business value.
6. Acceptance criteria must be testable.
7. Use Given / When / Then structure.
8. Business rules must come from the requirement.
9. Clearly identify assumptions instead of presenting assumptions as facts.
10. Identify dependencies only when reasonably inferable.
11. Identify edge cases relevant to the requirement.
12. Open questions should identify genuinely missing information.
13. Do not fabricate technical implementation details.
14. All human-readable output must be in ${outputLanguage}.

The User Story should follow this structure:

As a [user/persona],
I want [goal],
So that [business value].

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "story": "...",
  "businessValue": "...",
  "acceptanceCriteria": [
    {
      "id": "AC-01",
      "given": "...",
      "when": "...",
      "then": "..."
    }
  ],
  "businessRules": [
    "..."
  ],
  "assumptions": [
    "..."
  ],
  "dependencies": [
    "..."
  ],
  "edgeCases": [
    "..."
  ],
  "openQuestions": [
    "..."
  ]
}
`;

    // -----------------------------------------
    // OPENAI
    // -----------------------------------------

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",
          input: prompt
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      return res.status(
        response.status
      ).json({
        error:
          data?.error?.message ||
          "OpenAI request failed"
      });
    }

    // -----------------------------------------
    // OUTPUT
    // -----------------------------------------

    const text =
      data.output
        ?.flatMap(
          item => item.content || []
        )
        ?.filter(
          item =>
            item.type === "output_text"
        )
        ?.map(
          item => item.text
        )
        ?.join("") || "";

    if (!text) {

      return res.status(500).json({
        error:
          "No output received from OpenAI"
      });
    }

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
            /\s*```$/,
            ""
          )
          .trim();
    }

    // -----------------------------------------
    // PARSE
    // -----------------------------------------

    let result;

    try {

      result =
        JSON.parse(cleanText);

    } catch {

      return res.status(500).json({
        error:
          "AI returned invalid JSON"
      });
    }

    // -----------------------------------------
    // NORMALIZE
    // -----------------------------------------

    result = {

      story:
        String(result.story || ""),

      businessValue:
        String(
          result.businessValue || ""
        ),

      acceptanceCriteria:
        Array.isArray(
          result.acceptanceCriteria
        )
          ? result.acceptanceCriteria.map(
              (item, index) => ({
                id:
                  item.id ||
                  `AC-${String(
                    index + 1
                  ).padStart(2, "0")}`,

                given:
                  String(
                    item.given || ""
                  ),

                when:
                  String(
                    item.when || ""
                  ),

                then:
                  String(
                    item.then || ""
                  )
              })
            )
          : [],

      businessRules:
        Array.isArray(
          result.businessRules
        )
          ? result.businessRules.map(
              String
            )
          : [],

      assumptions:
        Array.isArray(
          result.assumptions
        )
          ? result.assumptions.map(
              String
            )
          : [],

      dependencies:
        Array.isArray(
          result.dependencies
        )
          ? result.dependencies.map(
              String
            )
          : [],

      edgeCases:
        Array.isArray(
          result.edgeCases
        )
          ? result.edgeCases.map(
              String
            )
          : [],

      openQuestions:
        Array.isArray(
          result.openQuestions
        )
          ? result.openQuestions.map(
              String
            )
          : []

    };

    return res.status(200).json(
      result
    );

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Server error"
    });
  }
};