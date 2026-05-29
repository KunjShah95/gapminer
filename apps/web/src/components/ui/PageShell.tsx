import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "full";
  noPadding?: boolean;
}

const maxMap = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
  "2xl": "max-w-[90rem]",
  full: "max-w-full",
};

export default function PageShell({
  children,
  className,
  maxWidth = "xl",
  noPadding = false,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "flex-1 w-full mesh-bg animate-fade-in",
        !noPadding && "p-6 md:p-8 lg:p-10",
        className,
      )}
    >
      <div className={cn("mx-auto w-full", maxMap[maxWidth])}>{children}</div>
    </div>
  );
}
