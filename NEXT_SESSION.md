# Tea With God - Next Session Handoff

**Session Date:** January 15, 2026 (Session 12)
**Branch:** `feature/session-5-jan5-2026`

---

## What We Did This Session

### 1. Removed False Testimonials (Liability Fix)
**Problem:** Website had fabricated testimonials with fake names and organizations (Pastor Sarah M., Grace Community Church, etc.)

**Fix:**
- **B2B Portal** - Replaced fake testimonials with feature highlights (Privacy-First Design, Offline Capable, Evidence-Based Content)
- **Main Website** - Changed "Voices from the Journey" to "Built for Real Life" with feature cards instead of fake names
- **Upgrade Page** - Changed to "Why People Upgrade" with feature descriptions

### 2. B2B Wholesale + Tithe Pricing Structure
**Research-backed pricing** (30-45% is industry standard for ministry resources):

| Package | Codes | Wholesale Discount | Tithe Bonus | Total Savings |
|---------|-------|--------------------|-------------|---------------|
| Seedling | 50+5 free | 20% | +10% | **30%** |
| Harvest | 100+10 free | 30% | +10% | **40%** |
| Flourish | 200+20 free | 40% | +10% | **50%** |
| Enterprise | 500+ | Custom | Custom | Up to 60% |

**Pricing per code (Journey tier R149 retail):**
- Seedling: R104/code (pay R5,200 for 55 codes)
- Harvest: R89/code (pay R8,900 for 110 codes)
- Flourish: R75/code (pay R15,000 for 220 codes)

### 3. B2B Tier Selector
Organizations can now choose which tier to buy codes for:
- **Book (R99)** - PDF/eBook only
- **Journey (R149)** - Full app access
- **Premium (R249)** - Everything including brain games, music, voice recordings

### 4. Price Breakdown Display
Each B2B package now shows transparent pricing:
```
Retail price:           R149 (crossed out)
Wholesale (30% off):    R104
Tithe bonus (10%):      -R15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your price:             R89/code
```

---

## Two Separate Code Distribution Systems

### 1. B2B Portal (`/b2b`)
- For organizations buying bulk codes
- Wholesale pricing with tithe bonus
- Packages: Seedling (50), Harvest (100), Flourish (200), Enterprise (500+)
- Organizations contact via form, admin generates codes

### 2. Promo Campaigns (Admin Dashboard)
- For individual promotional distribution
- Admin creates campaign, adds recipients, sends email with codes
- Tiers: Book, Journey, Premium
- Tracked redemption stats

---

## Consumer Pricing (Unchanged)

| Tier | Price | Access |
|------|-------|--------|
| Book | R99 | eBook only |
| Journey | R149 | eBook + Full app (40 days) |
| Premium | R249 | Everything (music, brain games, voice notes) |

---

## Admin Credentials

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

### Website Only (changed files)
```bash
COPYFILE_DISABLE=1 tar --no-mac-metadata --exclude='._*' --exclude='.DS_Store' -czf /tmp/twg-updates.tar.gz -C /Users/florisolivier/TWGAPP/tea-with-God website/index.html website/b2b/index.html website/upgrade.html

scp /tmp/twg-updates.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && tar -xzf /tmp/twg-updates.tar.gz --strip-components=1 && chown -R www-data:www-data . && rm /tmp/twg-updates.tar.gz && echo 'Updates deployed'"
```

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

## Test URLs

| What | URL |
|------|-----|
| PWA | https://teawithgod.com/app |
| Admin | https://teawithgod.com/admin |
| B2B Portal | https://teawithgod.com/b2b |

---

## Pending/Future Tasks

1. **SMTP credentials not working** - mail.cleva-ai.co.za rejecting superadmin@cleva-ai.co.za login (535 error). Need correct credentials.
2. **Test promo tier fix** - Create Premium campaign and verify brain games unlock
3. **B2B admin integration** - Admin dashboard needs to generate B2B wholesale codes with correct pricing
4. **Upgrade commission tracking** - PARKED for now. If needed later: track which org distributed a code, credit them commission on user upgrades.

---

## Important Context

- **The app does NOT heal anyone** - It's a devotional companion, educational content only
- **Admin login is PIN only:** 132872 (no password, permanent)
- **Three consumer tiers:** Book (R99), Journey (R149), Premium (R249)
- **B2B wholesale:** 30%/40%/50% total discount (20/30/40 wholesale + 10% tithe)
- **NEVER use "healing" in user-facing text** - Liability issue
- **No false testimonials** - All removed, replaced with feature descriptions

---

## Key Files Modified This Session

- `website/index.html` - Testimonials section updated
- `website/b2b/index.html` - Full wholesale + tithe pricing system
- `website/upgrade.html` - Testimonials replaced with features

---

*"The potter formed it into another pot, shaping it as seemed best to him."* - Jeremiah 18:4
