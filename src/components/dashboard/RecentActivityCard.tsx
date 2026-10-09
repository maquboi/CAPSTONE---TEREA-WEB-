import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Activity, ArrowRight, ShieldCheck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

// 1. Define the shape of a single activity log
interface ActivityLog {
  id: string | number;
  action: string;
  patient: string;
  details: string;
  timestamp: string;
}

// 2. Define the props the component receives
interface RecentActivityCardProps {
  activities: ActivityLog[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl shadow-sm border border-slate-300/80 bg-white overflow-hidden flex flex-col h-full font-sans">
      <CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-200 shrink-0">
            <Activity className="h-4 w-4 text-teal-700" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Recent Clinical Activity
            </CardTitle>
            <p className="text-[11px] text-slate-500 font-normal">
              Audit trail of recent patient interactions
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((log, index) => {
              const isLast = index === activities.length - 1;

              return (
                <div key={log.id} className="relative flex gap-3.5 group">
                  {/* Vertical Timeline Spine & Node */}
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-teal-600 ring-4 ring-teal-50 shrink-0 mt-1" />
                    {!isLast && (
                      <div className="w-[1.5px] flex-1 bg-slate-200 mt-1.5" />
                    )}
                  </div>

                  {/* Content Container */}
                  <div className={`flex-1 ${!isLast ? 'pb-3.5' : 'pb-1'}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 leading-snug group-hover:text-teal-800 transition-colors">
                        {log.action}
                      </p>
                      
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium tabular-nums shrink-0">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(log.timestamp).toLocaleTimeString([], { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70">
                        <User className="h-2.5 w-2.5 text-teal-700" />
                        {log.patient || "General Clinic"}
                      </span>
                    </div>

                    {log.details && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 leading-relaxed">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center px-4">
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-2.5">
              <ShieldCheck className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-800">No Recent Activity</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Clinical actions and consultations will record here in real-time.
            </p>
          </div>
        )}

        {/* Card Footer Link */}
        <div className="pt-3 border-t border-slate-100 mt-4 flex justify-end">
          <button
            onClick={() => navigate("/doctor/activity")}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}