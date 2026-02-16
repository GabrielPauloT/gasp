import { create } from 'zustand';
import type { Conversation, Message } from '@/types/chat';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;

  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  markConversationRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},

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
}));
