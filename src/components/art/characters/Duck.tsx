import { Canvas, Circle, Group, Oval, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { useOscillator } from '@/hooks/useOscillator';
import { colors } from '@/theme';

import { KawaiiFace } from '../KawaiiFace';
import type { CharacterArtProps } from './types';

/** Round yellow duckling with a little head tuft and flapping wings. */
export function DuckArt({ size: S, happy, blink, seed }: CharacterArtProps) {
  const flap = useOscillator(450, seed);
  const leftWing = useDerivedValue(() => [{ rotate: 0.25 + flap.value * 0.25 }]);
  const rightWing = useDerivedValue(() => [{ rotate: -0.25 - flap.value * 0.25 }]);

  const tuft = useMemo(
    () => Skia.PathBuilder.Make().moveTo(0.5 * S, 0.16 * S).quadTo(0.53 * S, 0.04 * S, 0.62 * S, 0.1 * S).build(),
    [S],
  );

  return (
    <Canvas style={{ width: S, height: S }}>
      <Group origin={vec(0.26 * S, 0.62 * S)} transform={leftWing}>
        <Oval x={0.1 * S} y={0.58 * S} width={0.2 * S} height={0.26 * S} color={colors.duckWing} />
      </Group>
      <Group origin={vec(0.74 * S, 0.62 * S)} transform={rightWing}>
        <Oval x={0.7 * S} y={0.58 * S} width={0.2 * S} height={0.26 * S} color={colors.duckWing} />
      </Group>
      <Oval x={0.18 * S} y={0.48 * S} width={0.64 * S} height={0.46 * S} color={colors.duckFeather} />
      <Oval x={0.3 * S} y={0.9 * S} width={0.16 * S} height={0.08 * S} color={colors.beak} />
      <Oval x={0.54 * S} y={0.9 * S} width={0.16 * S} height={0.08 * S} color={colors.beak} />
      <Circle cx={0.5 * S} cy={0.36 * S} r={0.23 * S} color={colors.duckFeather} />
      <Path path={tuft} style="stroke" strokeWidth={S * 0.04} strokeCap="round" color={colors.duckWing} />
      <KawaiiFace cx={0.5 * S} cy={0.35 * S} size={0.38 * S} happy={happy} blink={blink} />
      {/* Beak covers the mouth of the shared face. */}
      <Oval x={0.41 * S} y={0.39 * S} width={0.18 * S} height={0.1 * S} color={colors.beak} />
      <Oval x={0.44 * S} y={0.42 * S} width={0.12 * S} height={0.04 * S} color={colors.orange} opacity={0.7} />
    </Canvas>
  );
}
