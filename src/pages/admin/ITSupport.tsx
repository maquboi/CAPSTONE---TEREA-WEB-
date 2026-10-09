import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Headset, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Mail, 
  AlertCircle, 
  KeyRound, 
  Search, 
  Filter, 
  Send, 
  Bug, 
  ShieldAlert, 
  RefreshCw, 
  Check, 
  Undo2,
  ExternalLink
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SupportTicket {
  id: string;
  email: string;
  issue_type: string;
  message: string;
  status: string;
  created_at: string;
}

const translations = {
  en: {
    pageTitle: "IT & Helpdesk Support",
    pageSubtitle: "Live intake of physician bug reports, data sync issues, and credential recovery requests.",
    noTickets: "No Support Tickets Found",
    noTicketsDesc: "Your clinical IT helpdesk queue is completely clear!",
    processing: "Processing...",
    sendResetLink: "Send Reset Link & Resolve",
    markResolved: "Mark as Resolved",
    reopenTicket: "Re-open Ticket",
    resolved: "Resolved",
    pending: "Pending Action",
    all: "All Tickets",
    replyDoctor: "Reply via Email",
    secureAuthTrigger: "Direct Supabase recovery email will be dispatched to this address.",
    resetErrorAlert: "Failed to dispatch recovery email. Verify that this user account exists.",
    resolveErrorAlert: "An error occurred while updating the ticket status."
  },
  fil: {
    pageTitle: "IT at Helpdesk Support",
    pageSubtitle: "Real-time na talaan ng mga ulat ng doktor, problema sa data sync, at pag-reset ng password.",
    noTickets: "Walang Support Tickets",
    noTicketsDesc: "Malinis at walang nakabinbing isyu sa IT Helpdesk!",
    processing: "Pinoproseso...",
    sendResetLink: "Ipadala ang Reset Link at Lutasin",
    markResolved: "Markahan bilang Naresolba",
    reopenTicket: "Buksan Muli ang Ticket",
    resolved: "Naresolba na",
    pending: "Kailangan ng Aksyon",
    all: "Lahat ng Ticket",
    replyDoctor: "Sumagot gamit ang Email",
    secureAuthTrigger: "Direktang ipapadala ang recovery email sa account na ito.",
    resetErrorAlert: "Nabigong ipadala ang reset email. Siguraduhing umiiral ang user sa sistema.",
    resolveErrorAlert: "May naganap na error habang inaayos ang katayuan ng ticket."
  }
};

export default function ITSupport() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations.en) => translations[language as 'en' | 'fil'][key] || translations.en[key];

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState("System Admin");
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Centralized Alert State
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login'); 
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile?.role === 'admin') {
        setIsAdmin(true);
        if (profile.full_name) {
          setAdminName(profile.full_name.replace(/^(dr\.?\s*)+/i, "").trim() || "System Admin");
        }
        await fetchTickets();
      } else {
        navigate('/doctor/dashboard');
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTickets(data);
    } catch (err) {
      console.error("Error fetching support tickets:", err);
    }
  };

  // Realtime Listener for Incoming Doctor & Login Tickets
  useEffect(() => {
    const channel = supabase
      .channel("admin-support-tickets-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter(t => t.status?.toLowerCase() === 'pending').length;
    const resolved = tickets.filter(t => t.status?.toLowerCase() === 'resolved').length;
    const bugs = tickets.filter(t => 
      t.issue_type?.toLowerCase().includes('bug') || 
      t.issue_type?.toLowerCase().includes('sync')
    ).length;

    return { total, pending, resolved, bugs };
  }, [tickets]);

  // Client-side Filtered List
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch = 
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.issue_type.toLowerCase().includes(searchQuery.toLowerCase());

      const isResolved = t.status?.toLowerCase() === 'resolved';
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "resolved" && isResolved) ||
        (statusFilter === "pending" && !isResolved);

      const matchesCategory = 
        categoryFilter === "all" || 
        t.issue_type.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter]);

  const handleResolveTicket = async (ticketId: string, email: string, issueType: string) => {
    try {
      setResolvingId(ticketId);

      // Automated Password Recovery Trigger
      if (issueType.toLowerCase().includes('password')) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (resetError) {
          console.error("Reset Email Error:", resetError);
          triggerAlert("Recovery Error", t("resetErrorAlert"), "error");
          setResolvingId(null);
          return;
        }
      }

      // Update Database Status
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ status: 'Resolved' })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Log into Audit Trail
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        action_name: "Resolved IT Support Ticket",
        user_name: adminName,
        target_entity: email,
        category: "Support",
        severity: "info",
        metadata: { ticketId, issueType }
      });

      // Update Local State
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: 'Resolved' } : ticket
      ));

      triggerAlert("Ticket Resolved", `Ticket #${ticketId.slice(0, 8)} has been marked as resolved.`, "success");
    } catch (err: any) {
      console.error("Error resolving ticket:", err);
      triggerAlert("Error", t("resolveErrorAlert"), "error");
    } finally {
      setResolvingId(null);
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    try {
      setResolvingId(ticketId);
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'Pending' })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: 'Pending' } : ticket
      ));

      triggerAlert("Ticket Re-opened", "Ticket status restored to pending intake queue.", "success");
    } catch (err: any) {
      triggerAlert("Error", "Failed to reopen ticket.", "error");
    } finally {
      setResolvingId(null);
    }
  };

  const getBadgeStyle = (issueType: string) => {
    const lower = issueType.toLowerCase();
    if (lower.includes('bug') || lower.includes('sync')) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (lower.includes('password') || lower.includes('locked')) {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F5F9]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) return null; 

  return (
    <DashboardLayout role="admin" userName={adminName}>
      
      {/* Centralized Notification Modal */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
            {alert.type === 'success' ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <AlertCircle className="h-6 w-6 text-rose-600" />}
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
                <Headset className="h-3 w-3" />
                TEREA™ Central Helpdesk & Issue Registry
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {t("pageTitle")}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {t("pageSubtitle")}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
            className="h-10 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 text-xs font-semibold px-3.5 shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
            Refresh Queue
          </Button>
        </div>

        {/* --- KPI STATS RIBBON --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Pending Action</span>
            <p className="text-2xl font-black text-amber-950 mt-1">{stats.pending}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Requires IT attention</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">System & Data Bugs</span>
            <p className="text-2xl font-black text-rose-950 mt-1">{stats.bugs}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Clinical bug reports</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Resolved Tickets</span>
            <p className="text-2xl font-black text-emerald-950 mt-1">{stats.resolved}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Completed support issues</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Total Inquiries</span>
            <p className="text-2xl font-black text-indigo-950 mt-1">{stats.total}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">All historical requests</span>
          </div>
        </div>

        {/* --- SEARCH & STATUS FILTER TOOLBAR --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search sender email or message text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-xl text-xs focus-visible:ring-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Pills */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t("all")}
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "pending" ? "bg-white text-amber-800 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t("pending")} ({stats.pending})
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "resolved" ? "bg-white text-emerald-800 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t("resolved")}
              </button>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden px-2.5 h-10">
              <Filter className="h-3.5 w-3.5 text-slate-400 mr-2" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="System Bug">System Bug / Sync</option>
                <option value="Password Reset Request">Password Reset</option>
                <option value="Account Locked">Account Locked</option>
                <option value="General IT Support">General Inquiries</option>
              </select>
            </div>
          </div>

        </div>

        {/* --- TICKETS FEED LIST --- */}
        <div className="grid gap-4">
          {filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
              <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-base font-bold text-slate-800">{t("noTickets")}</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{t("noTicketsDesc")}</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isResolved = ticket.status?.toLowerCase() === 'resolved';
              const isPasswordReset = ticket.issue_type?.toLowerCase().includes('password');
              const isBug = ticket.issue_type?.toLowerCase().includes('bug') || ticket.issue_type?.toLowerCase().includes('sync');

              return (
                <div 
                  key={ticket.id} 
                  className={`relative flex flex-col lg:flex-row justify-between gap-5 rounded-2xl border bg-white p-5 shadow-xs transition-all ${
                    isResolved 
                      ? 'border-slate-200/70 bg-slate-50/40 opacity-80' 
                      : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  
                  {/* Left Side: Ticket Content & Metadata */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant="outline" className={`font-bold px-2.5 py-0.5 uppercase text-[10px] tracking-wider border ${getBadgeStyle(ticket.issue_type)}`}>
                        {isBug && <Bug className="h-3 w-3 mr-1 inline" />}
                        {isPasswordReset && <KeyRound className="h-3 w-3 mr-1 inline" />}
                        {ticket.issue_type}
                      </Badge>

                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                        isResolved ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {isResolved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {isResolved ? t("resolved") : t("pending")}
                      </span>

                      <span className="text-slate-300">•</span>

                      <span className="text-xs font-medium text-slate-400">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-900">{ticket.email}</span>
                      </div>

                      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                          {ticket.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Administrative Actions */}
                  <div className="flex flex-col justify-center gap-2 lg:min-w-[220px] lg:border-l lg:border-slate-100 lg:pl-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    
                    {/* Reply to Doctor / Staff via Email */}
                    <a
                      href={`mailto:${ticket.email}?subject=TEREA IT Support: ${encodeURIComponent(ticket.issue_type)}&body=Hello,%0D%0A%0D%0ARegarding your support inquiry: "${encodeURIComponent(ticket.message)}"...`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs"
                    >
                      <Send className="h-3.5 w-3.5 text-slate-400" />
                      {t("replyDoctor")}
                    </a>

                    {/* Resolution Trigger */}
                    {!isResolved ? (
                      <Button 
                        onClick={() => handleResolveTicket(ticket.id, ticket.email, ticket.issue_type)}
                        disabled={resolvingId === ticket.id}
                        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs h-10 transition-colors"
                      >
                        {resolvingId === ticket.id ? (
                          <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> {t("processing")}</>
                        ) : isPasswordReset ? (
                          <><KeyRound className="mr-1.5 h-3.5 w-3.5" /> {t("sendResetLink")}</>
                        ) : (
                          <><Check className="mr-1.5 h-3.5 w-3.5" /> {t("markResolved")}</>
                        )}
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl h-10">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>{t("resolved")}</span>
                        </div>
                        <button
                          onClick={() => handleReopenTicket(ticket.id)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 py-1 transition-colors"
                        >
                          <Undo2 className="h-3 w-3" /> {t("reopenTicket")}
                        </button>
                      </div>
                    )}

                    {/* Informational Subtext for Password Reset */}
                    {!isResolved && isPasswordReset && (
                      <p className="text-center text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1 leading-tight">
                        <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                        <span>Triggers password reset email</span>
                      </p>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}