import { Canvas, Circle, Group, Path, Rect, rrect, rect } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import type { FlagId } from '@/i18n';
import { colors } from '@/theme';

import { starPath } from './art/shapes';

interface FlagProps {
  id: FlagId;
  width: number;
  height: number;
}

/** Turkish flag: red field, white crescent and star (official proportions, simplified). */
function TurkishFlag({ width: w, height: h }: { width: number; height: number }) {
  const star = useMemo(() => starPath(h * 0.83, h / 2, h * 0.125, h * 0.05, Math.PI), [h]);
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} color="#E30A17" />
      <Circle cx={h * 0.5} cy={h / 2} r={h * 0.25} color={colors.white} />
      <Circle cx={h * 0.5625} cy={h / 2} r={h * 0.2} color="#E30A17" />
      <Path path={star} color={colors.white} />
    </>
  );
}

/** US flag, simplified for small sizes: 13 stripes, canton with a grid of dots. */
function UsFlag({ width: w, height: h }: { width: number; height: number }) {
  const stripeH = h / 13;
  const cantonW = w * 0.4;
  const cantonH = stripeH * 7;
  const stars: { x: number; y: number }[] = [];
  const cols = 5;
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      stars.push({
        x: (cantonW / cols) * (c + 0.5),
        y: (cantonH / rows) * (r + 0.5),
      });
    }
  }
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => (
        <Rect
          key={i}
          x={0}
          y={i * stripeH}
          width={w}
          height={stripeH + 0.5}
          color={i % 2 === 0 ? '#B22234' : colors.white}
        />
      ))}
      <Rect x={0} y={0} width={cantonW} height={cantonH} color="#3C3B6E" />
      {stars.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={Math.max(1, h * 0.03)} color={colors.white} />
      ))}
    </>
  );
}

/** Rounded flag drawn with Skia (no image assets needed). */
export function Flag({ id, width, height }: FlagProps) {
  const clip = rrect(rect(0, 0, width, height), height * 0.18, height * 0.18);
  return (
    <Canvas style={{ width, height }}>
      <Group clip={clip}>
        {id === 'tr' ? (
          <TurkishFlag width={width} height={height} />
        ) : (
          <UsFlag width={width} height={height} />
        )}
      </Group>
    </Canvas>
  );
}
