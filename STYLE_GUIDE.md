# Tea With God - Design System & Style Guide

## Brand Overview

Tea With God uses a **premium dark theme** with **Kintsugi gold accents**, representing beauty in brokenness. The design evokes a sense of sanctuary, warmth, and healing.

---

## Color Palette

### Core Colors (CSS Variables)

```css
:root {
  /* Base - Dark Premium */
  --bg-dark: #0D0D0D;
  --bg-card: rgba(255, 255, 255, 0.03);
  --bg-glass: rgba(255, 255, 255, 0.05);
  --bg-input: rgba(255, 255, 255, 0.08);

  /* Typography */
  --text-primary: #FAFAFA;
  --text-secondary: rgba(250, 250, 250, 0.6);
  --text-muted: rgba(250, 250, 250, 0.4);

  /* Kintsugi Gold (Primary Accent) */
  --gold: #D4AF37;
  --gold-light: #F4E4BC;
  --gold-dark: #B8860B;
  --gold-glow: rgba(212, 175, 55, 0.3);

  /* Supporting Colors */
  --sage: #8FBC8F;      /* Success, nature, growth */
  --warm: #E8C39E;      /* Warmth, comfort */
  --dusty-blue: #9DAAB8; /* Calm, transition */

  /* Functional Colors */
  --error: #E57373;
  --success: #81C784;
  --warning: #FFB74D;
  --info: #64B5F6;

  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(212, 175, 55, 0.5);
  --divider: rgba(255, 255, 255, 0.06);

  /* Gradients */
  --gradient-gold: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%);
  --gradient-warm: linear-gradient(135deg, #1a1512 0%, #0D0D0D 100%);
  --gradient-dark: linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%);
}
```

### Color Usage Guide

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0D0D0D` | Main app/website background |
| Card BG | `rgba(255,255,255,0.03)` | Cards, containers, modals |
| Glass BG | `rgba(255,255,255,0.05)` | Glassmorphism effects |
| Gold | `#D4AF37` | Primary buttons, accents, CTAs |
| Gold Light | `#F4E4BC` | Hover states, highlights |
| Gold Glow | `rgba(212,175,55,0.3)` | Box shadows, glows |
| Sage | `#8FBC8F` | Success states, progress |
| Text Primary | `#FAFAFA` | Headings, body text |
| Text Secondary | `rgba(250,250,250,0.6)` | Subtitles, descriptions |
| Text Muted | `rgba(250,250,250,0.4)` | Placeholders, hints |

---

## Typography

### Font Families

```css
:root {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Font Stack (CDN)

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Type Scale

| Name | Size | Weight | Use Case |
|------|------|--------|----------|
| Hero | 48px | 700 | Landing page hero titles |
| Display | 32px | 700 | Section headings |
| H1 | 24px | 600 | Page titles |
| H2 | 20px | 600 | Card headings |
| H3 | 17px | 600 | Subsection titles |
| Body | 15px | 400 | Paragraph text |
| Small | 13px | 400 | Captions, labels |
| XS | 11px | 400 | Timestamps, fine print |

### Example CSS

```css
.hero-title {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.section-title {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--gold);
}

.body-text {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.7;
  color: var(--text-secondary);
}
```

---

## Spacing System

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
  --space-xxxl: 64px;
}
```

---

## Border Radius

```css
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-xxl: 24px;
  --radius-full: 9999px;
}
```

---

## Shadows & Effects

### Box Shadows

```css
/* Soft shadow (cards) */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

/* Medium shadow (modals) */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

/* Strong shadow (dropdowns) */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);

/* Gold glow (primary buttons) */
box-shadow: 0 0 30px rgba(212, 175, 55, 0.3);

/* Gold glow hover */
box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);
```

### Glassmorphism Effect

```css
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}
```

---

## Button Styles

### Primary Button (Gold)

```css
.btn-primary {
  background: var(--gold);
  color: #0D0D0D;
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--gold-light);
  box-shadow: 0 0 30px var(--gold-glow);
}
```

### Secondary Button (Outline)

```css
.btn-secondary {
  background: transparent;
  color: var(--gold);
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 600;
  border: 2px solid var(--gold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--gold);
  color: #0D0D0D;
}
```

### Tertiary Button (Text)

```css
.btn-text {
  background: transparent;
  color: var(--text-secondary);
  padding: 10px 16px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
}

.btn-text:hover {
  color: var(--gold);
}
```

---

## Card Component

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.2s ease;
}

.card:hover {
  border-color: rgba(212, 175, 55, 0.3);
  box-shadow: 0 12px 40px rgba(212, 175, 55, 0.1);
  transform: translateY(-4px);
}
```

---

## Input Fields

```css
.input {
  width: 100%;
  padding: 14px 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 15px;
  transition: border-color 0.2s ease;
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-glow);
}
```

---

## 40-Day Journey Phase Colors

Each phase has a distinct color that reflects the emotional journey:

| Phase | Days | Color | Hex | Mood |
|-------|------|-------|-----|------|
| Valley | 1-14 | Muted Brown | `#8B7355` | Grief, acknowledgment |
| Waiting | 15-21 | Dusty Blue | `#9DAAB8` | Transition, patience |
| Rising | 22-33 | Sage Green | `#8FBC8F` | Growth, emergence |
| Becoming | 34-40 | Gold | `#D4AF37` | Integration, triumph |

```css
:root {
  --phase-valley: #8B7355;
  --phase-waiting: #9DAAB8;
  --phase-rising: #8FBC8F;
  --phase-becoming: #D4AF37;
}
```

---

## Animation & Transitions

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-gentle: 600ms;
}

/* Standard transition */
transition: all 0.2s ease;

/* Smooth hover lift */
transition: transform 0.2s var(--ease-out),
            box-shadow 0.2s var(--ease-out);
```

---

## Icons

We use **Font Awesome 6** for icons:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

Icon color should match text or gold accent:

```css
.icon {
  color: var(--text-secondary);
}

.icon-accent {
  color: var(--gold);
}
```

---

## Logo

The official logo is a **brown tea cup with steam on a saucer**:

- **Path**: `/images/teacup.png` (website) or `/assets/teacup.png` (mobile)
- **Usage**: Always use the PNG image, never CSS-generated icons
- **Size**: 36-48px in navigation, 80-120px in hero sections

---

## Navigation

### Desktop Nav

```css
nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(13, 13, 13, 0.95);
  backdrop-filter: blur(20px);
  padding: 16px 48px;
  border-bottom: 1px solid var(--border-subtle);
  z-index: 100;
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--gold);
}
```

---

## Status Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge-pending {
  background: rgba(255, 183, 77, 0.15);
  color: #FFB74D;
}

.badge-success {
  background: rgba(129, 199, 132, 0.15);
  color: #81C784;
}

.badge-error {
  background: rgba(229, 115, 115, 0.15);
  color: #E57373;
}
```

---

## React Native (Mobile App)

Import from the theme module:

```typescript
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING, RADIUS, GRADIENTS } from '@/theme';
```

### Example Usage

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    ...SHADOWS.medium,
  },
  title: {
    fontFamily: TYPOGRAPHY.display,
    fontSize: TYPOGRAPHY.sizes.xxl,
    color: COLORS.gold,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  bodyText: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sizes.md * TYPOGRAPHY.lineHeights.relaxed,
  },
});
```

---

## Complete CSS Variables Block

Copy this entire block to any new HTML page:

```css
:root {
  /* Backgrounds */
  --bg-dark: #0D0D0D;
  --bg-card: rgba(255, 255, 255, 0.03);
  --bg-glass: rgba(255, 255, 255, 0.05);
  --bg-input: rgba(255, 255, 255, 0.08);

  /* Text */
  --text-primary: #FAFAFA;
  --text-secondary: rgba(250, 250, 250, 0.6);
  --text-muted: rgba(250, 250, 250, 0.4);

  /* Gold Accents */
  --gold: #D4AF37;
  --gold-light: #F4E4BC;
  --gold-dark: #B8860B;
  --gold-glow: rgba(212, 175, 55, 0.3);

  /* Supporting */
  --sage: #8FBC8F;
  --warm: #E8C39E;

  /* Functional */
  --error: #E57373;
  --success: #81C784;
  --warning: #FFB74D;
  --info: #64B5F6;

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(212, 175, 55, 0.5);

  /* Gradients */
  --gradient-gold: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%);
  --gradient-warm: linear-gradient(135deg, #1a1512 0%, #0D0D0D 100%);

  /* Fonts */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, sans-serif;

  /* Easing */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Phases */
  --phase-valley: #8B7355;
  --phase-waiting: #9DAAB8;
  --phase-rising: #8FBC8F;
  --phase-becoming: #D4AF37;
}
```

---

## Quick Reference

| Element | Background | Text | Border | Accent |
|---------|------------|------|--------|--------|
| Page | `#0D0D0D` | `#FAFAFA` | - | - |
| Card | `rgba(255,255,255,0.03)` | `#FAFAFA` | `rgba(255,255,255,0.08)` | - |
| Button Primary | `#D4AF37` | `#0D0D0D` | - | Gold glow |
| Button Secondary | Transparent | `#D4AF37` | `#D4AF37` | - |
| Input | `rgba(255,255,255,0.08)` | `#FAFAFA` | `rgba(255,255,255,0.08)` | Gold on focus |
| Success | - | `#81C784` | - | Sage |
| Error | - | `#E57373` | - | - |

---

*"She was broken, but beautiful. Like pottery mended with gold."* - Kintsugi proverb
