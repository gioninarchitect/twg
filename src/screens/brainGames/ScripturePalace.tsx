/**
 * Scripture Memory Palace
 * Build a memory palace with scripture using Method of Loci
 * Unlocks: Day 7
 *
 * Premium UI v2.0 - Visual palace with immersive experience
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../../utils/haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GRADIENTS } from '../../theme/colors';
import { GAME_COLORS, GAME_GRADIENTS } from '../../theme/brainGames';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { emitScriptureAdded, emitScriptureReviewed } from '../../worldModel';
import { useWorldModel } from '../../worldModel';
import {
  saveScripturePalace,
  loadScripturePalace,
  recordGameSession,
  type StoredScripture as PersistedScripture,
} from '../../services/gameDataService';
import { DEVOTIONAL_DAYS, type DayContent } from '../../content/devotionalContent';

// Pre-built scripture library from devotional
interface DevotionalScripture {
  dayNumber: number;
  reference: string;
  text: string;
  dayTitle: string;
}

const SCRIPTURE_LIBRARY: DevotionalScripture[] = DEVOTIONAL_DAYS.map((day) => ({
  dayNumber: day.dayNumber,
  reference: day.scripture.reference,
  text: day.scripture.text,
  dayTitle: day.title,
}));
import { Button, GradientButton, Badge, ProgressBar } from '../../components/PremiumUI';
import {
  GameContainer,
  GameCard,
  GameSection,
  GameFooter,
  SessionComplete,
  FadeInView,
  ScaleBounce,
  WhyThisWorks,
  WhyThisWorksButton,
  SessionMoodCheckIn,
  type SessionMoodLevel,
} from '../../components/brainGames';

// ============================================
// PALACE ROOMS (Memory Locations)
// ============================================

interface PalaceRoom {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  color: string;
  visualSceneKey: string;  // Immersive scene description for memory
  memoryTipKey: string;    // Quick tip for memorization
}

// Icon mapping for Ionicons
const ROOM_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  entrance: 'home-outline',
  garden: 'flower-outline',
  living: 'bed-outline',
  kitchen: 'nutrition-outline',
  study: 'book-outline',
  bedroom: 'moon-outline',
  tower: 'telescope-outline',
  throne: 'diamond-outline',
};

const PALACE_ROOMS: PalaceRoom[] = [
  {
    id: 'entrance',
    nameKey: 'brainGames.scripturePalace.rooms.entrance.name',
    descriptionKey: 'brainGames.scripturePalace.rooms.entrance.description',
    icon: 'home-outline',
    color: '#D4A574',
    visualSceneKey: 'brainGames.scripturePalace.rooms.entrance.visualScene',
    memoryTipKey: 'brainGames.scripturePalace.rooms.entrance.memoryTip',
  },
  {
    id: 'garden',
    nameKey: 'brainGames.scripturePalace.rooms.garden.name',
    descriptionKey: 'brainGames.scripturePalace.rooms.garden.description',
    icon: 'flower-outline',
    color: '#A8B5A0',
    visualSceneKey: 'brainGames.scripturePalace.rooms.garden.visualScene',
    memoryTipKey: 'brainGames.scripturePalace.rooms.garden.memoryTip',
  },
  {
    id: 'living',
    nameKey: 'brainGames.scripturePalace.rooms.living.name',
    descriptionKey: 'brainGames.scripturePalace.rooms.living.description',
    icon: 'bed-outline',
    color: '#88A4B8',
    visualSceneKey: 'brainGames.scripturePalace.rooms.living.visualScene',
    memoryTipKey: 'brainGames.scripturePalace.rooms.living.memoryTip',
  },
  {
    id: 'kitchen',
    nameKey: 'brainGames.scripturePalace.rooms.kitchen.name',
    descriptionKey: 'brainGames.scripturePalace.rooms.kitchen.description',
    icon: 'nutrition-outline',
    color: '#C4A882',
    visualSceneKey: 'brainGames.scripturePalace.rooms.kitchen.visualScene',
    memoryTipKey: 'brainGames.scripturePalace.rooms.kitchen.memoryTip',
  },
  {
    id: 'study',
    nameKey: 'brainGames.scripturePalace.rooms.study.name',
    descriptionKey: 'brainGames.scripturePalace.rooms.study.description',
    icon: 'book-outline',
    color: '#9B8FB8',
    visualSceneKey: 'brainGames.scripturePalace.rooms.study.visualScene',
    memoryTipKey: 'brainGames.scripturePalace.rooms.study.memoryTip',
  },
  {
    id: 'bedroom',
    nameKey: 'brainGames.scripturePalace.rooms.bedroom.name',
    descriptionKey: 'brainGames.scripturePalace.rooms.bedroom.description',
    icon: 'moon-outline',
    color: '#8898B8',
    visualSceneKey: 'brainGames.scripturePalace.rooms.bedroom.visualScene',
    memoryTipKey: 'brainGames.scripturePalace.rooms.bedroom.memoryTip',
  },
  {
    id: 'tower',
    nameKey: 'brainGames.scripturePalace.rooms.tower.name',
    descriptionKey: 'brainGames.scripturePalace.rooms.tower.description',
    icon: 'telescope-outline',
    color: '#88A4A8',
    visualSceneKey: 'brainGames.scripturePalace.rooms.tower.visualScene',
    memoryTipKey: 'brainGames.scripturePalace.rooms.tower.memoryTip',
  },
  {
    id: 'throne',
    nameKey: 'brainGames.scripturePalace.rooms.throne.name',
    descriptionKey: 'brainGames.scripturePalace.rooms.throne.description',
    icon: 'diamond-outline',
    color: '#D4A574',
    visualSceneKey: 'brainGames.scripturePalace.rooms.throne.visualScene',
    memoryTipKey: 'brainGames.scripturePalace.rooms.throne.memoryTip',
  },
];

// ============================================
// SCRIPTURE INTERFACE
// ============================================

interface StoredScripture {
  id: string;
  reference: string;
  text: string;
  roomId: string;
  visualAssociation: string;
  dateAdded: number;
  timesReviewed: number;
  lastReviewed: number | null;
  mastered: boolean;
  // Spaced Repetition Fields
  masteryLevel: 1 | 2 | 3 | 4 | 5; // 1=new, 5=mastered
  nextReviewDate: number; // Timestamp for next review
  easeFactor: number; // 1.3-2.5, affects interval growth
}

// ============================================
// SPACED REPETITION ALGORITHM
// Based on SM-2 algorithm, simplified for scripture memorization
// ============================================

const MASTERY_LABEL_KEYS: Record<number, string> = {
  1: 'brainGames.scripturePalace.mastery.planting',
  2: 'brainGames.scripturePalace.mastery.sprouting',
  3: 'brainGames.scripturePalace.mastery.growing',
  4: 'brainGames.scripturePalace.mastery.blooming',
  5: 'brainGames.scripturePalace.mastery.rooted',
};

const MASTERY_COLORS: Record<number, string> = {
  1: '#B5888D', // New - dusty rose
  2: '#A8956F', // Learning - warm brown
  3: '#88A4A8', // Familiar - sage
  4: '#8BA5B5', // Strong - blue-gray
  5: COLORS.gold, // Mastered - gold
};

// Palace visual layout configuration - 2 column grid
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 3) / 2;

// Calculate next review interval based on mastery level
function calculateNextReview(masteryLevel: number, easeFactor: number): number {
  const baseIntervals = {
    1: 1,    // 1 day
    2: 3,    // 3 days
    3: 7,    // 1 week
    4: 14,   // 2 weeks
    5: 30,   // 1 month
  };
  const days = baseIntervals[masteryLevel as keyof typeof baseIntervals] || 1;
  const intervalMs = days * 24 * 60 * 60 * 1000 * easeFactor;
  return Date.now() + intervalMs;
}

// Check if scripture needs review
function needsReview(scripture: StoredScripture): boolean {
  if (!scripture.lastReviewed) return true;
  return Date.now() >= scripture.nextReviewDate;
}

// Calculate how overdue a scripture is (for priority sorting)
function getReviewPriority(scripture: StoredScripture): number {
  if (!scripture.lastReviewed) return 1000; // New scriptures first
  const overdue = Date.now() - scripture.nextReviewDate;
  return Math.max(0, overdue / (24 * 60 * 60 * 1000)); // Days overdue
}

// ============================================
// ANIMATED GLOW EFFECT
// ============================================

function PulsingGlow({ color, active }: { color: string; active: boolean }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [active]);

  if (!active) return null;

  return (
    <Animated.View
      style={[
        styles.pulsingGlow,
        {
          backgroundColor: color,
          opacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.6],
          }),
          transform: [
            {
              scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.15],
              }),
            },
          ],
        },
      ]}
    />
  );
}

// ============================================
// ROOM CARD COMPONENT - PREMIUM VISUAL VERSION
// ============================================

interface RoomCardProps {
  room: PalaceRoom;
  scripture?: StoredScripture;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  t: (key: string) => string;
}

function RoomCard({ room, scripture, isSelected, onPress, index, t }: RoomCardProps) {
  const masteryLevel = scripture?.masteryLevel || 1;
  const masteryColor = MASTERY_COLORS[masteryLevel];
  const needsReviewNow = scripture ? needsReview(scripture) : false;
  const hasScripture = !!scripture;
  const isMastered = masteryLevel === 5;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 80,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.roomCardWrapper,
        {
          opacity: scaleAnim,
          transform: [
            {
              scale: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.roomCard,
          isSelected && styles.roomCardSelected,
        ]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Pulsing glow for review-due rooms */}
        <PulsingGlow color={COLORS.gold} active={needsReviewNow && !isMastered} />

        {/* Background gradient */}
        <LinearGradient
          colors={
            isMastered
              ? [room.color + '40', room.color + '20', '#1a1a1a']
              : hasScripture
              ? [room.color + '25', '#1a1a1a', '#0f0f0f']
              : ['#1f1f1f', '#141414', '#0f0f0f']
          }
          style={styles.roomCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Mastered star badge */}
        {isMastered && (
          <View style={styles.masteredStarBadge}>
            <Ionicons name="star" size={16} color={COLORS.gold} />
          </View>
        )}

        {/* Review indicator */}
        {needsReviewNow && !isMastered && (
          <View style={styles.reviewIndicator}>
            <Text style={styles.reviewIndicatorText}>!</Text>
          </View>
        )}

        {/* Room icon */}
        <View style={[styles.roomIconContainer, { backgroundColor: room.color + '30' }]}>
          <Ionicons
            name={room.icon as keyof typeof Ionicons.glyphMap}
            size={28}
            color={hasScripture ? room.color : room.color + '80'}
          />
        </View>

        {/* Room name */}
        <Text
          style={[
            styles.roomName,
            !hasScripture && styles.roomNameEmpty,
          ]}
          numberOfLines={2}
        >
          {t(room.nameKey)}
        </Text>

        {/* Scripture reference or empty state */}
        {scripture ? (
          <View style={styles.scriptureInfo}>
            <Text style={styles.roomScripture} numberOfLines={1}>
              {scripture.reference}
            </Text>
            <View style={styles.masteryRow}>
              <View style={[styles.masteryDot, { backgroundColor: masteryColor }]} />
              <Text style={[styles.masteryLabel, { color: masteryColor }]}>
                {t(MASTERY_LABEL_KEYS[masteryLevel])}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.roomEmpty}>{t('brainGames.scripturePalace.add')}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// SCRIPTURE PICKER MODAL (Pre-populated from devotional)
// ============================================

interface ScripturePickerModalProps {
  visible: boolean;
  room: PalaceRoom | null;
  usedScriptures: string[]; // Already placed scripture references
  onClose: () => void;
  onSelect: (reference: string, text: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function ScripturePickerModal({ visible, room, usedScriptures, onClose, onSelect, t }: ScripturePickerModalProps) {
  const [selectedScripture, setSelectedScripture] = useState<DevotionalScripture | null>(null);
  const availableScriptures = SCRIPTURE_LIBRARY.filter(
    (s) => !usedScriptures.includes(s.reference)
  );

  const handleSelect = () => {
    if (selectedScripture) {
      onSelect(selectedScripture.reference, selectedScripture.text);
      setSelectedScripture(null);
      onClose();
    }
  };

  // Don't render if no room selected
  if (!room) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.pickerModalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <LinearGradient
            colors={[room?.color || COLORS.gold, 'transparent']}
            style={styles.pickerHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.pickerHeaderContent}>
              <Ionicons
                name={room?.icon as keyof typeof Ionicons.glyphMap || 'book-outline'}
                size={32}
                color={COLORS.textPrimary}
              />
              <Text style={styles.pickerTitle}>{t('brainGames.scripturePalace.chooseScripture')}</Text>
              <Text style={styles.pickerSubtitle}>
                {t('brainGames.scripturePalace.forRoom', { room: t(room?.nameKey) })}
              </Text>
            </View>
          </LinearGradient>

          {/* Scripture list */}
          <ScrollView
            style={styles.scriptureList}
            showsVerticalScrollIndicator={false}
          >
            {availableScriptures.map((scripture) => (
              <TouchableOpacity
                key={scripture.reference}
                style={[
                  styles.scriptureItem,
                  selectedScripture?.reference === scripture.reference && styles.scriptureItemSelected,
                ]}
                onPress={() => {
                  safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
                  setSelectedScripture(scripture);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.scriptureItemHeader}>
                  <Text style={styles.scriptureItemDay}>{t('dashboard.day')} {scripture.dayNumber}</Text>
                  <Text style={styles.scriptureItemRef}>{scripture.reference}</Text>
                </View>
                <Text style={styles.scriptureItemText} numberOfLines={2}>
                  "{scripture.text}"
                </Text>
                {selectedScripture?.reference === scripture.reference && (
                  <View style={styles.selectedCheck}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.gold} />
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {availableScriptures.length === 0 && (
              <View style={styles.allUsedMessage}>
                <Ionicons name="checkmark-done-circle" size={48} color={COLORS.gold} />
                <Text style={styles.allUsedText}>{t('brainGames.scripturePalace.allPlaced')}</Text>
                <Text style={styles.allUsedSubtext}>{t('brainGames.scripturePalace.palaceComplete')}</Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.pickerActions}>
            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={onClose}
            >
              <Text style={styles.pickerCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pickerSelectButton,
                !selectedScripture && styles.pickerSelectButtonDisabled,
              ]}
              onPress={handleSelect}
              disabled={!selectedScripture}
            >
              <LinearGradient
                colors={selectedScripture ? [COLORS.gold, '#B8960F'] : ['#333', '#222']}
                style={styles.pickerSelectGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[
                  styles.pickerSelectText,
                  !selectedScripture && styles.pickerSelectTextDisabled,
                ]}>
                  {t('brainGames.scripturePalace.placeInRoom')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ============================================
// REVIEW SCRIPTURE MODAL
// ============================================

interface ReviewScriptureModalProps {
  visible: boolean;
  scripture: StoredScripture | null;
  room: PalaceRoom | null;
  onClose: () => void;
  onRecalled: (recalled: boolean) => void;
  t: (key: string) => string;
}

function ReviewScriptureModal({
  visible,
  scripture,
  room,
  onClose,
  onRecalled,
  t,
}: ReviewScriptureModalProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowAnswer(false);
    }
  }, [visible]);

  if (!scripture || !room) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.reviewModalContainer}>
          {/* Scrollable content wrapper */}
          <ScrollView
            style={styles.reviewModalScroll}
            contentContainerStyle={styles.reviewModalScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Room header with gradient */}
            <LinearGradient
              colors={[room.color + '40', room.color + '20', '#1a1a1a']}
              style={styles.reviewHeader}
            >
              <View style={[styles.reviewRoomIcon, { backgroundColor: room.color + '30' }]}>
                <Ionicons name={room.icon as keyof typeof Ionicons.glyphMap} size={32} color={room.color} />
              </View>
              <Text style={styles.reviewRoomName}>{t(room.nameKey)}</Text>
            </LinearGradient>

            {/* Visual scene - the immersive memory prompt */}
            <View style={styles.visualSceneContainer}>
              <Text style={styles.visualSceneText}>
                {t(room.visualSceneKey)}
              </Text>
              <View style={styles.memoryTipBadge}>
                <Ionicons name="bulb-outline" size={14} color={COLORS.gold} />
                <Text style={styles.memoryTipText}>{t(room.memoryTipKey)}</Text>
              </View>
            </View>

            {/* Scripture reference */}
            <View style={styles.referenceContainer}>
              <Text style={styles.reviewReference}>
                {scripture.reference}
              </Text>
            </View>

            {!showAnswer ? (
              <TouchableOpacity
                style={styles.revealButton}
                onPress={() => {
                  safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
                  setShowAnswer(true);
                }}
              >
                <Ionicons name="eye-outline" size={24} color={COLORS.textSecondary} />
                <Text style={styles.revealButtonText}>{t('brainGames.scripturePalace.tapToReveal')}</Text>
              </TouchableOpacity>
            ) : (
              <FadeInView>
                <View style={styles.answerContainer}>
                  <Text style={styles.scriptureText}>
                    "{scripture.text}"
                  </Text>
                </View>

                <Text style={styles.recallPrompt}>
                  {t('brainGames.scripturePalace.recallPrompt')}
                </Text>

                <View style={styles.recallButtons}>
                  <TouchableOpacity
                    style={[styles.recallButton, styles.recallButtonNo]}
                    onPress={() => {
                      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
                      onRecalled(false);
                      onClose();
                    }}
                  >
                    <Ionicons name="refresh-outline" size={18} color={COLORS.textSecondary} />
                    <Text style={styles.recallButtonText}>{t('brainGames.scripturePalace.stillLearning')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.recallButton, styles.recallButtonYes]}
                    onPress={() => {
                      safeHaptics.notificationAsync(NotificationFeedbackType.Success);
                      onRecalled(true);
                      onClose();
                    }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#0D0D0D" />
                    <Text style={[styles.recallButtonText, { color: '#0D0D0D' }]}>
                      {t('brainGames.scripturePalace.gotIt')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </FadeInView>
            )}
          </ScrollView>

          {/* Close button - always visible outside scroll */}
          <TouchableOpacity
            style={styles.closeReviewButton}
            onPress={onClose}
          >
            <Text style={styles.closeReviewText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>

        {/* Tap outside to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface ScripturePalaceProps {
  onClose?: () => void;
}

export function ScripturePalace({ onClose }: ScripturePalaceProps) {
  const navigation = useNavigation();
  const handleClose = onClose || (() => navigation.goBack());
  const { state } = useWorldModel();
  const { t } = useTranslation();
  const [scriptures, setScriptures] = useState<StoredScripture[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<PalaceRoom | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingScripture, setReviewingScripture] = useState<StoredScripture | null>(null);
  const [mode, setMode] = useState<'explore' | 'review'>('explore');
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewQueue, setReviewQueue] = useState<StoredScripture[]>([]);
  const [showComplete, setShowComplete] = useState(false);
  const [showWhyThisWorks, setShowWhyThisWorks] = useState(false);

  // Mood check-in states
  const [showPreMoodCheck, setShowPreMoodCheck] = useState(true); // Show on entry
  const [showPostMoodCheck, setShowPostMoodCheck] = useState(false);
  const [preMood, setPreMood] = useState<SessionMoodLevel | null>(null);
  const [postMood, setPostMood] = useState<SessionMoodLevel | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved scriptures on mount
  useEffect(() => {
    async function loadData() {
      const savedScriptures = await loadScripturePalace();
      if (savedScriptures.length > 0) {
        setScriptures(savedScriptures);
      }
      setIsLoaded(true);
      // Record game session
      recordGameSession('scripture_palace');
    }
    loadData();
  }, []);

  // Save scriptures when they change
  useEffect(() => {
    if (isLoaded && scriptures.length > 0) {
      saveScripturePalace(scriptures);
    }
  }, [scriptures, isLoaded]);

  // Get scripture for a room
  const getScriptureForRoom = (roomId: string) => {
    return scriptures.find((s) => s.roomId === roomId);
  };

  // Handle adding scripture from picker
  const handleSelectScripture = useCallback((reference: string, text: string) => {
    if (!selectedRoom) return;

    const roomId = selectedRoom.id;
    const roomDescription = selectedRoom.description;

    const newScripture: StoredScripture = {
      id: `scripture_${Date.now()}`,
      reference,
      text,
      roomId: roomId,
      visualAssociation: roomDescription, // Use room description as default association
      dateAdded: Date.now(),
      timesReviewed: 0,
      lastReviewed: null,
      mastered: false,
      // Spaced repetition initial values
      masteryLevel: 1,
      nextReviewDate: Date.now() + (24 * 60 * 60 * 1000), // Review in 1 day
      easeFactor: 2.0, // Default ease factor
    };

    setScriptures((prev) => [...prev, newScripture]);
    emitScriptureAdded(reference, text, roomId, roomDescription);
    safeHaptics.notificationAsync(NotificationFeedbackType.Success);

    // Clear selection after adding
    setSelectedRoom(null);
  }, [selectedRoom]);

  // Get list of used scripture references
  const usedScriptures = scriptures.map((s) => s.reference);

  // Handle room press
  const handleRoomPress = useCallback((room: PalaceRoom) => {
    const scripture = getScriptureForRoom(room.id);
    setSelectedRoom(room);

    if (scripture) {
      // Review existing scripture
      setReviewingScripture(scripture);
      setShowReviewModal(true);
    } else {
      // Add new scripture via picker
      setShowPickerModal(true);
    }
  }, [scriptures]);

  // Handle recall result with spaced repetition algorithm
  const handleRecalled = useCallback((recalled: boolean) => {
    if (!reviewingScripture) return;

    // Update scripture stats with spaced repetition
    setScriptures((prev) =>
      prev.map((s) => {
        if (s.id !== reviewingScripture.id) return s;

        // Calculate new mastery level based on recall success
        let newMasteryLevel = s.masteryLevel;
        let newEaseFactor = s.easeFactor;

        if (recalled) {
          // Success: increase mastery level (max 5)
          newMasteryLevel = Math.min(5, s.masteryLevel + 1) as 1 | 2 | 3 | 4 | 5;
          // Increase ease factor slightly for successful recall
          newEaseFactor = Math.min(2.5, s.easeFactor + 0.1);
        } else {
          // Struggle: decrease mastery level (min 1) and ease factor
          newMasteryLevel = Math.max(1, s.masteryLevel - 1) as 1 | 2 | 3 | 4 | 5;
          // Decrease ease factor for difficult recall
          newEaseFactor = Math.max(1.3, s.easeFactor - 0.2);
        }

        // Calculate next review date
        const nextReviewDate = calculateNextReview(newMasteryLevel, newEaseFactor);

        return {
          ...s,
          timesReviewed: s.timesReviewed + 1,
          lastReviewed: Date.now(),
          mastered: newMasteryLevel === 5,
          masteryLevel: newMasteryLevel,
          easeFactor: newEaseFactor,
          nextReviewDate,
        };
      })
    );

    emitScriptureReviewed(reviewingScripture.reference, recalled);

    if (mode === 'review') {
      if (recalled) {
        setReviewScore((prev) => prev + 1);
      }

      // Move to next scripture in the prioritized queue
      if (reviewIndex < reviewQueue.length - 1) {
        setReviewIndex((prev) => prev + 1);
        const nextScripture = reviewQueue[reviewIndex + 1];
        const nextRoom = PALACE_ROOMS.find((r) => r.id === nextScripture.roomId);
        setReviewingScripture(nextScripture);
        setSelectedRoom(nextRoom || null);
        setShowReviewModal(true);
      } else {
        // Review complete - show post-mood check
        setShowPostMoodCheck(true);
      }
    }
  }, [reviewingScripture, scriptures, mode, reviewIndex, reviewQueue]);

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

  // Start review mode - prioritize scriptures that need review (spaced repetition)
  const startReview = useCallback(() => {
    const scripturesWithContent = scriptures.filter((s) => s.text);
    if (scripturesWithContent.length === 0) return;

    // Sort by review priority: scriptures needing review come first
    const sortedScriptures = [...scripturesWithContent].sort((a, b) => {
      const priorityA = getReviewPriority(a);
      const priorityB = getReviewPriority(b);
      return priorityB - priorityA; // Higher priority first
    });

    setReviewQueue(sortedScriptures);
    setMode('review');
    setReviewIndex(0);
    setReviewScore(0);

    const firstScripture = sortedScriptures[0];
    const room = PALACE_ROOMS.find((r) => r.id === firstScripture.roomId);
    setReviewingScripture(firstScripture);
    setSelectedRoom(room || null);
    setShowReviewModal(true);
  }, [scriptures]);

  const scriptureCount = scriptures.filter((s) => s.text).length;
  const masteredCount = scriptures.filter((s) => s.mastered).length;
  const needsReviewCount = scriptures.filter((s) => s.text && needsReview(s)).length;

  return (
    <GameContainer
      gameId="scripture_palace"
      title={t('brainGames.games.scripturePalace.title')}
      subtitle={t('brainGames.games.scripturePalace.subtitle')}
      onClose={handleClose}
      headerRight={
        scriptureCount > 0 ? (
          <TouchableOpacity onPress={startReview}>
            <Text style={styles.reviewButton}>{t('brainGames.scripturePalace.review')}</Text>
          </TouchableOpacity>
        ) : undefined
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <FadeInView delay={100}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{scriptureCount}</Text>
              <Text style={styles.statLabel}>{t('brainGames.scripturePalace.scriptures')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, needsReviewCount > 0 && { color: COLORS.gold }]}>
                {needsReviewCount}
              </Text>
              <Text style={styles.statLabel}>{t('brainGames.scripturePalace.dueReview')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{masteredCount}</Text>
              <Text style={styles.statLabel}>{t('brainGames.scripturePalace.mastery.rooted')}</Text>
            </View>
          </View>
          <View style={styles.whyButtonRow}>
            <WhyThisWorksButton onPress={() => setShowWhyThisWorks(true)} />
          </View>
        </FadeInView>

        {/* Introduction */}
        {scriptureCount === 0 && (
          <FadeInView delay={200}>
            <GameCard style={styles.introCard}>
              <Text style={styles.introTitle}>{t('brainGames.scripturePalace.welcomeTitle')}</Text>
              <Text style={styles.introText}>
                {t('brainGames.scripturePalace.welcomeText')}
              </Text>
            </GameCard>
          </FadeInView>
        )}

        {/* Palace Rooms - Visual Grid Layout */}
        <FadeInView delay={300}>
          <View style={styles.palaceSection}>
            <Text style={styles.palaceSectionTitle}>{t('brainGames.scripturePalace.yourPalaceRooms')}</Text>
            <Text style={styles.palaceSectionSubtitle}>{t('brainGames.scripturePalace.tapRoomHint')}</Text>
            <View style={styles.roomGrid}>
              {PALACE_ROOMS.map((room, index) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  scripture={getScriptureForRoom(room.id)}
                  isSelected={selectedRoom?.id === room.id}
                  onPress={() => handleRoomPress(room)}
                  index={index}
                  t={t}
                />
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Scripture */}
        <FadeInView delay={400}>
          <View style={styles.scriptureSection}>
            <Text style={styles.devotionalText}>
              {t('brainGames.scripturePalace.scripture')}
            </Text>
            <Text style={styles.scriptureReference}>{t('brainGames.scripturePalace.scriptureRef')}</Text>
          </View>
        </FadeInView>
      </ScrollView>

      {/* Scripture Picker Modal */}
      <ScripturePickerModal
        visible={showPickerModal}
        room={selectedRoom}
        usedScriptures={usedScriptures}
        onClose={() => {
          setShowPickerModal(false);
          setSelectedRoom(null);
        }}
        onSelect={handleSelectScripture}
        t={t}
      />

      {/* Review Scripture Modal */}
      <ReviewScriptureModal
        visible={showReviewModal}
        scripture={reviewingScripture}
        room={selectedRoom}
        onClose={() => {
          setShowReviewModal(false);
          setReviewingScripture(null);
          if (mode === 'explore') {
            setSelectedRoom(null);
          }
        }}
        onRecalled={handleRecalled}
        t={t}
      />

      {/* Completion Modal */}
      <SessionComplete
        visible={showComplete}
        title={t('brainGames.scripturePalace.tourComplete')}
        subtitle={t('brainGames.scripturePalace.tourSubtitle')}
        stats={[
          { label: t('brainGames.scripturePalace.reviewed'), value: scriptures.filter((s) => s.text).length },
          { label: t('brainGames.scripturePalace.recalled'), value: reviewScore },
        ]}
        encouragement={t('brainGames.scripturePalace.encouragement')}
        onContinue={() => {
          setShowComplete(false);
          setMode('explore');
        }}
        continueLabel={t('common.continue')}
      />

      {/* Why This Works Modal */}
      <WhyThisWorks
        visible={showWhyThisWorks}
        gameId="scripture_palace"
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
// STYLES - Premium Visual UI
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  // Stats - Solid opaque background
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    backgroundColor: '#1a1a1a', // Solid opaque
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '700',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  whyButtonRow: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },

  // Intro
  introCard: {
    marginBottom: SPACING.lg,
  },
  introTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },

  // Palace Section
  palaceSection: {
    marginBottom: SPACING.lg,
  },
  palaceSectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: 4,
  },
  palaceSectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.md,
  },

  // Room Grid - Responsive 2-column layout
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },

  // Room Card Wrapper (for animations)
  roomCardWrapper: {
    width: CARD_WIDTH,
    marginBottom: SPACING.sm,
  },

  // Room Cards - Premium visual design
  roomCard: {
    width: '100%',
    height: 150,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roomCardSelected: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  roomCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // Pulsing Glow for review-due rooms
  pulsingGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: RADIUS.xl + 10,
    zIndex: -1,
  },

  // Mastered star badge
  masteredStarBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },

  // Review indicator
  reviewIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewIndicatorText: {
    color: '#0D0D0D',
    fontSize: 12,
    fontWeight: '700',
  },

  // Room icon container
  roomIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    marginLeft: SPACING.md,
  },

  // Room name
  roomName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.sm,
    textAlign: 'center',
  },
  roomNameEmpty: {
    color: COLORS.textMuted,
  },

  // Scripture info in room card
  scriptureInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  roomScripture: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  masteryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  masteryLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },

  // Empty state in room card
  emptyState: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  roomEmpty: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },

  // Review Button
  reviewButton: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
  },

  // Scripture
  scriptureSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  devotionalText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
    paddingHorizontal: SPACING.lg,
  },
  scriptureReference: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.sm,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },

  // Scripture Picker Modal
  pickerModalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
  },
  pickerHeader: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
  },
  pickerHeaderContent: {
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.sm,
  },
  pickerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 4,
  },
  scriptureList: {
    paddingHorizontal: SPACING.lg,
    maxHeight: 400,
  },
  scriptureItem: {
    backgroundColor: '#222',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  scriptureItemSelected: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  scriptureItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scriptureItemDay: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  scriptureItemRef: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
  },
  scriptureItemText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.sizes.sm * 1.5,
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  allUsedMessage: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  allUsedText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.md,
  },
  allUsedSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 4,
  },
  pickerActions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  pickerCancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  pickerCancelText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
  },
  pickerSelectButton: {
    flex: 2,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  pickerSelectButtonDisabled: {
    opacity: 0.5,
  },
  pickerSelectGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSelectText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: '#0D0D0D',
    fontFamily: TYPOGRAPHY.ui,
  },
  pickerSelectTextDisabled: {
    color: COLORS.textMuted,
  },

  // Review Modal - Premium immersive design
  reviewModalContainer: {
    backgroundColor: '#0f0f0f',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    overflow: 'hidden',
    // Position at bottom like native bottom sheet
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  reviewModalScroll: {
    flex: 1,
  },
  reviewModalScrollContent: {
    paddingBottom: SPACING.lg,
  },
  reviewHeader: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  reviewRoomIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  reviewRoomName: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  visualSceneContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  visualSceneText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.7,
  },
  memoryTipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
  },
  memoryTipText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  referenceContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  reviewReference: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.gold,
    fontFamily: TYPOGRAPHY.ui,
  },
  revealButton: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  revealButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.ui,
  },
  answerContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  scriptureText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.7,
  },
  recallPrompt: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  recallButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  recallButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  recallButtonNo: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recallButtonYes: {
    backgroundColor: COLORS.gold,
  },
  recallButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.ui,
  },
  closeReviewButton: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: SPACING.md,
  },
  closeReviewText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.ui,
  },
});

export default ScripturePalace;
