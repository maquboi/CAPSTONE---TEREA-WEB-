import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "warning" | "danger";
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const variantStyles = {
    default: "bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(244,247,244,0.95))] border-[#DDE5B6]",
    primary: "bg-[linear-gradient(145deg,rgba(221,229,182,0.42),rgba(244,247,244,0.92))] border-[#606C38]/20",
    warning: "bg-[linear-gradient(145deg,rgba(221,229,182,0.28),rgba(255,250,230,0.95))] border-[#DDE5B6]",
    danger: "bg-[linear-gradient(145deg,rgba(255,246,238,0.98),rgba(244,247,244,0.95))] border-[#DDE5B6]",
  };

  const iconStyles = {
    default: "bg-[#DDE5B6]/45 text-[#606C38]",
    primary: "bg-[#606C38]/10 text-[#606C38]",
    warning: "bg-[#DDE5B6]/55 text-[#606C38]",
    danger: "bg-[#DDE5B6]/35 text-[#2D3B1E]",
  };

  return (
    <div
      className={cn(
        "dashboard-surface rounded-2xl border p-5 transition-all duration-200 card-hover",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#2D3B1E]/70">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-[#2D3B1E]">{value}</p>
          {description && (
            <p className="text-sm text-[#2D3B1E]/65">{description}</p>
          )}
          {trend && (
            <div
              className={cn(
                "inline-flex items-center text-sm font-medium",
                trend.isPositive ? "text-[#606C38]" : "text-[#8c3d2f]"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
              <span className="ml-1 text-[#2D3B1E]/55 font-normal">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
