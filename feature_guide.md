# FGC Money Match Feature Guide

If you are not seeing certain features, it is likely due to **database state** or **user role** requirements. Follow this guide to activate and locate every feature.

---

### 1. Admin Role & Dashboard
**Requirement:** Your user metadata must have `role: "admin"`.
- **How to Activate:** Run the SQL command below.
- **Where to find it:** Once activated, a **"Shield" icon + Admin** link will appear in the top navigation bar (Left side next to "Insights").

### 2. Twitch Streaming
**Where to find it:**
1. Click the **"Create Match"** button on the Matches page.
2. In the popup, scroll down.
3. You will see a toggle: **"Broadcast to Twitch"**.
4. Turn it ON and enter your channel name.
5. The stream will appear automatically on the Match Details page once the match starts.

### 3. Report Score & Winner/Loser
**Requirement:** The match must be in the **"IN PROGRESS"** state.
- **How it works:**
    1. Create or Join a match.
    2. The Host must click **"START MATCH"**.
    3. Once the status changes to "IN PROGRESS", a large green **"REPORT SCORE"** button will appear on the match page.
    4. Entering the score and submitting will automatically identify the winner and distribute the payout.

### 4. Player Performance Hooks (Win Rate/Streak)
**Requirement:** You must have at least **1 COMPLETED match**.
- **Where to find it:** It appears as a card titled **"Your Performance"** on the left side of any Match Details page.
- **Privacy:** This data is fetched live from your match history. If your history is empty, the card stays hidden to keep the UI clean.

---

### 🚀 FINAL "FORCE FIX" SQL SCRIPT
Copy and run this entire block in Supabase to resolve all errors and set your Admin status:

```sql
-- 1. FORCE FIX SECURITY POLICIES (Resolves "already exists" error)
DROP POLICY IF EXISTS "Users view own" ON wallets;
DROP POLICY IF EXISTS "Users view own wallet" ON wallets;
CREATE POLICY "Users view own" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- 2. UPDATE PAYOUT LOGIC
CREATE OR REPLACE FUNCTION public.complete_match_with_payout(p_match_id uuid, p_winner_id uuid)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match record;
  v_payout int;
  v_winner_wallet uuid;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  UPDATE matches SET status = 'COMPLETED', winner_id = p_winner_id, completed_at = now() WHERE id = p_match_id;
  
  v_payout := round(v_match.total_pot_cents * 0.95);
  SELECT id INTO v_winner_wallet FROM wallets WHERE user_id = p_winner_id;
  UPDATE wallets SET balance_cents = balance_cents + v_payout WHERE id = v_winner_wallet;

  UPDATE profiles SET wins = COALESCE(wins, 0) + 1 WHERE id = p_winner_id;
  RETURN json_build_object('success', true);
END;
$$;

-- 3. ACTIVATE YOUR ADMIN STATUS (IMPORTANT)
-- Replace the ID below with your actual User UID from Supabase Auth Tab!
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb 
WHERE id = 'PASTE_YOUR_UID_HERE';
```
