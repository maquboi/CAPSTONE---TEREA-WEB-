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
  CheckCircle,
  User,
  FileCheck2
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
    curedPatient: "Treatment Completed / Cured",
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
    postCarePhase: "Post-Care Archival",
    dischargeBtn: "Discharge & Generate E-Certificate",
    dischargeSuccess: "Patient marked as cured. E-Certificate generated and follow-ups scheduled.",
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
    curedPatient: "Tapos na ang Gamutan / Magaling na",
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
    postCarePhase: "Post-Care Archival",
    dischargeBtn: "I-discharge at Gumawa ng E-Certificate",
    dischargeSuccess: "Minarkahang magaling na ang pasyente. Nakaiskedyul na ang follow-ups.",
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
  const [discharging, setDischarging] = useState(false);
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

  const handleDischargePatient = async () => {
    setDischarging(true);
    try {
      // 1. Mark patient as cured
      await supabase.from('profiles').update({ status: 'cured' }).eq('id', id);

      // 2. Schedule 6-mo and 1-yr Post-Treatment X-Ray Checkups
      const cureDate = new Date();
      const in6Months = new Date(cureDate.setMonth(cureDate.getMonth() + 6)).toISOString().split('T')[0];
      const in1Year = new Date(cureDate.setFullYear(cureDate.getFullYear() + 1)).toISOString().split('T')[0];

      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('roadmap').insert([
        { patient_id: id, doctor_id: user?.id, title: "6-Month Post-Treatment X-Ray Follow-up", location: "Carmona Health Center", appointment_date: in6Months, status: "scheduled", type: "post-treatment" },
        { patient_id: id, doctor_id: user?.id, title: "1-Year Post-Treatment Medical Clearance", location: "Carmona Health Center", appointment_date: in1Year, status: "scheduled", type: "post-treatment" }
      ]);

      // 3. Log the Admin Archiving Action
      createAuditLog("Patient Discharged", "Treatment Lifecycle", patient.full_name, { action: "Marked Cured & Scheduled Follow-ups" });

      triggerAlert(t("success"), t("dischargeSuccess"), "success");
      
      // 4. Trigger E-Certificate Print Mode natively
      setTimeout(() => {
        window.print();
        fetchData();
      }, 1500);

    } catch(err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setDischarging(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[#606C38]" /></div>;

  const totalMeds = meds.length;
  const takenMeds = meds.filter(m => m.is_taken).length;
  const adherenceRate = totalMeds > 0 ? (takenMeds / totalMeds) * 100 : 0;

  let timeProgress = 0;
  let daysLeft = 0;
  let phase = t("notStarted");
  
  if (patient?.status === 'cured') {
    phase = t("postCarePhase");
    timeProgress = 100;
  } else if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const totalDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const elapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24));
    timeProgress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    daysLeft = Math.max(totalDuration - elapsed, 0);
    phase = elapsed <= 60 ? t("intensivePhase") : t("continuationPhase");
  }

  const isVerified = patient?.status === 'active' || patient?.status === 'cured';
  const isCured = patient?.status === 'cured';

  return (
    <DashboardLayout role="doctor" userName="Doctor">
      
      {/* Centralized Notification Pop-up */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans print:hidden">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-[#DDE5B6]' : 'bg-slate-200'}`}>
            {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-[#606C38]" /> : <AlertCircle className="h-6 w-6 text-slate-700" />}
          </div>
          <h2 className="text-lg font-bold text-black">{alert.title}</h2>
          <p className="text-slate-600 mt-2 text-sm">{alert.message}</p>
          <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#283618] text-white" onClick={() => setAlert({...alert, open: false})}>Okay</Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in pb-10 print:hidden">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-[#606C38] hover:bg-[#FEFAE0] rounded-xl px-4">
            <ArrowLeft className="h-4 w-4" /> {t("backBtn")}
          </Button>

          {!isCured && (
            <Button 
              onClick={handleDischargePatient} 
              disabled={discharging}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold shadow-sm"
            >
              {discharging ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
              {t("dischargeBtn")}
            </Button>
          )}
        </div>

        {/* TOP SECTION: Unified Patient Info Header Card */}
        <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            
            <div className="h-28 w-28 rounded-full bg-slate-50 border-4 border-[#DDE5B6] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {patient?.avatar_url ? (
                <img src={patient.avatar_url} alt={patient.full_name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-[#606C38]" />
              )}
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-black tracking-tight">{patient?.full_name}</h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    <Badge variant={isCured ? "default" : (isVerified ? "default" : "outline")} className={`px-3 py-1 font-semibold ${isCured ? "bg-emerald-600 hover:bg-emerald-700 text-white" : (isVerified ? "bg-[#606C38] hover:bg-[#283618] text-white border-none" : "text-slate-600 border-slate-300 bg-slate-100")}`}>
                      {isCured ? t("curedPatient") : (isVerified ? t("verifiedPatient") : t("pendingVerification"))}
                    </Badge>
                    <Badge variant="outline" className={`font-bold px-3 py-1 ${isCured ? "bg-slate-100 text-slate-600 border-slate-300" : "bg-[#FEFAE0] text-[#606C38] border-[#DDE5B6]"}`}>
                      {phase}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-3 border-t border-slate-100 mt-4">
                {patient?.is_symptomatic && <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50 px-3 py-1">{t("symptomatic")}</Badge>}
                {patient?.is_close_contact && <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50 px-3 py-1">{t("closeContact")}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MAIN GRID LAYOUT */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* LEFT COLUMN: Reports & Memos */}
          <div className="space-y-6 lg:col-span-1">
            
            <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-md text-[#283618] font-bold">
                  <MessageSquare className="h-5 w-5 text-[#606C38]" /> {t("patientReports")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {notes.filter(n => !n.is_checked && n.category !== 'Instruction').length === 0 ? (
                  <div className="py-6 text-center bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 italic">{t("noConcerns")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.filter(n => !n.is_checked && n.category !== 'Instruction').map(note => (
                      <div key={note.id} className="p-4 border border-[#DDE5B6] rounded-xl bg-[#FEFAE0]/40">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-[10px] bg-white text-[#606C38] border-[#DDE5B6]">{note.category}</Badge>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-[#606C38] hover:bg-white rounded-full" onClick={() => handleCheckNote(note.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm font-medium text-black leading-relaxed">{note.note_text}</p>
                        <p className="text-[11px] text-slate-500 mt-3 font-medium">{new Date(note.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {!isCured && (
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-md text-[#283618] font-bold">
                    <Stethoscope className="h-5 w-5 text-[#606C38]" /> {t("protocolMemo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <Textarea 
                    placeholder={t("memoPlaceholder")} 
                    className="text-sm resize-none bg-slate-50 border-slate-200 h-28 rounded-xl focus-visible:ring-[#606C38]"
                    value={memoText}
                    onChange={(e) => setMemoText(e.target.value)}
                  />
                  <Button 
                    onClick={handlePostMemo} 
                    disabled={postingMemo || !memoText.trim()}
                    className="w-full bg-[#606C38] hover:bg-[#283618] text-white rounded-xl h-11 gap-2 font-semibold"
                  >
                    {postingMemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                    {t("pushMemo")}
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>

          {/* RIGHT COLUMN: Config, Milestones, Prescriptions */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Roadmap Configuration (Full Width of Col 2) */}
            <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg text-[#283618] font-bold">
                  <Activity className="h-5 w-5 text-[#606C38]" /> {t("roadmapConfig")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-6">
                
                {!isCured && (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-black font-bold">{t("startDate")}</Label>
                        <Input type="date" className="bg-slate-50 border-slate-200 rounded-xl h-11 focus-visible:ring-[#606C38]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-black font-bold">{t("endDate")}</Label>
                        <Input type="date" className="bg-slate-50 border-slate-200 rounded-xl h-11 focus-visible:ring-[#606C38]" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={handleSaveTreatment} className="w-full sm:w-1/2 bg-[#283618] hover:bg-[#1a2310] text-white rounded-xl h-11 font-semibold" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {t("saveSync")}
                      </Button>
                      <Button onClick={handleGenerateProtocol} variant="outline" className="w-full sm:w-1/2 border-[#606C38] text-[#606C38] hover:bg-[#FEFAE0] rounded-xl h-11 font-semibold" disabled={generating || !startDate}>
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                        {t("autoGen")}
                      </Button>
                    </div>
                  </>
                )}

                {startDate && endDate && (
                  <div className={`mt-2 p-5 rounded-2xl border ${isCured ? 'bg-emerald-50 border-emerald-200' : 'bg-[#FEFAE0]/30 border-[#DDE5B6]'}`}>
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-2 text-[#606C38]">
                        <TrendingUp className={`h-5 w-5 ${isCured ? 'text-emerald-600' : 'text-[#606C38]'}`} />
                        <h4 className={`font-bold text-md ${isCured ? 'text-emerald-900' : 'text-[#283618]'}`}>{t("milestoneProgress")}</h4>
                      </div>
                      {!isCured && (
                        <Badge variant="secondary" className="bg-[#DDE5B6] text-[#283618] px-3 py-1 font-bold">
                          {daysLeft} {t("daysRemaining")}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-xs mb-2 font-bold uppercase text-slate-500">
                          <span>{t("progressLabel")}</span>
                          <span className="text-black">{Math.round(timeProgress)}%</span>
                        </div>
                        <Progress value={timeProgress} className={`h-2.5 bg-slate-200 rounded-full [&>div]:${isCured ? 'bg-emerald-500' : 'bg-[#606C38]'}`} />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-2 font-bold uppercase text-slate-500">
                          <span>{t("adherenceLabel")}</span>
                          <span className={adherenceRate < 80 ? "text-slate-700" : (isCured ? "text-emerald-600" : "text-[#606C38]")}>{Math.round(adherenceRate)}%</span>
                        </div>
                        <Progress value={adherenceRate} className={`h-2.5 rounded-full ${adherenceRate < 80 ? "bg-slate-200 [&>div]:bg-slate-600" : `bg-slate-200 [&>div]:${isCured ? 'bg-emerald-500' : 'bg-[#606C38]'}`}`} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nested Grid for Milestones and Prescriptions */}
            <div className="grid gap-6 sm:grid-cols-2">
              
              {/* Milestones Card */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white flex flex-col">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-md font-bold flex items-center gap-2 text-[#283618]">
                    <CalendarDays className="h-5 w-5 text-[#606C38]" /> {t("milestones")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <div className="max-h-[350px] overflow-y-auto">
                    <Table>
                      <TableBody>
                        {appointments.length === 0 ? (
                          <TableRow>
                            <TableCell className="text-center italic py-10 text-slate-400">{t("noMilestones")}</TableCell>
                          </TableRow>
                        ) : appointments.filter(a => a.status !== 'completed').map((appt) => (
                          <TableRow key={appt.id} className="hover:bg-slate-50 border-b border-slate-100">
                            <TableCell className="py-4 px-5">
                              <p className="text-sm font-bold text-black mb-1">
                                {appt.title || 'Follow-up'}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[11px] font-medium text-slate-500">
                                  {new Date(appt.appointment_date).toLocaleDateString()} • {appt.location}
                                </p>
                                {appt.type === 'protocol' && (
                                  <Badge variant="outline" className="text-[9px] h-5 px-2 border-[#DDE5B6] bg-[#FEFAE0] text-[#606C38]">
                                    {t("dohProtocol")}
                                  </Badge>
                                )}
                                {appt.type === 'post-treatment' && (
                                  <Badge variant="outline" className="text-[9px] h-5 px-2 border-emerald-200 bg-emerald-50 text-emerald-700">
                                    Post-Treatment
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-4 px-5">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-[#606C38] hover:bg-[#FEFAE0] rounded-full" onClick={() => handleCompleteAppointment(appt.id)}>
                                <CheckCircle2 className="h-5 w-5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Prescriptions Card */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white flex flex-col">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-md font-bold flex items-center gap-2 text-[#283618]">
                    <Pill className="h-5 w-5 text-[#606C38]" /> {t("prescriptions")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-4 space-y-5">
                  {!isCured && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("newMed")}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder={t("medName")} className="h-10 text-sm bg-white border-slate-200 rounded-lg col-span-2 focus-visible:ring-[#606C38]" value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} />
                        <Input placeholder={t("dosage")} className="h-10 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-[#606C38]" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} />
                        <Input type="time" className="h-10 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-[#606C38]" value={newMed.time} onChange={(e) => setNewMed({...newMed, time: e.target.value})} />
                      </div>
                      <Button onClick={handleAddPrescription} size="sm" className="w-full h-10 bg-[#606C38] hover:bg-[#283618] rounded-lg text-white font-medium" disabled={prescribing}>
                        {prescribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} {t("pushToPatient")}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                    {meds.length === 0 ? (
                      <p className="text-center text-sm text-slate-400 py-6 italic">{t("noPrescriptions")}</p>
                    ) : meds.map((med) => (
                      <div key={med.id} className={`flex justify-between items-center p-3 rounded-xl border shadow-sm ${isCured ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                        <div>
                          <p className="text-sm font-bold text-black mb-1">{med.name} <span className="font-medium text-slate-500">({med.dosage})</span></p>
                          <p className="text-[11px] font-medium text-slate-400">{new Date(med.start_date).toLocaleDateString()} - {new Date(med.end_date).toLocaleDateString()} • {med.time}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {med.is_taken ? <Check className="h-5 w-5 text-[#606C38] mr-2" /> : <Circle className="h-5 w-5 text-slate-300 mr-2" />}
                          {!isCured && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-black hover:bg-slate-100 rounded-full" onClick={() => handleDeletePrescription(med.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* --- HIDDEN E-DISCHARGE CERTIFICATE (VISIBLE ONLY WHEN PRINTING) --- */}
      <div className="hidden print:block font-sans text-black p-10 bg-white h-screen">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">MUNICIPALITY OF CARMONA</h1>
            <h2 className="text-xl font-bold text-slate-600 mt-1">TB DOTS CLINIC</h2>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-extrabold tracking-tight">TEREA</h1>
            <p className="text-sm font-bold text-slate-500">E-DISCHARGE CERTIFICATE</p>
          </div>
        </div>

        <div className="space-y-8">
          <p className="text-lg leading-relaxed text-justify">
            This is to certify that <strong>{patient?.full_name?.toUpperCase()}</strong>, a resident of Barangay {patient?.barangay || "Carmona"}, has successfully completed the required 6-month Directly Observed Treatment, Short-course (DOTS) regimen under the supervision of the Carmona Health Center.
          </p>

          <div className="grid grid-cols-2 gap-y-6 text-md bg-slate-50 p-6 rounded-lg border border-slate-200">
            <div>
              <span className="font-bold text-slate-500 block text-xs">PATIENT ID</span>
              <span className="font-semibold">{patient?.id?.substring(0, 8).toUpperCase()}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-xs">CLINIC CODE</span>
              <span className="font-semibold">{patient?.clinic_code || "N/A"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-xs">TREATMENT START</span>
              <span className="font-semibold">{startDate ? new Date(startDate).toLocaleDateString() : "N/A"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-xs">TREATMENT END</span>
              <span className="font-semibold">{endDate ? new Date(endDate).toLocaleDateString() : "N/A"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-xs">FINAL STATUS</span>
              <span className="font-extrabold text-emerald-700 uppercase">Cured / Completed</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-xs">ADHERENCE RATE</span>
              <span className="font-semibold">{Math.round(adherenceRate)}%</span>
            </div>
          </div>

          <p className="text-md italic text-slate-600 pt-4">
            The patient is hereby declared cleared of active Tuberculosis infection and is advised to return for the scheduled 6-month and 1-year post-treatment follow-ups as registered in their digital roadmap.
          </p>

          <div className="pt-20 flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-400">Date Generated</p>
              <p className="font-bold">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center w-64 border-t border-slate-800 pt-2">
              <p className="font-bold uppercase">Attending Physician</p>
              <p className="text-sm text-slate-500">Carmona TB DOTS Center</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}