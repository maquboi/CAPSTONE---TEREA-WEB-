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
  X,
  ShieldAlert,
  Printer,
  CalendarPlus,
  RefreshCw,
  Undo2
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
    postCarePhase: "Post-Care Surveillance",
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
    purgeData: "Delete Record",
    printReport: "Print E-Discharge Certificate"
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
    postCarePhase: "Post-Care Surveillance",
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
    purgeData: "Burahin ang Rekord",
    printReport: "I-print ang E-Discharge Certificate"
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

  const [activeTab, setActiveTab] = useState<'overview' | 'clinical' | 'roadmap'>('overview');

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
  
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [confirmSafetyModalOpen, setConfirmSafetyModalOpen] = useState(false); 
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);

  // Relapse & Rollback Modals
  const [relapseModalOpen, setRelapseModalOpen] = useState(false);
  const [isRelapsing, setIsRelapsing] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const [discharging, setDischarging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [generateCertificate, setGenerateCertificate] = useState(true);
  const [selectedDischargeType, setSelectedDischargeType] = useState<'cured' | 'treatment_completed' | null>(null);

  const [patient, setPatient] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [editingVitalId, setEditingVitalId] = useState<string | null>(null);
  const [editingVitalWeight, setEditingVitalWeight] = useState<string>("");
  
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

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

  const [newMed, setNewMed] = useState({ name: "", dosage: "", time: "08:00 AM", start: "", end: "", isCustomName: false });
  const [editingMedId, setEditingMedId] = useState<string | null>(null); 
  
  const [milestoneForm, setMilestoneForm] = useState({ id: null as string | null, title: "", appointment_date: "", location: "Carmona Health Center", type: "follow-up" });

  const [historicalLogs, setHistoricalLogs] = useState<any[]>([]);
  const [logPage, setLogPage] = useState(0);
  const [totalLogCount, setTotalLogCount] = useState(0);
  const [logFilter, setLogFilter] = useState<'all' | 'taken' | 'missed' | 'early' | 'on-time' | 'late'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'day' | 'week' | 'month'>('all'); 
  const LOGS_PER_PAGE = 7;

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

  const getTabletCount = (weight: number) => {
    if (weight >= 30 && weight <= 37) return 2;
    if (weight >= 38 && weight <= 54) return 3;
    if (weight >= 55 && weight <= 70) return 4;
    if (weight > 70) return 5;
    return 0;
  };

  const calculateDosage = (weight: number, isContinuation: boolean) => {
    const tablets = getTabletCount(weight);
    if (tablets === 0) return "Consult Specialist (Under 30kg)";
    if (isContinuation) return `${tablets} tablets daily (Isoniazid + Rifampicin)`;
    return `${tablets} tablets daily (HRZE: Rifampicin, Isoniazid, Pyrazinamide, Ethambutol)`;
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

      // 1. Session Check (Prevents 403 / 406 Coercion Crashes)
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData.session) {
        triggerAlert("Session Expired", "Please log in to continue accessing clinic records.", "error");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      const currentUser = sessionData.session.user;

      // 2. Fetch Doctor Profile
      if (currentUser.user_metadata?.full_name) {
        setDoctorName(currentUser.user_metadata.full_name);
      } else {
        const { data: docProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (docProfile?.full_name) setDoctorName(docProfile.full_name);
      }

      // 3. Fetch Patient Record safely with fallback
      let { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
      if (profileErr) throw profileErr;

      // Fallback: If maybeSingle returns null, retry by primary key query
      if (!profile) {
        const { data: listData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .limit(1);
        if (listData && listData.length > 0) {
          profile = listData[0];
        }
      }

      if (!profile) {
        triggerAlert("Patient Record Not Found", "The requested patient record could not be loaded or is not accessible with your current permissions.", "error");
        return;
      }
      
      setPatient(profile);
      createAuditLog("Patient Record Viewed", "Patient Access", profile.full_name, { access_point: "Doctor Dashboard Detail Page" });

      if (profile?.treatment_start_date) setStartDate(profile.treatment_start_date);
      if (profile?.treatment_end_date) setEndDate(profile.treatment_end_date);
      if (profile?.tb_regimen) setTbRegimen(profile.tb_regimen);
      
      if (profile?.registration_group) setRegistrationGroup(profile.registration_group);
      if (profile?.disease_anatomical_site) setAnatomicalSite(profile.disease_anatomical_site);

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

      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('created_at, user_name')
        .eq('action_name', 'Updated DOH Form 4')
        .eq('target_entity', profile.full_name)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (auditData) setDohLastSynced(auditData);

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
      console.error("Patient detail fetch failure:", err);
      triggerAlert(t("error"), err.message || "Failed to load patient records", "error");
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
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          registration_group: registrationGroup,
          disease_anatomical_site: anatomicalSite,
        })
        .eq('id', id);

      if (profileErr) throw profileErr;

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

      const currentWeightNum = vitalsHistory.length > 0 ? vitalsHistory[0].weight_kg : (parseFloat(currentWeight) || 50);
      const calculatedIntensiveDosage = calculateDosage(currentWeightNum, false);
      const calculatedContinuationDosage = calculateDosage(currentWeightNum, true);

      let protocolMilestones = [];
      let presetMeds = [];

      if (tbRegimen.includes("4-Month")) {
        protocolMilestones = [
          { 
            patient_id: id, 
            doctor_id: user?.id, 
            title: "Treatment Initiation & Baseline Clinical Assessment (BPaLM)", 
            location: "Carmona Health Center", 
            appointment_date: start.toISOString().split('T')[0], 
            status: "completed", 
            type: "protocol" 
          },
          { 
            patient_id: id, 
            doctor_id: user?.id, 
            title: "End of Month 2 Sputum Test", 
            location: "Carmona Health Center", 
            appointment_date: addDays(start, 60), 
            status: "pending", 
            type: "protocol" 
          },
          { 
            patient_id: id, 
            doctor_id: user?.id, 
            title: "Final Month 4 Cure Assessment", 
            location: "Carmona Health Center", 
            appointment_date: addDays(start, 120), 
            status: "pending", 
            type: "protocol" 
          }
        ];

        presetMeds = [
          { user_id: id, name: "Bedaquiline (B)", dosage: "400mg", time: "08:00 AM", start_date: start.toISOString().split('T')[0], end_date: addDays(start, 120), is_taken: false, is_archived: false },
          { user_id: id, name: "Pretomanid (Pa)", dosage: "200mg", time: "08:00 AM", start_date: start.toISOString().split('T')[0], end_date: addDays(start, 120), is_taken: false, is_archived: false },
          { user_id: id, name: "Linezolid (L)", dosage: "600mg", time: "08:00 AM", start_date: start.toISOString().split('T')[0], end_date: addDays(start, 120), is_taken: false, is_archived: false },
          { user_id: id, name: "Moxifloxacin (M)", dosage: "400mg", time: "08:00 AM", start_date: start.toISOString().split('T')[0], end_date: addDays(start, 120), is_taken: false, is_archived: false }
        ];
      } else {
        protocolMilestones = [
          { 
            patient_id: id, 
            doctor_id: user?.id, 
            title: "Treatment Initiation & Baseline Assessment (Intensive Phase)", 
            location: "Carmona Health Center", 
            appointment_date: start.toISOString().split('T')[0], 
            status: "completed", 
            type: "protocol" 
          },
          { 
            patient_id: id, 
            doctor_id: user?.id, 
            title: "End of Intensive Phase Sputum Test (Month 2)", 
            location: "Carmona Health Center", 
            appointment_date: addDays(start, 60), 
            status: "pending", 
            type: "protocol" 
          },
          { 
            patient_id: id, 
            doctor_id: user?.id, 
            title: "Month 5 Sputum Follow-up (Continuation Phase)", 
            location: "Carmona Health Center", 
            appointment_date: addDays(start, 150), 
            status: "pending", 
            type: "protocol" 
          },
          { 
            patient_id: id, 
            doctor_id: user?.id, 
            title: "Final Sputum & Cure Assessment (Month 6)", 
            location: "Carmona Health Center", 
            appointment_date: addDays(start, 180), 
            status: "pending", 
            type: "protocol" 
          }
        ];

        presetMeds = [
          { user_id: id, name: "FDC (Rifampicin + Isoniazid + Pyrazinamide + Ethambutol)", dosage: calculatedIntensiveDosage, time: "08:00 AM", start_date: start.toISOString().split('T')[0], end_date: addDays(start, 60), is_taken: false, is_archived: false },
          { user_id: id, name: "FDC (Rifampicin + Isoniazid)", dosage: calculatedContinuationDosage, time: "08:00 AM", start_date: addDays(start, 61), end_date: addDays(start, 180), is_taken: false, is_archived: false }
        ];
      }

      await supabase.from('profiles').update({
        treatment_start_date: startDate,
        treatment_end_date: endDate,
        tb_regimen: tbRegimen
      }).eq('id', id);

      await supabase.from('connections').update({ status: 'active' }).eq('patient_id', id);

      await supabase.from('roadmap').insert(protocolMilestones);
      
      if (meds.length === 0) {
        await supabase.from('medications').insert(presetMeds);
      }
      
      await sendNotificationToPatient({
        patientId: id as string,
        doctorId: user?.id,
        title: "Treatment Plan & Meds Updated",
        message: "A new DOH TB protocol and baseline prescriptions have been generated for your treatment plan.",
      });

      triggerAlert(t("success"), "Protocol milestones and baseline medications have been generated successfully.", "success");
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
        const todayStr = new Date().toISOString().split('T')[0];
        await supabase.from('medications').update({
          end_date: todayStr, 
          is_archived: true
        }).eq('id', editingMedId);

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

      await sendNotificationToPatient({
        patientId: id as string,
        doctorId: user?.id,
        title: "Medication Schedule Updated",
        message: "Your doctor has updated your daily medication schedule and logs.",
      });
      
      setNewMed({ name: "", dosage: "", time: "08:00 AM", start: "", end: "", isCustomName: false });
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
    setNewMed({ name: "", dosage: "", time: "08:00 AM", start: "", end: "", isCustomName: false });
    setPrescriptionModalOpen(false);
  };

  const handleDeletePrescription = async (medId: string) => {
    try {
      await supabase.from('medications').update({ is_archived: true }).eq('id', medId);
      triggerAlert(t("success"), t("prescriptionRemoved"), "success");
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    }
  };

  const handleCompleteAppointment = async (apptId: string) => {
    try {
      await supabase.from('roadmap').update({ status: 'completed' }).eq('id', apptId);
      triggerAlert(t("success"), t("milestoneCompleted"), "success");
      fetchData();
    } catch (err: any) { console.error(err); }
  };

  const handleOpenMilestoneModal = (appt?: any) => {
    if (appt) {
      setMilestoneForm({
        id: appt.id,
        title: appt.title || "",
        appointment_date: appt.appointment_date ? appt.appointment_date.split('T')[0] : "",
        location: appt.location || "Carmona Health Center",
        type: appt.type || "follow-up"
      });
    } else {
      setMilestoneForm({
        id: null,
        title: "",
        appointment_date: new Date().toISOString().split('T')[0],
        location: "Carmona Health Center",
        type: "follow-up"
      });
    }
    setMilestoneModalOpen(true);
  };

  const handleSaveMilestone = async () => {
    if (!milestoneForm.title || !milestoneForm.appointment_date) {
      triggerAlert(t("error"), "Please provide both a title and date.", "error");
      return;
    }
    setSavingMilestone(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (milestoneForm.id) {
        const { error } = await supabase
          .from('roadmap')
          .update({
            title: milestoneForm.title,
            appointment_date: milestoneForm.appointment_date,
            location: milestoneForm.location,
            type: milestoneForm.type
          })
          .eq('id', milestoneForm.id);
        if (error) throw error;
        triggerAlert(t("success"), "Milestone updated successfully.", "success");
      } else {
        const { error } = await supabase
          .from('roadmap')
          .insert({
            patient_id: id,
            doctor_id: user?.id,
            title: milestoneForm.title,
            appointment_date: milestoneForm.appointment_date,
            location: milestoneForm.location,
            type: milestoneForm.type,
            status: "pending"
          });
        if (error) throw error;
        triggerAlert(t("success"), "New follow-up milestone scheduled.", "success");
      }
      setMilestoneModalOpen(false);
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      const { error } = await supabase.from('roadmap').delete().eq('id', milestoneId);
      if (error) throw error;
      triggerAlert(t("success"), "Milestone removed.", "success");
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    }
  };

  const handleCompleteAuditLogOnly = async (noteId: string) => {
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

      const d6 = new Date();
      d6.setMonth(d6.getMonth() + 6);
      const in6Months = d6.toISOString().split('T')[0];

      const d1 = new Date();
      d1.setFullYear(d1.getFullYear() + 1);
      const in1Year = d1.toISOString().split('T')[0];

      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('roadmap').insert([
        { patient_id: id, doctor_id: user?.id, title: "6-Month Post-Treatment X-Ray Follow-up", location: "Carmona Health Center", appointment_date: in6Months, status: "scheduled", type: "post-treatment" },
        { patient_id: id, doctor_id: user?.id, title: "1-Year Post-Treatment Medical Clearance", location: "Carmona Health Center", appointment_date: in1Year, status: "scheduled", type: "post-treatment" }
      ]);

      createAuditLog("Patient Discharged", "Treatment Lifecycle", patient.full_name, { action: `Marked ${selectedDischargeType} & Scheduled Follow-ups` });

      await sendNotificationToPatient({
        patientId: id as string,
        doctorId: user?.id,
        title: "Treatment Completed! 🏆",
        message: "Congratulations! You have been officially discharged from active monitoring. Post-treatment surveillance follow-ups are registered.",
      });

      setConfirmSafetyModalOpen(false);
      setDischargeModalOpen(false);
      triggerAlert(t("success"), t("dischargeSuccess"), "success");

      setPatient((prev: any) => ({ ...prev, status: selectedDischargeType }));
      
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

  const confirmRelapseFromDetail = async () => {
    setIsRelapsing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'verified',
          registration_group: 'Relapse',
          treatment_start_date: null,
          treatment_end_date: null
        })
        .eq('id', id);

      if (error) throw error;

      await createAuditLog("Patient Re-admitted (Relapse)", "Treatment Lifecycle", patient?.full_name || "Patient", { note: "Re-enrolled under DOH Relapse Protocol." }, "warning");

      setRelapseModalOpen(false);
      triggerAlert("Patient Re-admitted", `${patient?.full_name} has been enrolled as a Relapse case. You may now configure a new protocol.`, "success");
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setIsRelapsing(false);
    }
  };

  const confirmRestoreFromDetail = async () => {
    setIsRestoring(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'verified' })
        .eq('id', id);

      if (error) throw error;

      await createAuditLog("Discharge Rollback", "Clinical Correction", patient?.full_name || "Patient", { note: "Accidental discharge reversed." });

      setRestoreModalOpen(false);
      triggerAlert("Patient Restored", `${patient?.full_name} has been restored to active monitoring roster.`, "success");
      fetchData();
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setIsRestoring(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication error");

      await supabase.from('medications').delete().eq('user_id', id);
      await supabase.from('roadmap').delete().eq('patient_id', id);
      await supabase.from('patient_vitals').delete().eq('patient_id', id);
      await supabase.from('doctor_notes').delete().eq('user_id', id);
      await supabase.from('dssm_monitoring').delete().eq('patient_id', id);
      
      await supabase.from('connections').delete()
        .eq('patient_id', id)
        .eq('doctor_id', user.id);

      navigate("/doctor/patients");
    } catch (err: any) {
      triggerAlert(t("error"), err.message, "error");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
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
  let elapsedDays = 0;
  let phase = t("notStarted");
  let phaseColor = "bg-slate-100 text-slate-800 border-slate-300";
  let phaseDesc = "";
  
  if (isCured) {
    phase = t("postCarePhase");
    timeProgress = 100;
    phaseColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
    phaseDesc = "Patient has completed active treatment. Post-treatment surveillance checkpoints are scheduled.";
  } else if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const totalDuration = Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)), 1);
    elapsedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24));
    
    timeProgress = Math.min(Math.max((elapsedDays / totalDuration) * 100, 0), 100);
    daysLeft = Math.max(totalDuration - elapsedDays, 0);

    if (elapsedDays < 0) {
      phase = t("notStarted");
      phaseColor = "bg-slate-100 text-slate-800 border-slate-300";
      phaseDesc = `Treatment is scheduled to start on ${new Date(startDate).toLocaleDateString()}.`;
    } else if (elapsedDays <= 60 && !isSputumConverted) {
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
  
  const activeMeds = meds.filter((med) => {
    const s = new Date(med.start_date); s.setHours(0,0,0,0);
    const e = new Date(med.end_date); e.setHours(0,0,0,0);
    return todayD >= s && todayD <= e;
  });

  const pastMeds = meds.filter((med) => {
    const e = new Date(med.end_date); e.setHours(0,0,0,0);
    return todayD > e;
  });

  const cleanDoctorName = useMemo(() => {
    if (!doctorName) return "Dr. Attending Physician";
    return `Dr. ${doctorName.replace(/^Dr\.?\s*/i, "")}`;
  }, [doctorName]);

  const initialWeight = vitalsHistory.length > 0 ? vitalsHistory[vitalsHistory.length - 1]?.weight_kg : null;
  const latestWeight = vitalsHistory.length > 0 ? vitalsHistory[0]?.weight_kg : null;
  const weightGain = (initialWeight !== null && latestWeight !== null) ? (latestWeight - initialWeight).toFixed(1) : null;
  const recommendedTabletCount = latestWeight ? getTabletCount(latestWeight) : 0;

  const sixMonthApptDate = appointments.find(a => a.title?.includes("6-Month"))?.appointment_date;
  const oneYearApptDate = appointments.find(a => a.title?.includes("1-Year"))?.appointment_date;

  const getDssmBadgeStyle = (result: string) => {
    if (result === 'Negative') return 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold';
    if (['1+', '2+', '3+'].includes(result)) return 'border-rose-300 bg-rose-50 text-rose-800 font-bold';
    return 'border-slate-200 bg-white text-slate-700 font-medium';
  };

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

      {/* --- RE-ADMIT RELAPSE DIALOG --- */}
      <Dialog open={relapseModalOpen} onOpenChange={setRelapseModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl p-6 bg-white font-sans border border-amber-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4 border border-amber-200">
            <RefreshCw className="h-6 w-6 text-amber-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 text-center">Enroll as TB Relapse Case?</DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center mt-2 leading-relaxed">
              This will re-activate <strong>{patient?.full_name}</strong> under the DOH Relapse Protocol and clear active dates so a new regimen and roadmap can be configured.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-center w-full">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setRelapseModalOpen(false)} disabled={isRelapsing}>Cancel</Button>
            <Button className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold" onClick={confirmRelapseFromDetail} disabled={isRelapsing}>
              {isRelapsing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Enroll as Relapse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- RESTORE ACTIVE (ROLLBACK) DIALOG --- */}
      <Dialog open={restoreModalOpen} onOpenChange={setRestoreModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border border-blue-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 border border-blue-200">
            <Undo2 className="h-6 w-6 text-blue-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 text-center">Restore to Active Monitoring?</DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center mt-2 leading-relaxed">
              Reverse accidental discharge for <strong>{patient?.full_name}</strong> and return them to active monitoring with all previous logs preserved?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-center w-full">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setRestoreModalOpen(false)} disabled={isRestoring}>Cancel</Button>
            <Button className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={confirmRestoreFromDetail} disabled={isRestoring}>
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Undo2 className="h-4 w-4 mr-2" />}
              Confirm Restore
            </Button>
          </DialogFooter>
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

      <Dialog open={milestoneModalOpen} onOpenChange={setMilestoneModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl p-6 bg-white font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {milestoneForm.id ? "Edit Roadmap Milestone" : "Add Custom Follow-up / Milestone"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-1">
              Schedule or modify customized appointments, sputum tests, or clinical follow-ups.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <Label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Milestone Title</Label>
              <Input 
                placeholder="e.g. Month 3 Clinical Follow-up & X-Ray" 
                value={milestoneForm.title} 
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} 
                className="h-10 rounded-xl" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Scheduled Date</Label>
                <Input 
                  type="date" 
                  value={milestoneForm.appointment_date} 
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, appointment_date: e.target.value })} 
                  className="h-10 rounded-xl" 
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Category</Label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl h-10 px-3 focus:outline-none" 
                  value={milestoneForm.type} 
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, type: e.target.value })}
                >
                  <option value="follow-up">Follow-up</option>
                  <option value="protocol">Protocol Milestone</option>
                  <option value="test">Lab / Diagnostic</option>
                  <option value="post-treatment">Post-Treatment</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Facility Location</Label>
              <Input 
                value={milestoneForm.location} 
                onChange={(e) => setMilestoneForm({ ...milestoneForm, location: e.target.value })} 
                className="h-10 rounded-xl" 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setMilestoneModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveMilestone} 
              disabled={savingMilestone} 
              className="bg-[#606C38] hover:bg-[#283618] text-white rounded-xl font-bold"
            >
              {savingMilestone ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dischargeModalOpen} onOpenChange={setDischargeModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 bg-white font-sans print:hidden">
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
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 bg-white font-sans border border-slate-200 shadow-xl print:hidden">
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

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white font-sans border border-red-200 shadow-xl print:hidden">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 border border-red-200">
            <ShieldAlert className="h-6 w-6 text-red-700" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-700 text-center">Delete Patient Record</DialogTitle>
            <DialogDescription className="text-slate-600 text-sm text-center mt-2 leading-relaxed">
              You are about to permanently delete all medical tracking data (Vitals, Meds, Roadmaps) and unlink <strong>{patient?.full_name}</strong> from your clinic. <br/><br/><strong>This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-center w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 font-semibold" 
              onClick={() => setDeleteModalOpen(false)} 
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold" 
              onClick={confirmDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Record
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

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => window.print()} 
              variant="outline" 
              className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl gap-2 font-bold shadow-sm px-4"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              <span className="hidden sm:inline">{t("printReport")}</span>
            </Button>

            {isCured && (
              <>
                <Button 
                  onClick={() => setRelapseModalOpen(true)} 
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl gap-2 font-bold shadow-sm px-4"
                >
                  <RefreshCw className="h-4 w-4 text-amber-700" />
                  <span className="hidden sm:inline">Re-admit as Relapse</span>
                </Button>

                <Button 
                  onClick={() => setRestoreModalOpen(true)} 
                  variant="outline"
                  className="border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-xl gap-2 font-bold shadow-sm px-4"
                >
                  <Undo2 className="h-4 w-4 text-blue-700" />
                  <span className="hidden sm:inline">Restore to Active</span>
                </Button>
              </>
            )}

            {!isCured && (
              <Button 
                onClick={() => setDischargeModalOpen(true)} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold shadow-sm px-5"
              >
                <FileCheck2 className="h-4 w-4" />
                {t("dischargeBtn")}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setDeleteModalOpen(true)} 
              className="border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl gap-2 font-bold shadow-sm px-4 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("purgeData")}</span>
            </Button>
          </div>
        </div>

        {/* --- DOH POST-TREATMENT SURVEILLANCE BANNER --- */}
        {isCured && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className="bg-emerald-100 p-2 rounded-full mt-0.5 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-emerald-950 font-bold text-lg mb-1">DOH Post-Treatment Surveillance Active</h3>
              <p className="text-emerald-800 text-sm mb-3">
                This patient has concluded active treatment and is now registered in the 12-Month Post-Care Surveillance cycle. Routine daily medications are stopped, and periodic surveillance follow-ups are monitored below.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-emerald-900">
                <span className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                  • 6-Month Chest X-Ray: {sixMonthApptDate ? new Date(sixMonthApptDate).toLocaleDateString() : "Pending"}
                </span>
                <span className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                  • 1-Year Final Medical Clearance: {oneYearApptDate ? new Date(oneYearApptDate).toLocaleDateString() : "Pending"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* --- SMART CLINICAL SETUP WIZARD --- */}
        {!isCured && (!startDate || meds.length === 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-full mt-0.5 shrink-0">
              <Info className="h-5 w-5 text-blue-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-blue-900 font-bold text-lg mb-1">Clinical Setup Required</h3>
              <p className="text-blue-800 text-sm mb-4">
                {!startDate 
                  ? "TB Treatment Protocol has not been generated. Please configure the roadmap start date first." 
                  : "Roadmap protocol successfully generated. Please add active prescriptions to complete setup."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {!startDate && (
                  <Button 
                    onClick={() => setActiveTab('roadmap')} 
                    variant="outline" 
                    className="rounded-xl h-10 font-bold border-blue-400 bg-white text-blue-700 shadow-sm hover:bg-blue-100"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"/>
                    Step 1: Set TB Roadmap
                  </Button>
                )}
                
                {startDate && meds.length === 0 && (
                  <Button 
                    onClick={() => setActiveTab('clinical')} 
                    variant="outline" 
                    className="rounded-xl h-10 font-bold border-blue-400 bg-white text-blue-700 shadow-sm hover:bg-blue-100"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"/>
                    Step 2: Add Prescriptions
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {!isCured && startDate && endDate && meds.length > 0 && (
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
                        {isCured ? "Cleared" : patient.risk_level} 
                      </Badge>
                    )}
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
                    {patient?.contact_number && (
                      <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {patient.contact_number}</span>
                    )}
                    {patient?.contact_number && patient?.email && <span className="text-slate-300 hidden sm:inline">•</span>}
                    {patient?.email && (
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {patient.email}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:mt-1">
                  <Badge variant="default" className={`px-3 py-1 font-semibold ${isCured ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-[#606C38] hover:bg-[#283618] text-white border-none"}`}>
                    {patient?.status === 'cured' ? t("curedPatient") : (patient?.status === 'treatment_completed' ? t("treatmentCompletedPatient") : t("verifiedPatient"))}
                  </Badge>
                  <Badge variant="outline" className={`font-bold px-3 py-1 ${isCured ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[#FEFAE0] text-[#606C38] border-[#DDE5B6]"}`}>
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
                    <div className="md:w-1/3 flex flex-col justify-center items-center bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Most Recent Weight</p>
                      <p className="text-5xl font-extrabold text-[#283618]">{currentWeight || "--"} <span className="text-xl text-slate-500 font-bold">kg</span></p>
                    </div>

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
                  
                  <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-emerald-900 mb-1">DOH NTP Dosage Calibration</h4>
                        {vitalsHistory.length > 0 ? (
                          <div>
                            <p className="text-xs text-emerald-800 mb-2">
                              Calibrated based on latest weight: <strong>{vitalsHistory[0].weight_kg} kg</strong> ({vitalsHistory[0].weight_kg >= 55 ? "Band 55–70kg" : (vitalsHistory[0].weight_kg >= 38 ? "Band 38–54kg" : "Band 30–37kg")})
                            </p>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {recommendedTabletCount > 0 && Array.from({ length: recommendedTabletCount }).map((_, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs">
                                  <Pill className="w-3.5 h-3.5 text-emerald-600" /> Tab {i + 1}
                                </span>
                              ))}
                            </div>
                            <span className="font-bold text-sm text-emerald-950 block">
                              {calculateDosage(vitalsHistory[0].weight_kg, isSputumConverted || phase === t("continuationPhase"))}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-700">Please log patient weight in the Overview tab to calculate recommended daily tablets.</p>
                        )}
                      </div>
                    </div>
                  </div>

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
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        DSSM Sputum Smear Progression (Bacteriological Tracking)
                      </Label>
                      {isSputumConverted && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Sputum Conversion Verified
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {['month0', 'month2', 'month3', 'month4', 'month5', 'month6'].map((monthKey) => {
                        const monthLabel = monthKey === 'month0' ? 'Month 0' : `Month ${monthKey.replace('month', '')}`;
                        const val = (dssmResults as any)[monthKey] || "";

                        return (
                          <div key={monthKey} className={`flex flex-col gap-1 border rounded-lg p-2 text-center transition-colors ${getDssmBadgeStyle(val)}`}>
                            <span className="text-[10px] font-bold opacity-75">{monthLabel}</span>
                            <select 
                              className="w-full bg-transparent border-0 text-xs font-bold text-inherit rounded h-8 px-1 focus:outline-none text-center cursor-pointer" 
                              value={val} 
                              onChange={(e) => handleDssmChange(monthKey, e.target.value)} 
                              disabled={isCured}
                            >
                              <option value="" className="text-black">-</option>
                              <option value="Negative" className="text-emerald-800">0 (Neg)</option>
                              <option value="1+" className="text-rose-800">1+ (Pos)</option>
                              <option value="2+" className="text-rose-800">2+ (Pos)</option>
                              <option value="3+" className="text-rose-800">3+ (Pos)</option>
                              <option value="Not Done" className="text-slate-600">N/D</option>
                            </select>
                          </div>
                        );
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
          <div className="space-y-6 animate-fade-in">
            {startDate && (
              <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">DOH NTP Clinical Treatment Trajectory</h3>
                    <p className="text-xs text-slate-500">Standard 6-Month Therapeutic Milestones & Evaluative Gateways</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs text-[#606C38] border-[#DDE5B6] bg-[#FEFAE0]">
                    Day {Math.max(elapsedDays, 0)} of 180
                  </Badge>
                </div>

                <div className="relative flex items-center justify-between px-4 py-2">
                  <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                  <div 
                    className="absolute top-1/2 left-8 h-1 bg-[#606C38] -translate-y-1/2 z-0 transition-all duration-500"
                    style={{ width: `${Math.min(Math.max((elapsedDays / 180) * 100, 0), 100)}%` }}
                  />

                  {[
                    { label: "Day 1: Initiation", sub: "Baseline Check", day: 0 },
                    { label: "Mo 2: Conversion", sub: "Intensive Sputum", day: 60 },
                    { label: "Mo 5: Mid-Check", sub: "Continuation Follow-up", day: 150 },
                    { label: "Mo 6: Cure", sub: "Final Assessment", day: 180 },
                  ].map((step, idx) => {
                    const isDone = elapsedDays >= step.day || isCured;
                    const isCurrent = !isCured && elapsedDays < step.day && (idx === 0 || elapsedDays >= [0, 60, 150, 180][idx - 1]);

                    return (
                      <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                          isDone 
                            ? 'bg-[#606C38] border-[#606C38] text-white shadow-sm' 
                            : (isCurrent ? 'bg-white border-[#606C38] text-[#606C38] ring-4 ring-[#FEFAE0]' : 'bg-white border-slate-300 text-slate-400')
                        }`}>
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                        </div>
                        <span className="text-xs font-bold text-slate-800 mt-2">{step.label}</span>
                        <span className="text-[10px] text-slate-400">{step.sub}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
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
                          <Button onClick={handleGenerateProtocol} className="w-full bg-[#606C38] hover:bg-[#283618] text-white rounded-xl h-11 font-semibold shadow-sm transition-all" disabled={generating || !startDate}>
                            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                            {t("autoGen")}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center">
                        <FileCheck2 className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
                        <p className="text-emerald-800 font-bold">Treatment Finalized</p>
                        <p className="text-xs text-slate-500 mt-1">Roadmap configuration is locked for discharged patients under surveillance.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6 lg:col-span-2">
                <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-md font-bold flex items-center gap-2 text-[#283618]">
                      <CalendarDays className="h-5 w-5 text-[#606C38]" /> Active & Scheduled Milestones
                    </CardTitle>
                    {!isCured && (
                      <Button 
                        size="sm" 
                        onClick={() => handleOpenMilestoneModal()} 
                        className="bg-[#606C38] hover:bg-[#283618] text-white rounded-lg h-8 px-3"
                      >
                        <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Add Milestone
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-0 overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableBody>
                          {appointments.filter(a => a.status !== 'completed').length === 0 ? (
                            <TableRow>
                              <TableCell className="text-center italic py-8 text-slate-400">No pending milestones scheduled.</TableCell>
                            </TableRow>
                          ) : appointments.filter(a => a.status !== 'completed').map((appt) => (
                            <TableRow key={appt.id} className="hover:bg-slate-50 border-b border-slate-100">
                              <TableCell className="py-4 px-6">
                                <p className="text-sm font-bold text-black mb-1">{appt.title || 'Follow-up'}</p>
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
                              <TableCell className="text-right py-4 px-6">
                                <div className="flex justify-end items-center gap-1.5">
                                  {!isCured && (
                                    <>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-blue-500 hover:bg-blue-50" 
                                        onClick={() => handleOpenMilestoneModal(appt)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-red-400 hover:bg-red-50" 
                                        onClick={() => handleDeleteMilestone(appt.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-[#606C38] text-[#606C38] hover:bg-[#606C38] hover:text-white rounded-lg transition-colors ml-1" 
                                    onClick={() => handleCompleteAppointment(appt.id)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Complete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 bg-[#F4F7F4]/40 rounded-t-2xl">
                    <CardTitle className="text-md font-bold flex items-center gap-2 text-[#283618]">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Milestone Completion History
                    </CardTitle>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none font-bold text-xs">
                      {appointments.filter(a => a.status === 'completed').length} Completed
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0 overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableBody>
                          {appointments.filter(a => a.status === 'completed').length === 0 ? (
                            <TableRow>
                              <TableCell className="text-center italic py-8 text-slate-400">
                                No completed milestones recorded yet. Completed appointments will be archived here.
                              </TableCell>
                            </TableRow>
                          ) : appointments.filter(a => a.status === 'completed').map((appt) => (
                            <TableRow key={appt.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                              <TableCell className="py-4 px-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-bold text-slate-800 line-through decoration-slate-400">{appt.title}</p>
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                    Done
                                  </Badge>
                                </div>
                                <p className="text-[12px] font-medium text-slate-400">
                                  Completed for scheduled date: {new Date(appt.appointment_date).toLocaleDateString()} • {appt.location}
                                </p>
                              </TableCell>
                              <TableCell className="text-right py-4 px-6">
                                <span className="text-xs text-emerald-700 font-bold flex items-center justify-end gap-1">
                                  <Check className="h-4 w-4" /> Verified by Clinic
                                </span>
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
          </div>
        )}
      </div>

      {/* --- PRINTABLE OFFICIAL DOH E-DISCHARGE & MEDICAL CLEARANCE CERTIFICATE --- */}
      <div className="hidden print:block font-sans text-black bg-white min-h-screen w-full certificate-container">
        <style type="text/css" media="print">
          {`
            @page { size: auto; margin: 0mm; }
            body * { visibility: hidden !important; }
            .certificate-container, .certificate-container * { visibility: visible !important; }
            .certificate-container { 
              position: fixed !important; 
              left: 0 !important; 
              top: 0 !important; 
              width: 100vw !important; 
              min-height: 100vh !important;
              margin: 0 !important;
              padding: 2.2cm 2.2cm !important;
              background: white !important;
              z-index: 99999 !important;
              box-sizing: border-box !important;
            }
          `}
        </style>

        <div className="border-2 border-slate-900 p-8 rounded-2xl relative">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-6">
            <div>
              <p className="text-xs tracking-widest text-slate-500 font-bold uppercase mb-0.5">Republic of the Philippines • Province of Cavite</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">MUNICIPALITY OF CARMONA</h1>
              <h2 className="text-base font-bold text-slate-700">CARMONA HEALTH CENTER • TB DOTS CLINIC</h2>
            </div>
            <div className="text-right flex items-center gap-3">
              <img src="/LogoNoBG.png" alt="TEREA Logo" className="h-12 w-12 object-contain drop-shadow-sm" />
              <div className="text-left border-l-2 border-slate-300 pl-3">
                <h3 className="text-xl font-black tracking-tight text-[#283618]">TEREA</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NTP ITIS Registry</p>
              </div>
            </div>
          </div>

          <div className="text-center my-6">
            <h2 className="text-2xl font-black tracking-wide text-slate-900 uppercase">
              E-Discharge & Medical Clearance Certificate
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              National Tuberculosis Control Program (NTP) • Form 4 Master Card Clearance
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Patient Full Name</span>
                <span className="text-base font-bold text-slate-950">{patient?.full_name?.toUpperCase() || "N/A"}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Official Patient ID</span>
                <span className="font-mono font-bold text-slate-900">{patient?.id?.substring(0, 8).toUpperCase() || "N/A"}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Age / Gender / Residency</span>
                <span className="font-medium text-slate-800">{patient?.age || "N/A"} yrs old • {patient?.gender || "N/A"} • Brgy. {patient?.barangay || "Carmona"}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">TB Classification & Regimen</span>
                <span className="font-bold text-slate-800">{tbRegimen} ({registrationGroup || "New"} • {anatomicalSite || "PTB"})</span>
              </div>
            </div>
          </div>

          <div className="text-center p-4 rounded-xl border border-slate-300 bg-slate-100/70 my-5">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-1">Clinical Outcome Classification</span>
            <span className={`text-2xl font-black uppercase tracking-wider ${patient?.status === 'cured' ? 'text-emerald-800' : 'text-blue-800'}`}>
              {patient?.status === 'cured' ? 'CLEARED & CURED' : 'TREATMENT COMPLETED'}
            </span>
            <p className="text-xs text-slate-600 mt-2 max-w-2xl mx-auto leading-relaxed">
              {patient?.status === 'cured'
                ? "The patient has officially completed the full anti-TB therapeutic regimen and presented bacteriological proof of cure via negative final sputum smear. The patient is declared non-infectious, cleared of active Mycobacterium tuberculosis, and discharged from daily DOTS monitoring."
                : "The patient has successfully accomplished the mandated anti-TB chemotherapeutic course in accordance with Philippine DOH NTP standards. Active medication intake is officially completed, and post-care surveillance is enforced."}
            </p>
          </div>

          <div className="space-y-4 my-6">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 border-b pb-1">
              Clinical Evidence & Historical Progress Track Record
            </h4>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                1. Bacteriological Smear Monitoring History (Direct Sputum Smear Microscopy)
              </div>
              <div className="grid grid-cols-6 divide-x text-center text-xs">
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Month 0 (Base)</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block">{dssmResults.month0 || "N/D"}</span>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Month 2 (Conv)</span>
                  <span className={`font-extrabold mt-0.5 block ${dssmResults.month2 === 'Negative' ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {dssmResults.month2 || "N/D"}
                  </span>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Month 3</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{dssmResults.month3 || "-"}</span>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Month 4</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{dssmResults.month4 || "-"}</span>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Month 5</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{dssmResults.month5 || "N/D"}</span>
                </div>
                <div className="p-2.5 bg-emerald-50/50">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">Month 6 (Final)</span>
                  <span className="font-black text-emerald-800 mt-0.5 block">{dssmResults.month6 || "Negative"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-3 text-xs">
                <span className="font-bold text-slate-700 block mb-1.5">2. Nutritional Recovery & Weight Progression</span>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Initial Weight: <strong>{initialWeight ? `${initialWeight} kg` : "N/A"}</strong></span>
                  <span>➔</span>
                  <span>Discharge Weight: <strong>{latestWeight ? `${latestWeight} kg` : "N/A"}</strong></span>
                </div>
                {weightGain && (
                  <p className="text-[11px] font-bold text-emerald-700 mt-1.5">
                    Net Nutritional Gain: +{weightGain} kg recovery
                  </p>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg p-3 text-xs">
                <span className="font-bold text-slate-700 block mb-1.5">3. Treatment Adherence & Course Period</span>
                <div className="text-slate-600 space-y-0.5">
                  <p>Overall Adherence Rate: <strong className="text-emerald-700">{Math.round(aggregatedAdherenceRate)}% Compliance</strong></p>
                  <p>Duration: {startDate ? new Date(startDate).toLocaleDateString() : "N/A"} to {endDate ? new Date(endDate).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 text-xs bg-slate-50">
              <span className="font-bold text-slate-700 block mb-1">4. Mandated Post-Treatment Surveillance Checkpoints</span>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <p>• 6-Month Post-Treatment Chest X-Ray: <strong>{sixMonthApptDate ? new Date(sixMonthApptDate).toLocaleDateString() : "Registered (In 6 Months)"}</strong></p>
                <p>• 1-Year Final Medical Clearance: <strong>{oneYearApptDate ? new Date(oneYearApptDate).toLocaleDateString() : "Registered (In 1 Year)"}</strong></p>
              </div>
            </div>
          </div>

          <div className="pt-10 flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Date Issued</p>
              <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">TEREA Health Registry System Verified</p>
            </div>
            
            <div className="text-center w-72">
              <div className="border-b-2 border-slate-900 pb-1 mb-1">
                <p className="text-base font-black uppercase text-slate-950">{cleanDoctorName}</p>
              </div>
              <p className="text-xs font-bold text-slate-700">Attending Physician • License Verified</p>
              <p className="text-[11px] text-slate-500">Carmona TB DOTS Center • Cavite Health Office</p>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}