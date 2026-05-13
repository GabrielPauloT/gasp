import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { useGaspStore } from '@/stores/gaspStore';
import { useInboxStore } from '@/stores/inboxStore';
import { useChatStore } from '@/stores/chatStore';
import { queryKeys } from '@/services/queryKeys';
import { addMessageToCache } from '@/hooks/queries/useChat';
import type { Gasp } from '@/services/api/schemas/gasp.schema';
import type { Conversation } from '@/services/api/schemas/chat.schema';
import {
  onGaspReceived,
  onGaspViewed,
  onGaspReactionReceived,
  onGaspExpired,
  onPresenceUserOnline,
  onPresenceUserOffline,
  onPresenceBulkStatus,
  onChatNewMessage,
  onChatTyping,
  onChatMessageRead,
  onChatConversationUpdated,
  getSocket,
} from '@/services/socket';

/**
 * Registers all Socket.IO listeners for real-time updates.
 * Data events (gasps, messages, conversations) update React Query cache directly.
 * UI events (presence, typing) continue updating Zustand stores.
 * Should be called once in the root layout after auth.
 */
export function useSocketListeners() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !getSocket()) return;

    const cleanups: (() => void)[] = [];

    // ── Gasp events → React Query cache ─────────────────────────
    cleanups.push(
      onGaspReceived(({ gasp }) => {
        queryClient.setQueryData<Gasp[]>(queryKeys.gasps.pending, (old) =>
          [gasp, ...(old ?? [])],
        );
      }),
    );

    cleanups.push(
      onGaspViewed(({ gaspId }) => {
        const pending = queryClient.getQueryData<Gasp[]>(queryKeys.gasps.pending);
        const gasp = pending?.find((g) => g.id === gaspId);
        queryClient.setQueryData<Gasp[]>(queryKeys.gasps.pending, (old) =>
          old?.filter((g) => g.id !== gaspId) ?? [],
        );
        useGaspStore.getState().markGaspViewed(gaspId, gasp?.imageUri);
      }),
    );

    cleanups.push(
      onGaspReactionReceived(({ reaction }) => {
        useGaspStore.getState().addReaction(reaction);
      }),
    );

    cleanups.push(
      onGaspExpired(({ gaspId }) => {
        queryClient.setQueryData<Gasp[]>(queryKeys.gasps.pending, (old) =>
          old?.filter((g) => g.id !== gaspId) ?? [],
        );
      }),
    );

    // ── Presence events → Zustand (UI state) ────────────────────
    cleanups.push(
      onPresenceBulkStatus(({ statuses }) => {
        const onlineIds = statuses.map((s) => s.userId);
        useInboxStore.getState().setBulkOnlineStatus(onlineIds);
      }),
    );

    cleanups.push(
      onPresenceUserOnline(({ userId }) => {
        useInboxStore.getState().setFriendOnlineStatus(userId, 'online');
      }),
    );

    cleanups.push(
      onPresenceUserOffline(({ userId }) => {
        useInboxStore.getState().setFriendOnlineStatus(userId, 'offline');
      }),
    );

    // ── Chat events → React Query cache + Zustand UI ────────────
    cleanups.push(
      onChatNewMessage(({ conversationId, message }) => {
        addMessageToCache(queryClient, conversationId, message);
        const activeId = useChatStore.getState().activeConversationId;
        queryClient.setQueryData<Conversation[]>(queryKeys.conversations.all, (old) =>
          old?.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  lastMessage: message,
                  updatedAt: message.createdAt,
                  unreadCount: c.id === activeId ? c.unreadCount : c.unreadCount + 1,
                }
              : c,
          ) ?? [],
        );
      }),
    );

    cleanups.push(
      onChatTyping(({ conversationId, userId, isTyping }) => {
        useChatStore.getState().setTypingUser(conversationId, userId, isTyping);
      }),
    );

    cleanups.push(
      onChatMessageRead(({ conversationId }) => {
        queryClient.setQueryData<Conversation[]>(queryKeys.conversations.all, (old) =>
          old?.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c,
          ) ?? [],
        );
      }),
    );

    cleanups.push(
      onChatConversationUpdated(({ conversationId, lastMessage }) => {
        queryClient.setQueryData<Conversation[]>(queryKeys.conversations.all, (old) =>
          old?.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage, updatedAt: lastMessage.createdAt }
              : c,
          ) ?? [],
        );
      }),
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [isAuthenticated]);
}
