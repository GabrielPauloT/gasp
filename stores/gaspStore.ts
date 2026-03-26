import { create } from 'zustand';
import type { Gasp, Reaction } from '@/types/gasp';
import * as gaspsApi from '@/services/api/gasps';
import * as reactionsApi from '@/services/api/reactions';

interface GaspState {
  pendingGasps: Gasp[];
  sentGasps: Gasp[];
  reactions: Reaction[];
  currentViewingGasp: Gasp | null;
  isHolding: boolean;
  holdProgress: number;
  isLoadingPending: boolean;
  isLoadingSent: boolean;
  viewedChatGaspIds: Record<string, true>;
  viewedGaspUrls: Record<string, true>;

  setCurrentGasp: (gasp: Gasp | null) => void;
  setHolding: (holding: boolean) => void;
  setHoldProgress: (progress: number) => void;
  addPendingGasp: (gasp: Gasp) => void;
  markGaspViewed: (gaspId: string) => void;
  addSentGasp: (gasp: Gasp) => void;
  addReaction: (reaction: Reaction) => void;
  setPendingGasps: (gasps: Gasp[]) => void;
  setSentGasps: (gasps: Gasp[]) => void;
  removeExpiredGasp: (gaspId: string) => void;
  markChatGaspViewed: (messageId: string, mediaUrl?: string) => void;
  isGaspMediaViewed: (mediaUrl: string) => boolean;
  isChatGaspViewed: (messageId: string) => boolean;
  clearViewedChatGasps: () => void;

  fetchPendingGasps: () => Promise<void>;
  fetchSentGasps: () => Promise<void>;
  sendBatchGasp: (data: { recipientIds: string[]; imageUrl: string; mediaType?: 'image' | 'video'; blurhash?: string; textOverlay?: string }) => Promise<void>;
  viewGasp: (gaspId: string) => Promise<void>;
  createReaction: (data: { gaspId: string; videoUrl: string }) => Promise<Reaction>;
}

export const useGaspStore = create<GaspState>((set, get) => ({
  pendingGasps: [],
  sentGasps: [],
  reactions: [],
  currentViewingGasp: null,
  isHolding: false,
  holdProgress: 0,
  isLoadingPending: false,
  isLoadingSent: false,
  viewedChatGaspIds: {},
  viewedGaspUrls: {},

  setCurrentGasp: (gasp) => set({ currentViewingGasp: gasp }),
  setHolding: (isHolding) => set({ isHolding }),
  setHoldProgress: (holdProgress) => set({ holdProgress }),

  addPendingGasp: (gasp) =>
    set((state) => ({ pendingGasps: [gasp, ...state.pendingGasps] })),

  markGaspViewed: (gaspId) =>
    set((state) => {
      const gasp = state.pendingGasps.find((g) => g.id === gaspId);
      return {
        pendingGasps: state.pendingGasps.filter((g) => g.id !== gaspId),
        viewedGaspUrls: gasp
          ? { ...state.viewedGaspUrls, [gasp.imageUri]: true }
          : state.viewedGaspUrls,
      };
    }),

  addSentGasp: (gasp) =>
    set((state) => ({ sentGasps: [gasp, ...state.sentGasps] })),

  addReaction: (reaction) =>
    set((state) => ({ reactions: [reaction, ...state.reactions] })),

  setPendingGasps: (pendingGasps) => set({ pendingGasps }),
  setSentGasps: (sentGasps) => set({ sentGasps }),

  removeExpiredGasp: (gaspId) =>
    set((state) => ({
      pendingGasps: state.pendingGasps.filter((g) => g.id !== gaspId),
    })),

  markChatGaspViewed: (messageId, mediaUrl) =>
    set((state) => ({
      viewedChatGaspIds: { ...state.viewedChatGaspIds, [messageId]: true },
      viewedGaspUrls: mediaUrl
        ? { ...state.viewedGaspUrls, [mediaUrl]: true }
        : state.viewedGaspUrls,
    })),

  isGaspMediaViewed: (mediaUrl) => !!get().viewedGaspUrls[mediaUrl],

  isChatGaspViewed: (messageId) => !!get().viewedChatGaspIds[messageId],

  clearViewedChatGasps: () => set({ viewedChatGaspIds: {}, viewedGaspUrls: {} }),

  fetchPendingGasps: async () => {
    set({ isLoadingPending: true });
    try {
      const gasps = await gaspsApi.getPendingGasps();
      set({ pendingGasps: gasps });
    } finally {
      set({ isLoadingPending: false });
    }
  },

  fetchSentGasps: async () => {
    set({ isLoadingSent: true });
    try {
      const gasps = await gaspsApi.getSentGasps();
      set({ sentGasps: gasps });
    } finally {
      set({ isLoadingSent: false });
    }
  },

  sendBatchGasp: async (data) => {
    const gasps = await gaspsApi.sendBatchGasp(data);
    set((state) => ({ sentGasps: [...gasps, ...state.sentGasps] }));
  },

  viewGasp: async (gaspId) => {
    await gaspsApi.markViewed(gaspId);
    get().markGaspViewed(gaspId);
  },

  createReaction: async (data) => {
    const reaction = await reactionsApi.createReaction(data);
    set((state) => ({ reactions: [reaction, ...state.reactions] }));
    return reaction;
  },
}));
