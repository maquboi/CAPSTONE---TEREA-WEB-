import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { CheckCircle, AlertCircle } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "../admin/LanguageContext"; 

const translations = {
  en: {
    pageTitle: "Settings",
    pageSubtitle: "Manage your preferences",
    notifTitle: "Notifications",
    notifDesc: "Configure notification preferences",
    patientAlerts: "Patient Alerts",
    patientAlertsDesc: "Get notified about high-risk patient updates & diary logs",
    apptReminders: "Appointment Reminders",
    apptRemindersDesc: "Receive reminders before appointments",
    followUpAlerts: "Follow-up Alerts",
    followUpAlertsDesc: "Get notified about new patient reports and notes",
    emailNotifs: "Email Notifications",
    emailNotifsDesc: "Receive email summaries",
    displayTitle: "Display",
    displayDesc: "Customize your display settings",
    lang: "Language",
    langDesc: "Select your preferred language",
    defaultView: "Default View",
    defaultViewDesc: "Choose your landing page",
    dashboard: "Dashboard",
    queue: "Patient Queue",
    appointments: "Appointments",
    scheduleTitle: "Schedule",
    scheduleDesc: "Set your availability",
    workHours: "Working Hours",
    workHoursDesc: "Set your consultation hours",
    to: "to",
    apptDuration: "Appointment Duration",
    apptDurationDesc: "Default time per patient",
    min15: "15 minutes",
    min30: "30 minutes",
    min45: "45 minutes",
    hour1: "1 hour",
    saveBtn: "Save All Settings",
    successTitle: "Settings saved",
    successDesc: "Your preferences have been successfully updated.",
    okBtn: "Okay"
  },
  fil: {
    pageTitle: "Mga Setting",
    pageSubtitle: "Pamahalaan ang iyong mga kagustuhan",
    notifTitle: "Mga Abiso",
    notifDesc: "I-configure ang mga kagustuhan sa abiso",
    patientAlerts: "Mga Alerto ng Pasyente",
    patientAlertsDesc: "Maging alerto tungkol sa diary at mataas na panganib",
    apptReminders: "Mga Paalala sa Appointment",
    apptRemindersDesc: "Makatanggap ng mga paalala bago ang appointment",
    followUpAlerts: "Mga Alerto sa Follow-up",
    followUpAlertsDesc: "Makatanggap ng abiso sa mga bagong report ng pasyente",
    emailNotifs: "Mga Abiso sa Email",
    emailNotifsDesc: "Makatanggap ng mga buod sa email",
    displayTitle: "Display",
    displayDesc: "I-customize ang iyong mga setting sa display",
    lang: "Wika",
    langDesc: "Piliin ang iyong gustong wika",
    defaultView: "Default na View",
    defaultViewDesc: "Piliin ang iyong landing page",
    dashboard: "Dashboard",
    queue: "Pila ng Pasyente",
    appointments: "Mga Appointment",
    scheduleTitle: "Iskedyul",
    scheduleDesc: "I-set ang iyong availability",
    workHours: "Oras ng Trabaho",
    workHoursDesc: "I-set ang iyong oras ng konsultasyon",
    to: "hanggang",
    apptDuration: "Tagal ng Appointment",
    apptDurationDesc: "Default na oras bawat pasyente",
    min15: "15 minuto",
    min30: "30 minuto",
    min45: "45 minuto",
    hour1: "1 oras",
    saveBtn: "I-save ang Lahat ng Setting",
    successTitle: "Na-save ang mga setting",
    successDesc: "Na-update na ang iyong mga kagustuhan.",
    okBtn: "Okay"
  }
};

export default function DoctorSettings() {
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };
  
  const { language: globalLang, setLanguage } = useLanguage();
  const [doctorName, setDoctorName] = useState("Doctor");
  const [settings, setSettings] = useState({
    patientAlerts: true, appointmentReminders: true, followUpAlerts: true, emailNotifs: false,
    language: globalLang,
    defaultView: "dashboard",
    startHour: "8am", endHour: "5pm", duration: "30",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profileData) setDoctorName(profileData.full_name);
      }
    };
    fetchUserData();

    const savedSettings = localStorage.getItem("doctorSystemSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...parsed, language: parsed.language || globalLang });
      } catch (e) {
        console.error("Failed to parse settings");
      }
    }
  }, [globalLang]);

  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value });

  const currentLang = settings.language as 'en' | 'fil';
  const t = (key: keyof typeof translations.en) => translations[currentLang][key] || translations.en[key];

  const handleSave = () => {
    // 1. Save to local storage
    localStorage.setItem("doctorSystemSettings", JSON.stringify(settings));
    
    // 2. Dispatch event to update AppHeader immediately
    window.dispatchEvent(new Event("settingsUpdated"));
    
    setLanguage(settings.language as 'en' | 'fil');
    triggerAlert(t("successTitle"), t("successDesc"), "success");
  };

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
      
      {/* TEREA-Themed Alert Dialog */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
          <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-[#DDE5B6]' : 'bg-slate-200'}`}>
              {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-[#606C38]" /> : <AlertCircle className="h-6 w-6 text-slate-700" />}
            </div>
            <h2 className="text-lg font-bold text-black">{alert.title}</h2>
            <p className="text-slate-600 mt-2 text-sm">{alert.message}</p>
            <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#283618] text-white" onClick={() => setAlert({...alert, open: false})}>{t("okBtn")}</Button>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <div className="account-page mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <h1 className="dashboard-title text-2xl font-bold tracking-tight text-[#283618]">{t("pageTitle")}</h1>
          <p className="dashboard-muted text-slate-500 font-medium">{t("pageSubtitle")}</p>
        </div>

        <div className="space-y-6">
          <Card className="dashboard-surface rounded-2xl shadow-sm border border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-[#283618]">{t("notifTitle")}</CardTitle>
              <CardDescription className="text-slate-500 font-medium">{t("notifDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5"><Label className="font-bold text-[#283618] text-md">{t("patientAlerts")}</Label><p className="text-sm text-slate-500 font-medium">{t("patientAlertsDesc")}</p></div>
                <Switch checked={settings.patientAlerts} onCheckedChange={(v) => update("patientAlerts", v)} className="data-[state=checked]:bg-[#606C38]" />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5"><Label className="font-bold text-[#283618] text-md">{t("apptReminders")}</Label><p className="text-sm text-slate-500 font-medium">{t("apptRemindersDesc")}</p></div>
                <Switch checked={settings.appointmentReminders} onCheckedChange={(v) => update("appointmentReminders", v)} className="data-[state=checked]:bg-[#606C38]" />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5"><Label className="font-bold text-[#283618] text-md">{t("followUpAlerts")}</Label><p className="text-sm text-slate-500 font-medium">{t("followUpAlertsDesc")}</p></div>
                <Switch checked={settings.followUpAlerts} onCheckedChange={(v) => update("followUpAlerts", v)} className="data-[state=checked]:bg-[#606C38]" />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5"><Label className="font-bold text-[#283618] text-md">{t("emailNotifs")}</Label><p className="text-sm text-slate-500 font-medium">{t("emailNotifsDesc")}</p></div>
                <Switch checked={settings.emailNotifs} onCheckedChange={(v) => update("emailNotifs", v)} className="data-[state=checked]:bg-[#606C38]" />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-surface rounded-2xl shadow-sm border border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-[#283618]">{t("displayTitle")}</CardTitle>
              <CardDescription className="text-slate-500 font-medium">{t("displayDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2 pt-5">
              <div className="space-y-3">
                <div className="space-y-0.5"><Label className="font-bold text-[#283618]">{t("lang")}</Label><p className="text-sm text-slate-500">{t("langDesc")}</p></div>
                <Select value={settings.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-[#606C38]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fil">Filipino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="space-y-0.5"><Label className="font-bold text-[#283618]">{t("defaultView")}</Label><p className="text-sm text-slate-500">{t("defaultViewDesc")}</p></div>
                <Select value={settings.defaultView} onValueChange={(v) => update("defaultView", v)}>
                  <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-[#606C38]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="dashboard">{t("dashboard")}</SelectItem>
                    <SelectItem value="queue">{t("queue")}</SelectItem>
                    <SelectItem value="appointments">{t("appointments")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-surface rounded-2xl shadow-sm border border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-[#283618]">{t("scheduleTitle")}</CardTitle>
              <CardDescription className="text-slate-500 font-medium">{t("scheduleDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2 pt-5">
              <div className="space-y-3 lg:col-span-2">
                <div className="space-y-0.5"><Label className="font-bold text-[#283618]">{t("workHours")}</Label><p className="text-sm text-slate-500">{t("workHoursDesc")}</p></div>
                <div className="flex items-center gap-3">
                  <Select value={settings.startHour} onValueChange={(v) => update("startHour", v)}>
                    <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-[#606C38]"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="7am">7:00 AM</SelectItem>
                      <SelectItem value="8am">8:00 AM</SelectItem>
                      <SelectItem value="9am">9:00 AM</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-slate-500 font-semibold">{t("to")}</span>
                  <Select value={settings.endHour} onValueChange={(v) => update("endHour", v)}>
                    <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-[#606C38]"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="4pm">4:00 PM</SelectItem>
                      <SelectItem value="5pm">5:00 PM</SelectItem>
                      <SelectItem value="6pm">6:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3 lg:col-span-2">
                <div className="space-y-0.5"><Label className="font-bold text-[#283618]">{t("apptDuration")}</Label><p className="text-sm text-slate-500">{t("apptDurationDesc")}</p></div>
                <Select value={settings.duration} onValueChange={(v) => update("duration", v)}>
                  <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-[#606C38]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="15">{t("min15")}</SelectItem>
                    <SelectItem value="30">{t("min30")}</SelectItem>
                    <SelectItem value="45">{t("min45")}</SelectItem>
                    <SelectItem value="60">{t("hour1")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} className="bg-[#606C38] hover:bg-[#283618] text-white rounded-xl h-11 px-8 font-semibold">
              {t("saveBtn")}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}