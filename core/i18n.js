/* =========================================================
   BAForge AI — Central Internationalization
   core/i18n.js
   ========================================================= */

(function (window) {
  "use strict";

  const VERSION = "2.0.0";

  const TRANSLATIONS = {
    en: {
      /* =========================
         Common
         ========================= */
      common: {
        save: "Save",
        saved: "Saved successfully.",
        cancel: "Cancel",
        clear: "Clear",
        delete: "Delete",
        edit: "Edit",
        close: "Close",
        back: "Back",
        next: "Next",
        previous: "Previous",
        continue: "Continue",
        loading: "Loading...",
        required: "Required",
        optional: "Optional",
        yes: "Yes",
        no: "No",
        unknown: "Unknown",
        error: "An error occurred.",
        success: "Success",
        warning: "Warning",
        information: "Information",
        noData: "No data available.",
        draft: "Draft",
        active: "Active",
        completed: "Completed",
        archived: "Archived"
      },

      /* =========================
         Workflow
         ========================= */
      workflow: {
        requirement: "Requirement",
        user_story: "User Story",
        acceptance_criteria: "Acceptance Criteria",
        uat: "UAT Test Cases",
        test_data: "Test Data",
        process_flow: "Process Flow",
        traceability: "Traceability",
        document: "BA Documents",

        previousStep: "Previous Step",
        nextStep: "Next Step",
        workflow: "Workflow"
      },

      /* =========================
         Requirement Intelligence
         ========================= */
      analyzer: {
        title: "Requirement Intelligence",
        subtitle:
          "Analyze requirements, identify missing information, ambiguities and testability risks.",
        analyze: "Analyze Requirement",
        saveAnalysis: "Save Analysis",
        clear: "Clear",
        continue: "Continue with Selected Requirements",

        analysisCompleted: "Analysis Completed",
        noAnalysis: "No analysis available.",

        requirement: "Requirement",
        instruction: "Instruction",
        language: "Language",
        detail: "Detail Level",

        basic: "Basic",
        professional: "Professional",
        comprehensive: "Comprehensive",

        uploadPdf: "Upload PDF",
        uploadImage: "Upload Image",
        takePhoto: "Take Photo",
        removeFile: "Remove File",

        history: "Recent Analyses",
        noHistory: "No previous analyses found.",

        selectRequirement: "Select Requirement",
        selectedRequirements: "Selected Requirements",

        functional: "Functional",
        nonFunctional: "Non-Functional",
        businessRule: "Business Rule",
        regulatory: "Regulatory",
        data: "Data",
        integration: "Integration",
        process: "Process",
        other: "Other",

        high: "High",
        medium: "Medium",
        low: "Low",
        unknown: "Unknown",

        titleLabel: "Title",
        summary: "Summary",
        requirementType: "Requirement Type",
        priority: "Priority",

        clarityScore: "Clarity",
        completenessScore: "Completeness",
        testabilityScore: "Testability",

        ambiguities: "Ambiguities",
        missingInformation: "Missing Information",
        assumptions: "Assumptions",
        businessRules: "Business Rules",
        openQuestions: "Open Questions",
        edgeCases: "Edge Cases",
        analystNotes: "Analyst Notes",

        sourceDocument: "Source Document",
        sourceText: "Source Text",

        noRequirementSelected: "No requirement selected."
      },

      /* =========================
         Requirement Workspace
         ========================= */
      requirement: {
        title: "Requirement",
        subtitle:
          "Define, review and refine the business requirement.",

        requirementTitle: "Requirement Title",
        requirementType: "Requirement Type",
        priority: "Priority",
        description: "Requirement Description",

        quality: "Requirement Quality",
        clarity: "Clarity",
        completeness: "Completeness",
        testability: "Testability",

        summary: "Summary",
        ambiguities: "Ambiguities",
        missingInformation: "Missing Information",
        assumptions: "Assumptions",
        businessRules: "Business Rules",
        openQuestions: "Open Questions",
        edgeCases: "Edge Cases",
        analystNotes: "Analyst Notes",

        originalRequirement: "Original Requirement",

        noRequirementLoaded: "No Requirement Loaded",
        noRequirementDescription:
          "You can start by creating a requirement directly or continue from Requirement Intelligence.",

        saveRequirement: "Save Requirement",
        clearRequirement: "Clear Requirement",
        continueToUserStory: "Continue to User Story",

        saved: "Requirement saved successfully.",
        cleared: "Requirement cleared successfully.",
        invalid: "Please complete the required fields.",

        selectType: "Select Requirement Type",
        selectPriority: "Select Priority"
      },

      /* =========================
         User Story
         ========================= */
      userStory: {
        title: "User Story",
        subtitle: "Transform a requirement into a clear and actionable user story.",

        role: "As a",
        action: "I want to",
        benefit: "So that",

        acceptanceCriteria: "Acceptance Criteria",
        businessRules: "Business Rules",
        assumptions: "Assumptions",
        dependencies: "Dependencies",
        edgeCases: "Edge Cases",
        openQuestions: "Open Questions",

        generate: "Generate User Story",
        save: "Save User Story"
      },

      /* =========================
         Acceptance Criteria
         ========================= */
      acceptanceCriteria: {
        title: "Acceptance Criteria",
        subtitle:
          "Define clear and testable conditions for the requirement or user story.",

        criterion: "Criterion",
        criteria: "Acceptance Criteria",
        add: "Add Criterion",
        remove: "Remove Criterion",

        generate: "Generate Acceptance Criteria",
        save: "Save Acceptance Criteria"
      },

      /* =========================
         UAT
         ========================= */
      uat: {
        title: "UAT Test Cases",
        subtitle:
          "Create structured user acceptance test cases from the available requirements and acceptance criteria.",

        testCase: "Test Case",
        testCases: "Test Cases",
        testData: "Test Data",
        precondition: "Precondition",
        steps: "Steps",
        expectedResult: "Expected Result",
        actualResult: "Actual Result",
        status: "Status",

        generate: "Generate Test Cases",
        save: "Save Test Cases"
      },

      /* =========================
         Test Data
         ========================= */
      testData: {
        title: "Test Data",
        subtitle:
          "Define and manage test data required for validation and UAT.",

        dataSet: "Data Set",
        field: "Field",
        value: "Value",
        type: "Type",

        generate: "Generate Test Data",
        save: "Save Test Data"
      },

      /* =========================
         Process Flow
         ========================= */
      processFlow: {
        title: "Process Flow",
        subtitle:
          "Visualize the business process and its key steps.",

        start: "Start",
        end: "End",
        process: "Process",
        decision: "Decision",

        save: "Save Process Flow"
      },

      /* =========================
         Traceability
         ========================= */
      traceability: {
        title: "Traceability",
        subtitle:
          "Connect requirements, user stories, acceptance criteria, test cases and other artifacts.",

        source: "Source",
        target: "Target",
        relationship: "Relationship",

        requirementToUserStory: "Requirement → User Story",
        userStoryToAcceptanceCriteria:
          "User Story → Acceptance Criteria",
        acceptanceCriteriaToUat:
          "Acceptance Criteria → UAT",
        uatToTestData: "UAT → Test Data",

        noRelationships:
          "No traceability relationships found."
      },

      /* =========================
         Documents
         ========================= */
      document: {
        title: "BA Documents",
        subtitle:
          "Generate structured business analysis documentation from workspace artifacts.",

        documentType: "Document Type",
        preview: "Preview",
        generate: "Generate Document",
        export: "Export Document",

        requirementsDocument: "Requirements Document",
        businessAnalysisDocument: "Business Analysis Document",
        uatDocument: "UAT Document"
      }
    },

    tr: {
      /* =========================
         Common
         ========================= */
      common: {
        save: "Kaydet",
        saved: "Başarıyla kaydedildi.",
        cancel: "İptal",
        clear: "Temizle",
        delete: "Sil",
        edit: "Düzenle",
        close: "Kapat",
        back: "Geri",
        next: "İleri",
        previous: "Önceki",
        continue: "Devam Et",
        loading: "Yükleniyor...",
        required: "Zorunlu",
        optional: "Opsiyonel",
        yes: "Evet",
        no: "Hayır",
        unknown: "Bilinmiyor",
        error: "Bir hata oluştu.",
        success: "Başarılı",
        warning: "Uyarı",
        information: "Bilgi",
        noData: "Veri bulunamadı.",
        draft: "Taslak",
        active: "Aktif",
        completed: "Tamamlandı",
        archived: "Arşivlendi"
      },

      /* =========================
         Workflow
         ========================= */
      workflow: {
        requirement: "Gereksinim",
        user_story: "User Story",
        acceptance_criteria: "Kabul Kriterleri",
        uat: "UAT Test Senaryoları",
        test_data: "Test Verisi",
        process_flow: "Süreç Akışı",
        traceability: "İzlenebilirlik",
        document: "BA Dokümanları",

        previousStep: "Önceki Adım",
        nextStep: "Sonraki Adım",
        workflow: "İş Akışı"
      },

      /* =========================
         Requirement Intelligence
         ========================= */
      analyzer: {
        title: "Requirement Intelligence",
        subtitle:
          "Gereksinimleri analiz edin, eksik bilgileri, belirsizlikleri ve test edilebilirlik risklerini belirleyin.",
        analyze: "Gereksinimi Analiz Et",
        saveAnalysis: "Analizi Kaydet",
        clear: "Temizle",
        continue: "Seçilen Gereksinimlere Devam Et",

        analysisCompleted: "Analiz Tamamlandı",
        noAnalysis: "Analiz bulunamadı.",

        requirement: "Gereksinim",
        instruction: "Talimat",
        language: "Dil",
        detail: "Detay Seviyesi",

        basic: "Temel",
        professional: "Profesyonel",
        comprehensive: "Kapsamlı",

        uploadPdf: "PDF Yükle",
        uploadImage: "Görsel Yükle",
        takePhoto: "Fotoğraf Çek",
        removeFile: "Dosyayı Kaldır",

        history: "Son Analizler",
        noHistory: "Önceki analiz bulunamadı.",

        selectRequirement: "Gereksinim Seç",
        selectedRequirements: "Seçilen Gereksinimler",

        functional: "Fonksiyonel",
        nonFunctional: "Fonksiyonel Olmayan",
        businessRule: "İş Kuralı",
        regulatory: "Regülasyon",
        data: "Veri",
        integration: "Entegrasyon",
        process: "Süreç",
        other: "Diğer",

        high: "Yüksek",
        medium: "Orta",
        low: "Düşük",
        unknown: "Bilinmiyor",

        titleLabel: "Başlık",
        summary: "Özet",
        requirementType: "Gereksinim Tipi",
        priority: "Öncelik",

        clarityScore: "Netlik",
        completenessScore: "Tamlık",
        testabilityScore: "Test Edilebilirlik",

        ambiguities: "Belirsizlikler",
        missingInformation: "Eksik Bilgiler",
        assumptions: "Varsayımlar",
        businessRules: "İş Kuralları",
        openQuestions: "Açık Sorular",
        edgeCases: "Kenar Durumları",
        analystNotes: "Analist Notları",

        sourceDocument: "Kaynak Doküman",
        sourceText: "Kaynak Metin",

        noRequirementSelected: "Gereksinim seçilmedi."
      },

      /* =========================
         Requirement Workspace
         ========================= */
      requirement: {
        title: "Gereksinim",
        subtitle:
          "İş gereksinimini tanımlayın, gözden geçirin ve geliştirin.",

        requirementTitle: "Gereksinim Başlığı",
        requirementType: "Gereksinim Tipi",
        priority: "Öncelik",
        description: "Gereksinim Açıklaması",

        quality: "Gereksinim Kalitesi",
        clarity: "Netlik",
        completeness: "Tamlık",
        testability: "Test Edilebilirlik",

        summary: "Özet",
        ambiguities: "Belirsizlikler",
        missingInformation: "Eksik Bilgiler",
        assumptions: "Varsayımlar",
        businessRules: "İş Kuralları",
        openQuestions: "Açık Sorular",
        edgeCases: "Kenar Durumları",
        analystNotes: "Analist Notları",

        originalRequirement: "Orijinal Gereksinim",

        noRequirementLoaded: "Gereksinim Yüklenmedi",
        noRequirementDescription:
          "Doğrudan yeni bir gereksinim oluşturabilir veya Requirement Intelligence üzerinden devam edebilirsiniz.",

        saveRequirement: "Gereksinimi Kaydet",
        clearRequirement: "Gereksinimi Temizle",
        continueToUserStory: "User Story'ye Devam Et",

        saved: "Gereksinim başarıyla kaydedildi.",
        cleared: "Gereksinim başarıyla temizlendi.",
        invalid: "Lütfen zorunlu alanları doldurun.",

        selectType: "Gereksinim Tipi Seçin",
        selectPriority: "Öncelik Seçin"
      },

      /* =========================
         User Story
         ========================= */
      userStory: {
        title: "User Story",
        subtitle:
          "Bir gereksinimi açık ve uygulanabilir bir user story'ye dönüştürün.",

        role: "Bir",
        action: "şunu yapmak istiyorum",
        benefit: "böylece",

        acceptanceCriteria: "Kabul Kriterleri",
        businessRules: "İş Kuralları",
        assumptions: "Varsayımlar",
        dependencies: "Bağımlılıklar",
        edgeCases: "Kenar Durumları",
        openQuestions: "Açık Sorular",

        generate: "User Story Oluştur",
        save: "User Story'yi Kaydet"
      },

      /* =========================
         Acceptance Criteria
         ========================= */
      acceptanceCriteria: {
        title: "Kabul Kriterleri",
        subtitle:
          "Gereksinim veya user story için açık ve test edilebilir koşullar tanımlayın.",

        criterion: "Kriter",
        criteria: "Kabul Kriterleri",
        add: "Kriter Ekle",
        remove: "Kriteri Kaldır",

        generate: "Kabul Kriterleri Oluştur",
        save: "Kabul Kriterlerini Kaydet"
      },

      /* =========================
         UAT
         ========================= */
      uat: {
        title: "UAT Test Senaryoları",
        subtitle:
          "Mevcut gereksinim ve kabul kriterlerinden yapılandırılmış kullanıcı kabul test senaryoları oluşturun.",

        testCase: "Test Senaryosu",
        testCases: "Test Senaryoları",
        testData: "Test Verisi",
        precondition: "Ön Koşul",
        steps: "Adımlar",
        expectedResult: "Beklenen Sonuç",
        actualResult: "Gerçekleşen Sonuç",
        status: "Durum",

        generate: "Test Senaryoları Oluştur",
        save: "Test Senaryolarını Kaydet"
      },

      /* =========================
         Test Data
         ========================= */
      testData: {
        title: "Test Verisi",
        subtitle:
          "Validasyon ve UAT için gerekli test verilerini tanımlayın ve yönetin.",

        dataSet: "Veri Seti",
        field: "Alan",
        value: "Değer",
        type: "Tip",

        generate: "Test Verisi Oluştur",
        save: "Test Verisini Kaydet"
      },

      /* =========================
         Process Flow
         ========================= */
      processFlow: {
        title: "Süreç Akışı",
        subtitle:
          "İş sürecini ve temel adımlarını görselleştirin.",

        start: "Başlangıç",
        end: "Bitiş",
        process: "Süreç",
        decision: "Karar",

        save: "Süreç Akışını Kaydet"
      },

      /* =========================
         Traceability
         ========================= */
      traceability: {
        title: "İzlenebilirlik",
        subtitle:
          "Gereksinim, user story, kabul kriterleri, test senaryoları ve diğer artifact'ler arasındaki bağlantıları yönetin.",

        source: "Kaynak",
        target: "Hedef",
        relationship: "İlişki",

        requirementToUserStory: "Gereksinim → User Story",
        userStoryToAcceptanceCriteria:
          "User Story → Kabul Kriterleri",
        acceptanceCriteriaToUat:
          "Kabul Kriterleri → UAT",
        uatToTestData: "UAT → Test Verisi",

        noRelationships:
          "Herhangi bir izlenebilirlik ilişkisi bulunamadı."
      },

      /* =========================
         Documents
         ========================= */
      document: {
        title: "BA Dokümanları",
        subtitle:
          "Workspace artifact'lerinden yapılandırılmış iş analizi dokümanları oluşturun.",

        documentType: "Doküman Tipi",
        preview: "Önizleme",
        generate: "Doküman Oluştur",
        export: "Dokümanı Dışa Aktar",

        requirementsDocument: "Gereksinim Dokümanı",
        businessAnalysisDocument: "İş Analizi Dokümanı",
        uatDocument: "UAT Dokümanı"
      }
    }
  };

  /* =========================================================
     Helpers
     ========================================================= */

  function normalizeLanguage(language) {
    return language === "tr" ? "tr" : "en";
  }

  function getByPath(object, path) {
    if (!object || !path) {
      return undefined;
    }

    const parts = String(path).split(".");
    let current = object;

    for (const part of parts) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object" ||
        !(part in current)
      ) {
        return undefined;
      }

      current = current[part];
    }

    return current;
  }

  function translate(key, language) {
    const lang = normalizeLanguage(
      language ||
        window.localStorage.getItem("baforge-language") ||
        "en"
    );

    const primary = getByPath(TRANSLATIONS[lang], key);

    if (primary !== undefined) {
      return primary;
    }

    const fallback = getByPath(TRANSLATIONS.en, key);

    if (fallback !== undefined) {
      return fallback;
    }

    return key;
  }

  function setLanguage(language) {
    const normalized = normalizeLanguage(language);

    try {
      window.localStorage.setItem(
        "baforge-language",
        normalized
      );
    } catch (error) {
      // Storage may be unavailable in restricted environments.
    }

    window.dispatchEvent(
      new CustomEvent("baforge:language-changed", {
        detail: {
          language: normalized
        }
      })
    );

    return normalized;
  }

  function getLanguage() {
    try {
      return normalizeLanguage(
        window.localStorage.getItem("baforge-language") || "en"
      );
    } catch (error) {
      return "en";
    }
  }

  function getTranslations(language) {
    const lang = normalizeLanguage(language || getLanguage());

    return TRANSLATIONS[lang];
  }

  /*
   * Supports:
   *
   *   BAI18n.t("requirement.title")
   *
   * and:
   *
   *   BAI18n.t("requirement.title", "tr")
   *
   * The second argument is intentionally supported because
   * core/workflow.js may request a specific language.
   */
  function t(key, language) {
    return translate(key, language);
  }

  /*
   * Translate an element using:
   *
   *   data-i18n="requirement.title"
   *
   * Optional:
   *
   *   data-i18n-placeholder="requirement.description"
   *   data-i18n-title="common.save"
   */
  function translatePage(root, language) {
    const container = root || document;

    container
      .querySelectorAll("[data-i18n]")
      .forEach(function (element) {
        const key = element.getAttribute("data-i18n");

        if (!key) {
          return;
        }

        element.textContent = t(key, language);
      });

    container
      .querySelectorAll("[data-i18n-placeholder]")
      .forEach(function (element) {
        const key = element.getAttribute(
          "data-i18n-placeholder"
        );

        if (!key) {
          return;
        }

        element.setAttribute(
          "placeholder",
          t(key, language)
        );
      });

    container
      .querySelectorAll("[data-i18n-title]")
      .forEach(function (element) {
        const key = element.getAttribute("data-i18n-title");

        if (!key) {
          return;
        }

        element.setAttribute("title", t(key, language));
      });

    return normalizeLanguage(language || getLanguage());
  }

  function applyLanguage(language) {
    const normalized = setLanguage(language);

    document.documentElement.lang = normalized;

    translatePage(document, normalized);

    return normalized;
  }

  /* =========================================================
     Public API
     ========================================================= */

  window.BAI18n = {
    VERSION,

    translations: TRANSLATIONS,

    t,
    getLanguage,
    setLanguage,
    applyLanguage,
    translatePage,
    getTranslations,

    normalizeLanguage
  };

  /*
   * Automatically apply the saved language when the page is
   * ready. This does not interfere with pages that already
   * have their own initialization logic.
   */
  document.addEventListener("DOMContentLoaded", function () {
    const language = getLanguage();

    document.documentElement.lang = language;

    translatePage(document, language);
  });

})(window);
