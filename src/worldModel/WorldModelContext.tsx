/**
 * World Model Context Provider
 * Provides intelligent state management across the app
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  UserWorldState,
  WorldModelEvent,
  Intervention,
  HealingTrajectory,
  StrugglePrediction,
  CrossGameInsight,
  GameId,
  MoodLevel,
} from './types';
import {
  createInitialWorldState,
  saveWorldModel,
  loadWorldModel,
  worldModelReducer,
} from './state';
import { eventBus } from './events';
import { routeInference, analyzeJournal } from './inference';

// ============================================
// CONTEXT TYPES
// ============================================

interface WorldModelContextValue {
  // State
  state: UserWorldState;
  isLoading: boolean;

  // Dispatch
  dispatch: (event: WorldModelEvent) => void;

  // Computed Values
  healingTrajectory: HealingTrajectory;
  recommendations: Intervention[];
  crossGameInsights: CrossGameInsight[];

  // Predictions
  strugglePredictions: StrugglePrediction[];

  // Actions
  analyzeJournalEntry: (content: string) => ReturnType<typeof analyzeJournal>;
  checkGameUnlock: (gameId: GameId) => boolean;
  getGameUnlockDay: (gameId: GameId) => number;

  // Utility
  resetWorldModel: () => Promise<void>;
}

const WorldModelContext = createContext<WorldModelContextValue | null>(null);

// ============================================
// GAME UNLOCK DAYS
// ============================================

const GAME_UNLOCK_DAYS: Record<GameId, number> = {
  breathing: 1,
  gratitude: 1,
  scripture_palace: 7,
  thought_detective: 15,
  body_scan: 22,
  pattern_peace: 28,
};

// ============================================
// PROVIDER COMPONENT
// ============================================

interface WorldModelProviderProps {
  userId: string;
  children: ReactNode;
}

export function WorldModelProvider({ userId, children }: WorldModelProviderProps) {
  const [state, dispatchRaw] = useReducer(
    worldModelReducer,
    null,
    () => createInitialWorldState(userId)
  );
  const [isLoading, setIsLoading] = React.useState(true);

  // Load state on mount
  useEffect(() => {
    async function load() {
      const loaded = await loadWorldModel(userId);
      // Dispatch a synthetic event to set loaded state
      dispatchRaw({ type: 'APP_OPENED', timestamp: Date.now() });
      Object.assign(state, loaded);
      setIsLoading(false);
    }
    load();
  }, [userId]);

  // Subscribe to event bus
  useEffect(() => {
    const unsubscribe = eventBus.subscribe((event) => {
      dispatchRaw(event);
    });
    return unsubscribe;
  }, []);

  // Auto-save on state changes
  useEffect(() => {
    if (!isLoading) {
      saveWorldModel(state);
    }
  }, [state, isLoading]);

  // Dispatch with event bus emission
  const dispatch = useCallback((event: WorldModelEvent) => {
    eventBus.emit(event);
  }, []);

  // Calculate healing trajectory
  const healingTrajectory = useMemo((): HealingTrajectory => {
    const resilience = state.emotional.emotionalResilience;
    const streak = state.journey.streakDays;
    const reframing = state.cognitive.reframingAbility;

    // Simple heuristic
    const score = (resilience * 0.4) + (streak * 5) + (reframing * 5);

    if (score > 70) return 'accelerating';
    if (score > 50) return 'steady';
    if (score > 30) return 'plateaued';
    return 'struggling';
  }, [state]);

  // Generate recommendations
  const recommendations = useMemo((): Intervention[] => {
    const interventions: Intervention[] = [];
    const now = Date.now();

    // Priority 1: Crisis follow-up
    if (state.emotional.lastCrisisAccess) {
      const hoursSinceCrisis = (now - state.emotional.lastCrisisAccess) / (1000 * 60 * 60);
      if (hoursSinceCrisis < 24) {
        interventions.push({
          type: 'GAME_SUGGESTION',
          priority: 'high',
          game: 'breathing',
          reason: 'Gentle support after a difficult moment',
          timing: 'immediate',
        });
      }
    }

    // Priority 2: Low mood intervention
    if (state.emotional.currentMood <= 3) {
      interventions.push({
        type: 'GAME_SUGGESTION',
        priority: 'high',
        game: 'breathing',
        reason: 'A breathing exercise may help right now',
        timing: 'immediate',
      });
    }

    // Priority 3: Tension accumulation
    if (state.physical.tensionHotspots.length > 0) {
      const recentTension = state.physical.tensionHistory.slice(-3);
      const avgPreScore = recentTension.length > 0
        ? recentTension.reduce((sum, t) => sum + t.preSessionScore, 0) / recentTension.length
        : 0;

      if (avgPreScore > 6) {
        interventions.push({
          type: 'GAME_SUGGESTION',
          priority: 'medium',
          game: 'body_scan',
          message: `Your ${state.physical.tensionHotspots[0]} needs attention`,
          reason: 'Tension accumulation detected',
          timing: 'next_session',
        });
      }
    }

    // Priority 4: Gratitude streak maintenance
    const gratitudeGame = state.behavioral.engagementByGame.find(g => g.gameId === 'gratitude');
    if (gratitudeGame && gratitudeGame.streak >= 5) {
      const hoursSinceGratitude = (now - gratitudeGame.lastPlayed) / (1000 * 60 * 60);
      if (hoursSinceGratitude > 20) {
        interventions.push({
          type: 'NOTIFICATION',
          priority: 'medium',
          message: `Your ${gratitudeGame.streak}-day gratitude streak is precious. Just 2 minutes today?`,
          reason: 'Streak maintenance',
          timing: 'immediate',
        });
      }
    }

    // Priority 5: Encourage cognitive growth
    if (healingTrajectory === 'steady' || healingTrajectory === 'accelerating') {
      if (state.cognitive.workingMemoryLevel < 2 &&
          state.journey.currentDay >= GAME_UNLOCK_DAYS.pattern_peace) {
        interventions.push({
          type: 'GAME_SUGGESTION',
          priority: 'low',
          game: 'pattern_peace',
          reason: 'Ready to level up focus training',
          timing: 'next_session',
        });
      }
    }

    return interventions.slice(0, 3); // Max 3 active recommendations
  }, [state, healingTrajectory]);

  // Cross-game insights
  const crossGameInsights = useMemo((): CrossGameInsight[] => {
    const insights: CrossGameInsight[] = [];

    // Body Scan → Breathing synergy
    if (state.physical.tensionHotspots.includes('shoulders')) {
      insights.push({
        source: 'body_scan',
        target: 'breathing',
        insight: 'Shoulder tension detected in body scans',
        action: 'Suggest "Shoulder Release" breathing pattern',
      });
    }

    // Thought Detective → Gratitude synergy
    const topDistortion = state.emotional.dominantDistortions[0];
    if (topDistortion?.id === 'catastrophizing') {
      insights.push({
        source: 'thought_detective',
        target: 'gratitude',
        insight: 'Catastrophizing is your top distortion',
        action: 'Gratitude prompt: "What went better than expected today?"',
      });
    }

    // Pattern Peace → Scripture Palace synergy
    if (state.cognitive.focusCapacity < 50 && state.cognitive.workingMemoryLevel < 2) {
      insights.push({
        source: 'pattern_peace',
        target: 'scripture_palace',
        insight: 'Low focus capacity today',
        action: 'Review existing scriptures instead of adding new ones',
      });
    }

    return insights;
  }, [state]);

  // Struggle predictions
  const strugglePredictions = useMemo((): StrugglePrediction[] => {
    const predictions: StrugglePrediction[] = [];

    // Day 15 warning (Understanding Your Anger)
    if (state.journey.currentDay >= 12 && state.journey.currentDay < 15) {
      predictions.push({
        probability: 0.7,
        predictedDay: 15,
        factors: ['Day 15 content is emotionally intense', 'Historical high drop-off day'],
        suggestedPrevention: [
          {
            type: 'NOTIFICATION',
            priority: 'medium',
            message: 'Day 15 coming up - consider a breathing session tonight',
            reason: 'Pre-emptive support',
            timing: 'specific_time',
            specificTime: '20:00',
          },
        ],
      });
    }

    // Streak at risk
    if (state.journey.streakDays >= 5) {
      const hoursSinceActive = (Date.now() - state.behavioral.lastActiveAt) / (1000 * 60 * 60);
      if (hoursSinceActive > 20) {
        predictions.push({
          probability: 0.8,
          predictedDay: state.journey.currentDay,
          factors: [`${state.journey.streakDays}-day streak at risk`, 'Unusual inactivity'],
          suggestedPrevention: [
            {
              type: 'NOTIFICATION',
              priority: 'high',
              message: `Your ${state.journey.streakDays}-day streak is precious. Just 5 minutes today?`,
              reason: 'Streak protection',
              timing: 'immediate',
            },
          ],
        });
      }
    }

    return predictions;
  }, [state]);

  // Check if game is unlocked
  const checkGameUnlock = useCallback((gameId: GameId): boolean => {
    if (!state.brainGames.hasAccess) return false;
    const unlockDay = GAME_UNLOCK_DAYS[gameId];
    return state.journey.currentDay >= unlockDay;
  }, [state]);

  const getGameUnlockDay = useCallback((gameId: GameId): number => {
    return GAME_UNLOCK_DAYS[gameId];
  }, []);

  // Analyze journal entry
  const analyzeJournalEntryFn = useCallback((content: string) => {
    return analyzeJournal(content);
  }, []);

  // Reset world model
  const resetWorldModel = useCallback(async () => {
    const fresh = createInitialWorldState(userId);
    Object.assign(state, fresh);
    await saveWorldModel(fresh);
  }, [userId]);

  const value: WorldModelContextValue = {
    state,
    isLoading,
    dispatch,
    healingTrajectory,
    recommendations,
    crossGameInsights,
    strugglePredictions,
    analyzeJournalEntry: analyzeJournalEntryFn,
    checkGameUnlock,
    getGameUnlockDay,
    resetWorldModel,
  };

  return (
    <WorldModelContext.Provider value={value}>
      {children}
    </WorldModelContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useWorldModel(): WorldModelContextValue {
  const context = useContext(WorldModelContext);
  if (!context) {
    throw new Error('useWorldModel must be used within a WorldModelProvider');
  }
  return context;
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

export function useHealingTrajectory(): HealingTrajectory {
  const { healingTrajectory } = useWorldModel();
  return healingTrajectory;
}

export function useRecommendations(): Intervention[] {
  const { recommendations } = useWorldModel();
  return recommendations;
}

export function useEmotionalState() {
  const { state } = useWorldModel();
  return state.emotional;
}

export function useCognitiveState() {
  const { state } = useWorldModel();
  return state.cognitive;
}

export function usePhysicalState() {
  const { state } = useWorldModel();
  return state.physical;
}

export function useBrainGamesState() {
  const { state } = useWorldModel();
  return state.brainGames;
}

export function useJourneyState() {
  const { state } = useWorldModel();
  return state.journey;
}
