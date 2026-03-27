import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { 
  Users, AlertTriangle, TrendingUp, Calendar, FileText, Shield, Loader2
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState("Admin User");
  
  // Real dynamic stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    highRiskCases: 0,
    followUpRate: "0%",
    appointmentsToday: 0
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
        
        // Fetch the live dashboard data once confirmed as admin
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
      // 1. Fetch Patients & High Risk Cases
      const { data: patients, error: patientErr } = await supabase
        .from('profiles')
        .select('id, risk_level')
        .eq('role', 'patient');

      if (!patientErr && patients) {
        const total = patients.length;
        const highRisk = patients.filter(p => p.risk_level?.toLowerCase().includes('high')).length;
        
        setDashboardStats(prev => ({
          ...prev,
          totalPatients: total,
          highRiskCases: highRisk
        }));
      }

      // 2. Fetch Appointments Today
      const today = new Date().toISOString().split('T')[0];
      const { count: apptsToday, error: apptErr } = await supabase
        .from('roadmap')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today);

      if (!apptErr && apptsToday !== null) {
        setDashboardStats(prev => ({ ...prev, appointmentsToday: apptsToday }));
      }

      // 3. Calculate Follow-up Rate (Completed / Total Appointments)
      const { data: roadmapData, error: roadErr } = await supabase
        .from('roadmap')
        .select('status');

      if (!roadErr && roadmapData && roadmapData.length > 0) {
        const completed = roadmapData.filter(r => r.status === 'completed').length;
        const rate = Math.round((completed / roadmapData.length) * 100);
        setDashboardStats(prev => ({ ...prev, followUpRate: `${rate}%` }));
      }

      // Optional: Fetch recent admin activities here if your table supports it
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
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#606C38]" />
      </div>
    );
  }

  if (!isAdmin) return null; 

  return (
    <DashboardLayout role="admin" userName={adminName}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#2D3B1E]">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Overview of TB risk assessments across the system</p>
        </div>

        {/* Live Data Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Patients" 
            value={dashboardStats.totalPatients.toString()} 
            description="Active in system" 
            icon={Users} 
            trend={{ value: 12, isPositive: true }} 
          />
          <StatCard 
            title="High-Risk Cases" 
            value={dashboardStats.highRiskCases.toString()} 
            description="Requires attention" 
            icon={AlertTriangle} 
            variant="danger" 
            trend={{ value: 8, isPositive: false }} 
          />
          <StatCard 
            title="Follow-up Rate" 
            value={dashboardStats.followUpRate} 
            description="Completion rate" 
            icon={TrendingUp} 
            variant="primary" 
            trend={{ value: 3, isPositive: true }} 
          />
          <StatCard 
            title="Appointments Today" 
            value={dashboardStats.appointmentsToday.toString()} 
            description="Scheduled checkups" 
            icon={Calendar} 
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2"><HeatmapCard /></div>
          <div>
            <RecentActivityCard activities={recentActivities} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard 
            icon={FileText} 
            title="Generate Monthly Report" 
            description="Export TB trend report for DOH compliance" 
            onClick={() => navigate("/admin/reports")} 
          />
          <QuickActionCard 
            icon={Users} 
            title="User Management" 
            description="Add, remove, or modify user accounts" 
            onClick={() => navigate("/admin/users")} 
          />
          <QuickActionCard 
            icon={Shield} 
            title="View Audit Logs" 
            description="Review system actions and changes" 
            onClick={() => navigate("/admin/audit-logs")} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionCard({ icon: Icon, title, description, onClick }: { icon: React.ElementType; title: string; description: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="flex items-start gap-4 rounded-xl border border-[#DDE5B6] bg-white p-4 text-left transition-all duration-200 hover:shadow-md hover:border-[#606C38]/50 w-full"
    >
      <div className="rounded-lg bg-[#FEFAE0] p-2.5">
        <Icon className="h-5 w-5 text-[#606C38]" />
      </div>
      <div>
        <p className="font-bold text-[#2D3B1E]">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}