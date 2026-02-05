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
    default: "bg-card border-border",
    primary: "bg-primary/5 border-primary/20",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    warning: "bg-amber-100 text-amber-600",
    danger: "bg-red-100 text-red-600",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all duration-200 card-hover",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div
              className={cn(
                "inline-flex items-center text-sm font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
              <span className="ml-1 text-muted-foreground font-normal">vs last month</span>
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
