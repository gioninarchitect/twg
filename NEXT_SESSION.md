# Tea With God - Next Session Handoff

**Session Date:** January 15, 2026 (Session 11)
**Branch:** `feature/session-5-jan5-2026`

---

## What We Did This Session

### 1. Fixed Promo Tier Bug (R249 going to R149)
**Problem:** Premium (R249) promo codes were giving Journey (R149) access.

**Root cause:**
- Users table had no `tier` column
- Validate endpoint hardcoded `plan: 'journey'` for all SQLite codes
- Redeem endpoint set everyone to PILGRIM without tier distinction

**Fix:**
- Added `tier` column to users table (schema.sql + migration in db.js)
- Added `getPromoTierByCode()` helper to look up campaign tier
- Updated `/api/v1/access/validate` to return correct tier for promo codes
- Updated `/api/v1/auth/redeem-code` to set user's tier from promo campaign
- All user endpoints now return tier in responses

### 2. Admin PIN Login System (No Password)
**Login flow:**
1. Enter email
2. Enter PIN: **132872** (permanent, never changes)
3. Access dashboard

**New endpoint:**
- `POST /api/v1/admin/login-pin` - Email + PIN login (auto-creates user if needed)
- `GET /api/v1/admin/users` - List admins (super admin only)
- `POST /api/v1/admin/users/reset-password` - Reset password (super admin only)

### 3. Super Admin System
| Role | Emails | Access |
|------|--------|--------|
| Super Admin | superadmin@cleva-ai.co.za, floris@cleva-ai.co.za | Full access + reset passwords |
| Admin | lani@teawithgod.com, twg@cleva-ai.co.za | Standard admin access |

### 4. Updated SMTP Settings
- SMTP_HOST: mail.cleva-ai.co.za
- SMTP_PORT: 465
- SMTP_USER: superadmin@cleva-ai.co.za
- EMAIL_FROM: lani@teawithgod.com

---

## Admin Credentials (PIN Only - No Password)

| Email | Role | PIN |
|-------|------|-----|
| superadmin@cleva-ai.co.za | Super Admin | 132872 |
| floris@cleva-ai.co.za | Super Admin | 132872 |
| lani@teawithgod.com | Admin (Owner) | 132872 |
| twg@cleva-ai.co.za | Admin | 132872 |

**PIN is permanent and never changes.**

---

## Server Info

| Server | IP | Domain | Web Root | API Port | PM2 Process |
|--------|----|----|----------|----------|-------------|
| TWG UAT | 154.66.196.12 | twg.cleva-ai.co.za | /var/www/twg | 3000 | **twg-api** |

---

## Deployment Commands

### Full Website (includes PWA)
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God && COPYFILE_DISABLE=1 tar --no-mac-metadata --exclude='._*' --exclude='.DS_Store' --exclude='__MACOSX' -czf /tmp/twg-website.tar.gz website

scp /tmp/twg-website.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && tar -xzf /tmp/twg-website.tar.gz --strip-components=1 && chown -R www-data:www-data . && chmod -R 755 . && rm /tmp/twg-website.tar.gz && echo 'Website deployed'"
```

### Backend
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/backend && COPYFILE_DISABLE=1 tar --no-mac-metadata --exclude='._*' --exclude='.DS_Store' --exclude='__MACOSX' --exclude='*.db' --exclude='node_modules' --exclude='.git' --exclude='.env' --exclude='protected' -czf /tmp/twg-backend.tar.gz .

scp /tmp/twg-backend.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg/backend && tar -xzf /tmp/twg-backend.tar.gz && npm install --production && pm2 restart twg-api && rm /tmp/twg-backend.tar.gz && echo 'Backend deployed'"
```

### PWA Only
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/mobile && npx expo export -p web
rm -rf ../website/app/* && cp -r dist/* ../website/app/
cd ../website && COPYFILE_DISABLE=1 tar --no-mac-metadata --exclude='._*' --exclude='.DS_Store' -czf /tmp/twg-app.tar.gz app

scp /tmp/twg-app.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && rm -rf app && tar -xzf /tmp/twg-app.tar.gz && chown -R www-data:www-data app && chmod -R 755 app && rm /tmp/twg-app.tar.gz && echo 'PWA deployed'"
```

---

## Pricing Tiers (CORRECT)

| Tier | Price | Access |
|------|-------|--------|
| Book | R99 | eBook only |
| Journey | R149 | eBook + Full app (40 days) |
| Premium | R249 | Everything (music, brain games, voice notes) |

---

## Test URLs

| What | URL |
|------|-----|
| PWA | https://teawithgod.com/app |
| Admin | https://teawithgod.com/admin |
| B2B Portal | https://teawithgod.com/b2b |

---

## Pending/Future Tasks

1. **SMTP credentials not working** - mail.cleva-ai.co.za rejecting superadmin@cleva-ai.co.za login (535 error). Need correct credentials.
2. **Promo emails going to spam** - May need SPF/DKIM configuration
3. **Test promo tier fix** - Create Premium campaign and verify brain games unlock

---

## Important Context

- **The app does NOT heal anyone** - It's a devotional companion, educational content only
- **Admin login is PIN only:** 132872 (no password, permanent)
- **Three tiers:** Book (R99), Journey (R149), Premium (R249)
- **NEVER use "healing" in user-facing text** - Liability issue
- **Super admin can reset passwords** for other admins
- **Admin users auto-created** on first PIN login

---

*"The potter formed it into another pot, shaping it as seemed best to him."* - Jeremiah 18:4
