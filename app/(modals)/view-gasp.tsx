import { useRef, useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { GestureDetector } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { X, Camera } from 'lucide-react-native';
import { HoldToView } from '@/components/gasp/HoldToView';
import { ReactionCapture } from '@/components/gasp/ReactionCapture';
import { ReactionPreview } from '@/components/gasp/ReactionPreview';
import { RecordingCountdown } from '@/components/gasp/RecordingCountdown';
import { Text } from '@/components/ui/Text';
import { useHoldGesture } from '@/hooks/useHoldGesture';
import { useGaspStore } from '@/stores/gaspStore';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import {
  useOpenGasp,
  useCloseViewGasp,
  useCreateReaction,
  usePendingGasps,
} from '@/hooks/queries/useGasps';
import { uploadReaction } from '@/services/storage';
import { colors } from '@/constants/colors';

const MAX_REACTION_DURATION_S = 30;

export default function ViewGaspScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    gaspId?: string;
    chatImageUri?: string;
    chatSenderName?: string;
    chatMediaType?: string;
    chatBlurhash?: string;
    chatConversationId?: string;
    chatMessageId?: string;
    chatTextOverlay?: string;
  }>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const reactionCameraRef = useRef<CameraView>(null);
  const user = useAuthStore((s) => s.user);
  const { data: pendingGasps = [] } = usePendingGasps();
  const openGaspMutation = useOpenGasp();
  const closeViewMutation = useCloseViewGasp();
  const createReactionMutation = useCreateReaction();
  const { sendMessage } = useChatStore();

  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const releasedRef = useRef(false);
  const openedRef = useRef(false);
  const reactionSucceededRef = useRef(false);
  const gaspIdRef = useRef<string | null>(null);
  const isRecordingRef = useRef(false);
  const isMountedRef = useRef(true);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const gasp = params.gaspId
    ? pendingGasps.find((g) => g.id === params.gaspId) ?? pendingGasps[0]
    : null;

  const imageUri = params.chatImageUri || gasp?.imageUri;
  const senderName = params.chatSenderName || gasp?.senderName || '';
  const mediaType = (params.chatMediaType as 'image' | 'video') || gasp?.mediaType || 'image';
  const blurhash = params.chatBlurhash || gasp?.blurhash;
  const conversationId = params.chatConversationId || '';
  const messageId = params.chatMessageId || '';

  const IMAGE_VIEW_DURATION = 30_000;
  const [holdDuration, setHoldDuration] = useState(
    mediaType === 'video' ? 10_000 : IMAGE_VIEW_DURATION,
  );

  const handleVideoLoad = useCallback((durationMs: number) => {
    setHoldDuration(durationMs);
  }, []);

  // Mark chat gasp viewed locally (UI only)
  useEffect(() => {
    if (messageId && imageUri) {
      useGaspStore.getState().markChatGaspViewed(messageId, imageUri);
    }
  }, [messageId, imageUri]);

  // Open gasp on mount (inbox-mode only)
  useEffect(() => {
    if (gasp && !openedRef.current) {
      openedRef.current = true;
      gaspIdRef.current = gasp.id;
      openGaspMutation.mutate(gasp.id);
    }
  }, [gasp, openGaspMutation]);

  // On unmount: if opened but no reaction sent, close-view to mark as `viewed`
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

  const handleCountdownComplete = useCallback(() => {
    if (!reactionCameraRef.current) return;
    try {
      isRecordingRef.current = true;
      setIsRecording(true);
      recordingPromiseRef.current = reactionCameraRef.current.recordAsync({
        maxDuration: MAX_REACTION_DURATION_S,
      });
    } catch {
      isRecordingRef.current = false;
      setIsRecording(false);
      recordingPromiseRef.current = null;
    }
  }, []);

  const handleSendReaction = useCallback(
    async (uri: string) => {
      const userId = user?.id ?? 'guest';
      uploadReaction(uri, userId)
        .then(async (result) => {
          if (!isMountedRef.current) return;
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
          // Reaction not sent — UX does not block the user; backend marks as `viewed`
          // on unmount via closeViewMutation. Replayable gasp remains accessible.
          Sentry.captureException(e);
        });
    },
    [gasp, user, createReactionMutation, conversationId, messageId, sendMessage],
  );

  const handleRelease = useCallback(async () => {
    if (releasedRef.current) return;
    releasedRef.current = true;

    // Cancel countdown if it hasn't completed yet
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

  const handleReRecord = useCallback(() => {
    setPreviewUri(null);
    releasedRef.current = false;
  }, []);

  const handleDiscard = useCallback(() => {
    setPreviewUri(null);
    const id = gaspIdRef.current;
    if (id) {
      closeViewMutation.mutate(id);
    }
    router.back();
  }, [closeViewMutation]);

  const handleHoldComplete = useCallback(() => {
    handleRelease();
  }, [handleRelease]);

  const { gesture, isHolding, holdProgress } = useHoldGesture({
    onHoldStart: handleHoldStart,
    onHoldComplete: handleHoldComplete,
    onHoldEnd: handleRelease,
    duration: holdDuration,
  });

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleGrantReactionAccess = useCallback(async () => {
    await requestCameraPermission();
    await requestMicPermission();
  }, [requestCameraPermission, requestMicPermission]);

  // All hooks are defined above — safe to early-return after this point
  if (!imageUri) {
    router.back();
    return null;
  }

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.container}>
        <HoldToView
          imageUri={imageUri}
          mediaType={mediaType}
          blurhash={blurhash}
          senderName={senderName}
          isHolding={isHolding}
          holdProgress={holdProgress}
        />
        <View style={styles.permissionOverlay}>
          <View style={styles.permissionCard}>
            <Camera size={40} color={colors.primary} />
            <Text variant="subtitle" style={styles.permissionTitle}>
              {'Camera & Microphone Required'}
            </Text>
            <Text variant="body" style={styles.permissionText}>
              {'GASP needs your front camera and microphone to capture your reaction while viewing'}
            </Text>
            <Pressable
              onPress={handleGrantReactionAccess}
              accessibilityRole="button"
              accessibilityLabel="Grant camera and microphone access"
              style={styles.permissionButton}
            >
              <Text variant="body" style={styles.permissionButtonText}>
                {'Grant Access'}
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close gasp viewer"
          style={[styles.closeButton, { top: insets.top + 12 }]}
        >
          <X size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.gestureArea}>
          <HoldToView
            imageUri={imageUri}
            mediaType={mediaType}
            blurhash={blurhash}
            senderName={senderName}
            textOverlayJson={params.chatTextOverlay}
            isHolding={isHolding}
            holdProgress={holdProgress}
            onVideoLoad={handleVideoLoad}
          />
        </View>
      </GestureDetector>

      <ReactionCapture
        isActive={isHolding}
        isVisible={!!(cameraPermission?.granted && micPermission?.granted)}
        isRecording={isRecording}
        maxDurationS={MAX_REACTION_DURATION_S}
        cameraRef={reactionCameraRef}
      />

      <RecordingCountdown
        isActive={isCountingDown}
        onCountdownComplete={handleCountdownComplete}
      />

      <Pressable
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Close gasp viewer"
        style={[styles.closeButton, { top: insets.top + 12 }]}
      >
        <X size={24} color="#FFFFFF" />
      </Pressable>

      {previewUri !== null && (
        <View style={styles.previewOverlay}>
          <ReactionPreview
            originalImageUri={imageUri}
            reactionVideoUri={previewUri}
            senderName={senderName}
            onSend={handleSend}
            onReRecord={handleReRecord}
            onDiscard={handleDiscard}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gestureArea: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  permissionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 5,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 32,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  permissionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: colors.primary,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
