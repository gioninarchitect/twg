/**
 * Thought Detective
 * Identify and reframe cognitive distortions using CBT principles
 * Unlocks: Day 15
 *
 * Premium UI v2.0 - Immersive detective investigation theme
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// DR. AMEN'S 9 ANT TYPES
// ============================================

interface ANTInfo {
  id: string;
  antNumber: number;
  nameKey: string;
  shortNameKey: string;
  descriptionKey: string;
  exampleKey: string;
  reframePromptKey: string;
  selfCompassionPromptKey: string;
  scriptureKey: string;
  keywords: string[];
  icon: string; // Ionicon name
}

const ANT_TYPES: Record<string, ANTInfo> = {
  all_or_nothing: {
    id: 'all_or_nothing',
    antNumber: 1,
    nameKey: 'brainGames.thoughtDetective.ants.allOrNothing.name',
    shortNameKey: 'brainGames.thoughtDetective.ants.allOrNothing.shortName',
    descriptionKey: 'brainGames.thoughtDetective.ants.allOrNothing.description',
    exampleKey: 'brainGames.thoughtDetective.ants.allOrNothing.example',
    reframePromptKey: 'brainGames.thoughtDetective.ants.allOrNothing.reframePrompt',
    selfCompassionPromptKey: 'brainGames.thoughtDetective.ants.allOrNothing.selfCompassionPrompt',
    scriptureKey: 'brainGames.thoughtDetective.ants.allOrNothing.scripture',
    keywords: ['always', 'never', 'completely', 'totally', 'perfect', 'ruined'],
    icon: 'contrast-outline',
  },
  always_never: {
    id: 'always_never',
    antNumber: 2,
    nameKey: 'brainGames.thoughtDetective.ants.alwaysNever.name',
    shortNameKey: 'brainGames.thoughtDetective.ants.alwaysNever.shortName',
    descriptionKey: 'brainGames.thoughtDetective.ants.alwaysNever.description',
    exampleKey: 'brainGames.thoughtDetective.ants.alwaysNever.example',
    reframePromptKey: 'brainGames.thoughtDetective.ants.alwaysNever.reframePrompt',
    selfCompassionPromptKey: 'brainGames.thoughtDetective.ants.alwaysNever.selfCompassionPrompt',
    scriptureKey: 'brainGames.thoughtDetective.ants.alwaysNever.scripture',
    keywords: ['always', 'never', 'everyone', 'no one', 'nothing', 'everything'],
    icon: 'infinite-outline',
  },
  focusing_negative: {
    id: 'focusing_negative',
    antNumber: 3,
    nameKey: 'brainGames.thoughtDetective.ants.focusingNegative.name',
    shortNameKey: 'brainGames.thoughtDetective.ants.focusingNegative.shortName',
    descriptionKey: 'brainGames.thoughtDetective.ants.focusingNegative.description',
    exampleKey: 'brainGames.thoughtDetective.ants.focusingNegative.example',
    reframePromptKey: 'brainGames.thoughtDetective.ants.focusingNegative.reframePrompt',
    selfCompassionPromptKey: 'brainGames.thoughtDetective.ants.focusingNegative.selfCompassionPrompt',
    scriptureKey: 'brainGames.thoughtDetective.ants.focusingNegative.scripture',
    keywords: ['but', 'however', 'except', 'bad', 'wrong', 'terrible'],
    icon: 'remove-circle-outline',
  },
  fortune_telling: {
    id: 'fortune_telling',
    antNumber: 4,
    nameKey: 'brainGames.thoughtDetective.ants.fortuneTelling.name',
    shortNameKey: 'brainGames.thoughtDetective.ants.fortuneTelling.shortName',
    descriptionKey: 'brainGames.thoughtDetective.ants.fortuneTelling.description',
    exampleKey: 'brainGames.thoughtDetective.ants.fortuneTelling.example',
    reframePromptKey: 'brainGames.thoughtDetective.ants.fortuneTelling.reframePrompt',
    selfCompassionPromptKey: 'brainGames.thoughtDetective.ants.fortuneTelling.selfCompassionPrompt',
    scriptureKey: 'brainGames.thoughtDetective.ants.fortuneTelling.scripture',
    keywords: ['will', 'going to', 'know', 'certain', 'bet', 'predict'],
    icon: 'cloudy-night-outline',
  },
  mind_reading: {
    id: 'mind_reading',
    antNumber: 5,
    nameKey: 'brainGames.thoughtDetective.ants.mindReading.name',
    shortNameKey: 'brainGames.thoughtDetective.ants.mindReading.shortName',
    descriptionKey: 'brainGames.thoughtDetective.ants.mindReading.description',
    exampleKey: 'brainGames.thoughtDetective.ants.mindReading.example',
    reframePromptKey: 'brainGames.thoughtDetective.ants.mindReading.reframePrompt',
    selfCompassionPromptKey: 'brainGames.thoughtDetective.ants.mindReading.selfCompassionPrompt',
    scriptureKey: 'brainGames.thoughtDetective.ants.mindReading.scripture',
    keywords: ['think', 'thinks', 'knows', 'believes', 'probably', 'must think'],
    icon: 'eye-outline',
  },
  thinking_with_feelings: {
    id: 'thinking_with_feelings',
    antNumber: 6,
    nameKey: 'brainGames.thoughtDetective.ants.thinkingWithFeelings.name',
    shortNameKey: 'brainGames.thoughtDetective.ants.thinkingWithFeelings.shortName',
    descriptionKey: 'brainGames.thoughtDetective.ants.thinkingWithFeelings.description',
    exampleKey: 'brainGames.thoughtDetective.ants.thinkingWithFeelings.example',
    reframePromptKey: 'brainGames.thoughtDetective.ants.thinkingWithFeelings.reframePrompt',
    selfCompassionPromptKey: 'brainGames.thoughtDetective.ants.thinkingWithFeelings.selfCompassionPrompt',
    scriptureKey: 'brainGames.thoughtDetective.ants.thinkingWithFeelings.scripture',
    keywords: ['feel like', 'feels like', 'I feel', 'must be', 'sense that'],
    icon: 'heart-dislike-outline',
  },
  guilt_beating: {
    id: 'guilt_beating',
    antNumber: 7,
    nameKey: 'brainGames.thoughtDetective.ants.guiltBeating.name',
    shortNameKey: 'brainGames.thoughtDetective.ants.guiltBeating.shortName',
    descriptionKey: 'brainGames.thoughtDetective.ants.guiltBeating.description',
    exampleKey: 'brainGames.thoughtDetective.ants.guiltBeating.example',
    reframePromptKey: 'brainGames.thoughtDetective.ants.guiltBeating.reframePrompt',
    selfCompassionPromptKey: 'brainGames.thoughtDetective.ants.guiltBeating.selfCompassionPrompt',
    scriptureKey: 'brainGames.thoughtDetective.ants.guiltBeating.scripture',
    keywords: ['should', 'shouldn\'t', 'must', 'have to', 'ought', 'need to'],
    icon: 'hammer-outline',
  },
  labeling: {
    id: 'labeling',
    antNumber: 8,
    nameKey: 'brainGames.thoughtDetective.ants.labeling.name',
    shortNameKey: 'brainGames.thoughtDetective.ants.labeling.shortName',
    descriptionKey: 'brainGames.thoughtDetective.ants.labeling.description',
    exampleKey: 'brainGames.thoughtDetective.ants.labeling.example',
    reframePromptKey: 'brainGames.thoughtDetective.ants.labeling.reframePrompt',
    selfCompassionPromptKey: 'brainGames.thoughtDetective.ants.labeling.selfCompassionPrompt',
    scriptureKey: 'brainGames.thoughtDetective.ants.labeling.scripture',
    keywords: ['I\'m a', 'I am', 'loser', 'failure', 'worthless', 'stupid'],
    icon: 'pricetag-outline',
  },
  blame: {
    id: 'blame',
    antNumber: 9,
    nameKey: 'brainGames.thoughtDetective.ants.blame.name',
    shortNameKey: 'brainGames.thoughtDetective.ants.blame.shortName',
    descriptionKey: 'brainGames.thoughtDetective.ants.blame.description',
    exampleKey: 'brainGames.thoughtDetective.ants.blame.example',
    reframePromptKey: 'brainGames.thoughtDetective.ants.blame.reframePrompt',
    selfCompassionPromptKey: 'brainGames.thoughtDetective.ants.blame.selfCompassionPrompt',
    scriptureKey: 'brainGames.thoughtDetective.ants.blame.scripture',
    keywords: ['fault', 'blame', 'because of', 'made me', 'caused'],
    icon: 'finger-print-outline',
  },
};

// ============================================
// STEPS
// ============================================

type Step = 'capture' | 'identify' | 'investigate' | 'reframe' | 'reflect';

const STEPS: Step[] = ['capture', 'identify', 'investigate', 'reframe', 'reflect'];

const STEP_INFO = {
  capture: { labelKey: 'brainGames.thoughtDetective.steps.capture', icon: 'document-text-outline' },
  identify: { labelKey: 'brainGames.thoughtDetective.steps.identify', icon: 'search-outline' },
  investigate: { labelKey: 'brainGames.thoughtDetective.steps.investigate', icon: 'analytics-outline' },
  reframe: { labelKey: 'brainGames.thoughtDetective.steps.reframe', icon: 'refresh-outline' },
  reflect: { labelKey: 'brainGames.thoughtDetective.steps.reflect', icon: 'checkmark-done-outline' },
};

// ============================================
// ANIMATED MAGNIFYING GLASS
// ============================================

function MagnifyingGlass({ active }: { active: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, [active]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <Animated.View
      style={[
        styles.magnifyingGlass,
        {
          transform: [{ scale: scaleAnim }, { rotate: rotation }],
        },
      ]}
    >
      <Ionicons name="search" size={32} color={COLORS.gold} />
    </Animated.View>
  );
}

// ============================================
// STEP INDICATOR (Visual)
// ============================================

function VisualStepIndicator({ currentStep, t }: { currentStep: Step; t: (key: string) => string }) {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const info = STEP_INFO[step];

        return (
          <View key={step} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                isCompleted && styles.stepDotCompleted,
                isCurrent && styles.stepDotCurrent,
              ]}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Ionicons
                  name={info.icon as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={isCurrent ? '#0D0D0D' : 'rgba(255,255,255,0.4)'}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                (isCompleted || isCurrent) && styles.stepLabelActive,
              ]}
            >
              {t(info.labelKey)}
            </Text>
            {index < STEPS.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  isCompleted && styles.stepLineCompleted,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ============================================
// ANT CARD (Compact Grid Version)
// ============================================

interface ANTCardProps {
  ant: ANTInfo;
  isDetected: boolean;
  isSelected: boolean;
  onPress: () => void;
  t: (key: string) => string;
}

function ANTCard({ ant, isDetected, isSelected, onPress, t }: ANTCardProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: ant.antNumber * 50,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.antCard,
          isDetected && styles.antCardDetected,
          isSelected && styles.antCardSelected,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Detection badge */}
        {isDetected && (
          <View style={styles.detectionBadge}>
            <Ionicons name="alert-circle" size={12} color="#0D0D0D" />
          </View>
        )}

        {/* Icon */}
        <View
          style={[
            styles.antIconContainer,
            isSelected && styles.antIconContainerSelected,
          ]}
        >
          <Ionicons
            name={ant.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={isSelected ? COLORS.gold : 'rgba(255,255,255,0.6)'}
          />
        </View>

        {/* Name */}
        <Text
          style={[styles.antName, isSelected && styles.antNameSelected]}
          numberOfLines={2}
        >
          {t(ant.shortNameKey)}
        </Text>

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.gold} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// CLUE CARD (Investigation Notes)
// ============================================

function ClueCard({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <View style={styles.clueCard}>
      <View style={styles.clueCardPin} />
      <Text style={styles.clueCardLabel}>{label}</Text>
      {children}
    </View>
  );
}

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
  const { t } = useTranslation();
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
  const [showPreMoodCheck, setShowPreMoodCheck] = useState(true);
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

    const detected = detectDistortions(originalThought);
    const distortionIds = detected.map((d) => d.id);
    setDetectedDistortions(distortionIds);

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

    const score = scoreCompassion(reframedThought);
    setCompassionScore(score);
    nextStep();
  }, [reframedThought, nextStep]);

  // Handle completion
  const handleComplete = useCallback(() => {
    emitThoughtReframed(
      selectedDistortion || 'unknown',
      originalThought,
      reframedThought,
      compassionScore
    );
    setShowPostMoodCheck(true);
  }, [selectedDistortion, originalThought, reframedThought, compassionScore]);

  // Mood handlers
  const handlePreMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPreMood(mood);
    setShowPreMoodCheck(false);
  }, []);

  const handlePreMoodSkip = useCallback(() => {
    setShowPreMoodCheck(false);
  }, []);

  const handlePostMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPostMood(mood);
    setShowPostMoodCheck(false);
    setShowComplete(true);
  }, []);

  const handlePostMoodSkip = useCallback(() => {
    setShowPostMoodCheck(false);
    setShowComplete(true);
  }, []);

  const handleContinue = useCallback(() => {
    setShowComplete(false);
    handleClose();
  }, [handleClose]);

  const currentDistortion = selectedDistortion ? ANT_TYPES[selectedDistortion] : null;

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'capture':
        return (
          <FadeInView>
            {/* Header with magnifying glass */}
            <View style={styles.stepHeader}>
              <MagnifyingGlass active={true} />
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>{t('brainGames.thoughtDetective.captureTitle')}</Text>
                <Text style={styles.stepSubtitle}>
                  {t('brainGames.thoughtDetective.captureSubtitle')}
                </Text>
              </View>
            </View>

            <View style={styles.whyButtonRow}>
              <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
            </View>

            {/* Input */}
            <ShakeView trigger={showError}>
              <View style={styles.thoughtInputContainer}>
                <LinearGradient
                  colors={['#1a1a1a', '#141414']}
                  style={styles.inputGradient}
                >
                  <TextInput
                    style={styles.thoughtInput}
                    placeholder={t('brainGames.thoughtDetective.capturePlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={originalThought}
                    onChangeText={setOriginalThought}
                    multiline
                    maxLength={500}
                  />
                </LinearGradient>
              </View>
            </ShakeView>

            <Text style={styles.hint}>
              {t('brainGames.thoughtDetective.captureHint')}
            </Text>

            {/* Action */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                !originalThought.trim() && styles.primaryButtonDisabled,
              ]}
              onPress={handleCaptureSubmit}
              disabled={!originalThought.trim()}
            >
              <LinearGradient
                colors={originalThought.trim() ? [COLORS.gold, '#B8960F'] : ['#333', '#222']}
                style={styles.primaryButtonGradient}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={originalThought.trim() ? '#0D0D0D' : '#666'}
                />
                <Text
                  style={[
                    styles.primaryButtonText,
                    !originalThought.trim() && styles.primaryButtonTextDisabled,
                  ]}
                >
                  {t('brainGames.thoughtDetective.investigateButton')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </FadeInView>
        );

      case 'identify':
        return (
          <FadeInView>
            <View style={styles.stepHeader}>
              <View style={styles.detectiveIcon}>
                <Ionicons name="search-outline" size={28} color={COLORS.gold} />
              </View>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>{t('brainGames.thoughtDetective.identifyTitle')}</Text>
                <Text style={styles.stepSubtitle}>
                  {t('brainGames.thoughtDetective.identifySubtitle')}
                </Text>
              </View>
            </View>

            {/* Auto-detected notice */}
            {detectedDistortions.length > 0 && (
              <View style={styles.detectedNotice}>
                <Ionicons name="bulb" size={16} color={COLORS.gold} />
                <Text style={styles.detectedNoticeText}>
                  {t('brainGames.thoughtDetective.detectedPatterns', { count: detectedDistortions.length })}
                </Text>
              </View>
            )}

            {/* ANT Grid */}
            <View style={styles.antGrid}>
              {Object.values(ANT_TYPES).map((ant) => (
                <ANTCard
                  key={ant.id}
                  ant={ant}
                  isDetected={detectedDistortions.includes(ant.id)}
                  isSelected={selectedDistortion === ant.id}
                  onPress={() => {
                    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
                    setSelectedDistortion(ant.id);
                  }}
                  t={t}
                />
              ))}
            </View>

            {/* Selected description */}
            {currentDistortion && (
              <View style={styles.selectedDescription}>
                <Text style={styles.selectedDescriptionTitle}>
                  {t(currentDistortion.nameKey)}
                </Text>
                <Text style={styles.selectedDescriptionText}>
                  {t(currentDistortion.descriptionKey)}
                </Text>
                <Text style={styles.selectedDescriptionExample}>
                  {t('brainGames.thoughtDetective.example')}: {t(currentDistortion.exampleKey)}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !selectedDistortion && styles.continueButtonDisabled,
                ]}
                onPress={handleIdentifySubmit}
                disabled={!selectedDistortion}
              >
                <Text
                  style={[
                    styles.continueButtonText,
                    !selectedDistortion && styles.continueButtonTextDisabled,
                  ]}
                >
                  {t('common.continue')}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={selectedDistortion ? '#0D0D0D' : '#666'}
                />
              </TouchableOpacity>
            </View>
          </FadeInView>
        );

      case 'investigate':
        return (
          <FadeInView>
            <View style={styles.stepHeader}>
              <View style={styles.detectiveIcon}>
                <Ionicons name="analytics-outline" size={28} color={COLORS.gold} />
              </View>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>{t('brainGames.thoughtDetective.investigateTitle')}</Text>
                <Text style={styles.stepSubtitle}>
                  {t('brainGames.thoughtDetective.investigateSubtitle')}
                </Text>
              </View>
            </View>

            {/* Pattern identified */}
            {currentDistortion && (
              <ClueCard label={t('brainGames.thoughtDetective.patternFound')}>
                <View style={styles.patternRow}>
                  <Ionicons
                    name={currentDistortion.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={COLORS.gold}
                  />
                  <Text style={styles.patternName}>{t(currentDistortion.nameKey)}</Text>
                </View>
              </ClueCard>
            )}

            {/* Investigation prompt */}
            <View style={styles.investigationPrompt}>
              <Ionicons name="help-circle" size={20} color={COLORS.textSecondary} />
              <Text style={styles.investigationQuestion}>
                {currentDistortion && t(currentDistortion.reframePromptKey)}
              </Text>
            </View>

            {/* Self-compassion prompt */}
            {currentDistortion?.selfCompassionPromptKey && (
              <View style={styles.compassionBox}>
                <View style={styles.compassionHeader}>
                  <Ionicons name="heart" size={16} color="#E8B4D8" />
                  <Text style={styles.compassionLabel}>{t('brainGames.thoughtDetective.selfCompassionCheck')}</Text>
                </View>
                <Text style={styles.compassionText}>
                  {t(currentDistortion.selfCompassionPromptKey)}
                </Text>
              </View>
            )}

            {/* Notes input */}
            <View style={styles.notesContainer}>
              <TextInput
                style={styles.notesInput}
                placeholder={t('brainGames.thoughtDetective.notesPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={investigationNotes}
                onChangeText={setInvestigationNotes}
                multiline
                maxLength={500}
              />
            </View>

            {/* Scripture */}
            <View style={styles.scriptureBox}>
              <Text style={styles.scriptureText}>{currentDistortion && t(currentDistortion.scriptureKey)}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleInvestigateSubmit}
              >
                <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#0D0D0D" />
              </TouchableOpacity>
            </View>
          </FadeInView>
        );

      case 'reframe':
        return (
          <FadeInView>
            <View style={styles.stepHeader}>
              <View style={styles.detectiveIcon}>
                <Ionicons name="refresh-outline" size={28} color={COLORS.gold} />
              </View>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>{t('brainGames.thoughtDetective.reframeTitle')}</Text>
                <Text style={styles.stepSubtitle}>
                  {t('brainGames.thoughtDetective.reframeSubtitle')}
                </Text>
              </View>
            </View>

            {/* Original thought display */}
            <View style={styles.originalThoughtDisplay}>
              <Text style={styles.originalThoughtLabel}>{t('brainGames.thoughtDetective.originalThought')}:</Text>
              <Text style={styles.originalThoughtText}>"{originalThought}"</Text>
            </View>

            {/* Reframe input */}
            <ShakeView trigger={showError}>
              <View style={styles.reframeInputContainer}>
                <LinearGradient
                  colors={['rgba(143, 188, 143, 0.15)', 'rgba(143, 188, 143, 0.05)']}
                  style={styles.reframeGradient}
                >
                  <TextInput
                    style={styles.reframeInput}
                    placeholder={t('brainGames.thoughtDetective.reframePlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={reframedThought}
                    onChangeText={setReframedThought}
                    multiline
                    maxLength={500}
                  />
                </LinearGradient>
              </View>
            </ShakeView>

            <Text style={styles.hint}>
              {t('brainGames.thoughtDetective.reframeHint')}
            </Text>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !reframedThought.trim() && styles.continueButtonDisabled,
                ]}
                onPress={handleReframeSubmit}
                disabled={!reframedThought.trim()}
              >
                <Text
                  style={[
                    styles.continueButtonText,
                    !reframedThought.trim() && styles.continueButtonTextDisabled,
                  ]}
                >
                  {t('common.continue')}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={reframedThought.trim() ? '#0D0D0D' : '#666'}
                />
              </TouchableOpacity>
            </View>
          </FadeInView>
        );

      case 'reflect':
        return (
          <FadeInView>
            <View style={styles.stepHeader}>
              <View style={styles.detectiveIcon}>
                <Ionicons name="checkmark-done-outline" size={28} color={COLORS.gold} />
              </View>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>{t('brainGames.thoughtDetective.reflectTitle')}</Text>
                <Text style={styles.stepSubtitle}>
                  {t('brainGames.thoughtDetective.reflectSubtitle')}
                </Text>
              </View>
            </View>

            {/* Journey visualization */}
            <View style={styles.journeyBoard}>
              {/* Original */}
              <View style={styles.journeyCard}>
                <View style={[styles.journeyCardHeader, styles.journeyCardHeaderOld]}>
                  <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
                  <Text style={styles.journeyCardHeaderText}>{t('brainGames.thoughtDetective.oldThought')}</Text>
                </View>
                <Text style={styles.journeyCardText}>"{originalThought}"</Text>
              </View>

              {/* Arrow */}
              <View style={styles.journeyArrow}>
                <Ionicons name="arrow-down" size={24} color={COLORS.gold} />
                <Text style={styles.journeyArrowLabel}>{currentDistortion && t(currentDistortion.shortNameKey)}</Text>
              </View>

              {/* Reframed */}
              <View style={[styles.journeyCard, styles.journeyCardNew]}>
                <View style={[styles.journeyCardHeader, styles.journeyCardHeaderNew]}>
                  <Ionicons name="heart" size={16} color={COLORS.sage} />
                  <Text style={styles.journeyCardHeaderText}>{t('brainGames.thoughtDetective.newThought')}</Text>
                </View>
                <Text style={styles.journeyCardText}>"{reframedThought}"</Text>
              </View>
            </View>

            {/* Compassion score */}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>{t('brainGames.thoughtDetective.selfCompassionScore')}</Text>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>{compassionScore}</Text>
                <Text style={styles.scoreMax}>/10</Text>
              </View>
            </View>

            {/* Complete button */}
            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <LinearGradient
                colors={[COLORS.gold, '#B8960F']}
                style={styles.completeButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={22} color="#0D0D0D" />
                <Text style={styles.completeButtonText}>{t('brainGames.thoughtDetective.completeInvestigation')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </FadeInView>
        );
    }
  };

  return (
    <GameContainer
      gameId="thought_detective"
      title={t('brainGames.games.thoughtDetective.title')}
      subtitle={t('brainGames.games.thoughtDetective.subtitle')}
      onClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Visual Step Indicator */}
        <VisualStepIndicator currentStep={currentStep} t={t} />

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
        title={t('brainGames.thoughtDetective.caseClosed')}
        subtitle={t('brainGames.thoughtDetective.solvedMystery')}
        stats={[
          { label: t('brainGames.thoughtDetective.patternLabel'), value: currentDistortion ? t(currentDistortion.shortNameKey) : '-' },
          { label: t('brainGames.thoughtDetective.compassionLabel'), value: `${compassionScore}/10` },
        ]}
        encouragement={t('brainGames.thoughtDetective.encouragement')}
        onContinue={handleContinue}
        continueLabel={t('brainGames.breathe.returnToGames')}
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
// STYLES - Premium Detective UI
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
    paddingHorizontal: SPACING.md,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  },
  stepDotCurrent: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 4,
  },
  stepLabelActive: {
    color: COLORS.textPrimary,
  },
  stepLine: {
    position: 'absolute',
    top: 14,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepLineCompleted: {
    backgroundColor: COLORS.sage,
  },

  // Step Header
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  stepHeaderText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  stepSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  magnifyingGlass: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectiveIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  whyButtonRow: {
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },

  // Thought Input
  thoughtInputContainer: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  inputGradient: {
    padding: SPACING.lg,
  },
  thoughtInput: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },
  hint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },

  // Primary Button
  primaryButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: '#0D0D0D',
    fontFamily: TYPOGRAPHY.ui,
  },
  primaryButtonTextDisabled: {
    color: '#666',
  },

  // Detection Notice
  detectedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  detectedNoticeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },

  // ANT Grid
  antGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  antCard: {
    width: (SCREEN_WIDTH - SPACING.md * 4 - SPACING.sm * 2) / 3,
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  antCardDetected: {
    borderColor: COLORS.gold,
  },
  antCardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  detectionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  antIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  antIconContainerSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  antName: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },
  antNameSelected: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },

  // Selected Description
  selectedDescription: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  selectedDescriptionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: 4,
  },
  selectedDescriptionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: 8,
  },
  selectedDescriptionExample: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  continueButtonDisabled: {
    backgroundColor: '#333',
  },
  continueButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: '#0D0D0D',
    fontFamily: TYPOGRAPHY.ui,
  },
  continueButtonTextDisabled: {
    color: '#666',
  },

  // Clue Card
  clueCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clueCardPin: {
    position: 'absolute',
    top: -6,
    left: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gold,
  },
  clueCardLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  patternName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },

  // Investigation
  investigationPrompt: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  investigationQuestion: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },

  // Compassion Box
  compassionBox: {
    backgroundColor: 'rgba(232, 180, 216, 0.1)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: '#E8B4D8',
  },
  compassionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  compassionLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#E8B4D8',
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  compassionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.sizes.sm * 1.5,
  },

  // Notes
  notesContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notesInput: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Scripture
  scriptureBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scriptureText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.sm * 1.5,
  },

  // Reframe
  originalThoughtDisplay: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  originalThoughtLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: 'rgba(255, 107, 107, 0.8)',
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  originalThoughtText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
  },
  reframeInputContainer: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  reframeGradient: {
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(143, 188, 143, 0.3)',
    borderRadius: RADIUS.xl,
  },
  reframeInput: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },

  // Journey Board
  journeyBoard: {
    marginBottom: SPACING.lg,
  },
  journeyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  journeyCardNew: {
    borderColor: 'rgba(143, 188, 143, 0.3)',
    backgroundColor: 'rgba(143, 188, 143, 0.1)',
  },
  journeyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  journeyCardHeaderOld: {},
  journeyCardHeaderNew: {},
  journeyCardHeaderText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  journeyCardText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
  },
  journeyArrow: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  journeyArrowLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
    marginTop: 2,
  },

  // Score
  scoreContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  scoreLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.sm,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(143, 188, 143, 0.15)',
    borderWidth: 3,
    borderColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.sage,
    fontFamily: TYPOGRAPHY.ui,
  },
  scoreMax: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: -4,
  },

  // Complete Button
  completeButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  completeButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: '#0D0D0D',
    fontFamily: TYPOGRAPHY.ui,
  },
});

export default ThoughtDetective;
