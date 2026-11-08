import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/**
 * True while the screen this component is on is the visible one. Screens
 * further down the navigation stack stay mounted; use this to pause their
 * per-frame work (scrolling scenery, drifting clouds, chimney smoke) so only
 * the visible screen spends battery on animation.
 */
export function useScreenFocused(): boolean {
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}
