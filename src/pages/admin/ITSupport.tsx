import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  Headset, Loader2, CheckCircle2, Clock, Mail, AlertCircle, KeyRound
} from "lucide-react";
import { useLanguage } from "./LanguageContext";

interface SupportTicket {
  id: string;
  email: string;
  issue_type: string;
  message: string;
  status: string;
  created_at: string;
}

// Local Translation Dictionary for IT Support
const translations = {
  en: {
    pageTitle: "IT Support Feedbacks",
    pageSubtitle: "Manage system issues, account lockouts, and secure password reset requests.",
    noTickets: "No Support Tickets",
    noTicketsDesc: "Your IT Helpdesk is completely clear!",
    processing: "Processing...",
    sendResetLink: "Send Reset Link",
    markResolved: "Mark as Resolved",
    resolved: "Resolved",
    pending: "Pending",
    secureAuthTrigger: "Secure Auth Trigger",
    resetErrorAlert: "Failed to send reset email. Ensure the user exists in the auth system.",
    resolveErrorAlert: "An error occurred while resolving the ticket."
  },
  fil: {
    pageTitle: "Mga Feedback sa IT Support",
    pageSubtitle: "Pamahalaan ang mga isyu sa sistema, account lockouts, at pag-reset ng password.",
    noTickets: "Walang Support Tickets",
    noTicketsDesc: "Wala pang laman ang iyong IT Helpdesk!",
    processing: "Pinoproseso...",
    sendResetLink: "Ipadala ang Reset Link",
    markResolved: "Markahan bilang Naresolba",
    resolved: "Naresolba na",
    pending: "Nakabinbin",
    secureAuthTrigger: "Secure Auth Trigger",
    resetErrorAlert: "Nabigong ipadala ang reset email. Siguraduhing umiiral ang user sa auth system.",
    resolveErrorAlert: "May naganap na error habang nireresolba ang ticket."
  }
};

export default function ITSupport() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations.en) => translations[language as 'en' | 'fil'][key] || translations.en[key];

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState("Admin User");
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/'); 
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
        if (profile.full_name) setAdminName(profile.full_name);
        
        await fetchTickets();
      } else {
        navigate('/doctor/dashboard');
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('status', { ascending: false }) // 'Pending' comes before 'Resolved' alphabetically
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTickets(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  const handleResolveTicket = async (ticketId: string, email: string, issueType: string) => {
    try {
      setResolvingId(ticketId);

      // Security Measure: If it's a password reset, trigger Supabase Auth recovery
      if (issueType === 'Password Reset Request') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (resetError) {
          console.error("Reset Email Error:", resetError);
          alert(t("resetErrorAlert"));
          setResolvingId(null);
          return;
        }
      }

      // Update the ticket status in the database
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ status: 'Resolved' })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Update local UI state to reflect changes instantly
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: 'Resolved' } : ticket
      ));

    } catch (err) {
      console.error("Error resolving ticket:", err);
      alert(t("resolveErrorAlert"));
    } finally {
      setResolvingId(null);
    }
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
      <div className="flex h-screen items-center justify-center bg-[#F4F7F4]">
        <Loader2 className="h-8 w-8 animate-spin text-[#606C38]" />
      </div>
    );
  }

  if (!isAdmin) return null; 

  return (
    <DashboardLayout role="admin" userName={adminName}>
      <div className="space-y-6 animate-fade-in font-sans pb-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#2D3B1E] flex items-center gap-2">
              <Headset className="h-6 w-6 text-[#606C38]" /> 
              {t("pageTitle")}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t("pageSubtitle")}
            </p>
          </div>
        </div>

        {/* Tickets Feed */}
        <div className="grid gap-4">
          {tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-700">{t("noTickets")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("noTicketsDesc")}</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className={`relative flex flex-col sm:flex-row gap-5 rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 ${
                  ticket.status === 'Resolved' 
                    ? 'border-slate-100 opacity-75 grayscale-[0.3]' 
                    : 'border-[#DDE5B6] hover:border-[#606C38]/50 hover:shadow-md'
                }`}
              >
                
                {/* Left Side: Ticket Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-md bg-[#DDE5B6]/50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2D3B1E]">
                      {ticket.issue_type}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      ticket.status === 'Resolved' ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {ticket.status === 'Resolved' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {ticket.status === 'Resolved' ? t("resolved") : ticket.status === 'Pending' ? t("pending") : ticket.status}
                    </span>
                    <span className="text-xs font-medium text-slate-400 border-l border-slate-200 pl-3">
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#2D3B1E] flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" /> {ticket.email}
                    </h4>
                    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {ticket.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Admin Actions */}
                <div className="flex flex-col justify-center sm:min-w-[200px] sm:border-l sm:border-slate-100 sm:pl-5">
                  {ticket.status === 'Pending' ? (
                    <Button 
                      onClick={() => handleResolveTicket(ticket.id, ticket.email, ticket.issue_type)}
                      disabled={resolvingId === ticket.id}
                      className="btn-premium w-full rounded-xl bg-[#606C38] text-sm font-bold text-white shadow-sm hover:bg-[#4A5529] h-11"
                    >
                      {resolvingId === ticket.id ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("processing")}</>
                      ) : ticket.issue_type === 'Password Reset Request' ? (
                        <><KeyRound className="mr-2 h-4 w-4" /> {t("sendResetLink")}</>
                      ) : (
                        <><CheckCircle2 className="mr-2 h-4 w-4" /> {t("markResolved")}</>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 bg-slate-50 rounded-xl h-11">
                      <CheckCircle2 className="h-4 w-4" /> {t("resolved")}
                    </div>
                  )}
                  
                  {ticket.status === 'Pending' && ticket.issue_type === 'Password Reset Request' && (
                    <p className="mt-3 text-center text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {t("secureAuthTrigger")}
                    </p>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}