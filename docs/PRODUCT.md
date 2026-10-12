# Product Context

> Read this before generating features. Badge definitions are intentionally **not final** — see "Open questions".

## What it is
**Running Achievements** pulls a runner's activity history from the Strava API and awards badges for major running milestones (e.g. a sub-7:00 mile, a sub-25:00 5K, a half marathon, a full marathon).

## Users
Recreational to competitive runners with a Strava account. They want recognition for hitting milestones and a clear view of what to chase next.

## Core concepts
- **Badge**: a named achievement with a rule evaluated against a user's activities (e.g. "5K in under 25:00").
- **Group**: an ordered ladder of related badges, easiest to hardest — e.g. **5K**: finish a 5K → sub-40 → sub-30 → sub-25 → sub-20 → sub-18. Groups: Mile, 5K, 10K, Half Marathon, Marathon, Long Distance, Long Run Habit, Peak Week, Training Blocks, Run Streak, Weekly Rhythm, Monthly/Yearly Mileage, Total Runs. The UI shows progress per group (e.g. 2 of 6) and the "next up" badge.
- **Category**: sections that hold groups — Speed, Distance, Marathon Training, Consistency.
- **Levels** (Starter → Elite) were considered and dropped for now; may return.
- **Focus**: road running and marathon training. Trail/ultra/elevation badges are out of scope for now.
- **Catalog**: defined in `src/lib/badges.ts` (code, versioned). Each badge has a typed `rule` the backend evaluator will use against Strava data (best efforts, longest run, streaks, weekly/monthly/yearly distance, run count). `earned_badges` (db/0002) records which badge ids a user has earned.
- **Earned badge**: a user + badge + the activity that qualified it + date earned.

## Planned architecture (high level)
- **Frontend**: Next.js (App Router) + Tailwind CSS, hosted on Vercel. Display only.
- **Backend**: Next.js route handlers (REST) are the only way data is read or written. They authenticate, authorize, and validate.
- **Auth**: Supabase Auth manages users/sessions; Strava is the initial identity provider (OAuth). Sessions are persistent (refresh tokens) — users should not have to log in constantly.
- **Data**: Supabase Postgres, in a dedicated schema (`DB_SCHEMA`) shared-DB-safe from other projects. Accessed only by the backend with the service-role key. Strava tokens and activity data are stored server-side only.
- **Strava**: activities are synced by the backend using the user's stored OAuth token; badge evaluation runs on the backend.

## Current status
Auth (Strava + Supabase), profile/disconnect, and the badge catalog + gallery pages are built. Activity sync and badge awarding are built (see docs/SYNC.md); a new-badge popup shows what was just earned.

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
