/**
 * Flipbook Screen - Digital Book Reader
 *
 * Embeds the flipbook within the app using WebView on native
 * or iframe on web, keeping users in the app experience.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/colors';
import { useAccess } from '../context/AccessContext';

const { width, height } = Dimensions.get('window');

export default function FlipbookScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasFullAccess } = useAccess();
  const [isLoading, setIsLoading] = useState(true);
  const [isLandscape, setIsLandscape] = useState(width > height);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });
    return () => subscription?.remove();
  }, []);

  // Check access
  if (!hasFullAccess()) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDenied}>
          <Feather name="lock" size={48} color={COLORS.gold} />
          <Text style={styles.accessTitle}>{t('flipbook.unlockTitle')}</Text>
          <Text style={styles.accessText}>
            {t('flipbook.unlockMessage')}
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.location.href = '/upgrade.html';
              }
            }}
          >
            <Text style={styles.upgradeButtonText}>{t('flipbook.upgradeNow')}</Text>
            <Feather name="arrow-right" size={18} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // For web, use an iframe
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('flipbook.subtitle')}</Text>
          <View style={styles.headerRight}>
            {!isLandscape && (
              <View style={styles.rotateHint}>
                <Feather name="rotate-cw" size={14} color={COLORS.gold} />
                <Text style={styles.rotateText}>{t('flipbook.rotateHint')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={styles.loadingText}>{t('flipbook.loadingBook')}</Text>
          </View>
        )}

        {/* Flipbook iframe */}
        <iframe
          src="/flipbook/?access=full&embedded=true"
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: COLORS.background,
          }}
          onLoad={() => setIsLoading(false)}
          title={t('flipbook.digitalBookTitle')}
        />
      </View>
    );
  }

  // For native platforms, we'd use WebView
  // But since this is primarily a PWA, the web version above handles it
  return (
    <View style={styles.container}>
      <View style={styles.nativeMessage}>
        <Feather name="book-open" size={48} color={COLORS.gold} />
        <Text style={styles.accessTitle}>{t('flipbook.subtitle')}</Text>
        <Text style={styles.accessText}>
          {t('flipbook.nativeMessage')}
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => {
            // Native would open in browser
          }}
        >
          <Text style={styles.upgradeButtonText}>{t('flipbook.openInBrowser')}</Text>
          <Feather name="external-link" size={18} color={COLORS.background} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    backgroundColor: 'rgba(13, 13, 13, 0.95)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '500',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
  },
  headerRight: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  rotateHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  rotateText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  nativeMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  accessTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '400',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  accessText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
    marginBottom: SPACING.xl,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
  },
  upgradeButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.background,
    fontFamily: TYPOGRAPHY.ui,
  },
});
