import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { 
  Search, Calendar, CheckCircle2, Clock, CheckCircle, AlertCircle, 
  Eye, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Pill
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "Follow-up Tracker",
    pageSubtitle: "Manage and track patient roadmap progress",
    overdue: "Overdue",
    today: "Today",
    upcoming: "Upcoming",
    scheduled: "Scheduled",
    completed: "Completed",
    roadmapSchedule: "Roadmap Schedule",
    searchPlaceholder: "Search patients...",
    loading: "Loading schedule...",
    done: "Done",
    patient: "Patient",
    age: "Age",
    location: "Location",
    date: "Date",
    time: "Time",
    status: "Status",
    noMilestones: "No pending roadmap milestones found.",
    unknownPatient: "Unknown Patient",
    clinicVisit: "Clinic Visit",
    patientInfo: "Patient Info",
    restoredTitle: "Restored",
    restoredDesc: "Progress item moved back to schedule.",
    errorTitle: "Error",
    errorDesc: "Update failed",
    markedDoneTitle: "Marked as Done",
    markedDoneDesc: "'s roadmap milestone completed.",
    undoBtn: "Undo",
    okBtn: "Okay",
    inTreatment: "In Treatment",
    cured: "Cured",
    allStatuses: "All Statuses",
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
    protocolBreakdown: "Protocol Breakdown"
  },
  fil: {
    pageTitle: "Tagasubaybay ng Follow-up",
    pageSubtitle: "Pamahalaan at subaybayan ang pag-unlad ng roadmap ng pasyente",
    overdue: "Lumipas na",
    today: "Ngayon",
    upcoming: "Paparating",
    scheduled: "Naka-iskedyul",
    completed: "Nakumpleto",
    roadmapSchedule: "Iskedyul ng Roadmap",
    searchPlaceholder: "Maghanap ng pasyente...",
    loading: "Nilo-load ang iskedyul...",
    done: "Tapos na",
    patient: "Pasyente",
    age: "Edad",
    location: "Lokasyon",
    date: "Petsa",
    time: "Oras",
    status: "Katayuan",
    noMilestones: "Walang nakitang nakabinbing milestone sa roadmap.",
    unknownPatient: "Hindi Kilalang Pasyente",
    clinicVisit: "Pagbisita sa Klinika",
    patientInfo: "Impormasyon ng Pasyente",
    restoredTitle: "Naibalik",
    restoredDesc: "Ibinalik ang item ng pag-unlad sa iskedyul.",
    errorTitle: "Error",
    errorDesc: "Nabigo ang pag-update",
    markedDoneTitle: "Minarkahan bilang Tapos na",
    markedDoneDesc: " ay nakumpleto ang milestone ng roadmap.",
    undoBtn: "I-undo",
    okBtn: "Okay",
    inTreatment: "Ginagamot",
    cured: "Magaling Na",
    allStatuses: "Lahat ng Katayuan",
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
  patient?: {
    full_name: string | null;
    age: string | null;
    status: string | null;
    tb_regimen: string | null;
  } | null;
  // Mapped UI properties
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

const formatTime = (timeStr: string) => {
  if (!timeStr) return "--:--";
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const getPatientStatusBadge = (status: string, t: (k: string) => string) => {
  if (status === t("cured")) return "bg-emerald-50 text-emerald-600 border-emerald-200";
  return "bg-blue-50 text-blue-600 border-blue-200";
};

// Formatting helper for standardizing DOH protocols in the UI
const formatRegimenName = (regimen: string) => {
  const r = regimen.toLowerCase();
  if (r.includes('6-month') || r.includes('cat 1') || r.includes('category i')) return 'Category I (6-Month)';
  if (r.includes('cat 2') || r.includes('retreatment') || r.includes('category ii')) return 'Category II (Retreatment)';
  if (r.includes('mdr') || r.includes('dr-tb')) return 'DR-TB';
  if (r.includes('preventive') || r.includes('tpt')) return 'TPT (Preventive)';
  return regimen || 'Standard DOTS';
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fadingIds, setFadingIds] = useState<Set<string | number>>(new Set());
  const [doctorName, setDoctorName] = useState(""); 

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
      
      // Deduplicate: Keep only the earliest upcoming appointment per patient
      const uniquePatientsMap = new Map();

      const mappedData = (data || []).reduce((acc: any[], item: any) => {
        if (!uniquePatientsMap.has(item.patient_id)) {
          uniquePatientsMap.set(item.patient_id, true);
          
          const p = Array.isArray(item.patient) ? item.patient[0] : item.patient;
          
          const rawStatus = p?.status?.toLowerCase() || "";
          let displayStatus = t("inTreatment");
          if (rawStatus === "cured" || rawStatus === "completed") {
            displayStatus = t("cured");
          }

          acc.push({
            ...item,
            patient: p,
            title: item.title, // Ensure the specific milestone title is tracked
            patientName: p?.full_name || t("unknownPatient"),
            patientAge: (p?.age !== null && p?.age !== undefined && p?.age !== "") ? p.age.toString() : "--",
            patientStatus: displayStatus,
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
    const channel = supabase.channel('followup-live').on('postgres_changes', { event: '*', schema: 'public', table: 'roadmap' }, fetchAppointments).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [language]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortOrder]);

  const handleUndo = async (id: string | number, item: Appointment) => {
    setFollowUps(prev => {
      const restored = [...prev, item];
      return restored.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
    });

    await supabase.from('roadmap').update({ status: 'scheduled' }).eq('id', id);
    triggerAlert(t("restoredTitle"), t("restoredDesc"), "success");
  };

  const handleCheckDone = async (id: string | number, patientName: string) => {
    setFadingIds(prev => new Set(prev).add(id));
    const itemToRemove = followUps.find(f => f.id === id);

    setTimeout(async () => {
      if (!itemToRemove) return;
      setFollowUps(prev => prev.filter(f => f.id !== id));
      
      const { error } = await supabase.from('roadmap').update({ status: 'completed' }).eq('id', id);
      
      if (error) {
        triggerAlert(t("errorTitle"), t("errorDesc"), "error");
        fetchAppointments(); 
      } else {
        triggerAlert(
            t("markedDoneTitle"), 
            `${patientName}${t("markedDoneDesc")}`, 
            "success",
            <Button variant="outline" className="w-full" onClick={() => { handleUndo(id, itemToRemove); setAlert({...alert, open: false}) }}>{t("undoBtn")}</Button>
        );
        // We re-fetch here so if the patient has a NEXT milestone, it will now appear
        fetchAppointments();
      }

      setFadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 500);
  };

  // --- Filtering & Sorting Logic ---
  let processedFollowUps = followUps.filter((f) => {
    const matchesSearch = search === "" || 
      f.patientName.toLowerCase().includes(search.toLowerCase()) || 
      (f.location && f.location.toLowerCase().includes(search.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "in-treatment" && f.patientStatus === t("inTreatment")) ||
      (statusFilter === "cured" && f.patientStatus === t("cured"));

    return matchesSearch && matchesStatus;
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

  // Stats generation including Protocol Breakdown
  const generateStats = () => {
    const defaultStats = { count: 0, protocols: {} as Record<string, number> };
    const stats = {
      overdue: { ...defaultStats, protocols: {} as Record<string, number> },
      today: { ...defaultStats, protocols: {} as Record<string, number> },
      upcoming: { ...defaultStats, protocols: {} as Record<string, number> }
    };

    followUps.forEach(f => {
      const days = getDaysUntil(f.appointment_date);
      const regimen = f.patientRegimen;
      
      let category: "overdue" | "today" | "upcoming" | null = null;
      if (days < 0) category = "overdue";
      else if (days === 0) category = "today";
      else if (days > 0) category = "upcoming";

      if (category) {
        stats[category].count++;
        stats[category].protocols[regimen] = (stats[category].protocols[regimen] || 0) + 1;
      }
    });

    return stats;
  };

  const dashboardStats = generateStats();

  // Mini-component to render the protocol breakdown beautifully
  const ProtocolBreakdown = ({ protocols }: { protocols: Record<string, number> }) => {
    const entries = Object.entries(protocols).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return <span className="text-xs text-muted-foreground italic">No schedules</span>;
    
    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {entries.map(([name, count]) => (
          <Badge key={name} variant="secondary" className="bg-white/60 border-[#DDE5B6]/50 text-xs text-[#2D3B1E] font-medium px-2 py-0.5">
            <Pill className="w-3 h-3 mr-1 text-[#606C38]" />
            {count} - {name}
          </Badge>
        ))}
      </div>
    );
  };

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
          <div className="mt-6 flex flex-col gap-2">
            {alert.action}
            <Button className="w-full rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white" onClick={() => setAlert({...alert, open: false})}>{t("okBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3B1E]">{t("pageTitle")}</h1>
          <p className="text-[#606C38]/80 font-medium mt-1">{t("pageSubtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3"> 
          <Card className="border-[#DDE5B6] shadow-sm bg-gradient-to-br from-white to-red-50/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 shadow-sm"><Calendar className="text-red-600 w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="text-3xl font-bold text-[#2D3B1E] leading-none">{dashboardStats.overdue.count}</p>
                  <p className="text-sm font-medium text-[#606C38]/80 mt-1">{t("overdue")}</p>
                  <ProtocolBreakdown protocols={dashboardStats.overdue.protocols} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-[#DDE5B6] shadow-sm bg-gradient-to-br from-white to-amber-50/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 shadow-sm"><Calendar className="text-amber-600 w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="text-3xl font-bold text-[#2D3B1E] leading-none">{dashboardStats.today.count}</p>
                  <p className="text-sm font-medium text-[#606C38]/80 mt-1">{t("today")}</p>
                  <ProtocolBreakdown protocols={dashboardStats.today.protocols} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#DDE5B6] shadow-sm bg-gradient-to-br from-white to-green-50/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 p-2.5 rounded-xl border border-green-100 shadow-sm"><Calendar className="text-green-600 w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="text-3xl font-bold text-[#2D3B1E] leading-none">{dashboardStats.upcoming.count}</p>
                  <p className="text-sm font-medium text-[#606C38]/80 mt-1">{t("upcoming")}</p>
                  <ProtocolBreakdown protocols={dashboardStats.upcoming.protocols} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Sorting Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-[#DDE5B6] shadow-sm">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder={t("searchPlaceholder")} 
              className="pl-9 bg-[#FEFAE0]/30 border-[#DDE5B6] focus-visible:ring-[#606C38] w-full" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-[#FEFAE0]/30 border-[#DDE5B6]">
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="in-treatment">{t("inTreatment")}</SelectItem>
              <SelectItem value="cured">{t("cured")}</SelectItem>
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

          <Button 
            variant="outline" 
            className="border-[#DDE5B6] text-[#606C38] hover:bg-[#FEFAE0]" 
            onClick={() => { setSearch(""); setStatusFilter("all"); setSortOrder("name-asc"); setCurrentPage(1); }}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t("resetFilters")}
          </Button>
        </div>

        <Card className="border-[#DDE5B6] shadow-sm">
          <CardHeader className="pb-3 border-b border-[#DDE5B6]/50 bg-[#FEFAE0]/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-[#2D3B1E]">
                <Clock className="h-5 w-5 text-[#606C38]" />
                {t("roadmapSchedule")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-10 text-center text-muted-foreground italic">{t("loading")}</div> : (
              <>
                <Table>
                  <TableHeader className="bg-[#FEFAE0]/50">
                    <TableRow>
                      <TableHead className="w-10 pl-6 text-[#2D3B1E] font-bold">{t("done")}</TableHead>
                      <TableHead 
                        className="text-[#2D3B1E] font-bold cursor-pointer hover:bg-black/5 select-none"
                        onClick={() => setSortOrder(sortOrder === 'name-asc' ? 'name-desc' : 'name-asc')}
                      >
                        <div className="flex items-center gap-1.5">
                          {t("patient")}
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </TableHead>
                      <TableHead className="text-[#2D3B1E] font-bold">{t("age")}</TableHead>
                      <TableHead className="text-[#2D3B1E] font-bold">{t("location")}</TableHead>
                      <TableHead className="text-[#2D3B1E] font-bold">{t("date")}</TableHead>
                      <TableHead className="text-[#2D3B1E] font-bold">{t("time")}</TableHead>
                      <TableHead className="text-[#2D3B1E] font-bold">{t("status")}</TableHead>
                      <TableHead className="w-32 text-right pr-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFollowUps.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">{t("noMilestones")}</TableCell></TableRow>
                    ) : paginatedFollowUps.map((followUp) => (
                      <TableRow 
                        key={followUp.id}
                        className={`hover:bg-[#FEFAE0]/30 transition-opacity duration-500 ${fadingIds.has(followUp.id) ? 'opacity-0' : 'opacity-100'}`}
                      >
                        <TableCell className="pl-6">
                          <Checkbox 
                            checked={false} 
                            className="border-[#606C38] data-[state=checked]:bg-[#606C38]"
                            onCheckedChange={() => handleCheckDone(followUp.id, followUp.patientName)} 
                          />
                        </TableCell>
                        <TableCell className="font-bold text-[#2D3B1E]">
                          {followUp.patientName}
                          <div className="text-xs font-normal text-muted-foreground mt-0.5 flex flex-col">
                            <span className="text-[#606C38] font-semibold">{followUp.title || "Routine Follow-up"}</span>
                            <span>{followUp.patientRegimen}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-[#2D3B1E]">{followUp.patientAge}</TableCell>
                        <TableCell className="text-muted-foreground">{followUp.location || t("clinicVisit")}</TableCell>
                        <TableCell className="font-medium">{new Date(followUp.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                        <TableCell className="flex items-center gap-1.5 text-muted-foreground font-medium border-0 h-16">
                          <Clock className="w-3.5 h-3.5"/> {formatTime(followUp.appointment_time)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-semibold ${getPatientStatusBadge(followUp.patientStatus, t)}`}>
                            {followUp.patientStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-[#DDE5B6] text-[#606C38] hover:bg-[#FEFAE0] hover:text-[#2D3B1E]"
                            onClick={() => navigate(`/doctor/patient-details/${followUp.patient_id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            {t("patientInfo")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination Navigator */}
                {!loading && processedFollowUps.length > 0 && (
                  <div className="flex items-center justify-between border-t border-[#DDE5B6] px-6 py-3 bg-[#FEFAE0]/20">
                    <div className="text-sm text-slate-500">
                      {t("showing")} {processedFollowUps.length === 0 ? 0 : ((currentPage - 1) * ITEMS_PER_PAGE) + 1} {t("to")} {Math.min(currentPage * ITEMS_PER_PAGE, processedFollowUps.length)} {t("of")} {processedFollowUps.length} {t("entries")}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}