import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Calendar, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast"; 
import { supabase } from "../../lib/supabase";

// --- TYPES ---
interface Appointment {
  id: string | number;
  appointment_date: string; // Assuming your roadmap table uses this column name for dates
  appointment_time: string; // Assuming your roadmap table uses this for times
  location: string | null;
  status: string;
  patient?: {
    full_name: string | null;
  } | null;
}

// --- HELPER FUNCTIONS ---
const getDaysUntil = (dateStr: string) => {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "--:--";
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const getDueBadge = (dateStr: string, status: string) => {
  const s = status?.toLowerCase() || 'scheduled';
  if (s === 'completed') return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Completed</Badge>;
  
  const days = getDaysUntil(dateStr);
  if (days < 0) return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Overdue</Badge>;
  if (days === 0) return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Today</Badge>;
  if (days <= 2) return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Upcoming</Badge>;
  return <Badge variant="outline" className="border-[#DDE5B6] text-[#606C38]">Scheduled</Badge>;
};

export default function FollowUpTracker() {
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [fadingIds, setFadingIds] = useState<Set<string | number>>(new Set());
  const [doctorName, setDoctorName] = useState(""); // Dynamic Doctor Name State

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Doctor Name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
        
      if (profile) setDoctorName(profile.full_name);

      // 2. Fetch Roadmap Data (using exact foreign key syntax from AllPatients)
      const { data, error } = await supabase
        .from('roadmap')
        .select(`
          *,
          patient:profiles!fk_patient(full_name) 
        `)
        .eq('doctor_id', user.id)
        .neq('status', 'completed') // Hide completed items
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      
      // Handle data safety in case patient is an array from the join
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        patient: Array.isArray(item.patient) ? item.patient[0] : item.patient
      }));
      
      setFollowUps(mappedData as unknown as Appointment[]);
    } catch (error) {
      console.error("Supabase Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Updated real-time listener to watch the 'roadmap' table
    const channel = supabase.channel('followup-live').on('postgres_changes', { event: '*', schema: 'public', table: 'roadmap' }, fetchAppointments).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- UNDO LOGIC ---
  const handleUndo = async (id: string | number, item: Appointment) => {
    // 1. Visually restore immediately
    setFollowUps(prev => {
      const restored = [...prev, item];
      // Re-sort by date to keep order correct
      return restored.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
    });

    // 2. Revert DB (Updating 'roadmap' table)
    await supabase.from('roadmap').update({ status: 'scheduled' }).eq('id', id);
    toast({ title: "Restored", description: "Progress item moved back to schedule." });
  };

  const handleCheckDone = async (id: string | number, patientName: string) => {
    // 1. Start Fade
    setFadingIds(prev => new Set(prev).add(id));

    // 2. Find the item before removing it (so we can restore it)
    const itemToRemove = followUps.find(f => f.id === id);

    // 3. Wait 500ms for animation
    setTimeout(async () => {
      if (!itemToRemove) return;

      // Optimistic Remove
      setFollowUps(prev => prev.filter(f => f.id !== id));
      
      // DB Update (Updating 'roadmap' table)
      const { error } = await supabase.from('roadmap').update({ status: 'completed' }).eq('id', id);
      
      if (error) {
        toast({ title: "Error", description: "Update failed", variant: "destructive" });
        fetchAppointments(); // Revert
      } else {
        // --- SHOW UNDO NOTIFICATION ---
        toast({ 
          title: "Marked as Done", 
          description: `${patientName}'s roadmap milestone completed.`,
          duration: 7000, // 7 Seconds
          action: (
            <ToastAction altText="Undo" onClick={() => handleUndo(id, itemToRemove)}>
              Undo
            </ToastAction>
          ),
        });
      }

      // Cleanup fade state
      setFadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 500);
  };

  const filtered = followUps.filter((f) => {
    const pName = f.patient?.full_name || "Unknown";
    const loc = f.location || "";
    return pName.toLowerCase().includes(search.toLowerCase()) || loc.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    overdue: followUps.filter(f => getDaysUntil(f.appointment_date) < 0).length,
    today: followUps.filter(f => getDaysUntil(f.appointment_date) === 0).length,
    upcoming: followUps.filter(f => getDaysUntil(f.appointment_date) > 0).length,
    completed: 0, 
  };

  return (
    <DashboardLayout role="doctor" userName={doctorName || "Doctor"}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3B1E]">Follow-up Tracker</h1>
          <p className="text-[#606C38]/80 font-medium mt-1">Manage and track patient roadmap progress</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3"> 
          <Card className="border-[#DDE5B6] shadow-sm"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-red-50 p-2 rounded-lg"><Calendar className="text-red-600" /></div><div><p className="text-2xl font-bold text-[#2D3B1E]">{stats.overdue}</p><p className="text-sm font-medium text-[#606C38]/80">Overdue</p></div></div></CardContent></Card>
          <Card className="border-[#DDE5B6] shadow-sm"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-amber-50 p-2 rounded-lg"><Calendar className="text-amber-600" /></div><div><p className="text-2xl font-bold text-[#2D3B1E]">{stats.today}</p><p className="text-sm font-medium text-[#606C38]/80">Today</p></div></div></CardContent></Card>
          <Card className="border-[#DDE5B6] shadow-sm"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-green-50 p-2 rounded-lg"><Calendar className="text-green-600" /></div><div><p className="text-2xl font-bold text-[#2D3B1E]">{stats.upcoming}</p><p className="text-sm font-medium text-[#606C38]/80">Upcoming</p></div></div></CardContent></Card>
        </div>

        <Card className="border-[#DDE5B6] shadow-sm">
          <CardHeader className="pb-3 border-b border-[#DDE5B6]/50 bg-[#FEFAE0]/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-[#2D3B1E]">
                <Clock className="h-5 w-5 text-[#606C38]" />
                Roadmap Schedule
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search patients..." className="pl-8 bg-[#FEFAE0]/30 border-[#DDE5B6] focus-visible:ring-[#606C38]" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-10 text-center text-muted-foreground italic">Loading schedule...</div> : (
              <Table>
                <TableHeader className="bg-[#FEFAE0]/50">
                  <TableRow>
                    <TableHead className="w-10 pl-6 text-[#2D3B1E] font-bold">Done</TableHead>
                    <TableHead className="text-[#2D3B1E] font-bold">Patient</TableHead>
                    <TableHead className="text-[#2D3B1E] font-bold">Location</TableHead>
                    <TableHead className="text-[#2D3B1E] font-bold">Date</TableHead>
                    <TableHead className="text-[#2D3B1E] font-bold">Time</TableHead>
                    <TableHead className="text-[#2D3B1E] font-bold">Status</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">No pending roadmap milestones found.</TableCell></TableRow>
                  ) : filtered.map((followUp) => (
                    <TableRow 
                      key={followUp.id}
                      className={`hover:bg-[#FEFAE0]/30 transition-opacity duration-500 ${fadingIds.has(followUp.id) ? 'opacity-0' : 'opacity-100'}`}
                    >
                      <TableCell className="pl-6">
                        <Checkbox 
                          checked={false} 
                          className="border-[#606C38] data-[state=checked]:bg-[#606C38]"
                          onCheckedChange={() => handleCheckDone(followUp.id, followUp.patient?.full_name || "Unknown")} 
                        />
                      </TableCell>
                      <TableCell className="font-bold text-[#2D3B1E]">{followUp.patient?.full_name || "Unknown Patient"}</TableCell>
                      <TableCell className="text-muted-foreground">{followUp.location || "Clinic Visit"}</TableCell>
                      <TableCell className="font-medium">{new Date(followUp.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <Clock className="w-3.5 h-3.5"/> {formatTime(followUp.appointment_time)}
                      </TableCell>
                      <TableCell>{getDueBadge(followUp.appointment_date, followUp.status)}</TableCell>
                      <TableCell className="pr-6"><Button variant="outline" size="sm" className="border-[#DDE5B6] text-[#606C38] hover:bg-[#FEFAE0] hover:text-[#2D3B1E]">View</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}