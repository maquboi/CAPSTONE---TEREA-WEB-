import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Users,
  CalendarDays,
  History,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "doctor" | "admin" | "patient";
  userName?: string;
}

export function DashboardLayout({ children, role = "doctor", userName = "Doctor" }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  
  // Physician profile info state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [doctorDisplayName, setDoctorDisplayName] = useState<string>(userName);

  // Logout Confirmation State
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch pending intake count & doctor profile details
  useEffect(() => {
    let isMounted = true;

    const fetchDoctorData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch pending connection requests
        const { count } = await supabase
          .from("connections")
          .select("*", { count: "exact", head: true })
          .eq("doctor_id", user.id)
          .eq("status", "pending");

        if (count !== null && isMounted) {
          setPendingRequestsCount(count);
        }

        // 2. Fetch doctor avatar and full name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (profile && isMounted) {
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
          if (profile.full_name) setDoctorDisplayName(profile.full_name);
        }
      } catch (err) {
        console.error("Error fetching doctor data in sidebar:", err);
      }
    };

    fetchDoctorData();

    // Listen to real-time updates for connections and profile changes
    const connectionChannel = supabase
      .channel("sidebar-connections-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => {
        fetchDoctorData();
      })
      .subscribe();

    const profileChannel = supabase
      .channel("sidebar-doctor-profile-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => {
        fetchDoctorData();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(connectionChannel);
      supabase.removeChannel(profileChannel);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const currentName = doctorDisplayName || userName || "Doctor";
  const cleanDoctorName = currentName
    ? `Dr. ${currentName.replace(/^(dr\.?\s*)+/i, "").trim()}`
    : "Dr. Attending Physician";

  const getInitials = (name: string) => {
    return name
      .replace(/^(dr\.?\s*)+/i, "")
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "DR";
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/doctor/dashboard",
      icon: LayoutDashboard,
      exact: true,
      badge: null,
    },
    {
      label: "My Patients",
      path: "/doctor/patients",
      icon: Users,
      exact: false,
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : null,
    },
    {
      label: "Follow-up Tracker",
      path: "/doctor/follow-ups",
      icon: CalendarDays,
      exact: false,
      badge: null,
    },
    {
      label: "Activity Logs",
      path: "/doctor/activity",
      icon: History,
      exact: false,
      badge: null,
    },
    {
      label: "My Profile",
      path: "/doctor/profile",
      icon: User,
      exact: false,
      badge: null,
    },
    {
      label: "Settings",
      path: "/doctor/settings",
      icon: Settings,
      exact: false,
      badge: null,
    },
  ];

  const isLinkActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path || (path === "/doctor/dashboard" && location.pathname === "/doctor");
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-900 flex flex-col lg:flex-row">
      
      {/* --- LOGOUT CONFIRMATION DIALOG --- */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 bg-white font-sans border border-slate-200 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-3">
            <LogOut className="h-5 w-5 text-red-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 text-center">
              Sign Out of Workstation?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs text-center mt-1.5 leading-relaxed">
              Are you sure you want to end your clinical session? Make sure any open patient consultations or notes have been saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex gap-2 sm:justify-center w-full">
            <Button
              variant="outline"
              className="flex-1 rounded-xl text-xs h-9 border-slate-300 font-semibold"
              onClick={() => setLogoutDialogOpen(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 shadow-xs"
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MOBILE TOP NAVIGATION BAR --- */}
      <header className="lg:hidden sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img src="/LogoNoBG.png" alt="TEREA Logo" className="h-8 w-8 object-contain" />
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">TEREA</span>
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">TB-DOTS Clinician</span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle mobile navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/90 bg-white fixed inset-y-0 left-0 z-30 shadow-xs">
        
        {/* Clinic Branding Header */}
        <div className="flex items-center gap-3 px-6 h-18 border-b border-slate-100">
          <img src="/LogoNoBG.png" alt="TEREA Logo" className="h-9 w-9 object-contain shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900 leading-none">TEREA</span>
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider mt-1">
              Carmona TB-DOTS
            </span>
          </div>
        </div>

        {/* Workstation Category Header */}
        <div className="px-6 pt-5 pb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Clinical Workstation
          </span>
        </div>

        {/* Main Navigation Stack */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isLinkActive(item.path, item.exact);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      active ? "text-white" : "text-slate-400 group-hover:text-teal-700"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <Badge
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      active
                        ? "bg-white text-teal-900"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {item.badge}
                  </Badge>
                ) : (
                  active && <ChevronRight className="h-3.5 w-3.5 text-teal-200" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Health Center Facility Card */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/80">
            <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase text-teal-900 tracking-wider truncate">
                Carmona Health Center
              </p>
              <p className="text-[10px] text-teal-800/80 truncate">Overview</p>
            </div>
          </div>
        </div>

        {/* Attending Physician Profile Badge (Photo with Monogram Fallback) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Doctor Avatar Container */}
              <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={cleanDoctorName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-teal-50 border border-teal-200/60 flex items-center justify-center font-bold text-xs text-teal-800">
                    {getInitials(currentName)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{cleanDoctorName}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">Attending Physician</p>
              </div>
            </div>

            <button
              onClick={() => setLogoutDialogOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE DRAWER SLIDE-OVER --- */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative flex flex-col w-72 max-w-xs bg-white h-full shadow-2xl z-10">
            <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img src="/LogoNoBG.png" alt="TEREA Logo" className="h-8 w-8 object-contain" />
                <span className="font-extrabold text-base tracking-tight text-slate-900">TEREA</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Profile Identification Card */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={cleanDoctorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-teal-50 border border-teal-200/60 flex items-center justify-center font-bold text-xs text-teal-800">
                      {getInitials(currentName)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{cleanDoctorName}</p>
                  <p className="text-[10px] font-medium text-slate-500">Carmona Health Center</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isLinkActive(item.path, item.exact);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? "bg-teal-700 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge className="bg-amber-100 text-amber-800 text-[9px] font-bold">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLogoutDialogOpen(true);
                }}
                className="w-full justify-center gap-2 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-xl h-10"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}