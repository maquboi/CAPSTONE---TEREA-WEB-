import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { PatientQueueTable } from "@/components/dashboard/PatientQueueTable";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard"; // Ensure this path matches the file created above
import { Button } from "@/components/ui/button"; 
import { useToast } from "@/hooks/use-toast"; 
import { 
  Users, 
  AlertTriangle, 
  CalendarCheck, 
  Copy,       
  Check       
} from "lucide-react";

export default function DoctorDashboard() {
  const { toast } = useToast();
  const [doctorData, setDoctorData] = useState({ name: "", id: "", clinicCode: "LOADING..." });
  const [stats, setStats] = useState({ totalPatients: 0, highRisk: 0, pendingRequests: 0 });
  const [recentActivities, setRecentActivities] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false); 

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

  const handleCopyCode = () => {
    if (!doctorData.clinicCode) return;
    navigator.clipboard.writeText(doctorData.clinicCode);
    setCopied(true);
    toast({ title: "Clinical Code Copied!", description: `Code: ${doctorData.clinicCode}` });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout role="doctor" userName={doctorData.name}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3B1E]">
              Good morning, Dr. {doctorData.name.split(' ')[0] || "..."}
            </h1>
            <p className="text-[#606C38]/80 font-medium mt-1">
              Here's what needs your attention today
            </p>
          </div>

          {!loading && (
            <div className="flex items-center gap-3 bg-white border border-[#DDE5B6] p-2 pr-4 rounded-xl shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#606C38]/70 tracking-wider">Your Clinical Code</span>
                <span className="font-mono text-lg font-bold text-[#2D3B1E] tracking-wide">{doctorData.clinicCode}</span>
              </div>
              <div className="h-8 w-[1px] bg-[#DDE5B6] mx-2"></div>
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-[#606C38]" onClick={handleCopyCode}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="My Patients" value={stats.totalPatients.toString()} icon={Users} />
          <StatCard title="High-Risk Queue" value={stats.highRisk.toString()} icon={AlertTriangle} variant="danger" />
          <StatCard title="New Requests" value={stats.pendingRequests.toString()} icon={CalendarCheck} variant="primary" />
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