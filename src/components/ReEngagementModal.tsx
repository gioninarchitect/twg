/**
 * Re-Engagement Modal - Gentle Welcome Back
 *
 * Anti-Shame Philosophy:
 * "No guilt. If they miss 14 days, the message is gentle ('No pressure'),
 * offering a choice to Continue or Restart."
 *
 * This modal NEVER shames. It validates their return.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../theme/colors';
import { useProgress } from '../context/ProgressContext';

interface Props {
  visible: boolean;
}

export default function ReEngagementModal({ visible }: Props) {
  const { daysSinceLastActive, totalDaysCompleted, dismissReEngagement } = useProgress();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => dismissReEngagement('continue')}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <LinearGradient
            colors={['#FAF8F5', '#EDE5D8']}
            style={styles.card}
          >
            {/* Warm welcome icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Feather name="sun" size={32} color={COLORS.gold} />
              </View>
            </View>

            {/* Gentle message - NO shame */}
            <Text style={styles.title}>Welcome Back</Text>

            <Text style={styles.message}>
              It's been a little while.{'\n'}
              <Text style={styles.emphasis}>That's okay.</Text>
            </Text>

            <Text style={styles.subMessage}>
              Life gets heavy sometimes.{'\n'}
              You're here now, and that's what matters.
            </Text>

            {/* Progress reminder (gentle, not accusatory) */}
            {totalDaysCompleted > 0 && (
              <View style={styles.progressReminder}>
                <Text style={styles.progressText}>
                  You've completed {totalDaysCompleted} day{totalDaysCompleted !== 1 ? 's' : ''} of healing.
                </Text>
                <Text style={styles.progressSubtext}>
                  Those days still count.
                </Text>
              </View>
            )}

            {/* Choices - both are valid, no wrong answer */}
            <View style={styles.choices}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => dismissReEngagement('continue')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
                  style={styles.continueGradient}
                >
                  <Feather name="arrow-right" size={20} color={COLORS.earth} />
                  <Text style={styles.continueText}>Continue Where I Left Off</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.restartButton}
                onPress={() => dismissReEngagement('restart')}
                activeOpacity={0.8}
              >
                <Feather name="refresh-cw" size={18} color={COLORS.richBrown} />
                <Text style={styles.restartText}>Start Fresh from Day 1</Text>
              </TouchableOpacity>
            </View>

            {/* Reassurance */}
            <Text style={styles.reassurance}>
              No pressure. No judgment.{'\n'}
              Take the path that feels right.
            </Text>
          </LinearGradient>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(93, 78, 55, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.strong,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.goldLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING.sm,
  },
  emphasis: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  subMessage: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  progressReminder: {
    backgroundColor: COLORS.sageMuted + '30',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.sage,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
  },
  progressSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  choices: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  continueButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.glow,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  continueText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.warmBeige,
  },
  restartText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  reassurance: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
});
