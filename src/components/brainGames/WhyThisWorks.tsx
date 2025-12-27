/**
 * Why This Works Modal
 * Displays science-backed explanations for each brain game
 * Based on Dr. Amen, Porges, van der Kolk, and Neff research
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme/colors';
import { GameId } from '../../worldModel/types';

// ============================================
// SCIENCE CONTENT FOR EACH GAME
// ============================================

interface ScienceContent {
  title: string;
  theory: string;
  explanation: string;
  benefits: string[];
  research: {
    author: string;
    finding: string;
  }[];
  practicalTip: string;
}

const SCIENCE_CONTENT: Record<GameId, ScienceContent> = {
  breathing: {
    title: 'The Science of Breath',
    theory: 'Polyvagal Theory',
    explanation:
      'When you extend your exhale longer than your inhale, you activate the parasympathetic nervous system through the vagus nerve. This signals safety to your brain and body, reducing stress hormones and promoting calm.',
    benefits: [
      'Lowers cortisol (stress hormone)',
      'Activates the vagus nerve',
      'Reduces heart rate and blood pressure',
      'Improves heart rate variability (HRV)',
      'Promotes feelings of safety and calm',
    ],
    research: [
      {
        author: 'Dr. Stephen Porges',
        finding: 'The vagus nerve is the key pathway between breath and emotional regulation.',
      },
      {
        author: 'Gerritsen & Band (2018)',
        finding: 'Controlled breathing practices significantly reduce stress and anxiety.',
      },
    ],
    practicalTip: 'For maximum benefit, make your exhale twice as long as your inhale (e.g., 4 seconds in, 8 seconds out).',
  },
  gratitude: {
    title: 'The Neuroscience of Gratitude',
    theory: 'Positive Psychology',
    explanation:
      'Gratitude practices physically rewire your brain. When you focus on what you\'re thankful for, you activate the prefrontal cortex and release dopamine and serotonin - the same neurotransmitters targeted by antidepressants.',
    benefits: [
      'Increases dopamine and serotonin',
      'Strengthens neural pathways for positivity',
      'Reduces activity in the amygdala (fear center)',
      'Improves sleep quality',
      'Builds resilience against depression',
    ],
    research: [
      {
        author: 'Dr. Robert Emmons',
        finding: 'People who practice gratitude consistently report 25% more happiness.',
      },
      {
        author: 'Kini et al. (2016)',
        finding: 'Gratitude practice changes brain structure, increasing gray matter in regions linked to empathy and decision-making.',
      },
    ],
    practicalTip: 'Be specific about WHY you\'re grateful. "I\'m grateful for my friend Sarah because she listened when I needed to talk" is more powerful than "I\'m grateful for friends."',
  },
  scripture_palace: {
    title: 'Memory Palace Science',
    theory: 'Method of Loci',
    explanation:
      'The Method of Loci is a 2,500-year-old memory technique used by ancient Greek orators. By placing information in imagined physical locations, you leverage your brain\'s powerful spatial memory system - the same system that helps you navigate your home in the dark.',
    benefits: [
      'Uses spatial memory (hippocampus)',
      'Creates strong visual associations',
      'Enables long-term retention',
      'Improves recall speed',
      'Makes abstract concepts concrete',
    ],
    research: [
      {
        author: 'Maguire et al. (2003)',
        finding: 'Memory champions use spatial memory regions, not special brain structures.',
      },
      {
        author: 'Legge et al. (2012)',
        finding: 'The Method of Loci improves recall by 2-3x compared to rote memorization.',
      },
    ],
    practicalTip: 'Make your mental images bizarre and emotional. A giant glowing Bible falling from the ceiling is more memorable than a book on a table.',
  },
  thought_detective: {
    title: 'Cognitive Restructuring',
    theory: 'Cognitive Behavioral Therapy (CBT)',
    explanation:
      'Negative automatic thoughts (ANTs) are rapid, unconscious interpretations that distort reality. By identifying these thought patterns and examining evidence, you can literally rewire the neural pathways that generate anxious or depressive thinking.',
    benefits: [
      'Breaks automatic negative thought cycles',
      'Builds metacognition (thinking about thinking)',
      'Reduces anxiety and depression symptoms',
      'Creates new neural pathways',
      'Increases sense of control',
    ],
    research: [
      {
        author: 'Dr. Daniel Amen',
        finding: 'Identified 9 types of ANTs (Automatic Negative Thoughts) that distort thinking.',
      },
      {
        author: 'Beck et al. (1979)',
        finding: 'CBT is as effective as medication for mild-moderate depression, with longer-lasting effects.',
      },
    ],
    practicalTip: 'Ask yourself: "Would I say this to a friend?" We\'re often much harsher with ourselves than we would be with someone we love.',
  },
  body_scan: {
    title: 'Somatic Awareness',
    theory: 'Somatic Experiencing',
    explanation:
      'Trauma and stress get stored in the body as muscle tension, shallow breathing, and nervous system dysregulation. By gently scanning your body and noticing sensations without judgment, you help release stored tension and restore the body\'s natural regulation.',
    benefits: [
      'Releases stored muscle tension',
      'Increases interoceptive awareness',
      'Regulates the autonomic nervous system',
      'Reduces chronic pain',
      'Processes stored emotional experiences',
    ],
    research: [
      {
        author: 'Dr. Bessel van der Kolk',
        finding: '"The body keeps the score" - trauma is stored somatically and must be released through the body.',
      },
      {
        author: 'Price & Hooven (2018)',
        finding: 'Interoceptive awareness (body sensing) is linked to better emotional regulation.',
      },
    ],
    practicalTip: 'If you find an area of tension, don\'t try to force it to relax. Simply breathe into it with curiosity and let it release in its own time.',
  },
  pattern_peace: {
    title: 'Cognitive Training',
    theory: 'Working Memory & Attention',
    explanation:
      'Pattern recognition exercises strengthen working memory - the mental workspace where you hold and manipulate information. Like physical exercise for your brain, regular practice increases focus, mental flexibility, and processing speed.',
    benefits: [
      'Strengthens working memory capacity',
      'Improves sustained attention',
      'Increases processing speed',
      'Enhances cognitive flexibility',
      'Builds focused concentration',
    ],
    research: [
      {
        author: 'Jaeggi et al. (2008)',
        finding: 'Working memory training can improve fluid intelligence (problem-solving ability).',
      },
      {
        author: 'Dr. Daniel Amen',
        finding: 'Brain exercises that challenge focus and memory increase blood flow to the prefrontal cortex.',
      },
    ],
    practicalTip: 'Start at a comfortable difficulty and gradually increase. Frustration helps growth, but overwhelm doesn\'t - find your "challenge zone."',
  },
};

// ============================================
// COMPONENT PROPS
// ============================================

interface WhyThisWorksProps {
  visible: boolean;
  gameId: GameId;
  onClose: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WhyThisWorks({ visible, gameId, onClose }: WhyThisWorksProps) {
  const content = SCIENCE_CONTENT[gameId];

  if (!content) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={['#D4AF37', '#B8860B']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Ionicons name="bulb" size={24} color={COLORS.cream} />
              <Text style={styles.headerTitle}>Why This Works</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.cream} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Title & Theory */}
            <Text style={styles.title}>{content.title}</Text>
            <View style={styles.theoryBadge}>
              <Ionicons name="flask" size={14} color={COLORS.gold} />
              <Text style={styles.theoryText}>{content.theory}</Text>
            </View>

            {/* Explanation */}
            <Text style={styles.explanation}>{content.explanation}</Text>

            {/* Benefits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Benefits</Text>
              {content.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.sage} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* Research */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Research</Text>
              {content.research.map((study, index) => (
                <View key={index} style={styles.researchCard}>
                  <Text style={styles.researchAuthor}>{study.author}</Text>
                  <Text style={styles.researchFinding}>"{study.finding}"</Text>
                </View>
              ))}
            </View>

            {/* Practical Tip */}
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Ionicons name="star" size={18} color={COLORS.gold} />
                <Text style={styles.tipTitle}>Practical Tip</Text>
              </View>
              <Text style={styles.tipText}>{content.practicalTip}</Text>
            </View>

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              This exercise is for educational purposes. It is not a substitute for
              professional mental health treatment.
            </Text>
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <Text style={styles.continueText}>Continue to Exercise</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// TRIGGER BUTTON COMPONENT
// ============================================

interface WhyThisWorksButtonProps {
  onPress: () => void;
  style?: object;
}

export function WhyThisWorksButton({ onPress, style }: WhyThisWorksButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.triggerButton, style]}
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="bulb-outline" size={18} color={COLORS.gold} />
      <Text style={styles.triggerText}>Why This Works</Text>
    </TouchableOpacity>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    ...SHADOWS.strong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    maxHeight: 500,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.sm,
  },
  theoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.goldLight + '30',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
  },
  theoryText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gold,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
  },
  explanation: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * 1.4,
  },
  researchCard: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  researchAuthor: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xs,
  },
  researchFinding: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.sizes.sm * 1.5,
  },
  tipCard: {
    backgroundColor: COLORS.goldLight + '20',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    marginBottom: SPACING.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tipTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  tipText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: COLORS.earth,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  continueText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
  },
  // Trigger button
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.goldLight + '20',
    borderRadius: RADIUS.full,
  },
  triggerText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gold,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.ui,
  },
});

export default WhyThisWorks;
