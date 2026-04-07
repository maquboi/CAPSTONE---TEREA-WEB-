import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "doctor";
  userName?: string;
}

export function DashboardLayout({
  children,
  role,
  userName = "Doctor", // <-- Fixed: Removed the hardcoded "Dr. Maria Santos"
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const userRole = role === "admin" ? "Admin" : "Doctor";

  return (
    <div className="dashboard-shell flex min-h-screen w-full overflow-x-hidden text-[#2D3B1E]">
      <AppSidebar role={role} collapsed={collapsed} onToggleCollapsed={() => setCollapsed((prev) => !prev)} />
      <div className={cn("flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out", collapsed ? "ml-16" : "ml-64")}>
        <AppHeader userName={userName} userRole={userRole} />
        <main className="dashboard-main flex-1 p-5 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}