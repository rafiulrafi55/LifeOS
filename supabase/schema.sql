-- LifeOS database schema for Supabase
-- Authentication is managed by Supabase Auth (auth.users).

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_]{3,30}$'),
  first_name text,
  last_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Upgrade profiles created before username support.
alter table public.profiles add column if not exists username text;

update public.profiles p
set username = left(coalesce(
  nullif(regexp_replace(lower(split_part(au.email, '@', 1)), '[^a-z0-9_]', '_', 'g'), ''),
  'user'
), 21) || '_' || left(replace(p.user_id::text, '-', ''), 8)
from auth.users au
where au.id = p.user_id
  and p.username is null;

alter table public.profiles alter column username set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username = lower(username) and username ~ '^[a-z0-9_]{3,30}$');
  end if;
end;
$$;

create table if not exists public.dashboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  layout jsonb not null default '{}'::jsonb,
  widgets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'completed', 'paused', 'cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  target_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  goal_id uuid references public.goals(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.finances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount >= 0),
  category text not null,
  description text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_at is null or end_at >= start_at)
);

create index if not exists dashboards_user_id_idx on public.dashboards(user_id);
create unique index if not exists profiles_username_unique_idx on public.profiles(username);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_goal_id_idx on public.tasks(goal_id);
create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists finances_user_id_idx on public.finances(user_id);
create index if not exists finances_transaction_date_idx on public.finances(user_id, transaction_date);
create index if not exists events_user_id_idx on public.events(user_id);
create index if not exists events_start_at_idx on public.events(user_id, start_at);

 drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

 drop trigger if exists set_dashboards_updated_at on public.dashboards;
create trigger set_dashboards_updated_at
before update on public.dashboards
for each row execute function public.set_updated_at();

 drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

 drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

 drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

 drop trigger if exists set_finances_updated_at on public.finances;
create trigger set_finances_updated_at
before update on public.finances
for each row execute function public.set_updated_at();

 drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, username, first_name, last_name, avatar_url)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.resolve_login_email(login_identifier text)
returns text
language sql
security definer
set search_path = public
as $$
  select case
    when position('@' in trim(login_identifier)) > 0 then lower(trim(login_identifier))
    else (
      select au.email
      from public.profiles p
      join auth.users au on au.id = p.user_id
      where p.username = lower(trim(login_identifier))
      limit 1
    )
  end;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.dashboards enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.finances enable row level security;
alter table public.events enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (auth.uid() = user_id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert with check (auth.uid() = user_id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
for delete using (auth.uid() = user_id);

drop policy if exists dashboards_own on public.dashboards;
create policy dashboards_own on public.dashboards
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists goals_own on public.goals;
create policy goals_own on public.goals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists tasks_own on public.tasks;
create policy tasks_own on public.tasks
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists notes_own on public.notes;
create policy notes_own on public.notes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists finances_own on public.finances;
create policy finances_own on public.finances
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists events_own on public.events;
create policy events_own on public.events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
