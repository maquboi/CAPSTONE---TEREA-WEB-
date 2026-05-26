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
import { Search, Calendar, CheckCircle2, Clock, CheckCircle, AlertCircle } from "lucide-react";
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
    location: "Location",
    date: "Date",
    time: "Time",
    status: "Status",
    noMilestones: "No pending roadmap milestones found.",
    unknownPatient: "Unknown Patient",
    clinicVisit: "Clinic Visit",
    viewBtn: "View",
    restoredTitle: "Restored",
    restoredDesc: "Progress item moved back to schedule.",
    errorTitle: "Error",
    errorDesc: "Update failed",
    markedDoneTitle: "Marked as Done",
    markedDoneDesc: "'s roadmap milestone completed.",
    undoBtn: "Undo",
    okBtn: "Okay"
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
    location: "Lokasyon",
    date: "Petsa",
    time: "Oras",
    status: "Katayuan",
    noMilestones: "Walang nakitang nakabinbing milestone sa roadmap.",
    unknownPatient: "Hindi Kilalang Pasyente",
    clinicVisit: "Pagbisita sa Klinika",
    viewBtn: "Tingnan",
    restoredTitle: "Naibalik",
    restoredDesc: "Ibinalik ang item ng pag-unlad sa iskedyul.",
    errorTitle: "Error",
    errorDesc: "Nabigo ang pag-update",
    markedDoneTitle: "Minarkahan bilang Tapos na",
    markedDoneDesc: " ay nakumpleto ang milestone ng roadmap.",
    undoBtn: "I-undo",
    okBtn: "Okay"
  }
};

interface Appointment {
  id: string | number;
  patient_id: string;
  appointment_date: string; 
  appointment_time: string; 
  location: string | null;
  status: string;
  patient?: {
    full_name: string | null;
  } | null;
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

const getDueBadge = (dateStr: string, status: string, t: (k: string) => string) => {
  const s = status?.toLowerCase() || 'scheduled';
  if (s === 'completed') return <Badge className="bg-gray-100 text-gray-600 border-gray-200">{t("completed")}</Badge>;
  
  const days = getDaysUntil(dateStr);
  if (days < 0) return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">{t("overdue")}</Badge>;
  if (days === 0) return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">{t("today")}</Badge>;
  if (days <= 2) return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">{t("upcoming")}</Badge>;
  return <Badge variant="outline" className="border-[#DDE5B6] text-[#606C38]">{t("scheduled")}</Badge>;
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
  const [loading, setLoading] = useState(true);
  const [fadingIds, setFadingIds] = useState<Set<string | number>>(new Set());
  const [doctorName, setDoctorName] = useState(""); 

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
          patient:profiles!fk_patient(full_name) 
        `)
        .eq('doctor_id', user.id)
        .neq('status', 'completed') 
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        patient: Array.isArray(item.patient) ? item.patient[0] : item.patient
      }));
      
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
  }, []);

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
      }

      setFadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 500);
  };

  const filtered = followUps.filter((f) => {
    const pName = f.patient?.full_name || "Unknown";
    const loc = f.location || "";
    return pName.toLowerCase().includes(search.toLowerCase()) || loc.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    overdue: followUps.filter(f => getDaysUntil(f.appointment_date) < 0).length,
    today: followUps.filter(f => getDaysUntil(f.appointment_date) === 0).length,
    upcoming: followUps.filter(f => getDaysUntil(f.appointment_date) > 0).length,
    completed: 0, 
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

        <div className="grid gap-4 sm:grid-cols-3"> 
          <Card className="border-[#DDE5B6] shadow-sm"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-red-50 p-2 rounded-lg"><Calendar className="text-red-600" /></div><div><p className="text-2xl font-bold text-[#2D3B1E]">{stats.overdue}</p><p className="text-sm font-medium text-[#606C38]/80">{t("overdue")}</p></div></div></CardContent></Card>
          <Card className="border-[#DDE5B6] shadow-sm"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-amber-50 p-2 rounded-lg"><Calendar className="text-amber-600" /></div><div><p className="text-2xl font-bold text-[#2D3B1E]">{stats.today}</p><p className="text-sm font-medium text-[#606C38]/80">{t("today")}</p></div></div></CardContent></Card>
          <Card className="border-[#DDE5B6] shadow-sm"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-green-50 p-2 rounded-lg"><Calendar className="text-green-600" /></div><div><p className="text-2xl font-bold text-[#2D3B1E]">{stats.upcoming}</p><p className="text-sm font-medium text-[#606C38]/80">{t("upcoming")}</p></div></div></CardContent></Card>
        </div>

        <Card className="border-[#DDE5B6] shadow-sm">
          <CardHeader className="pb-3 border-b border-[#DDE5B6]/50 bg-[#FEFAE0]/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-[#2D3B1E]">
                <Clock className="h-5 w-5 text-[#606C38]" />
                {t("roadmapSchedule")}
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("searchPlaceholder")} className="pl-8 bg-[#FEFAE0]/30 border-[#DDE5B6] focus-visible:ring-[#606C38]" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-10 text-center text-muted-foreground italic">{t("loading")}</div> : (
              <Table>
                <TableHeader className="bg-[#FEFAE0]/50">
                  <TableRow>
                    <TableHead className="w-10 pl-6 text-[#2D3B1E] font-bold">{t("done")}</TableHead>
                    <TableHead className="text-[#2D3B1E] font-bold">{t("patient")}</TableHead>
                    <TableHead className="text-[#2D3B1E] font-bold">{t("location")}</TableHead>
                    <TableHead className="text-[#2D3B1E] font-bold">{t("date")}</TableHead>
                    <TableHead className="text-[#2D3B1E] font-bold">{t("time")}</TableHead>
                    <TableHead className="text-[#2D3B1E] font-bold">{t("status")}</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">{t("noMilestones")}</TableCell></TableRow>
                  ) : filtered.map((followUp) => (
                    <TableRow 
                      key={followUp.id}
                      className={`hover:bg-[#FEFAE0]/30 transition-opacity duration-500 ${fadingIds.has(followUp.id) ? 'opacity-0' : 'opacity-100'}`}
                    >
                      <TableCell className="pl-6">
                        <Checkbox 
                          checked={false} 
                          className="border-[#606C38] data-[state=checked]:bg-[#606C38]"
                          onCheckedChange={() => handleCheckDone(followUp.id, followUp.patient?.full_name || t("unknownPatient"))} 
                        />
                      </TableCell>
                      <TableCell className="font-bold text-[#2D3B1E]">{followUp.patient?.full_name || t("unknownPatient")}</TableCell>
                      <TableCell className="text-muted-foreground">{followUp.location || t("clinicVisit")}</TableCell>
                      <TableCell className="font-medium">{new Date(followUp.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <Clock className="w-3.5 h-3.5"/> {formatTime(followUp.appointment_time)}
                      </TableCell>
                      <TableCell>{getDueBadge(followUp.appointment_date, followUp.status, t)}</TableCell>
                      <TableCell className="pr-6">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-[#DDE5B6] text-[#606C38] hover:bg-[#FEFAE0] hover:text-[#2D3B1E]"
                          onClick={() => navigate(`/doctor/patient-details/${followUp.patient_id}`)}
                        >
                          {t("viewBtn")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}