import { useEffect, useState } from "react";
import { Bell, LogOut, User, Settings, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface AppHeaderProps {
  userName: string;
  userRole: "Admin" | "Doctor" | "Employee";
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  doctor_id?: string;
}

export function AppHeader({ userName: initialUserName, userRole }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const rolePrefix = location.pathname.startsWith("/admin") ? "admin" : "doctor";

  // Dynamic profile states for real-time header sync
  const [userName, setUserName] = useState(initialUserName);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Compute initials cleanly
  const initials = (userName || "Doctor")
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "DR";

  const getDoctorSettings = () => {
    const defaultSettings = { patientAlerts: true, appointmentReminders: true, followUpAlerts: true };
    const saved = localStorage.getItem("doctorSystemSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  };

  const shouldShowNotification = (notif: Notification, settings: any) => {
    if (!notif.type) return true;

    if ((notif.type === "request" || notif.type === "diary_update") && settings.patientAlerts === false) return false;
    if (notif.type === "note" && settings.followUpAlerts === false) return false;
    if (notif.type === "appointment" && settings.appointmentReminders === false) return false;

    return true;
  };

  useEffect(() => {
    let notifChannel: any = null;
    let profileChannel: any = null;
    let isMounted = true;

    const setupHeaderData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      // 1. Fetch current profile data (Name + Avatar URL)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && isMounted) {
        if (profile.full_name) setUserName(profile.full_name);
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      }

      const currentSettings = getDoctorSettings();

      // 2. Fetch existing notifications
      const { data: initialNotifs, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("doctor_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && initialNotifs && isMounted) {
        const filteredNotifs = initialNotifs
          .filter((n) => shouldShowNotification(n, currentSettings))
          .slice(0, 10);

        setNotifications(filteredNotifs);
        setUnreadCount(filteredNotifs.filter((n) => !n.is_read).length);
      }

      // 3. Real-time listener for Notifications
      notifChannel = supabase
        .channel(`doctor-notifs-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          (payload) => {
            const newNotif = payload.new as Notification;
            if (newNotif.doctor_id !== user.id) return;

            const activeSettings = getDoctorSettings();
            if (shouldShowNotification(newNotif, activeSettings)) {
              setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
              setUnreadCount((prev) => prev + 1);

              toast({
                title: newNotif.title,
                description: newNotif.message,
              });
            }
          }
        )
        .subscribe();

      // 4. Real-time listener for Profile updates
      profileChannel = supabase
        .channel(`doctor-profile-sync-${user.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
          (payload: any) => {
            if (payload.new?.avatar_url !== undefined && isMounted) {
              setAvatarUrl(payload.new.avatar_url);
            }
            if (payload.new?.full_name && isMounted) {
              setUserName(payload.new.full_name);
            }
          }
        )
        .subscribe();
    };

    setupHeaderData();

    const handleSettingsChange = () => setupHeaderData();
    window.addEventListener("settingsUpdated", handleSettingsChange);

    return () => {
      isMounted = false;
      window.removeEventListener("settingsUpdated", handleSettingsChange);
      if (notifChannel) supabase.removeChannel(notifChannel);
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, [toast]);

  const handleNotificationClick = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Signout error:", e);
    } finally {
      navigate("/login");
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const cleanDisplayDoctorName = (name: string) => {
    if (!name) return "Doctor";
    return `Dr. ${name.replace(/^Dr\.?\s*/i, "")}`;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/90 bg-white/90 px-6 backdrop-blur-md shadow-2xs">
      {/* Station Context Title */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
        <span className="text-xs font-semibold text-slate-500">
          Carmona Health Center Station
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Dynamic Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute 1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-700 text-[9px] font-bold text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 max-h-[400px] overflow-y-auto rounded-2xl shadow-xl border-slate-200 bg-white p-1"
          >
            <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-900">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[10px] font-bold">
                  {unreadCount} New
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">No new notifications</div>
            ) : (
              notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className={`p-3 focus:bg-slate-50 cursor-pointer rounded-xl transition-colors ${
                    notif.is_read ? "opacity-60" : "bg-teal-50/40"
                  }`}
                  onClick={() => handleNotificationClick(notif.id)}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="space-y-1">
                      <p className={`text-xs text-slate-900 ${notif.is_read ? "font-medium" : "font-bold"}`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{notif.message}</p>
                    </div>
                    <p className="text-[9px] text-slate-400 whitespace-nowrap pt-1 font-medium">
                      {formatTime(notif.created_at)}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 px-2 py-1 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Avatar className="h-8 w-8 border border-slate-200 shadow-2xs overflow-hidden">
                <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                <AvatarFallback className="bg-teal-700 text-white text-[11px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {cleanDisplayDoctorName(userName)}
                </p>
                <span className="inline-block mt-0.5 rounded px-1 py-0 text-[9px] font-bold text-teal-800 bg-teal-50 border border-teal-200/80">
                  {userRole}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl p-1.5 shadow-xl border-slate-200 bg-white"
          >
            <DropdownMenuLabel className="font-bold text-xs text-slate-900 px-3 py-2">
              My Clinical Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              className="focus:bg-slate-100 focus:text-slate-900 font-medium cursor-pointer rounded-xl text-xs py-2"
              onClick={() => navigate(`/${rolePrefix}/profile`)}
            >
              <User className="mr-2 h-3.5 w-3.5 text-slate-500" />
              Profile Credentials
            </DropdownMenuItem>
            <DropdownMenuItem
              className="focus:bg-slate-100 focus:text-slate-900 font-medium cursor-pointer rounded-xl text-xs py-2"
              onClick={() => navigate(`/${rolePrefix}/settings`)}
            >
              <Settings className="mr-2 h-3.5 w-3.5 text-slate-500" />
              Settings & Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-700 focus:bg-red-50 font-medium cursor-pointer rounded-xl text-xs py-2"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}