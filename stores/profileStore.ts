import { create } from 'zustand';
import * as usersApi from '@/services/api/users';
import { useAuthStore } from '@/stores/authStore';
import * as Sentry from '@sentry/react-native';

interface ProfileState {
  gaspsSent: number;
  gaspsReceived: number;
  friendsCount: number;
  streak: number;
  reactionsReceived: number;
  gaspScore: number;
  memberSince: string;
  isLoading: boolean;

  loadProfile: () => Promise<void>;
}

function calculateGaspScore(sent: number, received: number, streak: number, reactions: number): number {
  return sent + received + (streak * 5) + reactions;
}

export const useProfileStore = create<ProfileState>((set) => ({
  gaspsSent: 0,
  gaspsReceived: 0,
  friendsCount: 0,
  streak: 0,
  reactionsReceived: 0,
  gaspScore: 0,
  memberSince: '',
  isLoading: false,

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const stats = await usersApi.getMyStats();
      const user = useAuthStore.getState().user;
      const streak = stats.streak ?? 0;
      const reactionsReceived = stats.reactionsReceived ?? 0;
      const gaspScore = calculateGaspScore(
        stats.gaspsSent,
        stats.gaspsReceived,
        streak,
        reactionsReceived,
      );

      set({
        gaspsSent: stats.gaspsSent,
        gaspsReceived: stats.gaspsReceived,
        friendsCount: stats.friendsCount,
        streak,
        reactionsReceived,
        gaspScore,
        memberSince: user?.createdAt ?? '',
        isLoading: false,
      });
    } catch (e) {
      Sentry.captureException(e);
      set({ isLoading: false });
    }
  },
}));
