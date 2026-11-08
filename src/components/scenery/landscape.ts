import { Skia, rect, rrect } from '@shopify/react-native-skia';

import type { HillBump } from '@/data/scenery';

/** Positive modulo that also works on the UI thread. */
export function wrap(value: number, period: number): number {
  'worklet';
  return ((value % period) + period) % period;
}

/**
 * Builds a filled hill silhouette that repeats every `periodPx`, drawn
 * `copies` times side by side so the layer can scroll seamlessly.
 * Every bump starts and ends at the baseline, so tiles join without a seam.
 */
export function buildHillPath(
  bumps: HillBump[],
  periodPx: number,
  baseY: number,
  screenH: number,
  copies: number,
) {
  const b = Skia.PathBuilder.Make();
  b.moveTo(0, screenH);
  b.lineTo(0, baseY);
  for (let c = 0; c < copies; c++) {
    const offset = c * periodPx;
    for (const bump of bumps) {
      const x0 = offset + bump.from * periodPx;
      const x1 = offset + bump.to * periodPx;
      b.lineTo(x0, baseY);
      // A quadratic curve's apex is half way to its control point, hence 2x.
      b.quadTo((x0 + x1) / 2, baseY - 2 * bump.peak * screenH, x1, baseY);
    }
  }
  b.lineTo(copies * periodPx, screenH);
  b.close();
  return b.build();
}

/** Y of the hill surface at `xFrac` (0..1 of the tile), matching buildHillPath. */
export function hillSurfaceY(bumps: HillBump[], xFrac: number, baseY: number, screenH: number) {
  const bump = bumps.find((b) => xFrac >= b.from && xFrac <= b.to);
  if (!bump) return baseY;
  const t = (xFrac - bump.from) / (bump.to - bump.from);
  return baseY - 4 * t * (1 - t) * bump.peak * screenH;
}

/**
 * Railway sleepers repeating along the track. The spacing is adjusted so a
 * whole number of sleepers fits in `periodPx`, keeping the scroll seamless.
 */
export function buildSleepersPath(
  periodPx: number,
  targetSpacing: number,
  railY: number,
  height: number,
  copies: number,
) {
  const perTile = Math.max(1, Math.round(periodPx / targetSpacing));
  const spacing = periodPx / perTile;
  const w = spacing * 0.42;
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < perTile * copies; i++) {
    const x = i * spacing + (spacing - w) / 2;
    b.addRRect(rrect(rect(x, railY - height * 0.15, w, height), height * 0.25, height * 0.25));
  }
  return b.build();
}

/** Little "v v" grass tufts repeating along the ground. */
export function buildTuftsPath(periodPx: number, y: number, size: number, copies: number) {
  const b = Skia.PathBuilder.Make();
  const perTile = 6;
  for (let c = 0; c < copies; c++) {
    for (let i = 0; i < perTile; i++) {
      const x = c * periodPx + (i + 0.5) * (periodPx / perTile) + (i % 2) * size;
      const yy = y + (i % 3) * size * 0.9;
      b.moveTo(x - size, yy - size);
      b.lineTo(x - size * 0.4, yy);
      b.lineTo(x, yy - size * 1.3);
      b.lineTo(x + size * 0.4, yy);
      b.lineTo(x + size, yy - size);
    }
  }
  return b.build();
}
