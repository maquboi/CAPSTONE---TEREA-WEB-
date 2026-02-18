import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { PatientQueueTable } from "@/components/dashboard/PatientQueueTable";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { Button } from "@/components/ui/button"; 
import { useToast } from "@/hooks/use-toast"; 
import { 
  Users, 
  AlertTriangle, 
  CalendarCheck, 
  Activity,
  Copy,       
  Check,      
  QrCode      
} from "lucide-react";

export default function DoctorDashboard() {
  const { toast } = useToast();
  const [doctorData, setDoctorData] = useState({ name: "", id: "", clinicCode: "LOADING..." });
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    highRisk: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false); 

  // Helper to fetch counts from database
  const updateStats = async (userId: string) => {
    try {
      // UPDATED: Added patient_id to handle potential duplicates
      const { data: connections, error } = await supabase
        .from('connections')
        .select('patient_id, status, profiles!fk_patient (risk_level)')
        .eq('doctor_id', userId);

      if (error) {
        console.error("Dashboard Stats Error:", error.message);
        return;
      }

      if (connections) {
        // FIX: Deduplicate patients (in case of double-request glitch)
        const uniquePatients = new Set();
        const active = connections.filter(c => {
          if (c.status === 'active') {
            if (uniquePatients.has(c.patient_id)) return false;
            uniquePatients.add(c.patient_id);
            return true;
          }
          return false;
        });
        
        const activeCount = active.length;
        const pendingCount = connections.filter(c => c.status === 'pending').length;
        
        const highRiskCount = active.filter(c => {
          const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
          return profile?.risk_level?.toLowerCase().includes('high');
        }).length;

        setStats({
          totalPatients: activeCount,
          pendingRequests: pendingCount,
          highRisk: highRiskCount,
        });
      }
    } catch (err) {
      console.error("System Error:", err);
    }
  };

  useEffect(() => {
    let channel: any;

    const initDashboard = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch 'clinic_code' alongside name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, clinic_code')
        .eq('id', user.id)
        .single();
      
      const fullName = profile?.full_name || "Doctor";
      const code = profile?.clinic_code || user.id.slice(0, 8).toUpperCase();

      setDoctorData({ name: fullName, id: user.id, clinicCode: code });

      // 2. Load Stats
      await updateStats(user.id);

      // 3. Listen for real-time mobile connections
      channel = supabase
        .channel('dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => {
          updateStats(user.id);
        })
        .subscribe();
      
      setLoading(false);
    };

    initDashboard();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const handleCopyCode = () => {
    if (!doctorData.clinicCode) return;
    navigator.clipboard.writeText(doctorData.clinicCode);
    setCopied(true);
    toast({
      title: "Clinical Code Copied!",
      description: `Share code "${doctorData.clinicCode}" with your patients.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout role="doctor" userName={doctorData.name}>
      <div className="space-y-6 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Good morning, Dr. {doctorData.name.split(' ')[0] || "..."}
            </h1>
            <p className="text-muted-foreground">
              Here's what needs your attention today
            </p>
          </div>

          {/* Clinical Code Display */}
          {!loading && (
            <div className="flex items-center gap-3 bg-white border border-gray-200 p-2 pr-4 pl-4 rounded-xl shadow-sm">
              <div className="bg-primary/10 p-2 rounded-lg">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Your Clinical Code</span>
                <span className="font-mono text-lg font-bold text-gray-800 select-all tracking-wide">
                  {doctorData.clinicCode}
                </span>
              </div>
              <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-8 gap-2 text-primary hover:text-primary hover:bg-primary/10"
                onClick={handleCopyCode}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="My Patients"
            value={stats.totalPatients.toString()}
            description="Currently assigned"
            icon={Users}
          />
          <StatCard
            title="High-Risk Queue"
            value={stats.highRisk.toString()}
            description="Awaiting review"
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            title="New Requests"
            value={stats.pendingRequests.toString()}
            description="Pending approval"
            icon={CalendarCheck}
            variant="primary"
          />
          <StatCard
            title="System Activity"
            value="Active"
            description="Live Sync"
            icon={Activity}
            variant="warning"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PatientQueueTable search="" riskFilter="all" statusFilter="all" />
          </div>
          <div>
            <RecentActivityCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}