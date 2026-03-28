import 'react-native-reanimated';
import '@/global.css';

if (__DEV__) {
  require('../reactotron.config');
}

import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack, router } from 'expo-router';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Suppress warnings from third-party dependencies we don't control
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/authStore';
import { useSocketListeners } from '@/hooks/useSocketListeners';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAutoDownload } from '@/hooks/useAutoDownload';
import { initCache } from '@/services/mediaCache';
import { useMediaCacheStore } from '@/stores/mediaCacheStore';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  attachScreenshot: true,
  enableAutoSessionTracking: true,
});

// Keep splash screen visible while we initialize auth
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const user = useAuthStore((s) => s.user);

  // Register all Socket.IO listeners for real-time updates
  useSocketListeners();

  // Fetch friends & pending gasps on auth
  useOnlineStatus();

  // Auto-download gasps based on preferences + network
  useAutoDownload();

  useEffect(() => {
    // Initialize media cache + preferences in parallel with auth
    initCache();
    useMediaCacheStore.getState().loadPreferences();

    initializeAuth().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [initializeAuth]);

  useEffect(() => {
    if (user) {
      Sentry.setUser({ id: user.id, username: user.username });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  // Don't render routes until auth state is known
  if (!isInitialized) return null;

  return (
    <ErrorBoundary onGoHome={() => router.replace('/(tabs)/camera')}>
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#0A0A0F' },
          animation: 'fade',
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(modals)"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="+not-found"
          options={{ headerShown: false }}
        />
      </Stack>
      <StatusBar style="light" />
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
