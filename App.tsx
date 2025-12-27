/**
 * Tea With God - Main App
 * A 40-Day Healing Companion
 */

import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, StyleSheet, View, ActivityIndicator, Text, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Feather } from '@expo/vector-icons';
// Note: Removed QueryClient - using local-first architecture

import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DayModuleScreen from './src/screens/DayModuleScreen';
import CrisisModal from './src/screens/CrisisModal';
// Brain Games
import BrainGamesHub from './src/screens/brainGames/BrainGamesHub';
import BreatheWithGod from './src/screens/brainGames/BreatheWithGod';
import GratitudeGarden from './src/screens/brainGames/GratitudeGarden';
import ScripturePalace from './src/screens/brainGames/ScripturePalace';
import ThoughtDetective from './src/screens/brainGames/ThoughtDetective';
import BodyScanRelease from './src/screens/brainGames/BodyScanRelease';
import PatternPeace from './src/screens/brainGames/PatternPeace';
import ReEngagementModal from './src/components/ReEngagementModal';
import AccessCodeModal from './src/components/AccessCodeModal';
import SettingsModal from './src/components/SettingsModal';
import { ProgressProvider, useProgress } from './src/context/ProgressContext';
import { AccessProvider, useAccess } from './src/context/AccessContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { JournalProvider } from './src/context/JournalContext';
import { SyncProvider } from './src/context/SyncContext';
import { WorldModelProvider } from './src/worldModel/WorldModelContext';
import { COLORS, TYPOGRAPHY, SHADOWS } from './src/theme/colors';
import { supabase } from './src/services/supabase';

// Deep linking configuration
const linking = {
  prefixes: [Linking.createURL('/'), 'teawithgod://'],
  config: {
    screens: {
      Dashboard: 'dashboard',
      DayModule: 'day/:dayNumber',
    },
  },
};

const Stack = createNativeStackNavigator();

// Main app content (needs to be inside ProgressProvider and AccessProvider)
function AppContent() {
  const { showReEngagement } = useProgress();
  const { hasFullAccess } = useAccess();
  const [crisisVisible, setCrisisVisible] = React.useState(false);
  const [accessCodeVisible, setAccessCodeVisible] = React.useState(false);
  const [settingsVisible, setSettingsVisible] = React.useState(false);

  // Pulsing animation for distress button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.textPrimary,
            headerTitleStyle: { fontFamily: TYPOGRAPHY.ui, fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: COLORS.background },
          }}
        >
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              title: 'Tea With God',
              headerLargeTitle: true,
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => setSettingsVisible(true)}
                  style={styles.headerButton}
                >
                  <Feather name="settings" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
              ),
              headerRight: () => !hasFullAccess() ? (
                <TouchableOpacity
                  onPress={() => setAccessCodeVisible(true)}
                  style={styles.unlockButton}
                >
                  <Feather name="key" size={18} color={COLORS.gold} />
                  <Text style={styles.unlockText}>Unlock</Text>
                </TouchableOpacity>
              ) : null,
            }}
          />
          <Stack.Screen
            name="DayModule"
            component={DayModuleScreen}
            options={({ route }: any) => ({
              title: 'Day ' + route.params.dayNumber,
            })}
          />
          {/* Brain Games Hub */}
          <Stack.Screen
            name="BrainGamesHub"
            component={BrainGamesHub}
            options={{ title: 'Brain Games' }}
          />
          {/* Individual Brain Games */}
          <Stack.Screen
            name="BreatheWithGod"
            component={BreatheWithGod}
            options={{ title: 'Breathe with God', headerShown: false }}
          />
          <Stack.Screen
            name="GratitudeGarden"
            component={GratitudeGarden}
            options={{ title: 'Gratitude Garden', headerShown: false }}
          />
          <Stack.Screen
            name="ScripturePalace"
            component={ScripturePalace}
            options={{ title: 'Scripture Palace', headerShown: false }}
          />
          <Stack.Screen
            name="ThoughtDetective"
            component={ThoughtDetective}
            options={{ title: 'Thought Detective', headerShown: false }}
          />
          <Stack.Screen
            name="BodyScanRelease"
            component={BodyScanRelease}
            options={{ title: 'Body Scan Release', headerShown: false }}
          />
          <Stack.Screen
            name="PatternPeace"
            component={PatternPeace}
            options={{ title: 'Pattern Peace', headerShown: false }}
          />
        </Stack.Navigator>

        {/* Global Lifebuoy Button - Always Visible (PRD requirement) */}
        <Animated.View style={[styles.lifebuoyButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.lifebuoyButton}
            onPress={() => setCrisisVisible(true)}
            accessibilityLabel="Need support? Tap for help"
          >
            <Feather name="heart" size={22} color="#E57373" />
          </TouchableOpacity>
        </Animated.View>

        {/* Crisis Modal - Zero latency, offline resources */}
        <CrisisModal
          visible={crisisVisible}
          onClose={() => setCrisisVisible(false)}
        />

        {/* Access Code Modal - Unlock full content */}
        <AccessCodeModal
          visible={accessCodeVisible}
          onClose={() => setAccessCodeVisible(false)}
        />

        {/* Settings Modal */}
        <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          onOpenAccessCode={() => setAccessCodeVisible(true)}
        />

        {/* Re-engagement Modal - Gentle welcome back after 14 days */}
        <ReEngagementModal visible={showReEngagement} />

        <StatusBar style="light" />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthState();

    // Handle deep link auth callback
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('auth/callback') || url.includes('access_token')) {
        // Extract tokens from URL and set session
        try {
          const { data, error } = await supabase.auth.getSession();
          if (data.session) {
            await SecureStore.setItemAsync('authToken', data.session.access_token);
            await SecureStore.setItemAsync('userData', JSON.stringify(data.session.user));
            setUser(data.session.user);
            setIsAuthenticated(true);
          }
        } catch (e) {
          console.log('Deep link auth failed:', e);
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  async function checkAuthState() {
    try {
      // First check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await SecureStore.setItemAsync('authToken', session.access_token);
        await SecureStore.setItemAsync('userData', JSON.stringify(session.user));
        setUser(session.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Fallback to stored credentials
      const token = await SecureStore.getItemAsync('authToken');
      const userData = await SecureStore.getItemAsync('userData');
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.log('Auth check failed:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAuthSuccess(token: string, userData: any) {
    try {
      if (token !== 'guest') {
        await SecureStore.setItemAsync('authToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      }
      setUser(userData);
      setIsAuthenticated(true);
    } catch (e) {
      console.log('Failed to save auth:', e);
    }
  }

  async function handleLogout() {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      setIsAuthenticated(false);
      setUser(null);
    } catch (e) {
      console.log('Logout failed:', e);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>Preparing your sanctuary...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  // Authenticated - wrap with providers for sync, progress, access, notifications, journal, and world model
  return (
    <SafeAreaProvider>
      <SyncProvider>
        <NotificationProvider>
          <JournalProvider>
            <AccessProvider>
              <ProgressProvider>
                <WorldModelProvider userId={user?.userId || user?.email || 'guest'}>
                  <AppContent />
                </WorldModelProvider>
              </ProgressProvider>
            </AccessProvider>
          </JournalProvider>
        </NotificationProvider>
      </SyncProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  lifebuoyButtonContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
  },
  lifebuoyButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#E57373',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E57373',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  headerButton: {
    padding: 8,
    marginLeft: -8,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.goldLight + '40',
    borderRadius: 16,
  },
  unlockText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: 4,
  },
});
