import React, { createContext, useContext, useState, useEffect } from 'react';

// Define your global dictionary
const translations = {
  en: {
    // General / Shared
    okay: "Okay",
    cancel: "Cancel",
    delete: "Delete",
    export: "Export",
    searchPlaceholder: "Search...",
    showing: "Showing",
    to: "to",
    of: "of",
    entries: "entries",
    error: "Error",
    close: "Close",

    // Dashboard Page
    settingsTitle: "Settings",
    dashboard: "Dashboard",
    users: "User Management",
    reports: "System Reports",
    audit: "Audit Logs",
    dashboardTitle: "Analytics Dashboard",
    dashboardSubtitle: "Overview of system utilization and demographic risk assessments",
    totalPatients: "Total Registered Patients",
    activeInSystem: "Active in system",
    assessmentsCompleted: "Assessments Completed",
    screenings: "12-question screenings",
    pendingVerifications: "Pending Verifications",
    requiresAdmin: "Requires admin review",
    highRiskCases: "High-Risk Cases",
    immediateAction: "Requires immediate action",
    riskDistribution: "Patient Risk Distribution",
    highRiskLabel: "High Risk",
    mediumRiskLabel: "Medium Risk",
    lowRiskLabel: "Low Risk",
    unassessedLabel: "Unassessed",
    noData: "Not enough data to display chart",
    quickActions: "Quick Actions",
    genReport: "Generate Monthly Report",
    genReportDesc: "Export TB trend report for DOH compliance",
    userMgmt: "User Management",
    userMgmtDesc: "Review pending verifications and staff accounts",
    viewAudit: "View Audit Logs",
    viewAuditDesc: "Review system actions and security changes",
    support: "IT Support Tickets",
    supportDesc: "Manage password resets and doctor inquiries",

    // User Management Page
    userMgmtTitle: "User Management",
    userMgmtSubtitle: "Manage healthcare staff and patient registry",
    deleteSelected: "Delete Selected",
    importCsv: "Import CSV",
    addDoctor: "Add Doctor",
    addPatient: "Add Patient",
    totalDoctorsTitle: "Total Doctors",
    pendingVerificationsTitle: "Pending Verifications",
    highRiskPatientsTitle: "High Risk Patients",
    doctorsAndStaffTab: "Doctors & Staff",
    patientsTab: "Patients",
    searchDoctors: "Search doctors...",
    searchPatients: "Search patients...",
    nameCol: "Name",
    contactCol: "Contact",
    clinicCodeCol: "Clinic Code",
    licenseNoCol: "License No.",
    verificationCol: "Verification",
    riskLevelCol: "Risk Level",
    filterByRisk: "Filter by Risk",
    allPatientsFilter: "All Patients",
    highRiskFilter: "High Risk",
    mediumRiskFilter: "Medium Risk",
    lowRiskFilter: "Low Risk",
    barangayCol: "Barangay",
    loadingDatabase: "Loading database...",
    noUsersFound: "No users found matching your criteria.",
    viewId: "View ID",
    editDetails: "Edit details",
    resetPassword: "Reset Password",
    deleteUser: "Delete User",
    addNewDoctor: "Add New Doctor/Staff",
    addNewPatient: "Add New Patient",
    fullNameLabel: "Full Name",
    emailLabel: "Email",
    contactNumberLabel: "Contact Number",
    clinicCodeOptional: "Clinic Code (Optional)",
    licenseOptional: "License/PRC No. (Optional)",
    barangayOptional: "Assigned Barangay (Optional)",
    ageLabel: "Age",
    genderLabel: "Gender",
    selectGender: "Select gender",
    male: "Male",
    female: "Female",
    other: "Other",
    creating: "Creating...",
    editDetailsTitle: "Edit Details",
    saveChanges: "Save Changes",
    confirmBulkDeletion: "Confirm Bulk Deletion",
    bulkDeleteUserWarning: "Are you sure you want to permanently delete",
    bulkDeleteUserWarning2: "selected users? This action cannot be undone and will remove all their associated data from the database.",
    yesDeleteThem: "Yes, delete them",
    deleting: "Deleting...",
    proofOfIdentity: "Proof of Identity",
    viewingDocsFor: "Viewing registration documents for",
    noImageUploaded: "No image uploaded",
    closeViewer: "Close Viewer",
    exportRegistryData: "Export Registry Data",
    exportFormatDesc: "Select the format you wish to export the current list to.",
    standardPdfDoc: "Standard PDF Document",
    pdfDesc: "Best for printing and visual reporting",
    itisCsvDoc: "ITIS-Compatible CSV",
    csvDesc: "Raw data formatted for DOH alignment",

    // Audit Logs Page
    auditLogsTitle: "Security Audit Logs",
    auditLogsSubtitle: "Traceable history of system actions and data access",
    allCategories: "All Categories",
    patientAccess: "Patient Access",
    userMgmtFilter: "User Management",
    keywords: "Keywords",
    reportsFilter: "Reports",
    actionCol: "Action",
    performedByCol: "Performed By",
    targetEntityCol: "Target Entity",
    timestampCol: "Timestamp",
    noLogsFound: "No logs found matching criteria.",
    viewDetails: "View Details",
    deleteEntry: "Delete Entry",
    auditTraceDetails: "Audit Trace Details",
    performer: "Performer",
    time: "Time",
    metadataTrace: "Metadata Trace",
    closeTrace: "Close Trace",
    areYouSureDelete: "Are you sure you want to delete",
    entriesCannotBeUndone: "entries? This cannot be undone.",
    confirmDelete: "Confirm Delete",
    exportLogs: "Export Logs",
    downloadFiltered: "Download current filtered log history.",
    standardPdf: "Standard PDF Report",
    itisCsv: "ITIS-Compatible CSV",
    fetchError: "Fetch Error",
    failedToLoadLogs: "Failed to load logs.",
    logEntryDeleted: "Log Entry Deleted",
    bulkDeleteSuccess: "Bulk Delete Successful",
    removed: "Removed",
    logEntries: "log entries.",

    // Error Logs Page
    errorLogsTitle: "System Error Logs",
    errorLogsSubtitle: "Diagnostic monitoring for system stability",
    liveMonitoring: "LIVE MONITORING ACTIVE",
    clearSelected: "Clear Selected",
    criticalErrors: "Critical Errors",
    activeWarnings: "Active Warnings",
    openIncidents: "Open Incidents",
    searchMessages: "Search messages or services...",
    severity: "Severity",
    allSeverities: "All Severities",
    errorLevel: "Error",
    warningLevel: "Warning",
    statusHeader: "Status",
    allStatus: "All Status",
    statusOpen: "Open",
    statusInProgress: "In Progress",
    statusResolved: "Resolved",
    errorMessageCol: "Error Message",
    sourceCol: "Source",
    countCol: "Count",
    noIncidents: "No incidents recorded.",
    workflowLabel: "Workflow",
    moveToProgress: "Move to Progress",
    markAsResolved: "Mark as Resolved",
    diagnosticDetails: "Diagnostic Details",
    pageXofY: "Page",
    diagnosticTrace: "Diagnostic Trace",
    resolveIncidentBtn: "Resolve Incident",
    clearIncidentHistory: "Clear Incident History",
    clearIncidentWarning: "Permanently clear",
    clearIncidentWarning2: "recorded system errors from the database?",
    confirmClear: "Confirm Clear"
  },
  fil: {
    // General / Shared
    okay: "Sige",
    cancel: "Kanselahin",
    delete: "Burahin",
    export: "I-export",
    searchPlaceholder: "Maghanap...",
    showing: "Ipinapakita ang",
    to: "hanggang",
    of: "mula sa",
    entries: "na mga entry",
    error: "Error",
    close: "Isara",

    // Dashboard Page
    settingsTitle: "Mga Setting",
    dashboard: "Dashboard",
    users: "Pamamahala ng User",
    reports: "Mga Ulat ng Sistema",
    audit: "Mga Audit Log",
    dashboardTitle: "Analytics Dashboard",
    dashboardSubtitle: "Pangkalahatang-ideya ng paggamit ng sistema at mga pagsusuri sa panganib",
    totalPatients: "Kabuuang Rehistradong Pasyente",
    activeInSystem: "Aktibo sa sistema",
    assessmentsCompleted: "Nakumpletong Pagsusuri",
    screenings: "12-tanong na screening",
    pendingVerifications: "Mga Nakabinbing Pag-verify",
    requiresAdmin: "Nangangailangan ng pagsusuri ng admin",
    highRiskCases: "Mga Kaso ng Mataas na Panganib",
    immediateAction: "Nangangailangan ng agarang aksyon",
    riskDistribution: "Distribusyon ng Panganib ng Pasyente",
    highRiskLabel: "Mataas na Panganib",
    mediumRiskLabel: "Katamtamang Panganib",
    lowRiskLabel: "Mababang Panganib",
    unassessedLabel: "Hindi Nasuri",
    noData: "Kulang ang datos para ipakita ang tsart",
    quickActions: "Mabilisang Aksyon",
    genReport: "Gumawa ng Buwanang Ulat",
    genReportDesc: "I-export ang ulat ng trend ng TB para sa pagsunod sa DOH",
    userMgmt: "Pamamahala ng User",
    userMgmtDesc: "Suriin ang mga nakabinbing pag-verify at account ng staff",
    viewAudit: "Tingnan ang Audit Logs",
    viewAuditDesc: "Suriin ang mga aksyon sa sistema at pagbabago sa seguridad",
    support: "IT Support Tickets",
    supportDesc: "Pamahalaan ang pag-reset ng password at mga katanungan ng doktor",

    // User Management Page
    userMgmtTitle: "Pamamahala ng User",
    userMgmtSubtitle: "Pamahalaan ang mga kawani at rehistro ng pasyente",
    deleteSelected: "Burahin ang Napili",
    importCsv: "I-import ang CSV",
    addDoctor: "Magdagdag ng Doktor",
    addPatient: "Magdagdag ng Pasyente",
    totalDoctorsTitle: "Kabuuang Doktor",
    pendingVerificationsTitle: "Nakabinbing Pag-verify",
    highRiskPatientsTitle: "Pasyenteng Mataas ang Panganib",
    doctorsAndStaffTab: "Mga Doktor at Kawani",
    patientsTab: "Mga Pasyente",
    searchDoctors: "Maghanap ng doktor...",
    searchPatients: "Maghanap ng pasyente...",
    nameCol: "Pangalan",
    contactCol: "Contact",
    clinicCodeCol: "Code ng Klinika",
    licenseNoCol: "Lisensya No.",
    verificationCol: "Pag-verify",
    riskLevelCol: "Antas ng Panganib",
    filterByRisk: "Salain sa Panganib",
    allPatientsFilter: "Lahat ng Pasyente",
    highRiskFilter: "Mataas na Panganib",
    mediumRiskFilter: "Katamtamang Panganib",
    lowRiskFilter: "Mababang Panganib",
    barangayCol: "Barangay",
    loadingDatabase: "Kinakarga ang database...",
    noUsersFound: "Walang nahanap na user na tumutugma sa pamantayan.",
    viewId: "Tingnan ang ID",
    editDetails: "I-edit ang detalye",
    resetPassword: "I-reset ang Password",
    deleteUser: "Burahin ang User",
    addNewDoctor: "Magdagdag ng Bagong Doktor/Kawani",
    addNewPatient: "Magdagdag ng Bagong Pasyente",
    fullNameLabel: "Buong Pangalan",
    emailLabel: "Email",
    contactNumberLabel: "Numero ng Telepono",
    clinicCodeOptional: "Code ng Klinika (Opsyonal)",
    licenseOptional: "Lisensya/PRC No. (Opsyonal)",
    barangayOptional: "Nakatalagang Barangay (Opsyonal)",
    ageLabel: "Edad",
    genderLabel: "Kasarian",
    selectGender: "Piliin ang kasarian",
    male: "Lalaki",
    female: "Babae",
    other: "Iba pa",
    creating: "Ginagawa...",
    editDetailsTitle: "I-edit ang mga Detalye",
    saveChanges: "I-save ang mga Pagbabago",
    confirmBulkDeletion: "Kumpirmahin ang Maramihang Pagbura",
    bulkDeleteUserWarning: "Sigurado ka bang gusto mong permanenteng burahin ang",
    bulkDeleteUserWarning2: "na mga napiling user? Hindi na ito maibabalik at tatanggalin nito ang lahat ng kanilang datos.",
    yesDeleteThem: "Oo, burahin sila",
    deleting: "Binubura...",
    proofOfIdentity: "Katibayan ng Pagkakakilanlan",
    viewingDocsFor: "Tinitingnan ang mga dokumento ni",
    noImageUploaded: "Walang in-upload na larawan",
    closeViewer: "Isara ang Viewer",
    exportRegistryData: "I-export ang Datos ng Rehistro",
    exportFormatDesc: "Piliin ang format para sa pag-export ng kasalukuyang listahan.",
    standardPdfDoc: "Karaniwang PDF Document",
    pdfDesc: "Pinakamainam para sa pag-print at visual na ulat",
    itisCsvDoc: "ITIS-Compatible na CSV",
    csvDesc: "Raw na datos na naka-format para sa DOH",

    // Audit Logs Page
    auditLogsTitle: "Mga Audit Log ng Seguridad",
    auditLogsSubtitle: "Kasaysayan ng mga aksyon at pag-access sa sistema",
    allCategories: "Lahat ng Kategorya",
    patientAccess: "Pag-access ng Pasyente",
    userMgmtFilter: "Pamamahala ng User",
    keywords: "Mga Keyword",
    reportsFilter: "Mga Ulat",
    actionCol: "Aksyon",
    performedByCol: "Ginawa Ni",
    targetEntityCol: "Target na Entidad",
    timestampCol: "Timestamp",
    noLogsFound: "Walang nahanap na log na tumutugma sa pamantayan.",
    viewDetails: "Tingnan ang Detalye",
    deleteEntry: "Burahin ang Entry",
    auditTraceDetails: "Mga Detalye ng Audit Trace",
    performer: "Nagsagawa",
    time: "Oras",
    metadataTrace: "Metadata Trace",
    closeTrace: "Isara ang Trace",
    areYouSureDelete: "Sigurado ka bang gusto mong burahin ang",
    entriesCannotBeUndone: "na entry? Hindi na ito maibabalik.",
    confirmDelete: "Kumpirmahin ang Pagbura",
    exportLogs: "I-export ang Logs",
    downloadFiltered: "I-download ang kasalukuyang na-filter na kasaysayan ng log.",
    standardPdf: "Karaniwang PDF Report",
    itisCsv: "ITIS-Compatible na CSV",
    fetchError: "Error sa Pagkarga",
    failedToLoadLogs: "Nabigong ikarga ang mga log.",
    logEntryDeleted: "Nabura ang Log Entry",
    bulkDeleteSuccess: "Matagumpay ang Maramihang Pagbura",
    removed: "Tinanggal ang",
    logEntries: "na log entry.",

    // Error Logs Page
    errorLogsTitle: "Mga Error Log ng Sistema",
    errorLogsSubtitle: "Diagnostic na pagsubaybay para sa katatagan ng sistema",
    liveMonitoring: "AKTIBO ANG LIVE MONITORING",
    clearSelected: "Alisin ang Napili",
    criticalErrors: "Mga Kritikal na Error",
    activeWarnings: "Aktibong Babala",
    openIncidents: "Bukas na Insidente",
    searchMessages: "Maghanap ng mga mensahe o serbisyo...",
    severity: "Kalubhaan",
    allSeverities: "Lahat ng Kalubhaan",
    errorLevel: "Error",
    warningLevel: "Babala",
    statusHeader: "Katayuan",
    allStatus: "Lahat ng Katayuan",
    statusOpen: "Bukas",
    statusInProgress: "Kasalukuyang Ginagawa",
    statusResolved: "Naresolba na",
    errorMessageCol: "Mensahe ng Error",
    sourceCol: "Pinagmulan",
    countCol: "Bilang",
    noIncidents: "Walang naitalang insidente.",
    workflowLabel: "Daloy ng Trabaho",
    moveToProgress: "Ilipat sa Kasalukuyang Ginagawa",
    markAsResolved: "Markahan bilang Naresolba",
    diagnosticDetails: "Detalye ng Diagnostic",
    pageXofY: "Pahina",
    diagnosticTrace: "Diagnostic Trace",
    resolveIncidentBtn: "Iresolba ang Insidente",
    clearIncidentHistory: "Alisin ang Kasaysayan ng Insidente",
    clearIncidentWarning: "Permanenteng alisin ang",
    clearIncidentWarning2: "naitalang error mula sa database?",
    confirmClear: "Kumpirmahin ang Pag-alis"
  }
};

type Language = 'en' | 'fil';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Check localStorage on initial load
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('adminSystemSettings');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return parsed.language || 'en'; 
      } catch { 
        return 'en'; 
      }
    }
    return 'en';
  });

  // Update HTML lang attribute whenever language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // NEW: Cross-page synchronization listener
  useEffect(() => {
    const syncLanguage = () => {
      const saved = localStorage.getItem('adminSystemSettings');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          if (parsed.language && parsed.language !== language) {
            setLanguageState(parsed.language);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', syncLanguage);
    window.addEventListener('languageUpdated', syncLanguage);
    return () => {
      window.removeEventListener('storage', syncLanguage);
      window.removeEventListener('languageUpdated', syncLanguage);
    };
  }, [language]);

  // NEW: Properly persist the choice to local storage when changed
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    
    // Fetch existing settings so we don't accidentally delete other user preferences
    const saved = localStorage.getItem('adminSystemSettings');
    let settings: any = {};
    if (saved) {
      try { settings = JSON.parse(saved); } catch {}
    }
    
    // Update only the language property and save back to local storage
    settings.language = lang;
    localStorage.setItem('adminSystemSettings', JSON.stringify(settings));
    
    // Dispatch a custom event to instantly notify all other pages
    window.dispatchEvent(new Event('languageUpdated'));
  };

  // The magical translate function
  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}