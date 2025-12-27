/**
 * Brain Games - Feedback Components
 * Success screens, achievements, and feedback animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GRADIENTS } from '../../theme/colors';
import { GAME_ANIMATIONS, HAPTIC_PATTERNS } from '../../theme/brainGames';
import { Button, GradientButton } from '../PremiumUI';

// ============================================
// SESSION COMPLETE SCREEN
// ============================================

interface SessionCompleteProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  stats: Array<{
    label: string;
    value: string | number;
  }>;
  encouragement?: string;
  onContinue: () => void;
  onPlayAgain?: () => void;
  continueLabel?: string;
}

export function SessionComplete({
  visible,
  title,
  subtitle,
  stats,
  encouragement,
  onContinue,
  onPlayAgain,
  continueLabel = 'Continue',
}: SessionCompleteProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.completeOverlay}>
        <Animated.View
          style={[
            styles.completeContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.successIcon}>
            <LinearGradient
              colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
              style={styles.successGradient}
            >
              <Ionicons name="checkmark" size={36} color={COLORS.earth} />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.completeTitle}>{title}</Text>
          {subtitle && <Text style={styles.completeSubtitle}>{subtitle}</Text>}

          {/* Stats */}
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statBox}>
                <Text style={styles.statValueLarge}>{stat.value}</Text>
                <Text style={styles.statLabelSmall}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Encouragement */}
          {encouragement && (
            <View style={styles.encouragementBox}>
              <Text style={styles.encouragementText}>{encouragement}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.completeActions}>
            <GradientButton
              title={continueLabel}
              onPress={onContinue}
              style={styles.continueButton}
            />
            {onPlayAgain && (
              <Button
                title="Play Again"
                variant="ghost"
                onPress={onPlayAgain}
                style={styles.playAgainButton}
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================
// INLINE FEEDBACK
// ============================================

interface InlineFeedbackProps {
  type: 'success' | 'error' | 'hint' | 'neutral';
  message: string;
  visible: boolean;
  style?: object;
}

export function InlineFeedback({
  type,
  message,
  visible,
  style,
}: InlineFeedbackProps) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic based on type
      if (type === 'success') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getTypeStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: COLORS.sage, borderColor: COLORS.sage };
      case 'error':
        return { backgroundColor: COLORS.mutedTerracotta, borderColor: COLORS.mutedTerracotta };
      case 'hint':
        return { backgroundColor: COLORS.dustyBlue, borderColor: COLORS.dustyBlue };
      default:
        return { backgroundColor: COLORS.warmBeige, borderColor: COLORS.warmBeige };
    }
  };

  return (
    <Animated.View
      style={[
        styles.inlineFeedback,
        getTypeStyle(),
        { transform: [{ translateY }], opacity },
        style,
      ]}
    >
      <Text style={styles.inlineFeedbackText}>{message}</Text>
    </Animated.View>
  );
}

// ============================================
// STREAK NOTIFICATION
// ============================================

interface StreakNotificationProps {
  visible: boolean;
  streakCount: number;
  message?: string;
  onDismiss: () => void;
}

export function StreakNotification({
  visible,
  streakCount,
  message,
  onDismiss,
}: StreakNotificationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3 seconds
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.streakContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <LinearGradient
        colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
        style={styles.streakGradient}
      >
        <Ionicons name="flame" size={32} color={COLORS.earth} />
        <Text style={styles.streakCount}>{streakCount}</Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
        {message && <Text style={styles.streakMessage}>{message}</Text>}
      </LinearGradient>
    </Animated.View>
  );
}

// ============================================
// ACHIEVEMENT TOAST
// ============================================

interface AchievementToastProps {
  visible: boolean;
  title: string;
  description: string;
  onDismiss: () => void;
}

export function AchievementToast({
  visible,
  title,
  description,
  onDismiss,
}: AchievementToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(onDismiss);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.achievementContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.achievementIcon}>
        <Ionicons name="star" size={24} color={COLORS.gold} />
      </View>
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{title}</Text>
        <Text style={styles.achievementDescription}>{description}</Text>
      </View>
    </Animated.View>
  );
}

// ============================================
// DISCLAIMER MODAL
// ============================================

interface DisclaimerModalProps {
  visible: boolean;
  title: string;
  content: string;
  onAccept: () => void;
  onDecline?: () => void;
}

export function DisclaimerModal({
  visible,
  title,
  content,
  onAccept,
  onDecline,
}: DisclaimerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.disclaimerOverlay}>
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerTitle}>{title}</Text>
          <Text style={styles.disclaimerContent}>{content}</Text>

          <View style={styles.disclaimerActions}>
            {onDecline && (
              <Button
                title="Decline"
                variant="ghost"
                onPress={onDecline}
                style={styles.disclaimerButton}
              />
            )}
            <Button
              title="I Understand"
              variant="primary"
              onPress={onAccept}
              style={styles.disclaimerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Session Complete
  completeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(93, 78, 55, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  completeContainer: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...SHADOWS.strong,
  },
  successIcon: {
    marginBottom: SPACING.lg,
  },
  successGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  successCheck: {
    fontSize: 32,
    color: COLORS.earth,
  },
  completeTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  statValueLarge: {
    fontSize: TYPOGRAPHY.sizes.display,
    fontWeight: '700',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  statLabelSmall: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  encouragementBox: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  encouragementText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },
  completeActions: {
    width: '100%',
  },
  continueButton: {
    marginBottom: SPACING.sm,
  },
  playAgainButton: {},

  // Inline Feedback
  inlineFeedback: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  inlineFeedbackText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },

  // Streak Notification
  streakContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    ...SHADOWS.strong,
  },
  streakGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  streakCount: {
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: '700',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  streakLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
  },
  streakMessage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.sm,
  },

  // Achievement Toast
  achievementContainer: {
    position: 'absolute',
    top: 60,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  achievementStar: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  achievementDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },

  // Disclaimer Modal
  disclaimerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(93, 78, 55, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  disclaimerContainer: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
  },
  disclaimerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  disclaimerContent: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
    marginBottom: SPACING.lg,
  },
  disclaimerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  disclaimerButton: {
    minWidth: 100,
  },
});
