import { Circle, Group, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { colors } from '@/theme';

interface WheelProps {
  cx: number;
  cy: number;
  r: number;
  /** Distance travelled (points). The wheel rolls: angle = distance / radius. */
  travel: SharedValue<number>;
  color: string;
}

/** Spoked wheel that rolls exactly as far as the train moves (Skia, UI thread). */
export function Wheel({ cx, cy, r, travel, color }: WheelProps) {
  const transform = useDerivedValue(() => [{ rotate: travel.value / r }]);

  const spokes = useMemo(() => {
    const b = Skia.PathBuilder.Make();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      b.moveTo(cx - Math.cos(a) * r * 0.75, cy - Math.sin(a) * r * 0.75);
      b.lineTo(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75);
    }
    return b.build();
  }, [cx, cy, r]);

  return (
    <Group>
      <Circle cx={cx} cy={cy} r={r} color={colors.chassis} />
      <Circle cx={cx} cy={cy} r={r * 0.8} color={color} />
      <Group origin={vec(cx, cy)} transform={transform}>
        <Path path={spokes} color={colors.chassis} style="stroke" strokeWidth={r * 0.14} strokeCap="round" />
      </Group>
      <Circle cx={cx} cy={cy} r={r * 0.22} color={colors.chassis} />
      <Circle cx={cx} cy={cy} r={r * 0.1} color={colors.railShine} />
    </Group>
  );
}
