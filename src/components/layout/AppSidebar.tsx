import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  UserCircle,
  Headset,
  HelpCircle,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
    title: "System Management",
    items: [
      { title: "User Accounts", href: "/admin/users", icon: Users },
      { title: "Health Facilities", href: "/admin/facilities", icon: MapPin },
      { title: "Clinical FAQ", href: "/admin/faq", icon: HelpCircle },
    ],
  },
  {
    title: "Surveillance & Logs",
    items: [
      { title: "System Reports", href: "/admin/reports", icon: FileText },
      { title: "Audit Trail", href: "/admin/audit-logs", icon: ClipboardList },
      { title: "Error Logs", href: "/admin/error-logs", icon: AlertTriangle },
      { title: "Support Tickets", href: "/admin/support-tickets", icon: Headset },
    ],
  },
];

const doctorNavSections: NavSection[] = [
  {
    title: "Clinical Station",
    items: [
      { title: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Patient Care",
    items: [
      { title: "Patient Cohort", href: "/doctor/patients", icon: Users },
      { title: "Follow-up Tracker", href: "/doctor/follow-ups", icon: Activity },
    ],
  },
  {
    title: "Surveillance",
    items: [
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
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200",
          isActive
            ? "bg-teal-50/90 text-teal-950 font-bold shadow-2xs"
            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
          collapsed && "justify-center px-2"
        )}
      >
        {/* Crisp Left Vertical Indicator Bar */}
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-teal-700" />
        )}

        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105",
            isActive ? "text-teal-700" : "text-slate-400 group-hover:text-slate-600"
          )}
        />

        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.title}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1.5 text-[10px] font-bold text-white shadow-xs">
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
          <TooltipContent
            side="right"
            className="flex items-center gap-2 font-semibold text-xs bg-slate-900 text-white border-slate-800 shadow-md py-1.5 px-3 rounded-lg"
          >
            <span>{item.title}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="rounded-full bg-teal-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
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
        "fixed inset-y-0 left-0 z-40 shrink-0 flex h-screen flex-col border-r border-slate-200/90 bg-white text-slate-800 transition-all duration-300 ease-in-out shadow-[1px_0_10px_rgba(15,23,42,0.03)]",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse Rail Toggle Button */}
      <button
        onClick={onToggleCollapsed}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Header / Brand Logo */}
      <div className={cn("flex h-16 items-center border-b border-slate-100 px-4", collapsed && "justify-center px-2")}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/90 shrink-0 p-1.5 transition-transform hover:scale-105 shadow-2xs">
            <img
              src="/LogoNoBG.png?v=2"
              alt="TEREA Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("fallback")) {
                  target.src = "/LogoNoBG.png";
                }
              }}
            />
          </div>

          {!collapsed && (
            <div className="leading-tight animate-fade-in min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900">TEREA</h1>
                <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1 rounded border border-teal-200">
                  {role}
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 truncate">Carmona Clinical Desk</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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

      {/* Bottom Footer Section */}
      <div className="border-t border-slate-100 p-3 space-y-1 bg-slate-50/50">
        <NavItemComponent item={{ title: "My Profile", href: `/${role}/profile`, icon: UserCircle }} />
        <NavItemComponent item={{ title: "Settings", href: `/${role}/settings`, icon: Settings }} />
      </div>
    </aside>
  );
}