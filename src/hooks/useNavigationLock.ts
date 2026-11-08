import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Prevents double navigation from fast taps (kids tap a lot!).
 *
 *   const guard = useNavigationLock();
 *   onPress={() => guard(() => router.push(...))}
 *
 * The first call runs; every further call is ignored until this screen is
 * focused again (i.e. the child came back to it).
 */
export function useNavigationLock() {
  const locked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
    }, []),
  );

  return useCallback((navigate: () => void) => {
    if (locked.current) return;
    locked.current = true;
    navigate();
  }, []);
}
