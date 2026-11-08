import { Circle, Group, Oval, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { colors } from '@/theme';

interface KawaiiFaceProps {
  /** Face center inside the parent Skia canvas. */
  cx: number;
  cy: number;
  /** Rough face width; every feature scales from it. */
  size: number;
  /** Happy mood: ^ ^ eyes and a big open smile. */
  happy?: boolean;
  /** Eye openness from `useBlink()` (1 open, 0 closed). */
  blink: SharedValue<number>;
  /** Show pink cheeks (default true). */
  blush?: boolean;
}

const MOUTH_COLOR = '#E0446A';

/**
 * Reusable cute face drawn with Skia: big eyes with highlights, pink cheeks
 * and a smile. Must be rendered inside a <Canvas>. Shared by the sun, clouds,
 * trees and later the animals, so every character has the same visual style.
 */
export function KawaiiFace({ cx, cy, size, happy = false, blink, blush = true }: KawaiiFaceProps) {
  const eyeDX = size * 0.22;
  const eyeY = cy - size * 0.04;
  const eyeR = size * 0.085;
  const stroke = Math.max(1.5, size * 0.045);

  const leftEye = useDerivedValue(() => [{ scaleY: blink.value }]);
  const rightEye = useDerivedValue(() => [{ scaleY: blink.value }]);

  const paths = useMemo(() => {
    const happyEye = (ex: number) =>
      Skia.PathBuilder.Make()
        .moveTo(ex - eyeR, eyeY + eyeR * 0.35)
        .quadTo(ex, eyeY - eyeR * 1.2, ex + eyeR, eyeY + eyeR * 0.35)
        .build();
    const smile = Skia.PathBuilder.Make()
      .moveTo(cx - size * 0.1, cy + size * 0.1)
      .quadTo(cx, cy + size * 0.22, cx + size * 0.1, cy + size * 0.1)
      .build();
    const bigSmile = Skia.PathBuilder.Make()
      .moveTo(cx - size * 0.15, cy + size * 0.07)
      .quadTo(cx, cy + size * 0.42, cx + size * 0.15, cy + size * 0.07)
      .close()
      .build();
    return {
      happyLeft: happyEye(cx - eyeDX),
      happyRight: happyEye(cx + eyeDX),
      smile,
      bigSmile,
    };
  }, [cx, cy, size, eyeDX, eyeY, eyeR]);

  return (
    <Group>
      {blush && (
        <>
          <Circle cx={cx - size * 0.36} cy={cy + size * 0.1} r={size * 0.08} color={colors.candyPink} opacity={0.6} />
          <Circle cx={cx + size * 0.36} cy={cy + size * 0.1} r={size * 0.08} color={colors.candyPink} opacity={0.6} />
        </>
      )}

      {happy ? (
        <>
          <Path path={paths.happyLeft} color={colors.ink} style="stroke" strokeWidth={stroke} strokeCap="round" />
          <Path path={paths.happyRight} color={colors.ink} style="stroke" strokeWidth={stroke} strokeCap="round" />
          <Path path={paths.bigSmile} color={MOUTH_COLOR} />
          <Path path={paths.bigSmile} color={colors.ink} style="stroke" strokeWidth={stroke * 0.8} strokeJoin="round" />
        </>
      ) : (
        <>
          <Group origin={vec(cx - eyeDX, eyeY)} transform={leftEye}>
            <Oval x={cx - eyeDX - eyeR * 0.85} y={eyeY - eyeR} width={eyeR * 1.7} height={eyeR * 2} color={colors.ink} />
            <Circle cx={cx - eyeDX + eyeR * 0.3} cy={eyeY - eyeR * 0.4} r={eyeR * 0.35} color={colors.white} />
          </Group>
          <Group origin={vec(cx + eyeDX, eyeY)} transform={rightEye}>
            <Oval x={cx + eyeDX - eyeR * 0.85} y={eyeY - eyeR} width={eyeR * 1.7} height={eyeR * 2} color={colors.ink} />
            <Circle cx={cx + eyeDX + eyeR * 0.3} cy={eyeY - eyeR * 0.4} r={eyeR * 0.35} color={colors.white} />
          </Group>
          <Path path={paths.smile} color={colors.ink} style="stroke" strokeWidth={stroke} strokeCap="round" />
        </>
      )}
    </Group>
  );
}
