import { Canvas, Circle, Group, Line, Oval, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { useOscillator } from '@/hooks/useOscillator';
import { colors } from '@/theme';

import { KawaiiFace } from '../KawaiiFace';
import type { CharacterArtProps } from './types';

/** Orange kitten with pointy ears, forehead stripes, whiskers and a wagging tail. */
export function CatArt({ size: S, happy, blink, seed }: CharacterArtProps) {
  const wag = useOscillator(700, seed);
  const tailTransform = useDerivedValue(() => [{ rotate: wag.value * 0.3 }]);

  const paths = useMemo(() => {
    const tri = (a: [number, number], b: [number, number], c: [number, number]) =>
      Skia.PathBuilder.Make()
        .moveTo(a[0] * S, a[1] * S)
        .lineTo(b[0] * S, b[1] * S)
        .lineTo(c[0] * S, c[1] * S)
        .close()
        .build();
    return {
      tail: Skia.PathBuilder.Make()
        .moveTo(0.7 * S, 0.86 * S)
        .quadTo(0.97 * S, 0.84 * S, 0.9 * S, 0.52 * S)
        .build(),
      earL: tri([0.25, 0.32], [0.27, 0.07], [0.46, 0.2]),
      earR: tri([0.75, 0.32], [0.73, 0.07], [0.54, 0.2]),
      innerL: tri([0.3, 0.27], [0.3, 0.13], [0.41, 0.21]),
      innerR: tri([0.7, 0.27], [0.7, 0.13], [0.59, 0.21]),
    };
  }, [S]);

  const w = S * 0.012;
  return (
    <Canvas style={{ width: S, height: S }}>
      <Group origin={vec(0.7 * S, 0.86 * S)} transform={tailTransform}>
        <Path path={paths.tail} style="stroke" strokeWidth={S * 0.08} strokeCap="round" color={colors.catFur} />
      </Group>
      <Oval x={0.24 * S} y={0.56 * S} width={0.52 * S} height={0.4 * S} color={colors.catFur} />
      <Oval x={0.37 * S} y={0.66 * S} width={0.26 * S} height={0.26 * S} color={colors.belly} />
      <Oval x={0.28 * S} y={0.88 * S} width={0.16 * S} height={0.1 * S} color={colors.catFur} />
      <Oval x={0.56 * S} y={0.88 * S} width={0.16 * S} height={0.1 * S} color={colors.catFur} />
      <Path path={paths.earL} color={colors.catFur} />
      <Path path={paths.earR} color={colors.catFur} />
      <Path path={paths.innerL} color={colors.innerEar} />
      <Path path={paths.innerR} color={colors.innerEar} />
      <Circle cx={0.5 * S} cy={0.42 * S} r={0.27 * S} color={colors.catFur} />
      <Line p1={vec(0.5 * S, 0.17 * S)} p2={vec(0.5 * S, 0.24 * S)} color={colors.catStripe} strokeWidth={S * 0.025} strokeCap="round" />
      <Line p1={vec(0.43 * S, 0.18 * S)} p2={vec(0.45 * S, 0.24 * S)} color={colors.catStripe} strokeWidth={S * 0.025} strokeCap="round" />
      <Line p1={vec(0.57 * S, 0.18 * S)} p2={vec(0.55 * S, 0.24 * S)} color={colors.catStripe} strokeWidth={S * 0.025} strokeCap="round" />
      <KawaiiFace cx={0.5 * S} cy={0.46 * S} size={0.42 * S} happy={happy} blink={blink} />
      <Group opacity={0.55}>
        <Line p1={vec(0.29 * S, 0.5 * S)} p2={vec(0.13 * S, 0.47 * S)} color={colors.ink} strokeWidth={w} strokeCap="round" />
        <Line p1={vec(0.29 * S, 0.54 * S)} p2={vec(0.13 * S, 0.56 * S)} color={colors.ink} strokeWidth={w} strokeCap="round" />
        <Line p1={vec(0.71 * S, 0.5 * S)} p2={vec(0.87 * S, 0.47 * S)} color={colors.ink} strokeWidth={w} strokeCap="round" />
        <Line p1={vec(0.71 * S, 0.54 * S)} p2={vec(0.87 * S, 0.56 * S)} color={colors.ink} strokeWidth={w} strokeCap="round" />
      </Group>
    </Canvas>
  );
}
