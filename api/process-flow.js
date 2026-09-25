export default async function handler(req, res) {
  /*
   * BAForge AI
   * Process Flow Generator API
   *
   * Dedicated backend for:
   * - Process steps
   * - Actors / systems
   * - Decision points
   * - Alternative flows
   * - Exception flows
   * - Branching YES / NO logic
   */

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  try {
    const body = req.body || {};

    const context = String(
      body.context ||
      body.requirement ||
      ""
    ).trim();

    const processName = String(
      body.processName ||
      ""
    ).trim();

    const language =
      body.language === "tr"
        ? "tr"
        : "en";

    const detail =
      ["Basic", "Professional", "Comprehensive"].includes(
        body.detail
      )
        ? body.detail
        : "Professional";


    /* =====================================================
       VALIDATION
    ===================================================== */

    const words = context
      .split(/\s+/)
      .filter(Boolean);

    if (
      context.length < 15 ||
      words.length < 3
    ) {
      return res.status(400).json({
        error:
          "Please provide a clear business requirement or process description with at least 15 characters and 3 words."
      });
    }


    /* =====================================================
       API KEY
    ===================================================== */

    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error:
          "OPENAI_API_KEY is not configured."
      });
    }


    /* =====================================================
       LANGUAGE
    ===================================================== */

    const outputLanguage =
      language === "tr"
        ? "Turkish"
        : "English";


    /* =====================================================
       PROMPT
    ===================================================== */

    const prompt = `
You are a senior Business Analyst specializing in business process modeling.

Your task is to transform the supplied business requirement into a professional,
structured and logically connected BUSINESS PROCESS FLOW.

The output MUST represent the actual business logic contained in the requirement.

IMPORTANT:

1. Do NOT create a simple linear flow unless the requirement is genuinely linear.

2. If the requirement contains conditions, validations, approvals, failures,
   eligibility checks, balance checks, status checks, technical errors,
   alternative outcomes or exceptions, represent them as DECISION POINTS.

3. Decision points MUST create branches.

4. Branches MUST contain explicit outcomes such as:
   - YES / NO
   - VALID / INVALID
   - SUCCESS / FAILURE
   - APPROVED / REJECTED
   when appropriate.

5. Every branch should connect to another process step or an END node.

6. Do NOT invent unsupported business rules.

7. Do NOT invent regulatory requirements.

8. Do NOT invent numeric limits.

9. Do NOT invent actors unless they can reasonably be identified
   from the supplied context. If an actor/system is implied, identify it
   conservatively.

10. Keep the flow business-oriented rather than technical implementation-oriented.

11. The result must be useful for a Business Analyst, QA Analyst,
    Product Owner and developer.

12. The process must have a clear START and END.

13. Include exception flows when the requirement describes failure,
    rejection, timeout, technical error or invalid input.

14. Include alternative flows when a valid alternative path exists.

15. Decision points should contain explicit branch targets.

16. The flow should be internally consistent:
    every decision branch must point to a valid step ID or END.

17. Do not produce Mermaid syntax.
    Return structured JSON only.

PROCESS NAME:
${processName || "Auto-detect from requirement"}

BUSINESS CONTEXT:
${context}

OUTPUT LANGUAGE:
${outputLanguage}

DETAIL LEVEL:
${detail}


RETURN EXACTLY THIS JSON STRUCTURE:

{
  "processName": "string",
  "description": "string",

  "actors": [
    "string"
  ],

  "start": {
    "id": "START",
    "label": "string"
  },

  "steps": [
    {
      "id": "P01",
      "title": "string",
      "actor": "string",
      "system": "string",
      "action": "string",
      "expectedResult": "string"
    }
  ],

  "decisions": [
    {
      "id": "D01",
      "question": "string",
      "condition": "string",
      "yesLabel": "YES",
      "yesTo": "P02",
      "noLabel": "NO",
      "noTo": "P03"
    }
  ],

  "alternativeFlows": [
    {
      "id": "AF01",
      "trigger": "string",
      "path": "string"
    }
  ],

  "exceptionFlows": [
    {
      "id": "EF01",
      "trigger": "string",
      "path": "string"
    }
  ],

  "end": {
    "id": "END",
    "label": "string"
  }
}


JSON RULES:

- Step IDs must be unique.
- Decision IDs must be unique.
- Alternative Flow IDs must be unique.
- Exception Flow IDs must be unique.
- yesTo and noTo must reference an existing step ID or "END".
- If a decision branch terminates the process, use "END".
- Do not reference nonexistent IDs.
- Do not put decisions inside the steps array.
- A decision may occur after a step.
- The flow can contain multiple decision points.
- Use concise but meaningful step titles.
- expectedResult should explain the business outcome of the step.
- actors should contain unique meaningful actors/systems.
- Do not add information that is not supported by the requirement.
- Return ONLY valid JSON.
`;


    /* =====================================================
       OPENAI REQUEST
    ===================================================== */

    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${apiKey}`
          },

          body: JSON.stringify({
            model: "gpt-5.6-luna",

            input: prompt
          })
        }
      );


    const raw =
      await response.text();


    if (!response.ok) {

      let errorMessage =
        "OpenAI request failed.";

      try {

        const errorData =
          JSON.parse(raw);

        errorMessage =
          errorData?.error?.message ||
          errorMessage;

      } catch {
        // Keep default error.
      }

      return res.status(response.status).json({
        error: errorMessage
      });
    }


    /* =====================================================
       EXTRACT RESPONSE TEXT
    ===================================================== */

    let responseData;

    try {

      responseData =
        JSON.parse(raw);

    } catch {

      return res.status(500).json({
        error:
          "Invalid response received from OpenAI."
      });

    }


    let outputText =
      responseData.output_text ||
      "";


    /*
     * Fallback for Responses API structures
     * where output_text is not directly available.
     */

    if (!outputText) {

      const output =
        Array.isArray(responseData.output)
          ? responseData.output
          : [];

      const textParts = [];

      for (const item of output) {

        if (
          item &&
          Array.isArray(item.content)
        ) {

          for (const content of item.content) {

            if (
              content &&
              typeof content.text === "string"
            ) {

              textParts.push(
                content.text
              );

            }

          }

        }

      }

      outputText =
        textParts.join("\n");
    }


    if (!outputText.trim()) {

      return res.status(500).json({
        error:
          "OpenAI returned an empty Process Flow response."
      });

    }


    /* =====================================================
       CLEAN JSON
    ===================================================== */

    let cleaned =
      outputText.trim();


    /*
     * Remove markdown fences if the model
     * accidentally returns them.
     */

    cleaned =
      cleaned
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();


    let result;

    try {

      result =
        JSON.parse(cleaned);

    } catch {

      /*
       * Attempt to recover JSON if the model
       * returned explanatory text around it.
       */

      const firstBrace =
        cleaned.indexOf("{");

      const lastBrace =
        cleaned.lastIndexOf("}");

      if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
      ) {

        const jsonCandidate =
          cleaned.slice(
            firstBrace,
            lastBrace + 1
          );

        try {

          result =
            JSON.parse(
              jsonCandidate
            );

        } catch {

          return res.status(500).json({
            error:
              "The AI returned an invalid Process Flow structure."
          });

        }

      } else {

        return res.status(500).json({
          error:
            "The AI returned an invalid Process Flow structure."
        });

      }

    }


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    const normalized =
      normalizeProcessFlow(
        result
      );


    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(200).json(
      normalized
    );


  } catch (error) {

    console.error(
      "Process Flow API Error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Unexpected Process Flow generation error."
    });

  }
}


/* =========================================================
   NORMALIZATION FUNCTION
========================================================= */

function normalizeProcessFlow(data) {

  const source =
    data && typeof data === "object"
      ? data
      : {};


  /* -------------------------------------------------------
     PROCESS NAME
  ------------------------------------------------------- */

  const processName =
    String(
      source.processName ||
      source.name ||
      "Generated Process Flow"
    ).trim();


  /* -------------------------------------------------------
     DESCRIPTION
  ------------------------------------------------------- */

  const description =
    String(
      source.description ||
      source.summary ||
      ""
    ).trim();


  /* -------------------------------------------------------
     ACTORS
  ------------------------------------------------------- */

  let actors =
    Array.isArray(source.actors)
      ? source.actors
      : [];


  actors =
    actors
      .map(actor => {

        if (
          actor &&
          typeof actor === "object"
        ) {

          return (
            actor.name ||
            actor.title ||
            actor.actor ||
            actor.system ||
            ""
          );

        }

        return String(actor || "");

      })
      .map(x => x.trim())
      .filter(Boolean);


  actors =
    [...new Set(actors)];


  /* -------------------------------------------------------
     START
  ------------------------------------------------------- */

  const start = {

    id: "START",

    label:
      String(
        source?.start?.label ||
        "Start"
      ).trim()

  };


  /* -------------------------------------------------------
     STEPS
  ------------------------------------------------------- */

  let steps =
    Array.isArray(source.steps)
      ? source.steps
      : [];


  steps =
    steps.map(
      (step, index) => {

        const safeStep =
          step &&
          typeof step === "object"
            ? step
            : {};


        return {

          id:
            String(
              safeStep.id ||
              `P${String(index + 1).padStart(2, "0")}`
            ).trim(),

          title:
            String(
              safeStep.title ||
              safeStep.name ||
              `Process Step ${index + 1}`
            ).trim(),

          actor:
            String(
              safeStep.actor ||
              ""
            ).trim(),

          system:
            String(
              safeStep.system ||
              ""
            ).trim(),

          action:
            String(
              safeStep.action ||
              safeStep.description ||
              ""
            ).trim(),

          expectedResult:
            String(
              safeStep.expectedResult ||
              safeStep.result ||
              ""
            ).trim()

        };

      }
    );


  /* -------------------------------------------------------
     DECISIONS
  ------------------------------------------------------- */

  let decisions =
    Array.isArray(source.decisions)
      ? source.decisions
      : [];


  decisions =
    decisions.map(
      (decision, index) => {

        const safeDecision =
          decision &&
          typeof decision === "object"
            ? decision
            : {};


        return {

          id:
            String(
              safeDecision.id ||
              `D${String(index + 1).padStart(2, "0")}`
            ).trim(),

          question:
            String(
              safeDecision.question ||
              safeDecision.condition ||
              ""
            ).trim(),

          condition:
            String(
              safeDecision.condition ||
              safeDecision.question ||
              ""
            ).trim(),

          yesLabel:
            String(
              safeDecision.yesLabel ||
              "YES"
            ).trim(),

          yesTo:
            String(
              safeDecision.yesTo ||
              "END"
            ).trim(),

          noLabel:
            String(
              safeDecision.noLabel ||
              "NO"
            ).trim(),

          noTo:
            String(
              safeDecision.noTo ||
              "END"
            ).trim()

        };

      }
    );


  /* -------------------------------------------------------
     VALIDATE DECISION TARGETS
  ------------------------------------------------------- */

  const validStepIds =
    new Set(
      steps.map(
        step => step.id
      )
    );


  decisions =
    decisions.map(
      decision => {

        return {

          ...decision,

          yesTo:
            normalizeTarget(
              decision.yesTo,
              validStepIds
            ),

          noTo:
            normalizeTarget(
              decision.noTo,
              validStepIds
            )

        };

      }
    );


  /* -------------------------------------------------------
     ALTERNATIVE FLOWS
  ------------------------------------------------------- */

  const alternativeFlows =
    normalizeFlowList(
      source.alternativeFlows
    );


  /* -------------------------------------------------------
     EXCEPTION FLOWS
  ------------------------------------------------------- */

  const exceptionFlows =
    normalizeFlowList(
      source.exceptionFlows
    );


  /* -------------------------------------------------------
     END
  ------------------------------------------------------- */

  const end = {

    id: "END",

    label:
      String(
        source?.end?.label ||
        "End"
      ).trim()

  };


  return {

    processName,

    description,

    actors,

    start,

    steps,

    decisions,

    alternativeFlows,

    exceptionFlows,

    end

  };

}


/* =========================================================
   TARGET VALIDATION
========================================================= */

function normalizeTarget(
  target,
  validStepIds
) {

  const value =
    String(
      target ||
      "END"
    ).trim();


  if (
    value === "END" ||
    validStepIds.has(value)
  ) {

    return value;

  }


  /*
   * Try case-insensitive matching.
   */

  const matchingId =
    [...validStepIds]
      .find(
        id =>
          id.toLowerCase() ===
          value.toLowerCase()
      );


  if (matchingId) {
    return matchingId;
  }


  return "END";

}


/* =========================================================
   FLOW LIST NORMALIZATION
========================================================= */

function normalizeFlowList(value) {

  if (!Array.isArray(value)) {
    return [];
  }


  return value
    .map(
      (item, index) => {

        if (
          item &&
          typeof item === "object"
        ) {

          return {

            id:
              String(
                item.id ||
                `FLOW${String(index + 1).padStart(2, "0")}`
              ).trim(),

            trigger:
              String(
                item.trigger ||
                item.condition ||
                ""
              ).trim(),

            path:
              String(
                item.path ||
                item.description ||
                ""
              ).trim()

          };

        }


        return {

          id:
            `FLOW${String(index + 1).padStart(2, "0")}`,

          trigger:
            "",

          path:
            String(
              item || ""
            ).trim()

        };

      }
    )
    .filter(
      item =>
        item.trigger ||
        item.path
    );

}
