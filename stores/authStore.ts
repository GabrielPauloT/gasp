import { create } from 'zustand';
import type { User } from '@/types/user';
import { setAuthToken, removeAuthToken } from '@/utils/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  setToken: (token: string) => void;
  continueAsGuest: () => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isGuest: false,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) =>
    set({ user, isAuthenticated: true }),

  setToken: async (token) => {
    await setAuthToken(token);
    set({ token, isAuthenticated: true });
  },

  continueAsGuest: () =>
    set({
      isGuest: true,
      isAuthenticated: true,
      user: {
        id: 'guest',
        displayName: 'Guest',
        username: 'guest',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
    }),

  logout: async () => {
    await removeAuthToken();
    set({
      user: null,
      token: null,
      isGuest: false,
      isAuthenticated: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
