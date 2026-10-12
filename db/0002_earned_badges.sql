-- Run in the Supabase SQL editor. Replace ra_local with your DB_SCHEMA for each environment.
-- Badge definitions live in code (src/lib/badges.ts); this table only records which a user earned.

create table if not exists ra_local.earned_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  strava_activity_id bigint,          -- the activity that qualified it, when applicable
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table ra_local.earned_badges enable row level security;
revoke all on ra_local.earned_badges from anon, authenticated;
grant all on ra_local.earned_badges to service_role;
