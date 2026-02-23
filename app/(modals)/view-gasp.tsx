import { useRef, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GestureDetector } from 'react-native-gesture-handler';
import { X, Camera } from 'lucide-react-native';
import { HoldToView } from '@/components/gasp/HoldToView';
import { ReactionCapture } from '@/components/gasp/ReactionCapture';
import { Text } from '@/components/ui/Text';
import { useHoldGesture } from '@/hooks/useHoldGesture';
import { useGaspStore } from '@/stores/gaspStore';
import { useAuthStore } from '@/stores/authStore';
import { uploadReaction } from '@/services/storage';
import { colors } from '@/constants/colors';

// ── Component ───────────────────────────────────────────────────────
export default function ViewGaspScreen() {
  const insets = useSafeAreaInsets();
  const { gaspId } = useLocalSearchParams<{ gaspId: string }>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const reactionCameraRef = useRef<CameraView>(null);
  const user = useAuthStore((s) => s.user);
  const pendingGasps = useGaspStore((s) => s.pendingGasps);
  const { addReaction, viewGasp, createReaction } = useGaspStore();

  // Tracks the recording promise so we can await the video URI on release
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

  // Resolve gasp data from store
  const gasp = pendingGasps.find((g) => g.id === gaspId) ?? pendingGasps[0];

  if (!gasp) {
    router.back();
    return null;
  }

  // ── Começa a gravar quando o hold inicia ─────────────────────────
  const handleHoldStart = useCallback(() => {
    if (!reactionCameraRef.current) return;
    try {
      // recordAsync returns a promise that resolves when recording stops
      recordingPromiseRef.current = reactionCameraRef.current.recordAsync({
        maxDuration: 10,
      });
    } catch {
      recordingPromiseRef.current = null;
    }
  }, []);

  // ── Quando hold completa (3s) ────────────────────────────────────
  const handleHoldComplete = useCallback(() => {
    // Nada extra — o stop acontece no release
  }, []);

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
      // Upload reaction video to Firebase Storage, then save to backend
      uploadReaction(videoUri, userId)
        .then((result) => {
          return createReaction({
            gaspId: gasp.id,
            videoUrl: result.downloadUrl,
          });
        })
        .catch(() => {
          Alert.alert(
            'Reaction not sent',
            'Your reaction video could not be uploaded. Please try again.',
            [{ text: 'OK' }]
          );
        });
    }

    // Mark gasp as viewed on backend
    viewGasp(gasp.id).catch(() => {
      // Silent fail — already viewed locally
    });
    router.back();
  }, [gasp, user, viewGasp, createReaction]);

  // ── Gesture hook ───────────────────────────────────────────────────
  const { gesture, isHolding, holdProgress } = useHoldGesture({
    onHoldStart: handleHoldStart,
    onHoldComplete: handleHoldComplete,
    onHoldEnd: handleRelease,
  });

  const handleClose = () => {
    router.back();
  };

  // ── Permissão de câmera não concedida ────────────────────────────
  if (!cameraPermission?.granted) {
    return (
      <View style={styles.container}>
        {/* Mostra gasp borrado como background */}
        <HoldToView
          imageUri={gasp.imageUri}
          blurhash={gasp.blurhash}
          senderName={gasp.senderName}
          isHolding={isHolding}
          holdProgress={holdProgress}
        />

        {/* Overlay de permissão */}
        <View style={styles.permissionOverlay}>
          <View style={styles.permissionCard}>
            <Camera size={40} color={colors.primary} />
            <Text variant="subtitle" style={styles.permissionTitle}>
              {'Camera Required'}
            </Text>
            <Text variant="body" style={styles.permissionText}>
              {'GASP needs your front camera to capture your reaction while viewing'}
            </Text>
            <Pressable
              onPress={requestCameraPermission}
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
          {/* Imagem com blur/reveal */}
          <HoldToView
            imageUri={gasp.imageUri}
            blurhash={gasp.blurhash}
            senderName={gasp.senderName}
            isHolding={isHolding}
            holdProgress={holdProgress}
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
