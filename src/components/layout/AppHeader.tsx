import { useEffect, useState } from "react";
import { Bell, LogOut, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export function AppHeader({ userName, userRole }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();
  const rolePrefix = location.pathname.startsWith("/admin") ? "admin" : "doctor";

  // Real-time states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Function to pull the latest settings from LocalStorage
  const getDoctorSettings = () => {
    const saved = localStorage.getItem("doctorSystemSettings");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return { patientAlerts: true, appointmentReminders: true, followUpAlerts: true };
  };

  // Function to determine if a notification should be shown based on settings
  const shouldShowNotification = (notif: Notification, settings: any) => {
    if (!notif.type) return true; 
    if ((notif.type === 'request' || notif.type === 'diary_update') && !settings.patientAlerts) return false;
    if (notif.type === 'note' && !settings.followUpAlerts) return false;
    if (notif.type === 'appointment' && !settings.appointmentReminders) return false;
    
    return true;
  };

  useEffect(() => {
    let channel: any = null;
    let isMounted = true;

    const setupNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const currentSettings = getDoctorSettings();

      // 1. Fetch existing unread notifications
      const { data: initialNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (initialNotifs && isMounted) {
        const filteredNotifs = initialNotifs
          .filter(n => shouldShowNotification(n, currentSettings))
          .slice(0, 10);
          
        setNotifications(filteredNotifs);
        setUnreadCount(filteredNotifs.filter(n => !n.is_read).length);
      }

      // 2. Subscribe to Real-time inserts with a UNIQUE channel name
      channel = supabase
        .channel(`doctor-notifs-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            const newNotif = payload.new as Notification;
            
            // SECURITY: Client-side filter to ensure this doctor only sees their own alerts
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime notifications actively listening!');
          }
        });
    };

    setupNotifications();

    const handleSettingsChange = () => setupNotifications();
    window.addEventListener('settingsUpdated', handleSettingsChange);
    
    return () => {
      isMounted = false;
      window.removeEventListener('settingsUpdated', handleSettingsChange);
      if (channel) {
        supabase.removeChannel(channel);
      }
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

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header className="dashboard-panel flex h-16 items-center justify-end border-b border-[#DDE5B6]/70 px-6 text-[#2D3B1E]">
      <div className="flex items-center gap-4">
        
        {/* Dynamic Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-[#DDE5B6]/45">
              <Bell className="h-5 w-5 text-[#606C38]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#283618] text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto rounded-xl">
            <DropdownMenuLabel className="text-[#283618] flex justify-between items-center font-bold">
              Notifications
              {unreadCount > 0 && <Badge variant="secondary" className="bg-[#DDE5B6] text-[#283618] text-[10px]">{unreadCount} New</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#DDE5B6]/50" />
            
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 italic">No new notifications</div>
            ) : (
              notifications.map((notif) => (
                <DropdownMenuItem 
                  key={notif.id} 
                  className={`p-3 focus:bg-[#FEFAE0] cursor-pointer ${notif.is_read ? 'opacity-60' : 'bg-[#FEFAE0]/30'}`} 
                  onClick={() => handleNotificationClick(notif.id)}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="space-y-1">
                      <p className={`text-sm text-[#283618] ${notif.is_read ? 'font-medium' : 'font-bold'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-[#606C38]/90 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 whitespace-nowrap pt-1 font-medium">
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
            <Button variant="ghost" className="flex items-center gap-3 px-2 hover:bg-[#DDE5B6]/35 rounded-full">
              <Avatar className="h-8 w-8 border border-[#DDE5B6]">
                <AvatarFallback className="bg-[#606C38] text-white text-sm font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-bold text-[#283618]">{userName}</p>
                <Badge variant="secondary" className="mt-0.5 border-none bg-[#DDE5B6]/55 text-[10px] font-semibold text-[#606C38] hover:bg-[#DDE5B6]/70">{userRole}</Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel className="text-[#283618] font-bold">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#DDE5B6]/50" />
            <DropdownMenuItem className="focus:bg-[#FEFAE0] focus:text-[#283618] font-medium cursor-pointer" onClick={() => navigate(`/${rolePrefix}/profile`)}>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-[#FEFAE0] focus:text-[#283618] font-medium cursor-pointer" onClick={() => navigate(`/${rolePrefix}/settings`)}>Notifications</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#DDE5B6]/50" />
            <DropdownMenuItem onClick={() => navigate("/login")} className="text-red-600 focus:text-red-700 focus:bg-red-50 font-medium cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}