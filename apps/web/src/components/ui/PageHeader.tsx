import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  badge?: string;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  icon,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex gap-4">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl primary-gradient text-on-primary-fixed shadow-lg shadow-primary/25">
            {icon}
          </div>
        )}
        <div>
          {badge && (
            <span className="mb-2 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              {badge}
            </span>
          )}
          <h1 className="text-2xl font-black tracking-tight text-on-surface md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-on-surface-variant leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
