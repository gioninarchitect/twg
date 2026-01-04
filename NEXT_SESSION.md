# Tea With God - Next Session Handoff

**Session Date:** January 4, 2026
**Project:** Tea With God - Mental Wellness App
**Branch:** `feature/brain-games-2.0-jan3`

---

## SERVER CONFIGURATION

| Environment | Domain | Folder | Notes |
|-------------|--------|--------|-------|
| **Staging** | twg.cleva-ai.co.za | /var/www/twg | Testing |
| **Production** | teawithgod.com | /var/www/twg | Live |

Both domains point to the **same folder** with different nginx configs.

**Server IP:** 154.66.196.12

---

## What We Did This Session (Jan 4, 2026)

### Brain Games UI v2.0 - Premium Overhaul (COMPLETE)

All 5 brain games (excluding PatternPeace which was already done) received major UI overhauls:

| Game | Key Improvements |
|------|-----------------|
| **BreatheWithGod** | Immersive sanctuary with floating particles, concentric animated rings, premium pattern cards with icons/benefits, cycle progress dots |
| **BodyScanRelease** | Glowing body silhouette with region markers, pulsing animations, energy release particles, visual tension arc with glowing orbs |
| **ThoughtDetective** | Detective investigation theme, 3x3 ANT card grid with icons, animated magnifying glass, journey board visualization |
| **GratitudeGarden** | Immersive garden scene with animated sky, floating clouds, butterflies, premium flowers that grow and sway |
| **ScripturePalace** | Visual palace with room cards, pulsing glow for review-due rooms, pre-populated scripture picker from devotional content |

**All games now have:**
- Solid opaque backgrounds (`#1a1a1a`) - no more transparency issues
- Premium animations with React Native Animated API
- Icons from Ionicons for visual appeal
- LinearGradient backgrounds
- Haptic feedback on interactions
- Responsive layouts

### Deployed
- PWA to https://twg.cleva-ai.co.za/app

### Git Commit
```
28f1848 Add PWA build with premium brain games UI v2.0
```

---

## Files Changed This Session

| File | Change |
|------|--------|
| `mobile/src/screens/brainGames/BreatheWithGod.tsx` | Premium UI v2.0 - sanctuary theme |
| `mobile/src/screens/brainGames/BodyScanRelease.tsx` | Premium UI v2.0 - glowing body |
| `mobile/src/screens/brainGames/ThoughtDetective.tsx` | Premium UI v2.0 - detective theme |
| `mobile/src/screens/brainGames/GratitudeGarden.tsx` | Premium UI v2.0 - garden scene |
| `mobile/src/screens/brainGames/ScripturePalace.tsx` | Premium UI v2.0 - palace rooms |
| `website/app/*` | Built PWA with all changes |

**Note:** `mobile/` folder is in `.gitignore`. Only the built PWA (`website/app/`) is committed.

---

## Server Info

| Item | Value |
|------|-------|
| Server IP | 154.66.196.12 |
| Staging Domain | twg.cleva-ai.co.za |
| Production Domain | teawithgod.com |
| Frontend Path | /var/www/twg |
| PWA Path | /var/www/twg/app |
| Flipbook Path | /var/www/twg/flipbook |
| Backend Path | /var/www/twg/backend |
| PM2 Process | twg-api |
| Backend Port | 3000 |

---

## Deployment Commands

### Build and Deploy PWA
```bash
# Step 1: Build PWA
cd /Users/florisolivier/TWGAPP/tea-with-God/mobile && npx expo export -p web

# Step 2: Copy to website folder
rm -rf ../website/app/* && cp -r dist/* ../website/app/

# Step 3: Deploy to server
cd /Users/florisolivier/TWGAPP/tea-with-God && tar --exclude='._*' --exclude='.DS_Store' -czf /tmp/twg-pwa.tar.gz -C website app && scp /tmp/twg-pwa.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && rm -rf app && tar -xzf /tmp/twg-pwa.tar.gz && chown -R www-data:www-data app && chmod -R 755 app && rm /tmp/twg-pwa.tar.gz && echo 'PWA deployed successfully'"
```

### Full Website Deploy
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/website && tar --exclude='._*' --exclude='.DS_Store' --exclude='*.txt' -czf /tmp/twg-website-deploy.tar.gz . && scp /tmp/twg-website-deploy.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && tar -xzf /tmp/twg-website-deploy.tar.gz && chown -R www-data:www-data /var/www/twg && chmod -R 755 /var/www/twg && rm /tmp/twg-website-deploy.tar.gz && echo 'Deployment complete'"
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
| Website (staging) | https://twg.cleva-ai.co.za |
| Admin Dashboard | https://twg.cleva-ai.co.za/admin |
| B2B Portal | https://twg.cleva-ai.co.za/b2b |

---

## Brain Games Technical Summary

### Unlock Schedule
- Day 1: Breathe with God, Gratitude Garden
- Day 7: Scripture Palace
- Day 15: Thought Detective
- Day 22: Body Scan Release
- Day 28: Pattern Peace

### Data Persistence Keys (AsyncStorage)
- `@twg:scripture_palace` - Scriptures array with spaced repetition data
- `@twg:breathing_prefs` - Pattern, cycles, audio toggle
- `@twg:gratitude_history` - Up to 40 entries
- `@twg:game_stats` - Last played, totals, streak

---

## Next Steps

1. Test all brain games UI on staging
2. Continue with any remaining features
3. Prepare for production deployment when ready

---

## Important Context

- **Theme:** Potter's Clay (Jeremiah 18:4)
- **mobile/ folder is gitignored** - only built PWA is committed
- Website and mobile app source are in same repo
- Both staging and production use same server folder

---

*"The potter formed it into another pot, shaping it as seemed best to him."* - Jeremiah 18:4
