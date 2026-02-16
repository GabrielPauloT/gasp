import { create } from 'zustand';

interface ProfileState {
  displayName: string;
  username: string;
  avatarUri: string | null;
  bio: string;
  gaspsSent: number;
  gaspsReceived: number;
  friendsCount: number;

  updateProfile: (updates: Partial<Omit<ProfileState, 'updateProfile' | 'loadProfile'>>) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  displayName: '',
  username: '',
  avatarUri: null,
  bio: '',
  gaspsSent: 0,
  gaspsReceived: 0,
  friendsCount: 0,

  updateProfile: (updates) => set((state) => ({ ...state, ...updates })),
}));
