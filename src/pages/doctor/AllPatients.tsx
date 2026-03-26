import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Filter, Eye, Download, Users } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// 1. Define the Data Structure
interface Patient {
  id: string; // The UUID used for navigation
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
  const { toast } = useToast();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);

  // 2. Fetch Real Data from Supabase
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Doctor Name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
          
        if (profile) setDoctorName(profile.full_name);

        // Fetching connections joined with profiles (including the 'age' column)
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
              // Extracting profile data safely
              const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
              
              uniquePatients.set(c.patient_id, {
                id: c.patient_id, // Pass this to the navigate function
                name: p?.full_name || "Unknown Patient",
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
        toast({ variant: "destructive", title: "Sync Error", description: "Could not sync patient list." });
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleExport = () => {
    toast({ 
      title: "Generating Report", 
      description: "Patient directory list is being exported..." 
    });
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
      <div className="space-y-6 animate-fade-in">
        
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3B1E]">Patient Directory & Reports</h1>
            <p className="text-[#606C38]/80 font-medium mt-1">Manage verified patients and review risk assessments.</p>
          </div>
          <Button 
            className="gap-2 bg-[#606C38] hover:bg-[#2D3B1E] text-white" 
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export Patient List
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row bg-white p-4 rounded-xl border border-[#DDE5B6] shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name or barangay..." 
              className="pl-9 bg-[#FEFAE0]/30 border-[#DDE5B6] focus-visible:ring-[#606C38]" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#FEFAE0]/30 border-[#DDE5B6]">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="high-risk">High Risk</SelectItem>
              <SelectItem value="medium-risk">Medium Risk</SelectItem>
              <SelectItem value="standard">Standard / Low</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="shrink-0 border-[#DDE5B6] text-[#606C38] hover:bg-[#FEFAE0]" 
            onClick={() => { setSearch(""); setRiskFilter("all"); }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>

        {/* Patient Table */}
        <Card className="border-[#DDE5B6] shadow-sm">
          <CardHeader className="pb-3 border-b border-[#DDE5B6]/50 bg-[#FEFAE0]/20">
            <CardTitle className="text-base flex items-center gap-2 text-[#2D3B1E]">
              <Users className="h-5 w-5 text-[#606C38]" /> 
              Patient Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#FEFAE0]/50">
                <TableRow>
                  <TableHead className="pl-6 text-[#2D3B1E] font-bold">Name</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">Age</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">Barangay</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">Risk Level</TableHead>
                  <TableHead className="text-[#2D3B1E] font-bold">Registration Date</TableHead>
                  <TableHead className="text-right pr-6 text-[#2D3B1E] font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Syncing with database...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10 italic">No patients found.</TableCell>
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
                        <Eye className="h-4 w-4 mr-1.5" /> View Details
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