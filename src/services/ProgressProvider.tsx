import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { CatalogId } from '@/data/catalog';
import type { LanguageCode } from '@/i18n/languages';

import {
  EMPTY_PROGRESS,
  loadProgress,
  resetProgress,
  saveProgress,
  TRIP_SIZE,
  type ProgressData,
  type TripEntry,
} from './progress';

/** Result of finishing a full trip: who rode along, and which stickers are new. */
export interface TripResult {
  passengers: TripEntry[];
  newStickers: CatalogId[];
}

interface ProgressContextValue {
  isCompleted: (language: LanguageCode, stationId: string) => boolean;
  /** Mark a station as finished (saved immediately). */
  markCompleted: (language: LanguageCode, stationId: string) => void;
  /** Collected album stickers. */
  stickers: CatalogId[];
  /** Put a passenger on the trip train. */
  addToTrip: (entry: TripEntry) => void;
  /** True when the trip train has TRIP_SIZE passengers: time to celebrate. */
  isTripFull: () => boolean;
  /**
   * Ends the full trip: every character on it becomes an album sticker and
   * the trip train is emptied. Returns who rode along and what's new.
   */
  takeTrip: () => TripResult;
  /** Forget all progress (parents' settings, stage 11). */
  reset: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

/** Keeps progress in memory for instant UI updates and mirrors it to storage. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProgressData>(EMPTY_PROGRESS);
  // Latest data for synchronous reads (e.g. "is the trip full?" right after adding).
  const latest = useRef(data);

  const update = useCallback((next: ProgressData) => {
    latest.current = next;
    setData(next);
    void saveProgress(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadProgress().then((loaded) => {
      if (cancelled) return;
      latest.current = loaded;
      setData(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const markCompleted = useCallback(
    (language: LanguageCode, stationId: string) => {
      const prev = latest.current;
      const list = prev.completed[language] ?? [];
      if (list.includes(stationId)) return;
      update({ ...prev, completed: { ...prev.completed, [language]: [...list, stationId] } });
    },
    [update],
  );

  const addToTrip = useCallback(
    (entry: TripEntry) => {
      const prev = latest.current;
      if (prev.trip.length >= TRIP_SIZE) return;
      update({ ...prev, trip: [...prev.trip, entry] });
    },
    [update],
  );

  const isTripFull = useCallback(() => latest.current.trip.length >= TRIP_SIZE, []);

  const takeTrip = useCallback((): TripResult => {
    const prev = latest.current;
    const passengers = prev.trip;
    const newStickers: CatalogId[] = [];
    for (const p of passengers) {
      if (p.kind === 'catalog' && !prev.stickers.includes(p.id) && !newStickers.includes(p.id)) newStickers.push(p.id);
    }
    update({ ...prev, stickers: [...prev.stickers, ...newStickers], trip: [] });
    return { passengers, newStickers };
  }, [update]);

  const reset = useCallback(() => {
    latest.current = EMPTY_PROGRESS;
    setData(EMPTY_PROGRESS);
    void resetProgress();
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      isCompleted: (language, stationId) => data.completed[language]?.includes(stationId) ?? false,
      markCompleted,
      stickers: data.stickers,
      addToTrip,
      isTripFull,
      takeTrip,
      reset,
    }),
    [data, markCompleted, addToTrip, isTripFull, takeTrip, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
