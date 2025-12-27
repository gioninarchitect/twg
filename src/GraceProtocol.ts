/**
 * Tea With God: Grace Protocol
 * Compassionate Notification System v2.5.0
 *
 * AXIOM_2: THE ANTI-STREAK
 * Consistency is measured by Total Volume, not Consecutive Linearity.
 * A gap in usage triggers Sanctuary Logic (Compassion), not Failure Logic (Punishment).
 *
 * FORBIDDEN VOCABULARY:
 * - "Streak" -> "Total Volume"
 * - "Missed" -> NEVER USED
 * - "Failed" -> NEVER USED
 * - "Days in a row" -> "Journey"
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  UserJourney,
  GraceInterval,
  GraceNotification,
  GRACE_NOTIFICATIONS,
} from './types';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  LAST_NOTIFICATION_24H: '@grace_last_24h',
  LAST_NOTIFICATION_72H: '@grace_last_72h',
  LAST_NOTIFICATION_14D: '@grace_last_14d',
  NOTIFICATION_PERMISSIONS: '@grace_permissions',
  OPT_OUT: '@grace_opt_out',
} as const;

// ============================================================================
// NOTIFICATION CHANNEL CONFIGURATION
// ============================================================================

const GRACE_CHANNEL_CONFIG = {
  channelId: 'grace-protocol',
  channelName: 'Gentle Reminders',
  channelDescription: 'Compassionate check-ins from your Tea With God journey',
  importance: Notifications.AndroidImportance.DEFAULT,
  sound: 'gentle_chime.wav', // Soft, non-jarring sound
  vibrationPattern: [0, 100], // Single gentle pulse
  lightColor: '#D4A574', // Kintsugi Gold
};

// ============================================================================
// GRACE PROTOCOL SERVICE
// ============================================================================

export class GraceProtocolService {
  private static instance: GraceProtocolService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): GraceProtocolService {
    if (!GraceProtocolService.instance) {
      GraceProtocolService.instance = new GraceProtocolService();
    }
    return GraceProtocolService.instance;
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false, // No badge count - avoids "missed" anxiety
      }),
    });

    // Create Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(
        GRACE_CHANNEL_CONFIG.channelId,
        {
          name: GRACE_CHANNEL_CONFIG.channelName,
          description: GRACE_CHANNEL_CONFIG.channelDescription,
          importance: GRACE_CHANNEL_CONFIG.importance,
          sound: GRACE_CHANNEL_CONFIG.sound,
          vibrationPattern: GRACE_CHANNEL_CONFIG.vibrationPattern,
          lightColor: GRACE_CHANNEL_CONFIG.lightColor,
        }
      );
    }

    this.isInitialized = true;
  }

  // ==========================================================================
  // PERMISSION HANDLING
  // ==========================================================================

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSIONS, 'granted');
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSIONS, status);

    return status === 'granted';
  }

  async hasPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // ==========================================================================
  // SCHEDULE GRACE NOTIFICATIONS
  // ==========================================================================

  /**
   * Schedule all grace notifications based on last active timestamp.
   * Called when app goes to background or user completes a session.
   */
  async scheduleGraceNotifications(journey: UserJourney): Promise<void> {
    // Check if user has opted out
    const optedOut = await AsyncStorage.getItem(STORAGE_KEYS.OPT_OUT);
    if (optedOut === 'true') return;

    // Check permissions
    const hasPerms = await this.hasPermissions();
    if (!hasPerms) return;

    // Cancel existing scheduled notifications
    await this.cancelAllGraceNotifications();

    const lastActive = new Date(journey.lastActiveTimestamp);

    // Schedule each grace interval
    for (const interval of Object.keys(GRACE_NOTIFICATIONS) as GraceInterval[]) {
      const notification = GRACE_NOTIFICATIONS[interval];
      await this.scheduleNotification(notification, lastActive);
    }
  }

  private async scheduleNotification(
    notification: GraceNotification,
    lastActive: Date
  ): Promise<void> {
    const triggerDate = new Date(lastActive);
    triggerDate.setHours(triggerDate.getHours() + notification.triggerAfterHours);

    // Don't schedule if the trigger time is in the past
    if (triggerDate <= new Date()) return;

    // Schedule at a gentle time (10am local if possible)
    const scheduledDate = this.adjustToGentleTime(triggerDate);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          type: 'grace_protocol',
          interval: notification.intervalKey,
          // CRITICAL: Never include streak data
          suppressStreakData: true,
        },
        sound: Platform.OS === 'android' ? GRACE_CHANNEL_CONFIG.sound : 'default',
      },
      trigger: {
        date: scheduledDate,
        channelId: Platform.OS === 'android' ? GRACE_CHANNEL_CONFIG.channelId : undefined,
      },
      identifier: `grace_${notification.intervalKey}`,
    });
  }

  /**
   * Adjust notification time to a gentle hour (10am local)
   * Avoids waking users or interrupting at inappropriate times
   */
  private adjustToGentleTime(date: Date): Date {
    const adjusted = new Date(date);
    const hour = adjusted.getHours();

    // If scheduled for nighttime (10pm - 7am), push to 10am
    if (hour >= 22 || hour < 7) {
      adjusted.setHours(10, 0, 0, 0);
      if (hour >= 22) {
        // Next day
        adjusted.setDate(adjusted.getDate() + 1);
      }
    }

    return adjusted;
  }

  // ==========================================================================
  // CANCEL NOTIFICATIONS
  // ==========================================================================

  async cancelAllGraceNotifications(): Promise<void> {
    const intervals: GraceInterval[] = ['24h', '72h', '14d'];

    for (const interval of intervals) {
      await Notifications.cancelScheduledNotificationAsync(`grace_${interval}`);
    }
  }

  // ==========================================================================
  // RE-ENTRY FLOW DETECTION
  // ==========================================================================

  /**
   * Calculate inactivity and determine if re-entry flow is needed.
   * Returns the appropriate grace message based on gap duration.
   */
  calculateInactivityState(journey: UserJourney): {
    hoursInactive: number;
    shouldTriggerReentry: boolean;
    graceMessage: GraceNotification | null;
  } {
    const lastActive = new Date(journey.lastActiveTimestamp);
    const now = new Date();
    const hoursInactive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

    // Check which grace interval applies
    if (hoursInactive >= 336) {
      // 14+ days
      return {
        hoursInactive,
        shouldTriggerReentry: true,
        graceMessage: GRACE_NOTIFICATIONS['14d'],
      };
    } else if (hoursInactive >= 72) {
      // 3+ days
      return {
        hoursInactive,
        shouldTriggerReentry: false,
        graceMessage: GRACE_NOTIFICATIONS['72h'],
      };
    } else if (hoursInactive >= 24) {
      // 1+ days
      return {
        hoursInactive,
        shouldTriggerReentry: false,
        graceMessage: GRACE_NOTIFICATIONS['24h'],
      };
    }

    return {
      hoursInactive,
      shouldTriggerReentry: false,
      graceMessage: null,
    };
  }

  // ==========================================================================
  // COMPASSIONATE MESSAGING HELPERS
  // ==========================================================================

  /**
   * Generate a welcome back message that holds no shame.
   * NEGATIVE CONSTRAINT: Never mention missed days or broken streaks.
   */
  generateWelcomeBackMessage(hoursInactive: number): {
    title: string;
    message: string;
    showProgress: boolean;
  } {
    const daysInactive = Math.floor(hoursInactive / 24);

    // FORBIDDEN: "You missed X days" or "Your streak was X days"
    // ALLOWED: Compassionate acknowledgment of return

    if (daysInactive >= 14) {
      return {
        title: 'Welcome home',
        message:
          'Your sanctuary has been waiting patiently. The journey continues from exactly where you left off. No rush. No pressure. Just presence.',
        showProgress: false, // Don't show any stats that could induce shame
      };
    }

    if (daysInactive >= 7) {
      return {
        title: 'You\'re here',
        message:
          'And that\'s all that matters. Life happens. Healing isn\'t linear. Your tea is ready whenever you are.',
        showProgress: false,
      };
    }

    if (daysInactive >= 3) {
      return {
        title: 'Welcome back',
        message:
          'The space has been held for you. Shall we continue?',
        showProgress: true, // Safe to show progress gently
      };
    }

    return {
      title: 'Good to see you',
      message: 'Ready when you are.',
      showProgress: true,
    };
  }

  /**
   * Format progress in Total Volume terms, never consecutive terms.
   * FORBIDDEN: "5 day streak", "X days in a row"
   * ALLOWED: "15 days completed", "Your journey"
   */
  formatProgressWithGrace(journey: UserJourney): {
    totalLabel: string;
    totalValue: string;
    journeyLabel: string;
    journeyValue: string;
  } {
    return {
      totalLabel: 'Days Completed',
      totalValue: `${journey.totalDaysCompleted} of 40`,
      journeyLabel: 'Current Day',
      journeyValue: `Day ${journey.currentDayIndex}`,
    };
  }

  // ==========================================================================
  // OPT-OUT HANDLING
  // ==========================================================================

  async setOptOut(optOut: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.OPT_OUT, optOut.toString());

    if (optOut) {
      await this.cancelAllGraceNotifications();
    }
  }

  async getOptOut(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.OPT_OUT);
    return value === 'true';
  }
}

// ============================================================================
// GRACE PROTOCOL HOOKS
// ============================================================================

import { useEffect, useCallback, useState } from 'react';

/**
 * Hook to manage Grace Protocol state and actions
 */
export function useGraceProtocol(journey: UserJourney | null) {
  const [inactivityState, setInactivityState] = useState<{
    hoursInactive: number;
    shouldTriggerReentry: boolean;
    graceMessage: GraceNotification | null;
  } | null>(null);

  const graceService = GraceProtocolService.getInstance();

  // Calculate inactivity on mount and journey change
  useEffect(() => {
    if (!journey) {
      setInactivityState(null);
      return;
    }

    const state = graceService.calculateInactivityState(journey);
    setInactivityState(state);
  }, [journey?.lastActiveTimestamp]);

  // Schedule notifications when app backgrounds
  const scheduleNotifications = useCallback(async () => {
    if (!journey) return;
    await graceService.scheduleGraceNotifications(journey);
  }, [journey]);

  // Get welcome back message
  const getWelcomeBackMessage = useCallback(() => {
    if (!inactivityState) return null;
    return graceService.generateWelcomeBackMessage(inactivityState.hoursInactive);
  }, [inactivityState]);

  // Format progress without shame
  const getGracefulProgress = useCallback(() => {
    if (!journey) return null;
    return graceService.formatProgressWithGrace(journey);
  }, [journey]);

  return {
    inactivityState,
    scheduleNotifications,
    getWelcomeBackMessage,
    getGracefulProgress,
    shouldShowReentry: inactivityState?.shouldTriggerReentry ?? false,
  };
}

// ============================================================================
// APP LIFECYCLE INTEGRATION
// ============================================================================

import { AppState, AppStateStatus } from 'react-native';

/**
 * Setup Grace Protocol app lifecycle handlers.
 * Call this once at app initialization.
 */
export function setupGraceProtocolLifecycle(
  getJourney: () => UserJourney | null
): () => void {
  const graceService = GraceProtocolService.getInstance();

  // Initialize service
  graceService.initialize();

  // Handle app state changes
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const journey = getJourney();

    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background - schedule grace notifications
      if (journey) {
        await graceService.scheduleGraceNotifications(journey);
      }
    } else if (nextAppState === 'active') {
      // App coming to foreground - cancel pending notifications
      await graceService.cancelAllGraceNotifications();
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}

// ============================================================================
// NOTIFICATION RESPONSE HANDLER
// ============================================================================

/**
 * Handle when user taps on a Grace Protocol notification.
 * Routes to appropriate screen based on notification type.
 */
export async function handleGraceNotificationResponse(
  response: Notifications.NotificationResponse,
  navigation: any,
  journey: UserJourney | null
): Promise<void> {
  const data = response.notification.request.content.data;

  if (data?.type !== 'grace_protocol') return;
  if (!journey) return;

  const graceService = GraceProtocolService.getInstance();
  const inactivityState = graceService.calculateInactivityState(journey);

  if (inactivityState.shouldTriggerReentry) {
    // 14+ days - show full welcome back flow
    navigation.navigate('WelcomeBack', {
      daysSinceActive: Math.floor(inactivityState.hoursInactive / 24),
    });
  } else {
    // Less than 14 days - go directly to current day
    navigation.navigate('DayModule', {
      dayId: journey.currentDayIndex,
    });
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const graceProtocol = GraceProtocolService.getInstance();
