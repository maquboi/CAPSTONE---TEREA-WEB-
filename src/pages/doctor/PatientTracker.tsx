import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Eye } from "lucide-react";

export default function PatientTracker() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active"); 

  useEffect(() => {
    fetchPatients();
  }, [filter]);

  const fetchPatients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('connections')
      .select('patient_id, profiles:patient_id(full_name, status, risk_level)')
      .eq('doctor_id', user.id)
      .eq('profiles.status', filter === 'cured' ? 'cured' : (filter === 'pending' ? 'pending' : 'active'));
    if (!error && data) setPatients(data);
    setLoading(false);
  };

  return (
    <DashboardLayout role="doctor" userName="Doctor">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-[#283618]">Patient Tracker</h1>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            {['active', 'pending', 'cured'].map((f) => (
              <Button key={f} variant={filter === f ? "default" : "ghost"} onClick={() => setFilter(f)} className={filter === f ? "bg-[#606C38] text-white" : ""}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <Card className="rounded-2xl shadow-sm border border-slate-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Risk</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow> : 
                patients.map((p) => (
                  <TableRow key={p.patient_id}>
                    <TableCell className="font-bold">{p.profiles.full_name}</TableCell>
                    <TableCell>{p.profiles.risk_level}</TableCell>
                    <TableCell><Badge variant="outline">{p.profiles.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" onClick={() => navigate(`/doctor/patient-details/${p.patient_id}`)}><Eye className="h-4 w-4 mr-2"/>View</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}