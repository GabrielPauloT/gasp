/**
 * useViewGasp Tests
 *
 * Verifies the recording/reveal state machine for the gasp viewer screen.
 * Actual camera recording and Reanimated animations run on native threads
 * and cannot be fully unit tested — these tests cover JS-thread state transitions.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useViewGasp } from '@/hooks/useViewGasp';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

// Mock navigation
const mockRouter = require('expo-router').router;

// Mock services/uploadQueue
jest.mock('@/services/uploadQueue', () => ({
  uploadWithRetry: jest.fn(() => Promise.resolve({ downloadUrl: 'https://cdn.test/reaction.mp4' })),
}));

// Mock queries/useGasps
const mockCloseViewMutate = jest.fn();
const mockCreateReactionMutateAsync = jest.fn(() => Promise.resolve());

jest.mock('@/hooks/queries/useGasps', () => ({
  useCloseViewGasp: () => ({ mutate: mockCloseViewMutate }),
  useCreateReaction: () => ({ mutateAsync: mockCreateReactionMutateAsync }),
}));

// Mock stores
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'user-123' } }),
}));

jest.mock('@/stores/chatStore', () => ({
  useChatStore: () => ({ sendMessage: jest.fn() }),
}));

describe('useViewGasp', () => {
  const defaultProps = {
    gasp: null,
    conversationId: '',
    messageId: '',
    isRevealed: { value: 0 },
    startProgressAnimation: jest.fn(),
    resetProgress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    defaultProps.isRevealed = { value: 0 };
    defaultProps.startProgressAnimation = jest.fn();
    defaultProps.resetProgress = jest.fn();
  });

  // ── Return shape ──────────────────────────────────────────────────────────────

  describe('return shape', () => {
    it('returns all expected properties', () => {
      const { result } = renderHook(() => useViewGasp(defaultProps as any));

      expect(result.current.reactionCameraRef).toBeDefined();
      expect(result.current.gaspIdRef).toBeDefined();
      expect(result.current.openedRef).toBeDefined();
      expect(result.current.isCountingDown).toBe(false);
      expect(result.current.isRecording).toBe(false);
      expect(result.current.previewUri).toBeNull();
      expect(typeof result.current.handleHoldStart).toBe('function');
      expect(typeof result.current.handleCountdownComplete).toBe('function');
      expect(typeof result.current.handleRelease).toBe('function');
      expect(typeof result.current.handleSend).toBe('function');
      expect(typeof result.current.handleReRecord).toBe('function');
      expect(typeof result.current.handleDiscard).toBe('function');
      expect(result.current.MAX_REACTION_DURATION_S).toBe(30);
    });
  });

  // ── handleHoldStart ───────────────────────────────────────────────────────────

  describe('handleHoldStart', () => {
    it('sets isCountingDown to true', () => {
      const { result } = renderHook(() => useViewGasp(defaultProps as any));

      act(() => {
        result.current.handleHoldStart();
      });

      expect(result.current.isCountingDown).toBe(true);
    });
  });

  // ── handleCountdownComplete ───────────────────────────────────────────────────

  describe('handleCountdownComplete', () => {
    it('calls startProgressAnimation', () => {
      const { result } = renderHook(() => useViewGasp(defaultProps as any));

      act(() => {
        result.current.handleCountdownComplete();
      });

      expect(defaultProps.startProgressAnimation).toHaveBeenCalledTimes(1);
    });

    it('sets isRecording to true (when cameraRef is available)', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useViewGasp(defaultProps as any));

      // Simulate camera ref being available
      (result.current.reactionCameraRef as any).current = {
        recordAsync: jest.fn(() => Promise.resolve({ uri: 'file://video.mp4' })),
        stopRecording: jest.fn(),
      };

      act(() => {
        result.current.handleCountdownComplete();
      });

      // B3 fix: recordAsync is called after AVCAPTURE_SETTLE_MS (2000ms) delay
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isRecording).toBe(true);
      jest.useRealTimers();
    });
  });

  // ── handleRelease ─────────────────────────────────────────────────────────────

  describe('handleRelease', () => {
    it('sets isCountingDown to false', async () => {
      const { result } = renderHook(() => useViewGasp(defaultProps as any));

      act(() => {
        result.current.handleHoldStart();
      });
      expect(result.current.isCountingDown).toBe(true);

      await act(async () => {
        await result.current.handleRelease();
      });

      expect(result.current.isCountingDown).toBe(false);
    });

    it('navigates back when no video was captured', async () => {
      const { result } = renderHook(() => useViewGasp(defaultProps as any));

      await act(async () => {
        await result.current.handleRelease();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  // ── handleReRecord (Option A: full reset) ─────────────────────────────────────

  describe('handleReRecord', () => {
    it('clears previewUri', () => {
      const { result } = renderHook(() => useViewGasp(defaultProps as any));

      act(() => {
        result.current.handleReRecord();
      });

      expect(result.current.previewUri).toBeNull();
    });

    it('calls resetProgress', () => {
      const { result } = renderHook(() => useViewGasp(defaultProps as any));

      act(() => {
        result.current.handleReRecord();
      });

      expect(defaultProps.resetProgress).toHaveBeenCalledTimes(1);
    });
  });

  // ── handleDiscard ─────────────────────────────────────────────────────────────

  describe('handleDiscard', () => {
    it('navigates back', () => {
      const { result } = renderHook(() => useViewGasp(defaultProps as any));

      act(() => {
        result.current.handleDiscard();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('calls closeViewMutation when gaspId is set', () => {
      const { result } = renderHook(() => useViewGasp(defaultProps as any));

      // Set gaspId as if gasp was opened
      result.current.gaspIdRef.current = 'gasp-123';

      act(() => {
        result.current.handleDiscard();
      });

      expect(mockCloseViewMutate).toHaveBeenCalledWith('gasp-123');
    });
  });
});
