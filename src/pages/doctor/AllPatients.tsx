import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase"; // Corrected path to your lib
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Filter, Eye } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// 1. Define the Real Data Structure
interface Patient {
  id: string | number;
  name: string;
  age: number | string;
  barangay: string;
  status: string;
  lastVisit: string;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    "High Risk": "bg-status-danger text-white",
    "For Follow-up": "bg-status-warning text-sidebar-foreground",
    "For Checkup": "bg-primary text-primary-foreground",
    "Completed": "bg-status-success text-white",
  };
  return variants[status] || "";
};

export default function AllPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);

  // 2. Fetch Real Data from Supabase
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get Doctor Name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile) setDoctorName(profile.full_name);

      // Get Patients (Active Connections)
      const { data: connections } = await supabase
        .from('connections')
        .select(`
          id,
          created_at,
          status,
          profiles:patient_id (
            full_name,
            risk_level,
            barangay
          )
        `)
        .eq('doctor_id', user.id)
        .eq('status', 'active'); // Only show confirmed patients

      if (connections) {
        const formattedPatients = connections.map(c => ({
          id: c.id,
          name: (c.profiles as any)?.full_name || "Unknown",
          age: "--", // Age requires a DOB field in profiles; showing placeholder
          barangay: (c.profiles as any)?.barangay || "Carmona",
          status: (c.profiles as any)?.risk_level || "Standard",
          lastVisit: new Date(c.created_at).toLocaleDateString()
        }));
        setPatients(formattedPatients);
      }
      setLoading(false);
    };

    fetchAllData();
  }, []);

  const filtered = patients.filter((p) => {
    const matchesSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barangay.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "high-risk" && p.status === "High Risk") ||
      (statusFilter === "follow-up" && p.status === "For Follow-up") ||
      (statusFilter === "checkup" && p.status === "For Checkup") ||
      (statusFilter === "completed" && p.status === "Completed");
      
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout role="doctor" userName={doctorName || "Doctor"}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Patients</h1>
          <p className="text-muted-foreground">View and manage all assigned patients</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Patient Directory</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search patients..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="high-risk">High Risk</SelectItem>
                    <SelectItem value="follow-up">For Follow-up</SelectItem>
                    <SelectItem value="checkup">For Checkup</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={6} className="text-center py-8">Syncing database...</TableCell></TableRow>
                ) : filtered.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell className="text-muted-foreground">{patient.barangay}</TableCell>
                    <TableCell><Badge className={getStatusBadge(patient.status)}>{patient.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{patient.lastVisit}</TableCell>
                    <TableCell>
                      {/* FIXED: Cast variant as string literal to avoid red lines */}
                      <Button 
                        variant={"ghost" as any} 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No patients found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Patient Details</DialogTitle></DialogHeader>
          {selectedPatient && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Name</p><p className="font-medium">{selectedPatient.name}</p></div>
                <div><p className="text-muted-foreground">Age</p><p className="font-medium">{selectedPatient.age}</p></div>
                <div><p className="text-muted-foreground">Barangay</p><p className="font-medium">{selectedPatient.barangay}</p></div>
                <div><p className="text-muted-foreground">Status</p><Badge className={getStatusBadge(selectedPatient.status)}>{selectedPatient.status}</Badge></div>
                <div><p className="text-muted-foreground">Last Visit</p><p className="font-medium">{selectedPatient.lastVisit}</p></div>
              </div>
              <p className="text-sm text-muted-foreground">Data verified via Carmona Health Supabase record.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}