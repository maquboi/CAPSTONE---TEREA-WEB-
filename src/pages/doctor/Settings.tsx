import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  BellRing, 
  MonitorSmartphone, 
  CalendarClock, 
  Save, 
  Clock, 
  SlidersHorizontal,
  Check
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup
} from "@/components/ui/select";
import { useLanguage } from "../admin/LanguageContext"; 

const translations = {
  en: {
    pageTitle: "System Settings & Preferences",
    pageSubtitle: "Configure clinical alerts, consultation duty hours, and display preferences",
    notifTitle: "Clinical Notifications & Triage Alerts",
    notifDesc: "Configure automated notification channels for priority patients and daily medication logs",
    patientAlerts: "High-Risk Patient Triage Alerts",
    patientAlertsDesc: "Receive real-time banners and flags for symptomatic patients and medication non-adherence",
    apptReminders: "Consultation & Appointment Reminders",
    apptRemindersDesc: "Get reminders prior to scheduled laboratory tests and sputum follow-up checkups",
    followUpAlerts: "Patient Diary & Concern Alerts",
    followUpAlertsDesc: "Receive prompts when patients log adverse drug symptoms or urgent concerns in their diary",
    emailNotifs: "Daily Clinical Email Summaries",
    emailNotifsDesc: "Receive an automated morning email digest of scheduled appointments and pending requests",
    displayTitle: "Display & Localization Standards",
    displayDesc: "Customize system language, terminology, and default landing views",
    lang: "Interface Language",
    langDesc: "Select your preferred clinical interface language",
    defaultView: "Default Workstation View",
    defaultViewDesc: "Choose your primary landing dashboard upon login",
    dashboard: "Clinical Overview Dashboard",
    queue: "Patient Intake Queue",
    appointments: "Follow-up Roadmap Tracker",
    scheduleTitle: "Consultation Duty Schedule",
    scheduleDesc: "Set your weekly clinic duty hours for patient appointments and mobile companion availability",
    workHours: "Consultation Working Hours",
    workHoursDesc: "Active clinic duty hours displayed to patients on the TEREA companion app",
    to: "to",
    apptDuration: "Default Consultation Slot Duration",
    apptDurationDesc: "Allocated diagnostic review duration per patient consultation",
    min15: "15 minutes per consultation",
    min30: "30 minutes per consultation",
    min45: "45 minutes per consultation",
    hour1: "60 minutes (Comprehensive Evaluation)",
    saveBtn: "Save All Preferences",
    savingBtn: "Saving Preferences...",
    successTitle: "Preferences Updated",
    successDesc: "Your clinical preferences and duty hours have been successfully saved.",
    okBtn: "Acknowledge"
  },
  fil: {
    pageTitle: "Mga Setting ng Sistema",
    pageSubtitle: "Pamahalaan ang mga alerto sa klinika, oras ng duty, at mga kagustuhan sa display",
    notifTitle: "Mga Abiso sa Klinika at Triage",
    notifDesc: "I-configure ang mga abiso para sa mga pasyenteng may mataas na panganib at tala sa gamutan",
    patientAlerts: "Mga Alerto sa Mataas na Panganib",
    patientAlertsDesc: "Makatanggap ng mga alerto tungkol sa pasyenteng symptomatic at hindi umiinom ng gamot",
    apptReminders: "Mga Paalala sa Konsultasyon",
    apptRemindersDesc: "Makatanggap ng paalala bago ang sputum test at mga follow-up checkup",
    followUpAlerts: "Mga Ulat sa Diary ng Pasyente",
    followUpAlertsDesc: "Makatanggap ng abiso kapag may iniulat na side-effects o alalahanin ang pasyente",
    emailNotifs: "Araw-araw na Buod sa Email",
    emailNotifsDesc: "Makatanggap ng buod ng mga nakaiskedyul na appointment sa iyong email",
    displayTitle: "Display at Wika",
    displayDesc: "I-customize ang wika at ang default na pahina sa pag-login",
    lang: "Wika ng Sistema",
    langDesc: "Piliin ang iyong gustong wika sa klinika",
    defaultView: "Default na Pahina",
    defaultViewDesc: "Piliin ang landing page pagkatapos mag-login",
    dashboard: "Dashboard ng Klinika",
    queue: "Pila ng Pasyente",
    appointments: "Tagasubaybay ng Follow-up",
    scheduleTitle: "Iskedyul ng Duty at Konsultasyon",
    scheduleDesc: "I-set ang iyong oras ng availability sa health center para sa mga pasyente",
    workHours: "Oras ng Konsultasyon",
    workHoursDesc: "Oras ng duty na makikita ng mga pasyente sa TEREA mobile app",
    to: "hanggang",
    apptDuration: "Tagal ng Bawat Konsultasyon",
    apptDurationDesc: "Inilaang oras para sa pagsusuri ng bawat pasyente",
    min15: "15 minuto bawat pasyente",
    min30: "30 minuto bawat pasyente",
    min45: "45 minuto bawat pasyente",
    hour1: "60 minuto (Kumpletong Pagsusuri)",
    saveBtn: "I-save ang Lahat ng Setting",
    savingBtn: "Nagse-save...",
    successTitle: "Na-update ang mga Setting",
    successDesc: "Matagumpay na na-save ang iyong mga kagustuhan at iskedyul ng duty.",
    okBtn: "Sige"
  }
};

// Generates time slots in 15-minute intervals
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
    patientAlerts: true, 
    appointmentReminders: true, 
    followUpAlerts: true, 
    emailNotifs: false,
    language: globalLang,
    defaultView: "dashboard",
    startHour: "08:00", 
    endHour: "17:00", 
    duration: "30",
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
          setDoctorName(profileData.full_name || "Doctor");
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
        setSettings(prev => ({ 
          ...parsed, 
          language: parsed.language || globalLang, 
          startHour: prev.startHour, 
          endHour: prev.endHour 
        }));
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
  }, [globalLang]);

  const update = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

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

  const cleanDoctorName = doctorName.replace(/^(dr\.?\s*)+/i, "").trim() || "Doctor";

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
      
      {/* Centralized Notification Modal */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-xs" />
          <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-2xl font-sans">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-teal-50 border border-teal-200' : 'bg-red-50 border border-red-200'}`}>
              {alert.type === 'success' ? <CheckCircle2 className="h-6 w-6 text-teal-700" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">{alert.title}</DialogTitle>
            <DialogDescription className="text-slate-500 mt-1.5 text-xs font-medium leading-relaxed">{alert.message}</DialogDescription>
            <Button 
              className="mt-6 w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white h-10 text-xs font-bold transition-all shadow-xs" 
              onClick={() => setAlert({...alert, open: false})}
            >
              {t("okBtn")}
            </Button>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in font-sans pb-12">
        
        {/* --- PAGE HEADER BANNER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-300/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
              EHR Station Preferences
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 pt-1">{t("pageTitle")}</h1>
            <p className="text-slate-500 text-xs font-normal">
              {t("pageSubtitle")} • Dr. {cleanDoctorName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              disabled={isSaving} 
              onClick={handleSave} 
              className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl h-10 px-6 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? t("savingBtn") : t("saveBtn")}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* --- SECTION 1: CLINICAL NOTIFICATIONS & TRIAGE ALERTS --- */}
          <Card className="rounded-2xl border border-slate-300/80 bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 shrink-0">
                  <BellRing className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">{t("notifTitle")}</CardTitle>
                  <CardDescription className="text-[11px] text-slate-500 mt-0.5">{t("notifDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              
              {/* Patient Alerts Toggle */}
              <div 
                className="flex items-start justify-between gap-6 p-4 sm:px-6 hover:bg-slate-50/70 transition-colors cursor-pointer" 
                onClick={() => update("patientAlerts", !settings.patientAlerts)}
              >
                <div className="space-y-0.5 pr-2">
                  <Label className="font-bold text-slate-900 text-xs cursor-pointer block">{t("patientAlerts")}</Label>
                  <p className="text-[11px] text-slate-500 font-normal leading-relaxed">{t("patientAlertsDesc")}</p>
                </div>
                <Switch 
                  checked={settings.patientAlerts} 
                  onCheckedChange={(v) => update("patientAlerts", v)} 
                  className="data-[state=checked]:bg-teal-700 shrink-0 mt-0.5" 
                />
              </div>

              {/* Appointment Reminders Toggle */}
              <div 
                className="flex items-start justify-between gap-6 p-4 sm:px-6 hover:bg-slate-50/70 transition-colors cursor-pointer" 
                onClick={() => update("appointmentReminders", !settings.appointmentReminders)}
              >
                <div className="space-y-0.5 pr-2">
                  <Label className="font-bold text-slate-900 text-xs cursor-pointer block">{t("apptReminders")}</Label>
                  <p className="text-[11px] text-slate-500 font-normal leading-relaxed">{t("apptRemindersDesc")}</p>
                </div>
                <Switch 
                  checked={settings.appointmentReminders} 
                  onCheckedChange={(v) => update("appointmentReminders", v)} 
                  className="data-[state=checked]:bg-teal-700 shrink-0 mt-0.5" 
                />
              </div>

              {/* Follow-up Alerts Toggle */}
              <div 
                className="flex items-start justify-between gap-6 p-4 sm:px-6 hover:bg-slate-50/70 transition-colors cursor-pointer" 
                onClick={() => update("followUpAlerts", !settings.followUpAlerts)}
              >
                <div className="space-y-0.5 pr-2">
                  <Label className="font-bold text-slate-900 text-xs cursor-pointer block">{t("followUpAlerts")}</Label>
                  <p className="text-[11px] text-slate-500 font-normal leading-relaxed">{t("followUpAlertsDesc")}</p>
                </div>
                <Switch 
                  checked={settings.followUpAlerts} 
                  onCheckedChange={(v) => update("followUpAlerts", v)} 
                  className="data-[state=checked]:bg-teal-700 shrink-0 mt-0.5" 
                />
              </div>

              {/* Email Notifications Toggle */}
              <div 
                className="flex items-start justify-between gap-6 p-4 sm:px-6 hover:bg-slate-50/70 transition-colors cursor-pointer" 
                onClick={() => update("emailNotifs", !settings.emailNotifs)}
              >
                <div className="space-y-0.5 pr-2">
                  <Label className="font-bold text-slate-900 text-xs cursor-pointer block">{t("emailNotifs")}</Label>
                  <p className="text-[11px] text-slate-500 font-normal leading-relaxed">{t("emailNotifsDesc")}</p>
                </div>
                <Switch 
                  checked={settings.emailNotifs} 
                  onCheckedChange={(v) => update("emailNotifs", v)} 
                  className="data-[state=checked]:bg-teal-700 shrink-0 mt-0.5" 
                />
              </div>
            </CardContent>
          </Card>

          {/* --- SECTION 2: DISPLAY & LOCALIZATION STANDARDS --- */}
          <Card className="rounded-2xl border border-slate-300/80 bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 shrink-0">
                  <MonitorSmartphone className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">{t("displayTitle")}</CardTitle>
                  <CardDescription className="text-[11px] text-slate-500 mt-0.5">{t("displayDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 p-5 sm:p-6">
              
              {/* Language Selection */}
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label className="font-bold text-slate-800 text-xs">{t("lang")}</Label>
                  <p className="text-[11px] text-slate-500 leading-tight">{t("langDesc")}</p>
                </div>
                <Select value={settings.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 border-slate-300 text-xs font-semibold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
                    <SelectItem value="en" className="font-semibold text-xs cursor-pointer">English (Clinical EN)</SelectItem>
                    <SelectItem value="fil" className="font-semibold text-xs cursor-pointer">Filipino (Tagalog)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Default Landing View */}
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label className="font-bold text-slate-800 text-xs">{t("defaultView")}</Label>
                  <p className="text-[11px] text-slate-500 leading-tight">{t("defaultViewDesc")}</p>
                </div>
                <Select value={settings.defaultView} onValueChange={(v) => update("defaultView", v)}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 border-slate-300 text-xs font-semibold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
                    <SelectItem value="dashboard" className="font-semibold text-xs cursor-pointer">{t("dashboard")}</SelectItem>
                    <SelectItem value="queue" className="font-semibold text-xs cursor-pointer">{t("queue")}</SelectItem>
                    <SelectItem value="appointments" className="font-semibold text-xs cursor-pointer">{t("appointments")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* --- SECTION 3: CONSULTATION DUTY SCHEDULE --- */}
          <Card className="rounded-2xl border border-slate-300/80 bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 shrink-0">
                  <CalendarClock className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">{t("scheduleTitle")}</CardTitle>
                  <CardDescription className="text-[11px] text-slate-500 mt-0.5">{t("scheduleDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              
              {/* Working Duty Hours */}
              <div className="space-y-2.5">
                <div className="space-y-0.5">
                  <Label className="font-bold text-slate-800 text-xs uppercase tracking-wider">{t("workHours")}</Label>
                  <p className="text-[11px] text-slate-500">{t("workHoursDesc")}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  
                  {/* Start Hour Selector */}
                  <div className="w-full sm:flex-1">
                    <Select value={settings.startHour} onValueChange={(v) => update("startHour", v)}>
                      <SelectTrigger className="w-full h-10 rounded-xl bg-white border-slate-300 text-xs font-bold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <SelectValue placeholder="Select Start Time" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[260px] bg-white">
                        <SelectGroup>
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={`start-${slot.value}`} value={slot.value} className="font-medium text-xs cursor-pointer">
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <span className="text-slate-400 font-bold uppercase text-[11px] tracking-wider shrink-0 px-1">
                    {t("to")}
                  </span>
                  
                  {/* End Hour Selector */}
                  <div className="w-full sm:flex-1">
                    <Select value={settings.endHour} onValueChange={(v) => update("endHour", v)}>
                      <SelectTrigger className="w-full h-10 rounded-xl bg-white border-slate-300 text-xs font-bold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <SelectValue placeholder="Select End Time" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[260px] bg-white">
                        <SelectGroup>
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={`end-${slot.value}`} value={slot.value} className="font-medium text-xs cursor-pointer">
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Consultation Duration */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="space-y-0.5">
                  <Label className="font-bold text-slate-800 text-xs uppercase tracking-wider">{t("apptDuration")}</Label>
                  <p className="text-[11px] text-slate-500">{t("apptDurationDesc")}</p>
                </div>
                <Select value={settings.duration} onValueChange={(v) => update("duration", v)}>
                  <SelectTrigger className="w-full sm:w-80 h-10 rounded-xl bg-slate-50 border-slate-300 text-xs font-semibold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
                    <SelectItem value="15" className="font-medium text-xs cursor-pointer">{t("min15")}</SelectItem>
                    <SelectItem value="30" className="font-medium text-xs cursor-pointer">{t("min30")}</SelectItem>
                    <SelectItem value="45" className="font-medium text-xs cursor-pointer">{t("min45")}</SelectItem>
                    <SelectItem value="60" className="font-medium text-xs cursor-pointer">{t("hour1")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Action Footer */}
          <div className="flex justify-end pt-2">
            <Button 
              disabled={isSaving} 
              onClick={handleSave} 
              className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl h-11 px-8 text-xs font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? t("savingBtn") : t("saveBtn")}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}