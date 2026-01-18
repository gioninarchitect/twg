/**
 * Progress Context - Anti-Shame Progress System
 *
 * Core Philosophy: "A gentle friend, not a demanding taskmaster."
 *
 * Key Principles:
 * - Track "Days Completed" (accumulation), NOT consecutive streaks
 * - NO guilt, NO penalties for missed days
 * - Gentle re-engagement after 14 days of absence
 * - Milestone unlocks reward retention without gamification
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, TABLES, isOnline, getCurrentUserId } from '../services/supabase';

// Hybrid Architecture: Local-first with optional cloud sync
// All data persists locally first, then syncs to Supabase when online

// Storage key prefixes (userId appended at runtime)
const STORAGE_KEY_PREFIXES = {
  PROGRESS: '@twg_progress_',
  LAST_ACTIVE: '@twg_last_active_',
  UNLOCKS: '@twg_unlocks_',
};

// Milestone definitions - unlocks earned through gentle progression
export const MILESTONES = {
  DAY_7: {
    day: 7,
    title: 'First Week Complete',
    unlock: 'Habit Formation Psychology Module',
    description: 'You\'ve shown up for yourself 7 times. That takes courage.',
  },
  DAY_14: {
    day: 14,
    title: 'Two Weeks of Growth',
    unlock: 'Momentum Audio Track',
    description: 'Two weeks of choosing yourself. You\'re building something beautiful.',
  },
  DAY_21: {
    day: 21,
    title: 'The Turning Point',
    unlock: 'Identity Shift Journal Prompts',
    description: 'Three weeks. You\'re not who you were when you started.',
  },
  DAY_40: {
    day: 40,
    title: 'The Becoming',
    unlock: 'Final Prayer & Certificate of Becoming',
    description: 'You did it. Not perfectly. But completely.',
  },
};

// Days that have psychology modules (from PRD)
export const PSYCHOLOGY_DAYS = [1, 7, 14, 15, 21, 22, 28, 35, 40];

// Phase definitions - uses i18n keys for translation
export const PHASES = {
  VALLEY: { nameKey: 'dashboard.phases.valley', days: [1, 14], descriptionKey: 'dashboard.phases.valleyDesc' },
  WAITING: { nameKey: 'dashboard.phases.waiting', days: [15, 21], descriptionKey: 'dashboard.phases.waitingDesc' },
  RISING: { nameKey: 'dashboard.phases.rising', days: [22, 33], descriptionKey: 'dashboard.phases.risingDesc' },
  BECOMING: { nameKey: 'dashboard.phases.becoming', days: [34, 40], descriptionKey: 'dashboard.phases.becomingDesc' },
};

export interface ProgressState {
  // Core progress (Anti-Shame: accumulated, not streaks)
  currentDayIndex: number;           // 0-based: which day user is on (0 = Day 1)
  daysCompleted: number[];           // Array of completed day numbers [1, 2, 3, ...]
  totalDaysCompleted: number;        // Count for display (12/40)

  // Timestamps for re-engagement logic
  lastActiveTimestamp: number;       // Last time user opened app
  journeyStartDate: string;          // When user began

  // Unlocks earned
  unlockedMilestones: string[];      // ['DAY_7', 'DAY_14', ...]

  // Re-engagement state
  showReEngagement: boolean;         // Show gentle "welcome back" modal
  daysSinceLastActive: number;       // For re-engagement logic

  // Current phase
  currentPhase: keyof typeof PHASES;
}

interface ProgressContextType extends ProgressState {
  // Actions
  completeDay: (dayNumber: number) => Promise<void>;
  startDay: (dayNumber: number) => void;
  checkReEngagement: () => void;
  dismissReEngagement: (choice: 'continue' | 'restart') => void;
  resetProgress: () => Promise<void>;

  // Helpers
  isDayCompleted: (dayNumber: number) => boolean;
  isDayLocked: (dayNumber: number) => boolean;
  hasPsychologyModule: (dayNumber: number) => boolean;
  getMilestoneForDay: (dayNumber: number) => typeof MILESTONES.DAY_7 | null;
  getNewlyUnlockedMilestone: () => typeof MILESTONES.DAY_7 | null;
  getPhaseForDay: (dayNumber: number) => keyof typeof PHASES;
  getKintsugiProgress: () => number; // 0-100 for visual

  // State
  isLoading: boolean;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

interface ProgressProviderProps {
  children: ReactNode;
  userId: string;
}

export function ProgressProvider({ children, userId }: ProgressProviderProps) {
  // User-specific storage keys
  const STORAGE_KEYS = {
    PROGRESS: STORAGE_KEY_PREFIXES.PROGRESS + userId,
    LAST_ACTIVE: STORAGE_KEY_PREFIXES.LAST_ACTIVE + userId,
    UNLOCKS: STORAGE_KEY_PREFIXES.UNLOCKS + userId,
  };

  const [state, setState] = useState<ProgressState>({
    currentDayIndex: 0,
    daysCompleted: [],
    totalDaysCompleted: 0,
    lastActiveTimestamp: Date.now(),
    journeyStartDate: new Date().toISOString().split('T')[0],
    unlockedMilestones: [],
    showReEngagement: false,
    daysSinceLastActive: 0,
    currentPhase: 'VALLEY',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [newMilestone, setNewMilestone] = useState<string | null>(null);

  // Load progress from local storage on mount and when userId changes
  useEffect(() => {
    loadProgress();
  }, [userId, STORAGE_KEYS.PROGRESS]);

  // Check re-engagement when app loads
  useEffect(() => {
    if (!isLoading) {
      checkReEngagement();
    }
  }, [isLoading]);

  async function loadProgress() {
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          ...parsed,
          currentPhase: getPhaseForDay(parsed.currentDayIndex + 1),
        }));
      } else {
        // No progress for this user - reset to initial state
        setState({
          currentDayIndex: 0,
          daysCompleted: [],
          totalDaysCompleted: 0,
          lastActiveTimestamp: Date.now(),
          journeyStartDate: new Date().toISOString().split('T')[0],
          unlockedMilestones: [],
          showReEngagement: false,
          daysSinceLastActive: 0,
          currentPhase: 'VALLEY',
        });
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveProgress(newState: Partial<ProgressState>) {
    const updated = { ...state, ...newState };
    setState(updated);

    try {
      // 1. Always save locally first (instant, works offline)
      await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updated));

      // 2. Sync to cloud if online and authenticated
      syncToCloud(updated);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  async function syncToCloud(progressData: ProgressState) {
    try {
      const online = await isOnline();
      const userId = await getCurrentUserId();

      if (!online || !userId) return;

      await supabase.from(TABLES.PROGRESS).upsert({
        user_id: userId,
        current_day_index: progressData.currentDayIndex,
        days_completed: progressData.daysCompleted,
        total_days_completed: progressData.totalDaysCompleted,
        unlocked_milestones: progressData.unlockedMilestones,
        last_active_at: new Date(progressData.lastActiveTimestamp).toISOString(),
      });
    } catch (error) {
      // Silently fail - local data is already saved
      console.log('Cloud sync deferred:', error);
    }
  }

  // Function to reset progress (for testing and re-engagement restart)
  async function resetProgress() {
    const freshState: ProgressState = {
      currentDayIndex: 0,
      daysCompleted: [],
      totalDaysCompleted: 0,
      lastActiveTimestamp: Date.now(),
      journeyStartDate: new Date().toISOString().split('T')[0],
      unlockedMilestones: [],
      showReEngagement: false,
      daysSinceLastActive: 0,
      currentPhase: 'VALLEY',
    };
    await saveProgress(freshState);
  }

  // ============================================
  // CORE ACTIONS
  // ============================================

  const completeDay = useCallback(async (dayNumber: number) => {
    // Already completed? Skip
    if (state.daysCompleted.includes(dayNumber)) return;

    const newDaysCompleted = [...state.daysCompleted, dayNumber].sort((a, b) => a - b);
    const newTotal = newDaysCompleted.length;

    // Check for milestone unlocks
    const newUnlocks = [...state.unlockedMilestones];
    let justUnlocked: string | null = null;

    Object.entries(MILESTONES).forEach(([key, milestone]) => {
      if (newTotal >= milestone.day && !newUnlocks.includes(key)) {
        newUnlocks.push(key);
        justUnlocked = key;
      }
    });

    if (justUnlocked) {
      setNewMilestone(justUnlocked);
    }

    // Advance to next day if completing current
    const newIndex = dayNumber >= state.currentDayIndex + 1
      ? Math.min(dayNumber, 40)
      : state.currentDayIndex;

    await saveProgress({
      daysCompleted: newDaysCompleted,
      totalDaysCompleted: newTotal,
      currentDayIndex: newIndex,
      lastActiveTimestamp: Date.now(),
      unlockedMilestones: newUnlocks,
      currentPhase: getPhaseForDay(newIndex + 1),
    });
  }, [state]);

  const startDay = useCallback((dayNumber: number) => {
    // Update last active timestamp when starting a day
    saveProgress({
      lastActiveTimestamp: Date.now(),
      currentDayIndex: Math.max(state.currentDayIndex, dayNumber - 1),
    });
  }, [state]);

  // ============================================
  // RE-ENGAGEMENT (Anti-Shame Logic)
  // ============================================

  const checkReEngagement = useCallback(() => {
    const now = Date.now();
    const daysSince = Math.floor((now - state.lastActiveTimestamp) / (1000 * 60 * 60 * 24));

    // Only show re-engagement after 14 days of absence
    // AND only if they've made some progress (not brand new users)
    if (daysSince >= 14 && state.daysCompleted.length > 0) {
      setState(prev => ({
        ...prev,
        showReEngagement: true,
        daysSinceLastActive: daysSince,
      }));
    } else {
      // Update last active
      saveProgress({ lastActiveTimestamp: now });
    }
  }, [state]);

  const dismissReEngagement = useCallback((choice: 'continue' | 'restart') => {
    if (choice === 'restart') {
      // Reset progress but keep account
      saveProgress({
        currentDayIndex: 0,
        daysCompleted: [],
        totalDaysCompleted: 0,
        lastActiveTimestamp: Date.now(),
        journeyStartDate: new Date().toISOString().split('T')[0],
        unlockedMilestones: [],
        showReEngagement: false,
        daysSinceLastActive: 0,
        currentPhase: 'VALLEY',
      });
    } else {
      // Continue where they left off
      saveProgress({
        lastActiveTimestamp: Date.now(),
        showReEngagement: false,
        daysSinceLastActive: 0,
      });
    }
  }, []);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const isDayCompleted = useCallback((dayNumber: number) => {
    return state.daysCompleted.includes(dayNumber);
  }, [state.daysCompleted]);

  const isDayLocked = useCallback((dayNumber: number) => {
    // Day 1 is always unlocked
    if (dayNumber === 1) return false;
    // A day is unlocked if the previous day is completed
    // OR if it's the next day in sequence
    return dayNumber > state.currentDayIndex + 2;
  }, [state.currentDayIndex]);

  const hasPsychologyModule = useCallback((dayNumber: number) => {
    return PSYCHOLOGY_DAYS.includes(dayNumber);
  }, []);

  const getMilestoneForDay = useCallback((dayNumber: number) => {
    const milestone = Object.values(MILESTONES).find(m => m.day === dayNumber);
    return milestone || null;
  }, []);

  const getNewlyUnlockedMilestone = useCallback(() => {
    if (!newMilestone) return null;
    const milestone = MILESTONES[newMilestone as keyof typeof MILESTONES];
    setNewMilestone(null); // Clear after reading
    return milestone;
  }, [newMilestone]);

  const getPhaseForDay = useCallback((dayNumber: number): keyof typeof PHASES => {
    if (dayNumber <= 14) return 'VALLEY';
    if (dayNumber <= 21) return 'WAITING';
    if (dayNumber <= 33) return 'RISING';
    return 'BECOMING';
  }, []);

  const getKintsugiProgress = useCallback(() => {
    // Returns 0-100 for the Kintsugi visual (gold filling cracks)
    return Math.round((state.totalDaysCompleted / 40) * 100);
  }, [state.totalDaysCompleted]);

  const value: ProgressContextType = {
    ...state,
    completeDay,
    startDay,
    checkReEngagement,
    dismissReEngagement,
    resetProgress,
    isDayCompleted,
    isDayLocked,
    hasPsychologyModule,
    getMilestoneForDay,
    getNewlyUnlockedMilestone,
    getPhaseForDay,
    getKintsugiProgress,
    isLoading,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}

export default ProgressContext;
