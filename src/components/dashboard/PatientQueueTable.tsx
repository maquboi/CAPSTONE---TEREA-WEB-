import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { 
  ArrowRight, 
  Check, 
  X, 
  Clock, 
  ShieldCheck, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Inbox,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { sendNotificationToPatient } from "@/lib/notifications";

const sanitizeText = (input: string | null | undefined): string => {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
};

const getInitials = (name: string = "") => {
  const clean = sanitizeText(name);
  if (!clean) return "PT";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getRiskColor = (level: string = "") => {
  const normalStr = level.toLowerCase();
  if (normalStr.includes("high")) return "bg-red-50 text-red-700 border-red-200 font-bold";
  if (normalStr.includes("mod") || normalStr.includes("med")) return "bg-amber-50 text-amber-800 border-amber-200 font-bold";
  return "bg-teal-50 text-teal-800 border-teal-200 font-semibold";
};

export function PatientQueueTable({ search = "", riskFilter = "all", statusFilter = "all" }: { search?: string; riskFilter?: string; statusFilter?: string }) {
  const navigate = useNavigate();
  // Three clearly differentiated tabs
  const [activeTab, setActiveTab] = useState<'priority' | 'pending' | 'active'>('priority');
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [priorityList, setPriorityList] = useState<any[]>([]);
  const [totalPriorityCount, setTotalPriorityCount] = useState<number>(0);
  const [activeList, setActiveList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modern Clinical Popup Alert State
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('connections')
        .select(`
          status,
          created_at,
          patient_id,
          is_archived,
          profiles!fk_patient (
            id,
            full_name,
            risk_level,
            avatar_url,
            status,
            is_archived
          )
        `)
        .eq('doctor_id', user.id);

      if (error) throw error;

      if (data) {
        // 1. Pending verification requests
        const pending = data
          .filter(d => d.status === 'pending' && !d.is_archived)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // 2. Active patients who are NOT discharged
        const active = data.filter(d => {
          const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
          const pStatus = profile?.status?.toLowerCase() || "";
          const isDischarged = d.is_archived || profile?.is_archived || pStatus === "cured" || pStatus === "completed" || pStatus === "treatment_completed" || pStatus === "discharged";
          return d.status === 'active' && !isDischarged;
        });

        // 3. Priority cases: High risk / adverse cases
        const highRiskPatients = active.filter(d => {
          const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
          const risk = profile?.risk_level?.toLowerCase() || "";
          return risk.includes("high") || risk.includes("priority") || risk.includes("mataas");
        });

        setTotalPriorityCount(highRiskPatients.length);
        setPriorityList(highRiskPatients.slice(0, 5));
        setPendingList(pending.slice(0, 5));
        setActiveList(active.slice(0, 5));

        // Intelligently default tab to whichever has actionable items
        if (highRiskPatients.length > 0) {
          setActiveTab('priority');
        } else if (pending.length > 0) {
          setActiveTab('pending');
        } else {
          setActiveTab('active');
        }
      }
    } catch (err) {
      console.error("Error fetching patient queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();

    const handleUpdate = () => fetchPatients();
    window.addEventListener('connectionUpdated', handleUpdate);
    return () => window.removeEventListener('connectionUpdated', handleUpdate);
  }, []);

  const handleApprove = async (patientId: string, patientName: string) => {
    setProcessingId(patientId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('connections')
        .update({ status: 'active' })
        .eq('doctor_id', user?.id)
        .eq('patient_id', patientId);
      
      await sendNotificationToPatient({
        patientId,
        doctorId: user?.id,
        title: "Connection Approved! 🎉",
        message: "Your healthcare provider has approved your connection request. You can now access your treatment plan.",
      });

      triggerAlert("Request Approved", `${patientName} has been enrolled into your active clinical queue.`, "success");
      fetchPatients();
      window.dispatchEvent(new Event('connectionUpdated'));
    } catch (err) {
      triggerAlert("Error", "Failed to approve connection request.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (patientId: string, patientName: string) => {
    setProcessingId(patientId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('connections')
        .delete()
        .eq('doctor_id', user?.id)
        .eq('patient_id', patientId);
        
      await sendNotificationToPatient({
        patientId,
        doctorId: user?.id,
        title: "Connection Request Updated",
        message: "Your doctor connection request was not accepted.",
      });

      triggerAlert("Request Declined", `The connection request from ${patientName} was removed.`, "error");
      fetchPatients();
      window.dispatchEvent(new Event('connectionUpdated'));
    } catch (err) {
      triggerAlert("Error", "Failed to decline connection request.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className="rounded-2xl shadow-sm border border-slate-300/80 bg-white overflow-hidden flex flex-col h-full font-sans">
      
      {/* Centralized Notification Modal */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-xs" />
          <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-2xl font-sans">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-teal-50 border border-teal-200' : 'bg-red-50 border border-red-200'}`}>
              {alert.type === 'success' ? <CheckCircle2 className="h-6 w-6 text-teal-700" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">{alert.title}</DialogTitle>
            <DialogDescription className="text-slate-500 mt-1.5 text-xs font-medium leading-relaxed">{alert.message}</DialogDescription>
            <Button 
              className={`mt-6 w-full rounded-xl text-white h-10 text-xs font-bold transition-all shadow-xs ${alert.type === 'success' ? 'bg-teal-700 hover:bg-teal-800' : 'bg-red-600 hover:bg-red-700'}`} 
              onClick={() => setAlert({...alert, open: false})}
            >
              Acknowledge
            </Button>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* --- HEADER: TITLE & SEGMENTED SWITCHER --- */}
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-700" />
              Patient Queue Snapshot
            </CardTitle>
            <p className="text-[11px] text-slate-500 mt-0.5">Prioritized intake and active cohort monitoring</p>
          </div>
          
          {/* Segmented Queue Tab Controls with Synced Counts */}
          <div className="flex p-1 bg-slate-200/70 rounded-xl w-full sm:w-auto border border-slate-300/60 shadow-2xs">
            {/* Tab 1: Priority Queue */}
            <button 
              onClick={() => setActiveTab('priority')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'priority' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className={`h-3.5 w-3.5 ${activeTab === 'priority' ? 'text-red-600' : 'text-slate-400'}`} />
              <span>Priority</span>
              {totalPriorityCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'priority' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-slate-300 text-slate-700'
                }`}>
                  {totalPriorityCount}
                </span>
              )}
            </button>

            {/* Tab 2: Verification Requests */}
            <button 
              onClick={() => setActiveTab('pending')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'pending' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Requests</span>
              {pendingList.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-300 text-slate-700'
                }`}>
                  {pendingList.length}
                </span>
              )}
            </button>

            {/* Tab 3: Recent Active */}
            <button 
              onClick={() => setActiveTab('active')}
              className={`flex-1 sm:flex-initial flex items-center justify-center px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'active' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recent Active
            </button>
          </div>
        </div>
      </CardHeader>
      
      {/* --- TABLE CONTENT --- */}
      <CardContent className="p-0 flex-1 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
            <span className="text-xs">Loading patient intake queue...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            
            {/* 1. PRIORITY QUEUE TAB (HIGH RISK CASES) */}
            {activeTab === 'priority' && (
              priorityList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="h-12 w-12 bg-teal-50 border border-teal-200 rounded-full flex items-center justify-center mb-3">
                    <ShieldCheck className="h-6 w-6 text-teal-700" />
                  </div>
                  <p className="text-slate-900 font-bold text-sm">Priority Queue Clear</p>
                  <p className="text-slate-500 text-xs mt-0.5">No active patients currently flagged for critical triage or high risk.</p>
                </div>
              ) : (
                <>
                  <div className="px-6 py-2 bg-red-50/60 border-b border-red-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-red-800">
                      Showing {priorityList.length} of {totalPriorityCount} priority cases
                    </span>
                    {totalPriorityCount > 5 && (
                      <button
                        onClick={() => navigate("/doctor/patients?risk=high-risk")}
                        className="font-bold text-teal-800 hover:underline flex items-center gap-1"
                      >
                        View all priority patients ({totalPriorityCount}) →
                      </button>
                    )}
                  </div>

                  <Table>
                    <TableHeader className="bg-slate-50/90 border-b border-slate-200">
                      <TableRow className="hover:bg-transparent border-slate-200">
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 pl-6 h-10">Patient Profile</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 h-10">Triage Risk</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 text-right pr-6 h-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priorityList.map((item) => {
                        const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                        const patientName = sanitizeText(profile?.full_name) || "Unknown Patient";

                        return (
                          <TableRow 
                            key={item.patient_id} 
                            onClick={() => navigate(`/doctor/patient-details/${item.patient_id}`)}
                            className="hover:bg-slate-50/80 border-b border-slate-100 transition-colors cursor-pointer group"
                          >
                            <TableCell className="pl-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                                  {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt={patientName} className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold text-teal-800 bg-teal-50 h-full w-full flex items-center justify-center">
                                      {getInitials(patientName)}
                                    </span>
                                  )}
                                </div>
                                <span className="font-semibold text-xs text-slate-900 group-hover:text-teal-700 transition-colors">
                                  {patientName}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className={`rounded-md text-[10px] px-2 py-0.5 uppercase tracking-wide border ${getRiskColor(profile?.risk_level)}`}>
                                {profile?.risk_level || "High Risk"}
                              </Badge>
                            </TableCell>

                            <TableCell className="pr-6 text-right whitespace-nowrap">
                              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all inline-block" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )
            )}

            {/* 2. PENDING REQUESTS TAB */}
            {activeTab === 'pending' && (
              pendingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Inbox className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-bold text-sm">No Pending Requests</p>
                  <p className="text-slate-500 text-xs mt-0.5">All patient connection requests have been reviewed.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/90 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent border-slate-200">
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 pl-6 h-10">Patient Profile</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 h-10">Requested</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 text-right pr-6 h-10">Decision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingList.map((req) => {
                      const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
                      const isProcessing = processingId === req.patient_id;
                      const patientName = sanitizeText(profile?.full_name) || "Unknown Patient";

                      return (
                        <TableRow key={req.patient_id} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors">
                          <TableCell className="pl-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                                {profile?.avatar_url ? (
                                  <img src={profile.avatar_url} alt={patientName} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-teal-800 bg-teal-50 h-full w-full flex items-center justify-center">
                                    {getInitials(patientName)}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-xs text-slate-900">{patientName}</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs font-medium text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </TableCell>

                          <TableCell className="pr-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleApprove(req.patient_id, profile?.full_name)}
                                disabled={isProcessing}
                                className="h-8 border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-700 hover:text-white transition-colors rounded-lg font-bold text-xs px-2.5 shadow-2xs"
                              >
                                {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                                Approve
                              </Button>
                              <Button 
                                size="icon" 
                                variant="outline" 
                                onClick={() => handleReject(req.patient_id, profile?.full_name)}
                                disabled={isProcessing}
                                className="h-8 w-8 border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors rounded-lg"
                                title="Decline request"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )
            )}

            {/* 3. RECENT ACTIVE TAB */}
            {activeTab === 'active' && (
              activeList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Inbox className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-bold text-sm">No Active Patients</p>
                  <p className="text-slate-500 text-xs mt-0.5">There are no approved patients linked in your active roster.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/90 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent border-slate-200">
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 pl-6 h-10">Patient Profile</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 h-10">Triage Risk</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 text-right pr-6 h-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeList.map((req) => {
                      const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
                      const patientName = sanitizeText(profile?.full_name) || "Unknown Patient";

                      return (
                        <TableRow 
                          key={req.patient_id} 
                          onClick={() => navigate(`/doctor/patient-details/${req.patient_id}`)}
                          className="hover:bg-slate-50/80 border-b border-slate-100 transition-colors cursor-pointer group"
                        >
                          <TableCell className="pl-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                                {profile?.avatar_url ? (
                                  <img src={profile.avatar_url} alt={patientName} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-teal-800 bg-teal-50 h-full w-full flex items-center justify-center">
                                    {getInitials(patientName)}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-xs text-slate-900 group-hover:text-teal-700 transition-colors">
                                {patientName}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className={`rounded-md text-[10px] px-2 py-0.5 uppercase tracking-wide border ${getRiskColor(profile?.risk_level)}`}>
                              {profile?.risk_level || "Standard"}
                            </Badge>
                          </TableCell>

                          <TableCell className="pr-6 text-right whitespace-nowrap">
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all inline-block" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )
            )}
          </div>
        )}
      </CardContent>

      {/* --- FOOTER: DIRECTORY LINK --- */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 mt-auto flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => navigate("/doctor/patients")} 
          className="w-full sm:w-auto border-slate-300 text-slate-700 hover:text-teal-800 hover:bg-slate-100 rounded-xl font-bold text-xs h-9 transition-all shadow-2xs"
        >
          <span>Open Full Patient Directory</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1.5 text-teal-700" />
        </Button>
      </div>
    </Card>
  );
}