/**
 * Mood Check-In Component
 * Asks user how they're feeling before games to personalize recommendations
 * Based on research: Mood-matching increases engagement by 40%
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GRADIENTS } from '../../theme/colors';
import { MoodLevel, GameId } from '../../worldModel/types';
import { GradientButton } from '../PremiumUI';

// ============================================
// MOOD OPTIONS
// ============================================

interface MoodOption {
  level: MoodLevel;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  recommendedGames: GameId[];
  reason: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    level: 2,
    label: 'Struggling',
    description: 'I need some gentle support right now',
    icon: 'cloud-outline',
    color: '#9B8AA3',
    recommendedGames: ['breathing', 'body_scan'],
    reason: 'These calming exercises can help soothe your nervous system',
  },
  {
    level: 4,
    label: 'Low',
    description: 'Feeling down but managing',
    icon: 'partly-sunny-outline',
    color: '#8BA5B5',
    recommendedGames: ['breathing', 'gratitude'],
    reason: 'Breathing and gratitude can gently lift your spirit',
  },
  {
    level: 6,
    label: 'Okay',
    description: 'Doing alright today',
    icon: 'sunny-outline',
    color: '#B5A888',
    recommendedGames: ['gratitude', 'scripture_palace', 'thought_detective'],
    reason: 'Great time for reflection and growth exercises',
  },
  {
    level: 8,
    label: 'Good',
    description: 'Feeling positive and hopeful',
    icon: 'heart-outline',
    color: '#88B5A5',
    recommendedGames: ['scripture_palace', 'pattern_peace', 'gratitude'],
    reason: 'Perfect for building new skills and deepening practice',
  },
  {
    level: 10,
    label: 'Great',
    description: 'Full of gratitude and peace',
    icon: 'sparkles-outline',
    color: COLORS.gold,
    recommendedGames: ['pattern_peace', 'scripture_palace', 'thought_detective'],
    reason: 'Your strong state is perfect for challenging exercises',
  },
];

// ============================================
// COMPONENT PROPS
// ============================================

interface MoodCheckInProps {
  visible: boolean;
  onComplete: (mood: MoodLevel, recommendedGame: GameId) => void;
  onSkip: () => void;
  lastMood?: MoodLevel;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MoodCheckIn({
  visible,
  onComplete,
  onSkip,
  lastMood,
}: MoodCheckInProps) {
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const recommendAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
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
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      recommendAnim.setValue(0);
      setSelectedMood(null);
      setShowRecommendation(false);
    }
  }, [visible]);

  useEffect(() => {
    if (showRecommendation) {
      Animated.spring(recommendAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [showRecommendation]);

  const handleSelectMood = (mood: MoodOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMood(mood);
    setShowRecommendation(true);
  };

  const handleContinue = () => {
    if (selectedMood) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(selectedMood.level, selectedMood.recommendedGames[0]);
    }
  };

  const handleSelectGame = (gameId: GameId) => {
    if (selectedMood) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(selectedMood.level, gameId);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>How are you feeling?</Text>
              <Text style={styles.subtitle}>
                This helps us suggest the right exercise for you
              </Text>
            </View>

            {/* Mood Options */}
            {!showRecommendation && (
              <View style={styles.moodGrid}>
                {MOOD_OPTIONS.map((mood) => (
                  <TouchableOpacity
                    key={mood.level}
                    style={[
                      styles.moodCard,
                      selectedMood?.level === mood.level && styles.moodCardSelected,
                    ]}
                    onPress={() => handleSelectMood(mood)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.moodIcon,
                        { backgroundColor: mood.color + '20' },
                      ]}
                    >
                      <Ionicons
                        name={mood.icon}
                        size={28}
                        color={mood.color}
                      />
                    </View>
                    <Text style={styles.moodLabel}>{mood.label}</Text>
                    <Text style={styles.moodDescription}>{mood.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Recommendation */}
            {showRecommendation && selectedMood && (
              <Animated.View
                style={[
                  styles.recommendationContainer,
                  {
                    transform: [{ scale: recommendAnim }],
                    opacity: recommendAnim,
                  },
                ]}
              >
                {/* Selected Mood Display */}
                <View style={styles.selectedMoodDisplay}>
                  <View
                    style={[
                      styles.selectedMoodIcon,
                      { backgroundColor: selectedMood.color + '20' },
                    ]}
                  >
                    <Ionicons
                      name={selectedMood.icon}
                      size={36}
                      color={selectedMood.color}
                    />
                  </View>
                  <Text style={styles.selectedMoodLabel}>
                    Feeling {selectedMood.label.toLowerCase()}
                  </Text>
                </View>

                {/* Recommendation Reason */}
                <View style={styles.reasonBox}>
                  <Ionicons name="bulb-outline" size={20} color={COLORS.gold} />
                  <Text style={styles.reasonText}>{selectedMood.reason}</Text>
                </View>

                {/* Recommended Games */}
                <Text style={styles.recommendTitle}>Recommended for you:</Text>
                <View style={styles.gameOptions}>
                  {selectedMood.recommendedGames.map((gameId, index) => (
                    <TouchableOpacity
                      key={gameId}
                      style={[
                        styles.gameOption,
                        index === 0 && styles.gameOptionPrimary,
                      ]}
                      onPress={() => handleSelectGame(gameId)}
                    >
                      <Ionicons
                        name={getGameIcon(gameId)}
                        size={24}
                        color={index === 0 ? COLORS.cream : COLORS.earth}
                      />
                      <Text
                        style={[
                          styles.gameOptionText,
                          index === 0 && styles.gameOptionTextPrimary,
                        ]}
                      >
                        {getGameName(gameId)}
                      </Text>
                      {index === 0 && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedBadgeText}>Best Match</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Change Mood */}
                <TouchableOpacity
                  style={styles.changeMoodButton}
                  onPress={() => {
                    setShowRecommendation(false);
                    setSelectedMood(null);
                  }}
                >
                  <Text style={styles.changeMoodText}>Change my mood</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>

          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(93, 78, 55, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  container: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.strong,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  moodGrid: {
    gap: SPACING.sm,
  },
  moodCard: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodCardSelected: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldLight + '30',
  },
  moodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  moodLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    flex: 1,
  },
  moodDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    flex: 2,
    textAlign: 'right',
  },
  recommendationContainer: {
    alignItems: 'center',
  },
  selectedMoodDisplay: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  selectedMoodIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  selectedMoodLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldLight + '30',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  reasonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    flex: 1,
    fontStyle: 'italic',
  },
  recommendTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
  },
  gameOptions: {
    width: '100%',
    gap: SPACING.sm,
  },
  gameOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmBeige,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
  },
  gameOptionPrimary: {
    backgroundColor: COLORS.gold,
  },
  gameOptionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '500',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    flex: 1,
  },
  gameOptionTextPrimary: {
    color: COLORS.cream,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  recommendedBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
  },
  changeMoodButton: {
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },
  changeMoodText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textDecorationLine: 'underline',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.warmBeige,
  },
  skipText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
});

export default MoodCheckIn;

// ============================================
// SESSION MOOD CHECK-IN (Simpler, Therapeutic)
// For pre/post session gentle check-ins
// ============================================

export type SessionMoodLevel = 'struggling' | 'okay' | 'lighter';
export type SessionCheckInType = 'pre' | 'post';

interface SessionMoodOption {
  level: SessionMoodLevel;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtext: string;
  color: string;
}

const PRE_SESSION_MOODS: SessionMoodOption[] = [
  {
    level: 'struggling',
    icon: 'cloud-outline',
    label: 'Heavy today',
    subtext: 'And that\'s okay',
    color: COLORS.dustyBlue,
  },
  {
    level: 'okay',
    icon: 'partly-sunny-outline',
    label: 'Getting by',
    subtext: 'One step at a time',
    color: COLORS.warm,
  },
  {
    level: 'lighter',
    icon: 'sunny-outline',
    label: 'Lighter',
    subtext: 'Grateful for this moment',
    color: COLORS.sage,
  },
];

const POST_SESSION_MOODS: SessionMoodOption[] = [
  {
    level: 'struggling',
    icon: 'cloud-outline',
    label: 'Still heavy',
    subtext: 'Healing takes time',
    color: COLORS.dustyBlue,
  },
  {
    level: 'okay',
    icon: 'partly-sunny-outline',
    label: 'A little shift',
    subtext: 'Every bit counts',
    color: COLORS.warm,
  },
  {
    level: 'lighter',
    icon: 'sunny-outline',
    label: 'More peaceful',
    subtext: 'You showed up for yourself',
    color: COLORS.sage,
  },
];

export interface SessionMoodCheckInProps {
  visible: boolean;
  type: SessionCheckInType;
  gameName?: string;
  preMood?: SessionMoodLevel;
  onSelect: (mood: SessionMoodLevel) => void;
  onSkip: () => void;
}

export function SessionMoodCheckIn({
  visible,
  type,
  gameName,
  preMood,
  onSelect,
  onSkip,
}: SessionMoodCheckInProps) {
  const [selectedMood, setSelectedMood] = useState<SessionMoodLevel | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
      setSelectedMood(null);
    }
  }, [visible]);

  const moods = type === 'pre' ? PRE_SESSION_MOODS : POST_SESSION_MOODS;

  const getTitle = () => {
    if (type === 'pre') {
      return 'How are you arriving?';
    }
    return 'Notice any shift?';
  };

  const getSubtitle = () => {
    if (type === 'pre') {
      return 'There\'s no wrong answer';
    }
    return 'Whatever you feel is valid';
  };

  const handleSelect = (mood: SessionMoodLevel) => {
    setSelectedMood(mood);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      onSelect(mood);
      setSelectedMood(null);
    }, 300);
  };

  const handleSkip = () => {
    onSkip();
    setSelectedMood(null);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={sessionStyles.overlay}>
        <Animated.View style={[sessionStyles.container, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={sessionStyles.header}>
            <Text style={sessionStyles.title}>{getTitle()}</Text>
            <Text style={sessionStyles.subtitle}>{getSubtitle()}</Text>
          </View>

          {/* Mood Options */}
          <View style={sessionStyles.moodsContainer}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.level}
                style={[
                  sessionStyles.moodOption,
                  selectedMood === mood.level && sessionStyles.moodOptionSelected,
                ]}
                onPress={() => handleSelect(mood.level)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    sessionStyles.moodIconContainer,
                    { backgroundColor: `${mood.color}20` },
                    selectedMood === mood.level && {
                      backgroundColor: `${mood.color}40`,
                    },
                  ]}
                >
                  <Ionicons
                    name={mood.icon}
                    size={32}
                    color={mood.color}
                  />
                </View>
                <Text style={sessionStyles.moodLabel}>{mood.label}</Text>
                <Text style={sessionStyles.moodSubtext}>{mood.subtext}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Skip Option */}
          <TouchableOpacity style={sessionStyles.skipButton} onPress={handleSkip}>
            <Text style={sessionStyles.skipText}>
              {type === 'pre' ? 'Just begin' : 'Skip for now'}
            </Text>
          </TouchableOpacity>

          {/* Gentle Reminder */}
          <Text style={sessionStyles.reminder}>
            {type === 'pre'
              ? 'This is just for you. We don\'t judge or track.'
              : 'Change isn\'t always immediate. You did something brave.'}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================
// SESSION COMPLETE AFFIRMATION
// ============================================

interface SessionCompleteProps {
  visible: boolean;
  gameName: string;
  duration?: number; // in seconds
  onClose: () => void;
}

const AFFIRMATIONS = [
  'You showed up for yourself today.',
  'Healing happens in small moments like this.',
  'You\'re doing something brave.',
  'Every step matters, even the small ones.',
  'You honored your need for peace.',
  'This is what self-compassion looks like.',
  'You chose yourself today. That matters.',
  'Rest is part of the journey.',
  'You\'re learning to be gentle with yourself.',
  'This moment of stillness is a gift you gave yourself.',
];

export function SessionComplete({
  visible,
  gameName,
  duration,
  onClose,
}: SessionCompleteProps) {
  const [affirmation] = useState(
    () => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
  );
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) {
      return `${secs} seconds`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={sessionStyles.overlay}>
        <Animated.View
          style={[
            sessionStyles.completeContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Heart Icon */}
          <View style={sessionStyles.completeIconContainer}>
            <Ionicons name="heart" size={40} color={COLORS.sage} />
          </View>

          {/* Title */}
          <Text style={sessionStyles.completeTitle}>Well done</Text>

          {/* Affirmation */}
          <Text style={sessionStyles.completeAffirmation}>{affirmation}</Text>

          {/* Duration (if available) */}
          {duration && duration > 0 && (
            <Text style={sessionStyles.completeDuration}>
              You spent {formatDuration(duration)} in stillness
            </Text>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            style={sessionStyles.completeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={sessionStyles.completeButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================
// SESSION STYLES
// ============================================

const sessionStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...SHADOWS.strong,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.display,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },
  moodsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  moodOption: {
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.borderSubtle,
    width: 100,
  },
  moodOptionSelected: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  moodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  moodLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: 2,
  },
  moodSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  skipText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
  },
  reminder: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: SPACING.md,
  },
  // Session Complete
  completeContainer: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    ...SHADOWS.strong,
  },
  completeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(143, 188, 143, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  completeTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.display,
    marginBottom: SPACING.sm,
  },
  completeAffirmation: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  completeDuration: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.lg,
  },
  completeButton: {
    backgroundColor: COLORS.sage,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.full,
  },
  completeButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.background,
    fontFamily: TYPOGRAPHY.ui,
  },
});
