import { useState } from "react";
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

const patients = [
  { id: 1, name: "Juan Dela Cruz", age: 45, barangay: "Poblacion", status: "High Risk", lastVisit: "2026-02-05" },
  { id: 2, name: "Maria Garcia", age: 32, barangay: "Carmona Estates", status: "For Follow-up", lastVisit: "2026-02-04" },
  { id: 3, name: "Pedro Santos", age: 58, barangay: "Maduya", status: "For Checkup", lastVisit: "2026-02-03" },
  { id: 4, name: "Ana Reyes", age: 28, barangay: "Cabilang Baybay", status: "Completed", lastVisit: "2026-02-01" },
  { id: 5, name: "Jose Rizal", age: 67, barangay: "Tinungan", status: "High Risk", lastVisit: "2026-02-06" },
];

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null);

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
    <DashboardLayout role="doctor" userName="Dr. Maria Santos">
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
                {filtered.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell className="text-muted-foreground">{patient.barangay}</TableCell>
                    <TableCell><Badge className={getStatusBadge(patient.status)}>{patient.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{patient.lastVisit}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPatient(patient)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
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
              <p className="text-sm text-muted-foreground">Full patient records require database connection.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
