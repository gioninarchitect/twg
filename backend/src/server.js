require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');

const db = require('./database/db');
const supabase = require('./supabase');
const emailService = require('./services/emailService');

// Multer config for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function(req, file, cb) {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs allowed'));
    }
  }
});

const app = express();
const PORT = process.env.PORT || 3000;
// SECURITY: No fallbacks - these MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.error('FATAL: ENCRYPTION_KEY must be exactly 32 characters');
  process.exit(1);
}

// Configure helmet with secure CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],  // Removed unsafe-inline and unsafe-eval
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],  // unsafe-inline needed for inline styles
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "https://teawithgod.com", "https://twg.cleva-ai.co.za"],  // Specific domains only
      connectSrc: ["'self'", "https://teawithgod.com", "https://twg.cleva-ai.co.za", "https://*.supabase.co"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));
// CORS - strict whitelist of allowed origins
const ALLOWED_ORIGINS = [
  'https://teawithgod.com',
  'https://www.teawithgod.com',
  'https://twg.cleva-ai.co.za',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006', // Expo dev
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    // Check against whitelist
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Allow localhost variants for development
    if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      return callback(null, true);
    }

    // Reject unknown origins
    console.warn('CORS: Rejected origin:', origin);
    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// ============================================
// RATE LIMITING (In-memory, per-IP)
// ============================================
const rateLimitStore = new Map();

function createRateLimiter(options) {
  const windowMs = options.windowMs || 60000; // 1 minute default
  const max = options.max || 10;
  const message = options.message || 'Too many requests, please try again later';

  return function(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `${options.name || 'default'}_${ip}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }

    record.count++;
    rateLimitStore.set(key, record);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetTime) rateLimitStore.delete(k);
      }
    }

    if (record.count > max) {
      console.warn(`[Rate Limit] ${options.name}: ${ip} exceeded ${max} requests`);
      return res.status(429).json({ error: message });
    }

    next();
  };
}

// Auth rate limiters
const authLimiter = createRateLimiter({
  name: 'auth',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 min
  message: 'Too many login attempts. Please try again in 15 minutes.'
});

const registerLimiter = createRateLimiter({
  name: 'register',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many accounts created. Please try again later.'
});

const passwordResetLimiter = createRateLimiter({
  name: 'password-reset',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per hour
  message: 'Too many password reset requests. Please try again later.'
});

// Health
app.get('/health', function(req, res) {
  res.json({ status: 'healthy', daysIngested: db.getDayCount(), version: '1.0.0' });
});

// Content Routes
app.get('/api/v1/content/phases', function(req, res) {
  res.json({ phases: db.getPhases() });
});

app.get('/api/v1/content/days', function(req, res) {
  const days = db.getAllDays();
  res.json({ days: days, count: days.length });
});

app.get('/api/v1/content/days/:dayNumber', function(req, res) {
  const dayNumber = parseInt(req.params.dayNumber);
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 40) {
    return res.status(400).json({ error: 'Invalid day number' });
  }
  const day = db.getDayContent(dayNumber);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  day.themes = JSON.parse(day.themes || '[]');
  res.json({ day: day });
});

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin Middleware - Requires valid token + admin role
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'lani@teawithgod.com,twg@cleva-ai.co.za').split(',').map(e => e.trim().toLowerCase());
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || 'superadmin@cleva-ai.co.za,floris@cleva-ai.co.za').split(',').map(e => e.trim().toLowerCase());

// Admin OTP Store (in-memory with expiry)
const adminOtpStore = new Map();
const ADMIN_OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const FIXED_ADMIN_OTP = process.env.ADMIN_OTP || '132872'; // Fixed OTP for admin login

function generateAdminOTP() {
  return FIXED_ADMIN_OTP;
}

function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (!ADMIN_EMAILS.includes(decoded.email.toLowerCase()) && !SUPER_ADMIN_EMAILS.includes(decoded.email.toLowerCase())) {
      return res.status(403).json({ error: 'Admin access denied' });
    }
    req.user = decoded;
    req.user.isSuperAdmin = SUPER_ADMIN_EMAILS.includes(decoded.email.toLowerCase());
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
}

function superAdminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Super admin authentication required' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (!SUPER_ADMIN_EMAILS.includes(decoded.email.toLowerCase())) {
      return res.status(403).json({ error: 'Super admin access denied' });
    }
    req.user = decoded;
    req.user.isSuperAdmin = true;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
}

// Email validation helper
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// HTML sanitization helper (basic - strips all tags)
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

// Auth Routes
app.post('/api/v1/auth/register', registerLimiter, async function(req, res) {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Email validation
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (db.getUserByEmail(email)) return res.status(409).json({ error: 'Email exists' });
    
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);
    db.createUser({ user_id: userId, email: email, display_name: displayName || email.split('@')[0], password_hash: passwordHash });
    
    // Init days 1-3
    for (let d = 1; d <= 3; d++) {
      db.run('INSERT INTO user_daily_completions (user_id, day_number, status) VALUES (?, ?, ?)', [userId, d, 'AVAILABLE']);
    }
    
    const token = jwt.sign({ userId: userId, email: email }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token: token, user: { userId: userId, email: email, accessLevel: 'GUEST' } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/v1/auth/login', authLimiter, async function(req, res) {
  try {
    const { email, password } = req.body;
    const user = db.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    db.run("UPDATE users SET last_active_at = datetime('now') WHERE user_id = ?", [user.user_id]);
    const token = jwt.sign({ userId: user.user_id, email: email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token: token, user: { userId: user.user_id, email: user.email, accessLevel: user.access_level, tier: user.tier, currentDayIndex: user.current_day_index } });
  } catch (e) {
    console.error('[Login Error]', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// OTP Store (in-memory with expiry)
const otpStore = new Map();

// Generate cryptographically secure 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Forgot Password - Request OTP
app.post('/api/v1/auth/forgot-password', passwordResetLimiter, async function(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = db.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      // Don't reveal if email exists - return success anyway
      return res.json({ success: true, message: 'If this email exists, you will receive a reset code' });
    }

    const otp = generateOTP();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email.toLowerCase().trim(), { otp, expiry, userId: user.user_id });

    // Clean up expired OTPs
    for (const [key, value] of otpStore.entries()) {
      if (value.expiry < Date.now()) otpStore.delete(key);
    }

    const emailResult = await emailService.sendPasswordResetOTP(email, otp);
    console.log('[OTP] Sent to', email, '- Result:', emailResult.success);

    res.json({ success: true, message: 'If this email exists, you will receive a reset code' });
  } catch (e) {
    console.error('[Forgot Password Error]', e);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify OTP
app.post('/api/v1/auth/verify-otp', function(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const stored = otpStore.get(email.toLowerCase().trim());
    if (!stored) {
      return res.status(400).json({ error: 'No reset request found. Please request a new code.' });
    }

    if (stored.expiry < Date.now()) {
      otpStore.delete(email.toLowerCase().trim());
      return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    // Generate reset token valid for 5 minutes
    const resetToken = jwt.sign({ userId: stored.userId, email: email, purpose: 'reset' }, JWT_SECRET, { expiresIn: '5m' });

    res.json({ success: true, resetToken: resetToken });
  } catch (e) {
    console.error('[Verify OTP Error]', e);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Reset Password
app.post('/api/v1/auth/reset-password', async function(req, res) {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ error: 'Reset token and new password required' });

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.purpose !== 'reset') throw new Error('Invalid token purpose');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    db.run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE user_id = ?", [passwordHash, decoded.userId]);

    // Clear OTP
    otpStore.delete(decoded.email.toLowerCase().trim());

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) {
    console.error('[Reset Password Error]', e);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

app.get('/api/v1/auth/me', authMiddleware, function(req, res) {
  const user = db.getUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { userId: user.user_id, email: user.email, displayName: user.display_name, accessLevel: user.access_level, tier: user.tier, currentDayIndex: user.current_day_index, totalDaysCompleted: user.total_days_completed } });
});

app.post('/api/v1/auth/redeem-code', authMiddleware, function(req, res) {
  const { code } = req.body;
  if (!/^TWG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(code)) {
    return res.status(400).json({ error: 'Invalid format' });
  }
  const upperCode = code.toUpperCase();
  const accessCode = db.getAccessCode(upperCode);
  if (!accessCode) return res.status(404).json({ error: 'Code not found or used' });

  // Check if this is a promo code and get the tier
  let tier = 'journey'; // Default tier for non-promo codes
  try {
    const promoTier = db.getPromoTierByCode(upperCode);
    if (promoTier) {
      tier = promoTier;
      console.log('[Promo] Code', upperCode, 'redeemed with tier:', tier);
    }
  } catch (e) {
    console.log('[Promo] Could not get tier:', e.message);
  }

  db.run("UPDATE access_codes SET is_redeemed = 1, redeemed_by = ?, redeemed_at = datetime('now') WHERE code = ?", [req.user.userId, upperCode]);
  db.run("UPDATE users SET access_level = 'PILGRIM', tier = ?, access_code = ?, journey_started_at = COALESCE(journey_started_at, datetime('now')) WHERE user_id = ?", [tier, upperCode, req.user.userId]);
  for (let d = 4; d <= 40; d++) {
    db.run("INSERT OR IGNORE INTO user_daily_completions (user_id, day_number, status) VALUES (?, ?, 'LOCKED')", [req.user.userId, d]);
  }

  // Track promo code redemption if this was a promo code
  try {
    const promoRecipient = db.getPromoRecipientByCode(upperCode);
    if (promoRecipient) {
      db.markPromoCodeRedeemed(upperCode, req.user.userId);
      // Update campaign stats
      db.updatePromoCampaignStats(promoRecipient.campaign_id);
    }
  } catch (e) {
    // Silent fail - promo tracking is not critical
    console.log('[Promo] Note: Could not track promo redemption:', e.message);
  }

  res.json({ success: true, accessLevel: 'PILGRIM', tier: tier, message: 'Welcome, Pilgrim.' });
});

// Journey Routes
app.get('/api/v1/journey/progress', authMiddleware, function(req, res) {
  const user = db.getUserById(req.user.userId);
  const completions = db.getUserProgress(req.user.userId);
  res.json({ currentDayIndex: user.current_day_index, totalDaysCompleted: user.total_days_completed, accessLevel: user.access_level, tier: user.tier, completions: completions });
});

app.get('/api/v1/journey/days/:dayNumber', authMiddleware, function(req, res) {
  const completion = db.get('SELECT * FROM user_daily_completions WHERE user_id = ? AND day_number = ?', [req.user.userId, parseInt(req.params.dayNumber)]);
  if (!completion) return res.status(404).json({ error: 'Not found' });
  res.json({ completion: completion });
});

app.patch('/api/v1/journey/days/:dayNumber', authMiddleware, function(req, res) {
  const dayNumber = parseInt(req.params.dayNumber);
  const allowed = ['devotional_scroll_depth', 'psychology_viewed', 'status'];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) { updates.push(key + ' = ?'); values.push(req.body[key]); }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields' });
  values.push(req.user.userId, dayNumber);
  db.run("UPDATE user_daily_completions SET " + updates.join(", ") + ", updated_at = datetime('now') WHERE user_id = ? AND day_number = ?", values);
  const completion = db.get('SELECT * FROM user_daily_completions WHERE user_id = ? AND day_number = ?', [req.user.userId, dayNumber]);
  res.json({ completion: completion });
});

app.post('/api/v1/journey/days/:dayNumber/complete', authMiddleware, function(req, res) {
  const dayNumber = parseInt(req.params.dayNumber);
  db.run("UPDATE user_daily_completions SET status = 'COMPLETE', completed_at = datetime('now') WHERE user_id = ? AND day_number = ?", [req.user.userId, dayNumber]);
  if (dayNumber < 40) {
    db.run("UPDATE user_daily_completions SET status = 'AVAILABLE' WHERE user_id = ? AND day_number = ?", [req.user.userId, dayNumber + 1]);
  }
  db.run("UPDATE users SET current_day_index = MIN(current_day_index + 1, 40), total_days_completed = total_days_completed + 1, last_active_at = datetime('now') WHERE user_id = ?", [req.user.userId]);
  const user = db.getUserById(req.user.userId);
  res.json({ success: true, currentDayIndex: user.current_day_index, totalDaysCompleted: user.total_days_completed });
});

// Journal Routes (Encrypted)
function encryptContent(content) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted: encrypted, iv: iv.toString('hex'), hash: crypto.createHash('sha256').update(content).digest('hex') };
}

function decryptContent(encrypted, iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

app.get('/api/v1/journal/entries', authMiddleware, function(req, res) {
  const entries = db.all('SELECT * FROM journal_entries WHERE user_id = ? ORDER BY day_number', [req.user.userId]);
  const decrypted = entries.map(function(e) {
    return Object.assign({}, e, { content: decryptContent(e.content_encrypted, e.content_iv) });
  });
  res.json({ entries: decrypted });
});

app.post('/api/v1/journal/entries', authMiddleware, function(req, res) {
  const { dayNumber, content } = req.body;
  if (!dayNumber || !content) return res.status(400).json({ error: 'dayNumber and content required' });
  const enc = encryptContent(content);
  const wordCount = content.split(/\s+/).filter(function(w) { return w.length > 0; }).length;
  const existing = db.get('SELECT entry_id FROM journal_entries WHERE user_id = ? AND day_number = ?', [req.user.userId, dayNumber]);
  if (existing) {
    db.run("UPDATE journal_entries SET content_encrypted = ?, content_iv = ?, content_hash = ?, word_count = ?, updated_at = datetime('now') WHERE entry_id = ?", [enc.encrypted, enc.iv, enc.hash, wordCount, existing.entry_id]);
  } else {
    const entryId = uuidv4();
    db.run('INSERT INTO journal_entries (entry_id, user_id, day_number, content_encrypted, content_iv, content_hash, word_count) VALUES (?, ?, ?, ?, ?, ?, ?)', [entryId, req.user.userId, dayNumber, enc.encrypted, enc.iv, enc.hash, wordCount]);
    db.run('UPDATE users SET total_journal_entries = total_journal_entries + 1 WHERE user_id = ?', [req.user.userId]);
  }
  res.json({ success: true, wordCount: wordCount });
});

// Crisis (Anonymous)
app.post('/api/v1/crisis/log', function(req, res) {
  const { sessionHash, accessType, detectedPhrases, resourceAccessed } = req.body;
  db.run('INSERT INTO crisis_access_logs (session_hash, access_type, detected_phrases, resource_accessed) VALUES (?, ?, ?, ?)', [sessionHash, accessType, JSON.stringify(detectedPhrases || []), resourceAccessed]);
  res.json({ logged: true });
});

// ============================================
// ADMIN AUTH ROUTES (PIN only - no password)
// ============================================

// Admin Login: Email + PIN only
app.post('/api/v1/admin/login-pin', authLimiter, async function(req, res) {
  try {
    const { email, pin } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    // Check if email is in admin list
    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail) || SUPER_ADMIN_EMAILS.includes(normalizedEmail);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Not authorized for admin access' });
    }

    // Verify PIN matches
    if (pin !== FIXED_ADMIN_OTP) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Get or create user for this admin email
    let user = db.getUserByEmail(normalizedEmail);
    if (!user) {
      // Auto-create admin user if they don't exist
      const userId = require('uuid').v4();
      const tempHash = await bcrypt.hash(FIXED_ADMIN_OTP, 12);
      db.createUser({
        user_id: userId,
        email: normalizedEmail,
        display_name: normalizedEmail.split('@')[0],
        password_hash: tempHash
      });
      user = db.getUserByEmail(normalizedEmail);
      console.log('[Admin Login] Auto-created admin user:', normalizedEmail);
    }

    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(normalizedEmail);
    const token = jwt.sign({
      userId: user.user_id,
      email: normalizedEmail,
      isAdmin: true,
      isSuperAdmin: isSuperAdmin
    }, JWT_SECRET, { expiresIn: '8h' });

    console.log('[Admin Login] Successful:', normalizedEmail, isSuperAdmin ? '(Super Admin)' : '(Admin)');

    res.json({
      success: true,
      token: token,
      user: {
        email: normalizedEmail,
        isAdmin: true,
        isSuperAdmin: isSuperAdmin
      }
    });
  } catch (e) {
    console.error('[Admin Login] Error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get list of admin users (Super Admin only)
app.get('/api/v1/admin/users', superAdminMiddleware, function(req, res) {
  try {
    const adminUsers = [];

    // Get all admin emails and check if they exist in DB
    const allAdminEmails = [...new Set([...ADMIN_EMAILS, ...SUPER_ADMIN_EMAILS])];

    for (const email of allAdminEmails) {
      const user = db.getUserByEmail(email);
      adminUsers.push({
        email: email,
        exists: !!user,
        userId: user?.user_id || null,
        displayName: user?.display_name || null,
        lastActive: user?.last_active_at || null,
        isSuperAdmin: SUPER_ADMIN_EMAILS.includes(email)
      });
    }

    res.json({
      adminUsers: adminUsers,
      adminEmails: ADMIN_EMAILS,
      superAdminEmails: SUPER_ADMIN_EMAILS
    });
  } catch (e) {
    console.error('[Admin Users] Error:', e);
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

// Reset admin password (Super Admin only)
app.post('/api/v1/admin/users/reset-password', superAdminMiddleware, async function(req, res) {
  try {
    const { email, newPassword } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !newPassword) {
      return res.status(400).json({ error: 'Email and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if target is an admin
    const isTargetAdmin = ADMIN_EMAILS.includes(normalizedEmail) || SUPER_ADMIN_EMAILS.includes(normalizedEmail);
    if (!isTargetAdmin) {
      return res.status(400).json({ error: 'Target email is not an admin' });
    }

    // Check if user exists
    let user = db.getUserByEmail(normalizedEmail);

    if (!user) {
      // Create the admin user if they don't exist
      const userId = require('uuid').v4();
      const passwordHash = await bcrypt.hash(newPassword, 12);
      db.createUser({
        user_id: userId,
        email: normalizedEmail,
        display_name: normalizedEmail.split('@')[0],
        password_hash: passwordHash
      });
      console.log('[Admin Reset] Created new admin user:', normalizedEmail);
      res.json({ success: true, message: 'Admin user created with new password' });
    } else {
      // Update existing user's password
      const passwordHash = await bcrypt.hash(newPassword, 12);
      db.run('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE user_id = ?', [passwordHash, user.user_id]);
      console.log('[Admin Reset] Password reset for:', normalizedEmail, 'by:', req.user.email);
      res.json({ success: true, message: 'Password reset successfully' });
    }
  } catch (e) {
    console.error('[Admin Reset] Error:', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Admin (Protected)
app.post('/api/v1/admin/generate-codes', adminMiddleware, function(req, res) {
  const count = req.body.count || 10;
  const codes = db.generateAccessCodes(count, req.body.batchId);
  res.json({ generated: codes.length, codes: codes });
});

// ============================================
// ORDER ROUTES (Supabase)
// ============================================

// Create new order
app.post('/api/v1/orders', async function(req, res) {
  try {
    const { firstName, lastName, email, phone, plan, orderRef, beneficiaryOrgId } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !plan || !orderRef) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Plan pricing
    const planPrices = {
      book: 99,
      journey: 149,
      premium: 249
    };

    if (!planPrices[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Create order in Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_ref: orderRef,
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase().trim(),
        phone: phone,
        plan: plan,
        amount: planPrices[plan],
        status: 'pending',
        beneficiary_org_id: beneficiaryOrgId || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase order error:', error);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Send order confirmation email
    emailService.sendOrderConfirmation(data).catch(err => {
      console.error('Failed to send order confirmation email:', err);
    });

    res.status(201).json({
      success: true,
      order: {
        id: data.id,
        orderRef: data.order_ref,
        status: data.status,
        amount: data.amount,
        plan: data.plan
      }
    });
  } catch (e) {
    console.error('Order creation error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload proof of payment
app.post('/api/v1/orders/:orderRef/proof', upload.single('proof'), async function(req, res) {
  try {
    const { orderRef } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check order exists
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_ref', orderRef)
      .single();

    if (findError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Upload to Supabase Storage
    const fileName = `${orderRef}_${Date.now()}${path.extname(file.originalname)}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    // Update order with proof
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        proof_url: urlData.publicUrl,
        proof_uploaded_at: new Date().toISOString(),
        status: 'proof_submitted'
      })
      .eq('order_ref', orderRef);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update order' });
    }

    // Send proof received email
    emailService.sendProofReceived(order).catch(err => {
      console.error('Failed to send proof received email:', err);
    });

    res.json({
      success: true,
      message: 'Proof uploaded successfully',
      proofUrl: urlData.publicUrl
    });
  } catch (e) {
    console.error('Proof upload error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order status
app.get('/api/v1/orders/:orderRef', async function(req, res) {
  try {
    const { orderRef } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('order_ref, plan, amount, status, created_at, proof_uploaded_at')
      .eq('order_ref', orderRef)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: order });
  } catch (e) {
    console.error('Order fetch error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all pending orders (Protected)
app.get('/api/v1/admin/orders', adminMiddleware, async function(req, res) {
  try {
    const status = req.query.status;

    let query = supabase.from('orders').select('*');

    // Only filter by status if specified and not 'all'
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: rawOrders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase orders error:', error);
      return res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }

    // Transform to admin dashboard format
    const orders = rawOrders.map(order => ({
      orderRef: order.order_ref,
      customer: {
        name: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
        email: order.email,
        phone: order.phone || ''
      },
      plan: order.plan,
      amount: order.amount,
      status: order.status,
      proofUrl: order.proof_url || null,
      accessCode: order.access_code || null,
      createdAt: order.created_at,
      verifiedAt: order.verified_at || null,
      paymentMethod: order.payment_method || 'eft'
    }));

    res.json({ orders: orders, count: orders.length });
  } catch (e) {
    console.error('Orders fetch error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Verify payment and generate access code (Protected)
app.post('/api/v1/admin/orders/:orderRef/verify', adminMiddleware, async function(req, res) {
  try {
    const { orderRef } = req.params;

    // Get order
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_ref', orderRef)
      .single();

    if (findError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Generate access code
    const accessCode = db.generateAccessCodes(1, orderRef)[0];

    // Update order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'verified',
        access_code: accessCode,
        verified_at: new Date().toISOString()
      })
      .eq('order_ref', orderRef);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to verify order' });
    }

    // Create tithe allocation (10% of order amount)
    const titheAmount = order.amount * 0.10;
    const { error: titheError } = await supabase
      .from('tithe_allocations')
      .insert({
        order_id: order.id,
        order_ref: order.order_ref,
        gross_amount: order.amount,
        tithe_percentage: 10,
        tithe_amount: titheAmount,
        beneficiary_org_id: order.beneficiary_org_id || null,
        status: order.beneficiary_org_id ? 'allocated' : 'pending'
      });

    if (titheError) {
      console.error('Tithe allocation error:', titheError);
      // Don't fail the verification, just log the error
    }

    // Create invoice record in database
    const planNames = {
      book: 'Book Access',
      journey: 'Journey Access',
      premium: 'Premium Access'
    };
    const invoiceNumber = 'TWG-INV-' + Date.now().toString(36).toUpperCase();
    const today = new Date().toISOString().split('T')[0];

    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        id: Date.now().toString(),
        invoice_number: invoiceNumber,
        invoice_date: today,
        client_name: order.first_name + ' ' + order.last_name,
        client_email: order.email,
        client_address: '',
        total: order.amount,
        due_date: today,
        notes: 'Payment verified via Yoco. Order ref: ' + order.order_ref,
        status: 'paid'
      });

    if (invoiceError) {
      console.error('[Verify] Invoice creation error:', invoiceError);
    } else {
      // Add line item
      await supabase.from('invoice_line_items').insert({
        invoice_id: Date.now().toString(),
        description: 'Tea With God - ' + (planNames[order.plan] || order.plan),
        quantity: 1,
        unit_price: order.amount,
        total: order.amount
      });
    }

    // Send access code email and invoice automatically
    const emailResult = await emailService.sendAccessCode(order, accessCode);
    const invoiceResult = await emailService.sendInvoice(order, accessCode);
    console.log('[Verify] Emails sent:', { accessCode: emailResult.success, invoice: invoiceResult.success });

    res.json({
      success: true,
      accessCode: accessCode,
      email: order.email,
      phone: order.phone,
      titheAmount: titheAmount,
      emailSent: emailResult.success,
      emailError: emailResult.error || null
    });
  } catch (e) {
    console.error('Verify error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Delete order (Protected)
app.delete('/api/v1/admin/orders/:orderRef', adminMiddleware, async function(req, res) {
  try {
    const { orderRef } = req.params;

    // Delete from Supabase
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('order_ref', orderRef);

    if (error) {
      console.error('Delete order error:', error);
      return res.status(500).json({ error: 'Failed to delete order' });
    }

    // Also delete any related tithe allocations
    await supabase
      .from('tithe_allocations')
      .delete()
      .eq('order_ref', orderRef);

    console.log('[Admin] Order deleted:', orderRef);
    res.json({ success: true, message: 'Order deleted' });
  } catch (e) {
    console.error('Delete order error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// ADMIN SETTINGS ROUTES
// ============================================

// Get all admin settings
app.get('/api/v1/admin/settings', adminMiddleware, function(req, res) {
  try {
    const settings = db.all('SELECT setting_key, setting_value FROM admin_settings');
    const settingsObj = {};
    for (const s of settings) {
      try {
        settingsObj[s.setting_key] = JSON.parse(s.setting_value);
      } catch (e) {
        settingsObj[s.setting_key] = s.setting_value;
      }
    }
    res.json({ settings: settingsObj });
  } catch (e) {
    console.error('Settings fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update admin settings
app.put('/api/v1/admin/settings', adminMiddleware, function(req, res) {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object required' });
    }

    const stmt = db.db.prepare("INSERT OR REPLACE INTO admin_settings (setting_key, setting_value, updated_at, updated_by) VALUES (?, ?, datetime('now'), ?)");

    for (const [key, value] of Object.entries(settings)) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      stmt.run(key, valueStr, req.user.email);
    }

    res.json({ success: true, message: 'Settings saved' });
  } catch (e) {
    console.error('Settings save error:', e);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Update admin user email (special endpoint)
app.put('/api/v1/admin/update-email', adminMiddleware, async function(req, res) {
  try {
    const { newEmail, password } = req.body;
    if (!newEmail || !password) {
      return res.status(400).json({ error: 'New email and password required' });
    }

    // Verify current user's password
    const user = db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check if new email already exists
    const existingUser = db.getUserByEmail(newEmail);
    if (existingUser && existingUser.user_id !== req.user.userId) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Update email
    db.run("UPDATE users SET email = ?, updated_at = datetime('now') WHERE user_id = ?", [newEmail, req.user.userId]);

    // Generate new token with updated email
    const token = jwt.sign({ userId: req.user.userId, email: newEmail }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ success: true, token: token, email: newEmail });
  } catch (e) {
    console.error('Email update error:', e);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// ============================================
// B2B ORGANIZATION ROUTES
// ============================================

// Get all organizations
app.get('/api/v1/admin/organizations', adminMiddleware, function(req, res) {
  try {
    const orgs = db.all('SELECT * FROM organizations ORDER BY created_at DESC');
    res.json({ organizations: orgs, count: orgs.length });
  } catch (e) {
    console.error('Orgs fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Create organization
app.post('/api/v1/admin/organizations', adminMiddleware, function(req, res) {
  try {
    const { name, type, contactName, contactEmail, contactPhone, country, plan, codesAllocated, notes } = req.body;

    if (!name || !type || !contactEmail) {
      return res.status(400).json({ error: 'Name, type, and contact email required' });
    }

    const orgId = uuidv4();
    db.run(
      'INSERT INTO organizations (org_id, name, type, contact_name, contact_email, contact_phone, country, plan, codes_allocated, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orgId, name, type, contactName || '', contactEmail, contactPhone || '', country || 'za', plan || 'starter', codesAllocated || 0, notes || '']
    );

    const org = db.get('SELECT * FROM organizations WHERE org_id = ?', [orgId]);
    res.status(201).json({ success: true, organization: org });
  } catch (e) {
    console.error('Org create error:', e);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// Update organization
app.put('/api/v1/admin/organizations/:orgId', adminMiddleware, function(req, res) {
  try {
    const { orgId } = req.params;
    const { name, type, contactName, contactEmail, contactPhone, country, plan, codesAllocated, status, notes } = req.body;

    const existing = db.get('SELECT * FROM organizations WHERE org_id = ?', [orgId]);
    if (!existing) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    db.run(
      "UPDATE organizations SET name = ?, type = ?, contact_name = ?, contact_email = ?, contact_phone = ?, country = ?, plan = ?, codes_allocated = ?, status = ?, notes = ?, updated_at = datetime('now') WHERE org_id = ?",
      [
        name || existing.name,
        type || existing.type,
        contactName !== undefined ? contactName : existing.contact_name,
        contactEmail || existing.contact_email,
        contactPhone !== undefined ? contactPhone : existing.contact_phone,
        country || existing.country,
        plan || existing.plan,
        codesAllocated !== undefined ? codesAllocated : existing.codes_allocated,
        status || existing.status,
        notes !== undefined ? notes : existing.notes,
        orgId
      ]
    );

    const org = db.get('SELECT * FROM organizations WHERE org_id = ?', [orgId]);
    res.json({ success: true, organization: org });
  } catch (e) {
    console.error('Org update error:', e);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// Generate codes for organization
app.post('/api/v1/admin/organizations/:orgId/generate-codes', adminMiddleware, async function(req, res) {
  try {
    const { orgId } = req.params;
    const { count, sendEmail } = req.body;

    const org = db.get('SELECT * FROM organizations WHERE org_id = ?', [orgId]);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const numCodes = parseInt(count) || 10;
    const codes = db.generateAccessCodes(numCodes, `org-${orgId}`);

    // Update codes_allocated
    db.run("UPDATE organizations SET codes_allocated = codes_allocated + ?, updated_at = datetime('now') WHERE org_id = ?", [numCodes, orgId]);

    // Optionally send codes via email
    let emailResult = null;
    if (sendEmail) {
      emailResult = await emailService.sendOrganizationCodes(org, codes);
    }

    res.json({
      success: true,
      codes: codes,
      count: codes.length,
      emailSent: emailResult ? emailResult.success : false
    });
  } catch (e) {
    console.error('Org codes error:', e);
    res.status(500).json({ error: 'Failed to generate codes' });
  }
});

// Delete organization
app.delete('/api/v1/admin/organizations/:orgId', adminMiddleware, function(req, res) {
  try {
    const { orgId } = req.params;

    const existing = db.get('SELECT * FROM organizations WHERE org_id = ?', [orgId]);
    if (!existing) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    db.run('DELETE FROM organizations WHERE org_id = ?', [orgId]);
    res.json({ success: true, message: 'Organization deleted' });
  } catch (e) {
    console.error('Org delete error:', e);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// ============================================
// ADMIN STATS ROUTES
// ============================================

// Get dashboard stats
app.get('/api/v1/admin/stats', adminMiddleware, function(req, res) {
  try {
    const totalUsers = db.get('SELECT COUNT(*) as count FROM users').count;
    const activeUsers = db.get("SELECT COUNT(*) as count FROM users WHERE last_active_at > datetime('now', '-7 days')").count;
    const totalJournalEntries = db.get('SELECT COUNT(*) as count FROM journal_entries').count;
    const completedJourneys = db.get("SELECT COUNT(*) as count FROM users WHERE total_days_completed >= 40").count;
    const totalOrgs = db.get('SELECT COUNT(*) as count FROM organizations').count;
    const totalCodes = db.get('SELECT COUNT(*) as count FROM access_codes').count;
    const redeemedCodes = db.get('SELECT COUNT(*) as count FROM access_codes WHERE is_redeemed = 1').count;

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalJournalEntries,
        completedJourneys,
        totalOrgs,
        totalCodes,
        redeemedCodes,
        redemptionRate: totalCodes > 0 ? Math.round((redeemedCodes / totalCodes) * 100) : 0
      }
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================
// TITHE ROUTES
// ============================================

// PUBLIC: Get active verified beneficiary organizations
app.get('/api/v1/tithe/organizations', async function(req, res) {
  try {
    const countryCode = req.query.country || 'za';

    const { data: orgs, error } = await supabase
      .from('beneficiary_orgs')
      .select('id, name, description, category, country_code, logo_url, website_url, sort_order')
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .eq('country_code', countryCode)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Tithe orgs fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch organizations' });
    }

    res.json({ organizations: orgs, count: orgs.length });
  } catch (e) {
    console.error('Tithe orgs error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Get aggregate tithe impact stats
app.get('/api/v1/tithe/impact', async function(req, res) {
  try {
    // Get total allocated
    const { data: totals, error: totalsError } = await supabase
      .from('tithe_allocations')
      .select('tithe_amount, status');

    if (totalsError) {
      return res.status(500).json({ error: 'Failed to fetch impact stats' });
    }

    const totalAllocated = totals.reduce((sum, t) => sum + parseFloat(t.tithe_amount || 0), 0);
    const totalDisbursed = totals.filter(t => t.status === 'disbursed').reduce((sum, t) => sum + parseFloat(t.tithe_amount || 0), 0);
    const pilgrims = totals.length;

    // Get org breakdown
    const { data: orgBreakdown, error: orgError } = await supabase
      .from('tithe_allocations')
      .select('beneficiary_org_id, tithe_amount, beneficiary_orgs(name)')
      .not('beneficiary_org_id', 'is', null);

    const byOrg = {};
    if (!orgError && orgBreakdown) {
      for (const alloc of orgBreakdown) {
        const orgName = alloc.beneficiary_orgs?.name || 'Unallocated';
        byOrg[orgName] = (byOrg[orgName] || 0) + parseFloat(alloc.tithe_amount || 0);
      }
    }

    res.json({
      impact: {
        totalAllocated: totalAllocated,
        totalDisbursed: totalDisbursed,
        pendingDisbursement: totalAllocated - totalDisbursed,
        pilgrimsContributing: pilgrims,
        byOrganization: byOrg
      }
    });
  } catch (e) {
    console.error('Tithe impact error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// USER: Get my tithe preference
app.get('/api/v1/tithe/my-preference', authMiddleware, function(req, res) {
  try {
    const pref = db.get('SELECT * FROM user_tithe_preferences WHERE user_id = ?', [req.user.userId]);
    res.json({ preference: pref || null });
  } catch (e) {
    console.error('Tithe preference fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch preference' });
  }
});

// USER: Set/update my tithe preference
app.put('/api/v1/tithe/my-preference', authMiddleware, async function(req, res) {
  try {
    const { beneficiaryOrgId } = req.body;

    if (!beneficiaryOrgId) {
      return res.status(400).json({ error: 'beneficiaryOrgId required' });
    }

    // Verify org exists and is active
    const { data: org, error: orgError } = await supabase
      .from('beneficiary_orgs')
      .select('id, name')
      .eq('id', beneficiaryOrgId)
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found or not active' });
    }

    // Upsert preference in SQLite
    db.run(
      "INSERT OR REPLACE INTO user_tithe_preferences (user_id, beneficiary_org_id, beneficiary_org_name, selected_at) VALUES (?, ?, ?, datetime('now'))",
      [req.user.userId, beneficiaryOrgId, org.name]
    );

    // Update any pending allocations for this user
    await supabase
      .from('tithe_allocations')
      .update({ beneficiary_org_id: beneficiaryOrgId, status: 'allocated' })
      .eq('user_id', req.user.userId)
      .eq('status', 'pending');

    res.json({ success: true, preference: { beneficiaryOrgId: beneficiaryOrgId, beneficiaryOrgName: org.name } });
  } catch (e) {
    console.error('Tithe preference update error:', e);
    res.status(500).json({ error: 'Failed to update preference' });
  }
});

// USER: Get my tithe contributions
app.get('/api/v1/tithe/my-contributions', authMiddleware, async function(req, res) {
  try {
    const { data: contributions, error } = await supabase
      .from('tithe_allocations')
      .select('id, order_ref, gross_amount, tithe_amount, status, allocated_at, beneficiary_orgs(name)')
      .eq('user_id', req.user.userId)
      .order('allocated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch contributions' });
    }

    const total = contributions.reduce((sum, c) => sum + parseFloat(c.tithe_amount || 0), 0);

    res.json({
      contributions: contributions,
      total: total,
      count: contributions.length
    });
  } catch (e) {
    console.error('Tithe contributions error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// ADMIN TITHE ROUTES
// ============================================

// ADMIN: Get all beneficiary organizations
app.get('/api/v1/admin/tithe/organizations', adminMiddleware, async function(req, res) {
  try {
    const { data: orgs, error } = await supabase
      .from('beneficiary_orgs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch organizations' });
    }

    res.json({ organizations: orgs, count: orgs.length });
  } catch (e) {
    console.error('Admin tithe orgs error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Create beneficiary organization
app.post('/api/v1/admin/tithe/organizations', adminMiddleware, async function(req, res) {
  try {
    const { name, description, category, countryCode, logoUrl, websiteUrl, contactEmail, bankName, bankAccount, bankBranchCode } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const { data: org, error } = await supabase
      .from('beneficiary_orgs')
      .insert({
        name: name,
        description: description || '',
        category: category || 'other',
        country_code: countryCode || 'za',
        logo_url: logoUrl || null,
        website_url: websiteUrl || null,
        contact_email: contactEmail || null,
        bank_name: bankName || null,
        bank_account_encrypted: bankAccount || null,
        bank_branch_code: bankBranchCode || null,
        verification_status: 'pending',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Create org error:', error);
      return res.status(500).json({ error: 'Failed to create organization' });
    }

    res.status(201).json({ success: true, organization: org });
  } catch (e) {
    console.error('Admin create org error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Update beneficiary organization
app.put('/api/v1/admin/tithe/organizations/:id', adminMiddleware, async function(req, res) {
  try {
    const { id } = req.params;
    const updates = {};

    const allowedFields = ['name', 'description', 'category', 'country_code', 'logo_url', 'website_url', 'contact_email', 'bank_name', 'bank_account_encrypted', 'bank_branch_code', 'is_active', 'sort_order'];

    for (const field of allowedFields) {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (req.body[camelField] !== undefined) {
        updates[field] = req.body[camelField];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: org, error } = await supabase
      .from('beneficiary_orgs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update organization' });
    }

    res.json({ success: true, organization: org });
  } catch (e) {
    console.error('Admin update org error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Verify beneficiary organization
app.post('/api/v1/admin/tithe/organizations/:id/verify', adminMiddleware, async function(req, res) {
  try {
    const { id } = req.params;

    const { data: org, error } = await supabase
      .from('beneficiary_orgs')
      .update({
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: req.user.userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to verify organization' });
    }

    res.json({ success: true, organization: org });
  } catch (e) {
    console.error('Admin verify org error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Delete beneficiary organization
app.delete('/api/v1/admin/tithe/organizations/:id', adminMiddleware, async function(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('beneficiary_orgs')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete organization' });
    }

    res.json({ success: true, message: 'Organization deleted' });
  } catch (e) {
    console.error('Admin delete org error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Get all tithe allocations
app.get('/api/v1/admin/tithe/allocations', adminMiddleware, async function(req, res) {
  try {
    const status = req.query.status;

    let query = supabase
      .from('tithe_allocations')
      .select('*, beneficiary_orgs(name)')
      .order('allocated_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: allocations, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch allocations' });
    }

    const total = allocations.reduce((sum, a) => sum + parseFloat(a.tithe_amount || 0), 0);

    res.json({ allocations: allocations, total: total, count: allocations.length });
  } catch (e) {
    console.error('Admin allocations error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Get tithe disbursements
app.get('/api/v1/admin/tithe/disbursements', adminMiddleware, async function(req, res) {
  try {
    const { data: disbursements, error } = await supabase
      .from('tithe_disbursements')
      .select('*, beneficiary_orgs(name)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch disbursements' });
    }

    res.json({ disbursements: disbursements, count: disbursements.length });
  } catch (e) {
    console.error('Admin disbursements error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Create tithe disbursement
app.post('/api/v1/admin/tithe/disbursements', adminMiddleware, async function(req, res) {
  try {
    const { beneficiaryOrgId, periodStart, periodEnd, notes } = req.body;

    if (!beneficiaryOrgId) {
      return res.status(400).json({ error: 'beneficiaryOrgId required' });
    }

    // Get pending allocations for this org
    const { data: allocations, error: allocError } = await supabase
      .from('tithe_allocations')
      .select('id, tithe_amount')
      .eq('beneficiary_org_id', beneficiaryOrgId)
      .eq('status', 'allocated');

    if (allocError) {
      return res.status(500).json({ error: 'Failed to fetch allocations' });
    }

    const totalAmount = allocations.reduce((sum, a) => sum + parseFloat(a.tithe_amount || 0), 0);

    if (totalAmount === 0) {
      return res.status(400).json({ error: 'No pending allocations for this organization' });
    }

    // Create disbursement
    const { data: disbursement, error: disbError } = await supabase
      .from('tithe_disbursements')
      .insert({
        beneficiary_org_id: beneficiaryOrgId,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        total_amount: totalAmount,
        allocation_count: allocations.length,
        status: 'pending',
        notes: notes || null
      })
      .select()
      .single();

    if (disbError) {
      return res.status(500).json({ error: 'Failed to create disbursement' });
    }

    // Update allocations to disbursed
    const allocationIds = allocations.map(a => a.id);
    await supabase
      .from('tithe_allocations')
      .update({ status: 'disbursed', disbursement_id: disbursement.id })
      .in('id', allocationIds);

    res.status(201).json({ success: true, disbursement: disbursement, allocationsProcessed: allocations.length });
  } catch (e) {
    console.error('Admin create disbursement error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Complete disbursement (mark as paid)
app.put('/api/v1/admin/tithe/disbursements/:id/complete', adminMiddleware, async function(req, res) {
  try {
    const { id } = req.params;
    const { proofOfPaymentUrl } = req.body;

    const { data: disbursement, error } = await supabase
      .from('tithe_disbursements')
      .update({
        status: 'completed',
        proof_of_payment_url: proofOfPaymentUrl || null,
        processed_at: new Date().toISOString(),
        processed_by: req.user.userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to complete disbursement' });
    }

    res.json({ success: true, disbursement: disbursement });
  } catch (e) {
    console.error('Admin complete disbursement error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Tithe dashboard stats
app.get('/api/v1/admin/tithe/stats', adminMiddleware, async function(req, res) {
  try {
    // Get allocations stats
    const { data: allocations, error: allocError } = await supabase
      .from('tithe_allocations')
      .select('tithe_amount, status');

    if (allocError) {
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.tithe_amount || 0), 0);
    const pending = allocations.filter(a => a.status === 'pending').reduce((sum, a) => sum + parseFloat(a.tithe_amount || 0), 0);
    const allocated = allocations.filter(a => a.status === 'allocated').reduce((sum, a) => sum + parseFloat(a.tithe_amount || 0), 0);
    const disbursed = allocations.filter(a => a.status === 'disbursed').reduce((sum, a) => sum + parseFloat(a.tithe_amount || 0), 0);

    // Get orgs count
    const { data: orgs } = await supabase
      .from('beneficiary_orgs')
      .select('id, verification_status');

    const verifiedOrgs = orgs ? orgs.filter(o => o.verification_status === 'verified').length : 0;
    const pendingOrgs = orgs ? orgs.filter(o => o.verification_status === 'pending').length : 0;

    res.json({
      stats: {
        totalAllocated: totalAllocated,
        pendingAllocation: pending,
        awaitingDisbursement: allocated,
        disbursed: disbursed,
        totalOrganizations: orgs ? orgs.length : 0,
        verifiedOrganizations: verifiedOrgs,
        pendingVerification: pendingOrgs,
        pilgrimsContributing: allocations.length
      }
    });
  } catch (e) {
    console.error('Admin tithe stats error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// PRODUCT UPLOAD ROUTES (Admin)
// ============================================

const fs = require('fs');

// Disk storage for product uploads (audio/PDF)
const productStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = file.mimetype === 'audio/mpeg'
      ? path.join(__dirname, '..', 'protected', 'audio')
      : path.join(__dirname, '..', 'protected');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    if (file.mimetype === 'audio/mpeg') {
      // Use the filename from request body (e.g., "day-08" or "intro")
      const audioName = req.body.audioName || 'upload';
      cb(null, `${audioName}.mp3`);
    } else {
      // PDF always named TeaWithGod-eBook.pdf
      cb(null, 'TeaWithGod-eBook.pdf');
    }
  }
});

const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for audio
  fileFilter: function(req, file, cb) {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 audio and PDF files allowed'));
    }
  }
});

// =============================================================================
// PROMO CAMPAIGNS
// =============================================================================

// GET /api/v1/admin/promo-campaigns - List all promo campaigns
app.get('/api/v1/admin/promo-campaigns', adminMiddleware, function(req, res) {
  try {
    const campaigns = db.getPromoCampaigns();
    res.json({ campaigns: campaigns || [] });
  } catch (error) {
    console.error('[Promo] Error loading campaigns:', error);
    res.status(500).json({ error: 'Failed to load campaigns' });
  }
});

// GET /api/v1/admin/promo-campaigns/:id - Get campaign details
app.get('/api/v1/admin/promo-campaigns/:id', adminMiddleware, function(req, res) {
  try {
    const campaign = db.getPromoCampaignById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ campaign });
  } catch (error) {
    console.error('[Promo] Error loading campaign:', error);
    res.status(500).json({ error: 'Failed to load campaign' });
  }
});

// POST /api/v1/admin/promo-campaigns - Create and send promo campaign
app.post('/api/v1/admin/promo-campaigns', adminMiddleware, async function(req, res) {
  try {
    const { name, tier, emails, customMessage } = req.body;

    // Validate required fields
    if (!name || !tier || !emails) {
      return res.status(400).json({ error: 'Name, tier, and emails are required' });
    }

    // Validate tier
    if (!['book', 'journey', 'premium'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Must be book, journey, or premium' });
    }

    // Parse and validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rawEmails = Array.isArray(emails) ? emails : emails.split(/[,\s\n]+/);
    const validEmails = [...new Set(rawEmails
      .map(e => e.toLowerCase().trim())
      .filter(e => emailRegex.test(e)))];

    if (validEmails.length === 0) {
      return res.status(400).json({ error: 'No valid email addresses provided' });
    }

    // Create campaign
    const campaignId = db.createPromoCampaign(name, tier, customMessage || null, req.user?.email || 'admin');

    // Generate codes and add recipients
    const results = { sent: 0, failed: 0, errors: [] };

    for (const email of validEmails) {
      try {
        // Generate unique code for this recipient
        const codes = db.generateAccessCodes(1, `promo-${campaignId}`);
        const accessCode = codes[0];

        // Add recipient to database
        const recipientResult = db.addPromoRecipient(campaignId, email, accessCode);
        const recipientId = recipientResult.lastInsertRowid;

        // Send email
        const emailResult = await emailService.sendPromoInvite(email, accessCode, tier, customMessage);

        if (emailResult.success) {
          db.updatePromoRecipientStatus(recipientId, 'sent');
          results.sent++;
        } else {
          db.updatePromoRecipientStatus(recipientId, 'failed');
          results.failed++;
          results.errors.push({ email, error: emailResult.error });
        }
      } catch (emailError) {
        results.failed++;
        results.errors.push({ email, error: emailError.message });
      }
    }

    // Update campaign stats
    db.updatePromoCampaignStats(campaignId);

    res.json({
      success: true,
      campaignId,
      totalEmails: validEmails.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.slice(0, 5) // Only return first 5 errors
    });

  } catch (error) {
    console.error('[Promo] Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// =============================================================================
// PRODUCT UPLOADS
// =============================================================================

// Valid audio file names
const VALID_AUDIO_NAMES = ['intro'];
for (let i = 1; i <= 40; i++) {
  VALID_AUDIO_NAMES.push(`day-${i.toString().padStart(2, '0')}`);
}

// GET /api/v1/admin/products - List all product files
app.get('/api/v1/admin/products', adminMiddleware, function(req, res) {
  try {
    const audioDir = path.join(__dirname, '..', 'protected', 'audio');
    const protectedDir = path.join(__dirname, '..', 'protected');

    // Get audio files
    let audioFiles = [];
    if (fs.existsSync(audioDir)) {
      audioFiles = fs.readdirSync(audioDir)
        .filter(f => f.endsWith('.mp3'))
        .map(f => {
          const stats = fs.statSync(path.join(audioDir, f));
          return {
            name: f,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            modified: stats.mtime.toISOString()
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Get PDF file
    let pdfFile = null;
    const pdfPath = path.join(protectedDir, 'TeaWithGod-eBook.pdf');
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      pdfFile = {
        name: 'TeaWithGod-eBook.pdf',
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        modified: stats.mtime.toISOString()
      };
    }

    res.json({
      audio: audioFiles,
      pdf: pdfFile,
      validAudioNames: VALID_AUDIO_NAMES
    });
  } catch (e) {
    console.error('List products error:', e);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

// Helper to format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// POST /api/v1/admin/upload/audio - Upload audio file
app.post('/api/v1/admin/upload/audio', adminMiddleware, function(req, res) {
  // First validate audioName before processing file
  productUpload.single('file')(req, res, function(err) {
    if (err) {
      console.error('Audio upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    const audioName = req.body.audioName;
    if (!audioName || !VALID_AUDIO_NAMES.includes(audioName)) {
      // Delete uploaded file if invalid name
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: 'Invalid audio name. Must be "intro" or "day-01" through "day-40"'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Audio uploaded: ${audioName}.mp3 (${formatFileSize(req.file.size)})`);

    res.json({
      success: true,
      filename: `${audioName}.mp3`,
      size: req.file.size,
      sizeFormatted: formatFileSize(req.file.size)
    });
  });
});

// POST /api/v1/admin/upload/pdf - Upload PDF eBook
app.post('/api/v1/admin/upload/pdf', adminMiddleware, productUpload.single('file'), function(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      // Delete uploaded file if wrong type
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Only PDF files allowed' });
    }

    console.log(`PDF uploaded: TeaWithGod-eBook.pdf (${formatFileSize(req.file.size)})`);

    res.json({
      success: true,
      filename: 'TeaWithGod-eBook.pdf',
      size: req.file.size,
      sizeFormatted: formatFileSize(req.file.size)
    });
  } catch (e) {
    console.error('PDF upload error:', e);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

// ============================================
// YOCO PAYMENT ROUTES
// ============================================

const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
const YOCO_PUBLIC_KEY = process.env.YOCO_PUBLIC_KEY;
const SITE_URL = process.env.SITE_URL || 'https://twg.cleva-ai.co.za';

// Pricing in cents (ZAR)
const PLAN_PRICES_CENTS = {
  book: 9900,      // R99
  journey: 14900,  // R149
  premium: 24900   // R249
};

// Display prices by country (approximate conversions for UX only)
const COUNTRY_PRICING = {
  ZA: { currency: 'R', book: 99, journey: 149, premium: 249 },
  US: { currency: '$', book: 5.99, journey: 8.99, premium: 13.99 },
  GB: { currency: '£', book: 4.99, journey: 7.99, premium: 11.99 },
  EU: { currency: '€', book: 5.49, journey: 8.49, premium: 12.99 },
  DEFAULT: { currency: '$', book: 5.99, journey: 8.99, premium: 13.99 }
};

// Get pricing for country (public endpoint)
app.get('/api/v1/pricing', function(req, res) {
  const country = req.query.country || 'ZA';
  const pricing = COUNTRY_PRICING[country] || COUNTRY_PRICING.DEFAULT;
  res.json({
    country: country,
    currency: pricing.currency,
    plans: {
      book: { display: `${pricing.currency}${pricing.book}`, zarAmount: 99 },
      journey: { display: `${pricing.currency}${pricing.journey}`, zarAmount: 149 },
      premium: { display: `${pricing.currency}${pricing.premium}`, zarAmount: 249 }
    },
    note: country !== 'ZA' ? 'Charged in ZAR. Your bank handles currency conversion.' : null
  });
});

// Create Yoco checkout session
app.post('/api/v1/yoco/checkout', async function(req, res) {
  try {
    const { firstName, lastName, email, phone, plan, country, beneficiaryOrgId } = req.body;

    if (!firstName || !lastName || !email || !plan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!PLAN_PRICES_CENTS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    if (!YOCO_SECRET_KEY) {
      return res.status(500).json({ error: 'Yoco not configured' });
    }

    // Generate order reference
    const orderRef = 'TWG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Create order in Supabase (pending)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_ref: orderRef,
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase().trim(),
        phone: phone || '',
        plan: plan,
        amount: PLAN_PRICES_CENTS[plan] / 100,
        status: 'pending',
        payment_method: 'yoco',
        country: country || 'ZA',
        beneficiary_org_id: beneficiaryOrgId || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Create Yoco checkout
    const axios = require('axios');
    const yocoResponse = await axios.post(
      'https://payments.yoco.com/api/checkouts',
      {
        amount: PLAN_PRICES_CENTS[plan],
        currency: 'ZAR',
        successUrl: `${SITE_URL}/payment-success.html?ref=${orderRef}`,
        cancelUrl: `${SITE_URL}/checkout.html?cancelled=true`,
        failureUrl: `${SITE_URL}/payment-failed.html?ref=${orderRef}`,
        metadata: {
          orderRef: orderRef,
          plan: plan,
          email: email,
          firstName: firstName,
          lastName: lastName
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const checkoutId = yocoResponse.data.id;
    const redirectUrl = yocoResponse.data.redirectUrl;

    // Update order with Yoco checkout ID
    await supabase
      .from('orders')
      .update({ yoco_checkout_id: checkoutId })
      .eq('order_ref', orderRef);

    console.log('[Yoco] Checkout created:', orderRef, checkoutId);

    res.json({
      success: true,
      orderRef: orderRef,
      checkoutUrl: redirectUrl
    });

  } catch (e) {
    console.error('[Yoco] Checkout error:', e.response?.data || e.message);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

// Yoco webhook handler
app.post('/api/v1/yoco/webhook', async function(req, res) {
  try {
    const event = req.body;
    console.log('[Yoco Webhook] Received:', event.type);

    // Handle payment success
    if (event.type === 'payment.succeeded') {
      const payload = event.payload;
      const metadata = payload.metadata || {};
      const orderRef = metadata.orderRef;

      if (!orderRef) {
        console.log('[Yoco Webhook] No orderRef in metadata');
        return res.status(200).json({ received: true });
      }

      // Check if already processed
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_ref', orderRef)
        .single();

      if (!existingOrder) {
        console.log('[Yoco Webhook] Order not found:', orderRef);
        return res.status(200).json({ received: true });
      }

      if (existingOrder.status === 'verified') {
        console.log('[Yoco Webhook] Already processed:', orderRef);
        return res.status(200).json({ received: true, alreadyProcessed: true });
      }

      // Generate access code
      const accessCode = db.generateAccessCodes(1, orderRef)[0];

      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'verified',
          access_code: accessCode,
          yoco_payment_id: payload.id,
          verified_at: new Date().toISOString()
        })
        .eq('order_ref', orderRef);

      // Create tithe allocation (10%)
      const titheAmount = existingOrder.amount * 0.10;
      await supabase
        .from('tithe_allocations')
        .insert({
          order_id: existingOrder.id,
          order_ref: orderRef,
          gross_amount: existingOrder.amount,
          tithe_percentage: 10,
          tithe_amount: titheAmount,
          status: 'pending'
        });

      // Create invoice record in database
      const planNames = {
        book: 'Book Access',
        journey: 'Journey Access',
        premium: 'Premium Access'
      };
      const invoiceNumber = 'TWG-INV-' + Date.now().toString(36).toUpperCase();
      const today = new Date().toISOString().split('T')[0];
      const invoiceId = Date.now().toString();

      await supabase
        .from('invoices')
        .insert({
          id: invoiceId,
          invoice_number: invoiceNumber,
          invoice_date: today,
          client_name: existingOrder.first_name + ' ' + existingOrder.last_name,
          client_email: existingOrder.email,
          client_address: '',
          total: existingOrder.amount,
          due_date: today,
          notes: 'Payment via Yoco. Order ref: ' + orderRef,
          status: 'paid'
        });

      await supabase.from('invoice_line_items').insert({
        invoice_id: invoiceId,
        description: 'Tea With God - ' + (planNames[existingOrder.plan] || existingOrder.plan),
        quantity: 1,
        unit_price: existingOrder.amount,
        total: existingOrder.amount
      });

      // Send access code email and invoice
      const emailResult = await emailService.sendAccessCode(existingOrder, accessCode);
      const invoiceResult = await emailService.sendInvoice(existingOrder, accessCode);
      console.log('[Yoco Webhook] Emails sent:', orderRef, { accessCode: emailResult.success, invoice: invoiceResult.success });

      return res.status(200).json({ received: true, processed: true });
    }

    // Handle payment failure
    if (event.type === 'payment.failed') {
      const metadata = event.payload?.metadata || {};
      const orderRef = metadata.orderRef;

      if (orderRef) {
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('order_ref', orderRef);
      }

      return res.status(200).json({ received: true });
    }

    res.status(200).json({ received: true });

  } catch (e) {
    console.error('[Yoco Webhook] Error:', e);
    res.status(200).json({ received: true, error: e.message });
  }
});

// Verify access code (for downloads page)
app.post('/api/v1/access-codes/verify', async function(req, res) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ valid: false, error: 'Access code required' });
    }

    const normalizedCode = code.trim().toUpperCase();

    // 1. Check owner/review codes first (unlimited access)
    if (OWNER_CODES.includes(normalizedCode)) {
      console.log('[Verify Code] Owner code matched');
      return res.json({
        valid: true,
        firstName: 'Friend',
        plan: 'premium',
        codeType: 'owner'
      });
    }

    // 2. Check SQLite access_codes table (B2B/org codes)
    const sqliteCode = db.getAccessCode(normalizedCode);
    if (sqliteCode) {
      console.log('[Verify Code] SQLite code matched');
      return res.json({
        valid: true,
        firstName: 'Friend',
        plan: 'journey',
        codeType: 'organization'
      });
    }

    // 3. Check Supabase orders table (purchase codes)
    const { data: order, error } = await supabase
      .from('orders')
      .select('first_name, last_name, email, plan, status')
      .eq('access_code', normalizedCode)
      .eq('status', 'verified')
      .single();

    if (error || !order) {
      return res.json({ valid: false, error: 'Invalid or expired access code' });
    }

    res.json({
      valid: true,
      firstName: order.first_name,
      plan: order.plan,
      codeType: 'purchase'
    });

  } catch (e) {
    console.error('[Verify Code] Error:', e);
    res.status(500).json({ valid: false, error: 'Verification failed' });
  }
});

// ============================================
// UNIFIED ACCESS CODE VALIDATION (Server-Side)
// ============================================
// Validates against: SQLite access_codes, Supabase orders, Owner codes

// Rate limiting for access validation (simple in-memory, per IP)
const accessValidationAttempts = new Map(); // IP -> { count, resetTime }
const MAX_VALIDATION_ATTEMPTS = 10;
const VALIDATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Owner/review codes (from env or fallback)
const OWNER_CODES = (process.env.OWNER_CODES || 'REVIEW,OWNER2025,BETAREVIEW').split(',').map(c => c.trim().toUpperCase());

app.post('/api/v1/access/validate', async function(req, res) {
  try {
    const { code } = req.body;
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Rate limiting check
    const now = Date.now();
    const attempts = accessValidationAttempts.get(clientIP) || { count: 0, resetTime: now + VALIDATION_WINDOW_MS };

    if (now > attempts.resetTime) {
      attempts.count = 0;
      attempts.resetTime = now + VALIDATION_WINDOW_MS;
    }

    if (attempts.count >= MAX_VALIDATION_ATTEMPTS) {
      console.log('[Access Validate] Rate limited:', clientIP);
      return res.status(429).json({ valid: false, error: 'Too many attempts. Try again later.' });
    }

    attempts.count++;
    accessValidationAttempts.set(clientIP, attempts);

    if (!code) {
      return res.status(400).json({ valid: false, error: 'Access code required' });
    }

    const normalizedCode = code.trim().toUpperCase();
    console.log('[Access Validate] Checking code:', normalizedCode.substring(0, 4) + '***');

    // 1. Check owner/review codes first
    if (OWNER_CODES.includes(normalizedCode)) {
      console.log('[Access Validate] Owner code matched');
      return res.json({
        valid: true,
        accessLevel: 'FULL',
        plan: 'premium',
        codeType: 'owner'
      });
    }

    // 1b. Test codes for tier testing (journey/book without premium)
    if (normalizedCode === 'TESTJOURNEY') {
      console.log('[Access Validate] Test journey code');
      return res.json({
        valid: true,
        accessLevel: 'FULL',
        plan: 'journey',
        codeType: 'test'
      });
    }
    if (normalizedCode === 'TESTBOOK') {
      console.log('[Access Validate] Test book code');
      return res.json({
        valid: true,
        accessLevel: 'FULL',
        plan: 'book',
        codeType: 'test'
      });
    }

    // 2. Check SQLite access_codes table (B2B/org codes and promo codes)
    const sqliteCode = db.getAccessCode(normalizedCode);
    if (sqliteCode) {
      console.log('[Access Validate] SQLite code matched:', normalizedCode.substring(0, 8) + '***');

      // Check if this is a promo code and get the tier from the campaign
      const promoTier = db.getPromoTierByCode(normalizedCode);
      if (promoTier) {
        console.log('[Access Validate] Promo code tier:', promoTier);
        return res.json({
          valid: true,
          accessLevel: 'FULL',
          plan: promoTier,
          codeType: 'promo'
        });
      }

      // Regular organization code (defaults to journey)
      return res.json({
        valid: true,
        accessLevel: 'FULL',
        plan: 'journey',
        codeType: 'organization'
      });
    }

    // 3. Check Supabase orders table (purchase codes)
    const { data: order, error } = await supabase
      .from('orders')
      .select('first_name, plan, status')
      .eq('access_code', normalizedCode)
      .eq('status', 'verified')
      .single();

    if (order && !error) {
      console.log('[Access Validate] Purchase code matched, plan:', order.plan);
      return res.json({
        valid: true,
        accessLevel: 'FULL',
        plan: order.plan || 'journey',
        codeType: 'purchase',
        firstName: order.first_name
      });
    }

    // No match found
    console.log('[Access Validate] Invalid code attempt from:', clientIP);
    return res.json({ valid: false, error: 'Invalid or expired access code' });

  } catch (e) {
    console.error('[Access Validate] Error:', e);
    res.status(500).json({ valid: false, error: 'Validation failed' });
  }
});

// Protected eBook download (requires valid access code, max 2 downloads)
const MAX_DOWNLOADS = 2;

app.get('/api/v1/download/ebook', async function(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Access code required' });
    }

    const normalizedCode = code.trim().toUpperCase();
    const ebookPath = path.join(__dirname, '../protected/TeaWithGod-eBook.pdf');
    const fs = require('fs');

    // Check if file exists first
    if (!fs.existsSync(ebookPath)) {
      console.error('[Download] eBook file not found:', ebookPath);
      return res.status(404).json({ error: 'eBook file not found. Please contact support.' });
    }

    // 1. Check owner/review codes first (unlimited downloads)
    if (OWNER_CODES.includes(normalizedCode)) {
      console.log('[Download] Owner code download');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="TeaWithGod-40-Day-Devotional.pdf"');
      return fs.createReadStream(ebookPath).pipe(res);
    }

    // 2. Check SQLite access_codes table (B2B/org codes - unlimited downloads)
    const sqliteCode = db.getAccessCode(normalizedCode);
    if (sqliteCode) {
      console.log('[Download] Organization code download');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="TeaWithGod-40-Day-Devotional.pdf"');
      return fs.createReadStream(ebookPath).pipe(res);
    }

    // 3. Check Supabase orders table (purchase codes - limited downloads)
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('access_code', normalizedCode)
      .eq('status', 'verified')
      .single();

    if (error || !order) {
      return res.status(403).json({ error: 'Invalid or expired access code' });
    }

    // Check download limit for purchased codes
    const downloadCount = order.download_count || 0;
    if (downloadCount >= MAX_DOWNLOADS) {
      return res.status(403).json({
        error: 'Download limit reached. You have already downloaded the eBook ' + MAX_DOWNLOADS + ' times. Contact support if you need assistance.'
      });
    }

    // Increment download count
    await supabase
      .from('orders')
      .update({ download_count: downloadCount + 1 })
      .eq('id', order.id);

    // Log download
    console.log('[Download] eBook downloaded by:', order.email, 'Plan:', order.plan, 'Download #:', downloadCount + 1);

    // Serve the file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="TeaWithGod-40-Day-Devotional.pdf"');
    fs.createReadStream(ebookPath).pipe(res);

  } catch (e) {
    console.error('[Download] Error:', e);
    res.status(500).json({ error: 'Download failed' });
  }
});

// ============================================
// PROTECTED AUDIO STREAMING
// ============================================

// Valid audio files - dynamically generated for intro + days 1-40
const VALID_AUDIO_FILES = { 'intro': 'intro.mp3' };
for (let i = 1; i <= 40; i++) {
  const key = `day-${i.toString().padStart(2, '0')}`;
  VALID_AUDIO_FILES[key] = `${key}.mp3`;
}

// Protected audio streaming (requires valid access code)
app.get('/api/v1/audio/:track', async function(req, res) {
  try {
    const { track } = req.params;
    const { code } = req.query;

    if (!code) {
      return res.status(401).json({ error: 'Access code required' });
    }

    // Validate track name
    if (!VALID_AUDIO_FILES[track]) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Verify access code exists in database (verified order)
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('access_code', code)
      .eq('status', 'verified')
      .single();

    if (error || !order) {
      // Also check if it's an owner/review code
      const ownerCodes = ['REVIEW', 'OWNER2025', 'BETAREVIEW'];
      if (!ownerCodes.includes(code.toUpperCase())) {
        return res.status(403).json({ error: 'Invalid or expired access code' });
      }
    }

    // Construct file path (protected directory outside web root)
    const audioPath = path.join(__dirname, '../protected/audio/', VALID_AUDIO_FILES[track]);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(audioPath)) {
      console.error('[Audio] File not found:', audioPath);
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Get file stats for content-length
    const stat = fs.statSync(audioPath);

    // Support range requests for streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg'
      });

      fs.createReadStream(audioPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'audio/mpeg'
      });

      fs.createReadStream(audioPath).pipe(res);
    }

    console.log('[Audio] Streaming:', track, 'to:', order?.email || 'owner');

  } catch (e) {
    console.error('[Audio] Stream error:', e);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

// Check order status (for success page polling)
app.get('/api/v1/orders/:orderRef/status', async function(req, res) {
  try {
    const { orderRef } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('order_ref, plan, amount, status, access_code, verified_at')
      .eq('order_ref', orderRef)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderRef: order.order_ref,
      plan: order.plan,
      amount: order.amount,
      status: order.status,
      accessCode: order.status === 'verified' ? order.access_code : null,
      verifiedAt: order.verified_at
    });

  } catch (e) {
    console.error('Order status error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// ADMIN EMAIL ENDPOINT
// ============================================

// Send custom email from admin panel
app.post('/api/v1/admin/send-email', async function(req, res) {
  try {
    // Simple admin auth check (verify request comes from admin)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, subject, body, template } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    // Send the email using existing email service
    const result = await emailService.sendEmail({
      to,
      subject,
      html: body
    });

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error || 'Failed to send email' });
    }

  } catch (e) {
    console.error('[Admin Email] Error:', e);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Get email templates
app.get('/api/v1/admin/email-templates', function(req, res) {
  const templates = {
    invoice_reminder: {
      name: 'Invoice Reminder',
      subject: 'Reminder: Invoice {{invoiceNumber}} from Tea With God',
      body: `<p>Hi {{clientName}},</p>
<p>This is a friendly reminder that invoice <strong>{{invoiceNumber}}</strong> for <strong>R{{amount}}</strong> is due on {{dueDate}}.</p>
<p>Please let us know if you have any questions.</p>
<p>Warm regards,<br>Tea With God Team</p>`
    },
    follow_up: {
      name: 'Follow Up',
      subject: 'Following up - Tea With God',
      body: `<p>Hi {{name}},</p>
<p>I wanted to follow up on our previous conversation about Tea With God.</p>
<p>Is there anything I can help clarify or assist with?</p>
<p>Warm regards,<br>Tea With God Team</p>`
    },
    welcome_partner: {
      name: 'Welcome Partner',
      subject: 'Welcome to Tea With God Partnership',
      body: `<p>Dear {{orgName}},</p>
<p>Thank you for partnering with Tea With God to bring faith and hope to your community.</p>
<p>Your organization is now set up in our system. Here's what happens next:</p>
<ul>
<li>We'll generate access codes for your members</li>
<li>You'll receive distribution materials</li>
<li>Your dedicated dashboard is ready</li>
</ul>
<p>We're excited to walk this journey with you.</p>
<p>Blessings,<br>The Tea With God Team</p>`
    },
    thank_you: {
      name: 'Thank You',
      subject: 'Thank you from Tea With God',
      body: `<p>Dear {{name}},</p>
<p>Thank you for {{reason}}.</p>
<p>Your support means the world to us and helps bring hope to women everywhere.</p>
<p>"The potter formed it into another pot, shaping it as seemed best to him." — Jeremiah 18:4</p>
<p>With gratitude,<br>The Tea With God Team</p>`
    }
  };
  res.json(templates);
});

// ============================================
// CONTACT FORM ENDPOINT (Public - for website contact form)
// ============================================

app.post('/api/v1/contact', async function(req, res) {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!firstName || !email || !message) {
      return res.status(400).json({ error: 'First name, email, and message are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Sanitize inputs to prevent XSS
    const cleanFirstName = sanitizeInput(firstName);
    const cleanLastName = sanitizeInput(lastName || '');
    const cleanPhone = sanitizeInput(phone || '');
    const cleanSubject = sanitizeInput(subject || 'general');
    const cleanMessage = sanitizeInput(message);

    // Create contact record in Supabase
    const contactId = Date.now().toString();
    const { error: insertError } = await supabase
      .from('contacts')
      .insert({
        id: contactId,
        first_name: cleanFirstName,
        last_name: cleanLastName,
        email: email,
        phone: cleanPhone,
        subject: cleanSubject,
        message: cleanMessage,
        status: 'new',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('[Contact] Supabase insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save contact' });
    }

    // Log to CRM activity
    await supabase.from('crm_activities').insert({
      id: Date.now().toString() + '-activity',
      type: 'contact_form',
      message: `New contact form submission from ${cleanFirstName} ${cleanLastName} (${email})`,
      created_at: new Date().toISOString()
    });

    // Send confirmation email to user
    await emailService.sendEmail({
      to: email,
      subject: 'We received your message - Tea With God',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #D4AF37;">Thank you for reaching out!</h2>
          <p>Hi ${cleanFirstName},</p>
          <p>We've received your message and will get back to you within 24-48 hours.</p>
          <p style="background: #f5f5f5; padding: 16px; border-radius: 8px; color: #666;">
            <strong>Your message:</strong><br>
            ${cleanMessage.replace(/\n/g, '<br>')}
          </p>
          <p style="font-style: italic; color: #8B7355; margin-top: 24px;">
            "The pot was marred in his hands; so the potter formed it into another pot, shaping it as seemed best to him." — Jeremiah 18:4
          </p>
          <p>Warm regards,<br>The Tea With God Team</p>
        </div>
      `
    });

    // Send notification to admin
    await emailService.sendEmail({
      to: 'hello@teawithgod.com',
      subject: `New Contact Form: ${subject || 'General Inquiry'} from ${firstName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #D4AF37;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${firstName} ${lastName || ''}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${phone || 'Not provided'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Subject:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${subject || 'General'}</td></tr>
          </table>
          <h3 style="margin-top: 24px;">Message:</h3>
          <p style="background: #f5f5f5; padding: 16px; border-radius: 8px; color: #333;">
            ${cleanMessage.replace(/\n/g, '<br>')}
          </p>
          <div style="margin-top: 32px; text-align: center;">
            <a href="https://teawithgod.com/admin/" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%); color: #0D0D0D; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">View in Admin Dashboard</a>
            <p style="margin-top: 12px; font-size: 12px; color: #888;">Click to view and respond to this inquiry</p>
          </div>
        </div>
      `
    });

    console.log('[Contact] New submission from:', email);
    res.json({ success: true, message: 'Thank you for your message! We will get back to you soon.' });

  } catch (e) {
    console.error('[Contact] Error:', e);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

app.listen(PORT, function() {
  console.log('Tea With God API running on port ' + PORT);
  console.log('Days ingested: ' + db.getDayCount());
  console.log('Yoco configured:', !!YOCO_SECRET_KEY);
});

module.exports = app;
