/**
 * Game Data Persistence Service
 * Handles saving and loading brain game data
 * Local-first with Supabase cloud sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, TABLES, isOnline, getCurrentUserId } from './supabase';

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
// CLOUD SYNC HELPER
// ============================================

async function syncGameDataToCloud(field: string, data: unknown): Promise<void> {
  try {
    const online = await isOnline();
    const userId = await getCurrentUserId();

    if (!online || !userId) return;

    // Upsert game data for this user
    const { error } = await supabase
      .from(TABLES.GAME_DATA)
      .upsert({
        user_id: userId,
        [field]: data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.log('Game data cloud sync deferred:', error.message);
    }
  } catch (error) {
    console.log('Game data cloud sync failed:', error);
  }
}

async function loadGameDataFromCloud<T>(field: string): Promise<T | null> {
  try {
    const online = await isOnline();
    const userId = await getCurrentUserId();

    if (!online || !userId) return null;

    const { data, error } = await supabase
      .from(TABLES.GAME_DATA)
      .select(field)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return data[field] as T;
  } catch (error) {
    console.log('Failed to load game data from cloud:', error);
    return null;
  }
}

// ============================================
// SCRIPTURE PALACE
// ============================================

export async function saveScripturePalace(scriptures: StoredScripture[]): Promise<void> {
  try {
    // Save locally first
    await AsyncStorage.setItem(STORAGE_KEYS.SCRIPTURE_PALACE, JSON.stringify(scriptures));
    // Sync to cloud
    syncGameDataToCloud('scripture_palace', scriptures);
  } catch (error) {
    console.error('Error saving scripture palace data:', error);
  }
}

export async function loadScripturePalace(): Promise<StoredScripture[]> {
  try {
    // Try local first
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SCRIPTURE_PALACE);
    if (data) {
      return JSON.parse(data);
    }
    // Fallback to cloud
    const cloudData = await loadGameDataFromCloud<StoredScripture[]>('scripture_palace');
    if (cloudData) {
      // Cache locally
      await AsyncStorage.setItem(STORAGE_KEYS.SCRIPTURE_PALACE, JSON.stringify(cloudData));
      return cloudData;
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
    syncGameDataToCloud('breathing_prefs', prefs);
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
    const cloudData = await loadGameDataFromCloud<BreathingPreferences>('breathing_prefs');
    if (cloudData) {
      await AsyncStorage.setItem(STORAGE_KEYS.BREATHING_PREFERENCES, JSON.stringify(cloudData));
      return cloudData;
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
    syncGameDataToCloud('gratitude_history', trimmed);
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
    const cloudData = await loadGameDataFromCloud<GratitudeEntry[]>('gratitude_history');
    if (cloudData) {
      await AsyncStorage.setItem(STORAGE_KEYS.GRATITUDE_HISTORY, JSON.stringify(cloudData));
      return cloudData;
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
    syncGameDataToCloud('game_stats', stats);
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
    const cloudData = await loadGameDataFromCloud<GameStats>('game_stats');
    if (cloudData) {
      await AsyncStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(cloudData));
      return cloudData;
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

  // Ensure objects exist (defensive coding)
  if (!stats.lastPlayed) stats.lastPlayed = {};
  if (!stats.totalSessions) stats.totalSessions = {};

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
    syncGameDataToCloud('pattern_peace', data);
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
    const cloudData = await loadGameDataFromCloud<PatternPeaceData>('pattern_peace');
    if (cloudData) {
      await AsyncStorage.setItem(STORAGE_KEYS.PATTERN_PEACE, JSON.stringify(cloudData));
      return cloudData;
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
    syncGameDataToCloud('thought_detective', data);
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
    const cloudData = await loadGameDataFromCloud<ThoughtDetectiveData>('thought_detective');
    if (cloudData) {
      await AsyncStorage.setItem(STORAGE_KEYS.THOUGHT_DETECTIVE, JSON.stringify(cloudData));
      return cloudData;
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
// FULL SYNC (pull all from cloud)
// ============================================

export async function syncAllGameDataFromCloud(): Promise<void> {
  try {
    const online = await isOnline();
    const userId = await getCurrentUserId();

    if (!online || !userId) return;

    const { data, error } = await supabase
      .from(TABLES.GAME_DATA)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return;

    // Update local storage with cloud data
    if (data.scripture_palace) {
      await AsyncStorage.setItem(STORAGE_KEYS.SCRIPTURE_PALACE, JSON.stringify(data.scripture_palace));
    }
    if (data.breathing_prefs) {
      await AsyncStorage.setItem(STORAGE_KEYS.BREATHING_PREFERENCES, JSON.stringify(data.breathing_prefs));
    }
    if (data.gratitude_history) {
      await AsyncStorage.setItem(STORAGE_KEYS.GRATITUDE_HISTORY, JSON.stringify(data.gratitude_history));
    }
    if (data.game_stats) {
      await AsyncStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(data.game_stats));
    }
    if (data.pattern_peace) {
      await AsyncStorage.setItem(STORAGE_KEYS.PATTERN_PEACE, JSON.stringify(data.pattern_peace));
    }
    if (data.thought_detective) {
      await AsyncStorage.setItem(STORAGE_KEYS.THOUGHT_DETECTIVE, JSON.stringify(data.thought_detective));
    }

    console.log('Game data synced from cloud');
  } catch (error) {
    console.log('Failed to sync game data from cloud:', error);
  }
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
