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
  User, 
  ArrowRight, 
  Check, 
  X, 
  Clock, 
  ShieldCheck, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";

// <-- ADDED IMPORT FOR THE NOTIFICATION HELPER -->
import { sendNotificationToPatient } from "@/lib/notifications";

export function PatientQueueTable({ search = "", riskFilter = "all", statusFilter = "all" }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [activeList, setActiveList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modern TEREA Center Popup Alert State
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
          profiles!fk_patient (
            id,
            full_name,
            risk_level,
            avatar_url
          )
        `)
        .eq('doctor_id', user.id);

      if (error) throw error;

      if (data) {
        // Filter and sort Pending Requests (Most recent first, Max 5)
        const pending = data
          .filter(d => d.status === 'pending')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        // Filter and sort Active Patients (High Risk first, then recent, Max 5)
        const active = data
          .filter(d => d.status === 'active')
          .sort((a, b) => {
            const profileA = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
            const profileB = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
            const riskA = profileA?.risk_level?.toLowerCase() || '';
            const riskB = profileB?.risk_level?.toLowerCase() || '';
            
            if (riskA.includes('high') && !riskB.includes('high')) return -1;
            if (!riskA.includes('high') && riskB.includes('high')) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .slice(0, 5);

        setPendingList(pending);
        setActiveList(active);

        // Auto-switch to active tab if no pending requests exist
        if (pending.length === 0 && activeTab === 'pending') {
          setActiveTab('active');
        } else if (pending.length > 0 && activeTab === 'active' && activeList.length === 0) {
          setActiveTab('pending');
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

    // Listen for external updates (e.g. from Dashboard)
    const handleUpdate = () => fetchPatients();
    window.addEventListener('connectionUpdated', handleUpdate);
    return () => window.removeEventListener('connectionUpdated', handleUpdate);
  }, []);

  const handleApprove = async (patientId: string, patientName: string) => {
    setProcessingId(patientId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update connection status
      await supabase.from('connections')
        .update({ status: 'active' })
        .eq('doctor_id', user?.id)
        .eq('patient_id', patientId);
      
      // <-- DISPATCH PUSH NOTIFICATION -->
      await sendNotificationToPatient({
        patientId,
        doctorId: user?.id,
        title: "Request Approved! 🎉",
        message: "Your doctor has approved your connection request. You can now view your treatment roadmap.",
      });

      triggerAlert("Request Approved", `${patientName} has been successfully added to your active roster.`, "success");
      fetchPatients();
      window.dispatchEvent(new Event('connectionUpdated')); // Notify Dashboard to update counts
    } catch(err) {
      triggerAlert("Error", "Failed to approve request.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (patientId: string, patientName: string) => {
    setProcessingId(patientId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Delete the connection request
      await supabase.from('connections')
        .delete()
        .eq('doctor_id', user?.id)
        .eq('patient_id', patientId);
        
      // <-- DISPATCH PUSH NOTIFICATION -->
      await sendNotificationToPatient({
        patientId,
        doctorId: user?.id,
        title: "Connection Request Updated",
        message: "Your doctor connection request was declined.",
      });

      triggerAlert("Request Declined", `The connection request from ${patientName} was declined.`, "error");
      fetchPatients();
      window.dispatchEvent(new Event('connectionUpdated')); // Notify Dashboard to update counts
    } catch(err) {
      triggerAlert("Error", "Failed to reject request.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const getRiskColor = (level: string) => {
    const normalStr = level?.toLowerCase() || "";
    if (normalStr.includes("high")) return "bg-red-100 text-red-800 border-red-200";
    if (normalStr.includes("mod") || normalStr.includes("med")) return "bg-amber-100 text-amber-900 border-amber-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  return (
    <Card className="rounded-3xl shadow-sm border border-slate-200 bg-white overflow-hidden flex flex-col h-full">
      
      {/* Modern TEREA Center Popup Dialog (Accessible) */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
          <DialogContent className="sm:max-w-[400px] rounded-3xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-2xl font-sans">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-5 ${alert.type === 'success' ? 'bg-[#DDE5B6]/50' : 'bg-red-50'}`}>
              {alert.type === 'success' ? <CheckCircle2 className="h-7 w-7 text-[#606C38]" /> : <AlertCircle className="h-7 w-7 text-red-500" />}
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-900">{alert.title}</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2 text-sm font-medium">{alert.message}</DialogDescription>
            <Button 
              className={`mt-8 w-full rounded-2xl text-white h-12 font-bold transition-all active:scale-95 ${alert.type === 'success' ? 'bg-[#606C38] hover:bg-[#283618]' : 'bg-red-500 hover:bg-red-600'}`} 
              onClick={() => setAlert({...alert, open: false})}
            >
              Okay
            </Button>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg font-bold text-slate-900">Patient Directory Snapshot</CardTitle>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-slate-100/80 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto scrollbar-hide border border-slate-200/60">
            <Button 
              variant="ghost"
              onClick={() => setActiveTab('pending')}
              className={`rounded-xl px-5 h-9 font-bold transition-all text-xs sm:text-sm ${activeTab === 'pending' ? 'bg-white text-[#606C38] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Action Required
              {pendingList.length > 0 && (
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'pending' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'}`}>
                  {pendingList.length}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setActiveTab('active')}
              className={`rounded-xl px-5 h-9 font-bold transition-all text-xs sm:text-sm ${activeTab === 'active' ? 'bg-white text-[#606C38] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Recent Patients
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#606C38]" />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            
            {/* PENDING TAB */}
            {activeTab === 'pending' && (
              pendingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4 animate-in fade-in duration-300">
                  <div className="h-16 w-16 bg-[#DDE5B6]/30 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="h-8 w-8 text-[#606C38]" />
                  </div>
                  <p className="text-slate-900 font-bold text-lg">You're all caught up!</p>
                  <p className="text-slate-500 text-sm mt-1">There are no pending patient requests at the moment.</p>
                </div>
              ) : (
                <Table className="animate-in fade-in duration-300">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-6 h-11">Patient</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-11">Risk Level</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-11">Date Requested</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6 h-11">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingList.map((req) => {
                      const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
                      const isProcessing = processingId === req.patient_id;

                      return (
                        <TableRow key={req.patient_id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {profile?.avatar_url ? (
                                  <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                                ) : (
                                  <User className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <span className="font-bold text-slate-900">{profile?.full_name || "Unknown Patient"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-bold uppercase text-[10px] tracking-wider border px-2 py-0.5 ${getRiskColor(profile?.risk_level)}`}>
                              {profile?.risk_level || "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleApprove(req.patient_id, profile?.full_name)}
                                disabled={isProcessing}
                                className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors rounded-lg font-bold"
                              >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                Approve
                              </Button>
                              <Button 
                                size="icon" 
                                variant="outline" 
                                onClick={() => handleReject(req.patient_id, profile?.full_name)}
                                disabled={isProcessing}
                                className="h-8 w-8 border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors rounded-lg"
                              >
                                <X className="h-4 w-4" />
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

            {/* ACTIVE TAB */}
            {activeTab === 'active' && (
              activeList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4 animate-in fade-in duration-300">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-bold text-lg">No Active Patients</p>
                  <p className="text-slate-500 text-sm mt-1">You currently have no active patients in your roster.</p>
                </div>
              ) : (
                <Table className="animate-in fade-in duration-300">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-6 h-11">Patient</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-11">Risk Level</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6 h-11">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeList.map((req) => {
                      const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;

                      return (
                        <TableRow key={req.patient_id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {profile?.avatar_url ? (
                                  <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                                ) : (
                                  <User className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <span className="font-bold text-slate-900">{profile?.full_name || "Unknown Patient"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-bold uppercase text-[10px] tracking-wider border px-2 py-0.5 ${getRiskColor(profile?.risk_level)}`}>
                              {profile?.risk_level || "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => navigate(`/doctor/patient-details/${req.patient_id}`)}
                              className="h-8 text-[#606C38] hover:bg-[#DDE5B6]/50 rounded-lg font-bold"
                            >
                              Review <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
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

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => navigate("/doctor/patients")} 
          className="w-full sm:w-auto border-slate-200 text-slate-600 hover:text-[#606C38] hover:bg-[#FEFAE0] hover:border-[#DDE5B6] rounded-xl font-bold transition-all"
        >
          View All Patients Directory <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
}