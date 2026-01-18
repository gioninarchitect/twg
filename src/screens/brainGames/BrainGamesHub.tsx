/**
 * Brain Games Hub
 * Entry point showing all available brain games
 * Enhanced with Engagement System (Dec 2025)
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../../utils/haptics';
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
import { GameId, MoodLevel } from '../../worldModel/types';
import { useAccess } from '../../context/AccessContext';
import { Card, ProgressBar, Badge } from '../../components/PremiumUI';
import {
  FadeInView,
  MoodCheckIn,
  CrisisQuickAccess,
  CrisisFloatingButton,
  MicroCelebration,
  StreakCelebration,
} from '../../components/brainGames';

// ============================================
// GAME DEFINITIONS
// ============================================

interface GameDefinition {
  id: GameId;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  theoryKey: string;
  icon: string;
  unlockDay: number;
}

// Icon mapping for Ionicons
const GAME_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breathing: 'leaf-outline',
  gratitude: 'flower-outline',
  scripture_palace: 'library-outline',
  thought_detective: 'search-outline',
  body_scan: 'body-outline',
  pattern_peace: 'grid-outline',
};

const GAMES: GameDefinition[] = [
  {
    id: 'breathing',
    titleKey: 'brainGames.games.breathing.title',
    subtitleKey: 'brainGames.games.breathing.subtitle',
    descriptionKey: 'brainGames.games.breathing.description',
    theoryKey: 'brainGames.games.breathing.theory',
    icon: 'leaf-outline',
    unlockDay: 1,
  },
  {
    id: 'gratitude',
    titleKey: 'brainGames.games.gratitude.title',
    subtitleKey: 'brainGames.games.gratitude.subtitle',
    descriptionKey: 'brainGames.games.gratitude.description',
    theoryKey: 'brainGames.games.gratitude.theory',
    icon: 'flower-outline',
    unlockDay: 1,
  },
  {
    id: 'scripture_palace',
    titleKey: 'brainGames.games.scripturePalace.title',
    subtitleKey: 'brainGames.games.scripturePalace.subtitle',
    descriptionKey: 'brainGames.games.scripturePalace.description',
    theoryKey: 'brainGames.games.scripturePalace.theory',
    icon: 'library-outline',
    unlockDay: 7,
  },
  {
    id: 'thought_detective',
    titleKey: 'brainGames.games.thoughtDetective.title',
    subtitleKey: 'brainGames.games.thoughtDetective.subtitle',
    descriptionKey: 'brainGames.games.thoughtDetective.description',
    theoryKey: 'brainGames.games.thoughtDetective.theory',
    icon: 'search-outline',
    unlockDay: 15,
  },
  {
    id: 'body_scan',
    titleKey: 'brainGames.games.bodyScan.title',
    subtitleKey: 'brainGames.games.bodyScan.subtitle',
    descriptionKey: 'brainGames.games.bodyScan.description',
    theoryKey: 'brainGames.games.bodyScan.theory',
    icon: 'body-outline',
    unlockDay: 22,
  },
  {
    id: 'pattern_peace',
    titleKey: 'brainGames.games.patternPeace.title',
    subtitleKey: 'brainGames.games.patternPeace.subtitle',
    descriptionKey: 'brainGames.games.patternPeace.description',
    theoryKey: 'brainGames.games.patternPeace.theory',
    icon: 'grid-outline',
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
  t: (key: string, options?: object) => string;
}

function GameCardItem({
  game,
  isUnlocked,
  currentDay,
  streak,
  lastPlayed,
  onPress,
  t,
}: GameCardProps) {
  const theme = getGameTheme(game.id);
  const daysUntilUnlock = game.unlockDay - currentDay;

  const handlePress = useCallback(() => {
    if (isUnlocked) {
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
      onPress();
    } else {
      safeHaptics.notificationAsync(NotificationFeedbackType.Warning);
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
          <Ionicons
            name={game.icon as keyof typeof Ionicons.glyphMap}
            size={28}
            color={isUnlocked ? COLORS.cream : COLORS.mutedBrown}
          />
        </View>

        {/* Content */}
        <View style={styles.gameContent}>
          <Text style={[
            styles.gameTitle,
            { color: isUnlocked ? COLORS.cream : COLORS.earth },
          ]}>
            {t(game.titleKey)}
          </Text>
          <Text style={[
            styles.gameSubtitle,
            { color: isUnlocked ? 'rgba(255,255,255,0.8)' : COLORS.richBrown },
          ]}>
            {t(game.subtitleKey)}
          </Text>

          {/* Status */}
          {isUnlocked ? (
            <View style={styles.gameStats}>
              {streak > 0 && (
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={14} color={COLORS.cream} />
                  <Text style={styles.streakText}>{streak}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.lockedInfo}>
              <Ionicons name="lock-closed" size={14} color={COLORS.mutedBrown} />
              <Text style={styles.lockText}>
                {t('brainGames.unlocksDay', { day: game.unlockDay })}
                {daysUntilUnlock > 0 && ` (${daysUntilUnlock} ${t('common.days')})`}
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
            {t(game.theoryKey)}
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
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { canAccessBrainGames } = useAccess();
  const {
    state,
    dispatch,
    checkGameUnlock,
    healingTrajectory,
    recommendations,
  } = useWorldModel();

  const currentDay = state.journey.currentDay;
  const streakDays = state.journey.streakDays;

  // Premium feature check - show upgrade prompt if not premium
  if (!canAccessBrainGames()) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.premiumPrompt}>
          <LinearGradient
            colors={[COLORS.warmBrown, COLORS.deepBrown]}
            style={styles.premiumGradient}
          >
            <View style={styles.premiumIcon}>
              <Ionicons name="sparkles" size={48} color={COLORS.gold} />
            </View>
            <Text style={styles.premiumTitle}>{t('brainGames.unlockBrainGames')}</Text>
            <Text style={styles.premiumDescription}>
              {t('brainGames.unlockDescription')}
            </Text>
            <View style={styles.premiumFeatures}>
              <View style={styles.premiumFeatureRow}>
                <View style={styles.premiumFeatureIcon}>
                  <Ionicons name="leaf-outline" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.premiumFeatureItem}>{t('brainGames.games.breathing.title')}</Text>
              </View>
              <View style={styles.premiumFeatureRow}>
                <View style={styles.premiumFeatureIcon}>
                  <Ionicons name="flower-outline" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.premiumFeatureItem}>{t('brainGames.games.gratitude.title')}</Text>
              </View>
              <View style={styles.premiumFeatureRow}>
                <View style={styles.premiumFeatureIcon}>
                  <Ionicons name="search-outline" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.premiumFeatureItem}>{t('brainGames.games.thoughtDetective.title')}</Text>
              </View>
              <View style={styles.premiumFeatureRow}>
                <View style={styles.premiumFeatureIcon}>
                  <Ionicons name="book-outline" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.premiumFeatureItem}>{t('brainGames.games.scripturePalace.title')}</Text>
              </View>
              <View style={styles.premiumFeatureRow}>
                <View style={styles.premiumFeatureIcon}>
                  <Ionicons name="body-outline" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.premiumFeatureItem}>{t('brainGames.games.bodyScan.title')}</Text>
              </View>
              <View style={styles.premiumFeatureRow}>
                <View style={styles.premiumFeatureIcon}>
                  <Ionicons name="grid-outline" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.premiumFeatureItem}>{t('brainGames.games.patternPeace.title')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.premiumUpgradeButton}
              onPress={() => Linking.openURL('https://teawithgod.com/upgrade.html')}
            >
              <Text style={styles.premiumUpgradeButtonText}>{t('brainGames.upgradeToPremium')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.premiumButtonText}>{t('brainGames.maybeLater')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================
  // ENGAGEMENT STATE
  // ============================================

  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showMicroCelebration, setShowMicroCelebration] = useState(false);
  const [microCelebrationMessage, setMicroCelebrationMessage] = useState('');
  const [pendingGameId, setPendingGameId] = useState<GameId | null>(null);

  // Check for streak milestone on mount
  useEffect(() => {
    const milestones = [7, 14, 21, 30, 40];
    if (milestones.includes(streakDays)) {
      // Only show if we haven't shown it recently
      const lastCelebration = state.behavioral.lastActiveAt;
      const hoursSince = (Date.now() - lastCelebration) / (1000 * 60 * 60);
      if (hoursSince < 1) {
        setShowStreakCelebration(true);
      }
    }
  }, [streakDays]);

  // ============================================
  // HANDLERS
  // ============================================

  // Navigate to a specific game screen
  const handleSelectGame = useCallback((gameId: GameId) => {
    const screenName = GAME_SCREEN_MAP[gameId];
    if (screenName) {
      // Show mood check-in before first game of the session
      const lastActive = state.behavioral.lastActiveAt;
      const hoursSince = (Date.now() - lastActive) / (1000 * 60 * 60);

      if (hoursSince > 4) {
        // Show mood check-in if it's been a while
        setPendingGameId(gameId);
        setShowMoodCheckIn(true);
      } else {
        navigation.navigate(screenName);
      }
    }
  }, [navigation, state.behavioral.lastActiveAt]);

  // Handle mood check-in completion
  const handleMoodComplete = useCallback((mood: MoodLevel, recommendedGame: GameId) => {
    setShowMoodCheckIn(false);

    // Dispatch mood event
    dispatch({
      type: 'MOOD_CHECK_IN',
      mood,
      dayNumber: currentDay,
    });

    // Navigate to the recommended or pending game
    const gameId = recommendedGame || pendingGameId;
    if (gameId) {
      const screenName = GAME_SCREEN_MAP[gameId];
      if (screenName) {
        navigation.navigate(screenName);
      }
    }
    setPendingGameId(null);
  }, [dispatch, currentDay, pendingGameId, navigation]);

  // Handle mood skip
  const handleMoodSkip = useCallback(() => {
    setShowMoodCheckIn(false);
    if (pendingGameId) {
      const screenName = GAME_SCREEN_MAP[pendingGameId];
      if (screenName) {
        navigation.navigate(screenName);
      }
    }
    setPendingGameId(null);
  }, [pendingGameId, navigation]);

  // Handle crisis resource accessed
  const handleCrisisAccessed = useCallback((resourceId: string) => {
    dispatch({
      type: 'CRISIS_ACCESSED',
      resources: [resourceId],
    });
  }, [dispatch]);

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
            <Text style={styles.closeText}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('brainGames.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('brainGames.dayOf40', { day: currentDay })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCrisis(true)}
            style={styles.toolkitButton}
          >
            <Ionicons name="heart-outline" size={22} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        {/* Journey Progress - Potter's Clay Theme */}
        <FadeInView delay={100}>
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                {currentDay <= 10 ? t('brainGames.phases.gathering') :
                 currentDay <= 20 ? t('brainGames.phases.shaping') :
                 currentDay <= 30 ? t('brainGames.phases.refining') : t('brainGames.phases.becoming')}
              </Text>
              <Text style={styles.progressDay}>{t('brainGames.dayOf40', { day: currentDay })}</Text>
            </View>
            <ProgressBar
              progress={(currentDay / 40) * 100}
              height={8}
            />
            <Text style={styles.progressVerse}>
              {t('brainGames.potterVerse')}
            </Text>
            {streakDays > 0 && (
              <View style={styles.streakInfo}>
                <Ionicons name="flame-outline" size={16} color={COLORS.gold} />
                <Text style={styles.streakInfoText}>{t('brainGames.dayStreak', { count: streakDays })}</Text>
              </View>
            )}
          </View>
        </FadeInView>

        {/* Recommendations */}
        {recommendedGameIds.length > 0 && (
          <FadeInView delay={200}>
            <TouchableOpacity
              style={styles.recommendSection}
              onPress={() => recommendedGameIds[0] && handleSelectGame(recommendedGameIds[0])}
            >
              <View style={styles.recommendIcon}>
                <Ionicons name="bulb-outline" size={18} color={COLORS.gold} />
              </View>
              <View style={styles.recommendContent}>
                <Text style={styles.sectionTitle}>{t('brainGames.recommendedForYou')}</Text>
                <Text style={styles.sectionHint}>
                  {recommendations.find((r) => r.game === recommendedGameIds[0])?.reason}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mutedBrown} />
            </TouchableOpacity>
          </FadeInView>
        )}

        {/* Games Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>{t('brainGames.allGames')}</Text>

          {GAMES.map((game, index) => {
            const isUnlocked = checkGameUnlock(game.id);
            const engagement = getGameEngagement(game.id);
            const isRecommended = recommendedGameIds.includes(game.id);

            return (
              <FadeInView key={game.id} delay={300 + index * 100}>
                {isRecommended && (
                  <Badge
                    label={t('brainGames.recommended')}
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
                  t={t}
                />
              </FadeInView>
            );
          })}

          {/* Educational Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              {t('brainGames.disclaimer')}
            </Text>
          </View>
        </ScrollView>

        {/* Crisis Floating Button */}
        <CrisisFloatingButton onPress={() => setShowCrisis(true)} />
      </SafeAreaView>

      {/* Mood Check-In Modal */}
      <MoodCheckIn
        visible={showMoodCheckIn}
        onComplete={handleMoodComplete}
        onSkip={handleMoodSkip}
        lastMood={state.emotional.currentMood}
      />


      {/* Crisis Quick Access Modal */}
      <CrisisQuickAccess
        visible={showCrisis}
        onClose={() => setShowCrisis(false)}
        onResourceAccessed={handleCrisisAccessed}
      />

      {/* Streak Celebration */}
      <StreakCelebration
        visible={showStreakCelebration}
        streakDays={streakDays}
        onDismiss={() => setShowStreakCelebration(false)}
      />

      {/* Micro Celebration */}
      <MicroCelebration
        visible={showMicroCelebration}
        type="session_complete"
        customMessage={microCelebrationMessage}
        onComplete={() => setShowMicroCelebration(false)}
      />
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
  toolkitButton: {
    width: 60,
    alignItems: 'flex-end',
    padding: SPACING.xs,
  },
  recommendIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.goldLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  recommendContent: {
    flex: 1,
  },
  progressSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.warmBeige,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  progressDay: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  progressVerse: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  streakInfoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gold,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
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
  // Premium upgrade prompt styles
  premiumPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  premiumGradient: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  premiumIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  premiumTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '700',
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.heading,
    marginBottom: SPACING.md,
  },
  premiumDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.softIvory,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
    marginBottom: SPACING.xl,
  },
  premiumButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
  },
  premiumButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.deepBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  premiumFeatures: {
    marginVertical: SPACING.lg,
    alignItems: 'center',
  },
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    minWidth: 220,
  },
  premiumFeatureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  premiumFeatureItem: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: 'rgba(250, 250, 250, 0.9)',
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  premiumUpgradeButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  premiumUpgradeButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: COLORS.deepBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
});

export default BrainGamesHub;
