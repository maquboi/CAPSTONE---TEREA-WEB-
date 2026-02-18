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
  appointment_date: string;
  appointment_time: string;
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
  if (s === 'completed') return <Badge className="bg-status-success">Completed</Badge>;
  
  const days = getDaysUntil(dateStr);
  if (days < 0) return <Badge className="bg-status-danger">Overdue</Badge>;
  if (days === 0) return <Badge className="bg-status-warning text-black">Today</Badge>;
  if (days <= 2) return <Badge className="bg-primary">Upcoming</Badge>;
  return <Badge variant="secondary">Scheduled</Badge>;
};

export default function FollowUpTracker() {
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [fadingIds, setFadingIds] = useState<Set<string | number>>(new Set());

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:profiles!fk_appointment_user(full_name) 
        `)
        .eq('doctor_id', user.id)
        .neq('status', 'completed') // Hide completed items
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setFollowUps(data as unknown as Appointment[] || []);
    } catch (error) {
      console.error("Supabase Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const channel = supabase.channel('followup-live').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments).subscribe();
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

    // 2. Revert DB
    await supabase.from('appointments').update({ status: 'scheduled' }).eq('id', id);
    toast({ title: "Restored", description: "Appointment moved back to schedule." });
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
      
      // DB Update
      const { error } = await supabase.from('appointments').update({ status: 'completed' }).eq('id', id);
      
      if (error) {
        toast({ title: "Error", description: "Update failed", variant: "destructive" });
        fetchAppointments(); // Revert
      } else {
        // --- SHOW UNDO NOTIFICATION ---
        toast({ 
          title: "Marked as Done", 
          description: `${patientName}'s visit completed.`,
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
    <DashboardLayout role="doctor" userName="Dr. Maria Santos">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Follow-up Tracker</h1>
          <p className="text-muted-foreground">Manage upcoming patient visits</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3"> 
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-status-danger/10 p-2 rounded-lg"><Calendar className="text-status-danger" /></div><div><p className="text-2xl font-semibold">{stats.overdue}</p><p className="text-sm text-muted-foreground">Overdue</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-status-warning/10 p-2 rounded-lg"><Calendar className="text-status-warning" /></div><div><p className="text-2xl font-semibold">{stats.today}</p><p className="text-sm text-muted-foreground">Today</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="bg-primary/10 p-2 rounded-lg"><Calendar className="text-primary" /></div><div><p className="text-2xl font-semibold">{stats.upcoming}</p><p className="text-sm text-muted-foreground">Upcoming</p></div></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Follow-up Schedule</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search patients..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="p-8 text-center text-muted-foreground">Loading schedule...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Done</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No pending appointments found.</TableCell></TableRow>
                  ) : filtered.map((followUp) => (
                    <TableRow 
                      key={followUp.id}
                      className={`transition-opacity duration-500 ${fadingIds.has(followUp.id) ? 'opacity-0' : 'opacity-100'}`}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={false} 
                          onCheckedChange={() => handleCheckDone(followUp.id, followUp.patient?.full_name || "Unknown")} 
                        />
                      </TableCell>
                      <TableCell className="font-medium">{followUp.patient?.full_name || "Unknown Patient"}</TableCell>
                      <TableCell className="text-muted-foreground">{followUp.location || "Clinic Visit"}</TableCell>
                      <TableCell>{new Date(followUp.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell className="flex items-center gap-1 text-muted-foreground font-medium">
                        <Clock className="w-3 h-3"/> {formatTime(followUp.appointment_time)}
                      </TableCell>
                      <TableCell>{getDueBadge(followUp.appointment_date, followUp.status)}</TableCell>
                      <TableCell><Button variant="outline" size="sm">View</Button></TableCell>
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