-- ============================================
-- TEA WITH GOD - ORDERS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_ref VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('book', 'journey', 'premium')),
  amount INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'proof_submitted', 'verified', 'rejected', 'refunded')),
  proof_url TEXT,
  proof_uploaded_at TIMESTAMPTZ,
  access_code VARCHAR(50),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_order_ref ON orders(order_ref);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert from anon (for checkout)
CREATE POLICY "Allow anonymous order creation" ON orders
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow read/update for authenticated users (admin)
CREATE POLICY "Allow authenticated users to read orders" ON orders
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update orders" ON orders
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STORAGE BUCKET FOR PAYMENT PROOFS
-- Run these in Supabase Dashboard > Storage
-- ============================================

-- 1. Create bucket named "payment-proofs"
-- 2. Set it to public (so we can view proofs)
-- 3. Add policy to allow uploads:

-- INSERT policy for payment-proofs bucket:
-- CREATE POLICY "Allow public uploads" ON storage.objects
--   FOR INSERT
--   WITH CHECK (bucket_id = 'payment-proofs');

-- SELECT policy for payment-proofs bucket:
-- CREATE POLICY "Allow public read" ON storage.objects
--   FOR SELECT
--   USING (bucket_id = 'payment-proofs');
