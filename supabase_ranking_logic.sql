-- Database Function to Complete Match and Update Elo Ratings

create or replace function public.complete_match(match_id uuid, winner_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_match record;
  v_loser_id uuid;
  v_winner_rating int;
  v_loser_rating int;
  v_new_winner_rating int;
  v_new_loser_rating int;
  v_k_factor int := 32; -- Standard K-factor
  v_expected_winner float;
  v_expected_loser float;
begin
  -- 1. Get Match Details
  select * into v_match from public.matches where id = match_id;
  
  if v_match.status != 'IN_PROGRESS' and v_match.status != 'ACCEPTED' then
    raise exception 'Match must be IN_PROGRESS or ACCEPTED to complete';
  end if;

  -- 2. Identify Loser
  if v_match.created_by = winner_id then
    v_loser_id := v_match.accepted_by;
  elsif v_match.accepted_by = winner_id then
    v_loser_id := v_match.created_by;
  else
    raise exception 'Winner must be a participant in the match';
  end if;

  -- 3. Get Current Ratings
  select rating into v_winner_rating from public.profiles where id = winner_id;
  select rating into v_loser_rating from public.profiles where id = v_loser_id;

  -- 4. Calculate Elo (Simple Implementation)
  -- Expected score = 1 / (1 + 10 ^ ((opp_rating - my_rating) / 400))
  v_expected_winner := 1.0 / (1.0 + power(10.0, (v_loser_rating - v_winner_rating)::numeric / 400.0));
  v_expected_loser := 1.0 / (1.0 + power(10.0, (v_winner_rating - v_loser_rating)::numeric / 400.0));

  -- New Rating = Old Rating + K * (Actual Score - Expected Score)
  -- Actual Score is 1 for winner, 0 for loser
  v_new_winner_rating := v_winner_rating + round(v_k_factor * (1 - v_expected_winner));
  v_new_loser_rating := v_loser_rating + round(v_k_factor * (0 - v_expected_loser));

  -- 5. Update Profiles (Ratings + W/L)
  update public.profiles 
  set rating = v_new_winner_rating, wins = wins + 1 
  where id = winner_id;

  update public.profiles 
  set rating = v_new_loser_rating, losses = losses + 1 
  where id = v_loser_id;

  -- 6. Update Match Status
  update public.matches
  set 
    status = 'COMPLETED',
    winner_id = winner_id,
    updated_at = now()
  where id = match_id;

  -- Return result
  return json_build_object(
    'success', true,
    'winner_new_rating', v_new_winner_rating,
    'loser_new_rating', v_new_loser_rating
  );
end;
$$;
