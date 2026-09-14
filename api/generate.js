module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      requirement,
      type = "Functional",
      number = "5",
      detail = "Professional"
    } = req.body || {};

    if (!requirement || !requirement.trim()) {
      return res.status(400).json({
        error: "Requirement is required"
      });
    }

    const prompt = `
You are a professional QA and UAT Business Analyst.

Generate ${number} ${type} UAT test cases for the requirement below.

Requirement:
${requirement}

Detail level:
${detail}

Return ONLY a valid JSON array.

Each test case must contain exactly these fields:
id
title
objective
preconditions
steps
expectedResult
priority
testData

The "steps" field must be a clear numbered list.
The test cases must be realistic, professional and directly related to the requirement.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI request failed"
      });
    }

    const text =
      data.output?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("") || "";

    if (!text) {
      return res.status(500).json({
        error: "No output received from OpenAI"
      });
    }

    let cleanText = text.trim();

    if (cleanText.startsWith("```")) {
      cleanText = cleanText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    }

    let cases;

    try {
      cases = JSON.parse(cleanText);
    } catch (error) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: cleanText
      });
    }

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
