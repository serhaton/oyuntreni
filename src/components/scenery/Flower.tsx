import { Canvas, Circle, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import Animated from 'react-native-reanimated';

import { KawaiiFace } from '@/components/art/KawaiiFace';
import { Bouncy } from '@/components/Bouncy';
import { useBlink } from '@/hooks/useBlink';
import { useSwayWiggle } from '@/hooks/useSwayWiggle';
import { useTemporaryFlag } from '@/hooks/useTemporaryFlag';
import { colors } from '@/theme';

/** Flower width relative to its height. Exported for layout math. */
export const FLOWER_ASPECT = 0.8;

interface FlowerProps {
  height: number;
  petalColor: string;
  seed?: number;
}

/** Little flower with a smiling center. Tap: it wiggles and beams. */
export function Flower({ height: H, petalColor, seed = 0 }: FlowerProps) {
  const W = H * FLOWER_ASPECT;
  const blink = useBlink(seed + 11);
  const [happy, triggerHappy] = useTemporaryFlag(1200);
  const { style: swayStyle, wiggle } = useSwayWiggle({ swayDeg: 4, seed });

  const cx = W / 2;
  const cy = H * 0.32;

  const leaf = useMemo(
    () =>
      Skia.PathBuilder.Make()
        .moveTo(cx, H * 0.75)
        .quadTo(cx + W * 0.45, H * 0.6, cx + W * 0.4, H * 0.52)
        .quadTo(cx + W * 0.1, H * 0.58, cx, H * 0.75)
        .close()
        .build(),
    [cx, W, H],
  );

  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return { x: cx + Math.cos(a) * H * 0.15, y: cy + Math.sin(a) * H * 0.15 };
  });

  const onPress = () => {
    triggerHappy();
    wiggle();
  };

  return (
    <Animated.View style={[{ width: W, height: H, transformOrigin: '50% 100%' }, swayStyle]}>
      <Bouncy onPress={onPress} sfx="pop" style={{ width: W, height: H }} hitSlop={12}>
        <Canvas style={{ width: W, height: H }}>
          <Line
            p1={vec(cx, cy)}
            p2={vec(cx, H)}
            color={colors.grassDark}
            strokeWidth={H * 0.06}
            strokeCap="round"
          />
          <Path path={leaf} color={colors.grassDark} />
          {petals.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={H * 0.13} color={petalColor} />
          ))}
          <Circle cx={cx} cy={cy} r={H * 0.13} color={colors.sun} />
          <KawaiiFace cx={cx} cy={cy} size={H * 0.22} happy={happy} blink={blink} blush={false} />
        </Canvas>
      </Bouncy>
    </Animated.View>
  );
}
