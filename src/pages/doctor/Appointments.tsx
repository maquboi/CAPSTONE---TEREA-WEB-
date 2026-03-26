import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Download, 
  Search, 
  ArrowUpDown, 
  Filter 
} from "lucide-react";

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filtering Logic
  const filteredReports = reports
    .filter((report) =>
      report.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      return sortOrder === "asc" 
        ? a.date.localeCompare(b.date) 
        : b.date.localeCompare(a.date);
    });

  const handleDownload = (reportId: string) => {
    console.log(`Downloading report: ${reportId}`);
  };

  const handleDownloadAll = () => {
    console.log("Downloading all filtered reports");
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <DashboardLayout role="doctor" userName="Dr. Maria Santos">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Patient Reports
            </h1>
            <p className="text-muted-foreground">
              View and download diagnostic results and health summaries
            </p>
          </div>
          {/* Added Global Download Button */}
          <Button onClick={handleDownloadAll}>
            <Download className="mr-2 h-4 w-4" />
            Download Reports
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name or ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={toggleSort}>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort by Date {sortOrder === "asc" ? "(Oldest)" : "(Newest)"}
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Recent Reports</CardTitle>
              </div>
              <Badge variant="secondary">{filteredReports.length} total reports</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col md:flex-row md:items-center justify-between rounded-lg border p-4 hover:bg-accent/5 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{report.patientName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono">{report.id}</span>
                          <span>•</span>
                          <span>{report.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">Issued Date</p>
                        <p className="text-xs text-muted-foreground">{report.date}</p>
                      </div>
                      <Badge
                        variant={report.status === "Completed" ? "default" : "secondary"}
                        className={report.status === "Completed" ? "bg-status-success" : ""}
                      >
                        {report.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownload(report.id)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                  {reports.length === 0 
                    ? "No reports available in the database." 
                    : "No reports found matching your search."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}