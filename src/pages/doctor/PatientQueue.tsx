import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PatientQueueTable } from "@/components/dashboard/PatientQueueTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PatientQueue() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleExport = () => {
    toast({ title: "Export started", description: "Patient queue list is being exported..." });
  };

  return (
    <DashboardLayout role="doctor" userName="Dr. Maria Santos">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Patient Queue</h1>
            <p className="text-muted-foreground">High-risk patients flagged by AI for review</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export List
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search patients..." className="pl-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card"><SelectValue placeholder="Risk Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="for-checkup">For Checkup</SelectItem>
              <SelectItem value="for-followup">For Follow-up</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => { setSearch(""); setRiskFilter("all"); setStatusFilter("all"); }}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <PatientQueueTable search={search} riskFilter={riskFilter} statusFilter={statusFilter} />
      </div>
    </DashboardLayout>
  );
}
