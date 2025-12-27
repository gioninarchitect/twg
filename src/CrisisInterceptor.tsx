/**
 * Tea With God: Crisis Interceptor
 * Zero-Latency Safety Override v2.5.0
 *
 * AXIOM_4: THE SAFETY OVERRIDE
 * Crisis_State is a GLOBAL INTERRUPT.
 * It bypasses all animation queues, navigation stacks, and API calls
 * to render local safety resources IMMEDIATELY.
 *
 * CRITICAL CONSTRAINTS:
 * - NO NETWORK DEPENDENCY: All resources bundled locally (JSON)
 * - NO BRIGHT RED: Use Muted Terracotta (#B38B7D) only
 * - NO PANIC-INDUCING UI: Gentle, grounded visual language
 * - ZERO LATENCY: Must render <200ms without network
 */

import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Animated,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SANCTUARY_PALETTE,
  TYPOGRAPHY,
  CrisisLevel,
  CrisisResource,
  CrisisState,
  CRISIS_TRIGGER_WORDS,
  OFFLINE_CRISIS_RESOURCES,
} from './types';

// ============================================================================
// LOCAL SENTIMENT SCANNER (OFFLINE NLP)
// ============================================================================

/**
 * Lightweight local sentiment analysis.
 * NO NETWORK CALLS - operates entirely offline.
 */
export class SentimentScanner {
  private static instance: SentimentScanner;

  private constructor() {}

  static getInstance(): SentimentScanner {
    if (!SentimentScanner.instance) {
      SentimentScanner.instance = new SentimentScanner();
    }
    return SentimentScanner.instance;
  }

  /**
   * Scan text for crisis indicators.
   * Returns detected phrases and recommended crisis level.
   */
  scanText(text: string): {
    level: CrisisLevel;
    detectedPhrases: string[];
    confidence: number;
  } {
    const normalizedText = text.toLowerCase().trim();
    const detectedPhrases: string[] = [];

    // Check against trigger words
    for (const phrase of CRISIS_TRIGGER_WORDS) {
      if (normalizedText.includes(phrase.toLowerCase())) {
        detectedPhrases.push(phrase);
      }
    }

    // Determine crisis level based on detection
    if (detectedPhrases.length === 0) {
      return { level: 'NONE', detectedPhrases: [], confidence: 0 };
    }

    // Higher severity phrases
    const criticalPhrases = ['suicide', 'end it', 'want to die', 'hurt myself'];
    const hasCritical = detectedPhrases.some((p) =>
      criticalPhrases.includes(p.toLowerCase())
    );

    if (hasCritical) {
      return {
        level: 'CRITICAL',
        detectedPhrases,
        confidence: 0.9,
      };
    }

    return {
      level: 'ELEVATED',
      detectedPhrases,
      confidence: 0.7,
    };
  }

  /**
   * Real-time scanning for journal input.
   * Debounced to avoid excessive processing.
   */
  createRealtimeScanner(
    onCrisisDetected: (level: CrisisLevel, phrases: string[]) => void,
    debounceMs: number = 500
  ): (text: string) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return (text: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const result = this.scanText(text);
        if (result.level !== 'NONE') {
          onCrisisDetected(result.level, result.detectedPhrases);
        }
      }, debounceMs);
    };
  }
}

// ============================================================================
// CRISIS CONTEXT
// ============================================================================

interface CrisisContextType {
  crisisState: CrisisState;
  triggerCrisis: (source: 'MANUAL_SOS' | 'SENTIMENT_DETECTED', phrases?: string[]) => void;
  dismissCrisis: () => void;
  resources: CrisisResource[];
}

const CrisisContext = React.createContext<CrisisContextType | null>(null);

export const useCrisis = () => {
  const context = React.useContext(CrisisContext);
  if (!context) {
    throw new Error('useCrisis must be used within CrisisProvider');
  }
  return context;
};

// ============================================================================
// CRISIS PROVIDER
// ============================================================================

interface CrisisProviderProps {
  children: React.ReactNode;
  onCrisisTriggered?: (state: CrisisState) => void;
}

export const CrisisProvider: React.FC<CrisisProviderProps> = ({
  children,
  onCrisisTriggered,
}) => {
  const [crisisState, setCrisisState] = React.useState<CrisisState>({
    level: 'NONE',
    triggeredAt: null,
    triggerSource: null,
    detectedPhrases: [],
  });

  const triggerCrisis = useCallback(
    (source: 'MANUAL_SOS' | 'SENTIMENT_DETECTED', phrases: string[] = []) => {
      const newState: CrisisState = {
        level: 'CRITICAL',
        triggeredAt: new Date().toISOString(),
        triggerSource: source,
        detectedPhrases: phrases,
      };

      setCrisisState(newState);
      onCrisisTriggered?.(newState);
    },
    [onCrisisTriggered]
  );

  const dismissCrisis = useCallback(() => {
    setCrisisState({
      level: 'NONE',
      triggeredAt: null,
      triggerSource: null,
      detectedPhrases: [],
    });
  }, []);

  const contextValue: CrisisContextType = {
    crisisState,
    triggerCrisis,
    dismissCrisis,
    resources: OFFLINE_CRISIS_RESOURCES,
  };

  return (
    <CrisisContext.Provider value={contextValue}>
      {children}
    </CrisisContext.Provider>
  );
};

// ============================================================================
// CRISIS MODAL COMPONENT
// ============================================================================

interface CrisisModalProps {
  source: 'MANUAL_SOS' | 'SENTIMENT_DETECTED';
  onDismiss?: () => void;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({ source, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const { dismissCrisis, resources } = useCrisis();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Gentle entry animation (fast but not jarring)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150, // Fast but smooth
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(
      'Crisis support resources are now available. You are not alone.'
    );
  }, []);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissCrisis();
      onDismiss?.();
    });
  }, [dismissCrisis, onDismiss]);

  const handleCallHotline = useCallback((phoneNumber: string) => {
    const url = Platform.OS === 'ios' ? `tel:${phoneNumber}` : `tel:${phoneNumber}`;
    Linking.openURL(url);
  }, []);

  const handleTextHotline = useCallback((phoneNumber: string) => {
    const url = `sms:${phoneNumber}`;
    Linking.openURL(url);
  }, []);

  // Separate resources by type
  const hotlines = useMemo(
    () => resources.filter((r) => r.type === 'HOTLINE'),
    [resources]
  );
  const prayers = useMemo(
    () => resources.filter((r) => r.type === 'PRAYER'),
    [resources]
  );
  const groundingExercises = useMemo(
    () => resources.filter((r) => r.type === 'GROUNDING'),
    [resources]
  );

  return (
    <Animated.View
      style={[
        styles.modalContainer,
        {
          opacity: fadeAnim,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.modalContent,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header - Gentle, not alarming */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🤍</Text>
          <Text style={styles.headerTitle}>You Are Not Alone</Text>
          <Text style={styles.headerSubtitle}>
            {source === 'SENTIMENT_DETECTED'
              ? 'We noticed you might be struggling. Help is here.'
              : 'Support is always available.'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hotlines Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Immediate Support</Text>
            {hotlines.map((resource) => (
              <HotlineCard
                key={resource.resourceId}
                resource={resource}
                onCall={() => handleCallHotline(resource.phoneNumber!)}
                onText={
                  resource.phoneNumber === '741741'
                    ? () => handleTextHotline(resource.phoneNumber!)
                    : undefined
                }
              />
            ))}
          </View>

          {/* Grounding Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ground Yourself</Text>
            {groundingExercises.map((resource) => (
              <ResourceCard key={resource.resourceId} resource={resource} />
            ))}
          </View>

          {/* Prayer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>A Prayer for This Moment</Text>
            {prayers.map((resource) => (
              <PrayerCard key={resource.resourceId} resource={resource} />
            ))}
          </View>
        </ScrollView>

        {/* Dismiss Button - Not "close" but "I'm feeling better" */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          accessibilityLabel="Return to app when ready"
          accessibilityRole="button"
        >
          <Text style={styles.dismissText}>I'm Ready to Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ============================================================================
// HOTLINE CARD COMPONENT
// ============================================================================

interface HotlineCardProps {
  resource: CrisisResource;
  onCall: () => void;
  onText?: () => void;
}

const HotlineCard: React.FC<HotlineCardProps> = ({ resource, onCall, onText }) => (
  <View style={styles.hotlineCard}>
    <View style={styles.hotlineInfo}>
      <Text style={styles.hotlineTitle}>{resource.title}</Text>
      <Text style={styles.hotlineDescription}>{resource.content}</Text>
    </View>
    <View style={styles.hotlineActions}>
      <TouchableOpacity
        style={styles.callButton}
        onPress={onCall}
        accessibilityLabel={`Call ${resource.title}`}
        accessibilityRole="button"
      >
        <Text style={styles.callButtonText}>Call</Text>
      </TouchableOpacity>
      {onText && (
        <TouchableOpacity
          style={styles.textButton}
          onPress={onText}
          accessibilityLabel={`Text ${resource.title}`}
          accessibilityRole="button"
        >
          <Text style={styles.textButtonText}>Text</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ============================================================================
// RESOURCE CARD COMPONENT
// ============================================================================

interface ResourceCardProps {
  resource: CrisisResource;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => (
  <View style={styles.resourceCard}>
    <Text style={styles.resourceTitle}>{resource.title}</Text>
    <Text style={styles.resourceContent}>{resource.content}</Text>
  </View>
);

// ============================================================================
// PRAYER CARD COMPONENT
// ============================================================================

const PrayerCard: React.FC<ResourceCardProps> = ({ resource }) => (
  <View style={styles.prayerCard}>
    <Text style={styles.prayerTitle}>{resource.title}</Text>
    <Text style={styles.prayerContent}>{resource.content}</Text>
  </View>
);

// ============================================================================
// JOURNAL INTEGRATION HOOK
// ============================================================================

/**
 * Hook to integrate sentiment scanning with journal input.
 * Gently triggers crisis modal when concerning content is detected.
 */
export function useJournalSentimentScanning(
  onCrisisDetected: () => void
) {
  const scanner = useRef(SentimentScanner.getInstance());
  const { triggerCrisis } = useCrisis();

  const handleTextChange = useCallback(
    (text: string) => {
      const result = scanner.current.scanText(text);

      if (result.level === 'CRITICAL' || result.level === 'ELEVATED') {
        triggerCrisis('SENTIMENT_DETECTED', result.detectedPhrases);
        onCrisisDetected();
      }
    },
    [triggerCrisis, onCrisisDetected]
  );

  // Create debounced scanner
  const debouncedScan = useMemo(
    () =>
      scanner.current.createRealtimeScanner((level, phrases) => {
        if (level !== 'NONE') {
          triggerCrisis('SENTIMENT_DETECTED', phrases);
          onCrisisDetected();
        }
      }, 800), // 800ms debounce for typing
    [triggerCrisis, onCrisisDetected]
  );

  return {
    scanText: handleTextChange,
    scanTextDebounced: debouncedScan,
  };
}

// ============================================================================
// SOS FLOATING ACTION BUTTON
// ============================================================================

interface SOSFloatingButtonProps {
  onPress: () => void;
  visible?: boolean;
}

export const SOSFloatingButton: React.FC<SOSFloatingButtonProps> = ({
  onPress,
  visible = true,
}) => {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.sosFloating,
        {
          bottom: insets.bottom + 24,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.sosFloatingButton}
        onPress={onPress}
        accessibilityLabel="Emergency support"
        accessibilityHint="Opens crisis resources immediately"
        accessibilityRole="button"
      >
        <Text style={styles.sosFloatingIcon}>🤍</Text>
        <Text style={styles.sosFloatingText}>SOS</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Modal Container
  modalContainer: {
    flex: 1,
    backgroundColor: SANCTUARY_PALETTE.cream,
  },
  modalContent: {
    flex: 1,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: SANCTUARY_PALETTE.warmBeige,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: 24,
    fontWeight: '600',
    color: SANCTUARY_PALETTE.earth,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.devotional,
    fontSize: 16,
    color: SANCTUARY_PALETTE.richBrown,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: 14,
    fontWeight: '600',
    color: SANCTUARY_PALETTE.richBrown,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },

  // Hotline Card
  hotlineCard: {
    backgroundColor: SANCTUARY_PALETTE.dustyBlue,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  hotlineInfo: {
    marginBottom: 16,
  },
  hotlineTitle: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: 18,
    fontWeight: '600',
    color: SANCTUARY_PALETTE.cream,
    marginBottom: 4,
  },
  hotlineDescription: {
    fontFamily: TYPOGRAPHY.devotional,
    fontSize: 14,
    color: SANCTUARY_PALETTE.cream,
    opacity: 0.9,
  },
  hotlineActions: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    backgroundColor: SANCTUARY_PALETTE.cream,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  callButtonText: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: 16,
    fontWeight: '600',
    color: SANCTUARY_PALETTE.dustyBlue,
  },
  textButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: SANCTUARY_PALETTE.cream,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  textButtonText: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: 16,
    fontWeight: '600',
    color: SANCTUARY_PALETTE.cream,
  },

  // Resource Card
  resourceCard: {
    backgroundColor: SANCTUARY_PALETTE.warmBeige,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  resourceTitle: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: 16,
    fontWeight: '600',
    color: SANCTUARY_PALETTE.earth,
    marginBottom: 12,
  },
  resourceContent: {
    fontFamily: TYPOGRAPHY.devotional,
    fontSize: 16,
    color: SANCTUARY_PALETTE.richBrown,
    lineHeight: 26,
  },

  // Prayer Card
  prayerCard: {
    backgroundColor: SANCTUARY_PALETTE.warmBeige,
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: SANCTUARY_PALETTE.gold,
  },
  prayerTitle: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: 14,
    fontWeight: '600',
    color: SANCTUARY_PALETTE.gold,
    marginBottom: 16,
  },
  prayerContent: {
    fontFamily: TYPOGRAPHY.devotional,
    fontSize: 18,
    color: SANCTUARY_PALETTE.earth,
    lineHeight: 32,
    fontStyle: 'italic',
  },

  // Dismiss Button
  dismissButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SANCTUARY_PALETTE.cream,
    borderTopWidth: 1,
    borderTopColor: SANCTUARY_PALETTE.warmBeige,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: 16,
    fontWeight: '600',
    color: SANCTUARY_PALETTE.gold,
  },

  // SOS Floating Button
  sosFloating: {
    position: 'absolute',
    right: 24,
    zIndex: 1000,
  },
  sosFloatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SANCTUARY_PALETTE.dustyBlue,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: SANCTUARY_PALETTE.earth,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sosFloatingIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sosFloatingText: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: 14,
    fontWeight: '700',
    color: SANCTUARY_PALETTE.cream,
    letterSpacing: 1,
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const sentimentScanner = SentimentScanner.getInstance();
