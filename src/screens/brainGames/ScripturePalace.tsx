/**
 * Scripture Memory Palace
 * Build a memory palace with scripture using Method of Loci
 * Unlocks: Day 7
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../../utils/haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GRADIENTS } from '../../theme/colors';
import { GAME_COLORS, GAME_GRADIENTS } from '../../theme/brainGames';
import { emitScriptureAdded, emitScriptureReviewed } from '../../worldModel';
import { useWorldModel } from '../../worldModel';
import {
  saveScripturePalace,
  loadScripturePalace,
  recordGameSession,
  type StoredScripture as PersistedScripture,
} from '../../services/gameDataService';
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
  name: string;
  description: string;
  icon: string;
  color: string;
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
  { id: 'entrance', name: 'Entrance Hall', description: 'Where your journey begins', icon: 'home-outline', color: '#D4A574' },
  { id: 'garden', name: 'Garden of Eden', description: 'A place of peace and creation', icon: 'flower-outline', color: '#A8B5A0' },
  { id: 'living', name: 'Living Room', description: 'Where you gather and rest', icon: 'bed-outline', color: '#88A4B8' },
  { id: 'kitchen', name: 'Bread of Life Kitchen', description: 'Where you are nourished', icon: 'nutrition-outline', color: '#C4A882' },
  { id: 'study', name: 'Wisdom Study', description: 'Where you grow in understanding', icon: 'book-outline', color: '#9B8FB8' },
  { id: 'bedroom', name: 'Rest Chamber', description: 'Where you find peace', icon: 'moon-outline', color: '#8898B8' },
  { id: 'tower', name: 'Watchtower', description: 'Where you see God\'s perspective', icon: 'telescope-outline', color: '#88A4A8' },
  { id: 'throne', name: 'Throne Room', description: 'Where you meet the King', icon: 'diamond-outline', color: '#D4A574' },
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

const MASTERY_LABELS: Record<number, string> = {
  1: 'Planting',
  2: 'Sprouting',
  3: 'Growing',
  4: 'Blooming',
  5: 'Rooted',
};

const MASTERY_COLORS: Record<number, string> = {
  1: '#B5888D', // New - dusty rose
  2: '#A8956F', // Learning - warm brown
  3: '#88A4A8', // Familiar - sage
  4: '#8BA5B5', // Strong - blue-gray
  5: COLORS.gold, // Mastered - gold
};

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
// ROOM CARD COMPONENT
// ============================================

interface RoomCardProps {
  room: PalaceRoom;
  scripture?: StoredScripture;
  isSelected: boolean;
  onPress: () => void;
}

function RoomCard({ room, scripture, isSelected, onPress }: RoomCardProps) {
  const masteryLevel = scripture?.masteryLevel || 1;
  const masteryColor = MASTERY_COLORS[masteryLevel];
  const needsReviewNow = scripture ? needsReview(scripture) : false;

  return (
    <TouchableOpacity
      style={[
        styles.roomCard,
        isSelected && styles.roomCardSelected,
        { borderColor: room.color },
        needsReviewNow && styles.roomCardNeedsReview,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.roomIcon, { backgroundColor: room.color + '30' }]}>
        <Ionicons name={room.icon as keyof typeof Ionicons.glyphMap} size={24} color={room.color} />
      </View>
      <View style={styles.roomContent}>
        <Text style={styles.roomName}>{room.name}</Text>
        {scripture ? (
          <>
            <Text style={styles.roomScripture} numberOfLines={1}>
              {scripture.reference}
            </Text>
            <View style={styles.masteryIndicator}>
              <View style={[styles.masteryDot, { backgroundColor: masteryColor }]} />
              <Text style={[styles.masteryLabel, { color: masteryColor }]}>
                {MASTERY_LABELS[masteryLevel]}
              </Text>
              {needsReviewNow && (
                <Text style={styles.reviewBadge}>Review</Text>
              )}
            </View>
          </>
        ) : (
          <Text style={styles.roomEmpty}>Empty - Add scripture</Text>
        )}
      </View>
      {scripture?.masteryLevel === 5 && (
        <View style={styles.masteredBadge}>
          <Ionicons name="star" size={18} color={COLORS.gold} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================================
// ADD SCRIPTURE MODAL
// ============================================

interface AddScriptureModalProps {
  visible: boolean;
  room: PalaceRoom | null;
  onClose: () => void;
  onAdd: (reference: string, text: string, visualAssociation: string) => void;
}

function AddScriptureModal({ visible, room, onClose, onAdd }: AddScriptureModalProps) {
  const [reference, setReference] = useState('');
  const [text, setText] = useState('');
  const [visualAssociation, setVisualAssociation] = useState('');

  const handleAdd = () => {
    if (reference.trim() && text.trim()) {
      onAdd(reference.trim(), text.trim(), visualAssociation.trim() || room?.description || '');
      setReference('');
      setText('');
      setVisualAssociation('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Scripture</Text>
          <Text style={styles.modalSubtitle}>
            Place in: {room?.name}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reference</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Psalm 23:1"
              placeholderTextColor={COLORS.mutedBrown}
              value={reference}
              onChangeText={setReference}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Scripture Text</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Type or paste the scripture..."
              placeholderTextColor={COLORS.mutedBrown}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Visual Association (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="What image helps you remember?"
              placeholderTextColor={COLORS.mutedBrown}
              value={visualAssociation}
              onChangeText={setVisualAssociation}
            />
            <Text style={styles.inputHint}>
              Imagine this scene in {room?.name.toLowerCase()}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={onClose}
              style={styles.modalButton}
            />
            <Button
              title="Add to Palace"
              variant="primary"
              onPress={handleAdd}
              disabled={!reference.trim() || !text.trim()}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
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
}

function ReviewScriptureModal({
  visible,
  scripture,
  room,
  onClose,
  onRecalled,
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
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={[styles.reviewRoomHeader, { backgroundColor: room.color + '20' }]}>
            <Ionicons name={room.icon as keyof typeof Ionicons.glyphMap} size={24} color={room.color} style={{ marginRight: SPACING.sm }} />
            <Text style={styles.reviewRoomName}>{room.name}</Text>
          </View>

          <View style={styles.reviewPrompt}>
            <Text style={styles.reviewVisual}>
              {scripture.visualAssociation || room.description}
            </Text>
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
              <Text style={styles.revealButtonText}>Tap to reveal</Text>
            </TouchableOpacity>
          ) : (
            <FadeInView>
              <View style={styles.answerContainer}>
                <Text style={styles.scriptureText}>
                  "{scripture.text}"
                </Text>
              </View>

              <Text style={styles.recallPrompt}>
                Did you recall it correctly?
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
                  <Text style={styles.recallButtonText}>Still Learning</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.recallButton, styles.recallButtonYes]}
                  onPress={() => {
                    safeHaptics.notificationAsync(NotificationFeedbackType.Success);
                    onRecalled(true);
                    onClose();
                  }}
                >
                  <Text style={[styles.recallButtonText, { color: COLORS.cream }]}>
                    Got It!
                  </Text>
                </TouchableOpacity>
              </View>
            </FadeInView>
          )}

          <TouchableOpacity
            style={styles.closeReviewButton}
            onPress={onClose}
          >
            <Text style={styles.closeReviewText}>Close</Text>
          </TouchableOpacity>
        </View>
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
  const [scriptures, setScriptures] = useState<StoredScripture[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<PalaceRoom | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
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

  // Handle adding scripture
  const handleAddScripture = useCallback((reference: string, text: string, visualAssociation: string) => {
    if (!selectedRoom) return;

    const newScripture: StoredScripture = {
      id: `scripture_${Date.now()}`,
      reference,
      text,
      roomId: selectedRoom.id,
      visualAssociation,
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
    emitScriptureAdded(reference, text, selectedRoom.id, visualAssociation);
    safeHaptics.notificationAsync(NotificationFeedbackType.Success);
  }, [selectedRoom]);

  // Handle room press
  const handleRoomPress = useCallback((room: PalaceRoom) => {
    const scripture = getScriptureForRoom(room.id);
    setSelectedRoom(room);

    if (scripture) {
      // Review existing scripture
      setReviewingScripture(scripture);
      setShowReviewModal(true);
    } else {
      // Add new scripture
      setShowAddModal(true);
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
      title="Scripture Palace"
      subtitle="Method of Loci"
      onClose={handleClose}
      headerRight={
        scriptureCount > 0 ? (
          <TouchableOpacity onPress={startReview}>
            <Text style={styles.reviewButton}>Review</Text>
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
              <Text style={styles.statLabel}>Scriptures</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, needsReviewCount > 0 && { color: COLORS.gold }]}>
                {needsReviewCount}
              </Text>
              <Text style={styles.statLabel}>Due Review</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{masteredCount}</Text>
              <Text style={styles.statLabel}>Rooted</Text>
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
              <Text style={styles.introTitle}>Welcome to Your Palace</Text>
              <Text style={styles.introText}>
                The Method of Loci is an ancient memory technique. Place scriptures
                in rooms of your mental palace, and associate each with a vivid image.
                When you revisit the rooms, the scriptures will return to you.
              </Text>
            </GameCard>
          </FadeInView>
        )}

        {/* Palace Rooms */}
        <FadeInView delay={300}>
          <GameSection title="Your Palace Rooms">
            {PALACE_ROOMS.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                scripture={getScriptureForRoom(room.id)}
                isSelected={selectedRoom?.id === room.id}
                onPress={() => handleRoomPress(room)}
              />
            ))}
          </GameSection>
        </FadeInView>

        {/* Scripture */}
        <FadeInView delay={400}>
          <View style={styles.scriptureSection}>
            <Text style={styles.devotionalText}>
              "I have hidden your word in my heart that I might not sin against you."
            </Text>
            <Text style={styles.scriptureReference}>- Psalm 119:11</Text>
          </View>
        </FadeInView>
      </ScrollView>

      {/* Add Scripture Modal */}
      <AddScriptureModal
        visible={showAddModal}
        room={selectedRoom}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddScripture}
      />

      {/* Review Scripture Modal */}
      <ReviewScriptureModal
        visible={showReviewModal}
        scripture={reviewingScripture}
        room={selectedRoom}
        onClose={() => {
          setShowReviewModal(false);
          if (mode === 'explore') {
            setReviewingScripture(null);
          }
        }}
        onRecalled={handleRecalled}
      />

      {/* Completion Modal */}
      <SessionComplete
        visible={showComplete}
        title="Palace Tour Complete"
        subtitle="You walked through your memory palace"
        stats={[
          { label: 'Reviewed', value: scriptures.filter((s) => s.text).length },
          { label: 'Recalled', value: reviewScore },
        ]}
        encouragement="Each visit strengthens your memory. God's word is taking root in your heart."
        onContinue={() => {
          setShowComplete(false);
          setMode('explore');
        }}
        continueLabel="Continue"
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
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
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
    color: COLORS.richBrown,
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

  // Room Cards
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    ...SHADOWS.soft,
  },
  roomCardSelected: {
    backgroundColor: COLORS.warmBeige,
  },
  roomCardNeedsReview: {
    borderLeftColor: COLORS.gold,
    borderLeftWidth: 4,
  },
  roomIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  roomIconText: {
    fontSize: 20,
  },
  roomContent: {
    flex: 1,
  },
  roomName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  roomScripture: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  roomEmpty: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
    marginTop: 2,
  },
  masteryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  masteryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  masteryLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  reviewBadge: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
    color: COLORS.gold,
    backgroundColor: COLORS.gold + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  masteredBadge: {
    marginLeft: SPACING.sm,
  },
  masteredText: {
    fontSize: 18,
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
  },
  devotionalText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },
  scriptureReference: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: SPACING.sm,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(93, 78, 55, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xs,
  },
  modalInput: {
    backgroundColor: COLORS.softIvory,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  modalButton: {
    minWidth: 100,
  },

  // Review Modal
  reviewRoomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  reviewRoomIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  reviewRoomName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  reviewPrompt: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  reviewVisual: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  reviewReference: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  revealButton: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  revealButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  answerContainer: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  scriptureText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.6,
  },
  recallPrompt: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  recallButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  recallButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  recallButtonNo: {
    backgroundColor: COLORS.warmBeige,
  },
  recallButtonYes: {
    backgroundColor: COLORS.sage,
  },
  recallButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  closeReviewButton: {
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  closeReviewText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
});

export default ScripturePalace;
