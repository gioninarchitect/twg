/**
 * World Model Type Definitions
 * Core data structures for the intelligent healing engine
 */

// ============================================
// PRIMITIVE TYPES
// ============================================

export type MoodLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type TensionLevel = 1 | 2 | 3 | 4 | 5;
export type NBackLevel = 1 | 2 | 3;

export type BodyPart =
  | 'forehead'
  | 'jaw'
  | 'neck'
  | 'shoulders'
  | 'chest'
  | 'stomach'
  | 'lowerBack'
  | 'hips'
  | 'thighs'
  | 'feet';

export type GameId =
  | 'breathing'
  | 'gratitude'
  | 'thought_detective'
  | 'scripture_palace'
  | 'body_scan'
  | 'pattern_peace';

export type HealingTrajectory = 'accelerating' | 'steady' | 'plateaued' | 'struggling';

export type BreakthroughType = 'insight' | 'emotional_release' | 'forgiveness' | 'acceptance';

export type InferenceMethod = 'rule_based' | 'slm' | 'cloud_llm';

export type InterventionPriority = 'low' | 'medium' | 'high' | 'critical';

export type InterventionTiming = 'immediate' | 'next_session' | 'specific_time';

// ============================================
// ENTRY TYPES
// ============================================

export interface MoodEntry {
  timestamp: number;
  level: MoodLevel;
  source: 'journal' | 'check_in' | 'inferred';
  dayNumber: number;
}

export interface TriggerPattern {
  trigger: string;
  frequency: number;
  lastOccurred: number;
  associatedDistortions: string[];
}

export interface TensionEntry {
  timestamp: number;
  bodyParts: Array<{ part: BodyPart; level: TensionLevel }>;
  preSessionScore: number;
  postSessionScore: number;
  releaseSuccess: number;
}

export interface GameEngagement {
  gameId: GameId;
  totalSessions: number;
  totalMinutes: number;
  averageScore: number;
  lastPlayed: number;
  streak: number;
}

export interface CognitiveDistortion {
  id: string;
  name: string;
  frequency: number;
  reframeSuccessRate: number;
}

export interface BreakthroughEntry {
  dayNumber: number;
  timestamp: number;
  type: BreakthroughType;
  description: string;
}

export interface GratitudeEntry {
  id: string;
  timestamp: number;
  dayNumber: number;
  gratitudes: string[];
}

export interface ScriptureMemory {
  id: string;
  reference: string;
  text: string;
  location: string;
  visualAssociation: string;
  reviewCount: number;
  lastReviewed: number;
  mastery: 'learning' | 'bronze' | 'silver' | 'gold';
}

// ============================================
// USER WORLD STATE
// ============================================

export interface JourneyState {
  currentDay: number;
  daysCompleted: number[];
  journeyStartedAt: number;
  expectedCompletionDate: number;
  streakDays: number;
  longestStreak: number;
  missedDays: number[];
}

export interface EmotionalState {
  currentMood: MoodLevel;
  moodHistory: MoodEntry[];
  dominantDistortions: CognitiveDistortion[];
  triggerPatterns: TriggerPattern[];
  emotionalResilience: number;
  lastCrisisAccess: number | null;
}

export interface CognitiveState {
  workingMemoryLevel: NBackLevel;
  focusCapacity: number;
  reframingAbility: number;
  scriptureRetention: number;
  learningVelocity: number;
}

export interface PhysicalState {
  tensionHotspots: BodyPart[];
  tensionHistory: TensionEntry[];
  breathingCompliance: number;
  averageSessionDuration: number;
  preferredBreathingPattern: string;
  bodyAwareness: number;
}

export interface BehavioralState {
  preferredTimeOfDay: TimeOfDay;
  averageSessionLength: number;
  engagementByGame: GameEngagement[];
  completionRates: Record<GameId, number>;
  lastActiveAt: number;
  notificationResponseRate: number;
}

export interface SpiritualState {
  prayerEngagement: number;
  scripturesMemorized: number;
  journalDepth: number;
  reflectionQuality: number;
  breakthroughMoments: BreakthroughEntry[];
}

export interface BrainGamesState {
  hasAccess: boolean;
  unlockedGames: GameId[];
  gratitudeEntries: GratitudeEntry[];
  scriptureMemories: ScriptureMemory[];
  gardenLevel: 1 | 2 | 3 | 4 | 5;
  totalBreathingMinutes: number;
  totalThoughtsReframed: number;
  totalBodyScans: number;
}

export interface UserWorldState {
  userId: string;
  createdAt: number;
  lastUpdated: number;
  syncEnabled: boolean;

  journey: JourneyState;
  emotional: EmotionalState;
  cognitive: CognitiveState;
  physical: PhysicalState;
  behavioral: BehavioralState;
  spiritual: SpiritualState;
  brainGames: BrainGamesState;
}

// ============================================
// EVENTS
// ============================================

export type WorldModelEvent =
  | { type: 'DEVOTIONAL_COMPLETED'; dayNumber: number; scrollDepth: number; duration: number }
  | { type: 'JOURNAL_ENTRY'; dayNumber: number; content: string; wordCount: number }
  | { type: 'BREATHING_SESSION'; pattern: string; duration: number; completed: boolean }
  | { type: 'GRATITUDE_ENTRY'; gratitudes: string[]; dayNumber: number }
  | { type: 'THOUGHT_REFRAMED'; distortion: string; originalThought: string; reframedThought: string; compassionScore: number }
  | { type: 'BODY_SCAN_COMPLETED'; tensionMap: TensionEntry; duration: number }
  | { type: 'PATTERN_PEACE_SESSION'; nBackLevel: NBackLevel; accuracy: number; duration: number }
  | { type: 'SCRIPTURE_REVIEWED'; reference: string; recalled: boolean }
  | { type: 'SCRIPTURE_ADDED'; reference: string; text: string; location: string; visualAssociation: string }
  | { type: 'CRISIS_ACCESSED'; resources: string[] }
  | { type: 'APP_OPENED'; timestamp: number }
  | { type: 'NOTIFICATION_RESPONDED'; notificationId: string; action: 'opened' | 'dismissed' }
  | { type: 'MOOD_CHECK_IN'; mood: MoodLevel; dayNumber: number }
  | { type: 'GAME_UNLOCKED'; gameId: GameId };

// ============================================
// PREDICTIONS & RECOMMENDATIONS
// ============================================

export interface StrugglePrediction {
  probability: number;
  predictedDay: number;
  factors: string[];
  suggestedPrevention: Intervention[];
}

export interface BreakthroughOpportunity {
  type: BreakthroughType;
  probability: number;
  suggestedAction: string;
}

export interface Intervention {
  type: 'GAME_SUGGESTION' | 'NOTIFICATION' | 'CONTENT_HIGHLIGHT' | 'CRISIS_PREP';
  priority: InterventionPriority;
  game?: GameId;
  message?: string;
  reason: string;
  timing: InterventionTiming;
  specificTime?: string;
}

export interface CrossGameInsight {
  source: GameId;
  target: GameId | 'all';
  insight: string;
  action: string;
}

// ============================================
// INFERENCE
// ============================================

export interface InferenceRequest {
  task: 'compassion_score' | 'distortion_detect' | 'journal_insight' | 'mood_detect' | 'recommendation';
  input: string;
  urgency: 'immediate' | 'background';
  requiresHighQuality: boolean;
}

export interface InferenceResult {
  output: any;
  method: InferenceMethod;
  confidence: number;
  latencyMs: number;
}

// ============================================
// SMART NOTIFICATIONS
// ============================================

export interface SmartNotification {
  id: string;
  message: string;
  scheduledFor: number;
  reason: string;
  fallbackTime: number;
  maxAttempts: number;
  requiresResponse: boolean;
  delivered: boolean;
  respondedAt?: number;
}

// ============================================
// FEEDBACK LOOP ARCHITECTURE
// ============================================

/**
 * The Feedback Loop enables proactive intelligence by:
 * 1. Observing user behavior (private, on-device)
 * 2. Detecting patterns (emotional, cognitive, behavioral)
 * 3. Generating insights (rule-based + SLM)
 * 4. Surfacing interventions (at optimal times)
 * 5. Measuring outcomes (did it help?)
 * 6. Adapting recommendations (learning from results)
 */

export interface FeedbackLoop {
  // What we observed
  observation: {
    timestamp: number;
    source: 'journal' | 'game' | 'devotional' | 'behavior';
    rawData: string; // Never leaves device
    metrics: Record<string, number>;
  };

  // What pattern we detected
  detection: {
    patternType: PsychologicalPattern;
    confidence: number;
    evidence: string[];
  };

  // What intervention we suggested
  intervention: Intervention | null;

  // What happened after
  outcome: {
    interventionTaken: boolean;
    resultObserved: boolean;
    improvementScore: number; // -10 to +10
    userFeedback?: 'helpful' | 'not_helpful' | 'skip';
  } | null;
}

// ============================================
// PSYCHOLOGICAL THEORIES (Evidence-Based)
// ============================================

/**
 * DISCLAIMER: Tea With God is an educational wellness app.
 * It is NOT a substitute for professional mental health treatment.
 * Always consult a qualified healthcare provider for medical advice.
 *
 * These patterns are educational tools based on established research.
 */

export type PsychologicalPattern =
  // Cognitive Behavioral Therapy (CBT)
  | 'cognitive_distortion'
  | 'automatic_negative_thought'
  | 'core_belief_activated'

  // Polyvagal Theory
  | 'ventral_vagal_engagement' // Social engagement, safety
  | 'sympathetic_activation' // Fight/flight
  | 'dorsal_vagal_shutdown' // Freeze, dissociation

  // Attachment Theory
  | 'attachment_anxiety'
  | 'attachment_avoidance'
  | 'secure_base_seeking'

  // Trauma-Informed Care
  | 'hypervigilance'
  | 'emotional_flashback'
  | 'window_of_tolerance_breach'
  | 'grounding_needed'

  // Positive Psychology
  | 'gratitude_practice'
  | 'broaden_and_build'
  | 'savoring_moment'

  // Mindfulness-Based Approaches
  | 'present_moment_awareness'
  | 'non_judgmental_observation'
  | 'body_awareness'

  // Acceptance & Commitment Therapy (ACT)
  | 'experiential_avoidance'
  | 'cognitive_fusion'
  | 'values_clarification'

  // Self-Compassion Research
  | 'self_criticism_loop'
  | 'common_humanity_recognition'
  | 'mindful_self_compassion';

export interface PsychologicalTheory {
  id: string;
  name: string;
  yearEstablished: number;
  evidenceLevel: 'strong' | 'moderate' | 'emerging';
  applicablePatterns: PsychologicalPattern[];
  disclaimer: string;
}

// The theories we draw from (all evidence-based)
export const SUPPORTED_THEORIES: PsychologicalTheory[] = [
  {
    id: 'cbt',
    name: 'Cognitive Behavioral Therapy',
    yearEstablished: 1960,
    evidenceLevel: 'strong',
    applicablePatterns: ['cognitive_distortion', 'automatic_negative_thought', 'core_belief_activated'],
    disclaimer: 'CBT techniques are educational. For clinical treatment, consult a licensed therapist.',
  },
  {
    id: 'polyvagal',
    name: 'Polyvagal Theory',
    yearEstablished: 1994,
    evidenceLevel: 'moderate',
    applicablePatterns: ['ventral_vagal_engagement', 'sympathetic_activation', 'dorsal_vagal_shutdown'],
    disclaimer: 'Nervous system education. Not a diagnostic tool.',
  },
  {
    id: 'trauma_informed',
    name: 'Trauma-Informed Care',
    yearEstablished: 1992,
    evidenceLevel: 'strong',
    applicablePatterns: ['hypervigilance', 'emotional_flashback', 'window_of_tolerance_breach', 'grounding_needed'],
    disclaimer: 'Trauma recovery requires professional support. This app provides education only.',
  },
  {
    id: 'positive_psychology',
    name: 'Positive Psychology',
    yearEstablished: 1998,
    evidenceLevel: 'strong',
    applicablePatterns: ['gratitude_practice', 'broaden_and_build', 'savoring_moment'],
    disclaimer: 'Wellbeing practices for educational purposes.',
  },
  {
    id: 'self_compassion',
    name: 'Self-Compassion Research',
    yearEstablished: 2003,
    evidenceLevel: 'strong',
    applicablePatterns: ['self_criticism_loop', 'common_humanity_recognition', 'mindful_self_compassion'],
    disclaimer: 'Self-compassion education. Not therapy.',
  },
];

// ============================================
// PRIVATE JOURNAL ANALYSIS (On-Device Only)
// ============================================

export interface JournalAnalysis {
  // Never stored, computed on-the-fly
  entryId: string;
  timestamp: number;

  // Emotional indicators
  mood: MoodLevel;
  emotionalTone: 'positive' | 'negative' | 'mixed' | 'neutral';
  emotionWords: string[]; // e.g., ['anxious', 'hopeful']

  // Cognitive indicators
  distortionsDetected: CognitiveDistortion[];
  selfCriticalStatements: number;
  selfCompassionStatements: number;

  // Psychological patterns
  patternsDetected: PsychologicalPattern[];

  // Proactive suggestions (never intrusive)
  suggestedGames: GameId[];
  suggestedReason: string;

  // Privacy guarantee
  rawContentStored: false; // Always false - we only store analysis
}

// ============================================
// APP DISCLAIMER (Required display)
// ============================================

export const APP_DISCLAIMER = `
Tea With God is a wellness and educational application.

IMPORTANT: This app is NOT a substitute for professional mental health
treatment. The content, exercises, and insights provided are for
educational purposes only.

If you are experiencing a mental health crisis, please contact:
- Emergency Services: 10111 (South Africa)
- SADAG Mental Health Line: 0800 567 567
- Lifeline South Africa: 0861 322 322

Always consult a qualified healthcare provider for medical advice,
diagnosis, or treatment. Never disregard professional medical advice
or delay seeking it because of something you have read in this app.

By using this app, you acknowledge that the developers are not
licensed mental health professionals and that the app is intended
for personal wellness education only.
`;

export const CRISIS_DISCLAIMER = `
If you are in immediate danger, please call emergency services: 10111

This app provides educational resources, not crisis intervention.
For 24/7 mental health support in South Africa:
- SADAG: 0800 567 567 (toll-free)
- Lifeline: 0861 322 322
`;
