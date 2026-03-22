import { create } from 'zustand';
import type { Friend } from '@/types/user';
import * as friendsApi from '@/services/api/friends';

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
  friendshipId: string;
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
  setFriendOnlineStatus: (userId: string, status: 'online' | 'offline') => void;
  setBulkOnlineStatus: (onlineUserIds: string[]) => void;

  fetchFriends: () => Promise<void>;
  sendFriendRequest: (addresseeId: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
}

/** Map backend Friend to InboxFriend for UI */
function mapFriendToInbox(friend: Friend): InboxFriend {
  return {
    id: friend.id,
    name: friend.displayName,
    username: friend.username,
    avatarUrl: friend.avatarUrl,
    onlineStatus: friend.onlineStatus ?? 'offline',
    statusText: '',
    statusEmoji: '',
    timestamp: '',
    actionType: 'none',
    badgeCount: 0,
    thumbnailUrl: null,
    friendshipId: friend.friendshipId,
  };
}

export const useInboxStore = create<InboxState>((set, get) => ({
  friends: [],
  friendCount: 0,
  newGaspCount: 0,
  onlineCount: 0,
  searchQuery: '',
  isLoading: false,

  setFriends: (friends) => set({ friends }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStats: ({ friendCount, newGaspCount, onlineCount }) =>
    set({ friendCount, newGaspCount, onlineCount }),
  setLoading: (isLoading) => set({ isLoading }),

  setFriendOnlineStatus: (userId, status) =>
    set((state) => {
      const friend = state.friends.find((f) => f.id === userId);
      // Skip if friend not found or status unchanged (prevents duplicate events desyncing count)
      if (!friend || friend.onlineStatus === status) return state;
      const friends = state.friends.map((f) =>
        f.id === userId ? { ...f, onlineStatus: status } : f
      );
      return {
        friends,
        onlineCount: friends.filter((f) => f.onlineStatus === 'online').length,
      };
    }),

  setBulkOnlineStatus: (onlineUserIds) =>
    set((state) => ({
      friends: state.friends.map((f) => ({
        ...f,
        onlineStatus: onlineUserIds.includes(f.id) ? 'online' as const : 'offline' as const,
      })),
      onlineCount: onlineUserIds.length,
    })),

  fetchFriends: async () => {
    set({ isLoading: true });
    try {
      const friends = await friendsApi.listFriends();
      const inboxFriends = friends.map(mapFriendToInbox);
      const onlineCount = inboxFriends.filter((f) => f.onlineStatus === 'online').length;
      set({
        friends: inboxFriends,
        friendCount: inboxFriends.length,
        onlineCount,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  sendFriendRequest: async (addresseeId) => {
    await friendsApi.sendRequest(addresseeId);
  },

  acceptFriendRequest: async (friendshipId) => {
    await friendsApi.acceptRequest(friendshipId);
    // Refresh friend list after accepting
    get().fetchFriends();
  },

  rejectFriendRequest: async (friendshipId) => {
    await friendsApi.rejectRequest(friendshipId);
  },

  removeFriend: async (friendshipId) => {
    await friendsApi.removeFriend(friendshipId);
    set((state) => ({
      friends: state.friends.filter((f) => f.friendshipId !== friendshipId),
      friendCount: Math.max(0, state.friendCount - 1),
    }));
  },
}));

// Selector for filtered friends
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
