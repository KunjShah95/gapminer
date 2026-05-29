import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Card from "./Card";

export default function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  return (
    <Card padding="md" className={cn("relative overflow-hidden", className)}>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full primary-gradient opacity-10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
            {label}
          </p>
          <p className="mt-1 text-3xl font-black tracking-tight text-on-surface">
            {value}
          </p>
          {sub && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend === "up" && "text-emerald-400",
                trend === "down" && "text-error",
                !trend && "text-on-surface-variant",
              )}
            >
              {sub}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
