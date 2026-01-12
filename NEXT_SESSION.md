# Tea With God - Next Session Handoff

**Session Date:** January 5, 2026 (Session 5)
**Project:** Tea With God - Mental Wellness App
**Branch:** `feature/session-5-jan5-2026`
**Previous Branch:** `feature/brain-games-2.0-jan3`
**Status:** Near Launch Ready

---

## What We Did This Session (Jan 5, 2026 - Session 5)

### Profile Personalization

| Change | Details |
|--------|---------|
| User name in drawer | Profile drawer now shows user's name and email |
| Access badge | Shows "Full Access" or "Preview" badge below user info |
| Profile image persistence | Now syncs to Supabase database (not just local) |

### Settings Update

| Change | Details |
|--------|---------|
| About text updated | Now reads "TWG (Tea With God) - A 40 day Christian Devotional for Women" |
| Removed book reference | No longer mentions "Based on the book" |

### Header Alignment Fix

| Change | Details |
|--------|---------|
| Teacup logo | Removed marginTop, increased size to 28x28 |
| Font alignment | Added headerTitleStyle for consistent alignment |
| Header button | Added height constraint (36px) for better centering |

### Flipbook Animation Fix

| Change | Details |
|--------|---------|
| Backface visibility | Added to prevent content bleed during page flip |
| Overflow hidden | Applied to .stf__item, .stf__block, .stf__parent |
| Animation timing | Reduced from 800ms to 600ms for smoother feel |
| Container overflow | Added overflow:hidden to flipbook container |

### Supabase Database

| Change | Details |
|--------|---------|
| user_settings table | Added for profile image cloud sync |
| profile_image_base64 | Column for storing profile images |
| RLS policies | Users can only access own settings |

### Files Changed This Session

| File | Change |
|------|--------|
| `mobile/src/screens/DashboardScreen.tsx` | User name display, profile image Supabase sync |
| `mobile/src/components/SettingsModal.tsx` | Updated about text (By Lani Butler) |
| `mobile/App.tsx` | Header alignment fixes |
| `mobile/supabase/add-user-settings.sql` | New migration for user_settings table |
| `website/flipbook/index.html` | Animation fixes, CSS improvements |
| `website/fig3-whitelabel-platform.html` | Added architecture docs, PWA install features |
| `ARCHITECTURE_ANALYSIS.md` | Comprehensive technical documentation |

---

## SERVER CONFIGURATION

| Environment | Domain | Folder | Notes |
|-------------|--------|--------|-------|
| **Staging** | twg.cleva-ai.co.za | /var/www/twg | Testing |
| **Production** | teawithgod.com | /var/www/twg | Live |

**Server IP:** 154.66.196.12

---

## What We Did This Session (Jan 5, 2026 - Session 4)

### Dashboard Restructure

| Change | Details |
|--------|---------|
| Intro audio added | "Restore My Soul" now plays on dashboard before Day 1 |
| Stats moved to drawer | 40-Day Architecture + stats now in profile side menu |
| Timeline moved up | "Your Journey" accordion immediately visible, less scrolling |
| Profile drawer | Slide-out menu with stats, milestones, quick actions |

### Profile Image Upload

| Feature | Details |
|---------|---------|
| Image picker | expo-image-picker (free, uses native gallery) |
| Storage | AsyncStorage (stays on device) |
| UI | Tap avatar to change, camera badge indicator |

### Audio Updates

| Day | Title | File |
|-----|-------|------|
| 33 | "You Are Not Shaken" | day-33.mp3 |
| 34 | "Still Here, Jesus" | day-34.mp3 |

**Artist Credit:** All audio now shows "Prophetizer & SonicGrace Music" in player

### UI Fixes

| Fix | Details |
|-----|---------|
| Header icon | Gear replaced with teacup logo |
| Header alignment | Teacup aligned with "Tea With God" text |
| Responsive title | "Your Healing Journey" scales on small screens |
| Profile button | Changed to menu icon, more prominent |
| Audio player subtitle | Compact player now shows artist credit |

### Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| ARCHITECTURE_ANALYSIS.md | Root folder | Technical analysis (markdown) |
| architecture-analysis.html | website/ (local only) | Branded HTML with accordions |

---

## Pending Deployments

### 1. Audio Files (Days 33-34)
```bash
scp /tmp/twg-audio-33-34.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg/backend/protected/audio && tar -xzf /tmp/twg-audio-33-34.tar.gz && chmod 644 day-33.mp3 day-34.mp3 && rm /tmp/twg-audio-33-34.tar.gz && echo 'Audio deployed'"
```

### 2. PWA Update
```bash
scp /tmp/twg-pwa.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && rm -rf app && tar -xzf /tmp/twg-pwa.tar.gz && chown -R www-data:www-data app && chmod -R 755 app && rm /tmp/twg-pwa.tar.gz && echo 'PWA deployed'"
```

---

## Audio Status (All 40 Days)

| Days | Status | Notes |
|------|--------|-------|
| Intro | Ready | "Restore My Soul" |
| 1-32 | Ready | Deployed previously |
| 33-34 | Ready | Pending deploy (in tarball) |
| 35-40 | Ready | Deployed this session |

**All 40 days + intro now have audio!**

---

## Files Changed This Session

| File | Change |
|------|--------|
| `mobile/src/screens/DashboardScreen.tsx` | Drawer, intro audio, profile image, stats moved |
| `mobile/src/components/AudioPlayer.tsx` | Added subtitle to compact variant |
| `mobile/src/services/audioService.ts` | Days 33-34 titles, artist credits |
| `mobile/App.tsx` | Teacup logo in header (replaced gear) |
| `backend/protected/audio/` | Added day-33.mp3, day-34.mp3 |
| `ARCHITECTURE_ANALYSIS.md` | New - technical documentation |
| `website/architecture-analysis.html` | New - branded HTML doc (internal) |

---

## Current App Features

| Feature | Status |
|---------|--------|
| 40-day devotionals | Complete |
| 6 Brain Games | Complete |
| Audio for all 40 days | Complete |
| Journal with encryption | Complete |
| Guest preview (3 days) | Complete |
| Access code redemption | Complete |
| Profile image upload | Complete |
| Profile drawer with stats | Complete |
| B2B organization codes | Complete |
| Admin dashboard | Complete |
| Flipbook integration | Complete |

---

## Pre-Launch Checklist

| Task | Status |
|------|--------|
| All audio files deployed | Pending (2 files) |
| PWA with latest features | Pending deploy |
| Test all 40 days playback | To verify |
| Test profile image upload | To verify |
| Test on multiple devices | To do |
| Production domain ready | teawithgod.com configured |

---

## Deployment Commands Reference

### Full Website Deploy
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/website && tar --exclude='._*' --exclude='.DS_Store' -czf /tmp/twg-website.tar.gz . && scp /tmp/twg-website.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && rm -rf app && tar -xzf /tmp/twg-website.tar.gz && chown -R www-data:www-data . && chmod -R 755 . && rm /tmp/twg-website.tar.gz && echo 'Deployed'"
```

### PWA Only Deploy
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/mobile && npx expo export -p web && rm -rf ../website/app && cp -r dist ../website/app && cd .. && tar --exclude='._*' --exclude='.DS_Store' -czf /tmp/twg-pwa.tar.gz -C website app && scp /tmp/twg-pwa.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && rm -rf app && tar -xzf /tmp/twg-pwa.tar.gz && chown -R www-data:www-data app && chmod -R 755 app && rm /tmp/twg-pwa.tar.gz && echo 'PWA deployed'"
```

### Backend Deploy
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/backend && tar --exclude='*.db' --exclude='node_modules' --exclude='.git' --exclude='.env' -czf /tmp/twg-backend.tar.gz . && scp /tmp/twg-backend.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg/backend && tar -xzf /tmp/twg-backend.tar.gz && npm install --production && pm2 restart twg-api && rm /tmp/twg-backend.tar.gz && echo 'Backend deployed'"
```

---

## Test URLs

| What | URL |
|------|-----|
| PWA (staging) | https://twg.cleva-ai.co.za/app |
| Flipbook | https://twg.cleva-ai.co.za/flipbook |
| Website (staging) | https://twg.cleva-ai.co.za |
| Admin Dashboard | https://twg.cleva-ai.co.za/admin |
| B2B Portal | https://twg.cleva-ai.co.za/b2b |

---

## Next Steps for Launch

1. Deploy pending audio + PWA
2. Full device testing (iOS Safari, Android Chrome, various screen sizes)
3. Test all 40 audio tracks play correctly
4. Verify profile image upload works
5. Final review of checkout flow
6. Switch to production domain (teawithgod.com)
7. Launch!

---

## Important Context

- **Theme:** Potter's Clay (Jeremiah 18:4)
- **mobile/ folder is gitignored** - only built PWA is committed
- **Audio served from:** backend/protected/audio/
- **Artist credit:** Prophetizer & SonicGrace Music
- **Architecture docs:** ARCHITECTURE_ANALYSIS.md (internal use)

---

## Session Summary

Session 5 accomplishments:
- Profile drawer now shows user name/email with access badge
- Profile images persist to Supabase (cloud sync across devices)
- Settings about text updated: "By Lani Butler"
- Header teacup/font alignment fixed
- Flipbook animation fixes for desktop
- Fig3 white-label document enhanced with full architecture documentation
- PWA install prompt features documented

The app is feature-complete and near launch-ready.

---

*"The potter formed it into another pot, shaping it as seemed best to him."* - Jeremiah 18:4
