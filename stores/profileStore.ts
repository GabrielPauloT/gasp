import { create } from 'zustand';
import * as usersApi from '@/services/api/users';
import * as gaspsApi from '@/services/api/gasps';
import type { Gasp } from '@/types/gasp';

interface ProfileState {
  gaspsSent: number;
  gaspsReceived: number;
  friendsCount: number;
  sentGasps: Gasp[];
  isLoading: boolean;

  loadStats: () => Promise<void>;
  loadSentGasps: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  gaspsSent: 0,
  gaspsReceived: 0,
  friendsCount: 0,
  sentGasps: [],
  isLoading: false,

  loadStats: async () => {
    try {
      const stats = await usersApi.getMyStats();
      set(stats);
    } catch {
      // keep previous values on error
    }
  },

  loadSentGasps: async () => {
    try {
      const gasps = await gaspsApi.getSentGasps();
      set({ sentGasps: gasps });
    } catch {
      // keep previous values on error
    }
  },

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const [stats, gasps] = await Promise.all([
        usersApi.getMyStats(),
        gaspsApi.getSentGasps(),
      ]);
      set({ ...stats, sentGasps: gasps, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
