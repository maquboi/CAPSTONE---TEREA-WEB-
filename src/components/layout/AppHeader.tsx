import { useEffect, useState } from "react";
import { Bell, LogOut, Check, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
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

  // Compute initials cleanly (ignoring any "Dr." prefix)
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
      } catch (e) { return defaultSettings; }
    }
    return defaultSettings;
  };

  const shouldShowNotification = (notif: Notification, settings: any) => {
    if (!notif.type) return true; 
    
    if ((notif.type === 'request' || notif.type === 'diary_update') && settings.patientAlerts === false) return false;
    if (notif.type === 'note' && settings.followUpAlerts === false) return false;
    if (notif.type === 'appointment' && settings.appointmentReminders === false) return false;
    
    return true;
  };

  useEffect(() => {
    let notifChannel: any = null;
    let profileChannel: any = null;
    let isMounted = true;

    const setupHeaderData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      // 1. Fetch current profile data (Name + Avatar URL)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && isMounted) {
        if (profile.full_name) setUserName(profile.full_name);
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      }

      const currentSettings = getDoctorSettings();

      // 2. Fetch existing notifications
      const { data: initialNotifs, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && initialNotifs && isMounted) {
        const filteredNotifs = initialNotifs
          .filter(n => shouldShowNotification(n, currentSettings))
          .slice(0, 10);
          
        setNotifications(filteredNotifs);
        setUnreadCount(filteredNotifs.filter(n => !n.is_read).length);
      }

      // 3. Real-time listener for Notifications
      notifChannel = supabase
        .channel(`doctor-notifs-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            const newNotif = payload.new as Notification;
            if (newNotif.doctor_id !== user.id) return;
            
            const activeSettings = getDoctorSettings();
            if (shouldShowNotification(newNotif, activeSettings)) {
              setNotifications((prev) => [newNotif, ...prev].slice(0, 10)); 
              setUnreadCount((prev) => prev + 1);
              
              toast({ 
                title: newNotif.title, 
                description: newNotif.message 
              });
            }
          }
        )
        .subscribe();

      // 4. Real-time listener for Profile updates (Instantly updates picture & name)
      profileChannel = supabase
        .channel(`doctor-profile-sync-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
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
    window.addEventListener('settingsUpdated', handleSettingsChange);
    
    return () => {
      isMounted = false;
      window.removeEventListener('settingsUpdated', handleSettingsChange);
      if (notifChannel) supabase.removeChannel(notifChannel);
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, [toast]);

  const handleNotificationClick = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
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
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const cleanDisplayDoctorName = (name: string) => {
    if (!name) return "Doctor";
    return `Dr. ${name.replace(/^Dr\.?\s*/i, "")}`;
  };

  return (
    <header className="dashboard-panel flex h-16 items-center justify-end border-b border-[#DDE5B6]/70 px-6 text-[#2D3B1E] bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        
        {/* Dynamic Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-[#DDE5B6]/45 rounded-xl">
              <Bell className="h-5 w-5 text-[#606C38]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#283618] text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto rounded-2xl shadow-xl border-slate-200">
            <DropdownMenuLabel className="text-[#283618] flex justify-between items-center font-bold px-4 py-3">
              Notifications
              {unreadCount > 0 && <Badge variant="secondary" className="bg-[#DDE5B6] text-[#283618] text-[10px] font-bold">{unreadCount} New</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#DDE5B6]/50" />
            
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">No new notifications</div>
            ) : (
              notifications.map((notif) => (
                <DropdownMenuItem 
                  key={notif.id} 
                  className={`p-3 focus:bg-[#FEFAE0] cursor-pointer ${notif.is_read ? 'opacity-60' : 'bg-[#FEFAE0]/30'}`} 
                  onClick={() => handleNotificationClick(notif.id)}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="space-y-1">
                      <p className={`text-xs text-[#283618] ${notif.is_read ? 'font-medium' : 'font-bold'}`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-[#606C38]/90 leading-relaxed">
                        {notif.message}
                      </p>
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
            <Button variant="ghost" className="flex items-center gap-3 px-2 py-1.5 hover:bg-[#DDE5B6]/35 rounded-full transition-all">
              <Avatar className="h-9 w-9 border-2 border-[#DDE5B6] shadow-2xs overflow-hidden">
                <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                <AvatarFallback className="bg-[#606C38] text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold text-[#283618] leading-tight">
                  {cleanDisplayDoctorName(userName)}
                </p>
                <Badge variant="secondary" className="mt-0.5 border-none bg-[#DDE5B6]/55 text-[9px] font-bold text-[#606C38] px-1.5 py-0">
                  {userRole}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-xl border-slate-200">
            <DropdownMenuLabel className="text-[#283618] font-bold text-xs px-3 py-2">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#DDE5B6]/50" />
            <DropdownMenuItem 
              className="focus:bg-[#FEFAE0] focus:text-[#283618] font-medium cursor-pointer rounded-xl text-xs py-2" 
              onClick={() => navigate(`/${rolePrefix}/profile`)}
            >
              <User className="mr-2 h-3.5 w-3.5 text-[#606C38]" />
              Profile Credentials
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="focus:bg-[#FEFAE0] focus:text-[#283618] font-medium cursor-pointer rounded-xl text-xs py-2" 
              onClick={() => navigate(`/${rolePrefix}/settings`)}
            >
              <Settings className="mr-2 h-3.5 w-3.5 text-[#606C38]" />
              Settings & Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#DDE5B6]/50" />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-red-600 focus:text-red-700 focus:bg-red-50 font-medium cursor-pointer rounded-xl text-xs py-2"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}