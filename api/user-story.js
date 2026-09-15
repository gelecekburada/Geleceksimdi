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
    // DETAIL INSTRUCTIONS
    // -----------------------------------------

    let detailInstruction = "";

    if (detail === "Basic") {
      detailInstruction = `
Generate a concise backlog-ready result.

Acceptance Criteria:
- Generate 3-5 criteria.
- Include only the most important acceptance scenarios.
`;
    }

    if (detail === "Professional") {
      detailInstruction = `
Generate a professional Business Analyst / Product Owner level result.

Acceptance Criteria:
- Generate 4-8 criteria.
- Cover the main happy path and important validation/error scenarios.
- Avoid duplicate or overlapping criteria.
`;
    }

    if (detail === "Comprehensive") {
      detailInstruction = `
Generate a comprehensive senior Business Analyst level result.

Acceptance Criteria:
- Generate 6-10 criteria.
- Cover the main happy path, validation, error handling and important boundary scenarios.
- Every criterion must represent a distinct testable behavior.
- Do not repeat the same behavior using different wording.
`;
    }

    // -----------------------------------------
    // PROMPT
    // -----------------------------------------

    const prompt = `
You are a Senior Business Analyst and Agile Product Owner.

Transform the requirement below into a high-quality Agile User Story.

REQUIREMENT:
${requirement}

DETAIL LEVEL:
${detail}

${detailInstruction}

GENERAL RULES:

1. Stay strictly within the provided requirement.
2. Do not invent unrelated functionality.
3. Do not fabricate technical implementation details.
4. Identify the most reasonable user/persona.
5. Focus on user goal and business value.
6. The User Story MUST follow this structure:

   As a [user/persona],
   I want [goal],
   So that [business value].

7. Acceptance Criteria MUST use Given / When / Then.
8. Every Acceptance Criterion must be independently understandable and testable.
9. Each Acceptance Criterion must describe ONE distinct behavior.
10. Do NOT create duplicate or overlapping Acceptance Criteria.
11. If two criteria test essentially the same behavior, combine them.
12. Do not create a generic catch-all Acceptance Criterion that repeats previous criteria.
13. Business Rules must represent actual business constraints or policies.
14. Do NOT copy Acceptance Criteria into Business Rules.
15. Business Rules should be concise and non-duplicative.
16. Assumptions must be clearly identified as assumptions.
17. Dependencies should only be included when reasonably inferable from the requirement.
18. Do not invent specific external systems, APIs, databases or vendors.
19. Edge Cases must be relevant to the requirement.
20. If an Edge Case is inferred rather than explicitly stated in the requirement, prefix it with:
   "Inferred:"
21. Do not turn every possible technical failure into an Edge Case.
22. Open Questions must identify genuinely missing business information.
23. Do not ask questions whose answers are already stated in the requirement.
24. Avoid unnecessary repetition across all sections.
25. All human-readable output must be in ${outputLanguage}.

QUALITY CHECK BEFORE RETURNING:

- Is the User Story a real As / I want / So that story?
- Does it contain a clear user goal?
- Does it contain clear business value?
- Are Acceptance Criteria unique?
- Does every Acceptance Criterion have Given, When and Then?
- Are Business Rules different from Acceptance Criteria?
- Are Edge Cases relevant?
- Are inferred Edge Cases explicitly marked?
- Are Open Questions genuinely unresolved?
- Is anything invented that is not reasonably supported by the requirement?

If a section has no meaningful content, return an empty array rather than inventing information.

RETURN ONLY VALID JSON.

JSON STRUCTURE:

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
    // EXTRACT OUTPUT
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
    // PARSE JSON
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
    // HELPERS
    // -----------------------------------------

    function cleanString(value) {
      return String(value || "").trim();
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

      const seen = new Set();

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
    // ACCEPTANCE CRITERIA NORMALIZATION
    // -----------------------------------------

    let acceptanceCriteria = [];

    if (
      Array.isArray(
        result.acceptanceCriteria
      )
    ) {

      acceptanceCriteria =
        result.acceptanceCriteria
          .map((item, index) => ({

            id:
              cleanString(item?.id) ||
              `AC-${String(
                index + 1
              ).padStart(2, "0")}`,

            given:
              cleanString(item?.given),

            when:
              cleanString(item?.when),

            then:
              cleanString(item?.then)

          }))
          .filter(item =>
            item.given &&
            item.when &&
            item.then
          );
    }

    // Remove exact duplicate scenarios
    const seenCriteria = new Set();

    acceptanceCriteria =
      acceptanceCriteria.filter(item => {

        const key =
          [
            item.given,
            item.when,
            item.then
          ]
            .join(" ")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        if (seenCriteria.has(key)) {
          return false;
        }

        seenCriteria.add(key);

        return true;
      });

    // Re-number Acceptance Criteria
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

      story:
        cleanString(result.story),

      businessValue:
        cleanString(
          result.businessValue
        ),

      acceptanceCriteria,

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

      dependencies:
        deduplicate(
          cleanArray(
            result.dependencies
          )
        ),

      edgeCases:
        deduplicate(
          cleanArray(
            result.edgeCases
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
    // BASIC OUTPUT VALIDATION
    // -----------------------------------------

    if (!result.story) {

      return res.status(500).json({
        error:
          "AI did not generate a valid User Story."
      });
    }

    if (
      result.acceptanceCriteria.length === 0
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
      error: "Server error"
    });

  }

};