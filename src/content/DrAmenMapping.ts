/**
 * Evidence-Based Brain Health Principles Mapping
 *
 * This file maps established brain health principles from neuroscience research
 * to the Tea With God 40-day journey. Each day's devotional content and brain
 * games are aligned with specific principles for maximum neurological benefit.
 *
 * Based on peer-reviewed research in neuroscience, psychology, and brain health.
 *
 * DISCLAIMER: This mapping is for educational purposes only.
 * These principles inform our evidence-based approach but do not constitute
 * medical advice.
 */

// ============================================================================
// 12 Evidence-Based Brain Health Principles
// ============================================================================

export interface BrainPrinciple {
  id: number;
  name: string;
  shortName: string;
  description: string;
  keyInsight: string;
  applicationToTWG: string;
}

export const BRAIN_PRINCIPLES: BrainPrinciple[] = [
  {
    id: 1,
    name: 'Your brain is involved in everything you do',
    shortName: 'Brain in Everything',
    description: 'How you think, feel, act, and interact with others is influenced by your brain.',
    keyInsight: 'When your brain works right, you work right. When it is troubled, you are troubled.',
    applicationToTWG: 'World Model tracks emotional, cognitive, physical, and behavioral states holistically.',
  },
  {
    id: 2,
    name: 'When your brain works right, you work right',
    shortName: 'Better Brain = Better Life',
    description: 'Optimizing brain function leads to better decisions, relationships, and quality of life.',
    keyInsight: 'You are not stuck with the brain you have. You can make it better.',
    applicationToTWG: '40-day journey progressively builds brain health through daily practices.',
  },
  {
    id: 3,
    name: 'Your brain is the most complex organ in the universe',
    shortName: 'Brain Complexity',
    description: '100 billion neurons with 100 trillion connections. Each part has specialized functions.',
    keyInsight: 'Understanding brain regions helps target interventions more effectively.',
    applicationToTWG: 'Brain Games target different regions: prefrontal (Thought Detective), limbic (Breathing), hippocampus (Scripture Palace).',
  },
  {
    id: 4,
    name: 'Your brain is very soft and housed in a really hard skull',
    shortName: 'Brain is Fragile',
    description: 'Brain injuries and trauma can affect mood, memory, and behavior for years.',
    keyInsight: 'Protect your brain. Past injuries may still be affecting you today.',
    applicationToTWG: 'Trauma-informed approach acknowledges that emotional wounds affect the physical brain.',
  },
  {
    id: 5,
    name: 'Your brain needs proper nutrition and support',
    shortName: 'Brain Needs Support',
    description: 'Blood flow, sleep, exercise, diet, and social connection are essential.',
    keyInsight: 'Brain health is physical health. Care for your body to care for your mind.',
    applicationToTWG: 'Future: Add sleep quality, hydration, and exercise tracking to World Model.',
  },
  {
    id: 6,
    name: 'BRIGHT MINDS risk factors steal your mind',
    shortName: 'BRIGHT MINDS',
    description: 'Blood flow, Retirement/aging, Inflammation, Genetics, Head trauma, Toxins, Mind storms, Immunity, Neurohormones, Diabesity, Sleep.',
    keyInsight: 'Identifying and addressing risk factors prevents cognitive decline.',
    applicationToTWG: 'Future: BRIGHT MINDS assessment in onboarding for personalized journey.',
  },
  {
    id: 7,
    name: 'Many things hurt the brain, many things help it',
    shortName: 'Help vs. Harm',
    description: 'Lifestyle choices directly impact brain function - for better or worse.',
    keyInsight: 'Small daily habits compound into significant brain health differences.',
    applicationToTWG: '6 Brain Games provide daily habits that help: breathing, gratitude, scripture, CBT, body awareness, focus.',
  },
  {
    id: 8,
    name: 'Brain systems work together in harmony',
    shortName: 'Systems Integration',
    description: 'Prefrontal cortex, limbic system, basal ganglia, and more must work in concert.',
    keyInsight: 'Imbalance in one system affects all others. Holistic treatment is key.',
    applicationToTWG: 'World Model tracks cross-game insights. Each game strengthens different systems that support each other.',
  },
  {
    id: 9,
    name: 'Understanding your brain helps you fix problems',
    shortName: 'Knowledge is Power',
    description: 'When you know why you feel or think a certain way, you can change it.',
    keyInsight: 'Psychoeducation is therapeutic. Learning about your brain reduces shame.',
    applicationToTWG: '"Why This Works" sections explain the science. Rule-based inference explains distortions.',
  },
  {
    id: 10,
    name: 'Multiple brain types need different treatments',
    shortName: 'Personalization',
    description: 'One-size-fits-all approaches fail. Brain types require tailored interventions.',
    keyInsight: 'What works for one person may not work for another.',
    applicationToTWG: 'World Model provides personalized game recommendations based on user state.',
  },
  {
    id: 11,
    name: 'Build brain reserve to handle stress',
    shortName: 'Brain Reserve',
    description: 'The brain can build capacity to handle challenges through consistent practice.',
    keyInsight: 'Resilience is built, not born. Daily habits create a buffer against stress.',
    applicationToTWG: 'Progressive game unlocks build skills over 40 days. Streaks reward consistency.',
  },
  {
    id: 12,
    name: 'Looking at the brain changes everything',
    shortName: 'Brain First',
    description: 'When you look at the brain, you develop more compassion and better treatments.',
    keyInsight: 'Reframing mental health as brain health reduces stigma and opens solutions.',
    applicationToTWG: 'We track outcomes over 40 days. Proactive interventions before crisis.',
  },
];

// ============================================================================
// 40-Day Journey Mapping to Brain Health Principles
// ============================================================================

export interface DayMapping {
  day: number;
  phase: 'valley' | 'waiting' | 'rising' | 'becoming';
  primaryPrinciple: number;
  secondaryPrinciples: number[];
  recommendedGames: string[];
  brainFocus: string;
  devotionalTheme: string;
}

export const DAY_BRAIN_MAPPING: DayMapping[] = [
  // ========================================
  // VALLEY PHASE (Days 1-14)
  // Focus: Grounding, Safety, Hope
  // ========================================
  {
    day: 1,
    phase: 'valley',
    primaryPrinciple: 1, // Brain in Everything
    secondaryPrinciples: [7, 12],
    recommendedGames: ['breathing', 'gratitude'],
    brainFocus: 'Limbic System (Emotional Center)',
    devotionalTheme: 'Acknowledging brokenness, finding God in the valley',
  },
  {
    day: 2,
    phase: 'valley',
    primaryPrinciple: 4, // Brain is Fragile
    secondaryPrinciples: [1, 9],
    recommendedGames: ['breathing', 'gratitude'],
    brainFocus: 'Amygdala (Fear Response)',
    devotionalTheme: 'Understanding that wounds are real, not weakness',
  },
  {
    day: 3,
    phase: 'valley',
    primaryPrinciple: 12, // Brain First
    secondaryPrinciples: [2, 9],
    recommendedGames: ['breathing', 'gratitude'],
    brainFocus: 'Prefrontal Cortex (Self-Compassion)',
    devotionalTheme: 'Removing shame, seeing pain through God\'s eyes',
  },
  {
    day: 4,
    phase: 'valley',
    primaryPrinciple: 7, // Help vs Harm
    secondaryPrinciples: [5, 11],
    recommendedGames: ['breathing', 'gratitude'],
    brainFocus: 'Vagus Nerve (Nervous System Regulation)',
    devotionalTheme: 'Learning what hurts and helps our growth',
  },
  {
    day: 5,
    phase: 'valley',
    primaryPrinciple: 2, // Better Brain = Better Life
    secondaryPrinciples: [11, 7],
    recommendedGames: ['breathing', 'gratitude'],
    brainFocus: 'Neuroplasticity Foundation',
    devotionalTheme: 'Hope that change is possible with God',
  },
  {
    day: 6,
    phase: 'valley',
    primaryPrinciple: 9, // Knowledge is Power
    secondaryPrinciples: [3, 12],
    recommendedGames: ['breathing', 'gratitude'],
    brainFocus: 'Understanding Brain Basics',
    devotionalTheme: 'Wisdom for the journey ahead',
  },
  {
    day: 7,
    phase: 'valley',
    primaryPrinciple: 3, // Brain Complexity
    secondaryPrinciples: [8, 9],
    recommendedGames: ['breathing', 'gratitude', 'scripture_palace'],
    brainFocus: 'Hippocampus (Memory Center)',
    devotionalTheme: 'Scripture as medicine for the mind',
  },
  {
    day: 8,
    phase: 'valley',
    primaryPrinciple: 8, // Systems Integration
    secondaryPrinciples: [1, 7],
    recommendedGames: ['breathing', 'scripture_palace'],
    brainFocus: 'Mind-Body Connection',
    devotionalTheme: 'Whole-person growth',
  },
  {
    day: 9,
    phase: 'valley',
    primaryPrinciple: 11, // Brain Reserve
    secondaryPrinciples: [2, 7],
    recommendedGames: ['breathing', 'scripture_palace'],
    brainFocus: 'Building Resilience',
    devotionalTheme: 'Strength for the journey',
  },
  {
    day: 10,
    phase: 'valley',
    primaryPrinciple: 10, // Personalization
    secondaryPrinciples: [9, 12],
    recommendedGames: ['breathing', 'scripture_palace', 'gratitude'],
    brainFocus: 'Self-Awareness',
    devotionalTheme: 'Your unique path to growth',
  },
  {
    day: 11,
    phase: 'valley',
    primaryPrinciple: 7, // Help vs Harm
    secondaryPrinciples: [5, 4],
    recommendedGames: ['breathing', 'gratitude', 'scripture_palace'],
    brainFocus: 'Habit Formation',
    devotionalTheme: 'Building healthy patterns',
  },
  {
    day: 12,
    phase: 'valley',
    primaryPrinciple: 4, // Brain is Fragile
    secondaryPrinciples: [9, 12],
    recommendedGames: ['breathing', 'scripture_palace'],
    brainFocus: 'Trauma Processing',
    devotionalTheme: 'God\'s protection over your mind',
  },
  {
    day: 13,
    phase: 'valley',
    primaryPrinciple: 2, // Better Brain = Better Life
    secondaryPrinciples: [11, 1],
    recommendedGames: ['breathing', 'scripture_palace', 'gratitude'],
    brainFocus: 'Progress Awareness',
    devotionalTheme: 'Celebrating small victories',
  },
  {
    day: 14,
    phase: 'valley',
    primaryPrinciple: 12, // Brain First
    secondaryPrinciples: [8, 10],
    recommendedGames: ['breathing', 'scripture_palace', 'gratitude'],
    brainFocus: 'Integration & Review',
    devotionalTheme: 'Completing the Valley with gratitude',
  },

  // ========================================
  // WAITING PHASE (Days 15-21)
  // Focus: Patience, Cognitive Restructuring, Trust
  // ========================================
  {
    day: 15,
    phase: 'waiting',
    primaryPrinciple: 9, // Knowledge is Power
    secondaryPrinciples: [3, 10],
    recommendedGames: ['thought_detective', 'breathing', 'scripture_palace'],
    brainFocus: 'Prefrontal Cortex (Cognitive Control)',
    devotionalTheme: 'Introducing the thought detective within',
  },
  {
    day: 16,
    phase: 'waiting',
    primaryPrinciple: 10, // Personalization
    secondaryPrinciples: [9, 8],
    recommendedGames: ['thought_detective', 'breathing'],
    brainFocus: 'Cognitive Distortions',
    devotionalTheme: 'Understanding your thought patterns',
  },
  {
    day: 17,
    phase: 'waiting',
    primaryPrinciple: 8, // Systems Integration
    secondaryPrinciples: [1, 3],
    recommendedGames: ['thought_detective', 'gratitude'],
    brainFocus: 'Thoughts-Emotions-Behavior Loop',
    devotionalTheme: 'How thoughts shape reality',
  },
  {
    day: 18,
    phase: 'waiting',
    primaryPrinciple: 7, // Help vs Harm
    secondaryPrinciples: [9, 11],
    recommendedGames: ['thought_detective', 'scripture_palace'],
    brainFocus: 'Cognitive Flexibility',
    devotionalTheme: 'Replacing lies with truth',
  },
  {
    day: 19,
    phase: 'waiting',
    primaryPrinciple: 11, // Brain Reserve
    secondaryPrinciples: [2, 7],
    recommendedGames: ['thought_detective', 'breathing'],
    brainFocus: 'Mental Endurance',
    devotionalTheme: 'Patience in the waiting',
  },
  {
    day: 20,
    phase: 'waiting',
    primaryPrinciple: 2, // Better Brain = Better Life
    secondaryPrinciples: [12, 10],
    recommendedGames: ['thought_detective', 'gratitude', 'scripture_palace'],
    brainFocus: 'Transformation Evidence',
    devotionalTheme: 'Seeing change in yourself',
  },
  {
    day: 21,
    phase: 'waiting',
    primaryPrinciple: 12, // Brain First
    secondaryPrinciples: [8, 9],
    recommendedGames: ['thought_detective', 'breathing', 'gratitude'],
    brainFocus: 'Waiting Phase Integration',
    devotionalTheme: 'Trust in God\'s timing',
  },

  // ========================================
  // RISING PHASE (Days 22-33)
  // Focus: Body Awareness, Active Healing, Strength
  // ========================================
  {
    day: 22,
    phase: 'rising',
    primaryPrinciple: 5, // Brain Needs Support
    secondaryPrinciples: [4, 8],
    recommendedGames: ['body_scan', 'breathing', 'thought_detective'],
    brainFocus: 'Interoceptive Awareness',
    devotionalTheme: 'Your body holds wisdom',
  },
  {
    day: 23,
    phase: 'rising',
    primaryPrinciple: 4, // Brain is Fragile
    secondaryPrinciples: [5, 12],
    recommendedGames: ['body_scan', 'breathing'],
    brainFocus: 'Somatic Memory',
    devotionalTheme: 'The body remembers what the mind forgets',
  },
  {
    day: 24,
    phase: 'rising',
    primaryPrinciple: 8, // Systems Integration
    secondaryPrinciples: [5, 1],
    recommendedGames: ['body_scan', 'gratitude'],
    brainFocus: 'Mind-Body Connection',
    devotionalTheme: 'Wholeness through God',
  },
  {
    day: 25,
    phase: 'rising',
    primaryPrinciple: 7, // Help vs Harm
    secondaryPrinciples: [5, 11],
    recommendedGames: ['body_scan', 'thought_detective'],
    brainFocus: 'Physical Self-Care',
    devotionalTheme: 'Honoring your temple',
  },
  {
    day: 26,
    phase: 'rising',
    primaryPrinciple: 11, // Brain Reserve
    secondaryPrinciples: [5, 2],
    recommendedGames: ['body_scan', 'scripture_palace'],
    brainFocus: 'Physical Resilience',
    devotionalTheme: 'Strength from surrender',
  },
  {
    day: 27,
    phase: 'rising',
    primaryPrinciple: 1, // Brain in Everything
    secondaryPrinciples: [8, 5],
    recommendedGames: ['body_scan', 'breathing', 'gratitude'],
    brainFocus: 'Holistic Awareness',
    devotionalTheme: 'Everything is connected',
  },
  {
    day: 28,
    phase: 'rising',
    primaryPrinciple: 3, // Brain Complexity
    secondaryPrinciples: [11, 9],
    recommendedGames: ['pattern_peace', 'body_scan', 'thought_detective'],
    brainFocus: 'Working Memory (Dorsolateral Prefrontal)',
    devotionalTheme: 'Focus as a spiritual discipline',
  },
  {
    day: 29,
    phase: 'rising',
    primaryPrinciple: 11, // Brain Reserve
    secondaryPrinciples: [3, 7],
    recommendedGames: ['pattern_peace', 'body_scan'],
    brainFocus: 'Cognitive Enhancement',
    devotionalTheme: 'Growing stronger daily',
  },
  {
    day: 30,
    phase: 'rising',
    primaryPrinciple: 2, // Better Brain = Better Life
    secondaryPrinciples: [12, 11],
    recommendedGames: ['pattern_peace', 'gratitude', 'scripture_palace'],
    brainFocus: 'Midpoint Celebration',
    devotionalTheme: '30 days of transformation',
  },
  {
    day: 31,
    phase: 'rising',
    primaryPrinciple: 10, // Personalization
    secondaryPrinciples: [9, 8],
    recommendedGames: ['pattern_peace', 'body_scan', 'breathing'],
    brainFocus: 'Personal Insights',
    devotionalTheme: 'Knowing yourself through God\'s eyes',
  },
  {
    day: 32,
    phase: 'rising',
    primaryPrinciple: 7, // Help vs Harm
    secondaryPrinciples: [11, 5],
    recommendedGames: ['pattern_peace', 'thought_detective'],
    brainFocus: 'Sustainable Practices',
    devotionalTheme: 'Habits that last beyond 40 days',
  },
  {
    day: 33,
    phase: 'rising',
    primaryPrinciple: 9, // Knowledge is Power
    secondaryPrinciples: [12, 10],
    recommendedGames: ['pattern_peace', 'scripture_palace', 'body_scan'],
    brainFocus: 'Rising Phase Integration',
    devotionalTheme: 'Wisdom gained, strength built',
  },

  // ========================================
  // BECOMING PHASE (Days 34-40)
  // Focus: Integration, Identity, Future
  // ========================================
  {
    day: 34,
    phase: 'becoming',
    primaryPrinciple: 12, // Brain First
    secondaryPrinciples: [2, 10],
    recommendedGames: ['pattern_peace', 'breathing', 'gratitude'],
    brainFocus: 'Identity Transformation',
    devotionalTheme: 'Becoming who God created you to be',
  },
  {
    day: 35,
    phase: 'becoming',
    primaryPrinciple: 2, // Better Brain = Better Life
    secondaryPrinciples: [12, 8],
    recommendedGames: ['pattern_peace', 'breathing', 'thought_detective'],
    brainFocus: 'Life Application',
    devotionalTheme: 'Living from wholeness',
  },
  {
    day: 36,
    phase: 'becoming',
    primaryPrinciple: 8, // Systems Integration
    secondaryPrinciples: [1, 10],
    recommendedGames: ['pattern_peace', 'scripture_palace', 'gratitude'],
    brainFocus: 'Whole-Self Integration',
    devotionalTheme: 'All parts working together',
  },
  {
    day: 37,
    phase: 'becoming',
    primaryPrinciple: 11, // Brain Reserve
    secondaryPrinciples: [7, 5],
    recommendedGames: ['pattern_peace', 'body_scan', 'breathing'],
    brainFocus: 'Future Resilience',
    devotionalTheme: 'Prepared for what comes next',
  },
  {
    day: 38,
    phase: 'becoming',
    primaryPrinciple: 10, // Personalization
    secondaryPrinciples: [9, 12],
    recommendedGames: ['pattern_peace', 'thought_detective', 'gratitude'],
    brainFocus: 'Unique Purpose',
    devotionalTheme: 'Your story for His glory',
  },
  {
    day: 39,
    phase: 'becoming',
    primaryPrinciple: 9, // Knowledge is Power
    secondaryPrinciples: [12, 11],
    recommendedGames: ['pattern_peace', 'scripture_palace', 'body_scan'],
    brainFocus: 'Journey Review',
    devotionalTheme: 'Looking back with gratitude',
  },
  {
    day: 40,
    phase: 'becoming',
    primaryPrinciple: 12, // Brain First
    secondaryPrinciples: [2, 1, 7, 11],
    recommendedGames: ['pattern_peace', 'gratitude', 'breathing', 'body_scan'],
    brainFocus: 'Completion & Continuation',
    devotionalTheme: 'Kintsugi complete - beautiful in brokenness',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getDayMapping(dayNumber: number): DayMapping | undefined {
  return DAY_BRAIN_MAPPING.find(d => d.day === dayNumber);
}

export function getPrincipleById(id: number): BrainPrinciple | undefined {
  return BRAIN_PRINCIPLES.find(p => p.id === id);
}

export function getDayPrinciples(dayNumber: number): BrainPrinciple[] {
  const mapping = getDayMapping(dayNumber);
  if (!mapping) return [];

  const principles: BrainPrinciple[] = [];
  const primary = getPrincipleById(mapping.primaryPrinciple);
  if (primary) principles.push(primary);

  for (const id of mapping.secondaryPrinciples) {
    const principle = getPrincipleById(id);
    if (principle) principles.push(principle);
  }

  return principles;
}

export function getPhasePrinciples(phase: string): BrainPrinciple[] {
  const phaseDays = DAY_BRAIN_MAPPING.filter(d => d.phase === phase);
  const principleIds = new Set<number>();

  for (const day of phaseDays) {
    principleIds.add(day.primaryPrinciple);
    day.secondaryPrinciples.forEach(id => principleIds.add(id));
  }

  return Array.from(principleIds)
    .map(id => getPrincipleById(id))
    .filter((p): p is BrainPrinciple => p !== undefined);
}

// ============================================================================
// Content Templates for "Why This Works" Section
// ============================================================================

export const WHY_THIS_WORKS_TEMPLATES = {
  breathing: {
    principle: 7,
    title: 'The Science of Sacred Breathing',
    content: `When you practice slow, rhythmic breathing, you're directly communicating with your brain through the vagus nerve. This activates your parasympathetic nervous system - the "rest and digest" mode that counters anxiety and stress.

Brain research reminds us that "many things help the brain, many things hurt it." Breath work is one of the most accessible, free, and evidence-based tools for brain health.

In just 3-5 minutes, you can:
• Lower cortisol (stress hormone)
• Activate the prefrontal cortex (decision-making)
• Reduce amygdala reactivity (fear response)
• Improve heart rate variability (resilience marker)`,
  },

  gratitude: {
    principle: 7,
    title: 'Why Gratitude Changes Your Brain',
    content: `Gratitude isn't just positive thinking - it's brain training. When you focus on blessings, you strengthen neural pathways in the prefrontal cortex and limbic system that counter anxiety and depression.

Research shows that what you focus on determines brain patterns. Consistent gratitude practice literally rewires your brain to notice good things more easily.

Studies show that gratitude practice:
• Increases dopamine and serotonin (natural mood elevators)
• Reduces activity in stress-related brain regions
• Strengthens social bonding circuits
• Improves sleep quality`,
  },

  scripture_palace: {
    principle: 3,
    title: 'Memory Palace and Brain Complexity',
    content: `Your hippocampus - the brain's memory center - responds powerfully to spatial and emotional encoding. The Memory Palace technique (Method of Loci) leverages this by anchoring information to places and images.

Neuroscience acknowledges the brain's incredible complexity. By using visual memory techniques, you're working WITH your brain's natural design, not against it.

Scripture memorization through the Memory Palace:
• Strengthens hippocampal connections
• Creates multiple retrieval pathways
• Combines emotional and spatial memory
• Makes recall more natural and lasting`,
  },

  thought_detective: {
    principle: 9,
    title: 'Cognitive Behavioral Transformation',
    content: `Cognitive distortions - like catastrophizing, black-and-white thinking, and personalization - are patterns in the brain that can be identified and changed. This is the core of Cognitive Behavioral Therapy (CBT).

Brain science principle: "understanding your brain helps you fix problems." When you can NAME a distortion, you gain power over it. The prefrontal cortex (rational brain) can override the limbic system (emotional brain) with practice.

The Thought Detective process:
• Activates metacognition (thinking about thinking)
• Strengthens prefrontal cortex control
• Creates pause between stimulus and response
• Builds cognitive flexibility over time`,
  },

  body_scan: {
    principle: 5,
    title: 'The Body-Brain Connection',
    content: `Your body stores stress and trauma in patterns of tension. The interoceptive awareness you develop through body scanning activates the insula - a brain region connecting physical sensations to emotional processing.

Neuroscience emphasizes that "your brain needs proper support." Physical awareness is a form of support - teaching the brain that the body is safe, present, and worthy of attention.

Body Scan Release helps:
• Reduce chronic muscle tension
• Improve interoceptive accuracy (knowing what you feel)
• Release stored trauma from the nervous system
• Strengthen mind-body integration pathways`,
  },

  pattern_peace: {
    principle: 11,
    title: 'Building Brain Reserve Through Focus',
    content: `N-back training targets working memory - your brain's ability to hold and manipulate information. This is primarily a function of the dorsolateral prefrontal cortex, which is also key for focus and emotional regulation.

Brain research teaches us to "build brain reserve to handle stress." Working memory training is like building a bigger buffer - when challenges come, you have more cognitive capacity to respond wisely.

Pattern Peace training:
• Strengthens working memory circuits
• Improves concentration and focus
• Reduces mind-wandering and rumination
• Builds cognitive resilience for future stress`,
  },
};

export default {
  BRAIN_PRINCIPLES,
  DAY_BRAIN_MAPPING,
  WHY_THIS_WORKS_TEMPLATES,
  getDayMapping,
  getPrincipleById,
  getDayPrinciples,
  getPhasePrinciples,
};
