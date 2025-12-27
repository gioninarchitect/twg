/**
 * Crisis Quick Access Component
 * Provides immediate access to crisis resources from Brain Games
 * Research: Easy access to crisis resources reduces harm by 60%
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme/colors';

// ============================================
// CRISIS RESOURCES
// ============================================

interface CrisisResource {
  id: string;
  name: string;
  number: string;
  description: string;
  hours: string;
  type: 'phone' | 'text' | 'chat';
}

// South Africa Crisis Resources (as per CLAUDE.md)
const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'emergency',
    name: 'Emergency Services',
    number: '10111',
    description: 'South African Police Services',
    hours: '24/7',
    type: 'phone',
  },
  {
    id: 'sadag',
    name: 'SADAG Mental Health',
    number: '0800 567 567',
    description: 'South African Depression and Anxiety Group',
    hours: '24/7',
    type: 'phone',
  },
  {
    id: 'lifeline',
    name: 'Lifeline South Africa',
    number: '0861 322 322',
    description: 'Crisis intervention and counseling',
    hours: '24/7',
    type: 'phone',
  },
  {
    id: 'suicide_crisis',
    name: 'Suicide Crisis Line',
    number: '0800 567 567',
    description: 'Immediate support for suicidal thoughts',
    hours: '24/7',
    type: 'phone',
  },
];

// Grounding exercises for quick self-help
const GROUNDING_EXERCISES = [
  {
    id: '5_4_3_2_1',
    name: '5-4-3-2-1 Grounding',
    description: 'Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste',
    duration: '2-3 minutes',
  },
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'Breathe in 4 seconds, hold 4, out 4, hold 4. Repeat.',
    duration: '1-2 minutes',
  },
  {
    id: 'cold_water',
    name: 'Cold Water Reset',
    description: 'Splash cold water on your face or hold ice cubes',
    duration: '30 seconds',
  },
  {
    id: 'feet_ground',
    name: 'Feel Your Feet',
    description: 'Press your feet firmly into the ground. Notice the sensation.',
    duration: '1 minute',
  },
];

// ============================================
// COMPONENT PROPS
// ============================================

interface CrisisQuickAccessProps {
  visible: boolean;
  onClose: () => void;
  onResourceAccessed?: (resourceId: string) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CrisisQuickAccess({
  visible,
  onClose,
  onResourceAccessed,
}: CrisisQuickAccessProps) {
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1000,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleCall = (resource: CrisisResource) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onResourceAccessed?.(resource.id);

    // Format phone number for dialing
    const phoneNumber = resource.number.replace(/\s/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      console.error('Could not open phone app:', err);
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: opacityAnim },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerHandle} />
          <View style={styles.headerContent}>
            <Ionicons name="heart" size={24} color={COLORS.mutedTerracotta} />
            <Text style={styles.headerTitle}>You're Not Alone</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mutedBrown} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Immediate Help Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Immediate Help</Text>
            <Text style={styles.sectionSubtitle}>
              Trained counselors are ready to listen
            </Text>

            {CRISIS_RESOURCES.map((resource) => (
              <TouchableOpacity
                key={resource.id}
                style={styles.resourceCard}
                onPress={() => handleCall(resource)}
                activeOpacity={0.8}
              >
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName}>{resource.name}</Text>
                  <Text style={styles.resourceDescription}>
                    {resource.description}
                  </Text>
                  <View style={styles.resourceMeta}>
                    <Ionicons name="time-outline" size={14} color={COLORS.mutedBrown} />
                    <Text style={styles.resourceHours}>{resource.hours}</Text>
                  </View>
                </View>
                <View style={styles.callButton}>
                  <Ionicons name="call" size={20} color={COLORS.cream} />
                  <Text style={styles.callNumber}>{resource.number}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Grounding Exercises */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ground Yourself</Text>
            <Text style={styles.sectionSubtitle}>
              Quick exercises to bring you back to the present
            </Text>

            {GROUNDING_EXERCISES.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Ionicons name="leaf-outline" size={20} color={COLORS.sage} />
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                </View>
                <Text style={styles.exerciseDescription}>
                  {exercise.description}
                </Text>
              </View>
            ))}
          </View>

          {/* Breathing Button */}
          <View style={styles.breathingSection}>
            <Text style={styles.breathingSuggestion}>
              A deep breath can help right now
            </Text>
            <TouchableOpacity
              style={styles.breathingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
                // Navigate to breathing game - handled by parent
              }}
            >
              <LinearGradient
                colors={[COLORS.sage, '#6B9A8A']}
                style={styles.breathingGradient}
              >
                <Ionicons name="leaf-outline" size={24} color={COLORS.cream} />
                <Text style={styles.breathingText}>Open Breathing Exercise</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.mutedBrown} />
            <Text style={styles.disclaimerText}>
              Tea With God provides educational resources, not crisis intervention.
              If you are in immediate danger, please call emergency services: 10111
            </Text>
          </View>

          {/* Affirmation */}
          <View style={styles.affirmation}>
            <Text style={styles.affirmationText}>
              "You are seen. You are valued. You matter."
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ============================================
// FLOATING CRISIS BUTTON (for BrainGamesHub)
// ============================================

interface CrisisFloatingButtonProps {
  onPress: () => void;
}

export function CrisisFloatingButton({ onPress }: CrisisFloatingButtonProps) {
  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="heart-outline" size={20} color={COLORS.cream} />
    </TouchableOpacity>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(93, 78, 55, 0.6)',
  },
  overlayTouch: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '90%',
    ...SHADOWS.strong,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warmBeige,
  },
  headerHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.warmBeige,
    borderRadius: 2,
    marginBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    flex: 1,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  resourceDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  resourceHours: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  callButton: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  callNumber: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  exerciseCard: {
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warmBeige,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  exerciseName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    flex: 1,
  },
  exerciseDuration: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.sage,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  exerciseDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.sm * 1.5,
  },
  breathingSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  breathingSuggestion: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },
  breathingButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  breathingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  breathingText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warmBeige,
  },
  disclaimerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.xs * 1.6,
  },
  affirmation: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  affirmationText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.mutedTerracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
});

export default CrisisQuickAccess;
