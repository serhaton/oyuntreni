import { TRACING } from '@/config/tracing';
import type { Point } from '@/data/glyphs';

import { distance, distanceToPolyline } from './geometry';

/**
 * Pure tracing rules, kept separate from gestures and rendering so they can
 * run on the UI thread (they are worklets) AND be unit-tested in Node.
 *
 * Rules for one stroke (it must be drawn in one touch):
 *  - The touch must begin near the stroke's start dot (`judgeStart`).
 *    Otherwise the ink still shows, but no progress is counted.
 *  - The stroke is split into evenly spaced checkpoints. `progress` follows
 *    the checkpoint NEAREST to the finger, searching only forward (up to
 *    `lookahead` checkpoints ahead, so quick fingers still get through).
 *    Moving backwards never increases progress, so direction is enforced.
 *  - Reaching the last checkpoint accepts the stroke right away.
 *  - Wandering off the path (beyond tolerance × offPathFactor) for longer
 *    than tolerance × offPathGrace is a (gentle) miss.
 *  - On release, the stroke is accepted only if most of it was covered AND
 *    the finger lifted close to the end (see judgeRelease).
 */

/** `progress` value meaning "this touch didn't start at the start dot". */
export const INVALID_START = -1;

export interface JudgeParams {
  tolerance: number;
  startRadius: number;
  lookahead: number;
  offLimit: number;
  offGrace: number;
  minCoverage: number;
  endRadius: number;
}

export type MoveVerdict = 'continue' | 'accept' | 'miss';

export interface MoveResult {
  progress: number;
  offPath: number;
  verdict: MoveVerdict;
}

/** Builds the parameters for a canvas of `size` points. */
export function makeJudgeParams(size: number): JudgeParams {
  const tolerance = Math.max(TRACING.minTolerancePt, size * TRACING.tolerance);
  const step = Math.max(2, size * TRACING.checkpointStep);
  return {
    tolerance,
    startRadius: tolerance * TRACING.startFactor,
    // Enough to follow a finger jumping ~2 tolerances between two touch samples.
    lookahead: Math.max(3, Math.ceil((tolerance * 2) / step)),
    offLimit: tolerance * TRACING.offPathFactor,
    offGrace: tolerance * TRACING.offPathGrace,
    minCoverage: TRACING.minCoverage,
    endRadius: tolerance * TRACING.endRadiusFactor,
  };
}

/** A single-point stroke is a dot: it is completed by tapping it. */
export function isDotStroke(checkpoints: Point[]): boolean {
  'worklet';
  return checkpoints.length === 1;
}

/** Finger went down: returns the initial progress (0, or INVALID_START). */
export function judgeStart(finger: Point, checkpoints: Point[], p: JudgeParams): number {
  'worklet';
  return distance(finger, checkpoints[0]) <= p.startRadius ? 0 : INVALID_START;
}

/**
 * One finger movement.
 * @param moved distance travelled since the previous sample (points)
 * @param stroke the stroke's polyline, @param checkpoints its resampled points
 */
export function judgeMove(
  progress: number,
  offPath: number,
  finger: Point,
  moved: number,
  stroke: Point[],
  checkpoints: Point[],
  p: JudgeParams,
): MoveResult {
  'worklet';
  if (distanceToPolyline(finger, stroke) > p.offLimit) {
    const off = offPath + moved;
    return { progress, offPath: off, verdict: off > p.offGrace ? 'miss' : 'continue' };
  }
  if (progress === INVALID_START) return { progress, offPath: 0, verdict: 'continue' };

  // Nearest checkpoint among the current one and the next `lookahead`.
  const to = Math.min(checkpoints.length - 1, progress + p.lookahead);
  let nearest = progress;
  let nearestD = Infinity;
  for (let j = progress; j <= to; j++) {
    const d = distance(finger, checkpoints[j]);
    if (d < nearestD) {
      nearestD = d;
      nearest = j;
    }
  }
  const next = nearestD <= p.tolerance && nearest > progress ? nearest : progress;
  return {
    progress: next,
    offPath: 0,
    verdict: next >= checkpoints.length - 1 ? 'accept' : 'continue',
  };
}

/**
 * Finger lifted at `finger`: accept if the touch started right, covered most
 * of the stroke and lifted close to its end point.
 */
export function judgeRelease(progress: number, checkpoints: Point[], finger: Point, p: JudgeParams): boolean {
  'worklet';
  const total = checkpoints.length - 1;
  if (progress === INVALID_START || total <= 0) return false;
  return progress / total >= p.minCoverage && distance(finger, checkpoints[total]) <= p.endRadius;
}
