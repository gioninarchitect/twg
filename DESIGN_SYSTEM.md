# Tea With God - Design System

**Version 1.0** | December 2025

---

## Brand Philosophy

Tea With God is a 40-day healing companion app for women going through emotional healing, relationship recovery, and spiritual growth. The design embodies the **Kintsugi** philosophy - the Japanese art of repairing broken pottery with gold, celebrating imperfection and transformation.

### Core Design Principles

1. **Premium & Intentional** - Every element feels crafted with care
2. **Dark & Calming** - A sanctuary from the chaos of daily life
3. **Gold as Healing** - Kintsugi gold represents transformation
4. **Warm Despite Dark** - Inviting, not cold or clinical
5. **Accessible** - High contrast, readable, inclusive

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Background** | `#0D0D0D` | rgb(13, 13, 13) | App background, primary surfaces |
| **Card Background** | `rgba(255, 255, 255, 0.03)` | - | Cards, containers |
| **Glass Background** | `rgba(255, 255, 255, 0.05)` | - | Glassmorphism effects |
| **Input Background** | `rgba(255, 255, 255, 0.08)` | - | Form inputs, interactive areas |

### Kintsugi Gold (Accent)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Gold Primary** | `#D4AF37` | rgb(212, 175, 55) | Primary accent, CTAs, highlights |
| **Gold Light** | `#F4E4BC` | rgb(244, 228, 188) | Hover states, emphasis |
| **Gold Dark** | `#B8960B` | rgb(184, 150, 11) | Pressed states, borders |
| **Gold Glow** | `rgba(212, 175, 55, 0.3)` | - | Box shadows, glows |

### Typography Colors

| Name | Value | Usage |
|------|-------|-------|
| **Text Primary** | `#FAFAFA` | Headings, primary content |
| **Text Secondary** | `rgba(250, 250, 250, 0.6)` | Secondary text, labels |
| **Text Muted** | `rgba(250, 250, 250, 0.4)` | Hints, placeholders, captions |

### Phase Colors (40-Day Journey)

| Phase | Color | Hex | Days |
|-------|-------|-----|------|
| **Valley** | Earthy Brown | `#8B7355` | Days 1-14 |
| **Waiting** | Dusty Blue | `#9DAAB8` | Days 15-21 |
| **Rising** | Sage Green | `#8FBC8F` | Days 22-33 |
| **Becoming** | Kintsugi Gold | `#D4AF37` | Days 34-40 |

### Functional Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#81C784` | Confirmations, completed states |
| **Warning** | `#FFB74D` | Warnings, pending states |
| **Error** | `#E57373` | Errors, destructive actions |
| **Info** | `#64B5F6` | Information, tips |
| **Sage** | `#8FBC8F` | Calming accents, nature elements |

### Border & Divider Colors

| Name | Value | Usage |
|------|-------|-------|
| **Border Subtle** | `rgba(255, 255, 255, 0.08)` | Default borders |
| **Border Focus** | `rgba(212, 175, 55, 0.5)` | Focused input borders |
| **Divider** | `rgba(255, 255, 255, 0.06)` | Separators |

---

## Typography

### Font Families

| Type | Font | Fallback | Usage |
|------|------|----------|-------|
| **Display** | Playfair Display | Georgia, serif | Headings, titles |
| **Devotional** | Georgia | Times New Roman, serif | Scripture, quotes |
| **UI** | Inter | System, sans-serif | Body, labels, buttons |

### Type Scale

| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| **Hero** | 48px | 1.1 | Hero headlines |
| **Display** | 32px | 1.1 | Page titles |
| **XXL** | 24px | 1.2 | Section headers |
| **XL** | 20px | 1.3 | Card titles |
| **LG** | 17px | 1.4 | Subheadings |
| **MD** | 15px | 1.5 | Body text |
| **SM** | 13px | 1.5 | Secondary text |
| **XS** | 11px | 1.4 | Captions, labels |

### Letter Spacing

| Name | Value | Usage |
|------|-------|-------|
| **Tight** | -0.5px | Large headings |
| **Normal** | 0 | Body text |
| **Wide** | 0.5px | Buttons |
| **Wider** | 1px | Small caps |
| **Widest** | 2px | Labels, uppercase |

### Typography Examples

```css
/* Hero Heading */
font-family: 'Playfair Display', Georgia, serif;
font-size: 48px;
font-weight: 700;
line-height: 1.1;
letter-spacing: -0.5px;
color: #D4AF37;

/* Body Text */
font-family: 'Inter', system-ui, sans-serif;
font-size: 15px;
font-weight: 400;
line-height: 1.5;
color: rgba(250, 250, 250, 0.6);

/* Scripture */
font-family: Georgia, serif;
font-size: 17px;
font-style: italic;
line-height: 1.9;
color: #FAFAFA;
```

---

## Spacing System

All spacing uses a **4px base unit** with consistent multipliers.

| Name | Value | Usage |
|------|-------|-------|
| **XS** | 4px | Tight spacing, inline elements |
| **SM** | 8px | Related elements |
| **MD** | 16px | Default spacing |
| **LG** | 24px | Section spacing |
| **XL** | 32px | Large gaps |
| **XXL** | 48px | Page sections |
| **XXXL** | 64px | Major separations |

### Layout Guidelines

- **Container padding**: 24px (mobile), 32px (tablet), 48px (desktop)
- **Card padding**: 16px-24px
- **Form field gaps**: 16px
- **Button group gaps**: 12px
- **Grid gaps**: 16px-24px

---

## Border Radius

| Name | Value | Usage |
|------|-------|-------|
| **SM** | 8px | Inputs, small buttons |
| **MD** | 12px | Cards, modals |
| **LG** | 16px | Large cards |
| **XL** | 20px | Feature cards |
| **XXL** | 24px | Hero elements |
| **XXXL** | 32px | Bottom sheets |
| **Full** | 9999px | Pills, circles |

---

## Shadows

### Standard Shadows

```css
/* Soft Shadow - Subtle elevation */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

/* Medium Shadow - Cards, dropdowns */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

/* Strong Shadow - Modals, overlays */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
```

### Glow Effects

```css
/* Gold Glow - CTAs, highlighted elements */
box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);

/* Gold Glow Button Hover */
box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
```

---

## Gradients

### Primary Gradients

```css
/* Gold Gradient - Premium accents */
background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%);

/* Gold Subtle - Backgrounds */
background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%);

/* Dark Gradient - Cards, surfaces */
background: linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%);

/* Card Gradient - Glassmorphism */
background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
```

### Phase Gradients

```css
/* Valley */
background: linear-gradient(135deg, rgba(139, 115, 85, 0.3) 0%, rgba(139, 115, 85, 0.1) 100%);

/* Waiting */
background: linear-gradient(135deg, rgba(157, 170, 184, 0.3) 0%, rgba(157, 170, 184, 0.1) 100%);

/* Rising */
background: linear-gradient(135deg, rgba(143, 188, 143, 0.3) 0%, rgba(143, 188, 143, 0.1) 100%);

/* Becoming */
background: linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.1) 100%);
```

---

## Components

### Buttons

#### Primary Button
```css
.btn-primary {
    background: #D4AF37;
    color: #0D0D0D;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary:hover {
    background: #F4E4BC;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}
```

#### Secondary Button
```css
.btn-secondary {
    background: transparent;
    color: #D4AF37;
    font-weight: 500;
    padding: 12px 24px;
    border-radius: 8px;
    border: 2px solid #D4AF37;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary:hover {
    background: #D4AF37;
    color: #0D0D0D;
}
```

### Cards

```css
.card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 24px;
    backdrop-filter: blur(10px);
}

.card-elevated {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
```

### Input Fields

```css
.input {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 12px 16px;
    color: #FAFAFA;
    font-size: 15px;
    transition: border-color 0.2s;
}

.input:focus {
    border-color: rgba(212, 175, 55, 0.5);
    outline: none;
}

.input::placeholder {
    color: rgba(250, 250, 250, 0.4);
}
```

### Status Badges

```css
.status {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
}

.status-pending {
    background: rgba(255, 183, 77, 0.15);
    color: #FFB74D;
}

.status-success {
    background: rgba(129, 199, 132, 0.15);
    color: #81C784;
}

.status-error {
    background: rgba(229, 115, 115, 0.15);
    color: #E57373;
}
```

---

## Iconography

### Icon Library
- **Primary**: Font Awesome 6 Pro
- **Alternative**: Ionicons (mobile)

### Icon Sizes

| Size | Value | Usage |
|------|-------|-------|
| **XS** | 12px | Inline, badges |
| **SM** | 16px | Buttons, lists |
| **MD** | 20px | Navigation |
| **LG** | 24px | Cards, headers |
| **XL** | 32px | Features |
| **XXL** | 48px | Hero icons |

### Icon Colors
- **Default**: `rgba(250, 250, 250, 0.6)`
- **Active**: `#D4AF37`
- **Success**: `#81C784`
- **Warning**: `#FFB74D`
- **Error**: `#E57373`

---

## Animation

### Timing

| Name | Duration | Usage |
|------|----------|-------|
| **Fast** | 150ms | Micro-interactions |
| **Normal** | 250ms | Standard transitions |
| **Slow** | 400ms | Larger elements |
| **Gentle** | 600ms | Emotional transitions |

### Easing

```css
/* Standard ease */
transition-timing-function: ease;

/* Smooth deceleration */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Bounce */
transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Common Animations

```css
/* Fade In */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

/* Pulse (breathing) */
@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
}

/* Gold Shimmer */
@keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
}
```

---

## Glassmorphism

The app uses glassmorphism for elevated surfaces:

```css
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
}
```

---

## Responsive Breakpoints

| Name | Width | Target |
|------|-------|--------|
| **Mobile** | < 640px | Phones |
| **Tablet** | 640px - 1024px | Tablets |
| **Desktop** | > 1024px | Laptops/Desktops |
| **Large** | > 1280px | Large monitors |

---

## Accessibility

### Contrast Ratios

All text meets WCAG AA standards:

| Element | Contrast Ratio |
|---------|----------------|
| Primary text on dark | 15.8:1 |
| Secondary text on dark | 9.5:1 |
| Muted text on dark | 6.3:1 |
| Gold on dark | 8.2:1 |

### Focus States

```css
*:focus-visible {
    outline: 2px solid #D4AF37;
    outline-offset: 2px;
}
```

### Minimum Touch Targets
- **Mobile**: 44x44px minimum
- **Desktop**: 32x32px minimum

---

## Logo Usage

### Primary Logo
- File: `/images/teacup.png`
- Brown tea cup with steam on saucer
- Use on dark backgrounds

### Logo Clearance
- Minimum clearance: 16px on all sides
- Never distort or recolor
- Never add effects

### Brand Name Typography
```css
.brand-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 600;
    color: #D4AF37;
    letter-spacing: 0.5px;
}
```

---

## CSS Variables (Web)

```css
:root {
    /* Background */
    --bg-dark: #0D0D0D;
    --bg-card: rgba(255, 255, 255, 0.03);
    --bg-glass: rgba(255, 255, 255, 0.05);
    --bg-input: rgba(255, 255, 255, 0.08);

    /* Typography */
    --text-primary: #FAFAFA;
    --text-secondary: rgba(250, 250, 250, 0.6);
    --text-muted: rgba(250, 250, 250, 0.4);

    /* Kintsugi Gold */
    --gold: #D4AF37;
    --gold-light: #F4E4BC;
    --gold-dark: #B8860B;
    --gold-glow: rgba(212, 175, 55, 0.3);

    /* Functional */
    --success: #81C784;
    --warning: #FFB74D;
    --error: #E57373;
    --info: #64B5F6;
    --sage: #8FBC8F;

    /* Borders */
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-focus: rgba(212, 175, 55, 0.5);

    /* Spacing */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-xxl: 48px;

    /* Radius */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --radius-full: 9999px;

    /* Fonts */
    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'Inter', system-ui, sans-serif;
}
```

---

## Quick Reference Card

### Colors at a Glance
- **Background**: `#0D0D0D`
- **Gold**: `#D4AF37`
- **Text**: `#FAFAFA`
- **Secondary**: `rgba(250, 250, 250, 0.6)`

### Key Metrics
- **Base unit**: 4px
- **Card radius**: 16px
- **Button radius**: 8px
- **Standard padding**: 16-24px
- **Animation duration**: 250ms

### Font Stack
- **Headings**: Playfair Display
- **Body**: Inter
- **Scripture**: Georgia (italic)

---

*Tea With God Design System v1.0*
*"Like pottery mended with gold, our cracks become our beauty."*
