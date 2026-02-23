import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useGaspStore } from '@/stores/gaspStore';
import { useInboxStore } from '@/stores/inboxStore';
import { useChatStore } from '@/stores/chatStore';
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
 * Should be called once in the root layout after auth.
 */
export function useSocketListeners() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);

  useEffect(() => {
    // Only listen when authenticated and not a guest
    if (!isAuthenticated || isGuest || !getSocket()) return;

    const cleanups: (() => void)[] = [];

    // ── Gasp events ──────────────────────────────────────────────
    cleanups.push(
      onGaspReceived(({ gasp }) => {
        useGaspStore.getState().addPendingGasp(gasp);
      })
    );

    cleanups.push(
      onGaspViewed(({ gaspId }) => {
        useGaspStore.getState().markGaspViewed(gaspId);
      })
    );

    cleanups.push(
      onGaspReactionReceived(({ reaction }) => {
        useGaspStore.getState().addReaction(reaction);
      })
    );

    cleanups.push(
      onGaspExpired(({ gaspId }) => {
        useGaspStore.getState().removeExpiredGasp(gaspId);
      })
    );

    // ── Presence events ──────────────────────────────────────────
    cleanups.push(
      onPresenceBulkStatus(({ statuses }) => {
        const onlineIds = statuses.map((s) => s.userId);
        useInboxStore.getState().setBulkOnlineStatus(onlineIds);
      })
    );

    cleanups.push(
      onPresenceUserOnline(({ userId }) => {
        useInboxStore.getState().setFriendOnlineStatus(userId, 'online');
      })
    );

    cleanups.push(
      onPresenceUserOffline(({ userId }) => {
        useInboxStore.getState().setFriendOnlineStatus(userId, 'offline');
      })
    );

    // ── Chat events ──────────────────────────────────────────────
    cleanups.push(
      onChatNewMessage(({ conversationId, message }) => {
        useChatStore.getState().addMessage(conversationId, message);
        useChatStore.getState().updateConversationLastMessage(conversationId, message);
      })
    );

    cleanups.push(
      onChatTyping(({ conversationId, userId, isTyping }) => {
        useChatStore.getState().setTypingUser(conversationId, userId, isTyping);
      })
    );

    cleanups.push(
      onChatMessageRead(({ conversationId }) => {
        useChatStore.getState().markConversationRead(conversationId);
      })
    );

    cleanups.push(
      onChatConversationUpdated(({ conversationId, lastMessage }) => {
        useChatStore.getState().updateConversationLastMessage(conversationId, lastMessage);
      })
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [isAuthenticated, isGuest]);
}
