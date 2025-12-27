/**
 * Inference Router
 * Routes inference requests to the appropriate method:
 * 1. Rule-based (always available, instant)
 * 2. SLM (when loaded, private, offline)
 * 3. Cloud LLM (when online, highest quality)
 */

import {
  InferenceRequest,
  InferenceResult,
  InferenceMethod,
  MoodLevel,
  CognitiveDistortion,
  PsychologicalPattern,
  JournalAnalysis,
  GameId,
} from './types';

// ============================================
// SLM STATUS (Future Implementation)
// ============================================

interface SLMStatus {
  loaded: boolean;
  modelName: string | null;
  loadTime: number | null;
}

let slmStatus: SLMStatus = {
  loaded: false,
  modelName: null,
  loadTime: null,
};

export function getSLMStatus(): SLMStatus {
  return { ...slmStatus };
}

// Future: Load SLM model
export async function loadSLM(): Promise<boolean> {
  // TODO: Implement with llama.cpp or ONNX runtime
  // For now, we use rule-based only
  console.log('SLM loading not yet implemented - using rule-based inference');
  return false;
}

// ============================================
// MAIN INFERENCE ROUTER
// ============================================

export async function routeInference(request: InferenceRequest): Promise<InferenceResult> {
  const startTime = Date.now();

  // Priority 1: Rule-based (always available)
  // This is our current implementation - fast and privacy-first
  const result = await ruleBasedInference(request);

  return {
    ...result,
    latencyMs: Date.now() - startTime,
  };

  // Future: Add SLM and Cloud routing here
  // if (slmStatus.loaded && deviceCapable) { ... }
  // if (isOnline && request.requiresHighQuality) { ... }
}

// ============================================
// RULE-BASED INFERENCE
// ============================================

async function ruleBasedInference(request: InferenceRequest): Promise<Omit<InferenceResult, 'latencyMs'>> {
  switch (request.task) {
    case 'compassion_score':
      return {
        output: scoreCompassion(request.input),
        method: 'rule_based',
        confidence: 0.75,
      };

    case 'distortion_detect':
      return {
        output: detectDistortions(request.input),
        method: 'rule_based',
        confidence: 0.70,
      };

    case 'mood_detect':
      return {
        output: detectMood(request.input),
        method: 'rule_based',
        confidence: 0.65,
      };

    case 'journal_insight':
      return {
        output: analyzeJournal(request.input),
        method: 'rule_based',
        confidence: 0.60,
      };

    case 'recommendation':
      // Recommendations are handled by the prediction engine, not inference
      return {
        output: null,
        method: 'rule_based',
        confidence: 0,
      };

    default:
      return {
        output: null,
        method: 'rule_based',
        confidence: 0,
      };
  }
}

// ============================================
// COMPASSION SCORING
// ============================================

export function scoreCompassion(text: string): number {
  let score = 5; // Baseline

  // Positive markers (+1 each)
  const positivePatterns = [
    /i('m| am) learning/i,
    /it('s| is) okay/i,
    /i('m| am) doing (my )?best/i,
    /i (can|will|am able)/i,
    /this (too )?shall pass/i,
    /i forgive/i,
    /growth/i,
    /progress/i,
    /i('m| am) trying/i,
    /be (kind|gentle) (to|with) (myself|me)/i,
    /it('s| is) (okay|alright|fine) to/i,
    /i (deserve|am worthy)/i,
    /one step at a time/i,
    /healing takes time/i,
  ];

  // Negative markers (-1 each)
  const negativePatterns = [
    /should have/i,
    /stupid|idiot|failure|worthless/i,
    /always|never/i,
    /i hate (myself|me)/i,
    /what('s| is) wrong with me/i,
    /i('m| am) (so )?(bad|terrible|awful)/i,
    /i can('t|not)/i,
    /hopeless/i,
    /i('m| am) such a/i,
    /i('ll| will) never/i,
  ];

  positivePatterns.forEach(p => { if (p.test(text)) score++; });
  negativePatterns.forEach(p => { if (p.test(text)) score--; });

  return Math.max(1, Math.min(10, score));
}

// ============================================
// DISTORTION DETECTION
// ============================================

export interface DetectedDistortion {
  id: string;
  name: string;
  evidence: string;
  confidence: number;
}

export function detectDistortions(text: string): DetectedDistortion[] {
  const distortions: DetectedDistortion[] = [];
  const lowerText = text.toLowerCase();

  const patterns: Record<string, { pattern: RegExp; name: string }> = {
    all_or_nothing: {
      pattern: /\b(always|never|completely|totally|entirely|absolutely|everyone|no one|everything|nothing)\b/gi,
      name: 'All-or-Nothing Thinking',
    },
    catastrophizing: {
      pattern: /\b(worst|terrible|horrible|disaster|catastrophe|ruined|destroyed|end of|can't handle|unbearable|devastating)\b/gi,
      name: 'Catastrophizing',
    },
    should_statements: {
      pattern: /\b(should|must|have to|ought to|supposed to|need to) (have|be|do)/gi,
      name: 'Should Statements',
    },
    mind_reading: {
      pattern: /\b(they think|everyone thinks|people think|he thinks|she thinks|knows? (i|I|that I)|must think|probably thinks)\b/gi,
      name: 'Mind Reading',
    },
    fortune_telling: {
      pattern: /\b(will (always|never)|going to (fail|mess up|ruin)|won't ever|can't ever|it('s| is) going to be)\b/gi,
      name: 'Fortune Telling',
    },
    labeling: {
      pattern: /\b(i('m| am) (a|an|such a) (failure|loser|idiot|bad person|terrible person|stupid|worthless))\b/gi,
      name: 'Labeling',
    },
    emotional_reasoning: {
      pattern: /\b(i feel (like a|that i('m| am))|because i feel|feeling this way means)\b/gi,
      name: 'Emotional Reasoning',
    },
    overgeneralization: {
      pattern: /\b(this always happens|every time|everyone does|no one ever)\b/gi,
      name: 'Overgeneralization',
    },
    personalization: {
      pattern: /\b(my fault|because of me|i made|i caused|blame myself)\b/gi,
      name: 'Personalization',
    },
    mental_filtering: {
      pattern: /\b(only (the bad|negative)|nothing good|can('t|not) see any(thing)? positive)\b/gi,
      name: 'Mental Filtering',
    },
  };

  Object.entries(patterns).forEach(([id, { pattern, name }]) => {
    const matches = text.match(pattern);
    if (matches) {
      distortions.push({
        id,
        name,
        evidence: matches[0],
        confidence: Math.min(0.9, 0.6 + matches.length * 0.1),
      });
    }
  });

  return distortions;
}

// ============================================
// MOOD DETECTION
// ============================================

export interface MoodAnalysis {
  level: MoodLevel;
  tone: 'positive' | 'negative' | 'mixed' | 'neutral';
  emotionWords: string[];
  confidence: number;
}

export function detectMood(text: string): MoodAnalysis {
  const positiveEmotions = [
    'happy', 'grateful', 'blessed', 'peaceful', 'hopeful', 'better', 'good',
    'joy', 'thankful', 'calm', 'love', 'excited', 'proud', 'content',
    'relieved', 'encouraged', 'optimistic', 'cheerful', 'delighted',
  ];

  const negativeEmotions = [
    'sad', 'angry', 'hurt', 'anxious', 'scared', 'lonely', 'overwhelmed',
    'tired', 'frustrated', 'worried', 'afraid', 'depressed', 'hopeless',
    'exhausted', 'stressed', 'disappointed', 'guilty', 'ashamed', 'numb',
  ];

  const words = text.toLowerCase().split(/\s+/);
  const foundPositive: string[] = [];
  const foundNegative: string[] = [];

  words.forEach(word => {
    positiveEmotions.forEach(p => {
      if (word.includes(p)) foundPositive.push(p);
    });
    negativeEmotions.forEach(n => {
      if (word.includes(n)) foundNegative.push(n);
    });
  });

  const posCount = foundPositive.length;
  const negCount = foundNegative.length;
  const ratio = (posCount - negCount) / Math.max(words.length, 1);

  let level: MoodLevel;
  if (ratio > 0.08) level = 9;
  else if (ratio > 0.05) level = 8;
  else if (ratio > 0.02) level = 7;
  else if (ratio > 0) level = 6;
  else if (ratio === 0) level = 5;
  else if (ratio > -0.02) level = 4;
  else if (ratio > -0.05) level = 3;
  else if (ratio > -0.08) level = 2;
  else level = 1;

  let tone: 'positive' | 'negative' | 'mixed' | 'neutral';
  if (posCount > 0 && negCount > 0) tone = 'mixed';
  else if (posCount > 0) tone = 'positive';
  else if (negCount > 0) tone = 'negative';
  else tone = 'neutral';

  return {
    level,
    tone,
    emotionWords: [...new Set([...foundPositive, ...foundNegative])],
    confidence: Math.min(0.9, 0.5 + (posCount + negCount) * 0.05),
  };
}

// ============================================
// JOURNAL ANALYSIS
// ============================================

export function analyzeJournal(content: string): JournalAnalysis {
  const moodAnalysis = detectMood(content);
  const distortions = detectDistortions(content);
  const compassionScore = scoreCompassion(content);

  // Count self-critical vs self-compassionate statements
  const selfCriticalPatterns = [
    /i('m| am) (so )?(stupid|dumb|worthless|useless)/gi,
    /what('s| is) wrong with me/gi,
    /i('m| am) (a|such a) failure/gi,
    /i hate (myself|me)/gi,
    /i('m| am) not good enough/gi,
  ];

  const selfCompassionPatterns = [
    /i('m| am) doing (my )?best/gi,
    /it('s| is) okay to/gi,
    /i forgive (myself|me)/gi,
    /i('m| am) learning/gi,
    /be (kind|gentle) (to|with) (myself|me)/gi,
  ];

  let selfCriticalCount = 0;
  let selfCompassionCount = 0;

  selfCriticalPatterns.forEach(p => {
    const matches = content.match(p);
    if (matches) selfCriticalCount += matches.length;
  });

  selfCompassionPatterns.forEach(p => {
    const matches = content.match(p);
    if (matches) selfCompassionCount += matches.length;
  });

  // Detect psychological patterns
  const patternsDetected = detectPsychologicalPatterns(content, moodAnalysis, distortions);

  // Suggest games based on analysis
  const suggestedGames = suggestGamesForJournal(moodAnalysis, distortions, patternsDetected);

  return {
    entryId: `analysis_${Date.now()}`,
    timestamp: Date.now(),
    mood: moodAnalysis.level,
    emotionalTone: moodAnalysis.tone,
    emotionWords: moodAnalysis.emotionWords,
    distortionsDetected: distortions.map(d => ({
      id: d.id,
      name: d.name,
      frequency: 1,
      reframeSuccessRate: 0,
    })),
    selfCriticalStatements: selfCriticalCount,
    selfCompassionStatements: selfCompassionCount,
    patternsDetected,
    suggestedGames,
    suggestedReason: generateSuggestionReason(suggestedGames, patternsDetected),
    rawContentStored: false,
  };
}

// ============================================
// PSYCHOLOGICAL PATTERN DETECTION
// ============================================

function detectPsychologicalPatterns(
  content: string,
  moodAnalysis: MoodAnalysis,
  distortions: DetectedDistortion[]
): PsychologicalPattern[] {
  const patterns: PsychologicalPattern[] = [];
  const lowerContent = content.toLowerCase();

  // CBT patterns
  if (distortions.length > 0) {
    patterns.push('cognitive_distortion');
  }

  // Polyvagal patterns
  if (/\b(unsafe|danger|threat|attack|panic)\b/i.test(lowerContent)) {
    patterns.push('sympathetic_activation');
  }
  if (/\b(numb|frozen|shut down|disconnect|can('t|not) feel)\b/i.test(lowerContent)) {
    patterns.push('dorsal_vagal_shutdown');
  }
  if (/\b(safe|calm|connected|peace|grounded)\b/i.test(lowerContent)) {
    patterns.push('ventral_vagal_engagement');
  }

  // Trauma-informed patterns
  if (/\b(hypervigilant|on edge|can('t|not) relax|always watching)\b/i.test(lowerContent)) {
    patterns.push('hypervigilance');
  }
  if (/\b(flashback|memory|remind|trigger)\b/i.test(lowerContent)) {
    patterns.push('emotional_flashback');
  }
  if (moodAnalysis.tone === 'negative' && moodAnalysis.level <= 3) {
    patterns.push('window_of_tolerance_breach');
  }

  // Positive Psychology patterns
  if (/\b(grateful|thankful|blessed|appreciate)\b/i.test(lowerContent)) {
    patterns.push('gratitude_practice');
  }

  // Self-Compassion patterns
  if (/\b(should|must|have to|stupid|failure|worthless)\b/i.test(lowerContent)) {
    patterns.push('self_criticism_loop');
  }
  if (/\b(everyone feels|i('m| am) not alone|others experience)\b/i.test(lowerContent)) {
    patterns.push('common_humanity_recognition');
  }

  // Grounding needed
  if (/\b(overwhelm|too much|can('t|not) cope|falling apart)\b/i.test(lowerContent)) {
    patterns.push('grounding_needed');
  }

  return patterns;
}

// ============================================
// GAME SUGGESTIONS
// ============================================

function suggestGamesForJournal(
  moodAnalysis: MoodAnalysis,
  distortions: DetectedDistortion[],
  patterns: PsychologicalPattern[]
): GameId[] {
  const suggestions: GameId[] = [];

  // High anxiety/stress → Breathing
  if (patterns.includes('sympathetic_activation') ||
      patterns.includes('hypervigilance') ||
      patterns.includes('grounding_needed')) {
    suggestions.push('breathing');
  }

  // Cognitive distortions → Thought Detective
  if (distortions.length > 0 || patterns.includes('cognitive_distortion')) {
    suggestions.push('thought_detective');
  }

  // Self-criticism → Gratitude (counter-balance)
  if (patterns.includes('self_criticism_loop')) {
    suggestions.push('gratitude');
  }

  // Dissociation/numbness → Body Scan
  if (patterns.includes('dorsal_vagal_shutdown')) {
    suggestions.push('body_scan');
  }

  // Low mood but no specific patterns → Gratitude
  if (moodAnalysis.level <= 4 && suggestions.length === 0) {
    suggestions.push('gratitude');
  }

  // Always limit to top 2 suggestions to avoid overwhelm
  return suggestions.slice(0, 2);
}

function generateSuggestionReason(
  games: GameId[],
  patterns: PsychologicalPattern[]
): string {
  if (games.length === 0) {
    return 'Keep journaling - you\'re doing great!';
  }

  const reasons: Record<GameId, string> = {
    breathing: 'A breathing exercise might help calm your nervous system.',
    gratitude: 'Focusing on gratitude can shift your perspective gently.',
    thought_detective: 'You might benefit from reframing some thoughts.',
    body_scan: 'Reconnecting with your body could help you feel more grounded.',
    scripture_palace: 'A scripture might offer comfort right now.',
    pattern_peace: 'A focus exercise could help clear your mind.',
  };

  return reasons[games[0]] || 'These exercises might support you today.';
}

// ============================================
// EXPORTS FOR DIRECT USE
// ============================================

export {
  scoreCompassion as ruleBasedCompassionScore,
  detectDistortions as ruleBasedDistortionDetection,
  detectMood as ruleBasedMoodDetection,
  analyzeJournal as ruleBasedJournalAnalysis,
};
