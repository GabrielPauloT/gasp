import { addMessageToCache } from '@/hooks/queries/useChat';
import { queryClient } from '@/lib/queryClient';
import type { Conversation } from '@/services/api/schemas/chat.schema';
import type { Gasp } from '@/services/api/schemas/gasp.schema';
import { queryKeys } from '@/services/queryKeys';
import {
    getSocket,
    onChatConversationUpdated,
    onChatMessageRead,
    onChatNewMessage,
    onChatTyping,
    onGaspExpired,
    onGaspReactionReceived,
    onGaspReceived,
    onGaspStatusUpdated,
    onGaspViewed,
    onPresenceBulkStatus,
    onPresenceUserOffline,
    onPresenceUserOnline,
} from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useGaspStore } from '@/stores/gaspStore';
import { useInboxStore } from '@/stores/inboxStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useEffect } from 'react';

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
        useNotificationStore.getState().enqueueToast({
          id: gasp.id,
          gaspId: gasp.id,
          senderName: gasp.senderName,
          imageUri: gasp.imageUri,
          blurhash: gasp.blurhash,
        });
        useNotificationStore.getState().triggerTabPulse();
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

    cleanups.push(
      onGaspStatusUpdated(({ gaspId, deliveryStatus }) => {
        queryClient.setQueryData<Gasp[]>(queryKeys.gasps.sent, (old) =>
          old?.map((g) => g.id === gaspId ? { ...g, deliveryStatus } : g) ?? [],
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
        const currentUserId = useAuthStore.getState().user?.id;

        // Only increment unreadCount for the recipient — never for the sender
        const isOwnMessage = currentUserId != null && message.senderId === currentUserId;

        queryClient.setQueryData<Conversation[]>(queryKeys.conversations.all, (old) => {
          if (!old) return [];
          return old.map((c) => {
            if (c.id !== conversationId) return c;
            const shouldIncrement = !isOwnMessage && c.id !== activeId;
            return {
              ...c,
              lastMessage: message,
              updatedAt: message.createdAt,
              lastMessageAt: message.createdAt,
              unreadCount: shouldIncrement ? c.unreadCount + 1 : c.unreadCount,
            };
          });
        });
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
              ? { ...c, lastMessage, updatedAt: lastMessage.createdAt, lastMessageAt: lastMessage.createdAt }
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
