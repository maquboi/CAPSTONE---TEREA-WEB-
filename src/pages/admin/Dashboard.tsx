import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { 
  Users, AlertTriangle, FileText, Shield, Loader2, ActivitySquare, CheckCircle2
} from "lucide-react";
// Import charting components
import { 
  PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#94a3b8']; // Red, Amber, Green, Slate

export default function AdminDashboard() {
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
        .select('id, risk_level, verification_status')
        .eq('role', 'patient');

      if (!patientErr && patients) {
        const total = patients.length;
        
        let high = 0, medium = 0, low = 0, pending = 0;

        patients.forEach(p => {
          const risk = p.risk_level?.toLowerCase() || '';
          if (risk.includes('high')) high++;
          else if (risk.includes('medium')) medium++;
          else if (risk.includes('low')) low++;

          if (p.verification_status === 'Pending') pending++;
        });

        setDashboardStats({
          totalPatients: total,
          highRiskCases: high,
          mediumRiskCases: medium,
          lowRiskCases: low,
          pendingVerifications: pending,
          assessmentsCompleted: total // Assumes all registered patients complete the 12-question assessment
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

  // Data for Pie Chart
  const riskDistributionData = [
    { name: 'High Risk', value: dashboardStats.highRiskCases },
    { name: 'Medium Risk', value: dashboardStats.mediumRiskCases },
    { name: 'Low Risk', value: dashboardStats.lowRiskCases },
    { name: 'Unassessed', value: dashboardStats.totalPatients - (dashboardStats.highRiskCases + dashboardStats.mediumRiskCases + dashboardStats.lowRiskCases) }
  ].filter(d => d.value > 0);

  return (
    <DashboardLayout role="admin" userName={adminName}>
      <div className="space-y-6 animate-fade-in font-sans">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of system utilization and demographic risk assessments</p>
        </div>

        {/* Top-Level Metrics - 4 Columns */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Registered Patients" 
            value={dashboardStats.totalPatients.toString()} 
            description="Active in system" 
            icon={Users} 
            trend={{ value: 12, isPositive: true }} 
          />
          <StatCard 
            title="Assessments Completed" 
            value={dashboardStats.assessmentsCompleted.toString()} 
            description="12-question screenings" 
            icon={ActivitySquare} 
            trend={{ value: 5, isPositive: true }} 
          />
          <StatCard 
            title="Pending Verifications" 
            value={dashboardStats.pendingVerifications.toString()} 
            description="Requires admin review" 
            icon={CheckCircle2} 
          />
          <StatCard 
            title="High-Risk Cases" 
            value={dashboardStats.highRiskCases.toString()} 
            description="Requires immediate action" 
            icon={AlertTriangle} 
            variant="danger" 
            trend={{ value: 8, isPositive: false }} 
          />
        </div>

        {/* Visual Analytics Section */}
        <div className="grid gap-4 grid-cols-1">
          {/* Risk Distribution Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-semibold text-slate-800 mb-4">Patient Risk Distribution</h3>
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
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Not enough data to display chart</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Quick Actions List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-slate-800 px-1">Quick Actions</h3>
            <QuickActionCard 
              icon={FileText} 
              title="Generate Monthly Report" 
              description="Export TB trend report for DOH compliance" 
              onClick={() => navigate("/admin/reports")} 
            />
            <QuickActionCard 
              icon={Users} 
              title="User Management" 
              description="Review pending verifications and staff accounts" 
              onClick={() => navigate("/admin/users")} 
            />
            <QuickActionCard 
              icon={Shield} 
              title="View Audit Logs" 
              description="Review system actions and security changes" 
              onClick={() => navigate("/admin/audit-logs")} 
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