import { useEffect } from 'react';
import {
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { durations } from '@/theme';

/**
 * Idle eye blink. Returns a shared value: 1 = eyes open, ~0.1 = closed.
 * `seed` offsets the timing so characters on screen don't blink in sync.
 */
export function useBlink(seed = 0): SharedValue<number> {
  const openness = useSharedValue(1);

  useEffect(() => {
    const pause = durations.blinkInterval + (seed * 397) % 1500;
    openness.set(
      withDelay(
        (seed * 613) % 2000,
        withRepeat(
          withSequence(
            withDelay(pause, withTiming(0.1, { duration: 70 })),
            withTiming(1, { duration: 90 }),
          ),
          -1,
        ),
      ),
    );
  }, [openness, seed]);

  return openness;
}
