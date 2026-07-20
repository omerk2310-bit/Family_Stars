-- כוחות הבית — Supabase schema
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Creates one table per entity collection + a singleton app_settings table,
-- all scoped to the signed-in user via Row Level Security.

-- 1. children
-- Note: production databases created before stars_reset_at existed need the
-- separate add-column migration instead of this fresh-install definition
-- (see the retrofit pattern used for the GRANT statements below).
create table children (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  name text not null,
  display_name text not null,
  color text not null,
  icon text not null,
  sort_order int not null,
  created_at timestamptz not null,
  archived boolean not null default false,
  stars_reset_at timestamptz
);

-- 2. behaviors
-- Note: production databases created before sort_order/is_gold_star existed
-- need the separate add-column/backfill/set-not-null migration instead of
-- this fresh-install definition (see the retrofit pattern used for the GRANT
-- statements below, applied the same way for these columns).
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
  archived boolean not null default false,
  sort_order int not null default 0,
  is_gold_star boolean not null default false
);

-- 3. star_events
-- Note: production databases created before status existed need the
-- separate add-column/backfill migration instead of this fresh-install
-- definition (see the retrofit pattern used for the GRANT statements below).
create table star_events (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  child_id text not null,
  behavior_id text not null,
  points_awarded int not null,
  note text,
  created_at timestamptz not null,
  is_gold_star boolean not null default false,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected'))
);

-- 4. star_adjustments
create table star_adjustments (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  child_id text not null,
  delta int not null,
  note text,
  created_at timestamptz not null,
  is_gold_star boolean not null default false
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
  sort_order int not null,
  is_gold_star boolean not null default false
);

-- 10. reward_redemptions
-- Note: production databases created before status existed need the separate
-- add-column/backfill/set-not-null migration instead of this fresh-install
-- definition (see the retrofit pattern used for the GRANT statements below).
create table reward_redemptions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  reward_id text not null,
  child_id text,
  created_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

-- 11. reward_claims — presence of a row = a parent marked an instant-rewards
-- grant delivered. id is a deterministic composite key (childId:tierId:
-- windowStartISO) matching the pure engine's RewardGrant.id — grants
-- themselves are never persisted, only claims of them (see src/economy/).
create table reward_claims (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  child_id text not null,
  tier_id text not null,
  window_start timestamptz not null,
  claimed_at timestamptz not null default now()
);

-- 12. legacy_grants — one-time "closing gift" per child, created during the
-- instant-rewards migration for a child with a meaningful balance under the
-- old accumulation model. Unrelated to the tier engine.
create table legacy_grants (
  id text primary key, -- child_id (at most one per child)
  user_id uuid not null default auth.uid() references auth.users,
  child_id text not null,
  size text not null,
  source_note text not null,
  granted_at timestamptz not null,
  claimed_at timestamptz
);

-- 13. reward_definitions — the 3 fixed reward-size configs (small/medium/
-- large), fully editable by parents. Not a catalog the child picks from.
create table reward_definitions (
  id text primary key, -- equals size
  user_id uuid not null default auth.uid() references auth.users,
  size text not null,
  label text not null,
  description text not null default '',
  examples text[] not null default '{}'
);

-- 14. app_settings (singleton per user)
-- Note: production databases created before economy_config/economy_starts_at/
-- economy_migration_shown existed need the separate add-column migration
-- instead of this fresh-install definition (see the retrofit pattern used
-- for the GRANT statements above).
create table app_settings (
  user_id uuid primary key default auth.uid() references auth.users,
  daily_star_cap int not null,
  daily_heart_cap int not null,
  family_heart_target int not null,
  admin_pin text,
  economy_config jsonb not null default '{}'::jsonb,
  economy_starts_at timestamptz not null default now(),
  economy_migration_shown boolean not null default false
);

-- 15. push_subscriptions — Web Push registrations, one row per device that
-- opted in. device_role mirrors DeviceRole ("parent" has child_id null,
-- "child" always has child_id set) — this is what the notify-* edge
-- functions (supabase/functions/) query to know which devices to push to.
-- Not added to the realtime publication below: no client ever reads this
-- table live, it's written once at subscribe-time and only read server-side.
create table push_subscriptions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users,
  device_role text not null check (device_role in ('parent', 'child')),
  child_id text,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
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
alter table reward_claims enable row level security;
alter table legacy_grants enable row level security;
alter table reward_definitions enable row level security;
alter table app_settings enable row level security;
alter table push_subscriptions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'children', 'behaviors', 'star_events', 'star_adjustments',
    'heart_event_types', 'heart_events', 'red_event_types', 'red_events',
    'rewards', 'reward_redemptions', 'reward_claims', 'legacy_grants',
    'reward_definitions', 'app_settings', 'push_subscriptions'
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
  rewards, reward_redemptions, reward_claims, legacy_grants, reward_definitions;

-- Table-level grants: RLS policies alone are not enough — Postgres also
-- requires the `authenticated` role to have basic table privileges, which
-- `create table` does NOT grant automatically (only the Supabase dashboard's
-- Table Editor does that implicitly). Without this, every request gets a
-- generic "permission denied for table X" error regardless of RLS.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  children, behaviors, star_events, star_adjustments,
  heart_event_types, heart_events, red_event_types, red_events,
  rewards, reward_redemptions, reward_claims, legacy_grants,
  reward_definitions, app_settings, push_subscriptions
  to authenticated;
