# Tea With God - Next Session Handoff

**Session Date:** January 18, 2026 (Session 15 - Afrikaans Translation Audit)
**Branch:** `feature/i18n-hybrid-content-2026-01-18`

---

## What We Did This Session

### Afrikaans Branding Fix - COMPLETE
- Changed "Tee met God" / "Tee saam met God" to **"Tee Saam God"** everywhere
- Updated website translations (`/website/translations/af.json`)
- Updated mobile translations (`/mobile/src/i18n/locales/af.json`)
- Added logo text translation support in `index.html` (nav + footer)
- Added `nav.brandName` translation key to both en.json and af.json

### i18n.js Improvements
- Added debug logging for troubleshooting language switching
- Added image alt text translation support (via `data-i18n-title` attribute)

### Translation File Status
| File | Lines | Status |
|------|-------|--------|
| Website en.json | 844 | Complete |
| Website af.json | 844 | Complete |
| Mobile en.json | 1032 | Complete |
| Mobile af.json | 1032 | Complete |

---

## Waiting For

### Afrikaans Devotional Content PDF
User will provide the Afrikaans PDF for the 40-day devotional content. The translation files only cover UI strings, NOT the devotional content in `/mobile/assets/content.json`.

---

## Remaining Tasks

| Task | Status | Notes |
|------|--------|-------|
| Afrikaans devotional content | WAITING | User to provide PDF |
| Mobile screens i18n integration | PENDING | Screens need `useTranslation()` hook |
| Music player on marketing page | PENDING | Doesn't play intro song |
| Deploy updated website | PENDING | After all changes verified |

---

## Key Translation Patterns

| English | Afrikaans |
|---------|-----------|
| Tea With God | Tee Saam God |
| devotional | dagstukkies |
| journey | reis |
| brain games | breinspeletjies |
| healing | **NEVER USE** (liability) |

---

## Server Info

| Server | IP | Domain | Web Root | API Port | PM2 Process |
|--------|----|----|----------|----------|-------------|
| TWG UAT | 154.66.196.12 | twg.cleva-ai.co.za | /var/www/twg | 3000 | **twg-api** |

---

## Admin Credentials

| Email | Role | PIN |
|-------|------|-----|
| superadmin@cleva-ai.co.za | Super Admin | 132872 |
| floris@cleva-ai.co.za | Super Admin | 132872 |
| lani@teawithgod.com | Admin (Owner) | 132872 |
| twg@cleva-ai.co.za | Admin | 132872 |

---

## Local Development

| Service | Port | URL |
|---------|------|-----|
| Backend | 3000 | http://localhost:3000 |
| Website | 8081 | http://localhost:8081 |

Start servers:
```bash
# Backend
cd /Users/florisolivier/TWGAPP/tea-with-God/backend && node src/server.js

# Website
cd /Users/florisolivier/TWGAPP/tea-with-God/website && npx serve -l 8081 .
```

---

## Deployment Commands

### Website Only (with translations)
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God && COPYFILE_DISABLE=1 tar --no-mac-metadata --exclude='._*' --exclude='.DS_Store' --exclude='__MACOSX' -czf /tmp/twg-website.tar.gz website

scp /tmp/twg-website.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && tar -xzf /tmp/twg-website.tar.gz --strip-components=1 && chown -R www-data:www-data . && chmod -R 755 . && rm /tmp/twg-website.tar.gz && echo 'Website deployed'"
```

---

## Test URLs

| What | URL |
|------|-----|
| Website (EN) | https://teawithgod.com |
| Website (AF) | Click "AF" button on any page |
| PWA | https://teawithgod.com/app |
| Admin | https://teawithgod.com/admin |
| B2B Portal | https://teawithgod.com/b2b |

---

## Consumer Pricing

| Tier | Price | Access |
|------|-------|--------|
| Book | R99 | eBook only |
| Journey | R149 | eBook + Full app (40 days) |
| Premium | R249 | Everything (music, brain games, voice notes) |

---

## Important Notes

- **The app does NOT heal anyone** - It's a devotional companion, educational content only
- **Admin login is PIN only:** 132872 (no password, permanent)
- **NEVER use "healing" in user-facing text** - Liability issue
- **Music titles stay in English** - Only exception to translation
- **Branding is "Tee Saam God"** - Not "Tee met God" or "Tee saam met God"

---

*"The potter formed it into another pot, shaping it as seemed best to him."* - Jeremiah 18:4
