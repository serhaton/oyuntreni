import { Canvas, Circle, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import Animated from 'react-native-reanimated';

import { KawaiiFace } from '@/components/art/KawaiiFace';
import { Bouncy } from '@/components/Bouncy';
import { useBlink } from '@/hooks/useBlink';
import { useSwayWiggle } from '@/hooks/useSwayWiggle';
import { useTemporaryFlag } from '@/hooks/useTemporaryFlag';
import { colors } from '@/theme';

export type TreeKind = 'round' | 'pine';

/** Tree width relative to its height. Exported for layout math. */
export const TREE_ASPECT = 0.75;

interface TreeProps {
  kind: TreeKind;
  /** Total height in points (the tree's base is the bottom edge). */
  height: number;
  seed?: number;
}

/** Friendly tree. Sways in the breeze; a tap makes it wiggle, rustle and smile. */
export function Tree({ kind, height: H, seed = 0 }: TreeProps) {
  const W = H * TREE_ASPECT;
  const blink = useBlink(seed + 7);
  const [happy, triggerHappy] = useTemporaryFlag(1400);
  const { style: swayStyle, wiggle } = useSwayWiggle({ swayDeg: 2, seed });

  const pineTiers = useMemo(() => {
    if (kind !== 'pine') return null;
    const tri = (top: number, bottom: number, halfW: number) =>
      Skia.PathBuilder.Make()
        .moveTo(W / 2, top)
        .lineTo(W / 2 + halfW, bottom)
        .lineTo(W / 2 - halfW, bottom)
        .close()
        .build();
    return [
      tri(H * 0.36, H * 0.8, W * 0.47),
      tri(H * 0.18, H * 0.6, W * 0.37),
      tri(H * 0.03, H * 0.4, W * 0.26),
    ];
  }, [kind, W, H]);

  const onPress = () => {
    triggerHappy();
    wiggle();
  };

  return (
    <Animated.View style={[{ width: W, height: H, transformOrigin: '50% 100%' }, swayStyle]}>
      <Bouncy onPress={onPress} sfx="rustle" style={{ width: W, height: H }}>
        <Canvas style={{ width: W, height: H }}>
          <RoundedRect
            x={W * 0.42}
            y={H * 0.5}
            width={W * 0.16}
            height={H * 0.5}
            r={W * 0.05}
            color={colors.treeTrunk}
          />
          {kind === 'round' ? (
            <>
              <Circle cx={W * 0.5} cy={H * 0.4} r={H * 0.3} color={colors.grassDark} />
              <Circle cx={W * 0.3} cy={H * 0.4} r={H * 0.18} color={colors.grass} />
              <Circle cx={W * 0.7} cy={H * 0.4} r={H * 0.18} color={colors.grass} />
              <Circle cx={W * 0.5} cy={H * 0.27} r={H * 0.21} color={colors.grass} />
              <Circle cx={W * 0.22} cy={H * 0.5} r={H * 0.035} color={colors.red} />
              <Circle cx={W * 0.8} cy={H * 0.3} r={H * 0.035} color={colors.red} />
              <Circle cx={W * 0.68} cy={H * 0.56} r={H * 0.035} color={colors.red} />
              <KawaiiFace cx={W * 0.5} cy={H * 0.38} size={H * 0.3} happy={happy} blink={blink} />
            </>
          ) : (
            <>
              {pineTiers?.map((p, i) => (
                <Path
                  key={i}
                  path={p}
                  color={colors.pine}
                  style="fill"
                />
              ))}
              {pineTiers?.map((p, i) => (
                <Path
                  key={`o${i}`}
                  path={p}
                  color={colors.pine}
                  style="stroke"
                  strokeWidth={H * 0.04}
                  strokeJoin="round"
                />
              ))}
              <KawaiiFace cx={W * 0.5} cy={H * 0.62} size={H * 0.26} happy={happy} blink={blink} />
            </>
          )}
        </Canvas>
      </Bouncy>
    </Animated.View>
  );
}
