-- =========================================================
-- FGC MONEY MATCH: COMPLETE SCHEMA FIX
-- Run this script to fix "Failed to claim victory" and enable all features.
-- =========================================================

-- 1. ENSURE WALLET SYSTEM EXISTS
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

-- Enable RLS for security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own" ON wallets;
CREATE POLICY "Users view own" ON wallets FOR SELECT USING ( auth.uid() = user_id );

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT 
USING ( wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()) );

-- 2. ENSURE PROFILE COLUMNS EXPECTED BY CODE
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

-- 3. HELPER: AUTO-CREATE WALLET FOR EXISTING USERS
INSERT INTO public.wallets (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.wallets);


-- 4. FUNCTION: UPDATE ELO RATING
CREATE OR REPLACE FUNCTION public.update_elo_rating(winner_id uuid, loser_id uuid)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_w_rating int; v_l_rating int;
  v_new_w int; v_new_l int;
  v_exp_w float;
BEGIN
  SELECT rating INTO v_w_rating FROM profiles WHERE id = winner_id;
  SELECT rating INTO v_l_rating FROM profiles WHERE id = loser_id;
  
  -- Default to 1000 if null
  IF v_w_rating IS NULL THEN v_w_rating := 1000; END IF;
  IF v_l_rating IS NULL THEN v_l_rating := 1000; END IF;

  v_exp_w := 1.0 / (1.0 + power(10.0, (v_l_rating - v_w_rating)::numeric / 400.0));
  v_new_w := v_w_rating + round(32 * (1 - v_exp_w));
  v_new_l := v_l_rating + round(32 * (0 - (1.0 - v_exp_w)));

  UPDATE profiles SET rating = v_new_w, wins = COALESCE(wins, 0) + 1 WHERE id = winner_id;
  UPDATE profiles SET rating = v_new_l, losses = COALESCE(losses, 0) + 1 WHERE id = loser_id;
END;
$$;


-- 5. FUNCTION: COMPLETE MATCH WITH PAYOUT (The Missing Piece!)
CREATE OR REPLACE FUNCTION public.complete_match_with_payout(p_match_id uuid, p_winner_id uuid)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
  v_total_pot int;
  v_platform_fee int;
  v_payout int;
  v_winner_wallet uuid;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  
  -- Validation
  IF v_match.status != 'IN_PROGRESS' AND v_match.status != 'ACCEPTED' THEN 
    RAISE EXCEPTION 'Match is not in progress (Current: %)', v_match.status; 
  END IF;

  -- Determine Loser
  IF v_match.created_by = p_winner_id THEN v_loser_id := v_match.accepted_by;
  ELSE v_loser_id := v_match.created_by; END IF;

  -- Calculate Payout
  v_total_pot := v_match.total_pot_cents;
  v_platform_fee := round(v_total_pot * 0.05); -- 5% Fee
  v_payout := v_total_pot - v_platform_fee;

  -- Update Match
  UPDATE matches 
  SET status = 'COMPLETED', winner_id = p_winner_id, updated_at = now(), completed_at = now()
  WHERE id = p_match_id;

  -- Transfer Funds
  SELECT id INTO v_winner_wallet FROM wallets WHERE user_id = p_winner_id;
  
  IF v_winner_wallet IS NULL THEN
    -- Fallback: Create wallet if missing
    INSERT INTO wallets (user_id) VALUES (p_winner_id) RETURNING id INTO v_winner_wallet;
  END IF;

  UPDATE wallets SET balance_cents = balance_cents + v_payout WHERE id = v_winner_wallet;

  -- Record Transaction
  INSERT INTO transactions (wallet_id, amount_cents, type, reference_id, description)
  VALUES (v_winner_wallet, v_payout, 'PAYOUT', p_match_id, 'Match Winnings (less 5% fee)');

  -- Update Ratings
  PERFORM public.update_elo_rating(p_winner_id, v_loser_id);

  RETURN json_build_object('success', true);
END;
$$;


-- 6. ENSURE CREATE/JOIN FUNCTIONS EXIST (Just in case)
CREATE OR REPLACE FUNCTION public.create_match_with_wallet(
  p_match_type text,
  p_stake_cents int,
  p_best_of int,
  p_platform text DEFAULT 'PC',
  p_is_private boolean DEFAULT false,
  p_rules text DEFAULT '',
  p_spectator_chat_enabled boolean DEFAULT true,
  p_twitch_url text DEFAULT null
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wallet_id uuid;
  v_match_id uuid;
BEGIN
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = auth.uid();
  
  -- Auto-create wallet if needed
  IF v_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, balance_cents) VALUES (auth.uid(), 0) RETURNING id INTO v_wallet_id;
  END IF;

  IF (SELECT balance_cents FROM wallets WHERE id = v_wallet_id) < p_stake_cents THEN
    RAISE EXCEPTION 'Insufficient funds (Wallet Balance too low)';
  END IF;

  UPDATE wallets SET balance_cents = balance_cents - p_stake_cents WHERE id = v_wallet_id;

  INSERT INTO matches (created_by, match_type, stake_cents, total_pot_cents, best_of, status, platform, is_private, rules, spectator_chat_enabled, twitch_url)
  VALUES (auth.uid(), p_match_type, p_stake_cents, p_stake_cents, p_best_of, 'CREATED', p_platform, p_is_private, p_rules, p_spectator_chat_enabled, p_twitch_url)
  RETURNING id INTO v_match_id;

  INSERT INTO transactions (wallet_id, amount_cents, type, reference_id, description)
  VALUES (v_wallet_id, -p_stake_cents, 'ENTRY_FEE', v_match_id, 'Entry fee for match');

  RETURN json_build_object('success', true, 'match_id', v_match_id);
END;
$$;
