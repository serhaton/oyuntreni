import type { CatalogId } from '@/data/catalog';
import type { LetterEntry } from '@/data/letters';
import type { NumberEntry } from '@/data/numbers';
import type { VehicleQuestion } from '@/data/quizzes';

/**
 * Station definitions. Each station type has its own module in src/stations/
 * and its own variant here. To add a new type (colors, shapes...):
 *   1. Add a `XxxStationDef` variant to `StationDef`.
 *   2. Create src/stations/xxx/XxxStation.tsx.
 *   3. Register it in src/stations/index.ts (TypeScript enforces this).
 *   4. Generate its stations in src/data/stations.ts.
 */

export type LetterCase = 'upper' | 'lower';

export interface LetterStationDef {
  id: string;
  type: 'letter';
  letter: LetterEntry;
  letterCase: LetterCase;
}

export interface NumberStationDef {
  id: string;
  type: 'number';
  number: NumberEntry;
}

/** "Which animal makes this sound?" — the answer is `animal`. */
export interface AnimalStationDef {
  id: string;
  type: 'animal';
  animal: CatalogId;
}

/** Vehicle question: by sound, or "find the red car". */
export interface VehicleStationDef {
  id: string;
  type: 'vehicle';
  question: VehicleQuestion;
}

export type StationDef = LetterStationDef | NumberStationDef | AnimalStationDef | VehicleStationDef;

export type StationType = StationDef['type'];

/** Props every station module receives. */
export interface StationModuleProps<S extends StationDef = StationDef> {
  station: S;
  /** Call the moment the child succeeds (progress is saved, map shows a check). */
  onSolved: () => void;
  /** Call when the station is over (passenger aboard, train left). */
  onDone: () => void;
}
