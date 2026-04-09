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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Search, Filter, AlertCircle, AlertTriangle, Info, 
  Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Trash2, 
  MoreHorizontal, Terminal, ZapOff, CheckCircle2, RefreshCw, Radio
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ErrorLogs() {
  const { toast } = useToast();
  
  // Data State
  const [logs, setLogs] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filtering & Pagination State
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const itemsPerPage = 10;

  // Selection & Modal State
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // --- Persistent Realtime Subscription ---
  useEffect(() => {
    fetchLogs();

    // Monitoring is active as always
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'error_logs' },
        () => {
          fetchLogs(); 
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchLogs() {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsFetching(false);
    }
  }

  // --- Actions ---
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      
      toast({ title: "Status Updated", description: `Incident marked as ${newStatus}.` });
      fetchLogs(); 
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('error_logs').delete().in('id', Array.from(selectedLogIds));
      if (error) throw error;
      setSelectedLogIds(new Set());
      setBulkDeleteDialogOpen(false);
      toast({ title: "History Cleared", description: "Selected logs have been permanently removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  // --- Processing Logic ---
  const processedLogs = useMemo(() => {
    let filtered = logs.filter((log) => {
      const matchesSearch = 
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.source.toLowerCase().includes(search.toLowerCase());
      const matchesLevel = levelFilter === "all" || log.level === levelFilter;
      const matchesStatus = statusFilter === "all" || log.status === statusFilter;
      return matchesSearch && matchesLevel && matchesStatus;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";
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
  }, [logs, search, levelFilter, statusFilter, sortConfig]);

  const totalPages = Math.ceil(processedLogs.length / itemsPerPage);
  const paginatedLogs = processedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => ({
    errors: logs.filter(l => l.level === 'error' && l.status !== 'resolved').length,
    warnings: logs.filter(l => l.level === 'warning' && l.status !== 'resolved').length,
    open: logs.filter(l => l.status === 'open' || !l.status).length
  }), [logs]);

  // --- Selection Logic ---
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedLogIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedLogIds(newSelection);
  };

  const toggleAll = () => {
    if (selectedLogIds.size === paginatedLogs.length && paginatedLogs.length > 0) setSelectedLogIds(new Set());
    else setSelectedLogIds(new Set(paginatedLogs.map(l => l.id)));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case 'in_progress': return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
    <TableHead 
      className="font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === sortKey && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key: sortKey, direction });
      }}
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
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Error Logs</h1>
            <p className="text-sm text-slate-500 font-medium">Diagnostic monitoring for system stability</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-[#606C38] bg-slate-50 rounded-xl border border-slate-100">
               <Radio className="h-3 w-3 animate-pulse" /> LIVE MONITORING ACTIVE
            </div>
            {selectedLogIds.size > 0 && (
              <Button variant="destructive" size="sm" className="rounded-xl h-9" onClick={() => setBulkDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Clear Selected
              </Button>
            )}
          </div>
        </div>

        {/* Diagnostic Stats (White UI) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-slate-200 shadow-sm bg-white border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Critical Errors</p><h3 className="text-3xl font-black text-slate-900">{stats.errors}</h3></div>
                <AlertCircle className="h-10 w-10 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm bg-white border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Warnings</p><h3 className="text-3xl font-black text-slate-900">{stats.warnings}</h3></div>
                <AlertTriangle className="h-10 w-10 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm bg-white border-l-4 border-l-[#606C38]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Open Incidents</p><h3 className="text-3xl font-black text-slate-900">{stats.open}</h3></div>
                <RefreshCw className="h-10 w-10 text-[#606C38] opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search messages or services..." className="pl-9 rounded-xl border-slate-100 bg-slate-50/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full md:w-[160px] rounded-xl border-slate-100 bg-slate-50/50"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Severities</SelectItem><SelectItem value="error">Error</SelectItem><SelectItem value="warning">Warning</SelectItem></SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[160px] rounded-xl border-slate-100 bg-slate-50/50"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent>
          </Select>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-12 text-center">
                   <Checkbox 
                    checked={paginatedLogs.length > 0 && selectedLogIds.size === paginatedLogs.length} 
                    onCheckedChange={toggleAll}
                    className="data-[state=checked]:bg-[#606C38] border-slate-300"
                  />
                </TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <SortableHeader label="Error Message" sortKey="message" />
                <SortableHeader label="Source" sortKey="source" />
                <SortableHeader label="Count" sortKey="count" />
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                <TableRow><TableCell colSpan={6} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-[#606C38]" /></TableCell></TableRow>
              ) : paginatedLogs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-20 text-center text-slate-500 italic">No incidents recorded.</TableCell></TableRow>
              ) : paginatedLogs.map((log) => (
                <TableRow key={log.id} className={`${selectedLogIds.has(log.id) ? 'bg-slate-50' : ''}`}>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={selectedLogIds.has(log.id)} 
                      onCheckedChange={() => toggleSelection(log.id)} 
                      className="data-[state=checked]:bg-[#606C38] border-slate-300"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(log.status)}`}>
                      {log.status || 'open'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 line-clamp-1">{log.message}</span>
                      <span className="text-[10px] text-slate-400 font-mono italic">{format(new Date(log.created_at), 'MMM dd • HH:mm:ss')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 font-medium italic">{log.source}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-full">{log.count || 1}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl shadow-xl w-48 border-slate-200">
                        <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-widest">Workflow</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => updateStatus(log.id, 'in_progress')} className="cursor-pointer font-medium text-blue-600"><RefreshCw className="mr-2 h-4 w-4" /> Move to Progress</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(log.id, 'resolved')} className="cursor-pointer font-medium text-emerald-600"><CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Resolved</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSelectedLog(log)} className="cursor-pointer font-medium"><Terminal className="mr-2 h-4 w-4" /> Diagnostic Details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {!isFetching && processedLogs.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
              <p className="text-xs text-slate-500">Page {currentPage} of {totalPages || 1}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-lg"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0 rounded-lg"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="rounded-3xl sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-white font-sans">
          <div className={`p-6 text-white ${selectedLog?.level === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
               <Terminal className="h-5 w-5" /> Diagnostic Trace
            </DialogTitle>
            <DialogDescription className="text-white/80">Source: {selectedLog?.source}</DialogDescription>
          </div>
          <div className="p-6 space-y-4">
             <div className="bg-slate-900 rounded-2xl p-5 shadow-inner overflow-hidden">
                <pre className="text-[11px] text-red-400 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedLog?.stack_trace || selectedLog?.message}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 rounded-2xl bg-slate-100 text-slate-900 hover:bg-slate-200" onClick={() => setSelectedLog(null)}>Close</Button>
                <Button className="flex-1 rounded-2xl bg-[#606C38] text-white hover:bg-[#4a542b]" onClick={() => { updateStatus(selectedLog.id, 'resolved'); setSelectedLog(null); }}>Resolve Incident</Button>
              </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[400px] bg-white border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-red-600 font-bold">Clear Incident History</DialogTitle></DialogHeader>
          <div className="py-2 text-sm text-slate-500 font-medium">Permanently clear <strong>{selectedLogIds.size}</strong> recorded system errors from the database?</div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setBulkDeleteDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" className="rounded-xl shadow-md" onClick={handleBulkDelete} disabled={isSubmitting}>Confirm Clear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}

function cn(...classes: any[]) { return classes.filter(Boolean).join(' '); }