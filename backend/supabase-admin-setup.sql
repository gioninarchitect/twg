-- ============================================
-- TEA WITH GOD - ADMIN DASHBOARD TABLES
-- Run this in Supabase SQL Editor
-- ============================================

-- Helper function for updated_at timestamps (safe to re-run)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. SOCIAL POSTS (Content Calendar)
-- ============================================
CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  post_date DATE NOT NULL,
  post_time TEXT,
  content TEXT NOT NULL,
  platforms TEXT[] DEFAULT '{}',
  theme INTEGER CHECK (theme >= 1 AND theme <= 6),
  hashtags TEXT,
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_date ON social_posts(post_date);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);

-- ============================================
-- 2. CONTACTS (CRM)
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  subject VARCHAR(100),
  message TEXT,
  status VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- ============================================
-- 3. CRM ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_date ON crm_activities(activity_date);

-- ============================================
-- 4. INVOICES
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_address TEXT,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  notes TEXT,
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ============================================
-- 5. INVOICE LINE ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_line_items_invoice ON invoice_line_items(invoice_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
DROP TRIGGER IF EXISTS social_posts_updated_at ON social_posts;
CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS contacts_updated_at ON contacts;
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Policies: Allow anon and authenticated users full access (admin uses anon key)
DROP POLICY IF EXISTS "Allow all access social_posts" ON social_posts;
CREATE POLICY "Allow all access social_posts" ON social_posts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access contacts" ON contacts;
CREATE POLICY "Allow all access contacts" ON contacts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access crm_activities" ON crm_activities;
CREATE POLICY "Allow all access crm_activities" ON crm_activities FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access invoices" ON invoices;
CREATE POLICY "Allow all access invoices" ON invoices FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access invoice_line_items" ON invoice_line_items;
CREATE POLICY "Allow all access invoice_line_items" ON invoice_line_items FOR ALL USING (true);
