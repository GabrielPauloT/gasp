import { create } from 'zustand';

interface Permissions {
  camera: boolean;
  microphone: boolean;
  photos: boolean;
}

interface AppState {
  hasCompletedOnboarding: boolean;
  permissions: Permissions;

  setOnboarded: () => void;
  setPermissions: (perms: Partial<Permissions>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  hasCompletedOnboarding: false,
  permissions: {
    camera: false,
    microphone: false,
    photos: false,
  },

  setOnboarded: () => set({ hasCompletedOnboarding: true }),

  setPermissions: (perms) =>
    set((state) => ({
      permissions: { ...state.permissions, ...perms },
    })),
}));
