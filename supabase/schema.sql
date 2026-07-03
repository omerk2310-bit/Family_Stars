-- כוחות הבית — Supabase schema
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Creates one table per entity collection + a singleton app_settings table,
-- all scoped to the signed-in user via Row Level Security.

-- 1. children
create table children (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  name text not null,
  display_name text not null,
  color text not null,
  icon text not null,
  sort_order int not null,
  created_at timestamptz not null,
  archived boolean not null default false
);

-- 2. behaviors
create table behaviors (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  child_id text not null,
  title text not null,
  description text not null default '',
  points int not null,
  category text not null,
  is_bonus boolean not null default false,
  min_points int,
  max_points int,
  archived boolean not null default false
);

-- 3. star_events
create table star_events (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  child_id text not null,
  behavior_id text not null,
  points_awarded int not null,
  note text,
  created_at timestamptz not null
);

-- 4. star_adjustments
create table star_adjustments (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  child_id text not null,
  delta int not null,
  note text,
  created_at timestamptz not null
);

-- 5. heart_event_types
create table heart_event_types (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  title text not null,
  description text not null default '',
  hearts int not null,
  archived boolean not null default false
);

-- 6. heart_events
create table heart_events (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  heart_event_type_id text not null,
  hearts_awarded int not null,
  note text,
  created_at timestamptz not null
);

-- 7. red_event_types
create table red_event_types (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  child_id text,
  label text not null,
  archived boolean not null default false
);

-- 8. red_events
create table red_events (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  child_id text,
  red_event_type_id text not null,
  note text,
  created_at timestamptz not null,
  was_repaired boolean not null default false,
  repair_star_event_id text
);

-- 9. rewards
create table rewards (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  title text not null,
  cost int not null,
  type text not null,
  description text,
  requires_parent_approval boolean not null default false,
  archived boolean not null default false,
  sort_order int not null
);

-- 10. reward_redemptions
create table reward_redemptions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  reward_id text not null,
  child_id text,
  created_at timestamptz not null
);

-- 11. app_settings (singleton per user)
create table app_settings (
  user_id uuid primary key default auth.uid() references auth.users,
  daily_star_cap int not null,
  daily_heart_cap int not null,
  family_heart_target int not null,
  admin_pin text
);

-- Row Level Security: every table is only readable/writable by its own user_id.
alter table children enable row level security;
alter table behaviors enable row level security;
alter table star_events enable row level security;
alter table star_adjustments enable row level security;
alter table heart_event_types enable row level security;
alter table heart_events enable row level security;
alter table red_event_types enable row level security;
alter table red_events enable row level security;
alter table rewards enable row level security;
alter table reward_redemptions enable row level security;
alter table app_settings enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'children', 'behaviors', 'star_events', 'star_adjustments',
    'heart_event_types', 'heart_events', 'red_event_types', 'red_events',
    'rewards', 'reward_redemptions', 'app_settings'
  ]
  loop
    execute format(
      'create policy "select own rows" on %I for select using (auth.uid() = user_id);',
      t
    );
    execute format(
      'create policy "insert own rows" on %I for insert with check (auth.uid() = user_id);',
      t
    );
    execute format(
      'create policy "update own rows" on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
    execute format(
      'create policy "delete own rows" on %I for delete using (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- Realtime: broadcast row changes so other signed-in devices update live.
alter publication supabase_realtime add table
  children, behaviors, star_events, star_adjustments,
  heart_event_types, heart_events, red_event_types, red_events,
  rewards, reward_redemptions;

-- Table-level grants: RLS policies alone are not enough — Postgres also
-- requires the `authenticated` role to have basic table privileges, which
-- `create table` does NOT grant automatically (only the Supabase dashboard's
-- Table Editor does that implicitly). Without this, every request gets a
-- generic "permission denied for table X" error regardless of RLS.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  children, behaviors, star_events, star_adjustments,
  heart_event_types, heart_events, red_event_types, red_events,
  rewards, reward_redemptions, app_settings
  to authenticated;
