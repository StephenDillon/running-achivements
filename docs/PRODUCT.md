# Product Context

> Read this before generating features. Badge definitions are intentionally **not final** — see "Open questions".

## What it is
**Running Achievements** pulls a runner's activity history from the Strava API and awards badges for major running milestones (e.g. a sub-7:00 mile, a sub-25:00 5K, a half marathon, a full marathon).

## Users
Recreational to competitive runners with a Strava account. They want recognition for hitting milestones and a clear view of what to chase next.

## Core concepts
- **Badge**: a named achievement with a rule evaluated against a user's activities (e.g. "5K in under 25:00").
- **Category**: a focus area that groups badges. Initial categories:
  - **Speed** – fast times at standard distances (7:00 mile, sub-25 5K, sub-50 10K).
  - **Distance** – longest single runs (10K, half marathon, marathon, ultra).
  - **Consistency** – streaks and volume (weekly/monthly mileage, run streaks).
  - **Terrain** – climbing and trail milestones.
- **Tier**: difficulty within a category — `bronze` → `silver` → `gold` → `platinum`. A badge belongs to exactly one category and one tier.
- **Earned badge**: a user + badge + the activity that qualified it + date earned.

## Planned architecture (high level)
- **Frontend**: Next.js (App Router) + Tailwind CSS, hosted on Vercel. Display only.
- **Backend**: Next.js route handlers (REST) are the only way data is read or written. They authenticate, authorize, and validate.
- **Auth**: Supabase Auth manages users/sessions; Strava is the initial identity provider (OAuth). Sessions are persistent (refresh tokens) — users should not have to log in constantly.
- **Data**: Supabase Postgres, in a dedicated schema (`DB_SCHEMA`) shared-DB-safe from other projects. Accessed only by the backend with the service-role key. Strava tokens and activity data are stored server-side only.
- **Strava**: activities are synced by the backend using the user's stored OAuth token; badge evaluation runs on the backend.

## Current status
Skeleton only: layout and a landing page with placeholder category cards. **No auth, no database, no Strava integration yet.**

## Roadmap (rough order)
1. Skeleton UI + Vercel deploy
2. Supabase project + schema (users, activities, badges, earned_badges)
3. Strava OAuth via Supabase Auth, persistent sessions
4. Activity sync (REST + background/webhook)
5. Badge definitions + evaluation engine
6. Badge gallery / profile UI

## Open questions
- Final badge list and tier thresholds per category.
- Age/gender-adjusted thresholds, or one absolute standard?
- Use Strava "best efforts" (PR data) vs. computing from activity streams.
- Public profiles / sharing?
