(function () {
  "use strict";

  const VERSION = "1.0.0";

  function createId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function createMetadata(type, id) {
    const now = new Date().toISOString();

    return {
      id: id || createId(type),
      type,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "draft"
    };
  }

  function createRequirement(data = {}) {
    const metadata = createMetadata("requirement", data.id);

    return {
      ...metadata,

      title: data.title || "",
      description: data.description || "",
      source: data.source || "",

      priority: data.priority || "medium",

      analysis: {
        clarityScore: data.analysis?.clarityScore ?? null,
        completenessScore: data.analysis?.completenessScore ?? null,
        testabilityScore: data.analysis?.testabilityScore ?? null,

        ambiguities: data.analysis?.ambiguities || [],
        missingInformation: data.analysis?.missingInformation || [],
        assumptions: data.analysis?.assumptions || [],
        businessRules: data.analysis?.businessRules || [],
        openQuestions: data.analysis?.openQuestions || [],
        edgeCases: data.analysis?.edgeCases || []
      }
    };
  }

  function createUserStory(data = {}) {
    const metadata = createMetadata("user_story", data.id);

    return {
      ...metadata,

      requirementId: data.requirementId || null,

      title: data.title || "",
      role: data.role || "",
      goal: data.goal || "",
      benefit: data.benefit || "",

      story: data.story || "",

      priority: data.priority || "medium"
    };
  }

  function createAcceptanceCriterion(data = {}) {
    const metadata = createMetadata(
      "acceptance_criterion",
      data.id
    );

    return {
      ...metadata,

      requirementId: data.requirementId || null,
      userStoryId: data.userStoryId || null,

      title: data.title || "",
      description: data.description || "",

      type: data.type || "positive",

      given: data.given || "",
      when: data.when || "",
      then: data.then || "",

      priority: data.priority || "medium"
    };
  }

  function createTestCase(data = {}) {
    const metadata = createMetadata("test_case", data.id);

    return {
      ...metadata,

      requirementId: data.requirementId || null,
      userStoryId: data.userStoryId || null,
      acceptanceCriterionId: data.acceptanceCriterionId || null,

      testCaseId: data.testCaseId || createId("TC"),

      title: data.title || "",
      description: data.description || "",

      preconditions: data.preconditions || [],

      steps: data.steps || [],

      expectedResult: data.expectedResult || "",

      testData: data.testData || [],

      priority: data.priority || "medium",

      testType: data.testType || "functional",

      status: data.status || "not_run"
    };
  }

  function createTestDataSet(data = {}) {
    const metadata = createMetadata("test_data_set", data.id);

    return {
      ...metadata,

      requirementId: data.requirementId || null,
      testCaseId: data.testCaseId || null,

      name: data.name || "",

      fields: data.fields || [],

      records: data.records || []
    };
  }

  function createProcessFlow(data = {}) {
    const metadata = createMetadata("process_flow", data.id);

    return {
      ...metadata,

      requirementId: data.requirementId || null,

      title: data.title || "",
      description: data.description || "",

      nodes: data.nodes || [],
      connections: data.connections || []
    };
  }

  function createTraceabilityLink(data = {}) {
    const metadata = createMetadata(
      "traceability_link",
      data.id
    );

    return {
      ...metadata,

      sourceId: data.sourceId || null,
      sourceType: data.sourceType || null,

      targetId: data.targetId || null,
      targetType: data.targetType || null,

      relationship: data.relationship || "supports"
    };
  }

  function createDocument(data = {}) {
    const metadata = createMetadata("document", data.id);

    return {
      ...metadata,

      projectId: data.projectId || null,

      documentType: data.documentType || "BA_DOCUMENT",

      title: data.title || "",

      sections: data.sections || [],

      format: data.format || "html"
    };
  }

  function createProject(data = {}) {
    const metadata = createMetadata("project", data.id);

    return {
      ...metadata,

      name: data.name || "",
      description: data.description || "",

      owner: data.owner || null,

      requirements: data.requirements || [],
      userStories: data.userStories || [],
      acceptanceCriteria: data.acceptanceCriteria || [],
      testCases: data.testCases || [],
      testDataSets: data.testDataSets || [],
      processFlows: data.processFlows || [],
      traceabilityLinks: data.traceabilityLinks || [],
      documents: data.documents || []
    };
  }

  function createVersionSnapshot(data = {}) {
    return {
      id: data.id || createId("snapshot"),

      entityId: data.entityId || null,
      entityType: data.entityType || null,

      version: data.version || 1,

      createdAt:
        data.createdAt || new Date().toISOString(),

      createdBy: data.createdBy || null,

      data: clone(data.data || {})
    };
  }

  function createTraceabilityChain(data = {}) {
    return {
      requirement: data.requirement || null,

      userStories: data.userStories || [],

      acceptanceCriteria:
        data.acceptanceCriteria || [],

      testCases: data.testCases || [],

      testDataSets:
        data.testDataSets || [],

      processFlows:
        data.processFlows || [],

      documents:
        data.documents || []
    };
  }

  function clone(value) {
    if (value === undefined || value === null) {
      return value;
    }

    return JSON.parse(JSON.stringify(value));
  }

  function touch(entity) {
    if (!entity) {
      return entity;
    }

    entity.updatedAt = new Date().toISOString();

    return entity;
  }

  window.BADataModel = {
    VERSION,

    createId,
    createMetadata,

    createRequirement,
    createUserStory,
    createAcceptanceCriterion,
    createTestCase,

    createTestDataSet,
    createProcessFlow,

    createTraceabilityLink,
    createDocument,
    createProject,

    createVersionSnapshot,
    createTraceabilityChain,

    clone,
    touch
  };
})();