/**
 * Dashboard Screen - Your Healing Journey
 * Premium timeline visualization inspired by Kintsugi
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Platform,
  Image,
} from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS, PHASES } from '../theme/colors';
import { Card, Divider } from '../components/PremiumUI';
import { useProgress } from '../context/ProgressContext';
import { useAccess, GUEST_DAY_LIMIT } from '../context/AccessContext';

// Tea cup logo using actual teacup.png image
function TeaCupIcon({ size = 60 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/teacup.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

import offlineContent from '../../assets/content.json';

const { width } = Dimensions.get('window');

interface DayData {
  day_number: number;
  title: string;
  phase_name: string;
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const {
    currentDayIndex,
    daysCompleted,
    totalDaysCompleted,
    isLoading: progressLoading
  } = useProgress();
  const { canAccessDay, hasFullAccess, getGuestCurrentDay, getTimeUntilNextDay, isLoading: accessLoading } = useAccess();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const days = offlineContent.days as DayData[];

  // Accordion state - start with current phase expanded
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);

  // Determine which phase the current day is in
  useEffect(() => {
    const currentPhase = Object.entries(PHASES).find(([_, phase]) =>
      currentDayIndex >= phase.days[0] && currentDayIndex <= phase.days[1]
    );
    if (currentPhase) {
      setExpandedPhases([currentPhase[0]]);
    }
  }, [currentDayIndex]);

  const togglePhase = (phaseKey: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPhases(prev =>
      prev.includes(phaseKey)
        ? prev.filter(k => k !== phaseKey)
        : [...prev, phaseKey]
    );
  };
  const loading = progressLoading || accessLoading;

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  function getDayStatus(dayNumber: number): 'complete' | 'available' | 'locked' {
    // Check if day is completed
    if (daysCompleted.includes(dayNumber)) {
      return 'complete';
    }
    // Check if day is accessible (based on access level)
    if (canAccessDay(dayNumber)) {
      return 'available';
    }
    return 'locked';
  }

  function getPhaseColor(phaseName: string): string {
    switch (phaseName.toLowerCase()) {
      case 'valley': return COLORS.valley;
      case 'waiting': return COLORS.waiting;
      case 'rising': return COLORS.rising;
      case 'becoming': return COLORS.becoming;
      default: return COLORS.earth;
    }
  }

  const completedCount = totalDaysCompleted;
  const progressPercent = Math.round((completedCount / 40) * 100);
  const currentDay = days.find(d => d.day_number === currentDayIndex);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <TeaCupIcon size={80} />
        <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: SPACING.lg }} />
        <Text style={styles.loadingText}>Preparing your sanctuary...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.title}>Your Healing Journey</Text>
        </View>

        {/* Progress Overview Card */}
        <LinearGradient
          colors={GRADIENTS.earth.colors as [string, string, ...string[]]}
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Days Completed</Text>
              <Text style={styles.progressValue}>{completedCount} of 40</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progressPercent}%` as any }]}
              />
            </View>
          </View>
          <Text style={styles.progressSubtext}>
            Every day matters. Every small step counts.
          </Text>
        </LinearGradient>

        {/* Continue Card */}
        {currentDay && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DayModule', { dayNumber: currentDayIndex })}
          >
            <Card style={styles.continueCard} variant="elevated">
              <View style={styles.continueHeader}>
                <View style={[styles.phaseBadge, { backgroundColor: getPhaseColor(currentDay.phase_name) }]}>
                  <Text style={styles.phaseBadgeText}>{currentDay.phase_name}</Text>
                </View>
                <Feather name="arrow-right" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.continueLabel}>Continue Your Journey</Text>
              <Text style={styles.continueDay}>Day {currentDayIndex}</Text>
              <Text style={styles.continueTitle}>{currentDay.title}</Text>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => navigation.navigate('DayModule', { dayNumber: currentDayIndex })}
              >
                <LinearGradient
                  colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
                  style={styles.continueButtonGradient}
                >
                  <Feather name="book-open" size={18} color={COLORS.earth} />
                  <Text style={styles.continueButtonText}>Begin Today's Reflection</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Card>
          </TouchableOpacity>
        )}

        {/* Brain Games Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('BrainGamesHub')}
        >
          <Card style={styles.brainGamesCard} variant="glass">
            <View style={styles.brainGamesHeader}>
              <View style={styles.brainGamesIcon}>
                <Feather name="zap" size={24} color={COLORS.gold} />
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.brainGamesTitle}>Brain Games</Text>
            <Text style={styles.brainGamesDesc}>Healing exercises for your mind</Text>
            <View style={styles.brainGamesBadges}>
              <View style={styles.brainGameBadge}>
                <Feather name="wind" size={14} color={COLORS.sage} />
                <Text style={styles.brainGameBadgeText}>Breathe</Text>
              </View>
              <View style={styles.brainGameBadge}>
                <Feather name="heart" size={14} color={COLORS.rising} />
                <Text style={styles.brainGameBadgeText}>Gratitude</Text>
              </View>
              <View style={styles.brainGameBadge}>
                <Feather name="book" size={14} color={COLORS.dustyBlue} />
                <Text style={styles.brainGameBadgeText}>Scripture</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Phase Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>The 40-Day Architecture</Text>
          <Text style={styles.sectionSubtitle}>Your path from ruin to rising</Text>

          {/* Phase Cards */}
          {Object.entries(PHASES).map(([key, phase], index) => {
            const phaseDays = days.filter(d => {
              const num = d.day_number;
              return num >= phase.days[0] && num <= phase.days[1];
            });
            const phaseCompleted = phaseDays.filter(d => getDayStatus(d.day_number) === 'complete').length;
            const phaseTotal = phase.days[1] - phase.days[0] + 1;

            return (
              <View key={key} style={styles.phaseCard}>
                <View style={styles.phaseHeaderRow}>
                  <View style={styles.phaseIndicator}>
                    <LinearGradient
                      colors={phase.gradient.colors as [string, string, ...string[]]}
                      style={styles.phaseCircle}
                    >
                      <Text style={styles.phaseNumber}>{index + 1}</Text>
                    </LinearGradient>
                    {index < 3 && <View style={styles.phaseLine} />}
                  </View>
                  <View style={styles.phaseInfo}>
                    <View style={styles.phaseNameRow}>
                      <Text style={styles.phaseName}>{phase.name}</Text>
                      <Text style={styles.phaseDays}>Days {phase.days[0]}-{phase.days[1]}</Text>
                    </View>
                    <View style={styles.phaseProgress}>
                      <View style={styles.phaseProgressBar}>
                        <View
                          style={[
                            styles.phaseProgressFill,
                            {
                              width: `${(phaseCompleted / phaseTotal) * 100}%` as any,
                              backgroundColor: phase.color,
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.phaseProgressText}>{phaseCompleted}/{phaseTotal}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <Divider variant="decorative" style={styles.divider} />

        {/* Vertical Timeline */}
        <View style={styles.timelineVertical}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <Text style={styles.sectionSubtitle}>40 days of transformation</Text>

          {/* Timeline grouped by phase - Accordion Style */}
          {Object.entries(PHASES).map(([phaseKey, phase]) => {
            const phaseDays = days.filter(d => {
              const num = d.day_number;
              return num >= phase.days[0] && num <= phase.days[1];
            });
            const isExpanded = expandedPhases.includes(phaseKey);
            const phaseCompleted = phaseDays.filter(d => getDayStatus(d.day_number) === 'complete').length;
            const phaseTotal = phaseDays.length;

            return (
              <View key={phaseKey} style={styles.timelinePhase}>
                {/* Phase Header - Accordion Toggle */}
                <TouchableOpacity
                  style={[styles.timelinePhaseHeader, styles.accordionHeader]}
                  onPress={() => togglePhase(phaseKey)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.timelinePhaseMarker, { backgroundColor: phase.color }]} />
                  <View style={styles.accordionTitleWrap}>
                    <Text style={[styles.timelinePhaseName, { color: phase.color }]}>{phase.name}</Text>
                    <Text style={styles.accordionSubtitle}>Days {phase.days[0]}-{phase.days[1]} • {phaseCompleted}/{phaseTotal}</Text>
                  </View>
                  <Feather
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={phase.color}
                  />
                </TouchableOpacity>

                {/* Days in this phase - Collapsible */}
                {isExpanded && phaseDays.map((day, dayIndex) => {
                  const status = getDayStatus(day.day_number);
                  const isAccessible = status !== 'locked';
                  const isCurrent = day.day_number === currentDayIndex;
                  const isLast = dayIndex === phaseDays.length - 1;

                  return (
                    <TouchableOpacity
                      key={day.day_number}
                      style={styles.timelineItem}
                      onPress={() => {
                        if (isAccessible) {
                          navigation.navigate('DayModule', { dayNumber: day.day_number });
                        }
                      }}
                      disabled={!isAccessible}
                      activeOpacity={0.7}
                    >
                      {/* Vertical line connector */}
                      <View style={styles.timelineConnector}>
                        <View style={[
                          styles.timelineNode,
                          status === 'complete' && styles.timelineNodeComplete,
                          isCurrent && styles.timelineNodeCurrent,
                          status === 'locked' && styles.timelineNodeLocked,
                        ]}>
                          {status === 'complete' ? (
                            <Feather name="check" size={12} color="#0D0D0D" />
                          ) : isCurrent ? (
                            <View style={styles.timelineNodePulse} />
                          ) : status === 'locked' ? (
                            <Feather name="lock" size={10} color={COLORS.textMuted} />
                          ) : (
                            <Text style={styles.timelineNodeNumber}>{day.day_number}</Text>
                          )}
                        </View>
                        {!isLast && (
                          <View style={[
                            styles.timelineLine,
                            status === 'complete' && styles.timelineLineComplete,
                          ]} />
                        )}
                      </View>

                      {/* Day content */}
                      <View style={[
                        styles.timelineContent,
                        isCurrent && styles.timelineContentCurrent,
                        status === 'locked' && styles.timelineContentLocked,
                      ]}>
                        <View style={styles.timelineContentInner}>
                          <View style={styles.timelineContentHeader}>
                            <Text style={[
                              styles.timelineDayLabel,
                              status === 'locked' && styles.textLocked,
                            ]}>
                              Day {day.day_number}
                            </Text>
                            {isCurrent && (
                              <View style={styles.currentBadge}>
                                <Text style={styles.currentBadgeText}>TODAY</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[
                            styles.timelineDayTitle,
                            status === 'locked' && styles.textLocked,
                          ]} numberOfLines={2}>
                            {day.title}
                          </Text>
                        </View>
                        {isAccessible && !isCurrent && (
                          <Feather name="chevron-right" size={16} color={COLORS.textMuted} style={styles.timelineArrow} />
                        )}
                        {isCurrent && (
                          <Feather name="arrow-right" size={18} color={COLORS.gold} style={styles.timelineArrow} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Guest Access Banner */}
        {!hasFullAccess() && (
          <View style={styles.guestBanner}>
            <Feather name="clock" size={16} color={COLORS.gold} />
            <View style={styles.guestBannerContent}>
              <Text style={styles.guestBannerTitle}>
                Preview Mode - Day {getGuestCurrentDay()} of {GUEST_DAY_LIMIT}
              </Text>
              {getTimeUntilNextDay() ? (
                <Text style={styles.guestBannerText}>
                  Next day unlocks in {getTimeUntilNextDay()?.hours}h {getTimeUntilNextDay()?.minutes}m
                </Text>
              ) : getGuestCurrentDay() >= GUEST_DAY_LIMIT ? (
                <Text style={styles.guestBannerText}>
                  Preview complete! Unlock all 40 days with your book code.
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontSize: TYPOGRAPHY.sizes.md,
    fontStyle: 'italic',
  },
  header: {
    marginBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: '300',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    marginTop: SPACING.xs,
    letterSpacing: -1,
  },
  // Glass morphism progress card
  progressCard: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    ...SHADOWS.medium,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 48,
    fontWeight: '200',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    marginTop: SPACING.xs,
  },
  progressCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  progressPercent: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  progressBarContainer: {
    marginBottom: SPACING.md,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  // Glass morphism continue card
  continueCard: {
    marginBottom: SPACING.xl,
    padding: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.xxl,
  },
  continueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  phaseBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  phaseBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  continueLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  continueDay: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  continueTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '400',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
    lineHeight: 32,
  },
  continueButton: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
  },
  continueButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: '#0D0D0D',
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  // Brain Games card styles
  brainGamesCard: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
  },
  brainGamesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  brainGamesIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainGamesTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  brainGamesDesc: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  brainGamesBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  brainGameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  brainGameBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
  },
  timelineSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '400',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    marginBottom: SPACING.xl,
  },
  // Glass phase cards
  phaseCard: {
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  phaseHeaderRow: {
    flexDirection: 'row',
  },
  phaseIndicator: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  phaseCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  phaseNumber: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: '#0D0D0D',
    fontFamily: TYPOGRAPHY.ui,
  },
  phaseLine: {
    width: 2,
    height: 32,
    backgroundColor: COLORS.borderSubtle,
    marginTop: SPACING.sm,
  },
  phaseInfo: {
    flex: 1,
    paddingTop: SPACING.xs,
  },
  phaseNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  phaseName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '500',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  phaseDays: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
  phaseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  phaseProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  phaseProgressText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    minWidth: 36,
    textAlign: 'right',
  },
  divider: {
    marginVertical: SPACING.xl,
  },
  // Vertical Timeline Styles
  timelineVertical: {
    marginBottom: SPACING.xl,
  },
  timelinePhase: {
    marginBottom: SPACING.lg,
  },
  timelinePhaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingLeft: 8,
  },
  accordionHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  accordionTitleWrap: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  accordionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  timelinePhaseMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  timelinePhaseName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  timelinePhaseLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginLeft: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 72,
  },
  timelineConnector: {
    width: 40,
    alignItems: 'center',
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: COLORS.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineNodeComplete: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  timelineNodeCurrent: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: COLORS.gold,
    borderWidth: 3,
  },
  timelineNodeLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelineNodePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
  },
  timelineNodeNumber: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: 4,
  },
  timelineLineComplete: {
    backgroundColor: COLORS.gold,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginLeft: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineContentCurrent: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  timelineContentLocked: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  timelineContentInner: {
    flex: 1,
  },
  timelineContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineDayLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0D0D0D',
    fontFamily: TYPOGRAPHY.ui,
    letterSpacing: 1,
  },
  timelineDayTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    flex: 1,
    lineHeight: 20,
  },
  timelineArrow: {
    marginLeft: SPACING.sm,
  },
  textLocked: {
    color: COLORS.textMuted,
  },
  // Glass guest banner
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  guestBannerContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  guestBannerTitle: {
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  guestBannerText: {
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 20,
  },
});
