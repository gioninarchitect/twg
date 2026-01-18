/**
 * Platform-aware Haptics Utility
 * expo-haptics doesn't work on web, so we need safe wrappers
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const safeHaptics = {
  impactAsync: async (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(style);
      } catch (e) {
        // Silently fail if haptics unavailable
      }
    }
  },
  notificationAsync: async (type: Haptics.NotificationFeedbackType) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(type);
      } catch (e) {
        // Silently fail if haptics unavailable
      }
    }
  },
  selectionAsync: async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.selectionAsync();
      } catch (e) {
        // Silently fail if haptics unavailable
      }
    }
  },
};

// Re-export Haptics types for convenience
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
