import { StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';
import Animated, {
  useAnimatedStyle,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';

interface ReactionCaptureProps {
  isActive: SharedValue<number>;
  cameraRef?: React.RefObject<CameraView | null>;
}

export function ReactionCapture({ isActive, cameraRef }: ReactionCaptureProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isActive.get(), [0, 1], [0, 1]),
    transform: [
      { scale: interpolate(isActive.get(), [0, 1], [0.8, 1]) },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          mode="video"
        />
        <View style={styles.recordingDot} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  cameraWrapper: {
    width: 120,
    height: 160,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  recordingDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
