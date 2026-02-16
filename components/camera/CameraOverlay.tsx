import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraControls } from './CameraControls';
import { CaptureButton } from './CaptureButton';
import { RecentThumbnail } from './RecentThumbnail';
import { EffectsButton } from './EffectsButton';

interface CameraOverlayProps {
  flashMode: 'off' | 'on' | 'auto';
  lastCapturedUri: string | null;
  onToggleFlash: () => void;
  onFlipCamera: () => void;
  onCapture: () => void;
  onOpenGallery?: () => void;
  onOpenEffects?: () => void;
}

export function CameraOverlay({
  flashMode,
  lastCapturedUri,
  onToggleFlash,
  onFlipCamera,
  onCapture,
  onOpenGallery,
  onOpenEffects,
}: CameraOverlayProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Controls */}
      <CameraControls
        flashMode={flashMode}
        onToggleFlash={onToggleFlash}
        onFlipCamera={onFlipCamera}
      />

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 90 }]}>
        <RecentThumbnail uri={lastCapturedUri} onPress={onOpenGallery} />
        <CaptureButton onCapture={onCapture} />
        <EffectsButton onPress={onOpenEffects} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
});
