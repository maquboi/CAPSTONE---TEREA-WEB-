import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  Activity,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
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
    ],
  },
  {
    title: "Management",
    items: [
      { title: "User Management", href: "/admin/users", icon: Users },
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
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function AppSidebar({ role, collapsed, onToggleCollapsed }: AppSidebarProps) {
  const location = useLocation();

  const navSections = role === "admin" ? adminNavSections : doctorNavSections;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const content = (
      <NavLink
        to={item.href}
        className={cn(
          "sidebar-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300",
          isActive && "sidebar-nav-link-active font-semibold",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", isActive && "scale-105 text-[#606C38]")} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#606C38] px-1.5 text-xs font-medium text-white">
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
        "sidebar-rail fixed inset-y-0 left-0 z-40 shrink-0 flex h-screen flex-col overflow-hidden border-r border-[#DDE5B6] bg-[#F4F7F4]/96 text-[#2D3B1E] transition-all duration-300 ease-in-out backdrop-blur-xl",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-[#DDE5B6] px-4",
        collapsed && "justify-center px-2"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#606C38] shadow-sm">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-semibold tracking-tight">TEREA</h1>
              <p className="text-xs text-[#606C38]/75">TB Risk Assessment</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#606C38]/65">
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
      <div className="border-t border-[#DDE5B6] p-3">
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
          onClick={onToggleCollapsed}
          className={cn(
            "mt-4 w-full text-[#2D3B1E] hover:bg-[#DDE5B6]/50 hover:text-[#2D3B1E]",
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