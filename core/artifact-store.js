/* =========================================================
   BAForge AI - Artifact Store
   Central storage layer for all workspace artifacts
========================================================= */

(function (global) {

  "use strict";

  const STORAGE_KEY = "baforge-workspace-v2";
  const LEGACY_STORAGE_KEY = "baforge-workspace-v1";
  const STORE_VERSION = 2;


  /* =======================================================
     ARTIFACT TYPES
  ======================================================= */

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
     ARTIFACT STATUS
  ======================================================= */

  const ARTIFACT_STATUS = Object.freeze({

    DRAFT: "draft",
    ACTIVE: "active",
    COMPLETED: "completed",
    ARCHIVED: "archived"

  });


  /* =======================================================
     UTILITIES
  ======================================================= */

  function now() {

    return new Date().toISOString();

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

    return (
      `${prefix || "artifact"}-${Date.now()}-${random}`
    );

  }


  function normalizeType(type) {

    if (!type) {

      return "unknown";

    }

    return String(type)
      .trim()
      .toLowerCase();

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
     MIGRATION
  ======================================================= */

  function migrateWorkspace(workspace) {

    if (
      !workspace ||
      typeof workspace !== "object"
    ) {

      return createWorkspace();

    }

    const migrated =
      clone(workspace);

    if (!migrated.id) {

      migrated.id =
        "default-workspace";

    }

    if (!migrated.name) {

      migrated.name =
        "BAForge Workspace";

    }

    if (!Array.isArray(migrated.artifacts)) {

      migrated.artifacts = [];

    }

    if (!Array.isArray(migrated.relationships)) {

      migrated.relationships = [];

    }

    if (!Array.isArray(migrated.snapshots)) {

      migrated.snapshots = [];

    }

    if (!isObject(migrated.metadata)) {

      migrated.metadata = {};

    }

    migrated.artifacts =
      migrated.artifacts.map(
        normalizeArtifact
      );

    migrated.version =
      STORE_VERSION;

    if (!migrated.createdAt) {

      migrated.createdAt =
        now();

    }

    if (!migrated.updatedAt) {

      migrated.updatedAt =
        now();

    }

    return migrated;

  }


  /* =======================================================
     STORAGE
  ======================================================= */

  function readRawStorage(key) {

    try {

      const raw =
        localStorage.getItem(key);

      if (!raw) {

        return null;

      }

      return JSON.parse(raw);

    } catch (error) {

      console.error(
        "[BAForge ArtifactStore] Failed to read storage:",
        error
      );

      return null;

    }

  }


  function readWorkspace() {

    let parsed =
      readRawStorage(
        STORAGE_KEY
      );


    /*
     * Backward compatibility:
     * migrate v1 workspace automatically.
     */

    if (!parsed) {

      const legacy =
        readRawStorage(
          LEGACY_STORAGE_KEY
        );

      if (legacy) {

        parsed =
          migrateWorkspace(
            legacy
          );

        writeWorkspace(
          parsed
        );

        return parsed;

      }

    }


    if (!parsed) {

      const workspace =
        createWorkspace();

      writeWorkspace(
        workspace
      );

      return workspace;

    }


    return migrateWorkspace(
      parsed
    );

  }


  function writeWorkspace(
    workspace
  ) {

    if (
      !workspace ||
      typeof workspace !== "object"
    ) {

      return false;

    }

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

    const source =
      isObject(artifact)
        ? clone(artifact)
        : {};

    const type =
      normalizeType(
        options.type ||
        source.type
      );

    const id =
      options.id ||
      source.id ||
      generateId(type);

    const timestamp =
      now();

    const metadata =
      isObject(source.metadata)
        ? clone(source.metadata)
        : {};

    /*
     * Preserve explicit provenance.
     * Never overwrite source metadata merely because
     * the artifact is saved from another workspace screen.
     */

    if (
      options.sourceKey !== undefined &&
      metadata.sourceKey === undefined
    ) {

      metadata.sourceKey =
        options.sourceKey;

    }

    if (
      options.origin !== undefined &&
      metadata.origin === undefined
    ) {

      metadata.origin =
        options.origin;

    }

    return {

      id,

      type,

      title:
        options.title !== undefined
          ? String(options.title || "")
          : String(
              source.title ||
              source.name ||
              ""
            ),

      content:
        source.content !== undefined
          ? clone(source.content)
          : clone(source),

      metadata,

      source:
        source.source !== undefined
          ? clone(source.source)
          : (
              options.source !== undefined
                ? clone(options.source)
                : null
            ),

      relationships:
        Array.isArray(
          source.relationships
        )
          ? clone(source.relationships)
          : [],

      version:
        Number(source.version) || 1,

      status:
        source.status ||
        ARTIFACT_STATUS.DRAFT,

      createdAt:
        source.createdAt ||
        timestamp,

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

    options =
      options || {};

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


      /*
       * Identity is immutable.
       */

      normalized.id =
        existing.id;

      normalized.type =
        existing.type;

      normalized.createdAt =
        existing.createdAt ||
        normalized.createdAt;

      normalized.version =
        Number(existing.version || 1) + 1;


      /*
       * Preserve provenance if the incoming
       * object does not explicitly provide it.
       */

      if (
        isObject(existing.metadata)
      ) {

        normalized.metadata =
          Object.assign(
            {},
            clone(existing.metadata),
            clone(normalized.metadata || {})
          );

      }


      workspace.artifacts[
        existingIndex
      ] = normalized;

    } else {

      workspace.artifacts.push(
        normalized
      );

    }


    const written =
      writeWorkspace(
        workspace
      );


    /*
     * Never pretend a failed localStorage write
     * was successful.
     */

    if (!written) {

      return null;

    }


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

    const normalizedType =
      normalizeType(type);

    const artifact = {

      id:
        options.id ||
        generateId(
          normalizedType
        ),

      type:
        normalizedType,

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
        ARTIFACT_STATUS.DRAFT,

      createdAt:
        now(),

      updatedAt:
        now()

    };


    return save(
      artifact,
      options
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

    const normalizedType =
      normalizeType(type);

    const workspace =
      readWorkspace();

    return workspace.artifacts
      .filter(
        item =>
          item.type ===
          normalizedType
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

      const normalizedType =
        normalizeType(
          options.type
        );

      result =
        result.filter(
          item =>
            item.type ===
            normalizedType
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


    return clone(
      result
    );

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

    const safeChanges =
      isObject(changes)
        ? clone(changes)
        : {};


    /*
     * Identity and type cannot be changed.
     */

    delete safeChanges.id;
    delete safeChanges.type;
    delete safeChanges.createdAt;
    delete safeChanges.version;
    delete safeChanges.updatedAt;


    const updated =
      Object.assign(
        {},
        current,
        safeChanges
      );


    updated.id =
      current.id;

    updated.type =
      current.type;

    updated.createdAt =
      current.createdAt;

    updated.version =
      Number(
        current.version || 1
      ) + 1;

    updated.updatedAt =
      now();


    workspace.artifacts[index] =
      updated;


    const written =
      writeWorkspace(
        workspace
      );


    if (!written) {

      return null;

    }


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
     * Remove every relationship connected
     * to the deleted artifact.
     */

    workspace.relationships =
      workspace.relationships.filter(
        relation =>
          relation.sourceId !== id &&
          relation.targetId !== id
      );


    /*
     * Keep historical snapshots.
     * They are intentionally not deleted.
     */


    const written =
      writeWorkspace(
        workspace
      );


    return written;

  }


  function removeByType(
    type
  ) {

    const normalizedType =
      normalizeType(type);

    const workspace =
      readWorkspace();

    const ids =
      workspace.artifacts
        .filter(
          item =>
            item.type ===
            normalizedType
        )
        .map(
          item =>
            item.id
        );


    if (!ids.length) {

      return 0;

    }


    const idSet =
      new Set(ids);


    workspace.artifacts =
      workspace.artifacts.filter(
        item =>
          !idSet.has(item.id)
      );


    workspace.relationships =
      workspace.relationships.filter(
        relation =>
          !idSet.has(
            relation.sourceId
          ) &&
          !idSet.has(
            relation.targetId
          )
      );


    const written =
      writeWorkspace(
        workspace
      );


    return written
      ? ids.length
      : 0;

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


    /*
     * Do not allow relationships to
     * non-existing artifacts.
     */

    const sourceExists =
      workspace.artifacts.some(
        artifact =>
          artifact.id ===
          relationship.sourceId
      );

    const targetExists =
      workspace.artifacts.some(
        artifact =>
          artifact.id ===
          relationship.targetId
      );


    if (
      !sourceExists ||
      !targetExists
    ) {

      throw new Error(
        "Both source and target artifacts must exist."
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


    const written =
      writeWorkspace(
        workspace
      );


    if (!written) {

      return null;

    }


    return clone(
      relation
    );

  }


  function removeRelationship(
    id
  ) {

    if (!id) {

      return false;

    }

    const workspace =
      readWorkspace();

    const before =
      workspace.relationships.length;


    workspace.relationships =
      workspace.relationships.filter(
        relation =>
          relation.id !== id
      );


    if (
      workspace.relationships.length ===
      before
    ) {

      return false;

    }


    return writeWorkspace(
      workspace
    );

  }


  function getRelationships(
    artifactId
  ) {

    if (!artifactId) {

      return [];

    }

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


  /* =======================================================
     WORKSPACE
  ======================================================= */

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


    const written =
      writeWorkspace(
        workspace
      );


    if (!written) {

      return null;

    }


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


    const imported =
      migrateWorkspace({
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
            ? clone(
                data.artifacts
              )
            : [],

        relationships:
          Array.isArray(
            data.relationships
          )
            ? clone(
                data.relationships
              )
            : [],

        snapshots:
          Array.isArray(
            data.snapshots
          )
            ? clone(
                data.snapshots
              )
            : []

      });


    if (
      options.replace !== false
    ) {

      const written =
        writeWorkspace(
          imported
        );


      if (!written) {

        return null;

      }


      return clone(
        imported
      );

    }


    imported.artifacts.forEach(
      artifact => {

        save(
          artifact
        );

      }
    );


    imported.relationships.forEach(
      relationship => {

        try {

          addRelationship(
            relationship
          );

        } catch (error) {

          console.warn(
            "[BAForge ArtifactStore] Skipped invalid relationship:",
            error
          );

        }

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

      /*
       * Remove the legacy store as well.
       * Otherwise an old workspace could be
       * migrated back after a clear.
       */

      localStorage.removeItem(
        LEGACY_STORAGE_KEY
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
     CLEAR ARTIFACT
  ======================================================= */

  function clearArtifact(
    id
  ) {

    return remove(id);

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  const ArtifactStore = {

    version:
      STORE_VERSION,

    STORAGE_KEY,

    ARTIFACT_TYPES,

    ARTIFACT_STATUS,

    createWorkspace,

    getWorkspace,

    save,

    create,

    get,

    getByType,

    list,

    update,

    remove,

    removeByType,

    clearArtifact,

    addRelationship,

    removeRelationship,

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
