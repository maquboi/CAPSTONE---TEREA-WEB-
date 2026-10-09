import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { PatientQueueTable } from "@/components/dashboard/PatientQueueTable";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import {
  Users,
  AlertTriangle,
  CalendarCheck,
  Copy,
  Check,
  CheckCircle,
  AlertCircle,
  QrCode,
  RefreshCw,
  Calendar,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { useLanguage } from "../admin/LanguageContext";
import { QRCodeSVG } from "qrcode.react";

const translations = {
  en: {
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    station: "General Overview",
    attention: "Real-time clinical queue, patient adherence tracking, and intake surveillance.",
    clinicalCode: "Clinic Handshake Code",
    copy: "Copy",
    copied: "Copied",
    codeCopiedTitle: "Clinic Code Copied",
    codeCopiedDesc: "Share this code with your patient to connect their mobile app:",
    myPatients: "Active Caseload",
    priorityQueue: "Priority Review Queue",
    newRequests: "Verification Requests",
    loading: "LOADING...",
    okBtn: "Acknowledge",
    error: "Error",
    copyFailed: "Failed to copy code",
    showQR: "View QR Code",
    scanQR: "Ask the patient to scan this QR code within their TEREA mobile app to link accounts immediately.",
    activeSubtitle: "Enrolled in active therapy",
    prioritySubtitle: "Adverse effects or high risk",
    pendingSubtitle: "Mobile connection requests",
  },
  fil: {
    goodMorning: "Magandang umaga",
    goodAfternoon: "Magandang hapon",
    goodEvening: "Magandang gabi",
    station: "Carmona Health Center • TB-DOTS Istasyon ng Klinika",
    attention: "Real-time na talaan ng pasyente, pagsubaybay sa gamot, at mga bagong intake.",
    clinicalCode: "Clinic Handshake Code",
    copy: "Kopyahin",
    copied: "Nakopya",
    codeCopiedTitle: "Nakopya ang Clinic Code",
    codeCopiedDesc: "Ibahagi ang code na ito sa pasyente upang maikonekta ang kanilang mobile app:",
    myPatients: "Aktibong Pasyente",
    priorityQueue: "Pila ng Prayoridad",
    newRequests: "Mga Bagong Request",
    loading: "KINAKARGA...",
    okBtn: "Naiintindihan",
    error: "Error",
    copyFailed: "Hindi nakopya ang code",
    showQR: "Tingnan ang QR Code",
    scanQR: "Ipascan ito sa pasyente gamit ang kanilang TEREA app upang mabilis na maikonekta ang talaan.",
    activeSubtitle: "Kasalukuyang umiinom ng gamot",
    prioritySubtitle: "May side effect o mataas ang risk",
    pendingSubtitle: "Naghihintay ng kumpirmasyon",
  },
};

export default function DoctorDashboard() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations.en) =>
    translations[language as "en" | "fil"][key] || translations.en[key];

  // Centralized Alert State
  const [alert, setAlert] = useState({
    open: false,
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  const triggerAlert = (
    title: string,
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setAlert({ open: true, title, message, type });
  };

  const [doctorData, setDoctorData] = useState({
    name: "",
    id: "",
    clinicCode: t("loading"),
  });
  const [stats, setStats] = useState({
    totalPatients: 0,
    highRisk: 0,
    pendingRequests: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning");
    if (hour < 18) return t("goodAfternoon");
    return t("goodEvening");
  }, [language]);

  // Formatted current date stamp
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(language === "fil" ? "fil-PH" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [language]);

  const updateStats = async (userId: string) => {
    try {
      const { data: connections, error } = await supabase
        .from("connections")
        .select("patient_id, status, profiles!fk_patient (risk_level)")
        .eq("doctor_id", userId);

      if (error) throw error;

      if (connections) {
        const uniqueActive = new Set();
        const active = connections.filter((c) => {
          if (c.status === "active") {
            if (uniqueActive.has(c.patient_id)) return false;
            uniqueActive.add(c.patient_id);
            return true;
          }
          return false;
        });

        const uniquePending = new Set();
        const pendingCount = connections.filter((c) => {
          if (c.status === "pending") {
            if (uniquePending.has(c.patient_id)) return false;
            uniquePending.add(c.patient_id);
            return true;
          }
          return false;
        }).length;

        const activeCount = active.length;
        const highRiskCount = active.filter((c) => {
          const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
          const risk = profile?.risk_level?.toLowerCase() || "";
          return (
            risk.includes("high") ||
            risk.includes("priority") ||
            risk.includes("mataas")
          );
        }).length;

        setStats({
          totalPatients: activeCount,
          pendingRequests: pendingCount,
          highRisk: highRiskCount,
        });
      }
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
    }
  };

  const fetchRecentActivities = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("doctor_id", userId)
        .order("timestamp", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (err) {
      console.error("Activity Fetch Error:", err);
    }
  };

  const refreshAll = async () => {
    if (!doctorData.id) return;
    setIsRefreshing(true);
    await Promise.all([
      updateStats(doctorData.id),
      fetchRecentActivities(doctorData.id),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    let channel: any;

    const initDashboard = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, clinic_code")
        .eq("id", user.id)
        .single();

      const fullName = profile?.full_name || "Doctor";
      const code = profile?.clinic_code || user.id.slice(0, 8).toUpperCase();

      setDoctorData({ name: fullName, id: user.id, clinicCode: code });

      await Promise.all([updateStats(user.id), fetchRecentActivities(user.id)]);

      // REALTIME LISTENER
      channel = supabase
        .channel(`dashboard-sync-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "connections",
            filter: `doctor_id=eq.${user.id}`,
          },
          () => {
            updateStats(user.id);
            fetchRecentActivities(user.id);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activity_logs",
            filter: `doctor_id=eq.${user.id}`,
          },
          () => fetchRecentActivities(user.id)
        )
        .subscribe();

      setLoading(false);
    };

    initDashboard();

    const handleLocalUpdate = () => {
      if (doctorData.id) {
        updateStats(doctorData.id);
        fetchRecentActivities(doctorData.id);
      }
    };
    window.addEventListener("connectionUpdated", handleLocalUpdate);

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener("connectionUpdated", handleLocalUpdate);
    };
  }, [doctorData.id]);

  const handleCopyCode = async () => {
    const textToCopy = doctorData.clinicCode;
    if (!textToCopy || textToCopy === t("loading")) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      triggerAlert(
        t("codeCopiedTitle"),
        `${t("codeCopiedDesc")} ${textToCopy}`,
        "success"
      );
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        setCopied(true);
        triggerAlert(
          t("codeCopiedTitle"),
          `${t("codeCopiedDesc")} ${textToCopy}`,
          "success"
        );
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Copy failed:", fallbackErr);
        triggerAlert(t("error"), t("copyFailed"), "error");
      }
    }
  };

  const cleanDocName = doctorData.name
    ? `Dr. ${doctorData.name.replace(/^(dr\.?\s*)+/i, "").trim()}`
    : "Dr. Attending Physician";

  return (
    <DashboardLayout role="doctor" userName={doctorData.name}>
      {/* Centralized Notification Modal */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({ ...alert, open })}>
        <DialogPortal>
          <DialogOverlay className="bg-slate-900/40 backdrop-blur-xs" />
          <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
            <div
              className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3.5 ${
                alert.type === "success"
                  ? "bg-teal-50 border border-teal-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {alert.type === "success" ? (
                <CheckCircle className="h-6 w-6 text-teal-700" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900">{alert.title}</h2>
            <p className="text-slate-500 mt-1.5 text-xs leading-relaxed">{alert.message}</p>
            <Button
              className="mt-5 w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs h-10 shadow-xs"
              onClick={() => setAlert({ ...alert, open: false })}
            >
              {t("okBtn")}
            </Button>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* QR Code Handshake Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogPortal>
          <DialogOverlay className="bg-slate-900/40 backdrop-blur-xs" />
          <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
            <div className="flex items-center justify-center gap-2 mb-1">
              <QrCode className="h-4 w-4 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">{t("clinicalCode")}</h2>
            </div>
            <p className="text-slate-500 text-xs mb-5 max-w-xs mx-auto leading-relaxed">
              {t("scanQR")}
            </p>

            <div className="flex justify-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mx-auto w-fit">
              {doctorData.clinicCode !== t("loading") && (
                <QRCodeSVG
                  value={doctorData.clinicCode}
                  size={190}
                  level="H"
                  fgColor="#0F172A"
                />
              )}
            </div>

            <div className="mt-5 font-mono text-2xl font-extrabold tracking-widest text-teal-800 bg-teal-50 border border-teal-200/80 py-2.5 rounded-xl">
              {doctorData.clinicCode}
            </div>

            <Button
              className="mt-5 w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs h-10"
              onClick={() => setShowQR(false)}
            >
              Close Window
            </Button>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <div className="space-y-6">
        
        {/* --- CLINICAL DESK COMMAND HEADER --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
                {t("station")}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {todayFormatted}
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {greeting}, {cleanDocName}
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              {t("attention")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Quick Live Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 text-xs font-semibold px-3.5"
              title="Refresh Queue"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-700" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Clinician Handshake Pairing Container */}
            {!loading && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl p-1.5 shadow-2xs flex-1 lg:flex-none justify-between lg:justify-start">
                <div className="flex flex-col pl-2.5 pr-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    {t("clinicalCode")}
                  </span>
                  <span className="font-mono text-sm font-black text-teal-800 tracking-wider">
                    {doctorData.clinicCode}
                  </span>
                </div>

                <div className="h-6 w-[1px] bg-slate-200" />

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-teal-700 hover:bg-teal-50 rounded-lg"
                    onClick={() => setShowQR(true)}
                    title={t("showQR")}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
                    onClick={handleCopyCode}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-teal-700" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>{copied ? t("copied") : t("copy")}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- METRIC KPI SUMMARY CARDS --- */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <StatCard
            title={t("myPatients")}
            value={stats.totalPatients.toString()}
            icon={Users}
            variant="default"
            badge="Active"
            subtitle={t("activeSubtitle")}
          />
          <StatCard
            title={t("priorityQueue")}
            value={stats.highRisk.toString()}
            icon={AlertTriangle}
            variant="danger"
            badge={stats.highRisk > 0 ? "Requires Action" : "Clear"}
            subtitle={t("prioritySubtitle")}
          />
          <StatCard
            title={t("newRequests")}
            value={stats.pendingRequests.toString()}
            icon={CalendarCheck}
            variant="primary"
            badge={stats.pendingRequests > 0 ? "Pending Approval" : "Up to date"}
            subtitle={t("pendingSubtitle")}
          />
        </div>

        {/* --- MAIN CLINICAL WORKSTATION TABLE & RECENT ACTIVITY --- */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PatientQueueTable search="" riskFilter="all" statusFilter="all" />
          </div>
          <div>
            <RecentActivityCard activities={recentActivities} />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}