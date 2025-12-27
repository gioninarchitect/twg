# Tea With God - Project Context

## Vision

Tea With God is a 40-day healing companion app targeted at women going through emotional healing, relationship recovery, and spiritual growth. While launching in **South Africa**, the architecture is designed for **global localization** to reach women worldwide.

## Core Mission

> "To provide evidence-based, spiritually-grounded healing tools to women everywhere, regardless of location, language, or economic status."

## Global Localization Requirements

### Architecture Principles

1. **Offline-First**: Works without internet (critical for emerging markets)
2. **Data Privacy**: All personal data stays on-device (GDPR/POPIA compliant)
3. **Low Data Usage**: Minimal bandwidth for regions with expensive mobile data
4. **Multi-Language Ready**: All strings externalized for translation
5. **Cultural Sensitivity**: Content adaptable to different cultural contexts

### Localization Layers

```
┌─────────────────────────────────────────┐
│         CONTENT LAYER                   │
│  - 40 devotionals (translatable)        │
│  - Psychology modules (localized)       │
│  - Scripture (multiple translations)    │
│  - Crisis resources (per-country)       │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         UI LAYER                        │
│  - All strings in i18n files            │
│  - RTL support ready                    │
│  - Currency formatting                  │
│  - Date/time localization               │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         CRISIS RESOURCES                │
│  - Country-specific hotlines            │
│  - Local emergency numbers              │
│  - Regional mental health resources     │
│  - Timezone-aware support hours         │
└─────────────────────────────────────────┘
```

### Target Expansion Regions (Phased)

| Phase | Region | Languages | Notes |
|-------|--------|-----------|-------|
| 1 | South Africa | English, Afrikaans, Zulu | Launch market |
| 2 | Sub-Saharan Africa | Swahili, French, Portuguese | High need, mobile-first |
| 3 | Latin America | Spanish, Portuguese | Strong faith communities |
| 4 | Southeast Asia | Filipino, Indonesian | Growing market |
| 5 | Global | Hindi, Arabic, Mandarin | Scale phase |

### Crisis Resources Template

Every region MUST have:
```typescript
interface RegionalCrisis {
  countryCode: string;
  emergencyNumber: string; // 911, 10111, etc.
  mentalHealthHotlines: Array<{
    name: string;
    number: string;
    hours: string; // "24/7" or specific hours
    languages: string[];
  }>;
  textCrisisLines?: string[];
  onlineResources: string[];
}
```

## Technical Standards

### Code Architecture
- **React Native + Expo** for cross-platform
- **TypeScript** for type safety
- **Supabase** for auth and cloud sync (optional)
- **AsyncStorage** for local-first data
- **World Model** for intelligent personalization

### Disclaimer Requirements

**CRITICAL**: Every feature that touches mental health MUST display appropriate disclaimers:

1. **App-level disclaimer** on first launch (requires acknowledgment)
2. **Crisis section disclaimer** before showing resources
3. **Brain games disclaimer** clarifying educational nature
4. **Journal analysis disclaimer** explaining privacy

### Privacy by Design

- Journal content: **NEVER** leaves device
- Analysis results: Only anonymized metrics stored
- Cloud sync: User-initiated, fully optional
- No tracking: Zero third-party analytics
- Data export: User can export all their data
- Data deletion: One-button full delete

## DEPLOYMENT RULES - ZERO TOLERANCE (Dec 27, 2025)

### BEFORE ANY DEPLOYMENT

1. **Check server Node version FIRST**
   ```bash
   ssh root@SERVER "node -v"
   ```
   Then ensure ALL package.json dependencies are compatible with that version.

2. **Use stable package versions** - NEVER use bleeding-edge versions like `^2.89.0`. Pin to known working versions:
   - better-sqlite3: 9.4.3 (for Node 18)
   - @supabase/supabase-js: 2.38.0 (for Node 18)
   - express: 4.18.2 (stable)

3. **Test locally with same Node version** before pushing to server

4. **Verify tarball extraction works**
   ```bash
   mkdir /tmp/test && cd /tmp/test && tar -xzf /path/to/tarball.tar.gz && ls -la
   ```

### COMMAND FORMAT RULES

1. **NEVER use heredocs (EOF)** - They break the user's terminal. Create files locally and SCP them.

2. **One-liner commands are OK** - User prefers them, but they MUST be 100% correct:
   - Test the logic mentally before sending
   - Never assume files exist - verify first
   - SCP files first in separate command, THEN run SSH command
   ```bash
   # Step 1: Upload
   scp file1 file2 file3 root@server:/tmp/

   # Step 2: Execute (one-liner OK here)
   ssh root@server "cd /path && command1 && command2 && command3"
   ```

3. **Use `--strip-components=1`** when extracting tarballs to avoid nested folders

4. **Use `rm -rf` not `rmdir`** - Hidden files like .DS_Store will cause rmdir to fail

5. **Always set permissions after extraction**:
   ```bash
   chown -R www-data:www-data /var/www/site && chmod -R 755 /var/www/site
   ```

### PM2 SAFETY

1. **NEVER use `pm2 restart all` or `pm2 delete all`** - Other apps run on shared servers
2. **Only use named operations**: `pm2 start --name twg-api`, `pm2 delete twg-api`
3. **Verify existing apps first**: `pm2 list`

### FILE UPLOAD RULES

1. **Upload ALL config files in one SCP command** before running SSH commands
2. **Config files go to /tmp/** then get moved - don't upload directly to destination
3. **Verify files exist** before running commands that depend on them

### NGINX RULES

1. **Create config locally**, SCP to `/etc/nginx/sites-available/`
2. **Symlink**: `ln -sf /etc/nginx/sites-available/name /etc/nginx/sites-enabled/name`
3. **Always test**: `nginx -t` before `systemctl reload nginx`
4. **SSL after config**: Run certbot only after nginx config is working

### SERVER INFO

| Server | IP | Domain | Web Root | API Port |
|--------|----|----|----------|----------|
| TWG UAT | 154.66.196.12 | twg.cleva-ai.co.za | /var/www/twg | 3000 |

### MISTAKES THAT WILL NOT BE REPEATED

1. Using heredocs (EOF) - breaks terminal
2. Combining SCP+SSH causing double password prompts
3. Using `mv folder/* .` with hidden files present
4. Not checking Node version compatibility
5. Using packages that require compilation without build tools
6. Uploading files then losing them before use
7. Not setting www-data permissions
8. Too many steps when user asks for one command
9. Not verifying tarball extraction
10. Not testing locally first

---

## Development Guidelines

### ACCESSIBILITY STANDARD (MANDATORY)

**Font Accessibility on Dark/Light Mode - Zero Tolerance Rule**

Every text element MUST have sufficient contrast against its background:

| Theme | Text Color | Minimum Contrast | Use Case |
|-------|------------|------------------|----------|
| Dark | `#FAFAFA` (textPrimary) | 15.8:1 | Headings, primary content |
| Dark | `rgba(250,250,250,0.6)` (textSecondary) | 9.5:1 | Secondary text, labels |
| Dark | `rgba(250,250,250,0.4)` (textMuted) | 6.3:1 | Hints, placeholders |
| Light | `#0D0D0D` | 15.8:1 | Primary text on light bg |

**Before any UI change, verify:**
1. Text is readable on ALL screen backgrounds
2. Active/selected states have sufficient contrast
3. Disabled states are distinguishable but still legible
4. Button text contrasts with button background
5. Icon colors are visible on their backgrounds

**Never use:**
- Light text on light backgrounds
- Dark text on dark backgrounds
- Low-contrast placeholder text
- Hardcoded color values without checking theme

**Testing checklist:**
- [ ] All text readable at normal viewing distance
- [ ] Interactive elements have clear focus states
- [ ] Color is not the only indicator of state
- [ ] Minimum touch targets of 44x44 points

### When Adding Features

1. **Ask**: Does this help women heal?
2. **Check**: Is it evidence-based or clearly labeled as spiritual?
3. **Verify**: Can it work offline?
4. **Ensure**: Is the language localizable?
5. **Confirm**: Are disclaimers appropriate?

### Brain Games Integration

The brain games are **not therapy**. They are educational tools based on:
- Cognitive Behavioral Therapy (CBT) principles
- Polyvagal Theory (nervous system regulation)
- Positive Psychology (gratitude, strengths)
- Mindfulness-Based Stress Reduction (MBSR)
- Self-Compassion (Kristin Neff's research)

Always frame as "educational exercises" not "treatment."

### World Model Architecture

The World Model is our competitive moat:
- Runs **100% offline** (no cloud AI dependency)
- Uses **Small Language Models** when available
- Falls back to **rule-based inference** always
- Tracks user state for **proactive interventions**
- Measures outcomes for **continuous improvement**

## Content Guidelines

### Tone of Voice
- Warm, not clinical
- Hopeful, not preachy
- Gentle, not pushy
- Inclusive, not exclusive
- Empowering, not patronizing

### Spiritual Content
- Non-denominational Christian foundation
- Scripture from multiple translations
- Prayers that feel personal, not liturgical
- Kintsugi metaphor throughout (beauty in brokenness)

## Current Status

### Completed
- Marketing website with checkout (dark premium theme)
- Backend API for orders
- Supabase integration
- Mobile app core (devotionals, journal, auth)
- World Model specification
- 6 Brain Games (BreatheWithGod, GratitudeGarden, ThoughtDetective, ScripturePalace, BodyScanRelease, PatternPeace)
- B2B Portal for organizations (churches, counseling centers, NGOs, etc.)
- Admin Dashboard
- Dark premium UI theme matching website (glassmorphism)
- Time-locked guest preview (days unlock one at a time over 3 days)

### In Progress
- World Model state engine implementation
- Replace CSS tea cup with teacup.png image across app/website

### Upcoming
- PWA deployment
- App store submission
- B2B organization onboarding flow

## Design System

### Premium Dark Theme
- Background: #0D0D0D
- Card backgrounds: rgba(255, 255, 255, 0.03) with glassmorphism
- Gold accent: #D4AF37 (Kintsugi gold)
- Text primary: #FAFAFA
- Text secondary: rgba(250, 250, 250, 0.6)
- Borders: rgba(255, 255, 255, 0.08)

### Logo
- **Official logo**: `/mobile/assets/teacup.png` and `/website/images/teacup.png`
- Brown tea cup with steam on saucer
- Use this image, NOT CSS-generated icons

## B2B Strategy

### Target Organizations
- Churches & Faith Communities
- Counseling Centers & Therapists
- Women's Shelters
- NGOs & Nonprofits
- Retreat Centers
- Healthcare Providers
- Educational Institutions
- Corporate Wellness Programs

### Pricing Tiers (ZAR - PPP adjusted)
- Starter (25 codes): R4,950/year
- Growth (75 codes): R9,950/year
- Enterprise (200+ codes): R24,950/year

### Key Features
- Self-service onboarding (no sales calls)
- Privacy-first (organizations see aggregate metrics only)
- Instant access code generation
- Email templates for distribution

## Guest Preview System

### Time-Locked Access
- Day 1: Unlocks immediately on first app launch
- Day 2: Unlocks 24 hours after first launch
- Day 3: Unlocks 48 hours after first launch
- Full access: Requires book code redemption

This gives guests the authentic 40-day journey experience.

## Contact

For questions about localization partnerships or regional launches, this is a mission-driven project focused on helping women heal worldwide.

---

*"She was broken, but beautiful. Like pottery mended with gold."* - Kintsugi proverb
