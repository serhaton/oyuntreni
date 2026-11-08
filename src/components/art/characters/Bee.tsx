import { Canvas, Circle, Group, Line, Oval, Rect, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { useOscillator } from '@/hooks/useOscillator';
import { colors } from '@/theme';

import { KawaiiFace } from '../KawaiiFace';
import type { CharacterArtProps } from './types';

/** Chubby bumblebee with stripes, antennae and fast-buzzing wings. */
export function BeeArt({ size: S, happy, blink, seed }: CharacterArtProps) {
  const buzz = useOscillator(90, seed);
  const hover = useOscillator(700, seed + 1);
  const leftWing = useDerivedValue(() => [{ rotate: -0.35 + buzz.value * 0.3 }]);
  const rightWing = useDerivedValue(() => [{ rotate: 0.35 - buzz.value * 0.3 }]);
  const bodyHover = useDerivedValue(() => [{ translateY: hover.value * S * 0.02 }]);

  // Stripes are clipped to the round body.
  const bodyClip = useMemo(() => Skia.PathBuilder.Make().addCircle(0.5 * S, 0.6 * S, 0.3 * S).build(), [S]);

  return (
    <Canvas style={{ width: S, height: S }}>
      <Group transform={bodyHover}>
        <Group origin={vec(0.4 * S, 0.38 * S)} transform={leftWing}>
          <Oval x={0.14 * S} y={0.2 * S} width={0.28 * S} height={0.2 * S} color={colors.beeWing} opacity={0.9} />
        </Group>
        <Group origin={vec(0.6 * S, 0.38 * S)} transform={rightWing}>
          <Oval x={0.58 * S} y={0.2 * S} width={0.28 * S} height={0.2 * S} color={colors.beeWing} opacity={0.9} />
        </Group>
        <Line p1={vec(0.42 * S, 0.34 * S)} p2={vec(0.35 * S, 0.14 * S)} color={colors.ink} strokeWidth={S * 0.025} strokeCap="round" />
        <Line p1={vec(0.58 * S, 0.34 * S)} p2={vec(0.65 * S, 0.14 * S)} color={colors.ink} strokeWidth={S * 0.025} strokeCap="round" />
        <Circle cx={0.35 * S} cy={0.14 * S} r={0.035 * S} color={colors.ink} />
        <Circle cx={0.65 * S} cy={0.14 * S} r={0.035 * S} color={colors.ink} />
        <Circle cx={0.5 * S} cy={0.6 * S} r={0.3 * S} color={colors.beeBody} />
        <Group clip={bodyClip}>
          <Rect x={0} y={0.68 * S} width={S} height={0.07 * S} color={colors.ink} />
          <Rect x={0} y={0.8 * S} width={S} height={0.07 * S} color={colors.ink} />
        </Group>
        <KawaiiFace cx={0.5 * S} cy={0.52 * S} size={0.36 * S} happy={happy} blink={blink} />
      </Group>
    </Canvas>
  );
}
