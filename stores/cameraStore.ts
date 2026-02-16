import { create } from 'zustand';

type CameraFacing = 'front' | 'back';
type FlashMode = 'off' | 'on' | 'auto';

interface CameraState {
  facing: CameraFacing;
  flashMode: FlashMode;
  isRecording: boolean;
  lastCapturedUri: string | null;

  toggleFacing: () => void;
  cycleFlash: () => void;
  setCapturedUri: (uri: string | null) => void;
  setRecording: (recording: boolean) => void;
}

const FLASH_CYCLE: FlashMode[] = ['off', 'on', 'auto'];

export const useCameraStore = create<CameraState>((set) => ({
  facing: 'back',
  flashMode: 'off',
  isRecording: false,
  lastCapturedUri: null,

  toggleFacing: () =>
    set((state) => ({
      facing: state.facing === 'back' ? 'front' : 'back',
    })),

  cycleFlash: () =>
    set((state) => {
      const currentIndex = FLASH_CYCLE.indexOf(state.flashMode);
      const nextIndex = (currentIndex + 1) % FLASH_CYCLE.length;
      return { flashMode: FLASH_CYCLE[nextIndex] };
    }),

  setCapturedUri: (uri) => set({ lastCapturedUri: uri }),
  setRecording: (isRecording) => set({ isRecording }),
}));
