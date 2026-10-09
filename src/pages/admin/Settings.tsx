import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  AlertCircle, 
  Settings as SettingsIcon, 
  Bell, 
  Globe, 
  ShieldCheck, 
  Database, 
  Lock, 
  Save, 
  Loader2, 
  RefreshCw 
} from "lucide-react";
import { useLanguage } from "./LanguageContext";

const translations = {
  en: {
    pageTitle: "System Configuration & Governance",
    pageSubtitle: "Configure enterprise surveillance parameters, data privacy, and clinical workstation rules",
    notifTitle: "Clinical Notifications & Triage Alerts",
    notifDesc: "Manage real-time dispatch settings for alerts and epidemiological digests",
    emailNotifs: "High-Risk Case Email Alerts",
    emailNotifsDesc: "Dispatch real-time email warnings when high-risk TB cases or adverse events are flagged",
    sysAlerts: "System & Sync Failure Telemetry",
    sysAlertsDesc: "Alert administrators immediately when database sync or API bottlenecks occur",
    weeklyRep: "Weekly Epidemiological Digest",
    weeklyRepDesc: "Receive automated weekly summaries covering caseloads and adherence trends",
    displayTitle: "Regional & Temporal Standards",
    displayDesc: "Configure system language, regional timezones, and temporal formats",
    lang: "Interface Language",
    langDesc: "Set application language across all administrative workstation modules",
    tz: "Clinical Operating Timezone",
    tzDesc: "Timestamp standard for patient intakes, medication logs, and audit trails",
    dataPrivacy: "Data Governance & Health Record Privacy",
    dataPrivacyDesc: "Set automated archiving, cloud snapshots, and statutory record retention",
    autoBackup: "Automated Daily Registry Snapshots",
    autoBackupDesc: "Execute scheduled daily backups of all patient profiles, roadmaps, and bacteriological logs",
    dataRet: "Clinical Record Retention Policy",
    dataRetDesc: "Minimum duration inactive patient records are preserved before permanent archival",
    securityTitle: "Workstation Security & Access Policy",
    securityDesc: "Configure idle timeout durations and clinician session termination thresholds",
    sessionTimeout: "Session Inactivity Timeout",
    sessionTimeoutDesc: "Automatically log out inactive administrator workstations to protect patient privacy",
    saveBtn: "Save All Preferences",
    successTitle: "Preferences Successfully Updated",
    successDesc: "System settings and workstation policies have been committed."
  },
  fil: {
    pageTitle: "Mga Setting at Pamamahala ng Sistema",
    pageSubtitle: "I-configure ang mga parameter ng surveillance, privacy ng datos, at mga patakaran sa klinika",
    notifTitle: "Mga Abiso at Alerto sa Klinika",
    notifDesc: "Pamahalaan ang mga real-time na abiso para sa mga alerto at ulat sa kalusugan",
    emailNotifs: "Email Alerto para sa High-Risk Cases",
    emailNotifsDesc: "Magpadala ng alerto sa email kapag may bagong high-risk na pasyente ng TB",
    sysAlerts: "Mga Alerto sa Error ng Sistema",
    sysAlertsDesc: "Maging alerto agad kapag nagkaroon ng error sa database o koneksyon",
    weeklyRep: "Lingguhang Ulat sa Kalusugan",
    weeklyRepDesc: "Makatanggap ng lingguhang buod ng mga kaso at pagsunod sa gamot",
    displayTitle: "Wika at Pamantayang Panrehiyon",
    displayDesc: "I-configure ang wika ng sistema at lokal na timezone",
    lang: "Wika ng Sistema",
    langDesc: "Piliin ang wikang gagamitin sa buong administrative workstation",
    tz: "Timezone ng Klinika",
    tzDesc: "Pamantayan sa oras para sa mga talaan ng pasyente at pag-inom ng gamot",
    dataPrivacy: "Pamamahala ng Datos at Privacy",
    dataPrivacyDesc: "Itakda ang awtomatikong backup at tagal ng pagtatago ng medikal na rekord",
    autoBackup: "Araw-araw na Backup ng Talaan",
    autoBackupDesc: "Awtomatikong kopyahin ang mga medikal na rekord araw-araw",
    dataRet: "Patakaran sa Pagpapanatili ng Datos",
    dataRetDesc: "Gaano katagal itatago ang mga rekord bago i-archive",
    securityTitle: "Seguridad at Patakaran sa Pag-access",
    securityDesc: "Itakda ang tagal ng idle time bago awtomatikong mag-sign out ang workstation",
    sessionTimeout: "Awtomatikong Sign-Out kapag Walang Aktibidad",
    sessionTimeoutDesc: "Protektahan ang datos ng pasyente sa pamamagitan ng pag-sign out sa mga idle na computer",
    saveBtn: "I-save ang Lahat ng Setting",
    successTitle: "Matagumpay na Na-save ang mga Setting",
    successDesc: "Na-update at naka-sync na ang lahat ng kagustuhan sa sistema."
  }
};

export default function AdminSettings() {
  const { language: globalLang, setLanguage } = useLanguage();

  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  const [adminName, setAdminName] = useState("System Admin");
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    emailNotifs: true,
    systemAlerts: true,
    weeklyReports: false,
    language: globalLang || "en",
    timezone: "asia-manila",
    autoBackup: true,
    dataRetention: "5years",
    sessionTimeout: "30min",
  });

  // Fetch authenticated admin details
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.full_name) {
          setAdminName(profile.full_name.replace(/^(dr\.?\s*)+/i, "").trim() || "System Admin");
        }
      } catch (e) {
        console.error("Failed to load admin profile in settings:", e);
      }
    };

    fetchAdminProfile();
  }, []);

  // Load saved settings from persistent storage
  useEffect(() => {
    const saved = localStorage.getItem("adminSystemSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...parsed, language: parsed.language || globalLang });
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
  }, [globalLang]);

  const update = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

  const currentLang = (settings.language as 'en' | 'fil') || 'en';
  const t = (key: keyof typeof translations.en) => translations[currentLang][key] || translations.en[key];

  // Save settings, sync global language, and record an audit log
  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("adminSystemSettings", JSON.stringify(settings));

      // Global language synchronization
      setLanguage(settings.language as 'en' | 'fil');

      // Audit Trail
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          action_name: "Updated System Settings",
          user_name: adminName,
          target_entity: "System Configuration",
          category: "Administration",
          severity: "info",
          metadata: {
            language: settings.language,
            timezone: settings.timezone,
            dataRetention: settings.dataRetention,
            sessionTimeout: settings.sessionTimeout,
            emailNotifs: settings.emailNotifs,
            autoBackup: settings.autoBackup,
          }
        });
      }

      triggerAlert(t("successTitle"), t("successDesc"), "success");
    } catch (e) {
      console.error("Error saving settings:", e);
      triggerAlert("Error", "Failed to commit settings configuration.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin" userName={adminName}>
      
      {/* Centralized Notification Modal */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({ ...alert, open })}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            alert.type === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
          }`}>
            {alert.type === 'success' ? (
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-rose-600" />
            )}
          </div>
          <h2 className="text-base font-bold text-slate-900">{alert.title}</h2>
          <p className="text-slate-500 mt-1.5 text-xs leading-relaxed">{alert.message}</p>
          <Button 
            className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 shadow-xs" 
            onClick={() => setAlert({ ...alert, open: false })}
          >
            Acknowledge
          </Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in font-sans pb-10">
        
        {/* --- HEADER COMMAND STRIP --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                <SettingsIcon className="h-3 w-3" />
                City Health Office • System Control Panel
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {t("pageTitle")}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {t("pageSubtitle")}
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold text-xs h-10 px-5 shadow-xs shrink-0"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("saveBtn")}
          </Button>
        </div>

        {/* --- SETTINGS CARDS STACK --- */}
        <div className="space-y-6">
          
          {/* 1. Clinical Notifications & Triage Alerts */}
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">{t("notifTitle")}</CardTitle>
                  <CardDescription className="text-xs text-slate-500">{t("notifDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-start justify-between gap-6 pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800">{t("emailNotifs")}</Label>
                  <p className="text-[11px] text-slate-500">{t("emailNotifsDesc")}</p>
                </div>
                <Switch 
                  checked={settings.emailNotifs} 
                  onCheckedChange={(v) => update("emailNotifs", v)} 
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              <div className="flex items-start justify-between gap-6 pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800">{t("sysAlerts")}</Label>
                  <p className="text-[11px] text-slate-500">{t("sysAlertsDesc")}</p>
                </div>
                <Switch 
                  checked={settings.systemAlerts} 
                  onCheckedChange={(v) => update("systemAlerts", v)} 
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800">{t("weeklyRep")}</Label>
                  <p className="text-[11px] text-slate-500">{t("weeklyRepDesc")}</p>
                </div>
                <Switch 
                  checked={settings.weeklyReports} 
                  onCheckedChange={(v) => update("weeklyReports", v)} 
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Regional & Temporal Standards */}
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">{t("displayTitle")}</CardTitle>
                  <CardDescription className="text-xs text-slate-500">{t("displayDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2 pt-5">
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800">{t("lang")}</Label>
                  <p className="text-[11px] text-slate-500">{t("langDesc")}</p>
                </div>
                <Select value={settings.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800 focus:ring-indigo-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    <SelectItem value="en" className="text-xs font-medium">English (United States)</SelectItem>
                    <SelectItem value="fil" className="text-xs font-medium">Filipino (Tagalog)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800">{t("tz")}</Label>
                  <p className="text-[11px] text-slate-500">{t("tzDesc")}</p>
                </div>
                <Select value={settings.timezone} onValueChange={(v) => update("timezone", v)}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800 focus:ring-indigo-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    <SelectItem value="asia-manila" className="text-xs font-medium">Asia/Manila (PST, UTC+08:00)</SelectItem>
                    <SelectItem value="utc" className="text-xs font-medium">Coordinated Universal Time (UTC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 3. Data Governance & Health Record Privacy */}
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">{t("dataPrivacy")}</CardTitle>
                  <CardDescription className="text-xs text-slate-500">{t("dataPrivacyDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2 pt-5">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800">{t("autoBackup")}</Label>
                  <p className="text-[11px] text-slate-500">{t("autoBackupDesc")}</p>
                </div>
                <Switch 
                  checked={settings.autoBackup} 
                  onCheckedChange={(v) => update("autoBackup", v)} 
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800">{t("dataRet")}</Label>
                  <p className="text-[11px] text-slate-500">{t("dataRetDesc")}</p>
                </div>
                <Select value={settings.dataRetention} onValueChange={(v) => update("dataRetention", v)}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800 focus:ring-indigo-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    <SelectItem value="3years" className="text-xs font-medium">3 Years (Statutory Minimum)</SelectItem>
                    <SelectItem value="5years" className="text-xs font-medium">5 Years (DOH TB Standard)</SelectItem>
                    <SelectItem value="10years" className="text-xs font-medium">10 Years (Extended Clinical Archives)</SelectItem>
                    <SelectItem value="permanent" className="text-xs font-medium">Permanent Retention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 4. Workstation Security & Access Policy */}
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">{t("securityTitle")}</CardTitle>
                  <CardDescription className="text-xs text-slate-500">{t("securityDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2 pt-5">
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800">{t("sessionTimeout")}</Label>
                  <p className="text-[11px] text-slate-500">{t("sessionTimeoutDesc")}</p>
                </div>
                <Select value={settings.sessionTimeout} onValueChange={(v) => update("sessionTimeout", v)}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800 focus:ring-indigo-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    <SelectItem value="15min" className="text-xs font-medium">15 Minutes (High Security)</SelectItem>
                    <SelectItem value="30min" className="text-xs font-medium">30 Minutes (Recommended)</SelectItem>
                    <SelectItem value="1hour" className="text-xs font-medium">1 Hour</SelectItem>
                    <SelectItem value="4hours" className="text-xs font-medium">4 Hours (Full Shift)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col justify-center space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Compliance Audit Status
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  DPA 2012 & Healthcare Privacy Standard Ready
                </p>
                <p className="text-[10px] text-slate-400">
                  All administrative adjustments trigger automated entries in the immutable system audit log.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Button Footer */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold text-xs h-11 px-6 shadow-xs"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("saveBtn")}
            </Button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}