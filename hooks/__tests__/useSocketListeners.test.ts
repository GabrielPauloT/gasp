/**
 * useSocketListeners Tests
 *
 * Verifies that socket event handlers correctly update the React Query cache
 * and trigger notification store actions for gasp events.
 */

import { useSocketListeners } from '@/hooks/useSocketListeners';
import type { Gasp } from '@/services/api/schemas/gasp.schema';
import { queryKeys } from '@/services/queryKeys';
import { renderHook } from '@testing-library/react-native';

// ── Capture maps for socket event handlers ─────────────────────────────────────

type Handler = (data: any) => void;
const capturedHandlers: Record<string, Handler> = {};

// ── Mock @/services/socket ──────────────────────────────────────────────────────

jest.mock('@/services/socket', () => ({
  getSocket: jest.fn(() => ({ connected: true })),
  onGaspReceived: jest.fn((handler: Handler) => {
    capturedHandlers['gasp:received'] = handler;
    return () => { delete capturedHandlers['gasp:received']; };
  }),
  onGaspViewed: jest.fn((handler: Handler) => {
    capturedHandlers['gasp:viewed'] = handler;
    return () => { delete capturedHandlers['gasp:viewed']; };
  }),
  onGaspReactionReceived: jest.fn((handler: Handler) => {
    capturedHandlers['gasp:reaction_received'] = handler;
    return () => { delete capturedHandlers['gasp:reaction_received']; };
  }),
  onGaspExpired: jest.fn((handler: Handler) => {
    capturedHandlers['gasp:expired'] = handler;
    return () => { delete capturedHandlers['gasp:expired']; };
  }),
  onGaspStatusUpdated: jest.fn((handler: Handler) => {
    capturedHandlers['gasp:status_updated'] = handler;
    return () => { delete capturedHandlers['gasp:status_updated']; };
  }),
  onPresenceBulkStatus: jest.fn((handler: Handler) => {
    capturedHandlers['presence:bulk_status'] = handler;
    return () => {};
  }),
  onPresenceUserOnline: jest.fn((handler: Handler) => {
    capturedHandlers['presence:user_online'] = handler;
    return () => {};
  }),
  onPresenceUserOffline: jest.fn((handler: Handler) => {
    capturedHandlers['presence:user_offline'] = handler;
    return () => {};
  }),
  onChatNewMessage: jest.fn((handler: Handler) => {
    capturedHandlers['chat:new_message'] = handler;
    return () => {};
  }),
  onChatTyping: jest.fn((handler: Handler) => {
    capturedHandlers['chat:typing'] = handler;
    return () => {};
  }),
  onChatMessageRead: jest.fn((handler: Handler) => {
    capturedHandlers['chat:message_read'] = handler;
    return () => {};
  }),
  onChatConversationUpdated: jest.fn((handler: Handler) => {
    capturedHandlers['chat:conversation_updated'] = handler;
    return () => {};
  }),
}));

// ── Mock @/lib/queryClient ──────────────────────────────────────────────────────

const queryCache: Record<string, any> = {};

const mockSetQueryData = jest.fn((key: readonly string[], updater: any) => {
  const keyStr = JSON.stringify(key);
  const current = queryCache[keyStr];
  const newValue = typeof updater === 'function' ? updater(current) : updater;
  queryCache[keyStr] = newValue;
  return newValue;
});

const mockGetQueryData = jest.fn((key: readonly string[]) => {
  return queryCache[JSON.stringify(key)];
});

jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    setQueryData: (key: any, updater: any) => mockSetQueryData(key, updater),
    getQueryData: (key: any) => mockGetQueryData(key),
  },
}));

// ── Mock @/hooks/queries/useChat ─────────────────────────────────────────────────

jest.mock('@/hooks/queries/useChat', () => ({
  addMessageToCache: jest.fn(),
}));

// ── Mock @/stores/authStore ──────────────────────────────────────────────────────

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: any) => any) =>
    selector({ isAuthenticated: true, user: { id: 'user-123' } }),
}));

// ── Mock @/stores/chatStore ──────────────────────────────────────────────────────

jest.mock('@/stores/chatStore', () => ({
  useChatStore: {
    getState: jest.fn(() => ({
      activeConversationId: null,
      setTypingUser: jest.fn(),
    })),
  },
}));

// ── Mock @/stores/gaspStore ──────────────────────────────────────────────────────

jest.mock('@/stores/gaspStore', () => ({
  useGaspStore: {
    getState: jest.fn(() => ({
      markGaspViewed: jest.fn(),
      addReaction: jest.fn(),
    })),
  },
}));

// ── Mock @/stores/inboxStore ─────────────────────────────────────────────────────

jest.mock('@/stores/inboxStore', () => ({
  useInboxStore: {
    getState: jest.fn(() => ({
      setBulkOnlineStatus: jest.fn(),
      setFriendOnlineStatus: jest.fn(),
    })),
  },
}));

// ── Mock @/stores/notificationStore ──────────────────────────────────────────────

const mockEnqueueToast = jest.fn();
const mockTriggerTabPulse = jest.fn();

jest.mock('@/stores/notificationStore', () => ({
  useNotificationStore: {
    getState: jest.fn(() => ({
      enqueueToast: mockEnqueueToast,
      triggerTabPulse: mockTriggerTabPulse,
    })),
  },
}));

// ── Test helpers ─────────────────────────────────────────────────────────────────

function makeGasp(overrides: Partial<Gasp> = {}): Gasp {
  return {
    id: 'gasp-1',
    senderId: 'sender-1',
    senderName: 'Alice',
    senderAvatarUrl: 'https://example.com/avatar.jpg',
    imageUri: 'https://example.com/gasp.jpg',
    mediaType: 'image',
    blurhash: 'LKO2?U%2Tw=w',
    replayable: false,
    status: 'pending',
    deliveryStatus: 'sent',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    ...overrides,
  };
}

// ── Setup/Teardown ───────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Clear captured handlers
  Object.keys(capturedHandlers).forEach((key) => delete capturedHandlers[key]);
  // Clear query cache
  Object.keys(queryCache).forEach((key) => delete queryCache[key]);
});

// ── Tests ────────────────────────────────────────────────────────────────────────

describe('useSocketListeners', () => {
  describe('gasp:received event', () => {
    it('calls enqueueToast on the notification store with correct gaspId, senderName, imageUri', () => {
      renderHook(() => useSocketListeners());

      const gasp = makeGasp({
        id: 'gasp-abc',
        senderName: 'Bob',
        imageUri: 'https://cdn.example.com/image.jpg',
        blurhash: 'L6Pj0^i_.AyE_3t7t7R*',
      });

      capturedHandlers['gasp:received']({ gasp });

      expect(mockEnqueueToast).toHaveBeenCalledTimes(1);
      expect(mockEnqueueToast).toHaveBeenCalledWith({
        id: 'gasp-abc',
        gaspId: 'gasp-abc',
        senderName: 'Bob',
        imageUri: 'https://cdn.example.com/image.jpg',
        blurhash: 'L6Pj0^i_.AyE_3t7t7R*',
      });
    });

    it('calls triggerTabPulse on the notification store', () => {
      renderHook(() => useSocketListeners());

      const gasp = makeGasp();

      capturedHandlers['gasp:received']({ gasp });

      expect(mockTriggerTabPulse).toHaveBeenCalledTimes(1);
    });
  });

  describe('gasp:status_updated event', () => {
    it('updates deliveryStatus on the matching entry in the sent gasps cache', () => {
      const sentGasps: Gasp[] = [
        makeGasp({ id: 'gasp-1', deliveryStatus: 'sent' }),
        makeGasp({ id: 'gasp-2', deliveryStatus: 'sent' }),
        makeGasp({ id: 'gasp-3', deliveryStatus: 'delivered' }),
      ];
      queryCache[JSON.stringify(queryKeys.gasps.sent)] = sentGasps;

      renderHook(() => useSocketListeners());

      capturedHandlers['gasp:status_updated']({
        gaspId: 'gasp-2',
        deliveryStatus: 'opened',
      });

      const updatedCache = queryCache[JSON.stringify(queryKeys.gasps.sent)] as Gasp[];
      expect(updatedCache).toHaveLength(3);
      expect(updatedCache[0].deliveryStatus).toBe('sent');
      expect(updatedCache[1].deliveryStatus).toBe('opened');
      expect(updatedCache[2].deliveryStatus).toBe('delivered');
    });

    it('with an unknown gaspId leaves the cache unchanged', () => {
      const sentGasps: Gasp[] = [
        makeGasp({ id: 'gasp-1', deliveryStatus: 'sent' }),
        makeGasp({ id: 'gasp-2', deliveryStatus: 'delivered' }),
      ];
      queryCache[JSON.stringify(queryKeys.gasps.sent)] = sentGasps;

      renderHook(() => useSocketListeners());

      capturedHandlers['gasp:status_updated']({
        gaspId: 'gasp-unknown-999',
        deliveryStatus: 'opened',
      });

      const updatedCache = queryCache[JSON.stringify(queryKeys.gasps.sent)] as Gasp[];
      expect(updatedCache).toHaveLength(2);
      expect(updatedCache[0].deliveryStatus).toBe('sent');
      expect(updatedCache[1].deliveryStatus).toBe('delivered');
    });
  });

  describe('gasp:expired event', () => {
    it('removes the correct item from the pending gasps cache (regression guard)', () => {
      const pendingGasps: Gasp[] = [
        makeGasp({ id: 'gasp-a' }),
        makeGasp({ id: 'gasp-b' }),
        makeGasp({ id: 'gasp-c' }),
      ];
      queryCache[JSON.stringify(queryKeys.gasps.pending)] = pendingGasps;

      renderHook(() => useSocketListeners());

      capturedHandlers['gasp:expired']({ gaspId: 'gasp-b' });

      const updatedCache = queryCache[JSON.stringify(queryKeys.gasps.pending)] as Gasp[];
      expect(updatedCache).toHaveLength(2);
      expect(updatedCache.map((g) => g.id)).toEqual(['gasp-a', 'gasp-c']);
    });
  });
});
