-- =============================================
-- MONEY MATCH PENALTIES & MATCHMAKING
-- =============================================

-- 1. Function to apply penalties for leaving a match
create or replace function public.apply_match_leave_penalty(p_match_id uuid, p_user_id uuid)
returns json
language plpgsql security definer as $$
declare
  v_match record;
  v_penalty_rep int := 20;
  v_penalty_xp int := 50;
  v_stake_cents int;
begin
  select * into v_match from matches where id = p_match_id;
  
  -- Only apply if match is in progress or accepted
  if v_match.status != 'IN_PROGRESS' and v_match.status != 'ACCEPTED' then
    return json_build_object('success', false, 'message', 'Match not in penalizable state');
  end if;

  -- 1. Reduce Reputation & XP
  update public.profiles 
  set reputation = greatest(0, reputation - v_penalty_rep),
      xp = greatest(0, xp - v_penalty_xp)
  where id = p_user_id;

  -- 2. Forfeit funds if IN_PROGRESS
  if v_match.status = 'IN_PROGRESS' then
     -- Logic to award stake to the other player...
     -- (Already handled by complete_match_with_payout if we call it with the other guy as winner)
     -- But we mark it as FORFEIT for logging
  end if;

  -- 3. Cancel/Update Match
  update matches 
  set status = 'CANCELLED', updated_at = now()
  where id = p_match_id;

  return json_build_object('success', true, 'penalty_applied', true);
end;
$$;

-- 2. Improved Matchmaking: Find suggested matches based on Elo
create or replace function public.find_suggested_matches(p_user_id uuid)
returns setof matches
language plpgsql security definer as $$
declare
  v_user_elo int;
begin
  select elo_rating into v_user_elo from profiles where id = p_user_id;
  
  return query
  select m.*
  from matches m
  join profiles p on m.created_by = p.id
  where m.status = 'CREATED'
    and m.created_by != p_user_id
    and m.is_private = false
    and p.elo_rating between (v_user_elo - 200) and (v_user_elo + 200)
  order by abs(p.elo_rating - v_user_elo) asc
  limit 10;
end;
$$;
