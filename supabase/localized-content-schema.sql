-- Tea With God - Localized Content Schema
-- Hybrid System: Database-driven with local file fallbacks
-- Date: January 18, 2026

-- ============================================
-- 1. SUPPORTED LANGUAGES TABLE
-- Master list of supported languages
-- ============================================
CREATE TABLE IF NOT EXISTS supported_languages (
    code TEXT PRIMARY KEY,  -- ISO 639-1: 'en', 'af', 'zu', etc.
    name TEXT NOT NULL,     -- Display name: 'English', 'Afrikaans'
    native_name TEXT NOT NULL,  -- Native name: 'English', 'Afrikaans'
    rtl BOOLEAN DEFAULT false,  -- Right-to-left support
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial languages
INSERT INTO supported_languages (code, name, native_name, rtl, enabled) VALUES
    ('en', 'English', 'English', false, true),
    ('af', 'Afrikaans', 'Afrikaans', false, true),
    ('zu', 'Zulu', 'isiZulu', false, false)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. CONTENT METADATA TABLE
-- App-level content (title, copyright) per language
-- ============================================
CREATE TABLE IF NOT EXISTS content_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES supported_languages(code),

    title TEXT NOT NULL,
    author TEXT NOT NULL,
    copyright TEXT NOT NULL,

    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(language_code)
);

-- ============================================
-- 3. CONTENT FRONT MATTER TABLE
-- Introduction, dedication, etc. per language
-- ============================================
CREATE TABLE IF NOT EXISTS content_front_matter (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES supported_languages(code),

    dedication TEXT,
    opening_letter TEXT,
    about_author TEXT,
    introduction TEXT,
    how_to_use TEXT,
    why_forty_days TEXT,

    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(language_code)
);

-- ============================================
-- 4. CONTENT PHASES TABLE
-- Phase definitions per language
-- ============================================
CREATE TABLE IF NOT EXISTS content_phases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES supported_languages(code),

    phase_key TEXT NOT NULL,  -- 'valley', 'waiting', 'rising', 'becoming'
    phase_name TEXT NOT NULL,  -- Translated name
    phase_description TEXT,
    phase_order INTEGER NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(language_code, phase_key)
);

-- Seed English phases
INSERT INTO content_phases (language_code, phase_key, phase_name, phase_description, phase_order) VALUES
    ('en', 'valley', 'Valley', 'Days 1-10: Acknowledging the depth of your pain', 1),
    ('en', 'waiting', 'Waiting', 'Days 11-20: Learning to be still with God', 2),
    ('en', 'rising', 'Rising', 'Days 21-30: Finding strength to stand again', 3),
    ('en', 'becoming', 'Becoming', 'Days 31-40: Embracing who God is making you', 4)
ON CONFLICT (language_code, phase_key) DO NOTHING;

-- Seed Afrikaans phases
INSERT INTO content_phases (language_code, phase_key, phase_name, phase_description, phase_order) VALUES
    ('af', 'valley', 'Vallei', 'Dae 1-10: Erken die diepte van jou pyn', 1),
    ('af', 'waiting', 'Wag', 'Dae 11-20: Leer om stil te wees by God', 2),
    ('af', 'rising', 'Opstaan', 'Dae 21-30: Vind krag om weer op te staan', 3),
    ('af', 'becoming', 'Word', 'Dae 31-40: Omhels wie God jou maak', 4)
ON CONFLICT (language_code, phase_key) DO NOTHING;

-- ============================================
-- 5. CONTENT DAYS TABLE
-- The 40 devotionals per language
-- ============================================
CREATE TABLE IF NOT EXISTS content_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES supported_languages(code),

    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 40),
    title TEXT NOT NULL,
    phase_key TEXT NOT NULL,  -- References phase_key in content_phases

    reflection_content TEXT NOT NULL,
    scripture_text TEXT NOT NULL,
    scripture_reference TEXT NOT NULL,
    thought_of_day TEXT NOT NULL,
    prayer_text TEXT NOT NULL,
    journal_prompt TEXT NOT NULL,

    -- Optional audio content
    audio_reflection_url TEXT,
    audio_prayer_url TEXT,

    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(language_code, day_number)
);

-- Index for fast day lookups
CREATE INDEX IF NOT EXISTS idx_content_days_lang_day ON content_days(language_code, day_number);
CREATE INDEX IF NOT EXISTS idx_content_days_phase ON content_days(language_code, phase_key);

-- ============================================
-- 6. CONTENT CACHE TABLE
-- Local cache metadata for offline sync
-- ============================================
CREATE TABLE IF NOT EXISTS content_cache_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES supported_languages(code),

    last_sync_at TIMESTAMPTZ,
    content_version INTEGER DEFAULT 1,
    cache_valid_until TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, language_code)
);

-- ============================================
-- 7. UPDATE TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_content_metadata_updated_at ON content_metadata;
CREATE TRIGGER update_content_metadata_updated_at
    BEFORE UPDATE ON content_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_front_matter_updated_at ON content_front_matter;
CREATE TRIGGER update_content_front_matter_updated_at
    BEFORE UPDATE ON content_front_matter
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_phases_updated_at ON content_phases;
CREATE TRIGGER update_content_phases_updated_at
    BEFORE UPDATE ON content_phases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_days_updated_at ON content_days;
CREATE TRIGGER update_content_days_updated_at
    BEFORE UPDATE ON content_days
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_cache_updated_at ON content_cache_metadata;
CREATE TRIGGER update_content_cache_updated_at
    BEFORE UPDATE ON content_cache_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ROW LEVEL SECURITY
-- Content is public (read), cache is per-user
-- ============================================

-- Content tables are publicly readable
ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_front_matter ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_cache_metadata ENABLE ROW LEVEL SECURITY;

-- Public read policies for content
DROP POLICY IF EXISTS "Content is publicly readable" ON supported_languages;
CREATE POLICY "Content is publicly readable" ON supported_languages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Metadata is publicly readable" ON content_metadata;
CREATE POLICY "Metadata is publicly readable" ON content_metadata
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Front matter is publicly readable" ON content_front_matter;
CREATE POLICY "Front matter is publicly readable" ON content_front_matter
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Phases are publicly readable" ON content_phases;
CREATE POLICY "Phases are publicly readable" ON content_phases
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Days are publicly readable" ON content_days;
CREATE POLICY "Days are publicly readable" ON content_days
    FOR SELECT USING (true);

-- Cache metadata is per-user
DROP POLICY IF EXISTS "Users can view own cache metadata" ON content_cache_metadata;
CREATE POLICY "Users can view own cache metadata" ON content_cache_metadata
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cache metadata" ON content_cache_metadata;
CREATE POLICY "Users can insert own cache metadata" ON content_cache_metadata
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cache metadata" ON content_cache_metadata;
CREATE POLICY "Users can update own cache metadata" ON content_cache_metadata
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 9. RELOAD SCHEMA
-- ============================================
NOTIFY pgrst, 'reload schema';

SELECT 'Localized content schema created successfully' as status;
