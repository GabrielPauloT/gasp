import { useRef, useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { CameraView } from 'expo-camera';
import { withTiming, type SharedValue } from 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useCloseViewGasp, useCreateReaction } from '@/hooks/queries/useGasps';
import { uploadWithRetry, enqueueUpload, removeFromQueue } from '@/services/uploadQueue';
import { buildCompositePayload, compositeReaction } from '@/services/compositeService';
import type { Gasp } from '@/services/api/schemas/gasp.schema';

const MAX_REACTION_DURATION_S = 30;
// After stopping expo-video, iOS needs ~2s for AVAudioSession to fully release
// before expo-camera can acquire it for recording.
const AVCAPTURE_SETTLE_MS = 2000;

// Backoff delays for sendMessage retries: immediate, 500ms, 1500ms
const SEND_RETRY_DELAYS_MS = [0, 500, 1500];

interface UseViewGaspProps {
  gasp: Gasp | null;
  conversationId: string;
  messageId: string;
  holdDurationS: number;
  isRevealed: SharedValue<number>;
  startProgressAnimation: () => void;
  resetProgress: () => void;
  /** Called to stop the gasp video before recording starts — frees AVCapture session */
  onStopGaspVideo?: () => void;
  /** Remote CDN URL of the original gasp — required for composite payload */
  gaspUrl: string;
}

/** Private helper: sleep for ms milliseconds */
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
  onStopGaspVideo,
  gaspUrl,
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
  // Track background upload so we can cancel it on discard
  const bgUploadQueueIdRef = useRef<string | null>(null);
  // AbortController for in-flight composite HTTP request
  const compositeAbortControllerRef = useRef<AbortController | null>(null);

  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

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

  /** Private helper: retry sendMessage up to maxRetries times with exponential backoff.
   *  The same mediaUrl is preserved across all attempts (never mutated). */
  const sendMessageWithRetry = useCallback(
    async (
      convId: string,
      mediaUrl: string,
      msgId: string,
      maxRetries: number,
    ) => {
      let lastError: unknown;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          const delay = SEND_RETRY_DELAYS_MS[attempt] ?? SEND_RETRY_DELAYS_MS[SEND_RETRY_DELAYS_MS.length - 1];
          await sleep(delay);
        }
        try {
          sendMessage(convId, '[Reaction]', 'reaction', mediaUrl, msgId || undefined);
          return; // success
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError;
    },
    [sendMessage],
  );

  /** Private helper: show a non-blocking toast for composite fallback */
  const showFallbackToast = useCallback(() => {
    Alert.alert(
      'Heads up',
      'Enhanced reaction unavailable — your reaction was sent as a regular video.',
      [{ text: 'OK' }],
    );
  }, []);

  /** Private helper: show upload error toast */
  const showUploadErrorToast = useCallback(() => {
    Alert.alert(
      'Upload failed',
      'Could not upload your reaction. Please try again.',
      [{ text: 'OK' }],
    );
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

    // For image gasps: record immediately after settle delay (no AVCapture conflict).
    // For video gasps: stop video first, then record after a longer settle to
    // let AVAudioSession fully release before expo-camera takes it.
    const startRecording = () => {
      if (!reactionCameraRef.current || releasedRef.current) {
        isRecordingRef.current = false;
        setIsRecording(false);
        return;
      }
      try {
        isRecordingRef.current = true;
        setIsRecording(true);
        recordingPromiseRef.current = reactionCameraRef.current.recordAsync({
          maxDuration: reactionDurationS,
        });
        recordingPromiseRef.current?.catch((e) => {
          Sentry.captureException(e, { tags: { feature: 'reaction-recording' } });
          isRecordingRef.current = false;
          setIsRecording(false);
          recordingPromiseRef.current = null;
        });
      } catch {
        isRecordingRef.current = false;
        setIsRecording(false);
        recordingPromiseRef.current = null;
      }
    };

    // Stop gasp video immediately so VideoView unmounts and releases AVAudioSession.
    // Use a separate signal — NOT isRecording — to avoid remounting the reaction camera.
    onStopGaspVideo?.();
    setTimeout(startRecording, AVCAPTURE_SETTLE_MS);
  }, [isRevealed, startProgressAnimation, holdDurationS, onStopGaspVideo]);

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
      // Start background upload immediately so it's ready when user taps Send
      const userId = user?.id ?? 'guest';
      enqueueUpload(videoUri, 'reactions', userId).then((queueId) => {
        bgUploadQueueIdRef.current = queueId;
      }).catch(() => {});
      setPreviewUri(videoUri);
    } else {
      // Recording returned no URI — camera likely wasn't ready.
      // Show an alert so the user knows what happened instead of silently closing.
      Alert.alert(
        'Recording failed',
        'Could not capture your reaction. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }
  }, [user]);

  /**
   * handleSend — composite flow (Requirement 2.2, 3.5, 4.1, 5.x, 8.x)
   *
   * Order:
   * 1. setIsSending(true) — disables Send button immediately
   * 2. uploadWithRetry → on failure: setIsSending(false), show toast, keep ReactionPreview visible
   * 3. removeFromQueue (bg upload no longer needed — CDN URL obtained)
   * 4. setPreviewUri(null) + router.back() — navigate before composite starts
   * 5. compositeReaction (fire-and-forget from UI perspective) with 8 000ms AbortController
   * 6. On success: sendMessageWithRetry with compositeUrl
   * 7. On composite error/timeout: Sentry log + fallback sendMessage + toast
   * 8. finally: setIsSending(false), clear compositeAbortControllerRef
   */
  const handleSend = useCallback(() => {
    if (!previewUri || isSending) return;
    const localUri = previewUri;
    const userId = user?.id ?? 'guest';

    setIsSending(true);
    // NOTE: router.back() is NOT called here — it fires after upload succeeds

    (async () => {
      try {
        // 1. Foreground upload (bg queue still active as safety net during upload)
        let reactionVideoUrl: string;
        try {
          const result = await uploadWithRetry(localUri, 'reactions', userId);
          if (!result.downloadUrl) {
            throw new Error('uploadWithRetry returned empty downloadUrl');
          }
          reactionVideoUrl = result.downloadUrl;
        } catch (e) {
          // Upload failed — keep ReactionPreview visible, re-enable Send button
          Sentry.captureException(e, {
            tags: { feature: 'super-imposed-reaction', step: 'upload' },
          });
          setIsSending(false);
          showUploadErrorToast();
          return;
        }

        // 2. Upload succeeded — cancel bg queue entry (CDN URL already obtained)
        if (bgUploadQueueIdRef.current) {
          await removeFromQueue(bgUploadQueueIdRef.current).catch(() => {});
          bgUploadQueueIdRef.current = null;
        }

        // 3. Navigate back immediately after upload, before composite job starts
        setPreviewUri(null);
        router.back();

        // 4. Composite request with 8 000ms AbortController timeout (fire-and-forget)
        const controller = new AbortController();
        compositeAbortControllerRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 8_000);
        const payload = buildCompositePayload(reactionVideoUrl, gaspUrl);

        try {
          const { compositeUrl } = await compositeReaction(payload, controller.signal);
          clearTimeout(timeoutId);
          await sendMessageWithRetry(conversationId, compositeUrl, messageId, 3);
          reactionSucceededRef.current = true;
        } catch (e: unknown) {
          clearTimeout(timeoutId);
          const isAbort = e instanceof Error && e.name === 'AbortError';
          if (isAbort) {
            Sentry.captureMessage('Composite job timed out', {
              extra: { durationMs: 8_000, payload },
              tags: { feature: 'super-imposed-reaction' },
            });
          } else {
            Sentry.captureException(e, {
              extra: { payload },
              tags: { feature: 'super-imposed-reaction' },
            });
          }
          // Fallback: send raw reaction video
          sendMessage(
            conversationId,
            '[Reaction]',
            'reaction',
            reactionVideoUrl,
            messageId || undefined,
          );
          reactionSucceededRef.current = true;
          showFallbackToast();
        } finally {
          compositeAbortControllerRef.current = null;
          setIsSending(false);
        }
      } catch (e) {
        // Unexpected outer error
        Sentry.captureException(e, {
          tags: { feature: 'super-imposed-reaction', step: 'outer' },
        });
        setIsSending(false);
      }
    })();
  }, [
    previewUri,
    isSending,
    gaspUrl,
    conversationId,
    messageId,
    user,
    sendMessage,
    sendMessageWithRetry,
    showFallbackToast,
    showUploadErrorToast,
  ]);

  // Option A: full reset — user goes back through 3-2-1 for an authentic reaction
  const handleReRecord = useCallback(() => {
    setPreviewUri(null);
    isRevealed.value = withTiming(0, { duration: 200 });
    resetProgress();
    releasedRef.current = false;
  }, [isRevealed, resetProgress]);

  /**
   * handleDiscard — cancel everything in-flight (Requirement 6.x)
   *
   * Order: router.back() → abort composite → removeFromQueue → closeViewMutation (inbox only)
   */
  const handleDiscard = useCallback(() => {
    router.back();                                              // immediate, non-blocking
    compositeAbortControllerRef.current?.abort();              // cancel composite if in-flight
    compositeAbortControllerRef.current = null;
    if (bgUploadQueueIdRef.current) {
      removeFromQueue(bgUploadQueueIdRef.current).catch(() => {});
      bgUploadQueueIdRef.current = null;
    }
    const id = gaspIdRef.current;
    if (id) closeViewMutation.mutate(id);                      // inbox mode only
  }, [closeViewMutation]);

  return {
    reactionCameraRef,
    gaspIdRef,
    openedRef,
    isCountingDown,
    isRecording,
    previewUri,
    isSending,
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
