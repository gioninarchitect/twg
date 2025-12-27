/**
 * Brain Games - Animation Components
 * Reusable animated components for games
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/colors';
import { GAME_ANIMATIONS, GAME_COLORS } from '../../theme/brainGames';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// BREATHING CIRCLE
// ============================================

interface BreathingCircleProps {
  phase: 'inhale' | 'holdIn' | 'exhale' | 'holdOut' | 'idle';
  minSize?: number;
  maxSize?: number;
  colors?: string[];
  children?: React.ReactNode;
}

export function BreathingCircle({
  phase,
  minSize = 120,
  maxSize = 280,
  colors = [GAME_COLORS.breathing.inhale, GAME_COLORS.breathing.exhale],
  children,
}: BreathingCircleProps) {
  const animatedSize = useRef(new Animated.Value(minSize)).current;
  const animatedOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    switch (phase) {
      case 'inhale':
        animation = Animated.parallel([
          Animated.timing(animatedSize, {
            toValue: maxSize,
            duration: GAME_ANIMATIONS.breathe.inhale,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animatedOpacity, {
            toValue: 1,
            duration: GAME_ANIMATIONS.breathe.inhale,
            useNativeDriver: false,
          }),
        ]);
        break;

      case 'exhale':
        animation = Animated.parallel([
          Animated.timing(animatedSize, {
            toValue: minSize,
            duration: GAME_ANIMATIONS.breathe.exhale,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animatedOpacity, {
            toValue: 0.6,
            duration: GAME_ANIMATIONS.breathe.exhale,
            useNativeDriver: false,
          }),
        ]);
        break;

      case 'holdIn':
      case 'holdOut':
        // Gentle pulse during holds
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedOpacity, {
              toValue: phase === 'holdIn' ? 0.9 : 0.7,
              duration: 500,
              useNativeDriver: false,
            }),
            Animated.timing(animatedOpacity, {
              toValue: phase === 'holdIn' ? 1 : 0.6,
              duration: 500,
              useNativeDriver: false,
            }),
          ])
        );
        break;

      default:
        return;
    }

    animation?.start();

    return () => {
      animation?.stop();
    };
  }, [phase, minSize, maxSize]);

  return (
    <Animated.View
      style={[
        styles.breathingCircle,
        {
          width: animatedSize,
          height: animatedSize,
          borderRadius: Animated.divide(animatedSize, 2),
          opacity: animatedOpacity,
        },
      ]}
    >
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        style={styles.breathingGradient}
      >
        {children}
      </LinearGradient>
    </Animated.View>
  );
}

// ============================================
// PULSING DOT
// ============================================

interface PulsingDotProps {
  size?: number;
  color?: string;
  isActive?: boolean;
}

export function PulsingDot({
  size = 12,
  color = COLORS.gold,
  isActive = true,
}: PulsingDotProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      const animation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.3,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isActive]);

  return (
    <Animated.View
      style={[
        styles.pulsingDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
}

// ============================================
// FADE IN VIEW
// ============================================

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: object;
}

export function FadeInView({
  children,
  delay = 0,
  duration = 400,
  style,
}: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        { opacity, transform: [{ translateY }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ============================================
// SCALE BOUNCE
// ============================================

interface ScaleBounceProps {
  children: React.ReactNode;
  trigger: any; // Any value that changes to trigger animation
  style?: object;
}

export function ScaleBounce({ children, trigger, style }: ScaleBounceProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================
// SHAKE ANIMATION
// ============================================

interface ShakeViewProps {
  children: React.ReactNode;
  trigger: any;
  intensity?: number;
  style?: object;
}

export function ShakeView({
  children,
  trigger,
  intensity = 10,
  style,
}: ShakeViewProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(translateX, { toValue: intensity, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -intensity, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: intensity * 0.7, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -intensity * 0.7, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [trigger]);

  return (
    <Animated.View style={[{ transform: [{ translateX }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================
// FLOATING ELEMENT
// ============================================

interface FloatingElementProps {
  children: React.ReactNode;
  amplitude?: number;
  duration?: number;
  style?: object;
}

export function FloatingElement({
  children,
  amplitude = 8,
  duration = 3000,
  style,
}: FloatingElementProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -amplitude,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: amplitude,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================
// CONFETTI ANIMATION (Simple Version)
// ============================================

interface ConfettiProps {
  count?: number;
  colors?: string[];
  duration?: number;
}

export function Confetti({
  count = 30,
  colors = [COLORS.gold, COLORS.sage, COLORS.dustyBlue, COLORS.goldLight],
  duration = 2000,
}: ConfettiProps) {
  const particles = useRef(
    Array.from({ length: count }).map((_, i) => {
      const initialX = Math.random() * SCREEN_WIDTH;
      return {
        x: new Animated.Value(initialX),
        initialX, // Store initial value for animation target calculation
        y: new Animated.Value(-20),
        rotation: new Animated.Value(0),
        color: colors[i % colors.length],
        size: 6 + Math.random() * 8,
      };
    })
  ).current;

  useEffect(() => {
    particles.forEach((particle, index) => {
      const delay = Math.random() * 500;
      const targetX = particle.initialX + (Math.random() - 0.5) * 200;

      Animated.parallel([
        Animated.timing(particle.y, {
          toValue: SCREEN_HEIGHT + 50,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(particle.x, {
          toValue: targetX,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: 360 * (2 + Math.random() * 2),
          duration,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confettiPiece,
            {
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// ============================================
// PROGRESS RING ANIMATION
// ============================================

interface AnimatedRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  duration?: number;
}

export function AnimatedRing({
  progress,
  size = 100,
  strokeWidth = 8,
  color = COLORS.gold,
  duration = 600,
}: AnimatedRingProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const borderWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, strokeWidth],
  });

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.ringTrack,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ringProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: borderWidth,
            borderColor: color,
            opacity: animatedProgress,
          },
        ]}
      />
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Breathing Circle
  breathingCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  breathingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Pulsing Dot
  pulsingDot: {},

  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },

  // Ring
  ringContainer: {
    position: 'relative',
  },
  ringTrack: {
    position: 'absolute',
    borderColor: COLORS.warmBeige,
  },
  ringProgress: {
    position: 'absolute',
  },
});
