module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const body = req.body || {};

    const requirement = String(body.requirement || "").trim();

    const type = body.type || "Functional";
    const number = Number(body.number || 5);
    const detail = body.detail || "Professional";
    const language = body.language || "en";
    const focus = body.focus || "All";
    const priority = body.priority || "All";

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    const words = requirement
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

    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > 50
    ) {
      return res.status(400).json({
        error:
          "Number of test cases must be between 1 and 50."
      });
    }

    const allowedTypes = [
      "Functional",
      "Negative",
      "Edge Case",
      "Regression",
      "API"
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        error: "Invalid test type."
      });
    }

    const allowedDetails = [
      "Basic",
      "Professional",
      "Comprehensive"
    ];

    if (!allowedDetails.includes(detail)) {
      return res.status(400).json({
        error: "Invalid detail level."
      });
    }

    const allowedLanguages = [
      "tr",
      "en"
    ];

    if (!allowedLanguages.includes(language)) {
      return res.status(400).json({
        error: "Invalid language."
      });
    }

    const allowedFocus = [
      "All",
      "Business Rules",
      "Validation",
      "Boundary",
      "Error Handling",
      "Security",
      "Integration",
      "Usability"
    ];

    if (!allowedFocus.includes(focus)) {
      return res.status(400).json({
        error: "Invalid test focus."
      });
    }

    const allowedPriorities = [
      "All",
      "Critical",
      "High",
      "Medium",
      "Low"
    ];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        error: "Invalid priority."
      });
    }

    // -----------------------------------------
    // LANGUAGE
    // -----------------------------------------

    const outputLanguage =
      language === "tr"
        ? "Turkish"
        : "English";

    // -----------------------------------------
    // TYPE-SPECIFIC INSTRUCTIONS
    // -----------------------------------------

    let typeInstructions = "";

    if (type === "Functional") {

      typeInstructions = `
Focus on the normal successful business flow.

Cover:
- Main business functionality
- Valid user actions
- Expected successful outcomes
- Important business rules
`;
    }

    if (type === "Negative") {

      typeInstructions = `
Focus on invalid, rejected and failure scenarios.

Cover:
- Invalid input
- Missing input
- Incorrect values
- Unauthorized actions
- Business rule violations
- Error messages
- System rejection behavior
`;
    }

    if (type === "Edge Case") {

      typeInstructions = `
Focus on boundary and unusual scenarios.

Cover:
- Minimum and maximum values
- Empty or near-empty values
- Boundary conditions
- Large values
- Unusual but realistic combinations
- Timing or state-related edge cases
`;
    }

    if (type === "Regression") {

      typeInstructions = `
Generate REAL regression test cases.

Assume the requirement represents functionality that already exists
and may have been changed or impacted.

Focus on:
- Previously working functionality
- Critical existing business flows
- Related functionality
- Dependencies
- Integration points
- High-risk impacted areas
- Smoke/sanity coverage where appropriate

Do NOT simply generate normal functional test cases.
Each case must have a regression-oriented purpose.
`;
    }

    if (type === "API") {

      typeInstructions = `
Generate REAL API test cases.

Do NOT create generic UI/UAT test cases.

Each API test case should include realistic API information:

- HTTP method
- Endpoint
- Headers
- Request body
- Expected HTTP status code
- Expected response

Use REST API conventions where the requirement does not explicitly
specify an API design.

Do not invent highly specific domain endpoints unless they can
reasonably be derived from the requirement.

API Details must be included inside the "api" object.
`;
    }

    // -----------------------------------------
    // FOCUS
    // -----------------------------------------

    const focusInstruction =
      focus === "All"
        ? `
Cover the most relevant test dimensions for the requirement.
Balance business rules, validation, boundaries, errors,
security, integration and usability where applicable.
`
        : `
Prioritize test cases around this specific test focus:

${focus}

The selected focus should materially affect the generated scenarios.
`;

    // -----------------------------------------
    // PRIORITY
    // -----------------------------------------

    const priorityInstruction =
      priority === "All"
        ? `
Assign an appropriate priority to each test case:
Critical, High, Medium or Low.
`
        : `
All generated test cases must have this priority:

${priority}
`;

    // -----------------------------------------
    // DETAIL
    // -----------------------------------------

    let detailInstruction = "";

    if (detail === "Basic") {

      detailInstruction = `
Keep the test cases concise while still being executable.
`;
    }

    if (detail === "Professional") {

      detailInstruction = `
Create professional QA/UAT-level test cases with clear
preconditions, executable steps, expected results and test data.
`;
    }

    if (detail === "Comprehensive") {

      detailInstruction = `
Create highly detailed, production-ready test cases.

Include:
- Clear preconditions
- Explicit executable steps
- Detailed expected results
- Relevant test data
- Important validation points
- Business rules
- Dependencies
- Integration considerations where applicable
`;
    }

    // -----------------------------------------
    // JSON FORMAT
    // -----------------------------------------

    const jsonFormat = `
Return ONLY a valid JSON array.

Do NOT return:
- Markdown
- Code fences
- Explanations
- Comments
- Text before or after the JSON

Every test case must contain:

{
  "id": "TC-001",
  "title": "...",
  "objective": "...",
  "preconditions": "...",
  "steps": [
    "Step 1",
    "Step 2",
    "Step 3"
  ],
  "expectedResult": "...",
  "priority": "High",
  "testData": {}
}

For testData:
- Use a useful object when structured data makes sense.
- Do not use meaningless placeholder values.

For API tests, additionally include:

"api": {
  "method": "POST",
  "endpoint": "/api/example",
  "headers": {},
  "requestBody": {},
  "expectedStatusCode": 200,
  "expectedResponse": {}
}

For non-API tests, the "api" property may be omitted.

All human-readable content must be written in ${outputLanguage}.
`;

    // -----------------------------------------
    // PROMPT
    // -----------------------------------------

    const prompt = `
You are a senior QA Engineer and UAT Business Analyst.

Generate exactly ${number} professional test cases.

Requirement:
${requirement}

Test Type:
${type}

Detail Level:
${detail}

Test Focus:
${focus}

Priority:
${priority}

${typeInstructions}

${focusInstruction}

${priorityInstruction}

${detailInstruction}

IMPORTANT QUALITY RULES:

1. Every test case must be directly related to the requirement.
2. Do not invent unrelated functionality.
3. Do not create meaningless test cases just to reach the requested count.
4. If the requirement contains a specific business rule, test that rule.
5. Use realistic test data.
6. Steps must be executable by a QA/UAT tester.
7. Expected results must be observable and verifiable.
8. Do not use vague phrases such as "system works correctly".
9. Do not repeat the same scenario with trivial wording changes.
10. Distribute scenarios intelligently.
11. Respect the selected Test Focus.
12. Respect the selected Priority.
13. Respect the selected Detail Level.
14. All human-readable output must be in ${outputLanguage}.

${jsonFormat}
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
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",
          input: prompt
        })
      }
    );

    const data = await response.json();

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
        ?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("") || "";

    if (!text) {

      return res.status(500).json({
        error: "No output received from OpenAI"
      });
    }

    // -----------------------------------------
    // CLEAN JSON
    // -----------------------------------------

    let cleanText = text.trim();

    if (cleanText.startsWith("```")) {

      cleanText = cleanText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    }

    // -----------------------------------------
    // PARSE JSON
    // -----------------------------------------

    let cases;

    try {

      cases = JSON.parse(cleanText);

    } catch (error) {

      console.error(
        "Invalid JSON from model:",
        cleanText
      );

      return res.status(500).json({
        error: "AI returned invalid JSON"
      });
    }

    if (!Array.isArray(cases)) {

      return res.status(500).json({
        error: "AI response is not an array"
      });
    }

    // -----------------------------------------
    // NORMALIZE OUTPUT
    // -----------------------------------------

    cases = cases.map((testCase, index) => {

      const normalized = {
        ...testCase,

        id:
          testCase.id ||
          `${type.substring(0, 3).toUpperCase()}-${String(index + 1).padStart(3, "0")}`,

        title:
          testCase.title || "",

        objective:
          testCase.objective || "",

        preconditions:
          testCase.preconditions || "",

        steps:
          Array.isArray(testCase.steps)
            ? testCase.steps
            : [String(testCase.steps || "")],

        expectedResult:
          testCase.expectedResult || "",

        priority:
          testCase.priority || (
            priority !== "All"
              ? priority
              : "Medium"
          ),

        testData:
          typeof testCase.testData === "string"
            ? testCase.testData
            : JSON.stringify(
                testCase.testData ?? {},
                null,
                2
              )
      };

      if (type === "API") {

        normalized.api =
          testCase.api ||
          testCase.apiDetails ||
          {};
      }

      return normalized;
    });

    // -----------------------------------------
    // RETURN
    // -----------------------------------------

    return res.status(200).json({
      cases
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Server error"
    });
  }
};
