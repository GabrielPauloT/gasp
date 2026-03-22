import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Phone, Apple, UserCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';

type AuthButtonVariant = 'phone' | 'apple' | 'guest';

interface AuthButtonProps {
  variant: AuthButtonVariant;
  onPress: () => void;
}

const ICON_MAP = {
  phone: Phone,
  apple: Apple,
  guest: UserCircle,
} as const;

const LABEL_MAP = {
  phone: 'Continue with Phone',
  apple: 'Continue with Apple',
  guest: 'Continue as Guest',
} as const;

export function AuthButton({ variant, onPress }: AuthButtonProps) {
  const pressed = useSharedValue(0);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.set(withTiming(1, { duration: 100 }));
    })
    .onFinalize(() => {
      pressed.set(withTiming(0, { duration: 200 }));
    })
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pressed.get(), [0, 1], [1, 0.97]) },
    ],
    opacity: interpolate(pressed.get(), [0, 1], [1, 0.9]),
  }));

  const Icon = ICON_MAP[variant];
  const label = LABEL_MAP[variant];

  const isPhone = variant === 'phone';
  const isGuest = variant === 'guest';

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          styles.button,
          variant === 'phone' && styles.phoneButton,
          variant === 'apple' && styles.darkButton,
          variant === 'guest' && styles.guestButton,
          animatedStyle,
        ]}
      >
        <View style={styles.content}>
          <Icon
            size={20}
            color={isPhone ? '#000000' : '#FFFFFF'}
            strokeWidth={2}
          />
          <Text
            variant="body"
            style={[
              styles.label,
              { color: isPhone ? '#000000' : '#FFFFFF' },
            ]}
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 60,
    borderRadius: 20,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneButton: {
    backgroundColor: '#FFFFFF',
  },
  darkButton: {
    backgroundColor: 'rgba(24, 24, 36, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 52,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
