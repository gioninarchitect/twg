/**
 * Breathe with God
 * Guided breathing exercises based on Polyvagal Theory
 * Unlocks: Day 1
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
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

// ============================================
// CONSTANTS
// ============================================

const PHASE_INSTRUCTIONS: Record<BreathPhase, string> = {
  idle: 'Ready to begin',
  inhale: 'Breathe in slowly',
  holdIn: 'Hold gently',
  exhale: 'Release slowly',
  holdOut: 'Rest',
};

const PHASE_SCRIPTURE: Record<BreathPhase, string> = {
  idle: '"Be still, and know that I am God." - Psalm 46:10',
  inhale: '"The Lord God formed man and breathed into his nostrils the breath of life." - Genesis 2:7',
  holdIn: '"In quietness and trust is your strength." - Isaiah 30:15',
  exhale: '"Cast all your anxiety on Him because He cares for you." - 1 Peter 5:7',
  holdOut: '"Come to me, all who are weary, and I will give you rest." - Matthew 11:28',
};

// ============================================
// AUDIO GUIDANCE
// ============================================

// Frequency mapping for gentle tones (in Hz)
const PHASE_FREQUENCIES: Record<BreathPhase, number> = {
  idle: 0,
  inhale: 396, // Liberating (Solfeggio)
  holdIn: 528, // Love/DNA repair (Solfeggio)
  exhale: 432, // Universal harmony
  holdOut: 285, // Healing (Solfeggio)
};

// Duration in ms for each tone
const TONE_DURATION = 300;

// Generate a simple oscillator tone using AudioContext
async function playGuidanceTone(frequency: number): Promise<void> {
  // Only play if frequency is valid
  if (frequency <= 0) return;

  try {
    // Use expo-av to play a gentle chime
    // Since we can't generate tones natively, we'll use haptics as fallback
    // and provide stronger haptic feedback for audio guidance mode
    await safeHaptics.impactAsync(ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.log('Audio guidance tone error:', error);
  }
}

// ============================================
// PATTERN SELECTOR
// ============================================

interface PatternSelectorProps {
  selectedPattern: string;
  onSelect: (pattern: string) => void;
}

function PatternSelector({ selectedPattern, onSelect }: PatternSelectorProps) {
  return (
    <View style={styles.patternContainer}>
      {Object.entries(BREATHING_PATTERNS).map(([key, pattern]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.patternCard,
            selectedPattern === key && styles.patternCardSelected,
          ]}
          onPress={() => {
            safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
            onSelect(key);
          }}
        >
          <Text style={[
            styles.patternName,
            selectedPattern === key && styles.patternNameSelected,
          ]}>
            {pattern.name}
          </Text>
          <Text style={styles.patternTiming}>
            {pattern.inhale}-{pattern.holdIn}-{pattern.exhale}
            {pattern.holdOut > 0 ? `-${pattern.holdOut}` : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============================================
// BREATHING SCREEN
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
}: BreathingScreenProps) {
  const colors = GAME_COLORS.breathing;

  return (
    <View style={styles.breathingScreen}>
      {/* Cycle Indicator */}
      <View style={styles.cycleIndicator}>
        <Text style={styles.cycleText}>
          Cycle {currentCycle} of {totalCycles}
        </Text>
        {audioEnabled && (
          <View style={styles.audioIndicator}>
            <Ionicons name="volume-high" size={14} color={COLORS.gold} />
          </View>
        )}
      </View>

      {/* Main Breathing Circle */}
      <View style={styles.circleContainer}>
        <BreathingCircle
          phase={phase}
          minSize={140}
          maxSize={280}
          colors={[colors.inhale, colors.exhale]}
        >
          <View style={styles.circleContent}>
            <Text style={styles.phaseInstruction}>
              {PHASE_INSTRUCTIONS[phase]}
            </Text>
            <Text style={styles.countdown}>
              {secondsRemaining}
            </Text>
          </View>
        </BreathingCircle>
      </View>

      {/* Scripture */}
      <FadeInView key={phase} style={styles.scriptureContainer}>
        <Text style={styles.scriptureText}>
          {PHASE_SCRIPTURE[phase]}
        </Text>
      </FadeInView>

      {/* Stop Button */}
      <TouchableOpacity
        style={styles.stopButton}
        onPress={onStop}
      >
        <Text style={styles.stopButtonText}>End Session</Text>
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
      // Record game session
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
      // Calculate duration
      const totalSeconds = selectedCycles * (
        pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut
      );

      setSessionStats({
        duration: totalSeconds,
        cycles: selectedCycles,
      });

      // Emit to world model
      emitBreathingSession(selectedPattern, totalSeconds, true);

      // Show post-mood check instead of completion directly
      setShowPostMoodCheck(true);
    },
  });

  // Audio guidance effect - play tone on phase change
  useEffect(() => {
    if (!audioGuidanceEnabled || !isActive) return;
    if (phase === lastPhaseRef.current) return;

    lastPhaseRef.current = phase;

    // Play guidance cue for phase transition
    if (phase !== 'idle') {
      playGuidanceTone(PHASE_FREQUENCIES[phase]);
    }
  }, [phase, audioGuidanceEnabled, isActive]);

  const handleStop = useCallback(() => {
    stop();

    // Calculate partial duration
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

    // Show post-mood check
    setShowPostMoodCheck(true);
  }, [stop, currentCycle, pattern, selectedPattern]);

  // Handle initiating session (shows pre-mood check first)
  const handleBeginSession = useCallback(() => {
    setShowPreMoodCheck(true);
  }, []);

  // Handle pre-mood selection
  const handlePreMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPreMood(mood);
    setShowPreMoodCheck(false);
    // Start the actual breathing session
    start();
  }, [start]);

  // Handle pre-mood skip
  const handlePreMoodSkip = useCallback(() => {
    setShowPreMoodCheck(false);
    start();
  }, [start]);

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

  const handlePlayAgain = useCallback(() => {
    setShowComplete(false);
    setPreMood(null);
    setPostMood(null);
    setShowPreMoodCheck(true); // Start with mood check again
  }, []);

  const handleContinue = useCallback(() => {
    setShowComplete(false);
    handleClose();
  }, [handleClose]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <GameContainer
      gameId="breathing"
      title="Breathe with God"
      subtitle="Nervous System Regulation"
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
        />
      ) : (
        <ScrollView
          style={styles.setupContainer}
          contentContainerStyle={styles.setupContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Introduction */}
          <FadeInView delay={100}>
            <GameCard style={styles.introCard}>
              <Text style={styles.introTitle}>Find Your Peace</Text>
              <Text style={styles.introText}>
                Deep, rhythmic breathing activates your parasympathetic nervous
                system, helping you move from stress to calm. Choose a pattern
                and let God's peace flow through you with each breath.
              </Text>
              <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
            </GameCard>
          </FadeInView>

          {/* Pattern Selection */}
          <FadeInView delay={200}>
            <GameSection title="Choose Your Pattern">
              <PatternSelector
                selectedPattern={selectedPattern}
                onSelect={(p) => setSelectedPattern(p as keyof typeof BREATHING_PATTERNS)}
              />
            </GameSection>
          </FadeInView>

          {/* Cycle Selection */}
          <FadeInView delay={300}>
            <GameSection title="Number of Cycles">
              <View style={styles.cycleSelector}>
                {[3, 5, 7, 10].map((cycles) => (
                  <TouchableOpacity
                    key={cycles}
                    style={[
                      styles.cycleOption,
                      selectedCycles === cycles && styles.cycleOptionSelected,
                    ]}
                    onPress={() => {
                      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
                      setSelectedCycles(cycles);
                    }}
                  >
                    <Text style={[
                      styles.cycleNumber,
                      selectedCycles === cycles && styles.cycleNumberSelected,
                    ]}>
                      {cycles}
                    </Text>
                    <Text style={[
                      styles.cycleLabel,
                      selectedCycles === cycles && styles.cycleLabelSelected,
                    ]}>
                      {cycles === 3 ? 'Quick' :
                       cycles === 5 ? 'Standard' :
                       cycles === 7 ? 'Deep' : 'Extended'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GameSection>
          </FadeInView>

          {/* Duration Estimate */}
          <FadeInView delay={400}>
            <View style={styles.durationEstimate}>
              <Text style={styles.durationLabel}>Estimated Duration</Text>
              <Text style={styles.durationValue}>
                {formatDuration(
                  selectedCycles * (
                    BREATHING_PATTERNS[selectedPattern].inhale +
                    BREATHING_PATTERNS[selectedPattern].holdIn +
                    BREATHING_PATTERNS[selectedPattern].exhale +
                    BREATHING_PATTERNS[selectedPattern].holdOut
                  )
                )}
              </Text>
            </View>
          </FadeInView>

          {/* Audio Guidance Toggle */}
          <FadeInView delay={500}>
            <View style={styles.audioToggleContainer}>
              <View style={styles.audioToggleInfo}>
                <View style={styles.audioToggleIcon}>
                  <Ionicons
                    name={audioGuidanceEnabled ? 'volume-high' : 'volume-mute'}
                    size={20}
                    color={audioGuidanceEnabled ? COLORS.gold : COLORS.mutedBrown}
                  />
                </View>
                <View>
                  <Text style={styles.audioToggleLabel}>Audio Guidance</Text>
                  <Text style={styles.audioToggleHint}>
                    Gentle haptic cues at each breath phase
                  </Text>
                </View>
              </View>
              <Switch
                value={audioGuidanceEnabled}
                onValueChange={setAudioGuidanceEnabled}
                trackColor={{ false: COLORS.warmBeige, true: COLORS.gold + '60' }}
                thumbColor={audioGuidanceEnabled ? COLORS.gold : COLORS.cream}
              />
            </View>
          </FadeInView>
        </ScrollView>
      )}

      {/* Start Button */}
      {!isActive && !showPreMoodCheck && (
        <GameFooter>
          <GradientButton
            title="Begin Breathing"
            onPress={handleBeginSession}
          />
        </GameFooter>
      )}

      {/* Completion Modal */}
      <SessionComplete
        visible={showComplete}
        title="Well Done"
        subtitle="You took time to breathe with God"
        stats={[
          { label: 'Duration', value: formatDuration(sessionStats.duration) },
          { label: 'Cycles', value: sessionStats.cycles },
        ]}
        encouragement="Every breath is a prayer. You're learning to find peace in God's presence."
        onContinue={handleContinue}
        onPlayAgain={handlePlayAgain}
        continueLabel="Return to Games"
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
  introCard: {
    marginBottom: SPACING.lg,
  },
  introTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },

  // Pattern Selector
  patternContainer: {
    gap: SPACING.sm,
  },
  patternCard: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patternCardSelected: {
    backgroundColor: GAME_COLORS.breathing.primary,
  },
  patternName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '500',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  patternNameSelected: {
    color: COLORS.cream,
  },
  patternTiming: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },

  // Cycle Selector
  cycleSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cycleOption: {
    flex: 1,
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cycleOptionSelected: {
    backgroundColor: GAME_COLORS.breathing.primary,
  },
  cycleNumber: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '700',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  cycleNumberSelected: {
    color: COLORS.cream,
  },
  cycleLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  cycleLabelSelected: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Duration Estimate
  durationEstimate: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  durationLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  durationValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 4,
  },

  // Audio Toggle
  audioToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.soft,
  },
  audioToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioToggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.warmBeige,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  audioToggleLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  audioToggleHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },

  // Breathing Screen
  breathingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleIndicator: {
    position: 'absolute',
    top: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cycleText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  audioIndicator: {
    backgroundColor: COLORS.gold + '20',
    borderRadius: 12,
    padding: 4,
  },
  circleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    alignItems: 'center',
  },
  phaseInstruction: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '500',
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  countdown: {
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: '300',
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
  },
  scriptureContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  scriptureText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },
  stopButton: {
    position: 'absolute',
    bottom: SPACING.xxl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  stopButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
});

export default BreatheWithGod;
