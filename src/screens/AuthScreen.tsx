/**
 * Auth Screen - Sanctuary Entrance
 * Magic Link authentication via Supabase
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../theme/colors';

// Tea cup logo using actual teacup.png image
function TeaCupIcon({ size = 70 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/teacup.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
import { supabase } from '../services/supabase';

interface Props {
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        onAuthSuccess(session.access_token, session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSendMagicLink() {
    if (!email) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }

    if (!email.includes('@')) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: 'teawithgod://auth/callback',
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    setMagicLinkSent(false);
    setEmail('');
  }

  async function handleGuestLogin() {
    setLoading(true);
    setError(null);

    try {
      // Sign in anonymously with Supabase
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error('Anonymous auth error:', error);
        setError(t('auth.errors.signInFailed'));
        return;
      }

      if (data.session) {
        // Anonymous user created - onAuthStateChange will handle the rest
        console.log('Guest signed in anonymously:', data.user?.id);
      }
    } catch (err: any) {
      console.error('Guest login failed:', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  // Magic Link Sent View
  if (magicLinkSent) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1A1A1A', '#0D0D0D']}
          style={styles.backgroundGradient}
        />
        <View style={styles.centeredContent}>
          <View style={styles.successCard}>
            <View style={styles.successIconContainer}>
              <Feather name="mail" size={48} color={COLORS.gold} />
            </View>
            <Text style={styles.successTitle}>{t('auth.checkEmail')}</Text>
            <Text style={styles.successMessage}>
              {t('auth.magicLinkSent')}{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.successHint}>
              {t('auth.clickLink')}
            </Text>
            <TouchableOpacity style={styles.resendButton} onPress={handleResend}>
              <Feather name="refresh-cw" size={16} color={COLORS.gold} />
              <Text style={styles.resendText}>{t('auth.useDifferentEmail')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A1A', '#0D0D0D']}
        style={styles.backgroundGradient}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <TeaCupIcon size={70} />
              </View>
              <Text style={styles.title}>{t('welcome.title')}</Text>
              <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{t('auth.enterSanctuary')}</Text>
              <Text style={styles.formSubtitle}>
                {t('auth.magicLinkDesc')}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={18} color={COLORS.mutedBrown} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError(null);
                    }}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={COLORS.mutedBrown}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                  />
                </View>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={16} color={COLORS.mutedTerracotta} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSendMagicLink}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
                  start={GRADIENTS.gold.start}
                  end={GRADIENTS.gold.end}
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.earth} />
                  ) : (
                    <View style={styles.submitContent}>
                      <Text style={styles.submitButtonText}>{t('auth.sendMagicLink')}</Text>
                      <Feather name="send" size={18} color={COLORS.earth} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.noPasswordNote}>
                {t('auth.noPasswordNote')}
              </Text>
            </View>

            {/* Guest Option */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
              disabled={loading}
            >
              <Feather name="eye" size={16} color={COLORS.gameTextDark} />
              <Text style={styles.guestButtonText}>{t('auth.previewAsGuest')}</Text>
              <Text style={styles.guestNote}>{t('auth.guestDaysOnly')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  formSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 115, 115, 0.15)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: TYPOGRAPHY.ui,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  submitButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.glow,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: TYPOGRAPHY.ui,
    marginRight: SPACING.sm,
  },
  noPasswordNote: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  guestButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  guestNote: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  // Success state styles
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    width: '100%',
    maxWidth: 340,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },
  successMessage: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  emailHighlight: {
    fontWeight: '600',
    color: COLORS.gold,
  },
  successHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  resendText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
});
