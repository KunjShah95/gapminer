import { Link } from "react-router-dom";
import { useOnboardingStore, OnboardingStep } from "@/stores/onboardingStore";

interface ChecklistItem {
  step: OnboardingStep;
  label: string;
  description: string;
  link: string;
}

const ITEMS: ChecklistItem[] = [
  {
    step: 1,
    label: "Complete your profile",
    description: "Add skills & target role",
    link: "/profile",
  },
  {
    step: 2,
    label: "Upload your first resume",
    description: "PDF or DOCX supported",
    link: "/analyze",
  },
  {
    step: 3,
    label: "Run your first analysis",
    description: "Match skills to market",
    link: "/analyze",
  },
  {
    step: 4,
    label: "View your skill roadmap",
    description: "Personalized upskilling plan",
    link: "/roadmap",
  },
  {
    step: 5,
    label: "Explore career tools",
    description: "Job tracker, interview sim & more",
    link: "/dashboard",
  },
];

function isStepUnlocked(
  step: OnboardingStep,
  completedSteps: OnboardingStep[],
): boolean {
  if (step === 1) return true;
  return completedSteps.includes((step - 1) as OnboardingStep);
}

export default function OnboardingChecklist() {
  const { completedSteps, checklistDismissed, dismissChecklist, completeStep } =
    useOnboardingStore();

  if (checklistDismissed || completedSteps.length >= 5) return null;

  return (
    <div className="glass bg-surface-container-high rounded-[2rem] border border-outline-variant/15 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          🚀 Getting Started
        </h3>
        <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold">
          {completedSteps.length} / 5
        </span>
      </div>

      <div className="space-y-3">
        {ITEMS.map((item) => {
          const done = completedSteps.includes(item.step);
          const unlocked = isStepUnlocked(item.step, completedSteps);

          return (
            <div
              key={item.step}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                done
                  ? "bg-surface-container opacity-60"
                  : unlocked
                    ? "bg-surface-container border border-primary/20"
                    : "bg-surface-container opacity-40"
              }`}
            >
              {done ? (
                <div className="w-6 h-6 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary text-xs font-bold shrink-0">
                  ✓
                </div>
              ) : (
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                    unlocked
                      ? "border-primary text-primary"
                      : "border-outline/30 text-outline/30"
                  }`}
                >
                  {item.step}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs font-bold truncate ${
                    done
                      ? "text-on-surface-variant line-through"
                      : "text-on-surface"
                  }`}
                >
                  {item.label}
                </div>
                <div className="text-[10px] text-outline truncate">
                  {item.description}
                </div>
              </div>
              {unlocked && !done && (
                <Link
                  to={item.link}
                  onClick={() => completeStep(item.step)}
                  className="bg-primary text-on-primary-fixed text-[10px] font-bold px-3 py-1.5 rounded-lg shrink-0 hover:bg-primary/90 transition-all"
                >
                  {item.step === 3 ? "Start" : "Go"}
                </Link>
              )}
              {!unlocked && !done && (
                <span className="text-outline/30 text-xs">🔒</span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={dismissChecklist}
        className="w-full mt-4 text-[10px] text-outline hover:text-primary transition-colors text-center font-bold uppercase tracking-widest"
      >
        Hide checklist
      </button>
    </div>
  );
}
