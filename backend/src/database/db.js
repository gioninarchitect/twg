const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/tea_with_god.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const statements = schema.split(';').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
  
  for (const stmt of statements) {
    try { db.exec(stmt); } catch (e) {
      if (!e.message.includes('UNIQUE constraint')) console.error(e.message);
    }
  }
  console.log('[DB] Schema initialized');
}

function generateSegment() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

const dbHelpers = {
  get: function(sql, params) { params = params || []; return db.prepare(sql).get.apply(db.prepare(sql), params); },
  all: function(sql, params) { params = params || []; return db.prepare(sql).all.apply(db.prepare(sql), params); },
  run: function(sql, params) { params = params || []; return db.prepare(sql).run.apply(db.prepare(sql), params); },
  getPhases: function() { return db.prepare('SELECT * FROM content_phases ORDER BY phase_order').all(); },
  getDayContent: function(dayNumber) {
    return db.prepare('SELECT jd.*, cp.phase_name, cp.audio_mood FROM journey_days jd JOIN content_phases cp ON jd.phase_id = cp.phase_id WHERE jd.day_number = ?').get(dayNumber);
  },
  getAllDays: function() {
    return db.prepare('SELECT jd.*, cp.phase_name, cp.audio_mood FROM journey_days jd JOIN content_phases cp ON jd.phase_id = cp.phase_id ORDER BY jd.day_number').all();
  },
  getUserById: function(id) { return db.prepare('SELECT * FROM users WHERE user_id = ?').get(id); },
  getUserByEmail: function(email) { return db.prepare('SELECT * FROM users WHERE email = ?').get(email); },
  createUser: function(u) { return db.prepare('INSERT INTO users (user_id, email, display_name, password_hash) VALUES (?, ?, ?, ?)').run(u.user_id, u.email, u.display_name, u.password_hash); },
  getUserProgress: function(userId) { return db.prepare('SELECT * FROM user_daily_completions WHERE user_id = ? ORDER BY day_number').all(userId); },
  getDayCount: function() { return db.prepare('SELECT COUNT(*) as count FROM journey_days').get().count; },
  insertDayContent: function(day) {
    const now = new Date().toISOString();
    return db.prepare('INSERT OR REPLACE INTO journey_days (day_number, phase_id, title, reflection_content, scripture_text, scripture_reference, thought_of_day, prayer_text, journal_prompt, themes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(day.day_number, day.phase_id, day.title, day.reflection_content, day.scripture_text, day.scripture_reference, day.thought_of_day, day.prayer_text, day.journal_prompt, JSON.stringify(day.themes || []), now);
  },
  getAccessCode: function(code) { return db.prepare('SELECT * FROM access_codes WHERE code = ? AND is_redeemed = 0').get(code); },
  generateAccessCodes: function(count, batchId) {
    batchId = batchId || 'default';
    const codes = [];
    const stmt = db.prepare('INSERT INTO access_codes (code, batch_id) VALUES (?, ?)');
    for (let i = 0; i < count; i++) {
      const code = 'TWG-' + generateSegment() + '-' + generateSegment() + '-' + generateSegment();
      try { stmt.run(code, batchId); codes.push(code); } catch(e) { i--; }
    }
    return codes;
  },

  // Promo Campaign Functions
  createPromoCampaign: function(name, tier, customMessage, createdBy) {
    const result = db.prepare('INSERT INTO promo_campaigns (name, tier, custom_message, created_by) VALUES (?, ?, ?, ?)').run(name, tier, customMessage || null, createdBy || null);
    return result.lastInsertRowid;
  },

  getPromoCampaigns: function() {
    return db.prepare(`
      SELECT pc.*,
        (SELECT COUNT(*) FROM promo_recipients WHERE campaign_id = pc.campaign_id AND email_status = 'sent') as sent_count,
        (SELECT COUNT(*) FROM promo_recipients WHERE campaign_id = pc.campaign_id AND redeemed_at IS NOT NULL) as redeemed_count
      FROM promo_campaigns pc
      ORDER BY pc.created_at DESC
    `).all();
  },

  getPromoCampaignById: function(campaignId) {
    const campaign = db.prepare('SELECT * FROM promo_campaigns WHERE campaign_id = ?').get(campaignId);
    if (campaign) {
      campaign.recipients = db.prepare('SELECT * FROM promo_recipients WHERE campaign_id = ? ORDER BY created_at DESC').all(campaignId);
    }
    return campaign;
  },

  addPromoRecipient: function(campaignId, email, accessCode) {
    return db.prepare('INSERT INTO promo_recipients (campaign_id, email, access_code) VALUES (?, ?, ?)').run(campaignId, email.toLowerCase().trim(), accessCode);
  },

  updatePromoRecipientStatus: function(recipientId, status) {
    const now = new Date().toISOString();
    return db.prepare('UPDATE promo_recipients SET email_status = ?, email_sent_at = ? WHERE recipient_id = ?').run(status, now, recipientId);
  },

  updatePromoCampaignStats: function(campaignId) {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN email_status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN redeemed_at IS NOT NULL THEN 1 ELSE 0 END) as redeemed
      FROM promo_recipients WHERE campaign_id = ?
    `).get(campaignId);
    return db.prepare('UPDATE promo_campaigns SET total_sent = ?, total_redeemed = ? WHERE campaign_id = ?').run(stats.sent || 0, stats.redeemed || 0, campaignId);
  },

  markPromoCodeRedeemed: function(accessCode, userId) {
    const now = new Date().toISOString();
    return db.prepare('UPDATE promo_recipients SET redeemed_at = ?, redeemed_by = ? WHERE access_code = ?').run(now, userId, accessCode);
  },

  getPromoRecipientByCode: function(accessCode) {
    return db.prepare('SELECT * FROM promo_recipients WHERE access_code = ?').get(accessCode);
  },

  getPromoTierByCode: function(accessCode) {
    const result = db.prepare(`
      SELECT pc.tier
      FROM promo_recipients pr
      JOIN promo_campaigns pc ON pr.campaign_id = pc.campaign_id
      WHERE pr.access_code = ?
    `).get(accessCode);
    return result ? result.tier : null;
  }
};

initializeSchema();

// Add tier column to existing databases (migration)
try {
  db.exec("ALTER TABLE users ADD COLUMN tier TEXT DEFAULT NULL CHECK (tier IS NULL OR tier IN ('book', 'journey', 'premium'))");
  console.log('[DB] Added tier column to users table');
} catch (e) {
  // Column already exists, ignore
  if (!e.message.includes('duplicate column')) {
    console.log('[DB] Note:', e.message);
  }
}

module.exports = Object.assign({ db: db }, dbHelpers);
