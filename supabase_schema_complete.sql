-- 1. Enable Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  display_name text,
  rating int default 1200,
  wins int default 0,
  losses int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Ensure ID default (Fix for previous issue)
alter table public.profiles alter column id set default gen_random_uuid();

-- 3. Matches Table
create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references public.profiles(id) not null,
  accepted_by uuid references public.profiles(id),
  winner_id uuid references public.profiles(id),
  match_type text not null,
  status text not null default 'CREATED',
  stake_cents int default 0,
  total_pot_cents int default 0,
  best_of int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Ensure ID default (Fix if table already exists with wrong default)
alter table public.matches alter column id set default gen_random_uuid();

-- 4. RLS (Drop policies first to avoid "already exists" errors)
alter table public.profiles enable row level security;
alter table public.matches enable row level security;

-- Policies (Profiles)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Policies (Matches)
drop policy if exists "Matches are viewable by everyone." on matches;
create policy "Matches are viewable by everyone." on matches for select using ( true );

drop policy if exists "Authenticated users can create matches." on matches;
create policy "Authenticated users can create matches." on matches for insert with check ( auth.uid() = created_by );

drop policy if exists "Participants can update their matches." on matches;
create policy "Participants can update their matches." on matches for update using ( auth.uid() = created_by or auth.uid() = accepted_by );

-- 5. Triggers for New Users
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, rating)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name', 1200)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 6. Backfill Data (Fix for existing users including yourself)
insert into public.profiles (id, username, display_name, rating)
select id, raw_user_meta_data->>'username', raw_user_meta_data->>'display_name', 1200
from auth.users
where id not in (select id from public.profiles)
on conflict do nothing;
