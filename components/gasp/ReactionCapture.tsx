import { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clampPipPosition,
  parsePipPosition,
  PIP_WIDTH,
  PIP_HEIGHT,
  MARGIN,
} from './pipPosition';

const STORAGE_KEY = '@gasp/reaction-pip-position';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_X = 20;
const DEFAULT_Y = 60;

interface ReactionCaptureProps {
  isActive: SharedValue<number>;
  isVisible?: boolean;
  isRecording?: boolean;
  maxDurationS?: number;
  cameraRef?: React.RefObject<CameraView | null>;
}

async function loadSavedPosition(): Promise<{ x: number; y: number }> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  const parsed = parsePipPosition(raw);
  if (!parsed) return { x: DEFAULT_X, y: DEFAULT_Y };
  return clampPipPosition(parsed.x, parsed.y, SCREEN_WIDTH, SCREEN_HEIGHT);
}

function savePosition(pos: { x: number; y: number }) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pos)).catch(() => {
    // fire-and-forget
  });
}

export function ReactionCapture({ isActive, isVisible = false, isRecording = false, maxDurationS = 30, cameraRef }: ReactionCaptureProps) {
  const translateX = useSharedValue(DEFAULT_X);
  const translateY = useSharedValue(DEFAULT_Y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Countdown timer state: counts down from maxDurationS to 0 while recording
  const [remainingS, setRemainingS] = useState(maxDurationS);

  useEffect(() => {
    if (!isRecording) {
      setRemainingS(maxDurationS);
      return;
    }
    setRemainingS(maxDurationS);
    const interval = setInterval(() => {
      setRemainingS((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, maxDurationS]);

  useEffect(() => {
    loadSavedPosition().then((pos) => {
      translateX.value = pos.x;
      translateY.value = pos.y;
    });
  }, [translateX, translateY]);

  const persist = (x: number, y: number) => {
    savePosition({ x, y });
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const nextX = startX.value + e.translationX;
      const nextY = startY.value + e.translationY;
      translateX.value = Math.max(MARGIN, Math.min(SCREEN_WIDTH - PIP_WIDTH - MARGIN, nextX));
      translateY.value = Math.max(MARGIN, Math.min(SCREEN_HEIGHT - PIP_HEIGHT - MARGIN, nextY));
    })
    .onEnd(() => {
      runOnJS(persist)(translateX.value, translateY.value);
    });

  const isVisibleShared = useSharedValue(isVisible ? 1 : 0);

  useEffect(() => {
    isVisibleShared.value = isVisible ? 1 : 0;
  }, [isVisible, isVisibleShared]);

  const animatedStyle = useAnimatedStyle(() => {
    // Show PiP when visible (permissions granted), animate opacity/scale with isActive
    const visible = isVisibleShared.get();
    const active = isActive.get();
    const opacity = visible === 0 ? 0 : interpolate(active, [0, 1], [0.85, 1]);
    const scale = visible === 0 ? 0 : interpolate(active, [0, 1], [0.9, 1]);
    return {
      opacity,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.cameraWrapper}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
            mode="video"
          />
          <View style={styles.recordingDot} />
          {isRecording && (
            <View style={styles.timerOverlay}>
              <Text style={styles.timerText}>
                {`0:${String(remainingS).padStart(2, '0')}`}
              </Text>
            </View>
          )}
          <View style={styles.dragHandle} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
  },
  cameraWrapper: {
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
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
  timerOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dragHandle: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});
