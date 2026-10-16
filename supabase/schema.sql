-- BAForge AI: accounts, usage, feedback.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run again (uses IF NOT EXISTS / OR REPLACE).
--
-- Access model: the browser never talks to these tables directly. All reads and
-- writes go through our server functions (/api/*) with the service key, which
-- first checks the signed-in user. RLS is on and no public policies exist, so
-- the anon/authenticated keys can read nothing here.

create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  role           text not null default 'user' check (role in ('user','admin')),
  is_active      boolean not null default true,
  daily_ai_limit integer not null default 30 check (daily_ai_limit >= 0),
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz
);

create table if not exists public.usage_events (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles(id) on delete set null,
  kind       text not null check (kind in ('page','ai')),
  tool       text not null,
  created_at timestamptz not null default now()
);
create index if not exists usage_events_created_idx on public.usage_events (created_at desc);
create index if not exists usage_events_user_kind_idx on public.usage_events (user_id, kind, created_at desc);

create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles(id) on delete set null,
  email      text,
  category   text not null default 'other' check (category in ('bug','idea','other')),
  message    text not null check (char_length(message) between 3 and 4000),
  page       text,
  status     text not null default 'open' check (status in ('open','done')),
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.profiles     enable row level security;
alter table public.usage_events enable row level security;
alter table public.feedback     enable row level security;

-- Create a profile whenever someone signs up. The address below becomes admin.
-- Change it (or add more admins later from the admin panel) as needed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when lower(new.email) = 'darendeliserdar@gmail.com' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nobody but the server (service role) may touch these tables.
revoke all on public.profiles, public.usage_events, public.feedback from anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
