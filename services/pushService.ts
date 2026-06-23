import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { registerDevice } from '@/services/api/devices';
import { formatReminderMessage as _formatReminderMessage } from '@/services/notificationHelpers';

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'gasp' | 'message' | 'reaction' | 'reminder';

export interface DeepLinkPayload {
  type: NotificationType;
  gaspId?: string;
  conversationId?: string;
  reactionId?: string;
}

export interface PushNotificationData {
  type: NotificationType;
  gaspId?: string;
  conversationId?: string;
  reactionId?: string;
  senderName?: string;
}

// ── Module-level setup ───────────────────────────────────────────────────────

// Suppress foreground native banners — satisfies Requirement 5.5
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
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
  switch (payload.type) {
    case 'gasp':
      if (!payload.gaspId) {
        Sentry.captureMessage('resolveDeepLink: missing gaspId for type "gasp"', {
          level: 'warning',
          extra: { payload },
        });
        return FALLBACK_ROUTE;
      }
      return '/(modals)/gasp-viewer?gaspId=' + payload.gaspId;

    case 'message':
      if (!payload.conversationId) {
        Sentry.captureMessage('resolveDeepLink: missing conversationId for type "message"', {
          level: 'warning',
          extra: { payload },
        });
        return FALLBACK_ROUTE;
      }
      return '/chat/' + payload.conversationId;

    case 'reaction':
      if (!payload.reactionId) {
        Sentry.captureMessage('resolveDeepLink: missing reactionId for type "reaction"', {
          level: 'warning',
          extra: { payload },
        });
        return FALLBACK_ROUTE;
      }
      return '/(modals)/reaction-viewer?reactionId=' + payload.reactionId;

    case 'reminder':
      if (!payload.gaspId) {
        Sentry.captureMessage('resolveDeepLink: missing gaspId for type "reminder"', {
          level: 'warning',
          extra: { payload },
        });
        return FALLBACK_ROUTE;
      }
      return '/(modals)/gasp-viewer?gaspId=' + payload.gaspId;

    default:
      Sentry.captureMessage('resolveDeepLink: unknown notification type', {
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

  // If not granted, request permission
  if (status !== 'granted') {
    const response = await Notifications.requestPermissionsAsync();
    status = response.status;
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
  } catch (error) {
    // 6. Token fetch failure: log and return silently
    Sentry.captureException(error, {
      extra: { context: 'pushService.registerIfNeeded.getDevicePushToken' },
    });
    return;
  }

  // 4. Compare with stored token — only register if changed or absent (Requirements 5.2, 5.7)
  const storedToken = await SecureStore.getItemAsync('fcm_token');

  if (storedToken !== token) {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    try {
      await registerDevice(token, platform);
    } catch (error) {
      // 7. registerDevice failure: log and clear cached token to force retry on next launch
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
