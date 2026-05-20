import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Filter, Eye, Download, Users, CheckCircle, AlertCircle } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "Patient Directory & Reports",
    pageSubtitle: "Manage verified patients and review risk assessments.",
    exportBtn: "Export Patient List",
    searchPlaceholder: "Search by name or barangay...",
    riskLevel: "Risk Level",
    allRiskLevels: "All Risk Levels",
    highRisk: "High Risk",
    mediumRisk: "Medium Risk",
    standardLow: "Standard / Low",
    resetFilters: "Reset Filters",
    patientRecords: "Patient Records",
    name: "Name",
    age: "Age",
    barangay: "Barangay",
    registrationDate: "Registration Date",
    action: "Action",
    syncing: "Syncing with database...",
    noPatients: "No patients found.",
    viewDetails: "View Details",
    unknownPatient: "Unknown Patient",
    genReportTitle: "Generating Report",
    genReportDesc: "Patient directory list is being exported...",
    syncErrorTitle: "Sync Error",
    syncErrorDesc: "Could not sync patient list.",
    error: "Error"
  },
  fil: {
    pageTitle: "Direktoryo at Ulat ng Pasyente",
    pageSubtitle: "Pamahalaan ang mga na-verify na pasyente at suriin ang panganib.",
    exportBtn: "I-export ang Listahan",
    searchPlaceholder: "Maghanap sa pangalan o barangay...",
    riskLevel: "Antas ng Panganib",
    allRiskLevels: "Lahat ng Antas",
    highRisk: "Mataas na Panganib",
    mediumRisk: "Katamtamang Panganib",
    standardLow: "Karaniwan / Mababa",
    resetFilters: "I-reset ang mga Filter",
    patientRecords: "Mga Rekord ng Pasyente",
    name: "Pangalan",
    age: "Edad",
    barangay: "Barangay",
    registrationDate: "Petsa ng Rehistrasyon",
    action: "Aksyon",
    syncing: "Nagsi-sync sa database...",
    noPatients: "Walang nahanap na pasyente.",
    viewDetails: "Tingnan ang Detalye",
    unknownPatient: "Hindi Kilalang Pasyente",
    genReportTitle: "Gumagawa ng Ulat",
    genReportDesc: "Ini-export na ang listahan ng direktoryo...",
    syncErrorTitle: "Error sa Pag-sync",
    syncErrorDesc: "Hindi ma-sync ang listahan ng pasyente.",
    error: "Error"
  }
};

interface Patient {
  id: string; 
  name: string;
  age: string;
  barangay: string;
  riskLevel: string;
  lastVisit: string;
}

const getRiskBadge = (risk: string) => {
  const lowerRisk = risk?.toLowerCase() || "";
  if (lowerRisk.includes("high")) return "bg-red-50 text-red-600 border-red-200";
  if (lowerRisk.includes("medium") || lowerRisk.includes("follow-up")) return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-green-50 text-green-600 border-green-200";
};

export default function AllPatients() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;
  
  // Centralized Alert State
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
          
        if (profile) setDoctorName(profile.full_name);

        const { data: connections, error } = await supabase
          .from('connections')
          .select(`
            patient_id,
            created_at,
            status,
            profiles!fk_patient (
              full_name,
              age,
              risk_level,
              barangay
            )
          `)
          .eq('doctor_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (connections) {
          const uniquePatients = new Map();
          
          connections.forEach(c => {
            if (!uniquePatients.has(c.patient_id)) {
              const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
              
              uniquePatients.set(c.patient_id, {
                id: c.patient_id, 
                name: p?.full_name || t("unknownPatient"),
                age: (p?.age !== null && p?.age !== undefined && p?.age !== "") ? p.age.toString() : "--", 
                barangay: p?.barangay || "Carmona",
                riskLevel: p?.risk_level || "Standard",
                lastVisit: new Date(c.created_at).toLocaleDateString()
              });
            }
          });
          
          setPatients(Array.from(uniquePatients.values()));
        }
      } catch (err: any) {
        console.error("Fetch Error:", err.message);
        triggerAlert(t("syncErrorTitle"), t("syncErrorDesc"), "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [language]); 

  const handleExport = () => {
    triggerAlert(t("genReportTitle"), t("genReportDesc"), "success");
  };

  const filtered = patients.filter((p) => {
    const matchesSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barangay.toLowerCase().includes(search.toLowerCase());
    
    const matchesRisk = riskFilter === "all" ||
      (riskFilter === "high-risk" && p.riskLevel.toLowerCase().includes("high")) ||
      (riskFilter === "medium-risk" && p.riskLevel.toLowerCase().includes("medium")) ||
      (riskFilter === "standard" && (p.riskLevel.toLowerCase().includes("standard") || p.riskLevel.toLowerCase().includes("low")));
      
    return matchesSearch && matchesRisk;
  });

  return (
    <DashboardLayout role="doctor" userName={doctorName || "Doctor"}>
      
      {/* Centralized Notification Pop-up */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{alert.title}</h2>
          <p className="text-slate-500 mt-2 text-sm">{alert.message}</p>
          <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white" onClick={() => setAlert({...alert, open: false})}>Okay</Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3B1E]">{t("pageTitle")}</h1>
            <p className="text-[#606C38]/80 font-medium mt-1">{t("pageSubtitle")}</p>
          </div>
          <Button className="gap-2 bg-[#606C38] hover:bg-[#2D3B1E] text-white" onClick={handleExport}>
            <Download className="h-4 w-4" />
            {t("exportBtn")}
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row bg-white p-4 rounded-xl border border-[#DDE5B6] shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder={t("searchPlaceholder")} 
              className="pl-9 bg-[#FEFAE0]/30 border-[#DDE5B6] focus-visible:ring-[#606C38]" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#FEFAE0]/30 border-[#DDE5B6]">
              <SelectValue placeholder={t("riskLevel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allRiskLevels")}</SelectItem>
              <SelectItem value="high-risk">{t("highRisk")}</SelectItem>
              <SelectItem value="medium-risk">{t("mediumRisk")}</SelectItem>
              <SelectItem value="standard">{t("standardLow")}</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="shrink-0 border-[#DDE5B6] text-[#606C38] hover:bg-[#FEFAE0]" 
            onClick={() => { setSearch(""); setRiskFilter("all"); }}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t("resetFilters")}
          </Button>
        </div>

        <Card className="border-[#DDE5B6] shadow-sm">
          <CardHeader className="pb-3 border-b border-[#DDE5B6]/50 bg-[#FEFAE0]/20">
            <CardTitle className="text-base flex items-center gap-2 text-[#2D3B1E]">
              <Users className="h-5 w-5 text-[#606C38]" /> 
              {t("patientRecords")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#FEFAE0]/50">
                <TableRow>
                  <TableHead className="pl-6 text-[#2D3B1E] font-bold">{t("name")}</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">{t("age")}</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">{t("barangay")}</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">{t("riskLevel")}</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">{t("registrationDate")}</TableHead>
                  <TableHead className="text-right pr-6 text-[#2D3B1E] font-bold">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t("syncing")}</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10 italic">{t("noPatients")}</TableCell>
                  </TableRow>
                ) : filtered.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-[#FEFAE0]/30">
                    <TableCell className="font-semibold text-[#2D3B1E] pl-6">{patient.name}</TableCell>
                    <TableCell className="font-medium text-[#2D3B1E]">{patient.age}</TableCell>
                    <TableCell className="text-muted-foreground">{patient.barangay}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRiskBadge(patient.riskLevel)}>
                        {patient.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{patient.lastVisit}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[#606C38] hover:bg-[#606C38] hover:text-white transition-colors" 
                        onClick={() => navigate(`/doctor/patient-details/${patient.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1.5" /> {t("viewDetails")}
                      </Button>
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