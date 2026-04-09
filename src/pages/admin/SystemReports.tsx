import { useState, useMemo, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Calendar as CalendarIcon, Search, ArrowUpDown, Loader2, Settings2, X, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const reports = [
  { id: 1, name: "Age & Gender Demographics", description: "Statistical breakdown of patients by age groups and gender", type: "demographics" },
  { id: 2, name: "Doctor Caseload Distribution", description: "Active patient allocation and load across clinic doctors", type: "caseload" },
  { id: 3, name: "Roadmap Adherence Rate", description: "Patient compliance, missed appointments, and treatment progress", type: "adherence" },
  { id: 4, name: "Risk Tracker", description: "Geographic distribution of High, Medium, and Low risk cases", type: "risk" },
];

const COLORS = ['#606C38', '#DDA15E', '#BC6C25', '#283618', '#ef4444', '#f59e0b', '#10b981'];

export default function SystemReports() {
  const { toast } = useToast();
  
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

  // Customization State (Toggles)
  const [chartConfig, setChartConfig] = useState({
    demographics: { male: true, female: true },
    risk: { high: true, medium: true, low: true }
  });

  // Drill-Down State
  const [drillDown, setDrillDown] = useState<{ isOpen: boolean, title: string, data: any[], type: string }>({ isOpen: false, title: "", data: [], type: "" });

  // Fetch live data based on Date Range
  useEffect(() => {
    async function fetchReportData() {
      setIsFetching(true);
      try {
        let profilesQuery = supabase.from('profiles').select('*').eq('role', 'patient');
        // Note: connections joined with profiles using the specific FK from your ERD
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

        // 1. Process Demographics
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

        // 2. Process Caseload
        const loadMap: any = {};
        connections.forEach(c => {
          if (c.doctor_id) {
            const drData = c.doctor_info as any;
            const drName = drData?.full_name ? `Dr. ${drData.full_name.split(' ').pop()}` : 'Unknown Doctor';
            if (!loadMap[c.doctor_id]) loadMap[c.doctor_id] = { id: c.doctor_id, name: drName, patients: 0 };
            loadMap[c.doctor_id].patients++;
          }
        });

        // 3. Process Adherence
        let completed = 0, missed = 0, scheduled = 0;
        roadmaps.forEach(r => {
          const s = (r.status || '').toLowerCase();
          if (s.includes('complet') || s.includes('done')) completed++;
          else if (s.includes('miss') || s.includes('cancel')) missed++;
          else scheduled++;
        });

        // 4. Process Risk
        const riskMap: any = {};
        profiles.forEach(p => {
          const b = p.barangay || 'Unknown';
          if (!riskMap[b]) riskMap[b] = { name: b, high: 0, medium: 0, low: 0 };
          const r = (p.risk_level || '').toLowerCase();
          if (r.includes('high')) riskMap[b].high++;
          else if (r.includes('medium')) riskMap[b].medium++;
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
        toast({ title: "Fetch Error", description: "Failed to load live report data.", variant: "destructive" });
      } finally {
        setIsFetching(false);
      }
    }
    fetchReportData();
  }, [startDate, endDate, toast]);

  const handleChartClick = (reportType: string, payload: any) => {
    if (!payload || !payload.activePayload || !payload.activePayload[0]) return;
    const data = payload.activePayload[0].payload;
    const clickedKey = payload.activeTooltipIndex !== undefined ? payload.activePayload[0].dataKey : payload.name;
    
    let filteredData: any[] = [];
    let title = "";

    if (reportType === 'demographics') {
      const ageGroup = data.age;
      const gender = clickedKey; 
      title = `${gender.charAt(0).toUpperCase() + gender.slice(1)} Patients (Age ${ageGroup})`;
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
      title = `Patients assigned to ${data.name}`;
      const conn = rawData.connections.filter(c => c.doctor_id === data.id).map(c => c.patient_id);
      filteredData = rawData.profiles.filter(p => conn.includes(p.id));
    } else if (reportType === 'risk') {
      const riskLevel = clickedKey; 
      title = `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk Patients in ${data.name}`;
      filteredData = rawData.profiles.filter(p => p.barangay === data.name && (p.risk_level || '').toLowerCase().includes(riskLevel));
    }
    setDrillDown({ isOpen: true, title, data: filteredData, type: reportType });
  };

  const handleExportCSV = (type: string, name: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const dataObj = chartData[type];
    if (!dataObj || dataObj.length === 0) return toast({ title: "Empty", description: "No data to export.", variant: "destructive" });
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
    toast({ title: "Export Successful", description: "CSV downloaded." });
  };

  const handleExportPDF = async (type: string, name: string) => {
    const chartElement = document.getElementById(`chart-${type}`);
    if (!chartElement) return;
    toast({ title: "Generating PDF", description: "Rendering document..." });
    try {
      const canvas = await html2canvas(chartElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFontSize(16);
      pdf.text("TEREA AI: Risk Assessment System", 105, 20, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(`Official Report: ${name}`, 20, 40);
      pdf.text(`Period: ${startDate ? format(startDate, 'PP') : 'All'} - ${endDate ? format(endDate, 'PP') : 'All'}`, 20, 46);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 40;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 20, 60, pdfWidth, pdfHeight);
      pdf.save(`TEREA_${name}.pdf`);
    } catch (e) { toast({ title: "Error", description: "PDF generation failed." }); }
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
    if (isFetching) return <div className="flex flex-col h-full items-center justify-center text-slate-400 gap-3"><Loader2 className="h-8 w-8 animate-spin text-[#606C38]" /><span>Loading live analytics...</span></div>;
    
    // Check if data is empty for the charts that were missing
    if (chartData[type] && chartData[type].length === 0) {
      return (
        <div className="flex flex-col h-full items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
          <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
          <p className="text-sm font-medium">No records found for this period</p>
        </div>
      );
    }

    switch (type) {
      case "demographics":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.demographics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={(data) => handleChartClick(type, data)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="age" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <ChartTooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Legend iconType="circle" />
              {chartConfig.demographics.male && <Bar dataKey="male" name="Male" fill="#606C38" radius={[6, 6, 0, 0]} barSize={20} className="cursor-pointer" />}
              {chartConfig.demographics.female && <Bar dataKey="female" name="Female" fill="#DDA15E" radius={[6, 6, 0, 0]} barSize={20} className="cursor-pointer" />}
            </BarChart>
          </ResponsiveContainer>
        );
      case "caseload":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.caseload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={(data) => handleChartClick(type, data)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <ChartTooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
              <Line type="monotone" dataKey="patients" name="Active Patients" stroke="#606C38" strokeWidth={3} dot={{r: 4, fill: '#606C38', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} className="cursor-pointer" />
            </LineChart>
          </ResponsiveContainer>
        );
      case "adherence":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData.adherence} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {chartData.adherence.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <ChartTooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
              <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        );
      case "risk":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.risk} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }} onClick={(data) => handleChartClick(type, data)}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} />
              <ChartTooltip cursor={{fill: '#F8FAFC'}} />
              <Legend iconType="circle" />
              {chartConfig.risk.high && <Bar dataKey="high" name="High Risk" stackId="a" fill="#ef4444" className="cursor-pointer" />}
              {chartConfig.risk.medium && <Bar dataKey="medium" name="Medium Risk" stackId="a" fill="#f59e0b" className="cursor-pointer" />}
              {chartConfig.risk.low && <Bar dataKey="low" name="Low Risk" stackId="a" fill="#10b981" radius={[0, 6, 6, 0]} className="cursor-pointer" />}
            </BarChart>
          </ResponsiveContainer>
        );
      default: return null;
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in font-sans pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Reports</h1>
            <p className="text-sm text-slate-500">Live analytics and clinical data tracking</p>
          </div>
        </div>

        {/* Improved Modern Filters Card */}
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-visible">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Analytics</CardTitle>
                <CardDescription className="text-slate-500">Filter reports by timeframe and category</CardDescription>
              </div>
              {(startDate || endDate || searchQuery !== "") && (
                <Button variant="ghost" size="sm" onClick={() => { setStartDate(undefined); setEndDate(undefined); setSearchQuery(""); }} className="text-[#606C38] hover:bg-[#606C38]/10 h-8 rounded-lg">
                  <X className="h-4 w-4 mr-2" /> Reset Engine
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Modern Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search metrics..." value={searchQuery} onChange={handleSearchChange} className="pl-10 bg-white border-slate-200 rounded-xl h-11 focus-visible:ring-[#606C38]" />
              </div>

              {/* Modern Date Picker: Start */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-11 justify-start text-left font-normal rounded-xl border-slate-200 bg-white group", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#606C38] group-hover:scale-110 transition-transform" />
                    {startDate ? format(startDate, "PPP") : <span>From Date</span>}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-200" align="start">
                  <div className="flex flex-col p-2 bg-slate-50/50 border-b gap-1">
                    <Button variant="ghost" size="sm" className="justify-start font-normal h-8" onClick={() => setStartDate(subDays(new Date(), 7))}>Last 7 Days</Button>
                    <Button variant="ghost" size="sm" className="justify-start font-normal h-8" onClick={() => setStartDate(startOfMonth(new Date()))}>Start of Month</Button>
                  </div>
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="rounded-2xl" />
                </PopoverContent>
              </Popover>

              {/* Modern Date Picker: End */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-11 justify-start text-left font-normal rounded-xl border-slate-200 bg-white group", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#606C38] group-hover:scale-110 transition-transform" />
                    {endDate ? format(endDate, "PPP") : <span>To Date</span>}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-200" align="start">
                   <div className="flex flex-col p-2 bg-slate-50/50 border-b gap-1">
                    <Button variant="ghost" size="sm" className="justify-start font-normal h-8" onClick={() => setEndDate(new Date())}>Today</Button>
                    <Button variant="ghost" size="sm" className="justify-start font-normal h-8" onClick={() => setEndDate(endOfMonth(new Date()))}>End of Month</Button>
                  </div>
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus disabled={(date) => startDate ? date < startDate : false} className="rounded-2xl" />
                </PopoverContent>
              </Popover>

              {/* Category Select */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white focus:ring-[#606C38] h-11">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 bg-white">
                  <SelectItem value="all">All Analytics</SelectItem>
                  <SelectItem value="demographics">Demographics</SelectItem>
                  <SelectItem value="caseload">Caseload</SelectItem>
                  <SelectItem value="adherence">Adherence</SelectItem>
                  <SelectItem value="risk">Risk Map</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid gap-6 xl:grid-cols-2">
          {processedReports.map((report) => (
            <Card key={report.id} className="rounded-3xl border-slate-200 shadow-sm bg-white hover:shadow-lg transition-all flex flex-col overflow-hidden border-t-4 border-t-[#606C38]">
              <CardHeader className="pb-2 bg-slate-50/30">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">{report.name}</CardTitle>
                    <CardDescription className="text-slate-500 mt-1">{report.description}</CardDescription>
                  </div>
                  {(report.type === 'demographics' || report.type === 'risk') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-[#606C38] rounded-xl hover:bg-white border-transparent">
                          <Settings2 className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-white border-slate-200 shadow-xl">
                        {report.type === 'demographics' && (
                          <>
                            <DropdownMenuCheckboxItem checked={chartConfig.demographics.male} onCheckedChange={(c) => setChartConfig(prev => ({...prev, demographics: {...prev.demographics, male: c}}))} className="rounded-lg">Show Male Data</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={chartConfig.demographics.female} onCheckedChange={(c) => setChartConfig(prev => ({...prev, demographics: {...prev.demographics, female: c}}))} className="rounded-lg">Show Female Data</DropdownMenuCheckboxItem>
                          </>
                        )}
                        {report.type === 'risk' && (
                          <>
                            <DropdownMenuCheckboxItem checked={chartConfig.risk.high} onCheckedChange={(c) => setChartConfig(prev => ({...prev, risk: {...prev.risk, high: c}}))} className="text-red-600 rounded-lg font-semibold">Show High Risk</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={chartConfig.risk.medium} onCheckedChange={(c) => setChartConfig(prev => ({...prev, risk: {...prev.risk, medium: c}}))} className="text-amber-600 rounded-lg font-semibold">Show Medium Risk</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={chartConfig.risk.low} onCheckedChange={(c) => setChartConfig(prev => ({...prev, risk: {...prev.risk, low: c}}))} className="text-emerald-600 rounded-lg font-semibold">Show Low Risk</DropdownMenuCheckboxItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col pt-6">
                <div id={`chart-${report.type}`} className="w-full h-64 mb-6 relative px-2">
                  {renderChart(report.type)}
                </div>

                <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Data Context</span>
                    <span className="text-xs font-semibold text-slate-600">{startDate || endDate ? 'Filtered Set' : 'Complete History'}</span>
                   </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportPDF(report.type, report.name)} className="rounded-xl border-slate-200 px-4 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95">
                      <Download className="mr-2 h-4 w-4" />PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportCSV(report.type, report.name)} className="rounded-xl border-slate-200 px-4 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95">
                      <Download className="mr-2 h-4 w-4" />CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modern Drill-Down Modal */}
      <Dialog open={drillDown.isOpen} onOpenChange={(open) => setDrillDown(prev => ({...prev, isOpen: open}))}>
        <DialogContent className="rounded-3xl sm:max-w-[800px] bg-white max-h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-[#606C38] text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">{drillDown.title}</DialogTitle>
                <DialogDescription className="text-white/80">Segmented patient records based on chart selection.</DialogDescription>
              </div>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-6">
            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-inner">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100">
                    <TableHead className="font-bold text-slate-800">Patient Name</TableHead>
                    <TableHead className="font-bold text-slate-800">Age / Sex</TableHead>
                    <TableHead className="font-bold text-slate-800">Barangay</TableHead>
                    <TableHead className="font-bold text-slate-800 text-right">Risk Factor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillDown.data.length > 0 ? (
                    drillDown.data.map((p, i) => (
                      <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-semibold text-slate-900">{p.full_name || 'N/A'}</TableCell>
                        <TableCell className="text-slate-600">{p.age}y / {p.gender?.charAt(0).toUpperCase()}</TableCell>
                        <TableCell className="text-slate-600">{p.barangay}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase", 
                            (p.risk_level||'').toLowerCase().includes('high') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}>
                            {p.risk_level}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-slate-400 italic">No matching records found for this specific filter.</TableCell>
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