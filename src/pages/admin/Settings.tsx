import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "./LanguageContext";

// Translation Dictionary to make the Language setting functional
const translations = {
  en: {
    pageTitle: "Settings",
    pageSubtitle: "Manage system preferences",
    notifTitle: "Notifications",
    notifDesc: "Configure notification preferences",
    emailNotifs: "Email Notifications",
    emailNotifsDesc: "Receive email alerts for critical events",
    sysAlerts: "System Alerts",
    sysAlertsDesc: "Get notified about system errors",
    weeklyRep: "Weekly Reports",
    weeklyRepDesc: "Receive weekly summary reports",
    displayTitle: "Display",
    displayDesc: "Customize your display settings",
    lang: "Language",
    langDesc: "Select your preferred language",
    tz: "Timezone",
    tzDesc: "Set your local timezone",
    dataPrivacy: "Data & Privacy",
    dataPrivacyDesc: "Manage data settings",
    autoBackup: "Auto-backup",
    autoBackupDesc: "Automatically backup data daily",
    dataRet: "Data Retention",
    dataRetDesc: "How long to keep inactive records",
    saveBtn: "Save All Settings",
    successTitle: "Settings saved",
    successDesc: "Your preferences have been updated."
  },
  fil: {
    pageTitle: "Mga Setting",
    pageSubtitle: "Pamahalaan ang mga kagustuhan ng sistema",
    notifTitle: "Mga Abiso",
    notifDesc: "I-configure ang mga kagustuhan sa abiso",
    emailNotifs: "Mga Abiso sa Email",
    emailNotifsDesc: "Makatanggap ng mga alerto para sa mga kritikal na kaganapan",
    sysAlerts: "Mga Alerto ng Sistema",
    sysAlertsDesc: "Maging alerto tungkol sa mga error ng sistema",
    weeklyRep: "Lingguhang Ulat",
    weeklyRepDesc: "Makatanggap ng lingguhang buod ng ulat",
    displayTitle: "Display",
    displayDesc: "I-customize ang iyong mga setting sa display",
    lang: "Wika",
    langDesc: "Piliin ang iyong gustong wika",
    tz: "Timezone",
    tzDesc: "I-set ang iyong lokal na timezone",
    dataPrivacy: "Datos at Privacy",
    dataPrivacyDesc: "Pamahalaan ang mga setting ng datos",
    autoBackup: "Auto-backup",
    autoBackupDesc: "Awtomatikong i-backup ang datos araw-araw",
    dataRet: "Pagpapanatili ng Datos",
    dataRetDesc: "Kung gaano katagal itatago ang mga inaktibong rekord",
    saveBtn: "I-save ang Lahat ng Setting",
    successTitle: "Na-save ang mga setting",
    successDesc: "Na-update na ang iyong mga kagustuhan."
  }
};

export default function AdminSettings() {
  // Pull the global setLanguage function and current state from our Context
  const { language: globalLang, setLanguage } = useLanguage();

  // Centralized Alert State
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  const [settings, setSettings] = useState({
    emailNotifs: true, systemAlerts: true, weeklyReports: false,
    language: globalLang, // Initialize with global language
    timezone: "asia-manila",
    autoBackup: true, dataRetention: "1year",
  });

  // 1. Load saved settings when the page opens
  useEffect(() => {
    const savedSettings = localStorage.getItem("adminSystemSettings");
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

  // Translator function based on current language state
  const currentLang = settings.language as 'en' | 'fil';
  const t = (key: keyof typeof translations.en) => translations[currentLang][key] || translations.en[key];

  // 2. Save settings to localStorage and trigger global sync
  const handleSave = () => {
    localStorage.setItem("adminSystemSettings", JSON.stringify(settings));
    
    // Broadcast the change to every page in the application instantly
    setLanguage(settings.language as 'en' | 'fil');
    
    // Trigger the centralized pop-up with translated text
    triggerAlert(t("successTitle"), t("successDesc"), "success");
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      
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

      <div className="account-page mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <h1 className="dashboard-title text-2xl font-semibold tracking-tight">{t("pageTitle")}</h1>
          <p className="dashboard-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="space-y-6">
          <Card className="dashboard-surface rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">{t("notifTitle")}</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">{t("notifDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label>{t("emailNotifs")}</Label>
                  <p className="text-sm text-[#2D3B1E]/65">{t("emailNotifsDesc")}</p>
                </div>
                <Switch checked={settings.emailNotifs} onCheckedChange={(v) => update("emailNotifs", v)} />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label>{t("sysAlerts")}</Label>
                  <p className="text-sm text-[#2D3B1E]/65">{t("sysAlertsDesc")}</p>
                </div>
                <Switch checked={settings.systemAlerts} onCheckedChange={(v) => update("systemAlerts", v)} />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label>{t("weeklyRep")}</Label>
                  <p className="text-sm text-[#2D3B1E]/65">{t("weeklyRepDesc")}</p>
                </div>
                <Switch checked={settings.weeklyReports} onCheckedChange={(v) => update("weeklyReports", v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-surface rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">{t("displayTitle")}</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">{t("displayDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <Label>{t("lang")}</Label>
                  <p className="text-sm text-[#2D3B1E]/65">{t("langDesc")}</p>
                </div>
                <Select value={settings.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fil">Filipino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <Label>{t("tz")}</Label>
                  <p className="text-sm text-[#2D3B1E]/65">{t("tzDesc")}</p>
                </div>
                <Select value={settings.timezone} onValueChange={(v) => update("timezone", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia-manila">Asia/Manila</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-surface rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">{t("dataPrivacy")}</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">{t("dataPrivacyDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label>{t("autoBackup")}</Label>
                  <p className="text-sm text-[#2D3B1E]/65">{t("autoBackupDesc")}</p>
                </div>
                <Switch checked={settings.autoBackup} onCheckedChange={(v) => update("autoBackup", v)} />
              </div>
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <Label>{t("dataRet")}</Label>
                  <p className="text-sm text-[#2D3B1E]/65">{t("dataRetDesc")}</p>
                </div>
                <Select value={settings.dataRetention} onValueChange={(v) => update("dataRetention", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="2years">2 Years</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white">
              {t("saveBtn")}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}