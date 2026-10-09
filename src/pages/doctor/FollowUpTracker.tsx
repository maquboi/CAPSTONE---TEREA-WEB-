import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { 
  Search, Calendar, CheckCircle2, Clock, CheckCircle, AlertCircle, 
  Eye, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Pill, Activity,
  ListOrdered, MapPin, ExternalLink, Loader2, Check, ShieldAlert, X
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "Follow-up Tracker",
    pageSubtitle: "Active clinical surveillance queue and scheduled therapeutic milestones",
    overdue: "Overdue",
    dueThisWeek: "Due This Week",
    upcoming: "Upcoming (>7 Days)",
    scheduled: "Scheduled",
    completed: "Completed",
    roadmapSchedule: "Active Surveillance Queue",
    searchPlaceholder: "Search patient name, milestone, or regimen...",
    loading: "Loading active surveillance schedule...",
    patient: "Patient & Target Milestone",
    age: "Age",
    date: "Scheduled Milestone Date",
    status: "Treatment Status",
    actions: "Clinical Actions",
    noMilestones: "No pending roadmap milestones found for active patients.",
    unknownPatient: "Unknown Patient",
    patientInfo: "Patient Chart",
    quickView: "Roadmap Timeline",
    restoredTitle: "Milestone Restored",
    restoredDesc: "Progress milestone returned to active schedule.",
    errorTitle: "Error",
    errorDesc: "Update failed",
    markedDoneTitle: "Milestone Verified & Completed",
    markedDoneDesc: "'s roadmap milestone was successfully marked as completed.",
    undoBtn: "Undo Action",
    okBtn: "Acknowledge",
    inTreatment: "In Treatment",
    sortBy: "Sort By",
    nameAsc: "Name (A-Z)",
    nameDesc: "Name (Z-A)",
    ageAsc: "Age (Youngest)",
    ageDesc: "Age (Oldest)",
    showing: "Showing",
    to: "to",
    of: "of",
    entries: "entries",
    resetFilters: "Reset Filters",
    protocolBreakdown: "Regimen Stratification"
  },
  fil: {
    pageTitle: "Tagasubaybay ng Follow-up",
    pageSubtitle: "Iskedyul at pagsubaybay sa mga milestone ng aktibong gamutan ng pasyente",
    overdue: "Lumipas na",
    dueThisWeek: "Ngayong Linggo",
    upcoming: "Paparating (>7 Araw)",
    scheduled: "Naka-iskedyul",
    completed: "Nakumpleto",
    roadmapSchedule: "Iskedyul ng Aktibong Gamutan",
    searchPlaceholder: "Maghanap ng pasyente o milestone...",
    loading: "Nilo-load ang iskedyul...",
    patient: "Pasyente at Target na Milestone",
    age: "Edad",
    date: "Araw ng Iskedyul",
    status: "Katayuan ng Gamutan",
    actions: "Mga Aksyon",
    noMilestones: "Walang nakitang nakabinbing milestone para sa mga aktibong pasyente.",
    unknownPatient: "Hindi Kilalang Pasyente",
    patientInfo: "Chart ng Pasyente",
    quickView: "Timeline ng Roadmap",
    restoredTitle: "Naibalik ang Milestone",
    restoredDesc: "Ibinalik ang milestone sa aktibong iskedyul.",
    errorTitle: "Error",
    errorDesc: "Nabigo ang pag-update",
    markedDoneTitle: "Nakumpleto ang Milestone",
    markedDoneDesc: " ay matagumpay na minarkahan bilang tapos na.",
    undoBtn: "I-undo",
    okBtn: "Sige",
    inTreatment: "Ginagamot",
    sortBy: "Ayusin Ayon Sa",
    nameAsc: "Pangalan (A-Z)",
    nameDesc: "Pangalan (Z-A)",
    ageAsc: "Edad (Pinakabata)",
    ageDesc: "Edad (Pinakamatanda)",
    showing: "Ipinapakita",
    to: "hanggang",
    of: "ng",
    entries: "tala",
    resetFilters: "I-reset ang mga Filter",
    protocolBreakdown: "Kategorya ng Protokol"
  }
};

interface Appointment {
  id: string | number;
  patient_id: string;
  appointment_date: string; 
  appointment_time: string; 
  location: string | null;
  status: string;
  title?: string;
  type?: string;
  patient?: {
    full_name: string | null;
    age: string | null;
    status: string | null;
    tb_regimen: string | null;
  } | null;
  patientName: string;
  patientAge: string;
  patientStatus: string;
  patientRegimen: string;
}

const getDaysUntil = (dateStr: string) => {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatRegimenName = (regimen: string) => {
  const r = regimen.toLowerCase();
  if (r.includes('6-month') || r.includes('cat 1') || r.includes('category i')) return 'Category I (6-Month)';
  if (r.includes('cat 2') || r.includes('retreatment') || r.includes('category ii')) return 'Category II (Retreatment)';
  if (r.includes('mdr') || r.includes('dr-tb')) return 'DR-TB Protocol';
  if (r.includes('preventive') || r.includes('tpt')) return 'TPT Preventive';
  return regimen || 'Standard Protocol';
};

export default function FollowUpTracker() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  // Centralized Alert State
  const [alert, setAlert] = useState<{
    open: boolean; 
    title: string; 
    message: string; 
    type: "success" | "error"; 
    action?: React.ReactNode 
  }>({ open: false, title: "", message: "", type: "success" });

  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success", action?: React.ReactNode) => {
    setAlert({ open: true, title, message, type, action });
  };

  const [followUps, setFollowUps] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  // Urgency filter driven by clicking KPI cards: 'all' | 'overdue' | 'this-week' | 'upcoming'
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "overdue" | "this-week" | "upcoming">("all");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState(""); 

  // Quickview Milestones State
  const [quickviewOpen, setQuickviewOpen] = useState(false);
  const [selectedPatientForQuickview, setSelectedPatientForQuickview] = useState<Appointment | null>(null);
  const [patientMilestonesList, setPatientMilestonesList] = useState<any[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  // Complete Milestone Confirmation Modal State
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [milestoneToComplete, setMilestoneToComplete] = useState<any | null>(null);
  const [completingMilestone, setCompletingMilestone] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
        
      if (profile) setDoctorName(profile.full_name);

      // Fetch pending milestones strictly for patients who are NOT discharged
      const { data, error } = await supabase
        .from('roadmap')
        .select(`
          *,
          patient:profiles!fk_patient(full_name, age, status, tb_regimen) 
        `)
        .eq('doctor_id', user.id)
        .neq('status', 'completed') 
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      
      const uniquePatientsMap = new Map();

      const mappedData = (data || []).reduce((acc: any[], item: any) => {
        const p = Array.isArray(item.patient) ? item.patient[0] : item.patient;
        const rawStatus = p?.status?.toLowerCase() || "";

        // STRICT FILTER: Exclude any patient who is already cured, completed, or discharged.
        // Only active patients undergoing treatment appear here.
        const isDischarged = rawStatus === "cured" || rawStatus === "completed" || rawStatus === "treatment_completed";
        if (isDischarged) return acc;

        // Keep earliest upcoming appointment per active patient
        if (!uniquePatientsMap.has(item.patient_id)) {
          uniquePatientsMap.set(item.patient_id, true);

          acc.push({
            ...item,
            patient: p,
            title: item.title,
            type: item.type,
            patientName: p?.full_name || t("unknownPatient"),
            patientAge: (p?.age !== null && p?.age !== undefined && p?.age !== "") ? p.age.toString() : "--",
            patientStatus: t("inTreatment"),
            patientRegimen: formatRegimenName(p?.tb_regimen || "Category I (6-Month)")
          });
        }
        return acc;
      }, []);
      
      setFollowUps(mappedData as unknown as Appointment[]);
    } catch (error) {
      console.error("Supabase Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const channel = supabase
      .channel('followup-live-active')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roadmap' }, fetchAppointments)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [language]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, urgencyFilter, sortOrder]);

  const handleOpenQuickview = async (item: Appointment) => {
    setSelectedPatientForQuickview(item);
    setQuickviewOpen(true);
    setLoadingMilestones(true);

    try {
      const { data, error } = await supabase
        .from('roadmap')
        .select('*')
        .eq('patient_id', item.patient_id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setPatientMilestonesList(data || []);
    } catch (err) {
      console.error("Milestone quickview fetch error:", err);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const handleInitiateCompleteMilestone = (milestone: any) => {
    setMilestoneToComplete(milestone);
    setConfirmCompleteOpen(true);
  };

  const handleConfirmCompleteMilestone = async () => {
    if (!milestoneToComplete) return;
    setCompletingMilestone(true);

    try {
      const { error } = await supabase
        .from('roadmap')
        .update({ status: 'completed' })
        .eq('id', milestoneToComplete.id);

      if (error) throw error;

      triggerAlert(
        t("markedDoneTitle"), 
        `"${milestoneToComplete.title || 'Roadmap milestone'}" has been marked as verified and completed.`, 
        "success"
      );

      setConfirmCompleteOpen(false);
      setMilestoneToComplete(null);
      setQuickviewOpen(false);
      fetchAppointments();
    } catch (err: any) {
      triggerAlert(t("errorTitle"), err.message || t("errorDesc"), "error");
    } finally {
      setCompletingMilestone(false);
    }
  };

  const navigateToPatientRoadmap = (patientId: string) => {
    navigate(`/doctor/patient-details/${patientId}?tab=roadmap`);
  };

  // KPI Calculations (100% of counts now represent active patients only)
  const generateStats = () => {
    const defaultStats = { count: 0, protocols: {} as Record<string, number> };
    const stats = {
      overdue: { ...defaultStats, protocols: {} as Record<string, number> },
      thisWeek: { ...defaultStats, protocols: {} as Record<string, number> },
      upcoming: { ...defaultStats, protocols: {} as Record<string, number> }
    };

    followUps.forEach(f => {
      const days = getDaysUntil(f.appointment_date);
      const regimen = f.patientRegimen;
      
      let category: "overdue" | "thisWeek" | "upcoming" | null = null;
      if (days < 0) category = "overdue";
      else if (days >= 0 && days <= 7) category = "thisWeek";
      else if (days > 7) category = "upcoming";

      if (category) {
        stats[category].count++;
        stats[category].protocols[regimen] = (stats[category].protocols[regimen] || 0) + 1;
      }
    });

    return stats;
  };

  const dashboardStats = generateStats();

  // Filtered Table Items
  let processedFollowUps = followUps.filter((f) => {
    const matchesSearch = search === "" || 
      f.patientName.toLowerCase().includes(search.toLowerCase()) || 
      (f.title && f.title.toLowerCase().includes(search.toLowerCase())) ||
      (f.patientRegimen && f.patientRegimen.toLowerCase().includes(search.toLowerCase()));

    const days = getDaysUntil(f.appointment_date);
    const matchesUrgency = urgencyFilter === "all" ||
      (urgencyFilter === "overdue" && days < 0) ||
      (urgencyFilter === "this-week" && days >= 0 && days <= 7) ||
      (urgencyFilter === "upcoming" && days > 7);

    return matchesSearch && matchesUrgency;
  });

  processedFollowUps.sort((a, b) => {
    if (sortOrder === "name-asc") return a.patientName.localeCompare(b.patientName);
    if (sortOrder === "name-desc") return b.patientName.localeCompare(a.patientName);
    if (sortOrder === "age-asc") return (parseInt(a.patientAge) || 0) - (parseInt(b.patientAge) || 0);
    if (sortOrder === "age-desc") return (parseInt(b.patientAge) || 0) - (parseInt(a.patientAge) || 0);
    return 0;
  });

  const totalPages = Math.ceil(processedFollowUps.length / ITEMS_PER_PAGE);
  const paginatedFollowUps = processedFollowUps.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const ProtocolBreakdown = ({ protocols }: { protocols: Record<string, number> }) => {
    const entries = Object.entries(protocols).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return <span className="text-xs text-slate-400 italic">No schedules</span>;
    
    return (
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {entries.map(([name, count]) => (
          <Badge key={name} variant="outline" className="bg-white/95 border-slate-200 text-xs text-slate-800 font-semibold px-2 py-0.5 rounded-lg shadow-2xs">
            <Pill className="w-3.5 h-3.5 mr-1 text-teal-700" />
            {count} – {name}
          </Badge>
        ))}
      </div>
    );
  };

  const cleanDoctorName = doctorName.replace(/^(dr\.?\s*)+/i, "").trim() || "Doctor";

  return (
    <DashboardLayout role="doctor" userName={doctorName || "Doctor"}>
      
      {/* Centralized Notification Modal */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-teal-50 border border-teal-200' : 'bg-red-50 border border-red-200'}`}>
            {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-teal-700" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <h2 className="text-base font-bold text-slate-900">{alert.title}</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">{alert.message}</p>
          <div className="mt-6 flex flex-col gap-2.5">
            {alert.action}
            <Button className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-10 shadow-xs" onClick={() => setAlert({...alert, open: false})}>
              {t("okBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRM COMPLETE MILESTONE MODAL --- */}
      <Dialog open={confirmCompleteOpen} onOpenChange={setConfirmCompleteOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border-slate-200 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-teal-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 text-center">Verify Milestone Completion?</DialogTitle>
            <DialogDescription className="text-slate-600 text-xs text-center mt-2 leading-relaxed">
              Confirm that clinical evaluation for <strong>"{milestoneToComplete?.title}"</strong> has taken place. This will mark the milestone as completed and archive it in the patient's record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl text-xs h-9 border-slate-300"
              onClick={() => setConfirmCompleteOpen(false)}
              disabled={completingMilestone}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs h-9 shadow-xs"
              onClick={handleConfirmCompleteMilestone}
              disabled={completingMilestone}
            >
              {completingMilestone ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
              Confirm Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- QUICKVIEW MILESTONES MODAL --- */}
      <Dialog open={quickviewOpen} onOpenChange={setQuickviewOpen}>
        <DialogContent className="sm:max-w-[580px] rounded-2xl p-6 bg-white font-sans border-slate-200 shadow-2xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
              <ListOrdered className="h-4 w-4 text-teal-700" />
              Patient Treatment Roadmap
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 flex items-center justify-between">
              <span>{selectedPatientForQuickview?.patientName}</span>
              <Badge variant="outline" className="text-xs font-bold border-teal-200 bg-teal-50 text-teal-800">
                {selectedPatientForQuickview?.patientRegimen}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              {selectedPatientForQuickview?.patientAge} yrs old • Status: {t("inTreatment")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loadingMilestones ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
                <span className="text-xs">Loading complete milestone timeline...</span>
              </div>
            ) : patientMilestonesList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm italic">
                No configured milestones found for this patient.
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {patientMilestonesList.map((m, idx) => {
                  const isDone = m.status === 'completed';
                  const days = getDaysUntil(m.appointment_date);
                  let dueBadge = null;

                  if (isDone) {
                    dueBadge = <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold">Completed</Badge>;
                  } else if (days < 0) {
                    dueBadge = <Badge className="bg-red-50 text-red-700 border-red-200 text-xs font-bold">Overdue ({Math.abs(days)}d)</Badge>;
                  } else if (days === 0) {
                    dueBadge = <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-bold">Due Today</Badge>;
                  } else {
                    dueBadge = <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-semibold">In {days} days</Badge>;
                  }

                  return (
                    <div 
                      key={m.id || idx}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        isDone 
                          ? 'bg-slate-50/60 border-slate-200 opacity-80' 
                          : 'bg-white border-teal-200/80 shadow-2xs hover:border-teal-400'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border ${
                          isDone 
                            ? 'bg-teal-700 text-white border-teal-700' 
                            : 'bg-teal-50 text-teal-800 border-teal-300'
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {m.title || "Clinical Follow-up"}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(m.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {m.location || "Carmona Health Center"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-2 pt-0.5">
                        {dueBadge}
                        {!isDone && (
                          <Button 
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] font-bold text-teal-700 border-teal-300 hover:bg-teal-50 rounded-lg shadow-2xs"
                            onClick={() => handleInitiateCompleteMilestone(m)}
                          >
                            Verify Done
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3 flex sm:justify-between items-center gap-2">
            <Button 
              variant="ghost" 
              className="text-xs text-slate-500 hover:text-slate-800 rounded-xl"
              onClick={() => setQuickviewOpen(false)}
            >
              Close
            </Button>
            <Button 
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl gap-1.5 shadow-xs"
              onClick={() => {
                setQuickviewOpen(false);
                if (selectedPatientForQuickview?.patient_id) {
                  navigateToPatientRoadmap(selectedPatientForQuickview.patient_id);
                }
              }}
            >
              <span>Open Roadmap in Chart</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in font-sans">
        
        {/* --- PAGE HEADER BANNER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-300/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
              Active Clinical Roadmap Surveillance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 pt-1">
              {t("pageTitle")}
            </h1>
            <p className="text-slate-600 text-sm font-normal">
              {t("pageSubtitle")} • Dr. {cleanDoctorName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3.5 py-1.5 text-xs font-bold bg-slate-50 text-slate-800 border-slate-300 rounded-xl">
              <Activity className="h-4 w-4 mr-1.5 text-teal-700" />
              {followUps.length} Active Patient Milestones
            </Badge>
          </div>
        </div>

        {/* --- FUNCTIONAL TRIAGE KPI CARDS (ACTIVE PATIENTS ONLY) --- */}
        <div className="grid gap-4 md:grid-cols-3"> 
          {/* Overdue Card */}
          <Card 
            onClick={() => setUrgencyFilter(urgencyFilter === "overdue" ? "all" : "overdue")}
            className={`border-red-200/90 shadow-xs bg-gradient-to-br from-white via-white to-red-50/40 rounded-2xl cursor-pointer transition-all select-none hover:shadow-md ${
              urgencyFilter === "overdue" ? "ring-2 ring-red-500 border-red-500 scale-[1.01]" : "hover:border-red-400"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-red-50 p-3 rounded-xl border border-red-200 shadow-2xs shrink-0">
                  <Calendar className="text-red-600 w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-4xl font-extrabold text-slate-900 leading-none">{dashboardStats.overdue.count}</p>
                    {urgencyFilter === "overdue" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Active Filter</span>
                    )}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-600 mt-1.5">{t("overdue")}</p>
                  <ProtocolBreakdown protocols={dashboardStats.overdue.protocols} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Due This Week Card */}
          <Card 
            onClick={() => setUrgencyFilter(urgencyFilter === "this-week" ? "all" : "this-week")}
            className={`border-amber-200/90 shadow-xs bg-gradient-to-br from-white via-white to-amber-50/40 rounded-2xl cursor-pointer transition-all select-none hover:shadow-md ${
              urgencyFilter === "this-week" ? "ring-2 ring-amber-500 border-amber-500 scale-[1.01]" : "hover:border-amber-400"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 shadow-2xs shrink-0">
                  <Clock className="text-amber-600 w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-4xl font-extrabold text-slate-900 leading-none">{dashboardStats.thisWeek.count}</p>
                    {urgencyFilter === "this-week" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Active Filter</span>
                    )}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mt-1.5">{t("dueThisWeek")}</p>
                  <ProtocolBreakdown protocols={dashboardStats.thisWeek.protocols} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Card */}
          <Card 
            onClick={() => setUrgencyFilter(urgencyFilter === "upcoming" ? "all" : "upcoming")}
            className={`border-teal-200/90 shadow-xs bg-gradient-to-br from-white via-white to-teal-50/40 rounded-2xl cursor-pointer transition-all select-none hover:shadow-md ${
              urgencyFilter === "upcoming" ? "ring-2 ring-teal-600 border-teal-600 scale-[1.01]" : "hover:border-teal-400"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 shadow-2xs shrink-0">
                  <Calendar className="text-teal-700 w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-4xl font-extrabold text-slate-900 leading-none">{dashboardStats.upcoming.count}</p>
                    {urgencyFilter === "upcoming" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">Active Filter</span>
                    )}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-700 mt-1.5">{t("upcoming")}</p>
                  <ProtocolBreakdown protocols={dashboardStats.upcoming.protocols} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- FILTERS & SORTING TOOLBAR --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-300/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder={t("searchPlaceholder")} 
              className="pl-9 bg-slate-50 border-slate-300 text-sm text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-11 rounded-xl w-full" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="bg-slate-50 border-slate-300 text-sm text-slate-800 h-11 rounded-xl">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 bg-white">
              <SelectItem value="name-asc" className="text-sm">{t("nameAsc")}</SelectItem>
              <SelectItem value="name-desc" className="text-sm">{t("nameDesc")}</SelectItem>
              <SelectItem value="age-asc" className="text-sm">{t("ageAsc")}</SelectItem>
              <SelectItem value="age-desc" className="text-sm">{t("ageDesc")}</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold h-11" 
            onClick={() => { setSearch(""); setUrgencyFilter("all"); setSortOrder("name-asc"); setCurrentPage(1); }}
          >
            <Filter className="h-4 w-4 mr-2 text-teal-700" />
            {t("resetFilters")}
          </Button>
        </div>

        {/* --- ROADMAP SURVEILLANCE QUEUE TABLE --- */}
        <Card className="border-slate-300/80 shadow-[0_12px_35px_rgba(15,23,42,0.06)] bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Clock className="h-5 w-5 text-teal-700" />
                {t("roadmapSchedule")}
              </CardTitle>
              {urgencyFilter !== "all" && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs font-bold border-teal-300 text-teal-800 bg-teal-50 px-2.5 py-1">
                    Filtered by: {urgencyFilter.toUpperCase()}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full hover:bg-slate-200 text-slate-500"
                    onClick={() => setUrgencyFilter("all")}
                    title="Clear filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-sm font-medium italic">
                {t("loading")}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className="bg-slate-50/90 border-b border-slate-200">
                    <TableRow>
                      <TableHead 
                        className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:text-slate-900 select-none pl-6"
                        onClick={() => setSortOrder(sortOrder === 'name-asc' ? 'name-desc' : 'name-asc')}
                      >
                        <div className="flex items-center gap-1.5">
                          {t("patient")}
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 w-28">{t("age")}</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 w-64">{t("date")}</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 w-44">{t("status")}</TableHead>
                      <TableHead className="w-72 text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-600">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFollowUps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16 text-slate-400 text-sm italic">
                          <div className="space-y-2">
                            <p>{t("noMilestones")}</p>
                            {(urgencyFilter !== "all" || search) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { setUrgencyFilter("all"); setSearch(""); }}
                                className="text-xs font-semibold text-teal-800 border-teal-300 hover:bg-teal-50"
                              >
                                Clear Active Filters to View All Milestones
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedFollowUps.map((followUp) => {
                        const days = getDaysUntil(followUp.appointment_date);
                        let urgencyChip = null;

                        if (days < -14) {
                          urgencyChip = (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 whitespace-nowrap">
                              <ShieldAlert className="w-3 h-3 text-red-700" /> Risk of Default ({Math.abs(days)}d late)
                            </span>
                          );
                        } else if (days < 0) {
                          urgencyChip = (
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                              Overdue by {Math.abs(days)}d
                            </span>
                          );
                        } else if (days === 0) {
                          urgencyChip = (
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                              Due Today
                            </span>
                          );
                        } else if (days <= 7) {
                          urgencyChip = (
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                              In {days} days (This Week)
                            </span>
                          );
                        } else {
                          urgencyChip = (
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                              In {days} days
                            </span>
                          );
                        }

                        return (
                          <TableRow 
                            key={followUp.id}
                            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                          >
                            <TableCell className="pl-6 py-4">
                              <button 
                                onClick={() => navigateToPatientRoadmap(followUp.patient_id)}
                                className="font-bold text-base text-slate-900 hover:text-teal-700 transition-colors text-left block"
                              >
                                {followUp.patientName}
                              </button>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                                  {followUp.title || "Routine Follow-up"}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                  {followUp.patientRegimen}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                              {followUp.patientAge} yrs old
                            </TableCell>

                            <TableCell className="py-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                                  {new Date(followUp.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <div>
                                  {urgencyChip}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline" className="rounded-md text-xs px-2.5 py-1 bg-teal-50 text-teal-800 border-teal-200 font-bold">
                                {t("inTreatment")}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right pr-6 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {/* Roadmap Timeline Quickview Button */}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-9 px-3 text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-100 rounded-lg gap-1.5 shadow-2xs"
                                  onClick={() => handleOpenQuickview(followUp)}
                                >
                                  <ListOrdered className="w-3.5 h-3.5 text-teal-700" />
                                  <span>{t("quickView")}</span>
                                </Button>

                                {/* Direct EHR Chart Navigation Button with deep-link to ?tab=roadmap */}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-9 px-3 text-xs font-bold text-teal-700 hover:bg-teal-50 hover:text-teal-900 rounded-lg gap-1.5"
                                  onClick={() => navigateToPatientRoadmap(followUp.patient_id)}
                                >
                                  <Eye className="w-3.5 h-3.5 text-teal-700" />
                                  <span>{t("patientInfo")}</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                
                {/* --- TABLE PAGINATION --- */}
                {!loading && processedFollowUps.length > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                    <div className="text-sm text-slate-600 font-medium">
                      {t("showing")} {processedFollowUps.length === 0 ? 0 : ((currentPage - 1) * ITEMS_PER_PAGE) + 1} {t("to")} {Math.min(currentPage * ITEMS_PER_PAGE, processedFollowUps.length)} {t("of")} {processedFollowUps.length} {t("entries")}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={currentPage === 1} 
                        className="h-9 w-9 p-0 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={currentPage === totalPages || totalPages === 0} 
                        className="h-9 w-9 p-0 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}