import { hasCounting } from '@/data/numbers';

import type { NumberStationDef, StationModuleProps } from '../types';
import { CountingNumberStation } from './CountingNumberStation';
import { TraceOnlyNumberStation } from './TraceOnlyNumberStation';

/**
 * Number station: small numbers (1–5) are traced AND counted with toys on
 * the train; bigger numbers (6–20, 50, 100, 1000) are traced only, because
 * that many toys would be too much to count.
 */
export function NumberStation(props: StationModuleProps<NumberStationDef>) {
  return hasCounting(props.station.number) ? <CountingNumberStation {...props} /> : <TraceOnlyNumberStation {...props} />;
}
