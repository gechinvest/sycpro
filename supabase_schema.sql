-- SmartYield Capital Supabase Schema - CLEAN RESET SCRIPT

-- Drop existing tables if they exist (to clear any broken state)
DROP TABLE IF EXISTS deposit_methods CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS profit_logs CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS recharges CASCADE;
DROP TABLE IF EXISTS investment_plans CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referrer_id UUID REFERENCES auth.users(id),
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    total_earnings DECIMAL(12, 2) DEFAULT 0.00,
    withdraw_password TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Investment Plans
CREATE TABLE IF NOT EXISTS investment_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    daily_profit_percent DECIMAL(5, 2) DEFAULT 20.00,
    duration_days INTEGER DEFAULT 65,
    image_url TEXT
);

INSERT INTO investment_plans (id, name, amount) VALUES
('v1', 'Plan V1', 500),
('v2', 'Plan V2', 1000),
('v3', 'Plan V3', 1500),
('v4', 'Plan V4', 2500),
('v5', 'Plan V5', 4000),
('v6', 'Plan V6', 8000),
('v7', 'Plan V7', 15000),
('v8', 'Plan V8', 50000),
('v9', 'Plan V9', 100000),
('v10', 'Plan V10', 200000)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    amount = EXCLUDED.amount;

-- 3. Recharge (Deposit) Requests
CREATE TABLE IF NOT EXISTS recharges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    ft_id TEXT NOT NULL,
    screenshot_url TEXT,
    payment_gateway TEXT DEFAULT 'manual',
    is_auto_verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id)
);

-- 4. Active Investments
CREATE TABLE IF NOT EXISTS investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES investment_plans(id),
    amount DECIMAL(12, 2) NOT NULL,
    daily_profit DECIMAL(12, 2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    days_paid INTEGER DEFAULT 0,
    last_payout_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Referrals and Commissions
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES profiles(id),
    referred_id UUID REFERENCES profiles(id),
    level INTEGER CHECK (level IN (1, 2, 3)),
    commission_amount DECIMAL(12, 2) NOT NULL,
    source_investment_id UUID REFERENCES investments(id),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Profit Logs (ROI History)
CREATE TABLE IF NOT EXISTS profit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT DEFAULT 'roi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Withdrawal Requests
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    fee DECIMAL(12, 2) DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL,
    bank_account_id UUID REFERENCES bank_accounts(id),
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id)
);

-- 9. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    withdrawal_fee_percent DECIMAL DEFAULT 2.0,
    min_withdrawal_amount DECIMAL DEFAULT 400,
    daily_profit_percent DECIMAL DEFAULT 3.0,
    is_recharge_enabled BOOLEAN DEFAULT TRUE,
    is_withdrawal_enabled BOOLEAN DEFAULT TRUE,
    recharge_amounts JSONB DEFAULT '[500, 1000, 2500, 5000, 10000, 20000, 50000, 100000]'::jsonb,
    referral_reward_percent_l1 DECIMAL DEFAULT 10.0,
    referral_reward_percent_l2 DECIMAL DEFAULT 5.0,
    referral_reward_percent_l3 DECIMAL DEFAULT 2.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (id, withdrawal_fee_percent, min_withdrawal_amount, daily_profit_percent, referral_reward_percent_l1, referral_reward_percent_l2, referral_reward_percent_l3)
VALUES ('global', 2.0, 400, 3.0, 10.0, 5.0, 2.0)
ON CONFLICT (id) DO NOTHING;

-- 10. Deposit Methods
CREATE TABLE IF NOT EXISTS deposit_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_owner TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial methods
INSERT INTO deposit_methods (slug, name, account_number, account_owner) 
VALUES 
('telebirr', 'Telebirr', '0911223344', 'SYC Capital'),
('cbe', 'CBE Birr', '1000123456789', 'SYC Capital'),
('abyssinia', 'Abyssinia', '88776655', 'SYC Capital'),
('manual', 'Other Bank', '1000998877', 'SYC Finance'),
('sample_bank', 'Sample Bank', '1234567890', 'Sample Admin')
ON CONFLICT (slug) DO NOTHING;

-- Trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, referral_code, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '0000000000'),
    NEW.email,
    UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6)),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists and create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_methods ENABLE ROW LEVEL SECURITY;

-- Grant Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Policies
-- Drop existing policies to avoid conflict
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can view their own recharges" ON recharges;
    DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
    DROP POLICY IF EXISTS "Users can view their own referrals" ON referrals;
    DROP POLICY IF EXISTS "Users can view their own profit logs" ON profit_logs;
    DROP POLICY IF EXISTS "Users can view their own bank accounts" ON bank_accounts;
    DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
    DROP POLICY IF EXISTS "Public can view settings" ON system_settings;
    DROP POLICY IF EXISTS "Anyone can view active deposit methods" ON deposit_methods;
    DROP POLICY IF EXISTS "Admins can view all recharges" ON recharges;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
END $$;

CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own recharges" ON recharges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own investments" ON investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can view their own profit logs" ON profit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own bank accounts" ON bank_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);

-- System Settings & Deposit Methods Policies
CREATE POLICY "Public can view settings" ON system_settings FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can view active deposit methods" ON deposit_methods FOR SELECT USING (is_active = true);

-- Admin Policies
CREATE POLICY "Admins can view all recharges" ON recharges FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admins can view all withdrawals" ON withdrawals FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admins can update settings" ON system_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "Admins have full access to deposit methods" ON deposit_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
        )
    );

-- Allow profile creation during signup
CREATE POLICY "Allow public insert for profile creation" ON profiles FOR INSERT WITH CHECK (true);

