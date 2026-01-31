-- ENHANCED MATCHMAKING & REPUTATION SCHEMA

-- 1. Update Profiles with Reputation and Skill tiers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reputation_score integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS rank_tier text DEFAULT 'BRONZE',
ADD COLUMN IF NOT EXISTS elo_rating integer DEFAULT 1000;

-- 2. Create Match Difficulty Helper
create or replace function public.calculate_match_fairness(
  p_user_1_id uuid,
  p_user_2_id uuid
) returns float as $$
declare
  v_elo1 int;
  v_elo2 int;
begin
  select elo_rating into v_elo1 from public.profiles where id = p_user_1_id;
  select elo_rating into v_elo2 from public.profiles where id = p_user_2_id;
  
  -- Probability of user 1 winning (Elo formula)
  return 1.0 / (1.0 + pow(10, (v_elo2 - v_elo1) / 400.0));
end;
$$ language plpgsql security definer;

-- 3. Skill-Based Match Recommendations
create or replace function public.get_recommended_matches(p_user_id uuid)
returns setof public.matches as $$
declare
  v_user_elo int;
begin
  select elo_rating into v_user_elo from public.profiles where id = p_user_id;

  return query
  select m.*
  from public.matches m
  join public.profiles creator on m.created_by = creator.id
  where m.status = 'CREATED'
    and m.created_by != p_user_id
    -- Within 300 Elo range
    and abs(creator.elo_rating - v_user_elo) <= 300
  order by m.created_at desc
  limit 20;
end;
$$ language plpgsql security definer;

-- 4. Abandonment Penalties
-- If a player leaves an "ACCEPTED" match before it finishes, they lose reputation
create or replace function public.on_match_abandon_penalty()
returns trigger as $$
begin
  -- If status changes from ACCEPTED to CREATED (Reset) or if it's explicitly cancelled by a joined player
  if old.status = 'ACCEPTED' and new.status = 'CREATED' then
    -- Penalize the user who was 'accepted_by'
    update public.profiles 
    set 
        reputation_score = reputation_score - 10,
        elo_rating = elo_rating - 25
    where id = old.accepted_by;
    
    -- Notify the host
    perform public.create_notification(
      new.created_by,
      'APP_ALERT',
      'Opponent Abandonded',
      'The opponent has left the match. You have been placed back in the lobby.',
      jsonb_build_object('match_id', new.id)
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS tr_match_abandon ON public.matches;
CREATE TRIGGER tr_match_abandon
  AFTER UPDATE OF status ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.on_match_abandon_penalty();

-- 5. Reputation Policy
-- Ensure reputation doesn't drop below 0
ALTER TABLE public.profiles ADD CONSTRAINT reputation_min CHECK (reputation_score >= 0);
