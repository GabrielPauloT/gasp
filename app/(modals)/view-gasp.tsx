import { useRef, useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { GestureDetector } from 'react-native-gesture-handler';
import { X, Camera } from 'lucide-react-native';
import { HoldToView } from '@/components/gasp/HoldToView';
import { ReactionCapture } from '@/components/gasp/ReactionCapture';
import { Text } from '@/components/ui/Text';
import { useHoldGesture } from '@/hooks/useHoldGesture';
import { useGaspStore } from '@/stores/gaspStore';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { uploadReaction } from '@/services/storage';
import { colors } from '@/constants/colors';

// ── Component ───────────────────────────────────────────────────────
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
  const pendingGasps = useGaspStore((s) => s.pendingGasps);
  const { viewGasp, createReaction } = useGaspStore();
  const { sendMessage } = useChatStore();

  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

  // ── Unified data resolution ──────────────────────────────────────
  // All callers now use openGaspViewer() which passes chatImageUri etc.
  // Legacy inbox path with gaspId still supported as fallback.
  const gasp = params.gaspId
    ? pendingGasps.find((g) => g.id === params.gaspId) ?? pendingGasps[0]
    : null;

  const imageUri = params.chatImageUri || gasp?.imageUri;
  const senderName = params.chatSenderName || gasp?.senderName || '';
  const mediaType = (params.chatMediaType as 'image' | 'video') || gasp?.mediaType || 'image';
  const blurhash = params.chatBlurhash || gasp?.blurhash;
  const conversationId = params.chatConversationId || '';
  const messageId = params.chatMessageId || '';
  const isFromChat = !!conversationId;

  const IMAGE_VIEW_DURATION = 30_000;
  const [holdDuration, setHoldDuration] = useState(
    mediaType === 'video' ? 10_000 : IMAGE_VIEW_DURATION,
  );

  const handleVideoLoad = useCallback((durationMs: number) => {
    setHoldDuration(durationMs);
  }, []);

  if (!imageUri) {
    router.back();
    return null;
  }

  // Mark chat gasp as viewed when modal mounts
  useEffect(() => {
    if (messageId) {
      useGaspStore.getState().markChatGaspViewed(messageId);
    }
  }, [messageId]);

  // ── Começa a gravar quando o hold inicia ─────────────────────────
  const handleHoldStart = useCallback(() => {
    if (!reactionCameraRef.current) return;
    try {
      recordingPromiseRef.current = reactionCameraRef.current.recordAsync({
        maxDuration: Math.ceil(holdDuration / 1000),
      });
    } catch {
      recordingPromiseRef.current = null;
    }
  }, [holdDuration]);

  // ── Quando solta o dedo — para gravação, faz upload e envia ─────
  const handleRelease = useCallback(async () => {
    const userId = user?.id ?? 'guest';
    let videoUri: string | null = null;

    // Stop recording and get the video URI
    try {
      if (reactionCameraRef.current) {
        reactionCameraRef.current.stopRecording();
      }
      if (recordingPromiseRef.current) {
        const result = await recordingPromiseRef.current;
        videoUri = result?.uri ?? null;
      }
    } catch {
      videoUri = null;
    } finally {
      recordingPromiseRef.current = null;
    }

    if (videoUri) {
      uploadReaction(videoUri, userId)
        .then((result) => {
          if (conversationId) {
            // From chat: send reaction as a chat message with replyToId
            sendMessage(
              conversationId,
              '[Reaction]',
              'reaction',
              result.downloadUrl,
              messageId || undefined,
            );
          } else if (gasp) {
            // From inbox: use the gasps/reactions API
            return createReaction({
              gaspId: gasp.id,
              videoUrl: result.downloadUrl,
            });
          }
        })
        .catch(() => {
          Alert.alert(
            'Reaction not sent',
            'Your reaction video could not be uploaded. Please try again.',
            [{ text: 'OK' }]
          );
        });
    }

    // Mark gasp as viewed on backend (inbox mode only)
    if (gasp) {
      viewGasp(gasp.id).catch(() => {
        // Silent fail — already viewed locally
      });
    }
    router.back();
  }, [gasp, user, viewGasp, createReaction, conversationId, messageId, sendMessage]);

  // ── Quando timer completa — auto-release ────────────────────────
  const handleHoldComplete = useCallback(() => {
    handleRelease();
  }, [handleRelease]);

  // ── Gesture hook ───────────────────────────────────────────────────
  const { gesture, isHolding, holdProgress } = useHoldGesture({
    onHoldStart: handleHoldStart,
    onHoldComplete: handleHoldComplete,
    onHoldEnd: handleRelease,
    duration: holdDuration,
  });

  const handleClose = () => {
    router.back();
  };

  const handleGrantReactionAccess = async () => {
    await requestCameraPermission();
    await requestMicPermission();
  };

  // ── Permissão de câmera/mic não concedida ──────────────────────────
  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.container}>
        {/* Mostra gasp borrado como background */}
        <HoldToView
          imageUri={imageUri}
          mediaType={mediaType}
          blurhash={blurhash}
          senderName={senderName}
          isHolding={isHolding}
          holdProgress={holdProgress}
        />

        {/* Overlay de permissão */}
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
              style={styles.permissionButton}
            >
              <Text variant="body" style={styles.permissionButtonText}>
                {'Grant Access'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Close button */}
        <Pressable
          onPress={handleClose}
          style={[styles.closeButton, { top: insets.top + 12 }]}
        >
          <X size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  // ── Tela principal com gesture ───────────────────────────────────
  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.gestureArea}>
          {/* Mídia com blur/reveal */}
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

      {/* Câmera frontal PiP (aparece durante hold — grava vídeo) */}
      <ReactionCapture
        isActive={isHolding}
        cameraRef={reactionCameraRef}
      />

      {/* Close button */}
      <Pressable
        onPress={handleClose}
        style={[styles.closeButton, { top: insets.top + 12 }]}
      >
        <X size={24} color="#FFFFFF" />
      </Pressable>
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
