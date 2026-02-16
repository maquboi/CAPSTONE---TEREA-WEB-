import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  UserPlus, Calendar, ClipboardCheck, AlertCircle, FileText, Bell
} from "lucide-react";

interface Activity {
  id: string;
  type: "patient-added" | "appointment" | "status-update" | "alert" | "report" | "reminder";
  title: string;
  description: string;
  time: string;
  user: string;
}

const mockActivities: Activity[] = [
  { id: "1", type: "alert", title: "High-risk patient flagged", description: "Juan Dela Cruz has been flagged as high-risk by AI", time: "5 min ago", user: "System" },
  { id: "2", type: "appointment", title: "Appointment scheduled", description: "Maria Santos scheduled for checkup on Feb 10", time: "15 min ago", user: "Dr. Santos" },
  { id: "3", type: "status-update", title: "Status updated", description: "Pedro Reyes moved to 'For Follow-up'", time: "1 hour ago", user: "Dr. Cruz" },
  { id: "4", type: "patient-added", title: "New patient registered", description: "Ana Garcia completed symptom assessment", time: "2 hours ago", user: "System" },
  { id: "5", type: "report", title: "Monthly report generated", description: "January 2025 TB trend report is ready", time: "3 hours ago", user: "Admin" },
];

const getActivityIcon = (type: Activity["type"]) => {
  const icons = { "patient-added": UserPlus, appointment: Calendar, "status-update": ClipboardCheck, alert: AlertCircle, report: FileText, reminder: Bell };
  return icons[type];
};

const getActivityColor = (type: Activity["type"]) => {
  const colors = {
    "patient-added": "bg-blue-100 text-blue-600",
    appointment: "bg-purple-100 text-purple-600",
    "status-update": "bg-emerald-100 text-emerald-600",
    alert: "bg-red-100 text-red-600",
    report: "bg-amber-100 text-amber-600",
    reminder: "bg-cyan-100 text-cyan-600",
  };
  return colors[type];
};

export function RecentActivityCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <button
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => navigate(isAdmin ? "/admin/audit-logs" : "/doctor/activity")}
        >
          View all
        </button>
      </div>

      <div className="space-y-4">
        {mockActivities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <div key={activity.id} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/30">
              <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", getActivityColor(activity.type))}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{activity.time} • {activity.user}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
