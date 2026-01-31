-- =============================================
-- MONEY MATCH ADVANCED SCHEMA UPDATES
-- =============================================

-- 1. Profile Enhancements (Reputation & XP)
alter table public.profiles 
add column if not exists reputation int default 100,
add column if not exists xp int default 0,
add column if not exists level int default 1;

-- 2. Match Enhancements (Lobby Features)
alter table public.matches 
add column if not exists room_code text unique,
add column if not exists platform text default 'PC',
add column if not exists is_private boolean default false,
add column if not exists rules text,
add column if not exists spectator_chat_enabled boolean default true;

-- Function to generate unique 6-digit room codes
create or replace function generate_room_code() 
returns text as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    select exists(select 1 from matches where room_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$ language plpgsql;

-- Update Create Match RPC to support new fields and room codes
create or replace function public.create_match_with_wallet(
  p_match_type text,
  p_stake_cents int,
  p_best_of int,
  p_platform text default 'PC',
  p_is_private boolean default false,
  p_rules text default null,
  p_spectator_chat_enabled boolean default true,
  p_twitch_url text default null
)
returns json
language plpgsql security definer as $$
declare
  v_wallet_id uuid;
  v_match_id uuid;
  v_room_code text;
begin
  -- 1. Check Balance
  select id into v_wallet_id from wallets where user_id = auth.uid();
  if (select balance_cents from wallets where id = v_wallet_id) < p_stake_cents then
    raise exception 'Insufficient funds';
  end if;

  -- 2. Deduct Funds
  update wallets set balance_cents = balance_cents - p_stake_cents where id = v_wallet_id;

  -- 3. Generate Room Code
  v_room_code := generate_room_code();

  -- 4. Create Match
  insert into matches (
    created_by, match_type, stake_cents, total_pot_cents, 
    best_of, status, platform, is_private, room_code, rules, spectator_chat_enabled, twitch_url
  )
  values (
    auth.uid(), p_match_type, p_stake_cents, p_stake_cents, 
    p_best_of, 'CREATED', p_platform, p_is_private, v_room_code, p_rules, p_spectator_chat_enabled, p_twitch_url
  )
  returning id into v_match_id;

  -- 5. Record Transaction
  insert into transactions (wallet_id, amount_cents, type, reference_id, description)
  values (v_wallet_id, -p_stake_cents, 'ENTRY_FEE', v_match_id, 'Entry fee for match');

  return json_build_object('success', true, 'match_id', v_match_id, 'room_code', v_room_code);
end;
$$;
