/**
 * Brain Games Hub
 * Entry point showing all available brain games
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import {
  COLORS,
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  GRADIENTS,
} from '../../theme/colors';
import {
  GAME_COLORS,
  GAME_GRADIENTS,
  getGameTheme,
} from '../../theme/brainGames';
import { useWorldModel } from '../../worldModel';
import { GameId } from '../../worldModel/types';
import { Card, ProgressBar, Badge } from '../../components/PremiumUI';
import { FadeInView } from '../../components/brainGames';

// ============================================
// GAME DEFINITIONS
// ============================================

interface GameDefinition {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  theory: string;
  icon: string;
  unlockDay: number;
}

const GAMES: GameDefinition[] = [
  {
    id: 'breathing',
    title: 'Breathe with God',
    subtitle: 'Nervous System Regulation',
    description: 'Guided breathing exercises to calm your nervous system and find peace.',
    theory: 'Polyvagal Theory',
    icon: 'Wind',
    unlockDay: 1,
  },
  {
    id: 'gratitude',
    title: 'Gratitude Garden',
    subtitle: 'Positive Psychology',
    description: 'Plant seeds of thankfulness and watch your garden of blessings grow.',
    theory: 'Positive Psychology',
    icon: 'Flower',
    unlockDay: 1,
  },
  {
    id: 'scripture_palace',
    title: 'Scripture Palace',
    subtitle: 'Memory & Faith',
    description: 'Build a memory palace with scripture using ancient memorization techniques.',
    theory: 'Method of Loci',
    icon: 'Castle',
    unlockDay: 7,
  },
  {
    id: 'thought_detective',
    title: 'Thought Detective',
    subtitle: 'Cognitive Reframing',
    description: 'Identify and transform negative thought patterns with gentle investigation.',
    theory: 'Cognitive Behavioral Therapy',
    icon: 'Magnifier',
    unlockDay: 15,
  },
  {
    id: 'body_scan',
    title: 'Body Scan Release',
    subtitle: 'Somatic Awareness',
    description: 'Release stored tension by gently scanning and soothing your body.',
    theory: 'Somatic Therapy',
    icon: 'Body',
    unlockDay: 22,
  },
  {
    id: 'pattern_peace',
    title: 'Pattern Peace',
    subtitle: 'Focus Training',
    description: 'Strengthen working memory and focus through peaceful pattern exercises.',
    theory: 'N-Back Training',
    icon: 'Grid',
    unlockDay: 28,
  },
];

// ============================================
// GAME CARD COMPONENT
// ============================================

interface GameCardProps {
  game: GameDefinition;
  isUnlocked: boolean;
  currentDay: number;
  streak: number;
  lastPlayed?: number;
  onPress: () => void;
}

function GameCardItem({
  game,
  isUnlocked,
  currentDay,
  streak,
  lastPlayed,
  onPress,
}: GameCardProps) {
  const theme = getGameTheme(game.id);
  const daysUntilUnlock = game.unlockDay - currentDay;

  const handlePress = useCallback(() => {
    if (isUnlocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [isUnlocked, onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.gameCard,
        !isUnlocked && styles.gameCardLocked,
      ]}
      onPress={handlePress}
      activeOpacity={isUnlocked ? 0.8 : 1}
    >
      <LinearGradient
        colors={
          isUnlocked
            ? (theme.gradient?.colors || GRADIENTS.gold.colors) as [string, string, ...string[]]
            : [COLORS.warmBeige, COLORS.softIvory]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gameCardGradient}
      >
        {/* Icon */}
        <View style={[
          styles.gameIcon,
          { backgroundColor: isUnlocked ? 'rgba(255,255,255,0.3)' : COLORS.overlayLight },
        ]}>
          <Text style={[
            styles.gameIconText,
            { color: isUnlocked ? COLORS.cream : COLORS.mutedBrown },
          ]}>
            {game.icon}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.gameContent}>
          <Text style={[
            styles.gameTitle,
            { color: isUnlocked ? COLORS.cream : COLORS.earth },
          ]}>
            {game.title}
          </Text>
          <Text style={[
            styles.gameSubtitle,
            { color: isUnlocked ? 'rgba(255,255,255,0.8)' : COLORS.richBrown },
          ]}>
            {game.subtitle}
          </Text>

          {/* Status */}
          {isUnlocked ? (
            <View style={styles.gameStats}>
              {streak > 0 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakIcon}>Flame</Text>
                  <Text style={styles.streakText}>{streak}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.lockedInfo}>
              <Text style={styles.lockIcon}>Lock</Text>
              <Text style={styles.lockText}>
                Unlocks Day {game.unlockDay}
                {daysUntilUnlock > 0 && ` (${daysUntilUnlock} days)`}
              </Text>
            </View>
          )}
        </View>

        {/* Theory Badge */}
        <View style={[
          styles.theoryBadge,
          { backgroundColor: isUnlocked ? 'rgba(255,255,255,0.2)' : COLORS.warmBeige },
        ]}>
          <Text style={[
            styles.theoryText,
            { color: isUnlocked ? COLORS.cream : COLORS.richBrown },
          ]}>
            {game.theory}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ============================================
// GAME ID TO SCREEN NAME MAPPING
// ============================================

const GAME_SCREEN_MAP: Record<GameId, string> = {
  breathing: 'BreatheWithGod',
  gratitude: 'GratitudeGarden',
  scripture_palace: 'ScripturePalace',
  thought_detective: 'ThoughtDetective',
  body_scan: 'BodyScanRelease',
  pattern_peace: 'PatternPeace',
};

// ============================================
// MAIN COMPONENT
// ============================================

export function BrainGamesHub() {
  const navigation = useNavigation<any>();
  const {
    state,
    checkGameUnlock,
    healingTrajectory,
    recommendations,
  } = useWorldModel();

  const currentDay = state.journey.currentDay;

  // Navigate to a specific game screen
  const handleSelectGame = useCallback((gameId: GameId) => {
    const screenName = GAME_SCREEN_MAP[gameId];
    if (screenName) {
      navigation.navigate(screenName);
    }
  }, [navigation]);

  // Go back to previous screen
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Get engagement data for each game
  const getGameEngagement = (gameId: GameId) => {
    return state.behavioral.engagementByGame.find((g) => g.gameId === gameId);
  };

  // Get recommended games
  const recommendedGameIds = recommendations
    .filter((r) => r.type === 'GAME_SUGGESTION')
    .map((r) => r.game);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Brain Games</Text>
            <Text style={styles.headerSubtitle}>
              Day {currentDay} of 40
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Journey Progress */}
        <FadeInView delay={100}>
          <View style={styles.progressSection}>
            <ProgressBar
              progress={(currentDay / 40) * 100}
              height={6}
              variant="gradient"
            />
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                Healing: {healingTrajectory}
              </Text>
              <Text style={styles.progressLabel}>
                {currentDay}/40 Days
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Recommendations */}
        {recommendedGameIds.length > 0 && (
          <FadeInView delay={200}>
            <View style={styles.recommendSection}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
              <Text style={styles.sectionHint}>
                {recommendations.find((r) => r.game === recommendedGameIds[0])?.reason}
              </Text>
            </View>
          </FadeInView>
        )}

        {/* Games Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>All Games</Text>

          {GAMES.map((game, index) => {
            const isUnlocked = checkGameUnlock(game.id);
            const engagement = getGameEngagement(game.id);
            const isRecommended = recommendedGameIds.includes(game.id);

            return (
              <FadeInView key={game.id} delay={300 + index * 100}>
                {isRecommended && (
                  <Badge
                    label="Recommended"
                    variant="gold"
                  />
                )}
                <GameCardItem
                  game={game}
                  isUnlocked={isUnlocked}
                  currentDay={currentDay}
                  streak={engagement?.streak || 0}
                  lastPlayed={engagement?.lastPlayed}
                  onPress={() => handleSelectGame(game.id)}
                />
              </FadeInView>
            );
          })}

          {/* Educational Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              These exercises are educational tools based on evidence-based
              psychological principles. They are not a substitute for
              professional mental health treatment. If you're in crisis,
              please reach out to a mental health professional or crisis line.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
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
  },
  closeButton: {
    width: 60,
  },
  closeText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  headerRight: {
    width: 60,
  },
  progressSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'capitalize',
  },
  recommendSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.goldLight + '30',
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  sectionHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  gameCard: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  gameCardLocked: {
    opacity: 0.7,
  },
  gameCardGradient: {
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  gameIconText: {
    fontSize: 24,
  },
  gameContent: {
    flex: 1,
  },
  gameTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
  },
  gameSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  gameStats: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  streakIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  streakText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.cream,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
  },
  lockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  lockIcon: {
    fontSize: 12,
    marginRight: SPACING.xs,
  },
  lockText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  theoryBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  theoryText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.ui,
  },
  disclaimer: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
  },
  disclaimerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.xs * 1.6,
    textAlign: 'center',
  },
});

export default BrainGamesHub;
