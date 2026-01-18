/**
 * Gratitude Garden
 * Plant seeds of thankfulness based on Positive Psychology
 * Unlocks: Day 1
 *
 * Premium UI v2.0 - Immersive garden scene with engaging animations
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Easing,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../../utils/haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme/colors';
import { GAME_COLORS, GAME_GRADIENTS } from '../../theme/brainGames';
import { emitGratitudeEntry } from '../../worldModel';
import { useWorldModel } from '../../worldModel';
import { Button, GradientButton } from '../../components/PremiumUI';
import {
  GameContainer,
  GameCard,
  GameSection,
  GameFooter,
  SessionComplete,
  AnimatedProgressBar,
  FadeInView,
  ScaleBounce,
  FloatingElement,
  useGratitudeSession,
  WhyThisWorks,
  WhyThisWorksButton,
  SessionMoodCheckIn,
  type SessionMoodLevel,
} from '../../components/brainGames';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// GRATITUDE PROMPTS (translation keys)
// ============================================

const GRATITUDE_PROMPT_KEYS = [
  'brainGames.gratitudeGarden.prompts.joyToday',
  'brainGames.gratitudeGarden.prompts.thankfulFor',
  'brainGames.gratitudeGarden.prompts.beautifulNoticed',
  'brainGames.gratitudeGarden.prompts.challengeGrew',
  'brainGames.gratitudeGarden.prompts.bodyGrateful',
  'brainGames.gratitudeGarden.prompts.comfortTaken',
  'brainGames.gratitudeGarden.prompts.prayerAnswered',
  'brainGames.gratitudeGarden.prompts.madeSmile',
  'brainGames.gratitudeGarden.prompts.learnedRecently',
  'brainGames.gratitudeGarden.prompts.kindnessShown',
];

const ENCOURAGEMENT_KEYS = [
  'brainGames.gratitudeGarden.encouragements.gardenGrowing',
  'brainGames.gratitudeGarden.encouragements.lovelySeed',
  'brainGames.gratitudeGarden.encouragements.godSees',
  'brainGames.gratitudeGarden.encouragements.watersSoul',
  'brainGames.gratitudeGarden.encouragements.cultivatingJoy',
];

// Different flower colors for variety
const FLOWER_COLORS = [
  { petal: '#E8B4D8', center: '#FFD93D' }, // Pink
  { petal: '#B4D8E8', center: '#FFD93D' }, // Blue
  { petal: '#D8E8B4', center: '#FFD93D' }, // Green
  { petal: '#E8D4B4', center: '#FFD93D' }, // Peach
  { petal: '#D4B4E8', center: '#FFD93D' }, // Purple
  { petal: '#FFB4B4', center: '#FFD93D' }, // Coral
];

// ============================================
// FLOATING CLOUD COMPONENT
// ============================================

function FloatingCloud({ delay, size, top }: { delay: number; size: number; top: number }) {
  const translateX = useRef(new Animated.Value(-size)).current;

  useEffect(() => {
    const animate = () => {
      translateX.setValue(-size);
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH + size,
        duration: 30000 + delay * 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => animate());
    };

    setTimeout(animate, delay * 3000);
  }, []);

  return (
    <Animated.View
      style={[
        styles.cloud,
        {
          top,
          width: size,
          height: size * 0.5,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={[styles.cloudPuff, { width: size * 0.4, height: size * 0.4 }]} />
      <View style={[styles.cloudPuff, styles.cloudPuffCenter, { width: size * 0.5, height: size * 0.5 }]} />
      <View style={[styles.cloudPuff, styles.cloudPuffRight, { width: size * 0.35, height: size * 0.35 }]} />
    </Animated.View>
  );
}

// ============================================
// SUN RAYS COMPONENT
// ============================================

function SunRays() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.sunContainer, { transform: [{ rotate: rotation }] }]}>
      {[...Array(8)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.sunRay,
            { transform: [{ rotate: `${i * 45}deg` }] },
          ]}
        />
      ))}
      <View style={styles.sunCenter} />
    </Animated.View>
  );
}

// ============================================
// BUTTERFLY COMPONENT
// ============================================

function Butterfly({ delay }: { delay: number }) {
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const wingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Wing flap animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(wingAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(wingAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Random flight path
    const fly = () => {
      const randomX = Math.random() * (SCREEN_WIDTH - 40);
      const randomY = Math.random() * 150 + 50;
      Animated.timing(position, {
        toValue: { x: randomX, y: randomY },
        duration: 3000 + Math.random() * 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => fly());
    };

    setTimeout(fly, delay * 1000);
  }, []);

  const wingScale = wingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.butterfly,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
          ],
        },
      ]}
    >
      <Animated.View style={[styles.butterflyWing, styles.butterflyWingLeft, { transform: [{ scaleX: wingScale }] }]} />
      <View style={styles.butterflyBody} />
      <Animated.View style={[styles.butterflyWing, styles.butterflyWingRight, { transform: [{ scaleX: wingScale }] }]} />
    </Animated.View>
  );
}

// ============================================
// ENHANCEMENT 1: SPARKLE PARTICLES
// ============================================

interface SparkleProps {
  x: number;
  y: number;
  onComplete: () => void;
}

function SparkleParticles({ x, y, onComplete }: SparkleProps) {
  const particles = useRef(
    [...Array(12)].map(() => ({
      anim: new Animated.Value(0),
      angle: Math.random() * 360,
      distance: 20 + Math.random() * 30,
      size: 4 + Math.random() * 6,
      delay: Math.random() * 100,
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((p) =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel(animations).start(() => onComplete());
  }, []);

  return (
    <View style={[styles.sparkleContainer, { left: x - 30, top: y - 30 }]}>
      {particles.map((p, i) => {
        const translateX = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(p.angle * Math.PI / 180) * p.distance],
        });
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(p.angle * Math.PI / 180) * p.distance],
        });
        const scale = p.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1.2, 0],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, 1, 0],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.sparkle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ============================================
// ENHANCEMENT 2: DAY/NIGHT SKY CYCLE
// ============================================

function getSkyGradient(): string[] {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 7) {
    // Dawn
    return ['#1a1a3a', '#4a3a5a', '#8a5a6a', '#da8a6a'];
  } else if (hour >= 7 && hour < 12) {
    // Morning
    return ['#1a4a8a', '#3a6aaa', '#5a8aca', '#8abadc'];
  } else if (hour >= 12 && hour < 17) {
    // Afternoon
    return ['#1a2a4a', '#2d4a6a', '#4a6a8a', '#6a8aaa'];
  } else if (hour >= 17 && hour < 20) {
    // Sunset
    return ['#2a2a4a', '#5a3a5a', '#9a5a5a', '#da8a4a'];
  } else {
    // Night
    return ['#0a0a1a', '#1a1a3a', '#2a2a4a', '#3a3a5a'];
  }
}

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 5;
}

// ============================================
// ENHANCEMENT 3: FIREFLIES (Night Only)
// ============================================

function Firefly({ delay }: { delay: number }) {
  const position = useRef(new Animated.ValueXY({
    x: Math.random() * (SCREEN_WIDTH - 20),
    y: Math.random() * 100 + 50
  })).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000 + Math.random() * 500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.2,
          duration: 1000 + Math.random() * 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float around
    const drift = () => {
      Animated.timing(position, {
        toValue: {
          x: Math.random() * (SCREEN_WIDTH - 20),
          y: Math.random() * 100 + 50,
        },
        duration: 4000 + Math.random() * 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => drift());
    };

    setTimeout(drift, delay * 500);
  }, []);

  return (
    <Animated.View
      style={[
        styles.firefly,
        {
          opacity: glowAnim,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
          ],
        },
      ]}
    />
  );
}

// ============================================
// ENHANCEMENT 4: RAINBOW CELEBRATION
// ============================================

function RainbowCelebration({ visible }: { visible: boolean }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Fade out after delay
      setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }, 3000);
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

  return (
    <Animated.View
      style={[
        styles.rainbowContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {rainbowColors.map((color, index) => (
        <View
          key={index}
          style={[
            styles.rainbowBand,
            {
              borderColor: color,
              width: 180 - index * 12,
              height: 90 - index * 6,
              borderTopLeftRadius: 90 - index * 6,
              borderTopRightRadius: 90 - index * 6,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

// ============================================
// ENHANCEMENT 5: WATERING CAN ANIMATION
// ============================================

interface WateringCanProps {
  onWater: () => void;
  canWater: boolean;
}

function WateringCan({ onWater, canWater }: WateringCanProps) {
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const [isWatering, setIsWatering] = useState(false);
  const waterDrops = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  const handleWater = () => {
    if (!canWater || isWatering) return;

    setIsWatering(true);
    safeHaptics.impactAsync(ImpactFeedbackStyle.Medium);

    // Tilt can
    Animated.sequence([
      Animated.timing(tiltAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(tiltAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Water drops animation
    waterDrops.forEach((drop, index) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(drop, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(drop, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }, index * 150);
    });

    setTimeout(() => {
      setIsWatering(false);
      onWater();
    }, 1200);
  };

  const rotation = tiltAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg'],
  });

  return (
    <TouchableOpacity
      onPress={handleWater}
      disabled={!canWater || isWatering}
      style={styles.wateringCanContainer}
    >
      <Animated.View style={[styles.wateringCan, { transform: [{ rotate: rotation }] }]}>
        <View style={styles.canBody}>
          <Ionicons
            name="water"
            size={28}
            color={canWater ? '#4A90D9' : '#666'}
          />
        </View>
        <View style={styles.canSpout} />
      </Animated.View>

      {/* Water drops */}
      {isWatering && waterDrops.map((drop, index) => {
        const translateY = drop.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 40],
        });
        const opacity = drop.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.waterDrop,
              {
                left: 35 + index * 4,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          />
        );
      })}

      {canWater && !isWatering && (
        <Text style={styles.wateringHint}>Tap to water</Text>
      )}
    </TouchableOpacity>
  );
}

// ============================================
// ENHANCEMENT 6: GRATITUDE MODAL (Tap to Read)
// ============================================

interface GratitudeModalProps {
  visible: boolean;
  gratitude: string;
  flowerColor: string;
  onClose: () => void;
}

function GratitudeModal({ visible, gratitude, flowerColor, onClose }: GratitudeModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.gratitudeModal,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.modalFlower, { backgroundColor: flowerColor }]}>
            <View style={styles.modalFlowerCenter} />
          </View>
          <Text style={styles.modalGratitudeText}>{gratitude}</Text>
          <Text style={styles.modalHint}>Tap anywhere to close</Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ============================================
// GROWTH STAGES - The Journey
// ============================================

type GrowthStage = 'seed' | 'sprout' | 'stem' | 'bud' | 'bloom';

// ============================================
// ANIMATED SEED COMPONENT
// ============================================

function AnimatedSeed({ onComplete }: { onComplete: () => void }) {
  const dropAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Seed drops into soil
    Animated.sequence([
      Animated.timing(dropAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onComplete());

    safeHaptics.impactAsync(ImpactFeedbackStyle.Medium);
  }, []);

  return (
    <Animated.View
      style={[
        styles.seed,
        {
          transform: [
            { translateY: dropAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.seedBody} />
    </Animated.View>
  );
}

// ============================================
// PREMIUM FLOWER COMPONENT - Full Growth Journey
// ============================================

interface FlowerProps {
  index: number;
  text: string;
  onRemove?: () => void;
  onTap?: (text: string, color: string) => void;
  totalGratitudes?: number; // For evolution
}

function Flower({ index, text, onRemove, onTap, totalGratitudes = 0 }: FlowerProps) {
  const colorSet = FLOWER_COLORS[index % FLOWER_COLORS.length];

  // Animation values for multi-stage growth
  const [stage, setStage] = useState<GrowthStage>('seed');
  const [showSparkles, setShowSparkles] = useState(false);
  const [sparklePosition, setSparklePosition] = useState({ x: 0, y: 0 });
  const seedDropAnim = useRef(new Animated.Value(-30)).current;
  const seedOpacity = useRef(new Animated.Value(1)).current;
  const sproutAnim = useRef(new Animated.Value(0)).current;
  const stemAnim = useRef(new Animated.Value(0)).current;
  const leafAnim = useRef(new Animated.Value(0)).current;
  const budAnim = useRef(new Animated.Value(0)).current;
  const bloomAnim = useRef(new Animated.Value(0)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Determine plant size based on total gratitudes (evolution!)
  const plantScale = totalGratitudes > 50 ? 1.3 : totalGratitudes > 25 ? 1.15 : 1;
  const petalCount = totalGratitudes > 50 ? 8 : totalGratitudes > 25 ? 7 : 6;
  const stemHeight = totalGratitudes > 50 ? 60 : totalGratitudes > 25 ? 50 : 40;

  useEffect(() => {
    // Multi-stage growth animation - THE JOURNEY
    const runGrowthJourney = async () => {
      // Stage 1: Seed drops
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
      await new Promise<void>((resolve) => {
        Animated.timing(seedDropAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.bounce,
          useNativeDriver: true,
        }).start(() => resolve());
      });

      // Seed burrows into soil
      await new Promise<void>((resolve) => {
        Animated.parallel([
          Animated.timing(seedDropAnim, {
            toValue: 10,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(seedOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => resolve());
      });

      setStage('sprout');
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);

      // Stage 2: Tiny sprout emerges
      await new Promise<void>((resolve) => {
        Animated.spring(sproutAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }).start(() => resolve());
      });

      await new Promise((resolve) => setTimeout(resolve, 150));
      setStage('stem');
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);

      // Stage 3: Stem grows up
      await new Promise<void>((resolve) => {
        Animated.timing(stemAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => resolve());
      });

      // Leaves unfurl
      Animated.spring(leafAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();

      await new Promise((resolve) => setTimeout(resolve, 200));
      setStage('bud');
      safeHaptics.impactAsync(ImpactFeedbackStyle.Medium);

      // Stage 4: Bud forms
      await new Promise<void>((resolve) => {
        Animated.spring(budAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }).start(() => resolve());
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      setStage('bloom');
      safeHaptics.notificationAsync(NotificationFeedbackType.Success);

      // Trigger sparkles!
      setSparklePosition({ x: 30, y: 10 });
      setShowSparkles(true);

      // Stage 5: Flower blooms!
      Animated.parallel([
        Animated.spring(bloomAnim, {
          toValue: 1,
          friction: 3,
          tension: 60,
          useNativeDriver: true,
        }),
        // Glow effect on bloom
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    runGrowthJourney();

    // Gentle swaying animation (starts after bloom)
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(swayAnim, {
            toValue: 1,
            duration: 2500 + index * 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: -1,
            duration: 2500 + index * 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1500);
  }, []);

  const rotation = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-4deg', '4deg'],
  });

  const stemHeightAnimated = stemAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, stemHeight],
  });

  const leafScale = leafAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const budScale = budAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const bloomScale = bloomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, plantScale],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.flower,
        { transform: [{ rotate: rotation }] },
      ]}
    >
      {/* Glow effect on bloom */}
      <Animated.View
        style={[
          styles.bloomGlow,
          { opacity: glowOpacity },
        ]}
      />

      {/* Seed (visible at start) */}
      <Animated.View
        style={[
          styles.seedContainer,
          {
            transform: [{ translateY: seedDropAnim }],
            opacity: seedOpacity,
          },
        ]}
      >
        <View style={styles.seedBody} />
      </Animated.View>

      {/* Sprout (tiny green shoot) */}
      {stage !== 'seed' && (
        <Animated.View
          style={[
            styles.sprout,
            {
              transform: [{ scale: sproutAnim }],
              opacity: stage === 'sprout' ? 1 : 0,
            },
          ]}
        />
      )}

      {/* Sparkles on bloom */}
      {showSparkles && (
        <SparkleParticles
          x={sparklePosition.x}
          y={sparklePosition.y}
          onComplete={() => setShowSparkles(false)}
        />
      )}

      {/* Flower head - blooms on top (tappable) */}
      {(stage === 'bud' || stage === 'bloom') && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => stage === 'bloom' && onTap?.(text, colorSet.petal)}
          disabled={stage !== 'bloom'}
        >
          <Animated.View
            style={[
              styles.flowerHead,
              {
                transform: [{ scale: stage === 'bloom' ? bloomScale : budScale }],
              },
            ]}
          >
            {/* Petals */}
            {[...Array(petalCount)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.petal,
                  {
                    backgroundColor: colorSet.petal,
                    transform: [
                      { rotate: `${i * (360 / petalCount)}deg` },
                      { translateY: -12 },
                    ],
                    opacity: stage === 'bloom' ? bloomAnim : 0.3,
                  },
                ]}
              />
            ))}
            {/* Center */}
            <Animated.View
              style={[
                styles.flowerCenter,
                {
                  backgroundColor: colorSet.center,
                  transform: [{ scale: stage === 'bloom' ? bloomAnim : budAnim }],
                },
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Stem - grows from ground up */}
      {stage !== 'seed' && stage !== 'sprout' && (
        <Animated.View style={[styles.stem, { height: stemHeightAnimated }]}>
          <View style={styles.stemLine} />
          {/* Leaves unfurl */}
          <Animated.View
            style={[
              styles.leaf,
              styles.leafLeft,
              { transform: [{ scale: leafScale }, { rotate: '-30deg' }] },
            ]}
          />
          <Animated.View
            style={[
              styles.leaf,
              styles.leafRight,
              { transform: [{ scale: leafScale }, { rotate: '30deg' }] },
            ]}
          />
        </Animated.View>
      )}

      {/* Gratitude text card */}
      <View style={styles.gratitudeCard}>
        <Text style={styles.gratitudeText} numberOfLines={2}>
          {text}
        </Text>
        {onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={10} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================
// GARDEN SCENE
// ============================================

interface GardenSceneProps {
  gratitudes: string[];
  onRemove?: (index: number) => void;
  onFlowerTap?: (text: string, color: string) => void;
  totalGratitudes?: number; // Lifetime gratitudes for evolution
  showRainbow?: boolean;
  t: (key: string) => string;
}

function GardenScene({ gratitudes, onRemove, onFlowerTap, totalGratitudes = 0, showRainbow = false, t }: GardenSceneProps) {
  const skyColors = getSkyGradient();
  const nightTime = isNightTime();

  return (
    <View style={styles.gardenScene}>
      {/* Dynamic Sky gradient based on time of day */}
      <LinearGradient
        colors={skyColors}
        style={styles.sky}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Sun (only during day) */}
      {!nightTime && <SunRays />}

      {/* Stars at night */}
      {nightTime && (
        <View style={styles.starsContainer}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.star,
                {
                  left: Math.random() * SCREEN_WIDTH,
                  top: Math.random() * 80,
                  opacity: 0.3 + Math.random() * 0.7,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Fireflies at night */}
      {nightTime && (
        <>
          <Firefly delay={0} />
          <Firefly delay={1} />
          <Firefly delay={2} />
          <Firefly delay={3} />
          <Firefly delay={4} />
        </>
      )}

      {/* Clouds (only during day) */}
      {!nightTime && (
        <>
          <FloatingCloud delay={0} size={60} top={20} />
          <FloatingCloud delay={2} size={45} top={50} />
          <FloatingCloud delay={4} size={55} top={35} />
        </>
      )}

      {/* Rainbow celebration */}
      <RainbowCelebration visible={showRainbow} />

      {/* Butterflies (only show when there are flowers, daytime only) */}
      {gratitudes.length > 0 && !nightTime && (
        <>
          <Butterfly delay={0} />
          {gratitudes.length >= 2 && <Butterfly delay={2} />}
        </>
      )}

      {/* Garden ground */}
      <View style={styles.gardenGround}>
        {/* Grass layer */}
        <LinearGradient
          colors={nightTime ? ['#1d3a2d', '#0d2a1d', '#0a1a0d'] : ['#2d5a3d', '#1d4a2d', '#0d3a1d']}
          style={styles.grass}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Soil layer */}
        <LinearGradient
          colors={nightTime ? ['#2d1a0a', '#1d0a00', '#0d0000'] : ['#3d2a1a', '#2d1a0a', '#1d0a00']}
          style={styles.soil}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Flowers container */}
        <View style={styles.flowersContainer}>
          {gratitudes.length === 0 ? (
            <View style={styles.emptyGarden}>
              <View style={styles.seedHoles}>
                {[...Array(3)].map((_, i) => (
                  <View key={i} style={styles.seedHole}>
                    <Ionicons name="ellipse" size={8} color="rgba(255,255,255,0.2)" />
                  </View>
                ))}
              </View>
              <Text style={styles.emptyGardenText}>{t('brainGames.gratitudeGarden.gardenAwaits')}</Text>
              <Text style={styles.emptyGardenHint}>{t('brainGames.gratitudeGarden.plantSeeds')}</Text>
            </View>
          ) : (
            <View style={styles.flowersRow}>
              {gratitudes.map((gratitude, index) => (
                <Flower
                  key={`${index}-${gratitude.slice(0, 10)}`}
                  index={index}
                  text={gratitude}
                  onRemove={onRemove ? () => onRemove(index) : undefined}
                  onTap={onFlowerTap}
                  totalGratitudes={totalGratitudes}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ============================================
// STREAK BADGE
// ============================================

function StreakBadge({ count }: { count: number }) {
  if (count < 3) return null;

  return (
    <View style={styles.streakBadge}>
      <Ionicons name="flame" size={14} color="#FF6B35" />
      <Text style={styles.streakText}>{count} day streak!</Text>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface GratitudeGardenProps {
  onClose?: () => void;
}

export function GratitudeGarden({ onClose }: GratitudeGardenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const handleClose = onClose || (() => navigation.goBack());
  const { state } = useWorldModel();
  const dayNumber = state.journey.currentDay;

  const [currentPromptIndex, setCurrentPromptIndex] = useState(
    Math.floor(Math.random() * GRATITUDE_PROMPT_KEYS.length)
  );
  const [showComplete, setShowComplete] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const [showWhyThisWorks, setShowWhyThisWorks] = useState(false);

  // Mood check-in states
  const [showPreMoodCheck, setShowPreMoodCheck] = useState(true);
  const [showPostMoodCheck, setShowPostMoodCheck] = useState(false);
  const [preMood, setPreMood] = useState<SessionMoodLevel | null>(null);
  const [postMood, setPostMood] = useState<SessionMoodLevel | null>(null);

  // Enhancement states
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [selectedGratitude, setSelectedGratitude] = useState({ text: '', color: '' });
  const [showRainbow, setShowRainbow] = useState(false);

  const {
    gratitudes,
    currentInput,
    setCurrentInput,
    addGratitude,
    removeGratitude,
    submitGratitudes,
    progress,
    isComplete,
    totalLifetimeGratitudes,
    gardenLevel,
  } = useGratitudeSession({
    targetCount: 3,
    dayNumber,
    onComplete: (finalGratitudes) => {
      setShowPostMoodCheck(true);
    },
  });

  // Handle pre-mood selection
  const handlePreMoodSelect = useCallback((mood: SessionMoodLevel) => {
    setPreMood(mood);
    setShowPreMoodCheck(false);
  }, []);

  // Handle pre-mood skip
  const handlePreMoodSkip = useCallback(() => {
    setShowPreMoodCheck(false);
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

  const inputRef = useRef<TextInput>(null);

  // Handle flower tap to show gratitude modal
  const handleFlowerTap = useCallback((text: string, color: string) => {
    setSelectedGratitude({ text, color });
    setShowGratitudeModal(true);
    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
  }, []);

  const handleAddGratitude = useCallback(() => {
    if (currentInput.trim()) {
      const newCount = gratitudes.length + 1;
      addGratitude(currentInput);

      // Show encouragement
      const randomEncouragementKey = ENCOURAGEMENT_KEYS[
        Math.floor(Math.random() * ENCOURAGEMENT_KEYS.length)
      ];
      setEncouragement(t(randomEncouragementKey));

      // Rotate to next prompt
      setCurrentPromptIndex((prev) =>
        (prev + 1) % GRATITUDE_PROMPT_KEYS.length
      );

      // Trigger rainbow when 3rd gratitude is planted
      if (newCount === 3) {
        setTimeout(() => {
          setShowRainbow(true);
          safeHaptics.notificationAsync(NotificationFeedbackType.Success);
        }, 2000); // Delay to let flower bloom first
      }

      // Clear encouragement after delay
      setTimeout(() => setEncouragement(''), 2500);
    }
  }, [currentInput, addGratitude, gratitudes.length]);

  const handleSubmit = useCallback(() => {
    if (gratitudes.length > 0) {
      submitGratitudes();
      setShowPostMoodCheck(true);
    }
  }, [gratitudes, submitGratitudes]);

  const handleContinue = useCallback(() => {
    setShowComplete(false);
    handleClose();
  }, [handleClose]);

  return (
    <GameContainer
      gameId="gratitude"
      title={t('brainGames.games.gratitude.title')}
      subtitle={t('brainGames.games.gratitude.subtitle')}
      onClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Section */}
          <FadeInView delay={100}>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>{t('brainGames.gratitudeGarden.seedsPlanted')}</Text>
                  <View style={styles.progressDots}>
                    {[0, 1, 2].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.progressDot,
                          i < gratitudes.length && styles.progressDotFilled,
                        ]}
                      >
                        {i < gratitudes.length && (
                          <Ionicons name="flower" size={12} color="#fff" />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
                <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
              </View>
            </View>
          </FadeInView>

          {/* Garden Scene */}
          <FadeInView delay={200}>
            <GardenScene
              gratitudes={gratitudes}
              onRemove={gratitudes.length < 3 ? removeGratitude : undefined}
              onFlowerTap={handleFlowerTap}
              totalGratitudes={totalLifetimeGratitudes}
              showRainbow={showRainbow}
              t={t}
            />
          </FadeInView>

          {/* Encouragement */}
          {encouragement && (
            <ScaleBounce trigger={encouragement}>
              <View style={styles.encouragementContainer}>
                <LinearGradient
                  colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.05)']}
                  style={styles.encouragementGradient}
                >
                  <Ionicons name="sparkles" size={16} color={COLORS.gold} />
                  <Text style={styles.encouragementText}>{encouragement}</Text>
                </LinearGradient>
              </View>
            </ScaleBounce>
          )}

          {/* Input Section */}
          {!isComplete && (
            <FadeInView delay={300}>
              <View style={styles.inputSection}>
                <Text style={styles.promptText}>
                  {t(GRATITUDE_PROMPT_KEYS[currentPromptIndex])}
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder={t('brainGames.gratitudeGarden.placeholder')}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={currentInput}
                    onChangeText={setCurrentInput}
                    multiline
                    maxLength={200}
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={handleAddGratitude}
                  />
                  <TouchableOpacity
                    style={[
                      styles.plantButton,
                      !currentInput.trim() && styles.plantButtonDisabled,
                    ]}
                    onPress={handleAddGratitude}
                    disabled={!currentInput.trim()}
                  >
                    <LinearGradient
                      colors={currentInput.trim() ? [COLORS.gold, '#B8960F'] : ['#333', '#222']}
                      style={styles.plantButtonGradient}
                    >
                      <Ionicons
                        name="leaf"
                        size={20}
                        color={currentInput.trim() ? '#0D0D0D' : '#666'}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <Text style={styles.charCount}>
                  {currentInput.length}/200
                </Text>
              </View>
            </FadeInView>
          )}

          {/* Scripture */}
          <FadeInView delay={400}>
            <View style={styles.scriptureSection}>
              <Text style={styles.scriptureText}>
                {t('brainGames.gratitudeGarden.scripture')}
              </Text>
              <Text style={styles.scriptureReference}>
                {t('brainGames.gratitudeGarden.scriptureRef')}
              </Text>
            </View>
          </FadeInView>
        </ScrollView>

        {/* Submit Button */}
        {gratitudes.length > 0 && !isComplete && (
          <GameFooter>
            <GradientButton
              title={gratitudes.length >= 3 ? t('brainGames.gratitudeGarden.harvestGratitudes') : t('brainGames.gratitudeGarden.plantMore', { count: 3 - gratitudes.length })}
              onPress={handleSubmit}
              disabled={gratitudes.length < 1}
            />
          </GameFooter>
        )}
      </KeyboardAvoidingView>

      {/* Completion Modal */}
      <SessionComplete
        visible={showComplete}
        title={t('brainGames.gratitudeGarden.gardenBlooming')}
        subtitle={t('brainGames.gratitudeGarden.gratitudesFlourishing')}
        stats={[
          { label: t('brainGames.gratitudeGarden.seedsPlanted'), value: gratitudes.length },
          { label: t('dashboard.day'), value: dayNumber },
        ]}
        encouragement={t('brainGames.gratitudeGarden.completionEncouragement')}
        onContinue={handleContinue}
        continueLabel={t('brainGames.breathe.returnToGames')}
      />

      {/* Why This Works Modal */}
      <WhyThisWorks
        visible={showWhyThisWorks}
        gameId="gratitude"
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
// STYLES - Premium Garden UI
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  // Progress Section
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xs,
  },
  progressDots: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotFilled: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },

  // Garden Scene
  gardenScene: {
    height: 280,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },

  // Sun
  sunContainer: {
    position: 'absolute',
    top: 15,
    right: 20,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD93D',
    position: 'absolute',
  },
  sunRay: {
    position: 'absolute',
    width: 3,
    height: 50,
    backgroundColor: 'rgba(255, 217, 61, 0.3)',
  },

  // Clouds
  cloud: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cloudPuff: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 100,
  },
  cloudPuffCenter: {
    marginLeft: -10,
    marginBottom: 5,
  },
  cloudPuffRight: {
    marginLeft: -8,
  },

  // Butterfly
  butterfly: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  butterflyBody: {
    width: 4,
    height: 12,
    backgroundColor: '#2d1a0a',
    borderRadius: 2,
  },
  butterflyWing: {
    width: 10,
    height: 8,
    backgroundColor: '#FFB4B4',
    borderRadius: 5,
  },
  butterflyWingLeft: {
    marginRight: -2,
    transformOrigin: 'right',
  },
  butterflyWingRight: {
    marginLeft: -2,
    transformOrigin: 'left',
  },

  // Garden Ground
  gardenGround: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  grass: {
    height: 20,
  },
  soil: {
    flex: 1,
  },
  flowersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: SPACING.md,
  },
  flowersRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    flex: 1,
    paddingBottom: 20,
  },

  // Empty Garden
  emptyGarden: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedHoles: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.md,
  },
  seedHole: {
    width: 20,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGardenText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
  },
  emptyGardenHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.xs,
  },

  // Seed (for growth animation)
  seed: {
    position: 'absolute',
    top: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedBody: {
    width: 12,
    height: 16,
    backgroundColor: '#8B4513',
    borderRadius: 6,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  seedContainer: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
    zIndex: 10,
  },

  // Sprout (tiny green shoot)
  sprout: {
    width: 4,
    height: 12,
    backgroundColor: '#4CAF50',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: 2,
  },

  // Bloom glow effect
  bloomGlow: {
    position: 'absolute',
    top: -8,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },

  // Flower
  flower: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - SPACING.lg * 4) / 3,
    maxWidth: 100,
  },
  stem: {
    width: 4,
    backgroundColor: '#2d5a3d',
    borderRadius: 2,
    alignItems: 'center',
    position: 'relative',
  },
  stemLine: {
    width: 4,
    flex: 1,
    backgroundColor: '#2d5a3d',
    borderRadius: 2,
  },
  leaf: {
    position: 'absolute',
    width: 12,
    height: 8,
    backgroundColor: '#3d7a4d',
    borderRadius: 6,
    top: '40%',
  },
  leafLeft: {
    left: -10,
    transform: [{ rotate: '-30deg' }],
  },
  leafRight: {
    right: -10,
    transform: [{ rotate: '30deg' }],
  },
  flowerHead: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -2,
  },
  petal: {
    position: 'absolute',
    width: 16,
    height: 20,
    borderRadius: 10,
  },
  flowerCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 1,
  },
  gratitudeCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    marginTop: SPACING.xs,
    width: '100%',
    position: 'relative',
  },
  gratitudeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    lineHeight: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 100, 100, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Streak Badge
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  streakText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#FF6B35',
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
  },

  // Encouragement
  encouragementContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  encouragementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  encouragementText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
  },

  // Input Section
  inputSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  promptText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    minHeight: 60,
    maxHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  plantButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  plantButtonDisabled: {
    opacity: 0.5,
  },
  plantButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },

  // Scripture
  scriptureSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scriptureText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },
  scriptureReference: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.sm,
  },

  // ============================================
  // ENHANCEMENT STYLES
  // ============================================

  // Sparkle Particles
  sparkleContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    zIndex: 100,
  },
  sparkle: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // Stars (night)
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },

  // Fireflies
  firefly: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFF99',
    shadowColor: '#FFFF99',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },

  // Rainbow
  rainbowContainer: {
    position: 'absolute',
    top: 20,
    left: '50%',
    marginLeft: -90,
    alignItems: 'center',
    zIndex: 50,
  },
  rainbowBand: {
    position: 'absolute',
    borderWidth: 4,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },

  // Watering Can
  wateringCanContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'center',
  },
  wateringCan: {
    alignItems: 'center',
  },
  canBody: {
    width: 50,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  canSpout: {
    width: 15,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    right: -10,
    top: 10,
    borderRadius: 2,
  },
  waterDrop: {
    position: 'absolute',
    top: 40,
    width: 4,
    height: 8,
    backgroundColor: '#4A90D9',
    borderRadius: 4,
  },
  wateringHint: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },

  // Gratitude Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gratitudeModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH - 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalFlower: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  modalFlowerCenter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD93D',
  },
  modalGratitudeText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.lg * 1.5,
    marginBottom: SPACING.md,
  },
  modalHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
});

export default GratitudeGarden;
