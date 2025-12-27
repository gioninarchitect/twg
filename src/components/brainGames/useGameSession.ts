/**
 * Brain Games - Game Session Hook
 * Shared logic for managing game sessions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useWorldModel } from '../../worldModel';
import { GameId } from '../../worldModel/types';
import { SESSION_DEFAULTS, HAPTIC_PATTERNS } from '../../theme/brainGames';

// ============================================
// GAME SESSION STATE
// ============================================

export interface GameSessionState {
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  endTime: number | null;
  duration: number;
  score: number;
  completed: boolean;
}

interface UseGameSessionOptions {
  gameId: GameId;
  autoStart?: boolean;
  onComplete?: (session: GameSessionState) => void;
  onPause?: () => void;
  onResume?: () => void;
}

// ============================================
// MAIN HOOK
// ============================================

export function useGameSession({
  gameId,
  autoStart = false,
  onComplete,
  onPause,
  onResume,
}: UseGameSessionOptions) {
  const { dispatch, state: worldState, checkGameUnlock } = useWorldModel();
  const isUnlocked = checkGameUnlock(gameId);

  const [session, setSession] = useState<GameSessionState>({
    isActive: autoStart,
    isPaused: false,
    startTime: autoStart ? Date.now() : null,
    endTime: null,
    duration: 0,
    score: 0,
    completed: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Duration tracker
  useEffect(() => {
    if (session.isActive && !session.isPaused && session.startTime) {
      timerRef.current = setInterval(() => {
        setSession((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - (prev.startTime || Date.now())) / 1000),
        }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session.isActive, session.isPaused]);

  // Start session
  const startSession = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSession({
      isActive: true,
      isPaused: false,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      score: 0,
      completed: false,
    });
  }, []);

  // Pause session
  const pauseSession = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSession((prev) => ({ ...prev, isPaused: true }));
    onPause?.();
  }, [onPause]);

  // Resume session
  const resumeSession = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSession((prev) => ({ ...prev, isPaused: false }));
    onResume?.();
  }, [onResume]);

  // Complete session
  const completeSession = useCallback((finalScore?: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setSession((prev) => {
      const endTime = Date.now();
      const completed = {
        ...prev,
        isActive: false,
        endTime,
        duration: Math.floor((endTime - (prev.startTime || endTime)) / 1000),
        score: finalScore !== undefined ? finalScore : prev.score,
        completed: true,
      };

      onComplete?.(completed);
      return completed;
    });
  }, [onComplete]);

  // Cancel session
  const cancelSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSession({
      isActive: false,
      isPaused: false,
      startTime: null,
      endTime: null,
      duration: 0,
      score: 0,
      completed: false,
    });
  }, []);

  // Update score
  const updateScore = useCallback((delta: number) => {
    setSession((prev) => ({
      ...prev,
      score: prev.score + delta,
    }));
  }, []);

  // Set score directly
  const setScore = useCallback((score: number) => {
    setSession((prev) => ({
      ...prev,
      score,
    }));
  }, []);

  return {
    session,
    isUnlocked,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession,
    updateScore,
    setScore,
  };
}

// ============================================
// BREATHING SESSION HOOK
// ============================================

export type BreathPhase = 'idle' | 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

interface BreathingPattern {
  name: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

export const BREATHING_PATTERNS: Record<string, BreathingPattern> = {
  relaxing: { name: '4-7-8 Relaxing', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  box: { name: 'Box Breathing', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  calming: { name: '4-4-6 Calming', inhale: 4, holdIn: 4, exhale: 6, holdOut: 0 },
  energizing: { name: '4-0-4 Energizing', inhale: 4, holdIn: 0, exhale: 4, holdOut: 0 },
};

interface UseBreathingSessionOptions {
  pattern?: keyof typeof BREATHING_PATTERNS;
  cycles?: number;
  onCycleComplete?: (cycleNumber: number) => void;
  onComplete?: () => void;
}

export function useBreathingSession({
  pattern = 'relaxing',
  cycles = 3,
  onCycleComplete,
  onComplete,
}: UseBreathingSessionOptions) {
  const selectedPattern = BREATHING_PATTERNS[pattern];
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get phase duration
  const getPhaseDuration = (p: BreathPhase): number => {
    switch (p) {
      case 'inhale': return selectedPattern.inhale;
      case 'holdIn': return selectedPattern.holdIn;
      case 'exhale': return selectedPattern.exhale;
      case 'holdOut': return selectedPattern.holdOut;
      default: return 0;
    }
  };

  // Get next phase
  const getNextPhase = (current: BreathPhase): BreathPhase => {
    switch (current) {
      case 'idle': return 'inhale';
      case 'inhale': return selectedPattern.holdIn > 0 ? 'holdIn' : 'exhale';
      case 'holdIn': return 'exhale';
      case 'exhale': return selectedPattern.holdOut > 0 ? 'holdOut' : 'inhale';
      case 'holdOut': return 'inhale';
    }
  };

  // Start breathing
  const start = useCallback(() => {
    setIsActive(true);
    setCurrentCycle(1);
    setPhase('inhale');
    setSecondsRemaining(selectedPattern.inhale);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [selectedPattern]);

  // Stop breathing
  const stop = useCallback(() => {
    setIsActive(false);
    setPhase('idle');
    setCurrentCycle(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isActive || phase === 'idle') return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Phase complete
          const nextPhase = getNextPhase(phase);

          // Check if cycle complete
          if (phase === 'exhale' && selectedPattern.holdOut === 0 ||
              phase === 'holdOut') {
            if (currentCycle >= cycles) {
              // All cycles complete
              stop();
              onComplete?.();
              return 0;
            } else {
              setCurrentCycle((c) => {
                onCycleComplete?.(c);
                return c + 1;
              });
            }
          }

          // Haptic feedback for phase change
          if (nextPhase === 'inhale') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else if (nextPhase === 'exhale') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          setPhase(nextPhase);
          return getPhaseDuration(nextPhase);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, phase, currentCycle, cycles]);

  return {
    phase,
    currentCycle,
    totalCycles: cycles,
    secondsRemaining,
    isActive,
    pattern: selectedPattern,
    start,
    stop,
  };
}

// ============================================
// GRATITUDE SESSION HOOK
// ============================================

interface UseGratitudeSessionOptions {
  targetCount?: number;
  dayNumber: number;
  onComplete?: (gratitudes: string[]) => void;
}

export function useGratitudeSession({
  targetCount = 3,
  dayNumber,
  onComplete,
}: UseGratitudeSessionOptions) {
  const { dispatch } = useWorldModel();
  const [gratitudes, setGratitudes] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');

  const addGratitude = useCallback((text: string) => {
    if (text.trim()) {
      const newGratitudes = [...gratitudes, text.trim()];
      setGratitudes(newGratitudes);
      setCurrentInput('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (newGratitudes.length >= targetCount) {
        // Auto complete when target reached
        onComplete?.(newGratitudes);
      }
    }
  }, [gratitudes, targetCount, onComplete]);

  const removeGratitude = useCallback((index: number) => {
    setGratitudes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submitGratitudes = useCallback(() => {
    if (gratitudes.length > 0) {
      // Emit to world model
      dispatch({
        type: 'GRATITUDE_ENTRY',
        gratitudes,
        dayNumber,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete?.(gratitudes);
    }
  }, [gratitudes, dayNumber, dispatch, onComplete]);

  return {
    gratitudes,
    currentInput,
    setCurrentInput,
    addGratitude,
    removeGratitude,
    submitGratitudes,
    progress: gratitudes.length / targetCount,
    isComplete: gratitudes.length >= targetCount,
  };
}
