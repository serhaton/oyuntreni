import type { ComponentType } from 'react';

import { AnimalStation } from './animal/AnimalStation';
import { LetterStation } from './letter/LetterStation';
import { NumberStation } from './number/NumberStation';
import { VehicleStation } from './vehicle/VehicleStation';
import type { StationDef, StationModuleProps, StationType } from './types';

export type { StationDef, StationModuleProps } from './types';

/**
 * Station type -> screen module. TypeScript forces an entry for every type
 * in `StationDef`, so a new station type can't be forgotten here.
 */
const STATION_MODULES: {
  [T in StationType]: ComponentType<StationModuleProps<Extract<StationDef, { type: T }>>>;
} = {
  letter: LetterStation,
  number: NumberStation,
  animal: AnimalStation,
  vehicle: VehicleStation,
};

/** Renders the right module for any station. */
export function StationView({ station, onSolved, onDone }: StationModuleProps) {
  const Module = STATION_MODULES[station.type] as ComponentType<StationModuleProps>;
  return <Module station={station} onSolved={onSolved} onDone={onDone} />;
}
