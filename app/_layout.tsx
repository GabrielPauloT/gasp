import "@/global.css";
import "@/lib/i18n";
import "react-native-reanimated";

if (__DEV__) {
  require("../reactotron.config");
}

import { ToastBanner } from "@/components/notifications/ToastBanner";
import { ConnectionBanner } from "@/components/ui/ConnectionBanner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAutoDownload } from "@/hooks/useAutoDownload";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSocketListeners } from "@/hooks/useSocketListeners";
import { queryClient } from "@/lib/queryClient";
import { initCache } from "@/services/mediaCache";
import { processQueue } from "@/services/uploadQueue";
import { useAuthStore } from "@/stores/authStore";
import { useMediaCacheStore } from "@/stores/mediaCacheStore";
import * as Sentry from "@sentry/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Suppress warnings from third-party dependencies we don't control
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
  enabled: true, //!__DEV__,
  tracesSampleRate: 0.2,
  attachScreenshot: true,
  enableAutoSessionTracking: true,
  // Propagate `sentry-trace` and `baggage` headers on outgoing requests so
  // client errors and backend errors land in the same trace in Sentry.
  // The backend (@sentry/node) picks up these headers automatically.
  integrations: [
    Sentry.reactNativeTracingIntegration({
      tracePropagationTargets: [
        "gasp-backend-production.up.railway.app",
        /^https:\/\/gasp-backend-production\.up\.railway\.app/,
        "localhost",
      ],
    }),
  ],
});

// Keep splash screen visible while we initialize auth
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

/**
 * Inner component that uses hooks requiring QueryClientProvider context.
 * Separated from RootLayout because hooks run BEFORE the return's JSX providers.
 */
function RootContent() {
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
    processQueue();
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <ToastBanner />
      <ConnectionBanner />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "#0A0A0F" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(modals)"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

/**
 * Root layout — providers only. Hooks that need QueryClient live in RootContent.
 */
export default function RootLayout() {
  return (
    <ErrorBoundary onGoHome={() => router.replace("/(tabs)/camera")}>
      <QueryClientProvider client={queryClient}>
        <RootContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
