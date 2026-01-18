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
 *
 * SECURITY: All access codes are validated SERVER-SIDE via /api/v1/access/validate
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { accessApi } from '../services/api';
import { supabase, TABLES, isOnline, getCurrentUserId } from '../services/supabase';

// Storage key prefixes (userId appended at runtime)
const ACCESS_KEY_PREFIX = '@twg_access_';
const GUEST_START_KEY_PREFIX = '@twg_guest_start_';

// Access levels
type AccessLevel = 'GUEST' | 'FULL';

// Plan tiers - determines feature access
export type PlanTier = 'book' | 'journey' | 'premium';

// Guest preview limit - Day 1 only for demo
export const GUEST_DAY_LIMIT = 1;

// Milliseconds in a day (for time-locked access)
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface AccessState {
  accessLevel: AccessLevel;
  planTier: PlanTier | null; // null for guests, 'book'/'journey'/'premium' for purchasers
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

  // Check if user has premium access (for music, brain games, voice recordings)
  hasPremiumAccess: () => boolean;

  // Premium feature checks
  canAccessMusic: () => boolean;
  canAccessBrainGames: () => boolean;
  canAccessVoiceRecordings: () => boolean;

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

interface AccessProviderProps {
  children: ReactNode;
  userId: string;
}

export function AccessProvider({ children, userId }: AccessProviderProps) {
  // User-specific storage keys
  const ACCESS_KEY = ACCESS_KEY_PREFIX + userId;
  const GUEST_START_KEY = GUEST_START_KEY_PREFIX + userId;

  const [state, setState] = useState<AccessState>({
    accessLevel: 'GUEST',
    planTier: null,
    codeUsed: null,
    codeDescription: null,
    unlockedAt: null,
    guestStartDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load access state on mount and when userId changes
  useEffect(() => {
    loadAccessState();
  }, [userId, ACCESS_KEY]);

  async function loadAccessState() {
    setIsLoading(true);
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
        // First time guest for this user - set start date
        const initialState: AccessState = {
          accessLevel: 'GUEST',
          planTier: null,
          codeUsed: null,
          codeDescription: null,
          unlockedAt: null,
          guestStartDate: new Date().toISOString(),
        };
        setState(initialState);
        await AsyncStorage.setItem(ACCESS_KEY, JSON.stringify(initialState));
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
      // Save locally first
      await AsyncStorage.setItem(ACCESS_KEY, JSON.stringify(newState));
      // Sync to cloud
      syncAccessToCloud(newState);
    } catch (error) {
      console.error('Error saving access state:', error);
    }
  }

  async function syncAccessToCloud(accessState: AccessState) {
    try {
      const online = await isOnline();
      const cloudUserId = await getCurrentUserId();

      if (!online || !cloudUserId) return;

      const { error } = await supabase
        .from(TABLES.USER_SETTINGS)
        .upsert({
          user_id: cloudUserId,
          access_level: accessState.accessLevel === 'FULL' ? 'PILGRIM' : 'GUEST',
          access_code: accessState.codeUsed,
          redeemed_at: accessState.unlockedAt,
          guest_start_time: accessState.guestStartDate,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.log('Access state cloud sync deferred:', error.message);
      }
    } catch (error) {
      console.log('Access state cloud sync failed:', error);
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

  // Premium access check - only premium tier gets music, brain games, voice recordings
  const hasPremiumAccess = useCallback(() => {
    return state.planTier === 'premium';
  }, [state.planTier]);

  const canAccessMusic = useCallback(() => {
    return state.planTier === 'premium';
  }, [state.planTier]);

  const canAccessBrainGames = useCallback(() => {
    return state.planTier === 'premium';
  }, [state.planTier]);

  const canAccessVoiceRecordings = useCallback(() => {
    return state.planTier === 'premium';
  }, [state.planTier]);

  const getMaxAccessibleDay = useCallback(() => {
    if (state.accessLevel === 'FULL') return 40;
    return getGuestCurrentDay();
  }, [state.accessLevel, getGuestCurrentDay]);

  const redeemCode = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    // Normalize code (uppercase, trim whitespace)
    const normalizedCode = code.trim().toUpperCase();

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

    // Validate code SERVER-SIDE
    const result = await accessApi.validateCode(normalizedCode);

    if (!result.valid) {
      return {
        success: false,
        message: result.error || 'This code is not recognized. Please check and try again.',
      };
    }

    // Code is valid - update local state
    const codeDescription = result.codeType === 'owner' ? 'Owner Access' :
                           result.codeType === 'organization' ? 'Organization Code' :
                           result.codeType === 'purchase' ? `${result.plan || 'Journey'} Purchase` :
                           'Book Code';

    // Determine plan tier from result (owner codes get premium by default)
    const planTier: PlanTier = result.codeType === 'owner' ? 'premium' :
                               (result.plan as PlanTier) || 'journey';

    const newState: AccessState = {
      accessLevel: 'FULL',
      planTier: planTier,
      codeUsed: normalizedCode,
      codeDescription: codeDescription,
      unlockedAt: new Date().toISOString(),
      guestStartDate: state.guestStartDate, // Preserve existing guest start date
    };

    await saveAccessState(newState);

    const welcomeMessage = result.firstName
      ? `Welcome ${result.firstName}! Your full 40-day journey is now unlocked.`
      : 'Welcome to your full 40-day journey. All content is now unlocked.';

    return {
      success: true,
      message: welcomeMessage,
    };
  }, [state]);

  const resetToGuest = useCallback(async () => {
    const guestState: AccessState = {
      accessLevel: 'GUEST',
      planTier: null,
      codeUsed: null,
      codeDescription: null,
      unlockedAt: null,
      guestStartDate: new Date().toISOString(), // New guest starts fresh
    };
    await saveAccessState(guestState);
  }, []);

  const value: AccessContextType = {
    ...state,
    canAccessDay,
    redeemCode,
    hasFullAccess,
    hasPremiumAccess,
    canAccessMusic,
    canAccessBrainGames,
    canAccessVoiceRecordings,
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
