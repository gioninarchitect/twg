/**
 * Supabase Client Configuration
 *
 * Hybrid Architecture: Local-first with optional cloud sync
 * - Works offline with AsyncStorage
 * - Syncs to Supabase when online
 * - User data backed up to cloud
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Supabase configuration
const SUPABASE_URL = 'https://hqzyzioyospxwfzrdwkj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sr7Yk8Rtrv0t02DJ6Qxmig_3A_j8kCH';

// Custom storage adapter for Supabase auth that uses SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Fallback to AsyncStorage if SecureStore fails
      return await AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.removeItem(key);
    }
  },
};

// Check if running on web
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: isWeb ? undefined : ExpoSecureStoreAdapter, // Use default localStorage on web
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb, // Enable URL detection on web for magic links
  },
});

// Database table names
export const TABLES = {
  USERS: 'users',
  PROGRESS: 'user_progress',
  JOURNAL_ENTRIES: 'journal_entries',
  ACCESS_CODES: 'access_codes',
  NOTIFICATIONS: 'notification_settings',
} as const;

// Helper to check if we're online
export async function isOnline(): Promise<boolean> {
  try {
    const response = await fetch(SUPABASE_URL, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Helper to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export default supabase;
