# Phase 1: Foundation & Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship foundation improvements: dark mode, code splitting, skeletons, error boundaries, test infrastructure, CI/CD enhancements, and mobile responsiveness.

**Architecture:** 7 independent tasks — each touching different parts of the codebase. No shared state or sequential dependencies. Can be worked in parallel.

**Tech Stack:** React 18, Vite 5, Zustand 5, Tailwind 3, Vitest (to add), GitHub Actions

---

### Task 1: Dark Mode Theme Store & Toggle

**Files:**
- Create: `apps/web/src/stores/themeStore.ts`
- Create: `apps/web/src/components/ThemeToggle.tsx`
- Modify: `apps/web/src/layouts/AppLayout.tsx:364`
- Modify: `apps/web/src/index.html` (or root load)

- [ ] **Step 1: Create theme store**

```ts
// apps/web/src/stores/themeStore.ts
import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("gapminer-theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialTheme();
  applyTheme(initial);

  return {
    theme: initial,
    setTheme: (theme) => {
      localStorage.setItem("gapminer-theme", theme);
      applyTheme(theme);
      set({ theme });
    },
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === "light" ? "dark" : "light";
        localStorage.setItem("gapminer-theme", next);
        applyTheme(next);
        return { theme: next };
      }),
  };
});
```

- [ ] **Step 2: Create ThemeToggle component**

```tsx
// apps/web/src/components/ThemeToggle.tsx
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/15 text-outline hover:text-primary transition-colors"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <Sun
        size={16}
        className={cn(
          "absolute transition-all duration-300",
          theme === "dark" ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      />
      <Moon
        size={16}
        className={cn(
          "absolute transition-all duration-300",
          theme === "light" ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      />
    </button>
  );
}
```

- [ ] **Step 3: Add ThemeToggle to AppLayout header**

Find in `apps/web/src/layouts/AppLayout.tsx` around line 364:
```tsx
<div className="flex items-center gap-3">
  <NotificationsDropdown />
```
Replace with:
```tsx
<div className="flex items-center gap-3">
  <ThemeToggle />
  <NotificationsDropdown />
```

Add import:
```tsx
import ThemeToggle from "@/components/ThemeToggle";
```

- [ ] **Step 4: Verify dark mode works**

Run: `npm run dev --filter=@gapminer/web`
Expected: Toggle icon switches between sun/moon, `dark` class toggles on `<html>`, Tailwind `dark:` classes activate.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/themeStore.ts apps/web/src/components/ThemeToggle.tsx apps/web/src/layouts/AppLayout.tsx
git commit -m "feat: dark mode theme store with toggle UI"
```

---

### Task 2: Route-Level Code Splitting

**Files:**
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Convert all protected routes to lazy imports**

Replace all static page imports with `React.lazy()`:

```tsx
// apps/web/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { useAuthStore, initializeAuth } from "@/stores/authStore";
import ErrorBoundary from "@/components/ErrorBoundary";
import PublicLayout from "@/components/public/PublicLayout";

// Eager (above-fold) — these are small/entry pages
import LandingPage from "@/pages/LandingPage";
import AboutPage from "@/pages/AboutPage";
import FeaturesPage from "@/pages/FeaturesPage";
import AuthPage from "@/pages/AuthPage";

// Lazy (below-fold) — code-split into separate chunks
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AnalysisResultsPage = lazy(() => import("@/pages/AnalysisResultsPage"));
const AnalyzerPage = lazy(() => import("@/pages/AnalyzerPage"));
const RoadmapPage = lazy(() => import("@/pages/RoadmapPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const LatexEditorPage = lazy(() => import("@/pages/LatexEditorPage"));
const InterviewSimulationPage = lazy(() => import("@/pages/InterviewSimulationPage"));
const RecruiterDashboardPage = lazy(() => import("@/pages/RecruiterDashboardPage"));
const NegotiationCompanionPage = lazy(() => import("@/pages/NegotiationCompanionPage"));
const CoverLetterPage = lazy(() => import("@/pages/CoverLetterPage"));
const JobTrackerPage = lazy(() => import("@/pages/JobTrackerPage"));
const SkillProgressPage = lazy(() => import("@/pages/SkillProgressPage"));
const LinkedInOptimizerPage = lazy(() => import("@/pages/LinkedInOptimizerPage"));
const ResumeVersionsPage = lazy(() => import("@/pages/ResumeVersionsPage"));
const BenchmarkPage = lazy(() => import("@/pages/BenchmarkPage"));
const NegotiationRoleplayPage = lazy(() => import("@/pages/NegotiationRoleplayPage"));
const RecommendationsPage = lazy(() => import("@/pages/RecommendationsPage"));
const MarketDemandPage = lazy(() => import("@/pages/MarketDemandPage"));
const CareerPathPage = lazy(() => import("@/pages/CareerPathPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const DeveloperPortalPage = lazy(() => import("@/pages/DeveloperPortalPage"));
```

- [ ] **Step 2: Create a SuspensePage wrapper**

```tsx
// apps/web/src/components/SuspensePage.tsx
import { Suspense } from "react";

export default function SuspensePage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
```

- [ ] **Step 3: Wrap lazy routes with SuspensePage**

In `App.tsx`, wrap each lazy-loaded route component:

```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <SuspensePage><Dashboard /></SuspensePage>
    </ProtectedRoute>
  }
/>
```

Apply same pattern to ALL lazy-loaded route elements (DON'T wrap LandingPage, FeaturesPage, AboutPage, AuthPage — they're eager).

- [ ] **Step 4: Verify build output**

Run: `cd apps/web && npx vite build`
Expected: Multiple JS chunks generated instead of one giant bundle. Check `dist/assets/` for chunk files.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/components/SuspensePage.tsx
git commit -m "perf: route-level code splitting with lazy imports"
```

---

### Task 3: Skeleton Loading States

**Note:** Skeleton primitives already exist at `apps/web/src/components/skeletons/SkeletonPrimitives.tsx`. Also: `DashboardSkeleton.tsx`, `SignUpSkeleton.tsx`, `SignInSkeleton.tsx`. This task wires them into the actual pages that currently show bare spinners.

**Files:**
- Create: `apps/web/src/components/skeletons/SkeletonPages.tsx` (additional page skeletons)
- Modify: each data-fetching page to show skeleton while loading

- [ ] **Step 1: Create additional page skeleton components**

```tsx
// apps/web/src/components/skeletons/SkeletonPages.tsx
import {
  Skeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonList,
  SkeletonChart,
  SkeletonTable,
} from "./SkeletonPrimitives";

export function AnalysisResultsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard><Skeleton className="h-24 w-full" /></SkeletonCard>
        <SkeletonCard><Skeleton className="h-24 w-full" /></SkeletonCard>
        <SkeletonCard><Skeleton className="h-24 w-full" /></SkeletonCard>
      </div>
      <SkeletonChart />
      <SkeletonTable rows={4} />
    </div>
  );
}

export function RoadmapSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-72" />
      <SkeletonCard>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
      <SkeletonCard>
        <SkeletonText lines={4} />
      </SkeletonCard>
    </div>
  );
}

export function JobTrackerSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-56" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <SkeletonList count={5} />
    </div>
  );
}

export function MarketDemandSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i}><Skeleton className="h-20 w-full" /></SkeletonCard>
        ))}
      </div>
      <SkeletonChart />
    </div>
  );
}
```

- [ ] **Step 2: Wire skeleton into AnalysisResultsPage**

In `apps/web/src/pages/AnalysisResultsPage.tsx`, find the loading state and import/replace with:

```tsx
import { AnalysisResultsSkeleton } from "@/components/skeletons/SkeletonPages";

// Replace the existing loading spinner with:
if (loading) return <AnalysisResultsSkeleton />;
```

- [ ] **Step 3: Wire skeleton into RoadmapPage**

```tsx
import { RoadmapSkeleton } from "@/components/skeletons/SkeletonPages";

// Replace loading spinner:
if (loading) return <RoadmapSkeleton />;
```

- [ ] **Step 4: Wire skeleton into CareerPathPage, BenchmarkPage**

```tsx
import { AnalysisResultsSkeleton } from "@/components/skeletons/SkeletonPages";

// CareerPathPage: replace Loader2 spinner
if (loading) return <AnalysisResultsSkeleton />;

// BenchmarkPage: replace Loader2 spinner
if (loading) return <AnalysisResultsSkeleton />;
```

- [ ] **Step 5: Wire skeleton into JobTrackerPage**

```tsx
import { JobTrackerSkeleton } from "@/components/skeletons/SkeletonPages";

// Replace inline Loader2:
if (loading) return <JobTrackerSkeleton />;
```

- [ ] **Step 6: Wire skeleton into MarketDemandPage**

```tsx
import { MarketDemandSkeleton } from "@/components/skeletons/SkeletonPages";

// Replace inline loader:
if (loading) return <MarketDemandSkeleton />;
```

- [ ] **Step 7: Wire DashboardSkeleton into Dashboard**

```tsx
// apps/web/src/pages/Dashboard.tsx
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

// Replace inline animate-pulse placeholders:
if (loading) return <DashboardSkeleton />;
```

- [ ] **Step 8: Wire skeletons into remaining pages (ProfilePage, ResumeVersionsPage, RecommendationsPage, AdminDashboardPage, DeveloperPortalPage)**

Each page that shows a spinner during initial load: replace with an appropriate skeleton from `SkeletonPages.tsx` or `SkeletonPrimitives.tsx`.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/components/skeletons/SkeletonPages.tsx apps/web/src/pages/
git commit -m "feat: skeleton loading states for all data pages"
```

---

### Task 4: Custom Error Boundary Fallbacks

**Note:** `ErrorBoundary` component exists at `apps/web/src/components/ErrorBoundary.tsx` and wraps `ProtectedRoute` in `App.tsx`. This task adds custom fallbacks for key pages.

**Files:**
- Modify: `apps/web/src/components/ErrorBoundary.tsx` (add error type differentiation)
- Modify: `apps/web/src/App.tsx` (wrap individual routes with page-specific fallbacks)

- [ ] **Step 1: Enhance ErrorBoundary to support error type prop**

The current ErrorBoundary already accepts `fallback` prop. We need page-specific fallbacks for key routes.

Create fallback component:

```tsx
// apps/web/src/components/ErrorFallbacks.tsx
import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw, Home, FileText, BarChart3 } from "lucide-react";

export function AnalysisErrorFallback() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
        <BarChart3 size={32} className="text-error" />
      </div>
      <h2 className="mb-2 text-xl font-black text-on-surface">Analysis Load Failed</h2>
      <p className="mb-6 text-sm text-on-surface-variant text-center max-w-md">
        We couldn't load your analysis results. This may be a temporary issue.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary-fixed"
        >
          <RefreshCw size={16} />
          Retry
        </button>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/25 px-6 py-3 text-sm font-bold text-on-surface"
        >
          <Home size={16} />
          Dashboard
        </Link>
      </div>
    </div>
  );
}

export function ChatErrorFallback() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
        <AlertCircle size={32} className="text-error" />
      </div>
      <h2 className="mb-2 text-xl font-black text-on-surface">Chat Unavailable</h2>
      <p className="mb-6 text-sm text-on-surface-variant text-center max-w-md">
        The AI chat service is currently unavailable. The Ollama model may need to be restarted.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary-fixed"
      >
        <RefreshCw size={16} />
        Retry
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Apply custom fallbacks in App.tsx**

For key pages, pass the custom fallback:

```tsx
import { AnalysisErrorFallback, ChatErrorFallback } from "@/components/ErrorFallbacks";

// Analysis results:
<ProtectedRoute>
  <ErrorBoundary fallback={<AnalysisErrorFallback />}>
    <SuspensePage><AnalysisResultsPage /></SuspensePage>
  </ErrorBoundary>
</ProtectedRoute>

// Chat:
<ProtectedRoute>
  <ErrorBoundary fallback={<ChatErrorFallback />}>
    <SuspensePage><ChatPage /></SuspensePage>
  </ErrorBoundary>
</ProtectedRoute>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ErrorFallbacks.tsx apps/web/src/App.tsx
git commit -m "feat: custom error boundary fallbacks per page"
```

---

### Task 5: Add Vitest & Component Tests

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/components/ui/__tests__/Badge.test.tsx`
- Create: `apps/web/src/setupTests.ts`

- [ ] **Step 1: Install vitest and testing libraries**

```bash
npm install --save-dev -w apps/web vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Create vitest config**

```ts
// apps/web/vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    css: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Create test setup**

```ts
// apps/web/src/setupTests.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Add test script to package.json**

In `apps/web/package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Write first component test**

```tsx
// apps/web/src/components/ui/__tests__/Badge.test.tsx
import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders with text", () => {
    render(<Badge>Pro</Badge>);
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("applies tone variant classes", () => {
    const { container } = render(<Badge tone="primary">Admin</Badge>);
    expect(container.firstChild).toHaveClass("bg-primary");
  });

  it("renders with dot when showDot is true", () => {
    const { container } = render(<Badge showDot>Online</Badge>);
    expect(container.querySelector(".bg-emerald-400")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run tests to verify**

Run: `npm run test -w apps/web`
Expected: Tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/package.json apps/web/vitest.config.ts apps/web/src/setupTests.ts apps/web/src/components/ui/__tests__/
git commit -m "test: add vitest with component test infrastructure"
```

---

### Task 6: CI/CD — Add Tests & Typecheck

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add test and typecheck jobs to CI**

Append to `.github/workflows/ci.yml` after `build-web` job:

```yaml
  test-web:
    name: Test Web
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
          cache-dependency-path: apps/web/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: apps/web

      - name: Run tests
        run: npx vitest run
        working-directory: apps/web

  typecheck-web:
    name: TypeCheck Web
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
          cache-dependency-path: apps/web/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: apps/web

      - name: TypeScript check
        run: npx tsc --noEmit
        working-directory: apps/web
```

Add `test-web` and `typecheck-web` to `build-docker` needs:
```yaml
  build-docker:
    needs: [build-api, build-web, test-web, typecheck-web]
```

- [ ] **Step 2: Add root-level workflow dispatch test**

Create `.github/workflows/test.yml` for on-demand full test suite:

```yaml
name: Test Suite

on:
  workflow_dispatch:

jobs:
  test-web:
    name: Test Web
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: apps/web/package-lock.json
      - run: npm ci
        working-directory: apps/web
      - run: npx vitest run
        working-directory: apps/web

  typecheck-web:
    name: TypeCheck Web
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: apps/web/package-lock.json
      - run: npm ci
        working-directory: apps/web
      - run: npx tsc --noEmit
        working-directory: apps/web
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/
git commit -m "ci: add test and typecheck jobs to CI workflow"
```

---

### Task 7: Mobile Responsiveness Audit & Fixes

**Note:** This is an audit-driven task. First run a systematic check, then fix the most impactful issues.

**Files:**
- Modify: various page `.tsx` files
- Modify: `apps/web/src/layouts/AppLayout.tsx`

- [ ] **Step 1: Run a structured audit**

Create `docs/superpowers/audit/2026-06-12-mobile-audit.md` with a checklist:

```markdown
# Mobile Responsiveness Audit

Pages to check:
- [ ] LandingPage — hero section, feature cards, CTA
- [ ] AuthPage — form on small screens
- [ ] Dashboard — stat grid, recent activity, chart
- [ ] AnalyzerPage — file upload, JD input
- [ ] AnalysisResultsPage — score cards, gap list, radar chart
- [ ] RoadmapPage — timeline, milestone cards
- [ ] JobTrackerPage — kanban columns, list view
- [ ] ChatPage — message bubbles, input area
- [ ] ProfilePage — settings form
- [ ] LatexEditorPage — editor + preview
- [ ] RecruiterDashboardPage — candidate grid
- [ ] AdminDashboardPage — stats grid, user table
- [ ] PricingPage — plan cards
```

Test each at 375px width. Note fixes needed.

- [ ] **Step 2: Fix common mobile issues**

Common fixes across pages:

1. **Grid overflows**: Replace fixed-width grids with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` responsive grids
2. **Horizontal scroll**: Add `overflow-x-auto` to table containers, or switch to card layout on mobile
3. **Tiny touch targets**: Ensure buttons/links are minimum 44x44px
4. **Sidebar**: Already has mobile sidebar with overlay (in AppLayout). Verify it works.

- [ ] **Step 3: Fix sidebar drawer**

Check that the mobile sidebar in `AppLayout.tsx`:
- Closes on navigation (it already calls `onNavigate`)
- Has proper backdrop blur
- Scrolls properly on long content

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/audit/ apps/web/src/
git commit -m "fix: mobile responsiveness audit and fixes"
```

---

## Self-Review Checklist

1. **Spec coverage:** Does each item from Phase 1 have a corresponding task?
   - #12 (dark mode) → Task 1 ✓
   - #20 (first-load perf) → Task 2 ✓
   - #15 (skeletons) → Task 3 ✓
   - #16 (error boundaries) → Task 4 ✓
   - #3 (test suite) → Task 5 ✓
   - #4 (CI/CD) → Task 6 ✓
   - #14 (mobile audit) → Task 7 ✓

2. **Placeholder scan:** No TODOs, TBDs, or vague "add appropriate handling" patterns.

3. **Type consistency:** Imports and component names are consistent across tasks.

4. **Scope check:** 7 focused, independent tasks. Each produces working, testable software.
