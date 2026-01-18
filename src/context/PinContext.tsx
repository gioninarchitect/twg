/**
 * PIN Lock Context
 *
 * Provides app-level PIN protection for privacy on shared devices.
 * - PIN is stored securely (hashed)
 * - Auto-lock after inactivity
 * - Forgot PIN resets all data
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

// Storage keys
const PIN_HASH_KEY = '@twg_pin_hash';
const PIN_ENABLED_KEY = '@twg_pin_enabled';
const AUTO_LOCK_KEY = '@twg_auto_lock_minutes';
const LAST_ACTIVE_KEY = '@twg_last_active';

// Simple hash function for PIN (not cryptographically secure, but adequate for local PIN)
function hashPin(pin: string): string {
  let hash = 0;
  const salt = 'twg_pin_salt_2025';
  const salted = salt + pin + salt;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

interface PinContextType {
  // State
  isPinEnabled: boolean;
  isLocked: boolean;
  isLoading: boolean;
  autoLockMinutes: number;

  // Actions
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => boolean;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  disablePin: (pin: string) => Promise<boolean>;
  lockApp: () => void;
  unlockApp: (pin: string) => boolean;
  setAutoLockMinutes: (minutes: number) => Promise<void>;
  resetAllData: () => Promise<void>;
}

const PinContext = createContext<PinContextType | null>(null);

interface PinProviderProps {
  children: ReactNode;
}

export function PinProvider({ children }: PinProviderProps) {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [autoLockMinutes, setAutoLockMinutesState] = useState(5); // Default 5 minutes
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());

  // Load PIN state on mount
  useEffect(() => {
    loadPinState();
  }, []);

  // Handle app state changes for auto-lock
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground - check if we should lock
        checkAutoLock();
      } else if (nextAppState === 'background') {
        // App went to background - save last active time
        const now = Date.now();
        setLastActiveTime(now);
        AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isPinEnabled, autoLockMinutes, pinHash]);

  async function loadPinState() {
    try {
      const [storedHash, storedEnabled, storedAutoLock, storedLastActive] = await Promise.all([
        AsyncStorage.getItem(PIN_HASH_KEY),
        AsyncStorage.getItem(PIN_ENABLED_KEY),
        AsyncStorage.getItem(AUTO_LOCK_KEY),
        AsyncStorage.getItem(LAST_ACTIVE_KEY),
      ]);

      const enabled = storedEnabled === 'true';
      setIsPinEnabled(enabled);
      setPinHash(storedHash);

      if (storedAutoLock) {
        setAutoLockMinutesState(parseInt(storedAutoLock, 10));
      }

      // Check if auto-lock timeout has elapsed since last activity
      const lastActive = storedLastActive ? parseInt(storedLastActive, 10) : Date.now();
      setLastActiveTime(lastActive);

      // If PIN is enabled, only lock if timeout has elapsed
      if (enabled && storedHash) {
        const autoLockMs = (storedAutoLock ? parseInt(storedAutoLock, 10) : 5) * 60 * 1000;
        const elapsed = Date.now() - lastActive;

        if (elapsed > autoLockMs) {
          setIsLocked(true);
        } else {
          // Within auto-lock window - reset the timer on refresh
          const now = Date.now();
          setLastActiveTime(now);
          AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        }
      }
    } catch (error) {
      console.error('Error loading PIN state:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function checkAutoLock() {
    if (!isPinEnabled || !pinHash) return;

    const now = Date.now();
    const elapsed = now - lastActiveTime;
    const autoLockMs = autoLockMinutes * 60 * 1000;

    if (elapsed > autoLockMs) {
      setIsLocked(true);
    }
  }

  const setupPin = useCallback(async (pin: string) => {
    const hash = hashPin(pin);
    await AsyncStorage.setItem(PIN_HASH_KEY, hash);
    await AsyncStorage.setItem(PIN_ENABLED_KEY, 'true');
    setPinHash(hash);
    setIsPinEnabled(true);
    setIsLocked(false);
  }, []);

  const verifyPin = useCallback((pin: string): boolean => {
    if (!pinHash) return false;
    return hashPin(pin) === pinHash;
  }, [pinHash]);

  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    if (!verifyPin(oldPin)) return false;

    const newHash = hashPin(newPin);
    await AsyncStorage.setItem(PIN_HASH_KEY, newHash);
    setPinHash(newHash);
    return true;
  }, [verifyPin]);

  const disablePin = useCallback(async (pin: string): Promise<boolean> => {
    if (!verifyPin(pin)) return false;

    await AsyncStorage.removeItem(PIN_HASH_KEY);
    await AsyncStorage.setItem(PIN_ENABLED_KEY, 'false');
    setPinHash(null);
    setIsPinEnabled(false);
    setIsLocked(false);
    return true;
  }, [verifyPin]);

  const lockApp = useCallback(() => {
    if (isPinEnabled && pinHash) {
      setIsLocked(true);
    }
  }, [isPinEnabled, pinHash]);

  const unlockApp = useCallback((pin: string): boolean => {
    if (verifyPin(pin)) {
      setIsLocked(false);
      setLastActiveTime(Date.now());
      return true;
    }
    return false;
  }, [verifyPin]);

  const setAutoLockMinutes = useCallback(async (minutes: number) => {
    await AsyncStorage.setItem(AUTO_LOCK_KEY, minutes.toString());
    setAutoLockMinutesState(minutes);
  }, []);

  const resetAllData = useCallback(async () => {
    // Clear ALL app data - this is the "forgot PIN" nuclear option
    await AsyncStorage.clear();
    setPinHash(null);
    setIsPinEnabled(false);
    setIsLocked(false);
  }, []);

  const value: PinContextType = {
    isPinEnabled,
    isLocked,
    isLoading,
    autoLockMinutes,
    setupPin,
    verifyPin,
    changePin,
    disablePin,
    lockApp,
    unlockApp,
    setAutoLockMinutes,
    resetAllData,
  };

  return (
    <PinContext.Provider value={value}>
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  const context = useContext(PinContext);
  if (!context) {
    throw new Error('usePin must be used within a PinProvider');
  }
  return context;
}

export default PinContext;
