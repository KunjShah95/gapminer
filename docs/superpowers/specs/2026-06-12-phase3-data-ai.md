# Phase 3: Data & AI Features

## Overview

Six features: job boards, resume builder, ATS engine, learning marketplace, email triggers, coach emails.

## Architecture

Each feature is independently deployable. Backend API endpoints + frontend pages/components.

---

## 1. Job Boards

### Backend
- `src/api/v1/endpoints/jobs.ts` — GET `/api/v1/jobs/search?q=software+engineer&location=remote` (proxies Adzuna API, caches results in Redis for 1h)
- `src/api/v1/endpoints/jobs.ts` — GET `/api/v1/jobs/saved` + POST/DELETE `/api/v1/jobs/saved/:id` — saved jobs with Prisma model
- Adzuna API key already in env config (from Phase 0)

### Frontend
- `JobBoardPage.tsx` — Dedicated page at `/jobs/browse` with search bar, filter sidebar (location, salary range, date posted), job cards
- Job suggestions widget on analysis results page (`AnalysisResultsPage.tsx`) — shows 3-5 relevant jobs based on target role
- Saved jobs tab on existing `JobTrackerPage.tsx`

---

## 2. Resume Builder

### Backend
- `src/api/v1/endpoints/resume.ts` — CRUD for resume templates and user resumes
- Resume model: sections (experience, education, skills, projects), styling, template reference
- PDF generation from resume data

### Frontend
- `ResumeBuilderPage.tsx` at `/resume/builder` — Rich editor with:
  - Section manager (add/reorder/remove sections)
  - Rich text fields for each section
  - Template selector (3-4 templates)
  - Live preview side panel
  - Export to PDF
- `ResumeTemplatePicker.tsx` — Template thumbnail grid
- `ResumeSection.tsx` — Editable section component
- `ResumePreview.tsx` — Live preview panel

---

## 3. ATS Engine

### Backend
- Leverages existing ATS agent in the AI pipeline (`src/ai/agents/ats.js`)
- `POST /api/v1/ats/score` — Upload resume + job description, returns ATS score with breakdown
- `GET /api/v1/ats/history` — Past ATS scores

### Frontend
- `ATSPage.tsx` at `/ats` — Side-by-side comparison:
  - Left: resume content (editable or uploaded)
  - Right: job description input
  - Bottom: ATS score gauge + keyword match/miss breakdown + suggestions list
- ATS score widget on analysis results — inline score if ATS data exists

---

## 4. Learning Marketplace

### Backend
- `src/api/v1/endpoints/courses.ts` — Course catalog with search/filter
- Course model: title, provider (Coursera, Udemy, LinkedIn Learning), URL, price, rating, skills covered, category
- `POST /api/v1/courses/recommend` — AI-powered recommendations based on skill gaps (via existing LLM)
- Admin endpoint for course CRUD

### Frontend
- `LearningMarketplacePage.tsx` at `/learn` — Course catalog with:
  - Search bar + filter sidebar (provider, price range, category, rating)
  - Course cards with thumbnail, provider logo, rating, price, skills tags
  - "Recommended for you" section based on analysis skill gaps
- Course recommendations widget on roadmap page

---

## 5. Email Triggers

### Backend
- `src/services/emailTriggers.ts` — Trigger service using existing email system (Resend/SMTP from Phase 0)
- Triggers:
  - Analysis complete → send report summary email
  - Weekly digest → top skill gaps, recommended courses, new jobs
  - Milestone reached → roadmap milestone achievement email
- BullMQ job queue for scheduled emails (existing Redis/BullMQ from Phase 0)

### Config
- Email templates in `src/emails/` directory
- Trigger toggles per user preference

---

## 6. Coach Emails

### Backend
- `src/services/coachEmails.ts` — LLM-generated coaching emails
- Weekly check-in: "You identified 3 skill gaps last week. Here's what to focus on..."
- Uses existing LangChain integration for content generation
- Sent via same email trigger system

---

## Execution Order (Waves)

| Wave | Items | Dependencies |
|------|-------|-------------|
| 1 | Job boards API + Email triggers + Coach emails | None (backend services) |
| 2 | Learning marketplace API + ATS engine API | None (backend services) |
| 3 | Resume builder (backend + frontend) | None (independent) |
| 4 | Job board page + ATS page + Learning marketplace page | Waves 1-2 |
| 5 | Resume builder page | Wave 3 |
| 6 | Integration — wire suggestions into analysis results, roadmap | All above |
