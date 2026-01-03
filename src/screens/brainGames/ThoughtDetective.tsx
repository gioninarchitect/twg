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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../../utils/haptics';
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
  SessionMoodCheckIn,
  type SessionMoodLevel,
} from '../../components/brainGames';

// ============================================
// DR. AMEN'S 9 ANT TYPES
// ANT = Automatic Negative Thoughts
// Based on Dr. Daniel Amen's research from Amen Clinics
// ============================================

interface ANTInfo {
  id: string;
  antNumber: number; // Dr. Amen's ANT type number
  name: string;
  shortName: string; // For compact display
  description: string;
  example: string;
  reframePrompt: string;
  selfCompassionPrompt: string; // Kristin Neff-inspired
  scripture: string;
  keywords: string[]; // For detection
}

// The 9 ANT Types (Dr. Daniel Amen)
const ANT_TYPES: Record<string, ANTInfo> = {
  all_or_nothing: {
    id: 'all_or_nothing',
    antNumber: 1,
    name: 'All-or-Nothing Thinking',
    shortName: 'All-or-Nothing',
    description: 'Seeing things in black and white, with no middle ground. Everything is perfect or a complete failure.',
    example: '"If I can\'t do it perfectly, I shouldn\'t do it at all"',
    reframePrompt: 'What\'s a more balanced way to see this? Is there any gray area?',
    selfCompassionPrompt: 'What would you say to a friend who made the same mistake?',
    scripture: '"His mercies are new every morning." - Lamentations 3:23',
    keywords: ['always', 'never', 'completely', 'totally', 'perfect', 'ruined', 'every time'],
  },
  always_never: {
    id: 'always_never',
    antNumber: 2,
    name: 'Always/Never Thinking',
    shortName: 'Always/Never',
    description: 'Using words like "always," "never," "everyone," or "no one" to overgeneralize.',
    example: '"You never listen to me" or "I always mess things up"',
    reframePrompt: 'Is this really always or never? Can you think of one exception?',
    selfCompassionPrompt: 'We all struggle sometimes. What\'s actually true most of the time?',
    scripture: '"Weeping may endure for a night, but joy comes in the morning." - Psalm 30:5',
    keywords: ['always', 'never', 'everyone', 'no one', 'nothing', 'everything', 'every time'],
  },
  focusing_negative: {
    id: 'focusing_negative',
    antNumber: 3,
    name: 'Focusing on the Negative',
    shortName: 'Negative Focus',
    description: 'Only seeing the bad in a situation while ignoring the good.',
    example: 'Getting 9 compliments and 1 criticism, but only remembering the criticism',
    reframePrompt: 'What good things are you overlooking? What went well?',
    selfCompassionPrompt: 'Your brain is wired to notice threats. What would a balanced view look like?',
    scripture: '"Whatever is true, noble, right, pure, lovely... think about such things." - Philippians 4:8',
    keywords: ['but', 'however', 'except', 'bad', 'wrong', 'terrible', 'awful'],
  },
  fortune_telling: {
    id: 'fortune_telling',
    antNumber: 4,
    name: 'Fortune Telling',
    shortName: 'Fortune Telling',
    description: 'Predicting the future negatively without evidence to support it.',
    example: '"I know this won\'t work out" or "They\'re going to reject me"',
    reframePrompt: 'Is this prediction based on facts or fears? What evidence do you have?',
    selfCompassionPrompt: 'Uncertainty is hard. What if you stayed open to positive possibilities?',
    scripture: '"For I know the plans I have for you... plans to give you hope and a future." - Jeremiah 29:11',
    keywords: ['will', 'going to', 'know', 'certain', 'bet', 'predict', 'won\'t'],
  },
  mind_reading: {
    id: 'mind_reading',
    antNumber: 5,
    name: 'Mind Reading',
    shortName: 'Mind Reading',
    description: 'Assuming you know what others are thinking, usually something negative about you.',
    example: '"They think I\'m stupid" or "She doesn\'t like me"',
    reframePrompt: 'What do you actually know for certain? Could there be another explanation?',
    selfCompassionPrompt: 'We can\'t read minds. What would you need to feel more secure?',
    scripture: '"Man looks at the outward appearance, but the Lord looks at the heart." - 1 Samuel 16:7',
    keywords: ['think', 'thinks', 'knows', 'believes', 'probably', 'must think', 'judging'],
  },
  thinking_with_feelings: {
    id: 'thinking_with_feelings',
    antNumber: 6,
    name: 'Thinking with Your Feelings',
    shortName: 'Feeling = Fact',
    description: 'Believing something is true just because you feel it strongly.',
    example: '"I feel like a burden, so I must be one" or "I feel stupid, so I am stupid"',
    reframePrompt: 'Just because you feel it, does that make it true? What are the facts?',
    selfCompassionPrompt: 'Feelings are real but they\'re not always accurate. What\'s actually true?',
    scripture: '"The heart is deceitful above all things." - Jeremiah 17:9',
    keywords: ['feel like', 'feels like', 'I feel', 'must be', 'sense that'],
  },
  guilt_beating: {
    id: 'guilt_beating',
    antNumber: 7,
    name: 'Guilt Beating',
    shortName: 'Guilt/Should',
    description: 'Using words like "should," "must," "ought to," or "have to" to beat yourself up.',
    example: '"I should be over this by now" or "I ought to be stronger"',
    reframePrompt: 'What if you replaced "should" with "I would like to" or "It would be nice if"?',
    selfCompassionPrompt: 'You\'re being hard on yourself. What do you actually need right now?',
    scripture: '"My grace is sufficient for you, for my power is made perfect in weakness." - 2 Corinthians 12:9',
    keywords: ['should', 'shouldn\'t', 'must', 'have to', 'ought', 'need to', 'supposed to'],
  },
  labeling: {
    id: 'labeling',
    antNumber: 8,
    name: 'Labeling',
    shortName: 'Labeling',
    description: 'Attaching a negative label to yourself or others instead of describing the behavior.',
    example: '"I\'m a failure" instead of "I made a mistake" or "I\'m worthless"',
    reframePrompt: 'Would you say this to a friend? What would be a kinder, more accurate description?',
    selfCompassionPrompt: 'You are not your worst moment. Who are you beyond this label?',
    scripture: '"You are fearfully and wonderfully made." - Psalm 139:14',
    keywords: ['I\'m a', 'I am', 'loser', 'failure', 'worthless', 'stupid', 'idiot', 'terrible'],
  },
  blame: {
    id: 'blame',
    antNumber: 9,
    name: 'Blame',
    shortName: 'Blame',
    description: 'Blaming others for your problems or blaming yourself for things outside your control.',
    example: '"It\'s all my fault" or "If only they hadn\'t..." or "You make me feel..."',
    reframePrompt: 'What parts were in your control? What parts were not? What can you do now?',
    selfCompassionPrompt: 'Taking responsibility is different from taking blame. What\'s the difference here?',
    scripture: '"Cast your burden on the Lord, and He shall sustain you." - Psalm 55:22',
    keywords: ['fault', 'blame', 'because of', 'made me', 'caused', 'your fault', 'my fault'],
  },
};

// Legacy alias for backward compatibility
const DISTORTIONS = ANT_TYPES;

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
  onClose?: () => void;
}

export function ThoughtDetective({ onClose }: ThoughtDetectiveProps) {
  const navigation = useNavigation();
  const handleClose = onClose || (() => navigation.goBack());
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

  // Mood check-in states
  const [showPreMoodCheck, setShowPreMoodCheck] = useState(true); // Show on entry
  const [showPostMoodCheck, setShowPostMoodCheck] = useState(false);
  const [preMood, setPreMood] = useState<SessionMoodLevel | null>(null);
  const [postMood, setPostMood] = useState<SessionMoodLevel | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Move to next step
  const nextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
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

    // Show post-mood check instead of completion directly
    setShowPostMoodCheck(true);
  }, [selectedDistortion, originalThought, reframedThought, compassionScore]);

  // Handle pre-mood selection
  const handlePreMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPreMood(mood);
    setShowPreMoodCheck(false);
  }, []);

  // Handle pre-mood skip
  const handlePreMoodSkip = useCallback(() => {
    setShowPreMoodCheck(false);
  }, []);

  // Handle post-mood selection
  const handlePostMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPostMood(mood);
    setShowPostMoodCheck(false);
    setShowComplete(true);
  }, []);

  // Handle post-mood skip
  const handlePostMoodSkip = useCallback(() => {
    setShowPostMoodCheck(false);
    setShowComplete(true);
  }, []);

  // Handle close after completion
  const handleContinue = useCallback(() => {
    setShowComplete(false);
    handleClose();
  }, [handleClose]);

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

              {/* Dr. Amen Attribution */}
              <View style={styles.amenAttribution}>
                <Text style={styles.amenAttributionText}>
                  Based on Dr. Daniel Amen's 9 ANT Types
                </Text>
              </View>

              {/* ANT Type options */}
              <View style={styles.distortionList}>
                {Object.values(ANT_TYPES).map((ant) => {
                  const isDetected = detectedDistortions.includes(ant.id);
                  const isSelected = selectedDistortion === ant.id;

                  return (
                    <TouchableOpacity
                      key={ant.id}
                      style={[
                        styles.distortionCard,
                        isDetected && styles.distortionCardDetected,
                        isSelected && styles.distortionCardSelected,
                      ]}
                      onPress={() => {
                        safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
                        setSelectedDistortion(ant.id);
                      }}
                    >
                      <View style={styles.distortionHeader}>
                        {/* ANT Type Number Badge */}
                        <View style={[
                          styles.antBadge,
                          isSelected && styles.antBadgeSelected,
                        ]}>
                          <Text style={[
                            styles.antBadgeText,
                            isSelected && styles.antBadgeTextSelected,
                          ]}>
                            ANT {ant.antNumber}
                          </Text>
                        </View>
                        <Text style={[
                          styles.distortionName,
                          isSelected && styles.distortionNameSelected,
                        ]}>
                          {ant.shortName}
                        </Text>
                        {isDetected && (
                          <View style={styles.detectedBadgeSmall}>
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.gold} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.distortionDescription}>
                        {ant.description}
                      </Text>
                      <Text style={styles.distortionExample}>
                        {ant.example}
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

              {/* Self-Compassion Prompt */}
              {currentDistortion?.selfCompassionPrompt && (
                <View style={styles.selfCompassionBox}>
                  <View style={styles.selfCompassionHeader}>
                    <Ionicons name="heart-outline" size={18} color={COLORS.sage} />
                    <Text style={styles.selfCompassionLabel}>Self-Compassion Check</Text>
                  </View>
                  <Text style={styles.selfCompassionText}>
                    {currentDistortion.selfCompassionPrompt}
                  </Text>
                </View>
              )}

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
      onClose={handleClose}
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

      {/* Pre-Session Mood Check-In */}
      <SessionMoodCheckIn
        visible={showPreMoodCheck}
        type="pre"
        onSelect={handlePreMoodSelect}
        onSkip={handlePreMoodSkip}
      />

      {/* Post-Session Mood Check-In */}
      <SessionMoodCheckIn
        visible={showPostMoodCheck}
        type="post"
        preMood={preMood || undefined}
        onSelect={handlePostMoodSelect}
        onSkip={handlePostMoodSkip}
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

  // Dr. Amen Attribution
  amenAttribution: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  amenAttributionText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // ANT Badge
  antBadge: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginRight: SPACING.sm,
  },
  antBadgeSelected: {
    backgroundColor: GAME_COLORS.thoughtDetective.primary,
  },
  antBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '700',
  },
  antBadgeTextSelected: {
    color: COLORS.background,
  },
  detectedBadgeSmall: {
    marginLeft: 'auto',
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
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  distortionName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    flex: 1,
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

  // Self-Compassion
  selfCompassionBox: {
    backgroundColor: 'rgba(143, 188, 143, 0.15)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  },
  selfCompassionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  selfCompassionLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.sage,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selfCompassionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
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
