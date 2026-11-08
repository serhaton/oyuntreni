import type { CatalogId } from '@/data/catalog';
import type { LanguageCode } from '@/i18n/languages';

import { loadJSON, removeKey, saveJSON } from './storage';

/** How many passengers fill the trip train (then: big celebration + stickers). */
export const TRIP_SIZE = 5;

/**
 * Someone riding the trip train: a catalog character, or a traced big number.
 * `language` is the language of the station that won it (its album gets the sticker).
 */
export type TripEntry = ({ kind: 'catalog'; id: CatalogId; tint?: string } | { kind: 'number'; value: number }) & {
  language?: LanguageCode;
};

/** One sticker album per language. */
export type StickerAlbums = Partial<Record<LanguageCode, CatalogId[]>>;

/**
 * Everything the child has achieved, stored on the device only.
 *  - completed: which stations are done, per language (letter stations differ
 *    between languages, so their progress does too);
 *  - stickers: the collection album, per language (earned in that language);
 *  - trip: passengers on the current trip train (fills up to TRIP_SIZE).
 */
export interface ProgressData {
  completed: Partial<Record<LanguageCode, string[]>>;
  stickers: StickerAlbums;
  trip: TripEntry[];
}

const KEY = 'progress';

export const EMPTY_PROGRESS: ProgressData = { completed: {}, stickers: {}, trip: [] };

export async function loadProgress(): Promise<ProgressData> {
  const stored = await loadJSON<Partial<ProgressData> & { stickers?: unknown }>(KEY);
  // Older versions kept one shared sticker list for all languages. It is
  // dropped here; each language's album is rebuilt from that language's
  // completed stations (see addMissingStickers in ProgressProvider).
  const stickers =
    stored?.stickers && typeof stored.stickers === 'object' && !Array.isArray(stored.stickers)
      ? (stored.stickers as StickerAlbums)
      : {};
  // Merge with defaults so data saved by older versions keeps working.
  return { ...EMPTY_PROGRESS, ...stored, completed: stored?.completed ?? {}, stickers, trip: stored?.trip ?? [] };
}

export async function saveProgress(data: ProgressData): Promise<void> {
  await saveJSON(KEY, data);
}

export async function resetProgress(): Promise<void> {
  await removeKey(KEY);
}
