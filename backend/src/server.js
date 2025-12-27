require('dotenv').config();
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
const JWT_SECRET = process.env.JWT_SECRET || 'tea-with-god-dev-secret';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@teawithgod.app,twg@cleva-ai.co.za').split(',').map(e => e.trim().toLowerCase());

function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (!ADMIN_EMAILS.includes(decoded.email.toLowerCase())) {
      return res.status(403).json({ error: 'Admin access denied' });
    }
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
}

// Auth Routes
app.post('/api/v1/auth/register', async function(req, res) {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
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

app.post('/api/v1/auth/login', async function(req, res) {
  try {
    const { email, password } = req.body;
    const user = db.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    db.run("UPDATE users SET last_active_at = datetime('now') WHERE user_id = ?", [user.user_id]);
    const token = jwt.sign({ userId: user.user_id, email: email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token: token, user: { userId: user.user_id, email: user.email, accessLevel: user.access_level, currentDayIndex: user.current_day_index } });
  } catch (e) {
    console.error('[Login Error]', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/v1/auth/me', authMiddleware, function(req, res) {
  const user = db.getUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { userId: user.user_id, email: user.email, displayName: user.display_name, accessLevel: user.access_level, currentDayIndex: user.current_day_index, totalDaysCompleted: user.total_days_completed } });
});

app.post('/api/v1/auth/redeem-code', authMiddleware, function(req, res) {
  const { code } = req.body;
  if (!/^TWG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(code)) {
    return res.status(400).json({ error: 'Invalid format' });
  }
  const upperCode = code.toUpperCase();
  const accessCode = db.getAccessCode(upperCode);
  if (!accessCode) return res.status(404).json({ error: 'Code not found or used' });
  
  db.run('UPDATE access_codes SET is_redeemed = 1, redeemed_by = ?, redeemed_at = datetime("now") WHERE code = ?', [req.user.userId, upperCode]);
  db.run('UPDATE users SET access_level = "PILGRIM", access_code = ?, journey_started_at = COALESCE(journey_started_at, datetime("now")) WHERE user_id = ?', [upperCode, req.user.userId]);
  for (let d = 4; d <= 40; d++) {
    db.run('INSERT OR IGNORE INTO user_daily_completions (user_id, day_number, status) VALUES (?, ?, "LOCKED")', [req.user.userId, d]);
  }
  res.json({ success: true, accessLevel: 'PILGRIM', message: 'Welcome, Pilgrim.' });
});

// Journey Routes
app.get('/api/v1/journey/progress', authMiddleware, function(req, res) {
  const user = db.getUserById(req.user.userId);
  const completions = db.getUserProgress(req.user.userId);
  res.json({ currentDayIndex: user.current_day_index, totalDaysCompleted: user.total_days_completed, accessLevel: user.access_level, completions: completions });
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
  db.run('UPDATE user_daily_completions SET ' + updates.join(', ') + ', updated_at = datetime("now") WHERE user_id = ? AND day_number = ?', values);
  const completion = db.get('SELECT * FROM user_daily_completions WHERE user_id = ? AND day_number = ?', [req.user.userId, dayNumber]);
  res.json({ completion: completion });
});

app.post('/api/v1/journey/days/:dayNumber/complete', authMiddleware, function(req, res) {
  const dayNumber = parseInt(req.params.dayNumber);
  db.run('UPDATE user_daily_completions SET status = "COMPLETE", completed_at = datetime("now") WHERE user_id = ? AND day_number = ?', [req.user.userId, dayNumber]);
  if (dayNumber < 40) {
    db.run('UPDATE user_daily_completions SET status = "AVAILABLE" WHERE user_id = ? AND day_number = ?', [req.user.userId, dayNumber + 1]);
  }
  db.run('UPDATE users SET current_day_index = MIN(current_day_index + 1, 40), total_days_completed = total_days_completed + 1, last_active_at = datetime("now") WHERE user_id = ?', [req.user.userId]);
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
    db.run('UPDATE journal_entries SET content_encrypted = ?, content_iv = ?, content_hash = ?, word_count = ?, updated_at = datetime("now") WHERE entry_id = ?', [enc.encrypted, enc.iv, enc.hash, wordCount, existing.entry_id]);
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
    const { firstName, lastName, email, phone, plan, orderRef } = req.body;

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

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase orders error:', error);
      return res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }

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

    // Send access code email automatically
    const emailResult = await emailService.sendAccessCode(order, accessCode);

    res.json({
      success: true,
      accessCode: accessCode,
      email: order.email,
      phone: order.phone,
      emailSent: emailResult.success,
      emailError: emailResult.error || null
    });
  } catch (e) {
    console.error('Verify error:', e);
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

app.listen(PORT, function() {
  console.log('Tea With God API running on port ' + PORT);
  console.log('Days ingested: ' + db.getDayCount());
});

module.exports = app;
