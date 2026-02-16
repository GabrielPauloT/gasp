import { create } from 'zustand';
import type { Gasp, Reaction } from '@/types/gasp';

interface GaspState {
  pendingGasps: Gasp[];
  sentGasps: Gasp[];
  reactions: Reaction[];
  currentViewingGasp: Gasp | null;
  isHolding: boolean;
  holdProgress: number;

  setCurrentGasp: (gasp: Gasp | null) => void;
  setHolding: (holding: boolean) => void;
  setHoldProgress: (progress: number) => void;
  addPendingGasp: (gasp: Gasp) => void;
  markGaspViewed: (gaspId: string) => void;
  addSentGasp: (gasp: Gasp) => void;
  addReaction: (reaction: Reaction) => void;
  setPendingGasps: (gasps: Gasp[]) => void;
  setSentGasps: (gasps: Gasp[]) => void;
}

export const useGaspStore = create<GaspState>((set) => ({
  pendingGasps: [],
  sentGasps: [],
  reactions: [],
  currentViewingGasp: null,
  isHolding: false,
  holdProgress: 0,

  setCurrentGasp: (gasp) => set({ currentViewingGasp: gasp }),

  setHolding: (isHolding) => set({ isHolding }),

  setHoldProgress: (holdProgress) => set({ holdProgress }),

  addPendingGasp: (gasp) =>
    set((state) => ({
      pendingGasps: [gasp, ...state.pendingGasps],
    })),

  markGaspViewed: (gaspId) =>
    set((state) => ({
      pendingGasps: state.pendingGasps.map((g) =>
        g.id === gaspId
          ? { ...g, status: 'viewed' as const, viewedAt: new Date().toISOString() }
          : g
      ),
    })),

  addSentGasp: (gasp) =>
    set((state) => ({
      sentGasps: [gasp, ...state.sentGasps],
    })),

  addReaction: (reaction) =>
    set((state) => ({
      reactions: [reaction, ...state.reactions],
    })),

  setPendingGasps: (pendingGasps) => set({ pendingGasps }),
  setSentGasps: (sentGasps) => set({ sentGasps }),
}));
