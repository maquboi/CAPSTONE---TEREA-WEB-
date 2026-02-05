import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { PatientQueueTable } from "@/components/dashboard/PatientQueueTable";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { 
  Users, 
  AlertTriangle, 
  CalendarCheck, 
  Activity 
} from "lucide-react";

export default function DoctorDashboard() {
  return (
    <DashboardLayout role="doctor" userName="Dr. Maria Santos">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good morning, Dr. Santos
          </h1>
          <p className="text-muted-foreground">
            Here's what needs your attention today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="My Patients"
            value="48"
            description="Currently assigned"
            icon={Users}
          />
          <StatCard
            title="High-Risk Queue"
            value="5"
            description="Awaiting review"
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            title="Today's Appointments"
            value="8"
            description="3 completed"
            icon={CalendarCheck}
            variant="primary"
          />
          <StatCard
            title="Pending Follow-ups"
            value="12"
            description="This week"
            icon={Activity}
            variant="warning"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PatientQueueTable />
          </div>
          <div>
            <RecentActivityCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
