/**
 * Lock Screen
 *
 * Shows when app is locked. User must enter PIN to continue.
 * Includes "Forgot PIN" option that resets all data.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/colors';
import { usePin } from '../context/PinContext';
import PinEntry from '../components/PinEntry';

export default function LockScreen() {
  const { t } = useTranslation();
  const { unlockApp, resetAllData } = usePin();
  const [error, setError] = useState<string | undefined>();
  const [attempts, setAttempts] = useState(0);

  function handlePinComplete(pin: string) {
    const success = unlockApp(pin);
    if (!success) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 5) {
        setError(t('lockScreen.attemptsRemaining', { remaining: 10 - newAttempts }));
      } else {
        setError(t('lockScreen.incorrectPin'));
      }

      // After 10 failed attempts, show reset warning
      if (newAttempts >= 10) {
        Alert.alert(
          t('lockScreen.tooManyAttempts'),
          t('lockScreen.tooManyAttemptsMessage'),
          [
            { text: t('lockScreen.tryAgain'), style: 'cancel' },
            {
              text: t('lockScreen.resetApp'),
              style: 'destructive',
              onPress: handleForgotPin,
            },
          ]
        );
      }
    }
  }

  function handleForgotPin() {
    Alert.alert(
      t('lockScreen.forgotPinTitle'),
      t('lockScreen.forgotPinMessage'),
      [
        { text: t('lockScreen.cancel'), style: 'cancel' },
        {
          text: t('lockScreen.resetEverything'),
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            // App will restart in unlocked, fresh state
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/teacup.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>{t('app.name')}</Text>
      </View>

      {/* PIN Entry */}
      <PinEntry
        title={t('lockScreen.welcomeBack')}
        subtitle={t('lockScreen.enterPin')}
        onComplete={handlePinComplete}
        error={error}
      />

      {/* Forgot PIN */}
      <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPin}>
        <Text style={styles.forgotText}>{t('lockScreen.forgotPin')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.heading,
    marginTop: SPACING.sm,
  },
  forgotButton: {
    position: 'absolute',
    bottom: SPACING.xxl,
    alignSelf: 'center',
    padding: SPACING.md,
  },
  forgotText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedTerracotta,
    fontFamily: TYPOGRAPHY.ui,
  },
});
