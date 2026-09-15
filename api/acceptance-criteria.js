module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const body =
      req.body || {};

    const requirement =
      String(
        body.requirement || ""
      ).trim();

    const language =
      body.language || "tr";

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
            ? "Lütfen en az 15 karakter ve 3 kelime içeren açık bir requirement veya user story girin."
            : "Please provide a clear requirement or user story with at least 15 characters and 3 words."
      });

    }

    if (
      !["tr", "en"].includes(language)
    ) {

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
Generate 3-5 high-value acceptance criteria.

Focus on:
- Main happy path
- Most important validation
- One important error scenario
`;

    }

    if (detail === "Professional") {

      detailInstruction = `
Generate 5-8 professional acceptance criteria.

Cover:
- Happy path
- Validation
- Important negative scenarios
- Important business rules
- Relevant boundary behavior

Avoid duplicates.
`;

    }

    if (detail === "Comprehensive") {

      detailInstruction = `
Generate 7-12 comprehensive acceptance criteria.

Cover, where relevant:
- Happy path
- Positive scenarios
- Negative scenarios
- Validation
- Boundary scenarios
- Business rule enforcement
- Important state transitions
- Relevant error handling

Do not create artificial scenarios merely to increase the number of criteria.
Every criterion must represent a distinct and testable behavior.
`;
    }

    // -----------------------------------------
    // PROMPT
    // -----------------------------------------

    const prompt = `
You are a Senior Business Analyst, Product Owner and QA Analyst.

Your task is to transform the following requirement or user story into high-quality, testable Acceptance Criteria.

INPUT:
${requirement}

OUTPUT LANGUAGE:
${outputLanguage}

DETAIL LEVEL:
${detail}

${detailInstruction}

CORE PRINCIPLES:

1. Stay strictly within the provided requirement.
2. Do not invent unrelated functionality.
3. Do not invent technical implementation details.
4. Focus on observable system behavior.
5. Acceptance Criteria must be testable.
6. Every criterion must contain:
   Given
   When
   Then
7. Each criterion must represent ONE distinct behavior.
8. Do not combine unrelated behaviors into one criterion.
9. Do not duplicate criteria.
10. Do not create a generic catch-all criterion.
11. Avoid repeating the same behavior with different wording.
12. Prefer clear, concise and business-readable language.
13. Use business terminology appropriate for a banking / enterprise application when supported by the requirement.
14. Do not assume a specific technology, API, database or vendor.
15. Do not invent exact numeric limits unless they are provided by the requirement.
16. If an important limit or rule is missing, mention it in Open Questions instead.

SCENARIO TYPES:

Classify every Acceptance Criterion as one of:

- Positive
- Negative
- Boundary
- Validation

Use the most appropriate classification.

POSITIVE:
Normal successful behavior.

NEGATIVE:
Invalid input, rejected action or prevented behavior.

BOUNDARY:
A relevant minimum, maximum, zero, empty or threshold scenario, but only when the requirement provides or strongly implies such a boundary.

VALIDATION:
Input or business validation behavior.

BUSINESS RULES:

Business Rules must represent actual business constraints.

Do NOT simply copy Acceptance Criteria.

For example:

Bad:
"The system should show an error when the IBAN is invalid."

Better:
"Transfers can proceed only when the destination account information is valid."

TESTABILITY SCORE:

Calculate a Testability Score from 0 to 100.

Evaluate:

- Clarity of requirement
- Specificity
- Observable behavior
- Defined inputs
- Defined expected outcomes
- Business rule clarity
- Missing information

Do not give a high score merely because the requirement is long.

Return:

testabilityScore:
integer from 0 to 100

testabilityExplanation:
short explanation of why the score was given.

COVERAGE SUMMARY:

Provide concise statements showing what the Acceptance Criteria cover.

Examples:

- Happy path covered
- Invalid input covered
- Confirmation behavior covered
- Error handling partially defined
- Boundary rules missing

Do not claim coverage that does not exist.

ASSUMPTIONS:

Only include reasonable assumptions.

Clearly distinguish assumptions from stated requirements.

OPEN QUESTIONS:

Identify genuinely missing business information.

Examples:

- What is the maximum permitted amount?
- Which currencies are supported?
- What exact error message should be displayed?

Do not ask questions that are already answered.

QUALITY CONTROL:

Before returning the JSON, verify:

- Every Acceptance Criterion has Given, When and Then.
- No duplicate Acceptance Criteria exist.
- No Acceptance Criterion contains multiple unrelated behaviors.
- Scenario type is meaningful.
- Business Rules are not copies of Acceptance Criteria.
- Testability Score reflects actual requirement quality.
- Open Questions represent genuine gaps.
- No unsupported technical details were invented.
- All human-readable output is in ${outputLanguage}.

RETURN ONLY VALID JSON.

JSON STRUCTURE:

{
  "testabilityScore": 0,
  "testabilityExplanation": "...",

  "acceptanceCriteria": [
    {
      "id": "AC-01",
      "type": "Positive",
      "given": "...",
      "when": "...",
      "then": "..."
    }
  ],

  "coverageSummary": [
    "..."
  ],

  "businessRules": [
    "..."
  ],

  "assumptions": [
    "..."
  ],

  "openQuestions": [
    "..."
  ]
}
`;

    // -----------------------------------------
    // OPENAI REQUEST
    // -----------------------------------------

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

          body: JSON.stringify({

            model:
              "gpt-5.6-luna",

            input:
              prompt

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
        ?.join("") || "";

    if (!text) {

      return res.status(500).json({
        error:
          "No output received from OpenAI."
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
    // PARSE JSON
    // -----------------------------------------

    let result;

    try {

      result =
        JSON.parse(cleanText);

    } catch {

      return res.status(500).json({
        error:
          "AI returned invalid JSON."
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

    function deduplicate(items) {

      const seen =
        new Set();

      return items.filter(item => {

        const key =
          item
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;

      });

    }

    // -----------------------------------------
    // TESTABILITY SCORE
    // -----------------------------------------

    let score =
      Number(
        result.testabilityScore
      );

    if (
      !Number.isFinite(score)
    ) {
      score = 0;
    }

    score =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(score)
        )
      );

    // -----------------------------------------
    // ACCEPTANCE CRITERIA
    // -----------------------------------------

    let acceptanceCriteria = [];

    if (
      Array.isArray(
        result.acceptanceCriteria
      )
    ) {

      acceptanceCriteria =
        result.acceptanceCriteria
          .map(
            (item, index) => ({

              id:
                cleanString(item?.id) ||
                `AC-${String(
                  index + 1
                ).padStart(2, "0")}`,

              type:
                cleanString(item?.type) ||
                "Validation",

              given:
                cleanString(item?.given),

              when:
                cleanString(item?.when),

              then:
                cleanString(item?.then)

            })
          )
          .filter(
            item =>
              item.given &&
              item.when &&
              item.then
          );

    }

    // -----------------------------------------
    // DUPLICATE CRITERIA REMOVAL
    // -----------------------------------------

    const seenCriteria =
      new Set();

    acceptanceCriteria =
      acceptanceCriteria.filter(
        item => {

          const key =
            [
              item.given,
              item.when,
              item.then
            ]
              .join(" ")
              .toLowerCase()
              .replace(
                /\s+/g,
                " "
              )
              .trim();

          if (
            seenCriteria.has(key)
          ) {
            return false;
          }

          seenCriteria.add(key);

          return true;

        }
      );

    // Re-number
    acceptanceCriteria =
      acceptanceCriteria.map(
        (item, index) => ({

          ...item,

          id:
            `AC-${String(
              index + 1
            ).padStart(2, "0")}`

        })
      );

    // -----------------------------------------
    // FINAL RESULT
    // -----------------------------------------

    result = {

      testabilityScore:
        score,

      testabilityExplanation:
        cleanString(
          result.testabilityExplanation
        ),

      acceptanceCriteria,

      coverageSummary:
        deduplicate(
          cleanArray(
            result.coverageSummary
          )
        ),

      businessRules:
        deduplicate(
          cleanArray(
            result.businessRules
          )
        ),

      assumptions:
        deduplicate(
          cleanArray(
            result.assumptions
          )
        ),

      openQuestions:
        deduplicate(
          cleanArray(
            result.openQuestions
          )
        )

    };

    // -----------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------

    if (
      result.acceptanceCriteria
        .length === 0
    ) {

      return res.status(500).json({
        error:
          "AI did not generate valid Acceptance Criteria."
      });

    }

    return res.status(200).json(
      result
    );

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        "Server error."
    });

  }

};