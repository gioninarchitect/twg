/**
 * Healing Toolkit Dashboard
 * A personalized dashboard showing all healing tools and recommendations
 * Based on Finch app pattern: Pet metaphor replaced with Kintsugi metaphor
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GRADIENTS } from '../../theme/colors';
import { GameId, Intervention, HealingTrajectory } from '../../worldModel/types';
import { KintsugiProgress } from './KintsugiProgress';
import { GradientButton, Button } from '../PremiumUI';

// ============================================
// QUICK ACTION TYPES
// ============================================

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gameId?: GameId;
  type: 'game' | 'tool' | 'content';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'breathe_now',
    label: 'Calm My Nerves',
    description: '2-minute breathing',
    icon: 'leaf-outline',
    color: '#7BA098',
    gameId: 'breathing',
    type: 'game',
  },
  {
    id: 'gratitude_quick',
    label: 'Quick Gratitude',
    description: 'Plant one seed',
    icon: 'flower-outline',
    color: '#A8956F',
    gameId: 'gratitude',
    type: 'game',
  },
  {
    id: 'reframe',
    label: 'Reframe a Thought',
    description: 'Gentle investigation',
    icon: 'search-outline',
    color: '#8BA5B5',
    gameId: 'thought_detective',
    type: 'game',
  },
  {
    id: 'body_check',
    label: 'Body Check-In',
    description: 'Release tension',
    icon: 'body-outline',
    color: '#B5888D',
    gameId: 'body_scan',
    type: 'game',
  },
];

// ============================================
// TOOLKIT PROPS
// ============================================

interface HealingToolkitProps {
  visible: boolean;
  onClose: () => void;
  currentDay: number;
  healingTrajectory: HealingTrajectory;
  recommendations: Intervention[];
  gameStats: {
    totalSessions: number;
    breathingMinutes: number;
    gratitudeEntries: number;
    thoughtsReframed: number;
    bodyScans: number;
    scriptureMastery: number;
  };
  streakDays: number;
  onSelectGame: (gameId: GameId) => void;
  onOpenCrisis: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function HealingToolkit({
  visible,
  onClose,
  currentDay,
  healingTrajectory,
  recommendations,
  gameStats,
  streakDays,
  onSelectGame,
  onOpenCrisis,
}: HealingToolkitProps) {
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1000,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSelectAction = (action: QuickAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (action.gameId) {
      onSelectGame(action.gameId);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: opacityAnim },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerHandle} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Healing Toolkit</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mutedBrown} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Kintsugi Progress - Compact */}
          <View style={styles.section}>
            <KintsugiProgress
              currentDay={currentDay}
              healingTrajectory={healingTrajectory}
              gameStats={gameStats}
              compact={false}
              showStats={true}
            />
          </View>

          {/* Streak Display */}
          {streakDays > 0 && (
            <View style={styles.streakCard}>
              <LinearGradient
                colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
                style={styles.streakGradient}
              >
                <Ionicons name="flame" size={28} color={COLORS.earth} />
                <View style={styles.streakInfo}>
                  <Text style={styles.streakNumber}>{streakDays}</Text>
                  <Text style={styles.streakLabel}>Day Streak</Text>
                </View>
                <Text style={styles.streakMessage}>
                  {getStreakMessage(streakDays)}
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Personalized Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>For You Right Now</Text>
              {recommendations.slice(0, 2).map((rec, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recommendationCard}
                  onPress={() => rec.game && onSelectGame(rec.game)}
                >
                  <View style={styles.recommendationIcon}>
                    <Ionicons
                      name={rec.game ? getGameIcon(rec.game) : 'bulb-outline'}
                      size={24}
                      color={COLORS.gold}
                    />
                  </View>
                  <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationTitle}>
                      {rec.game ? getGameName(rec.game) : 'Suggestion'}
                    </Text>
                    <Text style={styles.recommendationReason}>
                      {rec.reason}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.mutedBrown}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick Actions Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={() => handleSelectAction(action)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: action.color + '20' },
                    ]}
                  >
                    <Ionicons
                      name={action.icon}
                      size={24}
                      color={action.color}
                    />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionDescription}>
                    {action.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* All Games Link */}
          <TouchableOpacity style={styles.allGamesLink} onPress={onClose}>
            <Text style={styles.allGamesText}>View All Brain Games</Text>
            <Ionicons name="grid-outline" size={18} color={COLORS.gold} />
          </TouchableOpacity>

          {/* Crisis Support */}
          <View style={styles.crisisSection}>
            <TouchableOpacity
              style={styles.crisisButton}
              onPress={onOpenCrisis}
            >
              <Ionicons name="heart-outline" size={20} color={COLORS.richBrown} />
              <Text style={styles.crisisText}>
                Need extra support? Crisis resources are here for you.
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getGameIcon(gameId: GameId): keyof typeof Ionicons.glyphMap {
  const icons: Record<GameId, keyof typeof Ionicons.glyphMap> = {
    breathing: 'leaf-outline',
    gratitude: 'flower-outline',
    scripture_palace: 'library-outline',
    thought_detective: 'search-outline',
    body_scan: 'body-outline',
    pattern_peace: 'grid-outline',
  };
  return icons[gameId];
}

function getGameName(gameId: GameId): string {
  const names: Record<GameId, string> = {
    breathing: 'Breathe with God',
    gratitude: 'Gratitude Garden',
    scripture_palace: 'Scripture Palace',
    thought_detective: 'Thought Detective',
    body_scan: 'Body Scan Release',
    pattern_peace: 'Pattern Peace',
  };
  return names[gameId];
}

function getStreakMessage(streak: number): string {
  if (streak >= 30) return 'Incredible dedication!';
  if (streak >= 14) return 'Building beautiful habits';
  if (streak >= 7) return 'A week of growth!';
  if (streak >= 3) return 'Consistency is golden';
  return 'Every day counts';
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(93, 78, 55, 0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '90%',
    ...SHADOWS.strong,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warmBeige,
  },
  headerHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.warmBeige,
    borderRadius: 2,
    marginBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.lg,
    padding: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  streakCard: {
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  streakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: '700',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.hero,
  },
  streakLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  streakMessage: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  recommendationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  recommendationReason: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: 2,
  },
  allGamesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  allGamesText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '500',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  crisisSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.warmBeige,
    paddingTop: SPACING.lg,
  },
  crisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warmBeige,
  },
  crisisText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    flex: 1,
  },
});

export default HealingToolkit;
