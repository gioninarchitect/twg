/**
 * Notification Context - Gentle Reminders System
 *
 * PRD: "Gentle morning reminders (user-set time)"
 * Anti-Shame Directive: No guilt-inducing messages, warm invitations only
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage key
const NOTIFICATION_KEY = '@twg_notifications';

// Gentle reminder messages - no shame, only warmth
const GENTLE_MESSAGES = [
  {
    title: 'A moment awaits',
    body: 'Your sanctuary is ready whenever you are.',
  },
  {
    title: 'Good morning',
    body: 'A cup of tea and a quiet moment with God?',
  },
  {
    title: 'No rush',
    body: 'Your healing journey continues at your own pace.',
  },
  {
    title: 'A gentle invitation',
    body: 'Today\'s reflection is waiting for you.',
  },
  {
    title: 'When you\'re ready',
    body: 'A peaceful moment of healing awaits.',
  },
  {
    title: 'Just checking in',
    body: 'Your safe space is here whenever you need it.',
  },
  {
    title: 'A quiet reminder',
    body: 'There\'s no pressure, just presence.',
  },
];

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationSettings {
  enabled: boolean;
  reminderTime: { hour: number; minute: number };
  permissionGranted: boolean;
}

interface NotificationContextType extends NotificationSettings {
  // Request notification permissions
  requestPermissions: () => Promise<boolean>;

  // Toggle notifications on/off
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;

  // Set reminder time
  setReminderTime: (hour: number, minute: number) => Promise<void>;

  // Schedule next notification
  scheduleReminder: () => Promise<void>;

  // Cancel all scheduled notifications
  cancelAllReminders: () => Promise<void>;

  // Loading state
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    reminderTime: { hour: 8, minute: 0 }, // Default: 8:00 AM
    permissionGranted: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Reschedule when settings change
  useEffect(() => {
    if (!isLoading && settings.enabled && settings.permissionGranted) {
      scheduleReminder();
    }
  }, [settings.enabled, settings.reminderTime, isLoading]);

  async function loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
      }

      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();
      setSettings(prev => ({
        ...prev,
        permissionGranted: status === 'granted',
      }));
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSettings(newSettings: NotificationSettings) {
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(NOTIFICATION_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('Notifications not available on simulator');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      await saveSettings({ ...settings, permissionGranted: true });
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';

    await saveSettings({ ...settings, permissionGranted: granted });
    return granted;
  }, [settings]);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && !settings.permissionGranted) {
      const granted = await requestPermissions();
      if (!granted) {
        return;
      }
    }

    await saveSettings({ ...settings, enabled });

    if (!enabled) {
      await cancelAllReminders();
    } else {
      await scheduleReminder();
    }
  }, [settings]);

  const setReminderTime = useCallback(async (hour: number, minute: number) => {
    await saveSettings({
      ...settings,
      reminderTime: { hour, minute },
    });
  }, [settings]);

  const scheduleReminder = useCallback(async () => {
    if (!settings.enabled || !settings.permissionGranted) {
      return;
    }

    // Cancel existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Get a random gentle message
    const message = GENTLE_MESSAGES[Math.floor(Math.random() * GENTLE_MESSAGES.length)];

    // Schedule for tomorrow at the specified time
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.reminderTime.hour,
      minute: settings.reminderTime.minute,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: false,
        data: { type: 'daily_reminder' },
      },
      trigger,
    });
  }, [settings]);

  const cancelAllReminders = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  const value: NotificationContextType = {
    ...settings,
    requestPermissions,
    setNotificationsEnabled,
    setReminderTime,
    scheduleReminder,
    cancelAllReminders,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
