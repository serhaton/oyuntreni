import { Canvas, Circle, Group, Oval, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import { useOscillator } from '@/hooks/useOscillator';
import { colors } from '@/theme';

import { KawaiiFace } from '../KawaiiFace';
import type { CharacterArtProps } from './types';

/** Fluffy bunny with long wiggling ears, a pink nose and a cotton tail. */
export function RabbitArt({ size: S, happy, blink, seed }: CharacterArtProps) {
  const wiggle = useOscillator(900, seed);
  const leftEar = useDerivedValue(() => [{ rotate: -0.12 + wiggle.value * 0.12 }]);
  const rightEar = useDerivedValue(() => [{ rotate: 0.12 - wiggle.value * 0.12 }]);

  const ear = (cx: number) => (
    <>
      <Oval x={(cx - 0.07) * S} y={0.0 * S} width={0.14 * S} height={0.38 * S} color={colors.rabbitFur} />
      <Oval x={(cx - 0.035) * S} y={0.05 * S} width={0.07 * S} height={0.26 * S} color={colors.innerEar} />
    </>
  );

  return (
    <Canvas style={{ width: S, height: S }}>
      <Group origin={vec(0.4 * S, 0.34 * S)} transform={leftEar}>
        {ear(0.4)}
      </Group>
      <Group origin={vec(0.6 * S, 0.34 * S)} transform={rightEar}>
        {ear(0.6)}
      </Group>
      <Circle cx={0.75 * S} cy={0.84 * S} r={0.07 * S} color={colors.white} />
      <Oval x={0.26 * S} y={0.58 * S} width={0.48 * S} height={0.38 * S} color={colors.rabbitFur} />
      <Oval x={0.38 * S} y={0.68 * S} width={0.24 * S} height={0.22 * S} color={colors.white} />
      <Oval x={0.27 * S} y={0.88 * S} width={0.18 * S} height={0.1 * S} color={colors.rabbitShade} />
      <Oval x={0.55 * S} y={0.88 * S} width={0.18 * S} height={0.1 * S} color={colors.rabbitShade} />
      <Circle cx={0.5 * S} cy={0.5 * S} r={0.25 * S} color={colors.rabbitFur} />
      <KawaiiFace cx={0.5 * S} cy={0.52 * S} size={0.4 * S} happy={happy} blink={blink} />
      <Circle cx={0.5 * S} cy={0.555 * S} r={0.022 * S} color={colors.candyPink} />
    </Canvas>
  );
}
