import { useEffect, useRef } from 'react';
import { useInboxStore } from '@/stores/inboxStore';

/**
 * Simulates online status polling.
 * In production, this would connect to a WebSocket or polling service.
 */
export function useOnlineStatus(intervalMs = 30000) {
  const { setStats } = useInboxStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchOnlineStatus();

    // Poll periodically
    intervalRef.current = setInterval(fetchOnlineStatus, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMs]);

  function fetchOnlineStatus() {
    // TODO: Replace with real API call
    // For now, simulate random online count
    const onlineCount = Math.floor(Math.random() * 20) + 30;
    setStats({
      friendCount: 127,
      newGaspCount: 8,
      onlineCount,
    });
  }
}
