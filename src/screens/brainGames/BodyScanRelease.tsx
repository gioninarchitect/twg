/**
 * Body Scan Release
 * Somatic awareness and tension release exercise
 * Unlocks: Day 22
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../../utils/haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme/colors';
import { GAME_COLORS, GAME_GRADIENTS } from '../../theme/brainGames';
import { emitBodyScanCompleted } from '../../worldModel';
import { useWorldModel } from '../../worldModel';
import { TensionEntry } from '../../worldModel/types';
import { Button, GradientButton } from '../../components/PremiumUI';
import {
  GameContainer,
  GameCard,
  GameSection,
  GameFooter,
  SessionComplete,
  AnimatedProgressBar,
  FadeInView,
  PulsingDot,
  WhyThisWorks,
  WhyThisWorksButton,
  SessionMoodCheckIn,
  type SessionMoodLevel,
} from '../../components/brainGames';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// BODY REGIONS
// ============================================

interface BodyRegion {
  id: string;
  name: string;
  displayName: string;
  instruction: string;
  releasePrompt: string;
  scripture: string;
  position: { top: number; left: number };
}

const BODY_REGIONS: BodyRegion[] = [
  {
    id: 'head',
    name: 'Head',
    displayName: 'Crown & Temples',
    instruction: 'Bring attention to your head. Notice any tension in your forehead, temples, or jaw.',
    releasePrompt: 'With each exhale, let the tension dissolve. Imagine a warm, golden light softening every muscle.',
    scripture: '"He gives peace to your borders." - Psalm 147:14',
    position: { top: 5, left: 50 },
  },
  {
    id: 'neck',
    name: 'Neck',
    displayName: 'Neck & Throat',
    instruction: 'Move your attention to your neck and throat. This area often holds unspoken words and tension.',
    releasePrompt: 'Gently roll your head if it helps. Release any tightness with gratitude for your voice.',
    scripture: '"Let the words of my mouth be acceptable." - Psalm 19:14',
    position: { top: 15, left: 50 },
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    displayName: 'Shoulders',
    instruction: 'Feel into your shoulders. This is where we carry burdens and responsibilities.',
    releasePrompt: 'Let your shoulders drop. You don\'t have to carry everything alone.',
    scripture: '"Cast your burden on the Lord." - Psalm 55:22',
    position: { top: 22, left: 50 },
  },
  {
    id: 'chest',
    name: 'Chest',
    displayName: 'Heart & Chest',
    instruction: 'Bring awareness to your chest and heart space. Notice your breath rising and falling.',
    releasePrompt: 'Place a hand on your heart if you wish. You are safe. You are held.',
    scripture: '"He heals the brokenhearted." - Psalm 147:3',
    position: { top: 32, left: 50 },
  },
  {
    id: 'stomach',
    name: 'Stomach',
    displayName: 'Belly',
    instruction: 'Notice your belly. This area often holds anxiety and "gut feelings."',
    releasePrompt: 'Breathe deeply into your belly. Let it soften completely with each breath.',
    scripture: '"Do not be anxious about anything." - Philippians 4:6',
    position: { top: 45, left: 50 },
  },
  {
    id: 'back',
    name: 'Back',
    displayName: 'Lower Back',
    instruction: 'Scan your lower back. This region supports you and often holds stress.',
    releasePrompt: 'Imagine warmth spreading through your lower back, releasing all tension.',
    scripture: '"The Lord is my strength." - Psalm 28:7',
    position: { top: 55, left: 50 },
  },
  {
    id: 'hands',
    name: 'Hands',
    displayName: 'Arms & Hands',
    instruction: 'Feel your arms and hands. Are they clenched or relaxed?',
    releasePrompt: 'Open your palms. Release anything you\'ve been holding onto too tightly.',
    scripture: '"I will hold your right hand." - Isaiah 41:13',
    position: { top: 42, left: 20 },
  },
  {
    id: 'legs',
    name: 'Legs',
    displayName: 'Legs & Thighs',
    instruction: 'Bring attention to your thighs and legs. They carry you through each day.',
    releasePrompt: 'Let your legs feel heavy and grounded. You are supported.',
    scripture: '"He makes my feet like the feet of a deer." - Psalm 18:33',
    position: { top: 65, left: 50 },
  },
  {
    id: 'feet',
    name: 'Feet',
    displayName: 'Feet',
    instruction: 'Finally, notice your feet. Feel them grounded to the earth.',
    releasePrompt: 'Imagine roots growing from your feet, connecting you to stability and peace.',
    scripture: '"How beautiful are the feet of those who bring good news." - Romans 10:15',
    position: { top: 85, left: 50 },
  },
];

// ============================================
// TENSION SLIDER
// ============================================

interface TensionSliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

function TensionSlider({ value, onChange, label }: TensionSliderProps) {
  const colors = GAME_COLORS.bodyScan;

  const handlePress = (newValue: number) => {
    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
    onChange(newValue);
  };

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.sliderTrack}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.sliderDot,
              num <= value && {
                backgroundColor: num <= 3 ? colors.release :
                                num <= 6 ? colors.neutral :
                                colors.tension,
              },
            ]}
            onPress={() => handlePress(num)}
          />
        ))}
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderMinLabel}>None</Text>
        <Text style={styles.sliderMaxLabel}>High</Text>
      </View>
    </View>
  );
}

// ============================================
// BODY SILHOUETTE
// ============================================

interface BodySilhouetteProps {
  currentRegion: string | null;
  tensionMap: Record<string, number>;
  onRegionPress?: (regionId: string) => void;
}

function BodySilhouette({ currentRegion, tensionMap, onRegionPress }: BodySilhouetteProps) {
  const colors = GAME_COLORS.bodyScan;

  const getTensionColor = (tension: number) => {
    if (tension <= 3) return colors.release;
    if (tension <= 6) return colors.neutral;
    return colors.tension;
  };

  return (
    <View style={styles.bodyContainer}>
      {/* Simple body outline representation */}
      <View style={styles.bodyOutline}>
        {/* Head */}
        <View style={[styles.bodyPart, styles.bodyHead, tensionMap.head ? { backgroundColor: getTensionColor(tensionMap.head) } : undefined]}>
          {currentRegion === 'head' && <PulsingDot size={16} color={colors.primary} />}
        </View>

        {/* Torso */}
        <View style={styles.bodyTorso}>
          {/* Neck */}
          <View style={[styles.bodyNeck, tensionMap.neck ? { backgroundColor: getTensionColor(tensionMap.neck) } : undefined]}>
            {currentRegion === 'neck' && <PulsingDot size={12} color={colors.primary} />}
          </View>

          {/* Shoulders */}
          <View style={styles.bodyShoulders}>
            {currentRegion === 'shoulders' && <PulsingDot size={12} color={colors.primary} />}
          </View>

          {/* Chest */}
          <View style={[styles.bodyChest, tensionMap.chest ? { backgroundColor: getTensionColor(tensionMap.chest) } : undefined]}>
            {currentRegion === 'chest' && <PulsingDot size={16} color={colors.primary} />}
          </View>

          {/* Stomach */}
          <View style={[styles.bodyStomach, tensionMap.stomach ? { backgroundColor: getTensionColor(tensionMap.stomach) } : undefined]}>
            {currentRegion === 'stomach' && <PulsingDot size={16} color={colors.primary} />}
          </View>
        </View>

        {/* Arms */}
        <View style={styles.bodyArms}>
          <View style={[styles.bodyArm, tensionMap.hands ? { backgroundColor: getTensionColor(tensionMap.hands) } : undefined]} />
          <View style={[styles.bodyArm, tensionMap.hands ? { backgroundColor: getTensionColor(tensionMap.hands) } : undefined]} />
          {currentRegion === 'hands' && (
            <View style={styles.armsDot}>
              <PulsingDot size={12} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Legs */}
        <View style={styles.bodyLegs}>
          <View style={[styles.bodyLeg, tensionMap.legs ? { backgroundColor: getTensionColor(tensionMap.legs) } : undefined]} />
          <View style={[styles.bodyLeg, tensionMap.legs ? { backgroundColor: getTensionColor(tensionMap.legs) } : undefined]} />
          {currentRegion === 'legs' && (
            <View style={styles.legsDot}>
              <PulsingDot size={12} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Feet */}
        <View style={styles.bodyFeet}>
          <View style={[styles.bodyFoot, tensionMap.feet ? { backgroundColor: getTensionColor(tensionMap.feet) } : undefined]} />
          <View style={[styles.bodyFoot, tensionMap.feet ? { backgroundColor: getTensionColor(tensionMap.feet) } : undefined]} />
          {currentRegion === 'feet' && (
            <View style={styles.feetDot}>
              <PulsingDot size={12} color={colors.primary} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface BodyScanReleaseProps {
  onClose?: () => void;
}

export function BodyScanRelease({ onClose }: BodyScanReleaseProps) {
  const navigation = useNavigation();
  const handleClose = onClose || (() => navigation.goBack());
  const { state } = useWorldModel();
  const [phase, setPhase] = useState<'intro' | 'scan' | 'complete'>('intro');
  const [currentRegionIndex, setCurrentRegionIndex] = useState(0);
  const [preTension, setPreTension] = useState<Record<string, number>>({});
  const [postTension, setPostTension] = useState<Record<string, number>>({});
  const [currentTension, setCurrentTension] = useState(5);
  const [showRelease, setShowRelease] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [showWhyThisWorks, setShowWhyThisWorks] = useState(false);
  const [skippedRegions, setSkippedRegions] = useState<string[]>([]);

  // Mood check-in states
  const [showPreMoodCheck, setShowPreMoodCheck] = useState(false);
  const [showPostMoodCheck, setShowPostMoodCheck] = useState(false);
  const [preMood, setPreMood] = useState<SessionMoodLevel | null>(null);
  const [postMood, setPostMood] = useState<SessionMoodLevel | null>(null);

  const currentRegion = BODY_REGIONS[currentRegionIndex];
  const progress = ((currentRegionIndex + 1) / BODY_REGIONS.length) * 100;

  // Handle recording tension
  const handleRecordTension = useCallback(() => {
    safeHaptics.impactAsync(ImpactFeedbackStyle.Medium);

    if (!showRelease) {
      // Record pre-tension and show release phase
      setPreTension((prev) => ({ ...prev, [currentRegion.id]: currentTension }));
      setShowRelease(true);
    } else {
      // Record post-tension and move to next region
      setPostTension((prev) => ({ ...prev, [currentRegion.id]: currentTension }));

      if (currentRegionIndex < BODY_REGIONS.length - 1) {
        setCurrentRegionIndex((prev) => prev + 1);
        setShowRelease(false);
        setCurrentTension(5);
      } else {
        // Scan complete
        setPhase('complete');
      }
    }
  }, [currentRegion, currentTension, showRelease, currentRegionIndex]);

  // Handle skipping a region (trauma-informed option)
  const handleSkipRegion = useCallback(() => {
    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);

    // Record this region as skipped
    setSkippedRegions((prev) => [...prev, currentRegion.id]);

    // Move to next region
    if (currentRegionIndex < BODY_REGIONS.length - 1) {
      setCurrentRegionIndex((prev) => prev + 1);
      setShowRelease(false);
      setCurrentTension(5);
    } else {
      // Scan complete
      setPhase('complete');
    }
  }, [currentRegion, currentRegionIndex]);

  // Handle completion
  const handleComplete = useCallback(() => {
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Find hotspots (regions with high pre-tension that improved)
    const hotspots = Object.entries(preTension)
      .filter(([_, tension]) => tension >= 7)
      .map(([region]) => region);

    // Calculate average improvement
    const improvements = Object.keys(preTension).map((region) => {
      const pre = preTension[region] || 0;
      const post = postTension[region] || 0;
      return pre - post;
    });
    const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;

    // Create tension entry - map body regions to proper format
    const bodyPartsData = Object.keys(preTension).map((region) => ({
      part: region as any, // Region IDs used in this component
      level: Math.round(preTension[region] as number) as 1 | 2 | 3 | 4 | 5,
    }));

    const tensionEntry: TensionEntry = {
      timestamp: Date.now(),
      bodyParts: bodyPartsData,
      preSessionScore: Object.values(preTension).reduce((a, b) => a + b, 0) / Object.values(preTension).length,
      postSessionScore: Object.values(postTension).reduce((a, b) => a + b, 0) / Object.values(postTension).length,
      releaseSuccess: avgImprovement,
    };

    emitBodyScanCompleted(tensionEntry, duration);
    // Show post-mood check instead of completion directly
    setShowPostMoodCheck(true);
  }, [preTension, postTension, startTime]);

  // Handle initiating session (shows pre-mood check first)
  const handleBeginScan = useCallback(() => {
    setShowPreMoodCheck(true);
  }, []);

  // Handle pre-mood selection
  const handlePreMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPreMood(mood);
    setShowPreMoodCheck(false);
    setPhase('scan');
  }, []);

  // Handle pre-mood skip
  const handlePreMoodSkip = useCallback(() => {
    setShowPreMoodCheck(false);
    setPhase('scan');
  }, []);

  // Handle post-mood selection
  const handlePostMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPostMood(mood);
    setShowPostMoodCheck(false);
    setShowComplete(true);
  }, []);

  // Handle post-mood skip
  const handlePostMoodSkip = useCallback(() => {
    setShowPostMoodCheck(false);
    setShowComplete(true);
  }, []);

  // Calculate stats (excluding skipped regions)
  const calculateStats = () => {
    // Filter out skipped regions from calculations
    const scannedRegions = Object.keys(preTension).filter(
      (region) => !skippedRegions.includes(region)
    );

    if (scannedRegions.length === 0) {
      return { avgPre: '0', avgPost: '0', improvement: '0', scannedCount: 0, skippedCount: skippedRegions.length };
    }

    const avgPre = scannedRegions.reduce((sum, r) => sum + (preTension[r] || 0), 0) / scannedRegions.length;
    const avgPost = scannedRegions.reduce((sum, r) => sum + (postTension[r] || 0), 0) / scannedRegions.length;
    const improvement = Math.round((avgPre - avgPost) * 10) / 10;

    return {
      avgPre: avgPre.toFixed(1),
      avgPost: avgPost.toFixed(1),
      improvement: improvement > 0 ? `+${improvement}` : improvement.toString(),
      scannedCount: scannedRegions.length,
      skippedCount: skippedRegions.length,
    };
  };

  return (
    <GameContainer
      gameId="body_scan"
      title="Body Scan Release"
      subtitle="Somatic Awareness"
      onClose={handleClose}
    >
      {phase === 'intro' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView delay={100}>
            <GameCard style={styles.introCard}>
              <Text style={styles.introTitle}>Release What You Carry</Text>
              <Text style={styles.introText}>
                Our bodies store emotions and tension, often without us realizing.
                This gentle scan will help you notice where you're holding stress
                and guide you to release it with compassion.
              </Text>
              <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
            </GameCard>
          </FadeInView>

          <FadeInView delay={200}>
            <View style={styles.bodyPreview}>
              <BodySilhouette
                currentRegion={null}
                tensionMap={{}}
              />
            </View>
          </FadeInView>

          <FadeInView delay={300}>
            <GameCard>
              <Text style={styles.instructionTitle}>How It Works</Text>
              <View style={styles.instructionList}>
                <Text style={styles.instructionItem}>1. We'll scan 9 body regions</Text>
                <Text style={styles.instructionItem}>2. Rate your tension before and after each</Text>
                <Text style={styles.instructionItem}>3. Follow the release prompts</Text>
                <Text style={styles.instructionItem}>4. Take your time - there's no rush</Text>
              </View>
            </GameCard>
          </FadeInView>

          <FadeInView delay={400}>
            <View style={styles.scriptureIntro}>
              <Text style={styles.scriptureText}>
                "Come to me, all who are weary and burdened, and I will give you rest."
              </Text>
              <Text style={styles.scriptureRef}>- Matthew 11:28</Text>
            </View>
          </FadeInView>
        </ScrollView>
      )}

      {phase === 'scan' && (
        <View style={styles.scanContainer}>
          {/* Progress */}
          <View style={styles.progressContainer}>
            <AnimatedProgressBar
              progress={progress}
              height={6}
              colors={GAME_GRADIENTS.bodyScan.colors}
            />
            <Text style={styles.progressText}>
              {currentRegionIndex + 1} of {BODY_REGIONS.length}
            </Text>
          </View>

          {/* Body visualization */}
          <View style={styles.bodyVisual}>
            <BodySilhouette
              currentRegion={currentRegion.id}
              tensionMap={showRelease ? postTension : preTension}
            />
          </View>

          {/* Region instruction */}
          <FadeInView key={`${currentRegion.id}-${showRelease}`}>
            <GameCard style={styles.regionCard}>
              <Text style={styles.regionName}>{currentRegion.displayName}</Text>

              {!showRelease ? (
                <>
                  <Text style={styles.regionInstruction}>
                    {currentRegion.instruction}
                  </Text>
                  <TensionSlider
                    value={currentTension}
                    onChange={setCurrentTension}
                    label="How much tension do you feel?"
                  />
                  {/* Trauma-informed skip option */}
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkipRegion}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipButtonText}>Skip this area</Text>
                    <Text style={styles.skipButtonSubtext}>It's okay to move on</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.releasePrompt}>
                    {currentRegion.releasePrompt}
                  </Text>
                  <View style={styles.scriptureBox}>
                    <Text style={styles.regionScripture}>
                      {currentRegion.scripture}
                    </Text>
                  </View>
                  <TensionSlider
                    value={currentTension}
                    onChange={setCurrentTension}
                    label="How does it feel now?"
                  />
                  {/* Trauma-informed skip option during release phase too */}
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkipRegion}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipButtonText}>Skip this area</Text>
                    <Text style={styles.skipButtonSubtext}>You can return another time</Text>
                  </TouchableOpacity>
                </>
              )}
            </GameCard>
          </FadeInView>
        </View>
      )}

      {phase === 'complete' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView>
            <GameCard style={styles.completeCard}>
              <Text style={styles.completeTitle}>Scan Complete</Text>
              <Text style={styles.completeSubtitle}>
                You've journeyed through your body with awareness
              </Text>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Before</Text>
                  <Text style={styles.statValue}>{calculateStats().avgPre}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>After</Text>
                  <Text style={[styles.statValue, styles.statValueHighlight]}>
                    {calculateStats().avgPost}
                  </Text>
                </View>
              </View>

              <View style={styles.bodyResultPreview}>
                <BodySilhouette
                  currentRegion={null}
                  tensionMap={postTension}
                />
              </View>
            </GameCard>
          </FadeInView>
        </ScrollView>
      )}

      {/* Footer buttons */}
      <GameFooter>
        {phase === 'intro' && !showPreMoodCheck && (
          <GradientButton
            title="Begin Body Scan"
            onPress={handleBeginScan}
          />
        )}
        {phase === 'scan' && (
          <GradientButton
            title={!showRelease ? "Record & Release" :
                   currentRegionIndex < BODY_REGIONS.length - 1 ? "Next Region" : "Complete Scan"}
            onPress={handleRecordTension}
          />
        )}
        {phase === 'complete' && (
          <GradientButton
            title="Finish"
            onPress={handleComplete}
          />
        )}
      </GameFooter>

      {/* Completion Modal */}
      <SessionComplete
        visible={showComplete}
        title="Body Scan Complete"
        subtitle={skippedRegions.length > 0
          ? "You honored your boundaries today"
          : "You've released tension with awareness"}
        stats={[
          { label: 'Scanned', value: calculateStats().scannedCount || BODY_REGIONS.length - skippedRegions.length },
          { label: 'Improvement', value: calculateStats().improvement },
        ]}
        encouragement={skippedRegions.length > 0
          ? "Some areas weren't ready today, and that's perfectly okay. Healing happens in your own time. You showed courage just by showing up."
          : "Your body is a temple. By listening to it with compassion, you honor the gift you've been given."}
        onContinue={() => {
          setShowComplete(false);
          handleClose();
        }}
        continueLabel="Return to Games"
      />

      {/* Why This Works Modal */}
      <WhyThisWorks
        visible={showWhyThisWorks}
        gameId="body_scan"
        onClose={() => setShowWhyThisWorks(false)}
      />

      {/* Pre-Session Mood Check-In */}
      <SessionMoodCheckIn
        visible={showPreMoodCheck}
        type="pre"
        onSelect={handlePreMoodSelect}
        onSkip={handlePreMoodSkip}
      />

      {/* Post-Session Mood Check-In */}
      <SessionMoodCheckIn
        visible={showPostMoodCheck}
        type="post"
        preMood={preMood || undefined}
        onSelect={handlePostMoodSelect}
        onSkip={handlePostMoodSkip}
      />
    </GameContainer>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  // Intro
  introCard: {
    marginBottom: SPACING.lg,
  },
  introTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },
  bodyPreview: {
    height: 200,
    marginBottom: SPACING.lg,
  },
  instructionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },
  instructionList: {
    gap: SPACING.sm,
  },
  instructionItem: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  scriptureIntro: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  scriptureText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },
  scriptureRef: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.sm,
  },

  // Scan
  scanContainer: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  bodyVisual: {
    height: 180,
    marginBottom: SPACING.lg,
  },
  regionCard: {},
  regionName: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: GAME_COLORS.bodyScan.primary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  regionInstruction: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
    marginBottom: SPACING.lg,
  },
  releasePrompt: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
    marginBottom: SPACING.md,
  },
  scriptureBox: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  regionScripture: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Tension Slider
  sliderContainer: {
    marginTop: SPACING.md,
  },
  sliderLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.warmBeige,
    borderWidth: 2,
    borderColor: COLORS.softIvory,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  sliderMinLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  sliderMaxLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },

  // Body Silhouette
  bodyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  bodyOutline: {
    alignItems: 'center',
    width: 100,
  },
  bodyPart: {
    backgroundColor: COLORS.warmBeige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyHead: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  bodyNeck: {
    width: 16,
    height: 12,
    backgroundColor: COLORS.warmBeige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyTorso: {
    alignItems: 'center',
  },
  bodyShoulders: {
    width: 80,
    height: 12,
    backgroundColor: COLORS.warmBeige,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyChest: {
    width: 60,
    height: 40,
    backgroundColor: COLORS.warmBeige,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  bodyStomach: {
    width: 50,
    height: 30,
    backgroundColor: COLORS.warmBeige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyArms: {
    position: 'absolute',
    top: 60,
    width: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bodyArm: {
    width: 12,
    height: 60,
    backgroundColor: COLORS.warmBeige,
    borderRadius: 6,
  },
  armsDot: {
    position: 'absolute',
    left: '50%',
    top: 20,
  },
  bodyLegs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  bodyLeg: {
    width: 18,
    height: 50,
    backgroundColor: COLORS.warmBeige,
    borderRadius: 8,
  },
  legsDot: {
    position: 'absolute',
    left: '50%',
    top: 20,
  },
  bodyFeet: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  bodyFoot: {
    width: 20,
    height: 10,
    backgroundColor: COLORS.warmBeige,
    borderRadius: 5,
  },
  feetDot: {
    position: 'absolute',
    left: '50%',
    top: 0,
  },

  // Complete
  completeCard: {
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xs,
  },
  completeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.display,
    fontWeight: '700',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  statValueHighlight: {
    color: GAME_COLORS.bodyScan.release,
  },
  bodyResultPreview: {
    height: 150,
    width: 100,
  },

  // Skip Button (trauma-informed)
  skipButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.warmBeige,
  },
  skipButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  skipButtonSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
    marginTop: 2,
    opacity: 0.7,
  },
});

export default BodyScanRelease;
