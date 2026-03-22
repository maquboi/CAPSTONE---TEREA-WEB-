import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Pill,
  Activity,
  Save,
  Loader2,
  CheckCircle2,
  Circle,
  CalendarDays,
  MessageSquare,
  Check,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  
  // Data States
  const [meds, setMeds] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  // Treatment Date States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
      setPatient(profile);
      
      // FIXED: Matched exact Supabase column names
      if (profile?.treatment_start_date) setStartDate(profile.treatment_start_date);
      if (profile?.treatment_end_date) setEndDate(profile.treatment_end_date);

      // 2. Fetch Meds
      const { data: medications } = await supabase.from('medications').select('*').eq('user_id', id);
      setMeds(medications || []);

      // 3. Fetch Appointments
      const { data: appts } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', id)
        .order('appointment_date', { ascending: true });
      setAppointments(appts || []);

      // 4. Fetch Patient Notes
      const { data: patientNotes } = await supabase
        .from('doctor_notes')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      setNotes(patientNotes || []);

    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTreatment = async () => {
    // NEW STRICT GUARD: Prevent saving if dates are empty
    if (!startDate || !endDate) {
      toast({ 
        variant: "destructive", 
        title: "Missing Dates", 
        description: "Please select both a Start Date and an End Date." 
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          // FIXED: Matched exact Supabase column names
          treatment_start_date: startDate,
          treatment_end_date: endDate,
          status: 'active',
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Treatment Updated", description: "Mobile roadmap sync successful." });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAppointment = async (apptId: number) => {
    try {
      await supabase.from('appointments').update({ status: 'completed' }).eq('id', apptId);
      toast({ title: "Appointment Completed" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckNote = async (noteId: number) => {
    try {
      await supabase.from('doctor_notes').update({ is_checked: true }).eq('id', noteId);
      fetchData();
      } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const isUnderTreatment = patient?.status === 'active';

  // --- Roadmap Calculations ---
  let progressPercentage = 0;
  let daysLeft = 180;
  let month = 1;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const passedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24));
    
    daysLeft = totalDays - passedDays;
    if (daysLeft < 0) daysLeft = 0;
    
    progressPercentage = Math.min(Math.max((passedDays / totalDays) * 100, 0), 100);
    month = Math.min(Math.ceil(passedDays / 30) === 0 ? 1 : Math.ceil(passedDays / 30), 6);
  }

  return (
    <DashboardLayout role="doctor" userName="Doctor">
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Patient List
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          
          {/* COLUMN 1: Profile & Notes */}
          <div className="space-y-6 md:col-span-1">
            <Card>
              <CardHeader><CardTitle>Patient Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Name</Label>
                  <p className="text-lg font-bold">{patient?.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Status</Label>
                  <div className="pt-1">
                    <Badge variant={isUnderTreatment ? "default" : "outline"} className={isUnderTreatment ? "bg-green-600" : ""}>
                      {isUnderTreatment ? "Under Treatment" : "Screening / Pending"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {patient?.is_symptomatic && <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">Symptomatic</Badge>}
                  {patient?.is_close_contact && <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">Contact</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Patient Notes / Concerns */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4 text-primary" /> Patient Logs & Concerns</CardTitle></CardHeader>
              <CardContent>
                {notes.filter(n => !n.is_checked).length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No pending concerns.</p>
                ) : (
                  <div className="space-y-3">
                    {notes.filter(n => !n.is_checked).map(note => (
                      <div key={note.id} className="p-3 border rounded-lg bg-muted/30">
                        <div className="flex justify-between items-start mb-1">
                          <Badge variant="outline" className="text-[10px]">{note.category}</Badge>
                          <Button size="icon" variant="ghost" className="h-5 w-5 hover:text-green-600" onClick={() => handleCheckNote(note.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-medium">{note.note_text}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">{new Date(note.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* COLUMN 2 & 3: Management, Roadmap, Appointments, Meds */}
          <div className="space-y-6 md:col-span-2">
            
            {/* Treatment Control */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Timeline Management</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Treatment Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected End Date (6 Mos.)</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleSaveTreatment} className="w-full bg-[#606C38] hover:bg-[#283618]" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {isUnderTreatment ? "Update Dates" : "Initialize Treatment Roadmap"}
                </Button>

                {/* VISUAL ROADMAP (Mirrors Mobile App) */}
                {isUnderTreatment && startDate && (
                  <div className="mt-6 p-4 border rounded-xl bg-slate-50">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h4 className="font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Recovery Progress</h4>
                        <p className="text-xs text-muted-foreground">Month {month} of 6</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{Math.round(progressPercentage)}%</p>
                        <p className="text-xs text-muted-foreground">{daysLeft} days left</p>
                      </div>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointments */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Upcoming Visits</CardTitle></CardHeader>
              <CardContent>
                {appointments.filter(a => a.status !== 'completed').length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No active appointments scheduled.</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.filter(a => a.status !== 'completed').map((appt) => (
                          <TableRow key={appt.id}>
                            <TableCell className="font-medium">
                              {new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time}
                            </TableCell>
                            <TableCell>{appt.location}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleCompleteAppointment(appt.id)}>
                                Mark Done
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medication Adherence Monitor */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /> Medication Adherence</CardTitle></CardHeader>
              <CardContent>
                {meds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-dashed border-2">
                    <Pill className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Patient hasn't logged any medications yet.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Reminder</TableHead>
                          <TableHead className="text-right">Today's Intake</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {meds.map((med) => (
                          <TableRow key={med.id}>
                            <TableCell className="font-semibold text-primary">{med.name}</TableCell>
                            <TableCell>{med.dosage}</TableCell>
                            <TableCell>{med.time}</TableCell>
                            <TableCell className="text-right">
                              {med.is_taken ? 
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Logged
                                </Badge> : 
                                <Badge variant="outline" className="text-muted-foreground">
                                  <Circle className="h-3 w-3 mr-1" /> Not Yet
                                </Badge>
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}