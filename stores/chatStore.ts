import { create } from 'zustand';
import type { Conversation, Message, MessageType } from '@/types/chat';
import * as conversationsApi from '@/services/api/conversations';
import * as messagesApi from '@/services/api/messages';
import {
  chatSendMessage,
  chatJoinConversation,
  chatLeaveConversation,
  chatStartTyping,
  chatStopTyping,
  chatMarkRead,
} from '@/services/socket';

interface TypingUser {
  userId: string;
  conversationId: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: TypingUser[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: Record<string, boolean>;
  messageCursors: Record<string, string | null>;

  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  markConversationRead: (conversationId: string) => void;
  setTypingUser: (conversationId: string, userId: string, isTyping: boolean) => void;
  updateConversationLastMessage: (conversationId: string, message: Message) => void;

  // Async actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, cursor?: string) => Promise<void>;
  fetchMoreMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, type?: MessageType, mediaUrl?: string, replyToId?: string) => void;
  openConversation: (conversationId: string) => Promise<void>;
  closeConversation: (conversationId: string) => void;
  getOrCreateConversation: (participantId: string) => Promise<Conversation>;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markAsRead: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isLoadingMoreMessages: false,
  hasMoreMessages: {},
  messageCursors: {},

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (activeConversationId) =>
    set({ activeConversationId }),

  addMessage: (conversationId, message) =>
    set((state) => {
      const current = state.messages[conversationId] ?? [];
      // To avoid duplicates if socket and REST race:
      if (current.some(m => m.id === message.id)) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: [message, ...current],
        },
      };
    }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  markConversationRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    })),

  setTypingUser: (conversationId, userId, isTyping) =>
    set((state) => {
      const filtered = state.typingUsers.filter(
        (t) => !(t.conversationId === conversationId && t.userId === userId)
      );
      return {
        typingUsers: isTyping
          ? [...filtered, { conversationId, userId }]
          : filtered,
      };
    }),

  updateConversationLastMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: message, updatedAt: message.createdAt }
          : c
      ),
    })),

  // ── Async actions ────────────────────────────────────────────────

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const result = await conversationsApi.listConversations();
      set({ conversations: result.data });
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  fetchMessages: async (conversationId, cursor) => {
    const isPageLoad = !!cursor;
    if (isPageLoad) {
      set({ isLoadingMoreMessages: true });
    } else {
      set({ isLoadingMessages: true });
    }
    try {
      const result = await messagesApi.listMessages(conversationId, {
        cursor,
        limit: 20,
        direction: 'older',
      });

      set((state) => {
        const current = state.messages[conversationId] ?? [];

        if (cursor) {
          // Pagination: append older messages not already present
          const existingIds = new Set(current.map((m) => m.id));
          const older = result.data.filter((m) => !existingIds.has(m.id));
          return {
            messages: { ...state.messages, [conversationId]: [...current, ...older] },
            hasMoreMessages: { ...state.hasMoreMessages, [conversationId]: result.hasMore },
            messageCursors: { ...state.messageCursors, [conversationId]: result.nextCursor },
          };
        }

        // Initial fetch: API result is authoritative, but preserve
        // socket-delivered messages that are NEWER than the API page
        // (old paginated messages must be dropped to avoid reordering)
        const apiIds = new Set(result.data.map((m) => m.id));
        const newestApiTime = result.data[0]?.createdAt;
        const socketOnly = current.filter(
          (m) => !apiIds.has(m.id) && (!newestApiTime || m.createdAt > newestApiTime),
        );
        return {
          messages: { ...state.messages, [conversationId]: [...socketOnly, ...result.data] },
          hasMoreMessages: { ...state.hasMoreMessages, [conversationId]: result.hasMore },
          messageCursors: { ...state.messageCursors, [conversationId]: result.nextCursor },
        };
      });
    } finally {
      if (isPageLoad) {
        set({ isLoadingMoreMessages: false });
      } else {
        set({ isLoadingMessages: false });
      }
    }
  },

  fetchMoreMessages: async (conversationId) => {
    const { hasMoreMessages, isLoadingMoreMessages, messageCursors } = get();
    if (isLoadingMoreMessages || !hasMoreMessages[conversationId]) return;
    const cursor = messageCursors[conversationId];
    if (!cursor) return;
    await get().fetchMessages(conversationId, cursor);
  },

  sendMessage: (conversationId, content, type = 'text', mediaUrl, replyToId) => {
    chatSendMessage({ conversationId, content, type, mediaUrl, replyToId });
  },

  openConversation: async (conversationId) => {
    set({ activeConversationId: conversationId });
    chatJoinConversation(conversationId);
    await get().fetchMessages(conversationId);
  },

  closeConversation: (conversationId) => {
    chatLeaveConversation(conversationId);
    set({ activeConversationId: null });
  },

  getOrCreateConversation: async (participantId) => {
    const conversation = await conversationsApi.getOrCreateConversation(participantId);
    // Add to list if not already present
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      return exists
        ? state
        : { conversations: [conversation, ...state.conversations] };
    });
    return conversation;
  },

  startTyping: (conversationId) => {
    chatStartTyping(conversationId);
  },

  stopTyping: (conversationId) => {
    chatStopTyping(conversationId);
  },

  markAsRead: async (conversationId) => {
    chatMarkRead(conversationId);
    await messagesApi.markRead(conversationId);
    get().markConversationRead(conversationId);
  },
}));
