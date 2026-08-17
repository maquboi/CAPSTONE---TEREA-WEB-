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
  Search, Filter, Eye, Download, Users, CheckCircle, AlertCircle, MoreHorizontal, UserX, ArrowUpDown, ChevronLeft, ChevronRight, Trash2, Archive, Loader2, ShieldAlert
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
    pageTitle: "Patient Directory & Reports",
    pageSubtitle: "Manage verified patients and review risk assessments.",
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
    purgePatient: "Purge Data & Remove"
  },
  fil: {
    pageTitle: "Direktoryo at Ulat ng Pasyente",
    pageSubtitle: "Pamahalaan ang mga na-verify na pasyente at suriin ang panganib.",
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
    quickActions: "Aksyon",
    dispatchPatient: "I-dispatch ang Pasyente",
    archivePatient: "I-archive ang Pasyente",
    archiveSuccessDesc: "Ligtas na inilipat ang record sa archives.",
    seePatientInfo: "Tingnan ang Impormasyon",
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
    purgePatient: "Burahin ang Lahat ng Datos"
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
  
  // Multi-select state
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Archive & Purge state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [patientToArchive, setPatientToArchive] = useState<{id: string, name: string} | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [patientToPurge, setPatientToPurge] = useState<{id: string, name: string} | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
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
          
        if (profile) setDoctorName(profile.full_name);

        const { data: connections, error } = await supabase
          .from('connections')
          .select(`
            patient_id,
            created_at,
            status,
            is_archived,
            profiles!fk_patient (
              full_name,
              age,
              risk_level,
              barangay,
              status,
              is_archived
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
            
            // Only add patients that are NOT archived (meaning fully removed from system)
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
                lastVisit: new Date(c.created_at).toLocaleDateString()
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

    fetchAllData();
  }, [language]); 

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
    doc.text("AI Healthcare Management System", 14, yPos + 6);
    
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
      ]
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [96, 108, 56] }, 
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`TEREA_Patient_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    triggerAlert(t("genReportTitle"), t("genReportDesc"), "success");
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

  const handleInitiatePurge = (id: string, name: string) => {
    setPatientToPurge({ id, name });
    setPurgeModalOpen(true);
  };

  const confirmPurge = async () => {
    if (!patientToPurge) return;
    setIsPurging(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication error");

      // Wipe all clinical tracking data for this patient
      await supabase.from('medications').delete().eq('user_id', patientToPurge.id);
      await supabase.from('roadmap').delete().eq('patient_id', patientToPurge.id);
      await supabase.from('patient_vitals').delete().eq('patient_id', patientToPurge.id);
      await supabase.from('doctor_notes').delete().eq('user_id', patientToPurge.id);
      await supabase.from('dssm_monitoring').delete().eq('patient_id', patientToPurge.id);
      
      // Delete the connection linking the doctor and the patient
      await supabase.from('connections').delete()
        .eq('patient_id', patientToPurge.id)
        .eq('doctor_id', user.id);

      setPatients(patients.filter(p => p.id !== patientToPurge.id));
      triggerAlert("Record Purged", "All clinical data and connections have been permanently deleted.", "success");

    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setIsPurging(false);
      setPurgeModalOpen(false);
      setPatientToPurge(null);
    }
  };

  let processedPatients = patients.filter((p) => {
    const isDischarged = p.status === t("cured");
    
    // Tab Filter
    if (viewTab === "active" && isDischarged) return false;
    if (viewTab === "discharged" && !isDischarged) return false;

    // Search Filter
    const matchesSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barangay.toLowerCase().includes(search.toLowerCase());
    
    // Risk Filter
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
      
      {/* Centralized Notification Pop-up */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{alert.title}</h2>
          <p className="text-slate-500 mt-2 text-sm">{alert.message}</p>
          <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white" onClick={() => setAlert({...alert, open: false})}>Okay</Button>
        </DialogContent>
      </Dialog>

      {/* Archiving Dialog */}
      <Dialog open={archiveModalOpen} onOpenChange={setArchiveModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border border-slate-200 shadow-xl">
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

      {/* Purge / Hard Delete Dialog */}
      <Dialog open={purgeModalOpen} onOpenChange={setPurgeModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border border-red-200 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 border border-red-200">
            <ShieldAlert className="h-6 w-6 text-red-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-700 text-center">Permanent Data Purge</DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center mt-2 leading-relaxed">
              You are about to permanently wipe all medical tracking data (Vitals, Meds, Roadmaps) and unlink <strong>{patientToPurge?.name}</strong> from your clinic. <br/><br/><strong>This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 font-semibold"
              onClick={() => setPurgeModalOpen(false)}
              disabled={isPurging}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={confirmPurge}
              disabled={isPurging}
            >
              {isPurging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Purge Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Dispatch Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[425px] bg-white border-slate-200 shadow-xl font-sans">
          <DialogContent>
            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Confirm Bulk Dispatch
            </h2>
            <p className="text-slate-600 mt-2">
              You are about to dispatch and unlink <strong>{selectedPatientIds.size}</strong> patients from your active list. This action cannot be easily undone. Do you wish to proceed?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)} disabled={isSubmitting} className="rounded-xl">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDispatch} disabled={isSubmitting} className="rounded-xl shadow-sm">
                {isSubmitting ? "Dispatching..." : "Yes, Dispatch"}
              </Button>
            </div>
          </DialogContent>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in">
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

        {/* Tab Switcher */}
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
                      className={`transition-colors ${selectedPatientIds.has(patient.id) ? 'bg-[#FEFAE0]/50' : 'hover:bg-[#FEFAE0]/30'} ${isDischarged ? 'opacity-60 bg-slate-50 grayscale-[0.2]' : ''}`}
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
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(`/doctor/patient-details/${patient.id}`)} className="cursor-pointer font-medium text-[#2D3B1E]">
                              <Eye className="mr-2 h-4 w-4 text-[#606C38]" />
                              {t("seePatientInfo")}
                            </DropdownMenuItem>
                            
                            {/* Archive button available for cured patients */}
                            {isDischarged && (
                              <DropdownMenuItem onClick={() => handleInitiateArchive(patient.id, patient.name)} className="cursor-pointer font-medium text-slate-700 focus:text-slate-900 focus:bg-slate-100">
                                <Archive className="mr-2 h-4 w-4 text-slate-500" />
                                {t("archivePatient")}
                              </DropdownMenuItem>
                            )}

                            {/* Dispatch available if the patient is still active */}
                            {!isDischarged && (
                              <DropdownMenuItem onClick={() => handleDispatch(patient.id)} className="cursor-pointer font-medium text-blue-600 focus:text-blue-700 focus:bg-blue-50">
                                <UserX className="mr-2 h-4 w-4" />
                                {t("dispatchPatient")}
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* NEW HARD PURGE BUTTON */}
                            <DropdownMenuItem onClick={() => handleInitiatePurge(patient.id, patient.name)} className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-50">
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("purgePatient")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Pagination Navigator */}
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
    </DashboardLayout>
  );
}