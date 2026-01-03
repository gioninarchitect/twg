# Tea With God - Next Session Handoff

**Session Date:** January 3, 2026 (Evening)
**Project:** Tea With God - Mental Wellness App
**Branch:** `feature/brain-games-enhancements-dec27`

---

## SERVER CONFIGURATION

| Environment | Domain | Folder | Notes |
|-------------|--------|--------|-------|
| **Staging** | twg.cleva-ai.co.za | /var/www/twg | Testing |
| **Production** | teawithgod.com | /var/www/twg | Live |

Both domains point to the **same folder** with different nginx configs.

**Server IP:** 154.66.196.12

---

## What We Did This Session (Jan 3, 2026 - Evening)

### Brain Games 2.0 - COMPLETE

#### Phase 1: SessionMoodCheckIn Integration
- Added pre/post session mood check-ins to ALL 6 brain games
- Three gentle mood options: "Heavy today", "Getting by", "Lighter"
- Trauma-informed skip option for BodyScanRelease (can skip body regions)
- Compassionate messaging throughout

#### Phase 2: Major Enhancements
1. **Potter's Clay Theme** (replaced Kintsugi)
   - Biblical metaphor from Jeremiah 18:4
   - Journey stages: Gathering (1-10), Shaping (11-20), Refining (21-30), Becoming (31-40)
   - Updated BrainGamesHub with progress display

2. **ScripturePalace Spaced Repetition**
   - SM-2 algorithm for optimal review scheduling
   - Mastery levels: Planting → Sprouting → Growing → Blooming → Rooted
   - Visual indicators on room cards
   - "Due Review" badge for scriptures needing attention
   - Data persists to AsyncStorage

3. **BreatheWithGod Audio Guidance**
   - Toggle switch for haptic guidance on phase transitions
   - Visual indicator during session
   - Preferences persist to AsyncStorage

4. **Game Data Persistence Service**
   - New `src/services/gameDataService.ts`
   - Saves: scriptures, breathing prefs, gratitude history, game stats
   - Streak tracking across sessions

### Website Updates
- `science.html` - Updated journey phases to Potter's Clay terminology
- Removed "kintsugi complete" reference

### Deployed
- PWA to https://twg.cleva-ai.co.za/app
- Website updates to https://twg.cleva-ai.co.za

### Git Commit
```
9a10e20 Add Brain Games 2.0 enhancements
10 files changed, 1866 insertions(+), 198 deletions(-)
```

---

## Files Changed This Session

| File | Change |
|------|--------|
| `src/components/brainGames/MoodCheckIn.tsx` | SessionMoodCheckIn component + props fix |
| `src/components/brainGames/index.ts` | Exports for new components |
| `src/screens/brainGames/BrainGamesHub.tsx` | Potter's Clay theme, removed Kintsugi |
| `src/screens/brainGames/ScripturePalace.tsx` | Spaced repetition algorithm, persistence |
| `src/screens/brainGames/BreatheWithGod.tsx` | Audio guidance toggle, persistence |
| `src/screens/brainGames/BodyScanRelease.tsx` | Trauma-informed skip, mood check-ins |
| `src/screens/brainGames/GratitudeGarden.tsx` | SessionMoodCheckIn integration |
| `src/screens/brainGames/PatternPeace.tsx` | SessionMoodCheckIn integration |
| `src/screens/brainGames/ThoughtDetective.tsx` | SessionMoodCheckIn integration |
| `src/services/gameDataService.ts` | NEW - AsyncStorage persistence |
| `website/science.html` | Potter's Clay journey phases |

---

## Brain Games Technical Summary

### SessionMoodCheckIn Props
```typescript
interface SessionMoodCheckInProps {
  visible: boolean;
  type: 'pre' | 'post';
  gameName?: string;
  preMood?: SessionMoodLevel;
  onSelect: (mood: SessionMoodLevel) => void;
  onSkip: () => void;
}
```

### Spaced Repetition (ScripturePalace)
- Base intervals: 1, 3, 7, 14, 30 days per mastery level
- Ease factor: 1.3-2.5 (adjusts based on recall success)
- Mastery levels: 1-5 (Planting to Rooted)

### Data Persistence Keys
- `@twg:scripture_palace` - Scriptures array
- `@twg:breathing_prefs` - Pattern, cycles, audio toggle
- `@twg:gratitude_history` - Up to 40 entries
- `@twg:game_stats` - Last played, totals, streak

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

### Full Website Deploy
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/website && tar --exclude='._*' --exclude='.DS_Store' --exclude='*.txt' -czf /tmp/twg-website-deploy.tar.gz . && scp /tmp/twg-website-deploy.tar.gz root@154.66.196.12:/tmp/ && ssh root@154.66.196.12 "cd /var/www/twg && tar -xzf /tmp/twg-website-deploy.tar.gz && chown -R www-data:www-data /var/www/twg && chmod -R 755 /var/www/twg && rm /tmp/twg-website-deploy.tar.gz && echo 'Deployment complete'"
```

### PWA Only Deploy
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/mobile && npx expo export -p web && rm -rf ../website/app/* && cp -r dist/* ../website/app/
```
Then run full website deploy.

---

## Test URLs

| What | URL |
|------|-----|
| PWA (staging) | https://twg.cleva-ai.co.za/app |
| Science Page | https://twg.cleva-ai.co.za/science.html |
| Brain Games Hub | Access via PWA Dashboard |

---

## Next Steps

1. Test Brain Games 2.0 features on staging
2. Verify spaced repetition persists between sessions
3. Test mood check-ins across all games
4. User testing at Optima Psychiatric Institution (upcoming trial)

---

## Important Context

- **Theme changed from Kintsugi to Potter's Clay** (Jeremiah 18:4)
- **Brain Games unlock progressively:**
  - Day 1: Breathe with God, Gratitude Garden
  - Day 7: Scripture Palace
  - Day 15: Thought Detective
  - Day 22: Body Scan Release
  - Day 28: Pattern Peace
- Users can only see/access games they've unlocked
- Website and mobile app are separate git repos
- Both staging and production use same folder

---

*"The potter formed it into another pot, shaping it as seemed best to him."* - Jeremiah 18:4
