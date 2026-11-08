import { Canvas, Circle, Group, Oval, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { useOscillator } from '@/hooks/useOscillator';
import { colors } from '@/theme';

import { KawaiiFace } from '../KawaiiFace';
import type { CharacterArtProps } from './types';

/** Cheeky monkey with big round ears, a heart-shaped face and a curly tail. */
export function MonkeyArt({ size: S, happy, blink, seed }: CharacterArtProps) {
  const wag = useOscillator(800, seed);
  const tailTransform = useDerivedValue(() => [{ rotate: wag.value * 0.25 }]);

  const tail = useMemo(
    () =>
      Skia.PathBuilder.Make()
        .moveTo(0.68 * S, 0.86 * S)
        .quadTo(0.98 * S, 0.86 * S, 0.92 * S, 0.62 * S)
        .quadTo(0.88 * S, 0.5 * S, 0.8 * S, 0.56 * S)
        .build(),
    [S],
  );

  return (
    <Canvas style={{ width: S, height: S }}>
      <Group origin={vec(0.68 * S, 0.86 * S)} transform={tailTransform}>
        <Path path={tail} style="stroke" strokeWidth={S * 0.055} strokeCap="round" color={colors.monkeyFur} />
      </Group>
      <Oval x={0.28 * S} y={0.58 * S} width={0.44 * S} height={0.38 * S} color={colors.monkeyFur} />
      <Oval x={0.37 * S} y={0.66 * S} width={0.26 * S} height={0.25 * S} color={colors.monkeyFace} />
      <Circle cx={0.22 * S} cy={0.4 * S} r={0.09 * S} color={colors.monkeyFur} />
      <Circle cx={0.22 * S} cy={0.4 * S} r={0.055 * S} color={colors.monkeyFace} />
      <Circle cx={0.78 * S} cy={0.4 * S} r={0.09 * S} color={colors.monkeyFur} />
      <Circle cx={0.78 * S} cy={0.4 * S} r={0.055 * S} color={colors.monkeyFace} />
      <Circle cx={0.5 * S} cy={0.4 * S} r={0.27 * S} color={colors.monkeyFur} />
      {/* Heart-shaped face mask */}
      <Circle cx={0.41 * S} cy={0.36 * S} r={0.1 * S} color={colors.monkeyFace} />
      <Circle cx={0.59 * S} cy={0.36 * S} r={0.1 * S} color={colors.monkeyFace} />
      <Oval x={0.29 * S} y={0.38 * S} width={0.42 * S} height={0.24 * S} color={colors.monkeyFace} />
      <KawaiiFace cx={0.5 * S} cy={0.43 * S} size={0.38 * S} happy={happy} blink={blink} />
    </Canvas>
  );
}
