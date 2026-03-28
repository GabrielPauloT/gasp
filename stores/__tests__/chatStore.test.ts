import { useChatStore } from '@/stores/chatStore';
import type { Message, Conversation } from '@/types/chat';

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock('@/services/api/conversations', () => ({
  listConversations: jest.fn(),
  getOrCreateConversation: jest.fn(),
  getConversation: jest.fn(),
}));

jest.mock('@/services/api/messages', () => ({
  listMessages: jest.fn(),
  sendMessage: jest.fn(),
  markRead: jest.fn(),
}));

jest.mock('@/services/socket', () => ({
  chatSendMessage: jest.fn(),
  chatJoinConversation: jest.fn(),
  chatLeaveConversation: jest.fn(),
  chatStartTyping: jest.fn(),
  chatStopTyping: jest.fn(),
  chatMarkRead: jest.fn(),
  getSocket: jest.fn(() => null),
}));

import * as conversationsApi from '@/services/api/conversations';
import * as messagesApi from '@/services/api/messages';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'Hello',
    type: 'text',
    createdAt: '2024-01-01T10:00:00.000Z',
    ...overrides,
  };
}

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'conv-1',
    participantIds: ['user-1', 'user-2'],
    participantNames: ['Alice', 'Bob'],
    participantAvatars: [null, null],
    unreadCount: 3,
    updatedAt: '2024-01-01T10:00:00.000Z',
    ...overrides,
  };
}

function makePaginatedResponse<T>(data: T[], hasMore = false, nextCursor: string | null = null) {
  return { data, hasMore, nextCursor };
}

// ── Setup / teardown ──────────────────────────────────────────────────────

beforeEach(() => {
  useChatStore.setState({
    conversations: [],
    activeConversationId: null,
    messages: {},
    typingUsers: [],
    isLoadingConversations: false,
    isLoadingMessages: false,
    isLoadingMoreMessages: false,
    hasMoreMessages: {},
    messageCursors: {},
  });

  jest.clearAllMocks();
});

// ── addMessage ────────────────────────────────────────────────────────────

describe('addMessage', () => {
  it('adds a message to the front of the conversation list', () => {
    const existing = makeMessage({ id: 'msg-old', createdAt: '2024-01-01T09:00:00.000Z' });
    useChatStore.setState({ messages: { 'conv-1': [existing] } });

    const newMsg = makeMessage({ id: 'msg-new', createdAt: '2024-01-01T10:00:00.000Z' });
    useChatStore.getState().addMessage('conv-1', newMsg);

    const msgs = useChatStore.getState().messages['conv-1'];
    expect(msgs[0]).toEqual(newMsg);
    expect(msgs[1]).toEqual(existing);
    expect(msgs).toHaveLength(2);
  });

  it('deduplicates by id — ignores message already in list (socket/REST race)', () => {
    const msg = makeMessage({ id: 'msg-dup' });
    useChatStore.setState({ messages: { 'conv-1': [msg] } });

    // Attempt to add the same message again
    useChatStore.getState().addMessage('conv-1', msg);

    const msgs = useChatStore.getState().messages['conv-1'];
    expect(msgs).toHaveLength(1);
  });

  it('does not cross-contaminate other conversations', () => {
    const msgConv2 = makeMessage({ id: 'msg-conv2', conversationId: 'conv-2' });
    useChatStore.setState({ messages: { 'conv-2': [msgConv2] } });

    const msgConv1 = makeMessage({ id: 'msg-conv1', conversationId: 'conv-1' });
    useChatStore.getState().addMessage('conv-1', msgConv1);

    expect(useChatStore.getState().messages['conv-1']).toEqual([msgConv1]);
    expect(useChatStore.getState().messages['conv-2']).toEqual([msgConv2]);
  });

  it('creates a new conversation message list when none exists', () => {
    const msg = makeMessage({ id: 'msg-brand-new' });
    useChatStore.getState().addMessage('conv-new', msg);

    const msgs = useChatStore.getState().messages['conv-new'];
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toEqual(msg);
  });
});

// ── fetchMessages ─────────────────────────────────────────────────────────

describe('fetchMessages', () => {
  it('sets messages on initial fetch (no cursor)', async () => {
    const apiMessages = [
      makeMessage({ id: 'api-1', createdAt: '2024-01-01T10:00:00.000Z' }),
      makeMessage({ id: 'api-2', createdAt: '2024-01-01T09:00:00.000Z' }),
    ];
    (messagesApi.listMessages as jest.Mock).mockResolvedValue(
      makePaginatedResponse(apiMessages, false, null),
    );

    await useChatStore.getState().fetchMessages('conv-1');

    const msgs = useChatStore.getState().messages['conv-1'];
    expect(msgs).toEqual(apiMessages);
    expect(useChatStore.getState().hasMoreMessages['conv-1']).toBe(false);
    expect(useChatStore.getState().messageCursors['conv-1']).toBeNull();
  });

  it('preserves socket-delivered messages that are newer than the API page', async () => {
    // A socket message arrived before the initial fetch
    const socketMsg = makeMessage({ id: 'socket-new', createdAt: '2024-01-01T11:00:00.000Z' });
    useChatStore.setState({ messages: { 'conv-1': [socketMsg] } });

    const apiMessages = [
      makeMessage({ id: 'api-1', createdAt: '2024-01-01T10:00:00.000Z' }),
      makeMessage({ id: 'api-2', createdAt: '2024-01-01T09:00:00.000Z' }),
    ];
    (messagesApi.listMessages as jest.Mock).mockResolvedValue(
      makePaginatedResponse(apiMessages, false, null),
    );

    await useChatStore.getState().fetchMessages('conv-1');

    const msgs = useChatStore.getState().messages['conv-1'];
    // socket message preserved at front, followed by API messages
    expect(msgs[0]).toEqual(socketMsg);
    expect(msgs[1]).toEqual(apiMessages[0]);
    expect(msgs[2]).toEqual(apiMessages[1]);
  });

  it('drops socket messages that are NOT newer than the API page', async () => {
    // A socket message with older timestamp than the API result
    const staleSocketMsg = makeMessage({
      id: 'socket-stale',
      createdAt: '2024-01-01T08:00:00.000Z',
    });
    useChatStore.setState({ messages: { 'conv-1': [staleSocketMsg] } });

    const apiMessages = [
      makeMessage({ id: 'api-1', createdAt: '2024-01-01T10:00:00.000Z' }),
    ];
    (messagesApi.listMessages as jest.Mock).mockResolvedValue(
      makePaginatedResponse(apiMessages, false, null),
    );

    await useChatStore.getState().fetchMessages('conv-1');

    const msgs = useChatStore.getState().messages['conv-1'];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe('api-1');
  });

  it('appends older messages on pagination (with cursor)', async () => {
    const existing = [
      makeMessage({ id: 'msg-new', createdAt: '2024-01-01T10:00:00.000Z' }),
    ];
    useChatStore.setState({
      messages: { 'conv-1': existing },
      hasMoreMessages: { 'conv-1': true },
      messageCursors: { 'conv-1': 'cursor-abc' },
    });

    const olderMessages = [
      makeMessage({ id: 'msg-older', createdAt: '2024-01-01T08:00:00.000Z' }),
    ];
    (messagesApi.listMessages as jest.Mock).mockResolvedValue(
      makePaginatedResponse(olderMessages, false, null),
    );

    await useChatStore.getState().fetchMessages('conv-1', 'cursor-abc');

    const msgs = useChatStore.getState().messages['conv-1'];
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toEqual(existing[0]);   // newer stays at front
    expect(msgs[1]).toEqual(olderMessages[0]); // older appended at end
  });

  it('does not duplicate messages on pagination if already present', async () => {
    const alreadyPresent = makeMessage({ id: 'msg-dup', createdAt: '2024-01-01T09:00:00.000Z' });
    useChatStore.setState({
      messages: { 'conv-1': [alreadyPresent] },
      hasMoreMessages: { 'conv-1': true },
      messageCursors: { 'conv-1': 'cursor-abc' },
    });

    // API returns the same message again (can happen in edge cases)
    (messagesApi.listMessages as jest.Mock).mockResolvedValue(
      makePaginatedResponse([alreadyPresent], false, null),
    );

    await useChatStore.getState().fetchMessages('conv-1', 'cursor-abc');

    const msgs = useChatStore.getState().messages['conv-1'];
    expect(msgs).toHaveLength(1);
  });

  it('updates hasMoreMessages and messageCursors after pagination', async () => {
    useChatStore.setState({
      messages: { 'conv-1': [] },
      hasMoreMessages: { 'conv-1': true },
      messageCursors: { 'conv-1': 'cursor-old' },
    });

    (messagesApi.listMessages as jest.Mock).mockResolvedValue(
      makePaginatedResponse([], true, 'cursor-next'),
    );

    await useChatStore.getState().fetchMessages('conv-1', 'cursor-old');

    expect(useChatStore.getState().hasMoreMessages['conv-1']).toBe(true);
    expect(useChatStore.getState().messageCursors['conv-1']).toBe('cursor-next');
  });

  it('calls listMessages with correct conversationId and params', async () => {
    (messagesApi.listMessages as jest.Mock).mockResolvedValue(
      makePaginatedResponse([], false, null),
    );

    await useChatStore.getState().fetchMessages('conv-1');

    expect(messagesApi.listMessages).toHaveBeenCalledWith('conv-1', {
      cursor: undefined,
      limit: 20,
      direction: 'older',
    });
  });
});

// ── setTypingUser ─────────────────────────────────────────────────────────

describe('setTypingUser', () => {
  it('adds a typing user', () => {
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true);

    const typingUsers = useChatStore.getState().typingUsers;
    expect(typingUsers).toEqual([{ conversationId: 'conv-1', userId: 'user-2' }]);
  });

  it('removes a typing user when isTyping is false', () => {
    useChatStore.setState({
      typingUsers: [{ conversationId: 'conv-1', userId: 'user-2' }],
    });

    useChatStore.getState().setTypingUser('conv-1', 'user-2', false);

    expect(useChatStore.getState().typingUsers).toEqual([]);
  });

  it('does not duplicate typing users', () => {
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true);
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true);

    const typingUsers = useChatStore.getState().typingUsers;
    expect(typingUsers).toHaveLength(1);
  });

  it('handles multiple typing users in different conversations independently', () => {
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true);
    useChatStore.getState().setTypingUser('conv-2', 'user-3', true);

    const typingUsers = useChatStore.getState().typingUsers;
    expect(typingUsers).toHaveLength(2);
    expect(typingUsers).toContainEqual({ conversationId: 'conv-1', userId: 'user-2' });
    expect(typingUsers).toContainEqual({ conversationId: 'conv-2', userId: 'user-3' });
  });

  it('only removes the matching user/conversation pair', () => {
    useChatStore.setState({
      typingUsers: [
        { conversationId: 'conv-1', userId: 'user-2' },
        { conversationId: 'conv-1', userId: 'user-3' },
      ],
    });

    useChatStore.getState().setTypingUser('conv-1', 'user-2', false);

    const typingUsers = useChatStore.getState().typingUsers;
    expect(typingUsers).toHaveLength(1);
    expect(typingUsers[0]).toEqual({ conversationId: 'conv-1', userId: 'user-3' });
  });
});

// ── markConversationRead ──────────────────────────────────────────────────

describe('markConversationRead', () => {
  it('sets unreadCount to 0 for the target conversation', () => {
    const conv = makeConversation({ id: 'conv-1', unreadCount: 5 });
    useChatStore.setState({ conversations: [conv] });

    useChatStore.getState().markConversationRead('conv-1');

    const updated = useChatStore.getState().conversations.find((c) => c.id === 'conv-1');
    expect(updated?.unreadCount).toBe(0);
  });

  it('does not modify other conversations', () => {
    const conv1 = makeConversation({ id: 'conv-1', unreadCount: 3 });
    const conv2 = makeConversation({ id: 'conv-2', unreadCount: 7 });
    useChatStore.setState({ conversations: [conv1, conv2] });

    useChatStore.getState().markConversationRead('conv-1');

    const other = useChatStore.getState().conversations.find((c) => c.id === 'conv-2');
    expect(other?.unreadCount).toBe(7);
  });

  it('is a no-op when conversation does not exist', () => {
    const conv = makeConversation({ id: 'conv-1', unreadCount: 2 });
    useChatStore.setState({ conversations: [conv] });

    // Should not throw
    expect(() => useChatStore.getState().markConversationRead('conv-nonexistent')).not.toThrow();
    // Existing conversation unchanged
    expect(useChatStore.getState().conversations[0].unreadCount).toBe(2);
  });
});
