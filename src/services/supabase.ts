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
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxenl6aW95b3NweHdmenJkd2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODAyNTksImV4cCI6MjA4MjI1NjI1OX0.gx_53V9FCUSe_fJuv8pG4W9uF3bTodHAaONZ6cwccgs';

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
  GAME_DATA: 'game_data',
  USER_SETTINGS: 'user_settings',
  WORLD_MODEL_STATE: 'world_model_state',
} as const;

// Helper to check if we're online
export async function isOnline(): Promise<boolean> {
  // Use navigator.onLine for quick check (available on web and React Native)
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  // Fallback: assume online
  return true;
}

// Helper to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export default supabase;
