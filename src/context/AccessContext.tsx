/**
 * Access Context - Content Unlock System
 *
 * PRD: "Access Code system (Unlock content via Book Code)"
 *
 * Access Levels:
 * - GUEST: Days 1-3 only (preview mode) - TIME-LOCKED one day at a time
 * - FULL: All 40 days unlocked (book purchasers)
 *
 * Guest Preview Experience:
 * - Day 1: Available immediately on first launch
 * - Day 2: Unlocks 24 hours after first launch
 * - Day 3: Unlocks 48 hours after first launch
 *
 * This gives guests the authentic 40-day journey experience.
 * The code is typically provided with the physical book purchase.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const ACCESS_KEY = '@twg_access';
const GUEST_START_KEY = '@twg_guest_start';

// Access levels
export type AccessLevel = 'GUEST' | 'FULL';

// Valid access codes (in production, these would be validated server-side)
// For now, hardcoded codes for testing
const VALID_CODES: { [code: string]: { level: AccessLevel; description: string } } = {
  // Book codes - provide full access
  'TEAWITHGOD2025': { level: 'FULL', description: 'Book Purchase Code' },
  'HEALING40DAYS': { level: 'FULL', description: 'Book Purchase Code' },
  'KINTSUGI2025': { level: 'FULL', description: 'Special Edition Code' },

  // Owner/Review codes - full access for testing
  'REVIEW': { level: 'FULL', description: 'Owner Review Access' },
  'OWNER2025': { level: 'FULL', description: 'Owner Access' },
  'BETAREVIEW': { level: 'FULL', description: 'Beta Reviewer Access' },

  // Add more codes as needed for different campaigns
};

// Guest preview limit
export const GUEST_DAY_LIMIT = 3;

// Milliseconds in a day (for time-locked access)
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface AccessState {
  accessLevel: AccessLevel;
  codeUsed: string | null;
  codeDescription: string | null;
  unlockedAt: string | null;
  guestStartDate: string | null; // When the guest first started - for time-lock calculation
}

interface AccessContextType extends AccessState {
  // Check if a day is accessible
  canAccessDay: (dayNumber: number) => boolean;

  // Redeem an access code
  redeemCode: (code: string) => Promise<{ success: boolean; message: string }>;

  // Check if user has full access
  hasFullAccess: () => boolean;

  // Get the maximum day accessible (for guests, this is time-locked)
  getMaxAccessibleDay: () => number;

  // Get the current unlocked day for guest (1, 2, or 3 based on time)
  getGuestCurrentDay: () => number;

  // Get time until next day unlocks (for guests)
  getTimeUntilNextDay: () => { hours: number; minutes: number } | null;

  // Reset to guest (for testing)
  resetToGuest: () => Promise<void>;

  // Loading state
  isLoading: boolean;
}

const AccessContext = createContext<AccessContextType | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessState>({
    accessLevel: 'GUEST',
    codeUsed: null,
    codeDescription: null,
    unlockedAt: null,
    guestStartDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load access state on mount
  useEffect(() => {
    loadAccessState();
  }, []);

  async function loadAccessState() {
    try {
      const stored = await AsyncStorage.getItem(ACCESS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old data without guestStartDate
        if (!parsed.guestStartDate && parsed.accessLevel === 'GUEST') {
          parsed.guestStartDate = new Date().toISOString();
        }
        setState(parsed);
      } else {
        // First time guest - set start date
        const initialState: AccessState = {
          accessLevel: 'GUEST',
          codeUsed: null,
          codeDescription: null,
          unlockedAt: null,
          guestStartDate: new Date().toISOString(),
        };
        await saveAccessState(initialState);
      }
    } catch (error) {
      console.error('Error loading access state:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveAccessState(newState: AccessState) {
    setState(newState);
    try {
      await AsyncStorage.setItem(ACCESS_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving access state:', error);
    }
  }

  // Calculate which guest day is currently unlocked based on time
  const getGuestCurrentDay = useCallback(() => {
    if (!state.guestStartDate) return 1;

    const startTime = new Date(state.guestStartDate).getTime();
    const now = Date.now();
    const elapsed = now - startTime;

    // Day 1: 0-24 hours, Day 2: 24-48 hours, Day 3: 48+ hours
    const daysElapsed = Math.floor(elapsed / MS_PER_DAY);

    // Cap at GUEST_DAY_LIMIT (3)
    return Math.min(daysElapsed + 1, GUEST_DAY_LIMIT);
  }, [state.guestStartDate]);

  // Get time until next day unlocks
  const getTimeUntilNextDay = useCallback(() => {
    if (state.accessLevel === 'FULL') return null;

    const currentDay = getGuestCurrentDay();
    if (currentDay >= GUEST_DAY_LIMIT) return null; // All preview days unlocked

    if (!state.guestStartDate) return null;

    const startTime = new Date(state.guestStartDate).getTime();
    const now = Date.now();
    const nextUnlockTime = startTime + (currentDay * MS_PER_DAY);
    const remaining = nextUnlockTime - now;

    if (remaining <= 0) return null;

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    return { hours, minutes };
  }, [state.accessLevel, state.guestStartDate, getGuestCurrentDay]);

  const canAccessDay = useCallback((dayNumber: number) => {
    if (state.accessLevel === 'FULL') {
      return true;
    }
    // Guests can only access up to their current time-locked day
    const currentMaxDay = getGuestCurrentDay();
    return dayNumber <= currentMaxDay;
  }, [state.accessLevel, getGuestCurrentDay]);

  const hasFullAccess = useCallback(() => {
    return state.accessLevel === 'FULL';
  }, [state.accessLevel]);

  const getMaxAccessibleDay = useCallback(() => {
    if (state.accessLevel === 'FULL') return 40;
    return getGuestCurrentDay();
  }, [state.accessLevel, getGuestCurrentDay]);

  const redeemCode = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    // Normalize code (uppercase, trim whitespace)
    const normalizedCode = code.trim().toUpperCase();

    // Check if code is valid
    const codeData = VALID_CODES[normalizedCode];

    if (!codeData) {
      return {
        success: false,
        message: 'This code is not recognized. Please check and try again.',
      };
    }

    // Check if already using this code
    if (state.codeUsed === normalizedCode) {
      return {
        success: false,
        message: 'You have already redeemed this code.',
      };
    }

    // Check if already has full access
    if (state.accessLevel === 'FULL') {
      return {
        success: false,
        message: 'You already have full access to all 40 days.',
      };
    }

    // Redeem the code
    const newState: AccessState = {
      accessLevel: codeData.level,
      codeUsed: normalizedCode,
      codeDescription: codeData.description,
      unlockedAt: new Date().toISOString(),
    };

    await saveAccessState(newState);

    return {
      success: true,
      message: 'Welcome to your full 40-day journey. All content is now unlocked.',
    };
  }, [state]);

  const resetToGuest = useCallback(async () => {
    const guestState: AccessState = {
      accessLevel: 'GUEST',
      codeUsed: null,
      codeDescription: null,
      unlockedAt: null,
    };
    await saveAccessState(guestState);
  }, []);

  const value: AccessContextType = {
    ...state,
    canAccessDay,
    redeemCode,
    hasFullAccess,
    getMaxAccessibleDay,
    getGuestCurrentDay,
    getTimeUntilNextDay,
    resetToGuest,
    isLoading,
  };

  return (
    <AccessContext.Provider value={value}>
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
}

export default AccessContext;
