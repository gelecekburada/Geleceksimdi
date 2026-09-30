/* =========================================================
   BAForge AI - Relationship Engine
   Central relationship and traceability engine
========================================================= */

(function (global) {

  "use strict";


  const RELATIONSHIP_TYPES = Object.freeze({

    DERIVED_FROM:
      "derived_from",

    IMPLEMENTS:
      "implements",

    SATISFIES:
      "satisfies",

    VALIDATES:
      "validates",

    USES:
      "uses",

    SUPPORTS:
      "supports",

    FLOWS_TO:
      "flows_to",

    RELATED_TO:
      "related_to",

    DEPENDS_ON:
      "depends_on",

    DOCUMENTS:
      "documents"

  });


  const WORKFLOW_TYPES = [

    "requirement",
    "user_story",
    "acceptance_criterion",
    "test_case",
    "test_data_set",
    "process_flow",
    "document"

  ];


  /* =======================================================
     HELPERS
  ======================================================= */

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


  function unique(
    array
  ) {

    return [
      ...new Set(
        array
      )
    ];

  }


  function getStore() {

    if (
      !global.BAArtifactStore
    ) {

      throw new Error(
        "BAArtifactStore is required before using BA Relationship Engine."
      );

    }

    return global.BAArtifactStore;

  }


  /* =======================================================
     ARTIFACT RELATIONSHIPS
  ======================================================= */

  function getRelationships(
    artifactId
  ) {

    return getStore()
      .getRelationships(
        artifactId
      );

  }


  function getParents(
    artifactId
  ) {

    return getRelationships(
      artifactId
    )
      .filter(
        relation =>
          relation.targetId ===
          artifactId
      )
      .map(
        relation =>
          getStore().get(
            relation.sourceId
          )
      )
      .filter(Boolean);

  }


  function getChildren(
    artifactId
  ) {

    return getRelationships(
      artifactId
    )
      .filter(
        relation =>
          relation.sourceId ===
          artifactId
      )
      .map(
        relation =>
          getStore().get(
            relation.targetId
          )
      )
      .filter(Boolean);

  }


  /* =======================================================
     LINK
  ======================================================= */

  function link(
    sourceId,
    targetId,
    relationship,
    options
  ) {

    options =
      options || {};

    const store =
      getStore();

    const source =
      store.get(
        sourceId
      );

    const target =
      store.get(
        targetId
      );


    if (!source) {

      throw new Error(
        `Source artifact not found: ${sourceId}`
      );

    }


    if (!target) {

      throw new Error(
        `Target artifact not found: ${targetId}`
      );

    }


    return store.addRelationship({

      sourceId,

      sourceType:
        source.type,

      targetId,

      targetType:
        target.type,

      relationship:
        relationship ||
        RELATIONSHIP_TYPES.RELATED_TO,

      metadata:
        options.metadata || {}

    });

  }


  /* =======================================================
     UNLINK
  ======================================================= */

  function unlink(
    sourceId,
    targetId,
    relationship
  ) {

    const store =
      getStore();

    const workspace =
      store.getWorkspace();


    const before =
      workspace.relationships.length;


    workspace.relationships =
      workspace.relationships.filter(
        relation => {

          const sameSource =
            relation.sourceId ===
            sourceId;

          const sameTarget =
            relation.targetId ===
            targetId;

          const sameType =
            !relationship ||
            relation.relationship ===
            relationship;


          return !(
            sameSource &&
            sameTarget &&
            sameType
          );

        }
      );


    if (
      workspace.relationships.length ===
      before
    ) {

      return false;

    }


    /*
     * Artifact Store currently exposes
     * workspace through a safe snapshot.
     *
     * Re-import the updated workspace.
     */

    store.importWorkspace(
      workspace
    );


    return true;

  }


  /* =======================================================
     TYPE CONNECTIONS
  ======================================================= */

  function getConnectionsByType(
    sourceType,
    targetType
  ) {

    const store =
      getStore();

    const workspace =
      store.getWorkspace();


    return workspace.relationships
      .filter(
        relation =>
          relation.sourceType ===
            sourceType &&
          relation.targetType ===
            targetType
      )
      .map(
        clone
      );

  }


  /* =======================================================
     TRACEABILITY CHAIN
  ======================================================= */

  function buildChain(
    artifactId,
    options
  ) {

    options =
      options || {};

    const maxDepth =
      Number(
        options.maxDepth
      ) || 20;

    const visited =
      new Set();

    const chain = [];


    function walk(
      id,
      depth
    ) {

      if (
        !id ||
        depth > maxDepth ||
        visited.has(id)
      ) {

        return;

      }


      visited.add(id);


      const artifact =
        getStore().get(
          id
        );


      if (!artifact) {
        return;
      }


      chain.push({

        depth,

        artifact:
          clone(artifact)

      });


      getChildren(
        id
      ).forEach(
        child => {

          walk(
            child.id,
            depth + 1
          );

        }
      );

    }


    walk(
      artifactId,
      0
    );


    return chain;

  }


  /* =======================================================
     COVERAGE
  ======================================================= */

  function calculateCoverage(
    options
  ) {

    options =
      options || {};

    const store =
      getStore();

    const artifacts =
      store.list();


    const relationships =
      store
        .getWorkspace()
        .relationships;


    const artifactCount =
      artifacts.length;


    if (!artifactCount) {

      return {

        artifactCount: 0,

        linkedArtifactCount: 0,

        orphanArtifactCount: 0,

        coverage: 0,

        relationships:
          relationships.length

      };

    }


    const linkedIds =
      new Set();


    relationships.forEach(
      relation => {

        linkedIds.add(
          relation.sourceId
        );

        linkedIds.add(
          relation.targetId
        );

      }
    );


    const linkedArtifactCount =
      artifacts.filter(
        artifact =>
          linkedIds.has(
            artifact.id
          )
      ).length;


    const orphanArtifactCount =
      artifactCount -
      linkedArtifactCount;


    const coverage =
      Math.round(
        linkedArtifactCount /
        artifactCount *
        100
      );


    return {

      artifactCount,

      linkedArtifactCount,

      orphanArtifactCount,

      coverage,

      relationships:
        relationships.length

    };

  }


  /* =======================================================
     WORKFLOW COVERAGE
  ======================================================= */

  function calculateWorkflowCoverage() {

    const store =
      getStore();


    const result = {};


    WORKFLOW_TYPES.forEach(
      type => {

        const artifacts =
          store.getByType(
            type
          );


        const linked =
          artifacts.filter(
            artifact =>
              getRelationships(
                artifact.id
              ).length > 0
          );


        result[type] = {

          total:
            artifacts.length,

          linked:
            linked.length,

          orphaned:
            artifacts.length -
            linked.length,

          coverage:
            artifacts.length
              ? Math.round(
                  linked.length /
                  artifacts.length *
                  100
                )
              : 0

        };

      }
    );


    return result;

  }


  /* =======================================================
     GAPS
  ======================================================= */

  function findGaps() {

    const store =
      getStore();

    const artifacts =
      store.list();


    return artifacts
      .filter(
        artifact =>
          getRelationships(
            artifact.id
          ).length === 0
      )
      .map(
        artifact => ({

          artifactId:
            artifact.id,

          artifactType:
            artifact.type,

          title:
            artifact.title ||
            "Untitled Artifact",

          issue:
            "orphaned_artifact"

        })
      );

  }


  /* =======================================================
     MATRIX
  ======================================================= */

  function buildMatrix(
    options
  ) {

    options =
      options || {};

    const sourceType =
      options.sourceType ||
      null;

    const targetType =
      options.targetType ||
      null;


    const store =
      getStore();

    const artifacts =
      store.list({

        type:
          sourceType ||
          undefined

      });


    return artifacts.map(
      source => {

        const relations =
          getRelationships(
            source.id
          );


        const targets =
          relations
            .filter(
              relation =>
                !targetType ||
                relation.targetType ===
                targetType
            )
            .map(
              relation =>
                store.get(
                  relation.targetId
                )
            )
            .filter(Boolean);


        return {

          source:
            clone(source),

          targets:
            clone(targets)

        };

      }
    );

  }


  /* =======================================================
     SUMMARY
  ======================================================= */

  function getSummary() {

    const store =
      getStore();

    const artifacts =
      store.list();

    const relationships =
      store.getWorkspace()
        .relationships;


    const byType = {};


    artifacts.forEach(
      artifact => {

        if (
          !byType[
            artifact.type
          ]
        ) {

          byType[
            artifact.type
          ] = 0;

        }

        byType[
          artifact.type
        ]++;

      }
    );


    return {

      totalArtifacts:
        artifacts.length,

      totalRelationships:
        relationships.length,

      byType,

      coverage:
        calculateCoverage(),

      workflow:
        calculateWorkflowCoverage(),

      gaps:
        findGaps()

    };

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  const RelationshipEngine = {

    RELATIONSHIP_TYPES,

    WORKFLOW_TYPES,

    link,

    unlink,

    getRelationships,

    getParents,

    getChildren,

    getConnectionsByType,

    buildChain,

    calculateCoverage,

    calculateWorkflowCoverage,

    findGaps,

    buildMatrix,

    getSummary

  };


  global.BARelationshipEngine =
    RelationshipEngine;


})(window);
