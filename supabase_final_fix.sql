-- =========================================================
-- FGC MONEY MATCH: FINAL MASTER FIX
-- This script fixes "Failed to claim victory" and ensures ALL features work.
-- =========================================================

-- 1. ENSURE BASE TABLES EXIST (Profiles, Wallets, Matches)
-- ---------------------------------------------------------

-- Add missing columns to Profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rating') THEN
        ALTER TABLE profiles ADD COLUMN rating INTEGER DEFAULT 1000;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wins') THEN
        ALTER TABLE profiles ADD COLUMN wins INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'losses') THEN
        ALTER TABLE profiles ADD COLUMN losses INTEGER DEFAULT 0;
    END IF;
END $$;

-- Wallets & Transactions
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL UNIQUE,
  balance_cents int DEFAULT 0 NOT NULL CHECK (balance_cents >= 0),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id uuid REFERENCES public.wallets(id) NOT NULL,
  amount_cents int NOT NULL,
  type text NOT NULL,
  reference_id uuid,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Match Stats (CRITICAL: Often missing, causes "Claim Victory" to fail)
CREATE TABLE IF NOT EXISTS public.match_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES public.matches(id) NOT NULL,
  player_id uuid REFERENCES public.profiles(id) not null,
  duration_seconds int not null,
  apm int default 0,
  damage_dealt int default 0,
  damage_taken int default 0,
  ai_win_probability float,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. SECURITY (RLS)
-- ---------------------------------------------------------
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own" ON wallets;
DROP POLICY IF EXISTS "Users view own wallet" ON wallets;
CREATE POLICY "Users view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own trans" ON transactions;
CREATE POLICY "Users view own trans" ON transactions FOR SELECT 
USING ( wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()) );

ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view stats" ON match_stats;
CREATE POLICY "Anyone view stats" ON match_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Players upload stats" ON match_stats;
CREATE POLICY "Players upload stats" ON match_stats FOR INSERT WITH CHECK (auth.uid() = player_id);

-- 3. FUNCTIONS (Payouts & Ratings)
-- ---------------------------------------------------------

-- Helper: Update Ratings
CREATE OR REPLACE FUNCTION public.update_elo_rating(winner_id uuid, loser_id uuid)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_w_rating int; v_l_rating int;
  v_new_w int; v_new_l int;
  v_exp_w float;
BEGIN
  SELECT rating INTO v_w_rating FROM profiles WHERE id = winner_id;
  SELECT rating INTO v_l_rating FROM profiles WHERE id = loser_id;
  
  IF v_w_rating IS NULL THEN v_w_rating := 1000; END IF;
  IF v_l_rating IS NULL THEN v_l_rating := 1000; END IF;

  v_exp_w := 1.0 / (1.0 + power(10.0, (v_l_rating - v_w_rating)::numeric / 400.0));
  v_new_w := v_w_rating + round(32 * (1 - v_exp_w));
  v_new_l := v_l_rating + round(32 * (0 - (1.0 - v_exp_w)));

  UPDATE profiles SET rating = v_new_w, wins = COALESCE(wins, 0) + 1 WHERE id = winner_id;
  UPDATE profiles SET rating = v_new_l, losses = COALESCE(losses, 0) + 1 WHERE id = loser_id;
END;
$$;

-- MASTER FUNCTION: Complete Match with Payout
CREATE OR REPLACE FUNCTION public.complete_match_with_payout(p_match_id uuid, p_winner_id uuid)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
  v_payout int;
  v_winner_wallet uuid;
BEGIN
  -- 1. Fetch Match
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  
  IF v_match.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Match not found');
  END IF;

  -- 2. Validate Status
  IF v_match.status != 'IN_PROGRESS' AND v_match.status != 'ACCEPTED' THEN 
    RETURN json_build_object('success', false, 'error', 'Status must be IN_PROGRESS (is ' || v_match.status || ')');
  END IF;

  -- 3. Determine Participants
  IF v_match.created_by = p_winner_id THEN 
    v_loser_id := v_match.accepted_by;
  ELSE 
    v_loser_id := v_match.created_by; 
  END IF;

  -- 4. Calculate Payout (Take 5% Fee)
  v_payout := round(v_match.total_pot_cents * 0.95);

  -- 5. Update Match Record
  UPDATE matches 
  SET status = 'COMPLETED', winner_id = p_winner_id, updated_at = now(), completed_at = now()
  WHERE id = p_match_id;

  -- 6. Payout to Wallet
  SELECT id INTO v_winner_wallet FROM wallets WHERE user_id = p_winner_id;
  IF v_winner_wallet IS NULL THEN
    INSERT INTO wallets (user_id, balance_cents) VALUES (p_winner_id, 0) RETURNING id INTO v_winner_wallet;
  END IF;

  UPDATE wallets SET balance_cents = balance_cents + v_payout WHERE id = v_winner_wallet;

  -- 7. Record Transaction
  INSERT INTO transactions (wallet_id, amount_cents, type, reference_id, description)
  VALUES (v_winner_wallet, v_payout, 'MATCH_WIN', p_match_id, 'Winnings for Match ' || p_match_id);

  -- 8. Update Ratings/Stats
  IF v_loser_id IS NOT NULL THEN
    PERFORM public.update_elo_rating(p_winner_id, v_loser_id);
  ELSE
    UPDATE profiles SET wins = COALESCE(wins, 0) + 1 WHERE id = p_winner_id;
  END IF;

  RETURN json_build_object('success', true, 'payout', v_payout);
END;
$$;

-- 4. ENSURE WALLET CREATION FOR EVERYONE
-- ---------------------------------------------------------
INSERT INTO public.wallets (user_id, balance_cents)
SELECT id, 0 FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.wallets)
ON CONFLICT (user_id) DO NOTHING;
