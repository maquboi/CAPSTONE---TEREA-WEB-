import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { useLanguage } from "./LanguageContext";
import { 
  Users, AlertTriangle, FileText, Shield, Loader2, ActivitySquare, CheckCircle2, Headset, Archive, Calendar, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

const PIE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#94A3B8', '#0EA5E9'];

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState("System Admin");
  
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    highRiskCases: 0,
    mediumRiskCases: 0,
    lowRiskCases: 0,
    pendingVerifications: 0,
    curedCases: 0,
    assessmentsCompleted: 0, 
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Time-aware greeting for Admin
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return language === "fil" ? "Magandang umaga" : "Good Morning";
    if (hour < 18) return language === "fil" ? "Magandang hapon" : "Good Afternoon";
    return language === "fil" ? "Magandang gabi" : "Good Evening";
  }, [language]);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(language === "fil" ? "fil-PH" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [language]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/'); 
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile?.role === 'admin') {
        setIsAdmin(true);
        // Strips any doctor prefix if present
        if (profile.full_name) {
          setAdminName(profile.full_name.replace(/^(dr\.?\s*)+/i, "").trim() || "System Admin");
        }
        
        await fetchDashboardStats();
      } else {
        navigate(profile?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard');
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const { data: patients, error: patientErr } = await supabase
        .from('profiles')
        .select('id, risk_level, verification_status, status')
        .eq('role', 'patient');

      if (!patientErr && patients) {
        const total = patients.length;
        
        let high = 0, medium = 0, low = 0, pending = 0, curedCount = 0;

        patients.forEach((p: any) => {
          if (p.status === 'cured' || p.status === 'treatment_completed') {
            curedCount++;
          } else {
            const risk = p.risk_level?.toLowerCase() || '';
            if (risk.includes('high')) high++;
            else if (risk.includes('medium') || risk.includes('mod')) medium++;
            else if (risk.includes('low')) low++;

            if (p.verification_status === 'Pending') pending++;
          }
        });

        setDashboardStats({
          totalPatients: total,
          highRiskCases: high,
          mediumRiskCases: medium,
          lowRiskCases: low,
          pendingVerifications: pending,
          curedCases: curedCount,
          assessmentsCompleted: total 
        });
      }

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);
        
      if (logs) setRecentActivities(logs);

    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    await fetchDashboardStats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) return null; 

  const riskDistributionData = [
    { name: t("highRiskLabel" as any) || 'High Risk', value: dashboardStats.highRiskCases },
    { name: t("mediumRiskLabel" as any) || 'Medium Risk', value: dashboardStats.mediumRiskCases },
    { name: t("lowRiskLabel" as any) || 'Low Risk', value: dashboardStats.lowRiskCases },
    { name: t("unassessedLabel" as any) || 'Unassessed', value: Math.max(0, dashboardStats.totalPatients - (dashboardStats.highRiskCases + dashboardStats.mediumRiskCases + dashboardStats.lowRiskCases + dashboardStats.curedCases)) },
    { name: t("curedLabel" as any) || 'Cured & Discharged', value: dashboardStats.curedCases }
  ].filter(d => d.value > 0);

  return (
    <DashboardLayout role="admin" userName={adminName}>
      <div className="space-y-6 animate-fade-in font-sans">
        
        {/* --- SYSTEM ADMIN COMMAND HEADER --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                City Health Office • System Administration Console
              </span>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {todayFormatted}
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {greeting}, {adminName}
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              City-wide TB surveillance telemetry, institutional user registries, and system health status.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 text-xs font-semibold px-3.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
              <span>Refresh Telemetry</span>
            </Button>
          </div>
        </div>

        {/* --- 5-COLUMN ADMIN METRIC CARDS --- */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard 
            title={t("totalPatients")} 
            value={dashboardStats.totalPatients.toString()} 
            subtitle="Registered in TEREA"
            icon={Users} 
            variant="default"
          />
          <StatCard 
            title={t("assessmentsCompleted")} 
            value={dashboardStats.assessmentsCompleted.toString()} 
            subtitle="Triage Screenings Logged"
            icon={ActivitySquare} 
            variant="primary"
          />
          <StatCard 
            title="Cured & Discharged" 
            value={dashboardStats.curedCases.toString()} 
            subtitle="Completed Full Care"
            icon={Archive} 
            variant="default"
          />
          <StatCard 
            title={t("pendingVerifications")} 
            value={dashboardStats.pendingVerifications.toString()} 
            subtitle="Awaiting Verification"
            icon={CheckCircle2} 
            variant="warning"
          />
          <StatCard 
            title={t("highRiskCases")} 
            value={dashboardStats.highRiskCases.toString()} 
            subtitle="Clinical Priority Flag"
            icon={AlertTriangle} 
            variant="danger" 
          />
        </div>

        {/* --- VISUAL RISK DISTRIBUTION SECTION --- */}
        <div className="grid gap-4 grid-cols-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{t("riskDistribution")}</h3>
                <p className="text-xs text-slate-500">City-wide patient risk categorizations</p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                Live Aggregation
              </span>
            </div>

            <div className="flex-1 min-h-[300px]">
              {riskDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs italic py-16">
                  {t("noData")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- QUICK ACTIONS & RECENT ACTIVITY --- */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 px-1">{t("quickActions")}</h3>
            
            <QuickActionCard 
              icon={FileText} 
              title={t("genReport")} 
              description={t("genReportDesc")} 
              onClick={() => navigate("/admin/reports")} 
            />
            <QuickActionCard 
              icon={Users} 
              title={t("userMgmt")} 
              description={t("userMgmtDesc")} 
              onClick={() => navigate("/admin/users")} 
            />
            <QuickActionCard 
              icon={Shield} 
              title="System Error & Audit Logs" 
              description="Inspect server errors and trace user audits" 
              onClick={() => navigate("/admin/error-logs")} 
            />
            <QuickActionCard 
              icon={Headset} 
              title="IT Support & Inquiries" 
              description="Review incoming system help requests" 
              onClick={() => navigate("/admin/support")} 
            />
          </div>

          <div className="lg:col-span-2">
            <RecentActivityCard activities={recentActivities} />
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionCard({ 
  icon: Icon, 
  title, 
  description, 
  onClick 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick} 
      className="bg-white flex w-full items-start gap-4 rounded-2xl border border-slate-200/90 p-4 text-left transition-all duration-200 hover:border-indigo-400 hover:shadow-xs group shadow-2xs"
    >
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
        <Icon className="h-5 w-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
      </div>
      <div>
        <p className="font-bold text-xs text-slate-900 group-hover:text-indigo-900 transition-colors">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{description}</p>
      </div>
    </button>
  );
}