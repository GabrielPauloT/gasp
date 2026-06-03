import { useRef, useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { CameraView } from 'expo-camera';
import { withTiming, type SharedValue } from 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useCloseViewGasp, useCreateReaction } from '@/hooks/queries/useGasps';
import { uploadWithRetry } from '@/services/uploadQueue';
import type { Gasp } from '@/services/api/schemas/gasp.schema';

const MAX_REACTION_DURATION_S = 30;

interface UseViewGaspProps {
  gasp: Gasp | null;
  conversationId: string;
  messageId: string;
  /** Actual gasp media duration in seconds — used for recordAsync maxDuration and PiP timer */
  holdDurationS: number;
  /** Shared value owned by the screen — set to 1 when recording starts, 0 on reset */
  isRevealed: SharedValue<number>;
  startProgressAnimation: () => void;
  resetProgress: () => void;
}

/**
 * Encapsulates all recording, reveal, and reaction-send state for view-gasp.tsx.
 * Extracted to keep the screen component under 200 lines (CLAUDE.md Rule 3).
 */
export function useViewGasp({
  gasp,
  conversationId,
  messageId,
  holdDurationS,
  isRevealed,
  startProgressAnimation,
  resetProgress,
}: UseViewGaspProps) {
  const user = useAuthStore((s) => s.user);
  const { sendMessage } = useChatStore();
  const closeViewMutation = useCloseViewGasp();
  const createReactionMutation = useCreateReaction();

  const reactionCameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const releasedRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isMountedRef = useRef(true);
  const gaspIdRef = useRef<string | null>(null);
  const openedRef = useRef(false);
  const reactionSucceededRef = useRef(false);

  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      recordingPromiseRef.current = null;
      const id = gaspIdRef.current;
      if (id && openedRef.current && !reactionSucceededRef.current) {
        closeViewMutation.mutate(id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHoldStart = useCallback(() => {
    releasedRef.current = false;
    setIsCountingDown(true);
  }, []);

  // Called when the 3-2-1 countdown finishes:
  // 1. Reveal the media (isRevealed → 1)
  // 2. Start the progress ring animation (gasp media duration)
  // 3. Start recording for exactly the gasp media duration (capped at MAX_REACTION_DURATION_S)
  const handleCountdownComplete = useCallback(() => {
    isRevealed.value = withTiming(1, { duration: 300 });
    startProgressAnimation();
    if (!reactionCameraRef.current) return;
    const reactionDurationS = Math.min(holdDurationS, MAX_REACTION_DURATION_S);
    try {
      isRecordingRef.current = true;
      setIsRecording(true);
      recordingPromiseRef.current = reactionCameraRef.current.recordAsync({
        maxDuration: reactionDurationS,
      });
    } catch {
      isRecordingRef.current = false;
      setIsRecording(false);
      recordingPromiseRef.current = null;
    }
  }, [isRevealed, startProgressAnimation, holdDurationS]);

  const handleSendReaction = useCallback(async (uri: string) => {
    const userId = user?.id ?? 'guest';
    uploadWithRetry(uri, 'reactions', userId)
      .then(async (result) => {
        if (!isMountedRef.current) return;
        if (!result.downloadUrl) {
          Sentry.captureException(new Error('uploadReaction returned empty downloadUrl'));
          return;
        }
        if (conversationId) {
          sendMessage(
            conversationId,
            '[Reaction]',
            'reaction',
            result.downloadUrl,
            messageId || undefined,
          );
          reactionSucceededRef.current = true;
        } else if (gasp) {
          await createReactionMutation.mutateAsync({
            gaspId: gasp.id,
            videoUrl: result.downloadUrl,
          });
          reactionSucceededRef.current = true;
        }
      })
      .catch((e) => {
        Sentry.captureException(e);
      });
  }, [gasp, user, createReactionMutation, conversationId, messageId, sendMessage]);

  const handleRelease = useCallback(async () => {
    if (releasedRef.current) return;
    releasedRef.current = true;

    setIsCountingDown(false);

    let videoUri: string | null = null;
    try {
      if (reactionCameraRef.current && isRecordingRef.current) {
        reactionCameraRef.current.stopRecording();
        isRecordingRef.current = false;
        setIsRecording(false);
      }
      if (recordingPromiseRef.current) {
        const result = await recordingPromiseRef.current;
        videoUri = result?.uri ?? null;
      }
    } catch (e) {
      Sentry.captureException(e);
      videoUri = null;
    } finally {
      recordingPromiseRef.current = null;
    }

    if (!isMountedRef.current) return;

    if (videoUri) {
      setPreviewUri(videoUri);
    } else {
      router.back();
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!previewUri) return;
    const uri = previewUri;
    setPreviewUri(null);
    handleSendReaction(uri);
    router.back();
  }, [previewUri, handleSendReaction]);

  // Option A: full reset — user goes back through 3-2-1 for an authentic reaction
  const handleReRecord = useCallback(() => {
    setPreviewUri(null);
    isRevealed.value = withTiming(0, { duration: 200 });
    resetProgress();
    releasedRef.current = false;
  }, [isRevealed, resetProgress]);

  const handleDiscard = useCallback(() => {
    setPreviewUri(null);
    const id = gaspIdRef.current;
    if (id) closeViewMutation.mutate(id);
    router.back();
  }, [closeViewMutation]);

  return {
    reactionCameraRef,
    gaspIdRef,
    openedRef,
    isCountingDown,
    isRecording,
    previewUri,
    /** Actual reaction recording duration in seconds (= gasp duration capped at 30s) */
    reactionDurationS: Math.min(holdDurationS, MAX_REACTION_DURATION_S),
    handleHoldStart,
    handleCountdownComplete,
    handleRelease,
    handleSend,
    handleReRecord,
    handleDiscard,
    MAX_REACTION_DURATION_S,
  };
}
