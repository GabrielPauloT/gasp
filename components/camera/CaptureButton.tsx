import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { lightHaptic, mediumHaptic } from '@/utils/haptics';

interface CaptureButtonProps {
  onCapture: () => void;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
  size?: number;
}

export function CaptureButton({
  onCapture,
  onLongPressStart,
  onLongPressEnd,
  size = 72,
}: CaptureButtonProps) {
  const pressed = useSharedValue(0);
  const recording = useSharedValue(0);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.set(withTiming(1, { duration: 80 }));
      runOnJS(lightHaptic)();
    })
    .onFinalize(() => {
      pressed.set(withTiming(0, { duration: 150 }));
    })
    .onEnd(() => {
      runOnJS(onCapture)();
    });

  const longPress = Gesture.LongPress()
    .minDuration(300)
    .onStart(() => {
      recording.set(withTiming(1, { duration: 200 }));
      runOnJS(mediumHaptic)();
      if (onLongPressStart) {
        runOnJS(onLongPressStart)();
      }
    })
    .onEnd(() => {
      recording.set(withTiming(0, { duration: 200 }));
      if (onLongPressEnd) {
        runOnJS(onLongPressEnd)();
      }
    });

  const gesture = Gesture.Exclusive(longPress, tap);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(pressed.get(), [0, 1], [1, 0.92]),
      },
    ],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(recording.get(), [0, 1], [1, 0.6]),
      },
    ],
    borderRadius: interpolate(recording.get(), [0, 1], [size / 2 - 8, 12]),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.outer,
          { width: size, height: size, borderRadius: size / 2 },
          outerStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.inner,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
            },
            innerStyle,
          ]}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    backgroundColor: '#FFFFFF',
    borderCurve: 'continuous',
  },
});
