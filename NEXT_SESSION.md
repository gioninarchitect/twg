# Tea With God - Next Session Handoff

**Session Date:** December 27, 2025
**Project:** Tea With God - Mental Wellness App

---

## What We Accomplished This Session

### 1. Brain Games Engagement System (COMPLETE)
All 6 brain games now have "Why This Works" educational modals:
- `BreatheWithGod.tsx` - Breathing exercise with science explanation
- `GratitudeGarden.tsx` - Gratitude journaling with research backing
- `ScripturePalace.tsx` - Memory palace technique explained
- `ThoughtDetective.tsx` - CBT-based thought reframing
- `BodyScanRelease.tsx` - Progressive muscle relaxation science
- `PatternPeace.tsx` - Pattern recognition calming effects

Supporting components created:
- `MoodCheckIn.tsx` - Pre/post session mood tracking
- `KintsugiProgress.tsx` - Visual healing journey progress
- `HealingToolkit.tsx` - Personalized tool dashboard
- `CrisisQuickAccess.tsx` - SA crisis resources (SADAG 0800 567 567, Lifeline 0861 322 322, Emergency 10111)
- `Celebrations.tsx` - Milestone celebration system

### 2. Design System Document (COMPLETE)
Created comprehensive design system at:
**`/Users/florisolivier/TWGAPP/tea-with-God/DESIGN_SYSTEM.md`**

Includes:
- Colors (dark theme: #0D0D0D background, #D4AF37 gold accent)
- Typography (Playfair Display, Inter, Georgia)
- Spacing scale (4px base: xs:4, sm:8, md:16, lg:24, xl:32, xxl:48)
- Border radius (sm:8px to full:9999px)
- Shadows and glow effects
- CSS variables for web
- Component examples (buttons, cards, inputs, badges)
- Phase colors (Valley #8B7355, Waiting #9DAAB8, Rising #8FBC8F, Becoming #D4AF37)

**Ready for presentation handoff to "learned friend".**

### 3. Admin Dashboard Features (UI COMPLETE - Needs Database)
Added to `/Users/florisolivier/TWGAPP/tea-with-God/website/admin/index.html`:

- **Social Calendar Section** - Calendar view with 40-day journey themes, content templates
- **CRM Section** - Contact management with activity log, status tracking
- **Invoices Section** - Invoice generation with line items, branded preview

**6 Weekly Themes defined:**
1. Week 1: Acknowledging Brokenness (Days 1-7)
2. Week 2: Releasing Pain (Days 8-14)
3. Week 3: Finding Strength (Days 15-21)
4. Week 4: Embracing Transformation (Days 22-28)
5. Week 5: Living Renewed (Days 29-35)
6. Week 6: Sharing Your Story (Days 36-40)

**WARNING:** Currently using localStorage only. User explicitly stated this is dangerous and needs database integration.

### 4. Kindle/KDP Research (IN PROGRESS)
Findings so far:
- **Supported formats:** DOC/DOCX, KPF (recommended via Kindle Create), EPUB, HTML, RTF, TXT, PDF
- **MOBI deprecated:** March 2025 for fixed-layout eBooks
- **Kindle Create:** Free tool to create KPF files
- **Paperback trim sizes:** Common 6x9", options from 5x8" to 8.5x11"
- **Bleed:** 0.125" (3.2mm) if images extend to edge
- **Margins:** Minimum 0.25" (no bleed) or 0.375" (with bleed)

---

## Priority for Next Session

### PRIORITY 1: Book Content Re-Import
User will provide:
- **New book content as TEXT FILE** (not Word doc)
- Previous Word doc had character encoding issues
- Must go through character checking workflow
- Content must be "mint" - no character problems

### PRIORITY 2: Database Integration (User emphasized this multiple times)
User explicitly said: "Local storage is very dangerous to use"

Replace localStorage with proper persistence:

1. **Add Supabase Tables:**
   - `social_posts` - Social media content calendar
   - `contacts` - CRM contacts
   - `invoices` - Invoice records
   - `invoice_line_items` - Invoice line items

2. **Create API Endpoints:**
   - POST/GET/PUT/DELETE for each resource
   - Add to existing backend

3. **Consider IndexedDB:**
   - User mentioned this as alternative
   - For offline capability
   - Sync with Supabase when online

### PRIORITY 3: Social Media Strategy
- Define all platforms (Instagram, Facebook, TikTok, YouTube, LinkedIn, X/Twitter)
- **Lonnie's LinkedIn** needs setup for credibility (user specifically mentioned)
- Create 12-month content plan
- Populate calendar with strategic posts

### PRIORITY 4: Localization Strategy
- Create documentation for translation workflow
- Define supported languages
- Plan implementation approach

---

## Important File Locations

### Mobile App
```
/Users/florisolivier/TWGAPP/tea-with-God/mobile/
├── src/
│   ├── components/brainGames/
│   │   ├── BreatheWithGod.tsx
│   │   ├── GratitudeGarden.tsx
│   │   ├── ScripturePalace.tsx
│   │   ├── ThoughtDetective.tsx
│   │   ├── BodyScanRelease.tsx
│   │   ├── PatternPeace.tsx
│   │   ├── MoodCheckIn.tsx
│   │   ├── KintsugiProgress.tsx
│   │   ├── HealingToolkit.tsx
│   │   ├── CrisisQuickAccess.tsx
│   │   └── Celebrations.tsx
│   └── theme/
│       └── colors.ts (design tokens source of truth)
```

### Website/Admin
```
/Users/florisolivier/TWGAPP/tea-with-God/website/
├── admin/
│   └── index.html (admin dashboard - has Social, CRM, Invoices sections)
├── b2b/
│   └── index.html (B2B portal for organizations)
└── images/
    └── teacup.png (official logo)
```

### Design System
```
/Users/florisolivier/TWGAPP/tea-with-God/DESIGN_SYSTEM.md
```

---

## Theme/Design Tokens

From `mobile/src/theme/colors.ts`:
- **Background:** #0D0D0D (dark)
- **Gold Accent:** #D4AF37
- **Text Primary:** #FAFAFA
- **Text Secondary:** rgba(250, 250, 250, 0.6)
- **Text Muted:** rgba(250, 250, 250, 0.4)
- **Borders:** rgba(255, 255, 255, 0.08)
- **Phase Colors:**
  - Valley: #8B7355
  - Waiting: #9DAAB8
  - Rising: #8FBC8F
  - Becoming: #D4AF37

---

## Access Codes (For Testing)
- `TEAWITHGOD2025` - Full access
- `HEALING40DAYS` - Full access
- `KINTSUGI2025` - Full access
- `BETAREVIEW` - Full access

---

## Server Info

| Server | Domain | Web Root |
|--------|--------|----------|
| TWG UAT | twg.cleva-ai.co.za | /var/www/twg |

---

## User Frustrations to Avoid

1. **Don't use localStorage for important data** - User was emphatic about this
2. **Design system was urgently needed** - Now complete, don't delay deliverables
3. **Character encoding issues** - Next session gets TEXT file, not Word doc
4. **Stay focused** - Don't get sidetracked, deliver what's asked

---

## Next Session Checklist

- [ ] Read this document first
- [ ] User will provide book content as TEXT file
- [ ] Run character checking workflow on new content
- [ ] Continue with database integration for admin features
- [ ] Ask user what the priority is if unclear

---

*"She was broken, but beautiful. Like pottery mended with gold."* - Kintsugi proverb
