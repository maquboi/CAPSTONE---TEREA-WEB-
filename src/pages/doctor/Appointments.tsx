import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Download, Search, ArrowUpDown, Filter } from "lucide-react";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "Patient Reports",
    pageSubtitle: "View and download diagnostic results and health summaries",
    downloadAllBtn: "Download Reports",
    searchPlaceholder: "Search by patient name or ID...",
    sortByDate: "Sort by Date",
    oldest: "(Oldest)",
    newest: "(Newest)",
    filterBtn: "Filter",
    recentReports: "Recent Reports",
    totalReports: "total reports",
    issuedDate: "Issued Date",
    downloadBtn: "Download",
    noReportsDb: "No reports available in the database.",
    noReportsSearch: "No reports found matching your search."
  },
  fil: {
    pageTitle: "Mga Ulat ng Pasyente",
    pageSubtitle: "Tingnan at i-download ang resulta ng diagnostic at buod ng kalusugan",
    downloadAllBtn: "I-download ang mga Ulat",
    searchPlaceholder: "Maghanap sa pangalan o ID ng pasyente...",
    sortByDate: "Ayusin ayon sa Petsa",
    oldest: "(Pinakaluma)",
    newest: "(Pinakabago)",
    filterBtn: "Salain",
    recentReports: "Kamakailang mga Ulat",
    totalReports: "kabuuang ulat",
    issuedDate: "Petsa ng Pagkakalabas",
    downloadBtn: "I-download",
    noReportsDb: "Walang mga ulat na magagamit sa database.",
    noReportsSearch: "Walang nahanap na mga ulat na tumutugma sa iyong paghahanap."
  }
};

export default function Reports() {
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const [reports, setReports] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [doctorName, setDoctorName] = useState("Doctor");

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile) setDoctorName(profile.full_name);
      }
    };
    fetchUserData();
  }, []);

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
    <DashboardLayout role="doctor" userName={doctorName}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("pageTitle")}</h1>
            <p className="text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
          <Button onClick={handleDownloadAll}>
            <Download className="mr-2 h-4 w-4" />
            {t("downloadAllBtn")}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={toggleSort}>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {t("sortByDate")} {sortOrder === "asc" ? t("oldest") : t("newest")}
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              {t("filterBtn")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{t("recentReports")}</CardTitle>
              </div>
              <Badge variant="secondary">{filteredReports.length} {t("totalReports")}</Badge>
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
                        <p className="text-sm font-medium">{t("issuedDate")}</p>
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
                        {t("downloadBtn")}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                  {reports.length === 0 
                    ? t("noReportsDb") 
                    : t("noReportsSearch")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}