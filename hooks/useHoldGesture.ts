import { useCallback, useRef } from 'react';
import {
  useSharedValue,
  withTiming,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { HOLD_DURATION_MS } from '@/constants/animations';
import { heavyHaptic, successHaptic } from '@/utils/haptics';

interface UseHoldGestureProps {
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  onHoldComplete?: () => void;
  duration?: number;
}

export function useHoldGesture({
  onHoldStart,
  onHoldEnd,
  onHoldComplete,
  duration = HOLD_DURATION_MS,
}: UseHoldGestureProps = {}) {
  const isHolding = useSharedValue(0);
  const holdProgress = useSharedValue(0);
  const holdCompleteRef = useRef(false);

  const handleHoldStart = useCallback(() => {
    holdCompleteRef.current = false;
    heavyHaptic();
    onHoldStart?.();
  }, [onHoldStart]);

  const handleHoldEnd = useCallback(() => {
    onHoldEnd?.();
  }, [onHoldEnd]);

  const handleHoldComplete = useCallback(() => {
    if (!holdCompleteRef.current) {
      holdCompleteRef.current = true;
      successHaptic();
      onHoldComplete?.();
    }
  }, [onHoldComplete]);

  const gesture = Gesture.LongPress()
    .minDuration(0)
    .onStart(() => {
      isHolding.set(1);
      holdProgress.set(
        withTiming(1, { duration }, (finished) => {
          if (finished) {
            runOnJS(handleHoldComplete)();
          }
        })
      );
      runOnJS(handleHoldStart)();
    })
    .onEnd(() => {
      isHolding.set(0);
      cancelAnimation(holdProgress);
      holdProgress.set(withTiming(0, { duration: 200 }));
      runOnJS(handleHoldEnd)();
    });

  return {
    gesture,
    isHolding,
    holdProgress,
  };
}
