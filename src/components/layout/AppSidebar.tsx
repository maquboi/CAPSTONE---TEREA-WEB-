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
    title: "Management",
    items: [
      { title: "User Management", href: "/admin/users", icon: Users },
      { title: "Facility Management", href: "/admin/facilities", icon: MapPin },
      { title: "FAQ Management", href: "/admin/faq", icon: HelpCircle },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "System Reports", href: "/admin/reports", icon: FileText },
      { title: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
      { title: "Error Logs", href: "/admin/error-logs", icon: AlertTriangle },
      { title: "Support Feedbacks", href: "/admin/support-tickets", icon: Headset },
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
      { title: "Follow-up Tracker", href: "/doctor/follow-ups", icon: Activity },
    ],
  },
  {
    title: "Activity",
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
          "sidebar-nav-link group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300",
          isActive 
            ? "sidebar-nav-link-active bg-[#FEFAE0] font-bold text-[#2D3B1E] shadow-2xs" 
            : "text-[#2D3B1E]/80 hover:bg-[#DDE5B6]/30 hover:text-[#2D3B1E]",
          collapsed && "justify-center px-2"
        )}
      >
        {/* Active Pill Indicator */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#606C38]" />
        )}

        <Icon 
          className={cn(
            "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110", 
            isActive ? "text-[#606C38]" : "text-[#606C38]/75"
          )} 
        />

        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.title}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#606C38] px-1.5 text-xs font-bold text-white shadow-2xs">
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
          <TooltipContent side="right" className="flex items-center gap-2 font-bold text-xs bg-[#2D3B1E] text-white border-none shadow-lg">
            <span>{item.title}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="rounded-full bg-[#606C38] px-1.5 py-0.2 text-[10px] text-white">
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
        "sidebar-rail fixed inset-y-0 left-0 z-40 shrink-0 flex h-screen flex-col border-r border-[#DDE5B6] bg-[#F4F7F4]/96 text-[#2D3B1E] transition-all duration-300 ease-in-out backdrop-blur-xl",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse Rail Toggle */}
      <button
        onClick={onToggleCollapsed}
        className="absolute -right-3 top-1/2 z-50 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[#DDE5B6] bg-white text-[#2D3B1E] shadow-sm hover:bg-[#DDE5B6] transition-colors focus:outline-none"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Header / Brand Logo Card */}
      <div className={cn("flex h-16 items-center border-b border-[#DDE5B6] px-4", collapsed && "justify-center px-2")}>
        <div className="flex items-center gap-3">
          {/* Branded Logo Container (Clean white surface with cache-busting version query) */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white overflow-hidden shadow-xs border border-[#DDE5B6] shrink-0 p-1.5 transition-transform hover:scale-105">
            <img 
              src="/LogoNoBG.png?v=2" 
              alt="TEREA Logo" 
              className="h-full w-full object-contain" 
              onError={(e) => {
                // Fallback if public path isn't resolving
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('fallback')) {
                  target.src = '/LogoNoBG.png';
                }
              }}
            />
          </div>

          {!collapsed && (
            <div className="leading-tight animate-fade-in">
              <h1 className="text-lg font-extrabold tracking-tight text-[#2D3B1E]">TEREA</h1>
              <p className="text-[11px] font-semibold text-[#606C38]/80">TB Risk Assessment</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[#606C38]/70">
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
      <div className="border-t border-[#DDE5B6] p-3 space-y-1 bg-white/40">
        <NavItemComponent item={{ title: "Profile", href: `/${role}/profile`, icon: UserCircle }} />
        <NavItemComponent item={{ title: "Settings", href: `/${role}/settings`, icon: Settings }} />
      </div>
    </aside>
  );
}