# Tea With God - World Model Architecture Specification

**Version:** 1.0
**Date:** December 26, 2025
**Author:** System Architecture
**Purpose:** Define the intelligent state management system that powers personalized healing interventions

---

## EXECUTIVE SUMMARY

The World Model is the cognitive core of Tea With God's Brain Games integration. Unlike traditional chatbot approaches that respond to isolated queries, the World Model:

1. **Maintains persistent state** across the user's 40-day journey
2. **Predicts future needs** based on behavioral patterns
3. **Orchestrates interventions** across multiple game modalities
4. **Learns and adapts** to individual healing trajectories

This gives us a **10x advantage** over apps using simple LLM-only approaches.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TEA WITH GOD APP                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Devotional │  │   Journal   │  │Brain Games  │  │  Settings  │ │
│  │   Module    │  │   Module    │  │   Module    │  │   Module   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │                │        │
│         └────────────────┼────────────────┼────────────────┘        │
│                          │                │                         │
│                          ▼                ▼                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                     EVENT BUS (Observer Pattern)              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                          │                                          │
│                          ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │                    W O R L D   M O D E L                      │ │
│  │                                                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │ │
│  │  │   State     │  │  Predictor  │  │  Recommendation     │   │ │
│  │  │   Manager   │──│   Engine    │──│  Engine             │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │ │
│  │         │                                    │                │ │
│  │         ▼                                    ▼                │ │
│  │  ┌─────────────┐                    ┌─────────────────────┐  │ │
│  │  │   Local     │                    │  Notification       │  │ │
│  │  │   Storage   │                    │  Scheduler          │  │ │
│  │  └─────────────┘                    └─────────────────────┘  │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                          │                                          │
│                          ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    SUPABASE (Cloud Sync)                      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CORE DATA STRUCTURES

### 1. User World State

```typescript
interface UserWorldState {
  // Identity
  userId: string;
  createdAt: Timestamp;
  lastUpdated: Timestamp;

  // Journey Progress
  journey: {
    currentDay: number; // 1-40
    daysCompleted: number[];
    journeyStartedAt: Timestamp;
    expectedCompletionDate: Timestamp;
    streakDays: number;
    longestStreak: number;
    missedDays: number[];
  };

  // Emotional State (updated by Thought Detective, Journal analysis)
  emotional: {
    currentMood: MoodLevel; // 1-10 scale
    moodHistory: MoodEntry[]; // Last 14 days
    dominantDistortions: CognitiveDistortion[]; // Top 3 patterns
    triggerPatterns: TriggerPattern[];
    emotionalResilience: number; // 0-100 score
    lastCrisisAccess: Timestamp | null;
  };

  // Cognitive State (updated by Pattern Peace, Scripture Memory)
  cognitive: {
    workingMemoryLevel: number; // N-back level achieved (1-3)
    focusCapacity: number; // 0-100 based on session completion
    reframingAbility: number; // Average compassion score
    scriptureRetention: number; // % of scriptures remembered
    learningVelocity: number; // How fast they improve
  };

  // Physical State (updated by Body Scan, Breathing)
  physical: {
    tensionHotspots: BodyPart[]; // Most frequent tension areas
    tensionHistory: TensionEntry[]; // Last 14 sessions
    breathingCompliance: number; // % of suggested sessions completed
    averageSessionDuration: number; // minutes
    preferredBreathingPattern: string; // Which pattern they use most
    bodyAwareness: number; // 0-100 score
  };

  // Behavioral Patterns
  behavioral: {
    preferredTimeOfDay: TimeOfDay; // morning, afternoon, evening, night
    averageSessionLength: number; // minutes
    engagementByGame: GameEngagement[];
    completionRates: { [gameId: string]: number };
    lastActiveAt: Timestamp;
    notificationResponseRate: number;
  };

  // Spiritual Journey
  spiritual: {
    prayerEngagement: number; // 0-100
    scripturesMemorized: number;
    journalDepth: number; // Average word count
    reflectionQuality: number; // AI-scored 0-100
    breakthroughMoments: BreakthroughEntry[];
  };
}
```

### 2. Supporting Types

```typescript
type MoodLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
type BodyPart = 'forehead' | 'jaw' | 'neck' | 'shoulders' | 'chest' |
                'stomach' | 'lowerBack' | 'hips' | 'thighs' | 'feet';

interface MoodEntry {
  timestamp: Timestamp;
  level: MoodLevel;
  source: 'journal' | 'check_in' | 'inferred';
  dayNumber: number;
}

interface TriggerPattern {
  trigger: string; // e.g., "evening", "work_stress", "relationship"
  frequency: number; // Times detected
  lastOccurred: Timestamp;
  associatedDistortions: string[];
}

interface TensionEntry {
  timestamp: Timestamp;
  bodyParts: { part: BodyPart; level: 1 | 2 | 3 | 4 | 5 }[];
  preSessionScore: number;
  postSessionScore: number;
  releaseSuccess: number; // 0-100
}

interface GameEngagement {
  gameId: string;
  totalSessions: number;
  totalMinutes: number;
  averageScore: number;
  lastPlayed: Timestamp;
  streak: number;
}

interface CognitiveDistortion {
  id: string;
  name: string;
  frequency: number; // Times identified
  reframeSuccessRate: number;
}

interface BreakthroughEntry {
  dayNumber: number;
  timestamp: Timestamp;
  type: 'insight' | 'emotional_release' | 'forgiveness' | 'acceptance';
  description: string; // AI-generated summary
}
```

---

## STATE UPDATE MECHANISMS

### Event-Driven Updates

Every user action triggers a state update through the Event Bus:

```typescript
// Event types that update the world model
type WorldModelEvent =
  | { type: 'DEVOTIONAL_COMPLETED'; dayNumber: number; scrollDepth: number; duration: number }
  | { type: 'JOURNAL_ENTRY'; dayNumber: number; content: string; wordCount: number }
  | { type: 'BREATHING_SESSION'; pattern: string; duration: number; completed: boolean }
  | { type: 'GRATITUDE_ENTRY'; gratitudes: string[]; dayNumber: number }
  | { type: 'THOUGHT_REFRAMED'; distortion: string; compassionScore: number }
  | { type: 'BODY_SCAN_COMPLETED'; tensionMap: TensionEntry; duration: number }
  | { type: 'PATTERN_PEACE_SESSION'; nBackLevel: number; accuracy: number }
  | { type: 'SCRIPTURE_REVIEWED'; reference: string; recalled: boolean }
  | { type: 'CRISIS_ACCESSED'; resources: string[] }
  | { type: 'APP_OPENED'; timestamp: Timestamp }
  | { type: 'NOTIFICATION_RESPONDED'; notificationId: string; action: 'opened' | 'dismissed' };

// State updater function
function updateWorldModel(state: UserWorldState, event: WorldModelEvent): UserWorldState {
  switch (event.type) {
    case 'BREATHING_SESSION':
      return {
        ...state,
        physical: {
          ...state.physical,
          breathingCompliance: calculateCompliance(state, event),
          preferredBreathingPattern: updatePreferredPattern(state, event.pattern),
        },
        behavioral: {
          ...state.behavioral,
          lastActiveAt: new Date(),
          engagementByGame: updateEngagement(state.behavioral.engagementByGame, 'breathing', event),
        },
      };

    case 'THOUGHT_REFRAMED':
      return {
        ...state,
        emotional: {
          ...state.emotional,
          dominantDistortions: updateDistortionRanking(state, event.distortion),
          emotionalResilience: recalculateResilience(state, event.compassionScore),
        },
        cognitive: {
          ...state.cognitive,
          reframingAbility: updateMovingAverage(state.cognitive.reframingAbility, event.compassionScore),
        },
      };

    // ... handlers for all event types
  }
}
```

### Derived Scores

Some state values are computed from multiple inputs:

```typescript
// Emotional Resilience Score (0-100)
function calculateEmotionalResilience(state: UserWorldState): number {
  const weights = {
    moodStability: 0.25,      // Low variance in mood = higher score
    reframingAbility: 0.25,   // From Thought Detective
    breathingConsistency: 0.20, // Regular practice = resilience
    bodyAwareness: 0.15,      // Somatic intelligence
    streakMaintenance: 0.15,  // Journey consistency
  };

  const moodStability = 100 - (calculateMoodVariance(state.emotional.moodHistory) * 10);
  const reframing = state.cognitive.reframingAbility * 10;
  const breathing = state.physical.breathingCompliance * 100;
  const body = state.physical.bodyAwareness;
  const streak = Math.min(100, (state.journey.streakDays / 7) * 100);

  return (
    moodStability * weights.moodStability +
    reframing * weights.reframingAbility +
    breathing * weights.breathingConsistency +
    body * weights.bodyAwareness +
    streak * weights.streakMaintenance
  );
}

// Healing Trajectory (predictive)
function calculateHealingTrajectory(state: UserWorldState): 'accelerating' | 'steady' | 'plateaued' | 'struggling' {
  const recentResilience = state.emotional.emotionalResilience;
  const historicalAvg = calculateHistoricalResilience(state);
  const delta = recentResilience - historicalAvg;

  if (delta > 10) return 'accelerating';
  if (delta > -5 && delta <= 10) return 'steady';
  if (delta > -15 && delta <= -5) return 'plateaued';
  return 'struggling';
}
```

---

## PREDICTION ENGINE

The Predictor Engine anticipates user needs before they arise.

### Struggle Prediction

```typescript
interface StrugglePrediction {
  probability: number; // 0-1
  predictedDay: number;
  factors: string[];
  suggestedPrevention: Intervention[];
}

function predictUpcomingStruggles(state: UserWorldState): StrugglePrediction[] {
  const predictions: StrugglePrediction[] = [];

  // Pattern 1: Day 15 (Understanding Your Anger) is historically hard
  if (state.journey.currentDay >= 12 && state.journey.currentDay < 15) {
    predictions.push({
      probability: 0.7,
      predictedDay: 15,
      factors: ['Day 15 content is emotionally intense', 'Historical high drop-off day'],
      suggestedPrevention: [
        { type: 'NOTIFICATION', message: 'Day 15 coming up - consider a breathing session tonight' },
        { type: 'GAME_SUGGESTION', game: 'body_scan', reason: 'Pre-emptive tension release' },
      ],
    });
  }

  // Pattern 2: User's personal struggle time
  if (state.behavioral.preferredTimeOfDay === 'evening' &&
      state.emotional.triggerPatterns.some(t => t.trigger === 'evening')) {
    predictions.push({
      probability: 0.6,
      predictedDay: state.journey.currentDay,
      factors: ['Evening is your historical stress peak'],
      suggestedPrevention: [
        { type: 'NOTIFICATION', message: 'Evening approaching - Quick Calm ready when you need it' },
        { type: 'GAME_UNLOCK', game: 'breathing', pattern: '4-7-8' },
      ],
    });
  }

  // Pattern 3: Streak at risk
  if (state.journey.streakDays >= 5 &&
      timeSinceLastActivity(state) > 20 * 60 * 60 * 1000) { // 20 hours
    predictions.push({
      probability: 0.8,
      predictedDay: state.journey.currentDay,
      factors: ['5-day streak at risk', 'Unusual inactivity detected'],
      suggestedPrevention: [
        { type: 'NOTIFICATION', message: 'Your 5-day streak is precious. Just 5 minutes today?' },
      ],
    });
  }

  // Pattern 4: Tension accumulation
  const recentTension = state.physical.tensionHistory.slice(-3);
  const avgTension = recentTension.reduce((sum, t) => sum + t.preSessionScore, 0) / recentTension.length;
  if (avgTension > 7) {
    predictions.push({
      probability: 0.75,
      predictedDay: state.journey.currentDay + 1,
      factors: ['Rising tension levels over 3 days', `Hotspot: ${state.physical.tensionHotspots[0]}`],
      suggestedPrevention: [
        { type: 'GAME_SUGGESTION', game: 'body_scan', reason: 'Tension accumulation detected' },
        { type: 'NOTIFICATION', message: `Your ${state.physical.tensionHotspots[0]} needs attention` },
      ],
    });
  }

  return predictions;
}
```

### Breakthrough Prediction

```typescript
function predictBreakthroughOpportunity(state: UserWorldState): BreakthroughOpportunity | null {
  // Look for patterns that precede breakthroughs

  // Pattern 1: Gratitude streak + emotional dip = breakthrough likely
  if (state.spiritual.journalDepth > 150 && // Deep journaling
      state.emotional.moodHistory.slice(-2).every(m => m.level < 5) && // Recent low mood
      state.journey.daysCompleted.length > 20) { // Mid-journey
    return {
      type: 'emotional_release',
      probability: 0.6,
      suggestedAction: 'Continue journaling - breakthrough may be near',
    };
  }

  // Pattern 2: High reframing + specific distortion = insight coming
  if (state.cognitive.reframingAbility > 7 &&
      state.emotional.dominantDistortions[0]?.frequency > 10) {
    return {
      type: 'insight',
      probability: 0.5,
      suggestedAction: `You're close to mastering ${state.emotional.dominantDistortions[0].name}`,
    };
  }

  return null;
}
```

---

## RECOMMENDATION ENGINE

### Intervention Selection

```typescript
interface Intervention {
  type: 'GAME_SUGGESTION' | 'NOTIFICATION' | 'CONTENT_HIGHLIGHT' | 'CRISIS_PREP';
  priority: 'low' | 'medium' | 'high' | 'critical';
  game?: GameId;
  message?: string;
  reason: string;
  timing?: 'immediate' | 'next_session' | 'specific_time';
  specificTime?: string; // e.g., "18:00"
}

function getRecommendedInterventions(state: UserWorldState): Intervention[] {
  const interventions: Intervention[] = [];
  const trajectory = calculateHealingTrajectory(state);
  const predictions = predictUpcomingStruggles(state);

  // Priority 1: Crisis prevention
  if (state.emotional.lastCrisisAccess &&
      timeSince(state.emotional.lastCrisisAccess) < 24 * 60 * 60 * 1000) {
    interventions.push({
      type: 'GAME_SUGGESTION',
      priority: 'critical',
      game: 'breathing',
      reason: 'Recent crisis access - gentle support needed',
      timing: 'immediate',
    });
  }

  // Priority 2: Trajectory correction
  if (trajectory === 'struggling') {
    // Simplify recommendations - don't overwhelm
    interventions.push({
      type: 'GAME_SUGGESTION',
      priority: 'high',
      game: state.behavioral.engagementByGame
        .sort((a, b) => b.totalSessions - a.totalSessions)[0]?.gameId || 'breathing',
      reason: 'Returning to your favorite tool for grounding',
      timing: 'immediate',
    });
  }

  // Priority 3: Personalized growth edges
  if (trajectory === 'steady' || trajectory === 'accelerating') {
    // Challenge them appropriately
    if (state.cognitive.workingMemoryLevel < 2 && state.journey.currentDay >= 28) {
      interventions.push({
        type: 'GAME_SUGGESTION',
        priority: 'medium',
        game: 'pattern_peace',
        reason: 'Ready to level up focus training',
        timing: 'next_session',
      });
    }

    if (state.spiritual.scripturesMemorized < 5 && state.journey.currentDay >= 14) {
      interventions.push({
        type: 'GAME_SUGGESTION',
        priority: 'low',
        game: 'scripture_palace',
        reason: 'Your memory palace has room to grow',
        timing: 'next_session',
      });
    }
  }

  // Priority 4: Maintenance of strengths
  if (state.physical.breathingCompliance > 0.8) {
    // Acknowledge and encourage continuation
    interventions.push({
      type: 'NOTIFICATION',
      priority: 'low',
      message: 'Your breathing practice is building real resilience. Keep going.',
      reason: 'Positive reinforcement for high engagement',
      timing: 'next_session',
    });
  }

  // Add predictions-based interventions
  predictions.forEach(p => {
    p.suggestedPrevention.forEach(intervention => {
      interventions.push({
        ...intervention,
        priority: p.probability > 0.7 ? 'high' : 'medium',
        timing: p.predictedDay === state.journey.currentDay ? 'immediate' : 'specific_time',
      });
    });
  });

  // Sort by priority and limit to avoid overwhelm
  return interventions
    .sort((a, b) => priorityOrder(b.priority) - priorityOrder(a.priority))
    .slice(0, 3); // Max 3 active recommendations
}

function priorityOrder(p: string): number {
  return { critical: 4, high: 3, medium: 2, low: 1 }[p] || 0;
}
```

---

## CROSS-GAME SYNERGY

The World Model enables games to work together:

```typescript
interface CrossGameInsight {
  source: GameId;
  target: GameId;
  insight: string;
  action: string;
}

function detectCrossGameSynergies(state: UserWorldState): CrossGameInsight[] {
  const synergies: CrossGameInsight[] = [];

  // Body Scan → Breathing: Tension location suggests breathing focus
  if (state.physical.tensionHotspots.includes('shoulders')) {
    synergies.push({
      source: 'body_scan',
      target: 'breathing',
      insight: 'Shoulder tension detected in body scans',
      action: 'Suggest "Shoulder Release" breathing pattern',
    });
  }

  // Thought Detective → Gratitude: Counter specific distortions
  const topDistortion = state.emotional.dominantDistortions[0];
  if (topDistortion?.id === 'catastrophizing') {
    synergies.push({
      source: 'thought_detective',
      target: 'gratitude',
      insight: 'Catastrophizing is your top distortion',
      action: 'Gratitude prompt: "What went better than expected today?"',
    });
  }

  // Pattern Peace → Scripture Palace: Cognitive load awareness
  if (state.cognitive.workingMemoryLevel < 2 && state.cognitive.focusCapacity < 50) {
    synergies.push({
      source: 'pattern_peace',
      target: 'scripture_palace',
      insight: 'Low focus capacity today',
      action: 'Review existing scriptures instead of adding new ones',
    });
  }

  // Breathing → All: Morning breathing improves all metrics
  if (state.behavioral.preferredTimeOfDay === 'morning' &&
      state.physical.breathingCompliance > 0.7) {
    synergies.push({
      source: 'breathing',
      target: 'all',
      insight: 'Morning breathing correlates with 23% better engagement',
      action: 'Encourage maintaining morning routine',
    });
  }

  return synergies;
}
```

---

## NOTIFICATION INTELLIGENCE

Smart notification scheduling based on world model:

```typescript
interface SmartNotification {
  id: string;
  message: string;
  scheduledFor: Timestamp;
  reason: string;
  fallbackTime: Timestamp;
  maxAttempts: number;
  requiresResponse: boolean;
}

function scheduleSmartNotifications(state: UserWorldState): SmartNotification[] {
  const notifications: SmartNotification[] = [];
  const interventions = getRecommendedInterventions(state);

  interventions
    .filter(i => i.type === 'NOTIFICATION')
    .forEach((intervention, index) => {
      const optimalTime = calculateOptimalNotificationTime(state, intervention);

      notifications.push({
        id: `notif_${Date.now()}_${index}`,
        message: intervention.message!,
        scheduledFor: optimalTime,
        reason: intervention.reason,
        fallbackTime: addHours(optimalTime, 2),
        maxAttempts: intervention.priority === 'critical' ? 3 : 1,
        requiresResponse: intervention.priority === 'high' || intervention.priority === 'critical',
      });
    });

  return notifications;
}

function calculateOptimalNotificationTime(state: UserWorldState, intervention: Intervention): Timestamp {
  // Use behavioral data to find best time
  const timePreferences = {
    morning: '08:00',
    afternoon: '13:00',
    evening: '19:00',
    night: '21:00',
  };

  // Best time = their preferred time, adjusted for intervention urgency
  const baseTime = timePreferences[state.behavioral.preferredTimeOfDay];

  if (intervention.priority === 'critical') {
    return new Date(); // Immediate
  }

  if (intervention.timing === 'specific_time' && intervention.specificTime) {
    return parseTime(intervention.specificTime);
  }

  // Schedule for their preferred time today (or tomorrow if past)
  return getNextOccurrence(baseTime);
}
```

---

## PRIVACY & DATA HANDLING

### Local-First Architecture

```typescript
// All world model data stored locally first
const WORLD_MODEL_STORAGE_KEY = 'twg_world_model';

async function persistWorldModel(state: UserWorldState): Promise<void> {
  // 1. Always save locally (works offline)
  await AsyncStorage.setItem(WORLD_MODEL_STORAGE_KEY, JSON.stringify(state));

  // 2. Sync to cloud when online (optional, user-controlled)
  if (await isOnline() && state.syncEnabled) {
    await syncToSupabase(state);
  }
}

async function loadWorldModel(userId: string): Promise<UserWorldState> {
  // 1. Load from local storage
  const local = await AsyncStorage.getItem(WORLD_MODEL_STORAGE_KEY);
  if (local) {
    return JSON.parse(local);
  }

  // 2. Fallback to cloud if local doesn't exist
  if (await isOnline()) {
    return await fetchFromSupabase(userId);
  }

  // 3. Return fresh state if nothing exists
  return createInitialWorldState(userId);
}
```

### Data Anonymization for Analytics

```typescript
// What we track (anonymized):
interface AnonymizedAnalytics {
  // Aggregate patterns (no PII)
  gameEngagementPatterns: { [gameId: string]: number }; // Sessions per game
  averageHealingTrajectory: string;
  commonStrugglePoints: number[]; // Day numbers

  // NEVER tracked:
  // - Journal content
  // - Specific thoughts/gratitudes
  // - Personal identifiers
  // - Location data
}

function extractAnonymizedAnalytics(states: UserWorldState[]): AnonymizedAnalytics {
  return {
    gameEngagementPatterns: aggregateGameEngagement(states),
    averageHealingTrajectory: calculatePopulationTrajectory(states),
    commonStrugglePoints: findCommonStruggleDays(states),
  };
}
```

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)
- [ ] Implement `UserWorldState` data structure
- [ ] Create Event Bus for state updates
- [ ] Build local persistence layer
- [ ] Add state update handlers for existing features (devotional, journal)

### Phase 2: Game Integration (Week 3-4)
- [ ] Add state updates from Breathing game
- [ ] Add state updates from Gratitude game
- [ ] Implement cross-game synergy detection
- [ ] Build basic recommendation engine

### Phase 3: Prediction Engine (Week 5)
- [ ] Implement struggle prediction
- [ ] Add breakthrough prediction
- [ ] Build smart notification scheduler
- [ ] Test prediction accuracy

### Phase 4: Advanced Features (Week 6)
- [ ] Add remaining games to world model
- [ ] Implement full recommendation engine
- [ ] Add trajectory visualization for user
- [ ] Privacy controls and data export

---

## SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Prediction Accuracy | 70%+ | % of predicted struggles that occur |
| Intervention Effectiveness | 40%+ | % reduction in drop-off after intervention |
| Cross-Game Engagement | 60%+ | Users engaging with 2+ games |
| User Satisfaction | 4.5+ | App store rating |
| Completion Rate Improvement | +20% | Compared to non-world-model baseline |

---

## OFFLINE-FIRST SMALL MODEL ARCHITECTURE

### The Vision: Box Smart, Run Local

The future is **edge AI** - intelligence that runs on the device, not the cloud. We're building for this future now:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OFFLINE-FIRST ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                 LOCAL INTELLIGENCE LAYER                      │ │
│  │                                                               │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │ │
│  │  │  World Model    │  │  Small Language │  │  Rule-Based  │  │ │
│  │  │  (State Engine) │  │  Model (SLM)    │  │  Fallbacks   │  │ │
│  │  │  ~50KB          │  │  ~50-100MB      │  │  ~5KB        │  │ │
│  │  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘  │ │
│  │           │                    │                   │          │ │
│  │           └────────────────────┼───────────────────┘          │ │
│  │                                │                               │ │
│  │                    ┌───────────▼───────────┐                  │ │
│  │                    │  Inference Router     │                  │ │
│  │                    │  (Picks best method)  │                  │ │
│  │                    └───────────────────────┘                  │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                │                                    │
│                                ▼                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    CLOUD LAYER (Optional)                     │ │
│  │  - Model updates     - Sync user data    - Advanced inference │ │
│  │  - Only when online  - User-controlled   - Fallback to local  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Small Language Models (SLMs)?

| Large LLM (GPT-4, Claude) | Small Language Model (SLM) |
|---------------------------|---------------------------|
| Requires internet | Runs 100% offline |
| 175B+ parameters | 1-7B parameters |
| API costs per call | Zero ongoing cost |
| Latency (network + inference) | Instant response |
| Privacy concerns (data leaves device) | Data never leaves device |
| Dependent on provider availability | Always available |

### Candidate SLMs for Mobile

```typescript
// Models that can run on modern mobile devices (2024+)
const CANDIDATE_SLMS = {
  // Tiny models (fastest, most compatible)
  tinyLlama: {
    size: '1.1B params',
    diskSize: '~600MB quantized',
    useCase: 'Compassion scoring, simple reframing',
    runtime: 'llama.cpp / ONNX',
  },

  // Small models (better quality, flagship phones)
  phi2: {
    size: '2.7B params',
    diskSize: '~1.5GB quantized',
    useCase: 'Journal analysis, distortion detection',
    runtime: 'llama.cpp / Core ML',
  },

  // Specialized models (domain-trained)
  mentalHealthSLM: {
    size: '1-3B params (fine-tuned)',
    diskSize: '~1GB quantized',
    useCase: 'Everything - trained on CBT/therapy data',
    runtime: 'Custom fine-tune on Llama/Phi base',
    status: 'Future - would need to train',
  },
};
```

### Inference Router Logic

The router decides which inference method to use based on task and device capabilities:

```typescript
interface InferenceRequest {
  task: 'compassion_score' | 'distortion_detect' | 'journal_insight' | 'recommendation';
  input: string;
  urgency: 'immediate' | 'background';
  requiresHighQuality: boolean;
}

interface InferenceResult {
  output: any;
  method: 'rule_based' | 'slm' | 'cloud_llm';
  confidence: number;
  latencyMs: number;
}

async function routeInference(request: InferenceRequest): Promise<InferenceResult> {
  const deviceCapability = await getDeviceCapability();
  const isOnline = await checkConnectivity();

  // Priority 1: Rule-based (instant, always works)
  if (request.task === 'compassion_score' && !request.requiresHighQuality) {
    return {
      output: ruleBasedCompassionScore(request.input),
      method: 'rule_based',
      confidence: 0.75,
      latencyMs: 1,
    };
  }

  // Priority 2: Local SLM (fast, private, no network)
  if (deviceCapability.canRunSLM && slmLoaded) {
    const startTime = Date.now();
    const result = await slm.infer(request);
    return {
      output: result,
      method: 'slm',
      confidence: 0.85,
      latencyMs: Date.now() - startTime,
    };
  }

  // Priority 3: Cloud LLM (highest quality, requires network)
  if (isOnline && request.requiresHighQuality) {
    const startTime = Date.now();
    const result = await callCloudLLM(request);
    return {
      output: result,
      method: 'cloud_llm',
      confidence: 0.95,
      latencyMs: Date.now() - startTime,
    };
  }

  // Fallback: Rule-based (always available)
  return {
    output: ruleBasedFallback(request),
    method: 'rule_based',
    confidence: 0.6,
    latencyMs: 2,
  };
}
```

### Task-Specific Routing

```typescript
const TASK_ROUTING_CONFIG = {
  // Compassion scoring - Rule-based first, SLM for nuance
  compassion_score: {
    preferredMethod: 'rule_based',
    upgradeToSLM: true, // Use SLM if available for better quality
    cloudFallback: false, // Never needs cloud
  },

  // Distortion detection - SLM preferred (nuanced classification)
  distortion_detect: {
    preferredMethod: 'slm',
    upgradeToSLM: true,
    cloudFallback: false,
    ruleBasedFallback: 'keyword_matching', // Simple fallback
  },

  // Journal insight - SLM with cloud upgrade option
  journal_insight: {
    preferredMethod: 'slm',
    upgradeToSLM: true,
    cloudFallback: true, // For very deep insights, use cloud if available
    ruleBasedFallback: 'sentiment_only', // Basic mood detection
  },

  // Personalized recommendations - World Model + SLM
  recommendation: {
    preferredMethod: 'world_model', // State machine first
    slmEnhancement: true, // SLM refines recommendations
    cloudFallback: false, // Recommendations must work offline
  },
};
```

### Rule-Based Fallbacks (Always Work)

Even without SLM or cloud, these never fail:

```typescript
// Compassion scoring without AI
function ruleBasedCompassionScore(text: string): number {
  let score = 5; // Baseline

  // Positive markers
  const positivePatterns = [
    /i('m| am) learning/i,
    /it('s| is) okay/i,
    /i('m| am) doing (my )?best/i,
    /i (can|will|am able)/i,
    /this (too )?shall pass/i,
    /i forgive/i,
    /growth/i,
    /progress/i,
  ];

  // Negative markers
  const negativePatterns = [
    /should have/i,
    /stupid|idiot|failure|worthless/i,
    /always|never/i,
    /i hate (myself|me)/i,
    /what('s| is) wrong with me/i,
    /i('m| am) (so )?(bad|terrible)/i,
  ];

  positivePatterns.forEach(p => { if (p.test(text)) score += 1; });
  negativePatterns.forEach(p => { if (p.test(text)) score -= 1; });

  return Math.max(1, Math.min(10, score));
}

// Distortion detection without AI
function ruleBasedDistortionDetection(text: string): string[] {
  const distortions: string[] = [];

  const patterns = {
    'all_or_nothing': /\b(always|never|completely|totally|entirely|absolutely)\b/i,
    'catastrophizing': /\b(worst|terrible|horrible|disaster|catastrophe|ruined|destroyed)\b/i,
    'should_statements': /\b(should|must|have to|ought to|supposed to)\b/i,
    'mind_reading': /\b(they think|everyone thinks|people think|knows? (i|I))\b/i,
    'fortune_telling': /\b(will (always|never)|going to (fail|mess up))\b/i,
    'labeling': /\b(i('m| am) (a|an) (failure|loser|idiot|bad person))\b/i,
  };

  Object.entries(patterns).forEach(([distortion, pattern]) => {
    if (pattern.test(text)) distortions.push(distortion);
  });

  return distortions;
}

// Mood detection from journal without AI
function ruleBasedMoodDetection(text: string): MoodLevel {
  const positiveWords = ['happy', 'grateful', 'blessed', 'peaceful', 'hopeful', 'better', 'good', 'joy'];
  const negativeWords = ['sad', 'angry', 'hurt', 'anxious', 'scared', 'lonely', 'overwhelmed', 'tired'];

  let posCount = 0;
  let negCount = 0;

  const words = text.toLowerCase().split(/\s+/);
  words.forEach(word => {
    if (positiveWords.includes(word)) posCount++;
    if (negativeWords.includes(word)) negCount++;
  });

  const ratio = (posCount - negCount) / Math.max(words.length, 1);

  // Map to 1-10 scale
  if (ratio > 0.05) return 8;
  if (ratio > 0.02) return 7;
  if (ratio > 0) return 6;
  if (ratio === 0) return 5;
  if (ratio > -0.02) return 4;
  if (ratio > -0.05) return 3;
  return 2;
}
```

### Future-Proofing for World Models (Post-LLM Era)

As world models mature (2025-2026), we're positioned to upgrade:

```typescript
// Current architecture (2024-2025)
interface CurrentSystem {
  worldModel: UserWorldState; // State tracking
  inference: 'rule_based' | 'slm' | 'cloud_llm'; // Text understanding
}

// Future architecture (2026+)
interface FutureSystem {
  worldModel: {
    userState: UserWorldState; // Same foundation
    internalSimulation: boolean; // NEW: Simulates outcomes
    planningHorizon: number; // NEW: Days ahead it models
    causalUnderstanding: boolean; // NEW: Understands cause-effect
  };
  inference: 'world_model_native'; // World model does reasoning internally
}

// Migration path: Our UserWorldState becomes the foundation for future world models
// We're not building a chatbot that will be replaced -
// We're building the state representation that world models will consume
```

### Bundled Intelligence Package

Everything runs offline in a single bundle:

```typescript
// App bundle sizes
const BUNDLE_SIZES = {
  // Core app
  appCode: '~10MB', // React Native + logic
  devotionalContent: '~5MB', // 40 days of text
  audioAssets: '~50MB', // Breathing/meditation audio

  // Intelligence layer
  worldModelEngine: '~50KB', // State machine + rules
  ruleBasedFallbacks: '~5KB', // Pattern matching
  slmModel: '~100MB', // Quantized small LLM (optional download)

  // Total without SLM: ~65MB (very reasonable)
  // Total with SLM: ~165MB (still acceptable)
};

// SLM is downloaded separately after install
async function downloadSLMIfNeeded(): Promise<boolean> {
  const hasEnoughStorage = await checkStorage(150 * 1024 * 1024); // 150MB
  const deviceCapable = await canRunSLM();
  const userOptedIn = await getUserPreference('enable_local_ai');

  if (hasEnoughStorage && deviceCapable && userOptedIn) {
    await downloadSLM();
    return true;
  }
  return false;
}
```

### The Competitive Moat

By building this architecture now, we have:

1. **Zero cloud dependency** - App works in airplane mode, rural areas, anywhere
2. **Zero ongoing AI costs** - No per-inference API charges
3. **Perfect privacy** - Journals, thoughts never leave the device
4. **Future-ready** - When better SLMs ship, we swap in; architecture stays same
5. **Graceful degradation** - Rule-based fallbacks mean NOTHING ever fails

**This is the moat that makes Tea With God defensible against big tech copying us.**

---

## COMPETITIVE ADVANTAGE SUMMARY

| Traditional App | Tea With God + World Model |
|-----------------|---------------------------|
| Static content delivery | Adaptive content timing |
| User initiates support | System predicts needs |
| Games operate in silos | Games inform each other |
| One-size-fits-all | Personalized trajectory |
| Reactive to crisis | Proactive prevention |
| Forgets between sessions | Builds cumulative understanding |
| Cloud-dependent AI | Runs 100% offline |
| LLM API costs | Zero inference cost |
| Data leaves device | Data never leaves device |

**The World Model + SLM architecture transforms Tea With God from a devotional app into an intelligent healing companion that learns, adapts, and grows with each user - entirely on their device, with their data, under their control.**

---

*End of Specification*
