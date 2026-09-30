/* =========================================================
   BAForge AI - Artifact Store
   Central storage layer for all workspace artifacts
========================================================= */

(function (global) {

  "use strict";

  const STORAGE_KEY = "baforge-workspace-v1";
  const STORE_VERSION = 1;

  const ARTIFACT_TYPES = Object.freeze({
    REQUIREMENT: "requirement",
    USER_STORY: "user_story",
    ACCEPTANCE_CRITERION: "acceptance_criterion",
    TEST_CASE: "test_case",
    TEST_DATA_SET: "test_data_set",
    PROCESS_FLOW: "process_flow",
    TRACEABILITY: "traceability",
    DOCUMENT: "document",

    /* Future tools */
    API_DEFINITION: "api_definition",
    BPMN_DIAGRAM: "bpmn_diagram",
    ER_DIAGRAM: "er_diagram",
    UI_DESIGN: "ui_design",
    FLOWCHART: "flowchart",
    UML_DIAGRAM: "uml_diagram",
    JSON_SCHEMA: "json_schema",
    MOCK_DATA: "mock_data",
    SQL_DOCUMENT: "sql_document",
    REGEX_PATTERN: "regex_pattern"
  });


  /* =======================================================
     UTILITIES
  ======================================================= */

  function now() {
    return new Date().toISOString();
  }


  function generateId(type) {

    const prefix =
      String(type || "artifact")
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 8)
        .toLowerCase();

    const random =
      Math.random()
        .toString(36)
        .slice(2, 10);

    return `${prefix || "artifact"}-${Date.now()}-${random}`;
  }


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


  function isObject(value) {

    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );

  }


  /* =======================================================
     DEFAULT WORKSPACE
  ======================================================= */

  function createWorkspace(options) {

    options =
      options || {};

    const timestamp =
      now();

    return {

      id:
        options.id ||
        "default-workspace",

      name:
        options.name ||
        "BAForge Workspace",

      version:
        STORE_VERSION,

      createdAt:
        timestamp,

      updatedAt:
        timestamp,

      metadata:
        isObject(options.metadata)
          ? clone(options.metadata)
          : {},

      artifacts: [],

      relationships: [],

      snapshots: []
    };

  }


  /* =======================================================
     STORAGE
  ======================================================= */

  function readWorkspace() {

    try {

      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {

        const workspace =
          createWorkspace();

        writeWorkspace(
          workspace
        );

        return workspace;

      }

      const parsed =
        JSON.parse(raw);

      if (
        !parsed ||
        typeof parsed !== "object"
      ) {

        const workspace =
          createWorkspace();

        writeWorkspace(
          workspace
        );

        return workspace;

      }


      if (!Array.isArray(parsed.artifacts)) {
        parsed.artifacts = [];
      }

      if (!Array.isArray(parsed.relationships)) {
        parsed.relationships = [];
      }

      if (!Array.isArray(parsed.snapshots)) {
        parsed.snapshots = [];
      }


      if (!parsed.version) {
        parsed.version = STORE_VERSION;
      }


      return parsed;

    } catch (error) {

      console.error(
        "[BAForge ArtifactStore] Failed to read workspace:",
        error
      );

      return createWorkspace();

    }

  }


  function writeWorkspace(workspace) {

    workspace.updatedAt =
      now();

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(workspace)
      );

      return true;

    } catch (error) {

      console.error(
        "[BAForge ArtifactStore] Failed to write workspace:",
        error
      );

      return false;

    }

  }


  /* =======================================================
     ARTIFACT NORMALIZATION
  ======================================================= */

  function normalizeArtifact(
    artifact,
    options
  ) {

    options =
      options || {};

    const timestamp =
      now();

    const source =
      isObject(artifact)
        ? clone(artifact)
        : {};

    const type =
      options.type ||
      source.type ||
      "unknown";

    const id =
      options.id ||
      source.id ||
      generateId(type);

    const existingCreatedAt =
      source.createdAt ||
      timestamp;

    return {

      id,

      type,

      title:
        options.title ||
        source.title ||
        source.name ||
        "",

      content:
        source.content !== undefined
          ? clone(source.content)
          : clone(source),

      metadata:
        isObject(source.metadata)
          ? clone(source.metadata)
          : {},

      source:
        isObject(source.source)
          ? clone(source.source)
          : null,

      relationships:
        Array.isArray(source.relationships)
          ? clone(source.relationships)
          : [],

      version:
        Number(source.version) || 1,

      status:
        source.status ||
        "active",

      createdAt:
        existingCreatedAt,

      updatedAt:
        timestamp
    };

  }


  /* =======================================================
     CREATE / SAVE
  ======================================================= */

  function save(
    artifact,
    options
  ) {

    const workspace =
      readWorkspace();

    const normalized =
      normalizeArtifact(
        artifact,
        options
      );

    const existingIndex =
      workspace.artifacts.findIndex(
        item =>
          item.id === normalized.id
      );


    if (existingIndex >= 0) {

      const existing =
        workspace.artifacts[
          existingIndex
        ];

      normalized.createdAt =
        existing.createdAt ||
        normalized.createdAt;

      normalized.version =
        Number(existing.version || 1) + 1;

      workspace.artifacts[
        existingIndex
      ] = normalized;

    } else {

      workspace.artifacts.push(
        normalized
      );

    }


    writeWorkspace(
      workspace
    );

    return clone(
      normalized
    );

  }


  function create(
    type,
    content,
    options
  ) {

    options =
      options || {};

    const artifact = {

      id:
        options.id ||
        generateId(type),

      type,

      title:
        options.title ||
        "",

      content:
        clone(content),

      metadata:
        clone(
          options.metadata || {}
        ),

      source:
        clone(
          options.source || null
        ),

      relationships:
        clone(
          options.relationships || []
        ),

      version: 1,

      status:
        options.status ||
        "active",

      createdAt:
        now(),

      updatedAt:
        now()
    };


    return save(
      artifact
    );

  }


  /* =======================================================
     GET
  ======================================================= */

  function get(id) {

    if (!id) {
      return null;
    }

    const workspace =
      readWorkspace();

    const artifact =
      workspace.artifacts.find(
        item =>
          item.id === id
      );

    return artifact
      ? clone(artifact)
      : null;

  }


  function getByType(
    type
  ) {

    const workspace =
      readWorkspace();

    return workspace.artifacts
      .filter(
        item =>
          item.type === type
      )
      .map(clone);

  }


  function list(
    options
  ) {

    options =
      options || {};

    const workspace =
      readWorkspace();

    let result =
      workspace.artifacts.slice();


    if (options.type) {

      result =
        result.filter(
          item =>
            item.type ===
            options.type
        );

    }


    if (options.status) {

      result =
        result.filter(
          item =>
            item.status ===
            options.status
        );

    }


    if (
      options.search &&
      String(options.search).trim()
    ) {

      const search =
        String(
          options.search
        )
          .toLowerCase()
          .trim();

      result =
        result.filter(
          item => {

            const haystack =
              JSON.stringify(
                item
              ).toLowerCase();

            return haystack.includes(
              search
            );

          }
        );

    }


    result.sort(
      (a, b) =>
        new Date(
          b.updatedAt
        ) -
        new Date(
          a.updatedAt
        )
    );


    return clone(result);

  }


  /* =======================================================
     UPDATE
  ======================================================= */

  function update(
    id,
    changes
  ) {

    if (!id) {
      return null;
    }

    const workspace =
      readWorkspace();

    const index =
      workspace.artifacts.findIndex(
        item =>
          item.id === id
      );


    if (index < 0) {
      return null;
    }


    const current =
      workspace.artifacts[index];


    const updated =
      Object.assign(
        {},
        current,
        isObject(changes)
          ? clone(changes)
          : {}
      );


    updated.id =
      current.id;

    updated.type =
      current.type;

    updated.createdAt =
      current.createdAt;

    updated.version =
      Number(current.version || 1) + 1;

    updated.updatedAt =
      now();


    workspace.artifacts[index] =
      updated;


    writeWorkspace(
      workspace
    );


    return clone(
      updated
    );

  }


  /* =======================================================
     DELETE
  ======================================================= */

  function remove(
    id
  ) {

    if (!id) {
      return false;
    }

    const workspace =
      readWorkspace();

    const before =
      workspace.artifacts.length;


    workspace.artifacts =
      workspace.artifacts.filter(
        item =>
          item.id !== id
      );


    if (
      workspace.artifacts.length ===
      before
    ) {

      return false;

    }


    /*
     * Remove relationships
     * connected to deleted artifact.
     */

    workspace.relationships =
      workspace.relationships.filter(
        relation =>
          relation.sourceId !== id &&
          relation.targetId !== id
      );


    writeWorkspace(
      workspace
    );


    return true;

  }


  /* =======================================================
     RELATIONSHIPS
  ======================================================= */

  function addRelationship(
    relationship
  ) {

    const workspace =
      readWorkspace();

    if (
      !relationship ||
      !relationship.sourceId ||
      !relationship.targetId
    ) {

      throw new Error(
        "A relationship requires sourceId and targetId."
      );

    }


    const relation = {

      id:
        relationship.id ||
        generateId(
          "relationship"
        ),

      sourceId:
        relationship.sourceId,

      sourceType:
        relationship.sourceType ||
        null,

      targetId:
        relationship.targetId,

      targetType:
        relationship.targetType ||
        null,

      relationship:
        relationship.relationship ||
        "related_to",

      metadata:
        clone(
          relationship.metadata || {}
        ),

      createdAt:
        relationship.createdAt ||
        now(),

      updatedAt:
        now()
    };


    const duplicate =
      workspace.relationships.find(
        item =>
          item.sourceId ===
            relation.sourceId &&
          item.targetId ===
            relation.targetId &&
          item.relationship ===
            relation.relationship
      );


    if (duplicate) {

      return clone(
        duplicate
      );

    }


    workspace.relationships.push(
      relation
    );


    writeWorkspace(
      workspace
    );


    return clone(
      relation
    );

  }


  function getRelationships(
    artifactId
  ) {

    const workspace =
      readWorkspace();

    return workspace.relationships
      .filter(
        relation =>
          relation.sourceId === artifactId ||
          relation.targetId === artifactId
      )
      .map(clone);

  }


  function getWorkspace() {

    return clone(
      readWorkspace()
    );

  }


  /* =======================================================
     SNAPSHOTS
  ======================================================= */

  function createSnapshot(
    artifactId
  ) {

    const workspace =
      readWorkspace();

    const artifact =
      workspace.artifacts.find(
        item =>
          item.id === artifactId
      );


    if (!artifact) {
      return null;
    }


    const snapshot = {

      id:
        generateId(
          "snapshot"
        ),

      artifactId:
        artifact.id,

      artifactType:
        artifact.type,

      version:
        artifact.version,

      data:
        clone(artifact),

      createdAt:
        now()

    };


    workspace.snapshots.push(
      snapshot
    );


    writeWorkspace(
      workspace
    );


    return clone(
      snapshot
    );

  }


  function getSnapshots(
    artifactId
  ) {

    const workspace =
      readWorkspace();

    return workspace.snapshots
      .filter(
        snapshot =>
          snapshot.artifactId ===
          artifactId
      )
      .map(clone);

  }


  /* =======================================================
     IMPORT / EXPORT
  ======================================================= */

  function exportWorkspace() {

    return clone(
      readWorkspace()
    );

  }


  function importWorkspace(
    data,
    options
  ) {

    options =
      options || {};

    if (
      !data ||
      typeof data !== "object"
    ) {

      throw new Error(
        "Invalid workspace data."
      );

    }


    const imported = {

      id:
        data.id ||
        "default-workspace",

      name:
        data.name ||
        "BAForge Workspace",

      version:
        data.version ||
        STORE_VERSION,

      createdAt:
        data.createdAt ||
        now(),

      updatedAt:
        now(),

      metadata:
        clone(
          data.metadata || {}
        ),

      artifacts:
        Array.isArray(
          data.artifacts
        )
          ? clone(data.artifacts)
          : [],

      relationships:
        Array.isArray(
          data.relationships
        )
          ? clone(data.relationships)
          : [],

      snapshots:
        Array.isArray(
          data.snapshots
        )
          ? clone(data.snapshots)
          : []

    };


    if (
      options.replace !== false
    ) {

      writeWorkspace(
        imported
      );

      return clone(
        imported
      );

    }


    const workspace =
      readWorkspace();


    imported.artifacts.forEach(
      artifact => {

        save(
          artifact
        );

      }
    );


    imported.relationships.forEach(
      relationship => {

        addRelationship(
          relationship
        );

      }
    );


    return getWorkspace();

  }


  /* =======================================================
     CLEAR
  ======================================================= */

  function clear() {

    try {

      localStorage.removeItem(
        STORAGE_KEY
      );

      return true;

    } catch (error) {

      console.error(
        "[BAForge ArtifactStore] Failed to clear workspace:",
        error
      );

      return false;

    }

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  const ArtifactStore = {

    version:
      STORE_VERSION,

    STORAGE_KEY,

    ARTIFACT_TYPES,

    createWorkspace,

    getWorkspace,

    save,

    create,

    get,

    getByType,

    list,

    update,

    remove,

    addRelationship,

    getRelationships,

    createSnapshot,

    getSnapshots,

    exportWorkspace,

    importWorkspace,

    clear

  };


  global.BAArtifactStore =
    ArtifactStore;


})(window);
