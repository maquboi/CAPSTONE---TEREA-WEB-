import { Bell, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search patients, reports..." className="pl-9 bg-background border-border" />
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">3</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast({ title: "High-risk alert", description: "Juan Dela Cruz flagged as high-risk by AI." })}>
              <div className="space-y-1"><p className="text-sm font-medium">High-risk patient flagged</p><p className="text-xs text-muted-foreground">5 min ago</p></div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ title: "Appointment", description: "Maria Santos scheduled for Feb 10." })}>
              <div className="space-y-1"><p className="text-sm font-medium">Appointment scheduled</p><p className="text-xs text-muted-foreground">15 min ago</p></div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ title: "Follow-up overdue", description: "Jose Rizal's follow-up is overdue." })}>
              <div className="space-y-1"><p className="text-sm font-medium">Follow-up overdue</p><p className="text-xs text-muted-foreground">1 hour ago</p></div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium">{userName}</p>
                <Badge variant="secondary" className="mt-0.5 text-xs">{userRole}</Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/${rolePrefix}/profile`)}>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/${rolePrefix}/settings`)}>Notifications</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/login")} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
