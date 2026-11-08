import { Canvas, Circle, Group, Oval, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { useOscillator } from '@/hooks/useOscillator';
import { colors } from '@/theme';

import { KawaiiFace } from '../KawaiiFace';
import type { CharacterArtProps } from './types';

/** Round red pomegranate with its little crown on top, a leaf and a happy face. */
export function PomegranateArt({ size: S, happy, blink, seed }: CharacterArtProps) {
  // A gentle side-to-side wobble, rocking on its bottom.
  const rock = useOscillator(1100, seed);
  const wobble = useDerivedValue(() => [{ rotate: rock.value * 0.05 }]);

  const { crown, leaf } = useMemo(() => {
    // Crown: a short neck with five little pointed tips.
    const b = Skia.PathBuilder.Make();
    const baseY = 0.3 * S;
    const topY = 0.15 * S;
    const left = 0.4 * S;
    const right = 0.6 * S;
    b.moveTo(left + 0.02 * S, baseY);
    const tips = 5;
    for (let i = 0; i <= tips * 2; i++) {
      const x = left + ((right - left) * i) / (tips * 2);
      const y = i % 2 === 0 ? topY : topY + 0.06 * S;
      b.lineTo(x, y);
    }
    b.lineTo(right - 0.02 * S, baseY);
    b.close();
    const l = Skia.PathBuilder.Make()
      .moveTo(0.58 * S, 0.22 * S)
      .quadTo(0.76 * S, 0.08 * S, 0.84 * S, 0.16 * S)
      .quadTo(0.74 * S, 0.3 * S, 0.58 * S, 0.22 * S)
      .close()
      .build();
    return { crown: b.build(), leaf: l };
  }, [S]);

  return (
    <Canvas style={{ width: S, height: S }}>
      <Group origin={vec(0.5 * S, 0.94 * S)} transform={wobble}>
        <Path path={leaf} color={colors.leaf} />
        <Path path={crown} color={colors.pomegranateDark} />
        <Path path={crown} color={colors.pomegranateDark} style="stroke" strokeWidth={S * 0.02} strokeJoin="round" />
        <Circle cx={0.5 * S} cy={0.6 * S} r={0.34 * S} color={colors.pomegranate} />
        {/* Shiny highlight */}
        <Oval x={0.27 * S} y={0.36 * S} width={0.14 * S} height={0.2 * S} color={colors.white} opacity={0.35} />
        <Circle cx={0.36 * S} cy={0.6 * S} r={0.02 * S} color={colors.white} opacity={0.5} />
        <KawaiiFace cx={0.5 * S} cy={0.62 * S} size={0.4 * S} happy={happy} blink={blink} />
      </Group>
    </Canvas>
  );
}
