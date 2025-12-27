/**
 * Crisis Modal - Zero Latency Safety Override
 * Calming premium design with offline resources
 *
 * PRD: "The Lifebuoy" - Always accessible, works offline
 * - Hard-coded prayers for: Suicidal Ideation, Numbness, Anger
 * - Bundled crisis_loop.mp3 audio (no download needed)
 * - Direct tap-to-call hotlines
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Modal,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../theme/colors';
import AudioPlayer from '../components/AudioPlayer';

// Crisis hotlines by region - strictly localized per country
// Only show hotlines that work in the user's region
const CRISIS_HOTLINES_BY_REGION: Record<string, Array<{id: string; title: string; content: string; phone: string; type: string}>> = {
  ZA: [
    {
      id: 'za_sadag',
      title: 'SADAG Crisis Line',
      content: 'Depression & Anxiety Group - 24/7 Free',
      phone: '0800 567 567',
      type: 'HOTLINE',
    },
    {
      id: 'za_lifeline',
      title: 'Lifeline SA',
      content: 'National counselling - 24/7',
      phone: '0861 322 322',
      type: 'HOTLINE',
    },
    {
      id: 'za_tears',
      title: 'TEARS Foundation',
      content: 'Trauma, abuse & GBV support',
      phone: '010 590 5920',
      type: 'HOTLINE',
    },
    {
      id: 'za_childline',
      title: 'Childline SA',
      content: 'Children & youth crisis support',
      phone: '0800 055 555',
      type: 'HOTLINE',
    },
  ],
  // Future regions - add when launching in each country
  // US: [...],
  // UK: [...],
  // KE: [...], // Kenya
  // NG: [...], // Nigeria
};

// Default to South Africa for launch
const HOTLINES = CRISIS_HOTLINES_BY_REGION.ZA;

// Crisis prayers for specific states (PRD requirement)
const CRISIS_PRAYERS = {
  despair: {
    id: 'prayer_despair',
    title: 'When I Want to Give Up',
    subtitle: 'For moments of suicidal ideation',
    content: `Lord, I don't want to be here anymore.
The pain is too much.
I can't see any way forward.

But I'm telling You this because some small part of me is still reaching for You.

Hold that part of me.
Keep me here one more moment.
One more breath.

Send someone.
Send something.
Send hope I cannot manufacture myself.

I choose to stay, even when I don't want to.
Not because I'm strong, but because You are.
Amen.`,
  },
  numb: {
    id: 'prayer_numb',
    title: 'When I Feel Nothing',
    subtitle: 'For moments of numbness',
    content: `God, I feel nothing.
Not sadness, not hope, not even despair.
Just... empty.

I know this is my mind protecting me.
But the silence inside is deafening.

Meet me in this emptiness.
Not to fill it with forced feeling,
But to sit with me in the void.

You are the God who hovered over formless darkness.
Hover over me now.
Let Your Spirit move, even when I cannot.
Amen.`,
  },
  angry: {
    id: 'prayer_angry',
    title: 'When I Am Furious',
    subtitle: 'For moments of overwhelming anger',
    content: `God, I am so angry.
At them. At myself. Maybe even at You.

I don't want to be told to calm down.
I don't want to be reasonable.
I want to scream and break things.

So I'm bringing this rage to You—
Not sanitized, not softened.
Raw. Ugly. Mine.

Hold this anger with me.
Don't let it consume me,
But don't ask me to pretend it isn't real.

When I'm ready, help me lay it down.
But for now, just let me be angry
In Your presence.
Amen.`,
  },
};

// Grounding exercise
const GROUNDING = {
  id: 'grounding',
  title: '5-4-3-2-1 Grounding',
  content: `Right now, notice:

5 things you can SEE
4 things you can TOUCH
3 things you can HEAR
2 things you can SMELL
1 thing you can TASTE

You are here.
You are safe.
This moment will pass.`,
};

// Crisis audio track configuration
// NOTE: Place your crisis_loop.mp3 in assets/audio/ folder
// This track should be a calming, instrumental piece that can loop
const CRISIS_AUDIO = {
  // Uncomment and update when audio file is added:
  // uri: require('../../assets/audio/crisis_loop.mp3'),
  uri: '', // Placeholder - add your audio file path
  title: 'When I Cannot Pray',
  subtitle: 'Calming instrumental (loops)',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CrisisModal({ visible, onClose }: Props) {
  const [selectedPrayer, setSelectedPrayer] = useState<'despair' | 'numb' | 'angry' | null>(null);

  function callHotline(phone: string) {
    Linking.openURL('tel:' + phone);
  }

  function textHotline(phone: string) {
    Linking.openURL('sms:' + phone);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0D0D0D', '#1A1A1A']}
          style={styles.backgroundGradient}
        />

        {/* Close Button */}
        <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
          <Feather name="x" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.heartIcon}>
              <Feather name="heart" size={32} color={COLORS.gold} />
            </View>
            <Text style={styles.headerTitle}>You Are Not Alone</Text>
            <Text style={styles.headerSubtitle}>
              Support is always available.{'\n'}These resources are here for you.
            </Text>
          </View>

          {/* Crisis Audio - Bundled for offline (when available) */}
          {CRISIS_AUDIO.uri && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="music" size={18} color={COLORS.gold} />
                <Text style={styles.sectionTitle}>Calming Music</Text>
              </View>
              <AudioPlayer
                uri={CRISIS_AUDIO.uri}
                title={CRISIS_AUDIO.title}
                subtitle={CRISIS_AUDIO.subtitle}
                variant="compact"
              />
            </View>
          )}

          {/* Immediate Support Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="phone" size={18} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>Immediate Support</Text>
            </View>

            {HOTLINES.map(hotline => (
              <View key={hotline.id} style={styles.hotlineCard}>
                <LinearGradient
                  colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
                  style={styles.hotlineGradient}
                >
                  <Text style={styles.hotlineTitle}>{hotline.title}</Text>
                  <Text style={styles.hotlineContent}>{hotline.content}</Text>
                  <View style={styles.hotlineActions}>
                    {hotline.type === 'HOTLINE' && (
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => callHotline(hotline.phone)}
                      >
                        <Feather name="phone-call" size={18} color={COLORS.dustyBlue} />
                        <Text style={styles.callButtonText}>Call Now</Text>
                      </TouchableOpacity>
                    )}
                    {hotline.type === 'TEXT' && (
                      <TouchableOpacity
                        style={styles.textButton}
                        onPress={() => textHotline(hotline.phone)}
                      >
                        <Feather name="message-circle" size={18} color={COLORS.cream} />
                        <Text style={styles.textButtonText}>Send Text</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* Grounding Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="anchor" size={18} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>Ground Yourself</Text>
            </View>

            <View style={styles.groundingCard}>
              <Text style={styles.groundingTitle}>{GROUNDING.title}</Text>
              <Text style={styles.groundingContent}>{GROUNDING.content}</Text>
            </View>
          </View>

          {/* Prayer Section - Tabbed by crisis state */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="heart" size={18} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>A Prayer for This Moment</Text>
            </View>

            <Text style={styles.prayerPrompt}>What are you feeling right now?</Text>

            {/* Crisis state tabs */}
            <View style={styles.prayerTabs}>
              <TouchableOpacity
                style={[styles.prayerTab, selectedPrayer === 'despair' && styles.prayerTabActive]}
                onPress={() => setSelectedPrayer(selectedPrayer === 'despair' ? null : 'despair')}
              >
                <Text style={[styles.prayerTabText, selectedPrayer === 'despair' && styles.prayerTabTextActive]}>
                  Despair
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.prayerTab, selectedPrayer === 'numb' && styles.prayerTabActive]}
                onPress={() => setSelectedPrayer(selectedPrayer === 'numb' ? null : 'numb')}
              >
                <Text style={[styles.prayerTabText, selectedPrayer === 'numb' && styles.prayerTabTextActive]}>
                  Numb
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.prayerTab, selectedPrayer === 'angry' && styles.prayerTabActive]}
                onPress={() => setSelectedPrayer(selectedPrayer === 'angry' ? null : 'angry')}
              >
                <Text style={[styles.prayerTabText, selectedPrayer === 'angry' && styles.prayerTabTextActive]}>
                  Angry
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selected prayer */}
            {selectedPrayer && (
              <View style={styles.prayerCard}>
                <View style={styles.prayerAccent} />
                <View style={styles.prayerContentInner}>
                  <Text style={styles.prayerTitle}>{CRISIS_PRAYERS[selectedPrayer].title}</Text>
                  <Text style={styles.prayerSubtitle}>{CRISIS_PRAYERS[selectedPrayer].subtitle}</Text>
                  <Text style={styles.prayerText}>{CRISIS_PRAYERS[selectedPrayer].content}</Text>
                </View>
              </View>
            )}

            {!selectedPrayer && (
              <Text style={styles.prayerHint}>
                Tap above to find a prayer that meets you where you are.
              </Text>
            )}
          </View>

          {/* Reminder */}
          <View style={styles.reminderCard}>
            <Feather name="sunrise" size={24} color={COLORS.gold} />
            <Text style={styles.reminderText}>
              This moment will pass.{'\n'}You are stronger than you know.
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <View style={styles.continueButtonInner}>
              <Text style={styles.continueButtonText}>I'm Ready to Continue</Text>
              <Feather name="arrow-right" size={18} color={COLORS.gold} />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
  closeIcon: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundGlass,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
  },
  heartIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.goldGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.display,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: SPACING.sm,
  },
  hotlineCard: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  hotlineGradient: {
    padding: SPACING.lg,
  },
  hotlineTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xs,
  },
  hotlineContent: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },
  hotlineActions: {
    flexDirection: 'row',
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  callButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  textButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  textButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  groundingCard: {
    backgroundColor: COLORS.backgroundGlass,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  groundingTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },
  groundingContent: {
    fontSize: TYPOGRAPHY.sizes.lg,
    lineHeight: 28,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
  },
  prayerPrompt: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },
  prayerTabs: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  prayerTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundGlass,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
  },
  prayerTabActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  prayerTabText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
  },
  prayerTabTextActive: {
    color: '#0D0D0D',
  },
  prayerHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  prayerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundGlass,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
  },
  prayerAccent: {
    width: 4,
    backgroundColor: COLORS.gold,
  },
  prayerContentInner: {
    flex: 1,
    padding: SPACING.lg,
  },
  prayerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xs,
  },
  prayerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },
  prayerText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontStyle: 'italic',
    lineHeight: 30,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
  },
  reminderCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.goldGlow,
  },
  reminderText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
    marginTop: SPACING.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 13, 13, 0.95)',
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  continueButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  continueButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: RADIUS.lg,
  },
  continueButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginRight: SPACING.sm,
  },
});
