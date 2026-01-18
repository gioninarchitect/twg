/**
 * Breathe with God
 * Guided breathing exercises based on Polyvagal Theory
 * Unlocks: Day 1
 *
 * Premium UI v2.0 - Immersive breathing sanctuary
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../../utils/haptics';
import {
  saveBreathingPreferences,
  loadBreathingPreferences,
  recordGameSession,
} from '../../services/gameDataService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme/colors';
import { GAME_COLORS, GAME_GRADIENTS } from '../../theme/brainGames';
import { emitBreathingSession } from '../../worldModel';
import { Button, GradientButton } from '../../components/PremiumUI';
import {
  GameContainer,
  GameCard,
  GameSection,
  GameFooter,
  SessionComplete,
  BreathingCircle,
  FadeInView,
  useBreathingSession,
  BREATHING_PATTERNS,
  WhyThisWorks,
  WhyThisWorksButton,
  SessionMoodCheckIn,
  type BreathPhase,
  type SessionMoodLevel,
} from '../../components/brainGames';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// CONSTANTS
// ============================================

const PHASE_INSTRUCTION_KEYS: Record<BreathPhase, string> = {
  idle: 'brainGames.breathe.phaseInstructions.idle',
  inhale: 'brainGames.breathe.phaseInstructions.inhale',
  holdIn: 'brainGames.breathe.phaseInstructions.hold',
  exhale: 'brainGames.breathe.phaseInstructions.exhale',
  holdOut: 'brainGames.breathe.phaseInstructions.rest',
};

const PHASE_SCRIPTURE_KEYS: Record<BreathPhase, string> = {
  idle: 'brainGames.breathe.scripture.idle',
  inhale: 'brainGames.breathe.scripture.inhale',
  holdIn: 'brainGames.breathe.scripture.holdIn',
  exhale: 'brainGames.breathe.scripture.exhale',
  holdOut: 'brainGames.breathe.scripture.holdOut',
};

// Pattern details with icons and benefits (benefitKey for translation)
const PATTERN_DETAILS: Record<string, { icon: string; benefitKey: string; color: string }> = {
  relaxing: {
    icon: 'leaf-outline',
    benefitKey: 'brainGames.breathe.patterns.relaxing.benefit',
    color: '#4ade80',
  },
  energizing: {
    icon: 'sunny-outline',
    benefitKey: 'brainGames.breathe.patterns.energizing.benefit',
    color: '#fbbf24',
  },
  balancing: {
    icon: 'infinite-outline',
    benefitKey: 'brainGames.breathe.patterns.balancing.benefit',
    color: '#60a5fa',
  },
  calming: {
    icon: 'moon-outline',
    benefitKey: 'brainGames.breathe.patterns.calming.benefit',
    color: '#a78bfa',
  },
};

// Audio guidance with haptics
async function playGuidanceTone(): Promise<void> {
  try {
    await safeHaptics.impactAsync(ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.log('Audio guidance tone error:', error);
  }
}

// ============================================
// AMBIENT PARTICLE
// ============================================

interface AmbientParticleProps {
  delay: number;
  duration: number;
  size: number;
  startX: number;
}

function AmbientParticle({ delay, duration, size, startX }: AmbientParticleProps) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      animation.setValue(0);
      Animated.timing(animation, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, []);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT + 50, -50],
  });

  const translateX = animation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 15, 0, -15, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.6, 0.6, 0],
  });

  return (
    <Animated.View
      style={[
        styles.ambientParticle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: startX,
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    />
  );
}

// ============================================
// CONCENTRIC RING
// ============================================

interface ConcentricRingProps {
  size: number;
  delay: number;
  phase: BreathPhase;
}

function ConcentricRing({ size, delay, phase }: ConcentricRingProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const isExpanding = phase === 'inhale' || phase === 'holdIn';
    const targetScale = isExpanding ? 1 : 0.8;
    const duration = phase === 'idle' ? 0 : 2000;

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: targetScale,
        duration,
        delay,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isExpanding ? 0.4 : 0.2,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [phase, delay]);

  return (
    <Animated.View
      style={[
        styles.concentricRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    />
  );
}

// ============================================
// PATTERN CARD
// ============================================

interface PatternCardProps {
  patternKey: string;
  pattern: typeof BREATHING_PATTERNS[keyof typeof BREATHING_PATTERNS];
  isSelected: boolean;
  onSelect: () => void;
  t: (key: string) => string;
}

function PatternCard({ patternKey, pattern, isSelected, onSelect, t }: PatternCardProps) {
  const details = PATTERN_DETAILS[patternKey] || { icon: 'ellipse-outline', benefitKey: '', color: COLORS.gold };
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onSelect();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View
        style={[
          styles.patternCard,
          isSelected && styles.patternCardSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {isSelected && (
          <LinearGradient
            colors={[details.color + '30', details.color + '10', 'transparent']}
            style={styles.patternCardGlow}
          />
        )}

        <View style={styles.patternCardContent}>
          <View style={[styles.patternIcon, { backgroundColor: details.color + '20' }]}>
            <Ionicons name={details.icon as any} size={24} color={details.color} />
          </View>

          <View style={styles.patternInfo}>
            <Text style={[styles.patternName, isSelected && { color: details.color }]}>
              {t(`brainGames.breathe.patterns.${patternKey}.name`)}
            </Text>
            <Text style={styles.patternBenefit}>{t(details.benefitKey)}</Text>
          </View>

          <View style={styles.patternTiming}>
            <Text style={styles.patternTimingText}>
              {pattern.inhale}-{pattern.holdIn}-{pattern.exhale}
              {pattern.holdOut > 0 ? `-${pattern.holdOut}` : ''}
            </Text>
          </View>
        </View>

        {isSelected && (
          <View style={[styles.patternSelectedIndicator, { backgroundColor: details.color }]}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ============================================
// CYCLE SELECTOR
// ============================================

interface CycleSelectorProps {
  selected: number;
  onSelect: (cycles: number) => void;
  t: (key: string) => string;
}

function CycleSelector({ selected, onSelect, t }: CycleSelectorProps) {
  const options = [
    { cycles: 3, labelKey: 'brainGames.breathe.cycles.quick', icon: 'flash-outline' },
    { cycles: 5, labelKey: 'brainGames.breathe.cycles.standard', icon: 'timer-outline' },
    { cycles: 7, labelKey: 'brainGames.breathe.cycles.deep', icon: 'water-outline' },
    { cycles: 10, labelKey: 'brainGames.breathe.cycles.extended', icon: 'infinite-outline' },
  ];

  return (
    <View style={styles.cycleSelectorContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.cycles}
          style={[
            styles.cycleOption,
            selected === option.cycles && styles.cycleOptionSelected,
          ]}
          onPress={() => {
            safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
            onSelect(option.cycles);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={option.icon as any}
            size={20}
            color={selected === option.cycles ? '#fff' : COLORS.textMuted}
          />
          <Text style={[
            styles.cycleNumber,
            selected === option.cycles && styles.cycleNumberSelected,
          ]}>
            {option.cycles}
          </Text>
          <Text style={[
            styles.cycleLabel,
            selected === option.cycles && styles.cycleLabelSelected,
          ]}>
            {t(option.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============================================
// BREATHING SCREEN (IMMERSIVE)
// ============================================

interface BreathingScreenProps {
  pattern: keyof typeof BREATHING_PATTERNS;
  cycles: number;
  phase: BreathPhase;
  currentCycle: number;
  totalCycles: number;
  secondsRemaining: number;
  audioEnabled: boolean;
  onStop: () => void;
  t: (key: string, options?: object) => string;
}

function BreathingScreen({
  pattern,
  cycles,
  phase,
  currentCycle,
  totalCycles,
  secondsRemaining,
  audioEnabled,
  onStop,
  t,
}: BreathingScreenProps) {
  const colors = GAME_COLORS.breathing;
  const patternDetails = PATTERN_DETAILS[pattern] || { icon: 'ellipse-outline', benefitKey: '', color: COLORS.gold };

  return (
    <View style={styles.breathingScreen}>
      {/* Ambient background */}
      <LinearGradient
        colors={['#0a0f1a', '#0f1a2a', '#1a2a3a', '#0f1a2a', '#0a0f1a']}
        style={styles.breathingBg}
      />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <AmbientParticle
          key={i}
          delay={i * 800}
          duration={8000 + Math.random() * 4000}
          size={4 + Math.random() * 4}
          startX={Math.random() * SCREEN_WIDTH}
        />
      ))}

      {/* Cycle indicator */}
      <View style={styles.cycleIndicator}>
        <View style={styles.cycleProgress}>
          {[...Array(totalCycles)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.cycleDot,
                i < currentCycle && { backgroundColor: patternDetails.color },
                i === currentCycle - 1 && { transform: [{ scale: 1.3 }] },
              ]}
            />
          ))}
        </View>
        <Text style={styles.cycleText}>
          {t('brainGames.breathe.breathOf', { current: currentCycle, total: totalCycles })}
        </Text>
      </View>

      {/* Concentric rings */}
      <View style={styles.ringsContainer}>
        <ConcentricRing size={340} delay={0} phase={phase} />
        <ConcentricRing size={300} delay={100} phase={phase} />
        <ConcentricRing size={260} delay={200} phase={phase} />
      </View>

      {/* Main breathing circle */}
      <View style={styles.circleContainer}>
        <BreathingCircle
          phase={phase}
          minSize={120}
          maxSize={200}
          colors={[patternDetails.color, colors.exhale]}
        >
          <View style={styles.circleContent}>
            <Text style={styles.countdown}>{secondsRemaining}</Text>
            <Text style={styles.phaseInstruction}>
              {t(PHASE_INSTRUCTION_KEYS[phase])}
            </Text>
          </View>
        </BreathingCircle>
      </View>

      {/* Scripture */}
      <FadeInView key={phase} style={styles.scriptureContainer}>
        <Text style={styles.scriptureText}>
          {t(PHASE_SCRIPTURE_KEYS[phase])}
        </Text>
      </FadeInView>

      {/* Stop button */}
      <TouchableOpacity style={styles.stopButton} onPress={onStop} activeOpacity={0.8}>
        <Ionicons name="stop-circle-outline" size={24} color={COLORS.textMuted} />
        <Text style={styles.stopButtonText}>{t('brainGames.breathe.endSession')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface BreatheWithGodProps {
  onClose?: () => void;
}

export function BreatheWithGod({ onClose }: BreatheWithGodProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const handleClose = onClose || (() => navigation.goBack());
  const [selectedPattern, setSelectedPattern] = useState<keyof typeof BREATHING_PATTERNS>('relaxing');
  const [selectedCycles, setSelectedCycles] = useState(3);
  const [showComplete, setShowComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ duration: 0, cycles: 0 });
  const [showWhyThisWorks, setShowWhyThisWorks] = useState(false);
  const [audioGuidanceEnabled, setAudioGuidanceEnabled] = useState(false);
  const lastPhaseRef = useRef<BreathPhase>('idle');
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    async function loadPrefs() {
      const prefs = await loadBreathingPreferences();
      if (prefs) {
        setSelectedPattern(prefs.selectedPattern as keyof typeof BREATHING_PATTERNS);
        setSelectedCycles(prefs.selectedCycles);
        setAudioGuidanceEnabled(prefs.audioGuidanceEnabled);
      }
      setPrefsLoaded(true);
      recordGameSession('breathing');
    }
    loadPrefs();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (prefsLoaded) {
      saveBreathingPreferences({
        selectedPattern,
        selectedCycles,
        audioGuidanceEnabled,
        lastUsed: Date.now(),
      });
    }
  }, [selectedPattern, selectedCycles, audioGuidanceEnabled, prefsLoaded]);

  // Mood check-in states
  const [showPreMoodCheck, setShowPreMoodCheck] = useState(false);
  const [showPostMoodCheck, setShowPostMoodCheck] = useState(false);
  const [preMood, setPreMood] = useState<SessionMoodLevel | null>(null);
  const [postMood, setPostMood] = useState<SessionMoodLevel | null>(null);

  const {
    phase,
    currentCycle,
    totalCycles,
    secondsRemaining,
    isActive,
    pattern,
    start,
    stop,
  } = useBreathingSession({
    pattern: selectedPattern,
    cycles: selectedCycles,
    onCycleComplete: (cycle) => {
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
    },
    onComplete: () => {
      const totalSeconds = selectedCycles * (
        pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut
      );

      setSessionStats({
        duration: totalSeconds,
        cycles: selectedCycles,
      });

      emitBreathingSession(selectedPattern, totalSeconds, true);
      setShowPostMoodCheck(true);
    },
  });

  // Audio guidance effect
  useEffect(() => {
    if (!audioGuidanceEnabled || !isActive) return;
    if (phase === lastPhaseRef.current) return;

    lastPhaseRef.current = phase;

    if (phase !== 'idle') {
      playGuidanceTone();
    }
  }, [phase, audioGuidanceEnabled, isActive]);

  const handleStop = useCallback(() => {
    stop();

    const completedCycles = currentCycle - 1;
    const cycleSeconds = pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;
    const totalSeconds = completedCycles * cycleSeconds;

    if (completedCycles > 0) {
      emitBreathingSession(selectedPattern, totalSeconds, false);
    }

    setSessionStats({
      duration: totalSeconds,
      cycles: completedCycles,
    });

    setShowPostMoodCheck(true);
  }, [stop, currentCycle, pattern, selectedPattern]);

  const handleBeginSession = useCallback(() => {
    setShowPreMoodCheck(true);
  }, []);

  const handlePreMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPreMood(mood);
    setShowPreMoodCheck(false);
    start();
  }, [start]);

  const handlePreMoodSkip = useCallback(() => {
    setShowPreMoodCheck(false);
    start();
  }, [start]);

  const handlePostMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPostMood(mood);
    setShowPostMoodCheck(false);
    setShowComplete(true);
  }, []);

  const handlePostMoodSkip = useCallback(() => {
    setShowPostMoodCheck(false);
    setShowComplete(true);
  }, []);

  const handlePlayAgain = useCallback(() => {
    setShowComplete(false);
    setPreMood(null);
    setPostMood(null);
    setShowPreMoodCheck(true);
  }, []);

  const handleContinue = useCallback(() => {
    setShowComplete(false);
    handleClose();
  }, [handleClose]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const estimatedDuration = selectedCycles * (
    BREATHING_PATTERNS[selectedPattern].inhale +
    BREATHING_PATTERNS[selectedPattern].holdIn +
    BREATHING_PATTERNS[selectedPattern].exhale +
    BREATHING_PATTERNS[selectedPattern].holdOut
  );

  return (
    <GameContainer
      gameId="breathing"
      title={t('brainGames.games.breathing.title')}
      subtitle={t('brainGames.games.breathing.subtitle')}
      onClose={isActive ? handleStop : handleClose}
      showHeader={!isActive}
    >
      {isActive ? (
        <BreathingScreen
          pattern={selectedPattern}
          cycles={selectedCycles}
          phase={phase}
          currentCycle={currentCycle}
          totalCycles={totalCycles}
          secondsRemaining={secondsRemaining}
          audioEnabled={audioGuidanceEnabled}
          onStop={handleStop}
          t={t}
        />
      ) : (
        <ScrollView
          style={styles.setupContainer}
          contentContainerStyle={styles.setupContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section */}
          <FadeInView delay={100}>
            <View style={styles.heroSection}>
              <LinearGradient
                colors={['#1a2a3a', '#0f1a2a', '#0a0f1a']}
                style={styles.heroBg}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroIconContainer}>
                  <Ionicons name="leaf" size={40} color={GAME_COLORS.breathing.primary} />
                </View>
                <Text style={styles.heroTitle}>{t('brainGames.breathe.findYourPeace')}</Text>
                <Text style={styles.heroText}>
                  {t('brainGames.breathe.heroDescription')}
                </Text>
                <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
              </View>
            </View>
          </FadeInView>

          {/* Pattern Selection */}
          <FadeInView delay={200}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('brainGames.breathe.chooseYourPattern')}</Text>
            </View>
            <View style={styles.patternList}>
              {Object.entries(BREATHING_PATTERNS).map(([key, pat]) => (
                <PatternCard
                  key={key}
                  patternKey={key}
                  pattern={pat}
                  isSelected={selectedPattern === key}
                  onSelect={() => setSelectedPattern(key as keyof typeof BREATHING_PATTERNS)}
                  t={t}
                />
              ))}
            </View>
          </FadeInView>

          {/* Cycle Selection */}
          <FadeInView delay={300}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('brainGames.breathe.numberOfBreaths')}</Text>
            </View>
            <CycleSelector
              selected={selectedCycles}
              onSelect={setSelectedCycles}
              t={t}
            />
          </FadeInView>

          {/* Duration & Settings */}
          <FadeInView delay={400}>
            <View style={styles.settingsCard}>
              {/* Duration */}
              <View style={styles.durationRow}>
                <View style={styles.durationInfo}>
                  <Ionicons name="time-outline" size={20} color={COLORS.textMuted} />
                  <Text style={styles.durationLabel}>{t('brainGames.breathe.duration')}</Text>
                </View>
                <Text style={styles.durationValue}>
                  {formatDuration(estimatedDuration)}
                </Text>
              </View>

              {/* Audio toggle */}
              <View style={styles.audioRow}>
                <View style={styles.audioInfo}>
                  <Ionicons
                    name={audioGuidanceEnabled ? 'volume-high' : 'volume-mute'}
                    size={20}
                    color={audioGuidanceEnabled ? GAME_COLORS.breathing.primary : COLORS.textMuted}
                  />
                  <View>
                    <Text style={styles.audioLabel}>{t('brainGames.breathe.hapticGuidance')}</Text>
                    <Text style={styles.audioHint}>{t('brainGames.breathe.gentleCues')}</Text>
                  </View>
                </View>
                <Switch
                  value={audioGuidanceEnabled}
                  onValueChange={setAudioGuidanceEnabled}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: GAME_COLORS.breathing.primary + '60' }}
                  thumbColor={audioGuidanceEnabled ? GAME_COLORS.breathing.primary : COLORS.textMuted}
                />
              </View>
            </View>
          </FadeInView>

          {/* Scripture */}
          <FadeInView delay={500}>
            <View style={styles.scriptureIntro}>
              <Ionicons name="book-outline" size={20} color={GAME_COLORS.breathing.primary} />
              <Text style={styles.introScripture}>
                {t('brainGames.breathe.introScripture')}
              </Text>
              <Text style={styles.introScriptureRef}>{t('brainGames.breathe.introScriptureRef')}</Text>
            </View>
          </FadeInView>
        </ScrollView>
      )}

      {/* Start Button */}
      {!isActive && !showPreMoodCheck && (
        <GameFooter>
          <GradientButton
            title={t('brainGames.breathe.beginBreathing')}
            onPress={handleBeginSession}
          />
        </GameFooter>
      )}

      {/* Completion Modal */}
      <SessionComplete
        visible={showComplete}
        title={t('brainGames.breathe.wellDone')}
        subtitle={t('brainGames.breathe.completionSubtitle')}
        stats={[
          { label: t('brainGames.breathe.duration'), value: formatDuration(sessionStats.duration) },
          { label: t('brainGames.breathe.breaths'), value: sessionStats.cycles },
        ]}
        encouragement={t('brainGames.breathe.encouragement')}
        onContinue={handleContinue}
        onPlayAgain={handlePlayAgain}
        continueLabel={t('brainGames.breathe.returnToGames')}
      />

      {/* Why This Works Modal */}
      <WhyThisWorks
        visible={showWhyThisWorks}
        gameId="breathing"
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
  // Setup Screen
  setupContainer: {
    flex: 1,
  },
  setupContent: {
    paddingBottom: SPACING.xxl,
  },

  // Hero Section
  heroSection: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.sm,
  },
  heroText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },

  // Section
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },

  // Pattern List
  patternList: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  patternCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  patternCardSelected: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  patternCardGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  patternCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  patternBenefit: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  patternTiming: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  patternTimingText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  patternSelectedIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cycle Selector
  cycleSelectorContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  cycleOption: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cycleOptionSelected: {
    backgroundColor: GAME_COLORS.breathing.primary,
    borderColor: GAME_COLORS.breathing.primary,
  },
  cycleNumber: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },
  cycleNumberSelected: {
    color: '#FFFFFF',
  },
  cycleLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  cycleLabelSelected: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Settings Card
  settingsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: SPACING.md,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  durationLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
  },
  durationValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  audioLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  audioHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },

  // Scripture Intro
  scriptureIntro: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  introScripture: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  introScriptureRef: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },

  // Breathing Screen
  breathingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingBg: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientParticle: {
    position: 'absolute',
    backgroundColor: 'rgba(74, 222, 128, 0.4)',
  },
  cycleIndicator: {
    position: 'absolute',
    top: SPACING.xl,
    alignItems: 'center',
  },
  cycleProgress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  cycleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cycleText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
  ringsContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  concentricRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    alignItems: 'center',
  },
  countdown: {
    fontSize: 56,
    fontWeight: '200',
    color: '#FFFFFF',
    fontFamily: TYPOGRAPHY.ui,
  },
  phaseInstruction: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },
  scriptureContainer: {
    position: 'absolute',
    bottom: 120,
    paddingHorizontal: SPACING.xl,
  },
  scriptureText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  stopButton: {
    position: 'absolute',
    bottom: SPACING.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stopButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
});

export default BreatheWithGod;
