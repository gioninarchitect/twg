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
import { useTranslation } from 'react-i18next';
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
const isWeb = typeof window !== 'undefined' && window.innerWidth !== undefined;

// Responsive grid size - max 300px on web, smaller on mobile
const getGridSize = () => {
  if (isWeb) {
    return Math.min(300, SCREEN_WIDTH - 48);
  }
  return Math.min(SCREEN_WIDTH - 80, 320);
};
const GRID_DIMENSION = getGridSize();

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
  descriptionKey: string;
}> = {
  1: {
    nBack: 1,
    stimulusDuration: 2500,
    interStimulusInterval: 500,
    trialsPerRound: 20,
    descriptionKey: 'brainGames.patternPeace.difficulty.level1',
  },
  2: {
    nBack: 2,
    stimulusDuration: 2000,
    interStimulusInterval: 500,
    trialsPerRound: 25,
    descriptionKey: 'brainGames.patternPeace.difficulty.level2',
  },
  3: {
    nBack: 3,
    stimulusDuration: 1800,
    interStimulusInterval: 400,
    trialsPerRound: 30,
    descriptionKey: 'brainGames.patternPeace.difficulty.level3',
  },
};

const SCRIPTURE_KEYS = [
  'brainGames.patternPeace.scriptures.psalm46',
  'brainGames.patternPeace.scriptures.john14',
  'brainGames.patternPeace.scriptures.isaiah26',
  'brainGames.patternPeace.scriptures.peter5',
  'brainGames.patternPeace.scriptures.psalm29',
];

const ENCOURAGEMENT_KEYS = [
  'brainGames.patternPeace.encouragements.focus',
  'brainGames.patternPeace.encouragements.peaceful',
  'brainGames.patternPeace.encouragements.patience',
  'brainGames.patternPeace.encouragements.stillness',
  'brainGames.patternPeace.encouragements.gift',
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
  t: (key: string) => string;
}

const ResponseButtons: React.FC<ResponseButtonsProps> = ({
  onPositionMatch,
  onSymbolMatch,
  disabled,
  positionPressed,
  symbolPressed,
  t,
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
        <Text style={styles.buttonText}>{t('brainGames.patternPeace.positionMatch')}</Text>
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
        <Text style={styles.buttonText}>{t('brainGames.patternPeace.symbolMatch')}</Text>
      </TouchableOpacity>
    </View>
  );
};

interface DifficultySelectProps {
  selectedLevel: DifficultyLevel;
  onSelect: (level: DifficultyLevel) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const DifficultySelect: React.FC<DifficultySelectProps> = ({ selectedLevel, onSelect, t }) => {
  return (
    <View style={styles.difficultyContainer}>
      <Text style={styles.difficultyTitle}>{t('brainGames.patternPeace.selectDifficulty')}</Text>
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
              {t('brainGames.patternPeace.level', { level })}
            </Text>
            {selectedLevel === level && (
              <Ionicons name="checkmark-circle" size={20} color={GAME_COLORS.patternPeace.primary} />
            )}
          </View>
          <Text style={styles.difficultyDescription}>
            {t(DIFFICULTY_SETTINGS[level].descriptionKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

interface StatsDisplayProps {
  stats: GameStats;
  difficulty: DifficultyLevel;
  t: (key: string) => string;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats, difficulty, t }) => {
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
      <Text style={styles.statsTitle}>{t('brainGames.patternPeace.sessionResults')}</Text>

      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalTrials}</Text>
          <Text style={styles.statLabel}>{t('brainGames.patternPeace.trials')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.accuracy}%</Text>
          <Text style={styles.statLabel}>{t('brainGames.patternPeace.overall')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{difficulty}-Back</Text>
          <Text style={styles.statLabel}>{t('brainGames.patternPeace.levelLabel')}</Text>
        </View>
      </View>

      <View style={styles.detailStats}>
        <View style={styles.detailStatRow}>
          <Ionicons name="grid-outline" size={20} color={GAME_COLORS.patternPeace.match} />
          <Text style={styles.detailStatLabel}>{t('brainGames.patternPeace.positionMatches')}</Text>
          <Text style={styles.detailStatValue}>{positionAccuracy}%</Text>
        </View>
        <View style={styles.detailStatRow}>
          <Ionicons name="shapes-outline" size={20} color={GAME_COLORS.patternPeace.secondary} />
          <Text style={styles.detailStatLabel}>{t('brainGames.patternPeace.symbolMatches')}</Text>
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
  const { t } = useTranslation();

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
  const [currentScriptureKey] = useState(SCRIPTURE_KEYS[Math.floor(Math.random() * SCRIPTURE_KEYS.length)]);
  const [encouragementKey, setEncouragementKey] = useState('');

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
    setEncouragementKey(ENCOURAGEMENT_KEYS[Math.floor(Math.random() * ENCOURAGEMENT_KEYS.length)]);
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
            setEncouragementKey(ENCOURAGEMENT_KEYS[Math.floor(Math.random() * ENCOURAGEMENT_KEYS.length)]);
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
              <Text style={styles.title}>{t('brainGames.patternPeace.title')}</Text>
              <Text style={styles.subtitle}>{t('brainGames.patternPeace.subtitle')}</Text>

              <Text style={styles.description}>
                {t('brainGames.patternPeace.intro.description')}
              </Text>

              <View style={styles.scriptureContainer}>
                <Text style={styles.scripture}>{t(currentScriptureKey)}</Text>
              </View>

              <DifficultySelect
                selectedLevel={difficulty}
                onSelect={setDifficulty}
                t={t}
              />

              <TouchableOpacity
                style={styles.startButton}
                onPress={() => setPhase('instructions')}
              >
                <Text style={styles.startButtonText}>{t('brainGames.patternPeace.continue')}</Text>
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
              <Text style={styles.instructionsTitle}>{t('brainGames.patternPeace.howToPlay')}</Text>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{t('brainGames.patternPeace.instructions.watchGrid')}</Text>
                  <Text style={styles.stepDescription}>
                    {t('brainGames.patternPeace.instructions.watchGridDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{t('brainGames.patternPeace.instructions.remember', { nBack: settings.nBack })}</Text>
                  <Text style={styles.stepDescription}>
                    {settings.nBack === 1
                      ? t('brainGames.patternPeace.instructions.rememberDesc1')
                      : t('brainGames.patternPeace.instructions.rememberDescN', { nBack: settings.nBack })}
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{t('brainGames.patternPeace.instructions.matchPosition')}</Text>
                  <Text style={styles.stepDescription}>
                    {t('brainGames.patternPeace.instructions.matchPositionDesc', { nBack: settings.nBack })}
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{t('brainGames.patternPeace.instructions.matchSymbol')}</Text>
                  <Text style={styles.stepDescription}>
                    {t('brainGames.patternPeace.instructions.matchSymbolDesc', { nBack: settings.nBack })}
                  </Text>
                </View>
              </View>

              <View style={styles.tipBox}>
                <Ionicons name="bulb-outline" size={20} color={GAME_COLORS.patternPeace.accent} />
                <Text style={styles.tipText}>
                  {t('brainGames.patternPeace.instructions.tip')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={handleBeginGame}
              >
                <Text style={styles.startButtonText}>{t('brainGames.patternPeace.beginTraining')}</Text>
                <Ionicons name="play" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 'playing':
        const progress = trials.length > 0
          ? ((currentTrialIndex + 1) / trials.length) * 100
          : 0;
        const playSettings = DIFFICULTY_SETTINGS[difficulty];

        return (
          <View style={styles.gamePhaseContainer}>
            {/* Top section: Quick instruction + Progress */}
            <View style={styles.gameTopSection}>
              <View style={styles.quickInstruction}>
                <Text style={styles.quickInstructionText}>
                  {playSettings.nBack === 1
                    ? t('brainGames.patternPeace.quickInstruction1')
                    : t('brainGames.patternPeace.quickInstructionN', { nBack: playSettings.nBack })}
                </Text>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {currentTrialIndex + 1} / {trials.length}
                </Text>
              </View>
            </View>

            {/* Middle section: Grid (centered, flexible) */}
            <View style={styles.gameMiddleSection}>
              <View style={styles.grid}>
                {renderGrid()}
              </View>
            </View>

            {/* Bottom section: Buttons (always visible) */}
            <View style={styles.gameBottomSection}>
              <Text style={styles.buttonHint}>
                {showingStimulus ? t('brainGames.patternPeace.tapIfMatches') : t('brainGames.patternPeace.watchForNext')}
              </Text>
              <ResponseButtons
                onPositionMatch={handlePositionMatch}
                onSymbolMatch={handleSymbolMatch}
                disabled={!showingStimulus}
                positionPressed={positionPressed}
                symbolPressed={symbolPressed}
                t={t}
              />
              <Text style={styles.currentAccuracy}>
                {t('brainGames.patternPeace.accuracy', { accuracy: stats.accuracy })}
              </Text>
            </View>
          </View>
        );

      case 'complete':
        return (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.completeContainer}>
              <Ionicons name="checkmark-circle" size={80} color={GAME_COLORS.patternPeace.match} />
              <Text style={styles.completeTitle}>{t('brainGames.patternPeace.trainingComplete')}</Text>

              <StatsDisplay stats={stats} difficulty={difficulty} t={t} />

              <View style={styles.scriptureContainer}>
                <Text style={styles.scripture}>{t(currentScriptureKey)}</Text>
              </View>

              <Text style={styles.completeMessage}>
                {stats.accuracy >= 80
                  ? t('brainGames.patternPeace.completeMessages.excellent')
                  : stats.accuracy >= 60
                  ? t('brainGames.patternPeace.completeMessages.good')
                  : t('brainGames.patternPeace.completeMessages.keepPracticing')}
              </Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.playAgainButton}
                  onPress={() => {
                    setPhase('intro');
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.playAgainText}>{t('brainGames.patternPeace.playAgain')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.doneButtonText}>{t('brainGames.patternPeace.done')}</Text>
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
      colors={[GAME_COLORS.patternPeace.background, '#151515']}
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
        <Text style={styles.headerTitle}>{t('brainGames.patternPeace.title')}</Text>
        <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
      </View>

      {renderContent()}

      {/* Disclaimer Modal */}
      <DisclaimerModal
        visible={showDisclaimer}
        onAccept={() => setShowDisclaimer(false)}
        title={t('brainGames.patternPeace.disclaimer.title')}
        content={t('brainGames.patternPeace.disclaimer.content')}
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
  gameScrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Increased for mobile safe area
    alignItems: 'center',
  },
  // New fixed layout for game phase (no scrolling needed)
  gamePhaseContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  gameTopSection: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  gameMiddleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameBottomSection: {
    paddingBottom: 24,
    alignItems: 'center',
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
    color: GAME_COLORS.patternPeace.textSecondary,
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: GAME_COLORS.patternPeace.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  scriptureContainer: {
    backgroundColor: GAME_COLORS.patternPeace.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scripture: {
    fontSize: 14,
    fontStyle: 'italic',
    color: GAME_COLORS.patternPeace.textSecondary,
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
    backgroundColor: GAME_COLORS.patternPeace.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  difficultyOptionSelected: {
    borderColor: GAME_COLORS.patternPeace.primary,
    backgroundColor: 'rgba(136, 152, 184, 0.2)',
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: GAME_COLORS.patternPeace.text,
  },
  difficultyLevelSelected: {
    color: GAME_COLORS.patternPeace.primary,
  },
  difficultyDescription: {
    fontSize: 14,
    color: GAME_COLORS.patternPeace.textSecondary,
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
    color: GAME_COLORS.patternPeace.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: GAME_COLORS.patternPeace.textSecondary,
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(136, 152, 184, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: GAME_COLORS.patternPeace.textSecondary,
    lineHeight: 20,
  },

  // Game styles
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 400,
  },
  quickInstruction: {
    backgroundColor: 'rgba(136, 152, 184, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  quickInstructionText: {
    fontSize: 14,
    color: GAME_COLORS.patternPeace.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  responseButtonsContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonHint: {
    fontSize: 14,
    color: GAME_COLORS.patternPeace.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: GAME_COLORS.patternPeace.textSecondary,
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
    width: GRID_DIMENSION,
    height: GRID_DIMENSION,
    maxWidth: 300,
    maxHeight: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 6,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gridCell: {
    width: (GRID_DIMENSION - 24) / 3,
    height: (GRID_DIMENSION - 24) / 3,
    maxWidth: 88,
    maxHeight: 88,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(136, 152, 184, 0.15)',
    borderRadius: 10,
    margin: 3,
  },
  gridCellActive: {
    backgroundColor: 'rgba(136, 152, 184, 0.4)',
  },
  encouragement: {
    fontSize: 14,
    fontStyle: 'italic',
    color: GAME_COLORS.patternPeace.textSecondary,
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
    color: GAME_COLORS.patternPeace.textSecondary,
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
    backgroundColor: GAME_COLORS.patternPeace.backgroundCard,
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: GAME_COLORS.patternPeace.textSecondary,
    marginTop: 4,
  },
  detailStats: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
    color: GAME_COLORS.patternPeace.text,
  },
  detailStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: GAME_COLORS.patternPeace.primary,
  },
  completeMessage: {
    fontSize: 16,
    color: GAME_COLORS.patternPeace.textSecondary,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  doneButtonText: {
    color: GAME_COLORS.patternPeace.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PatternPeace;
