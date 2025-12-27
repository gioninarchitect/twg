/**
 * Brain Games - Progress Components
 * Timers, progress bars, and session indicators
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/colors';
import { GAME_ANIMATIONS } from '../../theme/brainGames';

// ============================================
// SESSION TIMER
// ============================================

interface SessionTimerProps {
  isRunning: boolean;
  onTick?: (seconds: number) => void;
  initialSeconds?: number;
  style?: object;
}

export function SessionTimer({
  isRunning,
  onTick,
  initialSeconds = 0,
  style,
}: SessionTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newValue = prev + 1;
          onTick?.(newValue);
          return newValue;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTick]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.timerContainer, style]}>
      <Text style={styles.timerText}>{formatTime(seconds)}</Text>
    </View>
  );
}

// ============================================
// COUNTDOWN TIMER
// ============================================

interface CountdownTimerProps {
  seconds: number;
  isRunning: boolean;
  onComplete: () => void;
  style?: object;
  showCircle?: boolean;
}

export function CountdownTimer({
  seconds,
  isRunning,
  onComplete,
  style,
  showCircle = true,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const animatedValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setRemaining(seconds);
    animatedValue.setValue(1);
  }, [seconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && remaining > 0) {
      interval = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Animate progress
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: seconds * 1000,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);

  const progress = remaining / seconds;

  if (showCircle) {
    return (
      <View style={[styles.countdownCircle, style]}>
        <View style={styles.countdownInner}>
          <Text style={styles.countdownNumber}>{remaining}</Text>
        </View>
        {/* Simple progress ring using border */}
        <View
          style={[
            styles.countdownRing,
            { opacity: progress },
          ]}
        />
      </View>
    );
  }

  return (
    <Text style={[styles.countdownText, style]}>{remaining}</Text>
  );
}

// ============================================
// STEP PROGRESS
// ============================================

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  style?: object;
}

export function StepProgress({
  currentStep,
  totalSteps,
  labels,
  style,
}: StepProgressProps) {
  return (
    <View style={[styles.stepContainer, style]}>
      <View style={styles.stepBar}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            <View
              style={[
                styles.stepDot,
                index < currentStep && styles.stepDotCompleted,
                index === currentStep && styles.stepDotCurrent,
              ]}
            >
              {index < currentStep && (
                <Text style={styles.stepCheck}>!</Text>
              )}
              {index === currentStep && (
                <View style={styles.stepCurrentInner} />
              )}
            </View>
            {index < totalSteps - 1 && (
              <View
                style={[
                  styles.stepLine,
                  index < currentStep && styles.stepLineCompleted,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
      {labels && (
        <View style={styles.stepLabels}>
          {labels.map((label, index) => (
            <Text
              key={index}
              style={[
                styles.stepLabel,
                index === currentStep && styles.stepLabelCurrent,
              ]}
            >
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================
// CIRCULAR PROGRESS
// ============================================

interface CircularProgressProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
  style?: object;
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  color = COLORS.gold,
  children,
  style,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View style={styles.circularContainer}>
        {/* Background circle */}
        <View
          style={[
            styles.circularTrack,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
            },
          ]}
        />
        {/* Progress indicator (simplified - using opacity for demo) */}
        <View
          style={[
            styles.circularProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              opacity: progress,
            },
          ]}
        />
        {/* Center content */}
        <View style={styles.circularContent}>
          {children}
        </View>
      </View>
    </View>
  );
}

// ============================================
// LINEAR PROGRESS WITH ANIMATION
// ============================================

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  height?: number;
  colors?: string[];
  style?: object;
  animated?: boolean;
}

export function AnimatedProgressBar({
  progress,
  height = 8,
  colors = ['#E5C9A8', '#D4A574', '#B8956F'],
  style,
  animated = true,
}: AnimatedProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: GAME_ANIMATIONS.progress.fill,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress, animated]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.progressTrack, { height }, style]}>
      <Animated.View style={[styles.progressFillAnimated, { width, height }]}>
        <LinearGradient
          colors={colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressGradient, { height }]}
        />
      </Animated.View>
    </View>
  );
}

// ============================================
// SESSION STATS
// ============================================

interface SessionStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }>;
  style?: object;
}

export function SessionStats({ stats, style }: SessionStatsProps) {
  return (
    <View style={[styles.statsContainer, style]}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          {stat.icon && <View style={styles.statIcon}>{stat.icon}</View>}
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Timer
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '300',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontVariant: ['tabular-nums'],
  },

  // Countdown
  countdownCircle: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: TYPOGRAPHY.sizes.display,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  countdownRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: COLORS.gold,
  },
  countdownText: {
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },

  // Step Progress
  stepContainer: {
    width: '100%',
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.warmBeige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: COLORS.gold,
  },
  stepDotCurrent: {
    backgroundColor: COLORS.cream,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  stepCurrentInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
  },
  stepCheck: {
    color: COLORS.cream,
    fontSize: 14,
    fontWeight: '600',
  },
  stepLine: {
    height: 2,
    width: 40,
    backgroundColor: COLORS.warmBeige,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.gold,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  stepLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  stepLabelCurrent: {
    color: COLORS.earth,
    fontWeight: '600',
  },

  // Circular Progress
  circularContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularTrack: {
    position: 'absolute',
    borderColor: COLORS.warmBeige,
  },
  circularProgress: {
    position: 'absolute',
  },
  circularContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress Bar
  progressTrack: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFillAnimated: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },

  // Session Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
});
