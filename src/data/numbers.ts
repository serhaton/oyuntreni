import type { Dictionary } from '@/i18n/types';

/** Toys that can be counted (each needs a `counting.<toy>` phrase in every dictionary). */
export type CountingToy = keyof Dictionary['counting'];

/** Numbers up to this are also counted with toys on the train (one wagon each). */
export const MAX_COUNT = 5;

export interface NumberEntry {
  /** The number to trace (its digits must exist in src/data/glyphs.ts). */
  value: number;
  /**
   * What the child puts on the train, `value` times. Only for numbers up to
   * MAX_COUNT; bigger numbers are traced only (too many toys to count).
   */
  toy?: CountingToy;
}

/**
 * Number stations, shared by all languages (only the words differ).
 * Each number needs its word in every dictionary under `numbers.n<value>`.
 */
export const NUMBERS: NumberEntry[] = [
  { value: 1, toy: 'robot' },
  { value: 2, toy: 'kite' },
  { value: 3, toy: 'teddy' },
  { value: 4, toy: 'ball' },
  { value: 5, toy: 'drum' },
  ...[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((value) => ({ value })),
  { value: 50 },
  { value: 100 },
  { value: 1000 },
];

/** True if this number station also has the "put N toys on the train" part. */
export function hasCounting(entry: NumberEntry): entry is NumberEntry & { toy: CountingToy } {
  return entry.toy != null && entry.value <= MAX_COUNT;
}
