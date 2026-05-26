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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
  User,
  FileCheck2,
  Scale,
  Info,
  Edit,
  X,
  ChevronLeft,
  ChevronRight
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
    curedPatient: "Cured",
    treatmentCompletedPatient: "Treatment Completed",
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
    selectRegimen: "TB Treatment Protocol",
    sixMonthDots: "6-Month DOTS",
    fourMonthRegimen: "Shortened 4-Month Regimen (BPaL/BPaLM)",
    startDate: "Treatment Start Date",
    endDate: "Treatment End Date (Auto-Calculated)",
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
    missingDatesDesc: "Please select both a Start Date and a Treatment Protocol.",
    success: "Success",
    treatmentActive: "Treatment activated. Roadmap is now synced.",
    protocolGenerated: "Protocol Generated",
    prescriptionAdded: "Prescription Added",
    prescriptionUpdated: "Prescription Updated",
    prescriptionRemoved: "Prescription Removed",
    milestoneCompleted: "Milestone Completed",
    notStarted: "Not Started",
    intensivePhase: "Intensive Phase",
    continuationPhase: "Continuation Phase",
    postCarePhase: "Post-Care Archival",
    dischargeBtn: "Discharge & Generate E-Certificate",
    dischargeSuccess: "Patient discharged. E-Certificate generated and follow-ups scheduled.",
    error: "Error",
    syncFailed: "Sync Failed",
    patientVitals: "Patient Vitals",
    weight: "Current Weight (kg)",
    updateWeight: "Update Weight",
    weightSaved: "Weight Updated",
    medicationDiary: "Medication Diary (Logs)",
    editMed: "Edit Med",
    updateMed: "Update Med",
    taken: "Taken",
    missed: "Pending / Missed",
    onTime: "On Time",
    early: "Early",
    late: "Late",
    cancelEdit: "Cancel",
  },
  fil: {
    backBtn: "Bumalik sa Listahan ng Pasyente",
    patientInfo: "Impormasyon ng Pasyente",
    fullName: "Buong Pangalan",
    treatmentPhase: "Phase ng Gamutan",
    accountStatus: "Katayuan ng Account",
    verifiedPatient: "Na-verify na Pasyente",
    pendingVerification: "Nakabinbing Pag-verify",
    curedPatient: "Magaling na (Cured)",
    treatmentCompletedPatient: "Tapos na ang Gamutan",
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
    selectRegimen: "TB Treatment Protocol",
    sixMonthDots: "6-Month DOTS",
    fourMonthRegimen: "Shortened 4-Month Regimen (BPaL/BPaLM)",
    startDate: "Petsa ng Pagsisimula ng Gamutan",
    endDate: "Petsa ng Pagtatapos ng Gamutan (Auto)",
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
    missingDatesDesc: "Pakipili ang petsa ng pagsisimula at ang TB Protocol.",
    success: "Tagumpay",
    treatmentActive: "Aktibo na ang gamutan. Naka-sync na ang roadmap.",
    protocolGenerated: "Nabuo na ang Protocol",
    prescriptionAdded: "Naidagdag ang Reseta",
    prescriptionUpdated: "Na-update ang Reseta",
    prescriptionRemoved: "Natanggal ang Reseta",
    milestoneCompleted: "Nakumpleto ang Milestone",
    notStarted: "Hindi pa nagsisimula",
    intensivePhase: "Intensive Phase",
    continuationPhase: "Continuation Phase",
    postCarePhase: "Post-Care Archival",
    dischargeBtn: "I-discharge at Gumawa ng E-Certificate",
    dischargeSuccess: "Na-discharge ang pasyente. Nakaiskedyul na ang follow-ups.",
    error: "Error",
    syncFailed: "Error sa Pag-sync",
    patientVitals: "Vitals ng Pasyente",
    weight: "Kasalukuyang Timbang (kg)",
    updateWeight: "I-update ang Timbang",
    weightSaved: "Na-update ang Timbang",
    medicationDiary: "Diary ng Gamot (Logs)",
    editMed: "I-edit",
    updateMed: "I-update",
    taken: "Nainom",
    missed: "Pending / Nakaligtaan",
    onTime: "Sa Oras",
    early: "Maaga",
    late: "Huli",
    cancelEdit: "Kanselahin",
  }
};

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [prescribing, setPrescribing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [postingMemo, setPostingMemo] = useState(false);
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [discharging, setDischarging] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [medLogs, setMedLogs] = useState<any[]>([]); 
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tbRegimen, setTbRegimen] = useState("6-Month DOTS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [memoText, setMemoText] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [newMed, setNewMed] = useState({ name: "", dosage: "", time: "08:00", start: "", end: "" });
  const [editingMedId, setEditingMedId] = useState<number | null>(null); 
  const [diaryDate, setDiaryDate] = useState<Date>(new Date());
  const [diaryViewType, setDiaryViewType] = useState<'Day' | 'Week' | 'Month'>('Week');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (startDate && tbRegimen) {
      const start = new Date(startDate);
      const durationDays = tbRegimen.includes("4-Month") ? 120 : 180;
      start.setDate(start.getDate() + durationDays);
      setEndDate(start.toISOString().split('T')[0]);
    }
  }, [startDate, tbRegimen]);

  const createAuditLog = async (action: string, category: string, target: string, metadata: any = {}, severity: string = 'info') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.user_metadata?.full_name || "Doctor/Admin";
      await supabase.from('audit_logs').insert({ action_name: action, user_name: userName, target_entity: target, category, severity, metadata });
    } catch (err) { console.error("Failed to create audit log:", err); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (profileErr) throw profileErr;
      setPatient(profile);
      createAuditLog("Patient Record Viewed", "Patient Access", profile.full_name, { access_point: "Doctor Dashboard Detail Page" });
      if (profile?.treatment_start_date) setStartDate(profile.treatment_start_date);
      if (profile?.treatment_end_date) setEndDate(profile.treatment_end_date);
      if (profile?.tb_regimen) setTbRegimen(profile.tb_regimen);
      const { data: medications } = await supabase.from('medications').select('*').eq('user_id', id);
      setMeds(medications || []);
      const { data: logs } = await supabase.from('medication_logs').select('*').eq('patient_id', id);
      setMedLogs(logs || []);
      const { data: appts } = await supabase.from('roadmap').select('*').eq('patient_id', id).order('appointment_date', { ascending: true });
      setAppointments(appts || []);
      const { data: patientNotes } = await supabase.from('doctor_notes').select('*').eq('user_id', id).order('created_at', { ascending: false });
      setNotes(patientNotes || []);
      const { data: vitals } = await supabase.from('patient_vitals').select('weight_kg').eq('patient_id', id).order('recorded_at', { ascending: false }).limit(1).maybeSingle();
      if (vitals?.weight_kg) setCurrentWeight(vitals.weight_kg.toString());
    } catch (err: any) { triggerAlert(t("error"), err.message, "error"); } finally { setLoading(false); }
  };

  const handleSaveTreatment = async () => {
    if (!startDate || !endDate) { triggerAlert(t("missingDates"), t("missingDatesDesc"), "error"); return; }
    setSaving(true);
    try {
      const { error: profileError } = await supabase.from('profiles').update({ treatment_start_date: startDate, treatment_end_date: endDate, tb_regimen: tbRegimen }).eq('id', id);
      if (profileError) throw profileError;
      const { error: connError } = await supabase.from('connections').update({ status: 'active' }).eq('patient_id', id);
      if (connError) throw connError;
      triggerAlert(t("success"), t("treatmentActive"), "success");
      fetchData(); 
    } catch (err: any) { triggerAlert(t("syncFailed"), err.message, "error"); } finally { setSaving(false); }
  };

  const handleSaveWeight = async () => {
    if (!currentWeight) return;
    setSavingWeight(true);
    try {
      const { error } = await supabase.from('patient_vitals').insert({ patient_id: id, weight_kg: parseFloat(currentWeight) });
      if (error) throw error;
      triggerAlert(t("success"), t("weightSaved"), "success");
    } catch (err: any) { triggerAlert(t("error"), err.message, "error"); } finally { setSavingWeight(false); }
  };

  const handlePostMemo = async () => {
    if (!memoText.trim()) return;
    setPostingMemo(true);
    try {
      const { error } = await supabase.from('doctor_notes').insert({ user_id: id, note_text: memoText, category: 'Instruction', is_checked: false });
      if (error) throw error;
      triggerAlert(t("memoSent"), t("memoSentDesc"), "success");
      setMemoText("");
      fetchData();
    } catch (err: any) { triggerAlert(t("memoFailed"), err.message, "error"); } finally { setPostingMemo(false); }
  };

  const handleGenerateProtocol = async () => {
    if (!startDate) { triggerAlert(t("error"), "Start Date Required", "error"); return; }
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const start = new Date(startDate);
      const addDays = (date: Date, days: number) => { const result = new Date(date); result.setDate(result.getDate() + days); return result.toISOString().split('T')[0]; };
      let protocolMilestones = tbRegimen.includes("4-Month") ? [
        { patient_id: id, doctor_id: user?.id, title: "End of Month 2 Sputum Test", location: "TB DOTS Clinic", appointment_date: addDays(start, 60), status: "pending", type: "protocol" },
        { patient_id: id, doctor_id: user?.id, title: "Final Month 4 Cure Assessment", location: "TB DOTS Clinic", appointment_date: addDays(start, 120), status: "pending", type: "protocol" }
      ] : [
        { patient_id: id, doctor_id: user?.id, title: "End of Intensive Phase Sputum Test", location: "TB DOTS Clinic", appointment_date: addDays(start, 60), status: "pending", type: "protocol" },
        { patient_id: id, doctor_id: user?.id, title: "Month 5 Sputum Follow-up", location: "TB DOTS Clinic", appointment_date: addDays(start, 150), status: "pending", type: "protocol" },
        { patient_id: id, doctor_id: user?.id, title: "Final Sputum & Cure Assessment", location: "TB DOTS Clinic", appointment_date: addDays(start, 180), status: "pending", type: "protocol" }
      ];
      await supabase.from('roadmap').insert(protocolMilestones);
      triggerAlert(t("success"), t("protocolGenerated"), "success");
      fetchData();
    } catch (err: any) { triggerAlert(t("error"), err.message, "error"); } finally { setGenerating(false); }
  };

  const handleAddOrUpdatePrescription = async () => {
    if (!newMed.name || !newMed.dosage || !newMed.time || !newMed.start || !newMed.end) { triggerAlert(t("error"), t("missingFields"), "error"); return; }
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
      if (editingMedId) {
        await supabase.from('medications').update({ name: newMed.name, dosage: newMed.dosage, time: formattedTime, start_date: newMed.start, end_date: newMed.end }).eq('id', editingMedId);
        triggerAlert(t("success"), t("prescriptionUpdated"), "success");
      } else {
        await supabase.from('medications').insert({ user_id: id, name: newMed.name, dosage: newMed.dosage, time: formattedTime, start_date: newMed.start, end_date: newMed.end, is_taken: false });
        triggerAlert(t("success"), t("prescriptionAdded"), "success");
      }
      setNewMed({ name: "", dosage: "", time: "08:00", start: "", end: "" });
      setEditingMedId(null);
      fetchData();
    } catch (err: any) { triggerAlert(t("error"), err.message, "error"); } finally { setPrescribing(false); }
  };

  const handleEditClick = (med: any) => {
    setEditingMedId(med.id);
    let timeInput = med.time;
    try {
      const match = med.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hrs = parseInt(match[1]); const mins = match[2]; const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hrs < 12) hrs += 12; if (ampm === "AM" && hrs === 12) hrs = 0;
        timeInput = `${hrs.toString().padStart(2, '0')}:${mins}`;
      }
    } catch(e) {}
    setNewMed({ name: med.name, dosage: med.dosage, time: timeInput, start: med.start_date.split('T')[0], end: med.end_date.split('T')[0] });
  };

  const handleCancelEdit = () => { setNewMed({ name: "", dosage: "", time: "08:00", start: "", end: "" }); setEditingMedId(null); };
  const handleDeletePrescription = async (medId: number) => { try { await supabase.from('medications').delete().eq('id', medId); triggerAlert(t("success"), t("prescriptionRemoved"), "success"); fetchData(); } catch (err: any) { triggerAlert(t("error"), err.message, "error"); } };
  const handleCompleteAppointment = async (apptId: number) => { try { await supabase.from('roadmap').update({ status: 'completed' }).eq('id', apptId); triggerAlert(t("success"), t("milestoneCompleted"), "success"); fetchData(); } catch (err: any) { console.error(err); } };
  const handleCheckNote = async (noteId: number) => { try { await supabase.from('doctor_notes').update({ is_checked: true }).eq('id', noteId); fetchData(); } catch (err: any) { console.error(err); } };

  const confirmDischarge = async (dischargeType: 'cured' | 'treatment_completed') => {
    setDischarging(true);
    try {
      await supabase.from('profiles').update({ status: dischargeType }).eq('id', id);
      const cureDate = new Date();
      const in6Months = new Date(cureDate.setMonth(cureDate.getMonth() + 6)).toISOString().split('T')[0];
      const in1Year = new Date(cureDate.setFullYear(cureDate.getFullYear() + 1)).toISOString().split('T')[0];
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('roadmap').insert([
        { patient_id: id, doctor_id: user?.id, title: "6-Month Post-Treatment X-Ray Follow-up", location: "Carmona Health Center", appointment_date: in6Months, status: "scheduled", type: "post-treatment" },
        { patient_id: id, doctor_id: user?.id, title: "1-Year Post-Treatment Medical Clearance", location: "Carmona Health Center", appointment_date: in1Year, status: "scheduled", type: "post-treatment" }
      ]);
      setDischargeModalOpen(false); triggerAlert(t("success"), t("dischargeSuccess"), "success");
      setTimeout(() => { window.print(); fetchData(); }, 1500);
    } catch(err: any) { triggerAlert(t("error"), err.message, "error"); } finally { setDischarging(false); }
  };

  const handlePrevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  const formatYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const renderCalendarView = () => {
    if (diaryViewType === 'Month') {
      const year = calendarMonth.getFullYear(); const month = calendarMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate(); const firstDayOfWeek = new Date(year, month, 1).getDay(); 
      const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
      const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 hover:bg-slate-100"><ChevronLeft className="h-4 w-4 text-slate-600" /></Button>
            <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 hover:bg-slate-100"><ChevronRight className="h-4 w-4 text-slate-600" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>)}
            {blanks.map(b => <div key={`blank-${b}`} />)}
            {days.map(date => {
              const isSelected = date.getDate() === diaryDate.getDate() && date.getMonth() === diaryDate.getMonth() && date.getFullYear() === diaryDate.getFullYear();
              const logsForDay = medLogs.filter(l => l.log_date === formatYMD(date) && l.status === 'taken');
              return (
                <div key={date.toISOString()} onClick={() => { setDiaryDate(date); setCalendarMonth(date); }} className={`aspect-square flex flex-col items-center justify-center p-1 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[#606C38] border-[#606C38] shadow-md text-white' : 'bg-slate-50 border-slate-200 hover:border-[#606C38] text-slate-700'}`}>
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : ''}`}>{date.getDate()}</span>
                  {logsForDay.length > 0 && <div className={`h-1.5 w-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-[#606C38]'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    if (diaryViewType === 'Week') {
      const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(diaryDate); d.setDate(d.getDate() - 3 + i); return d; });
      return (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {weekDays.map((date, index) => {
            const isSelected = date.getDate() === diaryDate.getDate() && date.getMonth() === diaryDate.getMonth() && date.getFullYear() === diaryDate.getFullYear();
            return (
              <div key={index} onClick={() => setDiaryDate(date)} className={`min-w-[60px] flex-1 cursor-pointer flex flex-col items-center justify-center p-2 rounded-2xl transition-all border ${isSelected ? 'bg-[#606C38] border-[#606C38] shadow-md' : 'bg-slate-50 border-slate-200 hover:border-[#606C38] hover:bg-[#FEFAE0]/50'}`}>
                <p className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <p className={`text-lg font-extrabold ${isSelected ? 'text-white' : 'text-slate-800'}`}>{date.getDate()}</p>
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <div className="flex justify-center pb-2">
        <div className="w-32 flex flex-col items-center justify-center p-4 rounded-3xl border bg-[#606C38] border-[#606C38] shadow-lg text-white">
          <p className="text-xs font-bold uppercase mb-1 text-white/80">{diaryDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
          <p className="text-4xl font-extrabold">{diaryDate.getDate()}</p>
          <p className="text-xs font-medium mt-1 text-white/80">{diaryDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[#606C38]" /></div>;

  const adherenceRate = meds.length > 0 ? (meds.filter(m => m.is_taken).length / meds.length) * 100 : 0; 
  const isCured = patient?.status === 'cured' || patient?.status === 'treatment_completed';
  const diaryMeds = meds.filter((med) => {
    const sDate = new Date(new Date(med.start_date).toDateString());
    const eDate = new Date(new Date(med.end_date).toDateString());
    const selDate = new Date(diaryDate.toDateString());
    return selDate >= sDate && selDate <= eDate;
  });

  return (
    <DashboardLayout role="doctor" userName="Doctor">
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans print:hidden">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-[#DDE5B6]' : 'bg-slate-200'}`}>
            {alert.type === 'success' ? <CheckCircle2 className="h-6 w-6 text-[#606C38]" /> : <AlertCircle className="h-6 w-6 text-slate-700" />}
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-black text-center">{alert.title}</DialogTitle>
            <DialogDescription className="text-slate-600 mt-2 text-sm text-center">{alert.message}</DialogDescription>
          </DialogHeader>
          <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#283618] text-white" onClick={() => setAlert({...alert, open: false})}>Okay</Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in pb-10 print:hidden">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-[#606C38] hover:bg-[#FEFAE0] rounded-xl px-4"><ArrowLeft className="h-4 w-4" /> {t("backBtn")}</Button>
        </div>

        <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            <div className="h-28 w-28 rounded-full bg-slate-50 border-4 border-[#DDE5B6] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {patient?.avatar_url ? <img src={patient.avatar_url} alt={patient.full_name} className="h-full w-full object-cover" /> : <User className="h-12 w-12 text-[#606C38]" />}
            </div>
            <div className="flex-1 space-y-3 text-center sm:text-left w-full">
              <h2 className="text-3xl font-bold text-black tracking-tight">{patient?.full_name}</h2>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b border-slate-100"><CardTitle className="text-md text-[#283618] font-bold">Prescriptions</CardTitle></CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={t("medName")} className="h-10 text-sm bg-white border-slate-200 rounded-lg col-span-2" value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} />
                  <Input placeholder={t("dosage")} className="h-10 text-sm bg-white border-slate-200 rounded-lg" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} />
                  <Input type="time" className="h-10 text-sm bg-white border-slate-200 rounded-lg" value={newMed.time} onChange={(e) => setNewMed({...newMed, time: e.target.value})} />
                  <div className="col-span-1"><Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Start Date</Label><Input type="date" className="h-10 text-sm bg-white border-slate-200 rounded-lg w-full" value={newMed.start} onChange={(e) => setNewMed({...newMed, start: e.target.value})} /></div>
                  <div className="col-span-1"><Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">End Date</Label><Input type="date" className="h-10 text-sm bg-white border-slate-200 rounded-lg w-full" value={newMed.end} onChange={(e) => setNewMed({...newMed, end: e.target.value})} /></div>
                </div>
                <Button onClick={handleAddOrUpdatePrescription} size="sm" className="w-full h-10 rounded-lg text-white font-medium bg-[#606C38] hover:bg-[#283618]" disabled={prescribing}>
                  {prescribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} {t("pushToPatient")}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-md text-[#283618] font-bold"><CalendarDays className="h-5 w-5 text-[#606C38]" /> {t("medicationDiary")}</CardTitle>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  {(['Day', 'Week', 'Month'] as const).map(type => (
                    <button key={type} onClick={() => setDiaryViewType(type)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${diaryViewType === type ? 'bg-white shadow-sm text-[#606C38]' : 'text-slate-500 hover:text-slate-700'}`}>{type}</button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {renderCalendarView()}
                <div className="mt-4 p-5 rounded-xl border border-slate-100 bg-slate-50">
                  {diaryMeds.length === 0 ? <p className="text-sm text-slate-500 italic">No medications scheduled for this date.</p> : (
                    <div className="space-y-3">
                      {diaryMeds.map((med) => {
                        const log = medLogs.find(l => l.medication_id === med.id && l.log_date === formatYMD(diaryDate));
                        return (
                          <div key={med.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                            <p className="text-sm font-bold text-slate-800">{med.name} <span className="text-xs font-normal text-slate-500">({med.dosage})</span></p>
                            <Badge className={log?.status === 'taken' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}>{log?.status === 'taken' ? t("taken") : t("missed")}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}