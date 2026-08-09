import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  TableHead,
  TableHeader,
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
  User,
  FileCheck2,
  Scale,
  Info,
  Edit,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Filter,
  Calendar,
  ClipboardList,
  X
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup
} from "@/components/ui/select";
import { useLanguage } from "../admin/LanguageContext";

// IMPORT YOUR NEW NOTIFICATION DISPATCHER
import { sendNotificationToPatient } from "@/lib/notifications";

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
    pushToPatient: "Add Medication",
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
    dischargeBtn: "Discharge Patient",
    dischargeSuccess: "Patient successfully discharged and follow-ups scheduled.",
    error: "Error",
    syncFailed: "Sync Failed",
    patientVitals: "Patient Vitals",
    weight: "Current Weight (kg)",
    updateWeight: "Add New Record",
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
    dischargeBtn: "I-discharge ang Pasyente",
    dischargeSuccess: "Matagumpay na na-discharge ang pasyente at naiskedyul ang follow-ups.",
    error: "Error",
    syncFailed: "Error sa Pag-sync",
    patientVitals: "Vitals ng Pasyente",
    weight: "Kasalukuyang Timbang (kg)",
    updateWeight: "Magdagdag ng Bagong Record",
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

const STANDARD_TB_DRUGS = [
  "Isoniazid (H)",
  "Rifampicin (R)",
  "Pyrazinamide (Z)",
  "Ethambutol (E)",
  "FDC (Rifampicin + Isoniazid + Pyrazinamide + Ethambutol)",
  "FDC (Rifampicin + Isoniazid)",
  "Bedaquiline (B)",
  "Pretomanid (Pa)",
  "Linezolid (L)",
  "Moxifloxacin (M)"
];

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  // View Layout State
  const [activeTab, setActiveTab] = useState<'overview' | 'clinical' | 'roadmap'>('overview');

  // Centralized Alert State
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [savingDoh, setSavingDoh] = useState(false);
  const [prescribing, setPrescribing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [postingMemo, setPostingMemo] = useState(false);
  
  // Modal States
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [confirmSafetyModalOpen, setConfirmSafetyModalOpen] = useState(false); 
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);

  const [discharging, setDischarging] = useState(false);
  const [generateCertificate, setGenerateCertificate] = useState(true);
  const [selectedDischargeType, setSelectedDischargeType] = useState<'cured' | 'treatment_completed' | null>(null);

  const [patient, setPatient] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  
  // Weight Tracker States
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [editingVitalId, setEditingVitalId] = useState<string | null>(null);
  const [editingVitalWeight, setEditingVitalWeight] = useState<string>("");
  
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

  // DOH Form 4 Tracking Fields
  const [registrationGroup, setRegistrationGroup] = useState("");
  const [anatomicalSite, setAnatomicalSite] = useState("");
  const [dssmResults, setDssmResults] = useState({ month0: "", month2: "", month3: "", month4: "", month5: "", month6: "" });
  const [dohLastSynced, setDohLastSynced] = useState<any>(null);

  const [tbRegimen, setTbRegimen] = useState("6-Month DOTS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [memoText, setMemoText] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [doctorName, setDoctorName] = useState("");

  const [newMed, setNewMed] = useState({ name: "", dosage: "", time: "08:00", start: "", end: "", isCustomName: false });
  const [editingMedId, setEditingMedId] = useState<number | null>(null); 
  
  // Historical Log Engine
  const [historicalLogs, setHistoricalLogs] = useState<any[]>([]);
  const [logPage, setLogPage] = useState(0);
  const [totalLogCount, setTotalLogCount] = useState(0);
  const [logFilter, setLogFilter] = useState<'all' | 'taken' | 'missed' | 'early' | 'on-time' | 'late'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'day' | 'week' | 'month'>('all'); 
  const LOGS_PER_PAGE = 7;

  // --- SMART INTELLIGENCE LOGIC ---
  const checkSmartAlert = (text: string) => {
    const keywords = ['vision', 'blur', 'numb', 'yellow', 'jaundice', 'pain', 'rash', 'itch', 'vomit', 'nausea', 'hearing', 'ringing', 'dizzy', 'seizure', 'joint', 'tingling', 'blood'];
    const lowerText = text.toLowerCase();
    return keywords.some(kw => lowerText.includes(kw));
  };

  const isSputumConverted = useMemo(() => {
    const m0 = dssmResults.month0;
    const m2 = dssmResults.month2;
    const positives = ["1+", "2+", "3+"];
    return positives.includes(m0) && m2 === "Negative";
  }, [dssmResults]);

  const weightChartData = useMemo(() => {
    return [...vitalsHistory].reverse().map(v => ({
        date: new Date(v.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: v.weight_kg
    }));
  }, [vitalsHistory]);

  const formatYMD = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatTimeStr = (timeStr: string) => {
    if (!timeStr) return "--:--";
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hrs = parseInt(parts[0]);
    const mins = parts[1];
    return `${hrs % 12 || 12}:${mins} ${hrs >= 12 ? 'PM' : 'AM'}`;
  };

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
    const fetchDoctorProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.user_metadata?.full_name) {
          setDoctorName(user.user_metadata.full_name);
        } else {
          const { data: p } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
          if (p?.full_name) setDoctorName(p.full_name);
        }
      }
    };
    fetchDoctorProfile();
    fetchData();
  }, [id]);

  useEffect(() => {
    fetchPaginatedLogs();
  }, [id, logPage, logFilter, dateRangeFilter]);

  useEffect(() => {
    const channel = supabase
      .channel(`med-logs-parity-${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'medication_logs', 
        filter: `patient_id=eq.${id}` 
      }, () => {
        fetchData();
        fetchPaginatedLogs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, logPage, logFilter, dateRangeFilter]);

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
      if (profile?.tb_regimen) setTbRegimen(profile.tb_regimen);
      
      if (profile?.registration_group) setRegistrationGroup(profile.registration_group);
      if (profile?.disease_anatomical_site) setAnatomicalSite(profile.disease_anatomical_site);

      // Fetch DSSM Sputum Results from the dedicated dssm_monitoring table
      const { data: dssmLogs } = await supabase
        .from('dssm_monitoring')
        .select('milestone_month, result')
        .eq('patient_id', id);

      if (dssmLogs && dssmLogs.length > 0) {
        const mappedResults = { month0: "", month2: "", month3: "", month4: "", month5: "", month6: "" };
        dssmLogs.forEach((item: any) => {
          const key = item.milestone_month === 'Month 0' 
            ? 'month0' 
            : `month${item.milestone_month.replace('Month ', '')}`;
          if (key in mappedResults) {
            (mappedResults as any)[key] = item.result;
          }
        });
        setDssmResults(mappedResults);
      }

      // Fetch Latest Audit Log for DOH Form
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('created_at, user_name')
        .eq('action_name', 'Updated DOH Form 4')
        .eq('target_entity', profile.full_name)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (auditData) setDohLastSynced(auditData);

      // Fetch Active (Non-Archived) Medications
      const { data: medications } = await supabase.from('medications').select('*').eq('user_id', id);
      setMeds((medications || []).filter(m => !m.is_archived));

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

      // Fetch Vitals History
      const { data: vitalsLogs } = await supabase
        .from('patient_vitals')
        .select('id, weight_kg, recorded_at')
        .eq('patient_id', id)
        .order('recorded_at', { ascending: false });
      
      if (vitalsLogs && vitalsLogs.length > 0) {
        setCurrentWeight(vitalsLogs[0].weight_kg.toString());
        setVitalsHistory(vitalsLogs);
      } else {
        setCurrentWeight("");
        setVitalsHistory([]);
      }

      const todayString = formatYMD(new Date());
      const { data: tLogs } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('patient_id', id)
        .eq('log_date', todayString);
      setTodayLogs(tLogs || []);

    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaginatedLogs = async () => {
    try {
      let query = supabase
        .from('medication_logs')
        .select(`
          id, log_date, time_taken, status, timing_status, created_at,
          medications (name, dosage, time)
        `, { count: 'exact' })
        .eq('patient_id', id);

      if (logFilter === 'taken' || logFilter === 'missed') {
        query = query.eq('status', logFilter);
      } else if (logFilter !== 'all') {
        query = query.eq('timing_status', logFilter);
      }

      if (dateRangeFilter !== 'all') {
        const today = new Date();
        let startDate = new Date();

        if (dateRangeFilter === 'day') {
        } else if (dateRangeFilter === 'week') {
          startDate.setDate(today.getDate() - 7);
        } else if (dateRangeFilter === 'month') {
          startDate.setMonth(today.getMonth() - 1);
        }

        query = query.gte('log_date', formatYMD(startDate)).lte('log_date', formatYMD(today));
      }

      const startRange = logPage * LOGS_PER_PAGE;
      const { data, count, error } = await query
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(startRange, startRange + LOGS_PER_PAGE - 1);

      if (error) throw error;
      setHistoricalLogs(data || []);
      setTotalLogCount(count || 0);
    } catch (err) {
      console.error("Historical log execution error:", err);
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
        .update({ 
          treatment_start_date: startDate, 
          treatment_end_date: endDate,
          tb_regimen: tbRegimen 
        })
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

  const handleSaveDohForm = async () => {
    setSavingDoh(true);
    try {
      // 1. Update Profile Fields
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          registration_group: registrationGroup,
          disease_anatomical_site: anatomicalSite,
        })
        .eq('id', id);

      if (profileErr) throw profileErr;

      // 2. Clear existing entries to prevent unique constraint conflicts, then insert new ones
      await supabase.from('dssm_monitoring').delete().eq('patient_id', id);

      const dssmEntries = Object.entries(dssmResults)
        .filter(([_, result]) => result !== "")
        .map(([monthKey, result]) => {
          const milestoneMonth = monthKey === 'month0' ? 'Month 0' : `Month ${monthKey.replace('month', '')}`;
          return {
            patient_id: id,
            milestone_month: milestoneMonth,
            result: result,
          };
        });

      if (dssmEntries.length > 0) {
        const { error: dssmErr } = await supabase.from('dssm_monitoring').insert(dssmEntries);
        if (dssmErr) throw dssmErr;
      }

      createAuditLog("Updated DOH Form 4", "Clinical Update", patient?.full_name || "Patient", { registrationGroup, anatomicalSite, dssmResults });
      triggerAlert("Success", "DOH Form 4 Classifications updated successfully.", "success");
      fetchData();
    } catch (err: any) {
      triggerAlert("Error", err.message, "error");
    } finally {
      setSavingDoh(false);
    }
  };

  const handleDssmChange = (month: string, value: string) => {
    setDssmResults(prev => ({ ...prev, [month]: value }));
  };

  const handleSaveWeight = async () => {
    if (!currentWeight) return;
    setSavingWeight(true);
    try {
      const { error } = await supabase.from('patient_vitals').insert({
        patient_id: id,
        weight_kg: parseFloat(currentWeight)
      });
      if (error) throw error;
      triggerAlert(t("success"), t("weightSaved"), "success");
      setWeightModalOpen(false);
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setSavingWeight(false);
    }
  };

  const handleDeleteVital = async (vitalId: string) => {
    try {
      await supabase.from('patient_vitals').delete().eq('id', vitalId);
      triggerAlert("Success", "Weight record deleted successfully.", "success");
      fetchData();
    } catch (err: any) {
      triggerAlert("Error", err.message, "error");
    }
  };

  const handleUpdateVital = async (vitalId: string) => {
    if (!editingVitalWeight) return;
    try {
      await supabase.from('patient_vitals').update({ weight_kg: parseFloat(editingVitalWeight) }).eq('id', vitalId);
      triggerAlert("Success", "Weight record updated successfully.", "success");
      setEditingVitalId(null);
      fetchData();
    } catch (err: any) {
      triggerAlert("Error", err.message, "error");
    }
  };

  const handlePostMemo = async () => {
    if (!memoText.trim()) return;
    setPostingMemo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('doctor_notes').insert({
        user_id: id,
        note_text: memoText,
        category: 'Instruction',
        is_checked: false
      });
      if (error) throw error;
      
      // DISPATCH PUSH NOTIFICATION
      await sendNotificationToPatient({
        patientId: id as string,
        doctorId: user?.id,
        title: "New Protocol Memo",
        message: "Your doctor has posted a new instruction to your diary.",
      });

      triggerAlert(t("memoSent"), t("memoSentDesc"), "success");
      setMemoText("");
      setMemoModalOpen(false);
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

      let protocolMilestones = [];

      if (tbRegimen.includes("4-Month")) {
        protocolMilestones = [
          { patient_id: id, doctor_id: user?.id, title: "End of Month 2 Sputum Test", location: "TB DOTS Clinic", appointment_date: addDays(start, 60), status: "pending", type: "protocol" },
          { patient_id: id, doctor_id: user?.id, title: "Final Month 4 Cure Assessment", location: "TB DOTS Clinic", appointment_date: addDays(start, 120), status: "pending", type: "protocol" }
        ];
      } else {
        protocolMilestones = [
          { patient_id: id, doctor_id: user?.id, title: "End of Intensive Phase Sputum Test", location: "TB DOTS Clinic", appointment_date: addDays(start, 60), status: "pending", type: "protocol" },
          { patient_id: id, doctor_id: user?.id, title: "Month 5 Sputum Follow-up", location: "TB DOTS Clinic", appointment_date: addDays(start, 150), status: "pending", type: "protocol" },
          { patient_id: id, doctor_id: user?.id, title: "Final Sputum & Cure Assessment", location: "TB DOTS Clinic", appointment_date: addDays(start, 180), status: "pending", type: "protocol" }
        ];
      }

      await supabase.from('roadmap').insert(protocolMilestones);
      
      // DISPATCH PUSH NOTIFICATION
      await sendNotificationToPatient({
        patientId: id as string,
        doctorId: user?.id,
        title: "Treatment Plan Updated",
        message: "A new DOH TB protocol has been generated for your treatment plan.",
      });

      triggerAlert(t("success"), t("protocolGenerated"), "success");
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddOrUpdatePrescription = async () => {
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
      const { data: { user } } = await supabase.auth.getUser();

      if (editingMedId) {
        // --- SMART EDIT (ANTI-OVERRIDE) ---
        // 1. Archive the old medication so past logs remain accurate
        const todayStr = new Date().toISOString().split('T')[0];
        await supabase.from('medications').update({
          end_date: todayStr, // Close out the old prescription today
          is_archived: true
        }).eq('id', editingMedId);

        // 2. Insert the modified medication as a brand new entry
        await supabase.from('medications').insert({
          user_id: id,
          name: newMed.name,
          dosage: newMed.dosage,
          time: formattedTime,
          start_date: newMed.start,
          end_date: newMed.end,
          is_taken: false,
          is_archived: false
        });

        triggerAlert(t("success"), "Prescription updated safely (historical logs preserved).", "success");
      } else {
        // --- NORMAL INSERT ---
        await supabase.from('medications').insert({
          user_id: id,
          name: newMed.name,
          dosage: newMed.dosage,
          time: formattedTime,
          start_date: newMed.start,
          end_date: newMed.end,
          is_taken: false,
          is_archived: false
        });
        triggerAlert(t("success"), t("prescriptionAdded"), "success");
      }

      // DISPATCH PUSH NOTIFICATION
      await sendNotificationToPatient({
        patientId: id as string,
        doctorId: user?.id,
        title: "Medication Schedule Updated",
        message: "Your doctor has updated your daily medication schedule and logs.",
      });
      
      setNewMed({ name: "", dosage: "", time: "08:00", start: "", end: "", isCustomName: false });
      setEditingMedId(null);
      setPrescriptionModalOpen(false);
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setPrescribing(false);
    }
  };

  const handleEditClick = (med: any) => {
    setEditingMedId(med.id);
    let timeInput = med.time;
    try {
      const match = med.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hrs = parseInt(match[1]);
        const mins = match[2];
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hrs < 12) hrs += 12;
        if (ampm === "AM" && hrs === 12) hrs = 0;
        timeInput = `${hrs.toString().padStart(2, '0')}:${mins}`;
      }
    } catch(e) {}

    const isStandard = STANDARD_TB_DRUGS.includes(med.name);

    setNewMed({
      name: med.name,
      dosage: med.dosage,
      time: timeInput,
      start: med.start_date.split('T')[0],
      end: med.end_date.split('T')[0],
      isCustomName: !isStandard
    });
    setPrescriptionModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingMedId(null);
    setNewMed({ name: "", dosage: "", time: "08:00", start: "", end: "", isCustomName: false });
    setPrescriptionModalOpen(false);
  };

  // --- SMART SOFT DELETE IMPLEMENTATION ---
  const handleDeletePrescription = async (medId: number) => {
    try {
      // Soft Delete: Archive it so past patient logs don't break
      await supabase.from('medications').update({ is_archived: true }).eq('id', medId);
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

  const handleCompleteAuditLogOnly = async (noteId: number) => {
    try {
      await supabase.from('doctor_notes').update({ is_checked: true }).eq('id', noteId);
      fetchData();
    } catch (err: any) { console.error(err); }
  };

  const handleInitiateDischarge = (type: 'cured' | 'treatment_completed') => {
    setSelectedDischargeType(type);
    setConfirmSafetyModalOpen(true);
  };

  const confirmDischarge = async () => {
    if (!selectedDischargeType) return;
    setDischarging(true);
    try {
      await supabase.from('profiles').update({ status: selectedDischargeType }).eq('id', id);

      const cureDate = new Date();
      const in6Months = new Date(cureDate.setMonth(cureDate.getMonth() + 6)).toISOString().split('T')[0];
      const in1Year = new Date(cureDate.setFullYear(cureDate.getFullYear() + 1)).toISOString().split('T')[0];

      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('roadmap').insert([
        { patient_id: id, doctor_id: user?.id, title: "6-Month Post-Treatment X-Ray Follow-up", location: "Carmona Health Center", appointment_date: in6Months, status: "scheduled", type: "post-treatment" },
        { patient_id: id, doctor_id: user?.id, title: "1-Year Post-Treatment Medical Clearance", location: "Carmona Health Center", appointment_date: in1Year, status: "scheduled", type: "post-treatment" }
      ]);

      createAuditLog("Patient Discharged", "Treatment Lifecycle", patient.full_name, { action: `Marked ${selectedDischargeType} & Scheduled Follow-ups` });

      // DISPATCH PUSH NOTIFICATION
      await sendNotificationToPatient({
        patientId: id as string,
        doctorId: user?.id,
        title: "Treatment Completed! 🏆",
        message: "Congratulations! You have been officially discharged and marked as Cured.",
      });

      setConfirmSafetyModalOpen(false);
      setDischargeModalOpen(false);
      triggerAlert(t("success"), t("dischargeSuccess"), "success");
      
      if (generateCertificate) {
        setTimeout(() => {
          window.print();
          fetchData();
        }, 1500);
      } else {
        fetchData();
      }

    } catch(err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setDischarging(false);
    }
  };

  const getTimingBadgeColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'early': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'late': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getRiskColor = (level: string) => {
    const normalStr = level?.toLowerCase() || "";
    if (normalStr.includes("high")) return "bg-red-100 text-red-800 border-red-200";
    if (normalStr.includes("mod") || normalStr.includes("med")) return "bg-amber-100 text-amber-900 border-amber-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  const aggregatedAdherenceRate = patient?.adherence_rate ?? 0;
  const isCured = patient?.status === 'cured' || patient?.status === 'treatment_completed';

  let timeProgress = 0;
  let daysLeft = 0;
  let phase = t("notStarted");
  let phaseColor = "bg-slate-100 text-slate-800 border-slate-300";
  let phaseDesc = "";
  
  if (isCured) {
    phase = t("postCarePhase");
    timeProgress = 100;
    phaseColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
    phaseDesc = "Patient has completed their required treatment protocol.";
  } else if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const totalDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const elapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24));
    
    timeProgress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    daysLeft = Math.max(totalDuration - elapsed, 0);

    if (elapsed <= 60) {
      phase = t("intensivePhase");
      phaseColor = "bg-amber-100 text-amber-900 border-amber-300";
      phaseDesc = "Patient is in the first 2 months (Intensive Phase). Standard protocol requires 4 drugs.";
    } else {
      phase = t("continuationPhase");
      phaseColor = "bg-blue-100 text-blue-900 border-blue-300";
      phaseDesc = `Patient is in the Continuation Phase for the ${tbRegimen}.`;
    }
  }

  const todayD = new Date();
  todayD.setHours(0,0,0,0);
  
  // Dynamic Medication Filtering based on dates
  const activeMeds = meds.filter((med) => {
    const s = new Date(med.start_date); s.setHours(0,0,0,0);
    const e = new Date(med.end_date); e.setHours(0,0,0,0);
    return todayD >= s && todayD <= e;
  });

  const pastMeds = meds.filter((med) => {
    const e = new Date(med.end_date); e.setHours(0,0,0,0);
    return todayD > e;
  });

  return (
    <DashboardLayout role="doctor" userName={doctorName || "Doctor"}>
      
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans print:hidden">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-[#DDE5B6]' : 'bg-slate-200'}`}>
            {alert.type === 'success' ? <CheckCircle2 className="h-6 w-6 text-[#606C38]" /> : <AlertCircle className="h-6 w-6 text-slate-700" />}
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-black text-center">{alert.title}</DialogTitle>
            <DialogDescription className="text-slate-600 mt-2 text-sm text-center">
              {alert.message}
            </DialogDescription>
          </DialogHeader>
          <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#283618] text-white" onClick={() => setAlert({...alert, open: false})}>Okay</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={weightModalOpen} onOpenChange={setWeightModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 bg-white font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">{t("updateWeight")}</DialogTitle>
            <DialogDescription className="text-slate-500 pt-1">
              Record the patient's current weight in kilograms for proper dosage calibration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider mb-2 block">{t("weight")}</Label>
            <Input 
              type="number" 
              placeholder="e.g. 65" 
              className="bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#606C38]" 
              value={currentWeight} 
              onChange={(e) => setCurrentWeight(e.target.value)} 
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWeightModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWeight} disabled={savingWeight || !currentWeight} className="bg-[#606C38] hover:bg-[#283618] text-white rounded-xl">
              {savingWeight ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Vitals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={memoModalOpen} onOpenChange={setMemoModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">{t("protocolMemo")}</DialogTitle>
            <DialogDescription className="text-slate-500 pt-1">
              Push daily instructions directly to the patient's mobile diary.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea 
              placeholder={t("memoPlaceholder")} 
              className="text-sm resize-none bg-slate-50 border-slate-200 h-32 rounded-xl focus-visible:ring-[#606C38]"
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMemoModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handlePostMemo} 
              disabled={postingMemo || !memoText.trim()}
              className="bg-[#606C38] hover:bg-[#283618] text-white rounded-xl font-semibold"
            >
              {postingMemo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SendHorizontal className="h-4 w-4 mr-2" />}
              {t("pushMemo")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={prescriptionModalOpen} onOpenChange={(open) => {
        setPrescriptionModalOpen(open);
        if(!open) handleCancelEdit();
      }}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl p-6 bg-white font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingMedId ? t("editMed") : t("newMed")}
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-1">
              Configure medication details. This will automatically sync with the patient's schedule.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">{t("medName")}</Label>
              <Select 
                value={newMed.isCustomName ? 'Other' : newMed.name} 
                onValueChange={(v) => {
                  if (v === 'Other') setNewMed({...newMed, name: '', isCustomName: true});
                  else setNewMed({...newMed, name: v, isCustomName: false});
                }}
              >
                <SelectTrigger className="w-full h-10 bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-[#606C38]">
                  <SelectValue placeholder="Select DOH TB Drug..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-xl">
                  <SelectGroup>
                    {STANDARD_TB_DRUGS.map((drug) => (
                      <SelectItem key={drug} value={drug} className="font-medium">{drug}</SelectItem>
                    ))}
                    <SelectItem value="Other" className="font-medium text-[#606C38]">Custom / Other...</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {newMed.isCustomName && (
                <Input 
                  placeholder="Type custom medication name" 
                  className="mt-2 h-10 text-sm bg-white border-slate-300 rounded-lg focus-visible:ring-[#606C38]" 
                  value={newMed.name} 
                  onChange={(e) => setNewMed({...newMed, name: e.target.value})} 
                  autoFocus
                />
              )}
            </div>
            <div className="col-span-1">
              <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">{t("dosage")}</Label>
              <Input placeholder={t("dosage")} className="h-10 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-[#606C38]" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} />
            </div>
            <div className="col-span-1">
              <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Time</Label>
              <Input type="time" className="h-10 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-[#606C38]" value={newMed.time} onChange={(e) => setNewMed({...newMed, time: e.target.value})} />
            </div>
            <div className="col-span-1">
              <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Start Date</Label>
              <Input type="date" className="h-10 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-[#606C38] w-full" value={newMed.start} onChange={(e) => setNewMed({...newMed, start: e.target.value})} />
            </div>
            <div className="col-span-1">
              <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">End Date</Label>
              <Input type="date" className="h-10 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-[#606C38] w-full" value={newMed.end} onChange={(e) => setNewMed({...newMed, end: e.target.value})} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
            <Button onClick={handleAddOrUpdatePrescription} className={`rounded-lg text-white font-medium ${editingMedId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#606C38] hover:bg-[#283618]'}`} disabled={prescribing}>
              {prescribing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (editingMedId ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />)} 
              {editingMedId ? t("updateMed") : t("pushToPatient")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dischargeModalOpen} onOpenChange={setDischargeModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 bg-white font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Patient Discharge Classification</DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              Select the final DOH classification to discharge this patient and close active monitoring records.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 my-2">
            <input 
              type="checkbox" 
              id="certToggle"
              checked={generateCertificate}
              onChange={(e) => setGenerateCertificate(e.target.checked)}
              className="h-4 w-4 rounded text-[#606C38] focus:ring-[#606C38] border-slate-300 cursor-pointer"
            />
            <label htmlFor="certToggle" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
              Auto-generate and print dynamic E-Clearance Certificate
            </label>
          </div>

          <div className="grid gap-4 py-2">
            <Button 
              variant="outline" 
              className="h-auto flex flex-col items-start p-4 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-500 transition-all text-left"
              onClick={() => handleInitiateDischarge('cured')}
            >
              <span className="font-bold text-emerald-800 text-lg">Cured</span>
              <span className="text-slate-600 font-normal mt-1 text-sm whitespace-normal">
                Patient has completed the treatment duration AND presented a negative sputum smear result at the final assessment phase.
              </span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex flex-col items-start p-4 border-blue-200 hover:bg-blue-50 hover:border-blue-500 transition-all text-left"
              onClick={() => handleInitiateDischarge('treatment_completed')}
            >
              <span className="font-bold text-blue-800 text-lg">Treatment Completed</span>
              <span className="text-slate-600 font-normal mt-1 text-sm whitespace-normal">
                Patient has successfully completed the specified treatment duration, but a final laboratory assessment is unavailable.
              </span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDischargeModalOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmSafetyModalOpen} onOpenChange={setConfirmSafetyModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 bg-white font-sans border border-slate-200 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-amber-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 text-center">Confirm Patient Discharge?</DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center mt-2 leading-relaxed">
              Are you sure you want to finalize entry execution? Discharging will lock active records for 
              <strong> {patient?.full_name}</strong> as <span className="font-bold text-slate-900 uppercase">"{selectedDischargeType?.replace('_', ' ')}"</span>. This pipeline change is logged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 font-semibold"
              onClick={() => setConfirmSafetyModalOpen(false)}
              disabled={discharging}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={confirmDischarge}
              disabled={discharging}
            >
              {discharging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Confirm Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in pb-10 print:hidden">
        
        {/* --- STICKY ACTION HEADER --- */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md py-4 border-b border-slate-200 mb-6 flex items-center justify-between shadow-sm px-4 -mx-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-[#606C38] hover:bg-[#FEFAE0] rounded-xl px-4">
            <ArrowLeft className="h-4 w-4" /> {t("backBtn")}
          </Button>

          {!isCured && (
            <Button 
              onClick={() => setDischargeModalOpen(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold shadow-sm px-5"
            >
              <FileCheck2 className="h-4 w-4" />
              {t("dischargeBtn")}
            </Button>
          )}
        </div>

        {!isCured && startDate && endDate && (
          <div className={`rounded-xl border p-4 flex items-start gap-4 shadow-sm ${phaseColor}`}>
            <Info className="h-6 w-6 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">{phase} - {tbRegimen}</h3>
              <p className="text-sm mt-1 opacity-90">{phaseDesc}</p>
            </div>
          </div>
        )}

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
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <h2 className="text-3xl font-bold text-black tracking-tight">{patient?.full_name}</h2>
                    {patient?.risk_level && (
                      <Badge variant="outline" className={`font-extrabold px-3 py-1 uppercase text-xs tracking-wider border ${getRiskColor(patient.risk_level)}`}>
                        {patient.risk_level} 
                      </Badge>
                    )}
                    {/* --- SPUTUM CONVERSION BADGE --- */}
                    {isSputumConverted && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold tracking-wide uppercase px-2 py-1 border-none shadow-sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Sputum Converted
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-slate-500 font-medium text-sm">
                    {patient?.age && <span>{patient.age} yrs old</span>}
                    {patient?.age && patient?.gender && <span className="text-slate-300">•</span>}
                    {patient?.gender && <span className="capitalize">{patient.gender}</span>}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 pt-1 text-slate-600 font-medium text-sm">
                    {patient?.phone_number && (
                      <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {patient.phone_number}</span>
                    )}
                    {patient?.phone_number && patient?.email && <span className="text-slate-300 hidden sm:inline">•</span>}
                    {patient?.email && (
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {patient.email}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:mt-1">
                  <Badge variant="default" className={`px-3 py-1 font-semibold ${isCured ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[#606C38] hover:bg-[#283618] text-white border-none"}`}>
                    {patient?.status === 'cured' ? t("curedPatient") : (patient?.status === 'treatment_completed' ? t("treatmentCompletedPatient") : t("verifiedPatient"))}
                  </Badge>
                  <Badge variant="outline" className={`font-bold px-3 py-1 ${isCured ? "bg-slate-100 text-slate-600 border-slate-300" : "bg-[#FEFAE0] text-[#606C38] border-[#DDE5B6]"}`}>
                    {phase}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-3 border-t border-slate-100 mt-4">
                {patient?.is_symptomatic && <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50 px-3 py-1">{t("symptomatic")}</Badge>}
                {patient?.is_close_contact && <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50 px-3 py-1">{t("closeContact")}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- TAB NAVIGATION --- */}
        <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-hide">
          <Button 
            variant={activeTab === 'overview' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('overview')} 
            className={`rounded-xl px-5 font-bold transition-all ${activeTab === 'overview' ? 'bg-[#606C38] text-white hover:bg-[#283618] shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Overview
          </Button>
          <Button 
            variant={activeTab === 'clinical' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('clinical')} 
            className={`rounded-xl px-5 font-bold transition-all ${activeTab === 'clinical' ? 'bg-[#606C38] text-white hover:bg-[#283618] shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Clinical & Prescriptions
          </Button>
          <Button 
            variant={activeTab === 'roadmap' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('roadmap')} 
            className={`rounded-xl px-5 font-bold transition-all ${activeTab === 'roadmap' ? 'bg-[#606C38] text-white hover:bg-[#283618] shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Roadmap & Protocols
          </Button>
        </div>

        {/* --- TAB CONTENT: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
            
            {/* Left Column - Doctor Notes */}
            <div className="space-y-6 lg:col-span-1">
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-md text-[#283618] font-bold">
                    <MessageSquare className="h-5 w-5 text-[#606C38]" /> {t("patientReports")}
                  </CardTitle>
                  {!isCured && (
                    <Button size="sm" onClick={() => setMemoModalOpen(true)} className="bg-[#606C38] hover:bg-[#283618] text-white rounded-lg h-8 px-3">
                      <Plus className="h-3 w-3 mr-1" /> Memo
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  {notes.filter(n => !n.is_checked && n.category !== 'Instruction').length === 0 ? (
                    <div className="py-6 text-center bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-sm text-slate-500 italic">{t("noConcerns")}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {notes.filter(n => !n.is_checked && n.category !== 'Instruction').map(note => {
                        const isAlert = checkSmartAlert(note.note_text);
                        return (
                          <div key={note.id} className={`p-4 border rounded-xl ${isAlert ? 'border-red-300 bg-red-50' : 'border-[#DDE5B6] bg-[#FEFAE0]/40'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-wrap gap-2 items-center">
                                <Badge variant="outline" className={`text-[10px] bg-white ${isAlert ? 'text-red-700 border-red-200' : 'text-[#606C38] border-[#DDE5B6]'}`}>{note.category}</Badge>
                                {isAlert && (
                                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] border-none shadow-sm flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" /> Action Required
                                  </Badge>
                                )}
                              </div>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-[#606C38] hover:bg-white rounded-full" onClick={() => handleCompleteAuditLogOnly(note.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className={`text-sm font-medium leading-relaxed ${isAlert ? 'text-red-900' : 'text-black'}`}>{note.note_text}</p>
                            <p className="text-[11px] text-slate-500 mt-3 font-medium">{new Date(note.created_at).toLocaleDateString()}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Dedicated Weight Tracker with Chart */}
            <div className="space-y-6 lg:col-span-2">
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 bg-[#F4F7F4]/50 rounded-t-2xl">
                  <CardTitle className="flex items-center gap-2 text-md text-[#283618] font-bold">
                    <Scale className="h-5 w-5 text-[#606C38]" /> {t("patientVitals")} (Weight Tracker)
                  </CardTitle>
                  {!isCured && (
                    <Button size="sm" onClick={() => setWeightModalOpen(true)} className="bg-[#606C38] hover:bg-[#283618] text-white rounded-lg h-8 px-3">
                      <Plus className="h-3 w-3 mr-1" /> {t("updateWeight")}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-6 flex flex-col space-y-6">
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Current Weight Block */}
                    <div className="md:w-1/3 flex flex-col justify-center items-center bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Most Recent Weight</p>
                      <p className="text-5xl font-extrabold text-[#283618]">{currentWeight || "--"} <span className="text-xl text-slate-500 font-bold">kg</span></p>
                    </div>

                    {/* --- WEIGHT TREND CHART --- */}
                    <div className="md:w-2/3 h-[180px] w-full border border-slate-100 rounded-2xl p-4 bg-white shadow-sm">
                      {vitalsHistory.length < 2 ? (
                         <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">
                           Log at least 2 weight records to view trend chart.
                         </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weightChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                            <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              itemStyle={{ color: '#283618', fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="weight" stroke="#606C38" strokeWidth={3} dot={{r: 4, fill: '#606C38', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Vitals History Editable Table */}
                  <div className="flex-1 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Historical Logs</p>
                    {vitalsHistory.length === 0 ? (
                      <div className="py-10 text-center bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm text-slate-500 italic">No weight records found for this patient.</p>
                      </div>
                    ) : (
                      <div className="max-h-[250px] overflow-y-auto border border-slate-200 rounded-xl">
                        <Table>
                          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-xs font-bold text-slate-700 h-10 px-5">Date Recorded</TableHead>
                              <TableHead className="text-xs font-bold text-slate-700 h-10 px-5 text-right w-[150px]">Weight (kg)</TableHead>
                              {!isCured && <TableHead className="text-xs font-bold text-slate-700 h-10 px-5 text-right w-[120px]">Actions</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vitalsHistory.map((vital, idx) => (
                              <TableRow key={vital.id || idx} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                                <TableCell className="text-sm font-semibold text-slate-700 py-3.5 px-5">
                                  {new Date(vital.recorded_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </TableCell>
                                <TableCell className="text-sm font-bold text-black text-right py-3.5 px-5">
                                  {editingVitalId === vital.id ? (
                                    <Input 
                                      type="number" 
                                      value={editingVitalWeight} 
                                      onChange={(e) => setEditingVitalWeight(e.target.value)} 
                                      className="w-24 ml-auto h-9 text-right font-bold focus-visible:ring-[#606C38]" 
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="text-lg">{vital.weight_kg} <span className="text-xs text-slate-400 font-medium">kg</span></span>
                                  )}
                                </TableCell>
                                {!isCured && (
                                  <TableCell className="text-right py-3.5 px-5">
                                    {editingVitalId === vital.id ? (
                                      <div className="flex justify-end gap-1.5">
                                        <Button size="icon" variant="ghost" onClick={() => handleUpdateVital(vital.id)} className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50">
                                          <Check className="h-4 w-4"/>
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => setEditingVitalId(null)} className="h-8 w-8 text-slate-500 hover:bg-slate-100">
                                          <X className="h-4 w-4"/>
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex justify-end gap-1.5">
                                        <Button size="icon" variant="ghost" onClick={() => { setEditingVitalId(vital.id); setEditingVitalWeight(vital.weight_kg.toString()); }} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                                          <Edit className="h-4 w-4"/>
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteVital(vital.id)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                                          <Trash2 className="h-4 w-4"/>
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: CLINICAL & PRESCRIPTIONS --- */}
        {activeTab === 'clinical' && (
          <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
            <div className="space-y-6 lg:col-span-1">
              
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white flex flex-col h-full">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-md font-bold flex items-center gap-2 text-[#283618]">
                    <Pill className="h-5 w-5 text-[#606C38]" /> {t("prescriptions")}
                  </CardTitle>
                  {!isCured && (
                    <Button size="sm" onClick={() => { setEditingMedId(null); setPrescriptionModalOpen(true); }} className="bg-[#606C38] hover:bg-[#283618] text-white rounded-lg h-8 px-3">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex-1 p-4 max-h-[500px] overflow-y-auto">
                  {/* --- ACTIVE MEDS --- */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active & Upcoming</p>
                    <div className="space-y-3">
                      {activeMeds.length === 0 ? (
                        <div className="py-4 text-center border border-dashed border-slate-200 rounded-xl">
                          <p className="text-sm text-slate-400 italic">No active prescriptions.</p>
                        </div>
                      ) : activeMeds.map((med) => (
                        <div key={med.id} className="flex justify-between items-center p-4 rounded-xl border border-[#DDE5B6] bg-white shadow-sm">
                          <div>
                            <p className="text-sm font-bold text-black mb-1">{med.name} <span className="font-medium text-slate-500">({med.dosage})</span></p>
                            <p className="text-[11px] font-medium text-slate-400">{new Date(med.start_date).toLocaleDateString()} - {new Date(med.end_date).toLocaleDateString()} • {med.time}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!isCured && (
                              <>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => handleEditClick(med)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDeletePrescription(med.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* --- COMPLETED MEDS --- */}
                  {pastMeds.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Completed / Past</p>
                      <div className="space-y-3">
                        {pastMeds.map((med) => (
                          <div key={med.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50 opacity-70">
                            <div>
                              <p className="text-sm font-bold text-slate-600 mb-1">{med.name} <span className="font-medium text-slate-400">({med.dosage})</span></p>
                              <p className="text-[11px] font-medium text-slate-400">{new Date(med.start_date).toLocaleDateString()} - {new Date(med.end_date).toLocaleDateString()}</p>
                            </div>
                            {!isCured && (
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDeletePrescription(med.id)}>
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6 lg:col-span-2">
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 bg-[#F4F7F4]/50 rounded-t-2xl">
                  <div className="flex justify-between items-center w-full">
                    <CardTitle className="text-md font-bold flex items-center gap-2 text-[#283618]">
                      <ClipboardList className="h-5 w-5 text-[#606C38]" /> DOH TB Form 4 Classifications
                    </CardTitle>
                    {/* --- LAST SYNCED INDICATOR --- */}
                    {dohLastSynced && (
                      <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Last Synced: {new Date(dohLastSynced.created_at).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registration Group</Label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                        value={registrationGroup}
                        onChange={(e) => setRegistrationGroup(e.target.value)}
                        disabled={isCured}
                      >
                        <option value="">Select Group...</option>
                        <option value="New">New</option>
                        <option value="Relapse">Relapse</option>
                        <option value="Treatment After Failure">Treatment After Failure</option>
                        <option value="Treatment After Default">Treatment After Default</option>
                        <option value="Transfer-in">Transfer-in</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Disease Anatomical Site</Label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                        value={anatomicalSite}
                        onChange={(e) => setAnatomicalSite(e.target.value)}
                        disabled={isCured}
                      >
                        <option value="">Select Site...</option>
                        <option value="Pulmonary">Pulmonary (PTB)</option>
                        <option value="Extra-pulmonary">Extra-pulmonary (EPTB)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">DSSM Sputum Monitoring (Results)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {['month0', 'month2', 'month3', 'month4', 'month5', 'month6'].map((monthKey) => {
                        const monthLabel = monthKey === 'month0' ? 'Month 0' : `Month ${monthKey.replace('month', '')}`;
                        return (
                          <div key={monthKey} className="flex flex-col gap-1 border border-slate-100 bg-slate-50 rounded-lg p-2 text-center">
                            <span className="text-[10px] font-bold text-slate-500">{monthLabel}</span>
                            <select 
                              className="w-full bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded h-8 px-1 focus:outline-none focus:border-[#606C38]"
                              value={(dssmResults as any)[monthKey] || ""}
                              onChange={(e) => handleDssmChange(monthKey, e.target.value)}
                              disabled={isCured}
                            >
                              <option value="">-</option>
                              <option value="Negative">0 (Neg)</option>
                              <option value="1+">+</option>
                              <option value="2+">++</option>
                              <option value="3+">+++</option>
                              <option value="Not Done">N/D</option>
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {!isCured && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <Button onClick={handleSaveDohForm} className="bg-[#606C38] hover:bg-[#283618] text-white rounded-xl h-10 font-semibold px-6" disabled={savingDoh}>
                        {savingDoh ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save DOH Data
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medication Logs & Adherence History Card */}
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-md font-bold flex items-center gap-2 text-[#283618]">
                      <CalendarDays className="h-5 w-5 text-[#606C38]" /> {t("medicationDiary")}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden mr-2">
                      <div className="px-2 border-r border-slate-200 bg-slate-100 flex items-center justify-center h-8">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <select
                        value={dateRangeFilter}
                        onChange={(e) => { setDateRangeFilter(e.target.value as any); setLogPage(0); }}
                        className="bg-transparent text-xs font-bold text-slate-700 h-8 px-2 focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Dates</option>
                        <option value="day">Today</option>
                        <option value="week">Past 7 Days</option>
                        <option value="month">Past 30 Days</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden">
                      <div className="px-2 border-r border-slate-200 bg-slate-100 flex items-center justify-center h-8">
                        <Filter className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <select
                        value={logFilter}
                        onChange={(e) => { setLogFilter(e.target.value as any); setLogPage(0); }}
                        className="bg-transparent text-xs font-bold text-slate-700 h-8 px-2 focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="taken">Marked Taken</option>
                        <option value="missed">Marked Missed</option>
                        <option value="early">Evaluated: Early</option>
                        <option value="on-time">Evaluated: On-Time</option>
                        <option value="late">Evaluated: Late</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/70">
                        <TableRow className="border-b border-slate-100 hover:bg-transparent">
                          <TableHead className="text-xs font-bold text-slate-700 h-10 pl-5">Date</TableHead>
                          <TableHead className="text-xs font-bold text-slate-700 h-10">Medication Details</TableHead>
                          <TableHead className="text-xs font-bold text-slate-700 h-10">Target Schedule</TableHead>
                          <TableHead className="text-xs font-bold text-slate-700 h-10">Intake Log</TableHead>
                          <TableHead className="text-xs font-bold text-slate-700 h-10">Status</TableHead>
                          <TableHead className="text-xs font-bold text-slate-700 h-10 pr-5">Accuracy Evaluation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historicalLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center italic text-xs text-slate-400 py-10">No medication diaries match your active query framework filter.</TableCell>
                          </TableRow>
                        ) : historicalLogs.map((log) => (
                          <TableRow key={log.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                            <TableCell className="text-xs font-bold text-slate-900 h-12 pl-5">
                              {new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-slate-800">
                              {log.medications?.name || "Deleted Med"} <span className="text-slate-400 font-medium">({log.medications?.dosage || "N/A"})</span>
                            </TableCell>
                            <TableCell className="text-xs font-medium text-slate-500">
                              {log.medications?.time ? log.medications.time : "--:--"}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-slate-600">
                              {log.time_taken ? formatTimeStr(log.time_taken) : "--:--"}
                            </TableCell>
                            <TableCell className="h-12">
                              <Badge className={`text-[10px] font-bold border-none uppercase ${log.status === 'taken' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {log.status === 'taken' ? t("taken") : 'missed'}
                              </Badge>
                            </TableCell>
                            <TableCell className="pr-5 h-12">
                              <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 capitalize border ${getTimingBadgeColor(log.timing_status)}`}>
                                {log.timing_status === 'on-time' ? `🎯 ${t("onTime")}` : (log.timing_status === 'early' ? t("early") : (log.timing_status === 'late' ? t("late") : t("missed")))}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
                    <span className="text-xs text-slate-500 font-bold">
                      Showing {historicalLogs.length > 0 ? (logPage * LOGS_PER_PAGE) + 1 : 0} - {Math.min((logPage * LOGS_PER_PAGE) + LOGS_PER_PAGE, totalLogCount)} of {totalLogCount} records
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-slate-200"
                        disabled={logPage === 0}
                        onClick={() => setLogPage(prev => Math.max(0, prev - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-slate-200"
                        disabled={(logPage + 1) * LOGS_PER_PAGE >= totalLogCount}
                        onClick={() => setLogPage(prev => prev + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {startDate && endDate && (
                <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white mt-6">
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2 text-md text-[#283618] font-bold">
                      <Pill className="h-5 w-5 text-[#606C38]" /> Today's Medication Status
                    </CardTitle>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {activeMeds.length === 0 ? (
                      <p className="text-sm text-slate-500 italic text-center py-4">No medications scheduled for today.</p>
                    ) : (
                      <div className="space-y-3">
                        {activeMeds.map(med => {
                          const log = todayLogs.find(l => l.medication_id.toString() === med.id.toString());
                          return (
                            <div key={med.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50">
                              <div>
                                <p className="text-sm font-bold text-slate-800">{med.name} <span className="text-slate-500 font-medium">({med.dosage})</span></p>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">Target: {med.time}</p>
                              </div>
                              <div className="text-right flex flex-col items-end justify-center">
                                {log && log.status === 'taken' ? (
                                  <>
                                    <Badge className="bg-emerald-100 text-emerald-800 border-none uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 mb-1 flex items-center justify-center">
                                      <CheckCircle2 className="w-3 h-3 mr-1 inline" /> {t("taken")}
                                    </Badge>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${log.timing_status === 'on-time' ? 'text-emerald-600' : (log.timing_status === 'early' ? 'text-blue-600' : 'text-amber-600')}`}>
                                      {log.timing_status === 'on-time' ? '🎯 On Time' : log.timing_status}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium block">at {formatTimeStr(log.time_taken)}</span>
                                  </>
                                ) : (
                                  <Badge className="bg-amber-100 text-amber-800 border-none uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 flex items-center justify-center">
                                    <Activity className="w-3 h-3 mr-1 inline" /> Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: ROADMAP & PROTOCOLS --- */}
        {activeTab === 'roadmap' && (
          <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
            <div className="space-y-6 lg:col-span-1">
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#283618] font-bold">
                    <Activity className="h-5 w-5 text-[#606C38]" /> {t("roadmapConfig")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  {!isCured ? (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-black font-bold">{t("selectRegimen")}</Label>
                          <select 
                            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-[#606C38] focus:border-transparent transition-all"
                            value={tbRegimen}
                            onChange={(e) => setTbRegimen(e.target.value)}
                          >
                            <option value="6-Month DOTS">{t("sixMonthDots")}</option>
                            <option value="Shortened 4-Month Regimen (BPaL/BPaLM)">{t("fourMonthRegimen")}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-black font-bold">{t("startDate")}</Label>
                          <Input type="date" className="bg-slate-50 border-slate-200 rounded-xl h-11 focus-visible:ring-[#606C38]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-500 font-bold">{t("endDate")}</Label>
                          <Input type="date" className="bg-slate-100 text-slate-500 font-semibold border-slate-200 rounded-xl h-11" value={endDate} readOnly disabled />
                        </div>
                      </div>
                      
                      <div className="pt-4 space-y-3 border-t border-slate-100">
                        <Button onClick={handleSaveTreatment} className="w-full bg-[#283618] hover:bg-[#1a2310] text-white rounded-xl h-11 font-semibold" disabled={saving}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          {t("saveSync")}
                        </Button>
                        <Button onClick={handleGenerateProtocol} variant="outline" className="w-full border-[#606C38] text-[#606C38] hover:bg-[#FEFAE0] rounded-xl h-11 font-semibold" disabled={generating || !startDate}>
                          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                          {t("autoGen")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-center">
                      <FileCheck2 className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
                      <p className="text-emerald-800 font-bold">Treatment Finalized</p>
                      <p className="text-xs text-slate-500 mt-1">Roadmap configuration is locked for discharged patients.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white flex flex-col h-full">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-md font-bold flex items-center gap-2 text-[#283618]">
                    <CalendarDays className="h-5 w-5 text-[#606C38]" /> {t("milestones")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableBody>
                        {appointments.length === 0 ? (
                          <TableRow>
                            <TableCell className="text-center italic py-10 text-slate-400">{t("noMilestones")}</TableCell>
                          </TableRow>
                        ) : appointments.filter(a => a.status !== 'completed').map((appt) => (
                          <TableRow key={appt.id} className="hover:bg-slate-50 border-b border-slate-100">
                            <TableCell className="py-5 px-6">
                              <p className="text-sm font-bold text-black mb-1">
                                {appt.title || 'Follow-up'}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[12px] font-medium text-slate-500">
                                  {new Date(appt.appointment_date).toLocaleDateString()} • {appt.location}
                                </p>
                                {appt.type === 'protocol' && (
                                  <Badge variant="outline" className="text-[10px] h-5 px-2 border-[#DDE5B6] bg-[#FEFAE0] text-[#606C38]">
                                    {t("dohProtocol")}
                                  </Badge>
                                )}
                                {appt.type === 'post-treatment' && (
                                  <Badge variant="outline" className="text-[10px] h-5 px-2 border-emerald-200 bg-emerald-50 text-emerald-700">
                                    Post-Treatment
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-5 px-6">
                              <Button size="sm" variant="outline" className="border-[#606C38] text-[#606C38] hover:bg-[#606C38] hover:text-white rounded-lg transition-colors" onClick={() => handleCompleteAppointment(appt.id)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Complete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
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
            This is to certify that <strong>{patient?.full_name?.toUpperCase()}</strong>, a resident of Barangay {patient?.barangay || "Carmona"}, has successfully completed the required Directly Observed Treatment, Short-course (DOTS) regimen under the supervision of the Carmona Health Center.
          </p>

          <div className="grid grid-cols-2 gap-y-6 text-md bg-slate-50 p-6 rounded-lg border border-slate-200">
            <div>
              <span className="font-bold text-slate-500 block text-xs">PATIENT ID</span>
              <span className="font-semibold">{patient?.id?.substring(0, 8).toUpperCase()}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-xs">TREATMENT PROTOCOL</span>
              <span className="font-semibold">{tbRegimen}</span>
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
              <span className="font-extrabold text-emerald-700 uppercase">
                {patient?.status === 'cured' ? 'Cured' : (patient?.status === 'treatment_completed' ? 'Treatment Completed' : 'Pending')}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-xs">ADHERENCE RATE</span>
              <span className="font-semibold">{Math.round(aggregatedAdherenceRate)}%</span>
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