import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A boolean that turns on when triggered and switches itself off after
 * `durationMs`. Used for short "happy" reactions (big smile after a tap).
 * Triggering again while on simply restarts the timer.
 */
export function useTemporaryFlag(durationMs: number): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOn(true);
    timer.current = setTimeout(() => setOn(false), durationMs);
  }, [durationMs]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return [on, trigger];
}
