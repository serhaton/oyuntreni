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
import { getStationById, stationPassenger } from '@/data/stations';
import { isLanguageCode, type LanguageCode } from '@/i18n/languages';

import {
  EMPTY_PROGRESS,
  loadProgress,
  resetProgress,
  saveProgress,
  TRIP_SIZE,
  type ProgressData,
  type TripEntry,
} from './progress';

/**
 * Every finished station's friend belongs in the album. Passengers could get
 * lost (e.g. a station finished while the trip train was already full and its
 * celebration was skipped), so on start-up any missing sticker of a completed
 * station is added. Passengers still riding the trip train are left for their
 * celebration.
 */
function addMissingStickers(data: ProgressData): ProgressData {
  let stickers = data.stickers;
  for (const [language, ids] of Object.entries(data.completed)) {
    if (!isLanguageCode(language)) continue;
    const album = stickers[language] ?? [];
    const have = new Set(album);
    for (const entry of data.trip) if (entry.kind === 'catalog' && entry.language === language) have.add(entry.id);
    const missing: CatalogId[] = [];
    for (const id of ids ?? []) {
      const station = getStationById(language, id);
      if (!station) continue;
      const passenger = stationPassenger(station);
      if (passenger.kind === 'catalog' && !have.has(passenger.id)) {
        have.add(passenger.id);
        missing.push(passenger.id);
      }
    }
    if (missing.length > 0) stickers = { ...stickers, [language]: [...album, ...missing] };
  }
  return stickers === data.stickers ? data : { ...data, stickers };
}

/** Result of finishing a full trip: who rode along, and which stickers are new. */
export interface TripResult {
  passengers: TripEntry[];
  newStickers: CatalogId[];
}

interface ProgressContextValue {
  /** False until the saved progress has been read (the splash screen waits for it). */
  ready: boolean;
  isCompleted: (language: LanguageCode, stationId: string) => boolean;
  /** Mark a station as finished (saved immediately). */
  markCompleted: (language: LanguageCode, stationId: string) => void;
  /** Stickers collected in this language's album. */
  stickersFor: (language: LanguageCode) => CatalogId[];
  /** Put a passenger on the trip train. */
  addToTrip: (entry: TripEntry) => void;
  /** True when the trip train has TRIP_SIZE passengers: time to celebrate. */
  isTripFull: () => boolean;
  /**
   * Ends the full trip: every character on it becomes an album sticker and
   * the trip train is emptied. Returns who rode along and what's new.
   */
  takeTrip: (currentLanguage: LanguageCode) => TripResult;
  /** Forget all progress (parents' settings, stage 11). */
  reset: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

/** Keeps progress in memory for instant UI updates and mirrors it to storage. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProgressData>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);
  // Latest data for synchronous reads (e.g. "is the trip full?" right after adding).
  const latest = useRef(data);

  const update = useCallback((next: ProgressData) => {
    latest.current = next;
    setData(next);
    void saveProgress(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadProgress().then((stored) => {
      if (cancelled) return;
      const loaded = addMissingStickers(stored);
      latest.current = loaded;
      setData(loaded);
      setReady(true);
      if (loaded !== stored) void saveProgress(loaded);
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

  const takeTrip = useCallback(
    (currentLanguage: LanguageCode): TripResult => {
      const prev = latest.current;
      const passengers = prev.trip;
      const stickers = { ...prev.stickers };
      const newStickers: CatalogId[] = [];
      for (const p of passengers) {
        if (p.kind !== 'catalog') continue;
        // Each sticker goes into the album of the language it was won in.
        const language = p.language ?? currentLanguage;
        const album = stickers[language] ?? [];
        if (album.includes(p.id)) continue;
        stickers[language] = [...album, p.id];
        if (!newStickers.includes(p.id)) newStickers.push(p.id);
      }
      update({ ...prev, stickers, trip: [] });
      return { passengers, newStickers };
    },
    [update],
  );

  const reset = useCallback(() => {
    latest.current = EMPTY_PROGRESS;
    setData(EMPTY_PROGRESS);
    void resetProgress();
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      ready,
      isCompleted: (language, stationId) => data.completed[language]?.includes(stationId) ?? false,
      markCompleted,
      stickersFor: (language) => data.stickers[language] ?? [],
      addToTrip,
      isTripFull,
      takeTrip,
      reset,
    }),
    [ready, data, markCompleted, addToTrip, isTripFull, takeTrip, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
