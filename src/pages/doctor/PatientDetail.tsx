import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  Trash2,
  SendHorizontal,
  Stethoscope,
  CheckCircle
} from "lucide-react";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    backBtn: "Back to Patient List",
    patientInfo: "Patient Info",
    fullName: "Full Name",
    treatmentPhase: "Treatment Phase",
    accountStatus: "Account Status",
    verifiedPatient: "Verified Patient",
    pendingVerification: "Pending Verification",
    symptomatic: "Symptomatic",
    closeContact: "Close Contact",
    protocolMemo: "Daily Protocol Memo",
    memoPlaceholder: "Type specific instructions for today's medication intake...",
    pushMemo: "Push Memo to Diary",
    memoSent: "Memo Sent",
    memoSentDesc: "Instructions pushed to patient's diary.",
    memoFailed: "Failed to send memo",
    patientReports: "Patient Reports",
    noConcerns: "No reported concerns.",
    roadmapConfig: "Roadmap Configuration",
    startDate: "Treatment Start Date",
    endDate: "Treatment End Date",
    saveSync: "Save & Sync Dates",
    autoGen: "Auto-Generate TB Protocol",
    milestoneProgress: "Real-time Roadmap Progress",
    daysRemaining: "days remaining",
    progressLabel: "Treatment Progress",
    adherenceLabel: "Adherence Rate",
    milestones: "Roadmap Milestones",
    noMilestones: "No milestones.",
    dohProtocol: "DOH Protocol",
    prescriptions: "Prescriptions",
    newMed: "New Medication",
    medName: "Meds Name",
    dosage: "Dosage (500mg)",
    pushToPatient: "Push to Patient",
    noPrescriptions: "No active prescriptions.",
    missingFields: "Missing Fields",
    missingDates: "Missing Dates",
    missingDatesDesc: "Please select both a Start Date and an End Date.",
    success: "Success",
    treatmentActive: "Treatment activated. Roadmap is now synced.",
    protocolGenerated: "Protocol Generated",
    prescriptionAdded: "Prescription Added",
    prescriptionRemoved: "Prescription Removed",
    milestoneCompleted: "Milestone Completed",
    notStarted: "Not Started",
    intensivePhase: "Intensive Phase",
    continuationPhase: "Continuation Phase",
    error: "Error",
    syncFailed: "Sync Failed"
  },
  fil: {
    backBtn: "Bumalik sa Listahan ng Pasyente",
    patientInfo: "Impormasyon ng Pasyente",
    fullName: "Buong Pangalan",
    treatmentPhase: "Phase ng Gamutan",
    accountStatus: "Katayuan ng Account",
    verifiedPatient: "Na-verify na Pasyente",
    pendingVerification: "Nakabinbing Pag-verify",
    symptomatic: "Symptomatic",
    closeContact: "Close Contact",
    protocolMemo: "Daily Protocol Memo",
    memoPlaceholder: "Mag-type ng espesyal na instruksyon para sa pag-inom ng gamot...",
    pushMemo: "Ipadala ang Memo sa Diary",
    memoSent: "Naipadala ang Memo",
    memoSentDesc: "Naipadala na ang mga instruksyon sa diary ng pasyente.",
    memoFailed: "Nabigong ipadala ang memo",
    patientReports: "Mga Ulat ng Pasyente",
    noConcerns: "Walang mga iniulat na alalahanin.",
    roadmapConfig: "Konpigurasyon ng Roadmap",
    startDate: "Petsa ng Pagsisimula ng Gamutan",
    endDate: "Petsa ng Pagtatapos ng Gamutan",
    saveSync: "I-save at I-sync ang mga Petsa",
    autoGen: "Auto-Generate TB Protocol",
    milestoneProgress: "Progress ng Roadmap",
    daysRemaining: "araw na natitira",
    progressLabel: "Progress ng Gamutan",
    adherenceLabel: "Adherence Rate",
    milestones: "Mga Milestone ng Roadmap",
    noMilestones: "Walang milestones.",
    dohProtocol: "DOH Protocol",
    prescriptions: "Mga Reseta",
    newMed: "Bagong Gamot",
    medName: "Pangalan ng Gamot",
    dosage: "Dosage (500mg)",
    pushToPatient: "Ipadala sa Pasyente",
    noPrescriptions: "Walang aktibong reseta.",
    missingFields: "May kulang na impormasyon",
    missingDates: "Kulang ang Petsa",
    missingDatesDesc: "Pakipili ang parehong petsa ng pagsisimula at pagtatapos.",
    success: "Tagumpay",
    treatmentActive: "Aktibo na ang gamutan. Naka-sync na ang roadmap.",
    protocolGenerated: "Nabuo na ang Protocol",
    prescriptionAdded: "Naidagdag ang Reseta",
    prescriptionRemoved: "Natanggal ang Reseta",
    milestoneCompleted: "Nakumpleto ang Milestone",
    notStarted: "Hindi pa nagsisimula",
    intensivePhase: "Intensive Phase",
    continuationPhase: "Continuation Phase",
    error: "Error",
    syncFailed: "Error sa Pag-sync"
  }
};

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  // Centralized Alert State
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prescribing, setPrescribing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [postingMemo, setPostingMemo] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  
  const [meds, setMeds] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [memoText, setMemoText] = useState("");

  const [newMed, setNewMed] = useState({ name: "", dosage: "", time: "08:00", start: "", end: "" });

  const createAuditLog = async (action: string, category: string, target: string, metadata: any = {}, severity: string = 'info') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.user_metadata?.full_name || "Doctor/Admin";
      await supabase.from('audit_logs').insert({
        action_name: action,
        user_name: userName,
        target_entity: target,
        category,
        severity,
        metadata
      });
    } catch (err) {
      console.error("Failed to create audit log:", err);
    }
  };

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
      
      createAuditLog("Patient Record Viewed", "Patient Access", profile.full_name, { access_point: "Doctor Dashboard Detail Page" });

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
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTreatment = async () => {
    if (!startDate || !endDate) {
      triggerAlert(t("missingDates"), t("missingDatesDesc"), "error");
      return;
    }
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ treatment_start_date: startDate, treatment_end_date: endDate })
        .eq('id', id);
      if (profileError) throw profileError;

      const { error: connError } = await supabase.from('connections').update({ status: 'active' }).eq('patient_id', id);
      if (connError) throw connError;

      triggerAlert(t("success"), t("treatmentActive"), "success");
      fetchData(); 
    } catch (err: any) {
      triggerAlert(t("syncFailed"), err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePostMemo = async () => {
    if (!memoText.trim()) return;
    setPostingMemo(true);
    try {
      const { error } = await supabase.from('doctor_notes').insert({
        user_id: id,
        note_text: memoText,
        category: 'Instruction',
        is_checked: false
      });
      if (error) throw error;
      triggerAlert(t("memoSent"), t("memoSentDesc"), "success");
      setMemoText("");
      fetchData();
    } catch (err: any) {
      triggerAlert(t("memoFailed"), err.message, "error");
    } finally {
      setPostingMemo(false);
    }
  };

  const handleGenerateProtocol = async () => {
    if (!startDate) { triggerAlert(t("error"), "Start Date Required", "error"); return; }
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
        { patient_id: id, doctor_id: user?.id, title: "End of Intensive Phase Sputum Test", location: "TB DOTS Clinic", appointment_date: addDays(start, 60), status: "pending", type: "protocol" },
        { patient_id: id, doctor_id: user?.id, title: "Month 5 Sputum Follow-up", location: "TB DOTS Clinic", appointment_date: addDays(start, 150), status: "pending", type: "protocol" },
        { patient_id: id, doctor_id: user?.id, title: "Final Sputum & Cure Assessment", location: "TB DOTS Clinic", appointment_date: addDays(start, 180), status: "pending", type: "protocol" }
      ];

      await supabase.from('roadmap').insert(protocolMilestones);
      triggerAlert(t("success"), t("protocolGenerated"), "success");
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddPrescription = async () => {
    if (!newMed.name || !newMed.dosage || !newMed.time || !newMed.start || !newMed.end) {
      triggerAlert(t("error"), t("missingFields"), "error");
      return;
    }
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
      await supabase.from('medications').insert({
        user_id: id,
        name: newMed.name,
        dosage: newMed.dosage,
        time: formattedTime,
        start_date: newMed.start,
        end_date: newMed.end,
        is_taken: false
      });
      triggerAlert(t("success"), t("prescriptionAdded"), "success");
      setNewMed({ name: "", dosage: "", time: "08:00", start: "", end: "" });
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setPrescribing(false);
    }
  };

  const handleDeletePrescription = async (medId: number) => {
    try {
      await supabase.from('medications').delete().eq('id', medId);
      triggerAlert(t("success"), t("prescriptionRemoved"), "success");
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    }
  };

  const handleCompleteAppointment = async (apptId: number) => {
    try {
      await supabase.from('roadmap').update({ status: 'completed' }).eq('id', apptId);
      triggerAlert(t("success"), t("milestoneCompleted"), "success");
      fetchData();
    } catch (err: any) { console.error(err); }
  };

  const handleCheckNote = async (noteId: number) => {
    try {
      await supabase.from('doctor_notes').update({ is_checked: true }).eq('id', noteId);
      fetchData();
    } catch (err: any) { console.error(err); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[#606C38]" /></div>;

  const totalMeds = meds.length;
  const takenMeds = meds.filter(m => m.is_taken).length;
  const adherenceRate = totalMeds > 0 ? (takenMeds / totalMeds) * 100 : 0;

  let timeProgress = 0;
  let daysLeft = 0;
  let phase = t("notStarted");
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const totalDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const elapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24));
    timeProgress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    daysLeft = Math.max(totalDuration - elapsed, 0);
    phase = elapsed <= 60 ? t("intensivePhase") : t("continuationPhase");
  }

  const isVerified = patient?.status === 'active';

  return (
    <DashboardLayout role="doctor" userName="Doctor">
      
      {/* Centralized Notification Pop-up */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{alert.title}</h2>
          <p className="text-slate-500 mt-2 text-sm">{alert.message}</p>
          <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white" onClick={() => setAlert({...alert, open: false})}>Okay</Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in pb-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-[#606C38] hover:bg-[#FEFAE0]">
          <ArrowLeft className="h-4 w-4" /> {t("backBtn")}
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-1">
            <Card className="border-t-4 border-t-[#606C38] shadow-sm">
              <CardHeader><CardTitle className="text-[#2D3B1E]">{t("patientInfo")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t("fullName")}</Label>
                  <p className="text-lg font-bold text-[#2D3B1E]">{patient?.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t("treatmentPhase")}</Label>
                  <div className="pt-1">
                    <Badge variant="outline" className="bg-[#FEFAE0] text-[#606C38] border-[#DDE5B6] font-bold">
                      {phase}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t("accountStatus")}</Label>
                  <div className="pt-1">
                    <Badge variant={isVerified ? "default" : "outline"} className={isVerified ? "bg-[#606C38]" : "text-amber-600 border-amber-200 bg-amber-50"}>
                      {isVerified ? t("verifiedPatient") : t("pendingVerification")}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {patient?.is_symptomatic && <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">{t("symptomatic")}</Badge>}
                  {patient?.is_close_contact && <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">{t("closeContact")}</Badge>}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-[#DDE5B6] border-l-4 border-l-blue-400">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-[#2D3B1E]"><Stethoscope className="h-4 w-4 text-blue-500" /> {t("protocolMemo")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea 
                  placeholder={t("memoPlaceholder")} 
                  className="text-xs resize-none bg-slate-50 border-slate-200 h-20"
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                />
                <Button 
                  onClick={handlePostMemo} 
                  disabled={postingMemo || !memoText.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 h-8 text-xs gap-2"
                >
                  {postingMemo ? <Loader2 className="h-3 w-3 animate-spin" /> : <SendHorizontal className="h-3 w-3" />}
                  {t("pushMemo")}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-[#DDE5B6]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-[#2D3B1E]"><MessageSquare className="h-4 w-4 text-[#606C38]" /> {t("patientReports")}</CardTitle></CardHeader>
              <CardContent>
                {notes.filter(n => !n.is_checked && n.category !== 'Instruction').length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">{t("noConcerns")}</p>
                ) : (
                  <div className="space-y-3">
                    {notes.filter(n => !n.is_checked && n.category !== 'Instruction').map(note => (
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
              <CardHeader><CardTitle className="flex items-center gap-2 text-[#2D3B1E]"><Activity className="h-5 w-5 text-[#606C38]" /> {t("roadmapConfig")}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[#2D3B1E] font-semibold">{t("startDate")}</Label>
                    <Input type="date" className="bg-white border-[#DDE5B6]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#2D3B1E] font-semibold">{t("endDate")}</Label>
                    <Input type="date" className="bg-white border-[#DDE5B6]" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSaveTreatment} className="w-full bg-[#606C38] hover:bg-[#2D3B1E] text-white" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {t("saveSync")}
                  </Button>
                  <Button onClick={handleGenerateProtocol} variant="outline" className="w-full border-[#606C38] text-[#606C38] hover:bg-[#FEFAE0]" disabled={generating || !startDate}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                    {t("autoGen")}
                  </Button>
                </div>

                {startDate && endDate && (
                  <div className="mt-4 p-5 rounded-2xl bg-white border border-[#DDE5B6] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 text-[#606C38]">
                        <TrendingUp className="h-4 w-4" />
                        <h4 className="font-bold text-[#2D3B1E]">{t("milestoneProgress")}</h4>
                      </div>
                      <Badge variant="secondary" className="bg-[#FEFAE0] text-[#606C38]">
                        {daysLeft} {t("daysRemaining")}
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-semibold uppercase text-muted-foreground">
                          <span>{t("progressLabel")}</span>
                          <span className="text-[#2D3B1E]">{Math.round(timeProgress)}%</span>
                        </div>
                        <Progress value={timeProgress} className="h-2 bg-slate-100" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-semibold uppercase text-muted-foreground">
                          <span>{t("adherenceLabel")}</span>
                          <span className={adherenceRate < 80 ? "text-amber-600" : "text-[#606C38]"}>{Math.round(adherenceRate)}%</span>
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
                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2 text-[#2D3B1E]"><CalendarDays className="h-4 w-4 text-[#606C38]" /> {t("milestones")}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {appointments.length === 0 ? (
                        <TableRow><TableCell className="text-center italic py-6 text-muted-foreground">{t("noMilestones")}</TableCell></TableRow>
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
                                  {t("dohProtocol")}
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
                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2 text-[#2D3B1E]"><Pill className="h-4 w-4 text-[#606C38]" /> {t("prescriptions")}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-[#FEFAE0]/40 rounded-xl border border-[#DDE5B6] space-y-3">
                    <p className="text-xs font-bold text-[#606C38] uppercase">{t("newMed")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder={t("medName")} className="h-8 text-xs bg-white col-span-2" value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} />
                      <Input placeholder={t("dosage")} className="h-8 text-xs bg-white" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} />
                      <Input type="time" className="h-8 text-xs bg-white" value={newMed.time} onChange={(e) => setNewMed({...newMed, time: e.target.value})} />
                    </div>
                    <Button onClick={handleAddPrescription} size="sm" className="w-full h-8 bg-[#606C38]" disabled={prescribing}>
                      {prescribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />} {t("pushToPatient")}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {meds.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-4 italic">{t("noPrescriptions")}</p>
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