-- =============================================
-- 1. WALLETS & TRANSACTIONS
-- =============================================

-- Create Wallets Table
create table if not exists public.wallets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null unique,
  balance_cents int default 0 not null check (balance_cents >= 0), -- No negative balances
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Transactions Table (Ledger)
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  wallet_id uuid references public.wallets(id) not null,
  amount_cents int not null, -- Positive for add, Negative for subtract
  type text not null, -- 'DEPOSIT', 'WITHDRAWAL', 'ENTRY_FEE', 'PAYOUT', 'REFUND'
  reference_id uuid, -- Can be match_id or null
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Wallets
alter table public.wallets enable row level security;
create policy "Users can view own wallet" on wallets for select using ( auth.uid() = user_id );
-- No insert/update policy for users! Only backend functions can modify money.

-- RLS for Transactions
alter table public.transactions enable row level security;
create policy "Users can view own transactions" on transactions for select 
using ( wallet_id in (select id from wallets where user_id = auth.uid()) );

-- =============================================
-- 2. DISPUTES
-- =============================================

create table if not exists public.disputes (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) not null,
  raised_by uuid references public.profiles(id) not null,
  reason text not null,
  status text default 'OPEN' not null, -- 'OPEN', 'RESOLVED_USER', 'RESOLVED_OPPONENT', 'REJECTED'
  admin_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Disputes
alter table public.disputes enable row level security;
create policy "Participants can view disputes" on disputes for select 
using ( exists (select 1 from matches m where m.id = match_id and (m.created_by = auth.uid() or m.accepted_by = auth.uid())) );
create policy "Anyone can raise dispute" on disputes for insert with check ( auth.uid() = raised_by );

-- =============================================
-- 3. HELPER FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create Wallet for New Users
create or replace function public.handle_new_user_wallet()
returns trigger as $$
begin
  insert into public.wallets (user_id, balance_cents)
  values (new.id, 0); -- Start with 0 (or 1000 for verification/bonus)
  return new;
end;
$$ language plpgsql security definer;

-- Trigger (Safe to recreate)
drop trigger if exists on_auth_user_created_wallet on auth.users;
create trigger on_auth_user_created_wallet
  after insert on auth.users
  for each row execute procedure public.handle_new_user_wallet();

-- Backfill Wallets for existing users
insert into public.wallets (user_id)
select id from public.profiles
where id not in (select user_id from public.wallets);


-- =============================================
-- 4. SECURE MONEY FUNCTIONS (RPC)
-- =============================================

-- Mock Deposit (For Testing Only)
create or replace function public.mock_deposit(amount_cents int)
returns json
language plpgsql security definer as $$
declare
  v_wallet_id uuid;
begin
  select id into v_wallet_id from wallets where user_id = auth.uid();
  if v_wallet_id is null then raise exception 'Wallet not found'; end if;

  update wallets set balance_cents = balance_cents + amount_cents where id = v_wallet_id;
  
  insert into transactions (wallet_id, amount_cents, type, description)
  values (v_wallet_id, amount_cents, 'DEPOSIT', 'Test Deposit');

  return json_build_object('success', true, 'new_balance', (select balance_cents from wallets where id = v_wallet_id));
end;
$$;


-- Create Match with Entry Fee (Atomic)
create or replace function public.create_match_with_wallet(
  p_match_type text,
  p_stake_cents int,
  p_best_of int
)
returns json
language plpgsql security definer as $$
declare
  v_wallet_id uuid;
  v_match_id uuid;
begin
  -- 1. Check Balance
  select id into v_wallet_id from wallets where user_id = auth.uid();
  if (select balance_cents from wallets where id = v_wallet_id) < p_stake_cents then
    raise exception 'Insufficient funds';
  end if;

  -- 2. Deduct Funds
  update wallets set balance_cents = balance_cents - p_stake_cents where id = v_wallet_id;

  -- 3. Create Match
  insert into matches (created_by, match_type, stake_cents, total_pot_cents, best_of, status)
  values (auth.uid(), p_match_type, p_stake_cents, p_stake_cents, p_best_of, 'CREATED') -- Pot starts with creator's share
  returning id into v_match_id;

  -- 4. Record Transaction
  insert into transactions (wallet_id, amount_cents, type, reference_id, description)
  values (v_wallet_id, -p_stake_cents, 'ENTRY_FEE', v_match_id, 'Entry fee for match');

  return json_build_object('success', true, 'match_id', v_match_id);
end;
$$;


-- Join Match with Entry Fee (Atomic)
create or replace function public.join_match_with_wallet(p_match_id uuid)
returns json
language plpgsql security definer as $$
declare
  v_wallet_id uuid;
  v_match_stake int;
  v_match_status text;
begin
  -- 1. Get Match Info
  select stake_cents, status into v_match_stake, v_match_status from matches where id = p_match_id;

  if v_match_status != 'CREATED' then raise exception 'Match is not open'; end if;

  -- 2. Check Balance
  select id into v_wallet_id from wallets where user_id = auth.uid();
  if (select balance_cents from wallets where id = v_wallet_id) < v_match_stake then
    raise exception 'Insufficient funds';
  end if;

  -- 3. Deduct Funds
  update wallets set balance_cents = balance_cents - v_match_stake where id = v_wallet_id;

  -- 4. Update Match (Add to Pot, Set Status)
  update matches 
  set 
    accepted_by = auth.uid(),
    status = 'ACCEPTED',
    total_pot_cents = total_pot_cents + v_match_stake,
    updated_at = now()
  where id = p_match_id;

  -- 5. Record Transaction
  insert into transactions (wallet_id, amount_cents, type, reference_id, description)
  values (v_wallet_id, -v_match_stake, 'ENTRY_FEE', p_match_id, 'Entry fee for match join');

  return json_build_object('success', true);
end;
$$;


-- Complete Match & Payout (Updated for Wallet)
create or replace function public.complete_match_with_payout(p_match_id uuid, p_winner_id uuid)
returns json
language plpgsql security definer as $$
declare
  v_match record;
  v_loser_id uuid;
  v_total_pot int;
  v_platform_fee int;
  v_payout int;
  v_winner_wallet uuid;
begin
  select * into v_match from matches where id = p_match_id;
  
  if v_match.status != 'IN_PROGRESS' and v_match.status != 'ACCEPTED' then raise exception 'Invalid match status'; end if;

  -- Logic to determine loser (same as before)
  if v_match.created_by = p_winner_id then v_loser_id := v_match.accepted_by;
  else v_loser_id := v_match.created_by; end if;

  -- Calculate Payout
  v_total_pot := v_match.total_pot_cents;
  v_platform_fee := round(v_total_pot * 0.10); -- 10% Fee
  v_payout := v_total_pot - v_platform_fee;

  -- Update Match (Winner, Status)
  update matches 
  set status = 'COMPLETED', winner_id = p_winner_id, updated_at = now() 
  where id = p_match_id;

  -- Transfer Funds to Winner
  select id into v_winner_wallet from wallets where user_id = p_winner_id;
  update wallets set balance_cents = balance_cents + v_payout where id = v_winner_wallet;

  -- Record Transaction
  insert into transactions (wallet_id, amount_cents, type, reference_id, description)
  values (v_winner_wallet, v_payout, 'PAYOUT', p_match_id, 'Match Winnings (less fees)');

  -- (Optional) Update Elo Rankings here too... for now keeping it simple or calling the other function
  perform public.update_elo_rating(p_winner_id, v_loser_id); -- Assuming we break that logic out or inline it

  return json_build_object('success', true);
end;
$$;

-- Helper for Elo (Extracted from previous function for cleaner code)
create or replace function public.update_elo_rating(winner_id uuid, loser_id uuid)
returns void language plpgsql as $$
declare
  v_w_rating int; v_l_rating int;
  v_new_w int; v_new_l int;
  v_exp_w float;
begin
  select rating into v_w_rating from profiles where id = winner_id;
  select rating into v_l_rating from profiles where id = loser_id;
  
  v_exp_w := 1.0 / (1.0 + power(10.0, (v_l_rating - v_w_rating)::numeric / 400.0));
  v_new_w := v_w_rating + round(32 * (1 - v_exp_w));
  v_new_l := v_l_rating + round(32 * (0 - (1.0 - v_exp_w)));

  update profiles set rating = v_new_w, wins = wins + 1 where id = winner_id;
  update profiles set rating = v_new_l, losses = losses + 1 where id = loser_id;
end;
$$;
