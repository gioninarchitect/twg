/**
 * Settings Modal
 *
 * User preferences including notifications, access status, and about.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../theme/colors';
import { useAccess } from '../context/AccessContext';
import { useProgress } from '../context/ProgressContext';
import { usePin } from '../context/PinContext';
import NotificationSettings from './NotificationSettings';
import PinSettings from './PinSettings';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenAccessCode: () => void;
}

export default function SettingsModal({ visible, onClose, onOpenAccessCode }: Props) {
  const { t } = useTranslation();
  const { hasFullAccess, accessLevel, codeDescription, resetToGuest } = useAccess();
  const { totalDaysCompleted, resetProgress } = useProgress();
  const { lockApp, isPinEnabled } = usePin();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={COLORS.earth} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.reminders')}</Text>
            <NotificationSettings />
          </View>

          {/* Access Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.access')}</Text>
            <View style={styles.card}>
              <View style={styles.accessRow}>
                <View style={styles.accessInfo}>
                  <View style={[
                    styles.accessBadge,
                    hasFullAccess() ? styles.accessBadgeFull : styles.accessBadgeGuest
                  ]}>
                    <Feather
                      name={hasFullAccess() ? 'check-circle' : 'user'}
                      size={14}
                      color={hasFullAccess() ? COLORS.sage : COLORS.dustyBlue}
                    />
                    <Text style={[
                      styles.accessBadgeText,
                      hasFullAccess() ? styles.accessTextFull : styles.accessTextGuest
                    ]}>
                      {hasFullAccess() ? t('settings.fullAccess') : t('settings.guest')}
                    </Text>
                  </View>
                  {hasFullAccess() && codeDescription && (
                    <Text style={styles.codeDescription}>{codeDescription}</Text>
                  )}
                </View>
                {!hasFullAccess() && (
                  <TouchableOpacity
                    style={styles.unlockButton}
                    onPress={() => {
                      onClose();
                      setTimeout(onOpenAccessCode, 300);
                    }}
                  >
                    <Feather name="key" size={16} color={COLORS.gold} />
                    <Text style={styles.unlockText}>{t('settings.unlock')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Progress Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('dashboard.yourJourney')}</Text>
            <View style={styles.card}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t('settings.daysCompleted')}</Text>
                <Text style={styles.statValue}>{totalDaysCompleted}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t('settings.daysRemaining')}</Text>
                <Text style={styles.statValue}>{40 - totalDaysCompleted}</Text>
              </View>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
            <View style={styles.card}>
              <Text style={styles.aboutTitle}>{t('app.name')}</Text>
              <Text style={styles.aboutSubtitle}>{t('app.tagline')}</Text>
              <Text style={styles.aboutText}>
                {t('settings.aboutDescription')}
              </Text>
              <Text style={styles.versionText}>{t('settings.version')} 1.0.0</Text>
            </View>
          </View>

          {/* Security - PIN Lock */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
            <PinSettings />
          </View>

          {/* Dev Tools (for testing) */}
          {__DEV__ && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.developer')}</Text>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.devButton}
                  onPress={async () => {
                    await resetToGuest();
                    await resetProgress();
                  }}
                >
                  <Feather name="refresh-cw" size={16} color={COLORS.mutedTerracotta} />
                  <Text style={styles.devButtonText}>{t('settings.resetProgress')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmBeige,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warmBeige,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.soft,
  },
  accessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessInfo: {
    flex: 1,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  accessBadgeFull: {
    backgroundColor: COLORS.sageMuted + '30',
  },
  accessBadgeGuest: {
    backgroundColor: COLORS.dustyBlueMuted + '30',
  },
  accessBadgeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  accessTextFull: {
    color: COLORS.sage,
  },
  accessTextGuest: {
    color: COLORS.dustyBlue,
  },
  codeDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldLight + '40',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  unlockText: {
    color: COLORS.gold,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warmBeige,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  aboutTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  aboutSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  aboutText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  versionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  devButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.mutedTerracotta,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  signOutText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.mutedTerracotta,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
});
