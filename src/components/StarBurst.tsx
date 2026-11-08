import { Canvas, Group, Path, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { rainbow } from '@/theme';

import { starPath } from './art/shapes';

const STAR_COUNT = 16;

interface StarBurstProps {
  /** Side of the square area the stars fly out in (centered). */
  size: number;
}

/**
 * A burst of rainbow stars flying out from the center and fading away.
 * Plays once on mount: render it with a new `key` to play it again.
 */
export function StarBurst({ size }: StarBurstProps) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [progress]);

  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        angle: (i / STAR_COUNT) * Math.PI * 2 + (i % 3) * 0.15,
        distance: size * (0.32 + (i % 4) * 0.05),
        radius: size * (0.035 + (i % 3) * 0.012),
        color: rainbow[i % rainbow.length],
      })),
    [size],
  );

  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      {stars.map((s, i) => (
        <Star key={i} {...s} center={size / 2} progress={progress} />
      ))}
    </Canvas>
  );
}

interface StarProps {
  angle: number;
  distance: number;
  radius: number;
  color: string;
  center: number;
  progress: SharedValue<number>;
}

function Star({ angle, distance, radius, color, center, progress }: StarProps) {
  const path = useMemo(() => starPath(0, 0, radius, radius * 0.45), [radius]);
  const transform = useDerivedValue(() => [
    { translateX: center + Math.cos(angle) * distance * progress.value },
    { translateY: center + Math.sin(angle) * distance * progress.value },
    { rotate: progress.value * Math.PI * 1.5 },
    { scale: 0.4 + progress.value * 0.8 },
  ]);
  const opacity = useDerivedValue(() => 1 - progress.value * progress.value);
  return (
    <Group transform={transform} origin={vec(0, 0)} opacity={opacity}>
      <Path path={path} color={color} />
    </Group>
  );
}
