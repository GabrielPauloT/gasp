import { useRef, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
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
import { colors } from '@/constants/colors';
import type { Gasp, Reaction } from '@/types/gasp';

// ── Mock data (mapeia IDs dos amigos do inbox a gasps) ──────────────
const MOCK_GASPS: Record<string, Gasp> = {
  '1': {
    id: '1',
    senderId: 'user-sarah',
    senderName: 'Sarah',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=1',
    imageUri: 'https://picsum.photos/seed/gasp1/400/800',
    blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  '2': {
    id: '2',
    senderId: 'user-emily',
    senderName: 'Emily',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=5',
    imageUri: 'https://picsum.photos/seed/gasp2/400/800',
    blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  '3': {
    id: '3',
    senderId: 'user-jake',
    senderName: 'Jake',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=3',
    imageUri: 'https://picsum.photos/seed/gasp3/400/800',
    blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  '4': {
    id: '4',
    senderId: 'user-emma',
    senderName: 'Emma',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=9',
    imageUri: 'https://picsum.photos/seed/gasp4/400/800',
    blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  '5': {
    id: '5',
    senderId: 'user-marcus',
    senderName: 'Marcus',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=7',
    imageUri: 'https://picsum.photos/seed/gasp5/400/800',
    blurhash: 'L5H2EC=PM+yV0g-mq.wG9c010J}I',
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  '6': {
    id: '6',
    senderId: 'user-olivia',
    senderName: 'Olivia',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=10',
    imageUri: 'https://picsum.photos/seed/gasp6/400/800',
    blurhash: 'LNAdAqj[00aymkj[TKay00ay~qj[',
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  '7': {
    id: '7',
    senderId: 'user-alex',
    senderName: 'Alex',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=11',
    imageUri: 'https://picsum.photos/seed/gasp7/400/800',
    blurhash: 'LFJH2i-;9FNH~q-;M{M{00D%IUxu',
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  '8': {
    id: '8',
    senderId: 'user-sophia',
    senderName: 'Sophia',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=20',
    imageUri: 'https://picsum.photos/seed/gasp8/400/800',
    blurhash: 'LHB{.OxuD%M{~qRjM{of9FIUayj[',
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
};

// ── Component ───────────────────────────────────────────────────────
export default function ViewGaspScreen() {
  const insets = useSafeAreaInsets();
  const { gaspId } = useLocalSearchParams<{ gaspId: string }>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const reactionCameraRef = useRef<CameraView>(null);
  const user = useAuthStore((s) => s.user);
  const { addReaction, markGaspViewed } = useGaspStore();

  // Resolve gasp data (mock)
  const gasp = MOCK_GASPS[gaspId ?? ''] ?? MOCK_GASPS['1'];

  // ── Captura foto da câmera frontal ───────────────────────────────
  const captureReaction = useCallback(async (): Promise<string | null> => {
    if (!reactionCameraRef.current) return null;
    try {
      const photo = await reactionCameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      return photo?.uri ?? null;
    } catch (error) {
      console.error('Failed to capture reaction:', error);
      return null;
    }
  }, []);

  // ── Quando hold completa (3s) ────────────────────────────────────
  const handleHoldComplete = useCallback(() => {
    // Nada extra — a captura e envio acontecem no release
  }, []);

  // ── Quando solta o dedo — captura e envia automaticamente ────────
  const handleRelease = useCallback(async () => {
    const reactionUri = await captureReaction();

    if (reactionUri) {
      const reaction: Reaction = {
        id: `reaction-${Date.now()}`,
        gaspId: gasp.id,
        reactorId: user?.id ?? 'guest',
        reactorName: user?.displayName ?? 'You',
        reactionImageUri: reactionUri,
        originalImageUri: gasp.imageUri,
        capturedAt: new Date().toISOString(),
      };
      addReaction(reaction);
    }

    markGaspViewed(gasp.id);
    router.back();
  }, [gasp, captureReaction, user, addReaction, markGaspViewed]);

  // ── Gesture hook (controlado no pai) ─────────────────────────────
  const { gesture, isHolding, holdProgress } = useHoldGesture({
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

      {/* Câmera frontal PiP (aparece durante hold) */}
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
