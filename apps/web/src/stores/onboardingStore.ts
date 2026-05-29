import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface OnboardingState {
  wizardCompleted: boolean;
  checklistDismissed: boolean;
  completedSteps: OnboardingStep[];
  dismissedTooltips: string[];
  completeWizard: () => void;
  completeStep: (step: OnboardingStep) => void;
  dismissChecklist: () => void;
  dismissTooltip: (pageKey: string) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      wizardCompleted: false,
      checklistDismissed: false,
      completedSteps: [],
      dismissedTooltips: [],
      completeWizard: () => set({ wizardCompleted: true }),
      completeStep: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),
      dismissChecklist: () => set({ checklistDismissed: true }),
      dismissTooltip: (pageKey) =>
        set((state) => ({
          dismissedTooltips: state.dismissedTooltips.includes(pageKey)
            ? state.dismissedTooltips
            : [...state.dismissedTooltips, pageKey],
        })),
      resetOnboarding: () =>
        set({
          wizardCompleted: false,
          checklistDismissed: false,
          completedSteps: [],
          dismissedTooltips: [],
        }),
    }),
    { name: "gapminer-onboarding" },
  ),
);
