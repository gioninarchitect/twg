/**
 * Game Data Persistence Service
 * Handles saving and loading brain game data to AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  SCRIPTURE_PALACE: '@twg:scripture_palace',
  BREATHING_PREFERENCES: '@twg:breathing_prefs',
  GRATITUDE_HISTORY: '@twg:gratitude_history',
  GAME_STATS: '@twg:game_stats',
  PATTERN_PEACE: '@twg:pattern_peace',
  THOUGHT_DETECTIVE: '@twg:thought_detective',
} as const;

// ============================================
// INTERFACES
// ============================================

export interface StoredScripture {
  id: string;
  reference: string;
  text: string;
  roomId: string;
  visualAssociation: string;
  dateAdded: number;
  timesReviewed: number;
  lastReviewed: number | null;
  mastered: boolean;
  masteryLevel: 1 | 2 | 3 | 4 | 5;
  nextReviewDate: number;
  easeFactor: number;
}

export interface BreathingPreferences {
  selectedPattern: string;
  selectedCycles: number;
  audioGuidanceEnabled: boolean;
  lastUsed: number;
}

export interface GratitudeEntry {
  date: number;
  dayNumber: number;
  gratitudes: string[];
}

export interface GameStats {
  lastPlayed: Record<string, number>;
  totalSessions: Record<string, number>;
  streakDays: number;
  lastStreakDate: string;
}

export interface PatternPeaceData {
  completedPatterns: string[];
  highScores: Record<string, number>;
  lastPlayed: number;
}

export interface ThoughtDetectiveData {
  savedThoughts: Array<{
    id: string;
    originalThought: string;
    reframedThought: string;
    distortionType: string;
    dateCreated: number;
  }>;
  lastPlayed: number;
}

// ============================================
// SCRIPTURE PALACE
// ============================================

export async function saveScripturePalace(scriptures: StoredScripture[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SCRIPTURE_PALACE, JSON.stringify(scriptures));
  } catch (error) {
    console.error('Error saving scripture palace data:', error);
  }
}

export async function loadScripturePalace(): Promise<StoredScripture[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SCRIPTURE_PALACE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading scripture palace data:', error);
  }
  return [];
}

// ============================================
// BREATHING PREFERENCES
// ============================================

export async function saveBreathingPreferences(prefs: BreathingPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BREATHING_PREFERENCES, JSON.stringify(prefs));
  } catch (error) {
    console.error('Error saving breathing preferences:', error);
  }
}

export async function loadBreathingPreferences(): Promise<BreathingPreferences | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BREATHING_PREFERENCES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading breathing preferences:', error);
  }
  return null;
}

// ============================================
// GRATITUDE HISTORY
// ============================================

export async function saveGratitudeEntry(entry: GratitudeEntry): Promise<void> {
  try {
    const history = await loadGratitudeHistory();
    history.push(entry);
    // Keep only last 40 entries (one per day of the journey)
    const trimmed = history.slice(-40);
    await AsyncStorage.setItem(STORAGE_KEYS.GRATITUDE_HISTORY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving gratitude entry:', error);
  }
}

export async function loadGratitudeHistory(): Promise<GratitudeEntry[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GRATITUDE_HISTORY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading gratitude history:', error);
  }
  return [];
}

// ============================================
// GAME STATS
// ============================================

export async function saveGameStats(stats: GameStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving game stats:', error);
  }
}

export async function loadGameStats(): Promise<GameStats> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading game stats:', error);
  }
  return {
    lastPlayed: {},
    totalSessions: {},
    streakDays: 0,
    lastStreakDate: '',
  };
}

export async function recordGameSession(gameId: string): Promise<GameStats> {
  const stats = await loadGameStats();
  const today = new Date().toISOString().split('T')[0];

  // Update last played
  stats.lastPlayed[gameId] = Date.now();

  // Update total sessions
  stats.totalSessions[gameId] = (stats.totalSessions[gameId] || 0) + 1;

  // Update streak
  if (stats.lastStreakDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (stats.lastStreakDate === yesterdayStr) {
      stats.streakDays += 1;
    } else if (stats.lastStreakDate !== today) {
      stats.streakDays = 1;
    }
    stats.lastStreakDate = today;
  }

  await saveGameStats(stats);
  return stats;
}

// ============================================
// PATTERN PEACE
// ============================================

export async function savePatternPeaceData(data: PatternPeaceData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PATTERN_PEACE, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving pattern peace data:', error);
  }
}

export async function loadPatternPeaceData(): Promise<PatternPeaceData> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PATTERN_PEACE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading pattern peace data:', error);
  }
  return {
    completedPatterns: [],
    highScores: {},
    lastPlayed: 0,
  };
}

// ============================================
// THOUGHT DETECTIVE
// ============================================

export async function saveThoughtDetectiveData(data: ThoughtDetectiveData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THOUGHT_DETECTIVE, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving thought detective data:', error);
  }
}

export async function loadThoughtDetectiveData(): Promise<ThoughtDetectiveData> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.THOUGHT_DETECTIVE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading thought detective data:', error);
  }
  return {
    savedThoughts: [],
    lastPlayed: 0,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function clearAllGameData(): Promise<void> {
  try {
    await Promise.all(
      Object.values(STORAGE_KEYS).map(key => AsyncStorage.removeItem(key))
    );
  } catch (error) {
    console.error('Error clearing game data:', error);
  }
}

export async function exportGameData(): Promise<Record<string, unknown>> {
  const [
    scripturePalace,
    breathingPrefs,
    gratitudeHistory,
    gameStats,
    patternPeace,
    thoughtDetective,
  ] = await Promise.all([
    loadScripturePalace(),
    loadBreathingPreferences(),
    loadGratitudeHistory(),
    loadGameStats(),
    loadPatternPeaceData(),
    loadThoughtDetectiveData(),
  ]);

  return {
    scripturePalace,
    breathingPrefs,
    gratitudeHistory,
    gameStats,
    patternPeace,
    thoughtDetective,
    exportedAt: new Date().toISOString(),
  };
}
