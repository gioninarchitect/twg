# Tea With God - Next Session Handoff

**Session Date:** December 27, 2025 (Updated)
**Project:** Tea With God - Mental Wellness App

---

## What We Accomplished This Session

### 1. TypeScript Build Fixes (COMPLETE)
Fixed 25+ TypeScript errors across the mobile app:
- Made `onClose` prop optional in all 5 brain game screens with navigation fallback
- Fixed `AccessContext.tsx` guestStartDate persistence
- Fixed `BodyScanRelease.tsx` style types and TensionEntry format
- Fixed `GameAnimations.tsx` Animated.Value access pattern
- Fixed `PatternPeace.tsx` missing exports and dispatch calls
- Fixed `JournalInput.tsx` expo-file-system legacy import
- Fixed `DisclaimerModal` prop name (message -> content)

### 2. PWA Build & Deployment (COMPLETE)
- Added PWA configuration to `app.json`
- Built with `npx expo export -p web`
- Created `manifest.json` and `sw.js` service worker
- Deployed to https://twg.cleva-ai.co.za/app

### 3. APK Build & Upload (COMPLETE)
- Built APK via EAS: `eas build -p android --profile preview`
- APK: TeaWithGod-v1.0.1.apk (87MB)
- Uploaded to: https://twg.cleva-ai.co.za/TeaWithGod-v1.0.1.apk

### 4. Supabase Database Integration (COMPLETE)
Created tables in Supabase (SQL in `backend/supabase-admin-setup.sql`):
- `social_posts` - Content calendar with platforms array, themes
- `contacts` - CRM with status tracking
- `crm_activities` - Activity log
- `invoices` - Invoice records
- `invoice_line_items` - Line items with foreign key

All tables have:
- RLS enabled with open policies for admin access
- Triggers for `updated_at` timestamps
- Proper indexes

### 5. Admin Dashboard Supabase Integration (COMPLETE)
Updated `/website/admin/index.html`:
- Added Supabase JS client via CDN
- All CRUD operations now persist to Supabase
- Fallback to localStorage if Supabase fails
- Auto-loads data on login and page refresh
- Deployed to https://twg.cleva-ai.co.za/admin

### 6. Git Repos Organized
- **Mobile repo:** `feature/brain-games-enhancements-dec27` (engagement components, TS fixes, PWA)
- **Parent repo:** `feature/admin-supabase-dec27` (website, backend, docs)
- Mobile excluded from parent repo (separate git history)

---

## Live Deployments

| Asset | URL |
|-------|-----|
| Marketing Site | https://twg.cleva-ai.co.za |
| PWA | https://twg.cleva-ai.co.za/app |
| APK Download | https://twg.cleva-ai.co.za/TeaWithGod-v1.0.1.apk |
| Admin Dashboard | https://twg.cleva-ai.co.za/admin |
| B2B Portal | https://twg.cleva-ai.co.za/b2b |

---

## Priority for Next Session

### PRIORITY 1: Book Content Re-Import
User will provide:
- **New book content as TEXT FILE** (not Word doc)
- Previous Word doc had character encoding issues
- Must go through character checking workflow

### PRIORITY 2: Test Supabase Integration
- Verify admin dashboard data persists across sessions
- Test all CRUD operations (social posts, contacts, invoices)
- Check data appears in Supabase dashboard

### PRIORITY 3: Social Media Strategy
- Define all platforms (Instagram, Facebook, TikTok, YouTube, LinkedIn, X/Twitter)
- **Lonnie's LinkedIn** needs setup for credibility
- Populate calendar with strategic posts using 6 weekly themes

### PRIORITY 4: App Store Preparation
- APK ready for internal testing
- Prepare Play Store listing assets
- iOS build when ready

---

## Important File Locations

### Mobile App
```
/Users/florisolivier/TWGAPP/tea-with-God/mobile/
├── src/
│   ├── screens/brainGames/    (game screens - fixed onClose props)
│   ├── components/brainGames/ (shared components + new engagement system)
│   └── context/AccessContext.tsx (fixed guestStartDate)
├── app.json                   (PWA config added)
└── dist/                      (PWA build output)
```

### Website/Admin
```
/Users/florisolivier/TWGAPP/tea-with-God/website/
├── admin/index.html           (Supabase integrated)
├── b2b/index.html
└── images/teacup.png
```

### Backend
```
/Users/florisolivier/TWGAPP/tea-with-God/backend/
├── src/server.js
├── src/supabase.js
├── supabase-admin-setup.sql   (run this in Supabase SQL editor)
└── .env                       (Supabase keys)
```

---

## Supabase Config

**Project URL:** https://hqzyzioyospxwfzrdwkj.supabase.co

Tables created:
- social_posts
- contacts
- crm_activities
- invoices
- invoice_line_items

---

## Server Info

| Server | IP | Domain | Web Root |
|--------|----|----|----------|
| TWG UAT | 154.66.196.12 | twg.cleva-ai.co.za | /var/www/twg |

---

## Access Codes (For Testing)
- `TEAWITHGOD2025` - Full access
- `HEALING40DAYS` - Full access
- `KINTSUGI2025` - Full access
- `BETAREVIEW` - Full access

---

## Next Session Checklist

- [ ] Read this document first
- [ ] Test admin dashboard Supabase persistence
- [ ] User may provide book content as TEXT file
- [ ] Continue with social media content planning
- [ ] Ask user what the priority is if unclear

---

*"She was broken, but beautiful. Like pottery mended with gold."* - Kintsugi proverb
