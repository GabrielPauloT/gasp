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
  hasMoreMessages: Record<string, boolean>;

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
  sendMessage: (conversationId: string, content: string, type?: MessageType, mediaUrl?: string) => void;
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
  hasMoreMessages: {},

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (activeConversationId) =>
    set({ activeConversationId }),

  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] ?? []),
          message,
        ],
      },
    })),

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
    set({ isLoadingMessages: true });
    try {
      const result = await messagesApi.listMessages(conversationId, {
        cursor,
        limit: 50,
        direction: 'older',
      });

      set((state) => {
        const existing = cursor ? (state.messages[conversationId] ?? []) : [];
        return {
          messages: {
            ...state.messages,
            [conversationId]: [...result.data.reverse(), ...existing],
          },
          hasMoreMessages: {
            ...state.hasMoreMessages,
            [conversationId]: result.hasMore,
          },
        };
      });
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: (conversationId, content, type = 'text', mediaUrl) => {
    chatSendMessage({ conversationId, content, type, mediaUrl });
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
