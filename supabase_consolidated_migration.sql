-- ==========================================
-- MONEY MATCH: CONSOLIDATED SCHEMA UPGRADE
-- This script applies ALL missing features:
-- 1. Admin Roles
-- 2. Matchmaking (Skill, Difficulty)
-- 3. Gameplay (Twitch, Scores)
-- 4. Match Completion Logic
-- ==========================================

-- 1. ADMIN ROLE & PROFILES UPDATE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'reputation_score') THEN
        ALTER TABLE profiles ADD COLUMN reputation_score INTEGER DEFAULT 100;
    END IF;
END $$;

-- 2. MATCHES TABLE EXPANSION (Gameplay features)
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
    -- Score Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'score_p1') THEN
        ALTER TABLE matches ADD COLUMN score_p1 INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'score_p2') THEN
        ALTER TABLE matches ADD COLUMN score_p2 INTEGER;
    END IF;
END $$;

-- 3. FUNCTION TO JOIN MATCH VIA CODE
CREATE OR REPLACE FUNCTION join_match_by_code(code_input TEXT, player_id_input UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    match_record RECORD;
BEGIN
    -- Find the match
    SELECT * INTO match_record
    FROM matches
    WHERE room_code = code_input
    AND status = 'CREATED'
    LIMIT 1;

    IF match_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired room code');
    END IF;

    -- Cannot join own match
    IF match_record.created_by = player_id_input THEN
        RETURN jsonb_build_object('success', false, 'message', 'You cannot join your own match');
    END IF;

    -- Update the match
    UPDATE matches
    SET 
        accepted_by = player_id_input,
        status = 'ACCEPTED',
        updated_at = NOW()
    WHERE id = match_record.id;

    RETURN jsonb_build_object('success', true, 'match_id', match_record.id);
END;
$$;

-- 4. FUNCTION TO COMPLETE MATCH (Basic version)
CREATE OR REPLACE FUNCTION complete_match_basic(match_id_input UUID, winner_id_input UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE matches
    SET 
        status = 'COMPLETED',
        winner_id = winner_id_input,
        completed_at = NOW()
    WHERE id = match_id_input;
    
    -- NOTE: Payout logic is handled by 'transfer_winnings' in financial schema
END;
$$;

-- 5. FUNCTION TO MAKE USER AN ADMIN (Run this with your User ID!)
-- Usage: SELECT make_user_admin('your-user-id-here');
CREATE OR REPLACE FUNCTION make_user_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles
    SET role = 'admin'
    WHERE id = target_user_id;
END;
$$;
