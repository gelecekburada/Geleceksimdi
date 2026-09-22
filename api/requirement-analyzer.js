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

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

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

Be thorough, but do not invent facts that are not supported by the requirement.
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
    // SYSTEM / ANALYSIS PROMPT
    // -----------------------------------------

    const prompt = `

You are an expert Senior Business Analyst and Requirements Engineer.

Your task is to analyze a raw business requirement.

The goal is NOT to rewrite the requirement blindly.

The goal is to determine:

1. What the requirement clearly states.
2. What is missing.
3. What is ambiguous.
4. What can be treated as an assumption.
5. Which business rules are explicitly present.
6. Which questions must be clarified with stakeholders.
7. Which edge cases should be considered.
8. How clear, complete and testable the requirement currently is.

IMPORTANT PRINCIPLES:

- Do NOT invent business rules.
- Do NOT invent numeric limits.
- Do NOT invent transaction limits.
- Do NOT invent dates.
- Do NOT invent regulatory requirements.
- Do NOT invent user roles unless the requirement indicates them.
- Do NOT assume a technical implementation.
- Do NOT turn missing information into a confirmed business rule.
- If something is unknown, put it under missingInformation or openQuestions.
- If something is reasonably assumed from the wording, put it under assumptions.
- Business rules must contain only rules explicitly stated or directly supported by the requirement.
- Edge cases may be proposed as scenarios to consider, but must NOT be presented as confirmed business rules.
- Scores must reflect the quality of the requirement itself, not the quality of your analysis.
- Be critical but practical.
- Do not use vague statements such as "everything is clear" without explanation.
- Avoid duplicate items.

${detailInstruction}

OUTPUT LANGUAGE:

All human-readable output must be in ${outputLanguage}.

REQUIREMENT:

"""
${requirement}
"""

Return ONLY valid JSON.

Do not return Markdown.
Do not return code fences.
Do not add explanations before or after the JSON.

The JSON must have exactly this structure:

{
  "title": "short requirement title",
  "summary": "clear summary of what the requirement says",
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

Scoring examples:

90-100:
Very clear and sufficiently detailed.

70-89:
Mostly clear but some clarification is needed.

40-69:
Partially defined with meaningful gaps.

0-39:
Highly ambiguous or insufficiently defined.

IMPORTANT:

A short requirement can still be valid.

Do not penalize a requirement merely because it is short if its intended behavior is sufficiently clear.

However, missing acceptance conditions, actors, constraints, outcomes, exceptions or important business rules should reduce completeness and/or testability where appropriate.

For priority:

Use "Unknown" when the requirement does not provide enough information to determine priority.

Do not invent priority based only on the domain.

For requirementType:

Choose the type that best represents the actual wording.

Do not classify a requirement as regulatory merely because it concerns banking or finance unless regulatory behavior is explicitly stated.

`;


    // -----------------------------------------
    // OPENAI REQUEST
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

      return res.status(response.status).json({
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
        JSON.parse(cleanText);

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

    function cleanString(value) {

      return String(
        value ?? ""
      ).trim();

    }


    function cleanArray(value) {

      if (!Array.isArray(value)) {
        return [];
      }

      return value
        .map(cleanString)
        .filter(Boolean);

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
        )

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