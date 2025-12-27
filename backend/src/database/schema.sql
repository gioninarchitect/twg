-- Tea With God Database Schema
-- SQLite Version for Development

-- Content Phases (Static)
CREATE TABLE IF NOT EXISTS content_phases (
    phase_id INTEGER PRIMARY KEY AUTOINCREMENT,
    phase_name TEXT NOT NULL UNIQUE,
    phase_order INTEGER NOT NULL,
    day_start INTEGER NOT NULL,
    day_end INTEGER NOT NULL,
    audio_mood TEXT NOT NULL,
    theme_description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Journey Days (Static Content - 40 Records)
CREATE TABLE IF NOT EXISTS journey_days (
    day_id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_number INTEGER NOT NULL UNIQUE CHECK (day_number BETWEEN 1 AND 40),
    phase_id INTEGER NOT NULL REFERENCES content_phases(phase_id),
    title TEXT NOT NULL,
    reflection_content TEXT NOT NULL,
    scripture_text TEXT NOT NULL,
    scripture_reference TEXT NOT NULL,
    thought_of_day TEXT NOT NULL,
    prayer_text TEXT NOT NULL,
    journal_prompt TEXT NOT NULL,
    estimated_read_minutes INTEGER DEFAULT 5,
    themes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    display_name TEXT,
    password_hash TEXT,
    access_level TEXT DEFAULT 'GUEST' CHECK (access_level IN ('GUEST', 'PILGRIM')),
    access_code TEXT,
    code_redeemed_at TEXT,
    journey_started_at TEXT,
    last_active_at TEXT DEFAULT (datetime('now')),
    total_days_completed INTEGER DEFAULT 0,
    total_journal_entries INTEGER DEFAULT 0,
    current_day_index INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Access Codes
CREATE TABLE IF NOT EXISTS access_codes (
    code_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    batch_id TEXT,
    is_redeemed INTEGER DEFAULT 0,
    redeemed_by TEXT REFERENCES users(user_id),
    redeemed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User Daily Completions
CREATE TABLE IF NOT EXISTS user_daily_completions (
    completion_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 40),
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETE')),
    devotional_scroll_depth INTEGER DEFAULT 0,
    psychology_viewed INTEGER DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, day_number)
);

-- Journal Entries (Encrypted)
CREATE TABLE IF NOT EXISTS journal_entries (
    entry_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    content_encrypted TEXT NOT NULL,
    content_iv TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    sentiment_score REAL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Crisis Access Logs (ANONYMOUS)
CREATE TABLE IF NOT EXISTS crisis_access_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_hash TEXT NOT NULL,
    access_type TEXT NOT NULL,
    detected_phrases TEXT,
    resource_accessed TEXT,
    accessed_at TEXT DEFAULT (datetime('now'))
);

-- Admin Settings (Key-Value Store)
CREATE TABLE IF NOT EXISTS admin_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    updated_by TEXT
);

-- B2B Organizations
CREATE TABLE IF NOT EXISTS organizations (
    org_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    country TEXT DEFAULT 'za',
    plan TEXT DEFAULT 'starter',
    codes_allocated INTEGER DEFAULT 0,
    codes_redeemed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_completions_user_day ON user_daily_completions(user_id, day_number);
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(contact_email);

-- Seed Phases
INSERT OR IGNORE INTO content_phases (phase_id, phase_name, phase_order, day_start, day_end, audio_mood, theme_description) VALUES
(1, 'Valley', 1, 1, 14, 'Minor', 'Acknowledging pain, brokenness, grief.'),
(2, 'Waiting', 2, 15, 21, 'Transitional', 'Transition, silence, learning to trust.'),
(3, 'Rising', 3, 22, 33, 'Mixed', 'Emergence, identity reformation.'),
(4, 'Becoming', 4, 34, 40, 'Major', 'Integration, hope, strength.');
