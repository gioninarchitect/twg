/**
 * Tea With God: Navigation Architecture
 * Sanctuary Logic Navigation v2.5.0
 *
 * AXIOM_1: CHRONOLOGICAL SOVEREIGNTY
 * Users move strictly forward through days 1-40.
 * Content is locked until the previous day is complete.
 *
 * AXIOM_4: THE SAFETY OVERRIDE
 * Crisis_State bypasses all navigation stacks.
 */

import React, { useEffect, useCallback, createContext, useContext } from 'react';
import { NavigationContainer, useNavigation, NavigationProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  RootStackParamList,
  UserJourney,
  JourneyPhase,
  SANCTUARY_PALETTE,
  TYPOGRAPHY,
  getPhaseForDay,
  isDayAccessible,
  isPilgrim,
  AccessLevel,
} from './types';

// ============================================================================
// NAVIGATION CONTEXT - Journey State Management
// ============================================================================

interface NavigationContextType {
  journey: UserJourney | null;
  setJourney: (journey: UserJourney) => void;
  currentPhase: JourneyPhase;
  canAccessDay: (dayId: number) => boolean;
  triggerCrisisOverride: (source: 'MANUAL_SOS' | 'SENTIMENT_DETECTED') => void;
  isCrisisActive: boolean;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useJourneyNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useJourneyNavigation must be used within NavigationProvider');
  }
  return context;
};

// ============================================================================
// SCREEN IMPORTS (Placeholder - would be actual screen components)
// ============================================================================

// Auth Screens
const WelcomeScreen = React.lazy(() => import('./screens/WelcomeScreen'));
const CodeRedemptionScreen = React.lazy(() => import('./screens/CodeRedemptionScreen'));

// Journey Screens
const DashboardScreen = React.lazy(() => import('./screens/DashboardScreen'));
const DayModuleScreen = React.lazy(() => import('./screens/DayModuleScreen'));
const DevotionalScreen = React.lazy(() => import('./screens/DevotionalScreen'));
const JournalScreen = React.lazy(() => import('./screens/JournalScreen'));

// Support Screens
const SettingsScreen = React.lazy(() => import('./screens/SettingsScreen'));
const JourneyProgressScreen = React.lazy(() => import('./screens/JourneyProgressScreen'));

// Special Flows
const WelcomeBackScreen = React.lazy(() => import('./screens/WelcomeBackScreen'));
const CrisisModalScreen = React.lazy(() => import('./screens/CrisisModalScreen'));

// ============================================================================
// STACK NAVIGATORS
// ============================================================================

const Stack = createNativeStackNavigator<RootStackParamList>();

// ============================================================================
// PHASE-AWARE HEADER CONFIGURATION
// ============================================================================

const getPhaseHeaderStyle = (phase: JourneyPhase) => {
  // Phase-specific styling while maintaining Sanctuary Palette
  const phaseAccents = {
    Valley: {
      // Days 1-14: Deeper, more subdued
      backgroundColor: SANCTUARY_PALETTE.cream,
      borderBottomColor: SANCTUARY_PALETTE.richBrown,
    },
    Rising: {
      // Days 15-28: Warming transition
      backgroundColor: SANCTUARY_PALETTE.cream,
      borderBottomColor: SANCTUARY_PALETTE.gold,
    },
    Becoming: {
      // Days 29-40: Full gold integration
      backgroundColor: SANCTUARY_PALETTE.cream,
      borderBottomColor: SANCTUARY_PALETTE.gold,
    },
  };

  return {
    headerStyle: {
      backgroundColor: phaseAccents[phase].backgroundColor,
    },
    headerTintColor: SANCTUARY_PALETTE.earth,
    headerTitleStyle: {
      fontFamily: TYPOGRAPHY.ui,
      fontWeight: '600' as const,
      color: SANCTUARY_PALETTE.earth,
    },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
};

// ============================================================================
// ACCESS GATE COMPONENT
// ============================================================================

interface AccessGateProps {
  children: React.ReactNode;
  requiredLevel: AccessLevel;
  requiredDay?: number;
}

const AccessGate: React.FC<AccessGateProps> = ({
  children,
  requiredLevel,
  requiredDay,
}) => {
  const { journey, canAccessDay } = useJourneyNavigation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!journey) {
      // No journey - redirect to Welcome
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
      return;
    }

    // Check access level
    if (requiredLevel === 'PILGRIM' && !isPilgrim(journey)) {
      // Guest trying to access Pilgrim content
      navigation.navigate('CodeRedemption');
      return;
    }

    // Check day access (CHRONOLOGICAL SOVEREIGNTY)
    if (requiredDay && !canAccessDay(requiredDay)) {
      // Cannot skip ahead - navigate back to current day
      navigation.navigate('DayModule', { dayId: journey.currentDayIndex });
    }
  }, [journey, requiredLevel, requiredDay, canAccessDay, navigation]);

  return <>{children}</>;
};

// ============================================================================
// SOS FLOATING ACTION BUTTON - GLOBAL SAFETY
// ============================================================================

interface SOSButtonProps {
  onPress: () => void;
}

const SOSButton: React.FC<SOSButtonProps> = ({ onPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[
        styles.sosButton,
        {
          bottom: insets.bottom + 20,
        },
      ]}
      onPress={onPress}
      accessibilityLabel="Emergency support"
      accessibilityHint="Opens crisis resources immediately"
      accessibilityRole="button"
    >
      <View style={styles.sosIconContainer}>
        {/* Heart icon - not a panic-inducing symbol */}
        <Text style={styles.sosIcon}>🤍</Text>
      </View>
      <Text style={styles.sosText}>SOS</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// MAIN NAVIGATION PROVIDER
// ============================================================================

interface NavigationProviderProps {
  children: React.ReactNode;
  initialJourney: UserJourney | null;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  initialJourney,
}) => {
  const [journey, setJourney] = React.useState<UserJourney | null>(initialJourney);
  const [isCrisisActive, setIsCrisisActive] = React.useState(false);
  const navigationRef = React.useRef<any>(null);

  const currentPhase = React.useMemo(() => {
    if (!journey) return 'Valley';
    return getPhaseForDay(journey.currentDayIndex);
  }, [journey?.currentDayIndex]);

  const canAccessDay = useCallback(
    (dayId: number): boolean => {
      if (!journey) return false;
      return isDayAccessible(journey, dayId);
    },
    [journey]
  );

  const triggerCrisisOverride = useCallback(
    (source: 'MANUAL_SOS' | 'SENTIMENT_DETECTED') => {
      setIsCrisisActive(true);

      // AXIOM_4: Bypass all navigation stacks immediately
      if (navigationRef.current) {
        navigationRef.current.navigate('CrisisModal', { source });
      }
    },
    []
  );

  const contextValue: NavigationContextType = {
    journey,
    setJourney,
    currentPhase,
    canAccessDay,
    triggerCrisisOverride,
    isCrisisActive,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      <NavigationContainer ref={navigationRef}>
        {children}
        {/* Global SOS Button - Always visible except during crisis */}
        {journey && !isCrisisActive && (
          <SOSButton onPress={() => triggerCrisisOverride('MANUAL_SOS')} />
        )}
      </NavigationContainer>
    </NavigationContext.Provider>
  );
};

// ============================================================================
// ROOT NAVIGATOR
// ============================================================================

export const RootNavigator: React.FC = () => {
  const { journey, currentPhase, isCrisisActive } = useJourneyNavigation();

  const headerOptions = getPhaseHeaderStyle(currentPhase);

  return (
    <Stack.Navigator
      screenOptions={{
        ...headerOptions,
        contentStyle: { backgroundColor: SANCTUARY_PALETTE.cream },
        animation: 'fade',
      }}
    >
      {/* ============================================================ */}
      {/* AUTH FLOW - No journey yet */}
      {/* ============================================================ */}
      {!journey && (
        <Stack.Group>
          <Stack.Screen
            name="Welcome"
            options={{ headerShown: false }}
          >
            {() => (
              <React.Suspense fallback={<LoadingView />}>
                <WelcomeScreen />
              </React.Suspense>
            )}
          </Stack.Screen>

          <Stack.Screen
            name="CodeRedemption"
            options={{ title: 'Enter Your Code' }}
          >
            {() => (
              <React.Suspense fallback={<LoadingView />}>
                <CodeRedemptionScreen />
              </React.Suspense>
            )}
          </Stack.Screen>
        </Stack.Group>
      )}

      {/* ============================================================ */}
      {/* MAIN JOURNEY FLOW */}
      {/* ============================================================ */}
      {journey && (
        <Stack.Group>
          {/* Dashboard - Journey Overview */}
          <Stack.Screen
            name="Dashboard"
            options={{
              title: 'Your Journey',
              headerLeft: () => null, // No back from dashboard
            }}
          >
            {() => (
              <React.Suspense fallback={<LoadingView />}>
                <DashboardScreen />
              </React.Suspense>
            )}
          </Stack.Screen>

          {/* Day Module - The Daily Unit */}
          <Stack.Screen
            name="DayModule"
            options={({ route }) => ({
              title: `Day ${route.params.dayId}`,
            })}
          >
            {({ route }) => (
              <AccessGate requiredLevel="GUEST" requiredDay={route.params.dayId}>
                <React.Suspense fallback={<LoadingView />}>
                  <DayModuleScreen dayId={route.params.dayId} />
                </React.Suspense>
              </AccessGate>
            )}
          </Stack.Screen>

          {/* Devotional - Reading Experience */}
          <Stack.Screen
            name="Devotional"
            options={{
              title: '', // Clean header for reading
              headerTransparent: true,
            }}
          >
            {({ route }) => (
              <AccessGate requiredLevel="GUEST" requiredDay={route.params.dayId}>
                <React.Suspense fallback={<LoadingView />}>
                  <DevotionalScreen dayId={route.params.dayId} />
                </React.Suspense>
              </AccessGate>
            )}
          </Stack.Screen>

          {/* Journal - Sacred Writing Space */}
          <Stack.Screen
            name="Journal"
            options={{
              title: 'Your Thoughts',
              // Special: Audio continues at 80% volume here
            }}
          >
            {({ route }) => (
              <AccessGate requiredLevel="GUEST" requiredDay={route.params.dayId}>
                <React.Suspense fallback={<LoadingView />}>
                  <JournalScreen
                    dayId={route.params.dayId}
                    promptId={route.params.promptId}
                  />
                </React.Suspense>
              </AccessGate>
            )}
          </Stack.Screen>

          {/* ======================================================== */}
          {/* GUEST -> PILGRIM GATE (Days 4+) */}
          {/* ======================================================== */}
          {!isPilgrim(journey) && journey.currentDayIndex >= 3 && (
            <Stack.Screen
              name="CodeRedemption"
              options={{
                title: 'Continue Your Journey',
                presentation: 'modal',
              }}
            >
              {() => (
                <React.Suspense fallback={<LoadingView />}>
                  <CodeRedemptionScreen />
                </React.Suspense>
              )}
            </Stack.Screen>
          )}
        </Stack.Group>
      )}

      {/* ============================================================ */}
      {/* SUPPORT SCREENS */}
      {/* ============================================================ */}
      <Stack.Group>
        <Stack.Screen
          name="Settings"
          options={{ title: 'Settings' }}
        >
          {() => (
            <React.Suspense fallback={<LoadingView />}>
              <SettingsScreen />
            </React.Suspense>
          )}
        </Stack.Screen>

        <Stack.Screen
          name="JourneyProgress"
          options={{
            title: 'Your Progress',
            // Note: Shows "Total Volume", NEVER "Streaks"
          }}
        >
          {() => (
            <React.Suspense fallback={<LoadingView />}>
              <JourneyProgressScreen />
            </React.Suspense>
          )}
        </Stack.Screen>
      </Stack.Group>

      {/* ============================================================ */}
      {/* RE-ENTRY FLOW - Grace Protocol */}
      {/* ============================================================ */}
      <Stack.Screen
        name="WelcomeBack"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      >
        {({ route }) => (
          <React.Suspense fallback={<LoadingView />}>
            <WelcomeBackScreen daysSinceActive={route.params.daysSinceActive} />
          </React.Suspense>
        )}
      </Stack.Screen>

      {/* ============================================================ */}
      {/* CRISIS MODAL - GLOBAL OVERRIDE */}
      {/* ============================================================ */}
      <Stack.Screen
        name="CrisisModal"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'none', // INSTANT - no animation delay
          gestureEnabled: false, // Cannot accidentally dismiss
        }}
      >
        {({ route }) => (
          <React.Suspense fallback={<LoadingView />}>
            <CrisisModalScreen source={route.params.source} />
          </React.Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

// ============================================================================
// LOADING VIEW - Sanctuary Style
// ============================================================================

const LoadingView: React.FC = () => (
  <View style={styles.loadingContainer}>
    {/* Gold shimmer animation would be applied here */}
    <View style={styles.loadingIndicator} />
  </View>
);

// ============================================================================
// PHASE TRANSITION LOGIC
// ============================================================================

/**
 * Called when a day is completed to check for phase transitions
 */
export const handleDayCompletion = (
  currentDayId: number,
  setJourney: (updater: (prev: UserJourney) => UserJourney) => void
): void => {
  const newDayIndex = currentDayId + 1;

  if (newDayIndex > 40) {
    // Journey complete - would trigger completion flow
    return;
  }

  const previousPhase = getPhaseForDay(currentDayId);
  const nextPhase = getPhaseForDay(newDayIndex);

  // Phase transition detected
  if (previousPhase !== nextPhase) {
    // Would trigger phase transition animation/modal here
    console.log(`Phase transition: ${previousPhase} -> ${nextPhase}`);
  }

  setJourney((prev) => ({
    ...prev,
    currentDayIndex: newDayIndex,
    currentPhase: nextPhase,
    totalDaysCompleted: prev.totalDaysCompleted + 1,
    lastActiveTimestamp: new Date().toISOString(),
  }));
};

// ============================================================================
// RE-ENTRY FLOW HANDLER
// ============================================================================

/**
 * Check if user needs the Welcome Back flow (14+ days inactive)
 */
export const checkReentryNeeded = (
  journey: UserJourney,
  navigation: NavigationProp<RootStackParamList>
): void => {
  const lastActive = new Date(journey.lastActiveTimestamp);
  const now = new Date();
  const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  const daysSinceActive = Math.floor(hoursSinceActive / 24);

  if (daysSinceActive >= 14) {
    navigation.navigate('WelcomeBack', { daysSinceActive });
  }
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SANCTUARY_PALETTE.cream,
  },
  loadingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // Gold shimmer gradient would be animated here
    backgroundColor: SANCTUARY_PALETTE.gold,
  },
  sosButton: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SANCTUARY_PALETTE.dustyBlue,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: SANCTUARY_PALETTE.earth,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sosIconContainer: {
    marginRight: 6,
  },
  sosIcon: {
    fontSize: 18,
  },
  sosText: {
    fontFamily: TYPOGRAPHY.ui,
    fontSize: 14,
    fontWeight: '600',
    color: SANCTUARY_PALETTE.cream,
    letterSpacing: 1,
  },
});

// ============================================================================
// APP ENTRY POINT
// ============================================================================

interface AppProps {
  initialJourney: UserJourney | null;
}

const App: React.FC<AppProps> = ({ initialJourney }) => {
  return (
    <NavigationProvider initialJourney={initialJourney}>
      <RootNavigator />
    </NavigationProvider>
  );
};

export default App;
