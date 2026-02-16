import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Calendar, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialFollowUps = [
  { id: 1, patientName: "Juan Dela Cruz", scheduledDate: "2026-02-07", type: "Clinic Visit", completed: false, daysUntil: 1 },
  { id: 2, patientName: "Maria Garcia", scheduledDate: "2026-02-08", type: "Lab Results Review", completed: false, daysUntil: 2 },
  { id: 3, patientName: "Pedro Santos", scheduledDate: "2026-02-06", type: "Medication Check", completed: true, daysUntil: 0 },
  { id: 4, patientName: "Jose Rizal", scheduledDate: "2026-02-05", type: "Clinic Visit", completed: false, daysUntil: -1 },
  { id: 5, patientName: "Ana Reyes", scheduledDate: "2026-02-10", type: "Final Assessment", completed: false, daysUntil: 4 },
];

const getDueBadge = (daysUntil: number, completed: boolean) => {
  if (completed) return <Badge className="bg-status-success">Completed</Badge>;
  if (daysUntil < 0) return <Badge className="bg-status-danger">Overdue</Badge>;
  if (daysUntil === 0) return <Badge className="bg-status-warning">Today</Badge>;
  if (daysUntil <= 2) return <Badge className="bg-primary">Upcoming</Badge>;
  return <Badge variant="secondary">Scheduled</Badge>;
};

export default function FollowUpTracker() {
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState(initialFollowUps);
  const [search, setSearch] = useState("");

  const toggleComplete = (id: number) => {
    setFollowUps(followUps.map((f) => {
      if (f.id === id) {
        const newCompleted = !f.completed;
        toast({
          title: newCompleted ? "Marked as completed" : "Marked as incomplete",
          description: `${f.patientName}'s ${f.type} has been updated.`,
        });
        return { ...f, completed: newCompleted };
      }
      return f;
    }));
  };

  const filtered = followUps.filter((f) =>
    search === "" || f.patientName.toLowerCase().includes(search.toLowerCase()) || f.type.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    overdue: followUps.filter((f) => !f.completed && f.daysUntil < 0).length,
    today: followUps.filter((f) => !f.completed && f.daysUntil === 0).length,
    upcoming: followUps.filter((f) => !f.completed && f.daysUntil > 0).length,
    completed: followUps.filter((f) => f.completed).length,
  };

  return (
    <DashboardLayout role="doctor" userName="Dr. Maria Santos">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Follow-up Tracker</h1>
          <p className="text-muted-foreground">Track patient follow-ups and appointments</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-danger/10">
                  <Calendar className="h-5 w-5 text-status-danger" />
                </div>
                <div><p className="text-2xl font-semibold">{stats.overdue}</p><p className="text-sm text-muted-foreground">Overdue</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-warning/10">
                  <Calendar className="h-5 w-5 text-status-warning" />
                </div>
                <div><p className="text-2xl font-semibold">{stats.today}</p><p className="text-sm text-muted-foreground">Today</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div><p className="text-2xl font-semibold">{stats.upcoming}</p><p className="text-sm text-muted-foreground">Upcoming</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-success/10">
                  <CheckCircle2 className="h-5 w-5 text-status-success" />
                </div>
                <div><p className="text-2xl font-semibold">{stats.completed}</p><p className="text-sm text-muted-foreground">Completed</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Follow-up Schedule</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search patients..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Done</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((followUp) => (
                  <TableRow key={followUp.id}>
                    <TableCell>
                      <Checkbox checked={followUp.completed} onCheckedChange={() => toggleComplete(followUp.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{followUp.patientName}</TableCell>
                    <TableCell className="text-muted-foreground">{followUp.type}</TableCell>
                    <TableCell>{followUp.scheduledDate}</TableCell>
                    <TableCell>{getDueBadge(followUp.daysUntil, followUp.completed)}</TableCell>
                    <TableCell><Button variant="outline" size="sm">View</Button></TableCell>
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
