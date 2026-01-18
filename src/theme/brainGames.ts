/**
 * Brain Games Design System Extension
 * Game-specific theming and animations
 */

import { COLORS, SPACING, RADIUS, ANIMATION, GRADIENTS, SHADOWS } from './colors';

// ============================================
// GAME-SPECIFIC COLORS
// ============================================

export const GAME_COLORS = {
  // Breathe with God - Calming blue-greens on dark
  breathing: {
    primary: '#88A4B8',
    secondary: '#A8C5D8',
    accent: '#6B8FA8',
    background: '#0D0D0D',
    backgroundCard: 'rgba(136, 164, 184, 0.1)',
    inhale: '#A8C5D8',
    exhale: '#88A4B8',
    hold: '#9DB8CB',
    text: '#FAFAFA',
    textSecondary: 'rgba(250, 250, 250, 0.7)',
  },

  // Gratitude Garden - Warm greens and golds on dark
  gratitude: {
    primary: '#A8B5A0',
    secondary: '#C4D4BC',
    accent: '#8FA288',
    background: '#0D0D0D',
    backgroundCard: 'rgba(168, 181, 160, 0.1)',
    flower: '#D4A574',
    leaf: '#A8B5A0',
    stem: '#8FA288',
    text: '#FAFAFA',
    textSecondary: 'rgba(250, 250, 250, 0.7)',
  },

  // Thought Detective - Investigative purples and warm neutrals on dark
  thoughtDetective: {
    primary: '#9B8FB8',
    secondary: '#B8AEC8',
    accent: '#7A6E98',
    background: '#0D0D0D',
    backgroundCard: 'rgba(155, 143, 184, 0.1)',
    distortion: '#C4A882',
    reframe: '#A8B5A0',
    evidence: '#88A4B8',
    text: '#FAFAFA',
    textSecondary: 'rgba(250, 250, 250, 0.7)',
  },

  // Scripture Memory Palace - Royal golds and deep earth on dark
  scripturePalace: {
    primary: '#D4A574',
    secondary: '#E5C9A8',
    accent: '#B8956F',
    background: '#0D0D0D',
    backgroundCard: 'rgba(212, 165, 116, 0.1)',
    room: 'rgba(212, 165, 116, 0.15)',
    highlight: '#D4A574',
    memorized: '#A8B5A0',
    text: '#FAFAFA',
    textSecondary: 'rgba(250, 250, 250, 0.7)',
  },

  // Body Scan Release - Soothing teals and warmth on dark
  bodyScan: {
    primary: '#88A4A8',
    secondary: '#A8C4C8',
    accent: '#6B8A90',
    background: '#0D0D0D',
    backgroundCard: 'rgba(136, 164, 168, 0.1)',
    tension: '#C4A882',
    release: '#A8C4C8',
    neutral: 'rgba(255, 255, 255, 0.1)',
    text: '#FAFAFA',
    textSecondary: 'rgba(250, 250, 250, 0.7)',
  },

  // Pattern Peace - Focus blues and clarity on dark
  patternPeace: {
    primary: '#8898B8',
    secondary: '#A8B8D8',
    accent: '#6878A0',
    background: '#0D0D0D',
    backgroundCard: 'rgba(136, 152, 184, 0.1)',
    match: '#81C784',
    mismatch: '#E57373',
    target: '#D4AF37',
    text: '#FAFAFA',
    textSecondary: 'rgba(250, 250, 250, 0.7)',
  },
};

// ============================================
// GAME ANIMATION CONFIGS
// ============================================

export const GAME_ANIMATIONS = {
  // Breathing animation timings (ms)
  breathe: {
    inhale: 4000,
    holdIn: 4000,
    exhale: 4000,
    holdOut: 4000,
    transition: 200,
  },

  // General game animations
  celebration: {
    duration: 1500,
    scale: 1.2,
    rotations: 2,
  },

  // Progress animations
  progress: {
    fill: 600,
    pulse: 300,
  },

  // Card animations
  card: {
    flip: 300,
    reveal: 200,
    dismiss: 250,
  },

  // Feedback animations
  feedback: {
    correct: 400,
    incorrect: 300,
    hint: 500,
  },

  // Transition between states
  stateTransition: 400,
};

// ============================================
// HAPTIC PATTERNS
// ============================================

export const HAPTIC_PATTERNS = {
  // Light feedback
  tap: 'light' as const,
  select: 'light' as const,

  // Medium feedback
  success: 'medium' as const,
  breatheIn: 'medium' as const,
  breatheOut: 'medium' as const,

  // Heavy feedback
  complete: 'heavy' as const,
  achievement: 'heavy' as const,

  // Error feedback
  error: 'error' as const,
  warning: 'warning' as const,
};

// ============================================
// GAME ICONS (for consistent iconography)
// ============================================

export const GAME_ICONS = {
  breathing: {
    inhale: 'wind',
    exhale: 'cloud',
    hold: 'pause-circle',
    complete: 'check-circle',
  },
  gratitude: {
    flower: 'flower',
    garden: 'leaf',
    add: 'plus-circle',
    streak: 'flame',
  },
  thoughtDetective: {
    magnifier: 'search',
    distortion: 'alert-triangle',
    reframe: 'refresh-cw',
    evidence: 'clipboard',
  },
  scripturePalace: {
    palace: 'home',
    room: 'door-open',
    scripture: 'book-open',
    memorize: 'brain',
  },
  bodyScan: {
    body: 'user',
    tension: 'alert-circle',
    release: 'heart',
    scan: 'radio',
  },
  patternPeace: {
    pattern: 'grid',
    match: 'check',
    focus: 'target',
    level: 'bar-chart-2',
  },
};

// ============================================
// GAME GRADIENTS
// ============================================

export const GAME_GRADIENTS = {
  breathing: {
    colors: ['#A8C5D8', '#88A4B8', '#6B8FA8'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  gratitude: {
    colors: ['#C4D4BC', '#A8B5A0', '#8FA288'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  thoughtDetective: {
    colors: ['#B8AEC8', '#9B8FB8', '#7A6E98'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  scripturePalace: {
    colors: ['#E5C9A8', '#D4A574', '#B8956F'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  bodyScan: {
    colors: ['#A8C4C8', '#88A4A8', '#6B8A90'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  patternPeace: {
    colors: ['#A8B8D8', '#8898B8', '#6878A0'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// ============================================
// GAME LAYOUT CONSTANTS
// ============================================

export const GAME_LAYOUT = {
  // Standard game container padding
  containerPadding: SPACING.lg,

  // Header heights
  headerHeight: 64,
  headerPaddingTop: 48,

  // Bottom safe area
  bottomSafeArea: 34,

  // Card dimensions
  card: {
    minHeight: 120,
    maxHeight: 200,
  },

  // Button dimensions for games
  gameButton: {
    height: 56,
    minWidth: 120,
  },

  // Breathing circle sizes
  breathingCircle: {
    min: 120,
    max: 280,
  },

  // Grid item sizes
  gridItem: {
    sm: 60,
    md: 80,
    lg: 100,
  },
};

// ============================================
// ACCESSIBILITY
// ============================================

export const ACCESSIBILITY = {
  // Minimum touch target size (44pt Apple HIG)
  minTouchTarget: 44,

  // Text contrast ratios (WCAG AA)
  contrastRatios: {
    normal: 4.5,
    large: 3,
  },

  // Animation preferences
  reducedMotion: {
    duration: 0,
    useSimpleTransitions: true,
  },

  // Focus indicators
  focusRing: {
    width: 2,
    color: COLORS.gold,
    offset: 2,
  },
};

// ============================================
// GAME SESSION CONSTANTS
// ============================================

export const SESSION_DEFAULTS = {
  // Minimum session lengths (seconds)
  minSession: {
    breathing: 60,
    gratitude: 30,
    thoughtDetective: 120,
    scripturePalace: 60,
    bodyScan: 180,
    patternPeace: 120,
  },

  // Maximum recommended session lengths
  maxSession: {
    breathing: 600,
    gratitude: 300,
    thoughtDetective: 900,
    scripturePalace: 600,
    bodyScan: 900,
    patternPeace: 600,
  },

  // Default items per session
  itemsPerSession: {
    gratitude: 3,
    thoughtDetective: 1,
    scripturePalace: 3,
    patternPeace: 10,
  },
};

// ============================================
// EXPORT THEME HELPER
// ============================================

import { GameId } from '../worldModel/types';

export function getGameTheme(gameId: GameId) {
  return {
    colors: GAME_COLORS[gameId === 'thought_detective' ? 'thoughtDetective' :
                        gameId === 'scripture_palace' ? 'scripturePalace' :
                        gameId === 'body_scan' ? 'bodyScan' :
                        gameId === 'pattern_peace' ? 'patternPeace' :
                        gameId],
    gradient: GAME_GRADIENTS[gameId === 'thought_detective' ? 'thoughtDetective' :
                              gameId === 'scripture_palace' ? 'scripturePalace' :
                              gameId === 'body_scan' ? 'bodyScan' :
                              gameId === 'pattern_peace' ? 'patternPeace' :
                              gameId],
    icons: GAME_ICONS[gameId === 'thought_detective' ? 'thoughtDetective' :
                      gameId === 'scripture_palace' ? 'scripturePalace' :
                      gameId === 'body_scan' ? 'bodyScan' :
                      gameId === 'pattern_peace' ? 'patternPeace' :
                      gameId],
    session: {
      min: SESSION_DEFAULTS.minSession[gameId === 'thought_detective' ? 'thoughtDetective' :
                                        gameId === 'scripture_palace' ? 'scripturePalace' :
                                        gameId === 'body_scan' ? 'bodyScan' :
                                        gameId === 'pattern_peace' ? 'patternPeace' :
                                        gameId],
      max: SESSION_DEFAULTS.maxSession[gameId === 'thought_detective' ? 'thoughtDetective' :
                                        gameId === 'scripture_palace' ? 'scripturePalace' :
                                        gameId === 'body_scan' ? 'bodyScan' :
                                        gameId === 'pattern_peace' ? 'patternPeace' :
                                        gameId],
    },
  };
}
