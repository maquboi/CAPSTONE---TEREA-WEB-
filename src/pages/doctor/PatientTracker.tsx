import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Eye, User, Search, Activity, ShieldCheck, AlertCircle } from "lucide-react";

const getRiskBadge = (risk: string = "", isDischarged: boolean) => {
  if (isDischarged) return "bg-slate-100 text-slate-600 border-slate-300";
  const lower = risk.toLowerCase();
  if (lower.includes("high")) return "bg-red-50 text-red-700 border-red-200 font-bold";
  if (lower.includes("medium") || lower.includes("mod")) return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
  return "bg-teal-50 text-teal-800 border-teal-200 font-semibold";
};

const getStatusBadge = (status: string = "", isDischarged: boolean) => {
  if (isDischarged) return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-teal-50 text-teal-800 border-teal-200 font-semibold";
};

export default function PatientTracker() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [doctorName, setDoctorName] = useState("Doctor");

  useEffect(() => {
    fetchPatients();
  }, [filter]);

  const fetchPatients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch doctor name for layout header
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.full_name) setDoctorName(profile.full_name);

    let query = supabase
      .from('connections')
      .select('patient_id, profiles!inner(full_name, status, risk_level)')
      .eq('doctor_id', user.id);
      
    if (filter === 'discharged') {
      query = query.in('profiles.status', ['cured', 'treatment_completed']);
    } else {
      query = query.eq('profiles.status', filter);
    }

    const { data, error } = await query;
    if (!error && data) setPatients(data);
    setLoading(false);
  };

  const filteredPatients = patients.filter((p) => {
    const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    if (!search.trim()) return true;
    return profile?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  const cleanDoctorName = doctorName.replace(/^(dr\.?\s*)+/i, "").trim() || "Doctor";

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
      <div className="space-y-6 animate-fade-in font-sans">
        
        {/* --- PAGE HEADER BANNER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-300/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
              Real-Time Cohort Monitoring
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 pt-1">
              Patient Status Tracker
            </h1>
            <p className="text-slate-500 text-xs font-normal">
              Active surveillance roster and clinical status stratification • Dr. {cleanDoctorName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1.5 text-xs font-bold bg-slate-50 text-slate-700 border-slate-300 rounded-xl">
              <Activity className="h-3.5 w-3.5 mr-1.5 text-teal-700" />
              {filteredPatients.length} Patients in View
            </Badge>
          </div>
        </div>

        {/* --- TOOLBAR: SEGMENTED CONTROLS & INSTANT SEARCH --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-300/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          
          {/* Segmented Filter Control */}
          <div className="flex p-1 bg-slate-200/70 rounded-xl w-fit border border-slate-300/60 shadow-2xs">
            {[
              { id: "active", label: "Active Cohort" },
              { id: "pending", label: "Pending Intake" },
              { id: "discharged", label: "Discharged Archive" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filter === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Filter by patient name..."
              className="pl-8 bg-slate-50 border-slate-300 text-xs text-slate-800 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-9 rounded-xl w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* --- PATIENT TRACKER TABLE --- */}
        <Card className="border-slate-300/80 shadow-[0_12px_35px_rgba(15,23,42,0.06)] bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/70">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              Patient Verification & Care Pathway Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/90 border-b border-slate-200">
                <TableRow>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 pl-5">
                    Patient Name
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-[180px]">
                    Risk Assessment Level
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 w-[180px]">
                    Account Status
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-600 text-right pr-6 w-[140px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-14 text-slate-400 text-xs font-medium">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-teal-700" />
                      Loading patient tracking data...
                    </TableCell>
                  </TableRow>
                ) : filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-14 text-xs italic">
                      {patients.length === 0
                        ? "No patients found in this category."
                        : "No patients matched your name query."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((p) => {
                    const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                    const isDischarged = profile?.status === 'cured' || profile?.status === 'treatment_completed';
                    const displayRisk = isDischarged ? "Cleared" : (profile?.risk_level || "Standard");

                    return (
                      <TableRow 
                        key={p.patient_id} 
                        className={`border-b border-slate-100 transition-colors hover:bg-slate-50/70 ${isDischarged ? 'opacity-85 bg-slate-50/40' : ''}`}
                      >
                        <TableCell className="pl-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <User className="h-3.5 w-3.5 text-slate-500" />
                            </div>
                            <span className="font-semibold text-xs text-slate-900">
                              {profile?.full_name || "Unknown Patient"}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-3.5">
                          <Badge 
                            variant="outline" 
                            className={`rounded-md text-[10px] px-2.5 py-0.5 border ${getRiskBadge(displayRisk, isDischarged)}`}
                          >
                            {displayRisk}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <Badge 
                            variant="outline" 
                            className={`rounded-md text-[10px] px-2.5 py-0.5 capitalize border ${getStatusBadge(profile?.status, isDischarged)}`}
                          >
                            {profile?.status ? profile.status.replace('_', ' ') : "Unspecified"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-6 py-3.5">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 text-xs font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-900 rounded-lg transition-colors"
                            onClick={() => navigate(`/doctor/patient-details/${p.patient_id}`)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5"/> View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}