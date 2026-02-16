import { StyleSheet, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/Text';
import { GaspTimer } from './GaspTimer';
import Animated, {
  useAnimatedStyle,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HoldToViewProps {
  imageUri: string;
  blurhash?: string;
  senderName: string;
  /** Shared value controlado pelo pai (0 = não segurando, 1 = segurando) */
  isHolding: SharedValue<number>;
  /** Shared value controlado pelo pai (0 a 1, progresso do hold) */
  holdProgress: SharedValue<number>;
}

export function HoldToView({
  imageUri,
  blurhash,
  senderName,
  isHolding,
  holdProgress,
}: HoldToViewProps) {
  const imageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isHolding.get(), [0, 1], [0, 1]),
  }));

  const instructionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isHolding.get(), [0, 1], [1, 0]),
    transform: [
      { scale: interpolate(isHolding.get(), [0, 1], [1, 0.9]) },
    ],
  }));

  const timerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isHolding.get(), [0, 1], [0, 1]),
  }));

  return (
    <View style={styles.container}>
      {/* Blurred preview (always visible) */}
      <Image
        source={{ uri: imageUri }}
        placeholder={blurhash ? { blurhash } : undefined}
        style={styles.blurredImage}
        contentFit="cover"
        blurRadius={30}
      />

      {/* Revealed image (visible on hold) */}
      <Animated.View style={[styles.revealedContainer, imageStyle]}>
        <Image
          source={{ uri: imageUri }}
          style={styles.revealedImage}
          contentFit="cover"
          transition={200}
        />
      </Animated.View>

      {/* Hold instruction overlay */}
      <Animated.View style={[styles.instructionOverlay, instructionStyle]}>
        <GaspTimer progress={holdProgress} size={100} strokeWidth={3} />
        <Text variant="subtitle" style={styles.senderName}>
          {senderName}
        </Text>
        <Text variant="caption" style={styles.instruction}>
          {'HOLD TO VIEW'}
        </Text>
      </Animated.View>

      {/* Timer during hold */}
      <Animated.View style={[styles.timerContainer, timerStyle]}>
        <GaspTimer progress={holdProgress} size={60} strokeWidth={3} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  blurredImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  revealedContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  revealedImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  instructionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    gap: 16,
  },
  senderName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instruction: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 3,
  },
  timerContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
});
