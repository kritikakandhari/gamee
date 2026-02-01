-- =========================================================
-- FGC MONEY MATCH: ULTIMATE RPC FIX (v2)
-- Run this in your Supabase SQL Editor to fix the "Function Not Found" error.
-- =========================================================

-- 1. DROP ALL PREVIOUS VERSIONS (To avoid ambiguity)
-- ---------------------------------------------------------
-- We drop by name only first to clear the way, then specific signatures.
-- This is necessary because Postgres allows overloading, and PostgREST 
-- can get confused if signatures aren't perfectly matched.

DROP FUNCTION IF EXISTS public.create_match_with_wallet(text, text, int, int);
DROP FUNCTION IF EXISTS public.create_match_with_wallet(text, int, int, text, boolean, text, boolean);
DROP FUNCTION IF EXISTS public.create_match_with_wallet(text, text, int, int, text, boolean, text, boolean, text);

-- 2. ENSURE COLUMNS EXIST IN MATCHES TABLE
-- ---------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'game') THEN
        ALTER TABLE matches ADD COLUMN game TEXT DEFAULT 'SF6';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'platform') THEN
        ALTER TABLE matches ADD COLUMN platform TEXT DEFAULT 'PC';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'is_private') THEN
        ALTER TABLE matches ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'room_code') THEN
        ALTER TABLE matches ADD COLUMN room_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'rules') THEN
        ALTER TABLE matches ADD COLUMN rules TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'spectator_chat_enabled') THEN
        ALTER TABLE matches ADD COLUMN spectator_chat_enabled BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'twitch_url') THEN
        ALTER TABLE matches ADD COLUMN twitch_url TEXT;
    END IF;
END $$;

-- 3. THE DEFINITIVE RPC (9 Parameters, perfectly aligned with frontend)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_match_with_wallet(
  p_best_of int,
  p_game text,
  p_is_private boolean,
  p_match_type text,
  p_platform text,
  p_rules text,
  p_spectator_chat_enabled boolean,
  p_stake_cents int,
  p_twitch_url text
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wallet_id uuid;
  v_match_id uuid;
  v_room_code text;
BEGIN
  -- 1. Get Wallet
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = auth.uid();
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, balance_cents) VALUES (auth.uid(), 0) RETURNING id INTO v_wallet_id;
  END IF;

  -- 2. Check Balance
  IF (SELECT balance_cents FROM wallets WHERE id = v_wallet_id) < p_stake_cents THEN
    RAISE EXCEPTION 'Insufficient funds (Balance too low)';
  END IF;

  -- 3. Deduct Funds
  UPDATE wallets SET balance_cents = balance_cents - p_stake_cents WHERE id = v_wallet_id;

  -- 4. Generate Room Code (6 chars)
  v_room_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  -- 5. Create Match
  INSERT INTO matches (
    created_by, game, match_type, stake_cents, total_pot_cents, 
    best_of, status, platform, is_private, room_code, rules, spectator_chat_enabled, twitch_url
  )
  VALUES (
    auth.uid(), p_game, p_match_type, p_stake_cents, p_stake_cents, 
    p_best_of, 'CREATED', p_platform, p_is_private, v_room_code, p_rules, p_spectator_chat_enabled, p_twitch_url
  )
  RETURNING id INTO v_match_id;

  -- 6. Record Transaction
  INSERT INTO transactions (wallet_id, amount_cents, type, reference_id, description)
  VALUES (v_wallet_id, -p_stake_cents, 'ENTRY_FEE', v_match_id, 'Entry fee for match creation');

  RETURN json_build_object('success', true, 'match_id', v_match_id, 'room_code', v_room_code);
END;
$$;

-- 4. FORCE SCHEMA RELOAD
-- ---------------------------------------------------------
NOTIFY pgrst, 'reload schema';
