import type { Point } from '@/data/glyphs';

/**
 * Small 2D geometry helpers. Functions marked 'worklet' also run on the UI
 * thread (inside gesture callbacks and animations).
 */

export function distance(a: Point, b: Point): number {
  'worklet';
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Distance from point p to the segment a–b. */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  'worklet';
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Shortest distance from p to a polyline. */
export function distanceToPolyline(p: Point, line: Point[]): number {
  'worklet';
  if (line.length === 1) return distance(p, line[0]);
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const d = distanceToSegment(p, line[i], line[i + 1]);
    if (d < best) best = d;
  }
  return best;
}

/** Point at fraction t (0..1) of an evenly spaced point list. */
export function pointAlong(points: Point[], t: number): Point {
  'worklet';
  const n = points.length;
  if (n === 1) return points[0];
  const f = Math.max(0, Math.min(1, t)) * (n - 1);
  const i = Math.min(n - 2, Math.floor(f));
  const k = f - i;
  return {
    x: points[i].x + (points[i + 1].x - points[i].x) * k,
    y: points[i].y + (points[i + 1].y - points[i].y) * k,
  };
}

/**
 * Re-samples a polyline into points spaced `step` apart (first and last
 * points kept). Gives uniform checkpoints regardless of how a stroke was authored.
 */
export function resample(points: Point[], step: number): Point[] {
  if (points.length < 2) return points.slice();
  const out: Point[] = [points[0]];
  let carry = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const segLen = distance(a, b);
    let d = step - carry;
    while (d <= segLen) {
      const t = d / segLen;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      d += step;
    }
    carry = segLen - (d - step);
  }
  const last = points[points.length - 1];
  if (distance(out[out.length - 1], last) > step * 0.25) out.push(last);
  return out;
}
