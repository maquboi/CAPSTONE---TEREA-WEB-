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
import { Search, Filter, Clock, Activity, RotateCcw, User } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "Clinical Activity Logs",
    pageSubtitle: "Comprehensive audit trail of clinical actions, consults, and patient interactions",
    recentActivity: "Recorded Audit Trail",
    searchPlaceholder: "Search by action, patient, or details...",
    actionType: "Action category",
    allActions: "All Categories",
    appointments: "Appointments & Milestones",
    statusUpdates: "Status Updates",
    reminders: "Reminders & Memos",
    reviews: "Clinical Reviews",
    action: "Action",
    patient: "Patient",
    details: "Clinical Details",
    timestamp: "Date & Time",
    loadingLogs: "Syncing audit logs from database...",
    noLogsYet: "No clinical activity logs recorded yet.",
    noLogsFilter: "No activity logs match your current filter parameters.",
    resetFilter: "Reset Filters"
  },
  fil: {
    pageTitle: "Mga Log ng Klinikal na Aktibidad",
    pageSubtitle: "Kumpletong audit trail ng mga klinikal na aksyon, konsultasyon, at talaan ng pasyente",
    recentActivity: "Naitalang Audit Trail",
    searchPlaceholder: "Maghanap ayon sa aksyon, pasyente, o detalye...",
    actionType: "Kategorya ng aksyon",
    allActions: "Lahat ng Kategorya",
    appointments: "Mga Appointment at Milestone",
    statusUpdates: "Mga Update sa Katayuan",
    reminders: "Mga Paalala at Memo",
    reviews: "Klinikal na Pagsusuri",
    action: "Aksyon",
    patient: "Pasyente",
    details: "Klinikal na Detalye",
    timestamp: "Petsa at Oras",
    loadingLogs: "Nagsi-sync ng mga log mula sa database...",
    noLogsYet: "Wala pang naitalang mga log ng aktibidad.",
    noLogsFilter: "Walang nahanap na aktibidad na tumutugma sa iyong filter.",
    resetFilter: "I-reset ang Filter"
  }
};

const getActionBadgeColor = (action: string = "") => {
  const lower = action.toLowerCase();
  if (lower.includes("appointment") || lower.includes("milestone") || lower.includes("schedule")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (lower.includes("status") || lower.includes("discharge") || lower.includes("relapse")) {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }
  if (lower.includes("reminder") || lower.includes("memo") || lower.includes("note")) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  if (lower.includes("review") || lower.includes("triage") || lower.includes("verification")) {
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
  const [actionFilter, setActionFilter] = useState("all");
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
      if (profile?.full_name) setDoctorName(profile.full_name);

      // Fetch Logs
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('doctor_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setActivityLogs(data || []);
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

  const filtered = activityLogs.filter((log) => {
    const matchesSearch = search === "" ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.patient?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = actionFilter === "all" ||
      (actionFilter === "appointments" && log.action?.includes("Appointment")) ||
      (actionFilter === "status" && log.action?.includes("Status")) ||
      (actionFilter === "reminders" && log.action?.includes("Reminder")) ||
      (actionFilter === "reviews" && log.action?.includes("Review"));
      
    return matchesSearch && matchesAction;
  });

  const cleanDoctorName = doctorName.replace(/^(dr\.?\s*)+/i, "").trim() || "Doctor";

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
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

        {/* --- SEARCH & CATEGORY FILTER TOOLBAR --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-300/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder={t("searchPlaceholder")} 
              className="pl-9 bg-slate-50 border-slate-300 text-xs text-slate-800 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-10 rounded-xl w-full" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          <div className="flex gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full bg-slate-50 border-slate-300 text-xs text-slate-800 h-10 rounded-xl">
                <Filter className="mr-2 h-3.5 w-3.5 text-teal-700 shrink-0" />
                <SelectValue placeholder={t("actionType")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 bg-white">
                <SelectItem value="all" className="text-xs">{t("allActions")}</SelectItem>
                <SelectItem value="appointments" className="text-xs">{t("appointments")}</SelectItem>
                <SelectItem value="status" className="text-xs">{t("statusUpdates")}</SelectItem>
                <SelectItem value="reminders" className="text-xs">{t("reminders")}</SelectItem>
                <SelectItem value="reviews" className="text-xs">{t("reviews")}</SelectItem>
              </SelectContent>
            </Select>

            {(search || actionFilter !== "all") && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => { setSearch(""); setActionFilter("all"); }}
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
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 pl-5 w-[220px]">
                    {t("action")}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-[200px]">
                    {t("patient")}
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
                ) : filtered.length > 0 ? (
                  filtered.map((log) => (
                    <TableRow key={log.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <TableCell className="pl-5 py-3.5">
                        <Badge 
                          variant="outline" 
                          className={`rounded-md text-[10px] font-bold px-2 py-0.5 border ${getActionBadgeColor(log.action)}`}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <User className="h-3 w-3 text-slate-500" />
                          </div>
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {log.patient || "N/A"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-xs text-slate-600 font-normal leading-relaxed">
                        {log.details || "—"}
                      </TableCell>

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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-14 text-xs italic">
                      {activityLogs.length === 0 ? t("noLogsYet") : t("noLogsFilter")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}