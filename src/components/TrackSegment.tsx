import { Canvas, DashPathEffect, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { colors } from '@/theme';

interface Point {
  x: number;
  y: number;
}

interface TrackSegmentProps {
  /** Start and end of the segment (screen/content points): two station centers. */
  from: Point;
  to: Point;
  /** Overall width of the track (sleepers). */
  width: number;
}

/** Point on a cubic Bézier at t. */
function cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

/**
 * One piece of railway between two stations on the map: a gentle S-curve
 * with wooden sleepers and two steel rails. Each segment is its own small
 * canvas (one huge canvas for a long line could exceed the GPU size limit).
 */
export function TrackSegment({ from, to, width }: TrackSegmentProps) {
  const pad = width;
  const left = Math.min(from.x, to.x) - pad;
  const top = Math.min(from.y, to.y) - pad;
  const boxW = Math.abs(to.x - from.x) + pad * 2;
  const boxH = Math.abs(to.y - from.y) + pad * 2;

  const { center, railA, railB } = useMemo(() => {
    const a = { x: from.x - left, y: from.y - top };
    const b = { x: to.x - left, y: to.y - top };
    // Horizontal tangents at both stations make a smooth S between them.
    const dx = (b.x - a.x) / 2;
    const c1 = { x: a.x + dx, y: a.y };
    const c2 = { x: b.x - dx, y: b.y };
    const centerPath = Skia.PathBuilder.Make().moveTo(a.x, a.y).cubicTo(c1.x, c1.y, c2.x, c2.y, b.x, b.y).build();

    // Rails: the center line offset to both sides along its normal.
    const gauge = width * 0.3;
    const steps = 24;
    const pa = Skia.PathBuilder.Make();
    const pb = Skia.PathBuilder.Make();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = cubic(a, c1, c2, b, t);
      const q = cubic(a, c1, c2, b, Math.min(1, t + 0.01));
      const r = cubic(a, c1, c2, b, Math.max(0, t - 0.01));
      const tx = q.x - r.x;
      const ty = q.y - r.y;
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      pa[method](p.x + nx * gauge, p.y + ny * gauge);
      pb[method](p.x - nx * gauge, p.y - ny * gauge);
    }
    return { center: centerPath, railA: pa.build(), railB: pb.build() };
  }, [from.x, from.y, to.x, to.y, left, top, width]);

  return (
    <Canvas style={{ position: 'absolute', left, top, width: boxW, height: boxH }} pointerEvents="none">
      {/* Wooden sleepers */}
      <Path path={center} style="stroke" strokeWidth={width} color={colors.sleeper}>
        <DashPathEffect intervals={[width * 0.22, width * 0.28]} />
      </Path>
      {/* Steel rails with a little shine */}
      <Path path={railA} style="stroke" strokeWidth={width * 0.14} strokeCap="round" color={colors.rail} />
      <Path path={railB} style="stroke" strokeWidth={width * 0.14} strokeCap="round" color={colors.rail} />
      <Path path={railA} style="stroke" strokeWidth={width * 0.05} strokeCap="round" color={colors.railShine} />
      <Path path={railB} style="stroke" strokeWidth={width * 0.05} strokeCap="round" color={colors.railShine} />
    </Canvas>
  );
}
