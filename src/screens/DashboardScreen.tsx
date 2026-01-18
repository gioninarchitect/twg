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
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS, PHASES } from '../theme/colors';
import { Card, Divider } from '../components/PremiumUI';
import { useProgress } from '../context/ProgressContext';
import { useAccess, GUEST_DAY_LIMIT } from '../context/AccessContext';
import { useJournal } from '../context/JournalContext';
import { usePin } from '../context/PinContext';
import { useSettings } from '../context/SettingsContext';
import AudioPlayer from '../components/AudioPlayer';
import { audioService, buildAudioTrack } from '../services/audioService';
import { loadGameStats } from '../services/gameDataService';
import { supabase, TABLES, getCurrentUserId } from '../services/supabase';

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
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const {
    currentDayIndex,
    daysCompleted,
    totalDaysCompleted,
    isLoading: progressLoading
  } = useProgress();
  const { canAccessDay, hasFullAccess, canAccessMusic, canAccessBrainGames, getGuestCurrentDay, getTimeUntilNextDay, isLoading: accessLoading, codeUsed, resetToGuest, planTier } = useAccess();
  const { entries: journalEntries } = useJournal();
  const { isPinEnabled, lockApp } = usePin();
  const { openSettings } = useSettings();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const drawerAnim = useRef(new Animated.Value(width)).current;
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [gameStats, setGameStats] = useState({ totalSessions: 0, currentStreak: 0 });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const days = offlineContent.days as DayData[];

  // Load profile image and user data from storage
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // First try to load from AsyncStorage (fast, offline)
        const localUri = await AsyncStorage.getItem('profileImage');
        if (localUri) setProfileImage(localUri);

        // Then try to sync from Supabase
        const userId = await getCurrentUserId();
        if (userId) {
          const { data } = await supabase
            .from(TABLES.USER_SETTINGS)
            .select('profile_image_base64')
            .eq('user_id', userId)
            .single();

          if (data?.profile_image_base64) {
            // If we have a base64 image from cloud, use it
            const cloudUri = data.profile_image_base64;
            setProfileImage(cloudUri);
            await AsyncStorage.setItem('profileImage', cloudUri);
          }
        }
      } catch (e) {
        console.log('Error loading profile image:', e);
      }
    };
    loadProfileData();

    // Load user data
    const loadUserData = async () => {
      try {
        // Try SecureStore first (for native), then localStorage (for web)
        let userData = null;
        if (Platform.OS === 'web') {
          const data = localStorage.getItem('userData');
          if (data) userData = JSON.parse(data);
        } else {
          const SecureStore = require('expo-secure-store');
          const data = await SecureStore.getItemAsync('userData');
          if (data) userData = JSON.parse(data);
        }

        if (userData) {
          // Try to get name from various possible fields
          const name = userData.user_metadata?.full_name
            || userData.user_metadata?.name
            || userData.full_name
            || userData.name
            || userData.email?.split('@')[0]
            || '';
          setUserName(name);
          setUserEmail(userData.email || '');
        }
      } catch (e) {
        console.log('Error loading user data:', e);
      }
    };
    loadUserData();
  }, []);

  // Load game stats
  useEffect(() => {
    async function fetchGameStats() {
      const stats = await loadGameStats();
      const totalSessions = Object.values(stats.totalSessions || {}).reduce((a, b) => a + b, 0);
      setGameStats({ totalSessions, currentStreak: stats.streakDays || 0 });
    }
    fetchGameStats();
  }, []);

  // Drawer animation
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.spring(drawerAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setDrawerVisible(false));
  };

  // Pick profile image and persist to Supabase
  const pickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, // Request base64 for cloud storage
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;

        // Update UI immediately with local URI
        setProfileImage(uri);
        await AsyncStorage.setItem('profileImage', uri);

        // Save to Supabase if we have base64 data
        const userId = await getCurrentUserId();
        if (userId && asset.base64) {
          const base64Uri = `data:image/jpeg;base64,${asset.base64}`;

          // Upsert to user_settings table
          const { error } = await supabase
            .from(TABLES.USER_SETTINGS)
            .upsert({
              user_id: userId,
              profile_image_base64: base64Uri,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            });

          if (error) {
            console.log('Error saving profile image to cloud:', error);
            // Still have local copy, so user won't notice
          } else {
            // Store base64 locally too for consistent sync
            await AsyncStorage.setItem('profileImage', base64Uri);
            setProfileImage(base64Uri);
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

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
        <Text style={styles.loadingText}>{t('dashboard.preparingSanctuary')}</Text>
      </View>
    );
  }

  // Build intro track with access code
  const introTrack = codeUsed ? buildAudioTrack(0, codeUsed) : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Welcome Header with Profile Button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t('dashboard.welcomeBack')}</Text>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{t('dashboard.yourDevotionalJourney')}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={openDrawer}
            accessibilityLabel="Open profile menu"
          >
            <Feather name="menu" size={24} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        {/* Intro Audio Player - "Restore My Soul" (Premium only) */}
        {introTrack && codeUsed && (
          canAccessMusic() ? (
            <View style={styles.introAudioContainer}>
              <AudioPlayer
                uri={introTrack.uri}
                title={introTrack.title}
                subtitle={introTrack.subtitle}
                variant="compact"
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.upgradeAudioContainer}
              onPress={() => Alert.alert(t('music.premiumFeature'), t('dashboard.upgradeForMusic'), [{ text: t('common.ok') }])}
            >
              <View style={styles.upgradeAudioContent}>
                <Feather name="music" size={20} color={COLORS.textMuted} />
                <View style={styles.upgradeAudioText}>
                  <Text style={styles.upgradeAudioTitle}>{t('dashboard.backgroundMusic')}</Text>
                  <Text style={styles.upgradeAudioSubtitle}>{t('dashboard.upgradeToPremium')}</Text>
                </View>
                <View style={styles.upgradeAudioBadge}>
                  <Feather name="lock" size={12} color={COLORS.gold} />
                </View>
              </View>
            </TouchableOpacity>
          )
        )}

        {/* Continue Card - Current Day */}
        {currentDay && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DayModule', { dayNumber: currentDayIndex })}
          >
            <Card style={styles.continueCard} variant="elevated">
              <View style={styles.continueHeader}>
                <View style={[styles.phaseBadge, { backgroundColor: getPhaseColor(currentDay.phase_name) }]}>
                  <Text style={styles.phaseBadgeText}>{t(`dashboard.phases.${currentDay.phase_name.toLowerCase()}`)}</Text>
                </View>
                <Feather name="arrow-right" size={20} color={COLORS.gold} />
              </View>
              <Text style={styles.continueLabel}>{t('dashboard.continueJourney')}</Text>
              <Text style={styles.continueDay}>{t('dashboard.day')} {currentDayIndex}</Text>
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
                  <Text style={styles.continueButtonText}>{t('dashboard.beginTodaysReflection')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Card>
          </TouchableOpacity>
        )}

        {/* Vertical Timeline - Now at top */}
        <View style={styles.timelineVertical}>
          <Text style={styles.sectionTitle}>{t('dashboard.yourJourney')}</Text>
          <Text style={styles.sectionSubtitle}>{t('dashboard.fortyDaysTransformation')}</Text>

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
                    <Text style={[styles.timelinePhaseName, { color: phase.color }]}>{t(phase.nameKey)}</Text>
                    <Text style={styles.accordionSubtitle}>{t('dashboard.days')} {phase.days[0]}-{phase.days[1]} • {phaseCompleted}/{phaseTotal}</Text>
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
                        } else {
                          // Show upgrade prompt for locked days
                          Alert.alert(
                            t('dashboard.unlockFullJourney'),
                            t('dashboard.dayLockedMessage', { day: day.day_number }),
                            [
                              { text: t('dashboard.maybeLater'), style: 'cancel' },
                              {
                                text: t('dashboard.upgradeNow'),
                                onPress: () => {
                                  if (Platform.OS === 'web') {
                                    window.location.href = '/upgrade.html';
                                  }
                                }
                              },
                            ]
                          );
                        }
                      }}
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
                              {t('dashboard.day')} {day.day_number}
                            </Text>
                            {isCurrent && (
                              <View style={styles.currentBadge}>
                                <Text style={styles.currentBadgeText}>{t('common.today').toUpperCase()}</Text>
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
                {t('dashboard.previewMode')} - {t('dashboard.day')} {getGuestCurrentDay()} {t('dashboard.of')} {GUEST_DAY_LIMIT}
              </Text>
              {getTimeUntilNextDay() ? (
                <Text style={styles.guestBannerText}>
                  {t('dashboard.nextDayUnlocksIn', { hours: getTimeUntilNextDay()?.hours, minutes: getTimeUntilNextDay()?.minutes })}
                </Text>
              ) : getGuestCurrentDay() >= GUEST_DAY_LIMIT ? (
                <Text style={styles.guestBannerText}>
                  {t('dashboard.previewComplete')}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.View>

      {/* Profile Drawer */}
      {drawerVisible && (
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={closeDrawer}
        >
          <Animated.View
            style={[
              styles.drawer,
              { transform: [{ translateX: drawerAnim }] }
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Drawer Header */}
                <View style={styles.drawerHeader}>
                  <TouchableOpacity style={styles.drawerClose} onPress={closeDrawer}>
                    <Feather name="x" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.profileAvatar} onPress={pickProfileImage} activeOpacity={0.8}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                      <Feather name="user" size={32} color={COLORS.gold} />
                    )}
                    <View style={styles.profileEditBadge}>
                      <Feather name="camera" size={12} color={COLORS.textPrimary} />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.profileTitle}>
                    {userName || t('dashboard.welcomeBack')}
                  </Text>
                  <Text style={styles.profileSubtitle}>
                    {userEmail || (hasFullAccess() ? t('settings.fullAccess') : t('dashboard.previewMode'))}
                  </Text>
                  {userEmail && hasFullAccess() && planTier && (
                    <View style={[
                      styles.tierBadge,
                      planTier === 'premium' && styles.tierBadgePremium
                    ]}>
                      <Feather
                        name={planTier === 'premium' ? 'star' : 'check-circle'}
                        size={12}
                        color={COLORS.gold}
                      />
                      <Text style={styles.tierBadgeText}>
                        {planTier === 'premium' ? t('dashboard.premiumPlan') : planTier === 'journey' ? t('dashboard.journeyPlan') : t('dashboard.bookPlan')}
                      </Text>
                    </View>
                  )}
                  {userEmail && !hasFullAccess() && (
                    <View style={styles.accessBadgeSmall}>
                      <Feather name="clock" size={12} color={COLORS.textMuted} />
                      <Text style={styles.accessBadgeText}>{t('dashboard.preview')}</Text>
                    </View>
                  )}
                </View>

                {/* Quick Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{completedCount}</Text>
                    <Text style={styles.statLabel}>{t('dashboard.daysComplete')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{gameStats.currentStreak}</Text>
                    <Text style={styles.statLabel}>{t('dashboard.dayStreak')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{journalEntries?.length || 0}</Text>
                    <Text style={styles.statLabel}>{t('dashboard.journalEntries')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{gameStats.totalSessions}</Text>
                    <Text style={styles.statLabel}>{t('dashboard.brainGames')}</Text>
                  </View>
                </View>

                {/* Progress Card */}
                <View style={styles.drawerSection}>
                  <Text style={styles.drawerSectionTitle}>{t('dashboard.overallProgress')}</Text>
                  <View style={styles.progressMini}>
                    <View style={styles.progressMiniBar}>
                      <View style={[styles.progressMiniFill, { width: `${progressPercent}%` as any }]} />
                    </View>
                    <Text style={styles.progressMiniText}>{progressPercent}%</Text>
                  </View>
                  <Text style={styles.drawerHint}>
                    {completedCount < 10 ? t('dashboard.progressHint.justStarted') :
                     completedCount < 20 ? t('dashboard.progressHint.greatProgress') :
                     completedCount < 30 ? t('dashboard.progressHint.halfway') :
                     completedCount < 40 ? t('dashboard.progressHint.almostThere') :
                     t('dashboard.progressHint.complete')}
                  </Text>
                </View>

                {/* Current Phase */}
                <View style={styles.drawerSection}>
                  <Text style={styles.drawerSectionTitle}>{t('dashboard.currentPhase')}</Text>
                  {currentDay && (
                    <View style={[styles.phaseCard, { borderLeftColor: getPhaseColor(currentDay.phase_name) }]}>
                      <Text style={[styles.phaseCardName, { color: getPhaseColor(currentDay.phase_name) }]}>
                        {currentDay.phase_name}
                      </Text>
                      <Text style={styles.phaseCardDay}>{t('dashboard.day')} {currentDayIndex} {t('dashboard.of')} 40</Text>
                    </View>
                  )}
                </View>

                {/* Quick Actions */}
                <View style={styles.drawerSection}>
                  <Text style={styles.drawerSectionTitle}>{t('dashboard.quickActions')}</Text>

                  <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={() => {
                      closeDrawer();
                      navigation.navigate('BrainGamesHub');
                    }}
                  >
                    <View style={styles.drawerButtonIcon}>
                      <Feather name={canAccessBrainGames() ? "zap" : "lock"} size={20} color={COLORS.gold} />
                    </View>
                    <View style={styles.drawerButtonContent}>
                      <Text style={styles.drawerButtonTitle}>{t('dashboard.brainGames')} {!canAccessBrainGames() && `(${t('brainGames.premiumOnly')})`}</Text>
                      <Text style={styles.drawerButtonDesc}>{canAccessBrainGames() ? t('dashboard.growthExercises') : t('dashboard.upgradeToAccess')}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>

                  {(planTier === 'journey' || planTier === 'premium') && (
                    <TouchableOpacity
                      style={styles.drawerButton}
                      onPress={() => {
                        closeDrawer();
                        if (Platform.OS === 'web') {
                          window.open('/flipbook/?access=full', '_blank');
                        }
                      }}
                    >
                      <View style={[styles.drawerButtonIcon, { backgroundColor: 'rgba(139, 69, 19, 0.15)' }]}>
                        <Feather name="book-open" size={20} color="#8B4513" />
                      </View>
                      <View style={styles.drawerButtonContent}>
                        <Text style={styles.drawerButtonTitle}>{t('dashboard.flipbook')}</Text>
                        <Text style={styles.drawerButtonDesc}>{t('dashboard.readFullBook')}</Text>
                      </View>
                      <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}

                  {/* Settings */}
                  <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={() => {
                      closeDrawer();
                      openSettings();
                    }}
                  >
                    <View style={[styles.drawerButtonIcon, { backgroundColor: 'rgba(150, 150, 150, 0.15)' }]}>
                      <Feather name="settings" size={20} color={COLORS.textSecondary} />
                    </View>
                    <View style={styles.drawerButtonContent}>
                      <Text style={styles.drawerButtonTitle}>{t('settings.title')}</Text>
                      <Text style={styles.drawerButtonDesc}>{t('dashboard.settingsDesc')}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Milestones */}
                <View style={styles.drawerSection}>
                  <Text style={styles.drawerSectionTitle}>{t('dashboard.milestones')}</Text>
                  <View style={styles.milestoneRow}>
                    <View style={[styles.milestone, completedCount >= 7 && styles.milestoneAchieved]}>
                      <Feather name="award" size={16} color={completedCount >= 7 ? COLORS.gold : COLORS.textMuted} />
                      <Text style={[styles.milestoneText, completedCount >= 7 && styles.milestoneTextAchieved]}>{t('dashboard.week')} 1</Text>
                    </View>
                    <View style={[styles.milestone, completedCount >= 14 && styles.milestoneAchieved]}>
                      <Feather name="award" size={16} color={completedCount >= 14 ? COLORS.gold : COLORS.textMuted} />
                      <Text style={[styles.milestoneText, completedCount >= 14 && styles.milestoneTextAchieved]}>{t('dashboard.week')} 2</Text>
                    </View>
                    <View style={[styles.milestone, completedCount >= 21 && styles.milestoneAchieved]}>
                      <Feather name="award" size={16} color={completedCount >= 21 ? COLORS.gold : COLORS.textMuted} />
                      <Text style={[styles.milestoneText, completedCount >= 21 && styles.milestoneTextAchieved]}>{t('dashboard.week')} 3</Text>
                    </View>
                    <View style={[styles.milestone, completedCount >= 28 && styles.milestoneAchieved]}>
                      <Feather name="award" size={16} color={completedCount >= 28 ? COLORS.gold : COLORS.textMuted} />
                      <Text style={[styles.milestoneText, completedCount >= 28 && styles.milestoneTextAchieved]}>{t('dashboard.week')} 4</Text>
                    </View>
                    <View style={[styles.milestone, completedCount >= 40 && styles.milestoneAchieved]}>
                      <Feather name="star" size={16} color={completedCount >= 40 ? COLORS.gold : COLORS.textMuted} />
                      <Text style={[styles.milestoneText, completedCount >= 40 && styles.milestoneTextAchieved]}>{t('dashboard.completed')}</Text>
                    </View>
                  </View>
                </View>

                {/* 40-Day Architecture - Moved to drawer */}
                <View style={styles.drawerSection}>
                  <Text style={styles.drawerSectionTitle}>{t('dashboard.fortyDayArchitecture')}</Text>
                  <Text style={styles.architectureSubtitle}>{t('dashboard.pathFromRuinToRising')}</Text>

                  {Object.entries(PHASES).map(([key, phase], index) => {
                    const phaseDays = days.filter(d => {
                      const num = d.day_number;
                      return num >= phase.days[0] && num <= phase.days[1];
                    });
                    const phaseCompleted = phaseDays.filter(d => getDayStatus(d.day_number) === 'complete').length;
                    const phaseTotal = phase.days[1] - phase.days[0] + 1;

                    return (
                      <View key={key} style={styles.drawerPhaseCard}>
                        <View style={styles.drawerPhaseHeader}>
                          <View style={[styles.drawerPhaseCircle, { backgroundColor: phase.color }]}>
                            <Text style={styles.drawerPhaseNumber}>{index + 1}</Text>
                          </View>
                          <View style={styles.drawerPhaseInfo}>
                            <Text style={[styles.drawerPhaseName, { color: phase.color }]}>{t(phase.nameKey)}</Text>
                            <Text style={styles.drawerPhaseDays}>{t('dashboard.days')} {phase.days[0]}-{phase.days[1]}</Text>
                          </View>
                          <Text style={styles.drawerPhaseProgress}>{phaseCompleted}/{phaseTotal}</Text>
                        </View>
                        <View style={styles.drawerPhaseBar}>
                          <View
                            style={[
                              styles.drawerPhaseBarFill,
                              {
                                width: `${(phaseCompleted / phaseTotal) * 100}%` as any,
                                backgroundColor: phase.color
                              }
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Lock App Section - Only show if PIN is enabled */}
                {isPinEnabled && (
                  <View style={styles.drawerSection}>
                    <TouchableOpacity
                      style={styles.lockButton}
                      onPress={() => {
                        closeDrawer();
                        lockApp();
                      }}
                    >
                      <Feather name="lock" size={18} color={COLORS.gold} />
                      <Text style={styles.lockButtonText}>{t('dashboard.lockApp')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ height: 50 }} />
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}
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
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  introAudioContainer: {
    marginBottom: SPACING.lg,
  },
  upgradeAudioContainer: {
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    padding: SPACING.md,
  },
  upgradeAudioContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeAudioText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  upgradeAudioTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
  upgradeAudioSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  upgradeAudioBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: width < 360 ? 22 : width < 400 ? 26 : TYPOGRAPHY.sizes.hero,
    fontWeight: '300',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    marginTop: SPACING.xs,
    letterSpacing: width < 360 ? -0.5 : -1,
    minWidth: 0,
    flexShrink: 1,
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
  // Drawer styles
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: width * 0.85,
    maxWidth: 360,
    backgroundColor: COLORS.background,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.borderSubtle,
    ...SHADOWS.large,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  drawerClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: SPACING.sm,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  profileEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  profileTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  profileSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  drawerSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  drawerSectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  progressMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  progressMiniBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressMiniFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  progressMiniText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    minWidth: 45,
  },
  drawerHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  phaseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 4,
  },
  phaseCardName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  phaseCardDay: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },
  drawerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  drawerButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerButtonContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  drawerButtonTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  drawerButtonDesc: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
  milestoneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  milestoneAchieved: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  milestoneText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
  milestoneTextAchieved: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  // Drawer Phase Architecture styles
  architectureSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  drawerPhaseCard: {
    marginBottom: SPACING.md,
  },
  drawerPhaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  drawerPhaseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerPhaseNumber: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
    color: '#0D0D0D',
    fontFamily: TYPOGRAPHY.ui,
  },
  drawerPhaseInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  drawerPhaseName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
  },
  drawerPhaseDays: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
  drawerPhaseProgress: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  drawerPhaseBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginLeft: 36,
    overflow: 'hidden',
  },
  drawerPhaseBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  accessBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
    gap: 4,
  },
  accessBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  accessBadgeTextFull: {
    color: COLORS.gold,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
    gap: 4,
  },
  tierBadgePremium: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
  },
  tierBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  lockButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});
