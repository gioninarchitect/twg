/**
 * Body Scan Release
 * Somatic awareness and tension release exercise
 * Unlocks: Day 22
 *
 * Premium UI v2.0 - Immersive body awareness experience
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
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// BODY REGIONS WITH VISUAL POSITIONS
// ============================================

interface BodyRegion {
  id: string;
  nameKey: string;
  displayNameKey: string;
  instructionKey: string;
  releasePromptKey: string;
  scriptureKey: string;
  icon: string;
  // Visual position on body silhouette (percentage)
  visualPosition: { top: number; left: number };
}

const BODY_REGIONS: BodyRegion[] = [
  {
    id: 'head',
    nameKey: 'brainGames.bodyScan.regions.head.name',
    displayNameKey: 'brainGames.bodyScan.regions.head.displayName',
    instructionKey: 'brainGames.bodyScan.regions.head.instruction',
    releasePromptKey: 'brainGames.bodyScan.regions.head.releasePrompt',
    scriptureKey: 'brainGames.bodyScan.regions.head.scripture',
    icon: 'sunny-outline',
    visualPosition: { top: 8, left: 50 },
  },
  {
    id: 'neck',
    nameKey: 'brainGames.bodyScan.regions.neck.name',
    displayNameKey: 'brainGames.bodyScan.regions.neck.displayName',
    instructionKey: 'brainGames.bodyScan.regions.neck.instruction',
    releasePromptKey: 'brainGames.bodyScan.regions.neck.releasePrompt',
    scriptureKey: 'brainGames.bodyScan.regions.neck.scripture',
    icon: 'mic-outline',
    visualPosition: { top: 18, left: 50 },
  },
  {
    id: 'shoulders',
    nameKey: 'brainGames.bodyScan.regions.shoulders.name',
    displayNameKey: 'brainGames.bodyScan.regions.shoulders.displayName',
    instructionKey: 'brainGames.bodyScan.regions.shoulders.instruction',
    releasePromptKey: 'brainGames.bodyScan.regions.shoulders.releasePrompt',
    scriptureKey: 'brainGames.bodyScan.regions.shoulders.scripture',
    icon: 'fitness-outline',
    visualPosition: { top: 24, left: 50 },
  },
  {
    id: 'chest',
    nameKey: 'brainGames.bodyScan.regions.chest.name',
    displayNameKey: 'brainGames.bodyScan.regions.chest.displayName',
    instructionKey: 'brainGames.bodyScan.regions.chest.instruction',
    releasePromptKey: 'brainGames.bodyScan.regions.chest.releasePrompt',
    scriptureKey: 'brainGames.bodyScan.regions.chest.scripture',
    icon: 'heart-outline',
    visualPosition: { top: 35, left: 50 },
  },
  {
    id: 'stomach',
    nameKey: 'brainGames.bodyScan.regions.stomach.name',
    displayNameKey: 'brainGames.bodyScan.regions.stomach.displayName',
    instructionKey: 'brainGames.bodyScan.regions.stomach.instruction',
    releasePromptKey: 'brainGames.bodyScan.regions.stomach.releasePrompt',
    scriptureKey: 'brainGames.bodyScan.regions.stomach.scripture',
    icon: 'ellipse-outline',
    visualPosition: { top: 48, left: 50 },
  },
  {
    id: 'back',
    nameKey: 'brainGames.bodyScan.regions.back.name',
    displayNameKey: 'brainGames.bodyScan.regions.back.displayName',
    instructionKey: 'brainGames.bodyScan.regions.back.instruction',
    releasePromptKey: 'brainGames.bodyScan.regions.back.releasePrompt',
    scriptureKey: 'brainGames.bodyScan.regions.back.scripture',
    icon: 'shield-outline',
    visualPosition: { top: 55, left: 50 },
  },
  {
    id: 'hands',
    nameKey: 'brainGames.bodyScan.regions.hands.name',
    displayNameKey: 'brainGames.bodyScan.regions.hands.displayName',
    instructionKey: 'brainGames.bodyScan.regions.hands.instruction',
    releasePromptKey: 'brainGames.bodyScan.regions.hands.releasePrompt',
    scriptureKey: 'brainGames.bodyScan.regions.hands.scripture',
    icon: 'hand-left-outline',
    visualPosition: { top: 45, left: 20 },
  },
  {
    id: 'legs',
    nameKey: 'brainGames.bodyScan.regions.legs.name',
    displayNameKey: 'brainGames.bodyScan.regions.legs.displayName',
    instructionKey: 'brainGames.bodyScan.regions.legs.instruction',
    releasePromptKey: 'brainGames.bodyScan.regions.legs.releasePrompt',
    scriptureKey: 'brainGames.bodyScan.regions.legs.scripture',
    icon: 'walk-outline',
    visualPosition: { top: 68, left: 50 },
  },
  {
    id: 'feet',
    nameKey: 'brainGames.bodyScan.regions.feet.name',
    displayNameKey: 'brainGames.bodyScan.regions.feet.displayName',
    instructionKey: 'brainGames.bodyScan.regions.feet.instruction',
    releasePromptKey: 'brainGames.bodyScan.regions.feet.releasePrompt',
    scriptureKey: 'brainGames.bodyScan.regions.feet.scripture',
    icon: 'footsteps-outline',
    visualPosition: { top: 88, left: 50 },
  },
];

// ============================================
// ANIMATED ENERGY PARTICLE
// ============================================

interface EnergyParticleProps {
  delay: number;
  color: string;
  size: number;
  startX: number;
  startY: number;
}

function EnergyParticle({ delay, color, size, startX, startY }: EnergyParticleProps) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      animation.setValue(0);
      Animated.timing(animation, {
        toValue: 1,
        duration: 3000 + Math.random() * 2000,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, []);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100 - Math.random() * 50],
  });

  const translateX = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.8, 0.4, 0],
  });

  const scale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.5],
  });

  return (
    <Animated.View
      style={[
        styles.energyParticle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: startX,
          top: startY,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
}

// ============================================
// GLOWING BODY REGION MARKER
// ============================================

interface RegionMarkerProps {
  region: BodyRegion;
  isActive: boolean;
  isScanned: boolean;
  tensionLevel?: number;
  onPress?: () => void;
}

function RegionMarker({ region, isActive, isScanned, tensionLevel, onPress }: RegionMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const colors = GAME_COLORS.bodyScan;

  useEffect(() => {
    if (isActive) {
      // Pulsing animation for active region
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isActive]);

  const getTensionColor = () => {
    if (!tensionLevel) return colors.neutral;
    if (tensionLevel <= 3) return colors.release;
    if (tensionLevel <= 6) return colors.neutral;
    return colors.tension;
  };

  const markerColor = isScanned ? getTensionColor() : isActive ? colors.primary : 'rgba(255,255,255,0.2)';

  return (
    <TouchableOpacity
      style={[
        styles.regionMarker,
        {
          top: `${region.visualPosition.top}%`,
          left: `${region.visualPosition.left}%`,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      {isActive && (
        <Animated.View
          style={[
            styles.regionGlow,
            {
              backgroundColor: colors.primary,
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.5],
              }),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}
      <Animated.View
        style={[
          styles.regionDot,
          {
            backgroundColor: markerColor,
            transform: [{ scale: isActive ? pulseAnim : 1 }],
            borderColor: isActive ? colors.primary : 'transparent',
            borderWidth: isActive ? 2 : 0,
          },
        ]}
      >
        {isActive && (
          <Ionicons name={region.icon as any} size={14} color="#fff" />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ============================================
// BODY SILHOUETTE v2
// ============================================

interface BodySilhouetteV2Props {
  currentRegionId: string | null;
  tensionMap: Record<string, number>;
  showParticles?: boolean;
}

function BodySilhouetteV2({ currentRegionId, tensionMap, showParticles }: BodySilhouetteV2Props) {
  const colors = GAME_COLORS.bodyScan;
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle breathing animation for the body
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const currentRegion = BODY_REGIONS.find(r => r.id === currentRegionId);

  return (
    <View style={styles.bodyContainerV2}>
      {/* Background glow */}
      <View style={styles.bodyGlowBg}>
        <LinearGradient
          colors={['transparent', 'rgba(138, 180, 248, 0.1)', 'transparent']}
          style={styles.bodyGlowGradient}
        />
      </View>

      {/* Body shape */}
      <Animated.View style={[styles.bodyShape, { transform: [{ scale: breatheScale }] }]}>
        {/* Head */}
        <View style={styles.bodyHead2} />
        {/* Neck */}
        <View style={styles.bodyNeck2} />
        {/* Torso */}
        <View style={styles.bodyTorso2} />
        {/* Arms */}
        <View style={styles.bodyArms2}>
          <View style={styles.bodyArmLeft2} />
          <View style={styles.bodyArmRight2} />
        </View>
        {/* Legs */}
        <View style={styles.bodyLegs2}>
          <View style={styles.bodyLegLeft2} />
          <View style={styles.bodyLegRight2} />
        </View>
      </Animated.View>

      {/* Region markers */}
      {BODY_REGIONS.map((region) => (
        <RegionMarker
          key={region.id}
          region={region}
          isActive={region.id === currentRegionId}
          isScanned={!!tensionMap[region.id]}
          tensionLevel={tensionMap[region.id]}
        />
      ))}

      {/* Release particles */}
      {showParticles && currentRegion && (
        <>
          {[...Array(8)].map((_, i) => (
            <EnergyParticle
              key={i}
              delay={i * 200}
              color={colors.release}
              size={6 + Math.random() * 6}
              startX={SCREEN_WIDTH * 0.3 + Math.random() * SCREEN_WIDTH * 0.4}
              startY={200}
            />
          ))}
        </>
      )}
    </View>
  );
}

// ============================================
// VISUAL TENSION ARC
// ============================================

interface TensionArcProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  t: (key: string) => string;
}

function TensionArc({ value, onChange, label, t }: TensionArcProps) {
  const colors = GAME_COLORS.bodyScan;
  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const handlePress = (newValue: number) => {
    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
    onChange(newValue);
  };

  const getColorForLevel = (level: number) => {
    if (level <= 3) return colors.release;
    if (level <= 6) return colors.neutral;
    return colors.tension;
  };

  return (
    <View style={styles.tensionArcContainer}>
      <Text style={styles.tensionLabel}>{label}</Text>

      {/* Tension level display */}
      <View style={styles.tensionValueDisplay}>
        <Text style={[styles.tensionValue, { color: getColorForLevel(value) }]}>
          {value}
        </Text>
        <Text style={styles.tensionValueLabel}>
          {value <= 3 ? t('brainGames.bodyScan.tensionLevels.relaxed') : value <= 6 ? t('brainGames.bodyScan.tensionLevels.moderate') : t('brainGames.bodyScan.tensionLevels.tense')}
        </Text>
      </View>

      {/* Arc of orbs */}
      <View style={styles.tensionArc}>
        {levels.map((level) => {
          const isSelected = level <= value;
          const levelColor = getColorForLevel(level);

          return (
            <TouchableOpacity
              key={level}
              style={[
                styles.tensionOrb,
                isSelected && {
                  backgroundColor: levelColor,
                  shadowColor: levelColor,
                  shadowOpacity: 0.6,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
              onPress={() => handlePress(level)}
              activeOpacity={0.7}
            >
              {isSelected && (
                <View style={styles.tensionOrbInner} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.tensionLabels}>
        <Text style={styles.tensionMinLabel}>{t('brainGames.bodyScan.tensionLevels.none')}</Text>
        <Text style={styles.tensionMaxLabel}>{t('brainGames.bodyScan.tensionLevels.high')}</Text>
      </View>
    </View>
  );
}

// ============================================
// REGION JOURNEY CARD
// ============================================

interface RegionJourneyCardProps {
  region: BodyRegion;
  phase: 'sense' | 'release';
  tension: number;
  onTensionChange: (value: number) => void;
  onSkip: () => void;
  t: (key: string) => string;
}

function RegionJourneyCard({ region, phase, tension, onTensionChange, onSkip, t }: RegionJourneyCardProps) {
  const colors = GAME_COLORS.bodyScan;
  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    safeHaptics.impact(ImpactFeedbackStyle.Light);
    const toValue = isExpanded ? 0 : 1;
    Animated.spring(expandAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
    setIsExpanded(!isExpanded);
  };

  // Animate content height
  const contentHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280], // Collapsed to expanded height
  });

  const chevronRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.journeyCard}>
      <LinearGradient
        colors={['#1a1a2e', '#16162a', '#0f0f1a']}
        style={styles.journeyCardBg}
      />

      {/* Collapsible header - tap to expand */}
      <TouchableOpacity
        style={styles.journeyHeader}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={[styles.journeyIcon, { backgroundColor: colors.primary + '30' }]}>
          <Ionicons name={region.icon as any} size={24} color={colors.primary} />
        </View>
        <View style={styles.journeyTitleContainer}>
          <Text style={styles.journeyTitle}>{t(region.displayNameKey)}</Text>
          <Text style={styles.journeyPhase}>
            {phase === 'sense' ? t('brainGames.bodyScan.phases.sensing') : t('brainGames.bodyScan.phases.releasing')}
            {!isExpanded && ' - ' + t('brainGames.bodyScan.tapForInstructions')}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Ionicons name="chevron-down" size={24} color={COLORS.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Collapsible content */}
      <Animated.View style={[styles.journeyContentCollapsible, { height: contentHeight }]}>
        {/* Phase content */}
        {phase === 'sense' ? (
          <View style={styles.journeyContent}>
            <Text style={styles.journeyInstruction}>
              {t(region.instructionKey)}
            </Text>
            <TensionArc
              value={tension}
              onChange={onTensionChange}
              label={t('brainGames.bodyScan.tensionQuestion.before')}
              t={t}
            />
          </View>
        ) : (
          <View style={styles.journeyContent}>
            <View style={styles.releasePromptBox}>
              <Text style={styles.releasePromptText}>
                {t(region.releasePromptKey)}
              </Text>
            </View>

            <View style={styles.scriptureCard}>
              <Ionicons name="book-outline" size={16} color={colors.primary} />
              <Text style={styles.scriptureText}>
                {t(region.scriptureKey)}
              </Text>
            </View>

            <TensionArc
              value={tension}
              onChange={onTensionChange}
              label={t('brainGames.bodyScan.tensionQuestion.after')}
              t={t}
            />
          </View>
        )}

        {/* Skip option */}
        <TouchableOpacity style={styles.skipOption} onPress={onSkip} activeOpacity={0.7}>
          <Ionicons name="arrow-forward-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.skipText}>{t('brainGames.bodyScan.skipArea')}</Text>
          <Text style={styles.skipSubtext}>{t('brainGames.bodyScan.skipSubtext')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ============================================
// PROGRESS JOURNEY
// ============================================

interface ProgressJourneyProps {
  currentIndex: number;
  total: number;
  scannedRegions: string[];
  t: (key: string, params?: Record<string, any>) => string;
}

function ProgressJourney({ currentIndex, total, scannedRegions, t }: ProgressJourneyProps) {
  const colors = GAME_COLORS.bodyScan;

  return (
    <View style={styles.progressJourney}>
      <View style={styles.progressTrack}>
        {BODY_REGIONS.map((region, index) => {
          const isCompleted = scannedRegions.includes(region.id);
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;

          return (
            <View key={region.id} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  isCompleted && { backgroundColor: colors.release },
                  isCurrent && {
                    backgroundColor: colors.primary,
                    transform: [{ scale: 1.3 }],
                  },
                  !isCompleted && !isCurrent && { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}
              />
              {index < BODY_REGIONS.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    (isCompleted || isPast) && { backgroundColor: colors.release },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
      <Text style={styles.progressLabel}>
        {t('brainGames.bodyScan.regionProgress', { current: currentIndex + 1, total })}
      </Text>
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
  const { t } = useTranslation();
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
  const [showParticles, setShowParticles] = useState(false);

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
      setShowParticles(true);
      // Hide particles after animation
      setTimeout(() => setShowParticles(false), 3000);
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

  // Handle skipping a region
  const handleSkipRegion = useCallback(() => {
    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
    setSkippedRegions((prev) => [...prev, currentRegion.id]);

    if (currentRegionIndex < BODY_REGIONS.length - 1) {
      setCurrentRegionIndex((prev) => prev + 1);
      setShowRelease(false);
      setCurrentTension(5);
    } else {
      setPhase('complete');
    }
  }, [currentRegion, currentRegionIndex]);

  // Handle completion
  const handleComplete = useCallback(() => {
    const duration = Math.floor((Date.now() - startTime) / 1000);

    const hotspots = Object.entries(preTension)
      .filter(([_, tension]) => tension >= 7)
      .map(([region]) => region);

    const improvements = Object.keys(preTension).map((region) => {
      const pre = preTension[region] || 0;
      const post = postTension[region] || 0;
      return pre - post;
    });
    const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;

    const bodyPartsData = Object.keys(preTension).map((region) => ({
      part: region as any,
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
    setShowPostMoodCheck(true);
  }, [preTension, postTension, startTime]);

  const handleBeginScan = useCallback(() => {
    setShowPreMoodCheck(true);
  }, []);

  const handlePreMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPreMood(mood);
    setShowPreMoodCheck(false);
    setPhase('scan');
  }, []);

  const handlePreMoodSkip = useCallback(() => {
    setShowPreMoodCheck(false);
    setPhase('scan');
  }, []);

  const handlePostMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPostMood(mood);
    setShowPostMoodCheck(false);
    setShowComplete(true);
  }, []);

  const handlePostMoodSkip = useCallback(() => {
    setShowPostMoodCheck(false);
    setShowComplete(true);
  }, []);

  const calculateStats = () => {
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
      title={t('brainGames.bodyScan.title')}
      subtitle={t('brainGames.bodyScan.subtitle')}
      onClose={handleClose}
    >
      {phase === 'intro' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView delay={100}>
            <View style={styles.introHero}>
              <LinearGradient
                colors={['#1a2a3a', '#0f1a2a', '#0a0f1a']}
                style={styles.introHeroBg}
              />
              <BodySilhouetteV2
                currentRegionId={null}
                tensionMap={{}}
              />
            </View>
          </FadeInView>

          <FadeInView delay={200}>
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>{t('brainGames.bodyScan.intro.title')}</Text>
              <Text style={styles.introText}>
                {t('brainGames.bodyScan.intro.description')}
              </Text>
              <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
            </View>
          </FadeInView>

          <FadeInView delay={300}>
            <View style={styles.howItWorks}>
              <Text style={styles.howItWorksTitle}>{t('brainGames.bodyScan.journey.title')}</Text>
              {[
                { icon: 'body-outline', textKey: 'brainGames.bodyScan.journey.step1' },
                { icon: 'pulse-outline', textKey: 'brainGames.bodyScan.journey.step2' },
                { icon: 'sparkles-outline', textKey: 'brainGames.bodyScan.journey.step3' },
                { icon: 'time-outline', textKey: 'brainGames.bodyScan.journey.step4' },
              ].map((item, index) => (
                <View key={index} style={styles.howItWorksItem}>
                  <View style={styles.howItWorksIcon}>
                    <Ionicons name={item.icon as any} size={20} color={GAME_COLORS.bodyScan.primary} />
                  </View>
                  <Text style={styles.howItWorksText}>{t(item.textKey)}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          <FadeInView delay={400}>
            <View style={styles.scriptureIntro}>
              <Ionicons name="book-outline" size={20} color={GAME_COLORS.bodyScan.primary} />
              <Text style={styles.scriptureQuote}>
                {t('brainGames.bodyScan.intro.scripture')}
              </Text>
              <Text style={styles.scriptureRef}>{t('brainGames.bodyScan.intro.scriptureRef')}</Text>
            </View>
          </FadeInView>
        </ScrollView>
      )}

      {phase === 'scan' && (
        <View style={styles.scanContainer}>
          {/* Progress journey */}
          <ProgressJourney
            currentIndex={currentRegionIndex}
            total={BODY_REGIONS.length}
            scannedRegions={Object.keys(preTension)}
            t={t}
          />

          {/* Body visualization */}
          <View style={styles.bodyVisualContainer}>
            <BodySilhouetteV2
              currentRegionId={currentRegion.id}
              tensionMap={showRelease ? postTension : preTension}
              showParticles={showParticles}
            />
          </View>

          {/* Region journey card */}
          <FadeInView key={`${currentRegion.id}-${showRelease}`}>
            <RegionJourneyCard
              region={currentRegion}
              phase={showRelease ? 'release' : 'sense'}
              tension={currentTension}
              onTensionChange={setCurrentTension}
              onSkip={handleSkipRegion}
              t={t}
            />
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
            <View style={styles.completeCard}>
              <LinearGradient
                colors={['#1a2a3a', '#0f1a2a', '#0a0f1a']}
                style={styles.completeCardBg}
              />

              <Ionicons name="checkmark-circle" size={64} color={GAME_COLORS.bodyScan.release} />
              <Text style={styles.completeTitle}>{t('brainGames.bodyScan.complete.title')}</Text>
              <Text style={styles.completeSubtitle}>
                {t('brainGames.bodyScan.complete.subtitle')}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>{t('brainGames.bodyScan.complete.before')}</Text>
                  <Text style={styles.statValue}>{calculateStats().avgPre}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>{t('brainGames.bodyScan.complete.after')}</Text>
                  <Text style={[styles.statValue, { color: GAME_COLORS.bodyScan.release }]}>
                    {calculateStats().avgPost}
                  </Text>
                </View>
              </View>

              <View style={styles.bodyResultContainer}>
                <BodySilhouetteV2
                  currentRegionId={null}
                  tensionMap={postTension}
                />
              </View>
            </View>
          </FadeInView>
        </ScrollView>
      )}

      {/* Footer buttons */}
      <GameFooter>
        {phase === 'intro' && !showPreMoodCheck && (
          <GradientButton
            title={t('brainGames.bodyScan.buttons.beginScan')}
            onPress={handleBeginScan}
          />
        )}
        {phase === 'scan' && (
          <GradientButton
            title={!showRelease ? t('brainGames.bodyScan.buttons.recordRelease') :
                   currentRegionIndex < BODY_REGIONS.length - 1 ? t('brainGames.bodyScan.buttons.nextRegion') : t('brainGames.bodyScan.buttons.completeScan')}
            onPress={handleRecordTension}
          />
        )}
        {phase === 'complete' && (
          <GradientButton
            title={t('brainGames.bodyScan.buttons.finish')}
            onPress={handleComplete}
          />
        )}
      </GameFooter>

      {/* Completion Modal */}
      <SessionComplete
        visible={showComplete}
        title={t('brainGames.bodyScan.sessionComplete.title')}
        subtitle={skippedRegions.length > 0
          ? t('brainGames.bodyScan.sessionComplete.subtitleSkipped')
          : t('brainGames.bodyScan.sessionComplete.subtitle')}
        stats={[
          { label: t('brainGames.bodyScan.sessionComplete.scanned'), value: calculateStats().scannedCount || BODY_REGIONS.length - skippedRegions.length },
          { label: t('brainGames.bodyScan.sessionComplete.improvement'), value: calculateStats().improvement },
        ]}
        encouragement={skippedRegions.length > 0
          ? t('brainGames.bodyScan.sessionComplete.encouragementSkipped')
          : t('brainGames.bodyScan.sessionComplete.encouragement')}
        onContinue={() => {
          setShowComplete(false);
          handleClose();
        }}
        continueLabel={t('brainGames.bodyScan.sessionComplete.returnToGames')}
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

  // Intro Hero
  introHero: {
    height: 280,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  introHeroBg: {
    ...StyleSheet.absoluteFillObject,
  },

  // Intro Card
  introCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },

  // How It Works
  howItWorks: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  howItWorksTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  howItWorksIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(138, 180, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  howItWorksText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    flex: 1,
  },

  // Scripture Intro
  scriptureIntro: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  scriptureQuote: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: SPACING.sm,
  },
  scriptureRef: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },

  // Scan Container
  scanContainer: {
    flex: 1,
  },

  // Progress Journey
  progressJourney: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressLine: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 2,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Body Visual Container
  bodyVisualContainer: {
    height: 220,
    marginBottom: SPACING.md,
  },

  // Body Silhouette V2
  bodyContainerV2: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bodyGlowBg: {
    position: 'absolute',
    width: 200,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyGlowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  bodyShape: {
    alignItems: 'center',
    opacity: 0.3,
  },
  bodyHead2: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 5,
  },
  bodyNeck2: {
    width: 20,
    height: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  bodyTorso2: {
    width: 80,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  bodyArms2: {
    position: 'absolute',
    top: 75,
    flexDirection: 'row',
    width: 160,
    justifyContent: 'space-between',
  },
  bodyArmLeft2: {
    width: 18,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 9,
  },
  bodyArmRight2: {
    width: 18,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 9,
  },
  bodyLegs2: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  bodyLegLeft2: {
    width: 25,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
  },
  bodyLegRight2: {
    width: 25,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
  },

  // Region Marker
  regionMarker: {
    position: 'absolute',
    width: 36,
    height: 36,
    marginLeft: -18,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  regionDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Energy Particle
  energyParticle: {
    position: 'absolute',
  },

  // Journey Card
  journeyCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginHorizontal: SPACING.md,
  },
  journeyCardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  journeyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  journeyTitleContainer: {
    flex: 1,
  },
  journeyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  journeyPhase: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: GAME_COLORS.bodyScan.primary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  journeyContentCollapsible: {
    overflow: 'hidden',
  },
  journeyContent: {
    padding: SPACING.lg,
  },
  journeyInstruction: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },

  // Release Prompt
  releasePromptBox: {
    backgroundColor: 'rgba(138, 180, 248, 0.1)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: GAME_COLORS.bodyScan.primary,
  },
  releasePromptText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: 24,
  },

  // Scripture Card
  scriptureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  scriptureText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Tension Arc
  tensionArcContainer: {
    alignItems: 'center',
  },
  tensionLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.sm,
  },
  tensionValueDisplay: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tensionValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  tensionValueLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
  tensionArc: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  tensionOrb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tensionOrbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  tensionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.sm,
  },
  tensionMinLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
  tensionMaxLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },

  // Skip Option
  skipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: SPACING.xs,
  },
  skipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
  skipSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
    opacity: 0.7,
  },

  // Complete Card
  completeCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  completeCardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.md,
  },
  completeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  bodyResultContainer: {
    height: 200,
    width: '100%',
  },
});

export default BodyScanRelease;
