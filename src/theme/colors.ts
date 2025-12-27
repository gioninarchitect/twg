/**
 * Tea With God - Premium Dark Design System
 * Matching website aesthetic - dark, gold accents, premium feel
 */

export const COLORS = {
  // Base - Dark Premium
  background: '#0D0D0D',
  backgroundCard: 'rgba(255, 255, 255, 0.03)',
  backgroundGlass: 'rgba(255, 255, 255, 0.05)',
  backgroundInput: 'rgba(255, 255, 255, 0.08)',

  // Legacy aliases (for compatibility)
  cream: '#0D0D0D',
  warmBeige: '#1A1A1A',
  softIvory: '#151515',

  // Typography
  textPrimary: '#FAFAFA',
  textSecondary: 'rgba(250, 250, 250, 0.6)',
  textMuted: 'rgba(250, 250, 250, 0.4)',

  // Legacy aliases
  earth: '#FAFAFA',
  richBrown: 'rgba(250, 250, 250, 0.8)',
  mutedBrown: 'rgba(250, 250, 250, 0.6)',

  // Accent - Kintsugi Gold (matches website)
  gold: '#D4AF37',
  goldLight: '#F4E4BC',
  goldDark: '#B8960B',
  goldMuted: '#C4A832',
  goldGlow: 'rgba(212, 175, 55, 0.3)',

  // Phase Colors (adjusted for dark theme)
  valley: '#8B7355',
  waiting: '#9DAAB8',
  rising: '#8FBC8F',
  becoming: '#D4AF37',

  // Functional
  sage: '#8FBC8F',
  sageMuted: '#6B9E6B',
  dustyBlue: '#9DAAB8',
  dustyBlueMuted: '#7A8A98',
  warm: '#E8C39E',

  // Alert
  error: '#E57373',
  success: '#81C784',
  warning: '#FFB74D',
  info: '#64B5F6',
  mutedTerracotta: '#B38B7D',

  // Borders & Dividers
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderFocus: 'rgba(212, 175, 55, 0.5)',
  divider: 'rgba(255, 255, 255, 0.06)',

  // Overlay & Effects
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  glassWhite: 'rgba(255, 255, 255, 0.05)',
  glassDark: 'rgba(0, 0, 0, 0.3)',

  // Utility
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export const SHADOWS = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  goldGlow: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
};

export const TYPOGRAPHY = {
  // Font families (Playfair Display for headings, system for body)
  devotional: 'Georgia',
  display: 'Georgia', // Would be Playfair Display if custom fonts loaded
  ui: 'System',

  // Premium sizes
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 32,
    hero: 48,
  },

  // Line heights
  lineHeights: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.7,
    devotional: 1.9,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
    label: 1.5,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
};

export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  gentle: 600,
};

export const GRADIENTS = {
  gold: {
    colors: ['#D4AF37', '#F4E4BC', '#D4AF37'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  goldSubtle: {
    colors: ['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.05)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  dark: {
    colors: ['#1A1A1A', '#0D0D0D'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  warmDark: {
    colors: ['#1a1512', '#0D0D0D'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  card: {
    colors: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  // Phase gradients (adjusted for dark theme)
  valley: {
    colors: ['rgba(139, 115, 85, 0.3)', 'rgba(139, 115, 85, 0.1)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  waiting: {
    colors: ['rgba(157, 170, 184, 0.3)', 'rgba(157, 170, 184, 0.1)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  rising: {
    colors: ['rgba(143, 188, 143, 0.3)', 'rgba(143, 188, 143, 0.1)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  becoming: {
    colors: ['rgba(212, 175, 55, 0.3)', 'rgba(212, 175, 55, 0.1)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Legacy
  warmth: {
    colors: ['#1A1A1A', '#0D0D0D'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  earth: {
    colors: ['#2A2A2A', '#1A1A1A'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  sanctuary: {
    colors: ['rgba(13, 13, 13, 0)', 'rgba(13, 13, 13, 1)'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
};

// Phase configuration
export const PHASES = {
  valley: { name: 'Valley', days: [1, 14], color: COLORS.valley, gradient: GRADIENTS.valley },
  waiting: { name: 'Waiting', days: [15, 21], color: COLORS.waiting, gradient: GRADIENTS.waiting },
  rising: { name: 'Rising', days: [22, 33], color: COLORS.rising, gradient: GRADIENTS.rising },
  becoming: { name: 'Becoming', days: [34, 40], color: COLORS.becoming, gradient: GRADIENTS.becoming },
};

// Dark theme specific helpers
export const DARK_THEME = {
  // Status bar
  statusBarStyle: 'light-content',

  // Navigation bar
  navBackground: COLORS.background,
  navBorder: COLORS.borderSubtle,
  navText: COLORS.textPrimary,

  // Tab bar
  tabBarBackground: 'rgba(13, 13, 13, 0.95)',
  tabBarBorder: COLORS.borderSubtle,
  tabBarActive: COLORS.gold,
  tabBarInactive: COLORS.textMuted,

  // Cards
  cardBackground: COLORS.backgroundCard,
  cardBorder: COLORS.borderSubtle,

  // Inputs
  inputBackground: COLORS.backgroundInput,
  inputBorder: COLORS.borderSubtle,
  inputFocusBorder: COLORS.borderFocus,
  inputText: COLORS.textPrimary,
  inputPlaceholder: COLORS.textMuted,
};
