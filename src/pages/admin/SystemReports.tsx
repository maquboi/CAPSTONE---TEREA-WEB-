import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const reports = [
  { id: 1, name: "Monthly TB Trend Report", description: "High-risk cases and barangay distribution", date: "January 2026", status: "Ready", type: "trend" },
  { id: 2, name: "Follow-up Completion Report", description: "Patient follow-up and referral statistics", date: "January 2026", status: "Ready", type: "followup" },
  { id: 3, name: "DOH Compliance Report", description: "Required documentation for DOH submission", date: "January 2026", status: "Pending", type: "compliance" },
  { id: 4, name: "Barangay Risk Assessment", description: "Geographic distribution of TB cases", date: "December 2025", status: "Ready", type: "trend" },
];

export default function SystemReports() {
  const { toast } = useToast();
  const [monthFilter, setMonthFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = reports.filter((r) => {
    const matchesMonth = monthFilter === "all" ||
      (monthFilter === "january" && r.date.includes("January")) ||
      (monthFilter === "december" && r.date.includes("December")) ||
      (monthFilter === "november" && r.date.includes("November"));
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    return matchesMonth && matchesType;
  });

  const handleDownload = (name: string, format: string) => {
    toast({ title: "Download started", description: `Downloading ${name} as ${format}...` });
  };

  const handleGenerate = () => {
    toast({ title: "Generating report", description: "Your new report is being generated. This may take a moment." });
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">System Reports</h1>
            <p className="text-muted-foreground">Generate and download monthly TB trend reports</p>
          </div>
          <Button onClick={handleGenerate}>
            <FileText className="mr-2 h-4 w-4" />
            Generate New Report
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Report Filters</CardTitle>
                <CardDescription>Select time period and report type</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-48">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="january">January 2026</SelectItem>
                  <SelectItem value="december">December 2025</SelectItem>
                  <SelectItem value="november">November 2025</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Report type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="trend">TB Trend</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="compliance">DOH Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{report.name}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                  <Badge
                    variant={report.status === "Ready" ? "default" : "secondary"}
                    className={report.status === "Ready" ? "bg-status-success" : ""}
                  >
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{report.date}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={report.status !== "Ready"} onClick={() => handleDownload(report.name, "PDF")}>
                      <Download className="mr-2 h-4 w-4" />PDF
                    </Button>
                    <Button variant="outline" size="sm" disabled={report.status !== "Ready"} onClick={() => handleDownload(report.name, "Excel")}>
                      <Download className="mr-2 h-4 w-4" />Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground col-span-2 text-center py-8">No reports match your filters.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
