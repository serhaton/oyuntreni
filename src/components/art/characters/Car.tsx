import { Canvas, Circle, Group, RoundedRect } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import { useOscillator } from '@/hooks/useOscillator';
import { colors } from '@/theme';

import { KawaiiFace } from '../KawaiiFace';
import type { CharacterArtProps } from './types';

/**
 * Little round car, facing right, with a happy face in the windshield. The
 * body color comes from `tint` (red by default) so quiz questions can ask
 * for "the blue car". The body bounces gently on its wheels.
 */
export function CarArt({ size: S, happy, blink, seed, tint = colors.red }: CharacterArtProps) {
  const bounce = useOscillator(350, seed);
  const bodyBob = useDerivedValue(() => [{ translateY: (bounce.value + 1) * S * 0.01 }]);

  const wheel = (cx: number) => (
    <>
      <Circle cx={cx * S} cy={0.8 * S} r={0.12 * S} color={colors.chassis} />
      <Circle cx={cx * S} cy={0.8 * S} r={0.055 * S} color={colors.railShine} />
    </>
  );

  return (
    <Canvas style={{ width: S, height: S }}>
      <Group transform={bodyBob}>
        {/* Cabin and windows */}
        <RoundedRect x={0.24 * S} y={0.24 * S} width={0.48 * S} height={0.32 * S} r={0.12 * S} color={tint} />
        <RoundedRect x={0.3 * S} y={0.3 * S} width={0.36 * S} height={0.2 * S} r={0.07 * S} color={colors.skyLight} />
        {/* Body */}
        <RoundedRect x={0.06 * S} y={0.46 * S} width={0.88 * S} height={0.3 * S} r={0.12 * S} color={tint} />
        {/* Shine, headlight, rear light, bumper */}
        <RoundedRect x={0.14 * S} y={0.5 * S} width={0.3 * S} height={0.05 * S} r={0.025 * S} color={colors.white} opacity={0.4} />
        <Circle cx={0.88 * S} cy={0.56 * S} r={0.045 * S} color={colors.sunGlow} />
        <Circle cx={0.11 * S} cy={0.56 * S} r={0.035 * S} color={colors.orange} />
        <RoundedRect x={0.04 * S} y={0.7 * S} width={0.92 * S} height={0.05 * S} r={0.025 * S} color={colors.chassis} opacity={0.35} />
        <KawaiiFace cx={0.48 * S} cy={0.4 * S} size={0.3 * S} happy={happy} blink={blink} />
      </Group>
      {wheel(0.28)}
      {wheel(0.72)}
    </Canvas>
  );
}
