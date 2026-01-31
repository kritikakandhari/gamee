-- MISSIONS & CUSTOMIZATION SCHEMA

-- 1. Missions Table
CREATE TABLE IF NOT EXISTS public.missions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    type text NOT NULL CHECK (type IN ('DAILY', 'WEEKLY', 'CAREER')),
    target_value integer NOT NULL,
    reward_xp integer DEFAULT 0,
    reward_rank_points integer DEFAULT 0,
    reward_credits integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 2. User Missions progress
CREATE TABLE IF NOT EXISTS public.user_missions (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE,
    current_value integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamptz,
    PRIMARY KEY (user_id, mission_id)
);

-- 3. Customization Items (Borders, Titles, etc.)
CREATE TABLE IF NOT EXISTS public.customization_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL CHECK (category IN ('BORDER', 'TITLE', 'CARD_BANNER')),
    rarity text DEFAULT 'COMMON',
    image_url text, -- For borders/banners
    rank_requirement integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 4. User Inventory
CREATE TABLE IF NOT EXISTS public.user_inventory (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id uuid REFERENCES public.customization_items(id) ON DELETE CASCADE,
    unlocked_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, item_id)
);

-- 5. Add columns to profiles for active customization
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_border_id uuid REFERENCES public.customization_items(id),
ADD COLUMN IF NOT EXISTS active_title_id uuid REFERENCES public.customization_items(id),
ADD COLUMN IF NOT EXISTS portfolio_bio text,
ADD COLUMN IF NOT EXISTS preferred_region text,
ADD COLUMN IF NOT EXISTS preferred_platform text;

-- 6. Service Fee Logic Function (Helper for future transactions)
-- This computes the net amount after a service fee (e.g. 10%)
create or replace function public.calculate_net_amount(amount_cents integer, fee_percent numeric DEFAULT 10)
returns integer as $$
begin
  return floor(amount_cents * (1 - (fee_percent / 100.0)));
end;
$$ language plpgsql;

-- 7. Seed initial Missions
INSERT INTO public.missions (title, description, type, target_value, reward_xp, reward_rank_points)
VALUES 
('Match Maker', 'Complete 3 money matches', 'DAILY', 3, 100, 10),
('High Roller', 'Win a match with stakes over $20', 'WEEKLY', 1, 500, 50),
('Veteran', 'Complete 100 matches total', 'CAREER', 100, 2000, 200)
ON CONFLICT DO NOTHING;
