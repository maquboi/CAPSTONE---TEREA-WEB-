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
  TrendingUp,
  AlertCircle,
  Plus,
  Wand2,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prescribing, setPrescribing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  
  const [meds, setMeds] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [newMed, setNewMed] = useState({ name: "", dosage: "", time: "08:00", start: "", end: "" });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profileErr) throw profileErr;
      setPatient(profile);
      
      if (profile?.treatment_start_date) setStartDate(profile.treatment_start_date);
      if (profile?.treatment_end_date) setEndDate(profile.treatment_end_date);

      const { data: medications } = await supabase.from('medications').select('*').eq('user_id', id);
      setMeds(medications || []);

      const { data: appts } = await supabase
        .from('roadmap')
        .select('*')
        .eq('patient_id', id)
        .order('appointment_date', { ascending: true });
      setAppointments(appts || []);

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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({ 
          treatment_start_date: startDate, 
          treatment_end_date: endDate 
        })
        .eq('id', id)
        .select();

      if (profileError) throw profileError;
      
      if (!profileData || profileData.length === 0) {
        throw new Error("Profile update failed. Verify RLS policies and Patient ID.");
      }

      const { error: connError } = await supabase
        .from('connections')
        .update({ status: 'active' })
        .eq('patient_id', id);

      if (connError) throw connError;

      toast({ 
        title: "Success", 
        description: "Treatment activated. Roadmap is now synced to patient's phone." 
      });
      
      fetchData(); 
    } catch (err: any) {
      console.error("Critical Sync Error:", err);
      toast({ 
        variant: "destructive", 
        title: "Sync Failed", 
        description: err.message 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateProtocol = async () => {
    if (!startDate) {
      toast({ 
        variant: "destructive", 
        title: "Start Date Required", 
        description: "Please set and save the Treatment Start Date first to calculate milestones." 
      });
      return;
    }

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const start = new Date(startDate);

      const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
      };

      const protocolMilestones = [
        {
          patient_id: id,
          doctor_id: user?.id,
          title: "End of Intensive Phase Sputum Test",
          location: "TB DOTS Clinic",
          appointment_date: addDays(start, 60), 
          status: "pending",
          type: "protocol"
        },
        {
          patient_id: id,
          doctor_id: user?.id,
          title: "Month 5 Sputum Follow-up",
          location: "TB DOTS Clinic",
          appointment_date: addDays(start, 150), 
          status: "pending",
          type: "protocol"
        },
        {
          patient_id: id,
          doctor_id: user?.id,
          title: "Final Sputum & Cure Assessment",
          location: "TB DOTS Clinic",
          appointment_date: addDays(start, 180), 
          status: "pending",
          type: "protocol"
        }
      ];

      const { error } = await supabase.from('roadmap').insert(protocolMilestones);
      if (error) throw error;

      toast({ 
        title: "Protocol Generated", 
        description: "DOH 6-Month Milestones successfully added to roadmap." 
      });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Generation Failed", description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleAddPrescription = async () => {
    if (!newMed.name || !newMed.dosage || !newMed.time || !newMed.start || !newMed.end) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all medication details." });
      return;
    }
    
    // Format 24h time to 12h AM/PM for the mobile app UI
    let formattedTime = newMed.time;
    if (newMed.time.includes(":")) {
      const [h, m] = newMed.time.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 || 12;
      formattedTime = `${formattedHour.toString().padStart(2, '0')}:${m} ${ampm}`;
    }

    setPrescribing(true);
    try {
      const { error } = await supabase.from('medications').insert({
        user_id: id,
        name: newMed.name,
        dosage: newMed.dosage,
        time: formattedTime,
        start_date: newMed.start,
        end_date: newMed.end,
        is_taken: false
      });

      if (error) throw error;
      
      toast({ title: "Prescription Added", description: "Medication pushed to patient's diary." });
      setNewMed({ name: "", dosage: "", time: "08:00", start: "", end: "" });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setPrescribing(false);
    }
  };

  const handleDeletePrescription = async (medId: number) => {
    try {
      const { error } = await supabase.from('medications').delete().eq('id', medId);
      if (error) throw error;
      toast({ title: "Prescription Removed", description: "Updated on patient's diary." });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleCompleteAppointment = async (apptId: number) => {
    try {
      await supabase.from('roadmap').update({ status: 'completed' }).eq('id', apptId);
      toast({ title: "Milestone Completed" });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleCheckNote = async (noteId: number) => {
    try {
      await supabase.from('doctor_notes').update({ is_checked: true }).eq('id', noteId);
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[#606C38]" /></div>;

  const totalMeds = meds.length;
  const takenMeds = meds.filter(m => m.is_taken).length;
  const adherenceRate = totalMeds > 0 ? (takenMeds / totalMeds) * 100 : 0;

  let timeProgress = 0;
  let daysLeft = 0;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const totalDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const elapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24));
    timeProgress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    daysLeft = Math.max(totalDuration - elapsed, 0);
  }

  const isVerified = patient?.status === 'active';

  return (
    <DashboardLayout role="doctor" userName="Doctor">
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-[#606C38] hover:bg-[#FEFAE0]">
          <ArrowLeft className="h-4 w-4" /> Back to Patient List
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          
          <div className="space-y-6 md:col-span-1">
            <Card className="border-t-4 border-t-[#606C38] shadow-sm">
              <CardHeader><CardTitle className="text-[#2D3B1E]">Patient Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</Label>
                  <p className="text-lg font-bold text-[#2D3B1E]">{patient?.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Account Status</Label>
                  <div className="pt-1">
                    <Badge variant={isVerified ? "default" : "outline"} className={isVerified ? "bg-[#606C38]" : "text-amber-600 border-amber-200 bg-amber-50"}>
                      {isVerified ? "Verified Patient" : "Pending Verification"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {patient?.is_symptomatic && <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">Symptomatic</Badge>}
                  {patient?.is_close_contact && <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">Close Contact</Badge>}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-[#DDE5B6]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-[#2D3B1E]"><MessageSquare className="h-4 w-4 text-[#606C38]" /> Patient Reports</CardTitle></CardHeader>
              <CardContent>
                {notes.filter(n => !n.is_checked).length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No reported concerns.</p>
                ) : (
                  <div className="space-y-3">
                    {notes.filter(n => !n.is_checked).map(note => (
                      <div key={note.id} className="p-3 border border-[#DDE5B6] rounded-lg bg-[#FEFAE0]/30">
                        <div className="flex justify-between items-start mb-1">
                          <Badge variant="outline" className="text-[10px] bg-white text-[#606C38] border-[#DDE5B6]">{note.category}</Badge>
                          <Button size="icon" variant="ghost" className="h-5 w-5 hover:text-green-600" onClick={() => handleCheckNote(note.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-medium text-[#2D3B1E]">{note.note_text}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">{new Date(note.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 md:col-span-2">
            <Card className="border-none shadow-md bg-[#FEFAE0]/50">
              <CardHeader><CardTitle className="flex items-center gap-2 text-[#2D3B1E]"><Activity className="h-5 w-5 text-[#606C38]" /> Roadmap Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[#2D3B1E] font-semibold">Treatment Start Date</Label>
                    <Input type="date" className="bg-white border-[#DDE5B6]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#2D3B1E] font-semibold">Treatment End Date</Label>
                    <Input type="date" className="bg-white border-[#DDE5B6]" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSaveTreatment} className="w-full bg-[#606C38] hover:bg-[#2D3B1E] text-white" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save & Sync Dates
                  </Button>
                  
                  <Button onClick={handleGenerateProtocol} variant="outline" className="w-full border-[#606C38] text-[#606C38] hover:bg-[#FEFAE0]" disabled={generating || !startDate}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                    Auto-Generate TB Protocol
                  </Button>
                </div>

                {startDate && endDate && (
                  <div className="mt-4 p-5 rounded-2xl bg-white border border-[#DDE5B6] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 text-[#606C38]">
                        <TrendingUp className="h-4 w-4" />
                        <h4 className="font-bold text-[#2D3B1E]">Real-time Roadmap Progress</h4>
                      </div>
                      <Badge variant="secondary" className="bg-[#FEFAE0] text-[#606C38]">
                        {daysLeft} days remaining
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-semibold uppercase text-muted-foreground">
                          <span>Treatment Progress</span>
                          <span className="text-[#2D3B1E]">{Math.round(timeProgress)}%</span>
                        </div>
                        <Progress value={timeProgress} className="h-2 bg-slate-100" />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1 font-semibold uppercase text-muted-foreground">
                          <span>Adherence Rate</span>
                          <span className={adherenceRate < 80 ? "text-amber-600" : "text-[#606C38]"}>
                            {Math.round(adherenceRate)}%
                          </span>
                        </div>
                        <Progress value={adherenceRate} className={`h-2 ${adherenceRate < 80 ? "bg-amber-100" : "bg-[#FEFAE0]"}`} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2">
               <Card className="shadow-sm border-[#DDE5B6]">
                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2 text-[#2D3B1E]"><CalendarDays className="h-4 w-4 text-[#606C38]" /> Roadmap Milestones</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {appointments.length === 0 ? (
                        <TableRow><TableCell className="text-center italic py-6 text-muted-foreground">No milestones.</TableCell></TableRow>
                      ) : appointments.filter(a => a.status !== 'completed').map((appt) => (
                        <TableRow key={appt.id} className="hover:bg-[#FEFAE0]/30">
                          <TableCell className="py-3 px-2">
                            <p className="text-sm font-bold text-[#2D3B1E]">
                              {appt.title || 'Follow-up'}
                            </p>
                            <div className="flex items-center mt-1">
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(appt.appointment_date).toLocaleDateString()} • {appt.location}
                              </p>
                              {appt.type === 'protocol' && (
                                <Badge variant="outline" className="ml-2 text-[8px] h-4 px-1 border-[#606C38] text-[#606C38]">
                                  DOH Protocol
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-3 px-2">
                            <Button size="sm" variant="ghost" className="h-8 text-[#606C38]" onClick={() => handleCompleteAppointment(appt.id)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-[#DDE5B6]">
                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2 text-[#2D3B1E]"><Pill className="h-4 w-4 text-[#606C38]" /> Active Prescriptions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Doctor's Prescribe Form */}
                  <div className="p-3 bg-[#FEFAE0]/40 rounded-xl border border-[#DDE5B6] space-y-3">
                    <p className="text-xs font-bold text-[#606C38] uppercase">New Prescription</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Meds Name" className="h-8 text-xs bg-white col-span-2" value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} />
                      <Input placeholder="Dosage (500mg)" className="h-8 text-xs bg-white" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} />
                      <Input type="time" className="h-8 text-xs bg-white" value={newMed.time} onChange={(e) => setNewMed({...newMed, time: e.target.value})} />
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <Input type="date" className="h-8 text-xs bg-white" value={newMed.start} onChange={(e) => setNewMed({...newMed, start: e.target.value})} />
                        <Input type="date" className="h-8 text-xs bg-white" value={newMed.end} onChange={(e) => setNewMed({...newMed, end: e.target.value})} />
                      </div>
                    </div>
                    <Button onClick={handleAddPrescription} size="sm" className="w-full h-8 bg-[#606C38]" disabled={prescribing}>
                      {prescribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />} Push to Patient App
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {meds.length === 0 ? (
                       <p className="text-center text-xs text-muted-foreground py-4 italic">No active prescriptions.</p>
                    ) : meds.map((med) => (
                      <div key={med.id} className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-[#2D3B1E]">{med.name} <span className="font-normal text-muted-foreground">({med.dosage})</span></p>
                          <p className="text-[10px] text-muted-foreground">{new Date(med.start_date).toLocaleDateString()} - {new Date(med.end_date).toLocaleDateString()} • {med.time}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {med.is_taken ? <Check className="h-4 w-4 text-[#606C38] mr-1" /> : <Circle className="h-4 w-4 text-slate-300 mr-1" />}
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeletePrescription(med.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}