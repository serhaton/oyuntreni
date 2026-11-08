import { useEffect } from 'react';
import {
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * A shared value swinging smoothly between -1 and 1 forever (sine-like).
 * Drives idle motions: tail wags, ear wiggles, wing flaps, breathing.
 * @param halfPeriodMs time to go from -1 to 1
 * @param seed offsets the start so characters don't move in lockstep
 */
export function useOscillator(halfPeriodMs: number, seed = 0): SharedValue<number> {
  const value = useSharedValue(-1);
  useEffect(() => {
    value.set(
      withDelay(
        (seed * 173) % halfPeriodMs,
        withRepeat(withTiming(1, { duration: halfPeriodMs, easing: Easing.inOut(Easing.sin) }), -1, true),
      ),
    );
  }, [value, halfPeriodMs, seed]);
  return value;
}
