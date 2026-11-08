import { useCallback, useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { springs } from '@/theme';

/**
 * Idle sway (like a breeze) + a big wiggle on demand, rotating around the
 * bottom of the view (put `transformOrigin: '50% 100%'` on the same view).
 * Used by trees, flowers and anything "planted" in the ground.
 */
export function useSwayWiggle({ swayDeg = 2.5, seed = 0 } = {}) {
  const sway = useSharedValue(0);
  const wiggleAngle = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.inOut(Easing.sin);
    sway.set(
      withDelay(
        (seed * 271) % 1200,
        withRepeat(
          withSequence(
            withTiming(swayDeg, { duration: 1500 + (seed % 5) * 120, easing: ease }),
            withTiming(-swayDeg, { duration: 1500 + (seed % 5) * 120, easing: ease }),
          ),
          -1,
          true,
        ),
      ),
    );
  }, [sway, swayDeg, seed]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value + wiggleAngle.value}deg` }],
  }));

  const wiggle = useCallback(() => {
    wiggleAngle.set(
      withSequence(
        withTiming(14, { duration: 90 }),
        withTiming(-11, { duration: 120 }),
        withTiming(7, { duration: 110 }),
        withTiming(-4, { duration: 100 }),
        withSpring(0, springs.bouncy),
      ),
    );
  }, [wiggleAngle]);

  return { style, wiggle };
}
