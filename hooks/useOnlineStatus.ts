import { useEffect } from 'react';
import { useInboxStore } from '@/stores/inboxStore';
import { useGaspStore } from '@/stores/gaspStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Fetches initial data on mount when authenticated.
 * Real-time online status updates come via Socket.IO listeners
 * registered in useSocketListeners hook.
 */
export function useOnlineStatus() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const fetchFriends = useInboxStore((s) => s.fetchFriends);
  const fetchPendingGasps = useGaspStore((s) => s.fetchPendingGasps);

  useEffect(() => {
    if (!isAuthenticated || isGuest) return;

    // Fetch initial data — real-time updates come via socket
    fetchFriends();
    fetchPendingGasps();
  }, [isAuthenticated, isGuest, fetchFriends, fetchPendingGasps]);
}
