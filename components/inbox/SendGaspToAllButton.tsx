import { StyleSheet, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { mediumHaptic } from '@/utils/haptics';

interface SendGaspToAllButtonProps {
  onPress: () => void;
}

export function SendGaspToAllButton({ onPress }: SendGaspToAllButtonProps) {
  const insets = useSafeAreaInsets();
  const pressed = useSharedValue(0);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.set(withTiming(1, { duration: 80 }));
    })
    .onFinalize(() => {
      pressed.set(withTiming(0, { duration: 200 }));
    })
    .onEnd(() => {
      runOnJS(mediumHaptic)();
      runOnJS(onPress)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pressed.get(), [0, 1], [1, 0.96]) },
    ],
  }));

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: insets.bottom + 90 },
      ]}
    >
      <GestureDetector gesture={tap}>
        <Animated.View style={[styles.button, animatedStyle]}>
          <Zap size={18} color="#FFFFFF" fill="#FFFFFF" />
          <Text variant="body" style={styles.text}>
            {'SEND GASP TO ALL'}
          </Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    borderRadius: 26,
    borderCurve: 'continuous',
    // @ts-ignore
    experimental_backgroundImage:
      'linear-gradient(135deg, #7C3AED, #6D28D9)',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
