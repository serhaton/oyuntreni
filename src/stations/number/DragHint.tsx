import { Canvas, DashPathEffect, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import Animated, { useAnimatedStyle, useDerivedValue, ZoomIn } from 'react-native-reanimated';

import { useFrameClock } from '@/hooks/useFrameClock';
import { useOscillator } from '@/hooks/useOscillator';
import { colors } from '@/theme';

interface Point {
  x: number;
  y: number;
}

interface DragHintProps {
  /** Where the arrow starts (just below the toy to move), in screen points. */
  from: Point;
  /** Where it points (just above the empty wagon), in screen points. */
  to: Point;
  /** Line thickness reference (e.g. toy size). */
  scale: number;
}

/**
 * Animated "move it here" arrow for children who can't read instructions:
 * a curved arrow from a toy down to the next empty wagon. Its dashes flow
 * towards the wagon and the whole arrow bobs gently downwards.
 */
export function DragHint({ from, to, scale }: DragHintProps) {
  const pad = scale * 0.35;
  const left = Math.min(from.x, to.x) - pad;
  const top = Math.min(from.y, to.y) - pad;
  const width = Math.abs(to.x - from.x) + pad * 2;
  const height = Math.abs(to.y - from.y) + pad * 2;

  const lineW = Math.max(5, scale * 0.07);
  const headLen = lineW * 2.6;

  const { body, head } = useMemo(() => {
    const a = { x: from.x - left, y: from.y - top };
    const b = { x: to.x - left, y: to.y - top };
    // Control point above the wagon: the arrow leaves the toy sideways and
    // arrives pointing straight down into the wagon.
    const c = { x: b.x, y: a.y };
    // Stop the line a little before the tip so the head sits on top of it.
    const dirX = b.x - c.x;
    const dirY = b.y - c.y;
    const len = Math.hypot(dirX, dirY) || 1;
    const ux = dirX / len;
    const uy = dirY / len;
    const lineEnd = { x: b.x - ux * headLen * 0.6, y: b.y - uy * headLen * 0.6 };
    const bodyPath = Skia.PathBuilder.Make().moveTo(a.x, a.y).quadTo(c.x, c.y, lineEnd.x, lineEnd.y).build();
    // Arrowhead: a fat triangle pointing along the final direction.
    const px = -uy;
    const py = ux;
    const base = { x: b.x - ux * headLen, y: b.y - uy * headLen };
    const headPath = Skia.PathBuilder.Make()
      .moveTo(b.x, b.y)
      .lineTo(base.x + px * headLen * 0.75, base.y + py * headLen * 0.75)
      .lineTo(base.x - px * headLen * 0.75, base.y - py * headLen * 0.75)
      .close()
      .build();
    return { body: bodyPath, head: headPath };
  }, [from.x, from.y, to.x, to.y, left, top, headLen]);

  // Dashes march towards the wagon...
  const seconds = useFrameClock(1);
  const dashPhase = useDerivedValue(() => -seconds.value * lineW * 6);
  // ...and the arrow bobs downwards, like "put it down there".
  const bob = useOscillator(450);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (bob.value + 1) * scale * 0.06 }] }));

  return (
    // Pop-in on the outer layer, bobbing on the inner one (so they never fight over `transform`).
    <Animated.View
      entering={ZoomIn.springify()}
      pointerEvents="none"
      style={{ position: 'absolute', left, top, width, height, zIndex: 50 }}
    >
      <Animated.View style={[{ width, height }, bobStyle]}>
        <Canvas style={{ width, height }}>
        {/* White outline first, so the arrow reads on any background. */}
        <Path path={body} style="stroke" strokeWidth={lineW + 6} strokeCap="round" color={colors.white} opacity={0.9}>
          <DashPathEffect intervals={[lineW * 2.2, lineW * 1.4]} phase={dashPhase} />
        </Path>
        <Path path={body} style="stroke" strokeWidth={lineW} strokeCap="round" color={colors.orange}>
          <DashPathEffect intervals={[lineW * 2.2, lineW * 1.4]} phase={dashPhase} />
        </Path>
        <Path path={head} style="stroke" strokeWidth={6} strokeJoin="round" color={colors.white} />
        <Path path={head} color={colors.orange} />
        </Canvas>
      </Animated.View>
    </Animated.View>
  );
}
