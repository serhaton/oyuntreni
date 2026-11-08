import type { CatalogId } from '@/data/catalog';
import type { LanguageCode } from '@/i18n/languages';

import { loadJSON, removeKey, saveJSON } from './storage';

/** How many passengers fill the trip train (then: big celebration + stickers). */
export const TRIP_SIZE = 5;

/** Someone riding the trip train: a catalog character, or a traced big number. */
export type TripEntry = { kind: 'catalog'; id: CatalogId; tint?: string } | { kind: 'number'; value: number };

/**
 * Everything the child has achieved, stored on the device only.
 *  - completed: which stations are done, per language (letter stations differ
 *    between languages, so their progress does too);
 *  - stickers: the collection album (shared by all languages);
 *  - trip: passengers on the current trip train (fills up to TRIP_SIZE).
 */
export interface ProgressData {
  completed: Partial<Record<LanguageCode, string[]>>;
  stickers: CatalogId[];
  trip: TripEntry[];
}

const KEY = 'progress';

export const EMPTY_PROGRESS: ProgressData = { completed: {}, stickers: [], trip: [] };

export async function loadProgress(): Promise<ProgressData> {
  const stored = await loadJSON<Partial<ProgressData>>(KEY);
  // Merge with defaults so data saved by older versions keeps working.
  return { ...EMPTY_PROGRESS, ...stored, completed: stored?.completed ?? {} };
}

export async function saveProgress(data: ProgressData): Promise<void> {
  await saveJSON(KEY, data);
}

export async function resetProgress(): Promise<void> {
  await removeKey(KEY);
}
