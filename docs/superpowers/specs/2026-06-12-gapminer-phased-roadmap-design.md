# GapMiner Phased Development Roadmap

## Phase 0: Land Current WIP (Complete — Ready to Commit)

### What Was In Progress
The codebase had 28 modified files and 15+ new untracked files representing substantial feature work that hadn't been committed.

### New Features Built (Included in This Spec)

**Admin Dashboard:**
- `admin.js` — REST API with system stats (`GET /admin/stats`) and user listing (`GET /admin/users`), gated by ADMIN role
- `AdminDashboardPage.tsx` — Full admin UI with stat cards (users, analyses, resumes, premium counts) and searchable user table
- Wired at `/api/v1/admin` in router and `/admin` route in App.tsx

**Notifications System:**
- `notifications.js` — REST API for user notification feed with list, mark-read, and mark-all-read
- `notificationStore.ts` — Zustand store with `fetchNotifications`, `markAsRead`, `markAllAsRead`
- `NotificationsDropdown.tsx` — Bell icon dropdown with type icons, time-ago, unread badge, mark-read actions
- `notifications` table added to database schema (`database.ts`)
- Integrated into `AppLayout.tsx` header, accessible globally

**AI Chat Page:**
- `ChatPage.tsx` — Full chat UI with message history, auto-scroll, Enter-to-send, loading indicators, error states, clear button
- Uses existing `/api/v1/chat` endpoint backed by LangChain LLM
- Wired at `/chat` route in App.tsx and added to Intelligence nav section

**Developer Portal:**
- `developer.ts` — REST API for API key management (create, list, revoke) with SHA-256 key hashing
- `DeveloperPortalPage.tsx` — Full API key management UI with key generation, copy, revoke, usage stats
- `api_keys` and `api_key_usage` tables added to database schema
- Wired at `/api/v1/developer` and `/dev` route

**Public API:**
- `public.ts` — Unauthenticated endpoints for SVG badges (`/badge/:type/:name.svg`), skill catalog (`/skills`), and shared analysis (`/analysis/:shareToken`)
- Wired at `/api/v1/public`

**Error Boundary:**
- `ErrorBoundary.tsx` — Class-based React error boundary with retry and go-home actions
- Already integrated into `ProtectedRoute` wrapper in App.tsx

**Additional Components:**
- `ResumeHeatmap.tsx` — ATS resume visualization component
- `TemplateManager.tsx`, `VariantSelector.tsx` — Cover letter v2 components
- `badgeGenerator.ts` — SVG badge generation service
- `cacheService.js` — Generic cache service
- `coverLetterV2.ts` — Cover letter v2 service layer
- `resumeHeatmap.ts` — Resume heatmap analysis service
- `jobBoardApi.ts` — Adzuna job board API integration (config keys added)

**Infrastructure:**
- `email.js` — Full email service rewrite with Resend (primary), SMTP (fallback), console (dev fallback)
- `batchQueue.ts` — Redis-backed resume parsing queue with inline fallback
- `OnboardingWizard.tsx` — Major UX overhaul with agent progress tracker
- `LatexEditorPage.tsx` — Significant enhancements
- `env.production.example` — Updated with all new config vars (SMTP, Resend, Adzuna, etc.)
- Shared types (`packages/types`) — Added interfaces for ApiKey, SharedAnalysis, HeatmapZone, CoverLetterTemplate, etc.

### Files Changed (Summary)
- **34 modified files** across API, Web, and shared packages
- **17 new files** (7 API, 6 frontend, 2 components, 1 script, 1 store)
- **1 bug fix**: stray semicolon in `database.ts` line 310 causing TS parse error

### Database Schema Additions
- `notifications` — User notification feed
- `api_keys` — Developer API keys (hashed)
- `api_key_usage` — API key usage tracking
- Various migration columns and indexes

---

## Phase 1–4 Roadmap (Planned)

The remaining 20 expansion items are organized into four phases (defined in conversation with user, June 12 2026):

| Phase | Focus | Items |
|-------|-------|-------|
| **1** | Foundation & Polish | Test suite, CI/CD, dark mode, mobile audit, skeletons, error boundaries, perf |
| **2** | UX Quality | Dashboard polish, search/filter, export/sharing, keyboard shortcuts |
| **3** | Data & AI Features | Job boards, email triggers, resume builder, ATS engine, learning marketplace, coach emails |
| **4** | Advanced | Network graph, team features, auto-apply |

Each phase will follow its own spec → plan → implementation cycle.
