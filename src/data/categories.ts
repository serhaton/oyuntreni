import type { StationType } from '@/stations/types';
import type { ColorName } from '@/theme';

import type { CatalogId } from './catalog';

/**
 * The big cards on the category menu (after "Play"). Each category shows the
 * stations of one station type. Names come from i18n `categories.<id>`.
 *
 * To add a category: add its station type, then an entry here.
 * Categories without any stations are hidden automatically.
 */
export interface CategoryDef {
  id: string;
  stationType: StationType;
  /** Card background color. */
  color: ColorName;
  /** Big text sample shown on the card ("Aa", "123")... */
  sample?: string;
  /** ...or a big character in the middle of the card instead. */
  hero?: CatalogId;
  /** Little character peeking from the card corner. */
  mascot?: CatalogId;
  /**
   * Skip the station list: tapping the card goes straight to a question, and
   * finishing one brings the next (unknown ones first). Used for quizzes.
   */
  direct?: boolean;
}

export const CATEGORIES = [
  { id: 'letters', stationType: 'letter', color: 'candyPink', sample: 'Aa', mascot: 'cat' },
  { id: 'numbers', stationType: 'number', color: 'orange', sample: '123', mascot: 'teddy' },
  { id: 'animals', stationType: 'animal', color: 'grass', hero: 'monkey', direct: true },
  { id: 'vehicles', stationType: 'vehicle', color: 'blue', hero: 'car', direct: true },
] as const satisfies readonly CategoryDef[];

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export function getCategory(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** The category a station type belongs to. */
export function getCategoryForType(type: StationType): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.stationType === type);
}
