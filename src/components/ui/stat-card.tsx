import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "danger" | "primary" | "warning";
  subtitle?: string;
  badge?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
  badge,
  onClick,
}: StatCardProps) {
  // Clinical color variants
  const variantStyles = {
    default: {
      card: "bg-white border-slate-200/90 hover:border-slate-300",
      iconBg: "bg-teal-50 text-teal-700 border-teal-200/70",
      valueColor: "text-slate-900",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    },
    danger: {
      card: "bg-white border-rose-200/90 hover:border-rose-300 shadow-2xs",
      iconBg: "bg-rose-50 text-rose-700 border-rose-200",
      valueColor: "text-rose-950",
      badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    },
    primary: {
      card: "bg-white border-sky-200/90 hover:border-sky-300",
      iconBg: "bg-sky-50 text-sky-700 border-sky-200",
      valueColor: "text-slate-900",
      badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
    },
    warning: {
      card: "bg-white border-amber-200/90 hover:border-amber-300",
      iconBg: "bg-amber-50 text-amber-700 border-amber-200",
      valueColor: "text-slate-900",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    },
  };

  const current = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 shadow-xs ${
        current.card
      } ${onClick ? "cursor-pointer hover:shadow-md active:scale-[0.99]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight ${current.valueColor}`}>
              {value}
            </span>
            {badge && (
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wide ${current.badgeColor}`}
              >
                {badge}
              </span>
            )}
          </div>
        </div>

        <div
          className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${current.iconBg}`}
        >
          <Icon className="h-5 w-5 stroke-[2.2]" />
        </div>
      </div>

      {subtitle && (
        <p className="mt-3 text-[11px] font-medium text-slate-400 border-t border-slate-100 pt-2.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}