import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { CheckCircle, AlertCircle, Loader2, BellRing, MonitorSmartphone, CalendarClock, Save, Clock } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup
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
    saveBtn: "Save Changes",
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

// Generates time slots in 15-minute intervals for the modern dropdown
const generateTimeSlots = () => {
  const slots = [];
  for (let i = 5; i <= 22; i++) {
    for (let j = 0; j < 60; j += 15) {
      const hour24 = i.toString().padStart(2, '0');
      const min = j.toString().padStart(2, '0');
      const val = `${hour24}:${min}`;
      
      const hour12 = i % 12 === 0 ? 12 : i % 12;
      const ampm = i >= 12 ? 'PM' : 'AM';
      const label = `${hour12}:${min} ${ampm}`;
      
      slots.push({ value: val, label });
    }
  }
  return slots;
};

export default function DoctorSettings() {
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };
  
  const { language: globalLang, setLanguage } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState("Doctor");
  const [isSaving, setIsSaving] = useState(false);
  
  const TIME_SLOTS = useMemo(() => generateTimeSlots(), []);

  const [settings, setSettings] = useState({
    patientAlerts: true, appointmentReminders: true, followUpAlerts: true, emailNotifs: false,
    language: globalLang,
    defaultView: "dashboard",
    startHour: "08:00", endHour: "17:00", duration: "30",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, start_hour, end_hour')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setDoctorName(profileData.full_name);
          setSettings(prev => ({
            ...prev,
            startHour: profileData.start_hour || prev.startHour,
            endHour: profileData.end_hour || prev.endHour
          }));
        }
      }
    };
    fetchUserData();

    const savedSettings = localStorage.getItem("doctorSystemSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...parsed, language: parsed.language || globalLang, startHour: prev.startHour, endHour: prev.endHour }));
      } catch (e) {
        console.error("Failed to parse settings");
      }
    }
  }, [globalLang]);

  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value });

  const currentLang = settings.language as 'en' | 'fil';
  const t = (key: keyof typeof translations.en) => translations[currentLang][key] || translations.en[key];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("doctorSystemSettings", JSON.stringify(settings));
      
      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            start_hour: settings.startHour,
            end_hour: settings.endHour
          })
          .eq('id', userId);
          
        if (error) throw error;
      }
      
      window.dispatchEvent(new Event("settingsUpdated"));
      
      setLanguage(settings.language as 'en' | 'fil');
      triggerAlert(t("successTitle"), t("successDesc"), "success");
    } catch (err: any) {
      triggerAlert("Error", err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
      
      {/* TEREA-Themed Alert Dialog */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
          <DialogContent className="sm:max-w-[400px] rounded-3xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-2xl font-sans">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-5 ${alert.type === 'success' ? 'bg-[#DDE5B6]/50' : 'bg-red-50'}`}>
              {alert.type === 'success' ? <CheckCircle className="h-7 w-7 text-[#606C38]" /> : <AlertCircle className="h-7 w-7 text-red-500" />}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">{alert.title}</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">{alert.message}</p>
            <Button className="mt-8 w-full rounded-2xl bg-[#606C38] hover:bg-[#283618] text-white h-12 font-bold transition-all active:scale-95" onClick={() => setAlert({...alert, open: false})}>{t("okBtn")}</Button>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <div className="account-page mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{t("pageTitle")}</h1>
          <p className="text-slate-500 font-medium text-base">{t("pageSubtitle")}</p>
        </div>

        <div className="space-y-8">
          
          {/* Notifications Card */}
          <Card className="rounded-3xl shadow-sm border border-slate-200/60 bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-[#606C38]/5 hover:border-[#DDE5B6] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#DDE5B6]/0 group-hover:bg-[#606C38] transition-colors duration-500" />
            <CardHeader className="pb-4 border-b border-slate-100/80 px-8 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-[#FEFAE0] group-hover:text-[#606C38] transition-colors duration-300">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">{t("notifTitle")}</CardTitle>
                  <CardDescription className="text-slate-500 font-medium mt-0.5">{t("notifDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-6 px-8 pb-8">
              <div className="flex items-start justify-between gap-6 p-4 rounded-2xl transition-all duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer" onClick={() => update("patientAlerts", !settings.patientAlerts)}>
                <div className="space-y-1"><Label className="font-bold text-slate-900 text-base cursor-pointer">{t("patientAlerts")}</Label><p className="text-sm text-slate-500 font-medium">{t("patientAlertsDesc")}</p></div>
                <Switch checked={settings.patientAlerts} onCheckedChange={(v) => update("patientAlerts", v)} className="data-[state=checked]:bg-[#606C38] scale-110" />
              </div>
              <div className="flex items-start justify-between gap-6 p-4 rounded-2xl transition-all duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer" onClick={() => update("appointmentReminders", !settings.appointmentReminders)}>
                <div className="space-y-1"><Label className="font-bold text-slate-900 text-base cursor-pointer">{t("apptReminders")}</Label><p className="text-sm text-slate-500 font-medium">{t("apptRemindersDesc")}</p></div>
                <Switch checked={settings.appointmentReminders} onCheckedChange={(v) => update("appointmentReminders", v)} className="data-[state=checked]:bg-[#606C38] scale-110" />
              </div>
              <div className="flex items-start justify-between gap-6 p-4 rounded-2xl transition-all duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer" onClick={() => update("followUpAlerts", !settings.followUpAlerts)}>
                <div className="space-y-1"><Label className="font-bold text-slate-900 text-base cursor-pointer">{t("followUpAlerts")}</Label><p className="text-sm text-slate-500 font-medium">{t("followUpAlertsDesc")}</p></div>
                <Switch checked={settings.followUpAlerts} onCheckedChange={(v) => update("followUpAlerts", v)} className="data-[state=checked]:bg-[#606C38] scale-110" />
              </div>
              <div className="flex items-start justify-between gap-6 p-4 rounded-2xl transition-all duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer" onClick={() => update("emailNotifs", !settings.emailNotifs)}>
                <div className="space-y-1"><Label className="font-bold text-slate-900 text-base cursor-pointer">{t("emailNotifs")}</Label><p className="text-sm text-slate-500 font-medium">{t("emailNotifsDesc")}</p></div>
                <Switch checked={settings.emailNotifs} onCheckedChange={(v) => update("emailNotifs", v)} className="data-[state=checked]:bg-[#606C38] scale-110" />
              </div>
            </CardContent>
          </Card>

          {/* Display Card */}
          <Card className="rounded-3xl shadow-sm border border-slate-200/60 bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-[#606C38]/5 hover:border-[#DDE5B6] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#DDE5B6]/0 group-hover:bg-[#606C38] transition-colors duration-500" />
            <CardHeader className="pb-4 border-b border-slate-100/80 px-8 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-[#FEFAE0] group-hover:text-[#606C38] transition-colors duration-300">
                  <MonitorSmartphone className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">{t("displayTitle")}</CardTitle>
                  <CardDescription className="text-slate-500 font-medium mt-0.5">{t("displayDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-8 lg:grid-cols-2 pt-8 px-8 pb-8">
              <div className="space-y-3">
                <div className="space-y-1"><Label className="font-bold text-slate-900">{t("lang")}</Label><p className="text-sm text-slate-500">{t("langDesc")}</p></div>
                <Select value={settings.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50/50 border-slate-200 transition-all hover:bg-white hover:border-[#606C38]/50 focus:ring-[#606C38]/20 focus:border-[#606C38]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="en" className="font-medium cursor-pointer">English</SelectItem>
                    <SelectItem value="fil" className="font-medium cursor-pointer">Filipino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="space-y-1"><Label className="font-bold text-slate-900">{t("defaultView")}</Label><p className="text-sm text-slate-500">{t("defaultViewDesc")}</p></div>
                <Select value={settings.defaultView} onValueChange={(v) => update("defaultView", v)}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50/50 border-slate-200 transition-all hover:bg-white hover:border-[#606C38]/50 focus:ring-[#606C38]/20 focus:border-[#606C38]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="dashboard" className="font-medium cursor-pointer">{t("dashboard")}</SelectItem>
                    <SelectItem value="queue" className="font-medium cursor-pointer">{t("queue")}</SelectItem>
                    <SelectItem value="appointments" className="font-medium cursor-pointer">{t("appointments")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card with Modern Time Picker */}
          <Card className="rounded-3xl shadow-sm border border-slate-200/60 bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-[#606C38]/5 hover:border-[#DDE5B6] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#DDE5B6]/0 group-hover:bg-[#606C38] transition-colors duration-500" />
            <CardHeader className="pb-4 border-b border-slate-100/80 px-8 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-[#FEFAE0] group-hover:text-[#606C38] transition-colors duration-300">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">{t("scheduleTitle")}</CardTitle>
                  <CardDescription className="text-slate-500 font-medium mt-0.5">{t("scheduleDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-8 lg:grid-cols-2 pt-8 px-8 pb-8">
              <div className="space-y-4 lg:col-span-2">
                <div className="space-y-1"><Label className="font-bold text-slate-900 text-base">{t("workHours")}</Label><p className="text-sm text-slate-500">{t("workHoursDesc")}</p></div>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  
                  <Select value={settings.startHour} onValueChange={(v) => update("startHour", v)}>
                    <SelectTrigger className="w-full h-12 rounded-xl bg-white border-slate-200 transition-all hover:border-[#606C38]/50 focus:ring-[#606C38]/20 focus:border-[#606C38] font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#606C38]" />
                        <SelectValue placeholder="Select Start Time" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[280px]">
                      <SelectGroup>
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={`start-${slot.value}`} value={slot.value} className="font-medium cursor-pointer">
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <span className="text-slate-400 font-bold uppercase text-xs tracking-wider shrink-0">{t("to")}</span>
                  
                  <Select value={settings.endHour} onValueChange={(v) => update("endHour", v)}>
                    <SelectTrigger className="w-full h-12 rounded-xl bg-white border-slate-200 transition-all hover:border-[#606C38]/50 focus:ring-[#606C38]/20 focus:border-[#606C38] font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#606C38]" />
                        <SelectValue placeholder="Select End Time" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[280px]">
                      <SelectGroup>
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={`end-${slot.value}`} value={slot.value} className="font-medium cursor-pointer">
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                </div>
              </div>
              <div className="space-y-3 lg:col-span-2">
                <div className="space-y-1"><Label className="font-bold text-slate-900 text-base">{t("apptDuration")}</Label><p className="text-sm text-slate-500">{t("apptDurationDesc")}</p></div>
                <Select value={settings.duration} onValueChange={(v) => update("duration", v)}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50/50 border-slate-200 transition-all hover:bg-white hover:border-[#606C38]/50 focus:ring-[#606C38]/20 focus:border-[#606C38]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="15" className="font-medium cursor-pointer">{t("min15")}</SelectItem>
                    <SelectItem value="30" className="font-medium cursor-pointer">{t("min30")}</SelectItem>
                    <SelectItem value="45" className="font-medium cursor-pointer">{t("min45")}</SelectItem>
                    <SelectItem value="60" className="font-medium cursor-pointer">{t("hour1")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Row */}
          <div className="flex justify-end pt-4 pb-12">
            <Button 
              disabled={isSaving} 
              onClick={handleSave} 
              className="bg-[#606C38] hover:bg-[#283618] text-white rounded-2xl h-14 px-10 text-base font-extrabold transition-all duration-300 shadow-lg shadow-[#606C38]/20 hover:shadow-[#606C38]/40 active:scale-95 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {t("saveBtn")}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}