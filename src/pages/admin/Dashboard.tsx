import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { useLanguage } from "./LanguageContext";
import { 
  Users, AlertTriangle, FileText, Shield, Loader2, ActivitySquare, CheckCircle2, Headset, Archive
} from "lucide-react";
// Import charting components
import { 
  PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#94a3b8', '#3b82f6']; // Red, Amber, Green, Slate, Blue (Cured)

export default function AdminDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState("Admin User");
  
  // Expanded dynamic stats state
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
        if (profile.full_name) setAdminName(profile.full_name);
        
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
      // 1. Fetch Patients & Risk Levels
      const { data: patients, error: patientErr } = await supabase
        .from('profiles')
        .select('id, risk_level, verification_status, status')
        .eq('role', 'patient');

      if (!patientErr && patients) {
        const total = patients.length;
        
        let high = 0, medium = 0, low = 0, pending = 0, curedCount = 0;

        patients.forEach((p: any) => {
          if (p.status === 'cured') {
            curedCount++;
          } else {
            const risk = p.risk_level?.toLowerCase() || '';
            if (risk.includes('high')) high++;
            else if (risk.includes('medium')) medium++;
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

      // Fetch recent admin activities
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

  if (loading) {
    return (
      <div className="dashboard-shell flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#606C38]" />
      </div>
    );
  }

  if (!isAdmin) return null; 

  // Data for Pie Chart updated with Archival Cured Metric
  const riskDistributionData = [
    { name: t("highRiskLabel" as any) || 'High Risk', value: dashboardStats.highRiskCases },
    { name: t("mediumRiskLabel" as any) || 'Medium Risk', value: dashboardStats.mediumRiskCases },
    { name: t("lowRiskLabel" as any) || 'Low Risk', value: dashboardStats.lowRiskCases },
    { name: t("unassessedLabel" as any) || 'Unassessed', value: dashboardStats.totalPatients - (dashboardStats.highRiskCases + dashboardStats.mediumRiskCases + dashboardStats.lowRiskCases + dashboardStats.curedCases) },
    { name: t("curedLabel" as any) || 'Cured & Archived', value: dashboardStats.curedCases }
  ].filter(d => d.value > 0);

  return (
    <DashboardLayout role="admin" userName={adminName}>
      <div className="space-y-6 animate-fade-in font-sans">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("dashboardTitle")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("dashboardSubtitle")}</p>
        </div>

        {/* Top-Level Metrics - 5 Columns */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard 
            title={t("totalPatients")} 
            value={dashboardStats.totalPatients.toString()} 
            description={t("activeInSystem")} 
            icon={Users} 
            trend={{ value: 12, isPositive: true }} 
          />
          <StatCard 
            title={t("assessmentsCompleted")} 
            value={dashboardStats.assessmentsCompleted.toString()} 
            description={t("screenings")} 
            icon={ActivitySquare} 
            trend={{ value: 5, isPositive: true }} 
          />
          <StatCard 
            title={t("curedArchived" as any) || "Cured / Archived"} 
            value={dashboardStats.curedCases.toString()} 
            description="Completed Lifecycle" 
            icon={Archive} 
          />
          <StatCard 
            title={t("pendingVerifications")} 
            value={dashboardStats.pendingVerifications.toString()} 
            description={t("requiresAdmin")} 
            icon={CheckCircle2} 
          />
          <StatCard 
            title={t("highRiskCases")} 
            value={dashboardStats.highRiskCases.toString()} 
            description={t("immediateAction")} 
            icon={AlertTriangle} 
            variant="danger" 
            trend={{ value: 8, isPositive: false }} 
          />
        </div>

        {/* Visual Analytics Section */}
        <div className="grid gap-4 grid-cols-1">
          {/* Risk Distribution Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-semibold text-slate-800 mb-4">{t("riskDistribution")}</h3>
            <div className="flex-1 min-h-[300px]">
              {riskDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
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
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">{t("noData")}</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Quick Actions List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-slate-800 px-1">{t("quickActions")}</h3>
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
              title={t("viewAudit")} 
              description={t("viewAuditDesc")} 
              onClick={() => navigate("/admin/audit-logs")} 
            />
            <QuickActionCard 
              icon={Headset} 
              title={t("support")} 
              description={t("supportDesc")} 
              onClick={() => navigate("/admin/support-tickets")} 
            />
          </div>

          {/* Recent Activity Card */}
          <div className="lg:col-span-2">
            <RecentActivityCard activities={recentActivities} />
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionCard({ icon: Icon, title, description, onClick }: { icon: React.ElementType; title: string; description: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="bg-white flex w-full items-start gap-4 rounded-2xl border border-slate-200 p-4 text-left transition-all duration-200 hover:border-[#606C38] hover:shadow-md group"
    >
      <div className="rounded-xl bg-slate-50 p-3 group-hover:bg-[#606C38]/10 transition-colors">
        <Icon className="h-5 w-5 text-slate-500 group-hover:text-[#606C38] transition-colors" />
      </div>
      <div>
        <p className="font-bold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
    </button>
  );
}