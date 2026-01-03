/**
 * Pattern Peace - N-Back Working Memory Training
 *
 * Unlocks: Day 28
 * Theory: Cognitive Training / Working Memory
 * Goal: Strengthen working memory, reduce rumination through focused attention
 *
 * DISCLAIMER: This is an educational exercise, not therapy.
 * Based on N-back training research for cognitive enhancement.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../../utils/haptics';
import { useNavigation } from '@react-navigation/native';
import { useWorldModel } from '../../worldModel';
import { GAME_COLORS, GAME_ANIMATIONS } from '../../theme/brainGames';
import {
  GameContainer,
  SessionComplete,
  AnimatedProgressBar,
  FadeInView,
  DisclaimerModal,
  WhyThisWorks,
  WhyThisWorksButton,
  SessionMoodCheckIn,
  type SessionMoodLevel,
} from '../../components/brainGames';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Types & Interfaces
// ============================================================================

interface GridPosition {
  row: number;
  col: number;
}

interface Trial {
  position: GridPosition;
  symbol: string;
  isPositionMatch: boolean;
  isSymbolMatch: boolean;
  timestamp: number;
}

interface GameStats {
  correctPositionMatches: number;
  incorrectPositionMatches: number;
  missedPositionMatches: number;
  correctSymbolMatches: number;
  incorrectSymbolMatches: number;
  missedSymbolMatches: number;
  totalTrials: number;
  accuracy: number;
}

type GamePhase = 'intro' | 'instructions' | 'practice' | 'playing' | 'complete';
type DifficultyLevel = 1 | 2 | 3;

// ============================================================================
// Constants
// ============================================================================

const GRID_SIZE = 3;
const SYMBOLS = ['flower', 'heart', 'star', 'leaf', 'diamond', 'moon'];
const SYMBOL_ICONS: Record<string, string> = {
  flower: 'flower',
  heart: 'heart',
  star: 'star',
  leaf: 'leaf',
  diamond: 'diamond',
  moon: 'moon',
};

const DIFFICULTY_SETTINGS: Record<DifficultyLevel, {
  nBack: number;
  stimulusDuration: number;
  interStimulusInterval: number;
  trialsPerRound: number;
  description: string;
}> = {
  1: {
    nBack: 1,
    stimulusDuration: 2500,
    interStimulusInterval: 500,
    trialsPerRound: 20,
    description: '1-Back: Match the previous stimulus',
  },
  2: {
    nBack: 2,
    stimulusDuration: 2000,
    interStimulusInterval: 500,
    trialsPerRound: 25,
    description: '2-Back: Match 2 stimuli ago',
  },
  3: {
    nBack: 3,
    stimulusDuration: 1800,
    interStimulusInterval: 400,
    trialsPerRound: 30,
    description: '3-Back: Match 3 stimuli ago',
  },
};

const SCRIPTURES = [
  '"Be still, and know that I am God." - Psalm 46:10',
  '"Peace I leave with you; my peace I give you." - John 14:27',
  '"You will keep in perfect peace those whose minds are steadfast." - Isaiah 26:3',
  '"Cast all your anxiety on him because he cares for you." - 1 Peter 5:7',
  '"The Lord gives strength to his people; the Lord blesses his people with peace." - Psalm 29:11',
];

const ENCOURAGEMENTS = [
  'Each trial strengthens your focus.',
  'Your mind is becoming more peaceful.',
  'Patience and practice bring peace.',
  'You are training your mind for stillness.',
  'Every moment of focus is a gift to yourself.',
];

// ============================================================================
// Components
// ============================================================================

interface GridCellProps {
  row: number;
  col: number;
  isActive: boolean;
  symbol: string | null;
  pulseAnim: Animated.Value;
}

const GridCell: React.FC<GridCellProps> = ({ row, col, isActive, symbol, pulseAnim }) => {
  const scaleValue = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  const opacityValue = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.gridCell,
        isActive && styles.gridCellActive,
        isActive && {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
      ]}
    >
      {isActive && symbol && (
        <Ionicons
          name={SYMBOL_ICONS[symbol] as any}
          size={32}
          color={GAME_COLORS.patternPeace.primary}
        />
      )}
    </Animated.View>
  );
};

interface ResponseButtonsProps {
  onPositionMatch: () => void;
  onSymbolMatch: () => void;
  disabled: boolean;
  positionPressed: boolean;
  symbolPressed: boolean;
}

const ResponseButtons: React.FC<ResponseButtonsProps> = ({
  onPositionMatch,
  onSymbolMatch,
  disabled,
  positionPressed,
  symbolPressed,
}) => {
  return (
    <View style={styles.responseButtons}>
      <TouchableOpacity
        style={[
          styles.responseButton,
          styles.positionButton,
          positionPressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPositionMatch}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="grid-outline" size={28} color="#fff" />
        <Text style={styles.buttonText}>Position Match</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.responseButton,
          styles.symbolButton,
          symbolPressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
        onPress={onSymbolMatch}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="shapes-outline" size={28} color="#fff" />
        <Text style={styles.buttonText}>Symbol Match</Text>
      </TouchableOpacity>
    </View>
  );
};

interface DifficultySelectProps {
  selectedLevel: DifficultyLevel;
  onSelect: (level: DifficultyLevel) => void;
}

const DifficultySelect: React.FC<DifficultySelectProps> = ({ selectedLevel, onSelect }) => {
  return (
    <View style={styles.difficultyContainer}>
      <Text style={styles.difficultyTitle}>Select Difficulty</Text>
      {([1, 2, 3] as DifficultyLevel[]).map((level) => (
        <TouchableOpacity
          key={level}
          style={[
            styles.difficultyOption,
            selectedLevel === level && styles.difficultyOptionSelected,
          ]}
          onPress={() => onSelect(level)}
        >
          <View style={styles.difficultyHeader}>
            <Text style={[
              styles.difficultyLevel,
              selectedLevel === level && styles.difficultyLevelSelected,
            ]}>
              Level {level}
            </Text>
            {selectedLevel === level && (
              <Ionicons name="checkmark-circle" size={20} color={GAME_COLORS.patternPeace.primary} />
            )}
          </View>
          <Text style={styles.difficultyDescription}>
            {DIFFICULTY_SETTINGS[level].description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

interface StatsDisplayProps {
  stats: GameStats;
  difficulty: DifficultyLevel;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats, difficulty }) => {
  const positionAccuracy = stats.totalTrials > 0
    ? Math.round(((stats.correctPositionMatches) /
        (stats.correctPositionMatches + stats.incorrectPositionMatches + stats.missedPositionMatches || 1)) * 100)
    : 0;

  const symbolAccuracy = stats.totalTrials > 0
    ? Math.round(((stats.correctSymbolMatches) /
        (stats.correctSymbolMatches + stats.incorrectSymbolMatches + stats.missedSymbolMatches || 1)) * 100)
    : 0;

  return (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Session Results</Text>

      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalTrials}</Text>
          <Text style={styles.statLabel}>Trials</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.accuracy}%</Text>
          <Text style={styles.statLabel}>Overall</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{difficulty}-Back</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      <View style={styles.detailStats}>
        <View style={styles.detailStatRow}>
          <Ionicons name="grid-outline" size={20} color={GAME_COLORS.patternPeace.match} />
          <Text style={styles.detailStatLabel}>Position Matches</Text>
          <Text style={styles.detailStatValue}>{positionAccuracy}%</Text>
        </View>
        <View style={styles.detailStatRow}>
          <Ionicons name="shapes-outline" size={20} color={GAME_COLORS.patternPeace.secondary} />
          <Text style={styles.detailStatLabel}>Symbol Matches</Text>
          <Text style={styles.detailStatValue}>{symbolAccuracy}%</Text>
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// Main Component
// ============================================================================

interface PatternPeaceProps {
  onClose?: () => void;
}

export const PatternPeace: React.FC<PatternPeaceProps> = ({ onClose }) => {
  const navigation = useNavigation();
  const handleClose = onClose || (() => navigation.goBack());

  // World Model integration
  const { state, dispatch, recommendations } = useWorldModel();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [showingStimulus, setShowingStimulus] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GridPosition | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState<string | null>(null);
  const [positionPressed, setPositionPressed] = useState(false);
  const [symbolPressed, setSymbolPressed] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showWhyThisWorks, setShowWhyThisWorks] = useState(false);
  const [currentScripture] = useState(SCRIPTURES[Math.floor(Math.random() * SCRIPTURES.length)]);
  const [encouragement, setEncouragement] = useState('');

  // Mood check-in states
  const [showPreMoodCheck, setShowPreMoodCheck] = useState(false);
  const [showPostMoodCheck, setShowPostMoodCheck] = useState(false);
  const [preMood, setPreMood] = useState<SessionMoodLevel | null>(null);
  const [postMood, setPostMood] = useState<SessionMoodLevel | null>(null);

  // Stats tracking
  const [stats, setStats] = useState<GameStats>({
    correctPositionMatches: 0,
    incorrectPositionMatches: 0,
    missedPositionMatches: 0,
    correctSymbolMatches: 0,
    incorrectSymbolMatches: 0,
    missedSymbolMatches: 0,
    totalTrials: 0,
    accuracy: 0,
  });

  // Refs for timing
  const trialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stimulusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation loop for active cell
  useEffect(() => {
    if (showingStimulus) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [showingStimulus]);

  // Generate a random position
  const getRandomPosition = useCallback((): GridPosition => {
    return {
      row: Math.floor(Math.random() * GRID_SIZE),
      col: Math.floor(Math.random() * GRID_SIZE),
    };
  }, []);

  // Generate a random symbol
  const getRandomSymbol = useCallback((): string => {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }, []);

  // Generate all trials for the round
  const generateTrials = useCallback((): Trial[] => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const newTrials: Trial[] = [];
    const nBack = settings.nBack;

    // Target match probability (about 30% for each type)
    const matchProbability = 0.3;

    for (let i = 0; i < settings.trialsPerRound; i++) {
      let position: GridPosition;
      let symbol: string;
      let isPositionMatch = false;
      let isSymbolMatch = false;

      if (i >= nBack) {
        // Decide if this should be a match
        const shouldPositionMatch = Math.random() < matchProbability;
        const shouldSymbolMatch = Math.random() < matchProbability;

        if (shouldPositionMatch) {
          position = { ...newTrials[i - nBack].position };
          isPositionMatch = true;
        } else {
          // Ensure non-match
          do {
            position = getRandomPosition();
          } while (
            position.row === newTrials[i - nBack].position.row &&
            position.col === newTrials[i - nBack].position.col
          );
        }

        if (shouldSymbolMatch) {
          symbol = newTrials[i - nBack].symbol;
          isSymbolMatch = true;
        } else {
          // Ensure non-match
          do {
            symbol = getRandomSymbol();
          } while (symbol === newTrials[i - nBack].symbol);
        }
      } else {
        position = getRandomPosition();
        symbol = getRandomSymbol();
      }

      newTrials.push({
        position,
        symbol,
        isPositionMatch,
        isSymbolMatch,
        timestamp: Date.now(),
      });
    }

    return newTrials;
  }, [difficulty, getRandomPosition, getRandomSymbol]);

  // Start the game
  const startGame = useCallback(() => {
    const newTrials = generateTrials();
    setTrials(newTrials);
    setCurrentTrialIndex(0);
    setStats({
      correctPositionMatches: 0,
      incorrectPositionMatches: 0,
      missedPositionMatches: 0,
      correctSymbolMatches: 0,
      incorrectSymbolMatches: 0,
      missedSymbolMatches: 0,
      totalTrials: 0,
      accuracy: 0,
    });
    setPhase('playing');
    setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
  }, [generateTrials]);

  // Handle initiating session (shows pre-mood check first)
  const handleBeginGame = useCallback(() => {
    setShowPreMoodCheck(true);
  }, []);

  // Handle pre-mood selection
  const handlePreMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPreMood(mood);
    setShowPreMoodCheck(false);
    startGame();
  }, [startGame]);

  // Handle pre-mood skip
  const handlePreMoodSkip = useCallback(() => {
    setShowPreMoodCheck(false);
    startGame();
  }, [startGame]);

  // Handle post-mood selection
  const handlePostMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPostMood(mood);
    setShowPostMoodCheck(false);
  }, []);

  // Handle post-mood skip
  const handlePostMoodSkip = useCallback(() => {
    setShowPostMoodCheck(false);
  }, []);

  // Process response for current trial
  const processResponse = useCallback((type: 'position' | 'symbol', pressed: boolean) => {
    const currentTrial = trials[currentTrialIndex];
    if (!currentTrial) return;

    const settings = DIFFICULTY_SETTINGS[difficulty];
    const isMatch = type === 'position' ? currentTrial.isPositionMatch : currentTrial.isSymbolMatch;

    setStats((prev) => {
      const newStats = { ...prev };

      if (type === 'position') {
        if (pressed && isMatch) {
          newStats.correctPositionMatches++;
          safeHaptics.notificationAsync(NotificationFeedbackType.Success);
        } else if (pressed && !isMatch) {
          newStats.incorrectPositionMatches++;
          safeHaptics.notificationAsync(NotificationFeedbackType.Error);
        }
        // Missed matches are calculated at end of trial
      } else {
        if (pressed && isMatch) {
          newStats.correctSymbolMatches++;
          safeHaptics.notificationAsync(NotificationFeedbackType.Success);
        } else if (pressed && !isMatch) {
          newStats.incorrectSymbolMatches++;
          safeHaptics.notificationAsync(NotificationFeedbackType.Error);
        }
      }

      return newStats;
    });
  }, [trials, currentTrialIndex, difficulty]);

  // Handle position match button
  const handlePositionMatch = useCallback(() => {
    if (!showingStimulus || positionPressed) return;
    setPositionPressed(true);
    processResponse('position', true);
  }, [showingStimulus, positionPressed, processResponse]);

  // Handle symbol match button
  const handleSymbolMatch = useCallback(() => {
    if (!showingStimulus || symbolPressed) return;
    setSymbolPressed(true);
    processResponse('symbol', true);
  }, [showingStimulus, symbolPressed, processResponse]);

  // Run trial sequence
  useEffect(() => {
    if (phase !== 'playing' || currentTrialIndex >= trials.length) return;

    const settings = DIFFICULTY_SETTINGS[difficulty];
    const currentTrial = trials[currentTrialIndex];

    // Show stimulus
    setCurrentPosition(currentTrial.position);
    setCurrentSymbol(currentTrial.symbol);
    setShowingStimulus(true);
    setPositionPressed(false);
    setSymbolPressed(false);

    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);

    // Hide stimulus after duration
    stimulusTimeoutRef.current = setTimeout(() => {
      setShowingStimulus(false);
      setCurrentPosition(null);
      setCurrentSymbol(null);

      // Check for missed matches
      setStats((prev) => {
        const newStats = { ...prev, totalTrials: prev.totalTrials + 1 };

        if (currentTrial.isPositionMatch && !positionPressed) {
          newStats.missedPositionMatches++;
        }
        if (currentTrial.isSymbolMatch && !symbolPressed) {
          newStats.missedSymbolMatches++;
        }

        // Calculate accuracy
        const totalCorrect = newStats.correctPositionMatches + newStats.correctSymbolMatches;
        const totalAttempts = totalCorrect +
          newStats.incorrectPositionMatches +
          newStats.incorrectSymbolMatches +
          newStats.missedPositionMatches +
          newStats.missedSymbolMatches;

        newStats.accuracy = totalAttempts > 0
          ? Math.round((totalCorrect / totalAttempts) * 100)
          : 0;

        return newStats;
      });

      // Move to next trial after interval
      trialTimeoutRef.current = setTimeout(() => {
        if (currentTrialIndex < trials.length - 1) {
          setCurrentTrialIndex((prev) => prev + 1);
          // Update encouragement occasionally
          if (Math.random() < 0.3) {
            setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
          }
        } else {
          // Game complete - show post-mood check first
          setShowPostMoodCheck(true);
          setPhase('complete');
          safeHaptics.notificationAsync(NotificationFeedbackType.Success);
        }
      }, settings.interStimulusInterval);
    }, settings.stimulusDuration);

    return () => {
      if (stimulusTimeoutRef.current) clearTimeout(stimulusTimeoutRef.current);
      if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
    };
  }, [phase, currentTrialIndex, trials, difficulty]);

  // Emit event on completion
  useEffect(() => {
    if (phase === 'complete') {
      dispatch({
        type: 'PATTERN_PEACE_SESSION',
        nBackLevel: difficulty,
        accuracy: stats.accuracy,
        duration: Math.round(stats.totalTrials * 2), // Approximate duration based on trials
      });
    }
  }, [phase, difficulty, stats, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stimulusTimeoutRef.current) clearTimeout(stimulusTimeoutRef.current);
      if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
    };
  }, []);

  // Render grid
  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const isActive = currentPosition?.row === row && currentPosition?.col === col;
        cells.push(
          <GridCell
            key={`${row}-${col}`}
            row={row}
            col={col}
            isActive={isActive}
            symbol={isActive ? currentSymbol : null}
            pulseAnim={pulseAnim}
          />
        );
      }
    }
    return cells;
  };

  // Render based on phase
  const renderContent = () => {
    switch (phase) {
      case 'intro':
        return (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.introContainer}>
              <Ionicons name="grid" size={64} color={GAME_COLORS.patternPeace.primary} />
              <Text style={styles.title}>Pattern Peace</Text>
              <Text style={styles.subtitle}>N-Back Working Memory Training</Text>

              <Text style={styles.description}>
                Train your working memory through focused attention.
                This exercise helps quiet ruminating thoughts by engaging
                your mind in purposeful pattern recognition.
              </Text>

              <View style={styles.scriptureContainer}>
                <Text style={styles.scripture}>{currentScripture}</Text>
              </View>

              <DifficultySelect
                selectedLevel={difficulty}
                onSelect={setDifficulty}
              />

              <TouchableOpacity
                style={styles.startButton}
                onPress={() => setPhase('instructions')}
              >
                <Text style={styles.startButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 'instructions':
        const settings = DIFFICULTY_SETTINGS[difficulty];
        return (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>How to Play</Text>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Watch the Grid</Text>
                  <Text style={styles.stepDescription}>
                    A symbol will appear in one of the 9 squares.
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Remember {settings.nBack} Back</Text>
                  <Text style={styles.stepDescription}>
                    Compare the current stimulus to {settings.nBack === 1 ? 'the previous one' :
                    `${settings.nBack} stimuli ago`}.
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Match Position</Text>
                  <Text style={styles.stepDescription}>
                    Press "Position Match" if the square is the same as {settings.nBack} ago.
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Match Symbol</Text>
                  <Text style={styles.stepDescription}>
                    Press "Symbol Match" if the symbol is the same as {settings.nBack} ago.
                  </Text>
                </View>
              </View>

              <View style={styles.tipBox}>
                <Ionicons name="bulb-outline" size={20} color={GAME_COLORS.patternPeace.accent} />
                <Text style={styles.tipText}>
                  Both matches can happen at once! If position AND symbol match, press both buttons.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={handleBeginGame}
              >
                <Text style={styles.startButtonText}>Begin Training</Text>
                <Ionicons name="play" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 'playing':
        const progress = trials.length > 0
          ? ((currentTrialIndex + 1) / trials.length) * 100
          : 0;

        return (
          <View style={styles.gameContainer}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {currentTrialIndex + 1} / {trials.length}
              </Text>
            </View>

            {/* N-Back indicator */}
            <View style={styles.nBackIndicator}>
              <Text style={styles.nBackText}>{difficulty}-Back</Text>
            </View>

            {/* Grid */}
            <View style={styles.grid}>
              {renderGrid()}
            </View>

            {/* Encouragement */}
            <Text style={styles.encouragement}>{encouragement}</Text>

            {/* Response Buttons */}
            <ResponseButtons
              onPositionMatch={handlePositionMatch}
              onSymbolMatch={handleSymbolMatch}
              disabled={!showingStimulus}
              positionPressed={positionPressed}
              symbolPressed={symbolPressed}
            />

            {/* Current Accuracy */}
            <Text style={styles.currentAccuracy}>
              Accuracy: {stats.accuracy}%
            </Text>
          </View>
        );

      case 'complete':
        return (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.completeContainer}>
              <Ionicons name="checkmark-circle" size={80} color={GAME_COLORS.patternPeace.match} />
              <Text style={styles.completeTitle}>Training Complete</Text>

              <StatsDisplay stats={stats} difficulty={difficulty} />

              <View style={styles.scriptureContainer}>
                <Text style={styles.scripture}>{currentScripture}</Text>
              </View>

              <Text style={styles.completeMessage}>
                {stats.accuracy >= 80
                  ? 'Excellent focus! Your working memory is getting stronger.'
                  : stats.accuracy >= 60
                  ? 'Good effort! Consistent practice brings lasting peace.'
                  : 'Keep practicing. Each session trains your mind for stillness.'}
              </Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.playAgainButton}
                  onPress={() => {
                    setPhase('intro');
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.playAgainText}>Play Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={[GAME_COLORS.patternPeace.background, '#F5F0E8']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={GAME_COLORS.patternPeace.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pattern Peace</Text>
        <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
      </View>

      {renderContent()}

      {/* Disclaimer Modal */}
      <DisclaimerModal
        visible={showDisclaimer}
        onAccept={() => setShowDisclaimer(false)}
        title="Educational Exercise"
        content="Pattern Peace is a cognitive training exercise based on N-back research. It is educational in nature and is not a substitute for professional mental health treatment. If you're experiencing persistent cognitive difficulties, please consult a healthcare provider."
      />

      {/* Why This Works Modal */}
      <WhyThisWorks
        visible={showWhyThisWorks}
        gameId="pattern_peace"
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
    </LinearGradient>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GAME_COLORS.patternPeace.primary,
  },

  // Intro styles
  introContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: GAME_COLORS.patternPeace.primary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B7355',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5D4E37',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  scriptureContainer: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginHorizontal: 16,
  },
  scripture: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#5D4E37',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Difficulty selection
  difficultyContainer: {
    width: '100%',
    marginTop: 24,
  },
  difficultyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GAME_COLORS.patternPeace.primary,
    marginBottom: 12,
  },
  difficultyOption: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyOptionSelected: {
    borderColor: GAME_COLORS.patternPeace.primary,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D4E37',
  },
  difficultyLevelSelected: {
    color: GAME_COLORS.patternPeace.primary,
  },
  difficultyDescription: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GAME_COLORS.patternPeace.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 24,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  // Instructions styles
  instructionsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: GAME_COLORS.patternPeace.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GAME_COLORS.patternPeace.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D4E37',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(155, 143, 184, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#5D4E37',
    lineHeight: 20,
  },

  // Game styles
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(155, 143, 184, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GAME_COLORS.patternPeace.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#8B7355',
    minWidth: 50,
    textAlign: 'right',
  },
  nBackIndicator: {
    backgroundColor: GAME_COLORS.patternPeace.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 24,
  },
  nBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_WIDTH - 80,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    padding: 8,
  },
  gridCell: {
    width: (SCREEN_WIDTH - 96) / 3,
    height: (SCREEN_WIDTH - 96) / 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(155, 143, 184, 0.1)',
    borderRadius: 12,
    margin: 4,
  },
  gridCellActive: {
    backgroundColor: 'rgba(155, 143, 184, 0.3)',
  },
  encouragement: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#8B7355',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  responseButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  positionButton: {
    backgroundColor: GAME_COLORS.patternPeace.match,
  },
  symbolButton: {
    backgroundColor: GAME_COLORS.patternPeace.secondary,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  currentAccuracy: {
    fontSize: 16,
    color: '#8B7355',
    marginTop: 20,
  },

  // Complete styles
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: GAME_COLORS.patternPeace.primary,
    marginTop: 16,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GAME_COLORS.patternPeace.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: GAME_COLORS.patternPeace.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  detailStats: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(155, 143, 184, 0.2)',
    paddingTop: 16,
  },
  detailStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailStatLabel: {
    flex: 1,
    fontSize: 14,
    color: '#5D4E37',
  },
  detailStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: GAME_COLORS.patternPeace.primary,
  },
  completeMessage: {
    fontSize: 16,
    color: '#5D4E37',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GAME_COLORS.patternPeace.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  playAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: 'rgba(155, 143, 184, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  doneButtonText: {
    color: GAME_COLORS.patternPeace.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PatternPeace;
