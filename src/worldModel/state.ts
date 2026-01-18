/**
 * World Model State Manager
 * Core state management for the intelligent healing engine
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, TABLES, isOnline, getCurrentUserId } from '../services/supabase';
import {
  UserWorldState,
  JourneyState,
  EmotionalState,
  CognitiveState,
  PhysicalState,
  BehavioralState,
  SpiritualState,
  BrainGamesState,
  WorldModelEvent,
  MoodLevel,
  TimeOfDay,
  GameId,
  TensionEntry,
  MoodEntry,
  CognitiveDistortion,
  GameEngagement,
  GratitudeEntry,
  ScriptureMemory,
} from './types';

// Storage key prefix (userId appended at runtime)
const WORLD_MODEL_STORAGE_KEY_PREFIX = '@twg_world_model_';

// ============================================
// INITIAL STATE FACTORY
// ============================================

export function createInitialWorldState(userId: string): UserWorldState {
  const now = Date.now();

  return {
    userId,
    createdAt: now,
    lastUpdated: now,
    syncEnabled: false,

    journey: {
      currentDay: 1,
      daysCompleted: [],
      journeyStartedAt: now,
      expectedCompletionDate: now + 40 * 24 * 60 * 60 * 1000,
      streakDays: 0,
      longestStreak: 0,
      missedDays: [],
    },

    emotional: {
      currentMood: 5,
      moodHistory: [],
      dominantDistortions: [],
      triggerPatterns: [],
      emotionalResilience: 50,
      lastCrisisAccess: null,
    },

    cognitive: {
      workingMemoryLevel: 1,
      focusCapacity: 50,
      reframingAbility: 5,
      scriptureRetention: 0,
      learningVelocity: 1,
    },

    physical: {
      tensionHotspots: [],
      tensionHistory: [],
      breathingCompliance: 0,
      averageSessionDuration: 0,
      preferredBreathingPattern: '4-7-8',
      bodyAwareness: 50,
    },

    behavioral: {
      preferredTimeOfDay: 'morning',
      averageSessionLength: 0,
      engagementByGame: [],
      completionRates: {} as Record<GameId, number>,
      lastActiveAt: now,
      notificationResponseRate: 0.5,
    },

    spiritual: {
      prayerEngagement: 50,
      scripturesMemorized: 0,
      journalDepth: 0,
      reflectionQuality: 50,
      breakthroughMoments: [],
    },

    brainGames: {
      hasAccess: false,
      unlockedGames: [],
      gratitudeEntries: [],
      scriptureMemories: [],
      gardenLevel: 1,
      totalBreathingMinutes: 0,
      totalThoughtsReframed: 0,
      totalBodyScans: 0,
    },
  };
}

// ============================================
// STATE PERSISTENCE
// ============================================

export async function saveWorldModel(state: UserWorldState): Promise<void> {
  try {
    const storageKey = WORLD_MODEL_STORAGE_KEY_PREFIX + state.userId;
    const updated = { ...state, lastUpdated: Date.now() };
    // Save locally first
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    // Sync to cloud
    syncWorldModelToCloud(updated);
  } catch (error) {
    console.error('Failed to save world model:', error);
  }
}

async function syncWorldModelToCloud(state: UserWorldState): Promise<void> {
  try {
    const online = await isOnline();
    const userId = await getCurrentUserId();

    if (!online || !userId) return;

    const { error } = await supabase
      .from(TABLES.WORLD_MODEL_STATE)
      .upsert({
        user_id: userId,
        state: state,
        version: 1,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.log('World model cloud sync deferred:', error.message);
    }
  } catch (error) {
    console.log('World model cloud sync failed:', error);
  }
}

export async function loadWorldModel(userId: string): Promise<UserWorldState> {
  try {
    const storageKey = WORLD_MODEL_STORAGE_KEY_PREFIX + userId;
    const stored = await AsyncStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load world model:', error);
  }
  return createInitialWorldState(userId);
}

export async function clearWorldModel(userId: string): Promise<void> {
  const storageKey = WORLD_MODEL_STORAGE_KEY_PREFIX + userId;
  await AsyncStorage.removeItem(storageKey);
}

// ============================================
// STATE REDUCERS
// ============================================

export function worldModelReducer(
  state: UserWorldState,
  event: WorldModelEvent
): UserWorldState {
  const now = Date.now();

  switch (event.type) {
    case 'DEVOTIONAL_COMPLETED':
      return handleDevotionalCompleted(state, event, now);

    case 'JOURNAL_ENTRY':
      return handleJournalEntry(state, event, now);

    case 'BREATHING_SESSION':
      return handleBreathingSession(state, event, now);

    case 'GRATITUDE_ENTRY':
      return handleGratitudeEntry(state, event, now);

    case 'THOUGHT_REFRAMED':
      return handleThoughtReframed(state, event, now);

    case 'BODY_SCAN_COMPLETED':
      return handleBodyScanCompleted(state, event, now);

    case 'PATTERN_PEACE_SESSION':
      return handlePatternPeaceSession(state, event, now);

    case 'SCRIPTURE_REVIEWED':
      return handleScriptureReviewed(state, event, now);

    case 'SCRIPTURE_ADDED':
      return handleScriptureAdded(state, event, now);

    case 'CRISIS_ACCESSED':
      return handleCrisisAccessed(state, event, now);

    case 'APP_OPENED':
      return handleAppOpened(state, event, now);

    case 'NOTIFICATION_RESPONDED':
      return handleNotificationResponded(state, event, now);

    case 'MOOD_CHECK_IN':
      return handleMoodCheckIn(state, event, now);

    case 'GAME_UNLOCKED':
      return handleGameUnlocked(state, event, now);

    default:
      return state;
  }
}

// ============================================
// EVENT HANDLERS
// ============================================

function handleDevotionalCompleted(
  state: UserWorldState,
  event: { type: 'DEVOTIONAL_COMPLETED'; dayNumber: number; scrollDepth: number; duration: number },
  now: number
): UserWorldState {
  const daysCompleted = state.journey.daysCompleted.includes(event.dayNumber)
    ? state.journey.daysCompleted
    : [...state.journey.daysCompleted, event.dayNumber];

  const streakDays = calculateStreak(daysCompleted, now);
  const longestStreak = Math.max(state.journey.longestStreak, streakDays);

  // Next day is current + 1, max 40
  const nextDay = Math.min(event.dayNumber + 1, 40);

  return {
    ...state,
    lastUpdated: now,
    journey: {
      ...state.journey,
      currentDay: nextDay,
      daysCompleted,
      streakDays,
      longestStreak,
    },
    behavioral: {
      ...state.behavioral,
      lastActiveAt: now,
      averageSessionLength: updateMovingAverage(
        state.behavioral.averageSessionLength,
        event.duration,
        daysCompleted.length
      ),
    },
  };
}

function handleJournalEntry(
  state: UserWorldState,
  event: { type: 'JOURNAL_ENTRY'; dayNumber: number; content: string; wordCount: number },
  now: number
): UserWorldState {
  // Analyze journal for mood (rule-based, on-device)
  const inferredMood = inferMoodFromText(event.content);
  const newMoodEntry: MoodEntry = {
    timestamp: now,
    level: inferredMood,
    source: 'journal',
    dayNumber: event.dayNumber,
  };

  // Detect cognitive distortions
  const distortions = detectDistortionsFromText(event.content);

  // Update dominant distortions
  const updatedDistortions = updateDistortionRanking(
    state.emotional.dominantDistortions,
    distortions
  );

  return {
    ...state,
    lastUpdated: now,
    emotional: {
      ...state.emotional,
      currentMood: inferredMood,
      moodHistory: [...state.emotional.moodHistory.slice(-13), newMoodEntry],
      dominantDistortions: updatedDistortions,
    },
    spiritual: {
      ...state.spiritual,
      journalDepth: updateMovingAverage(
        state.spiritual.journalDepth,
        event.wordCount,
        state.journey.daysCompleted.length || 1
      ),
    },
    behavioral: {
      ...state.behavioral,
      lastActiveAt: now,
    },
  };
}

function handleBreathingSession(
  state: UserWorldState,
  event: { type: 'BREATHING_SESSION'; pattern: string; duration: number; completed: boolean },
  now: number
): UserWorldState {
  const totalBreathingMinutes = state.brainGames.totalBreathingMinutes + event.duration;

  // Update game engagement
  const engagementByGame = updateGameEngagement(
    state.behavioral.engagementByGame,
    'breathing',
    event.duration,
    event.completed ? 100 : 50
  );

  // Calculate breathing compliance
  const breathingCompliance = calculateBreathingCompliance(engagementByGame);

  return {
    ...state,
    lastUpdated: now,
    physical: {
      ...state.physical,
      breathingCompliance,
      preferredBreathingPattern: event.pattern,
      averageSessionDuration: updateMovingAverage(
        state.physical.averageSessionDuration,
        event.duration,
        engagementByGame.find(g => g.gameId === 'breathing')?.totalSessions || 1
      ),
    },
    behavioral: {
      ...state.behavioral,
      lastActiveAt: now,
      engagementByGame,
    },
    brainGames: {
      ...state.brainGames,
      totalBreathingMinutes,
    },
  };
}

function handleGratitudeEntry(
  state: UserWorldState,
  event: { type: 'GRATITUDE_ENTRY'; gratitudes: string[]; dayNumber: number },
  now: number
): UserWorldState {
  const newEntry: GratitudeEntry = {
    id: `gratitude_${now}`,
    timestamp: now,
    dayNumber: event.dayNumber,
    gratitudes: event.gratitudes,
  };

  // Calculate garden level based on total entries
  const totalEntries = state.brainGames.gratitudeEntries.length + 1;
  const gardenLevel = calculateGardenLevel(totalEntries);

  // Update game engagement
  const engagementByGame = updateGameEngagement(
    state.behavioral.engagementByGame,
    'gratitude',
    2, // ~2 minutes per entry
    100
  );

  return {
    ...state,
    lastUpdated: now,
    behavioral: {
      ...state.behavioral,
      lastActiveAt: now,
      engagementByGame,
    },
    brainGames: {
      ...state.brainGames,
      gratitudeEntries: [...state.brainGames.gratitudeEntries, newEntry],
      gardenLevel,
    },
  };
}

function handleThoughtReframed(
  state: UserWorldState,
  event: {
    type: 'THOUGHT_REFRAMED';
    distortion: string;
    originalThought: string;
    reframedThought: string;
    compassionScore: number;
  },
  now: number
): UserWorldState {
  // Update distortion ranking
  const updatedDistortions = updateDistortionRanking(
    state.emotional.dominantDistortions,
    [event.distortion]
  );

  // Update reframing ability (moving average of compassion scores)
  const reframingAbility = updateMovingAverage(
    state.cognitive.reframingAbility,
    event.compassionScore,
    state.brainGames.totalThoughtsReframed + 1
  );

  // Update emotional resilience based on reframing practice
  const emotionalResilience = calculateEmotionalResilience({
    ...state,
    cognitive: { ...state.cognitive, reframingAbility },
  });

  // Update game engagement
  const engagementByGame = updateGameEngagement(
    state.behavioral.engagementByGame,
    'thought_detective',
    3, // ~3 minutes per reframe
    event.compassionScore * 10
  );

  return {
    ...state,
    lastUpdated: now,
    emotional: {
      ...state.emotional,
      dominantDistortions: updatedDistortions,
      emotionalResilience,
    },
    cognitive: {
      ...state.cognitive,
      reframingAbility,
    },
    behavioral: {
      ...state.behavioral,
      lastActiveAt: now,
      engagementByGame,
    },
    brainGames: {
      ...state.brainGames,
      totalThoughtsReframed: state.brainGames.totalThoughtsReframed + 1,
    },
  };
}

function handleBodyScanCompleted(
  state: UserWorldState,
  event: { type: 'BODY_SCAN_COMPLETED'; tensionMap: TensionEntry; duration: number },
  now: number
): UserWorldState {
  // Update tension history
  const tensionHistory = [...state.physical.tensionHistory.slice(-13), event.tensionMap];

  // Calculate hotspots from history
  const tensionHotspots = calculateTensionHotspots(tensionHistory);

  // Calculate body awareness improvement
  const releaseSuccess = event.tensionMap.releaseSuccess;
  const bodyAwareness = updateMovingAverage(
    state.physical.bodyAwareness,
    releaseSuccess,
    state.brainGames.totalBodyScans + 1
  );

  // Update game engagement
  const engagementByGame = updateGameEngagement(
    state.behavioral.engagementByGame,
    'body_scan',
    event.duration,
    releaseSuccess
  );

  return {
    ...state,
    lastUpdated: now,
    physical: {
      ...state.physical,
      tensionHistory,
      tensionHotspots,
      bodyAwareness,
    },
    behavioral: {
      ...state.behavioral,
      lastActiveAt: now,
      engagementByGame,
    },
    brainGames: {
      ...state.brainGames,
      totalBodyScans: state.brainGames.totalBodyScans + 1,
    },
  };
}

function handlePatternPeaceSession(
  state: UserWorldState,
  event: { type: 'PATTERN_PEACE_SESSION'; nBackLevel: 1 | 2 | 3; accuracy: number; duration: number },
  now: number
): UserWorldState {
  // Update working memory level if accuracy is high
  const workingMemoryLevel =
    event.accuracy >= 80 && event.nBackLevel >= state.cognitive.workingMemoryLevel
      ? Math.min(3, event.nBackLevel) as 1 | 2 | 3
      : state.cognitive.workingMemoryLevel;

  // Update focus capacity
  const focusCapacity = updateMovingAverage(
    state.cognitive.focusCapacity,
    event.accuracy,
    10
  );

  // Update game engagement
  const engagementByGame = updateGameEngagement(
    state.behavioral.engagementByGame,
    'pattern_peace',
    event.duration,
    event.accuracy
  );

  return {
    ...state,
    lastUpdated: now,
    cognitive: {
      ...state.cognitive,
      workingMemoryLevel,
      focusCapacity,
    },
    behavioral: {
      ...state.behavioral,
      lastActiveAt: now,
      engagementByGame,
    },
  };
}

function handleScriptureReviewed(
  state: UserWorldState,
  event: { type: 'SCRIPTURE_REVIEWED'; reference: string; recalled: boolean },
  now: number
): UserWorldState {
  const scriptureMemories = state.brainGames.scriptureMemories.map(mem => {
    if (mem.reference === event.reference) {
      const reviewCount = mem.reviewCount + 1;
      return {
        ...mem,
        reviewCount,
        lastReviewed: now,
        mastery: calculateScriptureMastery(reviewCount, event.recalled),
      };
    }
    return mem;
  });

  // Calculate overall retention
  const totalReviews = scriptureMemories.reduce((sum, m) => sum + m.reviewCount, 0);
  const goldMastery = scriptureMemories.filter(m => m.mastery === 'gold').length;
  const scriptureRetention = scriptureMemories.length > 0
    ? (goldMastery / scriptureMemories.length) * 100
    : 0;

  // Update game engagement
  const engagementByGame = updateGameEngagement(
    state.behavioral.engagementByGame,
    'scripture_palace',
    2,
    event.recalled ? 100 : 50
  );

  return {
    ...state,
    lastUpdated: now,
    cognitive: {
      ...state.cognitive,
      scriptureRetention,
    },
    behavioral: {
      ...state.behavioral,
      lastActiveAt: now,
      engagementByGame,
    },
    brainGames: {
      ...state.brainGames,
      scriptureMemories,
    },
    spiritual: {
      ...state.spiritual,
      scripturesMemorized: scriptureMemories.filter(m => m.mastery === 'gold').length,
    },
  };
}

function handleScriptureAdded(
  state: UserWorldState,
  event: {
    type: 'SCRIPTURE_ADDED';
    reference: string;
    text: string;
    location: string;
    visualAssociation: string;
  },
  now: number
): UserWorldState {
  const newMemory: ScriptureMemory = {
    id: `scripture_${now}`,
    reference: event.reference,
    text: event.text,
    location: event.location,
    visualAssociation: event.visualAssociation,
    reviewCount: 0,
    lastReviewed: now,
    mastery: 'learning',
  };

  return {
    ...state,
    lastUpdated: now,
    brainGames: {
      ...state.brainGames,
      scriptureMemories: [...state.brainGames.scriptureMemories, newMemory],
    },
  };
}

function handleCrisisAccessed(
  state: UserWorldState,
  event: { type: 'CRISIS_ACCESSED'; resources: string[] },
  now: number
): UserWorldState {
  return {
    ...state,
    lastUpdated: now,
    emotional: {
      ...state.emotional,
      lastCrisisAccess: now,
    },
  };
}

function handleAppOpened(
  state: UserWorldState,
  event: { type: 'APP_OPENED'; timestamp: number },
  now: number
): UserWorldState {
  // Detect preferred time of day based on usage patterns
  const hour = new Date(event.timestamp).getHours();
  const timeOfDay = getTimeOfDay(hour);

  return {
    ...state,
    lastUpdated: now,
    behavioral: {
      ...state.behavioral,
      lastActiveAt: now,
      preferredTimeOfDay: timeOfDay,
    },
  };
}

function handleNotificationResponded(
  state: UserWorldState,
  event: { type: 'NOTIFICATION_RESPONDED'; notificationId: string; action: 'opened' | 'dismissed' },
  now: number
): UserWorldState {
  const responded = event.action === 'opened';
  const newRate = updateMovingAverage(
    state.behavioral.notificationResponseRate,
    responded ? 1 : 0,
    20
  );

  return {
    ...state,
    lastUpdated: now,
    behavioral: {
      ...state.behavioral,
      notificationResponseRate: newRate,
    },
  };
}

function handleMoodCheckIn(
  state: UserWorldState,
  event: { type: 'MOOD_CHECK_IN'; mood: MoodLevel; dayNumber: number },
  now: number
): UserWorldState {
  const newMoodEntry: MoodEntry = {
    timestamp: now,
    level: event.mood,
    source: 'check_in',
    dayNumber: event.dayNumber,
  };

  return {
    ...state,
    lastUpdated: now,
    emotional: {
      ...state.emotional,
      currentMood: event.mood,
      moodHistory: [...state.emotional.moodHistory.slice(-13), newMoodEntry],
    },
  };
}

function handleGameUnlocked(
  state: UserWorldState,
  event: { type: 'GAME_UNLOCKED'; gameId: GameId },
  now: number
): UserWorldState {
  if (state.brainGames.unlockedGames.includes(event.gameId)) {
    return state;
  }

  return {
    ...state,
    lastUpdated: now,
    brainGames: {
      ...state.brainGames,
      unlockedGames: [...state.brainGames.unlockedGames, event.gameId],
    },
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateStreak(daysCompleted: number[], now: number): number {
  if (daysCompleted.length === 0) return 0;

  const sorted = [...daysCompleted].sort((a, b) => b - a);
  let streak = 1;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] - sorted[i + 1] === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function updateMovingAverage(current: number, newValue: number, count: number): number {
  const weight = Math.min(0.3, 1 / Math.max(count, 1));
  return current * (1 - weight) + newValue * weight;
}

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function updateGameEngagement(
  current: GameEngagement[],
  gameId: GameId,
  duration: number,
  score: number
): GameEngagement[] {
  const existing = current.find(g => g.gameId === gameId);

  if (existing) {
    return current.map(g =>
      g.gameId === gameId
        ? {
            ...g,
            totalSessions: g.totalSessions + 1,
            totalMinutes: g.totalMinutes + duration,
            averageScore: updateMovingAverage(g.averageScore, score, g.totalSessions),
            lastPlayed: Date.now(),
            streak: g.streak + 1, // Simplified streak
          }
        : g
    );
  }

  return [
    ...current,
    {
      gameId,
      totalSessions: 1,
      totalMinutes: duration,
      averageScore: score,
      lastPlayed: Date.now(),
      streak: 1,
    },
  ];
}

function calculateGardenLevel(totalEntries: number): 1 | 2 | 3 | 4 | 5 {
  if (totalEntries >= 35) return 5; // Sanctuary
  if (totalEntries >= 21) return 4; // Blooming
  if (totalEntries >= 14) return 3; // Flowers
  if (totalEntries >= 7) return 2; // Sprouts
  return 1; // Seeds
}

function calculateScriptureMastery(
  reviewCount: number,
  lastRecalled: boolean
): 'learning' | 'bronze' | 'silver' | 'gold' {
  if (reviewCount >= 20 && lastRecalled) return 'gold';
  if (reviewCount >= 10) return 'silver';
  if (reviewCount >= 5) return 'bronze';
  return 'learning';
}

function calculateBreathingCompliance(engagementByGame: GameEngagement[]): number {
  const breathing = engagementByGame.find(g => g.gameId === 'breathing');
  if (!breathing) return 0;

  // Assume target is 1 session per day, calculate based on streak
  return Math.min(1, breathing.streak / 7);
}

function calculateTensionHotspots(history: TensionEntry[]): import('./types').BodyPart[] {
  const counts: Record<string, number> = {};

  history.forEach(entry => {
    entry.bodyParts.forEach(bp => {
      if (bp.level >= 3) {
        counts[bp.part] = (counts[bp.part] || 0) + 1;
      }
    });
  });

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([part]) => part as import('./types').BodyPart);
}

function calculateEmotionalResilience(state: UserWorldState): number {
  const weights = {
    moodStability: 0.25,
    reframingAbility: 0.25,
    breathingConsistency: 0.20,
    bodyAwareness: 0.15,
    streakMaintenance: 0.15,
  };

  const moodVariance = calculateMoodVariance(state.emotional.moodHistory);
  const moodStability = Math.max(0, 100 - moodVariance * 20);
  const reframing = state.cognitive.reframingAbility * 10;
  const breathing = state.physical.breathingCompliance * 100;
  const body = state.physical.bodyAwareness;
  const streak = Math.min(100, (state.journey.streakDays / 7) * 100);

  return (
    moodStability * weights.moodStability +
    reframing * weights.reframingAbility +
    breathing * weights.breathingConsistency +
    body * weights.bodyAwareness +
    streak * weights.streakMaintenance
  );
}

function calculateMoodVariance(history: MoodEntry[]): number {
  if (history.length < 2) return 0;

  const levels = history.map(m => m.level);
  const mean = levels.reduce((a, b) => a + b, 0) / levels.length;
  const variance = levels.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / levels.length;

  return Math.sqrt(variance);
}

function updateDistortionRanking(
  current: CognitiveDistortion[],
  newDistortions: string[]
): CognitiveDistortion[] {
  const updated = [...current];

  newDistortions.forEach(distortionId => {
    const existing = updated.find(d => d.id === distortionId);
    if (existing) {
      existing.frequency++;
    } else {
      updated.push({
        id: distortionId,
        name: getDistortionName(distortionId),
        frequency: 1,
        reframeSuccessRate: 0,
      });
    }
  });

  return updated.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
}

function getDistortionName(id: string): string {
  const names: Record<string, string> = {
    all_or_nothing: 'All-or-Nothing Thinking',
    catastrophizing: 'Catastrophizing',
    should_statements: 'Should Statements',
    mind_reading: 'Mind Reading',
    fortune_telling: 'Fortune Telling',
    labeling: 'Labeling',
    emotional_reasoning: 'Emotional Reasoning',
    overgeneralization: 'Overgeneralization',
    personalization: 'Personalization',
    mental_filtering: 'Mental Filtering',
  };
  return names[id] || id;
}

// ============================================
// INFERENCE HELPERS (Rule-Based)
// ============================================

function inferMoodFromText(text: string): MoodLevel {
  const positiveWords = [
    'happy', 'grateful', 'blessed', 'peaceful', 'hopeful', 'better', 'good',
    'joy', 'thankful', 'calm', 'love', 'excited', 'proud', 'content',
  ];
  const negativeWords = [
    'sad', 'angry', 'hurt', 'anxious', 'scared', 'lonely', 'overwhelmed',
    'tired', 'frustrated', 'worried', 'afraid', 'depressed', 'hopeless',
  ];

  const words = text.toLowerCase().split(/\s+/);
  let posCount = 0;
  let negCount = 0;

  words.forEach(word => {
    if (positiveWords.some(p => word.includes(p))) posCount++;
    if (negativeWords.some(n => word.includes(n))) negCount++;
  });

  const ratio = (posCount - negCount) / Math.max(words.length, 1);

  if (ratio > 0.08) return 9;
  if (ratio > 0.05) return 8;
  if (ratio > 0.02) return 7;
  if (ratio > 0) return 6;
  if (ratio === 0) return 5;
  if (ratio > -0.02) return 4;
  if (ratio > -0.05) return 3;
  if (ratio > -0.08) return 2;
  return 1;
}

function detectDistortionsFromText(text: string): string[] {
  const distortions: string[] = [];
  const lowerText = text.toLowerCase();

  const patterns: Record<string, RegExp> = {
    all_or_nothing: /\b(always|never|completely|totally|entirely|absolutely|everyone|no one)\b/,
    catastrophizing: /\b(worst|terrible|horrible|disaster|catastrophe|ruined|destroyed|end of|can't handle)\b/,
    should_statements: /\b(should|must|have to|ought to|supposed to|need to)\b/,
    mind_reading: /\b(they think|everyone thinks|people think|knows? (i|I)|must think|probably thinks)\b/,
    fortune_telling: /\b(will (always|never)|going to (fail|mess up|ruin)|won't ever|can't ever)\b/,
    labeling: /\b(i('m| am) (a|an|such a) (failure|loser|idiot|bad|terrible|stupid|worthless))\b/,
  };

  Object.entries(patterns).forEach(([distortion, pattern]) => {
    if (pattern.test(lowerText)) {
      distortions.push(distortion);
    }
  });

  return distortions;
}
