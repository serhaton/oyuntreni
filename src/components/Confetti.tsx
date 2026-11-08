import { Canvas, Circle, Group, RoundedRect } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { rainbow } from '@/theme';

const PIECES = 70;
const DURATION = 4200;

/** Pseudo-random 0..1 from two numbers: varied but pure (same input, same output). */
function noise(i: number, k: number): number {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

interface Piece {
  x: number;
  delay: number; // 0..0.4 share of the animation before this piece starts falling
  fall: number; // 0.45..0.6 share of the animation the fall takes
  sway: number;
  spin: number;
  size: number;
  color: string;
  round: boolean;
}

/**
 * A shower of colorful confetti falling over the whole screen, once.
 * Render it with a new `key` to play it again. Never blocks touches.
 */
export function Confetti() {
  const { width: W, height: H, s } = useDeviceLayout();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(1, { duration: DURATION, easing: Easing.linear }));
  }, [progress]);

  // Scattered pieces (pseudo-random, so the shower looks natural but stays stable).
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        x: noise(i, 1) * W,
        delay: noise(i, 2) * 0.4,
        fall: 0.45 + noise(i, 3) * 0.15,
        sway: (12 + noise(i, 4) * 28) * (noise(i, 5) < 0.5 ? -1 : 1),
        spin: (2 + noise(i, 6) * 6) * (noise(i, 7) < 0.5 ? -1 : 1),
        size: s(7) + noise(i, 8) * s(8),
        color: rainbow[i % rainbow.length],
        round: i % 3 === 0,
      })),
    [W, s],
  );

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} progress={progress} height={H} />
      ))}
    </Canvas>
  );
}

function ConfettiPiece({ piece, progress, height }: { piece: Piece; progress: SharedValue<number>; height: number }) {
  const transform = useDerivedValue(() => {
    const t = Math.min(1, Math.max(0, (progress.value - piece.delay) / piece.fall));
    return [
      { translateX: piece.x + Math.sin(t * 6 + piece.x) * piece.sway },
      { translateY: -piece.size * 2 + t * (height + piece.size * 4) },
      { rotate: t * piece.spin },
    ];
  });
  return (
    <Group transform={transform}>
      {piece.round ? (
        <Circle cx={0} cy={0} r={piece.size / 2} color={piece.color} />
      ) : (
        <RoundedRect
          x={-piece.size / 2}
          y={-piece.size * 0.3}
          width={piece.size}
          height={piece.size * 0.6}
          r={piece.size * 0.12}
          color={piece.color}
        />
      )}
    </Group>
  );
}
