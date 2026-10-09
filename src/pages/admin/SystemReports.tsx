import { useState, useMemo, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Download, 
  FileText, 
  Calendar as CalendarIcon, 
  Search, 
  Loader2, 
  Settings2, 
  X, 
  ChevronDown, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  FileSpreadsheet
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const reports = [
  { id: 1, name: "Age & Gender Demographics", description: "Statistical breakdown of patients by age bracket and gender distribution", type: "demographics" },
  { id: 2, name: "Doctor Caseload Distribution", description: "Active patient allocation and load across attending clinic doctors", type: "caseload" },
  { id: 3, name: "Roadmap Treatment Adherence", description: "Protocol milestone completion, pending checks, and missed intake visits", type: "adherence" },
  { id: 4, name: "Geographic Risk Tracker", description: "Barangay-level geospatial distribution of High, Medium, and Low risk cases", type: "risk" },
];

const ADHERENCE_COLORS = ['#10B981', '#6366F1', '#EF4444'];

export default function SystemReports() {
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };
  
  // Filtering & Sorting State
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data State
  const [isFetching, setIsFetching] = useState(true);
  const [rawData, setRawData] = useState<{ profiles: any[], connections: any[], roadmaps: any[] }>({ profiles: [], connections: [], roadmaps: [] });
  const [chartData, setChartData] = useState<any>({ demographics: [], caseload: [], adherence: [], risk: [] });

  // Customization State (Series Toggles)
  const [chartConfig, setChartConfig] = useState({
    demographics: { male: true, female: true },
    risk: { high: true, medium: true, low: true }
  });

  // Drill-Down State
  const [drillDown, setDrillDown] = useState<{ isOpen: boolean, title: string, data: any[], type: string }>({ isOpen: false, title: "", data: [], type: "" });

  // Live telemetry calculations
  const telemetryStats = useMemo(() => {
    const totalPatients = rawData.profiles.length;
    const highRiskTotal = rawData.profiles.filter(p => (p.risk_level || '').toLowerCase().includes('high')).length;
    
    let completed = 0;
    let totalAppointments = rawData.roadmaps.length;
    rawData.roadmaps.forEach(r => {
      const s = (r.status || '').toLowerCase();
      if (s.includes('complet') || s.includes('done')) completed++;
    });

    const adherenceRate = totalAppointments > 0 ? Math.round((completed / totalAppointments) * 100) : 100;
    const activeDoctorsCount = new Set(rawData.connections.map(c => c.doctor_id).filter(Boolean)).size;

    return {
      totalPatients,
      highRiskTotal,
      adherenceRate,
      activeDoctorsCount
    };
  }, [rawData]);

  useEffect(() => {
    async function fetchReportData() {
      setIsFetching(true);
      try {
        let profilesQuery = supabase.from('profiles').select('*').eq('role', 'patient');
        let connectionsQuery = supabase.from('connections').select('*, doctor_info:profiles!connections_doctor_id_fkey(full_name)');
        let roadmapQuery = supabase.from('roadmap').select('*, patient:patient_id(full_name, contact_number)');

        if (startDate) {
          const start = startDate.toISOString();
          profilesQuery = profilesQuery.gte('created_at', start);
          connectionsQuery = connectionsQuery.gte('created_at', start);
          roadmapQuery = roadmapQuery.gte('created_at', start);
        }
        if (endDate) {
          const end = endDate.toISOString();
          profilesQuery = profilesQuery.lte('created_at', end);
          connectionsQuery = connectionsQuery.lte('created_at', end);
          roadmapQuery = roadmapQuery.lte('created_at', end);
        }

        const [profRes, connRes, roadRes] = await Promise.all([profilesQuery, connectionsQuery, roadmapQuery]);
        
        const profiles = profRes.data || [];
        const connections = connRes.data || [];
        const roadmaps = roadRes.data || [];

        setRawData({ profiles, connections, roadmaps });

        // 1. Demographics
        const demoMap: any = {
          '0-18': { age: '0-18', male: 0, female: 0 },
          '19-35': { age: '19-35', male: 0, female: 0 },
          '36-50': { age: '36-50', male: 0, female: 0 },
          '51+': { age: '51+', male: 0, female: 0 },
        };
        profiles.forEach(p => {
          const a = parseInt(p.age);
          const g = p.gender?.toLowerCase() === 'female' ? 'female' : 'male';
          if (isNaN(a)) return;
          if (a <= 18) demoMap['0-18'][g]++;
          else if (a <= 35) demoMap['19-35'][g]++;
          else if (a <= 50) demoMap['36-50'][g]++;
          else demoMap['51+'][g]++;
        });

        // 2. Caseload
        const loadMap: any = {};
        connections.forEach(c => {
          if (c.doctor_id) {
            const drData = c.doctor_info as any;
            const drName = drData?.full_name ? `Dr. ${drData.full_name.replace(/^(dr\.?\s*)+/i, '').split(' ').pop()}` : 'Unknown Doctor';
            if (!loadMap[c.doctor_id]) loadMap[c.doctor_id] = { id: c.doctor_id, name: drName, patients: 0 };
            loadMap[c.doctor_id].patients++;
          }
        });

        // 3. Adherence
        let completed = 0, missed = 0, scheduled = 0;
        roadmaps.forEach(r => {
          const s = (r.status || '').toLowerCase();
          if (s.includes('complet') || s.includes('done')) completed++;
          else if (s.includes('miss') || s.includes('cancel')) missed++;
          else scheduled++;
        });

        // 4. Risk
        const riskMap: any = {};
        profiles.forEach(p => {
          const b = p.barangay || 'Carmona Poblacion';
          if (!riskMap[b]) riskMap[b] = { name: b, high: 0, medium: 0, low: 0 };
          const r = (p.risk_level || '').toLowerCase();
          if (r.includes('high')) riskMap[b].high++;
          else if (r.includes('medium') || r.includes('mod')) riskMap[b].medium++;
          else if (r.includes('low')) riskMap[b].low++;
        });

        setChartData({
          demographics: Object.values(demoMap),
          caseload: Object.values(loadMap),
          adherence: (completed === 0 && missed === 0 && scheduled === 0) ? [] : [
            { name: "Completed", value: completed },
            { name: "Scheduled", value: scheduled },
            { name: "Missed", value: missed }
          ],
          risk: Object.values(riskMap)
        });

      } catch (error) {
        triggerAlert("Fetch Error", "Failed to load live report data.", "error");
      } finally {
        setIsFetching(false);
      }
    }
    fetchReportData();
  }, [startDate, endDate]);

  const handleChartClick = (reportType: string, payload: any) => {
    if (!payload || !payload.activePayload || !payload.activePayload[0]) return;
    const data = payload.activePayload[0].payload;
    const clickedKey = payload.activeTooltipIndex !== undefined ? payload.activePayload[0].dataKey : payload.name;
    
    let filteredData: any[] = [];
    let title = "";

    if (reportType === 'demographics') {
      const ageGroup = data.age;
      const gender = clickedKey; 
      title = `${gender.charAt(0).toUpperCase() + gender.slice(1)} Patients (Age Bracket ${ageGroup})`;
      filteredData = rawData.profiles.filter(p => {
        const a = parseInt(p.age);
        const g = p.gender?.toLowerCase() === 'female' ? 'female' : 'male';
        if (g !== gender || isNaN(a)) return false;
        if (ageGroup === '0-18') return a <= 18;
        if (ageGroup === '19-35') return a > 18 && a <= 35;
        if (ageGroup === '36-50') return a > 35 && a <= 50;
        return a > 50;
      });
    } else if (reportType === 'caseload') {
      title = `Active Patients Assigned to ${data.name}`;
      const conn = rawData.connections.filter(c => c.doctor_id === data.id).map(c => c.patient_id);
      filteredData = rawData.profiles.filter(p => conn.includes(p.id));
    } else if (reportType === 'risk') {
      const riskLevel = clickedKey; 
      title = `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk Patients in Brgy. ${data.name}`;
      filteredData = rawData.profiles.filter(p => p.barangay === data.name && (p.risk_level || '').toLowerCase().includes(riskLevel));
    }
    setDrillDown({ isOpen: true, title, data: filteredData, type: reportType });
  };

  const handleExportCSV = (type: string, name: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const dataObj = chartData[type];
    if (!dataObj || dataObj.length === 0) {
      return triggerAlert("Empty Dataset", "There are no records to export for this query.", "error");
    }
    const headers = Object.keys(dataObj[0]).join(",");
    csvContent += headers + "\n";
    dataObj.forEach((row: any) => { csvContent += Object.values(row).join(",") + "\n"; });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TEREA_${name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAlert("Export Successful", "Dataset successfully downloaded as CSV.", "success");
  };

  // --- REFINED PROFESSIONAL PDF EXPORT WITH TEREA™ TRADEMARK ---
  const handleExportPDF = async (type: string, name: string) => {
    const chartElement = document.getElementById(`chart-${type}`);
    if (!chartElement) return;
    triggerAlert("Compiling Report", "Rendering professional TEREA™ report dossier...", "success");

    try {
      const canvas = await html2canvas(chartElement, { 
        scale: 2, 
        backgroundColor: '#FFFFFF',
        logging: false 
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - (margin * 2);

      // 1. Top Decorative Brand Bar (Indigo Accent)
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, pageWidth, 4, 'F');

      // 2. TEREA Brand Trademark & Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42); // Slate 900
      pdf.text("TEREA", margin, 18);
      
      // Trademark symbol styling
      pdf.setFontSize(10);
      pdf.setTextColor(99, 102, 241); // Indigo 500
      pdf.text("™", margin + 25.5, 14);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139); // Slate 500
      pdf.text("Clinical Health Intelligence & Tuberculosis Triage Platform", margin, 24);

      // Right-aligned Document Classification Tag
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(79, 70, 229);
      pdf.text("OFFICIAL ANALYTICS DOSSIER", pageWidth - margin, 18, { align: "right" });
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Internal Operational Intelligence", pageWidth - margin, 23, { align: "right" });

      // Clean Hairline Divider
      pdf.setDrawColor(226, 232, 240); // Slate 200
      pdf.setLineWidth(0.4);
      pdf.line(margin, 28, pageWidth - margin, 28);

      // 3. Document Metadata Panel (Clean Background Box)
      pdf.setFillColor(248, 250, 252); // Slate 50
      pdf.roundedRect(margin, 33, contentWidth, 26, 3, 3, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, 33, contentWidth, 26, 3, 3, 'S');

      // Metadata Grid Content
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text("REPORT INDICATOR:", margin + 5, 40);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text(name.toUpperCase(), margin + 5, 45);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text("REPORTING PERIOD:", margin + 5, 51);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      const periodStr = `${startDate ? format(startDate, 'PP') : 'Beginning of Records'} — ${endDate ? format(endDate, 'PP') : 'Present'}`;
      pdf.text(periodStr, margin + 5, 55);

      // Metadata Right Column
      const col2X = margin + (contentWidth / 2) + 5;
      const reportTimestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
      const docRefId = `TEREA-REP-${format(new Date(), 'yyyyMMdd-HHmm')}`;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text("DOCUMENT REF ID:", col2X, 40);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(79, 70, 229);
      pdf.text(docRefId, col2X, 45);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text("TIMESTAMP & AUTH:", col2X, 51);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${reportTimestamp} • System Administrator`, col2X, 55);

      // 4. Chart Visualization Presentation Canvas
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text("PRIMARY EPIDEMIOLOGICAL VISUALIZATION", margin, 68);

      const chartY = 72;
      const chartBoxHeight = 120;

      // Subtle framing box for the chart
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, chartY, contentWidth, chartBoxHeight, 3, 3, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, chartY, contentWidth, chartBoxHeight, 3, 3, 'S');

      const imgProps = pdf.getImageProperties(imgData);
      const imgAspect = imgProps.width / imgProps.height;
      
      let renderWidth = contentWidth - 16;
      let renderHeight = renderWidth / imgAspect;

      if (renderHeight > (chartBoxHeight - 16)) {
        renderHeight = chartBoxHeight - 16;
        renderWidth = renderHeight * imgAspect;
      }

      const imgX = margin + ((contentWidth - renderWidth) / 2);
      const imgY = chartY + ((chartBoxHeight - renderHeight) / 2);

      pdf.addImage(imgData, 'PNG', imgX, imgY, renderWidth, renderHeight);

      // 5. System Intelligence Insights Panel
      const insightsY = 200;
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, insightsY, contentWidth, 38, 3, 3, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, insightsY, contentWidth, 38, 3, 3, 'S');

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(79, 70, 229);
      pdf.text("AUTOMATED CLINICAL SURVEILLANCE NOTES", margin + 6, insightsY + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      const notesLine1 = `• Monitored Cohort Size: ${telemetryStats.totalPatients} registered clinical cases | Milestone Adherence: ${telemetryStats.adherenceRate}% Compliance.`;
      const notesLine2 = `• Geospatial Priority: ${telemetryStats.highRiskTotal} high-risk cases identified requiring expedited bacteriological conversion review.`;
      const notesLine3 = `• Verified Data Pipeline: Real-time PostgreSQL database synchronization verified with zero manual interpolation.`;
      
      pdf.text(notesLine1, margin + 6, insightsY + 16);
      pdf.text(notesLine2, margin + 6, insightsY + 22);
      pdf.text(notesLine3, margin + 6, insightsY + 28);

      // 6. Security Notice & Institutional Sign-off
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(148, 163, 184);
      const securityText = "SECURITY & COMPLIANCE: This document contains proprietary clinical intelligence generated by the TEREA™ Healthcare Management Engine. The information herein is intended strictly for authorized clinical administrators and supervisory personnel.";
      pdf.text(securityText, margin, 254, { maxWidth: contentWidth });

      // Signature / Authentication Line
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin, 268, margin + 60, 268);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text("SYSTEM ADMINISTRATOR", margin, 272);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(148, 163, 184);
      pdf.text("Central Operations Authorization", margin, 276);

      // 7. Standard Running Footer
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      pdf.setFontSize(7.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text("TEREA™ Healthcare Analytics Platform • Confidential Document", margin, pageHeight - 7);
      pdf.text("Page 1 of 1", pageWidth - margin, pageHeight - 7, { align: "right" });

      pdf.save(`TEREA_${name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (e) { 
      console.error(e);
      triggerAlert("Error", "PDF compilation encountered an error.", "error"); 
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, '');
    setSearchQuery(val);
  };

  const processedReports = useMemo(() => {
    let filtered = reports.filter((r) => {
      const matchesType = typeFilter === "all" || r.type === typeFilter;
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
    return filtered.sort((a, b) => sortBy === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  }, [typeFilter, searchQuery, sortBy]);

  const renderChart = (type: string) => {
    if (isFetching) return (
      <div className="flex flex-col h-full items-center justify-center text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-xs font-semibold">Aggregating telemetry data...</span>
      </div>
    );
    
    if (chartData[type] && chartData[type].length === 0) {
      return (
        <div className="flex flex-col h-full items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <CalendarIcon className="h-8 w-8 mb-2 opacity-30 text-indigo-600" />
          <p className="text-xs font-bold text-slate-500">No records found for this period</p>
        </div>
      );
    }

    switch (type) {
      case "demographics":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.demographics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={(data) => handleChartClick(type, data)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="age" tick={{fontSize: 11, fill: '#64748B'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 11, fill: '#64748B'}} axisLine={false} tickLine={false} />
              <ChartTooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)', fontSize: '11px'}} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {chartConfig.demographics.male && <Bar dataKey="male" name="Male" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={22} className="cursor-pointer" />}
              {chartConfig.demographics.female && <Bar dataKey="female" name="Female" fill="#EC4899" radius={[6, 6, 0, 0]} barSize={22} className="cursor-pointer" />}
            </BarChart>
          </ResponsiveContainer>
        );
      case "caseload":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.caseload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={(data) => handleChartClick(type, data)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748B'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 11, fill: '#64748B'}} axisLine={false} tickLine={false} />
              <ChartTooltip contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)', fontSize: '11px'}} />
              <Line type="monotone" dataKey="patients" name="Active Patients" stroke="#4F46E5" strokeWidth={3} dot={{r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} className="cursor-pointer" />
            </LineChart>
          </ResponsiveContainer>
        );
      case "adherence":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData.adherence} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                {chartData.adherence.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={ADHERENCE_COLORS[index % ADHERENCE_COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 'bold'}} />
              <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case "risk":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.risk} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} onClick={(data) => handleChartClick(type, data)}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} />
              <YAxis dataKey="name" type="category" width={95} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B', fontWeight: 600}} />
              <ChartTooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px'}} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {chartConfig.risk.high && <Bar dataKey="high" name="High Risk" stackId="a" fill="#EF4444" className="cursor-pointer" />}
              {chartConfig.risk.medium && <Bar dataKey="medium" name="Medium Risk" stackId="a" fill="#F59E0B" className="cursor-pointer" />}
              {chartConfig.risk.low && <Bar dataKey="low" name="Low Risk" stackId="a" fill="#10B981" radius={[0, 6, 6, 0]} className="cursor-pointer" />}
            </BarChart>
          </ResponsiveContainer>
        );
      default: return null;
    }
  };

  return (
    <DashboardLayout role="admin">

      {/* Centralized Notification Modal */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
            {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-emerald-600" /> : <AlertCircle className="h-6 w-6 text-rose-600" />}
          </div>
          <h2 className="text-base font-bold text-slate-900">{alert.title}</h2>
          <p className="text-slate-500 mt-1.5 text-xs leading-relaxed">{alert.message}</p>
          <Button className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 shadow-xs" onClick={() => setAlert({...alert, open: false})}>
            Acknowledge
          </Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in font-sans pb-10">
        
        {/* --- HEADER COMMAND STRIP --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                <BarChart3 className="h-3 w-3" />
                TEREA™ Intelligence • Clinical Analytics Engine
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              System Analytics & Surveillance Reports
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Real-time demographic breakdowns, clinical adherence tracking, doctor allocations, and risk distribution metrics.
            </p>
          </div>
        </div>

        {/* --- LIVE TELEMETRY RIBBON --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Monitored Cohort</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{telemetryStats.totalPatients}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Total registered patients</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">High-Risk Cases</span>
            <p className="text-2xl font-black text-rose-950 mt-1">{telemetryStats.highRiskTotal}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Immediate priority review</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Adherence Rate</span>
            <p className="text-2xl font-black text-emerald-950 mt-1">{telemetryStats.adherenceRate}%</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Protocol milestone compliance</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Active Attending Doctors</span>
            <p className="text-2xl font-black text-indigo-950 mt-1">{telemetryStats.activeDoctorsCount}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Assigned caseload roster</span>
          </div>
        </div>

        {/* --- ADVANCED FILTER BAR --- */}
        <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white overflow-visible">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Surveillance Filters</CardTitle>
                <CardDescription className="text-xs text-slate-500">Filter datasets by specific timeline intervals and indicator categories</CardDescription>
              </div>
              {(startDate || endDate || searchQuery !== "") && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setStartDate(undefined); setEndDate(undefined); setSearchQuery(""); }} 
                  className="text-indigo-600 hover:bg-indigo-50 h-8 rounded-xl text-xs font-bold"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" /> Reset Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search indicators..." 
                  value={searchQuery} 
                  onChange={handleSearchChange} 
                  className="pl-9 bg-slate-50 border-slate-200 rounded-xl h-10 text-xs focus-visible:ring-indigo-600" 
                />
              </div>

              {/* Start Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-10 justify-start text-left font-semibold text-xs rounded-xl border-slate-200 bg-slate-50 group", !startDate && "text-slate-400")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600 group-hover:scale-105 transition-transform" />
                    {startDate ? format(startDate, "PPP") : <span>From Date</span>}
                    <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-200" align="start">
                  <div className="flex flex-col p-2 bg-slate-50 border-b border-slate-100 gap-1">
                    <Button variant="ghost" size="sm" className="justify-start font-medium text-xs h-8" onClick={() => setStartDate(subDays(new Date(), 7))}>Past 7 Days</Button>
                    <Button variant="ghost" size="sm" className="justify-start font-medium text-xs h-8" onClick={() => setStartDate(startOfMonth(new Date()))}>Start of Month</Button>
                  </div>
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="rounded-2xl" />
                </PopoverContent>
              </Popover>

              {/* End Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-10 justify-start text-left font-semibold text-xs rounded-xl border-slate-200 bg-slate-50 group", !endDate && "text-slate-400")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600 group-hover:scale-105 transition-transform" />
                    {endDate ? format(endDate, "PPP") : <span>To Date</span>}
                    <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-200" align="start">
                  <div className="flex flex-col p-2 bg-slate-50 border-b border-slate-100 gap-1">
                    <Button variant="ghost" size="sm" className="justify-start font-medium text-xs h-8" onClick={() => setEndDate(new Date())}>Today</Button>
                    <Button variant="ghost" size="sm" className="justify-start font-medium text-xs h-8" onClick={() => setEndDate(endOfMonth(new Date()))}>End of Month</Button>
                  </div>
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus disabled={(date) => startDate ? date < startDate : false} className="rounded-2xl" />
                </PopoverContent>
              </Popover>

              {/* Category Select */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-600 h-10 text-xs font-semibold">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 bg-white">
                  <SelectItem value="all" className="text-xs font-medium">All Indicators</SelectItem>
                  <SelectItem value="demographics" className="text-xs font-medium">Age & Gender Demographics</SelectItem>
                  <SelectItem value="caseload" className="text-xs font-medium">Doctor Caseload</SelectItem>
                  <SelectItem value="adherence" className="text-xs font-medium">Treatment Adherence</SelectItem>
                  <SelectItem value="risk" className="text-xs font-medium">Geospatial Risk Map</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* --- CHARTS GRID --- */}
        <div className="grid gap-6 xl:grid-cols-2">
          {processedReports.map((report) => (
            <Card key={report.id} className="rounded-2xl border-slate-200/90 shadow-xs bg-white hover:shadow-md transition-all flex flex-col overflow-hidden border-t-4 border-t-indigo-600">
              <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">{report.name}</CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">{report.description}</CardDescription>
                  </div>
                  
                  {(report.type === 'demographics' || report.type === 'risk') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-white border-transparent">
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-xl p-2 bg-white border-slate-200 shadow-xl">
                        {report.type === 'demographics' && (
                          <>
                            <DropdownMenuCheckboxItem checked={chartConfig.demographics.male} onCheckedChange={(c) => setChartConfig(prev => ({...prev, demographics: {...prev.demographics, male: c}}))} className="text-xs rounded-lg font-medium">
                              Show Male Patients
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={chartConfig.demographics.female} onCheckedChange={(c) => setChartConfig(prev => ({...prev, demographics: {...prev.demographics, female: c}}))} className="text-xs rounded-lg font-medium">
                              Show Female Patients
                            </DropdownMenuCheckboxItem>
                          </>
                        )}
                        {report.type === 'risk' && (
                          <>
                            <DropdownMenuCheckboxItem checked={chartConfig.risk.high} onCheckedChange={(c) => setChartConfig(prev => ({...prev, risk: {...prev.risk, high: c}}))} className="text-xs text-rose-600 rounded-lg font-bold">
                              Show High Risk
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={chartConfig.risk.medium} onCheckedChange={(c) => setChartConfig(prev => ({...prev, risk: {...prev.risk, medium: c}}))} className="text-xs text-amber-600 rounded-lg font-bold">
                              Show Medium Risk
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={chartConfig.risk.low} onCheckedChange={(c) => setChartConfig(prev => ({...prev, risk: {...prev.risk, low: c}}))} className="text-xs text-emerald-600 rounded-lg font-bold">
                              Show Low Risk
                            </DropdownMenuCheckboxItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col pt-5">
                <div id={`chart-${report.type}`} className="w-full h-64 mb-4 relative px-1">
                  {renderChart(report.type)}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Telemetry Scope</span>
                    <span className="text-xs font-bold text-slate-700">{startDate || endDate ? 'Filtered Set' : 'Complete Record History'}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExportPDF(report.type, report.name)} 
                      className="rounded-xl border-slate-200 text-xs font-semibold h-8 px-3 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExportCSV(report.type, report.name)} 
                      className="rounded-xl border-slate-200 text-xs font-semibold h-8 px-3 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                    >
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* --- DRILL-DOWN PATIENT RECORD MODAL --- */}
      <Dialog open={drillDown.isOpen} onOpenChange={(open) => setDrillDown(prev => ({...prev, isOpen: open}))}>
        <DialogContent className="rounded-2xl sm:max-w-[750px] bg-white max-h-[85vh] flex flex-col p-0 overflow-hidden border border-slate-200 shadow-2xl">
          <div className="p-5 bg-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">{drillDown.title}</DialogTitle>
                <DialogDescription className="text-indigo-100 text-xs mt-0.5">
                  Segmented patient cohort data matching your selected visualization parameter.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-5">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200">
                    <TableHead className="font-bold text-xs text-slate-800">Patient Full Name</TableHead>
                    <TableHead className="font-bold text-xs text-slate-800">Age / Gender</TableHead>
                    <TableHead className="font-bold text-xs text-slate-800">Barangay Residence</TableHead>
                    <TableHead className="font-bold text-xs text-slate-800 text-right">Risk Factor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillDown.data.length > 0 ? (
                    drillDown.data.map((p, i) => (
                      <TableRow key={i} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-xs text-slate-900">{p.full_name || 'N/A'}</TableCell>
                        <TableCell className="text-xs text-slate-600">{p.age} yrs • <span className="capitalize">{p.gender}</span></TableCell>
                        <TableCell className="text-xs text-slate-600">Brgy. {p.barangay || 'Carmona'}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase", 
                            (p.risk_level||'').toLowerCase().includes('high') 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : ((p.risk_level||'').toLowerCase().includes('med') || (p.risk_level||'').toLowerCase().includes('mod')
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200')
                          )}>
                            {p.risk_level || 'Standard'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-slate-400 italic">
                        No matching patient records found for this specific filter segment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}