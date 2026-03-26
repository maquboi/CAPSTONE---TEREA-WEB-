import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  Activity,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  AlertTriangle,
  Key,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const adminNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Analytics Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Heatmap", href: "/admin/heatmap", icon: MapPin },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "User Management", href: "/admin/users", icon: Users },
      { title: "Keyword Manager", href: "/admin/keywords", icon: Key },
      { title: "FAQs Management", href: "/admin/faqs", icon: HelpCircle },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "System Reports", href: "/admin/reports", icon: FileText },
      { title: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
      { title: "Error Logs", href: "/admin/error-logs", icon: AlertTriangle },
    ],
  },
];

const doctorNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Patients",
    items: [
      { title: "Patients", href: "/doctor/patients", icon: Users },
      { title: "Tracker", href: "/doctor/follow-ups", icon: Activity },
    ],
  },
  {
    title: "Schedule",
    items: [
      { title: "Reports", href: "/doctor/appointments", icon: Calendar },
      { title: "Activity Logs", href: "/doctor/activity", icon: FileText },
    ],
  },
];

interface AppSidebarProps {
  role: "admin" | "doctor";
}

export function AppSidebar({ role }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navSections = role === "admin" ? adminNavSections : doctorNavSections;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const content = (
      <NavLink
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "bg-sidebar-accent text-sidebar-primary font-medium",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary px-1.5 text-xs font-medium text-sidebar-primary-foreground">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border px-4",
        collapsed && "justify-center px-2"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-lg font-bold text-sidebar-primary-foreground">T</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-semibold tracking-tight">TEREA</h1>
              <p className="text-xs text-sidebar-muted">TB Risk Assessment</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
                {section.title}
              </h2>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3">
        <div className="space-y-1">
          <NavItemComponent
            item={{ title: "Profile", href: `/${role}/profile`, icon: UserCircle }}
          />
          <NavItemComponent
            item={{ title: "Settings", href: `/${role}/settings`, icon: Settings }}
          />
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "mt-4 w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "px-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}