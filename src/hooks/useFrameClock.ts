import { useEffect } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * A shared value that grows by `rate` units every second, updated on the UI
 * thread each frame. `rate` can be a number or a shared value (so speed can be
 * animated, e.g. the train speeding up after a whistle). Examples:
 *   const seconds = useFrameClock(1);       // time, for drifting clouds
 *   const scroll  = useFrameClock(speedSV); // distance travelled by the train
 * Pass `running = false` to pause it (e.g. while its screen is hidden); it
 * resumes where it stopped.
 */
export function useFrameClock(
  rate: number | SharedValue<number>,
  running = true,
): SharedValue<number> {
  const value = useSharedValue(0);

  const callback = useFrameCallback((frame) => {
    // Clamp dt so returning from background doesn't make things jump.
    const dt = Math.min((frame.timeSincePreviousFrame ?? 0) / 1000, 0.1);
    const unitsPerSecond = typeof rate === 'number' ? rate : rate.value;
    value.set(value.get() + dt * unitsPerSecond);
  }, running);

  // `useFrameCallback`'s second argument only sets the initial state, so
  // later changes of `running` must be applied explicitly.
  useEffect(() => {
    callback.setActive(running);
  }, [callback, running]);

  return value;
}
