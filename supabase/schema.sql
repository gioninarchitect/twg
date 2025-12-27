-- Tea With God - Supabase Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/hqzyzioyospxwfzrdwkj/sql

-- Enable Row Level Security on all tables
-- This ensures users can only access their own data

-- ============================================
-- 1. USER PROGRESS TABLE
-- Tracks healing journey progress
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_day_index INTEGER DEFAULT 1,
  days_completed INTEGER[] DEFAULT '{}',
  total_days_completed INTEGER DEFAULT 0,
  unlocked_milestones TEXT[] DEFAULT '{}',
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================================
-- 2. JOURNAL ENTRIES TABLE
-- Encrypted journal entries with optional voice notes
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  content TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  voice_note_uri TEXT,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own journal entries
CREATE POLICY "Users can view own journal" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 3. ACCESS CODES TABLE
-- Tracks which users have redeemed book codes
-- ============================================
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_level TEXT DEFAULT 'GUEST' CHECK (access_level IN ('GUEST', 'FULL')),
  code_used TEXT,
  code_description TEXT,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access" ON access_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own access" ON access_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own access" ON access_codes
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================================
-- 4. NOTIFICATION SETTINGS TABLE
-- User notification preferences
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  reminder_hour INTEGER DEFAULT 8,
  reminder_minute INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================================
-- 5. VALID ACCESS CODES TABLE (Admin managed)
-- Master list of valid book codes
-- ============================================
CREATE TABLE IF NOT EXISTS valid_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  access_level TEXT DEFAULT 'FULL' CHECK (access_level IN ('GUEST', 'FULL')),
  description TEXT,
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only allow service role to manage codes (admin only)
ALTER TABLE valid_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read codes (to validate), but can't see all details
CREATE POLICY "Anyone can check code validity" ON valid_codes
  FOR SELECT USING (true);

-- Insert initial valid codes
INSERT INTO valid_codes (code, access_level, description) VALUES
  ('TEAWITHGOD2025', 'FULL', 'Book Purchase Code'),
  ('HEALING40DAYS', 'FULL', 'Book Purchase Code'),
  ('KINTSUGI2025', 'FULL', 'Special Edition Code'),
  ('BETAREVIEW', 'FULL', 'Beta Reviewer Access')
ON CONFLICT (code) DO NOTHING;


-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to validate and redeem a code
CREATE OR REPLACE FUNCTION redeem_access_code(p_code TEXT)
RETURNS JSON AS $func$
DECLARE
  v_code_record RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Find the code
  SELECT * INTO v_code_record FROM valid_codes
  WHERE code = UPPER(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR times_used < max_uses);

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invalid or expired code');
  END IF;

  -- Check if user already has full access
  IF EXISTS (SELECT 1 FROM access_codes WHERE user_id = v_user_id AND access_level = 'FULL') THEN
    RETURN json_build_object('success', false, 'message', 'You already have full access');
  END IF;

  -- Grant access
  INSERT INTO access_codes (user_id, access_level, code_used, code_description, unlocked_at)
  VALUES (v_user_id, v_code_record.access_level, v_code_record.code, v_code_record.description, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    access_level = v_code_record.access_level,
    code_used = v_code_record.code,
    code_description = v_code_record.description,
    unlocked_at = NOW(),
    updated_at = NOW();

  -- Increment usage count
  UPDATE valid_codes SET times_used = times_used + 1 WHERE code = v_code_record.code;

  RETURN json_build_object('success', true, 'message', 'Welcome to your full 40-day journey. All content is now unlocked.');
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 7. UPDATED_AT TRIGGERS
-- Automatically update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $trigger$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$trigger$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_codes_updated_at
  BEFORE UPDATE ON access_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- Done! Your database is ready.
-- ============================================
