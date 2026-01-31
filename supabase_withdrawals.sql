-- =========================================================
-- FGC MONEY MATCH: REAL WITHDRAWAL SYSTEM
-- =========================================================

-- 1. EXTEND TRANSACTIONS TABLE
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'COMPLETED' 
CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'));

-- 2. WITHDRAWAL REQUESTS TABLE (Securely store bank/payment info)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  
  -- Payment Details (Encrypted or sensitive-ish)
  method text NOT NULL, -- 'BANK', 'PAYPAL', 'UPI'
  account_details jsonb NOT NULL, -- { iban, bank_name, paypal_email, etc }
  
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
  admin_notes text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Withdrawals
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own withdrawals" ON withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create withdrawals" ON withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. RPC: REQUEST WITHDRAWAL
-- Deducts balance immediately and holds it in PENDING status
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount_cents int,
  p_method text,
  p_account_details jsonb
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wallet_id uuid;
  v_balance int;
BEGIN
  -- 1. Check Auth
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- 2. Get Wallet
  SELECT id, balance_cents INTO v_wallet_id, v_balance 
  FROM wallets WHERE user_id = auth.uid();

  -- 3. Validate Balance
  IF v_balance < p_amount_cents THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;

  -- 4. Deduct Balance
  UPDATE wallets SET balance_cents = balance_cents - p_amount_cents WHERE id = v_wallet_id;

  -- 5. Record Transaction (PENDING)
  INSERT INTO transactions (wallet_id, amount_cents, type, description, status)
  VALUES (v_wallet_id, -p_amount_cents, 'WITHDRAWAL', 'Withdrawal Request (' || p_method || ')', 'PENDING');

  -- 6. Record Withdrawal Request for Admin
  INSERT INTO withdrawal_requests (user_id, amount_cents, method, account_details)
  VALUES (auth.uid(), p_amount_cents, p_method, p_account_details);

  RETURN json_build_object('success', true);
END;
$$;
