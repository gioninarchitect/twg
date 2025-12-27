/**
 * World Model Event Bus
 * Pub/sub system for state updates across the app
 */

import { WorldModelEvent } from './types';

type EventListener = (event: WorldModelEvent) => void;

class EventBus {
  private listeners: Set<EventListener> = new Set();
  private eventHistory: WorldModelEvent[] = [];
  private maxHistory = 100;

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: WorldModelEvent): void {
    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  getHistory(): WorldModelEvent[] {
    return [...this.eventHistory];
  }

  clearHistory(): void {
    this.eventHistory = [];
  }
}

// Singleton instance
export const eventBus = new EventBus();

// ============================================
// EVENT EMITTER HELPERS
// ============================================

export function emitDevotionalCompleted(
  dayNumber: number,
  scrollDepth: number,
  duration: number
): void {
  eventBus.emit({
    type: 'DEVOTIONAL_COMPLETED',
    dayNumber,
    scrollDepth,
    duration,
  });
}

export function emitJournalEntry(
  dayNumber: number,
  content: string,
  wordCount: number
): void {
  eventBus.emit({
    type: 'JOURNAL_ENTRY',
    dayNumber,
    content,
    wordCount,
  });
}

export function emitBreathingSession(
  pattern: string,
  duration: number,
  completed: boolean
): void {
  eventBus.emit({
    type: 'BREATHING_SESSION',
    pattern,
    duration,
    completed,
  });
}

export function emitGratitudeEntry(gratitudes: string[], dayNumber: number): void {
  eventBus.emit({
    type: 'GRATITUDE_ENTRY',
    gratitudes,
    dayNumber,
  });
}

export function emitThoughtReframed(
  distortion: string,
  originalThought: string,
  reframedThought: string,
  compassionScore: number
): void {
  eventBus.emit({
    type: 'THOUGHT_REFRAMED',
    distortion,
    originalThought,
    reframedThought,
    compassionScore,
  });
}

export function emitBodyScanCompleted(
  tensionMap: import('./types').TensionEntry,
  duration: number
): void {
  eventBus.emit({
    type: 'BODY_SCAN_COMPLETED',
    tensionMap,
    duration,
  });
}

export function emitPatternPeaceSession(
  nBackLevel: 1 | 2 | 3,
  accuracy: number,
  duration: number
): void {
  eventBus.emit({
    type: 'PATTERN_PEACE_SESSION',
    nBackLevel,
    accuracy,
    duration,
  });
}

export function emitScriptureReviewed(reference: string, recalled: boolean): void {
  eventBus.emit({
    type: 'SCRIPTURE_REVIEWED',
    reference,
    recalled,
  });
}

export function emitScriptureAdded(
  reference: string,
  text: string,
  location: string,
  visualAssociation: string
): void {
  eventBus.emit({
    type: 'SCRIPTURE_ADDED',
    reference,
    text,
    location,
    visualAssociation,
  });
}

export function emitCrisisAccessed(resources: string[]): void {
  eventBus.emit({
    type: 'CRISIS_ACCESSED',
    resources,
  });
}

export function emitAppOpened(): void {
  eventBus.emit({
    type: 'APP_OPENED',
    timestamp: Date.now(),
  });
}

export function emitMoodCheckIn(mood: import('./types').MoodLevel, dayNumber: number): void {
  eventBus.emit({
    type: 'MOOD_CHECK_IN',
    mood,
    dayNumber,
  });
}

export function emitGameUnlocked(gameId: import('./types').GameId): void {
  eventBus.emit({
    type: 'GAME_UNLOCKED',
    gameId,
  });
}

export function emitNotificationResponded(
  notificationId: string,
  action: 'opened' | 'dismissed'
): void {
  eventBus.emit({
    type: 'NOTIFICATION_RESPONDED',
    notificationId,
    action,
  });
}
