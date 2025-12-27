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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../theme/colors';
import { useAccess } from '../context/AccessContext';
import { useProgress } from '../context/ProgressContext';
import NotificationSettings from './NotificationSettings';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenAccessCode: () => void;
}

export default function SettingsModal({ visible, onClose, onOpenAccessCode }: Props) {
  const { hasFullAccess, accessLevel, codeDescription, resetToGuest } = useAccess();
  const { totalDaysCompleted, resetProgress } = useProgress();

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
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={COLORS.earth} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            <NotificationSettings />
          </View>

          {/* Access Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Access</Text>
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
                      {hasFullAccess() ? 'Full Access' : 'Guest'}
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
                    <Text style={styles.unlockText}>Unlock</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Progress Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Journey</Text>
            <View style={styles.card}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Days Completed</Text>
                <Text style={styles.statValue}>{totalDaysCompleted}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Days Remaining</Text>
                <Text style={styles.statValue}>{40 - totalDaysCompleted}</Text>
              </View>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              <Text style={styles.aboutTitle}>Tea With God</Text>
              <Text style={styles.aboutSubtitle}>A 40-Day Healing Companion</Text>
              <Text style={styles.aboutText}>
                Based on the book "Tea With God" by Kamo Thobejane.
                A sanctuary for women walking through heartbreak,
                guided by faith and psychological wisdom.
              </Text>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </View>

          {/* Dev Tools (for testing) */}
          {__DEV__ && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Developer</Text>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.devButton}
                  onPress={async () => {
                    await resetToGuest();
                    await resetProgress();
                  }}
                >
                  <Feather name="refresh-cw" size={16} color={COLORS.mutedTerracotta} />
                  <Text style={styles.devButtonText}>Reset All Progress</Text>
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
});
