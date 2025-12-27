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
  }
};

initializeSchema();
module.exports = Object.assign({ db: db }, dbHelpers);
