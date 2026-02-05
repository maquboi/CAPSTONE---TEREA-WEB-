import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  FileText,
  Shield
} from "lucide-react";

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of TB risk assessments across Carmona
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Patients"
            value="1,234"
            description="Active in system"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="High-Risk Cases"
            value="47"
            description="Requires attention"
            icon={AlertTriangle}
            variant="danger"
            trend={{ value: 8, isPositive: false }}
          />
          <StatCard
            title="Follow-up Rate"
            value="94%"
            description="This month"
            icon={TrendingUp}
            variant="primary"
            trend={{ value: 3, isPositive: true }}
          />
          <StatCard
            title="Appointments Today"
            value="23"
            description="Scheduled checkups"
            icon={Calendar}
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HeatmapCard />
          </div>
          <div>
            <RecentActivityCard />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            icon={FileText}
            title="Generate Monthly Report"
            description="Export TB trend report for DOH compliance"
          />
          <QuickActionCard
            icon={Users}
            title="User Management"
            description="Add, remove, or modify user accounts"
          />
          <QuickActionCard
            icon={Shield}
            title="View Audit Logs"
            description="Review system actions and changes"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <button className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:shadow-soft hover:border-primary/20">
      <div className="rounded-lg bg-primary/10 p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
