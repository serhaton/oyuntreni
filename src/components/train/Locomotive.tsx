import { Circle, Group, Line, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { KawaiiFace } from '@/components/art/KawaiiFace';
import { colors } from '@/theme';

import { Wheel } from './Wheel';

interface LocomotiveProps {
  /** Left edge inside the train canvas (points). */
  x: number;
  /** Size unit: height from roof to rail (points). */
  u: number;
  travel: SharedValue<number>;
  /** Vertical "chug" offset for the body (wheels stay on the rail). */
  bob: SharedValue<{ translateY: number }[]>;
  happy: boolean;
  blink: SharedValue<number>;
}

/**
 * Cute steam locomotive, facing right. Skia elements only: render inside a
 * <Canvas>. Body parts bob while moving; wheels and coupling rod stay on the rail.
 */
export function Locomotive({ x, u, travel, bob, happy, blink }: LocomotiveProps) {
  const big = u * 0.17;
  const small = u * 0.11;
  const wheelY = u - big;
  const rearX = x + u * 0.36;
  const midX = x + u * 0.78;
  const frontX = x + u * 1.26;

  const { chimney, cowcatcher } = useMemo(() => {
    const ch = Skia.PathBuilder.Make()
      .moveTo(x + u * 1.1, u * 0.34)
      .lineTo(x + u * 1.26, u * 0.34)
      .lineTo(x + u * 1.3, u * 0.11)
      .lineTo(x + u * 1.06, u * 0.11)
      .close()
      .build();
    const cc = Skia.PathBuilder.Make()
      .moveTo(x + u * 1.44, u * 0.6)
      .lineTo(x + u * 1.62, u * 0.9)
      .lineTo(x + u * 1.36, u * 0.9)
      .close()
      .build();
    return { chimney: ch, cowcatcher: cc };
  }, [x, u]);

  // Coupling rod: joins a pin on each big wheel, so it circles as they roll.
  const pin = big * 0.55;
  const rodStart = useDerivedValue(() => {
    const a = travel.value / big;
    return { x: rearX + Math.cos(a) * pin, y: wheelY + Math.sin(a) * pin };
  });
  const rodEnd = useDerivedValue(() => {
    const a = travel.value / big;
    return { x: midX + Math.cos(a) * pin, y: wheelY + Math.sin(a) * pin };
  });

  return (
    <Group>
      {/* Body (bobs) */}
      <Group transform={bob}>
        {/* Chassis */}
        <RoundedRect x={x + u * 0.06} y={u * 0.6} width={u * 1.44} height={u * 0.13} r={u * 0.04} color={colors.chassis} />
        {/* Cowcatcher */}
        <Path path={cowcatcher} color={colors.sun} />
        <Path path={cowcatcher} color={colors.sun} style="stroke" strokeWidth={u * 0.03} strokeJoin="round" />
        {/* Chimney */}
        <Path path={chimney} color={colors.chassis} />
        <RoundedRect x={x + u * 1.02} y={u * 0.05} width={u * 0.32} height={u * 0.08} r={u * 0.03} color={colors.chassis} />
        {/* Steam dome (half hidden behind the boiler) */}
        <Circle cx={x + u * 0.86} cy={u * 0.32} r={u * 0.08} color={colors.sun} />
        {/* Boiler */}
        <RoundedRect x={x + u * 0.56} y={u * 0.3} width={u * 0.92} height={u * 0.32} r={u * 0.12} color={colors.blue} />
        <RoundedRect x={x + u * 0.78} y={u * 0.3} width={u * 0.05} height={u * 0.32} r={0} color={colors.sun} />
        <RoundedRect x={x + u * 1.2} y={u * 0.3} width={u * 0.05} height={u * 0.32} r={0} color={colors.sun} />
        {/* Boiler front cap + headlamp */}
        <Circle cx={x + u * 1.46} cy={u * 0.46} r={u * 0.13} color={colors.red} />
        <Circle cx={x + u * 1.5} cy={u * 0.34} r={u * 0.06} color={colors.sunGlow} />
        {/* Cabin */}
        <RoundedRect x={x + u * 0.08} y={u * 0.14} width={u * 0.54} height={u * 0.48} r={u * 0.06} color={colors.red} />
        <RoundedRect x={x + u * 0.02} y={u * 0.07} width={u * 0.66} height={u * 0.1} r={u * 0.05} color={colors.sun} />
        <RoundedRect x={x + u * 0.2} y={u * 0.22} width={u * 0.3} height={u * 0.2} r={u * 0.05} color={colors.skyLight} />
        {/* Face on the boiler: the train is a character too! */}
        <KawaiiFace cx={x + u * 1.02} cy={u * 0.47} size={u * 0.27} happy={happy} blink={blink} />
      </Group>

      {/* Wheels (stay on the rail) */}
      <Wheel cx={rearX} cy={wheelY} r={big} travel={travel} color={colors.red} />
      <Wheel cx={midX} cy={wheelY} r={big} travel={travel} color={colors.red} />
      <Wheel cx={frontX} cy={u - small} r={small} travel={travel} color={colors.red} />
      <Line p1={rodStart} p2={rodEnd} color={colors.metal} strokeWidth={u * 0.04} strokeCap="round" />
    </Group>
  );
}
