import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AppHeaderProps {
  userName: string;
  userRole: "Admin" | "Doctor" | "Employee";
}

export function AppHeader({ userName, userRole }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();
  const rolePrefix = location.pathname.startsWith("/admin") ? "admin" : "doctor";

  return (
    <header className="flex h-16 items-center justify-end border-b border-[#DDE5B6]/50 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-[#FEFAE0]">
              <Bell className="h-5 w-5 text-[#606C38]" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">3</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-[#2D3B1E]">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#DDE5B6]/50" />
            <DropdownMenuItem className="focus:bg-[#FEFAE0]" onClick={() => toast({ title: "High-risk alert", description: "Juan Dela Cruz flagged as high-risk by AI." })}>
              <div className="space-y-1"><p className="text-sm font-medium text-[#2D3B1E]">High-risk patient flagged</p><p className="text-xs text-[#606C38]/80">5 min ago</p></div>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-[#FEFAE0]" onClick={() => toast({ title: "Appointment", description: "Maria Santos scheduled for Feb 10." })}>
              <div className="space-y-1"><p className="text-sm font-medium text-[#2D3B1E]">Appointment scheduled</p><p className="text-xs text-[#606C38]/80">15 min ago</p></div>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-[#FEFAE0]" onClick={() => toast({ title: "Follow-up overdue", description: "Jose Rizal's follow-up is overdue." })}>
              <div className="space-y-1"><p className="text-sm font-medium text-[#2D3B1E]">Follow-up overdue</p><p className="text-xs text-[#606C38]/80">1 hour ago</p></div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2 hover:bg-[#FEFAE0]/50">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#606C38] text-white text-sm font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-bold text-[#2D3B1E]">{userName}</p>
                <Badge variant="secondary" className="mt-0.5 text-[10px] bg-[#FEFAE0] text-[#606C38] hover:bg-[#DDE5B6] border-none">{userRole}</Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[#2D3B1E]">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#DDE5B6]/50" />
            <DropdownMenuItem className="focus:bg-[#FEFAE0] focus:text-[#2D3B1E]" onClick={() => navigate(`/${rolePrefix}/profile`)}>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-[#FEFAE0] focus:text-[#2D3B1E]" onClick={() => navigate(`/${rolePrefix}/settings`)}>Notifications</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#DDE5B6]/50" />
            <DropdownMenuItem onClick={() => navigate("/login")} className="text-red-600 focus:text-red-700 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}