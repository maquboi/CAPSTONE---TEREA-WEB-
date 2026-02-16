import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Patient {
  id: string;
  name: string;
  age: number;
  barangay: string;
  symptoms: string[];
  riskLevel: "high" | "medium" | "low";
  status: "pending" | "for-checkup" | "for-followup" | "completed";
  dateReported: string;
}

const mockPatients: Patient[] = [
  { id: "P001", name: "Juan Dela Cruz", age: 45, barangay: "Brgy. Cabilang Baybay", symptoms: ["Persistent cough", "Weight loss", "Night sweats"], riskLevel: "high", status: "pending", dateReported: "2025-02-03" },
  { id: "P002", name: "Maria Santos", age: 32, barangay: "Brgy. Maduya", symptoms: ["Cough > 2 weeks", "Fever"], riskLevel: "high", status: "for-checkup", dateReported: "2025-02-02" },
  { id: "P003", name: "Pedro Reyes", age: 58, barangay: "Brgy. Poblacion", symptoms: ["Blood in sputum", "Fatigue"], riskLevel: "high", status: "for-followup", dateReported: "2025-02-01" },
  { id: "P004", name: "Ana Garcia", age: 28, barangay: "Brgy. Mabuhay", symptoms: ["Mild cough", "Low fever"], riskLevel: "medium", status: "pending", dateReported: "2025-02-04" },
  { id: "P005", name: "Carlos Mendoza", age: 41, barangay: "Brgy. Lantic", symptoms: ["Chest pain", "Cough"], riskLevel: "medium", status: "for-checkup", dateReported: "2025-02-03" },
];

const getRiskBadge = (level: "high" | "medium" | "low") => {
  const styles = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return styles[level];
};

const getStatusBadge = (status: Patient["status"]) => {
  const styles = {
    pending: "bg-muted text-muted-foreground",
    "for-checkup": "bg-blue-100 text-blue-700",
    "for-followup": "bg-purple-100 text-purple-700",
    completed: "bg-emerald-100 text-emerald-700",
  };
  const labels = {
    pending: "Pending",
    "for-checkup": "For Checkup",
    "for-followup": "For Follow-up",
    completed: "Completed",
  };
  return { style: styles[status], label: labels[status] };
};

interface PatientQueueTableProps {
  search?: string;
  riskFilter?: string;
  statusFilter?: string;
}

export function PatientQueueTable({ search = "", riskFilter = "all", statusFilter = "all" }: PatientQueueTableProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState(mockPatients);

  const filtered = patients.filter((p) => {
    const matchesSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barangay.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === "all" || p.riskLevel === riskFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const handleStatusUpdate = (patient: Patient, newStatus: Patient["status"]) => {
    setPatients(patients.map((p) => p.id === patient.id ? { ...p, status: newStatus } : p));
    toast({ title: "Status updated", description: `${patient.name} moved to ${getStatusBadge(newStatus).label}.` });
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="text-lg font-semibold">High-Risk Patient Queue</h3>
            <p className="text-sm text-muted-foreground">Patients flagged by AI requiring immediate attention</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/doctor/patients")}>View All</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Barangay</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Symptoms</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Risk Level</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient) => {
                const statusInfo = getStatusBadge(patient.status);
                return (
                  <tr key={patient.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.age} yrs • {patient.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4"><p className="text-sm">{patient.barangay}</p></td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {patient.symptoms.slice(0, 2).map((symptom) => (
                          <Badge key={symptom} variant="secondary" className="text-xs">{symptom}</Badge>
                        ))}
                        {patient.symptoms.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{patient.symptoms.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={cn("capitalize", getRiskBadge(patient.riskLevel))}>{patient.riskLevel}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="secondary" className={statusInfo.style}>{statusInfo.label}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPatient(patient)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/doctor/appointments")}>
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedPatient(patient)}>View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/doctor/appointments")}>Schedule Appointment</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(patient, "for-checkup")}>Mark For Checkup</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(patient, "for-followup")}>Add to Follow-up</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(patient, "completed")}>Mark Completed</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No patients found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Patient Profile</DialogTitle></DialogHeader>
          {selectedPatient && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Name</p><p className="font-medium">{selectedPatient.name}</p></div>
                <div><p className="text-muted-foreground">Age</p><p className="font-medium">{selectedPatient.age} years</p></div>
                <div><p className="text-muted-foreground">Patient ID</p><p className="font-medium">{selectedPatient.id}</p></div>
                <div><p className="text-muted-foreground">Barangay</p><p className="font-medium">{selectedPatient.barangay}</p></div>
                <div><p className="text-muted-foreground">Risk Level</p><Badge variant="outline" className={cn("capitalize", getRiskBadge(selectedPatient.riskLevel))}>{selectedPatient.riskLevel}</Badge></div>
                <div><p className="text-muted-foreground">Status</p><Badge variant="secondary" className={getStatusBadge(selectedPatient.status).style}>{getStatusBadge(selectedPatient.status).label}</Badge></div>
                <div className="col-span-2"><p className="text-muted-foreground">Symptoms</p><div className="flex flex-wrap gap-1 mt-1">{selectedPatient.symptoms.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div></div>
                <div><p className="text-muted-foreground">Date Reported</p><p className="font-medium">{selectedPatient.dateReported}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
