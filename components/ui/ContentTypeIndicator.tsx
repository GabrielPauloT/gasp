import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { resolveIndicatorColor } from '@/services/notificationHelpers';

interface ContentTypeIndicatorProps {
  type: 'chat' | 'gasp' | 'reaction';
  pulsing?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Color-coded unread dot that differentiates content type:
 * - purple  → chat message
 * - red     → gasp (urgent/ephemeral, can pulse)
 * - cyan    → reaction received
 *
 * Pulse animation runs entirely on the UI thread via Reanimated.
 */
export function ContentTypeIndicator({
  type,
  pulsing = false,
  size = 'sm',
}: ContentTypeIndicatorProps) {
  const scale = useSharedValue(1);
  const dotSize = size === 'md' ? 10 : 8;
  const color = resolveIndicatorColor(type);

  useEffect(() => {
    if (pulsing) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 150 }),
          withTiming(1.0, { duration: 850 }),
        ),
        -1, // infinite
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1.0, { duration: 150 });
    }

    return () => {
      cancelAnimation(scale);
    };
  }, [pulsing, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        animatedStyle,
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
        },
      ]}
      accessibilityLabel={`${type} unread`}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    // dimensions and color applied dynamically
  },
});
