import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraControls } from './CameraControls';
import { CaptureButton } from './CaptureButton';
import { RecentThumbnail } from './RecentThumbnail';
import { EffectsButton } from './EffectsButton';

interface CameraOverlayProps {
  flashMode: 'off' | 'on' | 'auto';
  lastCapturedUri: string | null;
  isRecording?: boolean;
  onToggleFlash: () => void;
  onFlipCamera: () => void;
  onCapture: () => void;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
  onOpenGallery?: () => void;
  onOpenEffects?: () => void;
}

export function CameraOverlay({
  flashMode,
  lastCapturedUri,
  onToggleFlash,
  onFlipCamera,
  onCapture,
  isRecording = false,
  onLongPressStart,
  onLongPressEnd,
  onOpenGallery,
  onOpenEffects,
}: CameraOverlayProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Top gradient fade — hidden while recording */}
      {!isRecording && (
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={[styles.topGradient, { paddingTop: insets.top }]}
        >
          <CameraControls
            flashMode={flashMode}
            onToggleFlash={onToggleFlash}
            onFlipCamera={onFlipCamera}
          />
        </LinearGradient>
      )}

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Bottom gradient fade + controls */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={[styles.bottomGradient, { paddingBottom: insets.bottom + 90 }]}
      >
        <View style={[styles.bottomControls, isRecording && styles.bottomControlsRecording]}>
          {!isRecording && <RecentThumbnail uri={lastCapturedUri} onPress={onOpenGallery} />}
          <CaptureButton
            onCapture={onCapture}
            onLongPressStart={onLongPressStart}
            onLongPressEnd={onLongPressEnd}
            isRecording={isRecording}
          />
          {!isRecording && <EffectsButton onPress={onOpenEffects} />}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topGradient: {
    paddingBottom: 24,
  },
  spacer: {
    flex: 1,
  },
  bottomGradient: {
    paddingTop: 40,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  bottomControlsRecording: {
    justifyContent: 'center',
  },
});
