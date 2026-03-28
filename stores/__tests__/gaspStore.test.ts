import { useGaspStore } from '@/stores/gaspStore';
import type { Gasp } from '@/types/gasp';

// ── Mock API modules ──────────────────────────────────────────────────────────
jest.mock('@/services/api/gasps', () => ({
  getPendingGasps: jest.fn(),
  getSentGasps: jest.fn(),
  sendBatchGasp: jest.fn(),
  markViewed: jest.fn(),
}));

jest.mock('@/services/api/reactions', () => ({
  createReaction: jest.fn(),
  getReactions: jest.fn(),
}));

import * as gaspsApi from '@/services/api/gasps';
import * as reactionsApi from '@/services/api/reactions';

// ── Helpers ───────────────────────────────────────────────────────────────────

const initialState = useGaspStore.getState();

function makeGasp(overrides: Partial<Gasp> = {}): Gasp {
  return {
    id: 'gasp-1',
    senderId: 'user-1',
    senderName: 'Alice',
    senderAvatarUrl: null,
    imageUri: 'https://example.com/gasp.jpg',
    mediaType: 'image',
    blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

// ── Setup/Teardown ────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset store to its initial state to avoid test pollution
  useGaspStore.setState({
    ...initialState,
    pendingGasps: [],
    sentGasps: [],
    reactions: [],
    currentViewingGasp: null,
    isHolding: false,
    holdProgress: 0,
    isLoadingPending: false,
    isLoadingSent: false,
    viewedChatGaspIds: {},
    viewedGaspUrls: {},
  });
  jest.clearAllMocks();
});

// ── addPendingGasp ────────────────────────────────────────────────────────────

describe('addPendingGasp', () => {
  it('adds the gasp to the front of pendingGasps (empty array)', () => {
    const gasp = makeGasp({ id: 'gasp-1' });
    useGaspStore.getState().addPendingGasp(gasp);

    const { pendingGasps } = useGaspStore.getState();
    expect(pendingGasps).toHaveLength(1);
    expect(pendingGasps[0]).toEqual(gasp);
  });

  it('prepends to existing pendingGasps', () => {
    const first = makeGasp({ id: 'gasp-1', senderName: 'Alice' });
    const second = makeGasp({ id: 'gasp-2', senderName: 'Bob' });

    useGaspStore.getState().addPendingGasp(first);
    useGaspStore.getState().addPendingGasp(second);

    const { pendingGasps } = useGaspStore.getState();
    expect(pendingGasps).toHaveLength(2);
    // Most recently added should be at index 0
    expect(pendingGasps[0].id).toBe('gasp-2');
    expect(pendingGasps[1].id).toBe('gasp-1');
  });
});

// ── markGaspViewed ────────────────────────────────────────────────────────────

describe('markGaspViewed', () => {
  it('removes the gasp from pendingGasps', () => {
    const gasp = makeGasp({ id: 'gasp-1', imageUri: 'https://example.com/a.jpg' });
    useGaspStore.setState({ pendingGasps: [gasp] });

    useGaspStore.getState().markGaspViewed('gasp-1');

    const { pendingGasps } = useGaspStore.getState();
    expect(pendingGasps).toHaveLength(0);
  });

  it('records the gasp imageUri in viewedGaspUrls', () => {
    const gasp = makeGasp({ id: 'gasp-1', imageUri: 'https://example.com/a.jpg' });
    useGaspStore.setState({ pendingGasps: [gasp] });

    useGaspStore.getState().markGaspViewed('gasp-1');

    const { viewedGaspUrls } = useGaspStore.getState();
    expect(viewedGaspUrls['https://example.com/a.jpg']).toBe(true);
  });

  it('does not modify viewedGaspUrls when gasp id is not found', () => {
    useGaspStore.setState({ pendingGasps: [], viewedGaspUrls: {} });

    useGaspStore.getState().markGaspViewed('nonexistent-id');

    const { viewedGaspUrls } = useGaspStore.getState();
    expect(Object.keys(viewedGaspUrls)).toHaveLength(0);
  });

  it('leaves other pending gasps intact', () => {
    const gasp1 = makeGasp({ id: 'gasp-1' });
    const gasp2 = makeGasp({ id: 'gasp-2', imageUri: 'https://example.com/b.jpg' });
    useGaspStore.setState({ pendingGasps: [gasp1, gasp2] });

    useGaspStore.getState().markGaspViewed('gasp-1');

    const { pendingGasps } = useGaspStore.getState();
    expect(pendingGasps).toHaveLength(1);
    expect(pendingGasps[0].id).toBe('gasp-2');
  });
});

// ── markChatGaspViewed ────────────────────────────────────────────────────────

describe('markChatGaspViewed', () => {
  it('records the messageId in viewedChatGaspIds', () => {
    useGaspStore.getState().markChatGaspViewed('msg-123');

    const { viewedChatGaspIds } = useGaspStore.getState();
    expect(viewedChatGaspIds['msg-123']).toBe(true);
  });

  it('records the mediaUrl in viewedGaspUrls when provided', () => {
    const mediaUrl = 'https://example.com/chat-gasp.mp4';
    useGaspStore.getState().markChatGaspViewed('msg-123', mediaUrl);

    const { viewedGaspUrls } = useGaspStore.getState();
    expect(viewedGaspUrls[mediaUrl]).toBe(true);
  });

  it('does not modify viewedGaspUrls when mediaUrl is omitted', () => {
    useGaspStore.setState({ viewedGaspUrls: {} });
    useGaspStore.getState().markChatGaspViewed('msg-123');

    const { viewedGaspUrls } = useGaspStore.getState();
    expect(Object.keys(viewedGaspUrls)).toHaveLength(0);
  });

  it('accumulates multiple messageIds without overwriting existing ones', () => {
    useGaspStore.getState().markChatGaspViewed('msg-1', 'https://example.com/1.jpg');
    useGaspStore.getState().markChatGaspViewed('msg-2', 'https://example.com/2.jpg');

    const { viewedChatGaspIds, viewedGaspUrls } = useGaspStore.getState();
    expect(viewedChatGaspIds['msg-1']).toBe(true);
    expect(viewedChatGaspIds['msg-2']).toBe(true);
    expect(viewedGaspUrls['https://example.com/1.jpg']).toBe(true);
    expect(viewedGaspUrls['https://example.com/2.jpg']).toBe(true);
  });
});

// ── Cross-reference: inbox viewed → chat blocked ──────────────────────────────

describe('isGaspMediaViewed (cross-reference)', () => {
  it('returns false for an unviewed mediaUrl', () => {
    const result = useGaspStore.getState().isGaspMediaViewed('https://example.com/unseen.jpg');
    expect(result).toBe(false);
  });

  it('returns true after markGaspViewed records the imageUri (inbox → chat blocked)', () => {
    const imageUri = 'https://example.com/shared-media.jpg';
    const gasp = makeGasp({ id: 'gasp-inbox', imageUri });
    useGaspStore.setState({ pendingGasps: [gasp] });

    // Viewing the inbox gasp records imageUri in viewedGaspUrls
    useGaspStore.getState().markGaspViewed('gasp-inbox');

    // isGaspMediaViewed should now return true for that URL
    expect(useGaspStore.getState().isGaspMediaViewed(imageUri)).toBe(true);
  });

  it('returns true after markChatGaspViewed records a mediaUrl', () => {
    const mediaUrl = 'https://example.com/chat-media.jpg';
    useGaspStore.getState().markChatGaspViewed('msg-abc', mediaUrl);

    expect(useGaspStore.getState().isGaspMediaViewed(mediaUrl)).toBe(true);
  });

  it('inbox viewed URL blocks the same URL in chat context', () => {
    // Same media URL could arrive via inbox gasp and chat gasp
    const sharedUrl = 'https://cdn.example.com/media.jpg';

    // Simulate inbox view
    const inboxGasp = makeGasp({ id: 'inbox-gasp', imageUri: sharedUrl });
    useGaspStore.setState({ pendingGasps: [inboxGasp] });
    useGaspStore.getState().markGaspViewed('inbox-gasp');

    // Chat should see this URL as already viewed
    expect(useGaspStore.getState().isGaspMediaViewed(sharedUrl)).toBe(true);
  });
});

// ── fetchPendingGasps ─────────────────────────────────────────────────────────

describe('fetchPendingGasps', () => {
  it('sets isLoadingPending to true while fetching and false after', async () => {
    const gasps = [makeGasp({ id: 'gasp-remote' })];
    (gaspsApi.getPendingGasps as jest.Mock).mockResolvedValueOnce(gasps);

    const fetchPromise = useGaspStore.getState().fetchPendingGasps();
    // isLoadingPending should be true immediately after calling
    expect(useGaspStore.getState().isLoadingPending).toBe(true);

    await fetchPromise;
    expect(useGaspStore.getState().isLoadingPending).toBe(false);
  });

  it('populates pendingGasps with the fetched data', async () => {
    const gasps = [
      makeGasp({ id: 'gasp-a', senderName: 'Alice' }),
      makeGasp({ id: 'gasp-b', senderName: 'Bob' }),
    ];
    (gaspsApi.getPendingGasps as jest.Mock).mockResolvedValueOnce(gasps);

    await useGaspStore.getState().fetchPendingGasps();

    const { pendingGasps } = useGaspStore.getState();
    expect(pendingGasps).toHaveLength(2);
    expect(pendingGasps[0].id).toBe('gasp-a');
    expect(pendingGasps[1].id).toBe('gasp-b');
  });

  it('clears isLoadingPending on failure', async () => {
    (gaspsApi.getPendingGasps as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(useGaspStore.getState().fetchPendingGasps()).rejects.toThrow('Network error');

    expect(useGaspStore.getState().isLoadingPending).toBe(false);
  });

  it('does not modify pendingGasps when fetch fails', async () => {
    const existingGasp = makeGasp({ id: 'existing' });
    useGaspStore.setState({ pendingGasps: [existingGasp] });

    (gaspsApi.getPendingGasps as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

    await expect(useGaspStore.getState().fetchPendingGasps()).rejects.toThrow();

    // pendingGasps should remain unchanged on error (finally only clears loading flag)
    const { pendingGasps } = useGaspStore.getState();
    expect(pendingGasps).toHaveLength(1);
    expect(pendingGasps[0].id).toBe('existing');
  });
});

// ── removeExpiredGasp ─────────────────────────────────────────────────────────

describe('removeExpiredGasp', () => {
  it('removes the gasp with the given id', () => {
    const gasp = makeGasp({ id: 'gasp-expired' });
    useGaspStore.setState({ pendingGasps: [gasp] });

    useGaspStore.getState().removeExpiredGasp('gasp-expired');

    const { pendingGasps } = useGaspStore.getState();
    expect(pendingGasps).toHaveLength(0);
  });

  it('leaves other gasps intact when removing by id', () => {
    const gasp1 = makeGasp({ id: 'gasp-1' });
    const gasp2 = makeGasp({ id: 'gasp-expired' });
    const gasp3 = makeGasp({ id: 'gasp-3' });
    useGaspStore.setState({ pendingGasps: [gasp1, gasp2, gasp3] });

    useGaspStore.getState().removeExpiredGasp('gasp-expired');

    const { pendingGasps } = useGaspStore.getState();
    expect(pendingGasps).toHaveLength(2);
    expect(pendingGasps.find((g) => g.id === 'gasp-expired')).toBeUndefined();
    expect(pendingGasps.find((g) => g.id === 'gasp-1')).toBeDefined();
    expect(pendingGasps.find((g) => g.id === 'gasp-3')).toBeDefined();
  });

  it('is a no-op when the id does not exist', () => {
    const gasp = makeGasp({ id: 'gasp-1' });
    useGaspStore.setState({ pendingGasps: [gasp] });

    useGaspStore.getState().removeExpiredGasp('nonexistent-id');

    const { pendingGasps } = useGaspStore.getState();
    expect(pendingGasps).toHaveLength(1);
  });

  it('handles an empty pendingGasps array gracefully', () => {
    useGaspStore.setState({ pendingGasps: [] });

    expect(() => useGaspStore.getState().removeExpiredGasp('any-id')).not.toThrow();
    expect(useGaspStore.getState().pendingGasps).toHaveLength(0);
  });
});
