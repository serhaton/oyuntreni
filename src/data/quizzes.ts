import type { Dictionary } from '@/i18n/types';
import type { ColorName } from '@/theme';

import type { CatalogId } from './catalog';

/**
 * "Listen and pick" stations (animals and vehicles). Pure data: add or
 * remove entries to change which stations exist. Every item used in a sound
 * question must have its own sound in src/data/catalog.ts (checked by
 * `npm run test:data`).
 */

/** How many cards are shown (the answer + distractors). */
export const CHOICE_COUNT = 3;

// ---- Animals: "Which animal makes this sound?" -------------------------------
/** One station per animal; the other animals of this list are the distractors. */
export const ANIMAL_QUIZ: CatalogId[] = ['cow', 'dog', 'duck', 'cat', 'sheep', 'horse', 'rooster', 'frog'];

// ---- Vehicles -----------------------------------------------------------------
/** A vehicle color that can be asked for (name in i18n `colorNames`). */
export type QuizColor = keyof Dictionary['colorNames'];

/** Theme color used to paint each quiz color. */
export const QUIZ_COLORS: Record<QuizColor, ColorName> = {
  red: 'red',
  blue: 'blue',
  yellow: 'sun',
  green: 'grass',
};

export type VehicleQuestion =
  /** "Which vehicle makes this sound?" */
  | { kind: 'sound'; vehicle: CatalogId }
  /** "Find the red car!" (needs a tintable drawing and `findObject.<vehicle>`). */
  | { kind: 'color'; vehicle: CatalogId & keyof Dictionary['findObject']; color: QuizColor };

export const VEHICLE_QUIZ: VehicleQuestion[] = [
  { kind: 'sound', vehicle: 'fireTruck' },
  { kind: 'sound', vehicle: 'airplane' },
  { kind: 'sound', vehicle: 'ferry' },
  { kind: 'color', vehicle: 'car', color: 'red' },
  { kind: 'color', vehicle: 'car', color: 'blue' },
];

/** Pause before a quiz sound plays a second time (after it has finished). */
export const QUESTION_REPEAT_GAP_MS = 2000;

/** Vehicles that can appear as distractors in sound questions (each has a distinct sound). */
export const VEHICLE_SOUND_POOL: CatalogId[] = ['fireTruck', 'airplane', 'ferry', 'car'];

/** Stable id for a vehicle question (used in station ids). */
export function vehicleQuestionId(q: VehicleQuestion): string {
  return q.kind === 'sound' ? `sound-${q.vehicle}` : `color-${q.vehicle}-${q.color}`;
}

// ---- Helpers --------------------------------------------------------------------
/** A shuffled copy of the list. */
export function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `count` random items from `pool`, never including `exclude`. */
export function pickOthers<T>(pool: readonly T[], exclude: T, count: number): T[] {
  return shuffle(pool.filter((item) => item !== exclude)).slice(0, count);
}
