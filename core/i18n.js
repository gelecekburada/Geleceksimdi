/* =========================================================
   BAForge AI - Internationalization
   Central language and translation system
========================================================= */

(function (global) {

  "use strict";


  const STORAGE_KEY =
    "baforge-language";


  const DEFAULT_LANGUAGE =
    "en";


  const SUPPORTED_LANGUAGES =
    Object.freeze([
      "en",
      "tr"
    ]);


  /* =======================================================
     TRANSLATIONS
  ======================================================= */

  const translations = {

    en: {

      common: {

        save:
          "Save",

        cancel:
          "Cancel",

        clear:
          "Clear",

        generate:
          "Generate",

        copy:
          "Copy",

        delete:
          "Delete",

        edit:
          "Edit",

        back:
          "Back",

        next:
          "Next",

        previous:
          "Previous",

        close:
          "Close",

        refresh:
          "Refresh",

        search:
          "Search",

        loading:
          "Loading...",

        available:
          "Available",

        notAvailable:
          "Not Available",

        noData:
          "No data available.",

        success:
          "Success",

        error:
          "Error",

        warning:
          "Warning"

      },


      workflow: {

        requirement:
          "Requirement",

        user_story:
          "User Story",

        acceptance_criteria:
          "Acceptance Criteria",

        uat:
          "UAT Test Cases",

        test_data:
          "Test Data",

        process_flow:
          "Process Flow",

        traceability:
          "Traceability",

        document:
          "BA Document"

      },


      artifacts: {

        requirement:
          "Requirements",

        user_story:
          "User Stories",

        acceptance_criterion:
          "Acceptance Criteria",

        test_case:
          "UAT Test Cases",

        test_data_set:
          "Test Data",

        process_flow:
          "Process Flows",

        traceability:
          "Traceability",

        document:
          "Documents",

        api_definition:
          "API Definitions",

        bpmn_diagram:
          "BPMN Diagrams",

        er_diagram:
          "ER Diagrams",

        ui_design:
          "UI Designs",

        flowchart:
          "Flowcharts",

        uml_diagram:
          "UML Diagrams",

        json_schema:
          "JSON Schemas",

        mock_data:
          "Mock Data",

        sql_document:
          "SQL Documents",

        regex_pattern:
          "Regex Patterns"

      },


      document: {

        title:
          "Business Analysis Document",

        requirement:
          "Requirement",

        userStory:
          "User Story",

        acceptanceCriteria:
          "Acceptance Criteria",

        uat:
          "UAT Test Cases",

        testData:
          "Test Data",

        processFlow:
          "Process Flow",

        traceability:
          "Traceability Summary",

        notes:
          "Notes",

        objective:
          "Document Objective",

        documentType:
          "Document Type",

        generated:
          "Generated",

        detail:
          "Detail"

      },


      messages: {

        artifactSaved:
          "Artifact saved successfully.",

        artifactUpdated:
          "Artifact updated successfully.",

        artifactDeleted:
          "Artifact deleted successfully.",

        documentGenerated:
          "BA Document generated successfully.",

        documentSaved:
          "BA Document saved successfully.",

        noRequirement:
          "No Requirement artifact is currently available.",

        noUserStory:
          "No User Story artifact is currently available.",

        noAcceptanceCriteria:
          "No Acceptance Criteria artifacts are currently available.",

        noTestCases:
          "No UAT Test Cases artifacts are currently available.",

        noTestData:
          "No Test Data artifacts are currently available.",

        noProcessFlow:
          "No Process Flow artifacts are currently available.",

        orphanArtifact:
          "This artifact is not connected to another workspace artifact."

      }

    },


    tr: {

      common: {

        save:
          "Kaydet",

        cancel:
          "İptal",

        clear:
          "Temizle",

        generate:
          "Oluştur",

        copy:
          "Kopyala",

        delete:
          "Sil",

        edit:
          "Düzenle",

        back:
          "Geri",

        next:
          "İleri",

        previous:
          "Önceki",

        close:
          "Kapat",

        refresh:
          "Yenile",

        search:
          "Ara",

        loading:
          "Yükleniyor...",

        available:
          "Mevcut",

        notAvailable:
          "Mevcut Değil",

        noData:
          "Gösterilecek veri yok.",

        success:
          "Başarılı",

        error:
          "Hata",

        warning:
          "Uyarı"

      },


      workflow: {

        requirement:
          "Requirement",

        user_story:
          "User Story",

        acceptance_criteria:
          "Acceptance Criteria",

        uat:
          "UAT Test Cases",

        test_data:
          "Test Data",

        process_flow:
          "Process Flow",

        traceability:
          "Traceability",

        document:
          "BA Document"

      },


      artifacts: {

        requirement:
          "Requirement",

        user_story:
          "User Story",

        acceptance_criterion:
          "Acceptance Criteria",

        test_case:
          "UAT Test Cases",

        test_data_set:
          "Test Data",

        process_flow:
          "Process Flow",

        traceability:
          "Traceability",

        document:
          "Dokümanlar",

        api_definition:
          "API Tanımları",

        bpmn_diagram:
          "BPMN Diyagramları",

        er_diagram:
          "ER Diyagramları",

        ui_design:
          "UI Tasarımları",

        flowchart:
          "Akış Diyagramları",

        uml_diagram:
          "UML Diyagramları",

        json_schema:
          "JSON Schema'ları",

        mock_data:
          "Mock Data",

        sql_document:
          "SQL Dokümanları",

        regex_pattern:
          "Regex Pattern'leri"

      },


      document: {

        title:
          "İş Analizi Dokümanı",

        requirement:
          "Requirement",

        userStory:
          "User Story",

        acceptanceCriteria:
          "Acceptance Criteria",

        uat:
          "UAT Test Cases",

        testData:
          "Test Data",

        processFlow:
          "Process Flow",

        traceability:
          "Traceability Özeti",

        notes:
          "Notlar",

        objective:
          "Doküman Amacı",

        documentType:
          "Doküman Tipi",

        generated:
          "Oluşturulma",

        detail:
          "Detay"

      },


      messages: {

        artifactSaved:
          "Artifact başarıyla kaydedildi.",

        artifactUpdated:
          "Artifact başarıyla güncellendi.",

        artifactDeleted:
          "Artifact başarıyla silindi.",

        documentGenerated:
          "BA Dokümanı başarıyla oluşturuldu.",

        documentSaved:
          "BA Dokümanı başarıyla kaydedildi.",

        noRequirement:
          "Şu anda mevcut bir Requirement artifact'ı bulunmuyor.",

        noUserStory:
          "Şu anda mevcut bir User Story artifact'ı bulunmuyor.",

        noAcceptanceCriteria:
          "Şu anda mevcut Acceptance Criteria bulunmuyor.",

        noTestCases:
          "Şu anda mevcut UAT Test Case bulunmuyor.",

        noTestData:
          "Şu anda mevcut Test Data bulunmuyor.",

        noProcessFlow:
          "Şu anda mevcut Process Flow bulunmuyor.",

        orphanArtifact:
          "Bu artifact başka bir workspace artifact'ına bağlı değil."

      }

    }

  };


  /* =======================================================
     LANGUAGE
  ======================================================= */

  function normalizeLanguage(
    language
  ) {

    if (!language) {
      return DEFAULT_LANGUAGE;
    }


    const normalized =
      String(language)
        .toLowerCase()
        .split("-")[0]
        .split("_")[0];


    return SUPPORTED_LANGUAGES.includes(
      normalized
    )
      ? normalized
      : DEFAULT_LANGUAGE;

  }


  function getLanguage() {

    try {

      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      return normalizeLanguage(
        saved
      );

    } catch {

      return DEFAULT_LANGUAGE;

    }

  }


  function setLanguage(
    language
  ) {

    const normalized =
      normalizeLanguage(
        language
      );


    try {

      localStorage.setItem(
        STORAGE_KEY,
        normalized
      );

    } catch {}


    apply(
      normalized
    );


    return normalized;

  }


  /* =======================================================
     TRANSLATION LOOKUP
  ======================================================= */

  function get(
    key,
    fallback
  ) {

    const language =
      getLanguage();

    const dictionary =
      translations[
        language
      ];


    const parts =
      String(key || "")
        .split(".");


    let value =
      dictionary;


    for (
      let i = 0;
      i < parts.length;
      i++
    ) {

      if (
        value === undefined ||
        value === null
      ) {

        break;

      }


      value =
        value[
          parts[i]
        ];

    }


    if (
      value === undefined ||
      value === null
    ) {

      if (
        fallback !== undefined
      ) {

        return fallback;

      }


      return key;

    }


    return value;

  }


  function t(
    key,
    fallback
  ) {

    return get(
      key,
      fallback
    );

  }


  /* =======================================================
     DOM TRANSLATION
  ======================================================= */

  function apply(
    language
  ) {

    const selected =
      normalizeLanguage(
        language
      );


    const dictionary =
      translations[
        selected
      ];


    /*
     * data-i18n
     *
     * Example:
     *
     * <span data-i18n="common.save"></span>
     */

    document
      .querySelectorAll(
        "[data-i18n]"
      )
      .forEach(
        element => {

          const key =
            element.getAttribute(
              "data-i18n"
            );

          const value =
            lookup(
              dictionary,
              key
            );


          if (
            value !== undefined
          ) {

            element.textContent =
              value;

          }

        }
      );


    /*
     * data-i18n-placeholder
     */

    document
      .querySelectorAll(
        "[data-i18n-placeholder]"
      )
      .forEach(
        element => {

          const key =
            element.getAttribute(
              "data-i18n-placeholder"
            );

          const value =
            lookup(
              dictionary,
              key
            );


          if (
            value !== undefined
          ) {

            element.placeholder =
              value;

          }

        }
      );


    /*
     * data-i18n-title
     */

    document
      .querySelectorAll(
        "[data-i18n-title]"
      )
      .forEach(
        element => {

          const key =
            element.getAttribute(
              "data-i18n-title"
            );

          const value =
            lookup(
              dictionary,
              key
            );


          if (
            value !== undefined
          ) {

            element.title =
              value;

          }

        }
      );


    /*
     * Keep document language
     * synchronized.
     */

    document.documentElement.lang =
      selected;

  }


  function lookup(
    dictionary,
    key
  ) {

    const parts =
      String(key || "")
        .split(".");


    let value =
      dictionary;


    for (
      let i = 0;
      i < parts.length;
      i++
    ) {

      if (
        value === undefined ||
        value === null
      ) {

        return undefined;

      }


      value =
        value[
          parts[i]
        ];

    }


    return value;

  }


  /* =======================================================
     LANGUAGE LIST
  ======================================================= */

  function getSupportedLanguages() {

    return SUPPORTED_LANGUAGES.map(
      code => ({

        code,

        label:
          code === "tr"
            ? "Türkçe"
            : "English"

      })
    );

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  const I18n = {

    DEFAULT_LANGUAGE,

    SUPPORTED_LANGUAGES,

    translations,

    getLanguage,

    setLanguage,

    get,

    t,

    apply,

    getSupportedLanguages

  };


  global.BAI18n =
    I18n;


  /*
   * Automatically apply
   * translations when DOM is ready.
   */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => {

        apply(
          getLanguage()
        );

      }
    );

  } else {

    apply(
      getLanguage()
    );

  }


})(window);
