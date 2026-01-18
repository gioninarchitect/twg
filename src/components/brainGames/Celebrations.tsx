/**
 * Celebrations & Micro-Rewards Component
 * Dopamine-aware celebrations that reinforce positive behavior
 * Based on research: Variable rewards > predictable rewards
 * Key insight: Dopamine = anticipation, not reward itself
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GRADIENTS } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// CELEBRATION TYPES
// ============================================

type CelebrationType =
  | 'session_complete'
  | 'streak_milestone'
  | 'first_game'
  | 'daily_goal'
  | 'healing_stage'
  | 'gratitude_garden'
  | 'scripture_mastery'
  | 'thought_reframe'
  | 'body_awareness';

interface CelebrationConfig {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  particles: boolean;
  hapticPattern: 'light' | 'medium' | 'success' | 'celebration';
  duration: number;
  goldShimmer: boolean;
}

const CELEBRATION_CONFIGS: Record<CelebrationType, CelebrationConfig> = {
  session_complete: {
    title: 'Well Done',
    subtitle: 'You showed up for yourself',
    icon: 'checkmark-circle',
    color: COLORS.sage,
    particles: false,
    hapticPattern: 'success',
    duration: 2500,
    goldShimmer: false,
  },
  streak_milestone: {
    title: 'Streak Milestone!',
    subtitle: 'Consistency is golden',
    icon: 'flame',
    color: COLORS.gold,
    particles: true,
    hapticPattern: 'celebration',
    duration: 3500,
    goldShimmer: true,
  },
  first_game: {
    title: 'First Steps',
    subtitle: 'Your journey begins',
    icon: 'sparkles',
    color: COLORS.goldLight,
    particles: true,
    hapticPattern: 'celebration',
    duration: 3000,
    goldShimmer: true,
  },
  daily_goal: {
    title: 'Daily Goal Reached',
    subtitle: 'You honored your commitment',
    icon: 'trophy',
    color: COLORS.gold,
    particles: true,
    hapticPattern: 'celebration',
    duration: 3000,
    goldShimmer: true,
  },
  healing_stage: {
    title: 'New Growth Stage',
    subtitle: 'The gold is filling your cracks',
    icon: 'heart',
    color: COLORS.gold,
    particles: true,
    hapticPattern: 'celebration',
    duration: 4000,
    goldShimmer: true,
  },
  gratitude_garden: {
    title: 'Garden Growing',
    subtitle: 'Your thankfulness blossoms',
    icon: 'flower',
    color: '#88B5A5',
    particles: true,
    hapticPattern: 'medium',
    duration: 2500,
    goldShimmer: false,
  },
  scripture_mastery: {
    title: 'Scripture Memorized',
    subtitle: 'Hidden in your heart',
    icon: 'book',
    color: '#8BA5B5',
    particles: true,
    hapticPattern: 'success',
    duration: 3000,
    goldShimmer: false,
  },
  thought_reframe: {
    title: 'Thought Transformed',
    subtitle: 'New perspective unlocked',
    icon: 'bulb',
    color: '#B5A888',
    particles: false,
    hapticPattern: 'medium',
    duration: 2500,
    goldShimmer: false,
  },
  body_awareness: {
    title: 'Body Listened To',
    subtitle: 'Tension released with grace',
    icon: 'body',
    color: '#B5888D',
    particles: false,
    hapticPattern: 'light',
    duration: 2500,
    goldShimmer: false,
  },
};

// ============================================
// MICRO CELEBRATION (Toast Style)
// ============================================

interface MicroCelebrationProps {
  visible: boolean;
  type: CelebrationType;
  customMessage?: string;
  onComplete: () => void;
}

export function MicroCelebration({
  visible,
  type,
  customMessage,
  onComplete,
}: MicroCelebrationProps) {
  const config = CELEBRATION_CONFIGS[type];
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptics
      triggerHaptics(config.hapticPattern);

      // Start shimmer animation if enabled
      if (config.goldShimmer) {
        Animated.loop(
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        ).start();
      }

      // Entrance animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete();
        });
      }, config.duration);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.microContainer,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.microCard, { borderLeftColor: config.color }]}>
        {/* Shimmer effect */}
        {config.goldShimmer && (
          <Animated.View
            style={[
              styles.shimmerOverlay,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        )}

        <View style={[styles.microIcon, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        <View style={styles.microContent}>
          <Text style={styles.microTitle}>{config.title}</Text>
          <Text style={styles.microSubtitle}>
            {customMessage || config.subtitle}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ============================================
// FULL CELEBRATION (Modal Style)
// ============================================

interface FullCelebrationProps {
  visible: boolean;
  type: CelebrationType;
  customTitle?: string;
  customSubtitle?: string;
  stats?: Array<{ label: string; value: string | number }>;
  onDismiss: () => void;
}

export function FullCelebration({
  visible,
  type,
  customTitle,
  customSubtitle,
  stats,
  onDismiss,
}: FullCelebrationProps) {
  const config = CELEBRATION_CONFIGS[type];
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 12 }, () => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Trigger celebration haptics
      triggerHaptics('celebration');

      // Main icon animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtle rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Particle explosions
      if (config.particles) {
        particleAnims.forEach((anim, index) => {
          const angle = (index / 12) * Math.PI * 2;
          const distance = 100 + Math.random() * 50;

          Animated.parallel([
            Animated.timing(anim.x, {
              toValue: Math.cos(angle) * distance,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: Math.sin(angle) * distance,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 1000,
              delay: 500,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }

      // Auto dismiss
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      particleAnims.forEach((anim) => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.opacity.setValue(1);
      });
    }
  }, [visible]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.fullOverlay}>
        <View style={styles.fullContainer}>
          {/* Particles */}
          {config.particles && (
            <View style={styles.particlesContainer}>
              {particleAnims.map((anim, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.particle,
                    {
                      backgroundColor: index % 2 === 0 ? COLORS.gold : COLORS.goldLight,
                      transform: [
                        { translateX: anim.x },
                        { translateY: anim.y },
                      ],
                      opacity: anim.opacity,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Main Icon */}
          <Animated.View
            style={[
              styles.fullIconContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotation },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={config.goldShimmer
                ? GRADIENTS.gold.colors as [string, string, ...string[]]
                : [config.color, config.color]
              }
              style={styles.fullIconGradient}
            >
              <Ionicons name={config.icon} size={48} color={COLORS.earth} />
            </LinearGradient>
          </Animated.View>

          {/* Text */}
          <Text style={styles.fullTitle}>
            {customTitle || config.title}
          </Text>
          <Text style={styles.fullSubtitle}>
            {customSubtitle || config.subtitle}
          </Text>

          {/* Stats */}
          {stats && stats.length > 0 && (
            <View style={styles.statsRow}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tap to dismiss hint */}
          <Text style={styles.dismissHint}>Tap anywhere to continue</Text>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// STREAK CELEBRATION
// ============================================

interface StreakCelebrationProps {
  visible: boolean;
  streakDays: number;
  onDismiss: () => void;
}

export function StreakCelebration({
  visible,
  streakDays,
  onDismiss,
}: StreakCelebrationProps) {
  const isMilestone = [7, 14, 21, 30, 40].includes(streakDays);

  return (
    <FullCelebration
      visible={visible}
      type="streak_milestone"
      customTitle={isMilestone ? `${streakDays} Day Milestone!` : `${streakDays} Day Streak!`}
      customSubtitle={getStreakMessage(streakDays)}
      stats={[
        { label: 'Days', value: streakDays },
        { label: 'Status', value: getStreakStatus(streakDays) },
      ]}
      onDismiss={onDismiss}
    />
  );
}

// ============================================
// GARDEN LEVEL UP CELEBRATION
// ============================================

interface GardenLevelUpProps {
  visible: boolean;
  newLevel: 1 | 2 | 3 | 4 | 5;
  onDismiss: () => void;
}

const GARDEN_LEVELS = {
  1: { name: 'Seeds', description: 'Your garden is planted' },
  2: { name: 'Sprouts', description: 'New growth is appearing' },
  3: { name: 'Flowers', description: 'Beauty is blooming' },
  4: { name: 'Blooming', description: 'Your garden flourishes' },
  5: { name: 'Sanctuary', description: 'A place of peace' },
};

export function GardenLevelUp({
  visible,
  newLevel,
  onDismiss,
}: GardenLevelUpProps) {
  const levelInfo = GARDEN_LEVELS[newLevel];

  return (
    <FullCelebration
      visible={visible}
      type="gratitude_garden"
      customTitle={`Garden: ${levelInfo.name}`}
      customSubtitle={levelInfo.description}
      stats={[
        { label: 'Level', value: newLevel },
      ]}
      onDismiss={onDismiss}
    />
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function triggerHaptics(pattern: 'light' | 'medium' | 'success' | 'celebration') {
  switch (pattern) {
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'celebration':
      // Triple pulse for celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
      break;
  }
}

function getStreakMessage(streak: number): string {
  if (streak >= 40) return 'You completed the journey!';
  if (streak >= 30) return 'Extraordinary commitment';
  if (streak >= 21) return 'A habit is forming';
  if (streak >= 14) return 'Two weeks strong';
  if (streak >= 7) return 'One week of dedication';
  if (streak >= 3) return 'Momentum building';
  return 'Every day matters';
}

function getStreakStatus(streak: number): string {
  if (streak >= 30) return 'Master';
  if (streak >= 21) return 'Dedicated';
  if (streak >= 14) return 'Committed';
  if (streak >= 7) return 'Growing';
  return 'Beginning';
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Micro Celebration
  microContainer: {
    position: 'absolute',
    top: 60,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 1000,
  },
  microCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 4,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  microIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  microContent: {
    flex: 1,
  },
  microTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  microSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },

  // Full Celebration
  fullOverlay: {
    flex: 1,
    backgroundColor: 'rgba(93, 78, 55, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullContainer: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  particlesContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fullIconContainer: {
    marginBottom: SPACING.xl,
    ...SHADOWS.glow,
  },
  fullIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullTitle: {
    fontSize: TYPOGRAPHY.sizes.display,
    fontWeight: '700',
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  fullSubtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.goldLight,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: '700',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dismissHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.lg,
  },
});

export { CelebrationType };
export default MicroCelebration;
