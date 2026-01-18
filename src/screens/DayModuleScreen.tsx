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
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../theme/colors';
import { audioService, DAILY_AUDIO_TRACKS, buildAudioTrack } from '../services/audioService';
import { useProgress, PSYCHOLOGY_DAYS } from '../context/ProgressContext';
import { useAccess } from '../context/AccessContext';
import { useContent } from '../context/ContentContext';
import { Divider } from '../components/PremiumUI';
import AudioPlayer from '../components/AudioPlayer';
import JournalInput from '../components/JournalInput';

import psychologyModules from '../../assets/data/psychology.json';
import { GameRecommendation } from '../components/brainGames';

// Get psychology module for a specific day (only certain days have modules)
function getPsychologyModule(dayNumber: number) {
  if (!PSYCHOLOGY_DAYS.includes(dayNumber)) return null;
  return psychologyModules.modules.find(m => m.dayNumber === dayNumber) || null;
}

const { width } = Dimensions.get('window');

export default function DayModuleScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { dayNumber } = route.params;
  const { codeUsed } = useAccess();
  const { getDay, isLoading: contentLoading, getPhaseName } = useContent();

  // Get day content from ContentContext (language-aware)
  const day = getDay(dayNumber);
  const loading = contentLoading;
  const [scrollDepth, setScrollDepth] = useState(0);
  const [psychologyUnlocked, setPsychologyUnlocked] = useState(false);
  const [psychologyExpanded, setPsychologyExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'devotional' | 'journal'>('devotional');

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const psychologyAnim = useRef(new Animated.Value(0)).current;

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

  if (loading || !day) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>{t('dayModule.loadingReflection')}</Text>
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
            {t('dayModule.devotional')}
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
            {t('dayModule.journal')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Audio Player - Persistent across tab changes */}
      {audioService.hasTrackForDay(dayNumber) && codeUsed && (
        <View style={styles.persistentAudioPlayer}>
          <AudioPlayer
            uri={buildAudioTrack(dayNumber, codeUsed)?.uri || ''}
            title={buildAudioTrack(dayNumber, codeUsed)?.title || ''}
            subtitle={buildAudioTrack(dayNumber, codeUsed)?.subtitle}
            dayNumber={dayNumber}
            variant="compact"
          />
        </View>
      )}

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
                <Text style={styles.phaseBadgeText}>{t(`dashboard.phases.${day.phase_name.toLowerCase()}`)}</Text>
              </View>
              <Text style={styles.dayLabel}>{t('dayModule.day')} {day.day_number}</Text>
              <Text style={styles.dayTitle}>{day.title}</Text>
            </View>

            {/* Reflection Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Feather name="book-open" size={18} color={COLORS.gold} />
                </View>
                <Text style={styles.sectionTitle}>{t('dayModule.reflection')}</Text>
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
                <Text style={styles.sectionTitle}>{t('dayModule.scripture')}</Text>
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
                <Text style={styles.sectionTitle}>{t('dayModule.thoughtOfDay')}</Text>
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
                <Text style={styles.sectionTitle}>{t('dayModule.prayer')}</Text>
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
                      <Text style={styles.psychologyTitle}>{t('dayModule.whyThisWorks')}</Text>
                      <Text style={styles.psychologySubtitle}>
                        {getPsychologyModule(dayNumber)?.subtitle || t('dayModule.scienceBehindToday')}
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
                      <Text style={styles.applicationLabel}>{t('dayModule.whatThisMeansForYou')}</Text>
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
                <Text style={styles.progressLabel}>{t('dayModule.readingProgress')}</Text>
                <Text style={styles.progressValue}>{scrollDepth}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${scrollDepth}%` as any }]} />
              </View>
              {scrollDepth >= 90 && (
                <TouchableOpacity style={styles.completeButton} onPress={handleCompleteDay}>
                  <View style={styles.completeButtonInner}>
                    <Feather name="check-circle" size={20} color={COLORS.gold} />
                    <Text style={styles.completeButtonText}>{t('dayModule.completeDay', { day: dayNumber })}</Text>
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
              <Text style={styles.journalTitle}>{t('dayModule.yourJournal')}</Text>
              <Text style={styles.journalDate}>{t('dayModule.day')} {dayNumber}</Text>
            </View>

            <JournalInput
              dayNumber={dayNumber}
              prompt={day.journal_prompt}
              placeholder={t('dayModule.journalPlaceholder')}
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
    backgroundColor: '#0D0D0D',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  loadingText: {
    marginTop: SPACING.lg,
    color: 'rgba(250, 250, 250, 0.6)',
    fontFamily: TYPOGRAPHY.devotional,
    fontSize: TYPOGRAPHY.sizes.md,
    fontStyle: 'italic',
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
  persistentAudioPlayer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.warmBeige,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cream,
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
