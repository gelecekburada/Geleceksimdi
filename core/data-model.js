/* =========================================================
   BAForge AI - Data Model
   Canonical business-analysis data model
========================================================= */

(function (global) {

  "use strict";

  const VERSION = "2.0.0";


  /* =======================================================
     CANONICAL ENUMS
  ======================================================= */

  const REQUIREMENT_TYPES = Object.freeze({

    FUNCTIONAL:
      "Functional",

    NON_FUNCTIONAL:
      "Non-Functional",

    BUSINESS_RULE:
      "Business Rule",

    REGULATORY:
      "Regulatory",

    DATA:
      "Data",

    INTEGRATION:
      "Integration",

    PROCESS:
      "Process",

    OTHER:
      "Other"

  });


  const PRIORITIES = Object.freeze({

    HIGH:
      "High",

    MEDIUM:
      "Medium",

    LOW:
      "Low",

    UNKNOWN:
      "Unknown"

  });


  const ARTIFACT_STATUSES = Object.freeze({

    DRAFT:
      "draft",

    ACTIVE:
      "active",

    COMPLETED:
      "completed",

    ARCHIVED:
      "archived"

  });


  const QUALITY_LEVELS = Object.freeze({

    HIGH:
      "high",

    MEDIUM:
      "medium",

    LOW:
      "low",

    UNKNOWN:
      "unknown"

  });


  /* =======================================================
     UTILITIES
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


  function now() {

    return new Date().toISOString();

  }


  function createId(
    prefix = "item"
  ) {

    return (
      `${prefix}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`
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
     NORMALIZATION
  ======================================================= */

  function normalizePriority(
    value
  ) {

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {

      return PRIORITIES.UNKNOWN;

    }

    const normalized =
      String(value)
        .trim()
        .toLowerCase();

    switch (normalized) {

      case "high":
      case "yüksek":
        return PRIORITIES.HIGH;

      case "medium":
      case "med":
      case "orta":
        return PRIORITIES.MEDIUM;

      case "low":
      case "düşük":
        return PRIORITIES.LOW;

      case "unknown":
      case "belirsiz":
        return PRIORITIES.UNKNOWN;

      default:
        return PRIORITIES.UNKNOWN;

    }

  }


  function normalizeRequirementType(
    value
  ) {

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {

      return REQUIREMENT_TYPES.OTHER;

    }

    const normalized =
      String(value)
        .trim()
        .toLowerCase();


    switch (normalized) {

      case "functional":
      case "fonksiyonel":
        return REQUIREMENT_TYPES.FUNCTIONAL;

      case "non-functional":
      case "non functional":
      case "nonfunctional":
      case "fonksiyonel olmayan":
        return REQUIREMENT_TYPES.NON_FUNCTIONAL;

      case "business rule":
      case "business_rule":
      case "business-rule":
      case "iş kuralı":
        return REQUIREMENT_TYPES.BUSINESS_RULE;

      case "regulatory":
      case "regulation":
      case "regülasyon":
      case "düzenleyici":
        return REQUIREMENT_TYPES.REGULATORY;

      case "data":
      case "veri":
        return REQUIREMENT_TYPES.DATA;

      case "integration":
      case "entegrasyon":
        return REQUIREMENT_TYPES.INTEGRATION;

      case "process":
      case "süreç":
        return REQUIREMENT_TYPES.PROCESS;

      case "other":
      case "diğer":
        return REQUIREMENT_TYPES.OTHER;

      default:
        return REQUIREMENT_TYPES.OTHER;

    }

  }


  function normalizeStatus(
    value
  ) {

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {

      return ARTIFACT_STATUSES.DRAFT;

    }

    const normalized =
      String(value)
        .trim()
        .toLowerCase();


    switch (normalized) {

      case "draft":
      case "taslak":
        return ARTIFACT_STATUSES.DRAFT;

      case "active":
      case "aktif":
        return ARTIFACT_STATUSES.ACTIVE;

      case "completed":
      case "complete":
      case "tamamlandı":
      case "tamamlandi":
        return ARTIFACT_STATUSES.COMPLETED;

      case "archived":
      case "archive":
      case "arşiv":
      case "arsiv":
        return ARTIFACT_STATUSES.ARCHIVED;

      default:
        return ARTIFACT_STATUSES.DRAFT;

    }

  }


  function normalizeScore(
    value
  ) {

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {

      return null;

    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(number)
      )
    );

  }


  /* =======================================================
     REQUIREMENT MODEL
  ======================================================= */

  function normalizeRequirement(
    input = {}
  ) {

    const source =
      isObject(input)
        ? clone(input)
        : {};


    const timestamp =
      now();


    /*
     * Preserve the canonical artifact identity
     * whenever one already exists.
     */

    const id =
      source.id ||
      createId(
        "requirement"
      );


    const requirementType =
      normalizeRequirementType(
        source.requirementType
      );


    const priority =
      normalizePriority(
        source.priority
      );


    const quality =
      isObject(
        source.quality
      )
        ? clone(
            source.quality
          )
        : {};


    const sourceRequirement =
      source.sourceRequirement ||
      source.originalRequirement ||
      (
        isObject(
          source.source
        )
          ? (
              source.source.text ||
              source.source.requirement ||
              null
            )
          : null
      );


    const originalRequirement =
      sourceRequirement ||
      null;


    return {

      id,

      artifactType:
        "requirement",

      title:
        String(
          source.title ||
          ""
        ).trim(),

      requirementType,

      priority,

      description:
        String(
          source.description ||
          source.requirement ||
          ""
        ).trim(),

      summary:
        String(
          source.summary ||
          ""
        ).trim(),

      originalRequirement,

      sourceRequirement,

      source:
        isObject(
          source.source
        )
          ? clone(
              source.source
            )
          : null,

      provenance:
        isObject(
          source.provenance
        )
          ? clone(
              source.provenance
            )
          : null,

      analysis:
        {

          ambiguities:
            Array.isArray(
              source.ambiguities
            )
              ? clone(
                  source.ambiguities
                )
              : [],

          missingInformation:
            Array.isArray(
              source.missingInformation
            )
              ? clone(
                  source.missingInformation
                )
              : [],

          assumptions:
            Array.isArray(
              source.assumptions
            )
              ? clone(
                  source.assumptions
                )
              : [],

          businessRules:
            Array.isArray(
              source.businessRules
            )
              ? clone(
                  source.businessRules
                )
              : [],

          openQuestions:
            Array.isArray(
              source.openQuestions
            )
              ? clone(
                  source.openQuestions
                )
              : [],

          edgeCases:
            Array.isArray(
              source.edgeCases
            )
              ? clone(
                  source.edgeCases
                )
              : [],

          analystNotes:
            Array.isArray(
              source.analystNotes
            )
              ? clone(
                  source.analystNotes
                )
              : (
                  source.analystNotes
                    ? [String(
                        source.analystNotes
                      )]
                    : []
                )

        },

      quality:
        {

          clarity:
            normalizeScore(
              quality.clarity ??
              source.clarityScore
            ),

          completeness:
            normalizeScore(
              quality.completeness ??
              source.completenessScore
            ),

          testability:
            normalizeScore(
              quality.testability ??
              source.testabilityScore
            )

        },

      /*
       * Artifact lifecycle status is deliberately
       * separate from workflow completion.
       */

      status:
        normalizeStatus(
          source.status
        ),

      metadata:
        isObject(
          source.metadata
        )
          ? clone(
              source.metadata
            )
          : {},

      relationships:
        Array.isArray(
          source.relationships
        )
          ? clone(
              source.relationships
            )
          : [],

      createdAt:
        source.createdAt ||
        timestamp,

      updatedAt:
        timestamp

    };

  }


  /* =======================================================
     REQUIREMENT CREATION
  ======================================================= */

  function createRequirement(
    data = {}
  ) {

    return normalizeRequirement(
      data
    );

  }


  /* =======================================================
     REQUIREMENT UPDATE
  ======================================================= */

  function updateRequirement(
    current,
    changes = {}
  ) {

    const base =
      normalizeRequirement(
        current || {}
      );


    const safeChanges =
      isObject(changes)
        ? clone(changes)
        : {};


    /*
     * Identity must never change through
     * an ordinary update.
     */

    delete safeChanges.id;

    delete safeChanges.artifactType;

    delete safeChanges.createdAt;


    const merged =
      Object.assign(
        {},
        base,
        safeChanges
      );


    /*
     * Re-normalize canonical fields.
     */

    merged.requirementType =
      normalizeRequirementType(
        merged.requirementType
      );

    merged.priority =
      normalizePriority(
        merged.priority
      );

    merged.status =
      normalizeStatus(
        merged.status
      );


    merged.id =
      base.id;

    merged.artifactType =
      "requirement";

    merged.createdAt =
      base.createdAt;

    merged.updatedAt =
      now();


    return normalizeRequirement(
      merged
    );

  }


  /* =======================================================
     REQUIREMENT VALIDATION
  ======================================================= */

  function validateRequirement(
    requirement
  ) {

    const errors = [];
    const warnings = [];


    if (
      !requirement ||
      typeof requirement !==
        "object"
    ) {

      errors.push(
        "Requirement is missing."
      );


      return {

        valid: false,

        errors,

        warnings

      };

    }


    if (
      !String(
        requirement.title ||
        ""
      ).trim()
    ) {

      warnings.push(
        "Requirement title is empty."
      );

    }


    if (
      !String(
        requirement.description ||
        ""
      ).trim()
    ) {

      errors.push(
        "Requirement description is required."
      );

    }


    const requirementType =
      normalizeRequirementType(
        requirement.requirementType
      );


    if (
      !Object.values(
        REQUIREMENT_TYPES
      ).includes(
        requirementType
      )
    ) {

      errors.push(
        "Requirement type is invalid."
      );

    }


    const priority =
      normalizePriority(
        requirement.priority
      );


    if (
      !Object.values(
        PRIORITIES
      ).includes(
        priority
      )
    ) {

      errors.push(
        "Requirement priority is invalid."
      );

    }


    [
      "clarity",
      "completeness",
      "testability"
    ].forEach(
      field => {

        const value =
          requirement.quality?.[
            field
          ];


        if (
          value !== null &&
          value !== undefined &&
          (
            !Number.isFinite(
              Number(value)
            ) ||
            Number(value) < 0 ||
            Number(value) > 100
          )
        ) {

          errors.push(
            `${field} score must be between 0 and 100.`
          );

        }

      }
    );


    return {

      valid:
        errors.length === 0,

      errors,

      warnings

    };

  }


  /* =======================================================
     ARTIFACT CONVERSION
  ======================================================= */

  function requirementToArtifact(
    requirement,
    options = {}
  ) {

    const normalized =
      normalizeRequirement(
        requirement
      );


    const metadata =
      Object.assign(
        {},
        clone(
          normalized.metadata
        ),
        clone(
          options.metadata || {}
        )
      );


    /*
     * Preserve provenance instead of replacing
     * the Analyzer source with the current workspace.
     */

    if (
      normalized.provenance &&
      !metadata.provenance
    ) {

      metadata.provenance =
        clone(
          normalized.provenance
        );

    }


    return {

      id:
        normalized.id,

      type:
        "requirement",

      title:
        normalized.title,

      content:
        clone(
          normalized
        ),

      metadata,

      source:
        clone(
          normalized.source
        ),

      relationships:
        clone(
          normalized.relationships
        ),

      status:
        normalized.status,

      version:
        Number(
          options.version || 1
        ),

      createdAt:
        normalized.createdAt,

      updatedAt:
        normalized.updatedAt

    };

  }


  function artifactToRequirement(
    artifact
  ) {

    if (!artifact) {

      return null;

    }


    const content =
      isObject(
        artifact.content
      )
        ? clone(
            artifact.content
          )
        : {};


    const metadata =
      isObject(
        artifact.metadata
      )
        ? clone(
            artifact.metadata
          )
        : {};


    const result =
      Object.assign(
        {},
        content
      );


    result.id =
      artifact.id ||
      result.id ||
      createId(
        "requirement"
      );


    result.artifactType =
      "requirement";


    result.status =
      normalizeStatus(
        artifact.status ||
        result.status
      );


    result.metadata =
      Object.assign(
        {},
        metadata,
        isObject(
          result.metadata
        )
          ? result.metadata
          : {}
      );


    if (
      artifact.source &&
      !result.source
    ) {

      result.source =
        clone(
          artifact.source
        );

    }


    if (
      !result.sourceRequirement &&
      result.originalRequirement
    ) {

      result.sourceRequirement =
        result.originalRequirement;

    }


    result.requirementType =
      normalizeRequirementType(
        result.requirementType
      );


    result.priority =
      normalizePriority(
        result.priority
      );


    result.updatedAt =
      artifact.updatedAt ||
      result.updatedAt ||
      now();


    result.createdAt =
      artifact.createdAt ||
      result.createdAt ||
      now();


    return normalizeRequirement(
      result
    );

  }


  /* =======================================================
     GENERIC ARTIFACT HELPERS
  ======================================================= */

  function createArtifactReference(
    artifact
  ) {

    if (!artifact) {

      return null;

    }


    return {

      id:
        artifact.id ||
        null,

      type:
        artifact.type ||
        artifact.artifactType ||
        null,

      title:
        artifact.title ||
        "",

      version:
        Number(
          artifact.version || 1
        ),

      status:
        normalizeStatus(
          artifact.status
        ),

      createdAt:
        artifact.createdAt ||
        null,

      updatedAt:
        artifact.updatedAt ||
        null

    };

  }


  /* =======================================================
     LEGACY COMPATIBILITY
  ======================================================= */

  function normalizeLegacyRequirement(
    data
  ) {

    return normalizeRequirement(
      data
    );

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  const BADataModel = {

    VERSION,

    REQUIREMENT_TYPES,

    PRIORITIES,

    ARTIFACT_STATUSES,

    QUALITY_LEVELS,

    clone,

    now,

    createId,

    normalizePriority,

    normalizeRequirementType,

    normalizeStatus,

    normalizeScore,

    normalizeRequirement,

    normalizeLegacyRequirement,

    createRequirement,

    updateRequirement,

    validateRequirement,

    requirementToArtifact,

    artifactToRequirement,

    createArtifactReference

  };


  global.BADataModel =
    BADataModel;


})(window);
