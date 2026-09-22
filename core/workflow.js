(function () {
  "use strict";

  const VERSION = "1.0.0";

  const WORKFLOW_STEPS = [
    "requirement",
    "user_story",
    "acceptance_criteria",
    "uat",
    "test_data",
    "process_flow",
    "traceability",
    "document"
  ];

  const STEP_LABELS = {
    requirement: "Requirement",
    user_story: "User Story",
    acceptance_criteria: "Acceptance Criteria",
    uat: "UAT Test Cases",
    test_data: "Test Data",
    process_flow: "Process Flow",
    traceability: "Traceability",
    document: "BA Document"
  };

  const NEXT_STEP_MAP = {
    requirement: "user_story",
    user_story: "acceptance_criteria",
    acceptance_criteria: "uat",
    uat: "test_data",
    test_data: "process_flow",
    process_flow: "traceability",
    traceability: "document",
    document: null
  };

  const PREVIOUS_STEP_MAP = {
    requirement: null,
    user_story: "requirement",
    acceptance_criteria: "user_story",
    uat: "acceptance_criteria",
    test_data: "uat",
    process_flow: "test_data",
    traceability: "process_flow",
    document: "traceability"
  };

  function clone(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return value;
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function createId(prefix = "workflow") {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function normalizeStep(step) {
    if (!step) {
      return null;
    }

    const normalized =
      String(step)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

    if (
      WORKFLOW_STEPS.includes(
        normalized
      )
    ) {
      return normalized;
    }

    return null;
  }

  function getStepLabel(step) {
    const normalized =
      normalizeStep(step);

    return (
      STEP_LABELS[normalized] ||
      normalized ||
      ""
    );
  }

  function getNextStep(step) {
    const normalized =
      normalizeStep(step);

    if (!normalized) {
      return null;
    }

    return (
      NEXT_STEP_MAP[normalized] ||
      null
    );
  }

  function getPreviousStep(step) {
    const normalized =
      normalizeStep(step);

    if (!normalized) {
      return null;
    }

    return (
      PREVIOUS_STEP_MAP[
        normalized
      ] || null
    );
  }

  function getWorkflowSteps() {
    return [
      ...WORKFLOW_STEPS
    ];
  }

  function getWorkflowDefinition() {
    return WORKFLOW_STEPS.map(
      (step, index) => ({
        step,
        label:
          getStepLabel(step),
        order: index + 1,
        previous:
          getPreviousStep(step),
        next:
          getNextStep(step)
      })
    );
  }

  function createWorkflowState(
    data = {}
  ) {
    const currentStep =
      normalizeStep(
        data.currentStep
      ) ||
      "requirement";

    return {
      id:
        data.id ||
        createId("workflow"),

      projectId:
        data.projectId || null,

      currentStep,

      completedSteps:
        Array.isArray(
          data.completedSteps
        )
          ? [
              ...new Set(
                data.completedSteps
                  .map(normalizeStep)
                  .filter(Boolean)
              )
            ]
          : [],

      skippedSteps:
        Array.isArray(
          data.skippedSteps
        )
          ? [
              ...new Set(
                data.skippedSteps
                  .map(normalizeStep)
                  .filter(Boolean)
              )
            ]
          : [],

      artifacts:
        data.artifacts || {},

      history:
        Array.isArray(
          data.history
        )
          ? clone(data.history)
          : [],

      createdAt:
        data.createdAt ||
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()
    };
  }

  function createWorkflowArtifact(
    data = {}
  ) {
    const step =
      normalizeStep(
        data.step
      );

    if (!step) {
      throw new Error(
        "A valid workflow step is required."
      );
    }

    return {
      id:
        data.id ||
        createId("artifact"),

      step,

      entityId:
        data.entityId || null,

      entityType:
        data.entityType || step,

      status:
        data.status || "draft",

      data:
        clone(data.data || {}),

      createdAt:
        data.createdAt ||
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()
    };
  }

  function addHistoryEntry(
    workflow,
    action,
    step,
    metadata = {}
  ) {
    const normalizedStep =
      normalizeStep(step);

    if (!workflow.history) {
      workflow.history = [];
    }

    workflow.history.push({
      id: createId("history"),

      action,

      step:
        normalizedStep,

      timestamp:
        new Date().toISOString(),

      metadata:
        clone(metadata)
    });

    workflow.updatedAt =
      new Date().toISOString();

    return workflow;
  }

  function setCurrentStep(
    workflow,
    step
  ) {
    if (!workflow) {
      throw new Error(
        "Workflow state is required."
      );
    }

    const normalizedStep =
      normalizeStep(step);

    if (!normalizedStep) {
      throw new Error(
        `Invalid workflow step: ${step}`
      );
    }

    workflow.currentStep =
      normalizedStep;

    addHistoryEntry(
      workflow,
      "step_changed",
      normalizedStep
    );

    return workflow;
  }

  function completeStep(
    workflow,
    step,
    artifact = null
  ) {
    if (!workflow) {
      throw new Error(
        "Workflow state is required."
      );
    }

    const normalizedStep =
      normalizeStep(step);

    if (!normalizedStep) {
      throw new Error(
        `Invalid workflow step: ${step}`
      );
    }

    if (
      !workflow.completedSteps.includes(
        normalizedStep
      )
    ) {
      workflow.completedSteps.push(
        normalizedStep
      );
    }

    workflow.skippedSteps =
      workflow.skippedSteps.filter(
        (item) =>
          item !== normalizedStep
      );

    if (artifact) {
      workflow.artifacts[
        normalizedStep
      ] = createWorkflowArtifact({
        ...artifact,
        step: normalizedStep
      });
    }

    addHistoryEntry(
      workflow,
      "step_completed",
      normalizedStep,
      {
        artifactId:
          artifact?.id || null
      }
    );

    return workflow;
  }

  function skipStep(
    workflow,
    step,
    reason = ""
  ) {
    if (!workflow) {
      throw new Error(
        "Workflow state is required."
      );
    }

    const normalizedStep =
      normalizeStep(step);

    if (!normalizedStep) {
      throw new Error(
        `Invalid workflow step: ${step}`
      );
    }

    if (
      !workflow.skippedSteps.includes(
        normalizedStep
      )
    ) {
      workflow.skippedSteps.push(
        normalizedStep
      );
    }

    workflow.completedSteps =
      workflow.completedSteps.filter(
        (item) =>
          item !== normalizedStep
      );

    addHistoryEntry(
      workflow,
      "step_skipped",
      normalizedStep,
      {
        reason
      }
    );

    return workflow;
  }

  function resetStep(
    workflow,
    step
  ) {
    if (!workflow) {
      throw new Error(
        "Workflow state is required."
      );
    }

    const normalizedStep =
      normalizeStep(step);

    if (!normalizedStep) {
      throw new Error(
        `Invalid workflow step: ${step}`
      );
    }

    workflow.completedSteps =
      workflow.completedSteps.filter(
        (item) =>
          item !== normalizedStep
      );

    workflow.skippedSteps =
      workflow.skippedSteps.filter(
        (item) =>
          item !== normalizedStep
      );

    delete workflow.artifacts[
      normalizedStep
    ];

    addHistoryEntry(
      workflow,
      "step_reset",
      normalizedStep
    );

    return workflow;
  }

  function getStepStatus(
    workflow,
    step
  ) {
    const normalizedStep =
      normalizeStep(step);

    if (!workflow || !normalizedStep) {
      return "not_started";
    }

    if (
      workflow.completedSteps.includes(
        normalizedStep
      )
    ) {
      return "completed";
    }

    if (
      workflow.skippedSteps.includes(
        normalizedStep
      )
    ) {
      return "skipped";
    }

    if (
      workflow.currentStep ===
      normalizedStep
    ) {
      return "current";
    }

    return "not_started";
  }

  function getProgress(
    workflow
  ) {
    if (!workflow) {
      return {
        completed: 0,
        total: WORKFLOW_STEPS.length,
        percentage: 0
      };
    }

    const completed =
      workflow.completedSteps.filter(
        (step) =>
          WORKFLOW_STEPS.includes(
            step
          )
      ).length;

    const total =
      WORKFLOW_STEPS.length;

    return {
      completed,
      total,
      percentage:
        total === 0
          ? 0
          : Math.round(
              (completed / total) *
                100
            )
    };
  }

  function getNextAction(
    workflow
  ) {
    if (!workflow) {
      return {
        step: "requirement",
        label:
          getStepLabel(
            "requirement"
          ),
        action: "start"
      };
    }

    const current =
      normalizeStep(
        workflow.currentStep
      );

    const next =
      getNextStep(current);

    if (
      current &&
      getStepStatus(
        workflow,
        current
      ) !== "completed"
    ) {
      return {
        step: current,
        label:
          getStepLabel(current),
        action: "complete_current"
      };
    }

    if (next) {
      return {
        step: next,
        label:
          getStepLabel(next),
        action: "continue"
      };
    }

    return {
      step: null,
      label: null,
      action: "complete"
    };
  }

  function getAvailableActions(
    workflow
  ) {
    if (!workflow) {
      return [];
    }

    const current =
      normalizeStep(
        workflow.currentStep
      );

    const next =
      getNextStep(current);

    const previous =
      getPreviousStep(current);

    return {
      current: current
        ? {
            step: current,
            label:
              getStepLabel(current)
          }
        : null,

      next: next
        ? {
            step: next,
            label:
              getStepLabel(next)
          }
        : null,

      previous: previous
        ? {
            step: previous,
            label:
              getStepLabel(previous)
          }
        : null,

      canComplete:
        current !== null,

      canSkip:
        current !== null,

      canGoNext:
        next !== null,

      canGoPrevious:
        previous !== null
    };
  }

  function attachArtifact(
    workflow,
    artifact
  ) {
    if (!workflow) {
      throw new Error(
        "Workflow state is required."
      );
    }

    const normalizedArtifact =
      createWorkflowArtifact(
        artifact
      );

    workflow.artifacts[
      normalizedArtifact.step
    ] = normalizedArtifact;

    workflow.updatedAt =
      new Date().toISOString();

    addHistoryEntry(
      workflow,
      "artifact_attached",
      normalizedArtifact.step,
      {
        artifactId:
          normalizedArtifact.id
      }
    );

    return normalizedArtifact;
  }

  function getArtifact(
    workflow,
    step
  ) {
    const normalizedStep =
      normalizeStep(step);

    if (!workflow || !normalizedStep) {
      return null;
    }

    return (
      workflow.artifacts[
        normalizedStep
      ] || null
    );
  }

  function getArtifacts(
    workflow
  ) {
    if (!workflow) {
      return [];
    }

    return Object.values(
      workflow.artifacts || {}
    ).map(clone);
  }

  function buildContext(
    workflow,
    options = {}
  ) {
    if (!workflow) {
      return {};
    }

    const includeSkipped =
      options.includeSkipped !== false;

    const context = {};

    WORKFLOW_STEPS.forEach(
      (step) => {
        const status =
          getStepStatus(
            workflow,
            step
          );

        if (
          status === "completed" ||
          (includeSkipped &&
            status === "skipped")
        ) {
          const artifact =
            getArtifact(
              workflow,
              step
            );

          context[step] =
            artifact
              ? clone(
                  artifact.data
                )
              : null;
        }
      }
    );

    return context;
  }

  function getStepContext(
    workflow,
    step
  ) {
    const artifact =
      getArtifact(
        workflow,
        step
      );

    return artifact
      ? clone(artifact.data)
      : null;
  }

  function createTransferPayload(
    workflow,
    fromStep,
    toStep
  ) {
    const normalizedFrom =
      normalizeStep(
        fromStep
      );

    const normalizedTo =
      normalizeStep(
        toStep
      );

    if (
      !normalizedFrom ||
      !normalizedTo
    ) {
      throw new Error(
        "Both source and target workflow steps are required."
      );
    }

    const sourceArtifact =
      getArtifact(
        workflow,
        normalizedFrom
      );

    if (!sourceArtifact) {
      throw new Error(
        `No artifact found for workflow step: ${normalizedFrom}`
      );
    }

    return {
      id: createId("transfer"),

      source: {
        step: normalizedFrom,
        label:
          getStepLabel(
            normalizedFrom
          ),
        artifactId:
          sourceArtifact.id
      },

      target: {
        step: normalizedTo,
        label:
          getStepLabel(
            normalizedTo
          )
      },

      context:
        buildContext(
          workflow
        ),

      sourceData:
        clone(
          sourceArtifact.data
        ),

      createdAt:
        new Date().toISOString()
    };
  }

  function validateWorkflow(
    workflow
  ) {
    const errors = [];
    const warnings = [];

    if (!workflow) {
      errors.push(
        "Workflow state is missing."
      );

      return {
        valid: false,
        errors,
        warnings
      };
    }

    if (
      !normalizeStep(
        workflow.currentStep
      )
    ) {
      errors.push(
        "Current workflow step is invalid."
      );
    }

    if (
      !Array.isArray(
        workflow.completedSteps
      )
    ) {
      errors.push(
        "Completed steps must be an array."
      );
    }

    if (
      !Array.isArray(
        workflow.skippedSteps
      )
    ) {
      errors.push(
        "Skipped steps must be an array."
      );
    }

    if (
      !workflow.artifacts ||
      typeof workflow.artifacts !==
        "object"
    ) {
      warnings.push(
        "No workflow artifacts are attached."
      );
    }

    const progress =
      getProgress(
        workflow
      );

    if (
      progress.completed === 0 &&
      workflow.currentStep !==
        "requirement"
    ) {
      warnings.push(
        "Current step is ahead of completed workflow steps."
      );
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  function serialize(
    workflow
  ) {
    return JSON.stringify(
      workflow,
      null,
      2
    );
  }

  function deserialize(
    value
  ) {
    if (!value) {
      return null;
    }

    if (
      typeof value ===
      "object"
    ) {
      return createWorkflowState(
        value
      );
    }

    try {
      return createWorkflowState(
        JSON.parse(value)
      );
    } catch (error) {
      throw new Error(
        "Invalid workflow JSON."
      );
    }
  }

  window.BAWorkflow = {
    VERSION,

    WORKFLOW_STEPS,
    STEP_LABELS,

    createId,
    clone,

    normalizeStep,
    getStepLabel,
    getNextStep,
    getPreviousStep,

    getWorkflowSteps,
    getWorkflowDefinition,

    createWorkflowState,
    createWorkflowArtifact,

    setCurrentStep,
    completeStep,
    skipStep,
    resetStep,

    getStepStatus,
    getProgress,
    getNextAction,
    getAvailableActions,

    attachArtifact,
    getArtifact,
    getArtifacts,

    buildContext,
    getStepContext,
    createTransferPayload,

    validateWorkflow,

    serialize,
    deserialize
  };
})();