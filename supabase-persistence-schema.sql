-- Tea With God - Full Persistence Schema
-- Run this in Supabase SQL Editor
-- Date: January 4, 2026

-- ============================================
-- 1. GAME DATA TABLE
-- Stores all brain game progress per user
-- ============================================
CREATE TABLE IF NOT EXISTS game_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Scripture Palace (spaced repetition)
    scripture_palace JSONB DEFAULT '[]'::jsonb,

    -- Breathing preferences
    breathing_prefs JSONB DEFAULT '{}'::jsonb,

    -- Gratitude history (up to 40 entries)
    gratitude_history JSONB DEFAULT '[]'::jsonb,

    -- Game statistics (streaks, totals, last played)
    game_stats JSONB DEFAULT '{}'::jsonb,

    -- Pattern Peace data
    pattern_peace JSONB DEFAULT '{}'::jsonb,

    -- Thought Detective data
    thought_detective JSONB DEFAULT '{}'::jsonb,

    -- Body Scan Release data
    body_scan JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_game_data_user_id ON game_data(user_id);

-- ============================================
-- 2. USER SETTINGS TABLE
-- Stores notification and access settings
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Access state
    access_level TEXT DEFAULT 'GUEST' CHECK (access_level IN ('GUEST', 'PILGRIM')),
    access_code TEXT,
    redeemed_at TIMESTAMPTZ,

    -- Guest trial tracking
    guest_start_time TIMESTAMPTZ,

    -- Notification settings
    notifications_enabled BOOLEAN DEFAULT true,
    daily_reminder_time TEXT DEFAULT '09:00',
    weekly_reflection_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- 3. WORLD MODEL STATE TABLE
-- Stores the AI world model state per user
-- ============================================
CREATE TABLE IF NOT EXISTS world_model_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Full world model state as JSONB
    state JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Version for future migrations
    version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_world_model_user_id ON world_model_state(user_id);

-- ============================================
-- 4. UPDATE TRIGGERS
-- Auto-update updated_at on changes
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all new tables
DROP TRIGGER IF EXISTS update_game_data_updated_at ON game_data;
CREATE TRIGGER update_game_data_updated_at
    BEFORE UPDATE ON game_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_world_model_updated_at ON world_model_state;
CREATE TRIGGER update_world_model_updated_at
    BEFORE UPDATE ON world_model_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE game_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_model_state ENABLE ROW LEVEL SECURITY;

-- Game Data policies
DROP POLICY IF EXISTS "Users can view own game data" ON game_data;
CREATE POLICY "Users can view own game data" ON game_data
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own game data" ON game_data;
CREATE POLICY "Users can insert own game data" ON game_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own game data" ON game_data;
CREATE POLICY "Users can update own game data" ON game_data
    FOR UPDATE USING (auth.uid() = user_id);

-- User Settings policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- World Model policies
DROP POLICY IF EXISTS "Users can view own world model" ON world_model_state;
CREATE POLICY "Users can view own world model" ON world_model_state
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own world model" ON world_model_state;
CREATE POLICY "Users can insert own world model" ON world_model_state
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own world model" ON world_model_state;
CREATE POLICY "Users can update own world model" ON world_model_state
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 6. NOTIFY POSTGREST TO RELOAD SCHEMA
-- ============================================
NOTIFY pgrst, 'reload schema';

-- Done!
SELECT 'Schema created successfully. Tables: game_data, user_settings, world_model_state' as status;
