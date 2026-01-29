-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (Enhancement)
-- Ensure profiles table exists and has necessary fields
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  display_name text,
  avatar_url text,
  rating int default 1200, -- Elo rating
  wins int default 0,
  losses int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- MATCHES TABLE
create table if not exists public.matches (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references public.profiles(id) not null,
  accepted_by uuid references public.profiles(id),
  winner_id uuid references public.profiles(id),
  
  match_type text not null, -- 'QUICK_DUEL', 'RANKED', 'DIRECT_CHALLENGE'
  status text not null default 'CREATED', -- 'CREATED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'
  
  stake_cents int default 0,
  total_pot_cents int default 0,
  best_of int default 1,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on matches
alter table public.matches enable row level security;

-- Matches Policies
create policy "Matches are viewable by everyone."
  on matches for select
  using ( true );

create policy "Authenticated users can create matches."
  on matches for insert
  with check ( auth.uid() = created_by );

create policy "Participants can update their matches."
  on matches for update
  using ( auth.uid() = created_by or auth.uid() = accepted_by );

-- DATA MIGRATION: Auto-create profile on signup
-- function to handle new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, rating)
  values (
    new.id, 
    new.raw_user_meta_data->>'username', 
    new.raw_user_meta_data->>'display_name',
    1200
  );
  return new;
end;
$$ language plpgsql security definer;

-- trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
