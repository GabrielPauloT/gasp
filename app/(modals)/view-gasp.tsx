import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useSharedValue } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { X, Camera } from 'lucide-react-native';
import { HoldToView } from '@/components/gasp/HoldToView';
import { ReactionCapture } from '@/components/gasp/ReactionCapture';
import { ReactionPreview } from '@/components/gasp/ReactionPreview';
import { RecordingCountdown } from '@/components/gasp/RecordingCountdown';
import { Text } from '@/components/ui/Text';
import { useHoldGesture } from '@/hooks/useHoldGesture';
import { useViewGasp } from '@/hooks/useViewGasp';
import { useGaspStore } from '@/stores/gaspStore';
import { useOpenGasp, usePendingGasps } from '@/hooks/queries/useGasps';
import { colors } from '@/constants/colors';

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
  const { data: pendingGasps = [] } = usePendingGasps();
  const openGaspMutation = useOpenGasp();

  const gasp = params.gaspId
    ? pendingGasps.find((g) => g.id === params.gaspId) ?? pendingGasps[0]
    : null;

  const imageUri = params.chatImageUri || gasp?.imageUri;
  const senderName = params.chatSenderName || gasp?.senderName || '';
  const mediaType = (params.chatMediaType as 'image' | 'video') || gasp?.mediaType || 'image';
  const blurhash = params.chatBlurhash || gasp?.blurhash;
  const conversationId = params.chatConversationId || '';
  const messageId = params.chatMessageId || '';

  // Image gasps: 10s fixed. Video gasps: actual video duration (set by onVideoLoad).
  // Both capped at MAX_REACTION_DURATION_S (30s) inside useViewGasp.
  const IMAGE_VIEW_DURATION = 10_000;
  const [holdDuration, setHoldDuration] = useState(
    mediaType === 'video' ? 10_000 : IMAGE_VIEW_DURATION,
  );
  const handleVideoLoad = useCallback((durationMs: number) => {
    setHoldDuration(durationMs);
  }, []);

  // Owned here so it can be passed to both useViewGasp and HoldToView.
  // 0 = hidden (blurred), 1 = revealed. Set to 1 after countdown, reset on re-record.
  const isRevealed = useSharedValue(0);

  // Stable refs so useViewGasp can call startProgressAnimation/resetProgress
  // that are only defined after useHoldGesture runs below.
  const startProgressRef = useRef<() => void>(() => {});
  const resetProgressRef = useRef<() => void>(() => {});
  const stableStartProgress = useCallback(() => startProgressRef.current(), []);
  const stableResetProgress = useCallback(() => resetProgressRef.current(), []);

  const {
    reactionCameraRef,
    gaspIdRef,
    openedRef,
    isCountingDown,
    isRecording,
    previewUri,
    reactionDurationS,
    handleHoldStart,
    handleCountdownComplete,
    handleRelease,
    handleSend,
    handleReRecord,
    handleDiscard,
  } = useViewGasp({
    gasp,
    conversationId,
    messageId,
    holdDurationS: Math.ceil(holdDuration / 1000),
    isRevealed,
    startProgressAnimation: stableStartProgress,
    resetProgress: stableResetProgress,
  });

  const { gesture, isHolding, holdProgress, startProgressAnimation, resetProgress } =
    useHoldGesture({
      onHoldStart: handleHoldStart,
      onHoldComplete: handleRelease,
      onHoldEnd: handleRelease,
      duration: holdDuration,
    });

  // Keep stable refs pointing at the live implementations.
  useEffect(() => {
    startProgressRef.current = startProgressAnimation;
    resetProgressRef.current = resetProgress;
  }, [startProgressAnimation, resetProgress]);

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
  }, [gasp, openGaspMutation, openedRef, gaspIdRef]);

  const handleClose = useCallback(() => { router.back(); }, []);

  const handleGrantReactionAccess = useCallback(async () => {
    await requestCameraPermission();
    await requestMicPermission();
  }, [requestCameraPermission, requestMicPermission]);

  if (!imageUri) { router.back(); return null; }

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.container}>
        <HoldToView imageUri={imageUri} mediaType={mediaType} blurhash={blurhash}
          senderName={senderName} isHolding={isHolding} holdProgress={holdProgress}
          isRevealed={isRevealed} />
        <View style={styles.permissionOverlay}>
          <View style={styles.permissionCard}>
            <Camera size={40} color={colors.primary} />
            <Text variant="subtitle" style={styles.permissionTitle}>{'Camera & Microphone Required'}</Text>
            <Text variant="body" style={styles.permissionText}>{'GASP needs your front camera and microphone to capture your reaction while viewing'}</Text>
            <Pressable onPress={handleGrantReactionAccess} accessibilityRole="button"
              accessibilityLabel="Grant camera and microphone access" style={styles.permissionButton}>
              <Text variant="body" style={styles.permissionButtonText}>{'Grant Access'}</Text>
            </Pressable>
          </View>
        </View>
        <Pressable onPress={handleClose} accessibilityRole="button"
          accessibilityLabel="Close gasp viewer" style={[styles.closeButton, { top: insets.top + 12 }]}>
          <X size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.gestureArea}>
          <HoldToView imageUri={imageUri} mediaType={mediaType} blurhash={blurhash}
            senderName={senderName} textOverlayJson={params.chatTextOverlay}
            isHolding={isHolding} holdProgress={holdProgress} isRevealed={isRevealed}
            onVideoLoad={handleVideoLoad} />
        </View>
      </GestureDetector>
      <ReactionCapture isActive={isHolding}
        isVisible={!!(cameraPermission?.granted && micPermission?.granted)}
        isRecording={isRecording} maxDurationS={reactionDurationS}
        cameraRef={reactionCameraRef} />
      <RecordingCountdown isActive={isCountingDown} onCountdownComplete={handleCountdownComplete} />
      <Pressable onPress={handleClose} accessibilityRole="button"
        accessibilityLabel="Close gasp viewer" style={[styles.closeButton, { top: insets.top + 12 }]}>
        <X size={24} color="#FFFFFF" />
      </Pressable>
      {previewUri !== null && (
        <View style={styles.previewOverlay}>
          <ReactionPreview originalImageUri={imageUri} reactionVideoUri={previewUri}
            senderName={senderName} onSend={handleSend} onReRecord={handleReRecord}
            onDiscard={handleDiscard} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gestureArea: { flex: 1 },
  closeButton: {
    position: 'absolute', right: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  previewOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  permissionOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, zIndex: 5,
  },
  permissionCard: {
    backgroundColor: colors.surface, borderRadius: 24, borderCurve: 'continuous',
    padding: 32, alignItems: 'center', gap: 12, width: '100%',
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  permissionText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  permissionButton: {
    marginTop: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28,
    borderCurve: 'continuous', backgroundColor: colors.primary, width: '100%', alignItems: 'center',
  },
  permissionButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
