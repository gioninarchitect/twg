/**
 * Kintsugi Progress Component
 * Visual representation of healing journey as golden cracks being filled
 * Based on research: Visual progress increases completion by 35%
 *
 * The Kintsugi metaphor: "She was broken, but beautiful. Like pottery mended with gold."
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GRADIENTS } from '../../theme/colors';
import { GameId, HealingTrajectory } from '../../worldModel/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// HEALING JOURNEY STAGES
// ============================================

interface HealingStage {
  name: string;
  description: string;
  minDay: number;
  maxDay: number;
  color: string;
  goldFill: number; // 0-1, how much gold is visible
}

const HEALING_STAGES: HealingStage[] = [
  {
    name: 'Acknowledgment',
    description: 'Recognizing the cracks',
    minDay: 1,
    maxDay: 10,
    color: '#9B8AA3',
    goldFill: 0.15,
  },
  {
    name: 'Understanding',
    description: 'Seeing the patterns',
    minDay: 11,
    maxDay: 20,
    color: '#8BA5B5',
    goldFill: 0.4,
  },
  {
    name: 'Transformation',
    description: 'Gold filling the cracks',
    minDay: 21,
    maxDay: 30,
    color: '#B5A888',
    goldFill: 0.7,
  },
  {
    name: 'Integration',
    description: 'Beauty in the mending',
    minDay: 31,
    maxDay: 40,
    color: COLORS.gold,
    goldFill: 1.0,
  },
];

// ============================================
// COMPONENT PROPS
// ============================================

interface KintsugiProgressProps {
  currentDay: number;
  totalDays?: number;
  healingTrajectory: HealingTrajectory;
  gameStats: {
    totalSessions: number;
    breathingMinutes: number;
    gratitudeEntries: number;
    thoughtsReframed: number;
    bodyScans: number;
    scriptureMastery: number;
  };
  compact?: boolean;
  showStats?: boolean;
  onPress?: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function KintsugiProgress({
  currentDay,
  totalDays = 40,
  healingTrajectory,
  gameStats,
  compact = false,
  showStats = true,
  onPress,
}: KintsugiProgressProps) {
  const goldAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Calculate current stage
  const currentStage = HEALING_STAGES.find(
    (stage) => currentDay >= stage.minDay && currentDay <= stage.maxDay
  ) || HEALING_STAGES[0];

  const overallProgress = currentDay / totalDays;
  const stageProgress = currentStage
    ? (currentDay - currentStage.minDay) / (currentStage.maxDay - currentStage.minDay + 1)
    : 0;

  // Animate gold filling
  useEffect(() => {
    Animated.spring(goldAnim, {
      toValue: currentStage.goldFill,
      friction: 8,
      useNativeDriver: false,
    }).start();

    // Subtle glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [currentDay, currentStage.goldFill]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactVessel}>
          <KintsugiVessel
            progress={overallProgress}
            goldFill={currentStage.goldFill}
            size={60}
          />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactStage}>{currentStage.name}</Text>
          <Text style={styles.compactDay}>Day {currentDay} of {totalDays}</Text>
        </View>
        <TrajectoryIndicator trajectory={healingTrajectory} compact />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Kintsugi Vessel Visualization */}
      <Animated.View
        style={[
          styles.vesselContainer,
          { shadowOpacity: glowOpacity },
        ]}
      >
        <KintsugiVessel
          progress={overallProgress}
          goldFill={currentStage.goldFill}
          size={180}
        />
      </Animated.View>

      {/* Stage Info */}
      <View style={styles.stageInfo}>
        <Text style={styles.stageName}>{currentStage.name}</Text>
        <Text style={styles.stageDescription}>{currentStage.description}</Text>
      </View>

      {/* Day Progress */}
      <View style={styles.dayProgress}>
        <Text style={styles.dayNumber}>Day {currentDay}</Text>
        <Text style={styles.dayTotal}>of {totalDays}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${overallProgress * 100}%` },
            ]}
          >
            <LinearGradient
              colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressGradient}
            />
          </Animated.View>
        </View>

        {/* Stage Markers */}
        <View style={styles.stageMarkers}>
          {HEALING_STAGES.map((stage, index) => (
            <View
              key={stage.name}
              style={[
                styles.stageMarker,
                { left: `${((stage.maxDay / totalDays) * 100)}%` },
                currentDay >= stage.maxDay && styles.stageMarkerComplete,
              ]}
            >
              <View
                style={[
                  styles.markerDot,
                  currentDay >= stage.maxDay && styles.markerDotComplete,
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Trajectory Indicator */}
      <TrajectoryIndicator trajectory={healingTrajectory} />

      {/* Game Stats */}
      {showStats && (
        <View style={styles.statsGrid}>
          <StatItem
            icon="leaf-outline"
            value={`${gameStats.breathingMinutes}m`}
            label="Breathing"
          />
          <StatItem
            icon="flower-outline"
            value={gameStats.gratitudeEntries}
            label="Gratitudes"
          />
          <StatItem
            icon="search-outline"
            value={gameStats.thoughtsReframed}
            label="Reframed"
          />
          <StatItem
            icon="sparkles-outline"
            value={gameStats.totalSessions}
            label="Sessions"
          />
        </View>
      )}

      {/* Encouragement */}
      <View style={styles.encouragementBox}>
        <Ionicons name="heart" size={16} color={COLORS.gold} />
        <Text style={styles.encouragementText}>
          {getEncouragement(healingTrajectory, currentStage.name)}
        </Text>
      </View>
    </View>
  );
}

// ============================================
// KINTSUGI VESSEL COMPONENT
// ============================================

interface KintsugiVesselProps {
  progress: number;
  goldFill: number;
  size: number;
}

function KintsugiVessel({ progress, goldFill, size }: KintsugiVesselProps) {
  // Create a stylized tea cup with cracks that fill with gold
  return (
    <View style={[styles.vessel, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.goldLight} />
            <Stop offset="50%" stopColor={COLORS.gold} />
            <Stop offset="100%" stopColor={COLORS.goldDark} />
          </SvgGradient>
          <SvgGradient id="vesselGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.warmBeige} />
            <Stop offset="100%" stopColor={COLORS.softIvory} />
          </SvgGradient>
        </Defs>

        {/* Tea Cup Base */}
        <G>
          {/* Cup Body */}
          <Path
            d="M20 35 Q20 75 50 80 Q80 75 80 35 L80 30 L20 30 Z"
            fill="url(#vesselGradient)"
            stroke={COLORS.mutedBrown}
            strokeWidth="1"
          />

          {/* Cup Handle */}
          <Path
            d="M80 40 Q95 40 95 55 Q95 70 80 70"
            fill="none"
            stroke={COLORS.mutedBrown}
            strokeWidth="3"
          />

          {/* Cup Rim */}
          <Path
            d="M18 30 Q18 25 50 25 Q82 25 82 30"
            fill="none"
            stroke={COLORS.mutedBrown}
            strokeWidth="2"
          />
        </G>

        {/* Gold Cracks - appear based on progress */}
        <G opacity={goldFill}>
          {/* Crack 1 - Main crack */}
          <Path
            d="M30 35 Q35 45 33 55 Q30 65 35 75"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Crack 2 */}
          <Path
            d="M50 30 Q55 40 52 50 Q48 60 55 70 Q60 75 58 80"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={goldFill > 0.3 ? 1 : goldFill / 0.3}
          />

          {/* Crack 3 */}
          <Path
            d="M70 35 Q65 45 68 55 Q72 65 67 75"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={goldFill > 0.5 ? 1 : 0}
          />

          {/* Branch cracks */}
          <Path
            d="M33 50 Q40 48 45 52"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={goldFill > 0.4 ? 1 : 0}
          />

          <Path
            d="M52 55 Q58 52 65 55"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={goldFill > 0.6 ? 1 : 0}
          />

          <Path
            d="M35 65 Q42 68 48 65"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={goldFill > 0.7 ? 1 : 0}
          />

          {/* Final healing lines */}
          <Path
            d="M55 70 Q60 68 65 70"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={goldFill > 0.8 ? 1 : 0}
          />

          <Path
            d="M40 75 Q48 78 55 75"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={goldFill > 0.9 ? 1 : 0}
          />
        </G>

        {/* Steam (only if highly progressed) */}
        {goldFill > 0.5 && (
          <G opacity={goldFill - 0.5}>
            <Path
              d="M35 20 Q37 15 35 10"
              fill="none"
              stroke={COLORS.gold}
              strokeWidth="2"
              strokeLinecap="round"
              opacity={0.5}
            />
            <Path
              d="M50 18 Q52 12 50 6"
              fill="none"
              stroke={COLORS.gold}
              strokeWidth="2"
              strokeLinecap="round"
              opacity={0.6}
            />
            <Path
              d="M65 20 Q63 14 65 8"
              fill="none"
              stroke={COLORS.gold}
              strokeWidth="2"
              strokeLinecap="round"
              opacity={0.5}
            />
          </G>
        )}
      </Svg>
    </View>
  );
}

// ============================================
// TRAJECTORY INDICATOR
// ============================================

interface TrajectoryIndicatorProps {
  trajectory: HealingTrajectory;
  compact?: boolean;
}

function TrajectoryIndicator({ trajectory, compact }: TrajectoryIndicatorProps) {
  const config = {
    accelerating: {
      icon: 'trending-up-outline' as const,
      color: '#88B5A5',
      label: 'Growing strong',
    },
    steady: {
      icon: 'arrow-forward-outline' as const,
      color: COLORS.gold,
      label: 'Steady progress',
    },
    plateaued: {
      icon: 'pause-outline' as const,
      color: '#B5A888',
      label: 'Consolidating',
    },
    struggling: {
      icon: 'heart-outline' as const,
      color: '#9B8AA3',
      label: 'Be gentle',
    },
  };

  const current = config[trajectory];

  if (compact) {
    return (
      <View style={[styles.trajectoryCompact, { backgroundColor: current.color + '20' }]}>
        <Ionicons name={current.icon} size={16} color={current.color} />
      </View>
    );
  }

  return (
    <View style={[styles.trajectoryContainer, { backgroundColor: current.color + '15' }]}>
      <Ionicons name={current.icon} size={20} color={current.color} />
      <Text style={[styles.trajectoryText, { color: current.color }]}>
        {current.label}
      </Text>
    </View>
  );
}

// ============================================
// STAT ITEM
// ============================================

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={20} color={COLORS.gold} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getEncouragement(trajectory: HealingTrajectory, stage: string): string {
  const encouragements: Record<HealingTrajectory, string[]> = {
    accelerating: [
      'Your healing is blossoming beautifully.',
      'The gold is shining through your cracks.',
      'You\'re becoming more beautiful through this journey.',
    ],
    steady: [
      'Every small step is a victory.',
      'Consistency is creating lasting change.',
      'You\'re building something beautiful.',
    ],
    plateaued: [
      'Rest is part of the healing process.',
      'Sometimes we need to pause before the next growth.',
      'Your heart is integrating what you\'ve learned.',
    ],
    struggling: [
      'It\'s okay to struggle. Healing isn\'t linear.',
      'Be gentle with yourself today.',
      'Even the smallest effort matters.',
    ],
  };

  const options = encouragements[trajectory];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  compactVessel: {
    marginRight: SPACING.sm,
  },
  compactInfo: {
    flex: 1,
  },
  compactStage: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  compactDay: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  vesselContainer: {
    marginBottom: SPACING.lg,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 8,
  },
  vessel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageInfo: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stageName: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  stageDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
    marginTop: 4,
  },
  dayProgress: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.lg,
  },
  dayNumber: {
    fontSize: TYPOGRAPHY.sizes.display,
    fontWeight: '700',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  dayTotal: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  stageMarkers: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 16,
  },
  stageMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  stageMarkerComplete: {
    // Active marker
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.warmBeige,
    borderWidth: 2,
    borderColor: COLORS.cream,
  },
  markerDotComplete: {
    backgroundColor: COLORS.gold,
  },
  trajectoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  trajectoryText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
  },
  trajectoryCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.warmBeige,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 4,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  encouragementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldLight + '20',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  encouragementText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    flex: 1,
  },
});

export default KintsugiProgress;
