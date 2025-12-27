/**
 * World Model - Main Export
 * Intelligent state management for Tea With God
 */

// Types
export * from './types';

// State Management
export {
  createInitialWorldState,
  saveWorldModel,
  loadWorldModel,
  clearWorldModel,
  worldModelReducer,
} from './state';

// Event Bus
export {
  eventBus,
  emitDevotionalCompleted,
  emitJournalEntry,
  emitBreathingSession,
  emitGratitudeEntry,
  emitThoughtReframed,
  emitBodyScanCompleted,
  emitPatternPeaceSession,
  emitScriptureReviewed,
  emitScriptureAdded,
  emitCrisisAccessed,
  emitAppOpened,
  emitMoodCheckIn,
  emitGameUnlocked,
  emitNotificationResponded,
} from './events';

// Inference
export {
  routeInference,
  scoreCompassion,
  detectDistortions,
  detectMood,
  analyzeJournal,
  getSLMStatus,
  loadSLM,
  ruleBasedCompassionScore,
  ruleBasedDistortionDetection,
  ruleBasedMoodDetection,
  ruleBasedJournalAnalysis,
} from './inference';

// Context & Hooks
export {
  WorldModelProvider,
  useWorldModel,
  useHealingTrajectory,
  useRecommendations,
  useEmotionalState,
  useCognitiveState,
  usePhysicalState,
  useBrainGamesState,
  useJourneyState,
} from './WorldModelContext';
