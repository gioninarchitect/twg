/**
 * Thought Detective
 * Identify and reframe cognitive distortions using CBT principles
 * Unlocks: Day 15
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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme/colors';
import { GAME_COLORS, GAME_GRADIENTS } from '../../theme/brainGames';
import { emitThoughtReframed, detectDistortions, scoreCompassion } from '../../worldModel';
import { useWorldModel } from '../../worldModel';
import { Button, GradientButton, Badge } from '../../components/PremiumUI';
import {
  GameContainer,
  GameCard,
  GameSection,
  GameFooter,
  SessionComplete,
  StepProgress,
  FadeInView,
  ScaleBounce,
  ShakeView,
  WhyThisWorks,
  WhyThisWorksButton,
} from '../../components/brainGames';

// ============================================
// COGNITIVE DISTORTIONS
// ============================================

interface DistortionInfo {
  id: string;
  name: string;
  description: string;
  example: string;
  reframePrompt: string;
  scripture: string;
}

const DISTORTIONS: Record<string, DistortionInfo> = {
  all_or_nothing: {
    id: 'all_or_nothing',
    name: 'All-or-Nothing Thinking',
    description: 'Seeing things in black and white, with no middle ground.',
    example: '"I always fail" or "Nothing ever works out"',
    reframePrompt: 'What\'s a more balanced way to see this? Is there any gray area?',
    scripture: '"His mercies are new every morning." - Lamentations 3:23',
  },
  catastrophizing: {
    id: 'catastrophizing',
    name: 'Catastrophizing',
    description: 'Expecting the worst possible outcome.',
    example: '"This will be a disaster" or "I can\'t handle this"',
    reframePrompt: 'What\'s more likely to happen? What evidence do you have?',
    scripture: '"Do not worry about tomorrow." - Matthew 6:34',
  },
  should_statements: {
    id: 'should_statements',
    name: 'Should Statements',
    description: 'Putting pressure on yourself with rigid rules.',
    example: '"I should be better" or "I must not make mistakes"',
    reframePrompt: 'What if you replaced "should" with "I would like to"?',
    scripture: '"My grace is sufficient for you." - 2 Corinthians 12:9',
  },
  mind_reading: {
    id: 'mind_reading',
    name: 'Mind Reading',
    description: 'Assuming you know what others are thinking.',
    example: '"They think I\'m stupid" or "Everyone is judging me"',
    reframePrompt: 'What do you actually know for certain? Could there be another explanation?',
    scripture: '"Man looks at the outward appearance, but the Lord looks at the heart." - 1 Samuel 16:7',
  },
  fortune_telling: {
    id: 'fortune_telling',
    name: 'Fortune Telling',
    description: 'Predicting negative outcomes without evidence.',
    example: '"I will never get better" or "This will always be this way"',
    reframePrompt: 'Is this prediction based on facts or fears?',
    scripture: '"For I know the plans I have for you." - Jeremiah 29:11',
  },
  labeling: {
    id: 'labeling',
    name: 'Labeling',
    description: 'Putting harsh labels on yourself or others.',
    example: '"I\'m a failure" or "I\'m worthless"',
    reframePrompt: 'Would you say this to a friend? What would be kinder?',
    scripture: '"You are fearfully and wonderfully made." - Psalm 139:14',
  },
  emotional_reasoning: {
    id: 'emotional_reasoning',
    name: 'Emotional Reasoning',
    description: 'Believing something is true because you feel it.',
    example: '"I feel like a burden, so I must be one"',
    reframePrompt: 'Just because you feel it, does that make it true?',
    scripture: '"The heart is deceitful above all things." - Jeremiah 17:9',
  },
  personalization: {
    id: 'personalization',
    name: 'Personalization',
    description: 'Blaming yourself for things outside your control.',
    example: '"It\'s all my fault" or "I caused this"',
    reframePrompt: 'What factors were actually in your control?',
    scripture: '"Cast your burden on the Lord." - Psalm 55:22',
  },
};

// ============================================
// STEPS
// ============================================

type Step = 'capture' | 'identify' | 'investigate' | 'reframe' | 'reflect';

const STEPS: Step[] = ['capture', 'identify', 'investigate', 'reframe', 'reflect'];

const STEP_LABELS = {
  capture: 'Capture',
  identify: 'Identify',
  investigate: 'Investigate',
  reframe: 'Reframe',
  reflect: 'Reflect',
};

// ============================================
// MAIN COMPONENT
// ============================================

interface ThoughtDetectiveProps {
  onClose: () => void;
}

export function ThoughtDetective({ onClose }: ThoughtDetectiveProps) {
  const { state } = useWorldModel();
  const [currentStep, setCurrentStep] = useState<Step>('capture');
  const [originalThought, setOriginalThought] = useState('');
  const [detectedDistortions, setDetectedDistortions] = useState<string[]>([]);
  const [selectedDistortion, setSelectedDistortion] = useState<string | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [reframedThought, setReframedThought] = useState('');
  const [compassionScore, setCompassionScore] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showWhyThisWorks, setShowWhyThisWorks] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // Move to next step
  const nextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentStep]);

  // Move to previous step
  const prevStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [currentStep]);

  // Handle capture submission
  const handleCaptureSubmit = useCallback(() => {
    if (!originalThought.trim()) {
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
      return;
    }

    // Detect distortions
    const detected = detectDistortions(originalThought);
    const distortionIds = detected.map((d) => d.id);
    setDetectedDistortions(distortionIds);

    // Auto-select first if detected
    if (distortionIds.length > 0) {
      setSelectedDistortion(distortionIds[0]);
    }

    nextStep();
  }, [originalThought, nextStep]);

  // Handle identify submission
  const handleIdentifySubmit = useCallback(() => {
    if (!selectedDistortion) {
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
      return;
    }
    nextStep();
  }, [selectedDistortion, nextStep]);

  // Handle investigate submission
  const handleInvestigateSubmit = useCallback(() => {
    nextStep();
  }, [nextStep]);

  // Handle reframe submission
  const handleReframeSubmit = useCallback(() => {
    if (!reframedThought.trim()) {
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
      return;
    }

    // Calculate compassion score
    const score = scoreCompassion(reframedThought);
    setCompassionScore(score);

    nextStep();
  }, [reframedThought, nextStep]);

  // Handle completion
  const handleComplete = useCallback(() => {
    // Emit to world model
    emitThoughtReframed(
      selectedDistortion || 'unknown',
      originalThought,
      reframedThought,
      compassionScore
    );

    setShowComplete(true);
  }, [selectedDistortion, originalThought, reframedThought, compassionScore]);

  // Handle close after completion
  const handleContinue = useCallback(() => {
    setShowComplete(false);
    onClose();
  }, [onClose]);

  // Get current distortion info
  const currentDistortion = selectedDistortion ? DISTORTIONS[selectedDistortion] : null;

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'capture':
        return (
          <FadeInView>
            <GameCard style={styles.stepCard}>
              <Text style={styles.stepTitle}>Capture the Thought</Text>
              <Text style={styles.stepDescription}>
                What negative thought is bothering you right now? Write it exactly
                as it appears in your mind.
              </Text>
              <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
              <ShakeView trigger={showError}>
                <TextInput
                  style={styles.thoughtInput}
                  placeholder="Write your thought here..."
                  placeholderTextColor={COLORS.mutedBrown}
                  value={originalThought}
                  onChangeText={setOriginalThought}
                  multiline
                  maxLength={500}
                />
              </ShakeView>
              <Text style={styles.hint}>
                Be honest and specific. This is private.
              </Text>
            </GameCard>

            <View style={styles.actionContainer}>
              <GradientButton
                title="Investigate This Thought"
                onPress={handleCaptureSubmit}
                disabled={!originalThought.trim()}
              />
            </View>
          </FadeInView>
        );

      case 'identify':
        return (
          <FadeInView>
            <GameCard style={styles.stepCard}>
              <Text style={styles.stepTitle}>Identify the Distortion</Text>
              <Text style={styles.stepDescription}>
                Your thought may contain a "cognitive distortion" - a pattern of
                thinking that isn't quite accurate. Which of these sounds familiar?
              </Text>

              {/* Auto-detected badge */}
              {detectedDistortions.length > 0 && (
                <View style={styles.detectedBadge}>
                  <Badge label="Auto-detected patterns" variant="gold" />
                </View>
              )}

              {/* Distortion options */}
              <View style={styles.distortionList}>
                {Object.values(DISTORTIONS).map((distortion) => {
                  const isDetected = detectedDistortions.includes(distortion.id);
                  const isSelected = selectedDistortion === distortion.id;

                  return (
                    <TouchableOpacity
                      key={distortion.id}
                      style={[
                        styles.distortionCard,
                        isDetected && styles.distortionCardDetected,
                        isSelected && styles.distortionCardSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedDistortion(distortion.id);
                      }}
                    >
                      <View style={styles.distortionHeader}>
                        <Text style={[
                          styles.distortionName,
                          isSelected && styles.distortionNameSelected,
                        ]}>
                          {distortion.name}
                        </Text>
                        {isDetected && (
                          <Text style={styles.detectedLabel}>Detected</Text>
                        )}
                      </View>
                      <Text style={styles.distortionDescription}>
                        {distortion.description}
                      </Text>
                      <Text style={styles.distortionExample}>
                        {distortion.example}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GameCard>

            <View style={styles.actionContainer}>
              <View style={styles.buttonRow}>
                <Button
                  title="Back"
                  variant="ghost"
                  onPress={prevStep}
                  style={styles.backButton}
                />
                <Button
                  title="Continue"
                  variant="primary"
                  onPress={handleIdentifySubmit}
                  disabled={!selectedDistortion}
                  style={styles.continueButton}
                />
              </View>
            </View>
          </FadeInView>
        );

      case 'investigate':
        return (
          <FadeInView>
            <GameCard style={styles.stepCard}>
              <Text style={styles.stepTitle}>Investigate the Evidence</Text>

              {currentDistortion && (
                <View style={styles.distortionContext}>
                  <Text style={styles.distortionContextLabel}>
                    You're experiencing:
                  </Text>
                  <Text style={styles.distortionContextName}>
                    {currentDistortion.name}
                  </Text>
                </View>
              )}

              <Text style={styles.investigatePrompt}>
                {currentDistortion?.reframePrompt}
              </Text>

              <TextInput
                style={styles.notesInput}
                placeholder="Write your thoughts here... (optional)"
                placeholderTextColor={COLORS.mutedBrown}
                value={investigationNotes}
                onChangeText={setInvestigationNotes}
                multiline
                maxLength={500}
              />

              <View style={styles.scriptureBox}>
                <Text style={styles.scriptureText}>
                  {currentDistortion?.scripture}
                </Text>
              </View>
            </GameCard>

            <View style={styles.actionContainer}>
              <View style={styles.buttonRow}>
                <Button
                  title="Back"
                  variant="ghost"
                  onPress={prevStep}
                  style={styles.backButton}
                />
                <Button
                  title="Continue"
                  variant="primary"
                  onPress={handleInvestigateSubmit}
                  style={styles.continueButton}
                />
              </View>
            </View>
          </FadeInView>
        );

      case 'reframe':
        return (
          <FadeInView>
            <GameCard style={styles.stepCard}>
              <Text style={styles.stepTitle}>Reframe with Compassion</Text>
              <Text style={styles.stepDescription}>
                Now, write a kinder, more balanced version of your original thought.
                Speak to yourself as you would to a dear friend.
              </Text>

              <View style={styles.originalThoughtBox}>
                <Text style={styles.originalThoughtLabel}>Original thought:</Text>
                <Text style={styles.originalThoughtText}>"{originalThought}"</Text>
              </View>

              <ShakeView trigger={showError}>
                <TextInput
                  style={styles.reframeInput}
                  placeholder="Write a kinder thought..."
                  placeholderTextColor={COLORS.mutedBrown}
                  value={reframedThought}
                  onChangeText={setReframedThought}
                  multiline
                  maxLength={500}
                />
              </ShakeView>

              <Text style={styles.hint}>
                Try starting with "It's understandable that..." or "Even though..."
              </Text>
            </GameCard>

            <View style={styles.actionContainer}>
              <View style={styles.buttonRow}>
                <Button
                  title="Back"
                  variant="ghost"
                  onPress={prevStep}
                  style={styles.backButton}
                />
                <Button
                  title="Continue"
                  variant="primary"
                  onPress={handleReframeSubmit}
                  disabled={!reframedThought.trim()}
                  style={styles.continueButton}
                />
              </View>
            </View>
          </FadeInView>
        );

      case 'reflect':
        return (
          <FadeInView>
            <GameCard style={styles.stepCard}>
              <Text style={styles.stepTitle}>Reflect on Your Work</Text>
              <Text style={styles.stepDescription}>
                You've transformed a painful thought into something more balanced.
                Look at your journey:
              </Text>

              <View style={styles.journeyContainer}>
                <View style={styles.journeyItem}>
                  <Text style={styles.journeyLabel}>Original Thought</Text>
                  <Text style={styles.journeyThought}>"{originalThought}"</Text>
                </View>

                <View style={styles.journeyArrow}>
                  <Ionicons name="arrow-down" size={20} color={COLORS.mutedBrown} />
                </View>

                <View style={styles.journeyItem}>
                  <Text style={styles.journeyLabel}>Distortion Identified</Text>
                  <Text style={styles.journeyDistortion}>
                    {currentDistortion?.name}
                  </Text>
                </View>

                <View style={styles.journeyArrow}>
                  <Ionicons name="arrow-down" size={20} color={COLORS.mutedBrown} />
                </View>

                <View style={[styles.journeyItem, styles.journeyItemHighlight]}>
                  <Text style={styles.journeyLabel}>Reframed with Compassion</Text>
                  <Text style={styles.journeyReframe}>"{reframedThought}"</Text>
                </View>
              </View>

              <View style={styles.compassionScoreContainer}>
                <Text style={styles.compassionLabel}>Self-Compassion Score</Text>
                <Text style={styles.compassionScore}>{compassionScore}/10</Text>
              </View>
            </GameCard>

            <View style={styles.actionContainer}>
              <GradientButton
                title="Complete Session"
                onPress={handleComplete}
              />
            </View>
          </FadeInView>
        );
    }
  };

  return (
    <GameContainer
      gameId="thought_detective"
      title="Thought Detective"
      subtitle="Cognitive Reframing"
      onClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Progress */}
        <View style={styles.progressContainer}>
          <StepProgress
            currentStep={STEPS.indexOf(currentStep)}
            totalSteps={STEPS.length}
            labels={STEPS.map((s) => STEP_LABELS[s])}
          />
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Completion Modal */}
      <SessionComplete
        visible={showComplete}
        title="Detective Work Complete"
        subtitle="You investigated and reframed your thought"
        stats={[
          { label: 'Distortion', value: currentDistortion?.name.split(' ')[0] || '-' },
          { label: 'Compassion', value: `${compassionScore}/10` },
        ]}
        encouragement="Every time you reframe a thought, you're rewiring your brain. You're not stuck with your old thinking patterns."
        onContinue={handleContinue}
        continueLabel="Return to Games"
      />

      {/* Why This Works Modal */}
      <WhyThisWorks
        visible={showWhyThisWorks}
        gameId="thought_detective"
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
  progressContainer: {
    paddingVertical: SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  // Step Card
  stepCard: {
    marginBottom: SPACING.lg,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.sm,
  },
  stepDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
    marginBottom: SPACING.lg,
  },

  // Inputs
  thoughtInput: {
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },
  notesInput: {
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  reframeInput: {
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },
  hint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },

  // Distortion List
  detectedBadge: {
    marginBottom: SPACING.md,
  },
  distortionList: {
    gap: SPACING.sm,
  },
  distortionCard: {
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  distortionCardDetected: {
    borderColor: COLORS.goldLight,
  },
  distortionCardSelected: {
    backgroundColor: GAME_COLORS.thoughtDetective.secondary,
    borderColor: GAME_COLORS.thoughtDetective.primary,
  },
  distortionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  distortionName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  distortionNameSelected: {
    color: GAME_COLORS.thoughtDetective.accent,
  },
  detectedLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
  },
  distortionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xs,
  },
  distortionExample: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
  },

  // Investigate Step
  distortionContext: {
    backgroundColor: GAME_COLORS.thoughtDetective.secondary + '50',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  distortionContextLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  distortionContextName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: GAME_COLORS.thoughtDetective.accent,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 4,
  },
  investigatePrompt: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: TYPOGRAPHY.sizes.lg * 1.5,
  },
  scriptureBox: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  scriptureText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Reframe Step
  originalThoughtBox: {
    backgroundColor: COLORS.mutedTerracotta + '20',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  originalThoughtLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  originalThoughtText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
  },

  // Reflect Step
  journeyContainer: {
    marginBottom: SPACING.lg,
  },
  journeyItem: {
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  journeyItemHighlight: {
    backgroundColor: COLORS.sage + '30',
    borderWidth: 1,
    borderColor: COLORS.sage,
  },
  journeyLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  journeyThought: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
  },
  journeyDistortion: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: GAME_COLORS.thoughtDetective.accent,
    fontFamily: TYPOGRAPHY.ui,
  },
  journeyReframe: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
  },
  journeyArrow: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  arrowText: {
    fontSize: 16,
    color: COLORS.mutedBrown,
  },
  compassionScoreContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  compassionLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  compassionScore: {
    fontSize: TYPOGRAPHY.sizes.display,
    fontWeight: '700',
    color: COLORS.sage,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 4,
  },

  // Actions
  actionContainer: {
    paddingHorizontal: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
});

export default ThoughtDetective;
