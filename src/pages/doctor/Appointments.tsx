import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, ArrowUpDown, Filter, Printer, ExternalLink } from "lucide-react";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "Patient Status & Clinical Reports Hub",
    pageSubtitle: "Centralized overview of patient adherence, active treatment phases, and printable clinical records",
    downloadAllBtn: "Print Patient Population Summary",
    searchPlaceholder: "Search by patient name or ID...",
    sortByDate: "Sort by Start Date",
    oldest: "(Oldest)",
    newest: "(Newest)",
    filterBtn: "Filter Status",
    recentReports: "Clinical Patient Records",
    totalReports: "total patients",
    issuedDate: "Start Date",
    downloadBtn: "Print Report",
    noReportsDb: "No patient reports available in the database.",
    noReportsSearch: "No reports found matching your search."
  },
  fil: {
    pageTitle: "Hub ng Katayuan ng Pasyente at Ulat Klinikal",
    pageSubtitle: "Pangkalahatang-ideya ng adherence, phase ng gamutan, at napi-print na ulat ng bawat pasyente",
    downloadAllBtn: "I-print ang Buod ng Lahat ng Pasyente",
    searchPlaceholder: "Maghanap sa pangalan o ID ng pasyente...",
    sortByDate: "Ayusin ayon sa Petsa",
    oldest: "(Pinakaluma)",
    newest: "(Pinakabago)",
    filterBtn: "Salain",
    recentReports: "Mga Rekord ng Pasyente",
    totalReports: "kabuuang pasyente",
    issuedDate: "Petsa ng Simula",
    downloadBtn: "I-print ang Ulat",
    noReportsDb: "Walang mga ulat na magagamit sa database.",
    noReportsSearch: "Walang nahanap na mga ulat na tumutugma sa iyong paghahanap."
  }
};

export default function Reports() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const [reports, setReports] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [doctorName, setDoctorName] = useState("Doctor");
  const [selectedPatientForPrint, setSelectedPatientForPrint] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.user_metadata?.full_name) {
          setDoctorName(user.user_metadata.full_name);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          if (profile?.full_name) setDoctorName(profile.full_name);
        }
      }
    };
    fetchUserData();
    fetchPatientsData();
  }, []);

  const fetchPatientsData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('full_name', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          patientName: p.full_name || "Unknown Patient",
          type: p.tb_regimen || "6-Month DOTS",
          status: p.status === 'cured' 
            ? 'Cured' 
            : (p.status === 'treatment_completed' 
                ? 'Treatment Completed' 
                : (p.treatment_start_date ? 'Active Monitoring' : 'Pending Protocol')),
          date: p.treatment_start_date ? new Date(p.treatment_start_date).toLocaleDateString() : "Not Started",
          raw: p
        }));
        setReports(mapped);
      }
    } catch (err) {
      console.error("Error fetching patient reports:", err);
    }
  };

  const filteredReports = reports
    .filter((report) => {
      const matchesSearch = report.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || report.status.toLowerCase().includes(statusFilter.toLowerCase());
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      return sortOrder === "asc" 
        ? a.date.localeCompare(b.date) 
        : b.date.localeCompare(a.date);
    });

  const handlePrintPatientReport = (patientData: any) => {
    setSelectedPatientForPrint(patientData);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handlePrintAll = () => {
    setSelectedPatientForPrint(null);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
      <div className="space-y-6 animate-fade-in print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#283618]">{t("pageTitle")}</h1>
            <p className="text-sm text-slate-500">{t("pageSubtitle")}</p>
          </div>
          <Button onClick={handlePrintAll} className="bg-[#606C38] hover:bg-[#283618] text-white rounded-xl shadow-sm">
            <Printer className="mr-2 h-4 w-4" />
            {t("downloadAllBtn")}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-10 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 h-9 px-3 rounded-xl focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Monitoring</option>
              <option value="cured">Cured</option>
              <option value="pending">Pending Protocol</option>
            </select>
            <Button variant="outline" size="sm" onClick={toggleSort} className="rounded-xl border-slate-200">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {t("sortByDate")} {sortOrder === "asc" ? t("oldest") : t("newest")}
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#606C38]" />
                <CardTitle className="text-base font-bold text-[#283618]">{t("recentReports")}</CardTitle>
              </div>
              <Badge variant="secondary" className="rounded-lg">{filteredReports.length} {t("totalReports")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col md:flex-row md:items-center justify-between rounded-xl border border-slate-100 p-4 hover:bg-slate-50/60 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-[#FEFAE0] border border-[#DDE5B6] flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-[#606C38]" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{report.patientName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="font-mono font-semibold">{report.id.substring(0, 8).toUpperCase()}</span>
                          <span>•</span>
                          <span>{report.type}</span>
                          <span>•</span>
                          <span>Adherence: {Math.round(report.raw?.adherence_rate ?? 0)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                      <div className="text-right hidden sm:block mr-2">
                        <p className="text-xs font-semibold text-slate-500">{t("issuedDate")}</p>
                        <p className="text-xs font-bold text-slate-800">{report.date}</p>
                      </div>
                      <Badge
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                          report.status === "Cured" 
                            ? "bg-emerald-600 text-white" 
                            : (report.status === "Active Monitoring" 
                                ? "bg-amber-100 text-amber-900 border-amber-300" 
                                : "bg-slate-100 text-slate-700")
                        }`}
                      >
                        {report.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/doctor/patient-details/${report.id}`)}
                        className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePrintPatientReport(report.raw)}
                        className="border-[#606C38] text-[#606C38] hover:bg-[#606C38] hover:text-white rounded-xl font-semibold"
                      >
                        <Printer className="mr-1.5 h-3.5 w-3.5" />
                        {t("downloadBtn")}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  {reports.length === 0 
                    ? t("noReportsDb") 
                    : t("noReportsSearch")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- PRINTABLE PATIENT CLINICAL SUMMARY (VISIBLE ON PRINT ONLY) --- */}
      <div className="hidden print:block font-sans text-black bg-white min-h-screen w-full patient-report-print">
        <style type="text/css" media="print">
          {`
            @page { size: auto; margin: 0mm; }
            body * { visibility: hidden !important; }
            .patient-report-print, .patient-report-print * { visibility: visible !important; }
            .patient-report-print { 
              position: fixed !important; 
              left: 0 !important; 
              top: 0 !important; 
              width: 100vw !important; 
              min-height: 100vh !important;
              margin: 0 !important;
              padding: 2cm 2cm !important;
              background: white !important;
              z-index: 99999 !important;
              box-sizing: border-box !important;
            }
          `}
        </style>

        {selectedPatientForPrint ? (
          <div>
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">MUNICIPALITY OF CARMONA</h1>
                <h2 className="text-lg font-bold text-slate-600">CARMONA TB DOTS CLINIC</h2>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-extrabold tracking-tight">TEREA TB-DOTS</h1>
                <p className="text-xs font-bold text-slate-500">OFFICIAL PATIENT CLINICAL SUMMARY</p>
              </div>
            </div>

            <div className="space-y-6 text-sm">
              <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-xs">Patient Demographics</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <div><span className="font-bold text-slate-500">Full Name:</span> {selectedPatientForPrint.full_name}</div>
                  <div><span className="font-bold text-slate-500">Patient ID:</span> {selectedPatientForPrint.id?.substring(0, 8).toUpperCase()}</div>
                  <div><span className="font-bold text-slate-500">Age / Gender:</span> {selectedPatientForPrint.age || "N/A"} yrs old • {selectedPatientForPrint.gender || "N/A"}</div>
                  <div><span className="font-bold text-slate-500">Barangay:</span> {selectedPatientForPrint.barangay || "Carmona"}</div>
                  <div><span className="font-bold text-slate-500">Contact:</span> {selectedPatientForPrint.phone_number || "N/A"}</div>
                  <div><span className="font-bold text-slate-500">Email:</span> {selectedPatientForPrint.email || "N/A"}</div>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-xs">Clinical Status & Monitoring</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <div><span className="font-bold text-slate-500">TB Regimen:</span> {selectedPatientForPrint.tb_regimen || "6-Month DOTS"}</div>
                  <div><span className="font-bold text-slate-500">Status:</span> <span className="font-bold uppercase">{selectedPatientForPrint.status || "Active Monitoring"}</span></div>
                  <div><span className="font-bold text-slate-500">Registration Group:</span> {selectedPatientForPrint.registration_group || "New"}</div>
                  <div><span className="font-bold text-slate-500">Anatomical Site:</span> {selectedPatientForPrint.disease_anatomical_site || "Pulmonary (PTB)"}</div>
                  <div><span className="font-bold text-slate-500">Treatment Start:</span> {selectedPatientForPrint.treatment_start_date || "Not started"}</div>
                  <div><span className="font-bold text-slate-500">Target End Date:</span> {selectedPatientForPrint.treatment_end_date || "N/A"}</div>
                  <div><span className="font-bold text-slate-500">Adherence Rate:</span> {Math.round(selectedPatientForPrint.adherence_rate ?? 0)}%</div>
                  <div><span className="font-bold text-slate-500">Risk Assessment:</span> {selectedPatientForPrint.risk_level || "Not assessed"}</div>
                </div>
              </div>

              <div className="pt-16 flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-400">Date Printed</p>
                  <p className="font-bold">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-center w-64 border-t border-slate-800 pt-2">
                  <p className="font-bold uppercase">Dr. {doctorName}</p>
                  <p className="text-xs text-slate-500">Attending Physician • Carmona Health Center</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="border-b-2 border-slate-800 pb-4 mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight">MUNICIPALITY OF CARMONA - TB DOTS CLINIC</h1>
              <p className="text-sm font-bold text-slate-600">Active Patient Population Monitoring Summary</p>
            </div>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="p-2 border-r">ID</th>
                  <th className="p-2 border-r">Name</th>
                  <th className="p-2 border-r">Regimen</th>
                  <th className="p-2 border-r">Status</th>
                  <th className="p-2 border-r">Start Date</th>
                  <th className="p-2">Adherence</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2 border-r font-mono">{r.id.substring(0, 8).toUpperCase()}</td>
                    <td className="p-2 border-r font-bold">{r.patientName}</td>
                    <td className="p-2 border-r">{r.type}</td>
                    <td className="p-2 border-r">{r.status}</td>
                    <td className="p-2 border-r">{r.date}</td>
                    <td className="p-2">{Math.round(r.raw?.adherence_rate ?? 0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}