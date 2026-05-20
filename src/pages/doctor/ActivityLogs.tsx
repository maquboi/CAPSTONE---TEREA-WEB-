import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Filter } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "Activity Logs",
    pageSubtitle: "Track your recent actions and patient interactions",
    recentActivity: "Recent Activity",
    searchPlaceholder: "Search activity...",
    actionType: "Action type",
    allActions: "All Actions",
    appointments: "Appointments",
    statusUpdates: "Status Updates",
    reminders: "Reminders",
    reviews: "Reviews",
    action: "Action",
    patient: "Patient",
    details: "Details",
    timestamp: "Timestamp",
    loadingLogs: "Loading logs...",
    noLogsYet: "No activity logs recorded yet.",
    noLogsFilter: "No activity found matching your filters."
  },
  fil: {
    pageTitle: "Mga Log ng Aktibidad",
    pageSubtitle: "Subaybayan ang iyong mga kamakailang aksyon at interaksyon sa pasyente",
    recentActivity: "Kamakailang Aktibidad",
    searchPlaceholder: "Maghanap ng aktibidad...",
    actionType: "Uri ng aksyon",
    allActions: "Lahat ng Aksyon",
    appointments: "Mga Appointment",
    statusUpdates: "Mga Update sa Katayuan",
    reminders: "Mga Paalala",
    reviews: "Mga Pagsusuri",
    action: "Aksyon",
    patient: "Pasyente",
    details: "Mga Detalye",
    timestamp: "Timestamp",
    loadingLogs: "Nilo-load ang mga log...",
    noLogsYet: "Wala pang naitalang mga log ng aktibidad.",
    noLogsFilter: "Walang nahanap na aktibidad na tumutugma sa iyong mga filter."
  }
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
      if (profile) setDoctorName(profile.full_name);

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

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pageTitle")}</h1>
          <p className="text-muted-foreground">{t("pageSubtitle")}</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("recentActivity")}</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={t("searchPlaceholder")} 
                    className="pl-8" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={t("actionType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allActions")}</SelectItem>
                    <SelectItem value="appointments">{t("appointments")}</SelectItem>
                    <SelectItem value="status">{t("statusUpdates")}</SelectItem>
                    <SelectItem value="reminders">{t("reminders")}</SelectItem>
                    <SelectItem value="reviews">{t("reviews")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("action")}</TableHead>
                  <TableHead>{t("patient")}</TableHead>
                  <TableHead>{t("details")}</TableHead>
                  <TableHead>{t("timestamp")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">{t("loadingLogs")}</TableCell></TableRow>
                ) : filtered.length > 0 ? (
                  filtered.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                      <TableCell className="font-medium">{log.patient}</TableCell>
                      <TableCell className="text-muted-foreground">{log.details}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">{activityLogs.length === 0 ? t("noLogsYet") : t("noLogsFilter")}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}