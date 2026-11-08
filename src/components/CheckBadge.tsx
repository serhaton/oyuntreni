import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { colors } from '@/theme';

/** Round green badge with a white check mark: "done!". Drawn with Skia. */
export function CheckBadge({ size }: { size: number }) {
  const check = useMemo(
    () =>
      Skia.PathBuilder.Make()
        .moveTo(size * 0.28, size * 0.52)
        .lineTo(size * 0.44, size * 0.68)
        .lineTo(size * 0.73, size * 0.36)
        .build(),
    [size],
  );
  const c = size / 2;
  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Circle cx={c} cy={c} r={c} color={colors.white} />
      <Circle cx={c} cy={c} r={c * 0.84} color={colors.grassDark} />
      <Path path={check} style="stroke" strokeWidth={size * 0.12} strokeCap="round" strokeJoin="round" color={colors.white} />
    </Canvas>
  );
}
