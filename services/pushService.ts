import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { registerDevice } from '@/services/api/devices';
import { formatReminderMessage as _formatReminderMessage } from '@/services/notificationHelpers';

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'message.new'
  | 'gasp.received'
  | 'gasp.reaction_received'
  | 'friend.request'
  | 'friend.accepted';

type LegacyNotificationType = 'gasp' | 'message' | 'reaction' | 'reminder';

export interface DeepLinkPayload {
  kind?: NotificationType;
  type?: NotificationType | LegacyNotificationType;
  gaspId?: string;
  conversationId?: string;
  reactionId?: string;
}

export interface PushNotificationData {
  kind?: NotificationType;
  type?: NotificationType | LegacyNotificationType;
  route?: string;
  gaspId?: string;
  conversationId?: string;
  reactionId?: string;
  senderName?: string;
}

// ── Module-level setup ───────────────────────────────────────────────────────

// Show native banners only when app is in background/inactive — in foreground
// the ToastBanner component handles notifications instead (Requirement 5.5)
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const appState = require('react-native').AppState.currentState;
    const isBackground = appState === 'background' || appState === 'inactive';
    return {
      shouldShowAlert: isBackground,
      shouldPlaySound: isBackground,
      shouldSetBadge: true,
      shouldShowBanner: isBackground,
      shouldShowList: isBackground,
    };
  },
});

// Handle notification taps — satisfies Requirement 5.4
Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data as unknown as PushNotificationData;
  const route = resolveDeepLink(data);
  router.push(route as any);
});

// ── Deep Link Resolver ────────────────────────────────────────────────────────

const FALLBACK_ROUTE = '/(tabs)/inbox';

/**
 * Resolves a push notification payload to an in-app route.
 * Pure function — no side effects beyond Sentry logging on fallback.
 *
 * Satisfies Requirements 5.4, 7.6
 */
export function resolveDeepLink(payload: DeepLinkPayload): string {
  const kind = payload.kind ?? payload.type;

  switch (kind) {
    case 'gasp.received':
      if (!payload.gaspId) {
        Sentry.captureMessage('resolveDeepLink: missing gaspId for kind "gasp.received"', {
          level: 'warning',
          extra: { payload },
        });
        return FALLBACK_ROUTE;
      }
      return '/(modals)/view-gasp?gaspId=' + payload.gaspId;

    case 'message.new':
      if (!payload.conversationId) {
        Sentry.captureMessage('resolveDeepLink: missing conversationId for kind "message.new"', {
          level: 'warning',
          extra: { payload },
        });
        return FALLBACK_ROUTE;
      }
      return '/chat/' + payload.conversationId;

    case 'gasp.reaction_received':
      if (!payload.gaspId) {
        Sentry.captureMessage('resolveDeepLink: missing gaspId for kind "gasp.reaction_received"', {
          level: 'warning',
          extra: { payload },
        });
        return FALLBACK_ROUTE;
      }
      return '/(modals)/reaction-result?gaspId=' + payload.gaspId;

    case 'friend.request':
      return '/(tabs)/discover';

    case 'friend.accepted':
      return '/(tabs)/chat';

    // Backward compatibility for old push payloads that may still be delivered.
    case 'gasp':
      if (!payload.gaspId) {
        Sentry.captureMessage('resolveDeepLink: missing gaspId for legacy type "gasp"', {
          level: 'warning',
          extra: { payload },
        });
        return FALLBACK_ROUTE;
      }
      return '/(modals)/view-gasp?gaspId=' + payload.gaspId;

    case 'message':
      if (!payload.conversationId) return FALLBACK_ROUTE;
      return '/chat/' + payload.conversationId;

    case 'reaction':
      if (payload.gaspId) return '/(modals)/reaction-result?gaspId=' + payload.gaspId;
      if (payload.reactionId) return '/(modals)/reaction-result?reactionId=' + payload.reactionId;
      return FALLBACK_ROUTE;

    case 'reminder':
      if (!payload.gaspId) return FALLBACK_ROUTE;
      return '/(modals)/view-gasp?gaspId=' + payload.gaspId;

    default:
      Sentry.captureMessage('resolveDeepLink: unknown notification kind', {
        level: 'warning',
        extra: { payload },
      });
      return FALLBACK_ROUTE;
  }
}

// ── Exported Functions ───────────────────────────────────────────────────────

/** Returns true if push notification permission is currently granted. */
export async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Requests push permission (if needed), obtains the FCM device token,
 * and registers it with the backend when new or changed.
 *
 * Satisfies Requirements 5.2, 5.3, 5.7
 */
export async function registerIfNeeded(): Promise<void> {
  // 1. Check current permission status
  let { status } = await Notifications.getPermissionsAsync();
  if (__DEV__) console.tronLog?.log('[PushService] permission status:', status);

  // If not granted, request permission
  if (status !== 'granted') {
    const response = await Notifications.requestPermissionsAsync();
    status = response.status;
    if (__DEV__) console.tronLog?.log('[PushService] permission after request:', status);
  }

  // 2. If still not granted: log denial and persist flag — no retry (Requirement 5.3)
  if (status !== 'granted') {
    Sentry.captureMessage('Push notification permission denied', {
      level: 'info',
      extra: { context: 'pushService.registerIfNeeded' },
    });
    console.warn('[PushService] Notification permission denied');
    await SecureStore.setItemAsync('pushPermissionDenied', 'true');
    return;
  }

  // 3. Obtain FCM token
  let token: string;
  try {
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    token = tokenResponse.data;
    if (__DEV__) console.tronLog?.log('[PushService] FCM token obtained:', token.slice(0, 20) + '...');
  } catch (error) {
    // 6. Token fetch failure: log and return silently
    // 'status' is already in scope (~line 126) from the permission check above.
    // Avoids an extra async call inside catch that could itself throw and break silencing.
    if (__DEV__) console.tronLog?.error('[PushService] getDevicePushTokenAsync failed:', error);
    Sentry.captureException(error, {
      extra: {
        context: 'pushService.registerIfNeeded.getDevicePushToken',
        permissionStatus: status,
      },
    });
    return;
  }

  // 4. Compare with stored token — only register if changed or absent (Requirements 5.2, 5.7)
  const storedToken = await SecureStore.getItemAsync('fcm_token');
  if (__DEV__) console.tronLog?.log('[PushService] stored token match:', storedToken === token);

  if (storedToken !== token) {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    if (__DEV__) console.tronLog?.log('[PushService] registering device with backend...', { platform });

    try {
      await registerDevice(token, platform);
      if (__DEV__) console.tronLog?.log('[PushService] device registered successfully ✅');
    } catch (error) {
      // 7. registerDevice failure: log and clear cached token to force retry on next launch
      if (__DEV__) console.tronLog?.error('[PushService] registerDevice failed:', error);
      Sentry.captureException(error, {
        extra: { context: 'pushService.registerIfNeeded.registerDevice' },
      });
      await SecureStore.deleteItemAsync('fcm_token');
      return;
    }

    // 5. Persist new token
    await SecureStore.setItemAsync('fcm_token', token);
  }
}

/** Formats a reminder nudge message — delegates to notificationHelpers. */
export function formatReminderMessage(senderName: string): string {
  return _formatReminderMessage(senderName);
}
