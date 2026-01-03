# Tea With God - Complete AI Handoff Document

**Created:** January 3, 2026
**Purpose:** Full context transfer for any AI to continue development
**Project Owner:** Floris Olivier

---

## CRITICAL: READ THIS FIRST

You are taking over development of **Tea With God**, a 40-day mental wellness app for women going through emotional healing. The app combines evidence-based psychology (CBT, Polyvagal Theory, etc.) with Christian spirituality.

**IMPORTANT THEME CHANGE:** The app previously used a "Kintsugi" (Japanese gold-repaired pottery) metaphor. This has been **completely replaced** with "Potter's Clay" from Jeremiah 18:4. Do NOT reference Kintsugi anywhere.

---

## 1. PROJECT OVERVIEW

### What Is Tea With God?
- 40-day devotional journey app for women
- Target: Women healing from trauma, relationships, grief
- Platform: React Native (Expo) PWA
- Market: Launching in South Africa, designed for global expansion

### Core Features
1. **40 Daily Devotionals** - Scripture, reflection, prayer
2. **6 Brain Games** - Evidence-based therapeutic exercises
3. **Journal** - Private reflection space (never leaves device)
4. **Flipbook** - Digital version of physical book

### Business Model
- Direct sales: R99-R249 (eBook to Premium)
- B2B: Organizations buy access codes for members
- White-label: License platform to other authors (Fig3)

---

## 2. TECHNICAL ARCHITECTURE

### Repository Structure
```
/Users/florisolivier/TWGAPP/tea-with-God/
├── mobile/                    # React Native Expo app
│   ├── src/
│   │   ├── components/
│   │   │   └── brainGames/    # Shared game components
│   │   ├── screens/
│   │   │   └── brainGames/    # 6 brain game screens
│   │   ├── services/          # API, audio, persistence
│   │   ├── context/           # React contexts
│   │   └── worldModel/        # AI personalization engine
│   ├── assets/
│   └── dist/                  # PWA build output
├── website/                   # Marketing site (separate repo)
│   ├── app/                   # PWA copied here for deploy
│   ├── flipbook/              # Digital book viewer
│   └── *.html                 # Marketing pages
├── backend/                   # Node.js API
├── CLAUDE.md                  # Project instructions
└── NEXT_SESSION.md            # Session handoff
```

### Tech Stack
| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo |
| Web | Expo Web (PWA) |
| Backend | Node.js + Express |
| Database | SQLite (local), Supabase (cloud sync) |
| Hosting | Ubuntu server, nginx, PM2 |
| Auth | Access codes (no accounts required) |

### Key Dependencies
- `@react-native-async-storage/async-storage` - Local persistence
- `expo-av` - Audio playback
- `expo-haptics` - Tactile feedback
- `@supabase/supabase-js` - Optional cloud sync

---

## 3. THE 6 BRAIN GAMES

Each game is based on peer-reviewed psychological research:

| Game | File | Theory | Unlocks |
|------|------|--------|---------|
| Breathe with God | `BreatheWithGod.tsx` | Polyvagal (Porges) | Day 1 |
| Gratitude Garden | `GratitudeGarden.tsx` | Positive Psychology | Day 1 |
| Scripture Palace | `ScripturePalace.tsx` | Method of Loci | Day 7 |
| Thought Detective | `ThoughtDetective.tsx` | CBT (Beck) | Day 15 |
| Body Scan Release | `BodyScanRelease.tsx` | Somatic (van der Kolk) | Day 22 |
| Pattern Peace | `PatternPeace.tsx` | N-Back Training | Day 28 |

**IMPORTANT:** Games unlock progressively. Users can ONLY see/access games they've unlocked based on their current day in the journey. The BrainGamesHub checks the user's day and only displays unlocked games.

### Recent Enhancements (Brain Games 2.0)

#### SessionMoodCheckIn
All games now have pre/post mood check-ins:
```typescript
<SessionMoodCheckIn
  visible={showPreMoodCheck}
  type="pre"
  onSelect={(mood) => { setPreMood(mood); setShowPreMoodCheck(false); }}
  onSkip={() => setShowPreMoodCheck(false)}
/>
```

Mood options: `'struggling' | 'okay' | 'lighter'`

#### Spaced Repetition (ScripturePalace)
Uses SM-2 algorithm:
- Mastery levels: 1-5 (Planting, Sprouting, Growing, Blooming, Rooted)
- Ease factor: 1.3-2.5
- Review intervals: 1, 3, 7, 14, 30 days

#### Data Persistence
`src/services/gameDataService.ts` handles AsyncStorage:
```typescript
// Storage keys
'@twg:scripture_palace'    // Scriptures array
'@twg:breathing_prefs'     // Pattern, cycles, audio
'@twg:gratitude_history'   // Last 40 entries
'@twg:game_stats'          // Streaks, totals
```

---

## 4. POTTER'S CLAY THEME

**Scripture:** Jeremiah 18:4
> "The pot was marred in his hands; so the potter formed it into another pot, shaping it as seemed best to him."

### Journey Stages
| Stage | Days | Meaning |
|-------|------|---------|
| Gathering | 1-10 | The Potter gathers the clay |
| Shaping | 11-20 | The Potter begins to shape |
| Refining | 21-30 | The Potter refines through fire |
| Becoming | 31-40 | The Potter completes His work |

### Implementation
- `BrainGamesHub.tsx` displays current stage based on day
- `science.html` explains the journey structure
- Progress bar shows position in 40-day journey

---

## 5. SERVER INFRASTRUCTURE

### Environments
| Environment | Domain | IP |
|-------------|--------|-----|
| Staging | twg.cleva-ai.co.za | 154.66.196.12 |
| Production | teawithgod.com | 154.66.196.12 |

**Both point to same folder:** `/var/www/twg`

### Server Paths
```
/var/www/twg/
├── app/          # PWA (React Native Web)
├── flipbook/     # Digital book viewer
├── backend/      # Node.js API
├── images/       # Static assets
└── *.html        # Marketing pages
```

### PM2 Process
```bash
pm2 show twg-api    # Check status
pm2 restart twg-api # Restart backend
pm2 logs twg-api    # View logs
```

### Deployment Commands

**Full Website Deploy:**
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/website && \
tar --exclude='._*' --exclude='.DS_Store' --exclude='*.txt' -czf /tmp/twg-website-deploy.tar.gz . && \
scp /tmp/twg-website-deploy.tar.gz root@154.66.196.12:/tmp/ && \
ssh root@154.66.196.12 "cd /var/www/twg && tar -xzf /tmp/twg-website-deploy.tar.gz && chown -R www-data:www-data /var/www/twg && chmod -R 755 /var/www/twg && rm /tmp/twg-website-deploy.tar.gz && echo 'Deployment complete'"
```

**Build PWA:**
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/mobile
npx expo export -p web
cp -r dist/* ../website/app/
```

---

## 6. KEY FILES TO KNOW

### Configuration
- `mobile/CLAUDE.md` - Project instructions (READ THIS)
- `mobile/app.json` - Expo config
- `mobile/src/theme/colors.ts` - Design system
- `mobile/src/theme/brainGames.ts` - Game-specific theming

### Brain Games Core
- `src/components/brainGames/index.ts` - All exports
- `src/components/brainGames/MoodCheckIn.tsx` - Mood check-in components
- `src/components/brainGames/useGameSession.ts` - Shared hooks
- `src/components/brainGames/GameContainer.tsx` - Layout wrapper

### Screens
- `src/screens/brainGames/BrainGamesHub.tsx` - Game selection hub
- `src/screens/DashboardScreen.tsx` - Main app dashboard

### Services
- `src/services/gameDataService.ts` - AsyncStorage persistence
- `src/services/api.ts` - Backend API calls
- `src/services/supabase.ts` - Cloud sync (optional)

---

## 7. DESIGN SYSTEM

### Colors (Dark Theme)
```typescript
const COLORS = {
  background: '#0D0D0D',
  backgroundCard: 'rgba(255, 255, 255, 0.03)',
  gold: '#D4AF37',
  goldLight: '#F4E4BC',
  textPrimary: '#FAFAFA',
  textSecondary: 'rgba(250, 250, 250, 0.6)',
  sage: '#8FBC8F',
  dustyBlue: '#8BA5B5',
  warm: '#E8C39E',
};
```

### Typography
```typescript
const TYPOGRAPHY = {
  display: 'Playfair Display',  // Headings
  ui: 'DM Sans',                // Body/UI
  devotional: 'Lora',           // Scripture/quotes
};
```

### Accessibility Rules
- Minimum contrast 4.5:1 for text
- Touch targets minimum 44x44 points
- No color as sole indicator

---

## 8. COMMON TASKS

### Adding a New Brain Game Feature
1. Edit the game file in `src/screens/brainGames/`
2. If adding shared component, put in `src/components/brainGames/`
3. Export from `src/components/brainGames/index.ts`
4. Run `npx tsc --noEmit` to check types
5. Build PWA: `npx expo export -p web`
6. Deploy

### Updating the Science Page
1. Edit `website/science.html`
2. Deploy website (see deployment commands)

### Fixing TypeScript Errors
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/mobile
npx tsc --noEmit
```

### Checking Git Status
```bash
git status
git log --oneline -10
```

---

## 9. RULES & CONSTRAINTS

### From CLAUDE.md (MUST FOLLOW)
1. **No emojis** - Use Lucide icons from CDN
2. **No assumptions** - Verify everything
3. **No Kintsugi** - Potter's Clay theme only
4. **No heredocs in SSH** - They break the terminal
5. **Test before deploy** - Run TypeScript check
6. **Backup .env before backend deploy** - Server has production secrets

### Mental Health Disclaimers
Every brain game MUST display:
- "This is an educational tool, not therapy"
- "Not a substitute for professional help"
- Crisis resources must be accessible

### Privacy
- Journal content NEVER leaves device
- No third-party analytics
- User can export/delete all data

---

## 10. UPCOMING WORK

### Immediate Next Steps
1. Test Brain Games 2.0 on staging
2. User testing at Optima Psychiatric Institution
3. Production deployment when approved

### Future Features (Not Started)
- Voice-guided breathing (requires audio recordings)
- Gratitude streaks visualization
- Multi-language support
- Offline audio caching

---

## 11. CONTACTS & RESOURCES

### Key URLs
| Resource | URL |
|----------|-----|
| Staging | https://twg.cleva-ai.co.za |
| Production | https://teawithgod.com |
| PWA | https://twg.cleva-ai.co.za/app |
| Science Page | https://twg.cleva-ai.co.za/science.html |

### Access Codes (Testing)
- `REVIEW` - Full access for reviewers
- `OWNER2025` - Owner access
- `BETAREVIEW` - Beta testers

---

## 12. QUICK REFERENCE

### Start Development
```bash
cd /Users/florisolivier/TWGAPP/tea-with-God/mobile
npx expo start --web
```

### Build & Deploy
```bash
# Build
npx expo export -p web

# Copy to website
cp -r dist/* ../website/app/

# Deploy (user runs this)
# See deployment commands in Section 5
```

### Git Workflow
```bash
git status
git add <files>
git commit -m "Description"
# Branch: feature/brain-games-enhancements-dec27
```

---

## 13. FINAL NOTES

This app is designed to help women heal. Every feature should be:
- **Gentle** - Trauma-informed, never pushy
- **Biblical** - Grounded in scripture (Potter's Clay theme)
- **Evidence-based** - Real psychology, not pseudo-science
- **Private** - User data stays on device

The target users may be in vulnerable states. Always err on the side of compassion.

---

*"The potter formed it into another pot, shaping it as seemed best to him."* - Jeremiah 18:4

---

**Document Version:** 1.0
**Last Updated:** January 3, 2026
**Author:** Claude (AI Assistant)
