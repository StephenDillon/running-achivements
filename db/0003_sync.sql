-- Run in the Supabase SQL editor AFTER 0001 and 0002. Replace ra_local with your DB_SCHEMA.
-- Adds activity storage, sync progress tracking, and "seen" tracking for the new-badge popup.

-- Runs/activities pulled from Strava. Cascade-deleted with the user (required on Strava disconnect).
create table if not exists ra_local.activities (
  user_id uuid not null references auth.users (id) on delete cascade,
  strava_id bigint not null,
  name text,
  sport_type text,
  start_date timestamptz not null,
  start_local timestamp not null,        -- the runner's local wall-clock time, for week/day bucketing
  distance_m double precision not null,
  moving_time_s integer not null,
  elapsed_time_s integer not null,
  best_efforts jsonb,                    -- from Strava's detail call; null = not fetched yet
  detail_fetched_at timestamptz,
  primary key (user_id, strava_id)
);
create index if not exists activities_user_start_idx on ra_local.activities (user_id, start_date);

-- One row per user: where the sync is up to, plus a lock so two requests don't sync at once.
create table if not exists ra_local.sync_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'idle',   -- idle | running | rate_limited | reauth | error
  history_complete boolean not null default false,
  next_page integer not null default 1,  -- backfill cursor
  last_synced_at timestamptz,
  locked_at timestamptz,
  error_message text
);

-- Popup tracking: null = the user hasn't been shown this badge yet.
alter table ra_local.earned_badges add column if not exists seen_at timestamptz;

alter table ra_local.activities enable row level security;
alter table ra_local.sync_state enable row level security;
revoke all on ra_local.activities, ra_local.sync_state from anon, authenticated;
grant all on ra_local.activities, ra_local.sync_state to service_role;
