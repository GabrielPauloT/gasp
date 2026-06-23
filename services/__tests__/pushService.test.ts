import fc from 'fast-check';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@/services/api/devices', () => ({
  registerDevice: jest.fn(() => Promise.resolve()),
}));

// Import after mocks are declared (jest.mock is hoisted anyway)
import { registerDevice } from '@/services/api/devices';
import type { DeepLinkPayload, PushNotificationData } from '@/services/pushService';
import { registerIfNeeded, resolveDeepLink } from '@/services/pushService';
import * as Notifications from 'expo-notifications';

const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockedRegisterDevice = registerDevice as jest.Mock;

// SecureStore is already mocked in jest.setup.js
const SecureStore = require('expo-secure-store') as {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Expected path prefixes for each notification type.
 */
const expectedPrefixes: Record<string, string> = {
  gasp: '/(modals)/gasp-viewer?gaspId=',
  message: '/chat/',
  reaction: '/(modals)/reaction-viewer?reactionId=',
  reminder: '/(modals)/gasp-viewer?gaspId=',
};

/**
 * Returns the ID field name required for each notification type.
 */
function idFieldForType(type: string): keyof DeepLinkPayload {
  switch (type) {
    case 'gasp':
    case 'reminder':
      return 'gaspId';
    case 'message':
      return 'conversationId';
    case 'reaction':
      return 'reactionId';
    default:
      return 'gaspId';
  }
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  SecureStore.getItemAsync.mockReset();
  SecureStore.setItemAsync.mockReset();
  SecureStore.deleteItemAsync.mockReset();
});

// ── Property-Based Tests ─────────────────────────────────────────────────────

describe('Property-Based Tests', () => {
  // Feature: gasp-notifications, Property 7: Deep link resolution is total and correct
  it('Property 7: resolveDeepLink returns a non-empty string starting with the expected path prefix and containing the relevant ID', () => {
    const notificationTypeArb = fc.constantFrom(
      'gasp' as const,
      'message' as const,
      'reaction' as const,
      'reminder' as const
    );

    const idArb = fc.string({ minLength: 1, maxLength: 64 }).filter(
      (s) => !s.includes('?') && !s.includes('&') && !s.includes('/')
    );

    fc.assert(
      fc.property(notificationTypeArb, idArb, (type, id) => {
        const payload: PushNotificationData = { type };

        // Set the required ID field based on type
        const field = idFieldForType(type);
        (payload as any)[field] = id;

        const result = resolveDeepLink(payload as DeepLinkPayload);

        // Result is a non-empty string
        expect(result.length).toBeGreaterThan(0);

        // Result starts with the expected prefix
        const prefix = expectedPrefixes[type];
        expect(result.startsWith(prefix)).toBe(true);

        // Result contains the relevant ID
        expect(result).toContain(id);
      })
    );
  });

  // Feature: gasp-notifications, Property 8: FCM token registration calls API with correct token
  it('Property 8: registerIfNeeded calls registerDevice exactly once with the exact token value when no stored token exists', async () => {
    const tokenArb = fc.string({ minLength: 1, maxLength: 200 }).filter(
      (s) => s.trim().length > 0
    );

    await fc.assert(
      fc.asyncProperty(tokenArb, async (token) => {
        // Reset mocks for each property run
        mockedRegisterDevice.mockClear();
        mockedRegisterDevice.mockResolvedValue(undefined);
        SecureStore.getItemAsync.mockResolvedValue(null); // no stored token
        SecureStore.setItemAsync.mockResolvedValue(undefined);

        mockedNotifications.getPermissionsAsync.mockResolvedValue({
          status: 'granted',
          expires: 'never',
          granted: true,
          canAskAgain: true,
        } as any);
        mockedNotifications.getDevicePushTokenAsync.mockResolvedValue({
          data: token,
          type: 'android',
        } as any);

        await registerIfNeeded();

        // registerDevice should be called exactly once with the exact token
        expect(mockedRegisterDevice).toHaveBeenCalledTimes(1);
        expect(mockedRegisterDevice).toHaveBeenCalledWith(token, expect.any(String));
      })
    );
  });
});

// ── Unit Tests ───────────────────────────────────────────────────────────────

describe('resolveDeepLink', () => {
  it('returns gasp viewer route for type "gasp" with gaspId', () => {
    const result = resolveDeepLink({ type: 'gasp', gaspId: 'abc-123' });
    expect(result).toBe('/(modals)/gasp-viewer?gaspId=abc-123');
  });

  it('returns chat route for type "message" with conversationId', () => {
    const result = resolveDeepLink({ type: 'message', conversationId: 'conv-456' });
    expect(result).toBe('/chat/conv-456');
  });

  it('returns reaction viewer route for type "reaction" with reactionId', () => {
    const result = resolveDeepLink({ type: 'reaction', reactionId: 'react-789' });
    expect(result).toBe('/(modals)/reaction-viewer?reactionId=react-789');
  });

  it('returns gasp viewer route for type "reminder" with gaspId', () => {
    const result = resolveDeepLink({ type: 'reminder', gaspId: 'gasp-reminder-1' });
    expect(result).toBe('/(modals)/gasp-viewer?gaspId=gasp-reminder-1');
  });

  it('returns fallback /(tabs)/inbox for unknown type', () => {
    const result = resolveDeepLink({ type: 'unknown' as any });
    expect(result).toBe('/(tabs)/inbox');
  });

  it('returns fallback when required ID is missing for gasp type', () => {
    const result = resolveDeepLink({ type: 'gasp' });
    expect(result).toBe('/(tabs)/inbox');
  });
});

describe('registerIfNeeded', () => {
  beforeEach(() => {
    mockedRegisterDevice.mockClear();
    mockedRegisterDevice.mockResolvedValue(undefined);
  });

  it('does not call registerDevice when permission is denied (req 5.3)', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'denied',
      expires: 'never',
      granted: false,
      canAskAgain: true,
    } as any);
    mockedNotifications.requestPermissionsAsync.mockResolvedValue({
      status: 'denied',
      expires: 'never',
      granted: false,
      canAskAgain: false,
    } as any);

    await registerIfNeeded();

    expect(mockedRegisterDevice).not.toHaveBeenCalled();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('pushPermissionDenied', 'true');
  });

  it('skips registerDevice when stored token is unchanged (req 5.7)', async () => {
    const existingToken = 'existing-token-xyz';

    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: true,
    } as any);
    mockedNotifications.getDevicePushTokenAsync.mockResolvedValue({
      data: existingToken,
      type: 'android',
    } as any);
    SecureStore.getItemAsync.mockResolvedValue(existingToken);

    await registerIfNeeded();

    expect(mockedRegisterDevice).not.toHaveBeenCalled();
  });

  it('calls registerDevice when token changes (req 5.7)', async () => {
    const oldToken = 'old-token-aaa';
    const newToken = 'new-token-bbb';

    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: true,
    } as any);
    mockedNotifications.getDevicePushTokenAsync.mockResolvedValue({
      data: newToken,
      type: 'android',
    } as any);
    SecureStore.getItemAsync.mockResolvedValue(oldToken);

    await registerIfNeeded();

    expect(mockedRegisterDevice).toHaveBeenCalledTimes(1);
    expect(mockedRegisterDevice).toHaveBeenCalledWith(newToken, expect.any(String));
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('fcm_token', newToken);
  });

  it('foreground suppression is configured at module load (req 5.5)', () => {
    // setNotificationHandler is called at module load time.
    // Since beforeEach clears mocks, we verify with a fresh module require.
    jest.resetModules();

    jest.doMock('expo-notifications', () => ({
      getPermissionsAsync: jest.fn(),
      requestPermissionsAsync: jest.fn(),
      getDevicePushTokenAsync: jest.fn(),
      setNotificationHandler: jest.fn(),
      addNotificationResponseReceivedListener: jest.fn(),
    }));
    jest.doMock('expo-router', () => ({ router: { push: jest.fn() } }));
    jest.doMock('@/services/api/devices', () => ({
      registerDevice: jest.fn(() => Promise.resolve()),
    }));
    jest.doMock('@/services/notificationHelpers', () => ({
      formatReminderMessage: jest.fn((name: string) => `${name} is waiting for your reaction`),
    }));

    const freshNotifications = require('expo-notifications');
    require('@/services/pushService');

    expect(freshNotifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(freshNotifications.setNotificationHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        handleNotification: expect.any(Function),
      })
    );
  });
});
