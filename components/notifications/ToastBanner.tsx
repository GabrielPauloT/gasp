import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useNotificationStore } from "@/stores/notificationStore";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    cancelAnimation,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BANNER_HEIGHT = 72;

export function ToastBanner() {
  const insets = useSafeAreaInsets();
  const activeToast = useNotificationStore((s) => s.activeToast);
  const dequeueToast = useNotificationStore((s) => s.dequeueToast);
  const hiddenY = -(BANNER_HEIGHT + insets.top);
  const translateYSv = useSharedValue(hiddenY);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const dismiss = () => {
    clearTimer();
    dequeueToast();
  };
  const slideOut = () => {
    translateYSv.value = withTiming(hiddenY, { duration: 250 }, (done) => {
      if (done) runOnJS(dismiss)();
    });
  };

  useEffect(() => {
    if (activeToast) {
      translateYSv.value = withSpring(insets.top + 8, {
        damping: 18,
        stiffness: 200,
      });
      timerRef.current = setTimeout(slideOut, 4000);
    } else {
      translateYSv.value = hiddenY;
    }
    return () => {
      clearTimer();
      cancelAnimation(translateYSv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateYSv.value }],
  }));

  const handleTap = () => {
    if (!activeToast) return;
    clearTimer();
    cancelAnimation(translateYSv);
    router.push(("/(modals)/view-gasp?gaspId=" + activeToast.gaspId) as any);
    dequeueToast();
  };

  if (!activeToast) return null;
  const hasBlurhash = Boolean(activeToast.blurhash);

  return (
    <Animated.View
      style={[styles.wrapper, animatedStyle]}
      pointerEvents="box-none"
    >
      <Pressable onPress={handleTap} style={styles.card}>
        {hasBlurhash ? (
          <BlurView intensity={80} tint="dark" style={styles.fill}>
            <Image
              source={activeToast.imageUri}
              placeholder={{ blurhash: activeToast.blurhash }}
              style={styles.bgImg}
              contentFit="cover"
            />
          </BlurView>
        ) : (
          <View style={styles.solid} />
        )}
        <View style={styles.row}>
          <View style={styles.thumbBox}>
            <Image
              source={activeToast.imageUri}
              style={styles.thumbImg}
              contentFit="cover"
            />
          </View>
          <View style={styles.col}>
            <Text variant="caption" weight="600" color={colors.accentCyan}>
              New Gasp
            </Text>
            <Text variant="body" weight="600" numberOfLines={1}>
              {activeToast.senderName}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: BANNER_HEIGHT,
    zIndex: 9999,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  fill: { ...StyleSheet.absoluteFillObject },
  bgImg: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  solid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceElevated,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 12,
  },
  thumbBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  thumbImg: { width: 48, height: 48 },
  col: { flex: 1, justifyContent: "center" },
});
