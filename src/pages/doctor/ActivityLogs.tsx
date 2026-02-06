import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const activityLogs = [
  {
    id: 1,
    action: "Appointment Scheduled",
    patient: "Juan Dela Cruz",
    details: "Follow-up on Feb 10, 2026",
    timestamp: "2026-02-06 09:15:00",
  },
  {
    id: 2,
    action: "Patient Status Updated",
    patient: "Maria Garcia",
    details: "Changed to 'For Follow-up'",
    timestamp: "2026-02-06 08:45:00",
  },
  {
    id: 3,
    action: "Reminder Sent",
    patient: "Pedro Santos",
    details: "Medication reminder via SMS",
    timestamp: "2026-02-05 16:30:00",
  },
  {
    id: 4,
    action: "Lab Results Reviewed",
    patient: "Ana Reyes",
    details: "Sputum test results reviewed",
    timestamp: "2026-02-05 14:20:00",
  },
  {
    id: 5,
    action: "Follow-up Completed",
    patient: "Jose Rizal",
    details: "Clinic visit completed",
    timestamp: "2026-02-05 11:00:00",
  },
  {
    id: 6,
    action: "New Patient Assigned",
    patient: "Carlo Mendoza",
    details: "High-risk patient assigned",
    timestamp: "2026-02-04 15:30:00",
  },
];

export default function ActivityLogs() {
  return (
    <DashboardLayout role="doctor" userName="Dr. Maria Santos">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Activity Logs
          </h1>
          <p className="text-muted-foreground">
            Track your recent actions and patient interactions
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search activity..." className="pl-8" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="appointments">Appointments</SelectItem>
                    <SelectItem value="status">Status Updates</SelectItem>
                    <SelectItem value="reminders">Reminders</SelectItem>
                    <SelectItem value="reviews">Reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.patient}</TableCell>
                    <TableCell className="text-muted-foreground">{log.details}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {log.timestamp}
                    </TableCell>
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
