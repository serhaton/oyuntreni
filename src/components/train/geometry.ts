/**
 * Train proportions, in units of `u` (the height of one car, from roof to rail).
 * Shared by the drawing code and the layout (passenger slots, smoke origin).
 */
export const TRAIN = {
  locoWidth: 1.62,
  wagonWidth: 1.2,
  /** Gap between cars (the coupler spans it). */
  gap: 0.1,
  /** Room above the train for smoke puffs. */
  smokeHeight: 1.0,
  /** Chimney top, in locomotive-local coordinates. */
  chimney: { x: 1.18, y: 0.06 },
  /** Top of a wagon's body: passengers stand on this line. */
  wagonDeck: 0.38,
} as const;

/** X of car `index` (wagons first, locomotive last) in train-local units. */
export function carX(index: number) {
  return index * (TRAIN.wagonWidth + TRAIN.gap);
}

/** Total train width in units of `u`. */
export function trainWidth(wagonCount: number) {
  return carX(wagonCount) + TRAIN.locoWidth;
}
