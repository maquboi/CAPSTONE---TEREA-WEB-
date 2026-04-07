import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Activity } from "lucide-react";

// 1. Define the shape of a single activity log
interface ActivityLog {
  id: string | number;
  action: string;
  patient: string;
  details: string;
  timestamp: string;
}

// 2. Define the props the component can receive
interface RecentActivityCardProps {
  activities: ActivityLog[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <Card className="dashboard-surface h-full rounded-2xl border-[#DDE5B6]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#606C38]" />
          <CardTitle className="text-base font-bold text-[#2D3B1E]">
            Recent Activity
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {activities && activities.length > 0 ? (
            activities.map((log) => (
              <div key={log.id} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-[#606C38] mt-1.5" />
                  <div className="w-[1px] h-full bg-[#DDE5B6] mt-1" />
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm font-bold text-[#2D3B1E] leading-tight">
                    {log.action}
                  </p>
                  <p className="text-[11px] text-[#606C38] font-semibold mt-0.5">
                    {log.patient}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground pt-1.5 font-medium">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(log.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground italic text-xs">
              No recent activity found.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}