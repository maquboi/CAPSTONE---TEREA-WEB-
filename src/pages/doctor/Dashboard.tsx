import { useEffect, useState } from "react";
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
  QrCode // Added QrCode icon
} from "lucide-react";
import { useLanguage } from "../admin/LanguageContext";
import { QRCodeSVG } from "qrcode.react"; // Imported QRCode generator

const translations = {
  en: {
    goodMorning: "Good morning",
    attention: "Here's what needs your attention today",
    clinicalCode: "Your Clinical Code",
    copy: "Copy",
    copied: "Copied",
    codeCopiedTitle: "Clinical Code Copied!",
    codeCopiedDesc: "Code:",
    myPatients: "My Patients",
    highRiskQueue: "High-Risk Queue",
    newRequests: "New Requests",
    loading: "LOADING...",
    okBtn: "Okay",
    error: "Error",
    copyFailed: "Failed to copy code",
    showQR: "QR Code",
    scanQR: "Ask the patient to scan this code with their TEREA app to connect instantly."
  },
  fil: {
    goodMorning: "Magandang umaga",
    attention: "Narito ang mga kailangan ng iyong pansin ngayon",
    clinicalCode: "Ang Iyong Clinical Code",
    copy: "Kopyahin",
    copied: "Nakopya",
    codeCopiedTitle: "Nakopya ang Clinical Code!",
    codeCopiedDesc: "Code:",
    myPatients: "Aking Pasyente",
    highRiskQueue: "Pila ng Mataas na Panganib",
    newRequests: "Mga Bagong Request",
    loading: "KINAKARGA...",
    okBtn: "Okay",
    error: "Error",
    copyFailed: "Hindi nakopya ang code",
    showQR: "QR Code",
    scanQR: "Ipascan ito sa pasyente gamit ang kanilang TEREA app para mabilis na kumonekta."
  }
};

export default function DoctorDashboard() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations.en) => translations[language as 'en' | 'fil'][key] || translations.en[key];

  // Centralized Alert State
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  const [doctorData, setDoctorData] = useState({ name: "", id: "", clinicCode: t("loading") });
  const [stats, setStats] = useState({ totalPatients: 0, highRisk: 0, pendingRequests: 0 });
  const [recentActivities, setRecentActivities] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false); 
  const [showQR, setShowQR] = useState(false); // State for QR Code modal

  const updateStats = async (userId: string) => {
    try {
      const { data: connections, error } = await supabase
        .from('connections')
        .select('patient_id, status, profiles!fk_patient (risk_level)')
        .eq('doctor_id', userId);

      if (error) throw error;

      if (connections) {
        const uniqueActive = new Set();
        const active = connections.filter(c => {
          if (c.status === 'active') {
            if (uniqueActive.has(c.patient_id)) return false;
            uniqueActive.add(c.patient_id);
            return true;
          }
          return false;
        });

        const uniquePending = new Set();
        const pendingCount = connections.filter(c => {
          if (c.status === 'pending') {
            if (uniquePending.has(c.patient_id)) return false;
            uniquePending.add(c.patient_id);
            return true;
          }
          return false;
        }).length;
        
        const activeCount = active.length;
        const highRiskCount = active.filter(c => {
          const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
          return profile?.risk_level?.toLowerCase().includes('high');
        }).length;

        setStats({ totalPatients: activeCount, pendingRequests: pendingCount, highRisk: highRiskCount });
      }
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
    }
  };

  const fetchRecentActivities = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('doctor_id', userId) 
        .order('timestamp', { ascending: false })
        .limit(5); 

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (err) {
      console.error("Activity Fetch Error:", err);
    }
  };

  useEffect(() => {
    let channel: any;

    const initDashboard = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, clinic_code')
        .eq('id', user.id)
        .single();
      
      const fullName = profile?.full_name || "Doctor";
      const code = profile?.clinic_code || user.id.slice(0, 8).toUpperCase();

      setDoctorData({ name: fullName, id: user.id, clinicCode: code });

      await Promise.all([updateStats(user.id), fetchRecentActivities(user.id)]);

      channel = supabase
        .channel('dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => updateStats(user.id))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => fetchRecentActivities(user.id))
        .subscribe();
      
      setLoading(false);
    };

    initDashboard();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const handleCopyCode = async () => {
    const textToCopy = doctorData.clinicCode;
    if (!textToCopy || textToCopy === t("loading")) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      triggerAlert(t("codeCopiedTitle"), `${t("codeCopiedDesc")} ${textToCopy}`, "success");
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
        triggerAlert(t("codeCopiedTitle"), `${t("codeCopiedDesc")} ${textToCopy}`, "success");
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Copy failed:", fallbackErr);
        triggerAlert(t("error"), t("copyFailed"), "error");
      }
    }
  };

  return (
    <DashboardLayout role="doctor" userName={doctorData.name}>

      {/* Centralized Notification Pop-up with Portal for guaranteed visibility */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
          <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{alert.title}</h2>
            <p className="text-slate-500 mt-2 text-sm">{alert.message}</p>
            <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white" onClick={() => setAlert({...alert, open: false})}>{t("okBtn")}</Button>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* NEW: QR Code Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
          <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
            <h2 className="text-xl font-bold text-[#2D3B1E] mb-2">{t("clinicalCode")}</h2>
            <p className="text-slate-500 text-sm mb-8">{t("scanQR")}</p>

            <div className="flex justify-center bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm mx-auto w-fit">
              {doctorData.clinicCode !== t("loading") && (
                <QRCodeSVG 
                  value={doctorData.clinicCode} 
                  size={200} 
                  level="H" 
                  fgColor="#2D3B1E" 
                />
              )}
            </div>

            <div className="mt-8 font-mono text-3xl font-extrabold tracking-widest text-[#606C38]">
              {doctorData.clinicCode}
            </div>

            <Button className="mt-8 w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold" onClick={() => setShowQR(false)}>
              Close
            </Button>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3B1E]">
              {t("goodMorning")}, Dr. {doctorData.name.split(' ')[0] || "..."}
            </h1>
            <p className="text-[#606C38]/80 font-medium mt-1">
              {t("attention")}
            </p>
          </div>

          {!loading && (
            <div className="dashboard-surface flex items-center gap-3 rounded-xl border-[#DDE5B6] p-2 pr-2">
              <div className="flex flex-col pl-2">
                <span className="text-[10px] uppercase font-bold text-[#606C38]/70 tracking-wider">{t("clinicalCode")}</span>
                <span className="font-mono text-lg font-bold text-[#2D3B1E] tracking-wide">{doctorData.clinicCode}</span>
              </div>
              <div className="h-8 w-[1px] bg-[#DDE5B6] mx-1"></div>
              
              {/* QR Code Button */}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#606C38] hover:bg-[#606C38]/10" onClick={() => setShowQR(true)} title={t("showQR")}>
                <QrCode className="h-4 w-4" />
              </Button>
              
              {/* Copy Button */}
              <Button variant="ghost" size="sm" className="h-8 gap-2 pr-3 pl-2 text-[#606C38] hover:bg-[#606C38]/10" onClick={handleCopyCode}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("copied") : t("copy")}
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title={t("myPatients")} value={stats.totalPatients.toString()} icon={Users} />
          <StatCard title={t("highRiskQueue")} value={stats.highRisk.toString()} icon={AlertTriangle} variant="danger" />
          <StatCard title={t("newRequests")} value={stats.pendingRequests.toString()} icon={CalendarCheck} variant="primary" />
        </div>

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