-- =============================================
-- DISAMBIGUATE CREATE_MATCH_WITH_WALLET
-- =============================================

-- 1. Drop the old 3-parameter function signature
-- Postgres requires the exact parameter types to drop an overloaded function.
DROP FUNCTION IF EXISTS public.create_match_with_wallet(text, int, int);

-- 2. Re-apply the new 7-parameter version (just in case)
-- This ensures the function exists and has the correct defaults.
create or replace function public.create_match_with_wallet(
  p_match_type text,
  p_stake_cents int,
  p_best_of int,
  p_platform text default 'PC',
  p_is_private boolean default false,
  p_rules text default null,
  p_spectator_chat_enabled boolean default true
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
  v_room_code := upper(substring(md5(random()::text) from 1 for 6));

  -- 4. Create Match
  insert into matches (
    created_by, match_type, stake_cents, total_pot_cents, 
    best_of, status, platform, is_private, room_code, rules, spectator_chat_enabled
  )
  values (
    auth.uid(), p_match_type, p_stake_cents, p_stake_cents, 
    p_best_of, 'CREATED', p_platform, p_is_private, v_room_code, p_rules, p_spectator_chat_enabled
  )
  returning id into v_match_id;

  -- 5. Record Transaction
  insert into transactions (wallet_id, amount_cents, type, reference_id, description)
  values (v_wallet_id, -p_stake_cents, 'ENTRY_FEE', v_match_id, 'Entry fee for match');

  return json_build_object('success', true, 'match_id', v_match_id, 'room_code', v_room_code);
end;
$$;
