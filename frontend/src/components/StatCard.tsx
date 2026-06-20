import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "border border-border/60 bg-card hover:border-border/90 hover:bg-muted/50 transition-all duration-300",
  success: "border border-success/30 bg-success/5 hover:border-success/40 hover:bg-success/10 dark:border-success/30 dark:bg-success/5",
  warning: "border border-warning/30 bg-warning/5 hover:border-warning/40 hover:bg-warning/10 dark:border-warning/30 dark:bg-warning/5",
  destructive: "border border-destructive/30 bg-destructive/5 hover:border-destructive/40 hover:bg-destructive/10 dark:border-destructive/30 dark:bg-destructive/5",
};

const iconColors = {
  default: "text-primary bg-primary/10 hover:bg-primary/20",
  success: "text-success bg-success/20 hover:bg-success/30",
  warning: "text-warning bg-warning/20 hover:bg-warning/30",
  destructive: "text-destructive bg-destructive/20 hover:bg-destructive/30",
};

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, variant = "default" }: StatCardProps) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-0.5 ",
      variantStyles[variant]
    )}
  >
    {/* Background visual highlight */}
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />

    <div className="flex items-start justify-between relative z-10">
      <div className="space-y-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold tracking-tight mt-1">{value}</p>

        {subtitle && (
          <p className="text-xs text-muted-foreground/80 mt-1 font-medium">{subtitle}</p>
        )}

        {trendValue && (
          <div className="flex items-center gap-1 mt-3">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide capitalize",
                trend === "up" && "bg-success/15 text-success",
                trend === "down" && "bg-destructive/15 text-destructive",
                trend === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          </div>
        )}
      </div>

      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center shadow-inner shrink-0 transition-transform duration-300 group-hover:scale-110",
          iconColors[variant === "default" ? "default" : variant]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);