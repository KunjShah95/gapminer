import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "success" | "warning" | "error" | "info";

const tones: Record<Tone, string> = {
  default: "bg-surface-container-high text-on-surface-variant border-outline-variant/20",
  primary: "bg-primary/15 text-primary border-primary/30",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  error: "bg-error/15 text-error border-error/30",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

export default function Badge({
  children,
  tone = "default",
  className,
  title,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
