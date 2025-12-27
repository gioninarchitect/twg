/**
 * Sync Context - Hybrid Local + Cloud Storage
 *
 * Architecture:
 * 1. All data writes go to local storage FIRST (instant, works offline)
 * 2. Background sync pushes changes to Supabase when online
 * 3. On app launch, pull latest from cloud and merge with local
 * 4. Conflict resolution: Most recent timestamp wins
 *
 * This ensures:
 * - App works 100% offline
 * - Data is backed up to cloud when possible
 * - Users can switch devices and recover data
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { supabase, isOnline, getCurrentUserId, TABLES } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';

// Storage keys
const SYNC_QUEUE_KEY = '@twg_sync_queue';
const LAST_SYNC_KEY = '@twg_last_sync';

interface SyncQueueItem {
  id: string;
  table: string;
  action: 'upsert' | 'delete';
  data: any;
  timestamp: string;
}

interface SyncContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;

  // Sync state
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  isOnline: boolean;

  // Auth methods
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;

  // Sync methods
  queueSync: (table: string, action: 'upsert' | 'delete', data: any) => Promise<void>;
  syncNow: () => Promise<void>;
  pullFromCloud: () => Promise<void>;

  // Loading state
  isLoading: boolean;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [online, setOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth and sync state
  useEffect(() => {
    initializeAuth();
    loadSyncState();
    checkOnlineStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for app state changes to sync when app becomes active
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  // Periodic online check
  useEffect(() => {
    const interval = setInterval(checkOnlineStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function initializeAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSyncState() {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      setLastSyncTime(lastSync);

      const queue = await getSyncQueue();
      setPendingChanges(queue.length);
    } catch (error) {
      console.error('Error loading sync state:', error);
    }
  }

  async function checkOnlineStatus() {
    const status = await isOnline();
    setOnline(status);

    // If we just came online and have pending changes, sync
    if (status && pendingChanges > 0) {
      syncNow();
    }
  }

  function handleAppStateChange(nextAppState: AppStateStatus) {
    if (nextAppState === 'active') {
      checkOnlineStatus();
    }
  }

  async function getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async function saveSyncQueue(queue: SyncQueueItem[]) {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    setPendingChanges(queue.length);
  }

  // Auth methods
  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      // Pull data from cloud after sign in
      await pullFromCloud();
    }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const signInAsGuest = useCallback(async () => {
    // Guest mode - no cloud account, local only
    setUser(null);
    setSession(null);
  }, []);

  // Queue a change for sync
  const queueSync = useCallback(async (
    table: string,
    action: 'upsert' | 'delete',
    data: any
  ) => {
    const queue = await getSyncQueue();

    const item: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      table,
      action,
      data: { ...data, updated_at: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    };

    // Remove any existing items for the same record to avoid duplicates
    const filteredQueue = queue.filter(q =>
      !(q.table === table && q.data.id === data.id)
    );

    await saveSyncQueue([...filteredQueue, item]);

    // Try to sync immediately if online
    if (online && user) {
      syncNow();
    }
  }, [online, user]);

  // Process sync queue
  const syncNow = useCallback(async () => {
    if (isSyncing || !online || !user) return;

    setIsSyncing(true);
    const queue = await getSyncQueue();

    if (queue.length === 0) {
      setIsSyncing(false);
      return;
    }

    const failedItems: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.action === 'upsert') {
          const { error } = await supabase
            .from(item.table)
            .upsert({ ...item.data, user_id: user.id });

          if (error) throw error;
        } else if (item.action === 'delete') {
          const { error } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.data.id)
            .eq('user_id', user.id);

          if (error) throw error;
        }
      } catch (error) {
        console.error('Sync error for item:', item.id, error);
        failedItems.push(item);
      }
    }

    await saveSyncQueue(failedItems);

    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SYNC_KEY, now);
    setLastSyncTime(now);
    setIsSyncing(false);
  }, [isSyncing, online, user]);

  // Pull latest data from cloud
  const pullFromCloud = useCallback(async () => {
    if (!online || !user) return;

    setIsSyncing(true);

    try {
      // Pull progress
      const { data: progressData } = await supabase
        .from(TABLES.PROGRESS)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (progressData) {
        // Merge with local - cloud wins for progress
        await AsyncStorage.setItem('@twg_progress', JSON.stringify({
          currentDayIndex: progressData.current_day_index,
          daysCompleted: progressData.days_completed,
          totalDaysCompleted: progressData.total_days_completed,
          lastActiveTimestamp: new Date(progressData.last_active_at).getTime(),
          unlockedMilestones: progressData.unlocked_milestones,
        }));
      }

      // Pull journal entries
      const { data: journalData } = await supabase
        .from(TABLES.JOURNAL_ENTRIES)
        .select('*')
        .eq('user_id', user.id);

      if (journalData && journalData.length > 0) {
        const localJournal = await AsyncStorage.getItem('@twg_journal');
        const local = localJournal ? JSON.parse(localJournal) : { entries: [] };

        // Merge entries - most recent wins
        const mergedEntries = [...local.entries];
        for (const cloudEntry of journalData) {
          const localIndex = mergedEntries.findIndex(e => e.dayNumber === cloudEntry.day_number);
          const cloudUpdated = new Date(cloudEntry.updated_at).getTime();

          if (localIndex === -1) {
            // Entry doesn't exist locally, add it
            mergedEntries.push({
              id: cloudEntry.id,
              dayNumber: cloudEntry.day_number,
              content: cloudEntry.content,
              isEncrypted: cloudEntry.is_encrypted,
              createdAt: cloudEntry.created_at,
              updatedAt: cloudEntry.updated_at,
              voiceNoteUri: cloudEntry.voice_note_uri,
              prompt: cloudEntry.prompt,
            });
          } else {
            // Entry exists - check which is newer
            const localUpdated = new Date(mergedEntries[localIndex].updatedAt).getTime();
            if (cloudUpdated > localUpdated) {
              mergedEntries[localIndex] = {
                id: cloudEntry.id,
                dayNumber: cloudEntry.day_number,
                content: cloudEntry.content,
                isEncrypted: cloudEntry.is_encrypted,
                createdAt: cloudEntry.created_at,
                updatedAt: cloudEntry.updated_at,
                voiceNoteUri: cloudEntry.voice_note_uri,
                prompt: cloudEntry.prompt,
              };
            }
          }
        }

        await AsyncStorage.setItem('@twg_journal', JSON.stringify({
          ...local,
          entries: mergedEntries,
        }));
      }

      // Pull access status
      const { data: accessData } = await supabase
        .from(TABLES.ACCESS_CODES)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (accessData) {
        await AsyncStorage.setItem('@twg_access', JSON.stringify({
          accessLevel: accessData.access_level,
          codeUsed: accessData.code_used,
          codeDescription: accessData.code_description,
          unlockedAt: accessData.unlocked_at,
        }));
      }

      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SYNC_KEY, now);
      setLastSyncTime(now);
    } catch (error) {
      console.error('Error pulling from cloud:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [online, user]);

  const value: SyncContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isSyncing,
    lastSyncTime,
    pendingChanges,
    isOnline: online,
    signUp,
    signIn,
    signOut,
    signInAsGuest,
    queueSync,
    syncNow,
    pullFromCloud,
    isLoading,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

export default SyncContext;
