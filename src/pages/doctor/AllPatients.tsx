import { useEffect, useState } from "react";
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
  Search, Filter, Eye, Download, Users, CheckCircle, AlertCircle, MoreHorizontal, UserX, ArrowUpDown, ChevronLeft, ChevronRight, Trash2, Archive, Loader2, ShieldAlert, Printer, RefreshCw, Undo2
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
    resetFilters: "Reset Filters",
    patientRecords: "Patient Records",
    name: "Name",
    age: "Age",
    barangay: "Barangay",
    status: "Status",
    registrationDate: "Registration Date",
    action: "Action",
    syncing: "Syncing with database...",
    noPatients: "No patients found.",
    unknownPatient: "Unknown Patient",
    genReportTitle: "Generating Report",
    genReportDesc: "Patient directory list is being exported...",
    syncErrorTitle: "Sync Error",
    syncErrorDesc: "Could not sync patient list.",
    error: "Error",
    quickActions: "Quick Actions",
    dispatchPatient: "Dispatch Patient",
    archivePatient: "Archive Patient",
    archiveSuccessDesc: "Patient record securely moved to archives.",
    seePatientInfo: "See Patient Info",
    printReport: "Print E-Discharge Certificate",
    readmitRelapse: "Re-admit as Relapse",
    restoreActive: "Restore to Active Treatment",
    inTreatment: "In Treatment",
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
    resetFilters: "I-reset ang mga Filter",
    patientRecords: "Mga Rekord ng Pasyente",
    name: "Pangalan",
    age: "Edad",
    barangay: "Barangay",
    status: "Katayuan",
    registrationDate: "Petsa ng Rehistrasyon",
    action: "Aksyon",
    syncing: "Nagsi-sync sa database...",
    noPatients: "Walang nahanap na pasyente.",
    unknownPatient: "Hindi Kilalang Pasyente",
    genReportTitle: "Gumagawa ng Ulat",
    genReportDesc: "Ini-export na ang listahan ng direktoryo...",
    syncErrorTitle: "Error sa Pag-sync",
    syncErrorDesc: "Hindi ma-sync ang listahan ng pasyente.",
    error: "Error",
    quickActions: "Quick Actions",
    dispatchPatient: "I-dispatch ang Pasyente",
    archivePatient: "I-archive ang Pasyente",
    archiveSuccessDesc: "Ligtas na inilipat ang record sa archives.",
    seePatientInfo: "Tingnan ang Impormasyon",
    printReport: "I-print ang E-Discharge Certificate",
    readmitRelapse: "I-readmit bilang Relapse",
    restoreActive: "Ibalik sa Aktibong Gamutan",
    inTreatment: "Ginagamot",
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
  lastVisit: string;
  raw: any;
}

const getRiskBadge = (risk: string, isDischarged: boolean) => {
  if (isDischarged || risk === "Cleared") return "bg-slate-100 text-slate-500 border-slate-200";
  const lowerRisk = risk?.toLowerCase() || "";
  if (lowerRisk.includes("high")) return "bg-red-50 text-red-600 border-red-200";
  if (lowerRisk.includes("medium") || lowerRisk.includes("follow-up")) return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-green-50 text-green-600 border-green-200";
};

const getStatusBadge = (status: string, t: (key: string) => string) => {
  if (status === t("cured")) return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-blue-50 text-blue-600 border-blue-200"; 
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
  const [viewTab, setViewTab] = useState<"active" | "discharged">("active");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [patientToArchive, setPatientToArchive] = useState<{id: string, name: string} | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Re-admit Relapse State
  const [relapseModalOpen, setRelapseModalOpen] = useState(false);
  const [patientToRelapse, setPatientToRelapse] = useState<{id: string, name: string} | null>(null);
  const [isRelapsing, setIsRelapsing] = useState(false);

  // Restore Rollback State
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [patientToRestore, setPatientToRestore] = useState<{id: string, name: string} | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Quick Action Print State
  const [patientToPrint, setPatientToPrint] = useState<any>(null);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchAllData();
  }, [language]); 

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
        
      if (profile?.full_name) setDoctorName(profile.full_name);

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
        
        connections.forEach(c => {
          const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
          
          if (!c.is_archived && p && !p.is_archived && !uniquePatients.has(c.patient_id)) {
            const rawStatus = p?.status?.toLowerCase() || "";
            let displayStatus = t("inTreatment"); 
            if (rawStatus === "cured" || rawStatus === "completed" || rawStatus === "treatment_completed") {
              displayStatus = t("cured");
            }
            
            uniquePatients.set(c.patient_id, {
              id: c.patient_id, 
              name: p?.full_name || t("unknownPatient"),
              age: (p?.age !== null && p?.age !== undefined && p?.age !== "") ? p.age.toString() : "--", 
              barangay: p?.barangay || "Carmona",
              riskLevel: p?.risk_level || "Standard",
              status: displayStatus,
              lastVisit: new Date(c.created_at).toLocaleDateString(),
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
    doc.setTextColor(45, 59, 30);
    doc.text("TEREA", 14, yPos);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(96, 108, 56);
    doc.text("TB DOTS Clinical Monitoring System", 14, yPos + 6);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    yPos += 20;
    doc.text(`Patient Directory Report (${viewTab === 'active' ? 'Active' : 'Discharged'})`, 14, yPos);
    
    doc.setFontSize(10);
    doc.text(`Generated by: Dr. ${doctorName}`, 14, yPos + 6);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, yPos + 12);
    
    yPos += 20;

    const tableColumn = ["Name", "Age", "Barangay", "Status", "Risk Level", "Registration"];
    const tableRows = processedPatients.map(patient => {
      const isDischarged = patient.status === t("cured");
      return [
        patient.name,
        patient.age,
        patient.barangay,
        patient.status,
        isDischarged ? "Cleared" : patient.riskLevel,
        patient.lastVisit
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [96, 108, 56] }, 
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

  const handleInitiateArchive = (id: string, name: string) => {
    setPatientToArchive({ id, name });
    setArchiveModalOpen(true);
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

  // --- RE-ADMIT AS RELAPSE ---
  const handleInitiateRelapse = (id: string, name: string) => {
    setPatientToRelapse({ id, name });
    setRelapseModalOpen(true);
  };

  const confirmRelapse = async () => {
    if (!patientToRelapse) return;
    setIsRelapsing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Shift status back to active, set Registration Group to 'Relapse', clear treatment dates for new protocol setup
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'verified',
          registration_group: 'Relapse',
          treatment_start_date: null,
          treatment_end_date: null
        })
        .eq('id', patientToRelapse.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action_name: "Patient Re-admitted (Relapse)",
        user_name: doctorName || "Doctor",
        target_entity: patientToRelapse.name,
        category: "Treatment Lifecycle",
        severity: "warning",
        metadata: { reason: "Recurrent symptoms. Enrolled under DOH Relapse Protocol." }
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

  // --- RESTORE TO ACTIVE (ACCIDENTAL DISCHARGE ROLLBACK) ---
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
        .update({ status: 'verified' })
        .eq('id', patientToRestore.id);

      if (error) throw error;

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

  let processedPatients = patients.filter((p) => {
    const isDischarged = p.status === t("cured");
    
    if (viewTab === "active" && isDischarged) return false;
    if (viewTab === "discharged" && !isDischarged) return false;

    const matchesSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barangay.toLowerCase().includes(search.toLowerCase());
    
    const matchesRisk = riskFilter === "all" ||
      (riskFilter === "high-risk" && p.riskLevel.toLowerCase().includes("high")) ||
      (riskFilter === "medium-risk" && p.riskLevel.toLowerCase().includes("medium")) ||
      (riskFilter === "standard" && (p.riskLevel.toLowerCase().includes("standard") || p.riskLevel.toLowerCase().includes("low")));
      
    return matchesSearch && matchesRisk;
  });

  processedPatients.sort((a, b) => {
    if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
    if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
    if (sortOrder === "age-asc") return (parseInt(a.age) || 0) - (parseInt(b.age) || 0);
    if (sortOrder === "age-desc") return (parseInt(b.age) || 0) - (parseInt(a.age) || 0);
    return 0;
  });

  const totalPages = Math.ceil(processedPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = processedPatients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout role="doctor" userName={doctorName || "Doctor"}>
      
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans print:hidden">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{alert.title}</h2>
          <p className="text-slate-500 mt-2 text-sm">{alert.message}</p>
          <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white" onClick={() => setAlert({...alert, open: false})}>Okay</Button>
        </DialogContent>
      </Dialog>

      {/* --- RE-ADMIT AS RELAPSE DIALOG --- */}
      <Dialog open={relapseModalOpen} onOpenChange={setRelapseModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl p-6 bg-white font-sans border border-amber-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4 border border-amber-200">
            <RefreshCw className="h-6 w-6 text-amber-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 text-center">Enroll as TB Relapse Case?</DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center mt-2 leading-relaxed">
              You are re-enrolling <strong>{patientToRelapse?.name}</strong> under the <strong>DOH TB Relapse Protocol</strong>. <br/><br/>
              This will return the patient to <strong>Active Patients</strong>, set their Registration Group to <strong>Relapse</strong>, and allow you to configure a fresh diagnostic evaluation and regimen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 font-semibold"
              onClick={() => setRelapseModalOpen(false)}
              disabled={isRelapsing}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
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
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border border-blue-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 border border-blue-200">
            <Undo2 className="h-6 w-6 text-blue-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 text-center">Restore Patient to Active?</DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center mt-2 leading-relaxed">
              Reverse accidental discharge for <strong>{patientToRestore?.name}</strong>? <br/><br/>
              This patient will be returned to the <strong>Active Patients</strong> queue. All previous medication records, roadmap appointments, and adherence data will remain intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 font-semibold"
              onClick={() => setRestoreModalOpen(false)}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={confirmRestore}
              disabled={isRestoring}
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Undo2 className="h-4 w-4 mr-2" />}
              Confirm Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveModalOpen} onOpenChange={setArchiveModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border border-slate-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 border border-slate-200">
            <Archive className="h-6 w-6 text-slate-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 text-center">Archive Patient Record?</DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center mt-2 leading-relaxed">
              This will remove <strong>{patientToArchive?.name}</strong> from your active tracking queue and store their data for long-term historical reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 font-semibold"
              onClick={() => setArchiveModalOpen(false)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold"
              onClick={confirmArchive}
              disabled={isArchiving}
            >
              {isArchiving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
              Archive Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border border-red-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 border border-red-200">
            <ShieldAlert className="h-6 w-6 text-red-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-700 text-center">Delete Patient Record</DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center mt-2 leading-relaxed">
              You are about to permanently delete all medical tracking data (Vitals, Meds, Roadmaps) and unlink <strong>{patientToDelete?.name}</strong> from your clinic. <br/><br/><strong>This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 font-semibold"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[425px] bg-white border-slate-200 shadow-xl font-sans print:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Confirm Bulk Dispatch
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              You are about to dispatch and unlink <strong>{selectedPatientIds.size}</strong> patients from your active list. Do you wish to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)} disabled={isSubmitting} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDispatch} disabled={isSubmitting} className="rounded-xl shadow-sm">
              {isSubmitting ? "Dispatching..." : "Yes, Dispatch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3B1E]">{t("pageTitle")}</h1>
            <p className="text-[#606C38]/80 font-medium mt-1">{t("pageSubtitle")}</p>
          </div>
          <div className="flex gap-2">
            {selectedPatientIds.size > 0 && viewTab === 'active' && (
              <Button 
                variant="destructive" 
                className="gap-2 rounded-xl shadow-sm transition-all animate-in fade-in"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> 
                {t("deleteSelected")} ({selectedPatientIds.size})
              </Button>
            )}
            <Button className="gap-2 bg-[#606C38] hover:bg-[#2D3B1E] text-white rounded-xl" onClick={handleExport}>
              <Download className="h-4 w-4" />
              {t("exportBtn")}
            </Button>
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit mb-2">
          <button
            onClick={() => { setViewTab("active"); setCurrentPage(1); setSelectedPatientIds(new Set()); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              viewTab === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {t("activePatients") || "Active Patients"}
          </button>
          <button
            onClick={() => { setViewTab("discharged"); setCurrentPage(1); setSelectedPatientIds(new Set()); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              viewTab === "discharged" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {t("dischargedArchive") || "Discharged Archive"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-[#DDE5B6] shadow-sm">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder={t("searchPlaceholder")} 
              className="pl-9 bg-[#FEFAE0]/30 border-[#DDE5B6] focus-visible:ring-[#606C38] w-full" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="bg-[#FEFAE0]/30 border-[#DDE5B6] disabled:opacity-50" disabled={viewTab === 'discharged'}>
              <SelectValue placeholder={t("riskLevel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allRiskLevels")}</SelectItem>
              <SelectItem value="high-risk">{t("highRisk")}</SelectItem>
              <SelectItem value="medium-risk">{t("mediumRisk")}</SelectItem>
              <SelectItem value="standard">{t("standardLow")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="bg-[#FEFAE0]/30 border-[#DDE5B6]">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">{t("nameAsc")}</SelectItem>
              <SelectItem value="name-desc">{t("nameDesc")}</SelectItem>
              <SelectItem value="age-asc">{t("ageAsc")}</SelectItem>
              <SelectItem value="age-desc">{t("ageDesc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            className="border-[#DDE5B6] text-[#606C38] hover:bg-[#FEFAE0]" 
            onClick={() => { setSearch(""); setRiskFilter("all"); setSortOrder("name-asc"); setCurrentPage(1); }}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t("resetFilters")}
          </Button>
        </div>

        <Card className="border-[#DDE5B6] shadow-sm">
          <CardHeader className="pb-3 border-b border-[#DDE5B6]/50 bg-[#FEFAE0]/20 rounded-t-xl">
            <CardTitle className="text-base flex items-center gap-2 text-[#2D3B1E]">
              <Users className="h-5 w-5 text-[#606C38]" /> 
              {viewTab === 'active' ? t("patientRecords") : "Discharged Patient Records"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#FEFAE0]/50">
                <TableRow>
                  <TableHead className="w-12 text-center pl-4">
                    <Checkbox 
                      checked={paginatedPatients.length > 0 && selectedPatientIds.size === paginatedPatients.length}
                      onCheckedChange={toggleAllSelection}
                      aria-label="Select all"
                      className="data-[state=checked]:bg-[#606C38] data-[state=checked]:border-[#606C38]"
                      disabled={viewTab === 'discharged'}
                    />
                  </TableHead>
                  <TableHead 
                    className="pl-2 text-[#2D3B1E] font-bold cursor-pointer hover:bg-black/5 select-none"
                    onClick={() => setSortOrder(sortOrder === 'name-asc' ? 'name-desc' : 'name-asc')}
                  >
                    <div className="flex items-center gap-1.5">
                      {t("name")}
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">{t("age")}</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">{t("barangay")}</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">{t("status")}</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">{t("riskLevel")}</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">{t("registrationDate")}</TableHead>
                  <TableHead className="text-right pr-6 text-[#2D3B1E] font-bold">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">{t("syncing")}</TableCell></TableRow>
                ) : paginatedPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10 italic">{t("noPatients")}</TableCell>
                  </TableRow>
                ) : paginatedPatients.map((patient) => {
                  const isDischarged = patient.status === t("cured");
                  const displayRisk = isDischarged ? t("cleared") || "Cleared" : patient.riskLevel;

                  return (
                    <TableRow 
                      key={patient.id} 
                      className={`transition-colors ${selectedPatientIds.has(patient.id) ? 'bg-[#FEFAE0]/50' : 'hover:bg-[#FEFAE0]/30'} ${isDischarged ? 'opacity-85 bg-slate-50' : ''}`}
                    >
                      <TableCell className="text-center pl-4">
                        <Checkbox 
                          checked={selectedPatientIds.has(patient.id)}
                          onCheckedChange={() => togglePatientSelection(patient.id)}
                          aria-label={`Select ${patient.name}`}
                          className="data-[state=checked]:bg-[#606C38] data-[state=checked]:border-[#606C38]"
                          disabled={isDischarged}
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-[#2D3B1E] pl-2">{patient.name}</TableCell>
                      <TableCell className="font-medium text-[#2D3B1E]">{patient.age}</TableCell>
                      <TableCell className="text-muted-foreground">{patient.barangay}</TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className={`font-semibold ${getStatusBadge(patient.status, t)}`}>
                          {patient.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={getRiskBadge(displayRisk, isDischarged)}>
                          {displayRisk}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-muted-foreground text-sm">{patient.lastVisit}</TableCell>
                      
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-[#606C38] hover:bg-[#606C38] hover:text-white transition-colors">
                              <MoreHorizontal className="h-4 w-4 mr-1.5" /> {t("quickActions")}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => navigate(`/doctor/patient-details/${patient.id}`)} className="cursor-pointer font-medium text-[#2D3B1E]">
                              <Eye className="mr-2 h-4 w-4 text-[#606C38]" />
                              {t("seePatientInfo")}
                            </DropdownMenuItem>

                            {/* --- QUICK ACTION: PRINT E-DISCHARGE CERTIFICATE / CLINICAL REPORT --- */}
                            <DropdownMenuItem onClick={() => handlePrintPatientReport(patient.raw)} className="cursor-pointer font-medium text-[#2D3B1E]">
                              <Printer className="mr-2 h-4 w-4 text-[#606C38]" />
                              {t("printReport")}
                            </DropdownMenuItem>
                            
                            {/* --- ACTIONS FOR DISCHARGED / SURVEILLANCE PATIENTS --- */}
                            {isDischarged && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleInitiateRelapse(patient.id, patient.name)} 
                                  className="cursor-pointer font-semibold text-amber-700 focus:text-amber-800 focus:bg-amber-50"
                                >
                                  <RefreshCw className="mr-2 h-4 w-4 text-amber-600" />
                                  {t("readmitRelapse")}
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  onClick={() => handleInitiateRestore(patient.id, patient.name)} 
                                  className="cursor-pointer font-semibold text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                                >
                                  <Undo2 className="mr-2 h-4 w-4 text-blue-600" />
                                  {t("restoreActive")}
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* --- ACTIONS FOR ACTIVE PATIENTS --- */}
                            {!isDischarged && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDispatch(patient.id)} className="cursor-pointer font-medium text-blue-600 focus:text-blue-700 focus:bg-blue-50">
                                  <UserX className="mr-2 h-4 w-4" />
                                  {t("dispatchPatient")}
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handleInitiateDelete(patient.id, patient.name)} className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-50">
                              <Trash2 className="mr-2 h-4 w-4" />
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
            
            {!loading && processedPatients.length > 0 && (
              <div className="flex items-center justify-between border-t border-[#DDE5B6] px-6 py-3 bg-[#FEFAE0]/20 rounded-b-xl">
                <div className="text-sm text-slate-500">
                  {t("showing")} {processedPatients.length === 0 ? 0 : ((currentPage - 1) * ITEMS_PER_PAGE) + 1} {t("to")} {Math.min(currentPage * ITEMS_PER_PAGE, processedPatients.length)} {t("of")} {processedPatients.length} {t("entries")}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-lg border-[#DDE5B6] text-[#606C38] hover:bg-[#FEFAE0]">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="h-8 w-8 p-0 rounded-lg border-[#DDE5B6] text-[#606C38] hover:bg-[#FEFAE0]">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- PRINTABLE E-DISCHARGE CERTIFICATE & REPORT CONTAINER --- */}
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
                <h1 className="text-2xl font-extrabold tracking-tight">MUNICIPALITY OF CARMONA</h1>
                <h2 className="text-lg font-bold text-slate-600">CARMONA TB DOTS CLINIC</h2>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-extrabold tracking-tight">TEREA TB-DOTS</h1>
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
                This patient has been reviewed by the Carmona TB DOTS Center. Discharged patients remain registered in the TEREA Digital Surveillance Registry for 12 months with scheduled 6-Month and 1-Year follow-up clearances.
              </p>

              <div className="pt-16 flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-400">Date Printed</p>
                  <p className="font-bold">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-center w-64 border-t border-slate-800 pt-2">
                  <p className="font-bold uppercase">Dr. {doctorName}</p>
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