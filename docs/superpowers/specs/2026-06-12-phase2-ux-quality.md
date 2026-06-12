# Phase 2: UX Quality

## Overview

Four independent features to polish the user experience: dashboard improvements, search/filter, export/sharing, and keyboard shortcuts.

## Approach: Independent Features

Each item is built as a self-contained feature with no shared infrastructure. Implementation order doesn't matter — they can be parallelized.

---

## 1. Dashboard Polish

### Charts & Visualizations

- **Skill Growth chart** — Recharts line chart showing skill proficiency over time. Placed under stat cards. Data aggregated client-side from existing analysis history.
- **Analysis History chart** — Simple bar chart showing analyses completed per week.
- Both use existing `Analysis[]` data from the API endpoint; no new backend endpoints.

### Quick-Action Cards

- 3-card row below stats: "New Analysis" → `/analyzer`, "View Roadmap" → `/roadmap`, "Resume Builder" → `/resume-builder`
- Styled as icon + label + chevron, consistent with existing card components.

### Empty States

- Custom message + CTA when user has 0 analyses: illustration, text, and primary button to `/analyzer`
- Similar empty state for roadmap section and job tracker section.
- Uses existing `EmptyState` component pattern if available.

---

## 2. Search/Filter

### Analyses List

- Filter bar above the analyses table with:
  - Status dropdown: completed, processing, failed, all
  - Date range: last 7d, 30d, 90d, all
  - Text search: filter by role/company name
- Filters stored in URL query params (`/dashboard?status=completed&q=engineer`) — shareable URLs, back-button compatible.
- Client-side filtering on React Query cache — no new API endpoints.

### Job Tracker

- Text search input above the Kanban board columns.
- Filters jobs client-side by title, company, or notes.

---

## 3. Export/Sharing

### PDF Export

- "Export PDF" button on analysis results page (`/results/:id`)
- Uses `html2canvas` + `jspdf` OR `window.print()` — check which approach is lighter given existing deps
- Renders analysis summary, skill gap table, and recommendations.

### Public Share Links

- "Copy Share Link" button on analysis results page
- Toggle to enable/disable sharing
- Reuses existing `/api/v1/public/analysis/:shareToken` endpoint (built in Phase 0)

### CSV/JSON Export

- "Export CSV" / "Export JSON" buttons
- CSV: skill gap rows (Skill, Current Level, Target Level, Gap, Priority)
- JSON: full analysis payload
- Client-side generation from already-loaded data; no new endpoints.

---

## 4. Keyboard Shortcuts

### Implementation

- Lightweight `useHotkeys` custom hook using `useEffect` + `keydown` listener.
- Registered globally in `AppLayout` (or dedicated `KeyboardShortcuts` component mounted in layout).

### Shortcuts

| Keys | Action |
|------|--------|
| `g` then `d` | Navigate to Dashboard |
| `g` then `a` | Navigate to Analyzer |
| `g` then `r` | Navigate to Roadmap |
| `g` then `j` | Navigate to Job Tracker |
| `g` then `c` | Navigate to Chat |
| `/` | Focus search/filter input |
| `?` | Show shortcuts help modal |

### Help Modal

- Overlay listing all keyboard shortcuts
- Triggered by `?` key
- Dismissed by Escape or click outside

---

## Non-Goals

- No new API endpoints (all features use client-side data or existing endpoints)
- No new database tables
- No authentication changes
- No redesign of existing layouts
