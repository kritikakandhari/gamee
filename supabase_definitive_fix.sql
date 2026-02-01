-- =========================================================
-- FGC MONEY MATCH: DEFINITIVE SCHEMA & RPC FIX
-- Run this script in your Supabase SQL Editor to resolve the 
-- "create_match_with_wallet not found" error and enable all features.
-- =========================================================

-- 1. ENSURE MATCHES TABLE COLUMNS EXIST
-- ---------------------------------------------------------
DO $$
BEGIN
    -- Twitch URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'twitch_url') THEN
        ALTER TABLE matches ADD COLUMN twitch_url TEXT;
    END IF;
    
    -- Spectator Chat
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'spectator_chat_enabled') THEN
        ALTER TABLE matches ADD COLUMN spectator_chat_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Room Code for Private Matches
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'room_code') THEN
        ALTER TABLE matches ADD COLUMN room_code TEXT;
    END IF;

    -- Platform
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'platform') THEN
        ALTER TABLE matches ADD COLUMN platform TEXT DEFAULT 'PC';
    END IF;

    -- Rules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'rules') THEN
        ALTER TABLE matches ADD COLUMN rules TEXT;
    END IF;

    -- Game Name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'game') THEN
        ALTER TABLE matches ADD COLUMN game TEXT DEFAULT 'SF6';
    END IF;
END $$;

-- 2. HELPER: ROOM CODE GENERATOR
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_room_code() 
RETURNS text AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM matches WHERE room_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- 3. DROP OLD VERSIONS TO AVOID AMBIGUITY
-- ---------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_match_with_wallet(text, int, int);
DROP FUNCTION IF EXISTS public.create_match_with_wallet(text, int, int, text, boolean, text, boolean);
DROP FUNCTION IF EXISTS public.create_match_with_wallet(text, text, int, int, text, boolean, text, boolean, text);

-- 4. MASTER FUNCTION: CREATE MATCH WITH WALLET (9 Parameters)
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

  -- 4. Generate Room Code
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

-- 5. MASTER FUNCTION: JOIN MATCH WITH WALLET
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_match_with_wallet(p_match_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wallet_id uuid;
  v_match record;
  v_user_id uuid := auth.uid();
BEGIN
  -- 1. Get Match Data
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  
  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  
  IF v_match.status != 'CREATED' THEN
    RAISE EXCEPTION 'Match already full or started';
  END IF;

  IF v_match.created_by = v_user_id THEN
    RAISE EXCEPTION 'You cannot join your own match';
  END IF;

  -- 2. Check Wallet
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = v_user_id;
  IF v_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, balance_cents) VALUES (v_user_id, 0) RETURNING id INTO v_wallet_id;
  END IF;

  IF (SELECT balance_cents FROM wallets WHERE id = v_wallet_id) < v_match.stake_cents THEN
    RAISE EXCEPTION 'Insufficient funds to join match';
  END IF;

  -- 3. Deduct Funds
  UPDATE wallets SET balance_cents = balance_cents - v_match.stake_cents WHERE id = v_wallet_id;

  -- 4. Update Match
  UPDATE matches 
  SET 
    accepted_by = v_user_id,
    status = 'ACCEPTED',
    total_pot_cents = total_pot_cents + v_match.stake_cents,
    updated_at = now()
  WHERE id = p_match_id;

  -- 5. Record Transaction
  INSERT INTO transactions (wallet_id, amount_cents, type, reference_id, description)
  VALUES (v_wallet_id, -v_match.stake_cents, 'ENTRY_FEE', p_match_id, 'Entry fee for joining match');

  RETURN json_build_object('success', true, 'match_id', p_match_id);
END;
$$;

-- 6. FINAL NOTIFY (Force schema reload)
-- ---------------------------------------------------------
NOTIFY pgrst, 'reload schema';
