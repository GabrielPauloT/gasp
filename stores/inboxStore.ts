import { create } from 'zustand';
import type { Friend } from '@/types/user';

export type FriendAction = 'thumbnail' | 'badge' | 'eye' | 'none';

export interface InboxFriend {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  onlineStatus: 'online' | 'offline' | 'away';
  statusText: string;
  statusEmoji: string;
  timestamp: string;
  actionType: FriendAction;
  badgeCount: number;
  thumbnailUrl: string | null;
}

interface InboxState {
  friends: InboxFriend[];
  friendCount: number;
  newGaspCount: number;
  onlineCount: number;
  searchQuery: string;
  isLoading: boolean;

  setFriends: (friends: InboxFriend[]) => void;
  setSearchQuery: (query: string) => void;
  setStats: (stats: { friendCount: number; newGaspCount: number; onlineCount: number }) => void;
  setLoading: (loading: boolean) => void;
}

export const useInboxStore = create<InboxState>((set) => ({
  friends: [],
  friendCount: 127,
  newGaspCount: 8,
  onlineCount: 43,
  searchQuery: '',
  isLoading: false,

  setFriends: (friends) => set({ friends }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setStats: ({ friendCount, newGaspCount, onlineCount }) =>
    set({ friendCount, newGaspCount, onlineCount }),

  setLoading: (isLoading) => set({ isLoading }),
}));

// Selector for filtered friends (used in inbox screen)
export const useFilteredFriends = () =>
  useInboxStore((state) => {
    const query = state.searchQuery.toLowerCase().trim();
    if (!query) return state.friends;
    return state.friends.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.username.toLowerCase().includes(query)
    );
  });
