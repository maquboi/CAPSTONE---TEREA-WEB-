import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const reports = [
  {
    id: 1,
    name: "Monthly TB Trend Report",
    description: "High-risk cases and barangay distribution",
    date: "January 2026",
    status: "Ready",
  },
  {
    id: 2,
    name: "Follow-up Completion Report",
    description: "Patient follow-up and referral statistics",
    date: "January 2026",
    status: "Ready",
  },
  {
    id: 3,
    name: "DOH Compliance Report",
    description: "Required documentation for DOH submission",
    date: "January 2026",
    status: "Pending",
  },
  {
    id: 4,
    name: "Barangay Risk Assessment",
    description: "Geographic distribution of TB cases",
    date: "December 2025",
    status: "Ready",
  },
];

export default function SystemReports() {
  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              System Reports
            </h1>
            <p className="text-muted-foreground">
              Generate and download monthly TB trend reports
            </p>
          </div>
          <Button>
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
              <Select defaultValue="january">
                <SelectTrigger className="w-48">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="january">January 2026</SelectItem>
                  <SelectItem value="december">December 2025</SelectItem>
                  <SelectItem value="november">November 2025</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Report type" />
                </SelectTrigger>
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
          {reports.map((report) => (
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
                    <Button variant="outline" size="sm" disabled={report.status !== "Ready"}>
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" disabled={report.status !== "Ready"}>
                      <Download className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
