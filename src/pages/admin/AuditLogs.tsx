import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Search, Filter, Eye, Download, History, ShieldAlert, Loader2, 
  ArrowUpDown, ChevronLeft, ChevronRight, Trash2, FileText, FileSpreadsheet, MoreHorizontal 
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";

export default function AuditLogs() {
  const { toast } = useToast();
  
  // Data State
  const [logs, setLogs] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filtering & Pagination State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const itemsPerPage = 10;

  // Selection & Modal State
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      toast({ title: "Fetch Error", description: "Failed to load logs.", variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }

  // --- Processing Logic (Filtering & Sorting) ---
  const processedLogs = useMemo(() => {
    let filtered = logs.filter((log) => {
      const matchesSearch = 
        log.action_name.toLowerCase().includes(search.toLowerCase()) ||
        log.user_name.toLowerCase().includes(search.toLowerCase()) ||
        (log.target_entity || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'created_at') {
          return sortConfig.direction === 'asc' 
            ? new Date(aVal).getTime() - new Date(bVal).getTime()
            : new Date(bVal).getTime() - new Date(aVal).getTime();
        }
        return sortConfig.direction === 'asc' 
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
    return filtered;
  }, [logs, search, categoryFilter, sortConfig]);

  const totalPages = Math.ceil(processedLogs.length / itemsPerPage);
  const paginatedLogs = processedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Selection Logic ---
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedLogIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedLogIds(newSelection);
  };

  const toggleAll = () => {
    if (selectedLogIds.size === paginatedLogs.length) setSelectedLogIds(new Set());
    else setSelectedLogIds(new Set(paginatedLogs.map(l => l.id)));
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // --- Action Logic ---
  const handleDeleteLog = async (id: string) => {
    try {
      const { error } = await supabase.from('audit_logs').delete().eq('id', id);
      if (error) throw error;
      setLogs(logs.filter(l => l.id !== id));
      toast({ title: "Log Entry Deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      const ids = Array.from(selectedLogIds);
      const { error } = await supabase.from('audit_logs').delete().in('id', ids);
      if (error) throw error;
      setLogs(logs.filter(l => !selectedLogIds.has(l.id)));
      setSelectedLogIds(new Set());
      setBulkDeleteDialogOpen(false);
      toast({ title: "Bulk Delete Successful", description: `Removed ${ids.length} log entries.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Export Logic ---
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("TEREA AI: Security Audit Trail", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPP pp')}`, 14, 28);
    
    let yPos = 40;
    processedLogs.slice(0, 50).forEach((log) => { // PDF limits for simplicity
      if (yPos > 280) { doc.addPage(); yPos = 20; }
      doc.text(`${format(new Date(log.created_at), 'MM/dd HH:mm')} | ${log.user_name} | ${log.action_name} | Target: ${log.target_entity || 'N/A'}`, 14, yPos);
      yPos += 7;
    });
    doc.save(`AuditLogs_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    setExportDialogOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Category", "Target", "Severity"];
    const rows = processedLogs.map(l => [
      l.created_at, l.user_name, l.action_name, l.category, l.target_entity || '', l.severity
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TEREA_Audit_Logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    setExportDialogOpen(false);
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'danger': return 'bg-red-50 text-red-700 border-red-200';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
    <TableHead 
      className="font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 text-slate-400" />
      </div>
    </TableHead>
  );

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in font-sans pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security Audit Logs</h1>
            <p className="text-sm text-slate-500">Traceable history of system actions and data access</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedLogIds.size > 0 && (
              <Button variant="destructive" className="rounded-xl" onClick={() => setBulkDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedLogIds.size})
              </Button>
            )}
            <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => setExportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by action, user, or patient..." 
              className="pl-9 bg-slate-50/50 border-slate-200 rounded-xl h-11 focus-visible:ring-[#606C38]" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[220px] rounded-xl border-slate-200 h-11">
              <Filter className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="Patient Access">Patient Access</SelectItem>
              <SelectItem value="User Management">User Management</SelectItem>
              <SelectItem value="Keywords">Keywords</SelectItem>
              <SelectItem value="Reports">Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table Card */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-12 text-center">
                    <Checkbox 
                      checked={paginatedLogs.length > 0 && selectedLogIds.size === paginatedLogs.length} 
                      onCheckedChange={toggleAll}
                      className="data-[state=checked]:bg-[#606C38]"
                    />
                  </TableHead>
                  <SortableHeader label="Action" sortKey="action_name" />
                  <SortableHeader label="Performed By" sortKey="user_name" />
                  <SortableHeader label="Target Entity" sortKey="target_entity" />
                  <SortableHeader label="Timestamp" sortKey="created_at" />
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching ? (
                  <TableRow><TableCell colSpan={6} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-[#606C38]" /></TableCell></TableRow>
                ) : paginatedLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-20 text-center text-slate-500 italic">No logs found matching criteria.</TableCell></TableRow>
                ) : paginatedLogs.map((log) => (
                  <TableRow key={log.id} className={`group border-slate-50 hover:bg-slate-50/50 ${selectedLogIds.has(log.id) ? 'bg-slate-50' : ''}`}>
                    <TableCell className="text-center">
                      <Checkbox 
                        checked={selectedLogIds.has(log.id)} 
                        onCheckedChange={() => toggleSelection(log.id)}
                        className="data-[state=checked]:bg-[#606C38]"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{log.action_name}</span>
                        <Badge variant="outline" className={`w-fit text-[9px] mt-1 uppercase font-bold ${getSeverityStyle(log.severity)}`}>
                          {log.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600">{log.user_name}</TableCell>
                    <TableCell className="text-sm font-semibold text-[#606C38]">{log.target_entity || 'System'}</TableCell>
                    <TableCell className="text-xs text-slate-400 tabular-nums">
                      {format(new Date(log.created_at), 'MMM dd, yyyy • HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-slate-200">
                          <DropdownMenuItem onClick={() => setSelectedLog(log)} className="cursor-pointer font-medium">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteLog(log.id)} className="text-red-600 cursor-pointer font-medium">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Entry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {!isFetching && processedLogs.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/30">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-bold text-slate-700">{Math.min(processedLogs.length, ((currentPage-1)*itemsPerPage)+1)}</span> to <span className="font-bold text-slate-700">{Math.min(processedLogs.length, currentPage*itemsPerPage)}</span> of {processedLogs.length}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg h-9" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg h-9" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- MODALS --- */}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="rounded-3xl sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl font-sans">
          <div className="bg-[#606C38] p-6 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">Audit Trace Details</DialogTitle>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Performer</p><p className="text-sm font-bold">{selectedLog?.user_name}</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Time</p><p className="text-sm font-bold">{selectedLog && format(new Date(selectedLog.created_at), 'PPP pp')}</p></div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Metadata Trace</p>
              <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden">
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(selectedLog?.metadata, null, 2)}
                </pre>
              </div>
            </div>
            <Button className="w-full rounded-2xl bg-slate-900 text-white font-bold" onClick={() => setSelectedLog(null)}>Close Trace</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 font-bold">Confirm Bulk Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedLogIds.size}</strong> entries? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Options Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="font-bold">Export Logs</DialogTitle>
            <DialogDescription>Download current filtered log history.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button variant="outline" className="h-14 rounded-xl justify-start" onClick={handleExportPDF}>
              <FileText className="mr-3 h-5 w-5 text-red-500" /> Standard PDF Report
            </Button>
            <Button variant="outline" className="h-14 rounded-xl justify-start" onClick={handleExportCSV}>
              <FileSpreadsheet className="mr-3 h-5 w-5 text-emerald-600" /> ITIS-Compatible CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}

function cn(...classes: any[]) { return classes.filter(Boolean).join(' '); }  