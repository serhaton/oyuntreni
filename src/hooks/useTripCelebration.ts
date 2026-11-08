import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useProgress } from '@/services/ProgressProvider';

/** Short pause so the screen has finished appearing before the celebration slides in. */
const DELAY_MS = 400;

/**
 * Opens the celebration whenever this screen comes into view while the trip
 * train is full. Stations normally do this themselves when they finish, but
 * leaving a station early (back button during its ending) skips that; without
 * this the train would stay full forever and no stickers would ever be added.
 */
export function useTripCelebration() {
  const { isTripFull } = useProgress();
  useFocusEffect(
    useCallback(() => {
      if (!isTripFull()) return;
      const timer = setTimeout(() => {
        if (isTripFull()) router.push('/celebration');
      }, DELAY_MS);
      return () => clearTimeout(timer);
    }, [isTripFull]),
  );
}
