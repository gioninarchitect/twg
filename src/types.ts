/**
 * Tea With God: Companion Ecosystem
 * Core Type Definitions v2.5.0
 *
 * SANCTUARY LOGIC: We build pilgrims, not users.
 * Every type here holds space for healing.
 */

// ============================================================================
// DESIGN SYSTEM CONSTANTS
// ============================================================================

export const SANCTUARY_PALETTE = {
  // Base - NEVER use pure white (#FFFFFF)
  cream: '#FAF8F5',

  // Typography
  earth: '#5D4E37',        // Headers
  richBrown: '#7D6E5A',    // Body text

  // Accent - Kintsugi Gold (broken made beautiful)
  gold: '#D4A574',
  goldGradient: {
    start: '#D4A574',
    mid: '#C89B5E',
    end: '#B8956F',
    css: 'linear-gradient(135deg, #D4A574 0%, #C89B5E 50%, #B8956F 100%)',
  },

  // Functional
  sage: '#A8B5A0',         // Psychology modules
  dustyBlue: '#9DAAB8',    // Safety/Trust elements

  // Alert - NEVER bright red
  mutedTerracotta: '#B38B7D',  // Crisis states only

  // Supporting
  warmBeige: '#EDE5D8',    // Card backgrounds
  softShadow: 'rgba(93, 78, 55, 0.08)',
} as const;

export const TYPOGRAPHY = {
  devotional: 'Georgia',      // Serif - for sacred text
  ui: 'Montserrat',           // Sans-serif - for navigation
} as const;

// ============================================================================
// ACCESS & AUTHENTICATION
// ============================================================================

/**
 * Access Code Format: TWG-XXXX-XXXX-XXXX
 * Redeemed from physical book purchase
 */
export type AccessCode = `TWG-${string}-${string}-${string}` | null;

/**
 * GUEST: Days 1-3 free preview (grace period)
 * PILGRIM: Full 40-day journey unlocked via code redemption
 */
export type AccessLevel = 'GUEST' | 'PILGRIM';

export interface CodeRedemption {
  code: AccessCode;
  redeemedAt: string; // ISO8601
  isValid: boolean;
  pilgrimId: string;
}

// ============================================================================
// JOURNEY PHASES - THE HEALING ARC
// ============================================================================

/**
 * Phase 1: "The Valley" (Days 1-14)
 *   - Minor keys, ambient textures
 *   - Surrender, acknowledgment of pain
 *   - Deep descent before rising
 *
 * Phase 2: "The Rising" (Days 15-28)
 *   - Transition, emergence
 *   - Mixed modes, building strength
 *
 * Phase 3: "Becoming" (Days 29-40)
 *   - Major keys, resolution
 *   - Integration, new identity
 */
export type JourneyPhase = 'Valley' | 'Rising' | 'Becoming';

export const PHASE_BOUNDARIES = {
  Valley: { start: 1, end: 14 },
  Rising: { start: 15, end: 28 },
  Becoming: { start: 29, end: 40 },
} as const;

export function getPhaseForDay(dayIndex: number): JourneyPhase {
  if (dayIndex <= 14) return 'Valley';
  if (dayIndex <= 28) return 'Rising';
  return 'Becoming';
}

// ============================================================================
// MUSIC SYSTEM
// ============================================================================

export type MusicMood = 'Minor' | 'Major' | 'Transitional';

export interface MusicTrack {
  trackId: string;
  title: string;
  mood: MusicMood;
  moodDescription: string; // e.g., "Minor key, minimal beats, surrender"
  fileUrl: string;         // HLS stream: "hls/track_XX.m3u8"
  durationSeconds: number;
  phase: JourneyPhase;
}

export interface AudioState {
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  volume: number;           // 0.0 - 1.0
  isBackgrounded: boolean;  // True when on Journal screen (80% volume)
  position: number;         // Current playback position in seconds
}

// ============================================================================
// PSYCHOLOGY MODULE - CONDITIONAL DISCLOSURE
// ============================================================================

/**
 * CRITICAL CONSTRAINT: Psychology content is NEVER visible on initial load.
 * Unlock trigger: Devotional_Scroll_Depth > 90%
 */
export type PsychologyUnlockStatus = 'LOCKED' | 'UNLOCKED';

export interface PsychologyModule {
  moduleId: string;
  title: string;                    // e.g., "The Science of Breaking Points"
  insight: string;                  // Key takeaway
  contentShort: string;             // Preview text
  contentFull: string;              // Full markdown content
  citation: string;                 // Academic source
  themeColor: typeof SANCTUARY_PALETTE.sage;
  unlockTrigger: 'post_devotional_read';
}

// ============================================================================
// CONTENT UNIT - THE DAILY MODULE
// ============================================================================

export interface DayModule {
  dayId: number;                    // 1-40, strict linear progression
  phase: JourneyPhase;
  title: string;

  // Devotional Content
  devotionalRef: string;            // Path: "content/day_XX.md"
  devotionalPreview: string;        // First 200 chars for preview

  // Audio
  music: MusicTrack;

  // Psychology - Optional, conditional unlock
  psychology?: PsychologyModule;

  // Metadata
  estimatedReadMinutes: number;
  themes: string[];                 // e.g., ["surrender", "grief", "hope"]
}

export interface DayCompletionStatus {
  dayId: number;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETE';
  devotionalScrollDepth: number;    // 0-100, triggers psychology unlock at >90
  psychologyViewed: boolean;
  completedAt: string | null;       // ISO8601
}

// ============================================================================
// USER JOURNEY - THE PILGRIM'S PATH
// ============================================================================

export interface UserJourney {
  uid: string;
  accessCode: AccessCode;
  accessLevel: AccessLevel;

  // Progression - CHRONOLOGICAL SOVEREIGNTY
  currentDayIndex: number;          // 1-40, can only increment
  currentPhase: JourneyPhase;

  // Protocol Selection
  fastingProtocol: 'Spiritual' | 'Nourishment_Course';

  // Timestamps
  journeyStartedAt: string;         // ISO8601
  lastActiveTimestamp: string;      // ISO8601 - for Grace Protocol

  // Completion tracking
  dailyCompletions: DayCompletionStatus[];

  // Total Volume (NOT streaks - we reject punishment logic)
  totalDaysCompleted: number;
  totalJournalEntries: number;
  totalMinutesEngaged: number;
}

// ============================================================================
// JOURNAL SYSTEM - ENCRYPTED SACRED SPACE
// ============================================================================

export interface JournalEntry {
  entryId: string;
  pilgrimId: string;
  dayId: number;

  // Content - ENCRYPTED at rest and in transit
  encryptedContent: string;         // Ciphertext only
  contentHash: string;              // For integrity verification

  // Metadata (not encrypted)
  createdAt: string;                // ISO8601
  updatedAt: string;                // ISO8601
  wordCount: number;

  // Offline support
  syncStatus: 'PENDING' | 'SYNCED' | 'CONFLICT';
  localVersion: number;
}

export interface JournalPrompt {
  promptId: string;
  dayId: number;
  text: string;
  isOptional: boolean;
}

// ============================================================================
// CRISIS INTERVENTION - SAFETY OVERRIDE
// ============================================================================

/**
 * AXIOM_4: Crisis_State is a GLOBAL INTERRUPT.
 * Bypasses all animation queues, navigation stacks, and API calls.
 * Resources are LOCAL - zero network dependency.
 */
export type CrisisLevel = 'NONE' | 'ELEVATED' | 'CRITICAL';

export const CRISIS_TRIGGER_WORDS = [
  'suicide',
  'end it',
  'numb',
  'can\'t go on',
  'want to die',
  'no point',
  'give up',
  'hurt myself',
] as const;

export interface CrisisResource {
  resourceId: string;
  title: string;
  type: 'HOTLINE' | 'PRAYER' | 'GROUNDING' | 'SAFETY_PLAN';
  content: string;
  phoneNumber?: string;             // For hotlines
  isLocal: true;                    // ALWAYS local - no network
}

export interface CrisisState {
  level: CrisisLevel;
  triggeredAt: string | null;
  triggerSource: 'MANUAL_SOS' | 'SENTIMENT_DETECTED' | null;
  detectedPhrases: string[];
}

// Bundled offline crisis resources
export const OFFLINE_CRISIS_RESOURCES: CrisisResource[] = [
  {
    resourceId: 'hotline_national',
    title: 'National Suicide Prevention Lifeline',
    type: 'HOTLINE',
    content: 'Free, confidential support 24/7',
    phoneNumber: '988',
    isLocal: true,
  },
  {
    resourceId: 'hotline_crisis_text',
    title: 'Crisis Text Line',
    type: 'HOTLINE',
    content: 'Text HOME to 741741',
    phoneNumber: '741741',
    isLocal: true,
  },
  {
    resourceId: 'prayer_cant_pray',
    title: 'A Prayer When I Cannot Pray',
    type: 'PRAYER',
    content: `Lord, I have no words left.
My heart is too heavy to lift to You.
So I offer You my silence,
my tears,
my emptiness.
Hold me in this darkness.
I trust You are here,
even when I cannot feel You.
Amen.`,
    isLocal: true,
  },
  {
    resourceId: 'grounding_54321',
    title: '5-4-3-2-1 Grounding',
    type: 'GROUNDING',
    content: `Right now, notice:
5 things you can SEE
4 things you can TOUCH
3 things you can HEAR
2 things you can SMELL
1 thing you can TASTE

You are here. You are safe. This moment will pass.`,
    isLocal: true,
  },
];

// ============================================================================
// GRACE PROTOCOL - COMPASSIONATE NOTIFICATIONS
// ============================================================================

/**
 * THE ANTI-STREAK: We measure Total Volume, not Consecutive Linearity.
 * A gap triggers Sanctuary Logic (Compassion), not Failure Logic (Punishment).
 */
export type GraceInterval = '24h' | '72h' | '14d';

export interface GraceNotification {
  intervalKey: GraceInterval;
  title: string;
  body: string;
  triggerAfterHours: number;
  suppressStreakData: boolean;      // NEVER show "missed days"
}

export const GRACE_NOTIFICATIONS: Record<GraceInterval, GraceNotification> = {
  '24h': {
    intervalKey: '24h',
    title: 'Your tea is waiting',
    body: 'A quiet moment awaits whenever you\'re ready.',
    triggerAfterHours: 24,
    suppressStreakData: true,
  },
  '72h': {
    intervalKey: '72h',
    title: 'No pressure',
    body: 'We are here when you are ready. Your journey holds space for you.',
    triggerAfterHours: 72,
    suppressStreakData: true,
  },
  '14d': {
    intervalKey: '14d',
    title: 'Welcome back',
    body: 'Your sanctuary remains. Shall we continue together?',
    triggerAfterHours: 336, // 14 * 24
    suppressStreakData: true,
  },
};

// ============================================================================
// NAVIGATION STATES
// ============================================================================

export type RootStackParamList = {
  // Auth Flow
  Welcome: undefined;
  CodeRedemption: undefined;

  // Main Journey
  Dashboard: undefined;
  DayModule: { dayId: number };
  Devotional: { dayId: number };
  Journal: { dayId: number; promptId?: string };

  // Support
  Settings: undefined;
  JourneyProgress: undefined;

  // Crisis - Global Override
  CrisisModal: { source: 'MANUAL_SOS' | 'SENTIMENT_DETECTED' };

  // Re-entry
  WelcomeBack: { daysSinceActive: number };
};

export type NavigationState = {
  currentRoute: keyof RootStackParamList;
  previousRoute: keyof RootStackParamList | null;
  isCrisisOverrideActive: boolean;
};

// ============================================================================
// OFFLINE-FIRST SYNC
// ============================================================================

export interface SyncQueueItem {
  id: string;
  type: 'JOURNAL_ENTRY' | 'DAY_COMPLETION' | 'SETTINGS';
  payload: string;                  // Encrypted JSON
  createdAt: string;
  retryCount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'FAILED' | 'SYNCED';
}

export interface OfflineState {
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingQueueCount: number;
  syncQueue: SyncQueueItem[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidAccessCode(code: string): code is NonNullable<AccessCode> {
  return /^TWG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
}

export function isPilgrim(journey: UserJourney): boolean {
  return journey.accessLevel === 'PILGRIM';
}

export function isDayAccessible(
  journey: UserJourney,
  dayId: number
): boolean {
  // CHRONOLOGICAL SOVEREIGNTY: Can only access current or completed days
  if (dayId > journey.currentDayIndex) return false;

  // GUEST can only access Days 1-3
  if (journey.accessLevel === 'GUEST' && dayId > 3) return false;

  return true;
}

export function shouldShowPsychology(completion: DayCompletionStatus): boolean {
  // NEGATIVE CONSTRAINT: Psychology is post-devotional only
  return completion.devotionalScrollDepth > 90;
}
