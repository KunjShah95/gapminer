import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/stores/onboardingStore";

interface OnboardingTooltipProps {
  pageKey: string;
  icon?: string;
  title: string;
  description: string;
}

export default function OnboardingTooltip({
  pageKey,
  icon = "💡",
  title,
  description,
}: OnboardingTooltipProps) {
  const { dismissedTooltips, dismissTooltip } = useOnboardingStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!dismissedTooltips.includes(pageKey)) {
      setVisible(true);
    }
  }, [pageKey, dismissedTooltips]);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    dismissTooltip(pageKey);
  };

  return (
    <div className="glass bg-surface-container-high border border-primary/20 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm mb-1">{title}</div>
        <div className="text-xs text-on-surface-variant leading-relaxed">
          {description}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-bold px-4 py-2 rounded-xl shrink-0"
      >
        Got it
      </button>
    </div>
  );
}
