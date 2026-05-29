# Onboarding System Design

**Date:** 2026-05-28
**Status:** Approved
**Group:** A (Onboarding & First-Run Experience)

## Problem

After signup, users land on an empty dashboard with no guidance. Key gaps:

1. No welcome wizard after first login
2. No profile completion prompt (skills, experience, target role)
3. No guided first analysis experience
4. Dashboard empty state is minimal text with no illustration

## Solution: 3-Layer Onboarding System

### Layer 1: Signup Wizard

A 3-step modal triggered once, immediately after first login (rendered as a modal overlay on the dashboard).

**Trigger:** User navigates to `/dashboard` for the first time and `localStorage` key `wizard-completed` is not set.

**Step 1 — Welcome + Value Prop**

- Hero illustration/message: "Bridge your skills to market demand"
- Key stats (Match Accuracy 93%, 5K+ Roles Indexed)
- "Get Started" CTA button

**Step 2 — Profile Setup**
Fields (all optional, can skip):

- Current Role (text input)
- Experience Level (select: Entry / Mid / Senior / Lead / Exec)
- Target Role (text input)
- Top Skills (comma-separated text input)
- LinkedIn URL (optional text input)
- "Continue" button or "Skip" link

**Step 3 — First Action Chooser**
"Pick where to start:" cards:

- "Upload resume & run analysis" → navigates to `/analyze`
- "Explore market demand" → navigates to `/market-demand`
- "View sample dashboard" → stays on dashboard, shows sample data
- "Just show me the dashboard" → dismisses wizard

**Dismissal:**

- "Skip" link available on every step
- Clicking outside modal dark overlay closes it
- Once dismissed, it never reappears
- Re-activatable from Profile page settings

### Layer 2: Dashboard Checklist

A persistent widget in the dashboard right sidebar, above the profile card.

**Steps (progressive unlock):**

| #   | Step                     | Unlock condition   | Action                                        |
| --- | ------------------------ | ------------------ | --------------------------------------------- |
| 1   | Complete your profile    | Always available   | Opens profile modal / navigates to `/profile` |
| 2   | Upload your first resume | Step 1 done        | Navigates to `/analyze`                       |
| 3   | Run your first analysis  | Resume uploaded    | Links to analysis flow                        |
| 4   | View your skill roadmap  | Analysis complete  | Links to `/roadmap/:id`                       |
| 5   | Explore career tools     | Any 1 tool visited | Links to tools list                           |

**States:**

- **Locked** (greyed, with lock icon) — previous step not completed
- **Active** (highlighted, with CTA button) — ready to complete
- **Completed** (green check, strikethrough text) — done

**Behavior:**

- Progress is checked on page load via API (profile exists? resume exists? analyses exist?)
- Auto-dismisses when all 5 steps are complete
- State persisted in localStorage so dismissed state survives refresh
- Re-activatable from Profile settings page

### Layer 3: Contextual Tooltips

One-time inline banners that appear on first visit to each major page. Not floating popovers — positioned inline below the relevant UI section.

**Pages covered:**

- `/analyze` — "Upload your resume. PDF or DOCX supported..."
- `/results/:id` — "Understanding your scores. The radar chart..."
- `/roadmap/:id` — "Your personalized upskilling plan..."
- `/interview` — "Practice with AI. Choose a role and difficulty..."
- `/negotiate` — "Research market salary data..."
- `/jobs` — "Track your job applications..."
- `/linkedin` — "Optimize your LinkedIn profile..."

**Component spec:**

```tsx
interface OnboardingTooltipProps {
  pageKey: string; // unique key for localStorage check
  message: string; // heading text
  description: string; // body text
  icon?: string; // emoji icon
  placement?: "inline" | "below-title";
}
```

**Behavior:**

- Checks `localStorage` key `tooltip-{pageKey}-dismissed` on mount
- Shows banner if key not set
- "Got it" button fades banner out and sets localStorage key
- One-time only per page

## Implementation Order

1. **OnboardingChecklist component** + integrate into Dashboard sidebar
2. **OnboardingWizard component** (3-step modal) + integrate into `/dashboard`
3. **OnboardingTooltip component** + integrate into target pages
4. **Backend profile fields** if needed (current role, experience level, target role, top skills)

## Files to Create/Modify

### New components:

- `apps/web/src/components/onboarding/OnboardingWizard.tsx` — 3-step modal
- `apps/web/src/components/onboarding/OnboardingChecklist.tsx` — dashboard checklist widget
- `apps/web/src/components/onboarding/OnboardingTooltip.tsx` — reusable inline tooltip

### Modified files:

- `apps/web/src/pages/Dashboard.tsx` — integrate checklist into sidebar, trigger wizard on first load
- `apps/web/src/pages/AnalyzerPage.tsx` — add tooltip
- `apps/web/src/pages/AnalysisResultsPage.tsx` — add tooltip
- `apps/web/src/pages/RoadmapPage.tsx` — add tooltip
- `apps/web/src/pages/InterviewSimulationPage.tsx` — add tooltip
- `apps/web/src/pages/NegotiationCompanionPage.tsx` — add tooltip
- `apps/web/src/pages/JobTrackerPage.tsx` — add tooltip
- `apps/web/src/pages/LinkedInOptimizerPage.tsx` — add tooltip
- `apps/web/src/stores/onboardingStore.ts` — new Zustand store for onboarding state

## Data Model

Local state (Zustand + localStorage persist):

```typescript
interface OnboardingState {
  wizardCompleted: boolean;
  checklistDismissed: boolean;
  completedSteps: number[]; // [1, 2, 3, 4, 5]
  dismissedTooltips: string[]; // ['analyze', 'results', 'roadmap', ...]
}
```

**Profile "complete" check:** A profile is considered "complete" (for checklist Step 1) when at least one of `currentRole`, `experienceLevel`, `targetRole`, or `topSkills` is filled, OR the user uploaded a resume.

Backend (optional profile fields on User model):

- `currentRole: string`
- `experienceLevel: string` // entry | mid | senior | lead | exec
- `targetRole: string`
- `topSkills: string`

These are sent via `PUT /api/v1/auth/me` and stored on the User record.

## Verification Criteria

1. New user signs up → redirected to dashboard → wizard appears
2. Filling wizard Step 2 saves profile fields to backend
3. Choosing an action in Step 3 navigates correctly
4. Skipping wizard → dismissed permanently
5. Dashboard checklist shows locked/unlocked states correctly
6. Completing step 1 unlocks step 2, etc.
7. All 5 steps done → checklist auto-dismisses
8. First visit to `/analyze` shows tooltip banner → "Got it" dismisses permanently
9. Refreshing page preserves all dismissal states
10. Tooltip on `/analyze` doesn't reappear after dismissal
