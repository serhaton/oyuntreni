import { Circle, Group, RoundedRect } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

import { colors } from '@/theme';

import { TRAIN } from './geometry';
import { Wheel } from './Wheel';

interface WagonProps {
  /** Left edge inside the train canvas (points). */
  x: number;
  u: number;
  color: string;
  travel: SharedValue<number>;
  bob: SharedValue<{ translateY: number }[]>;
  /** Draw the coupler bar to the next car on the right. */
  coupler: boolean;
}

/**
 * Open wagon: a colorful tub that passengers (animals, toys, vehicles) stand in.
 * Skia elements only. The passenger itself is a separate view placed by <Train>.
 */
export function Wagon({ x, u, color, travel, bob, coupler }: WagonProps) {
  const w = u * TRAIN.wagonWidth;
  const r = u * 0.13;
  const deck = u * TRAIN.wagonDeck;

  return (
    <Group>
      <Group transform={bob}>
        {coupler && (
          <RoundedRect x={x + w - u * 0.02} y={u * 0.62} width={u * TRAIN.gap + u * 0.04} height={u * 0.06} r={u * 0.03} color={colors.chassis} />
        )}
        <RoundedRect x={x + u * 0.04} y={u * 0.62} width={w - u * 0.08} height={u * 0.12} r={u * 0.04} color={colors.chassis} />
        {/* Tub */}
        <RoundedRect x={x + u * 0.06} y={deck} width={w - u * 0.12} height={u * 0.3} r={u * 0.08} color={color} />
        {/* White rim */}
        <RoundedRect x={x + u * 0.02} y={deck - u * 0.03} width={w - u * 0.04} height={u * 0.08} r={u * 0.04} color={colors.white} />
        {/* Polka dots */}
        {[0.3, 0.6, 0.9].map((f) => (
          <Circle key={f} cx={x + w * f} cy={deck + u * 0.17} r={u * 0.045} color={colors.white} opacity={0.7} />
        ))}
      </Group>
      <Wheel cx={x + w * 0.27} cy={u - r} r={r} travel={travel} color={colors.sun} />
      <Wheel cx={x + w * 0.73} cy={u - r} r={r} travel={travel} color={colors.sun} />
    </Group>
  );
}
