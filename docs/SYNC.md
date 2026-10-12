# Strava Sync & Badge Awarding

All of this runs on the backend. The browser only triggers a sync and displays results.

## Flow
1. User opens the site → `BadgesView` loads earned badges, then calls `POST /api/v1/sync` in a loop while the response says `more: true`.
2. `syncUser(userId)` (`src/lib/server/sync.ts`) does a bounded chunk (~40s) of:
   1. **Activities.** First time: page through the whole history (200/page, resumable via `sync_state.next_page`). Afterwards: only activities newer than the latest stored (minus a day of overlap).
   2. **Details.** Fetch best efforts for the few runs that could unlock a time badge (see below), 15 per call.
   3. **Evaluate.** `evaluateBadges()` runs over all stored runs; newly qualifying badges are inserted into `earned_badges` (`ignoreDuplicates`, so existing awards are never changed or re-announced). Badges are never revoked.
3. `GET /api/v1/badges` returns earned badges with `seen: false` for ones not yet shown. When the sync settles, the UI shows a popup for those, and `POST /api/v1/badges/seen` marks them seen on dismiss. Closing the tab mid-popup just shows it again next visit.

## Why best efforts are special
Strava's activity *list* has distance/time but not "fastest 5K inside this run". That only comes from the per-activity detail call, and Strava's default limit is ~100 requests / 15 min (1000/day). So time badges (mile/5K/10K/half/marathon) use `pickDetailCandidates`: for each distance, the 8 runs whose average pace over that distance is fastest (a run's best effort is at least as fast as its average). Everything else (distance, streaks, weekly/monthly/yearly mileage, run counts) comes from the list data alone.

Known limit: an interval session with a slow average pace but a fast 5K segment could be missed if the user has 8+ faster-looking runs of 5K+. Fix if it matters: a deeper scan, or Strava webhooks to see every new activity.

## Safety
- **Concurrency:** `sync_state.status='running'` + `locked_at` is claimed atomically; a second request gets `busy` and waits. Locks expire after 2 min.
- **Throttle:** if synced within the last 90s, the call returns `skipped` without touching Strava.
- **Rate limit (429):** status `rate_limited`; the sync resumes from stored state next time.
- **Revoked access (401):** status `reauth`; UI asks the user to reconnect.
- **Auth:** every route derives the user from the session cookie; a user can only sync/read/mark their own rows. Strava tokens never leave the server.
- **Data on disconnect:** `activities`, `sync_state`, `earned_badges` all cascade-delete with the auth user, satisfying Strava's requirement to delete data when a user revokes access.

## Rules
- Run = Strava `sport_type` of `Run` or `TrailRun`.
- "Ran X distance" badges allow 0.5% under (GPS rarely records exactly 5.000 km). Weeks start Monday, in the runner's local time. A badge is dated by the activity that completed it.
- Evaluator is pure and tested: `npm test`.

## Not built yet
- Background sync with no visit (Strava webhooks, or Vercel Cron calling `syncUser` per user). `syncUser` is already callable from either.
- A manual "re-sync everything" button.
