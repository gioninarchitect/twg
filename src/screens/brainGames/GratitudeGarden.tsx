/**
 * Gratitude Garden
 * Plant seeds of thankfulness based on Positive Psychology
 * Unlocks: Day 1
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme/colors';
import { GAME_COLORS, GAME_GRADIENTS } from '../../theme/brainGames';
import { emitGratitudeEntry } from '../../worldModel';
import { useWorldModel } from '../../worldModel';
import { Button, GradientButton } from '../../components/PremiumUI';
import {
  GameContainer,
  GameCard,
  GameSection,
  GameFooter,
  SessionComplete,
  AnimatedProgressBar,
  FadeInView,
  ScaleBounce,
  FloatingElement,
  useGratitudeSession,
  WhyThisWorks,
  WhyThisWorksButton,
} from '../../components/brainGames';

// ============================================
// GRATITUDE PROMPTS
// ============================================

const GRATITUDE_PROMPTS = [
  "What's one small thing that brought you joy today?",
  "Who is someone you're thankful for?",
  "What's something beautiful you noticed recently?",
  "What's a challenge that helped you grow?",
  "What's something about your body you're grateful for?",
  "What's a comfort you often take for granted?",
  "What's a prayer that was answered?",
  "What made you smile this week?",
  "What's something you learned recently?",
  "Who showed you kindness lately?",
];

const ENCOURAGEMENTS = [
  "Beautiful! Your garden is growing.",
  "What a lovely seed of gratitude.",
  "God sees your thankful heart.",
  "Each gratitude waters your soul.",
  "You're cultivating joy!",
];

// ============================================
// FLOWER COMPONENT
// ============================================

interface FlowerProps {
  index: number;
  text: string;
  onRemove?: () => void;
}

function Flower({ index, text, onRemove }: FlowerProps) {
  const colors = GAME_COLORS.gratitude;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.flower,
        {
          transform: [
            { scale: scaleAnim },
            { rotate: rotation },
          ],
        },
      ]}
    >
      <FloatingElement amplitude={3} duration={4000 + index * 500}>
        <View style={styles.flowerHead}>
          <LinearGradient
            colors={[colors.flower, colors.accent]}
            style={styles.flowerGradient}
          >
            <Ionicons name="flower" size={24} color={COLORS.cream} />
          </LinearGradient>
        </View>
      </FloatingElement>
      <View style={styles.flowerStem} />
      <View style={styles.flowerContent}>
        <Text style={styles.flowerText} numberOfLines={3}>
          {text}
        </Text>
        {onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={12} color={COLORS.cream} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================
// GARDEN VIEW
// ============================================

interface GardenViewProps {
  gratitudes: string[];
  onRemove?: (index: number) => void;
}

function GardenView({ gratitudes, onRemove }: GardenViewProps) {
  if (gratitudes.length === 0) {
    return (
      <View style={styles.emptyGarden}>
        <Text style={styles.emptyGardenText}>
          Your garden is ready to grow
        </Text>
        <Text style={styles.emptyGardenHint}>
          Plant your first seed of gratitude
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.gardenContainer}>
      {gratitudes.map((gratitude, index) => (
        <Flower
          key={`${index}-${gratitude}`}
          index={index}
          text={gratitude}
          onRemove={onRemove ? () => onRemove(index) : undefined}
        />
      ))}
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface GratitudeGardenProps {
  onClose?: () => void;
}

export function GratitudeGarden({ onClose }: GratitudeGardenProps) {
  const navigation = useNavigation();
  const handleClose = onClose || (() => navigation.goBack());
  const { state } = useWorldModel();
  const dayNumber = state.journey.currentDay;

  const [currentPromptIndex, setCurrentPromptIndex] = useState(
    Math.floor(Math.random() * GRATITUDE_PROMPTS.length)
  );
  const [showComplete, setShowComplete] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const [showWhyThisWorks, setShowWhyThisWorks] = useState(false);

  const {
    gratitudes,
    currentInput,
    setCurrentInput,
    addGratitude,
    removeGratitude,
    submitGratitudes,
    progress,
    isComplete,
  } = useGratitudeSession({
    targetCount: 3,
    dayNumber,
    onComplete: (finalGratitudes) => {
      setShowComplete(true);
    },
  });

  const inputRef = useRef<TextInput>(null);

  const handleAddGratitude = useCallback(() => {
    if (currentInput.trim()) {
      addGratitude(currentInput);

      // Show encouragement
      const randomEncouragement = ENCOURAGEMENTS[
        Math.floor(Math.random() * ENCOURAGEMENTS.length)
      ];
      setEncouragement(randomEncouragement);

      // Rotate to next prompt
      setCurrentPromptIndex((prev) =>
        (prev + 1) % GRATITUDE_PROMPTS.length
      );

      // Clear encouragement after delay
      setTimeout(() => setEncouragement(''), 2000);
    }
  }, [currentInput, addGratitude]);

  const handleSubmit = useCallback(() => {
    if (gratitudes.length > 0) {
      submitGratitudes();
      setShowComplete(true);
    }
  }, [gratitudes, submitGratitudes]);

  const handleContinue = useCallback(() => {
    setShowComplete(false);
    handleClose();
  }, [handleClose]);

  const handlePlayAgain = useCallback(() => {
    setShowComplete(false);
    // Reset would need to be added to useGratitudeSession
  }, []);

  return (
    <GameContainer
      gameId="gratitude"
      title="Gratitude Garden"
      subtitle="Positive Psychology"
      onClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress */}
          <FadeInView delay={100}>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <View style={styles.progressBarWrapper}>
                  <AnimatedProgressBar
                    progress={progress * 100}
                    height={8}
                    colors={GAME_GRADIENTS.gratitude.colors}
                  />
                </View>
                <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
              </View>
              <Text style={styles.progressText}>
                {gratitudes.length} of 3 gratitudes planted
              </Text>
            </View>
          </FadeInView>

          {/* Garden */}
          <FadeInView delay={200}>
            <View style={styles.gardenSection}>
              <GardenView
                gratitudes={gratitudes}
                onRemove={gratitudes.length < 3 ? removeGratitude : undefined}
              />
            </View>
          </FadeInView>

          {/* Encouragement */}
          {encouragement && (
            <ScaleBounce trigger={encouragement}>
              <View style={styles.encouragementContainer}>
                <Text style={styles.encouragementText}>{encouragement}</Text>
              </View>
            </ScaleBounce>
          )}

          {/* Input Section */}
          {!isComplete && (
            <FadeInView delay={300}>
              <GameCard style={styles.inputCard}>
                <Text style={styles.promptText}>
                  {GRATITUDE_PROMPTS[currentPromptIndex]}
                </Text>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Type your gratitude..."
                  placeholderTextColor={COLORS.mutedBrown}
                  value={currentInput}
                  onChangeText={setCurrentInput}
                  multiline
                  maxLength={200}
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={handleAddGratitude}
                />
                <View style={styles.inputActions}>
                  <Text style={styles.charCount}>
                    {currentInput.length}/200
                  </Text>
                  <Button
                    title="Plant Seed"
                    variant="primary"
                    size="sm"
                    onPress={handleAddGratitude}
                    disabled={!currentInput.trim()}
                  />
                </View>
              </GameCard>
            </FadeInView>
          )}

          {/* Scripture */}
          <FadeInView delay={400}>
            <View style={styles.scriptureSection}>
              <Text style={styles.scriptureText}>
                "Give thanks in all circumstances; for this is the will of God
                in Christ Jesus for you."
              </Text>
              <Text style={styles.scriptureReference}>
                - 1 Thessalonians 5:18
              </Text>
            </View>
          </FadeInView>
        </ScrollView>

        {/* Submit Button */}
        {gratitudes.length > 0 && !isComplete && (
          <GameFooter>
            <GradientButton
              title={gratitudes.length >= 3 ? "Complete Session" : `Plant ${3 - gratitudes.length} More`}
              onPress={handleSubmit}
              disabled={gratitudes.length < 1}
            />
          </GameFooter>
        )}
      </KeyboardAvoidingView>

      {/* Completion Modal */}
      <SessionComplete
        visible={showComplete}
        title="Garden Complete"
        subtitle="Your gratitudes are planted"
        stats={[
          { label: 'Seeds Planted', value: gratitudes.length },
          { label: 'Day', value: dayNumber },
        ]}
        encouragement="Each gratitude is a seed that grows joy in your heart. Water them with remembrance."
        onContinue={handleContinue}
        continueLabel="Return to Games"
      />

      {/* Why This Works Modal */}
      <WhyThisWorks
        visible={showWhyThisWorks}
        gameId="gratitude"
        onClose={() => setShowWhyThisWorks(false)}
      />
    </GameContainer>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  // Progress
  progressSection: {
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  progressBarWrapper: {
    flex: 1,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  // Garden
  gardenSection: {
    minHeight: 200,
    marginBottom: SPACING.lg,
  },
  gardenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  emptyGarden: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyGardenText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  emptyGardenHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },

  // Flower
  flower: {
    width: 100,
    alignItems: 'center',
  },
  flowerHead: {
    marginBottom: -8,
    zIndex: 1,
  },
  flowerGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  flowerIcon: {
    fontSize: 24,
  },
  flowerStem: {
    width: 4,
    height: 20,
    backgroundColor: GAME_COLORS.gratitude.stem,
    borderRadius: 2,
  },
  flowerContent: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
    width: '100%',
    ...SHADOWS.soft,
  },
  flowerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.xs * 1.4,
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.mutedTerracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 12,
    color: COLORS.cream,
    fontWeight: '600',
  },

  // Encouragement
  encouragementContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  encouragementText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: GAME_COLORS.gratitude.accent,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
  },

  // Input
  inputCard: {
    marginBottom: SPACING.lg,
  },
  promptText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },
  input: {
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  charCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },

  // Scripture
  scriptureSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  scriptureText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },
  scriptureReference: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.sm,
  },
});

export default GratitudeGarden;
