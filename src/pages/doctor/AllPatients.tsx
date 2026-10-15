import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, Filter, Eye, Download, Users, CheckCircle, AlertCircle, MoreVertical, UserX, ArrowUpDown, ChevronLeft, ChevronRight, Trash2, Archive, Loader2, ShieldAlert, Printer, RefreshCw, Undo2, CalendarCheck
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "../admin/LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const sanitizeText = (input: string | null | undefined): string => {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
};

const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "Patient Directory & Records",
    pageSubtitle: "Manage registered TB patients, clinical workflows, and reports.",
    exportBtn: "Export Patient List",
    searchPlaceholder: "Search by name or barangay...",
    riskLevel: "Risk Level",
    allRiskLevels: "All Risk Levels",
    highRisk: "High Risk",
    mediumRisk: "Medium Risk",
    standardLow: "Standard / Low",
    statusFilter: "Treatment Status",
    allStatuses: "All Statuses",
    inTreatment: "In Treatment",
    intensivePhase: "Intensive Phase (HRZE)",
    continuationPhase: "Continuation Phase (HR)",
    defaultRisk: "Default Risk",
    resetFilters: "Reset Filters",
    patientRecords: "Active Patient Records",
    dischargedRecords: "Discharged Patient Archive",
    name: "Name",
    age: "Age",
    barangay: "Barangay",
    status: "Status",
    registrationDate: "Registration Date",
    dischargeDate: "Discharge Date",
    action: "Action",
    syncing: "Syncing with database...",
    noPatients: "No patients found.",
    unknownPatient: "Unknown Patient",
    genReportTitle: "Generating Report",
    genReportDesc: "Patient directory list is being exported...",
    syncErrorTitle: "Sync Error",
    syncErrorDesc: "Could not sync patient list.",
    error: "Error",
    dispatchPatient: "Dispatch Patient",
    archivePatient: "Archive Patient",
    archiveSuccessDesc: "Patient record securely moved to archives.",
    seePatientInfo: "View Electronic Chart",
    printReport: "Print E-Discharge Certificate",
    readmitRelapse: "Re-admit as Relapse",
    restoreActive: "Restore to Active Treatment",
    cured: "Discharged",
    activePatients: "Active Patients",
    dischargedArchive: "Discharged Archive",
    cleared: "Cleared",
    sortBy: "Sort By",
    nameAsc: "Name (A-Z)",
    nameDesc: "Name (Z-A)",
    ageAsc: "Age (Youngest)",
    ageDesc: "Age (Oldest)",
    showing: "Showing",
    to: "to",
    of: "of",
    entries: "entries",
    rowsPerPage: "Rows per page:",
    deleteSelected: "Dispatch Selected",
    deletePatient: "Delete Record"
  },
  fil: {
    pageTitle: "Direktoryo at Rekord ng Pasyente",
    pageSubtitle: "Pamahalaan ang mga pasyente at suriin ang kanilang gamutan.",
    exportBtn: "I-export ang Listahan",
    searchPlaceholder: "Maghanap sa pangalan o barangay...",
    riskLevel: "Antas ng Panganib",
    allRiskLevels: "Lahat ng Antas",
    highRisk: "Mataas na Panganib",
    mediumRisk: "Katamtamang Panganib",
    standardLow: "Karaniwan / Mababa",
    statusFilter: "Katayuan ng Gamutan",
    allStatuses: "Lahat ng Katayuan",
    inTreatment: "Ginagamot",
    intensivePhase: "Intensive Phase (HRZE)",
    continuationPhase: "Continuation Phase (HR)",
    defaultRisk: "Nasa Panganib ng Default",
    resetFilters: "I-reset ang mga Filter",
    patientRecords: "Mga Aktibong Rekord",
    dischargedRecords: "Arkibo ng mga Na-discharge",
    name: "Pangalan",
    age: "Edad",
    barangay: "Barangay",
    status: "Katayuan",
    registrationDate: "Petsa ng Rehistrasyon",
    dischargeDate: "Petsa ng Pagka-discharge",
    action: "Aksyon",
    syncing: "Nagsi-sync sa database...",
    noPatients: "Walang nahanap na pasyente.",
    unknownPatient: "Hindi Kilalang Pasyente",
    genReportTitle: "Gumagawa ng Ulat",
    genReportDesc: "Ini-export na ang listahan ng direktoryo...",
    syncErrorTitle: "Error sa Pag-sync",
    syncErrorDesc: "Hindi ma-sync ang listahan ng pasyente.",
    error: "Error",
    dispatchPatient: "I-dispatch ang Pasyente",
    archivePatient: "I-archive ang Pasyente",
    archiveSuccessDesc: "Ligtas na inilipat ang record sa archives.",
    seePatientInfo: "Tingnan ang Electronic Chart",
    printReport: "I-print ang E-Discharge Certificate",
    readmitRelapse: "I-readmit bilang Relapse",
    restoreActive: "Ibalik sa Aktibong Gamutan",
    cured: "Na-discharge",
    activePatients: "Aktibong Pasyente",
    dischargedArchive: "Discharged Archive",
    cleared: "Cleared",
    sortBy: "Ayusin Ayon Sa",
    nameAsc: "Pangalan (A-Z)",
    nameDesc: "Pangalan (Z-A)",
    ageAsc: "Edad (Pinakabata)",
    ageDesc: "Edad (Pinakamatanda)",
    showing: "Ipinapakita",
    to: "hanggang",
    of: "ng",
    entries: "tala",
    rowsPerPage: "Bilang sa bawat pahina:",
    deleteSelected: "I-dispatch ang Napili",
    deletePatient: "Burahin ang Rekord"
  }
};

interface Patient {
  id: string; 
  name: string;
  age: string;
  barangay: string;
  riskLevel: string;
  status: string;
  treatmentPhase: string;
  lastVisit: string;
  dischargeDate: string;
  raw: any;
}

const getRiskBadge = (risk: string, isDischarged: boolean) => {
  if (isDischarged || risk === "Cleared") return "bg-slate-100 text-slate-600 border-slate-300";
  const lowerRisk = risk?.toLowerCase() || "";
  if (lowerRisk.includes("high")) return "bg-red-50 text-red-700 border-red-200 font-bold";
  if (lowerRisk.includes("medium") || lowerRisk.includes("follow-up")) return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
  return "bg-teal-50 text-teal-700 border-teal-200 font-semibold";
};

const getStatusBadge = (status: string, t: (key: string) => string) => {
  if (status === t("cured")) return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-teal-50 text-teal-800 border-teal-200 font-semibold"; 
};

export default function AllPatients() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;
  
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewTab, setViewTab] = useState<"active" | "discharged">("active");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [patientToArchive, setPatientToArchive] = useState<{id: string, name: string} | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [relapseModalOpen, setRelapseModalOpen] = useState(false);
  const [patientToRelapse, setPatientToRelapse] = useState<{id: string, name: string} | null>(null);
  const [isRelapsing, setIsRelapsing] = useState(false);

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [patientToRestore, setPatientToRestore] = useState<{id: string, name: string} | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const [patientToPrint, setPatientToPrint] = useState<any>(null);

  useEffect(() => {
    fetchAllData();
  }, [language]); 

  useEffect(() => {
    setCurrentPage(1);
  }, [search, riskFilter, statusFilter, viewTab, sortOrder, itemsPerPage]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
        
      if (profile?.full_name) {
        setDoctorName(sanitizeText(profile.full_name) || "Doctor");
      }

      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          patient_id,
          created_at,
          status,
          is_archived,
          profiles!fk_patient (
            *
          )
        `)
        .eq('doctor_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (connections) {
        const uniquePatients = new Map();
        
        connections.forEach((c: any) => {
          const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
          
          if (p && !uniquePatients.has(c.patient_id)) {
            const rawStatus = p?.status?.toLowerCase() || "";
            const isArchived = Boolean(c.is_archived || p.is_archived);
            const isCleared = rawStatus === "cured" || rawStatus === "completed" || rawStatus === "treatment_completed" || rawStatus === "discharged";
            
            let displayStatus = t("inTreatment"); 
            if (isArchived || isCleared) {
              displayStatus = t("cured");
            }

            const dischargeDateRaw = p.treatment_end_date || p.archived_at || c.created_at;
            const formattedDischarge = dischargeDateRaw
              ? new Date(dischargeDateRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : "—";

            let phase = "Intensive Phase (HRZE)";
            if (p.tb_regimen?.toLowerCase().includes("continuation") || p.adherence_rate > 35) {
              phase = "Continuation Phase (HR)";
            }
            if ((p.adherence_rate ?? 0) < 80 && (p.adherence_rate ?? 0) > 0) {
              phase = "Default Risk";
            }
            
            uniquePatients.set(c.patient_id, {
              id: c.patient_id, 
              name: sanitizeText(p?.full_name) || t("unknownPatient"),
              age: (p?.age !== null && p?.age !== undefined && p?.age !== "") ? p.age.toString() : "--", 
              barangay: sanitizeText(p?.barangay) || "Carmona",
              riskLevel: p?.risk_level || "Standard",
              status: displayStatus,
              treatmentPhase: phase,
              lastVisit: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              dischargeDate: formattedDischarge,
              raw: p
            });
          }
        });
        
        setPatients(Array.from(uniquePatients.values()));
      }
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      triggerAlert(t("syncErrorTitle"), t("syncErrorDesc"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (processedPatients.length === 0) {
      triggerAlert(t("error"), t("noPatients"), "error");
      return;
    }

    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 118, 110);
    doc.text("TEREA", 14, yPos);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Carmona Health Center • TB DOTS Surveillance System", 14, yPos + 6);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    yPos += 20;
    doc.text(`Patient Directory Report (${viewTab === 'active' ? 'Active Cohort' : 'Discharged Archive'})`, 14, yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Attending Clinician: Dr. ${doctorName.replace(/^(dr\.?\s*)+/i, "").trim() || "Doctor"}`, 14, yPos + 6);
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, yPos + 12);
    
    yPos += 20;

    const tableColumn = viewTab === "active"
      ? ["Name", "Age", "Barangay", "Status", "Risk Level", "Registration Date"]
      : ["Name", "Age", "Barangay", "Registration Date", "Discharge Date"];

    const tableRows = processedPatients.map(patient => {
      if (viewTab === "active") {
        return [
          patient.name,
          patient.age,
          patient.barangay,
          patient.status,
          patient.riskLevel,
          patient.lastVisit
        ];
      }
      return [
        patient.name,
        patient.age,
        patient.barangay,
        patient.lastVisit,
        patient.dischargeDate
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [15, 118, 110] }, 
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`TEREA_Patient_Directory_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    triggerAlert(t("genReportTitle"), t("genReportDesc"), "success");
  };

  const handlePrintPatientReport = (patientRaw: any) => {
    setPatientToPrint(patientRaw);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const togglePatientSelection = (id: string) => {
    const newSelected = new Set(selectedPatientIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPatientIds(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedPatientIds.size === paginatedPatients.length && paginatedPatients.length > 0) {
      setSelectedPatientIds(new Set());
    } else {
      const newSelected = new Set(selectedPatientIds);
      paginatedPatients.forEach(patient => newSelected.add(patient.id));
      setSelectedPatientIds(newSelected);
    }
  };

  const handleBulkDispatch = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setPatients(patients.filter(p => !selectedPatientIds.has(p.id)));
      setSelectedPatientIds(new Set());
      setBulkDeleteDialogOpen(false);
      setIsSubmitting(false);
      triggerAlert("Patients Dispatched", `Successfully dispatched ${selectedPatientIds.size} patients.`, "success");
    }, 1000);
  };

  const handleDispatch = (id: string) => {
    setPatients(patients.filter(p => p.id !== id));
    triggerAlert("Patient Dispatched", "The dispatch protocol has been initiated for this patient. They will be unlinked.", "success");
  };

  const confirmArchive = async () => {
    if (!patientToArchive) return;
    setIsArchiving(true);
    
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', patientToArchive.id);
        
      if (profileError) throw profileError;

      await supabase
        .from('connections')
        .update({ is_archived: true })
        .eq('patient_id', patientToArchive.id);

      setPatients(patients.filter(p => p.id !== patientToArchive.id));
      triggerAlert("Record Archived", t("archiveSuccessDesc"), "success");
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setIsArchiving(false);
      setArchiveModalOpen(false);
      setPatientToArchive(null);
    }
  };

  const handleInitiateDelete = (id: string, name: string) => {
    setPatientToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication error");

      await supabase.from('medications').delete().eq('user_id', patientToDelete.id);
      await supabase.from('roadmap').delete().eq('patient_id', patientToDelete.id);
      await supabase.from('patient_vitals').delete().eq('patient_id', patientToDelete.id);
      await supabase.from('doctor_notes').delete().eq('user_id', patientToDelete.id);
      await supabase.from('dssm_monitoring').delete().eq('patient_id', patientToDelete.id);
      
      await supabase.from('connections').delete()
        .eq('patient_id', patientToDelete.id)
        .eq('doctor_id', user.id);

      setPatients(patients.filter(p => p.id !== patientToDelete.id));
      triggerAlert("Record Deleted", "Patient medical record has been deleted successfully.", "success");
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleInitiateRelapse = (id: string, name: string) => {
    setPatientToRelapse({ id, name });
    setRelapseModalOpen(true);
  };

  const confirmRelapse = async () => {
    if (!patientToRelapse) return;
    setIsRelapsing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'verified',
          registration_group: 'Relapse',
          is_archived: false,
          treatment_start_date: null,
          treatment_end_date: null
        })
        .eq('id', patientToRelapse.id);

      if (error) throw error;

      await supabase
        .from('connections')
        .update({ is_archived: false })
        .eq('patient_id', patientToRelapse.id);

      await supabase.from('audit_logs').insert({
        action_name: "Patient Re-admitted (Relapse)",
        user_name: doctorName || "Doctor",
        target_entity: patientToRelapse.name,
        category: "Treatment Lifecycle",
        severity: "warning",
        metadata: { reason: "Recurrent symptoms. Enrolled under Relapse Protocol." }
      });

      setRelapseModalOpen(false);
      triggerAlert("Patient Re-admitted", `${patientToRelapse.name} has been enrolled as a Relapse case and moved to Active Patients.`, "success");
      setViewTab("active");
      fetchAllData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setIsRelapsing(false);
      setPatientToRelapse(null);
    }
  };

  const handleInitiateRestore = (id: string, name: string) => {
    setPatientToRestore({ id, name });
    setRestoreModalOpen(true);
  };

  const confirmRestore = async () => {
    if (!patientToRestore) return;
    setIsRestoring(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'verified', is_archived: false })
        .eq('id', patientToRestore.id);

      if (error) throw error;

      await supabase
        .from('connections')
        .update({ is_archived: false })
        .eq('patient_id', patientToRestore.id);

      await supabase.from('audit_logs').insert({
        action_name: "Discharge Rollback",
        user_name: doctorName || "Doctor",
        target_entity: patientToRestore.name,
        category: "Clinical Correction",
        severity: "info",
        metadata: { note: "Accidental discharge reversed. Restored to active monitoring." }
      });

      setRestoreModalOpen(false);
      triggerAlert("Patient Restored", `${patientToRestore.name} has been restored to active monitoring roster.`, "success");
      setViewTab("active");
      fetchAllData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setIsRestoring(false);
      setPatientToRestore(null);
    }
  };

  const processedPatients = useMemo(() => {
    return patients.filter((p) => {
      const isDischarged = p.status === t("cured");
      
      if (viewTab === "active" && isDischarged) return false;
      if (viewTab === "discharged" && !isDischarged) return false;

      const matchesSearch = search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barangay.toLowerCase().includes(search.toLowerCase());
      
      const matchesRisk = viewTab === "discharged" || riskFilter === "all" ||
        (riskFilter === "high-risk" && p.riskLevel.toLowerCase().includes("high")) ||
        (riskFilter === "medium-risk" && p.riskLevel.toLowerCase().includes("medium")) ||
        (riskFilter === "standard" && (p.riskLevel.toLowerCase().includes("standard") || p.riskLevel.toLowerCase().includes("low")));

      const matchesStatus = viewTab === "discharged" || statusFilter === "all" ||
        (statusFilter === "in-treatment" && p.status === t("inTreatment")) ||
        (statusFilter === "intensive" && p.treatmentPhase.includes("Intensive")) ||
        (statusFilter === "continuation" && p.treatmentPhase.includes("Continuation")) ||
        (statusFilter === "default-risk" && p.treatmentPhase.includes("Default"));
        
      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [patients, viewTab, search, riskFilter, statusFilter, t]);

  const sortedPatients = useMemo(() => {
    const list = [...processedPatients];
    list.sort((a, b) => {
      if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
      if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
      if (sortOrder === "age-asc") return (parseInt(a.age) || 0) - (parseInt(b.age) || 0);
      if (sortOrder === "age-desc") return (parseInt(b.age) || 0) - (parseInt(a.age) || 0);
      return 0;
    });
    return list;
  }, [processedPatients, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedPatients.length / itemsPerPage));
  const paginatedPatients = sortedPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const cleanDoctorName = sanitizeText(doctorName).replace(/^(dr\.?\s*)+/i, "").trim() || "Doctor";

  return (
    <DashboardLayout role="doctor" userName={cleanDoctorName}>
      
      {/* Centralized Notification Modal */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.15)] font-sans print:hidden">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3.5 ${alert.type === 'success' ? 'bg-teal-50 border border-teal-200' : 'bg-red-50 border border-red-200'}`}>
            {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-teal-700" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <h2 className="text-base font-bold text-slate-900">{alert.title}</h2>
          <p className="text-slate-500 mt-1 text-xs leading-relaxed">{alert.message}</p>
          <Button className="mt-5 w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs h-10 shadow-xs" onClick={() => setAlert({...alert, open: false})}>
            Acknowledge
          </Button>
        </DialogContent>
      </Dialog>

      {/* --- RE-ADMIT AS RELAPSE DIALOG --- */}
      <Dialog open={relapseModalOpen} onOpenChange={setRelapseModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl p-6 bg-white font-sans border border-amber-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3 border border-amber-200">
            <RefreshCw className="h-6 w-6 text-amber-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 text-center">Enroll as TB Relapse Case?</DialogTitle>
            <DialogDescription className="text-slate-600 text-xs text-center mt-2 leading-relaxed">
              You are re-enrolling <strong>{patientToRelapse?.name}</strong> under the <strong>Clinical Relapse Protocol</strong>. <br/><br/>
              This will return the patient to <strong>Active Patients</strong>, set their Registration Group to <strong>Relapse</strong>, and allow you to configure a fresh diagnostic evaluation and regimen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-300 font-semibold text-xs h-10"
              onClick={() => setRelapseModalOpen(false)}
              disabled={isRelapsing}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-10 shadow-xs"
              onClick={confirmRelapse}
              disabled={isRelapsing}
            >
              {isRelapsing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Enroll as Relapse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- RESTORE TO ACTIVE (ROLLBACK) DIALOG --- */}
      <Dialog open={restoreModalOpen} onOpenChange={setRestoreModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border border-slate-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mb-3 border border-teal-200">
            <Undo2 className="h-6 w-6 text-teal-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 text-center">Restore Patient to Active?</DialogTitle>
            <DialogDescription className="text-slate-600 text-xs text-center mt-2 leading-relaxed">
              Reverse accidental discharge for <strong>{patientToRestore?.name}</strong>? <br/><br/>
              This patient will be returned to the <strong>Active Patients</strong> queue. All previous medication records, roadmap appointments, and adherence data will remain intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-300 font-semibold text-xs h-10"
              onClick={() => setRestoreModalOpen(false)}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs h-10 shadow-xs"
              onClick={confirmRestore}
              disabled={isRestoring}
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Undo2 className="h-4 w-4 mr-2" />}
              Confirm Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ARCHIVE DIALOG --- */}
      <Dialog open={archiveModalOpen} onOpenChange={setArchiveModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border border-slate-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 border border-slate-200">
            <Archive className="h-6 w-6 text-slate-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 text-center">Archive Patient Record?</DialogTitle>
            <DialogDescription className="text-slate-600 text-xs text-center mt-2 leading-relaxed">
              This will remove <strong>{patientToArchive?.name}</strong> from your active tracking queue and store their data for long-term historical reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-300 font-semibold text-xs h-10"
              onClick={() => setArchiveModalOpen(false)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs h-10 shadow-xs"
              onClick={confirmArchive}
              disabled={isArchiving}
            >
              {isArchiving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
              Archive Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DELETE RECORD DIALOG --- */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border border-red-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3 border border-red-200">
            <ShieldAlert className="h-6 w-6 text-red-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-700 text-center">Delete Patient Record</DialogTitle>
            <DialogDescription className="text-slate-600 text-xs text-center mt-2 leading-relaxed">
              You are about to permanently delete all medical tracking data (Vitals, Meds, Roadmaps) and unlink <strong>{patientToDelete?.name}</strong> from your clinic. <br/><br/><strong>This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-300 font-semibold text-xs h-10"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-10 shadow-xs"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- BULK DISPATCH DIALOG --- */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[420px] bg-white border-slate-200 shadow-xl font-sans print:hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Confirm Bulk Dispatch
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-xs mt-2">
              You are about to dispatch and unlink <strong>{selectedPatientIds.size}</strong> patients from your active list. Do you wish to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)} disabled={isSubmitting} className="rounded-xl text-xs h-9">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDispatch} disabled={isSubmitting} className="rounded-xl text-xs h-9 shadow-xs">
              {isSubmitting ? "Dispatching..." : "Yes, Dispatch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in print:hidden font-sans">
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-300/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
              Active Clinical Registry
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 pt-1">{t("pageTitle")}</h1>
            <p className="text-slate-500 text-xs font-normal">{t("pageSubtitle")}</p>
          </div>

          <div className="flex gap-2">
            {selectedPatientIds.size > 0 && viewTab === 'active' && (
              <Button 
                variant="destructive" 
                className="gap-2 rounded-xl text-xs h-10 shadow-xs transition-all animate-in fade-in"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> 
                {t("deleteSelected")} ({selectedPatientIds.size})
              </Button>
            )}
            <Button 
              className="gap-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold h-10 shadow-xs transition-colors" 
              onClick={handleExport}
            >
              <Download className="h-3.5 w-3.5" />
              {t("exportBtn")}
            </Button>
          </div>
        </div>

        {/* --- SEGMENTED REGISTRY VIEW TABS --- */}
        <div className="flex p-1 bg-slate-200/70 rounded-xl w-fit border border-slate-300/60 shadow-2xs">
          <button
            onClick={() => { setViewTab("active"); setCurrentPage(1); setSelectedPatientIds(new Set()); }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              viewTab === "active" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("activePatients")}
          </button>
          <button
            onClick={() => { setViewTab("discharged"); setCurrentPage(1); setSelectedPatientIds(new Set()); }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              viewTab === "discharged" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("dischargedArchive")}
          </button>
        </div>

        {/* --- SEARCH & CLINICAL FILTER BAR --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-300/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder={t("searchPlaceholder")} 
              className="pl-9 bg-slate-50 border-slate-300 text-xs text-slate-800 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-10 rounded-xl w-full" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          {/* Risk Level Filter (Active Tab Only) */}
          {viewTab === "active" ? (
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="bg-slate-50 border-slate-300 text-xs text-slate-800 h-10 rounded-xl">
                <SelectValue placeholder={t("riskLevel")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 bg-white">
                <SelectItem value="all" className="text-xs">{t("allRiskLevels")}</SelectItem>
                <SelectItem value="high-risk" className="text-xs">{t("highRisk")}</SelectItem>
                <SelectItem value="medium-risk" className="text-xs">{t("mediumRisk")}</SelectItem>
                <SelectItem value="standard" className="text-xs">{t("standardLow")}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="hidden lg:block text-xs font-semibold text-slate-400 self-center pl-2">
              Historical Discharged Registry
            </div>
          )}

          {/* Status Filter for Active Tab */}
          {viewTab === "active" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-50 border-slate-300 text-xs text-slate-800 h-10 rounded-xl">
                <SelectValue placeholder={t("statusFilter")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 bg-white">
                <SelectItem value="all" className="text-xs">{t("allStatuses")}</SelectItem>
                <SelectItem value="in-treatment" className="text-xs">{t("inTreatment")}</SelectItem>
                <SelectItem value="intensive" className="text-xs">{t("intensivePhase")}</SelectItem>
                <SelectItem value="continuation" className="text-xs">{t("continuationPhase")}</SelectItem>
                <SelectItem value="default-risk" className="text-xs">{t("defaultRisk")}</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Sort Order Selector */}
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="bg-slate-50 border-slate-300 text-xs text-slate-800 h-10 rounded-xl">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 bg-white">
              <SelectItem value="name-asc" className="text-xs">{t("nameAsc")}</SelectItem>
              <SelectItem value="name-desc" className="text-xs">{t("nameDesc")}</SelectItem>
              <SelectItem value="age-asc" className="text-xs">{t("ageAsc")}</SelectItem>
              <SelectItem value="age-desc" className="text-xs">{t("ageDesc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filters Action */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            className="border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold h-8" 
            onClick={() => { setSearch(""); setRiskFilter("all"); setStatusFilter("all"); setSortOrder("name-asc"); setCurrentPage(1); }}
          >
            <Filter className="h-3.5 w-3.5 mr-1.5 text-teal-700" />
            {t("resetFilters")}
          </Button>
        </div>

        {/* --- PATIENT DIRECTORY TABLE CARD --- */}
        <Card className="border-slate-300/80 shadow-[0_12px_35px_rgba(15,23,42,0.06)] bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/70">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <Users className="h-4 w-4 text-teal-700" /> 
              {viewTab === 'active' ? t("patientRecords") : t("dischargedRecords")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/90 border-b border-slate-200">
                <TableRow>
                  {viewTab === 'active' && (
                    <TableHead className="w-12 text-center pl-4">
                      <Checkbox 
                        checked={paginatedPatients.length > 0 && selectedPatientIds.size === paginatedPatients.length}
                        onCheckedChange={toggleAllSelection}
                        aria-label="Select all"
                        className="data-[state=checked]:bg-teal-700 data-[state=checked]:border-teal-700 border-slate-300"
                      />
                    </TableHead>
                  )}
                  <TableHead 
                    className="pl-4 text-[11px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => setSortOrder(sortOrder === 'name-asc' ? 'name-desc' : 'name-asc')}
                  >
                    <div className="flex items-center gap-1.5">
                      {t("name")}
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-24">{t("age")}</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-44">{t("barangay")}</TableHead>
                  
                  {/* Active view columns */}
                  {viewTab === 'active' ? (
                    <>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-36">{t("status")}</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-36">{t("riskLevel")}</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-40">{t("registrationDate")}</TableHead>
                    </>
                  ) : (
                    /* Discharged view columns (Replaces redundant status/risk with clean discharge date) */
                    <>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-44">{t("registrationDate")}</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-44">
                        <div className="flex items-center gap-1 text-teal-800">
                          <CalendarCheck className="h-3 w-3 text-teal-700" />
                          {t("dischargeDate")}
                        </div>
                      </TableHead>
                    </>
                  )}
                  
                  <TableHead className="text-right pr-6 text-[11px] font-bold uppercase tracking-wider text-slate-600 w-16">
                    {t("action")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={viewTab === 'active' ? 8 : 6} className="text-center py-12 text-slate-400 text-xs font-medium">{t("syncing")}</TableCell></TableRow>
                ) : paginatedPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={viewTab === 'active' ? 8 : 6} className="text-center text-slate-400 py-12 text-xs italic">{t("noPatients")}</TableCell>
                  </TableRow>
                ) : paginatedPatients.map((patient) => {
                  const isDischarged = viewTab === "discharged" || patient.status === t("cured");

                  return (
                    <TableRow 
                      key={patient.id} 
                      className={`transition-colors border-b border-slate-100 ${selectedPatientIds.has(patient.id) ? 'bg-teal-50/60' : 'hover:bg-slate-50/80'} ${isDischarged ? 'opacity-90 bg-slate-50/40' : ''}`}
                    >
                      {viewTab === 'active' && (
                        <TableCell className="text-center pl-4">
                          <Checkbox 
                            checked={selectedPatientIds.has(patient.id)}
                            onCheckedChange={() => togglePatientSelection(patient.id)}
                            aria-label={`Select ${patient.name}`}
                            className="data-[state=checked]:bg-teal-700 data-[state=checked]:border-teal-700 border-slate-300"
                          />
                        </TableCell>
                      )}
                      
                      {/* Name with direct clickability */}
                      <TableCell className="font-semibold text-xs text-slate-900 pl-4">
                        <button
                          onClick={() => navigate(`/doctor/patient-details/${patient.id}`)}
                          className="hover:text-teal-700 font-bold transition-colors text-left"
                        >
                          {patient.name}
                        </button>
                      </TableCell>
                      
                      <TableCell className="font-medium text-xs text-slate-700">{patient.age}</TableCell>
                      <TableCell className="text-xs text-slate-500">{patient.barangay}</TableCell>
                      
                      {/* Active Tab Data */}
                      {viewTab === 'active' ? (
                        <>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-md text-[10px] font-semibold ${getStatusBadge(patient.status, t)}`}>
                              {patient.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className={`rounded-md text-[10px] ${getRiskBadge(patient.riskLevel, false)}`}>
                              {patient.riskLevel}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-slate-500 text-xs tabular-nums">{patient.lastVisit}</TableCell>
                        </>
                      ) : (
                        /* Discharged Tab Data */
                        <>
                          <TableCell className="text-slate-500 text-xs tabular-nums">{patient.lastVisit}</TableCell>
                          <TableCell className="text-xs font-bold text-teal-800 tabular-nums">
                            {patient.dischargeDate}
                          </TableCell>
                        </>
                      )}
                      
                      {/* Unified Kebab Icon Menu (Single Action Control) */}
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                              title="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200 bg-white shadow-xl p-1 z-50">
                            <DropdownMenuItem onClick={() => navigate(`/doctor/patient-details/${patient.id}`)} className="cursor-pointer font-medium text-xs text-slate-800 rounded-lg py-2 focus:bg-slate-100">
                              <Eye className="mr-2 h-3.5 w-3.5 text-teal-700" />
                              {t("seePatientInfo")}
                            </DropdownMenuItem>

                            {/* Print Report */}
                            <DropdownMenuItem onClick={() => handlePrintPatientReport(patient.raw)} className="cursor-pointer font-medium text-xs text-slate-800 rounded-lg py-2 focus:bg-slate-100">
                              <Printer className="mr-2 h-3.5 w-3.5 text-teal-700" />
                              {t("printReport")}
                            </DropdownMenuItem>
                            
                            {/* Actions for Discharged Patients */}
                            {isDischarged && (
                              <>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem 
                                  onClick={() => handleInitiateRelapse(patient.id, patient.name)} 
                                  className="cursor-pointer font-semibold text-xs text-amber-700 focus:text-amber-800 focus:bg-amber-50 rounded-lg py-2"
                                >
                                  <RefreshCw className="mr-2 h-3.5 w-3.5 text-amber-600" />
                                  {t("readmitRelapse")}
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  onClick={() => handleInitiateRestore(patient.id, patient.name)} 
                                  className="cursor-pointer font-semibold text-xs text-teal-700 focus:text-teal-800 focus:bg-teal-50 rounded-lg py-2"
                                >
                                  <Undo2 className="mr-2 h-3.5 w-3.5 text-teal-700" />
                                  {t("restoreActive")}
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* Actions for Active Patients */}
                            {!isDischarged && (
                              <>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem onClick={() => handleDispatch(patient.id)} className="cursor-pointer font-medium text-xs text-blue-600 focus:text-blue-700 focus:bg-blue-50 rounded-lg py-2">
                                  <UserX className="mr-2 h-3.5 w-3.5" />
                                  {t("dispatchPatient")}
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator className="bg-slate-100" />

                            <DropdownMenuItem onClick={() => handleInitiateDelete(patient.id, patient.name)} className="cursor-pointer font-semibold text-xs text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg py-2">
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              {t("deletePatient")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Unified Table Pagination with Rows-Per-Page Selector */}
            {!loading && sortedPatients.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">{t("rowsPerPage")}</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(val) => {
                        setItemsPerPage(Number(val));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px] rounded-lg bg-white border-slate-300 text-xs font-bold text-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 bg-white">
                        <SelectItem value="5" className="text-xs">5</SelectItem>
                        <SelectItem value="10" className="text-xs">10</SelectItem>
                        <SelectItem value="25" className="text-xs">25</SelectItem>
                        <SelectItem value="50" className="text-xs">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-xs text-slate-600 font-medium">
                    {t("showing")} {sortedPatients.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} {t("to")} {Math.min(currentPage * itemsPerPage, sortedPatients.length)} {t("of")} {sortedPatients.length} {t("entries")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 mr-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1} 
                    className="h-8 w-8 p-0 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages || totalPages === 0} 
                    className="h-8 w-8 p-0 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- PRINTABLE CONTAINER --- */}
      <div className="hidden print:block font-sans text-black bg-white min-h-screen w-full patient-report-print">
        <style type="text/css" media="print">
          {`
            @page { size: auto; margin: 0mm; }
            body * { visibility: hidden !important; }
            .patient-report-print, .patient-report-print * { visibility: visible !important; }
            .patient-report-print { 
              position: fixed !important; 
              left: 0 !important; 
              top: 0 !important; 
              width: 100vw !important; 
              min-height: 100vh !important;
              margin: 0 !important;
              padding: 2cm 2cm !important;
              background: white !important;
              z-index: 99999 !important;
              box-sizing: border-box !important;
            }
          `}
        </style>

        {patientToPrint && (
          <div>
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">CITY GOVERNMENT OF CARMONA</h1>
                <h2 className="text-lg font-bold text-slate-600">CARMONA HEALTH CENTER • TB DOTS CLINIC</h2>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-extrabold tracking-tight text-teal-800">TEREA TB-DOTS</h1>
                <p className="text-xs font-bold text-slate-500">OFFICIAL PATIENT CLINICAL REPORT</p>
              </div>
            </div>

            <div className="space-y-6 text-sm">
              <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-xs">Patient Demographics</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <div><span className="font-bold text-slate-500">Full Name:</span> {patientToPrint.full_name}</div>
                  <div><span className="font-bold text-slate-500">Patient ID:</span> {patientToPrint.id?.substring(0, 8).toUpperCase()}</div>
                  <div><span className="font-bold text-slate-500">Age / Gender:</span> {patientToPrint.age || "N/A"} yrs old • {patientToPrint.gender || "N/A"}</div>
                  <div><span className="font-bold text-slate-500">Barangay:</span> {patientToPrint.barangay || "Carmona"}</div>
                  <div><span className="font-bold text-slate-500">Status:</span> <span className="font-bold uppercase">{patientToPrint.status || "Discharged"}</span></div>
                  <div><span className="font-bold text-slate-500">Risk Assessment Level:</span> {patientToPrint.risk_level || "Cleared"}</div>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-xs">Clinical Profile & Regimen</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <div><span className="font-bold text-slate-500">TB Treatment Regimen:</span> {patientToPrint.tb_regimen || "6-Month DOTS"}</div>
                  <div><span className="font-bold text-slate-500">Treatment Start:</span> {patientToPrint.treatment_start_date || "N/A"}</div>
                  <div><span className="font-bold text-slate-500">Treatment Completion:</span> {patientToPrint.treatment_end_date || "N/A"}</div>
                  <div><span className="font-bold text-slate-500">Adherence Rate:</span> {Math.round(patientToPrint.adherence_rate ?? 0)}%</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 italic pt-2">
                This patient has been reviewed by the Carmona TB DOTS Center. Discharged patients remain registered in the TEREA Digital Surveillance Registry for 12 months with scheduled follow-up clearances.
              </p>

              <div className="pt-16 flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-400">Date Printed</p>
                  <p className="font-bold">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-center w-64 border-t border-slate-800 pt-2">
                  <p className="font-bold uppercase">Dr. {doctorName.replace(/^(dr\.?\s*)+/i, "").trim() || "Doctor"}</p>
                  <p className="text-sm text-slate-500">Attending Physician • Carmona Health Center</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}