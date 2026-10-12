-- Run in the Supabase SQL editor. Replace ra_local with your DB_SCHEMA for each environment (ra_prod, ...).
-- Afterwards add the schema under Settings -> API -> Exposed schemas.

create schema if not exists ra_local;

-- One row per app user (user_id == auth.users.id). Public Strava profile data.
create table if not exists ra_local.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  strava_athlete_id bigint not null unique,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Strava OAuth tokens for background syncing. SENSITIVE: backend (service role) only.
create table if not exists ra_local.strava_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  athlete_id bigint not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  updated_at timestamptz not null default now()
);

-- RLS on with no policies = anon/authenticated roles can read nothing. Only the service role (API) has access.
alter table ra_local.profiles enable row level security;
alter table ra_local.strava_connections enable row level security;

revoke all on schema ra_local from anon, authenticated;
revoke all on all tables in schema ra_local from anon, authenticated;
grant usage on schema ra_local to service_role;
grant all on all tables in schema ra_local to service_role;
alter default privileges in schema ra_local grant all on tables to service_role;
