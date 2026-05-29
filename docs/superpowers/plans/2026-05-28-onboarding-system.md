# Onboarding System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 3-layer onboarding system: signup wizard, dashboard checklist, contextual tooltips.

**Architecture:** Zustand store (persisted to localStorage) tracks onboarding state. 3 React components render each layer. Backend gets optional profile fields on User. All components are lazily loaded.

**Tech Stack:** React 18, Zustand (persist middleware), TailwindCSS, React Router, Express.js / Prisma backend

---

## File Structure

### Files to create:

| File                                                         | Responsibility                                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `apps/web/src/stores/onboardingStore.ts`                     | Zustand store + localStorage persist for wizard/checklist/tooltip state |
| `apps/web/src/components/onboarding/OnboardingWizard.tsx`    | 3-step modal wizard                                                     |
| `apps/web/src/components/onboarding/OnboardingChecklist.tsx` | Dashboard sidebar checklist widget                                      |
| `apps/web/src/components/onboarding/OnboardingTooltip.tsx`   | Reusable inline tip banner                                              |

### Files to modify:

| File                                              | Change                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/web/src/pages/Dashboard.tsx:72-398`         | Import & render OnboardingWizard (trigger on first load), add OnboardingChecklist to sidebar |
| `apps/web/src/pages/AnalyzerPage.tsx`             | Add OnboardingTooltip                                                                        |
| `apps/web/src/pages/AnalysisResultsPage.tsx`      | Add OnboardingTooltip                                                                        |
| `apps/web/src/pages/RoadmapPage.tsx`              | Add OnboardingTooltip                                                                        |
| `apps/web/src/pages/InterviewSimulationPage.tsx`  | Add OnboardingTooltip                                                                        |
| `apps/web/src/pages/NegotiationCompanionPage.tsx` | Add OnboardingTooltip                                                                        |
| `apps/web/src/pages/JobTrackerPage.tsx`           | Add OnboardingTooltip                                                                        |
| `apps/web/src/pages/LinkedInOptimizerPage.tsx`    | Add OnboardingTooltip                                                                        |
| `apps/web/src/api/agent.ts`                       | Add profile update endpoint call                                                             |

---

### Task 1: Build OnboardingStore (Zustand)

**Files:**

- Create: `apps/web/src/stores/onboardingStore.ts`

**Details:** A Zustand store using `persist` middleware (same pattern as `authStore.ts`). Manages wizard completion, checklist steps, and dismissed tooltips.

- [ ] **Step 1: Create the store**

```ts
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
```

- [ ] **Step 2: Verify the store**

Run: `cd apps/web && npx tsc --noEmit --strict src/stores/onboardingStore.ts`
Expected: No type errors

---

### Task 2: Build OnboardingWizard Component

**Files:**

- Create: `apps/web/src/components/onboarding/OnboardingWizard.tsx`

**Details:** A 3-step modal dialog. Overlays the dashboard on first login. Each step is a slide. Backdrop click and "Skip" dismiss it permanently. On completion, sets `wizardCompleted: true`.

- [ ] **Step 1: Create the component scaffolding**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";

interface OnboardingWizardProps {
  open: boolean;
}

export default function OnboardingWizard({ open }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { completeWizard } = useOnboardingStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    currentRole: "",
    experienceLevel: "",
    targetRole: "",
    topSkills: "",
    linkedInUrl: "",
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSkip = () => {
    completeWizard();
  };

  const handleFinish = (action?: string) => {
    completeWizard();
    if (action === "analyze") navigate("/analyze");
    else if (action === "market") navigate("/market-demand");
    else if (action === "dashboard") {
      /* stay */
    }
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep((s) => s + 1);
    }
  };

  const saveProfile = async () => {
    try {
      const token = useAuthStore.getState().token;
      const body: Record<string, string> = {};
      if (profile.currentRole) body.currentRole = profile.currentRole;
      if (profile.experienceLevel)
        body.experienceLevel = profile.experienceLevel;
      if (profile.targetRole) body.targetRole = profile.targetRole;
      if (profile.topSkills) body.topSkills = profile.topSkills;
      if (profile.linkedInUrl) body.linkedInUrl = profile.linkedInUrl;
      if (Object.keys(body).length === 0) return;
      setSaving(true);
      await fetch("/api/v1/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      /* silent fail */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-container-high border border-outline-variant/20 rounded-[2.5rem] p-10 max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Step indicator dots */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-outline/20"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="text-center">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-2xl font-extrabold tracking-tighter mb-3 font-headline">
              Bridge your skills to market demand
            </h2>
            <p className="text-on-surface-variant font-light leading-relaxed mb-8">
              AI-powered analysis. Personalized roadmaps. Real-time market
              intelligence.
            </p>
            <div className="flex gap-4 justify-center mb-8">
              <div className="bg-surface-container rounded-2xl p-4 flex-1 max-w-[140px]">
                <div className="text-primary text-2xl font-black">93%</div>
                <div className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">
                  Match Accuracy
                </div>
              </div>
              <div className="bg-surface-container rounded-2xl p-4 flex-1 max-w-[140px]">
                <div className="text-primary text-2xl font-black">5K+</div>
                <div className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">
                  Roles Indexed
                </div>
              </div>
            </div>
            <button
              onClick={handleNext}
              className="primary-gradient text-on-primary-fixed px-8 py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-extrabold tracking-tighter mb-2 font-headline">
              Set up your profile
            </h2>
            <p className="text-on-surface-variant font-light text-sm mb-6">
              Help us personalize your analysis. You can skip or change these
              later.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  Current Role
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                  placeholder="e.g. Software Engineer"
                  value={profile.currentRole}
                  onChange={(e) =>
                    setProfile({ ...profile, currentRole: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  Experience Level
                </label>
                <select
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface"
                  value={profile.experienceLevel}
                  onChange={(e) =>
                    setProfile({ ...profile, experienceLevel: e.target.value })
                  }
                >
                  <option value="">Select level</option>
                  <option value="entry">Entry (0-2 years)</option>
                  <option value="mid">Mid (3-5 years)</option>
                  <option value="senior">Senior (6-9 years)</option>
                  <option value="lead">Lead (10+ years)</option>
                  <option value="exec">Executive</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  Target Role
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                  placeholder="e.g. Senior Software Engineer"
                  value={profile.targetRole}
                  onChange={(e) =>
                    setProfile({ ...profile, targetRole: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  Top Skills
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                  placeholder="React, Node.js, TypeScript"
                  value={profile.topSkills}
                  onChange={(e) =>
                    setProfile({ ...profile, topSkills: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  LinkedIn Profile URL
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={profile.linkedInUrl}
                  onChange={(e) =>
                    setProfile({ ...profile, linkedInUrl: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSkip}
                className="flex-1 glass border border-outline-variant/20 py-3.5 rounded-2xl font-bold text-sm hover:bg-surface-container-highest transition-all"
              >
                Skip
              </button>
              <button
                onClick={async () => {
                  await saveProfile();
                  handleNext();
                }}
                disabled={saving}
                className="flex-[2] primary-gradient text-on-primary-fixed py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-extrabold tracking-tighter mb-2 font-headline text-center">
              What would you like to do first?
            </h2>
            <p className="text-on-surface-variant font-light text-sm mb-8 text-center">
              Pick a starting point — you can always change later.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  handleFinish("analyze");
                }}
                className="w-full glass border border-outline-variant/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-higher transition-all text-left group"
              >
                <span className="text-2xl">📄</span>
                <div>
                  <div className="font-bold group-hover:text-primary transition-colors">
                    Upload resume &amp; run analysis
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    See how your skills match today's market
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleFinish("market")}
                className="w-full glass border border-outline-variant/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-higher transition-all text-left group"
              >
                <span className="text-2xl">🔍</span>
                <div>
                  <div className="font-bold group-hover:text-primary transition-colors">
                    Explore market demand
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    See which skills are trending in your field
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleFinish("dashboard")}
                className="w-full glass border border-outline-variant/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-higher transition-all text-left group"
              >
                <span className="text-2xl">🤷</span>
                <div>
                  <div className="font-bold group-hover:text-primary transition-colors">
                    Just show me the dashboard
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    I'll explore on my own
                  </div>
                </div>
              </button>
            </div>
            <div className="text-center mt-6">
              <button
                onClick={handleSkip}
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Skip tour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the component compiles**

Run: `cd apps/web && npx tsc --noEmit --strict src/components/onboarding/OnboardingWizard.tsx 2>&1 | head -20`
Expected: No type errors

---

### Task 3: Wire Wizard into Dashboard

**Files:**

- Modify: `apps/web/src/pages/Dashboard.tsx` (import + trigger)

**Details:** Import the wizard, show it when `wizardCompleted` is false and user has no analyses (first visit).

- [ ] **Step 1: Add imports and trigger in Dashboard**

Add to top of `Dashboard.tsx`:

```tsx
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useOnboardingStore } from "@/stores/onboardingStore";
```

Add state after `useEffect` (around line 101, before `const avgScore`):

```tsx
const { wizardCompleted, completeStep } = useOnboardingStore();
const showWizard = !wizardCompleted && !loading && analyses.length === 0;
```

- [ ] **Step 2: Render the wizard**

Add at the top of the return JSX (before the wrapper div, around line 111):

```tsx
<OnboardingWizard open={showWizard} />
```

- [ ] **Step 3: Mark checklist step 3 as complete when analyses exist**

After fetching analyses, if `analyses.length > 0`, mark step 3 complete:

Add inside the `fetchAnalyses` success block (around line 92, after `setAnalyses(data)`):

```tsx
if (data.length > 0) {
  completeStep(3);
}
```

---

### Task 4: Build OnboardingChecklist Component

**Files:**

- Create: `apps/web/src/components/onboarding/OnboardingChecklist.tsx`

**Details:** A sticky widget for the dashboard right sidebar. Shows 5 progressive steps. Each unlocked step has a CTA button. Completed steps show a checkmark.

- [ ] **Step 1: Create the component**

```tsx
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

  const allDone = completedSteps.length >= 5;

  return (
    <div className="glass bg-surface-container-high rounded-[2rem] border border-outline-variant/15 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          {allDone ? "✅" : "🚀"} Getting Started
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
```

- [ ] **Step 2: Verify the component compiles**

Run: `cd apps/web && npx tsc --noEmit --strict src/components/onboarding/OnboardingChecklist.tsx 2>&1 | head -20`
Expected: No type errors

---

### Task 5: Wire Checklist into Dashboard Sidebar

**Files:**

- Modify: `apps/web/src/pages/Dashboard.tsx`

- [ ] **Step 1: Import the checklist**

Add at top:

```tsx
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist";
```

- [ ] **Step 2: Render above profile card**

Inside the sidebar widgets div (around line 290, before the Profile Card):

```tsx
<OnboardingChecklist />
```

This goes right before the Profile Card (line 293 `<div className="glass bg-surface-container-high rounded-[2rem] ...">`).

---

### Task 6: Build OnboardingTooltip Component

**Files:**

- Create: `apps/web/src/components/onboarding/OnboardingTooltip.tsx`

**Details:** A reusable inline banner that shows once per page. Checked via `dismissedTooltips` in the store. Renders below the page title.

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Verify the component compiles**

Run: `cd apps/web && npx tsc --noEmit --strict src/components/onboarding/OnboardingTooltip.tsx 2>&1 | head -20`
Expected: No type errors

---

### Task 7: Add Tooltips to Target Pages

**Files:**

- Modify: `apps/web/src/pages/AnalyzerPage.tsx`
- Modify: `apps/web/src/pages/AnalysisResultsPage.tsx`
- Modify: `apps/web/src/pages/RoadmapPage.tsx`
- Modify: `apps/web/src/pages/InterviewSimulationPage.tsx`
- Modify: `apps/web/src/pages/NegotiationCompanionPage.tsx`
- Modify: `apps/web/src/pages/JobTrackerPage.tsx`
- Modify: `apps/web/src/pages/LinkedInOptimizerPage.tsx`

Each page gets the same pattern: import + render below the page heading.

- [ ] **Step 1: AnalyzerPage**

Add at top of `AnalyzerPage.tsx`:

```tsx
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
```

Add right after the opening `<div>` (usually after a title `<h1>` or similar):

```tsx
<OnboardingTooltip
  pageKey="analyze"
  icon="📄"
  title="Upload your resume"
  description="PDF or DOCX — we'll parse your skills, experience, and education automatically. Then paste a job URL to compare against."
/>
```

- [ ] **Step 2: AnalysisResultsPage**

Add import at top:

```tsx
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
```

Add after the page title:

```tsx
<OnboardingTooltip
  pageKey="results"
  icon="📊"
  title="Understanding your scores"
  description="The radar chart shows 8 dimensions. Green = strong match. Red = gap. Click any section to see course recommendations."
/>
```

- [ ] **Step 3: RoadmapPage**

Add import at top:

```tsx
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
```

Add after the page title:

```tsx
<OnboardingTooltip
  pageKey="roadmap"
  icon="🗺️"
  title="Your personalized upskilling plan"
  description="Milestones are ordered by impact. Complete each to unlock the next. Track progress with the checkboxes."
/>
```

- [ ] **Step 4: InterviewSimulationPage**

Add import at top:

```tsx
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
```

Add after the page title:

```tsx
<OnboardingTooltip
  pageKey="interview"
  icon="🎤"
  title="Practice with AI"
  description="Choose a role and difficulty. The AI will ask real interview questions and score your responses in real-time."
/>
```

- [ ] **Step 5: NegotiationCompanionPage**

Add import at top:

```tsx
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
```

Add after the page title:

```tsx
<OnboardingTooltip
  pageKey="negotiate"
  icon="💰"
  title="Research market salary data"
  description="View compensation benchmarks for your role and location. Practice your negotiation strategy."
/>
```

- [ ] **Step 6: JobTrackerPage**

Add import at top:

```tsx
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
```

Add after the page title:

```tsx
<OnboardingTooltip
  pageKey="jobs"
  icon="📋"
  title="Track your applications"
  description="Keep tabs on every job application. Update status, add notes, and never lose track of where you've applied."
/>
```

- [ ] **Step 7: LinkedInOptimizerPage**

Add import at top:

```tsx
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
```

Add after the page title:

```tsx
<OnboardingTooltip
  pageKey="linkedin"
  icon="🔗"
  title="Optimize your LinkedIn profile"
  description="Get AI-powered suggestions to improve your profile's visibility, headline, and experience section."
/>
```

---

### Task 8: Add Backend Profile Fields

**Files:**

- Modify: `apps/api/src/api/v1/endpoints/auth.js`

**Details:** The `PUT /api/v1/auth/me` endpoint already accepts name/avatar. Add support for the new onboarding fields.

- [ ] **Step 1: Update the PUT /me handler**

Find the `PUT /me` endpoint handler in `auth.js`. Add these fields to the update payload:

```js
// Inside the PUT /me handler, where it destructures the request body:
const {
  name,
  avatar,
  currentRole,
  experienceLevel,
  targetRole,
  topSkills,
  linkedInUrl,
} = req.body;

// Then include in the Prisma update call:
const updatedUser = await prisma.user.update({
  where: { id: req.user.id },
  data: {
    ...(name !== undefined && { name }),
    ...(avatar !== undefined && { avatar }),
    ...(currentRole !== undefined && { currentRole }),
    ...(experienceLevel !== undefined && { experienceLevel }),
    ...(targetRole !== undefined && { targetRole }),
    ...(topSkills !== undefined && { topSkills }),
    ...(linkedInUrl !== undefined && { linkedInUrl }),
  },
});
```

- [ ] **Step 2: Add fields to Prisma schema**

Open `apps/api/prisma/schema.prisma` and add to the User model:

```prisma
currentRole     String?
experienceLevel String?
targetRole      String?
topSkills       String?
linkedInUrl     String?
```

- [ ] **Step 3: Generate Prisma migration**

Run: `cd apps/api && npx prisma generate`

---

## Verification

Run: `cd apps/web && npm run build` — should pass with no errors.

Post-build checks:

1. Open `apps/web/src/stores/onboardingStore.ts` — confirms Zustand store exists
2. Open `apps/web/src/components/onboarding/OnboardingWizard.tsx` — confirms component
3. Open `apps/web/src/components/onboarding/OnboardingChecklist.tsx` — confirms component
4. Open `apps/web/src/components/onboarding/OnboardingTooltip.tsx` — confirms component
5. Verify tooltip pageKeys all unique (analyze, results, roadmap, interview, negotiate, jobs, linkedin)
6. Verify checklist step progression logic (step 1 always unlocked, step N unlocks when N-1 complete)
