/**
 * Day Module Screen - The Daily Ritual
 * Immersive devotional reading experience
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../theme/colors';
import { audioService, DAILY_AUDIO_TRACKS } from '../services/audioService';
import { useProgress, PSYCHOLOGY_DAYS } from '../context/ProgressContext';
import { Divider } from '../components/PremiumUI';
import AudioPlayer from '../components/AudioPlayer';
import JournalInput from '../components/JournalInput';

import offlineContent from '../../assets/content.json';
import psychologyModules from '../../assets/data/psychology.json';
import { GameRecommendation } from '../components/brainGames';

// Get psychology module for a specific day (only certain days have modules)
function getPsychologyModule(dayNumber: number) {
  if (!PSYCHOLOGY_DAYS.includes(dayNumber)) return null;
  return psychologyModules.modules.find(m => m.dayNumber === dayNumber) || null;
}

const { width } = Dimensions.get('window');

interface DayContent {
  day_number: number;
  title: string;
  phase_name: string;
  reflection_content: string;
  scripture_text: string;
  scripture_reference: string;
  thought_of_day: string;
  prayer_text: string;
  journal_prompt: string;
}

export default function DayModuleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { dayNumber } = route.params;

  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<DayContent | null>(null);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [psychologyUnlocked, setPsychologyUnlocked] = useState(false);
  const [psychologyExpanded, setPsychologyExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'devotional' | 'journal'>('devotional');

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const psychologyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDay();
  }, [dayNumber]);

  useEffect(() => {
    if (!loading && day) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, day]);

  useEffect(() => {
    Animated.timing(psychologyAnim, {
      toValue: psychologyExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [psychologyExpanded]);

  function loadDay() {
    // Purely local - load from bundled JSON file
    const offlineDay = offlineContent.days.find(d => d.day_number === dayNumber);
    if (offlineDay) {
      setDay(offlineDay as DayContent);
    }
    setLoading(false);
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const depth = Math.round((contentOffset.y / (contentSize.height - layoutMeasurement.height)) * 100);
    setScrollDepth(Math.min(100, Math.max(0, depth)));

    // Unlock psychology at 90% scroll (only if this day has a module)
    if (depth >= 90 && !psychologyUnlocked && PSYCHOLOGY_DAYS.includes(dayNumber)) {
      setPsychologyUnlocked(true);
    }
  }

  // Use ProgressContext for completion
  const { completeDay: markDayComplete } = useProgress();

  async function handleCompleteDay() {
    await markDayComplete(dayNumber);
    navigation.goBack();
  }

  function getPhaseColor(phaseName: string): string {
    switch (phaseName?.toLowerCase()) {
      case 'valley': return COLORS.valley;
      case 'waiting': return COLORS.waiting;
      case 'rising': return COLORS.rising;
      case 'becoming': return COLORS.becoming;
      default: return COLORS.earth;
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <View style={styles.bowlShape}>
            <View style={styles.goldCrack} />
          </View>
        </View>
        <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: SPACING.lg }} />
        <Text style={styles.loadingText}>Opening today's reflection...</Text>
      </View>
    );
  }

  if (!day) {
    return (
      <View style={styles.loadingContainer}>
        <Feather name="alert-circle" size={48} color={COLORS.mutedTerracotta} />
        <Text style={styles.errorText}>Could not load this day's content.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'devotional' && styles.tabActive]}
          onPress={() => setActiveTab('devotional')}
        >
          <Feather
            name="book-open"
            size={18}
            color={activeTab === 'devotional' ? COLORS.gold : COLORS.mutedBrown}
          />
          <Text style={[styles.tabText, activeTab === 'devotional' && styles.tabTextActive]}>
            Devotional
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'journal' && styles.tabActive]}
          onPress={() => setActiveTab('journal')}
        >
          <Feather
            name="edit-3"
            size={18}
            color={activeTab === 'journal' ? COLORS.gold : COLORS.mutedBrown}
          />
          <Text style={[styles.tabText, activeTab === 'journal' && styles.tabTextActive]}>
            Journal
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'devotional' ? (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.phaseBadge, { backgroundColor: getPhaseColor(day.phase_name) }]}>
                <Text style={styles.phaseBadgeText}>{day.phase_name}</Text>
              </View>
              <Text style={styles.dayLabel}>Day {day.day_number}</Text>
              <Text style={styles.dayTitle}>{day.title}</Text>
            </View>

            {/* Audio Player - Shows when audio track is available for this day */}
            {DAILY_AUDIO_TRACKS[dayNumber] && (
              <View style={styles.audioSection}>
                <AudioPlayer
                  uri={DAILY_AUDIO_TRACKS[dayNumber].uri}
                  title={DAILY_AUDIO_TRACKS[dayNumber].title}
                  subtitle={DAILY_AUDIO_TRACKS[dayNumber].subtitle}
                  dayNumber={dayNumber}
                  variant="full"
                />
              </View>
            )}

            {/* Reflection Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Feather name="book-open" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.sectionTitle}>Reflection</Text>
              </View>
              <Text style={styles.reflectionText}>{day.reflection_content}</Text>
            </View>

            <Divider variant="decorative" />

            {/* Scripture Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Feather name="bookmark" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.sectionTitle}>Scripture</Text>
              </View>
              <View style={styles.scriptureCard}>
                <Text style={styles.scriptureText}>"{day.scripture_text}"</Text>
                <Text style={styles.scriptureRef}>— {day.scripture_reference}</Text>
              </View>
            </View>

            <Divider variant="decorative" />

            {/* Thought of the Day */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Feather name="sun" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.sectionTitle}>Thought of the Day</Text>
              </View>
              <View style={styles.thoughtCard}>
                <Text style={styles.thoughtText}>{day.thought_of_day}</Text>
              </View>
            </View>

            <Divider variant="decorative" />

            {/* Prayer Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Feather name="heart" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.sectionTitle}>Prayer</Text>
              </View>
              <View style={styles.prayerCard}>
                <Text style={styles.prayerText}>{day.prayer_text}</Text>
              </View>
            </View>

            <Divider variant="decorative" />

            {/* Brain Games Recommendation - Contextual exercises */}
            <GameRecommendation
              currentDay={dayNumber}
              variant="compact"
              maxRecommendations={3}
            />

            {/* Psychology Unlock Section - Only shows on specific days with modules */}
            {psychologyUnlocked && getPsychologyModule(dayNumber) && (
              <View style={styles.psychologySection}>
                <TouchableOpacity
                  style={styles.psychologyHeader}
                  onPress={() => setPsychologyExpanded(!psychologyExpanded)}
                  activeOpacity={0.8}
                >
                  <View style={styles.psychologyHeaderLeft}>
                    <View style={styles.psychologyIcon}>
                      <Feather name="info" size={18} color={COLORS.dustyBlue} />
                    </View>
                    <View>
                      <Text style={styles.psychologyTitle}>Why This Works</Text>
                      <Text style={styles.psychologySubtitle}>
                        {getPsychologyModule(dayNumber)?.subtitle || 'The Science Behind Today'}
                      </Text>
                    </View>
                  </View>
                  <Feather
                    name={psychologyExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.dustyBlue}
                  />
                </TouchableOpacity>
                {psychologyExpanded && (
                  <View style={styles.psychologyContent}>
                    {/* Module Title */}
                    <Text style={styles.psychologyModuleTitle}>
                      {getPsychologyModule(dayNumber)?.title}
                    </Text>

                    {/* The Science */}
                    <Text style={styles.psychologyText}>
                      {getPsychologyModule(dayNumber)?.science}
                    </Text>

                    {/* Application */}
                    <View style={styles.applicationCard}>
                      <Text style={styles.applicationLabel}>What This Means For You</Text>
                      <Text style={styles.applicationText}>
                        {getPsychologyModule(dayNumber)?.application}
                      </Text>
                    </View>

                    {/* Key Insight */}
                    <View style={styles.keyInsightCard}>
                      <Feather name="key" size={16} color={COLORS.gold} />
                      <Text style={styles.keyInsightText}>
                        {getPsychologyModule(dayNumber)?.keyInsight}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Progress Indicator */}
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Reading Progress</Text>
                <Text style={styles.progressValue}>{scrollDepth}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${scrollDepth}%` as any }]} />
              </View>
              {scrollDepth >= 90 && (
                <TouchableOpacity style={styles.completeButton} onPress={handleCompleteDay}>
                  <View style={styles.completeButtonInner}>
                    <Feather name="check-circle" size={20} color={COLORS.gold} />
                    <Text style={styles.completeButtonText}>Complete Day {dayNumber}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ height: 100 }} />
          </Animated.View>
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={styles.journalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.journalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.journalHeader}>
              <Feather name="edit-3" size={24} color={COLORS.gold} />
              <Text style={styles.journalTitle}>Your Journal</Text>
              <Text style={styles.journalDate}>Day {dayNumber}</Text>
            </View>

            <JournalInput
              dayNumber={dayNumber}
              prompt={day.journal_prompt}
              placeholder="Write your thoughts here... This is your safe space."
            />

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },
  loadingIcon: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bowlShape: {
    width: 50,
    height: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: COLORS.earth,
    backgroundColor: COLORS.warmBeige,
    position: 'relative',
    overflow: 'hidden',
  },
  goldCrack: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: COLORS.gold,
    top: 2,
    left: 24,
    transform: [{ rotate: '5deg' }],
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontSize: TYPOGRAPHY.sizes.md,
    fontStyle: 'italic',
  },
  errorText: {
    marginTop: SPACING.lg,
    color: COLORS.mutedTerracotta,
    fontFamily: TYPOGRAPHY.ui,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.warmBeige,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.cream,
    ...SHADOWS.soft,
  },
  tabText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.gold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  audioSection: {
    marginBottom: SPACING.xl,
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  phaseBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  dayTitle: {
    fontSize: TYPOGRAPHY.sizes.display,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    marginTop: SPACING.xs,
    lineHeight: TYPOGRAPHY.sizes.display * 1.2,
  },
  section: {
    marginVertical: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.goldLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  reflectionText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    lineHeight: TYPOGRAPHY.sizes.lg * 1.9,
  },
  scriptureCard: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  scriptureText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.sizes.lg * 1.7,
  },
  scriptureRef: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.md,
    textAlign: 'right',
  },
  thoughtCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: COLORS.gold,
    ...SHADOWS.goldGlow,
  },
  thoughtText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.xl * 1.4,
  },
  prayerCard: {
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  prayerText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.sizes.lg * 1.8,
  },
  psychologySection: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.dustyBlueMuted + '30',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  psychologyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  psychologyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  psychologyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dustyBlue + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  psychologyTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.dustyBlue,
    fontFamily: TYPOGRAPHY.ui,
  },
  psychologySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  psychologyContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  psychologyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * 1.7,
    marginBottom: SPACING.lg,
  },
  psychologyModuleTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.dustyBlue,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },
  applicationCard: {
    backgroundColor: COLORS.sageMuted + '30',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  applicationLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.sage,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  applicationText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },
  keyInsightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.goldLight + '30',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  keyInsightText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '500',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },
  progressSection: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  progressValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.cream,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 3,
  },
  completeButton: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  completeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: RADIUS.lg,
  },
  completeButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  journalContainer: {
    flex: 1,
  },
  journalContent: {
    padding: SPACING.lg,
  },
  journalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  journalTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.sm,
  },
  journalDate: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
});
