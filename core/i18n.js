/* =========================================================
   BAForge AI - Central i18n
   ---------------------------------------------------------
   Centralized language system for BAForge AI.

   Supported languages:
   - en: English
   - tr: Türkçe

   Future languages can be added without changing
   individual page implementations.
========================================================= */

(function (global) {

  "use strict";


  /* =======================================================
     LANGUAGE CONFIGURATION
  ======================================================= */

  const SUPPORTED_LANGUAGES = {

    en: {
      code: "en",
      name: "English",
      nativeName: "English"
    },

    tr: {
      code: "tr",
      name: "Turkish",
      nativeName: "Türkçe"
    }

  };


  /* =======================================================
     TRANSLATIONS
  ======================================================= */

  const translations = {

    en: {

      /* ---------------------------------------------------
         GLOBAL
      --------------------------------------------------- */

      global: {

        appName:
          "BAForge AI",

        home:
          "Home",

        analyzer:
          "Analyzer",

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
          "Traceability",

        document:
          "BA Document",

        tools:
          "Tools",

        language:
          "Language",

        previous:
          "Previous Step",

        next:
          "Next Step",

        continue:
          "Continue",

        back:
          "Back",

        save:
          "Save",

        clear:
          "Clear",

        cancel:
          "Cancel",

        generate:
          "Generate",

        refresh:
          "Refresh",

        copy:
          "Copy",

        delete:
          "Delete",

        edit:
          "Edit",

        close:
          "Close",

        available:
          "Available",

        notAvailable:
          "Not Available",

        loading:
          "Loading...",

        success:
          "Success",

        error:
          "Error",

        warning:
          "Warning",

        noData:
          "No data available"

      },


      /* ---------------------------------------------------
         WORKFLOW
      --------------------------------------------------- */

      workflow: {

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
          "Traceability",

        document:
          "BA Document",

        previous:
          "Previous Step",

        next:
          "Next Step"

      },


      /* ---------------------------------------------------
         NAVIGATION
      --------------------------------------------------- */

      navigation: {

        home:
          "Home",

        analyzer:
          "Analyzer",

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
          "Traceability",

        document:
          "BA Document",

        tools:
          "Tools"

      },


      /* ---------------------------------------------------
         REQUIREMENT ANALYZER
      --------------------------------------------------- */

      analyzer: {

        badge:
          "Requirement Analyzer",

        title:
          "Analyze Requirements Before You Build",

        subtitle:
          "Use text, PDF documents or images as context. Add instructions only when you need them.",

        inputTitle:
          "What would you like BAForge AI to analyze?",

        inputDescription:
          "Write a requirement, attach a PDF or image, or use both. A written instruction is optional when a source is attached.",

        placeholder:
          "Tell BAForge AI what you want to analyze...",

        hint:
          "Optional instruction: focus on limits, rules, gaps or specific sections.",

        outputLanguage:
          "Output Language",

        analysisDepth:
          "Analysis Depth",

        basic:
          "Basic",

        professional:
          "Professional",

        comprehensive:
          "Comprehensive",

        clear:
          "Clear",

        analyze:
          "Analyze",

        loading:
          "AI is analyzing your input...",

        validation:
          "Add some text or attach a PDF or image before analyzing.",

        fileTooLarge:
          "The file is too large. Please use a file up to 4 MB.",

        fileType:
          "Only PDF and image files are supported.",

        fileReady:
          "Ready to analyze",

        uploadPdf:
          "Upload PDF",

        uploadImage:
          "Upload Image",

        takePhoto:
          "Take Photo",

        removeAttachment:
          "Remove attachment",

        genericError:
          "Something went wrong while analyzing your input.",

        result:
          "Requirement Analysis",

        resultSubtitle:
          "Structured analysis generated from your input.",

        complete:
          "Analysis Complete",

        requirementsFound:
          "Requirements Found",

        requirementsFoundDescription:
          "Multiple requirements were detected in the source. Select one to use as the current workspace requirement.",

        useRequirement:
          "Use This Requirement",

        clarity:
          "Clarity",

        completeness:
          "Completeness",

        testability:
          "Testability",

        summary:
          "Summary",

        requirementType:
          "Requirement Type",

        priority:
          "Priority",

        ambiguities:
          "Ambiguities",

        missingInformation:
          "Missing Information",

        assumptions:
          "Assumptions",

        businessRules:
          "Business Rules",

        openQuestions:
          "Open Questions",

        edgeCases:
          "Edge Cases",

        analystNotes:
          "Analyst Notes",

        analyzedInput:
          "Analyzed Input",

        saved:
          "Requirement saved to the current workspace context.",

        selected:
          "Requirement selected for the current workspace.",

        nextStep:
          "Next Step",

        generateUserStory:
          "Generate User Story",

        continueToAcceptanceCriteria:
          "Continue to Acceptance Criteria",

        generateUat:
          "Generate UAT Test Cases"

      },


      /* ---------------------------------------------------
         REQUIREMENT
      --------------------------------------------------- */

      requirement: {

        title:
          "Requirement",

        subtitle:
          "Define and refine the business requirement.",

        noRequirement:
          "No Requirement Loaded",

        requirementDetails:
          "Requirement Details",

        description:
          "Description",

        type:
          "Requirement Type",

        priority:
          "Priority",

        source:
          "Source",

        analysis:
          "Analysis",

        save:
          "Save Requirement",

        continue:
          "Continue to User Story"

      },


      /* ---------------------------------------------------
         USER STORY
      --------------------------------------------------- */

      userStory: {

        title:
          "User Story",

        subtitle:
          "Transform the requirement into a clear, actionable user story.",

        role:
          "Role",

        goal:
          "Goal",

        benefit:
          "Benefit",

        story:
          "User Story",

        priority:
          "Priority",

        generate:
          "Generate User Story",

        clear:
          "Clear",

        save:
          "Save User Story",

        continue:
          "Continue to Acceptance Criteria"

      },


      /* ---------------------------------------------------
         ACCEPTANCE CRITERIA
      --------------------------------------------------- */

      acceptanceCriteria: {

        title:
          "Acceptance Criteria",

        subtitle:
          "Define clear and testable conditions for the requirement.",

        given:
          "Given",

        when:
          "When",

        then:
          "Then",

        priority:
          "Priority",

        add:
          "Add Acceptance Criterion",

        generate:
          "Generate Acceptance Criteria",

        save:
          "Save Acceptance Criteria",

        continue:
          "Continue to UAT Test Cases"

      },


      /* ---------------------------------------------------
         UAT
      --------------------------------------------------- */

      uat: {

        title:
          "UAT Test Cases",

        subtitle:
          "Generate professional user acceptance test scenarios.",

        testCase:
          "Test Case",

        titleLabel:
          "Title",

        purpose:
          "Purpose",

        preconditions:
          "Preconditions",

        steps:
          "Steps",

        expectedResult:
          "Expected Result",

        priority:
          "Priority",

        testData:
          "Test Data",

        generate:
          "Generate UAT Test Cases",

        save:
          "Save Test Cases",

        continue:
          "Continue to Test Data"

      },


      /* ---------------------------------------------------
         TEST DATA
      --------------------------------------------------- */

      testData: {

        title:
          "Test Data",

        subtitle:
          "Generate realistic and reusable test data for your scenarios.",

        scenarioType:
          "Scenario Type",

        dataDomain:
          "Data Domain",

        numberOfRecords:
          "Number of Records",

        outputLanguage:
          "Output Language",

        generate:
          "Generate Test Data",

        clear:
          "Clear",

        save:
          "Save Test Data",

        continue:
          "Continue to Process Flow"

      },


      /* ---------------------------------------------------
         PROCESS FLOW
      --------------------------------------------------- */

      processFlow: {

        title:
          "Process Flow",

        subtitle:
          "Visualize the business process, actors, systems and decision points.",

        processContext:
          "Process Context",

        processName:
          "Process Name",

        businessContext:
          "Requirement / Business Context",

        outputLanguage:
          "Output Language",

        detailLevel:
          "Detail Level",

        generate:
          "Generate Process Flow",

        clear:
          "Clear",

        processFlow:
          "Process Flow",

        actors:
          "Actors & Systems",

        decisionPoints:
          "Decision Points",

        processSteps:
          "Process Steps",

        alternativeFlows:
          "Alternative Flows",

        exceptionFlows:
          "Exception Flows",

        copy:
          "Copy Process Flow",

        save:
          "Save to Workspace",

        continue:
          "Continue to Traceability"

      },


      /* ---------------------------------------------------
         TRACEABILITY
      --------------------------------------------------- */

      traceability: {

        title:
          "Traceability",

        subtitle:
          "Connect requirements to delivery artifacts.",

        overview:
          "Overview",

        requirements:
          "Requirements",

        userStories:
          "User Stories",

        acceptanceCriteria:
          "Acceptance Criteria",

        testCases:
          "Test Cases",

        testData:
          "Test Data",

        processFlows:
          "Process Flows",

        coverage:
          "Coverage",

        gaps:
          "Traceability Gaps",

        chain:
          "Traceability Chain",

        matrix:
          "Traceability Matrix",

        coverageAnalysis:
          "Coverage Analysis",

        noGaps:
          "No major gaps detected",

        refresh:
          "Refresh Traceability",

        copyMatrix:
          "Copy Matrix",

        save:
          "Save Traceability",

        continue:
          "Continue to BA Document"

      },


      /* ---------------------------------------------------
         BA DOCUMENT
      --------------------------------------------------- */

      document: {

        title:
          "BA Document",

        subtitle:
          "Turn BA artifacts into a professional Business Analysis document.",

        configuration:
          "Document Configuration",

        configurationDescription:
          "Define the document title and presentation preferences.",

        documentTitle:
          "Document Title",

        language:
          "Language",

        detailLevel:
          "Detail Level",

        objective:
          "Document Objective",

        generate:
          "Generate BA Document",

        clear:
          "Clear",

        availableArtifacts:
          "Available BA Artifacts",

        availableArtifactsDescription:
          "The document is generated from artifacts currently available in the workspace.",

        businessAnalysisDocument:
          "Business Analysis Document",

        documentType:
          "Document Type",

        generated:
          "Generated",

        detail:
          "Detail",

        notGenerated:
          "Not generated",

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

        copy:
          "Copy Document",

        printPdf:
          "Print / Save as PDF",

        save:
          "Save to Workspace",

        saved:
          "BA Document saved to the workspace.",

        generatedSuccess:
          "BA Document generated successfully.",

        noRequirement:
          "No Requirement artifact is currently available.",

        noUserStory:
          "No User Story artifact is currently available.",

        noAcceptanceCriteria:
          "No Acceptance Criteria artifacts are currently available.",

        noUat:
          "No UAT Test Cases artifacts are currently available.",

        noTestData:
          "No Test Data artifact is currently available.",

        noProcessFlow:
          "No Process Flow artifact is currently available."

      },


      /* ---------------------------------------------------
         COMMON STATUS MESSAGES
      --------------------------------------------------- */

      messages: {

        saved:
          "Saved successfully.",

        generated:
          "Generated successfully.",

        updated:
          "Updated successfully.",

        deleted:
          "Deleted successfully.",

        copied:
          "Copied successfully.",

        noData:
          "No data available.",

        loading:
          "Loading...",

        somethingWentWrong:
          "Something went wrong.",

        unableToSave:
          "Unable to save.",

        unableToLoad:
          "Unable to load.",

        workspaceUnavailable:
          "Workspace data is currently unavailable."

      }

    },


    /* =====================================================
       TÜRKÇE
    ===================================================== */

    tr: {

      global: {

        appName:
          "BAForge AI",

        home:
          "Ana Sayfa",

        analyzer:
          "Analiz",

        requirement:
          "Gereksinim",

        userStory:
          "User Story",

        acceptanceCriteria:
          "Acceptance Criteria",

        uat:
          "UAT Test Case'leri",

        testData:
          "Test Verisi",

        processFlow:
          "Process Flow",

        traceability:
          "Traceability",

        document:
          "BA Dokümanı",

        tools:
          "Araçlar",

        language:
          "Dil",

        previous:
          "Önceki Adım",

        next:
          "Sonraki Adım",

        continue:
          "Devam Et",

        back:
          "Geri",

        save:
          "Kaydet",

        clear:
          "Temizle",

        cancel:
          "İptal",

        generate:
          "Oluştur",

        refresh:
          "Yenile",

        copy:
          "Kopyala",

        delete:
          "Sil",

        edit:
          "Düzenle",

        close:
          "Kapat",

        available:
          "Mevcut",

        notAvailable:
          "Mevcut Değil",

        loading:
          "Yükleniyor...",

        success:
          "Başarılı",

        error:
          "Hata",

        warning:
          "Uyarı",

        noData:
          "Veri bulunamadı"

      },


      workflow: {

        requirement:
          "Gereksinim",

        userStory:
          "User Story",

        acceptanceCriteria:
          "Acceptance Criteria",

        uat:
          "UAT Test Case'leri",

        testData:
          "Test Verisi",

        processFlow:
          "Process Flow",

        traceability:
          "Traceability",

        document:
          "BA Dokümanı",

        previous:
          "Önceki Adım",

        next:
          "Sonraki Adım"

      },


      navigation: {

        home:
          "Ana Sayfa",

        analyzer:
          "Analiz",

        requirement:
          "Gereksinim",

        userStory:
          "User Story",

        acceptanceCriteria:
          "Acceptance Criteria",

        uat:
          "UAT Test Case'leri",

        testData:
          "Test Verisi",

        processFlow:
          "Process Flow",

        traceability:
          "Traceability",

        document:
          "BA Dokümanı",

        tools:
          "Araçlar"

      },


      analyzer: {

        badge:
          "Gereksinim Analizörü",

        title:
          "Geliştirmeden Önce Gereksinimi Analiz Et",

        subtitle:
          "Metin, PDF veya görsel kullanın. Talimat vermek zorunlu değildir.",

        inputTitle:
          "BAForge AI neyi analiz etsin?",

        inputDescription:
          "Gereksinimi yazın, PDF veya görsel ekleyin ya da ikisini birlikte kullanın. Dosya eklediğinizde yazılı talimat zorunlu değildir.",

        placeholder:
          "BAForge AI'a neyi analiz etmesini istediğinizi yazın...",

        hint:
          "İsteğe bağlı: limitlere, kurallara, eksiklere veya belirli bölümlere odaklan.",

        outputLanguage:
          "Çıktı Dili",

        analysisDepth:
          "Analiz Derinliği",

        basic:
          "Temel",

        professional:
          "Profesyonel",

        comprehensive:
          "Kapsamlı",

        clear:
          "Temizle",

        analyze:
          "Analiz Et",

        loading:
          "BAForge girdinizi analiz ediyor...",

        validation:
          "Analiz için metin yazın veya PDF/görsel ekleyin.",

        fileTooLarge:
          "Dosya çok büyük. Lütfen 4 MB'a kadar bir dosya kullanın.",

        fileType:
          "Yalnızca PDF ve görsel dosyaları desteklenir.",

        fileReady:
          "Analize hazır",

        uploadPdf:
          "PDF Yükle",

        uploadImage:
          "Görsel Yükle",

        takePhoto:
          "Fotoğraf Çek",

        removeAttachment:
          "Ek dosyayı kaldır",

        genericError:
          "Girdi analiz edilirken bir hata oluştu.",

        result:
          "Gereksinim Analizi",

        resultSubtitle:
          "Girdinizden oluşturulan yapılandırılmış analiz.",

        complete:
          "Analiz Tamamlandı",

        requirementsFound:
          "Bulunan Gereksinimler",

        requirementsFoundDescription:
          "Kaynakta birden fazla gereksinim bulundu. Workspace'te kullanmak istediğiniz gereksinimi seçebilirsiniz.",

        useRequirement:
          "Bu Gereksinimi Kullan",

        clarity:
          "Açıklık",

        completeness:
          "Bütünlük",

        testability:
          "Test Edilebilirlik",

        summary:
          "Özet",

        requirementType:
          "Gereksinim Tipi",

        priority:
          "Öncelik",

        ambiguities:
          "Belirsizlikler",

        missingInformation:
          "Eksik Bilgiler",

        assumptions:
          "Varsayımlar",

        businessRules:
          "İş Kuralları",

        openQuestions:
          "Açık Sorular",

        edgeCases:
          "Uç Durumlar",

        analystNotes:
          "Analist Notları",

        analyzedInput:
          "Analiz Edilen Girdi",

        saved:
          "Gereksinim mevcut workspace bağlamına kaydedildi.",

        selected:
          "Gereksinim mevcut workspace için seçildi.",

        nextStep:
          "Sonraki Adım",

        generateUserStory:
          "User Story Oluştur",

        continueToAcceptanceCriteria:
          "Acceptance Criteria'ya Devam Et",

        generateUat:
          "UAT Test Case'leri Oluştur"

      },


      requirement: {

        title:
          "Gereksinim",

        subtitle:
          "İş gereksinimini tanımlayın ve geliştirin.",

        noRequirement:
          "Gereksinim Yüklenmedi",

        requirementDetails:
          "Gereksinim Detayları",

        description:
          "Açıklama",

        type:
          "Gereksinim Tipi",

        priority:
          "Öncelik",

        source:
          "Kaynak",

        analysis:
          "Analiz",

        save:
          "Gereksinimi Kaydet",

        continue:
          "User Story'ye Devam Et"

      },


      userStory: {

        title:
          "User Story",

        subtitle:
          "Gereksinimi net ve uygulanabilir bir User Story'ye dönüştürün.",

        role:
          "Rol",

        goal:
          "Hedef",

        benefit:
          "Fayda",

        story:
          "User Story",

        priority:
          "Öncelik",

        generate:
          "User Story Oluştur",

        clear:
          "Temizle",

        save:
          "User Story'yi Kaydet",

        continue:
          "Acceptance Criteria'ya Devam Et"

      },


      acceptanceCriteria: {

        title:
          "Acceptance Criteria",

        subtitle:
          "Gereksinim için açık ve test edilebilir koşullar tanımlayın.",

        given:
          "Ön Koşul",

        when:
          "Eylem",

        then:
          "Beklenen Sonuç",

        priority:
          "Öncelik",

        add:
          "Acceptance Criterion Ekle",

        generate:
          "Acceptance Criteria Oluştur",

        save:
          "Acceptance Criteria'yı Kaydet",

        continue:
          "UAT Test Case'lerine Devam Et"

      },


      uat: {

        title:
          "UAT Test Case'leri",

        subtitle:
          "Profesyonel kullanıcı kabul test senaryoları oluşturun.",

        testCase:
          "Test Case",

        titleLabel:
          "Başlık",

        purpose:
          "Amaç",

        preconditions:
          "Ön Koşullar",

        steps:
          "Adımlar",

        expectedResult:
          "Beklenen Sonuç",

        priority:
          "Öncelik",

        testData:
          "Test Verisi",

        generate:
          "UAT Test Case'leri Oluştur",

        save:
          "Test Case'lerini Kaydet",

        continue:
          "Test Verisine Devam Et"

      },


      testData: {

        title:
          "Test Verisi",

        subtitle:
          "Senaryolarınız için gerçekçi ve tekrar kullanılabilir test verileri oluşturun.",

        scenarioType:
          "Senaryo Tipi",

        dataDomain:
          "Veri Alanı",

        numberOfRecords:
          "Kayıt Sayısı",

        outputLanguage:
          "Çıktı Dili",

        generate:
          "Test Verisi Oluştur",

        clear:
          "Temizle",

        save:
          "Test Verisini Kaydet",

        continue:
          "Process Flow'a Devam Et"

      },


      processFlow: {

        title:
          "Process Flow",

        subtitle:
          "İş sürecini, aktörleri, sistemleri ve karar noktalarını görselleştirin.",

        processContext:
          "Süreç Bağlamı",

        processName:
          "Süreç Adı",

        businessContext:
          "Gereksinim / İş Bağlamı",

        outputLanguage:
          "Çıktı Dili",

        detailLevel:
          "Detay Seviyesi",

        generate:
          "Process Flow Oluştur",

        clear:
          "Temizle",

        processFlow:
          "Process Flow",

        actors:
          "Aktörler ve Sistemler",

        decisionPoints:
          "Karar Noktaları",

        processSteps:
          "Süreç Adımları",

        alternativeFlows:
          "Alternatif Akışlar",

        exceptionFlows:
          "Hata / İstisna Akışları",

        copy:
          "Process Flow'u Kopyala",

        save:
          "Workspace'e Kaydet",

        continue:
          "Traceability'ye Devam Et"

      },


      traceability: {

        title:
          "Traceability",

        subtitle:
          "Gereksinimleri teslimat çıktılarıyla ilişkilendirin.",

        overview:
          "Genel Bakış",

        requirements:
          "Gereksinimler",

        userStories:
          "User Story'ler",

        acceptanceCriteria:
          "Acceptance Criteria",

        testCases:
          "Test Case'leri",

        testData:
          "Test Verisi",

        processFlows:
          "Process Flow'lar",

        coverage:
          "Kapsama",

        gaps:
          "Traceability Eksikleri",

        chain:
          "Traceability Zinciri",

        matrix:
          "Traceability Matrisi",

        coverageAnalysis:
          "Kapsama Analizi",

        noGaps:
          "Önemli bir eksik tespit edilmedi",

        refresh:
          "Traceability'yi Yenile",

        copyMatrix:
          "Matrisi Kopyala",

        save:
          "Traceability'yi Kaydet",

        continue:
          "BA Dokümanına Devam Et"

      },


      document: {

        title:
          "BA Dokümanı",

        subtitle:
          "BA çıktılarınızı profesyonel bir Business Analysis dokümanına dönüştürün.",

        configuration:
          "Doküman Yapılandırması",

        configurationDescription:
          "Doküman başlığını ve sunum tercihlerini belirleyin.",

        documentTitle:
          "Doküman Başlığı",

        language:
          "Dil",

        detailLevel:
          "Detay Seviyesi",

        objective:
          "Doküman Amacı",

        generate:
          "BA Dokümanı Oluştur",

        clear:
          "Temizle",

        availableArtifacts:
          "Mevcut BA Çıktıları",

        availableArtifactsDescription:
          "Doküman workspace'te mevcut olan çıktılardan oluşturulur.",

        businessAnalysisDocument:
          "Business Analysis Dokümanı",

        documentType:
          "Doküman Tipi",

        generated:
          "Oluşturulma Tarihi",

        detail:
          "Detay",

        notGenerated:
          "Henüz oluşturulmadı",

        requirement:
          "Gereksinim",

        userStory:
          "User Story",

        acceptanceCriteria:
          "Acceptance Criteria",

        uat:
          "UAT Test Case'leri",

        testData:
          "Test Verisi",

        processFlow:
          "Process Flow",

        traceability:
          "Traceability Özeti",

        notes:
          "Notlar",

        copy:
          "Dokümanı Kopyala",

        printPdf:
          "Yazdır / PDF Olarak Kaydet",

        save:
          "Workspace'e Kaydet",

        saved:
          "BA Dokümanı workspace'e kaydedildi.",

        generatedSuccess:
          "BA Dokümanı başarıyla oluşturuldu.",

        noRequirement:
          "Kullanılabilir bir Gereksinim çıktısı bulunmuyor.",

        noUserStory:
          "Kullanılabilir bir User Story çıktısı bulunmuyor.",

        noAcceptanceCriteria:
          "Kullanılabilir Acceptance Criteria çıktısı bulunmuyor.",

        noUat:
          "Kullanılabilir UAT Test Case çıktısı bulunmuyor.",

        noTestData:
          "Kullanılabilir Test Verisi bulunmuyor.",

        noProcessFlow:
          "Kullanılabilir Process Flow bulunmuyor."

      },


      messages: {

        saved:
          "Başarıyla kaydedildi.",

        generated:
          "Başarıyla oluşturuldu.",

        updated:
          "Başarıyla güncellendi.",

        deleted:
          "Başarıyla silindi.",

        copied:
          "Başarıyla kopyalandı.",

        noData:
          "Veri bulunamadı.",

        loading:
          "Yükleniyor...",

        somethingWentWrong:
          "Bir hata oluştu.",

        unableToSave:
          "Kaydedilemedi.",

        unableToLoad:
          "Yüklenemedi.",

        workspaceUnavailable:
          "Workspace verilerine şu anda erişilemiyor."

      }

    }

  };


  /* =======================================================
     INTERNAL HELPERS
  ======================================================= */

  function normalizeLanguage(language) {

    if (!language) {
      return null;
    }


    const normalized =
      String(language)
        .toLowerCase()
        .trim();


    if (
      SUPPORTED_LANGUAGES[normalized]
    ) {

      return normalized;

    }


    if (
      normalized.startsWith("tr")
    ) {

      return "tr";

    }


    if (
      normalized.startsWith("en")
    ) {

      return "en";

    }


    return null;

  }


  function getStoredLanguage() {

    try {

      const stored =
        localStorage.getItem(
          "baforge-language"
        );


      return normalizeLanguage(
        stored
      );

    } catch {

      return null;

    }

  }


  function detectLanguage() {

    const stored =
      getStoredLanguage();


    if (stored) {
      return stored;
    }


    const browserLanguage =
      navigator.language ||
      "en";


    return (
      normalizeLanguage(
        browserLanguage
      ) ||
      "en"
    );

  }


  let currentLanguage =
    detectLanguage();


  /* =======================================================
     CORE API
  ======================================================= */

  function getLanguage() {

    return currentLanguage;

  }


  function setLanguage(language) {

    const normalized =
      normalizeLanguage(
        language
      );


    if (!normalized) {

      return currentLanguage;

    }


    currentLanguage =
      normalized;


    try {

      localStorage.setItem(
        "baforge-language",
        currentLanguage
      );

    } catch {}


    document.documentElement.lang =
      currentLanguage;


    return currentLanguage;

  }


  function getTranslations(
    language
  ) {

    const normalized =
      normalizeLanguage(
        language
      ) ||
      currentLanguage;


    return (
      translations[normalized] ||
      translations.en
    );

  }


  function get(
    path,
    fallback
  ) {

    const dictionary =
      getTranslations();


    if (!path) {

      return (
        fallback !== undefined
          ? fallback
          : ""
      );

    }


    const parts =
      String(path)
        .split(".")
        .filter(Boolean);


    let value =
      dictionary;


    for (
      let i = 0;
      i < parts.length;
      i++
    ) {

      if (
        value === null ||
        value === undefined ||
        !Object.prototype.hasOwnProperty.call(
          value,
          parts[i]
        )
      ) {

        return (
          fallback !== undefined
            ? fallback
            : path
        );

      }


      value =
        value[parts[i]];

    }


    if (
      value === null ||
      value === undefined
    ) {

      return (
        fallback !== undefined
          ? fallback
          : path
      );

    }


    return value;

  }


  function translate(
    path,
    fallback
  ) {

    return get(
      path,
      fallback
    );

  }


  /* =======================================================
     PAGE TRANSLATION
  ======================================================= */

  function apply(
    root
  ) {

    const container =
      root ||
      document;


    container
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
            get(key);


          if (
            value === undefined ||
            value === null
          ) {

            return;

          }


          element.textContent =
            value;

        }
      );


    container
      .querySelectorAll(
        "[data-i18n-placeholder]"
      )
      .forEach(
        element => {

          const key =
            element.getAttribute(
              "data-i18n-placeholder"
            );


          element.placeholder =
            get(key);

        }
      );


    container
      .querySelectorAll(
        "[data-i18n-title]"
      )
      .forEach(
        element => {

          const key =
            element.getAttribute(
              "data-i18n-title"
            );


          element.title =
            get(key);

        }
      );


    container
      .querySelectorAll(
        "[data-i18n-aria-label]"
      )
      .forEach(
        element => {

          const key =
            element.getAttribute(
              "data-i18n-aria-label"
            );


          element.setAttribute(
            "aria-label",
            get(key)
          );

        }
      );


    document.documentElement.lang =
      currentLanguage;


    return container;

  }


  /* =======================================================
     LANGUAGE CHANGE EVENT
  ======================================================= */

  function emitLanguageChange() {

    try {

      window.dispatchEvent(
        new CustomEvent(
          "baforge:languagechange",
          {
            detail: {
              language:
                currentLanguage
            }
          }
        )
      );

    } catch {}

  }


  function changeLanguage(
    language
  ) {

    const result =
      setLanguage(
        language
      );


    apply();

    emitLanguageChange();


    return result;

  }


  /* =======================================================
     SELECT OPTIONS
  ======================================================= */

  function getLanguageOptions() {

    return Object.values(
      SUPPORTED_LANGUAGES
    ).map(
      language => ({
        code:
          language.code,

        name:
          language.name,

        nativeName:
          language.nativeName
      })
    );

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  const I18N = {

    version:
      "1.0.0",

    languages:
      SUPPORTED_LANGUAGES,

    translations,

    getLanguage,

    setLanguage,

    changeLanguage,

    getTranslations,

    get,

    t:
      translate,

    translate,

    apply,

    getLanguageOptions

  };


  /* =======================================================
     GLOBAL EXPORT
  ======================================================= */

  global.BAForgeI18n =
    I18N;


  /*
   * Backward-compatible short alias.
   */

  global.BAI18n =
    I18N;


  /* =======================================================
     INITIAL LANGUAGE
  ======================================================= */

  try {

    document.documentElement.lang =
      currentLanguage;

  } catch {}


})(window);
