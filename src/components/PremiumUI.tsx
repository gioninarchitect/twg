/**
 * Tea With God - Premium UI Components
 * Award-winning reusable components
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING, RADIUS, GRADIENTS } from '../theme/colors';

// ============ CARDS ============

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'glass' | 'outlined';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const getStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return { ...styles.card, ...SHADOWS.medium, backgroundColor: 'rgba(255, 255, 255, 0.05)' };
      case 'glass':
        return { ...styles.card, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: COLORS.borderSubtle };
      case 'outlined':
        return { ...styles.card, backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.borderSubtle };
      default:
        return { ...styles.card, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: COLORS.borderSubtle };
    }
  };

  return <View style={[getStyle(), style]}>{children}</View>;
}

interface GradientCardProps {
  children: React.ReactNode;
  gradient?: typeof GRADIENTS.gold;
  style?: ViewStyle;
}

export function GradientCard({ children, gradient = GRADIENTS.earth, style }: GradientCardProps) {
  return (
    <LinearGradient
      colors={gradient.colors as [string, string, ...string[]]}
      start={gradient.start}
      end={gradient.end}
      style={[styles.card, SHADOWS.medium, style]}
    >
      {children}
    </LinearGradient>
  );
}

// ============ BUTTONS ============

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      ...styles.button,
      ...getSizeStyle(),
    };

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: COLORS.gold, ...SHADOWS.glow };
      case 'secondary':
        return { ...base, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: COLORS.borderSubtle };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'outline':
        return { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.gold };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      ...styles.buttonText,
      fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
    };

    switch (variant) {
      case 'primary':
        return { ...base, color: '#1A1A1A' };
      case 'secondary':
        return { ...base, color: COLORS.textPrimary };
      case 'ghost':
        return { ...base, color: COLORS.textSecondary };
      case 'outline':
        return { ...base, color: COLORS.gold };
      default:
        return base;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm': return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
      case 'lg': return { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl };
      default: return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg };
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.earth : COLORS.gold} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.buttonIcon}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}: Omit<ButtonProps, 'variant'>) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={style}
    >
      <LinearGradient
        colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
        start={GRADIENTS.gold.start}
        end={GRADIENTS.gold.end}
        style={[styles.button, styles.gradientButton, SHADOWS.glow]}
      >
        {loading ? (
          <ActivityIndicator color="#1A1A1A" />
        ) : (
          <Text style={[styles.buttonText, { color: '#1A1A1A' }]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ============ TYPOGRAPHY ============

interface TextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function DisplayText({ children, style }: TextProps) {
  return <Text style={[styles.displayText, style]}>{children}</Text>;
}

export function Heading({ children, style }: TextProps) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

export function Subheading({ children, style }: TextProps) {
  return <Text style={[styles.subheading, style]}>{children}</Text>;
}

export function BodyText({ children, style }: TextProps) {
  return <Text style={[styles.bodyText, style]}>{children}</Text>;
}

export function DevotionalText({ children, style }: TextProps) {
  return <Text style={[styles.devotionalText, style]}>{children}</Text>;
}

export function Caption({ children, style }: TextProps) {
  return <Text style={[styles.caption, style]}>{children}</Text>;
}

export function Label({ children, style }: TextProps) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

// ============ DIVIDERS ============

interface DividerProps {
  style?: ViewStyle;
  variant?: 'full' | 'inset' | 'decorative';
}

export function Divider({ style, variant = 'full' }: DividerProps) {
  if (variant === 'decorative') {
    return (
      <View style={[styles.decorativeDivider, style]}>
        <View style={styles.decorativeLine} />
        <View style={styles.decorativeDot} />
        <View style={styles.decorativeLine} />
      </View>
    );
  }

  return (
    <View style={[
      styles.divider,
      variant === 'inset' && styles.dividerInset,
      style,
    ]} />
  );
}

// ============ BADGES ============

interface BadgeProps {
  label: string;
  variant?: 'gold' | 'earth' | 'muted' | 'phase';
  phaseColor?: string;
}

export function Badge({ label, variant = 'muted', phaseColor }: BadgeProps) {
  const getStyle = (): ViewStyle => {
    switch (variant) {
      case 'gold': return { backgroundColor: 'rgba(212, 175, 55, 0.2)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' };
      case 'earth': return { backgroundColor: 'rgba(255, 255, 255, 0.1)' };
      case 'phase': return { backgroundColor: phaseColor ? `${phaseColor}30` : 'rgba(212, 175, 55, 0.2)' };
      default: return { backgroundColor: 'rgba(255, 255, 255, 0.08)' };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'gold': return COLORS.gold;
      case 'earth': return COLORS.textPrimary;
      case 'phase': return phaseColor || COLORS.gold;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <View style={[styles.badge, getStyle()]}>
      <Text style={[styles.badgeText, { color: getTextColor() }]}>{label}</Text>
    </View>
  );
}

// ============ PROGRESS ============

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  showLabel?: boolean;
  variant?: 'default' | 'gradient';
}

export function ProgressBar({ progress, height = 8, showLabel = false, variant = 'gradient' }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View>
      <View style={[styles.progressTrack, { height }]}>
        {variant === 'gradient' ? (
          <LinearGradient
            colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${clampedProgress}%` as any, height }]}
          />
        ) : (
          <View style={[styles.progressFill, { width: `${clampedProgress}%` as any, height, backgroundColor: COLORS.gold }]} />
        )}
      </View>
      {showLabel && (
        <Text style={styles.progressLabel}>{Math.round(clampedProgress)}%</Text>
      )}
    </View>
  );
}

// ============ SKELETON ============

export function Skeleton({ width, height, radius = RADIUS.md }: { width: number | string; height: number; radius?: number }) {
  return (
    <View style={[styles.skeleton, { width: width as any, height, borderRadius: radius }]} />
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  // Cards
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },

  // Buttons
  button: {
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },
  buttonText: {
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
  },

  // Typography
  displayText: {
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    lineHeight: TYPOGRAPHY.sizes.hero * TYPOGRAPHY.lineHeights.tight,
  },
  heading: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.xxl * TYPOGRAPHY.lineHeights.tight,
  },
  subheading: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '500',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  bodyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * TYPOGRAPHY.lineHeights.relaxed,
  },
  devotionalText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    lineHeight: TYPOGRAPHY.sizes.lg * TYPOGRAPHY.lineHeights.devotional,
    fontStyle: 'italic',
  },
  caption: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
  },

  // Dividers
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
  },
  dividerInset: {
    marginHorizontal: SPACING.lg,
  },
  decorativeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  decorativeLine: {
    height: 1,
    width: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
  },
  decorativeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
    marginHorizontal: SPACING.md,
  },

  // Badges
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },

  // Progress
  progressTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: RADIUS.full,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },

  // Skeleton
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
