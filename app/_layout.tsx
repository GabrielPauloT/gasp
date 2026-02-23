import 'react-native-reanimated';
import '@/global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/authStore';
import { useSocketListeners } from '@/hooks/useSocketListeners';

// Keep splash screen visible while we initialize auth
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  // Register all Socket.IO listeners for real-time updates
  useSocketListeners();

  useEffect(() => {
    initializeAuth().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [initializeAuth]);

  // Don't render routes until auth state is known
  if (!isInitialized) return null;

  return (
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
          name="+not-found"
          options={{ headerShown: false }}
        />
      </Stack>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
