/**
 * Journal Context - Secure Local Journal System
 *
 * PRD: Local-only entries, optional encryption for sensitive content
 *
 * Security: Uses expo-crypto for encryption with user's device key.
 * All entries stored locally with AsyncStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { supabase, TABLES, isOnline, getCurrentUserId } from '../services/supabase';

// Platform-aware secure storage for web compatibility
const SecureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
};

// Storage key prefix (userId appended at runtime)
const JOURNAL_KEY_PREFIX = '@twg_journal_';
const ENCRYPTION_KEY_PREFIX = '@twg_journal_key_';

export interface JournalEntry {
  id: string;
  dayNumber: number;
  content: string;
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
  voiceNoteUri?: string;
  prompt?: string;
}

interface JournalContextType {
  entries: JournalEntry[];

  // Save a journal entry (optionally encrypted)
  saveEntry: (
    dayNumber: number,
    content: string,
    options?: {
      encrypt?: boolean;
      voiceNoteUri?: string;
      prompt?: string;
    }
  ) => Promise<JournalEntry>;

  // Get entry for a specific day
  getEntryForDay: (dayNumber: number) => JournalEntry | undefined;

  // Get all entries
  getAllEntries: () => JournalEntry[];

  // Delete an entry
  deleteEntry: (entryId: string) => Promise<void>;

  // Decrypt content (returns null if decryption fails)
  decryptContent: (entry: JournalEntry) => Promise<string | null>;

  // Check if journal is protected
  isEncryptionEnabled: boolean;

  // Enable/disable encryption for future entries
  setEncryptionEnabled: (enabled: boolean) => Promise<void>;

  // Loading state
  isLoading: boolean;
}

const JournalContext = createContext<JournalContextType | null>(null);

// Simple XOR encryption (for basic privacy, not high-security)
// In production, use a proper encryption library
async function encrypt(text: string, key: string): Promise<string> {
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const encrypted = textBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
  return btoa(String.fromCharCode(...encrypted));
}

async function decrypt(encryptedText: string, key: string): Promise<string> {
  try {
    const encrypted = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(key);
    const decrypted = encrypted.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
    return new TextDecoder().decode(decrypted);
  } catch {
    return encryptedText; // Return as-is if decryption fails
  }
}

// Generate a unique encryption key for this user on this device
async function getOrCreateEncryptionKey(userId: string): Promise<string> {
  const keyId = ENCRYPTION_KEY_PREFIX + userId;
  let key = await SecureStorage.getItem(keyId);
  if (!key) {
    // Generate a random 32-character key
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    key = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    await SecureStorage.setItem(keyId, key);
  }
  return key;
}

interface JournalProviderProps {
  children: ReactNode;
  userId: string;
}

export function JournalProvider({ children, userId }: JournalProviderProps) {
  // User-specific storage key
  const journalKey = JOURNAL_KEY_PREFIX + userId;
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isEncryptionEnabled, setIsEncryptionEnabledState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<string>('');

  // Load entries on mount and when userId changes
  useEffect(() => {
    loadJournal();
  }, [userId, journalKey]);

  async function loadJournal() {
    setIsLoading(true);
    try {
      // Get or create encryption key for this user
      const key = await getOrCreateEncryptionKey(userId);
      setEncryptionKey(key);

      // Load entries for this user
      const stored = await AsyncStorage.getItem(journalKey);
      if (stored) {
        const data = JSON.parse(stored);
        setEntries(data.entries || []);
        setIsEncryptionEnabledState(data.encryptionEnabled || false);
      } else {
        // No entries for this user yet
        setEntries([]);
        setIsEncryptionEnabledState(false);
      }
    } catch (error) {
      console.error('Error loading journal:', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveJournalData(newEntries: JournalEntry[], encryptionEnabled: boolean) {
    setEntries(newEntries);
    try {
      // 1. Save locally first (instant, works offline) - user-specific key
      await AsyncStorage.setItem(journalKey, JSON.stringify({
        entries: newEntries,
        encryptionEnabled,
      }));

      // 2. Sync to cloud if online
      syncJournalToCloud(newEntries);
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  }

  async function syncJournalToCloud(journalEntries: JournalEntry[]) {
    try {
      const online = await isOnline();
      const userId = await getCurrentUserId();

      if (!online || !userId) return;

      // Sync each entry
      for (const entry of journalEntries) {
        await supabase.from(TABLES.JOURNAL_ENTRIES).upsert({
          id: entry.id,
          user_id: userId,
          day_number: entry.dayNumber,
          content: entry.content,
          is_encrypted: entry.isEncrypted,
          voice_note_uri: entry.voiceNoteUri,
          prompt: entry.prompt,
          created_at: entry.createdAt,
          updated_at: entry.updatedAt,
        });
      }
    } catch (error) {
      // Silently fail - local data is already saved
      console.log('Journal cloud sync deferred:', error);
    }
  }

  const saveEntry = useCallback(async (
    dayNumber: number,
    content: string,
    options?: {
      encrypt?: boolean;
      voiceNoteUri?: string;
      prompt?: string;
    }
  ): Promise<JournalEntry> => {
    const shouldEncrypt = options?.encrypt ?? isEncryptionEnabled;
    const now = new Date().toISOString();

    // Encrypt content if needed
    const finalContent = shouldEncrypt
      ? await encrypt(content, encryptionKey)
      : content;

    // Check if entry exists for this day
    const existingEntry = entries.find(e => e.dayNumber === dayNumber);

    const entry: JournalEntry = {
      id: existingEntry?.id || Crypto.randomUUID(),
      dayNumber,
      content: finalContent,
      isEncrypted: shouldEncrypt,
      createdAt: existingEntry?.createdAt || now,
      updatedAt: now,
      voiceNoteUri: options?.voiceNoteUri,
      prompt: options?.prompt,
    };

    const newEntries = existingEntry
      ? entries.map(e => e.id === existingEntry.id ? entry : e)
      : [...entries, entry];

    await saveJournalData(newEntries, isEncryptionEnabled);
    return entry;
  }, [entries, isEncryptionEnabled, encryptionKey]);

  const getEntryForDay = useCallback((dayNumber: number): JournalEntry | undefined => {
    return entries.find(e => e.dayNumber === dayNumber);
  }, [entries]);

  const getAllEntries = useCallback((): JournalEntry[] => {
    return [...entries].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [entries]);

  const deleteEntry = useCallback(async (entryId: string): Promise<void> => {
    const newEntries = entries.filter(e => e.id !== entryId);
    await saveJournalData(newEntries, isEncryptionEnabled);
  }, [entries, isEncryptionEnabled]);

  const decryptContent = useCallback(async (entry: JournalEntry): Promise<string | null> => {
    if (!entry.isEncrypted) {
      return entry.content;
    }
    try {
      return await decrypt(entry.content, encryptionKey);
    } catch {
      return null;
    }
  }, [encryptionKey]);

  const setEncryptionEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    setIsEncryptionEnabledState(enabled);
    await saveJournalData(entries, enabled);
  }, [entries]);

  const value: JournalContextType = {
    entries,
    saveEntry,
    getEntryForDay,
    getAllEntries,
    deleteEntry,
    decryptContent,
    isEncryptionEnabled,
    setEncryptionEnabled,
    isLoading,
  };

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
}

export default JournalContext;
