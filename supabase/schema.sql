-- FinQuest full database schema
-- Multi-user, social, and progression-ready Supabase schema.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'transaction_category'
  ) then
    create type public.transaction_category as enum (
      'Need',
      'Want',
      'Treat',
      'Invest'
    );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  insert into public.user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  preferred_currency text not null default 'USD',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  category public.transaction_category not null,
  merchant_name text,
  note text,
  source text not null default 'manual',
  spent_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.spending_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete set null,
  needs_ratio numeric(5, 4) not null default 0 check (needs_ratio between 0 and 1),
  wants_ratio numeric(5, 4) not null default 0 check (wants_ratio between 0 and 1),
  treat_ratio numeric(5, 4) not null default 0 check (treat_ratio between 0 and 1),
  invest_ratio numeric(5, 4) not null default 0 check (invest_ratio between 0 and 1),
  transaction_count integer not null default 0 check (transaction_count >= 0),
  total_spent numeric(12, 2) not null default 0 check (total_spent >= 0),
  liquidity_score integer not null default 0 check (liquidity_score between 0 and 100),
  budget_health integer not null default 0 check (budget_health between 0 and 100),
  investment_growth integer not null default 0 check (investment_growth between 0 and 100),
  stability integer not null default 0 check (stability between 0 and 100),
  economy_score integer not null default 0 check (economy_score between 0 and 100),
  calculated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.city_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  spending_snapshot_id uuid references public.spending_snapshots (id) on delete set null,
  economy_score integer not null default 0 check (economy_score between 0 and 100),
  pollution integer not null default 0 check (pollution between 0 and 100),
  infrastructure integer not null default 0 check (infrastructure between 0 and 100),
  growth integer not null default 0 check (growth between 0 and 100),
  liquidity integer not null default 0 check (liquidity between 0 and 100),
  stability integer not null default 0 check (stability between 0 and 100),
  entertainment integer not null default 0 check (entertainment between 0 and 100),
  parks integer not null default 0 check (parks between 0 and 100),
  emergency_warning boolean not null default false,
  generated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  spending_snapshot_id uuid references public.spending_snapshots (id) on delete set null,
  city_snapshot_id uuid references public.city_snapshots (id) on delete set null,
  lesson_id text,
  lesson_title text,
  prompt text,
  insight_text text not null,
  lesson_text text not null,
  model text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  spending_snapshot_id uuid references public.spending_snapshots (id) on delete set null,
  city_snapshot_id uuid references public.city_snapshots (id) on delete set null,
  trigger_id text not null,
  trigger_version text not null default 'v1',
  title text not null,
  concept text not null,
  preview_text text not null default '',
  explanation text not null,
  examples jsonb not null default '[]'::jsonb check (jsonb_typeof(examples) = 'array'),
  advice jsonb not null default '[]'::jsonb check (jsonb_typeof(advice) = 'array'),
  source_metrics jsonb,
  source_transaction_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(source_transaction_ids) = 'array'),
  completed boolean not null default false,
  generated_by text not null default 'fallback',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  level integer not null default 1 check (level >= 1),
  last_achievement_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null,
  achievement_title text not null,
  xp_reward integer not null default 0,
  unlocked_at timestamptz not null default timezone('utc', now()),
  unique (user_id, achievement_id)
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default timezone('utc', now()),
  unique (group_id, user_id)
);

-- Upgrade path for projects that already had the earlier hackathon schema.
alter table public.transactions
  add column if not exists user_id uuid references public.profiles (id) on delete cascade,
  add column if not exists merchant_name text,
  add column if not exists note text,
  add column if not exists source text default 'manual',
  add column if not exists spent_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

alter table public.spending_snapshots
  add column if not exists liquidity_score integer not null default 0,
  add column if not exists budget_health integer not null default 0,
  add column if not exists investment_growth integer not null default 0,
  add column if not exists stability integer not null default 0,
  add column if not exists economy_score integer not null default 0;

alter table public.city_snapshots
  add column if not exists economy_score integer not null default 0,
  add column if not exists infrastructure integer not null default 0,
  add column if not exists liquidity integer not null default 0,
  add column if not exists stability integer not null default 0,
  add column if not exists parks integer not null default 0,
  add column if not exists emergency_warning boolean not null default false;

alter table public.ai_insights
  add column if not exists lesson_id text,
  add column if not exists lesson_title text,
  add column if not exists lesson_text text default '',
  add column if not exists city_snapshot_id uuid references public.city_snapshots (id) on delete set null;

alter table public.lessons
  add column if not exists spending_snapshot_id uuid references public.spending_snapshots (id) on delete set null,
  add column if not exists city_snapshot_id uuid references public.city_snapshots (id) on delete set null,
  add column if not exists trigger_id text,
  add column if not exists trigger_version text default 'v1',
  add column if not exists title text,
  add column if not exists concept text,
  add column if not exists preview_text text default '',
  add column if not exists explanation text,
  add column if not exists examples jsonb default '[]'::jsonb,
  add column if not exists advice jsonb default '[]'::jsonb,
  add column if not exists source_metrics jsonb,
  add column if not exists source_transaction_ids jsonb default '[]'::jsonb,
  add column if not exists completed boolean not null default false,
  add column if not exists generated_by text not null default 'fallback',
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.user_progress
  add column if not exists last_achievement_id text,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists idx_profiles_username
  on public.profiles (username);

create index if not exists idx_transactions_user_id_spent_at
  on public.transactions (user_id, spent_at desc);

create index if not exists idx_spending_snapshots_user_id_created_at
  on public.spending_snapshots (user_id, created_at desc);

create index if not exists idx_city_snapshots_user_id_created_at
  on public.city_snapshots (user_id, created_at desc);

create index if not exists idx_ai_insights_user_id_created_at
  on public.ai_insights (user_id, created_at desc);

create index if not exists idx_lessons_user_id_created_at
  on public.lessons (user_id, created_at desc);

create index if not exists idx_lessons_user_id_trigger_id_created_at
  on public.lessons (user_id, trigger_id, created_at desc);

create index if not exists idx_group_members_group_id
  on public.group_members (group_id);

create index if not exists idx_group_members_user_id
  on public.group_members (user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

drop trigger if exists user_progress_set_updated_at on public.user_progress;
create trigger user_progress_set_updated_at
before update on public.user_progress
for each row
execute function public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at
before update on public.lessons
for each row
execute function public.set_updated_at();

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
before update on public.groups
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace view public.latest_city_state as
select
  p.id as user_id,
  p.username,
  p.full_name,
  latest_spending.needs_ratio,
  latest_spending.wants_ratio,
  latest_spending.treat_ratio,
  latest_spending.invest_ratio,
  latest_spending.liquidity_score,
  latest_spending.budget_health,
  latest_spending.investment_growth,
  latest_spending.stability as financial_stability,
  latest_city.economy_score,
  latest_city.infrastructure,
  latest_city.entertainment,
  latest_city.pollution,
  latest_city.growth,
  latest_city.liquidity,
  latest_city.stability,
  latest_city.parks,
  latest_city.emergency_warning,
  progress.total_xp,
  progress.level,
  latest_insight.insight_text,
  latest_insight.lesson_text,
  latest_city.generated_at as city_generated_at,
  latest_spending.calculated_at as spending_calculated_at,
  latest_insight.created_at as insight_created_at
from public.profiles p
left join public.user_progress progress
  on progress.user_id = p.id
left join lateral (
  select *
  from public.spending_snapshots s
  where s.user_id = p.id
  order by s.created_at desc
  limit 1
) latest_spending on true
left join lateral (
  select *
  from public.city_snapshots c
  where c.user_id = p.id
  order by c.created_at desc
  limit 1
) latest_city on true
left join lateral (
  select *
  from public.ai_insights i
  where i.user_id = p.id
  order by i.created_at desc
  limit 1
) latest_insight on true;

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.spending_snapshots enable row level security;
alter table public.city_snapshots enable row level security;
alter table public.ai_insights enable row level security;
alter table public.lessons enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_achievements enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions"
on public.transactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view own spending snapshots" on public.spending_snapshots;
create policy "Users can view own spending snapshots"
on public.spending_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own spending snapshots" on public.spending_snapshots;
create policy "Users can insert own spending snapshots"
on public.spending_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view own city snapshots" on public.city_snapshots;
create policy "Users can view own city snapshots"
on public.city_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own city snapshots" on public.city_snapshots;
create policy "Users can insert own city snapshots"
on public.city_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view own ai insights" on public.ai_insights;
create policy "Users can view own ai insights"
on public.ai_insights
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own ai insights" on public.ai_insights;
create policy "Users can insert own ai insights"
on public.ai_insights
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view own lessons" on public.lessons;
create policy "Users can view own lessons"
on public.lessons
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lessons" on public.lessons;
create policy "Users can insert own lessons"
on public.lessons
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own lessons" on public.lessons;
create policy "Users can update own lessons"
on public.lessons
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own progress" on public.user_progress;
create policy "Users can view own progress"
on public.user_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own progress" on public.user_progress;
create policy "Users can update own progress"
on public.user_progress
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own achievements" on public.user_achievements;
create policy "Users can view own achievements"
on public.user_achievements
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own achievements" on public.user_achievements;
create policy "Users can insert own achievements"
on public.user_achievements
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can create groups" on public.groups;
create policy "Users can create groups"
on public.groups
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Members can view groups" on public.groups;
create policy "Members can view groups"
on public.groups
for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "Owners can update groups" on public.groups;
create policy "Owners can update groups"
on public.groups
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Members can view memberships" on public.group_members;
create policy "Members can view memberships"
on public.group_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.group_members viewer
    where viewer.group_id = group_members.group_id
      and viewer.user_id = auth.uid()
  )
);

drop policy if exists "Users can join groups as themselves" on public.group_members;
create policy "Users can join groups as themselves"
on public.group_members
for insert
to authenticated
with check (user_id = auth.uid());

comment on table public.profiles is
  'Supabase auth-linked profile data for each FinQuest user.';

comment on table public.transactions is
  'Raw user spending events that drive financial metrics and city changes.';

comment on table public.spending_snapshots is
  'Derived financial ratios and scores saved after recalculation.';

comment on table public.city_snapshots is
  'Rendered city state derived from financial metrics.';

comment on table public.ai_insights is
  'Stored AI-generated coaching responses and linked lesson content.';

comment on table public.lessons is
  'Personalized financial micro-lessons generated from a user''s real spending behavior.';

comment on table public.user_progress is
  'XP and level progression for the gamified dashboard.';

comment on table public.user_achievements is
  'Unlocked achievements awarded to a user.';

comment on table public.groups is
  'Social groups used for multiplayer comparisons and leaderboards.';

comment on table public.group_members is
  'Membership records for group participation and roles.';
