-- Function to complete match and distribute funds
create or replace function public.complete_match_with_payout(
  p_match_id uuid,
  p_winner_id uuid
)
returns json
language plpgsql security definer as $$
declare
  v_match record;
  v_payout_amount int;
  v_fee_amount int;
  v_winner_wallet uuid;
begin
  -- 1. Get Match Details
  select * into v_match from matches where id = p_match_id;

  if not found then
    raise exception 'Match not found';
  end if;

  if v_match.status != 'IN_PROGRESS' then
    raise exception 'Match is not in progress (%s)', v_match.status;
  end if;

  if p_winner_id != v_match.created_by and p_winner_id != v_match.accepted_by then
    raise exception 'Winner must be a participant';
  end if;

  -- 2. Calculate Amounts (5% Fee)
  v_payout_amount := floor(v_match.total_pot_cents * 0.95);
  v_fee_amount := v_match.total_pot_cents - v_payout_amount;

  -- 3. Get Winner Wallet
  select id into v_winner_wallet from wallets where user_id = p_winner_id;
  
  if not found then
    -- Should auto-create wallet if missing, but for now raise error
    raise exception 'Winner wallet not found';
  end if;

  -- 4. Update Wallet
  update wallets set balance_cents = balance_cents + v_payout_amount where id = v_winner_wallet;

  -- 5. Record Transactions
  insert into transactions (wallet_id, amount_cents, type, reference_id, description)
  values 
    (v_winner_wallet, v_payout_amount, 'MATCH_WIN', p_match_id, 'Prize pool payout'),
    (v_winner_wallet, 0, 'SERVICE_FEE', p_match_id, 'Platform fee: ' || (v_fee_amount::float / 100)::text);

  -- 6. Update Match Status
  update matches 
  set 
    status = 'COMPLETED', 
    winner_id = p_winner_id,
    updated_at = now(),
    completed_at = now()
  where id = p_match_id;

  -- 7. Update Stats (Using existing logic if any, or simple increments)
  update profiles set wins = wins + 1, rank_points = rank_points + 25 where id = p_winner_id;
  
  -- Update loser
  if p_winner_id = v_match.created_by then
    update profiles set losses = losses + 1, rank_points = greatest(rank_points - 10, 0) where id = v_match.accepted_by;
  else
    update profiles set losses = losses + 1, rank_points = greatest(rank_points - 10, 0) where id = v_match.created_by;
  end if;

  return json_build_object('success', true, 'payout', v_payout_amount);
end;
$$;
