-- =========================================================
-- FGC MONEY MATCH: SUBSCRIPTION SCHEMA
-- Enables feature locking (Free vs. Pro)
-- =========================================================

-- 1. ADD SUBSCRIPTION TIER TO PROFILES
-- ---------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_tier') THEN
        ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'staff'));
    END IF;
END $$;

-- 2. HELPER FUNCTION: CHECK IF USER IS SUBSCRIBED
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_pro_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id 
    AND (subscription_tier = 'pro' OR subscription_tier = 'staff')
  );
END;
$$;

-- 3. UPDATE RLS (Optional, for future use)
-- ---------------------------------------------------------
-- For now, locking happens in the UI, but we can add RLS policies here
-- to protect specific premium tables if necessary.
