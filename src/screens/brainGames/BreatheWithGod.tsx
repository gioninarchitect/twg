/**
 * Breathe with God
 * Guided breathing exercises based on Polyvagal Theory
 * Unlocks: Day 1
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
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
  type BreathPhase,
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  onStop: () => void;
}

function BreathingScreen({
  pattern,
  cycles,
  phase,
  currentCycle,
  totalCycles,
  secondsRemaining,
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

      setShowComplete(true);
    },
  });

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

    setShowComplete(true);
  }, [stop, currentCycle, pattern, selectedPattern]);

  const handlePlayAgain = useCallback(() => {
    setShowComplete(false);
    start();
  }, [start]);

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
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        </ScrollView>
      )}

      {/* Start Button */}
      {!isActive && (
        <GameFooter>
          <GradientButton
            title="Begin Breathing"
            onPress={start}
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

  // Breathing Screen
  breathingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleIndicator: {
    position: 'absolute',
    top: SPACING.xl,
  },
  cycleText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
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
