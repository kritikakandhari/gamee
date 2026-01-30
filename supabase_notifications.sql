-- =============================================
-- MONEY MATCH NOTIFICATIONS & SOCIAL
-- =============================================

-- 1. Notifications Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'FRIEND_REQUEST', 'MATCH_INVITE', 'MESSAGE', 'DISPUTE', 'TRANSACTION', 'ALERT'
  title text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Friendships Table (Social Foundation)
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'PENDING' not null, -- 'PENDING', 'ACCEPTED', 'BLOCKED'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id)
);

-- 3. RLS Policies
alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on notifications;
create policy "Users can view own notifications" on notifications 
for select using ( auth.uid() = user_id );

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications" on notifications 
for update using ( auth.uid() = user_id );

alter table public.friendships enable row level security;

drop policy if exists "Users can view own friendships" on friendships;
create policy "Users can view own friendships" on friendships 
for select using ( auth.uid() = user_id or auth.uid() = friend_id );

drop policy if exists "Users can manage own friendships" on friendships;
create policy "Users can manage own friendships" on friendships 
for all using ( auth.uid() = user_id or auth.uid() = friend_id );


-- 4. Helper Function: Create Notification
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_content text,
  p_metadata jsonb default '{}'::jsonb
) returns uuid as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, content, metadata)
  values (p_user_id, p_type, p_title, p_content, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql security definer;


-- 5. Automate some notifications (Examples)

-- Transaction Notification Trigger
create or replace function public.on_transaction_notify()
returns trigger as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from wallets where id = new.wallet_id;
  
  perform public.create_notification(
    v_user_id,
    'TRANSACTION',
    'Payment Update',
    case 
      when new.amount_cents > 0 then 'Received $' || (new.amount_cents / 100.0) || ' in your wallet.'
      else 'Subtracted $' || abs(new.amount_cents / 100.0) || ' for ' || new.type || '.'
    end,
    jsonb_build_object('transaction_id', new.id, 'amount', new.amount_cents)
  );

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_transaction_created_notify on public.transactions;
create trigger on_transaction_created_notify
after insert on public.transactions
for each row execute procedure public.on_transaction_notify();


-- Match Invite/Join Notification Trigger
create or replace function public.on_match_status_notify()
returns trigger as $$
begin
  -- Notify Host when someone accepts their match
  if old.status = 'CREATED' and new.status = 'ACCEPTED' and new.accepted_by is not null then
    perform public.create_notification(
      new.created_by,
      'MATCH_INVITE',
      'Opponent Found!',
      'Someone has joined your match! Prepare for battle.',
      jsonb_build_object('match_id', new.id, 'opponent_id', new.accepted_by)
    );
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_match_status_change_notify on public.matches;
create trigger on_match_status_change_notify
after update on public.matches
for each row execute procedure public.on_match_status_notify();
