/**
 * Welcome Screen - First Impression
 * Premium dark theme with Kintsugi tea cup
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../theme/colors';
import { GradientButton, Button } from '../components/PremiumUI';

const { width, height } = Dimensions.get('window');

// Tea cup logo using actual teacup.png image
function TeaCupIcon({ size = 90 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/teacup.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function WelcomeScreen({ onGetStarted, onSignIn }: Props) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const goldLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(goldLineAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const goldLineWidth = goldLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '40%'],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient - Dark premium */}
      <LinearGradient
        colors={['#1A1A1A', '#0D0D0D']}
        style={styles.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Decorative gold accent lines */}
      <View style={styles.decorativeContainer}>
        <Animated.View style={[styles.goldLine, styles.goldLineTop, { width: goldLineWidth as any }]} />
        <Animated.View style={[styles.goldLine, styles.goldLineBottom, { width: goldLineWidth as any }]} />
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Professional Tea Cup Icon */}
        <View style={styles.symbolContainer}>
          <TeaCupIcon size={80} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{t('welcome.title')}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
          <View style={styles.taglineLine} />
        </View>

        {/* Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quote}>
            {t('welcome.quote')}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          {t('welcome.description')}
        </Text>
      </Animated.View>

      {/* Bottom actions */}
      <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
        <GradientButton
          title={t('welcome.beginJourney')}
          onPress={onGetStarted}
          style={styles.primaryButton}
        />

        <Button
          title={t('welcome.haveAccount')}
          onPress={onSignIn}
          variant="ghost"
          style={styles.secondaryButton}
        />
      </Animated.View>
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
  decorativeContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  goldLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: COLORS.gold,
    opacity: 0.3,
  },
  goldLineTop: {
    top: height * 0.15,
    right: 0,
  },
  goldLineBottom: {
    bottom: height * 0.25,
    left: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  symbolContainer: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 42,
    fontWeight: '300',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xl,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  taglineLine: {
    width: 30,
    height: 1,
    backgroundColor: COLORS.gold,
    opacity: 0.5,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    textTransform: 'uppercase',
    marginHorizontal: SPACING.md,
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  quote: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: 26,
    textAlign: 'center',
  },
  quoteEmphasis: {
    color: COLORS.gold,
    fontWeight: '500',
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  primaryButton: {
    marginBottom: SPACING.md,
  },
  secondaryButton: {
    alignSelf: 'center',
  },
});
