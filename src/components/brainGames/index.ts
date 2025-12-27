/**
 * Brain Games Components
 * Shared UI components for all brain games
 */

// Container Components
export {
  GameContainer,
  GameCard,
  GameSection,
  GameFooter,
} from './GameContainer';

// Progress Components
export {
  SessionTimer,
  CountdownTimer,
  StepProgress,
  CircularProgress,
  AnimatedProgressBar,
  SessionStats,
} from './GameProgress';

// Feedback Components
export {
  SessionComplete,
  InlineFeedback,
  StreakNotification,
  AchievementToast,
  DisclaimerModal,
} from './GameFeedback';

// Animation Components
export {
  BreathingCircle,
  PulsingDot,
  FadeInView,
  ScaleBounce,
  ShakeView,
  FloatingElement,
  Confetti,
  AnimatedRing,
} from './GameAnimations';

// Hooks
export {
  useGameSession,
  useBreathingSession,
  useGratitudeSession,
  BREATHING_PATTERNS,
  type GameSessionState,
  type BreathPhase,
} from './useGameSession';

// Integration Components
export { GameRecommendation } from './GameRecommendation';

// Educational Components
export { WhyThisWorks, WhyThisWorksButton } from './WhyThisWorks';
