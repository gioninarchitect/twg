/**
 * Access Code Modal - Unlock Full Content
 *
 * PRD: Users redeem book codes to unlock all 40 days.
 * Guests preview days 1-3; full access requires code.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../theme/colors';
import { useAccess, GUEST_DAY_LIMIT } from '../context/AccessContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialCode?: string; // Pre-filled code from URL parameter
}

export default function AccessCodeModal({ visible, onClose, onSuccess, initialCode }: Props) {
  const { t } = useTranslation();
  const { redeemCode, hasFullAccess } = useAccess();
  const [code, setCode] = useState(initialCode || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update code when initialCode changes (e.g., from URL parameter)
  React.useEffect(() => {
    if (initialCode && visible) {
      setCode(initialCode.toUpperCase());
    }
  }, [initialCode, visible]);

  async function handleSubmit() {
    if (!code.trim()) {
      setError(t('accessCode.enterCodeError'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await redeemCode(code);

      if (result.success) {
        setSuccess(t('accessCode.success'));
        setCode('');

        // Wait a moment to show success, then close
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setSuccess(null);
        }, 2000);
      } else {
        setError(t('accessCode.errorMessage'));
      }
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setCode('');
    setError(null);
    setSuccess(null);
    onClose();
  }

  // If already has full access, show confirmation
  if (hasFullAccess()) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.container}>
            <View style={styles.card}>
              <View style={styles.successIconContainer}>
                <Feather name="check-circle" size={48} color={COLORS.sage} />
              </View>
              <Text style={styles.title}>{t('accessCode.fullAccessUnlocked')}</Text>
              <Text style={styles.message}>
                {t('accessCode.fullAccessMessage')}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>{t('common.continue')}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            {/* Header */}
            <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
              <Feather name="x" size={20} color={COLORS.mutedBrown} />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Feather name="key" size={28} color={COLORS.gold} />
              </View>
            </View>

            <Text style={styles.title}>{t('accessCode.unlockYourJourney')}</Text>

            <Text style={styles.description}>
              {t('accessCode.description')}
            </Text>

            {/* Guest info */}
            <View style={styles.guestInfo}>
              <Feather name="info" size={16} color={COLORS.dustyBlue} />
              <Text style={styles.guestInfoText}>
                {t('accessCode.guestPreviewInfo', { days: GUEST_DAY_LIMIT })}
              </Text>
            </View>

            {/* Code input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(text) => {
                  setCode(text.toUpperCase());
                  setError(null);
                }}
                placeholder={t('accessCode.placeholder')}
                placeholderTextColor={COLORS.mutedBrown}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isSubmitting}
              />
            </View>

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={16} color={COLORS.mutedTerracotta} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Success message */}
            {success && (
              <View style={styles.successContainer}>
                <Feather name="check-circle" size={16} color={COLORS.sage} />
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !code.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={code.trim() ? GRADIENTS.gold.colors as [string, string, ...string[]] : [COLORS.warmBeige, COLORS.warmBeige]}
                style={[styles.submitButton, (!code.trim() || isSubmitting) && styles.submitButtonDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.earth} />
                ) : (
                  <>
                    <Feather name="unlock" size={18} color={code.trim() ? COLORS.earth : COLORS.mutedBrown} />
                    <Text style={[styles.submitButtonText, !code.trim() && styles.submitButtonTextDisabled]}>
                      {t('accessCode.unlockFullJourney')}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Where to find code */}
            <TouchableOpacity style={styles.helpLink}>
              <Text style={styles.helpLinkText}>{t('accessCode.whereToFind')}</Text>
            </TouchableOpacity>

            <Text style={styles.helpDescription}>
              {t('accessCode.helpDescription')}
            </Text>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(93, 78, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.strong,
  },
  closeIcon: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.warmBeige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.goldLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dustyBlueMuted + '30',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  guestInfoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.dustyBlue,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  inputContainer: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  input: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedTerracotta,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.sageMuted + '30',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  successText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.sage,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  submitButtonTextDisabled: {
    color: COLORS.mutedBrown,
  },
  closeButton: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  helpLink: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  helpLinkText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.dustyBlue,
    fontFamily: TYPOGRAPHY.ui,
    textDecorationLine: 'underline',
  },
  helpDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
