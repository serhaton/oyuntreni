import { Canvas, Circle, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { colors } from '@/theme';

/** A friendly golden padlock, drawn with Skia: "this one needs the full version". */
export function LockBadge({ size }: { size: number }) {
  const shackle = useMemo(
    () =>
      Skia.PathBuilder.Make()
        .addArc({ x: size * 0.3, y: size * 0.1, width: size * 0.4, height: size * 0.44 }, 180, 180)
        .build(),
    [size],
  );
  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Path path={shackle} style="stroke" strokeWidth={size * 0.1} strokeCap="round" color={colors.white} />
      <Path path={shackle} style="stroke" strokeWidth={size * 0.06} strokeCap="round" color={colors.metal} />
      <RoundedRect x={size * 0.16} y={size * 0.38} width={size * 0.68} height={size * 0.52} r={size * 0.12} color={colors.white} />
      <RoundedRect x={size * 0.2} y={size * 0.42} width={size * 0.6} height={size * 0.44} r={size * 0.1} color={colors.sun} />
      <Circle cx={size * 0.5} cy={size * 0.6} r={size * 0.07} color={colors.chassis} />
      <RoundedRect x={size * 0.47} y={size * 0.62} width={size * 0.06} height={size * 0.14} r={size * 0.03} color={colors.chassis} />
    </Canvas>
  );
}
