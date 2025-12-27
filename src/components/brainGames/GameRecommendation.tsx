/**
 * Game Recommendation Component
 *
 * Integrates Brain Games into the devotional experience.
 * Shows contextually relevant game suggestions based on:
 * - Current day in the 40-day journey
 * - User's emotional/cognitive state from World Model
 * - Time of day and recent activity
 *
 * DISCLAIMER: Brain games are educational exercises, not therapy.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWorldModel } from '../../worldModel';
import { GAME_COLORS } from '../../theme/brainGames';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../../theme/colors';

// ============================================================================
// Types
// ============================================================================

interface GameInfo {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  unlockDay: number;
  description: string;
  benefit: string;
  duration: string;
  theoryBasis: string;
  screenName: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
}

interface GameRecommendationProps {
  currentDay: number;
  variant?: 'full' | 'compact' | 'inline';
  maxRecommendations?: number;
  onGameStart?: (gameId: string) => void;
}

// ============================================================================
// Game Data
// ============================================================================

const GAMES: GameInfo[] = [
  {
    id: 'breathing',
    name: 'Breathe with God',
    shortName: 'Breathe',
    icon: 'leaf',
    unlockDay: 1,
    description: 'Calm your nervous system through sacred breathing',
    benefit: 'Reduces anxiety, activates rest-and-digest response',
    duration: '3-5 min',
    theoryBasis: 'Polyvagal Theory',
    screenName: 'BreatheWithGod',
    colors: GAME_COLORS.breathing,
  },
  {
    id: 'gratitude',
    name: 'Gratitude Garden',
    shortName: 'Gratitude',
    icon: 'flower',
    unlockDay: 1,
    description: 'Cultivate thankfulness, grow inner peace',
    benefit: 'Shifts focus to blessings, builds positive neural pathways',
    duration: '5-7 min',
    theoryBasis: 'Positive Psychology',
    screenName: 'GratitudeGarden',
    colors: GAME_COLORS.gratitude,
  },
  {
    id: 'scripture_palace',
    name: 'Scripture Palace',
    shortName: 'Scripture',
    icon: 'library',
    unlockDay: 7,
    description: 'Memorize scripture using memory palace technique',
    benefit: 'Strengthens memory, anchors faith in the mind',
    duration: '5-10 min',
    theoryBasis: 'Method of Loci',
    screenName: 'ScripturePalace',
    colors: GAME_COLORS.scripturePalace,
  },
  {
    id: 'thought_detective',
    name: 'Thought Detective',
    shortName: 'Thoughts',
    icon: 'search',
    unlockDay: 15,
    description: 'Identify and reframe unhelpful thought patterns',
    benefit: 'Builds cognitive flexibility, reduces negative spirals',
    duration: '5-10 min',
    theoryBasis: 'Cognitive Behavioral Therapy',
    screenName: 'ThoughtDetective',
    colors: GAME_COLORS.thoughtDetective,
  },
  {
    id: 'body_scan',
    name: 'Body Scan Release',
    shortName: 'Body Scan',
    icon: 'body',
    unlockDay: 22,
    description: 'Release tension through guided body awareness',
    benefit: 'Reduces physical stress, improves body-mind connection',
    duration: '8-12 min',
    theoryBasis: 'Somatic Therapy',
    screenName: 'BodyScanRelease',
    colors: GAME_COLORS.bodyScan,
  },
  {
    id: 'pattern_peace',
    name: 'Pattern Peace',
    shortName: 'Patterns',
    icon: 'grid',
    unlockDay: 28,
    description: 'Train focus and working memory through patterns',
    benefit: 'Quiets rumination, strengthens concentration',
    duration: '5-8 min',
    theoryBasis: 'N-Back Cognitive Training',
    screenName: 'PatternPeace',
    colors: GAME_COLORS.patternPeace,
  },
];

// Day-to-game affinity mapping
// Some devotional themes align better with certain games
const DAY_GAME_AFFINITIES: Record<number, string[]> = {
  // Valley Phase (Days 1-10): Focus on grounding and hope
  1: ['breathing', 'gratitude'],
  2: ['breathing', 'gratitude'],
  3: ['breathing', 'gratitude'],
  4: ['breathing', 'gratitude'],
  5: ['breathing', 'gratitude'],
  6: ['breathing', 'gratitude'],
  7: ['breathing', 'gratitude', 'scripture_palace'],
  8: ['breathing', 'scripture_palace'],
  9: ['breathing', 'scripture_palace'],
  10: ['breathing', 'scripture_palace', 'gratitude'],

  // Waiting Phase (Days 11-20): Building patience and cognitive skills
  11: ['breathing', 'gratitude', 'scripture_palace'],
  12: ['breathing', 'scripture_palace'],
  13: ['breathing', 'scripture_palace', 'gratitude'],
  14: ['breathing', 'scripture_palace'],
  15: ['thought_detective', 'breathing', 'scripture_palace'],
  16: ['thought_detective', 'breathing'],
  17: ['thought_detective', 'gratitude'],
  18: ['thought_detective', 'scripture_palace'],
  19: ['thought_detective', 'breathing'],
  20: ['thought_detective', 'gratitude', 'scripture_palace'],

  // Rising Phase (Days 21-30): Physical awareness and mental strength
  21: ['thought_detective', 'breathing', 'scripture_palace'],
  22: ['body_scan', 'breathing', 'thought_detective'],
  23: ['body_scan', 'breathing'],
  24: ['body_scan', 'gratitude'],
  25: ['body_scan', 'thought_detective'],
  26: ['body_scan', 'scripture_palace'],
  27: ['body_scan', 'breathing', 'gratitude'],
  28: ['pattern_peace', 'body_scan', 'thought_detective'],
  29: ['pattern_peace', 'body_scan'],
  30: ['pattern_peace', 'gratitude', 'scripture_palace'],

  // Becoming Phase (Days 31-40): Integration and mastery
  31: ['pattern_peace', 'body_scan', 'breathing'],
  32: ['pattern_peace', 'thought_detective'],
  33: ['pattern_peace', 'gratitude', 'scripture_palace'],
  34: ['pattern_peace', 'body_scan'],
  35: ['pattern_peace', 'breathing', 'thought_detective'],
  36: ['pattern_peace', 'scripture_palace', 'gratitude'],
  37: ['pattern_peace', 'body_scan', 'breathing'],
  38: ['pattern_peace', 'thought_detective', 'gratitude'],
  39: ['pattern_peace', 'scripture_palace', 'body_scan'],
  40: ['pattern_peace', 'gratitude', 'breathing', 'body_scan'], // Celebrate with all
};

// ============================================================================
// Helper Functions
// ============================================================================

function getUnlockedGames(currentDay: number): GameInfo[] {
  return GAMES.filter(game => game.unlockDay <= currentDay);
}

function getRecommendedGames(
  currentDay: number,
  worldModelState?: any,
  maxCount: number = 3
): GameInfo[] {
  const unlockedGames = getUnlockedGames(currentDay);
  const affinities = DAY_GAME_AFFINITIES[currentDay] || [];

  // Score each game based on affinity and World Model state
  const scoredGames = unlockedGames.map(game => {
    let score = 0;

    // Base score from day affinity
    const affinityIndex = affinities.indexOf(game.id);
    if (affinityIndex !== -1) {
      score += (affinities.length - affinityIndex) * 10;
    }

    // Boost based on World Model emotional state
    if (worldModelState?.emotional) {
      const { stress, anxiety, mood } = worldModelState.emotional;

      // If stressed/anxious, prioritize breathing and body scan
      if ((stress > 0.6 || anxiety > 0.6) && (game.id === 'breathing' || game.id === 'body_scan')) {
        score += 15;
      }

      // If low mood, prioritize gratitude
      if (mood < 0.4 && game.id === 'gratitude') {
        score += 15;
      }

      // If ruminating (high cognitive load), prioritize pattern_peace
      if (worldModelState.cognitive?.rumination > 0.6 && game.id === 'pattern_peace') {
        score += 15;
      }
    }

    return { game, score };
  });

  // Sort by score descending
  scoredGames.sort((a, b) => b.score - a.score);

  return scoredGames.slice(0, maxCount).map(item => item.game);
}

// ============================================================================
// Components
// ============================================================================

interface GameCardProps {
  game: GameInfo;
  isUnlocked: boolean;
  onPress: () => void;
  variant: 'full' | 'compact' | 'inline';
}

const GameCard: React.FC<GameCardProps> = ({ game, isUnlocked, onPress, variant }) => {
  if (variant === 'inline') {
    return (
      <TouchableOpacity
        style={[styles.inlineCard, !isUnlocked && styles.cardLocked]}
        onPress={isUnlocked ? onPress : undefined}
        activeOpacity={isUnlocked ? 0.7 : 1}
      >
        <View style={[styles.inlineIconContainer, { backgroundColor: game.colors.primary + '20' }]}>
          <Ionicons
            name={game.icon as any}
            size={20}
            color={isUnlocked ? game.colors.primary : '#999'}
          />
        </View>
        <Text style={[styles.inlineName, !isUnlocked && styles.textLocked]}>
          {game.shortName}
        </Text>
        {!isUnlocked && (
          <Ionicons name="lock-closed" size={12} color="#999" style={styles.lockIcon} />
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactCard, !isUnlocked && styles.cardLocked]}
        onPress={isUnlocked ? onPress : undefined}
        activeOpacity={isUnlocked ? 0.7 : 1}
      >
        <LinearGradient
          colors={isUnlocked
            ? [game.colors.background, game.colors.primary + '20']
            : ['#F5F5F5', '#EEEEEE']
          }
          style={styles.compactGradient}
        >
          <Ionicons
            name={game.icon as any}
            size={28}
            color={isUnlocked ? game.colors.primary : '#999'}
          />
          <Text style={[styles.compactName, !isUnlocked && styles.textLocked]}>
            {game.shortName}
          </Text>
          <Text style={[styles.compactDuration, !isUnlocked && styles.textLocked]}>
            {game.duration}
          </Text>
          {!isUnlocked && (
            <View style={styles.lockedBadge}>
              <Ionicons name="lock-closed" size={10} color="#fff" />
              <Text style={styles.lockedBadgeText}>Day {game.unlockDay}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Full variant
  return (
    <TouchableOpacity
      style={[styles.fullCard, !isUnlocked && styles.cardLocked]}
      onPress={isUnlocked ? onPress : undefined}
      activeOpacity={isUnlocked ? 0.7 : 1}
    >
      <LinearGradient
        colors={isUnlocked
          ? [game.colors.background, game.colors.primary + '15']
          : ['#F5F5F5', '#EEEEEE']
        }
        style={styles.fullGradient}
      >
        <View style={styles.fullHeader}>
          <View style={[styles.fullIconContainer, { backgroundColor: game.colors.primary + '20' }]}>
            <Ionicons
              name={game.icon as any}
              size={32}
              color={isUnlocked ? game.colors.primary : '#999'}
            />
          </View>
          <View style={styles.fullHeaderText}>
            <Text style={[styles.fullName, !isUnlocked && styles.textLocked]}>
              {game.name}
            </Text>
            <Text style={[styles.fullTheory, !isUnlocked && styles.textLocked]}>
              Based on {game.theoryBasis}
            </Text>
          </View>
          {isUnlocked ? (
            <Ionicons name="play-circle" size={32} color={game.colors.primary} />
          ) : (
            <View style={styles.lockedIndicator}>
              <Ionicons name="lock-closed" size={16} color="#999" />
              <Text style={styles.lockedDayText}>Day {game.unlockDay}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.fullDescription, !isUnlocked && styles.textLocked]}>
          {game.description}
        </Text>
        <View style={styles.fullFooter}>
          <View style={styles.fullBenefit}>
            <Ionicons
              name="sparkles"
              size={14}
              color={isUnlocked ? game.colors.primary : '#999'}
            />
            <Text style={[styles.fullBenefitText, !isUnlocked && styles.textLocked]}>
              {game.benefit}
            </Text>
          </View>
          <Text style={[styles.fullDuration, !isUnlocked && styles.textLocked]}>
            {game.duration}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const GameRecommendation: React.FC<GameRecommendationProps> = ({
  currentDay,
  variant = 'compact',
  maxRecommendations = 3,
  onGameStart,
}) => {
  const navigation = useNavigation<any>();
  const { state: worldModelState } = useWorldModel();

  const recommendedGames = useMemo(() => {
    return getRecommendedGames(currentDay, worldModelState, maxRecommendations);
  }, [currentDay, worldModelState, maxRecommendations]);

  const handleGamePress = (game: GameInfo) => {
    onGameStart?.(game.id);
    navigation.navigate('BrainGames', { screen: game.screenName });
  };

  if (recommendedGames.length === 0) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        <View style={styles.inlineHeader}>
          <Feather name="zap" size={14} color={COLORS.gold} />
          <Text style={styles.inlineTitle}>Quick Brain Games</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inlineScroll}
        >
          {recommendedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isUnlocked={game.unlockDay <= currentDay}
              onPress={() => handleGamePress(game)}
              variant="inline"
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Feather name="activity" size={18} color={COLORS.gold} />
          </View>
          <View>
            <Text style={styles.title}>Brain Games</Text>
            <Text style={styles.subtitle}>Exercises for peace of mind</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('BrainGames', { screen: 'BrainGamesHub' })}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Feather name="chevron-right" size={16} color={COLORS.gold} />
        </TouchableOpacity>
      </View>

      <Text style={styles.recommendedLabel}>
        Recommended for Day {currentDay}
      </Text>

      {variant === 'compact' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactScroll}
        >
          {recommendedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isUnlocked={game.unlockDay <= currentDay}
              onPress={() => handleGamePress(game)}
              variant="compact"
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.fullList}>
          {recommendedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isUnlocked={game.unlockDay <= currentDay}
              onPress={() => handleGamePress(game)}
              variant="full"
            />
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>
        Educational exercises, not therapy. For crisis support, use the help button.
      </Text>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.goldLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gold,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.ui,
  },
  recommendedLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },

  // Compact variant
  compactScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  compactCard: {
    width: 120,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  compactGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 120,
  },
  compactName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  compactDuration: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },

  // Full variant
  fullList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  fullCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  fullGradient: {
    padding: SPACING.lg,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  fullIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  fullHeaderText: {
    flex: 1,
  },
  fullName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  fullTheory: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  fullDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
    marginBottom: SPACING.md,
  },
  fullFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  fullBenefitText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  fullDuration: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },

  // Inline variant
  inlineContainer: {
    marginVertical: SPACING.md,
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  inlineTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  inlineScroll: {
    paddingHorizontal: SPACING.md,
  },
  inlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmBeige,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.xs,
  },
  inlineIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  inlineName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  lockIcon: {
    marginLeft: SPACING.xs,
  },

  // Locked states
  cardLocked: {
    opacity: 0.7,
  },
  textLocked: {
    color: '#999',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#999',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginTop: SPACING.sm,
  },
  lockedBadgeText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 3,
    fontWeight: '500',
  },
  lockedIndicator: {
    alignItems: 'center',
  },
  lockedDayText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },

  disclaimer: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
});

export default GameRecommendation;
