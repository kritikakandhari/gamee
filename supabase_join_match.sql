-- =============================================
-- JOIN MATCH WITH WALLET RPC
-- =============================================

create or replace function public.join_match_with_wallet(p_match_id uuid)
returns json
language plpgsql security definer as $$
declare
  v_wallet_id uuid;
  v_match record;
  v_user_id uuid := auth.uid();
begin
  -- 1. Get Match Data
  select * into v_match from matches where id = p_match_id;
  
  if v_match.id is null then
    raise exception 'Match not found';
  end if;
  
  if v_match.status != 'CREATED' then
    raise exception 'Match is already full or started';
  end if;

  if v_match.created_by = v_user_id then
    raise exception 'You cannot join your own match';
  end if;

  -- 2. Check Wallet Balance
  select id into v_wallet_id from wallets where user_id = v_user_id;
  if (select balance_cents from wallets where id = v_wallet_id) < v_match.stake_cents then
    raise exception 'Insufficient funds to join match';
  end if;

  -- 3. Deduct Funds
  update wallets set balance_cents = balance_cents - v_match.stake_cents where id = v_wallet_id;

  -- 4. Update Match
  update matches 
  set 
    accepted_by = v_user_id,
    status = 'ACCEPTED',
    total_pot_cents = total_pot_cents + v_match.stake_cents,
    updated_at = now()
  where id = p_match_id;

  -- 5. Record Transaction
  insert into transactions (wallet_id, amount_cents, type, reference_id, description)
  values (v_wallet_id, -v_match.stake_cents, 'ENTRY_FEE', p_match_id, 'Entry fee for joining match');

  return json_build_object('success', true, 'match_id', p_match_id);
end;
$$;
