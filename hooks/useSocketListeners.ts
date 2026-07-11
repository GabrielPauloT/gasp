import { addMessageToCache } from '@/hooks/queries/useChat';
import { queryClient } from '@/lib/queryClient';
import type { Conversation, Message } from '@/services/api/schemas/chat.schema';
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
        const pendingGasps = queryClient.getQueryData<Gasp[]>(queryKeys.gasps.pending) ?? [];
        if (pendingGasps.some((existing) => existing.id === gasp.id)) return;

        queryClient.setQueryData<Gasp[]>(queryKeys.gasps.pending, (old) =>
          [gasp, ...(old ?? [])],
        );
        useNotificationStore.getState().enqueueToast({
          id: gasp.id,
          kind: 'gasp.received',
          title: 'New Gasp',
          body: gasp.senderName,
          route: `/(modals)/view-gasp?gaspId=${gasp.id}`,
          gaspId: gasp.id,
          imageUri: gasp.imageUri,
          blurhash: gasp.blurhash,
        });
        useNotificationStore.getState().setInboxUnreadType('gasp');
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
      onGaspReactionReceived(({ reaction, gaspId }) => {
        useGaspStore.getState().addReaction(reaction);
        useNotificationStore.getState().enqueueToast({
          id: reaction.id,
          kind: 'gasp.reaction_received',
          title: 'New Reaction',
          body: reaction.reactorName || 'Someone reacted to your gasp',
          route: `/(modals)/reaction-result?gaspId=${gaspId}`,
          gaspId,
          reactionId: reaction.id,
        });
        useNotificationStore.getState().setInboxUnreadType('reaction');
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
        if (shouldRefetchReactionMessage(message)) {
          queryClient.invalidateQueries({ queryKey: queryKeys.messages.byConversation(conversationId) });
        }

        const activeId = useChatStore.getState().activeConversationId;
        const currentUserId = useAuthStore.getState().user?.id;

        // Only increment unreadCount for the recipient — never for the sender
        const isOwnMessage = currentUserId != null && message.senderId === currentUserId;

        let latestConversations: Conversation[] = [];
        queryClient.setQueryData<Conversation[]>(queryKeys.conversations.all, (old) => {
          if (!old) return [];
          latestConversations = old;
          return old.map((c) => {
            if (c.id !== conversationId) return c;
            const isDuplicate = c.lastMessage?.id === message.id;
            const shouldIncrement = !isDuplicate && !isOwnMessage && c.id !== activeId;
            return {
              ...c,
              lastMessage: message,
              updatedAt: message.createdAt,
              lastMessageAt: message.createdAt,
              unreadCount: shouldIncrement ? c.unreadCount + 1 : c.unreadCount,
            };
          });
        });

        if (!isOwnMessage && conversationId !== activeId) {
          useNotificationStore.getState().enqueueToast({
            id: message.id,
            kind: 'message.new',
            title: 'New Message',
            body: message.content,
            route: routeForConversationToast(conversationId, latestConversations, message.senderId, currentUserId),
            conversationId,
          });
          useNotificationStore.getState().setChatHasUnread(true);
        }
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

function shouldRefetchReactionMessage(message: Message) {
  return message.type === 'reaction' && !!message.replyToId && !message.replyToMessage;
}

function routeForConversationToast(
  conversationId: string,
  conversations: Conversation[],
  messageSenderId?: string,
  currentUserId?: string,
) {
  const conversation = conversations.find((c) => c.id === conversationId);
  const senderIndex = conversation?.participantIds?.findIndex((id) => id === messageSenderId) ?? -1;
  const otherIndex = senderIndex >= 0
    ? senderIndex
    : conversation?.participantIds?.findIndex((id) => id !== currentUserId) ?? -1;
  const name = otherIndex >= 0 ? conversation?.participantNames?.[otherIndex] : undefined;
  const avatarUrl = otherIndex >= 0 ? conversation?.participantAvatars?.[otherIndex] : undefined;
  const search = new URLSearchParams();

  if (name) search.set('name', name);
  if (avatarUrl) search.set('avatarUrl', avatarUrl);

  const query = search.toString();
  return query ? `/chat/${conversationId}?${query}` : `/chat/${conversationId}`;
}
