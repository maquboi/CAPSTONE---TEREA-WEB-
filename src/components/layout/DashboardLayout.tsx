import { ReactNode } from "react";
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
  const userRole = role === "admin" ? "Admin" : "Doctor";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader userName={userName} userRole={userRole} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}