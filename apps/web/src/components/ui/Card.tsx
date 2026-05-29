import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const pad = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className,
  padding = "md",
  hover = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "glass-card",
        pad[padding],
        hover &&
          "transition-all duration-300 hover:border-primary/25 hover:shadow-primary/10",
        className,
      )}
    >
      {children}
    </div>
  );
}
