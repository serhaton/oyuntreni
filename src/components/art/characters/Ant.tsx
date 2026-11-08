import { Canvas, Circle, Group, Line, Oval, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { useOscillator } from '@/hooks/useOscillator';
import { colors } from '@/theme';

import { KawaiiFace } from '../KawaiiFace';
import type { CharacterArtProps } from './types';

/** Little red ant with a big head, six legs and twitching antennae. */
export function AntArt({ size: S, happy, blink, seed }: CharacterArtProps) {
  const twitch = useOscillator(500, seed);
  const leftAntenna = useDerivedValue(() => [{ rotate: twitch.value * 0.15 }]);
  const rightAntenna = useDerivedValue(() => [{ rotate: -twitch.value * 0.15 }]);

  const antennae = useMemo(
    () => ({
      left: Skia.PathBuilder.Make().moveTo(0.42 * S, 0.22 * S).quadTo(0.38 * S, 0.06 * S, 0.27 * S, 0.08 * S).build(),
      right: Skia.PathBuilder.Make().moveTo(0.58 * S, 0.22 * S).quadTo(0.62 * S, 0.06 * S, 0.73 * S, 0.08 * S).build(),
    }),
    [S],
  );

  const leg = (x2: number, y2: number) => (
    <Line p1={vec(0.5 * S, 0.68 * S)} p2={vec(x2 * S, y2 * S)} color={colors.ink} strokeWidth={S * 0.03} strokeCap="round" />
  );

  return (
    <Canvas style={{ width: S, height: S }}>
      {leg(0.2, 0.6)}
      {leg(0.18, 0.74)}
      {leg(0.24, 0.9)}
      {leg(0.8, 0.6)}
      {leg(0.82, 0.74)}
      {leg(0.76, 0.9)}
      <Oval x={0.31 * S} y={0.7 * S} width={0.38 * S} height={0.27 * S} color={colors.antBody} />
      <Circle cx={0.5 * S} cy={0.64 * S} r={0.09 * S} color={colors.antBody} />
      <Group origin={vec(0.42 * S, 0.22 * S)} transform={leftAntenna}>
        <Path path={antennae.left} style="stroke" strokeWidth={S * 0.025} strokeCap="round" color={colors.ink} />
        <Circle cx={0.27 * S} cy={0.08 * S} r={0.035 * S} color={colors.ink} />
      </Group>
      <Group origin={vec(0.58 * S, 0.22 * S)} transform={rightAntenna}>
        <Path path={antennae.right} style="stroke" strokeWidth={S * 0.025} strokeCap="round" color={colors.ink} />
        <Circle cx={0.73 * S} cy={0.08 * S} r={0.035 * S} color={colors.ink} />
      </Group>
      <Circle cx={0.5 * S} cy={0.4 * S} r={0.22 * S} color={colors.antBody} />
      <KawaiiFace cx={0.5 * S} cy={0.42 * S} size={0.36 * S} happy={happy} blink={blink} />
    </Canvas>
  );
}
