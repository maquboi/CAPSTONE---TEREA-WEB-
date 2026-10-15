import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Filter, Clock, Activity, RotateCcw, User, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "../admin/LanguageContext";

const sanitizeText = (input: string | null | undefined): string => {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
};

const format24HrInTextTo12Hr = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.replace(/\b([01]?\d|2[0-3]):([0-5]\d)(?!\s*(?:AM|PM|am|pm))\b/g, (_, hStr, mStr) => {
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mStr} ${ampm}`;
  });
};

const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "Clinical Activity Logs",
    pageSubtitle: "Comprehensive audit trail of clinical actions, consults, and patient interactions",
    recentActivity: "Recorded Audit Trail",
    searchPlaceholder: "Search by patient, status, or clinical details...",
    statusType: "Filter by Status",
    allStatuses: "All Statuses",
    profileUpdate: "Profile Update",
    patientApproved: "Patient Approved",
    newLinkRequest: "New Link Request",
    appointments: "Appointments & Milestones",
    statusUpdates: "Status Updates",
    reminders: "Reminders & Memos",
    reviews: "Clinical Reviews",
    dateFilter: "Filter by Date",
    allDates: "All Dates",
    today: "Today",
    last7Days: "Last 7 Days",
    last30Days: "Last 30 Days",
    status: "Status",
    patient: "Patient",
    details: "Clinical Details",
    timestamp: "Date & Time",
    loadingLogs: "Syncing audit logs from database...",
    noLogsYet: "No clinical activity logs recorded yet.",
    noLogsFilter: "No activity logs match your current filter parameters.",
    resetFilter: "Reset Filters",
    showing: "Showing",
    to: "to",
    of: "of",
    entries: "entries",
    rowsPerPage: "Rows per page:"
  },
  fil: {
    pageTitle: "Mga Log ng Klinikal na Aktibidad",
    pageSubtitle: "Kumpletong audit trail ng mga klinikal na aksyon, konsultasyon, at talaan ng pasyente",
    recentActivity: "Naitalang Audit Trail",
    searchPlaceholder: "Maghanap ayon sa pasyente, katayuan, o detalye...",
    statusType: "I-filter ayon sa Katayuan",
    allStatuses: "Lahat ng Katayuan",
    profileUpdate: "Pag-update ng Profile",
    patientApproved: "Naaprubahang Pasyente",
    newLinkRequest: "Bagong Link Request",
    appointments: "Mga Appointment at Milestone",
    statusUpdates: "Mga Update sa Katayuan",
    reminders: "Mga Paalala at Memo",
    reviews: "Klinikal na Pagsusuri",
    dateFilter: "I-filter ayon sa Petsa",
    allDates: "Lahat ng Petsa",
    today: "Ngayong Araw",
    last7Days: "Nakaraang 7 Araw",
    last30Days: "Nakaraang 30 Araw",
    status: "Katayuan",
    patient: "Pasyente",
    details: "Klinikal na Detalye",
    timestamp: "Petsa at Oras",
    loadingLogs: "Nagsi-sync ng mga log mula sa database...",
    noLogsYet: "Wala pang naitalang mga log ng aktibidad.",
    noLogsFilter: "Walang nahanap na aktibidad na tumutugma sa iyong filter.",
    resetFilter: "I-reset ang Filter",
    showing: "Ipinapakita",
    to: "hanggang",
    of: "ng",
    entries: "tala",
    rowsPerPage: "Bilang sa bawat pahina:"
  }
};

const getStatusBadgeColor = (status: string = "") => {
  const lower = status.toLowerCase();
  if (lower.includes("appointment") || lower.includes("milestone") || lower.includes("schedule")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (lower.includes("status") || lower.includes("discharge") || lower.includes("relapse") || lower.includes("profile")) {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }
  if (lower.includes("reminder") || lower.includes("memo") || lower.includes("note") || lower.includes("request")) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  if (lower.includes("review") || lower.includes("triage") || lower.includes("verification") || lower.includes("approved")) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  return "bg-teal-50 text-teal-800 border-teal-200";
};

export default function ActivityLogs() {
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [specificDate, setSpecificDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [doctorName, setDoctorName] = useState("Doctor");

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile for Name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile?.full_name) {
        setDoctorName(sanitizeText(profile.full_name) || "Doctor");
      }

      // Fetch Logs
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('doctor_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Clean out test/junk entries & sanitize strings
      const cleanedLogs = (data || [])
        .filter((log) => {
          const combined = `${log.action || ""} ${log.patient || ""} ${log.details || ""}`.toLowerCase();
          return !combined.includes("dsfvdscfsddsdsfasfsd");
        })
        .map((log) => {
          const cleanPatient = sanitizeText(log.patient);
          const isNA = !cleanPatient || cleanPatient.toUpperCase() === "N/A";
          return {
            ...log,
            action: sanitizeText(log.action) || "System Event",
            patient: isNA ? "—" : cleanPatient,
            details: format24HrInTextTo12Hr(sanitizeText(log.details)) || "—",
          };
        });

      setActivityLogs(cleanedLogs);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateRangeFilter, specificDate, itemsPerPage]);

  const filtered = activityLogs.filter((log) => {
    const matchesSearch = search === "" ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.patient?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    
    const actLower = (log.action || "").toLowerCase();
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "profile_update" && actLower.includes("profile")) ||
      (statusFilter === "patient_approved" && (actLower.includes("approved") || actLower.includes("verified"))) ||
      (statusFilter === "new_link" && (actLower.includes("link") || actLower.includes("request") || actLower.includes("connection"))) ||
      (statusFilter === "appointments" && (actLower.includes("appointment") || actLower.includes("milestone") || actLower.includes("schedule"))) ||
      (statusFilter === "status" && (actLower.includes("status") || actLower.includes("discharge"))) ||
      (statusFilter === "reminders" && (actLower.includes("reminder") || actLower.includes("memo") || actLower.includes("note"))) ||
      (statusFilter === "reviews" && (actLower.includes("review") || actLower.includes("triage")));

    let matchesDate = true;
    if (log.timestamp) {
      const logDate = new Date(log.timestamp);
      const now = new Date();

      if (specificDate) {
        const logDateStr = logDate.toISOString().split("T")[0];
        matchesDate = logDateStr === specificDate;
      } else if (dateRangeFilter === "today") {
        matchesDate = logDate.toDateString() === now.toDateString();
      } else if (dateRangeFilter === "7days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesDate = logDate >= sevenDaysAgo;
      } else if (dateRangeFilter === "30days") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        matchesDate = logDate >= thirtyDaysAgo;
      }
    }
      
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedLogs = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const sanitizedDoctorName = sanitizeText(doctorName) || "Doctor";
  const cleanDoctorName = sanitizedDoctorName.replace(/^(dr\.?\s*)+/i, "").trim() || "Doctor";

  const hasActiveFilters = search !== "" || statusFilter !== "all" || dateRangeFilter !== "all" || specificDate !== "";

  return (
    <DashboardLayout role="doctor" userName={sanitizedDoctorName}>
      <div className="space-y-6 animate-fade-in font-sans">
        
        {/* --- PAGE HEADER BANNER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-300/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
              Clinical Audit & Event Stream
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 pt-1">
              {t("pageTitle")}
            </h1>
            <p className="text-slate-500 text-xs font-normal">
              {t("pageSubtitle")} • Dr. {cleanDoctorName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1.5 text-xs font-bold bg-slate-50 text-slate-700 border-slate-300 rounded-xl">
              <Activity className="h-3.5 w-3.5 mr-1.5 text-teal-700" />
              {filtered.length} Events Logged
            </Badge>
          </div>
        </div>

        {/* --- SEARCH, STATUS & DATE FILTER TOOLBAR --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-300/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder={t("searchPlaceholder")} 
              className="pl-9 bg-slate-50 border-slate-300 text-xs text-slate-800 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-10 rounded-xl w-full" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full bg-slate-50 border-slate-300 text-xs text-slate-800 h-10 rounded-xl">
              <Filter className="mr-2 h-3.5 w-3.5 text-teal-700 shrink-0" />
              <SelectValue placeholder={t("statusType")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 bg-white">
              <SelectItem value="all" className="text-xs">{t("allStatuses")}</SelectItem>
              <SelectItem value="profile_update" className="text-xs">{t("profileUpdate")}</SelectItem>
              <SelectItem value="patient_approved" className="text-xs">{t("patientApproved")}</SelectItem>
              <SelectItem value="new_link" className="text-xs">{t("newLinkRequest")}</SelectItem>
              <SelectItem value="appointments" className="text-xs">{t("appointments")}</SelectItem>
              <SelectItem value="status" className="text-xs">{t("statusUpdates")}</SelectItem>
              <SelectItem value="reminders" className="text-xs">{t("reminders")}</SelectItem>
              <SelectItem value="reviews" className="text-xs">{t("reviews")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Preset Filter */}
          <Select
            value={dateRangeFilter}
            onValueChange={(val) => {
              setDateRangeFilter(val);
              if (val !== "all") setSpecificDate("");
            }}
          >
            <SelectTrigger className="w-full bg-slate-50 border-slate-300 text-xs text-slate-800 h-10 rounded-xl">
              <Calendar className="mr-2 h-3.5 w-3.5 text-teal-700 shrink-0" />
              <SelectValue placeholder={t("dateFilter")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 bg-white">
              <SelectItem value="all" className="text-xs">{t("allDates")}</SelectItem>
              <SelectItem value="today" className="text-xs">{t("today")}</SelectItem>
              <SelectItem value="7days" className="text-xs">{t("last7Days")}</SelectItem>
              <SelectItem value="30days" className="text-xs">{t("last30Days")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Exact Date Picker & Reset Button */}
          <div className="flex gap-2">
            <Input
              type="date"
              value={specificDate}
              onChange={(e) => {
                setSpecificDate(e.target.value);
                if (e.target.value) setDateRangeFilter("all");
              }}
              className="bg-slate-50 border-slate-300 text-xs text-slate-800 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-10 rounded-xl flex-1"
              title="Filter by specific date"
            />
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDateRangeFilter("all");
                  setSpecificDate("");
                }}
                className="h-10 w-10 shrink-0 rounded-xl border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                title={t("resetFilter")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* --- AUDIT TRAIL LOG TABLE --- */}
        <Card className="border-slate-300/80 shadow-[0_12px_35px_rgba(15,23,42,0.06)] bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/70">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <Clock className="h-4 w-4 text-teal-700" />
              {t("recentActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/90 border-b border-slate-200">
                <TableRow>
                  {/* Reordered Columns: Patient > Status > Clinical Details > Date & Time */}
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 pl-6 w-[200px]">
                    {t("patient")}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-[210px]">
                    {t("status")}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {t("details")}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 text-right pr-6 w-[200px]">
                    {t("timestamp")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-14 text-slate-400 text-xs font-medium">
                      {t("loadingLogs")}
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => {
                    const isBlankPatient = !log.patient || log.patient === "—";
                    return (
                      <TableRow key={log.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                        {/* 1. Patient Column (Shows '—' instead of noisy 'N/A') */}
                        <TableCell className="pl-6 py-3.5">
                          {isBlankPatient ? (
                            <span className="text-xs font-medium text-slate-400 pl-1">—</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                <User className="h-3 w-3 text-slate-500" />
                              </div>
                              <span className="font-semibold text-xs text-slate-900 truncate" title={log.patient}>
                                {log.patient}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* 2. Status Column */}
                        <TableCell className="py-3.5">
                          <Badge 
                            variant="outline" 
                            className={`rounded-md text-[10px] font-bold px-2.5 py-0.5 border ${getStatusBadgeColor(log.action)}`}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>

                        {/* 3. Clinical Details Column */}
                        <TableCell className="py-3.5 text-xs text-slate-600 font-normal leading-relaxed" title={log.details}>
                          {log.details}
                        </TableCell>

                        {/* 4. Date & Time Column (Consistent 12-hour AM/PM format) */}
                        <TableCell className="py-3.5 text-right pr-6">
                          <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            }) : "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-14 text-xs italic">
                      {activityLogs.length === 0 ? t("noLogsYet") : t("noLogsFilter")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* --- UNIFIED TABLE PAGINATION WITH ROWS-PER-PAGE --- */}
            {!loading && filtered.length > 0 && (
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
                    {t("showing")} {filtered.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} {t("to")} {Math.min(currentPage * itemsPerPage, filtered.length)} {t("of")} {filtered.length} {t("entries")}
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
    </DashboardLayout>
  );
}