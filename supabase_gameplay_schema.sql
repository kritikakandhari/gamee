-- Add gameplay columns to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS twitch_url TEXT,
ADD COLUMN IF NOT EXISTS score_p1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_p2 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Function to confirm match score
CREATE OR REPLACE FUNCTION confirm_match_score(match_id UUID, p_winner_id UUID, p_score_p1 INTEGER, p_score_p2 INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE matches
    SET 
        winner_id = p_winner_id,
        score_p1 = p_score_p1,
        score_p2 = p_score_p2,
        status = 'COMPLETED',
        completed_at = NOW()
    WHERE id = match_id;

    -- Update stats for winner
    UPDATE profiles 
    SET 
        wins = wins + 1,
        rank_points = rank_points + 25,
        reputation_score = LEAST(reputation_score + 1, 100) -- Cap reputation at 100
    WHERE id = p_winner_id;

    -- Update stats for loser (assuming 2 player match)
    UPDATE profiles 
    SET 
        losses = losses + 1,
        rank_points = GREATEST(rank_points - 10, 0) -- Floor rank points at 0
    WHERE id IN (
        SELECT player1_id FROM matches WHERE id = match_id AND player1_id != p_winner_id
        UNION
        SELECT player2_id FROM matches WHERE id = match_id AND player2_id != p_winner_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
