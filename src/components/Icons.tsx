/**
 * Tea With God - Premium Icon System
 * Elegant Feather icons replacing emojis
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, GRADIENTS } from '../theme/colors';

type IconName = keyof typeof Feather.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

interface IconButtonProps extends IconProps {
  variant?: 'default' | 'gold' | 'muted' | 'earth';
  containerSize?: number;
}

// Simple icon
export function Icon({ name, size = 24, color = COLORS.earth }: IconProps) {
  return <Feather name={name} size={size} color={color} />;
}

// Icon with circular background
export function IconButton({
  name,
  size = 20,
  color,
  variant = 'default',
  containerSize = 44,
}: IconButtonProps) {
  const getBackground = () => {
    switch (variant) {
      case 'gold': return COLORS.gold;
      case 'muted': return COLORS.warmBeige;
      case 'earth': return COLORS.earth;
      default: return COLORS.glassWhite;
    }
  };

  const getIconColor = () => {
    if (color) return color;
    switch (variant) {
      case 'gold': return COLORS.earth;
      case 'earth': return COLORS.cream;
      default: return COLORS.earth;
    }
  };

  return (
    <View style={[
      styles.iconButton,
      {
        width: containerSize,
        height: containerSize,
        borderRadius: containerSize / 2,
        backgroundColor: getBackground(),
      }
    ]}>
      <Feather name={name} size={size} color={getIconColor()} />
    </View>
  );
}

// Gradient icon button
export function GradientIconButton({
  name,
  size = 20,
  containerSize = 44,
  gradient = GRADIENTS.gold,
}: IconButtonProps & { gradient?: typeof GRADIENTS.gold }) {
  return (
    <LinearGradient
      colors={gradient.colors as [string, string, ...string[]]}
      start={gradient.start}
      end={gradient.end}
      style={[
        styles.iconButton,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        }
      ]}
    >
      <Feather name={name} size={size} color={COLORS.earth} />
    </LinearGradient>
  );
}

// App-specific icons with semantic meaning
export const AppIcons = {
  // Navigation
  home: (props: Partial<IconProps>) => <Icon name="home" {...props} />,
  back: (props: Partial<IconProps>) => <Icon name="chevron-left" {...props} />,
  forward: (props: Partial<IconProps>) => <Icon name="chevron-right" {...props} />,
  menu: (props: Partial<IconProps>) => <Icon name="menu" {...props} />,
  close: (props: Partial<IconProps>) => <Icon name="x" {...props} />,

  // Journey
  check: (props: Partial<IconProps>) => <Icon name="check" {...props} />,
  lock: (props: Partial<IconProps>) => <Icon name="lock" {...props} />,
  unlock: (props: Partial<IconProps>) => <Icon name="unlock" {...props} />,
  bookmark: (props: Partial<IconProps>) => <Icon name="bookmark" {...props} />,

  // Content
  book: (props: Partial<IconProps>) => <Icon name="book-open" {...props} />,
  heart: (props: Partial<IconProps>) => <Icon name="heart" {...props} />,
  feather: (props: Partial<IconProps>) => <Icon name="feather" {...props} />,
  edit: (props: Partial<IconProps>) => <Icon name="edit-3" {...props} />,

  // Audio
  play: (props: Partial<IconProps>) => <Icon name="play" {...props} />,
  pause: (props: Partial<IconProps>) => <Icon name="pause" {...props} />,
  music: (props: Partial<IconProps>) => <Icon name="music" {...props} />,
  volume: (props: Partial<IconProps>) => <Icon name="volume-2" {...props} />,

  // Safety & Support
  shield: (props: Partial<IconProps>) => <Icon name="shield" {...props} />,
  phone: (props: Partial<IconProps>) => <Icon name="phone" {...props} />,
  messageCircle: (props: Partial<IconProps>) => <Icon name="message-circle" {...props} />,
  helpCircle: (props: Partial<IconProps>) => <Icon name="help-circle" {...props} />,

  // User
  user: (props: Partial<IconProps>) => <Icon name="user" {...props} />,
  settings: (props: Partial<IconProps>) => <Icon name="settings" {...props} />,
  logOut: (props: Partial<IconProps>) => <Icon name="log-out" {...props} />,

  // Phases
  sunrise: (props: Partial<IconProps>) => <Icon name="sunrise" {...props} />,
  sun: (props: Partial<IconProps>) => <Icon name="sun" {...props} />,
  moon: (props: Partial<IconProps>) => <Icon name="moon" {...props} />,
  star: (props: Partial<IconProps>) => <Icon name="star" {...props} />,
};

const styles = StyleSheet.create({
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
