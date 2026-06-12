import { cn } from "@/lib/utils";
import { FileText, Palette, Feather, Zap } from "lucide-react";

const TEMPLATES = [
  { id: "modern", name: "Modern", icon: FileText, description: "Clean sans-serif with blue accents" },
  { id: "classic", name: "Classic", icon: Palette, description: "Traditional serif layout" },
  { id: "minimal", name: "Minimal", icon: Feather, description: "Simple monochrome design" },
  { id: "creative", name: "Creative", icon: Zap, description: "Bold colors, modern style" },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

interface Props {
  selected: TemplateId;
  onSelect: (id: TemplateId) => void;
}

const templateStyles: Record<TemplateId, string> = {
  modern: "border-primary/40 bg-primary/5",
  classic: "border-amber-600/40 bg-amber-50/10",
  minimal: "border-gray-400/40 bg-gray-100/10",
  creative: "border-fuchsia-500/40 bg-fuchsia-50/10",
};

const templateDot: Record<TemplateId, string> = {
  modern: "bg-primary",
  classic: "bg-amber-600",
  minimal: "bg-gray-400",
  creative: "bg-fuchsia-500",
};

export default function ResumeTemplatePicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TEMPLATES.map((t) => {
        const Icon = t.icon;
        const isActive = selected === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              "relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
              isActive
                ? cn(templateStyles[t.id], "shadow-sm")
                : "border-outline-variant/20 bg-surface-container-low hover:border-outline-variant/40",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                isActive ? cn(templateDot[t.id], "text-white") : "bg-surface-container-high text-outline",
              )}
            >
              <Icon size={18} />
            </div>
            <div>
              <p className={cn("text-sm font-bold", isActive ? "text-on-surface" : "text-on-surface")}>
                {t.name}
              </p>
              <p className="text-[10px] text-on-surface-variant">{t.description}</p>
            </div>
            {isActive && (
              <div className={cn("absolute right-2 top-2 h-2 w-2 rounded-full", templateDot[t.id])} />
            )}
          </button>
        );
      })}
    </div>
  );
}
