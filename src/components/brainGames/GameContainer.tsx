/**
 * Brain Games - Game Container
 * Shared wrapper for all brain games with consistent layout
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme/colors';
import { GAME_LAYOUT, getGameTheme } from '../../theme/brainGames';
import { GameId } from '../../worldModel/types';

interface GameContainerProps {
  gameId: GameId;
  children: ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  showHeader?: boolean;
  headerRight?: ReactNode;
}

export function GameContainer({
  gameId,
  children,
  title,
  subtitle,
  onClose,
  showHeader = true,
  headerRight,
}: GameContainerProps) {
  const theme = getGameTheme(gameId);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.background, '#151515']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {showHeader && (
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>

              <View style={styles.headerCenter}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>

              <View style={styles.headerRight}>
                {headerRight}
              </View>
            </View>
          )}

          <View style={styles.content}>
            {children}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

// ============================================
// GAME CARD COMPONENT
// ============================================

interface GameCardProps {
  children: ReactNode;
  style?: object;
  elevated?: boolean;
}

export function GameCard({ children, style, elevated = true }: GameCardProps) {
  return (
    <View style={[
      styles.card,
      elevated && SHADOWS.medium,
      style,
    ]}>
      {children}
    </View>
  );
}

// ============================================
// GAME SECTION COMPONENT
// ============================================

interface GameSectionProps {
  children: ReactNode;
  title?: string;
  style?: object;
}

export function GameSection({ children, title, style }: GameSectionProps) {
  return (
    <View style={[styles.section, style]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

// ============================================
// GAME FOOTER COMPONENT
// ============================================

interface GameFooterProps {
  children: ReactNode;
}

export function GameFooter({ children }: GameFooterProps) {
  return (
    <View style={styles.footer}>
      {children}
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    height: GAME_LAYOUT.headerHeight,
  },
  closeButton: {
    width: 60,
    padding: SPACING.sm,
  },
  closeText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    paddingHorizontal: GAME_LAYOUT.containerPadding,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  footer: {
    paddingHorizontal: GAME_LAYOUT.containerPadding,
    paddingBottom: GAME_LAYOUT.bottomSafeArea,
    paddingTop: SPACING.md,
  },
});
