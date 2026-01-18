/**
 * Tea With God - Main App
 * A 40-Day Healing Companion
 */

import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, StyleSheet, View, ActivityIndicator, Text, Animated, Platform, Image } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Initialize i18n
import './src/i18n';
import { LanguageProvider } from './src/context/LanguageContext';

// Platform-aware storage for web compatibility
const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};
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
import FlipbookScreen from './src/screens/FlipbookScreen';
import ReEngagementModal from './src/components/ReEngagementModal';
import AccessCodeModal from './src/components/AccessCodeModal';
import SettingsModal from './src/components/SettingsModal';
import { ProgressProvider, useProgress } from './src/context/ProgressContext';
import { AccessProvider, useAccess } from './src/context/AccessContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { JournalProvider } from './src/context/JournalContext';
import { SyncProvider } from './src/context/SyncContext';
import { WorldModelProvider } from './src/worldModel/WorldModelContext';
import { PinProvider, usePin } from './src/context/PinContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { ContentProvider } from './src/context/ContentContext';
import LockScreen from './src/screens/LockScreen';
import { COLORS, TYPOGRAPHY, SHADOWS } from './src/theme/colors';
import { supabase } from './src/services/supabase';

// Deep linking configuration
// Using /app as base path for all routes
const linking = {
  prefixes: [
    'https://teawithgod.com',
    'https://twg.cleva-ai.co.za',
    'http://localhost:8081',
    Linking.createURL('/'),
    'teawithgod://',
  ],
  config: {
    screens: {
      Dashboard: '/app/dashboard',
      DayModule: '/app/day/:dayNumber',
      BrainGamesHub: '/app/brain-games',
      BreatheWithGod: '/app/brain-games/breathe',
      GratitudeGarden: '/app/brain-games/gratitude',
      ScripturePalace: '/app/brain-games/scripture',
      ThoughtDetective: '/app/brain-games/thought',
      BodyScanRelease: '/app/brain-games/body-scan',
      PatternPeace: '/app/brain-games/pattern',
    },
  },
};

const Stack = createNativeStackNavigator();

// Main app content (needs to be inside ProgressProvider and AccessProvider)
interface AppContentProps {
  pendingDeepLink: string | null;
  onDeepLinkHandled: () => void;
}

function AppContent({ pendingDeepLink, onDeepLinkHandled }: AppContentProps) {
  const { t } = useTranslation();
  const { showReEngagement } = useProgress();
  const { hasFullAccess, getGuestCurrentDay, isLoading: accessLoading } = useAccess();
  const { isLocked, isLoading: pinLoading } = usePin();

  // Show lock screen if PIN is enabled and app is locked
  if (!pinLoading && isLocked) {
    return <LockScreen />;
  }
  const [crisisVisible, setCrisisVisible] = React.useState(false);
  const [accessCodeVisible, setAccessCodeVisible] = React.useState(false);
  const [urlAccessCode, setUrlAccessCode] = React.useState<string | null>(null);
  const { isSettingsVisible, openSettings, closeSettings } = useSettings();
  const navigationRef = useNavigationContainerRef();
  const [isNavigationReady, setIsNavigationReady] = React.useState(false);
  const hasNavigated = React.useRef(false);
  const hasCheckedUrlCode = React.useRef(false);

  // Check for ?code= URL parameter on web and auto-open modal
  React.useEffect(() => {
    if (Platform.OS === 'web' && !hasCheckedUrlCode.current && !accessLoading) {
      hasCheckedUrlCode.current = true;
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get('code');

      if (codeParam && !hasFullAccess()) {
        console.log('[AccessCode] Found code in URL:', codeParam);
        setUrlAccessCode(codeParam.toUpperCase());
        setAccessCodeVisible(true);
        // Clean up URL by removing the code parameter
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, [accessLoading, hasFullAccess]);

  // Handle deep link on web - navigate after NavigationContainer is ready AND access state is loaded
  useEffect(() => {
    // Wait for both navigation AND access state to be ready before handling deep links
    if (Platform.OS === 'web' && isNavigationReady && !accessLoading && navigationRef.current && !hasNavigated.current) {
      // Get path from prop (captured before login) or sessionStorage backup or current URL
      const path = pendingDeepLink || sessionStorage.getItem('pendingDeepLink') || window.location.pathname;
      console.log('[DeepLink] Navigating with path:', path);
      console.log('[DeepLink] Access state loaded - hasFullAccess:', hasFullAccess());

      // Small delay to ensure navigation is truly ready
      const timer = setTimeout(() => {
        // Match /app/day/:dayNumber
        const dayMatch = path.match(/\/app\/day\/(\d+)/);
        if (dayMatch) {
          const dayNumber = parseInt(dayMatch[1], 10);
          console.log('[DeepLink] Navigating to Day', dayNumber);

          // Check if coming from flipbook (user already has access if they can view flipbook)
          const urlParams = new URLSearchParams(window.location.search);
          const fromFlipbook = urlParams.get('src') === 'flipbook';

          // GUEST ACCESS CHECK: If user is GUEST and trying to access Day 2+, redirect to upgrade page
          // Skip this check if coming from flipbook (flipbook already requires access)
          if (!fromFlipbook && !hasFullAccess() && dayNumber > getGuestCurrentDay()) {
            console.log('[DeepLink] GUEST trying to access Day', dayNumber, '- redirecting to upgrade');
            hasNavigated.current = true;
            sessionStorage.removeItem('pendingDeepLink');
            onDeepLinkHandled();
            // Redirect to upgrade page with return URL
            window.location.href = `/upgrade.html?day=${dayNumber}&returnTo=${encodeURIComponent(path)}`;
            return;
          }

          hasNavigated.current = true;
          navigationRef.current?.reset({
            index: 1,
            routes: [
              { name: 'Dashboard' },
              { name: 'DayModule', params: { dayNumber } },
            ],
          });
          // Force correct URL (React Navigation generates wrong path)
          setTimeout(() => {
            window.history.replaceState(null, '', `/app/day/${dayNumber}`);
          }, 50);
          sessionStorage.removeItem('pendingDeepLink');
          onDeepLinkHandled();
          return;
        }

        // Match /app/brain-games routes
        if (path.includes('/app/brain-games/breathe')) {
          hasNavigated.current = true;
          navigationRef.current?.navigate('BreatheWithGod' as never);
        } else if (path.includes('/app/brain-games/gratitude')) {
          hasNavigated.current = true;
          navigationRef.current?.navigate('GratitudeGarden' as never);
        } else if (path.includes('/app/brain-games/scripture')) {
          hasNavigated.current = true;
          navigationRef.current?.navigate('ScripturePalace' as never);
        } else if (path.includes('/app/brain-games/thought')) {
          hasNavigated.current = true;
          navigationRef.current?.navigate('ThoughtDetective' as never);
        } else if (path.includes('/app/brain-games/body-scan')) {
          hasNavigated.current = true;
          navigationRef.current?.navigate('BodyScanRelease' as never);
        } else if (path.includes('/app/brain-games/pattern')) {
          hasNavigated.current = true;
          navigationRef.current?.navigate('PatternPeace' as never);
        } else if (path.includes('/app/brain-games')) {
          hasNavigated.current = true;
          navigationRef.current?.navigate('BrainGamesHub' as never);
        }

        if (hasNavigated.current) {
          sessionStorage.removeItem('pendingDeepLink');
          onDeepLinkHandled();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isNavigationReady, pendingDeepLink, accessLoading]);

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
      <NavigationContainer ref={navigationRef} linking={linking} onReady={() => setIsNavigationReady(true)}>
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
              title: t('app.name'),
              headerLargeTitle: true,
              headerLeft: () => (
                <TouchableOpacity
                  onPress={openSettings}
                  style={styles.headerButton}
                >
                  <Image
                    source={require('./assets/teacup.png')}
                    style={{ width: 28, height: 28 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ),
              headerTitleStyle: {
                fontFamily: TYPOGRAPHY.ui,
                fontWeight: '600',
                fontSize: 17,
              },
              headerRight: () => !hasFullAccess() ? (
                <TouchableOpacity
                  onPress={() => setAccessCodeVisible(true)}
                  style={styles.unlockButton}
                >
                  <Feather name="key" size={18} color={COLORS.gold} />
                  <Text style={styles.unlockText}>{t('settings.unlock')}</Text>
                </TouchableOpacity>
              ) : null,
            }}
          />
          <Stack.Screen
            name="DayModule"
            component={DayModuleScreen}
            options={({ route }: any) => ({
              title: 'Day ' + route.params.dayNumber,
              headerRight: () => (
                <TouchableOpacity
                  onPress={openSettings}
                  style={{ padding: 8, marginRight: 4 }}
                >
                  <Feather name="settings" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ),
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
          {/* Digital Book Flipbook */}
          <Stack.Screen
            name="Flipbook"
            component={FlipbookScreen}
            options={{ title: 'Digital Book', headerShown: false }}
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
          onClose={() => {
            setAccessCodeVisible(false);
            setUrlAccessCode(null); // Clear URL code after modal closes
          }}
          initialCode={urlAccessCode || undefined}
        />

        {/* Settings Modal */}
        <SettingsModal
          visible={isSettingsVisible}
          onClose={closeSettings}
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
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null);

  // Capture deep link URL on initial load (before auth)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const path = window.location.pathname;
      console.log('[DeepLink] Initial path captured:', path);
      if (path && path !== '/app' && path !== '/app/') {
        setPendingDeepLink(path);
        // Also store in sessionStorage as backup
        sessionStorage.setItem('pendingDeepLink', path);
      }
    }
  }, []);

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
            await Storage.setItem('authToken', data.session.access_token);
            await Storage.setItem('userData', JSON.stringify(data.session.user));
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
        await Storage.setItem('authToken', session.access_token);
        await Storage.setItem('userData', JSON.stringify(session.user));
        setUser(session.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Fallback to stored credentials
      const token = await Storage.getItem('authToken');
      const userData = await Storage.getItem('userData');
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
      // Save all auth tokens including guest
      await Storage.setItem('authToken', token);
      await Storage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } catch (e) {
      console.log('Failed to save auth:', e);
    }
  }

  async function handleLogout() {
    try {
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('userData');
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

  // Authenticated - wrap with providers for sync, progress, access, notifications, journal, world model, PIN, settings, content, and language
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ContentProvider>
          <PinProvider>
          <SettingsProvider>
            <SyncProvider>
              <NotificationProvider>
                <JournalProvider userId={user?.id || user?.email || 'guest'}>
                  <AccessProvider userId={user?.id || user?.email || 'guest'}>
                    <ProgressProvider userId={user?.id || user?.email || 'guest'}>
                      <WorldModelProvider userId={user?.userId || user?.email || 'guest'}>
                        <AppContent pendingDeepLink={pendingDeepLink} onDeepLinkHandled={() => setPendingDeepLink(null)} />
                      </WorldModelProvider>
                    </ProgressProvider>
                  </AccessProvider>
                </JournalProvider>
              </NotificationProvider>
            </SyncProvider>
          </SettingsProvider>
        </PinProvider>
        </ContentProvider>
      </LanguageProvider>
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
    padding: 4,
    marginLeft: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    height: 36,
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
