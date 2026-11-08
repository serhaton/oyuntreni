import { useCallback, useMemo, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { TRACING } from '@/config/tracing';
import type { Glyph, Point } from '@/data/glyphs';
import { distance, resample } from '@/utils/geometry';
import { isDotStroke, judgeMove, judgeRelease, judgeStart, makeJudgeParams } from '@/utils/tracingJudge';

export interface TracingCallbacks {
  /** A stroke was accepted (index of the finished stroke). */
  onStrokeDone?: (index: number) => void;
  /** The finger wandered off or let go too early. Be gentle! */
  onMiss?: () => void;
  /** Every stroke of the glyph is done. */
  onComplete?: () => void;
}

export interface TracingState {
  /** Pan gesture to attach to the canvas with <GestureDetector>. */
  gesture: ReturnType<typeof Gesture.Pan>;
  /** Strokes in canvas points. */
  strokes: Point[][];
  /** Evenly spaced checkpoints per stroke (canvas points). */
  checkpoints: Point[][];
  /** Index of the stroke to draw next (React state, for hints). */
  strokeIndex: number;
  completed: boolean;
  /** Same as strokeIndex but on the UI thread (no 1-frame lag for drawing). */
  activeStroke: SharedValue<number>;
  /** The child's current ink line. */
  ink: SharedValue<Point[]>;
  inkOpacity: SharedValue<number>;
  /** True while a finger is down and being tracked. */
  tracking: SharedValue<boolean>;
  /** On-path tolerance in points (for drawing sizes). */
  tolerance: number;
  /** Start over from the first stroke. */
  reset: () => void;
}

/**
 * Tracing logic for one glyph on a canvas `size` points tall (and
 * `size × glyph.aspect` wide; square unless the glyph is a multi-digit number).
 *
 * How a stroke is judged (all on the UI thread, inside the gesture):
 *  - The stroke is split into evenly spaced checkpoints.
 *  - `progress` only moves FORWARD to a checkpoint that is within tolerance of
 *    the finger and not too far ahead. So direction is enforced naturally:
 *    tracing backwards or starting at the wrong end never makes progress.
 *  - Reaching the end accepts the stroke immediately. Lifting the finger
 *    accepts it if enough was covered (TRACING.coverageRequired).
 *  - Wandering clearly off the path for a while fades the ink away gently.
 */
export function useTracing(glyph: Glyph, size: number, callbacks: TracingCallbacks = {}): TracingState {
  const strokes = useMemo(
    () => {
      const width = size * (glyph.aspect ?? 1);
      return glyph.strokes.map((s) => s.map((pt) => ({ x: pt.x * width, y: pt.y * size })));
    },
    [glyph, size],
  );
  const checkpoints = useMemo(
    () => strokes.map((s) => resample(s, Math.max(2, size * TRACING.checkpointStep))),
    [strokes, size],
  );
  const tolerance = Math.max(TRACING.minTolerancePt, size * TRACING.tolerance);

  const [strokeIndex, setStrokeIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const activeStroke = useSharedValue(0);
  const progress = useSharedValue(0);
  const offPath = useSharedValue(0);
  const tracking = useSharedValue(false);
  const ink = useSharedValue<Point[]>([]);
  const inkOpacity = useSharedValue(1);

  // Callers should pass stable callbacks (useCallback); the gesture is rebuilt if they change.
  const { onStrokeDone, onMiss, onComplete } = callbacks;

  const handleStrokeDone = useCallback(
    (index: number) => {
      onStrokeDone?.(index);
      if (index >= strokes.length - 1) {
        setStrokeIndex(strokes.length);
        setCompleted(true);
        onComplete?.();
      } else {
        setStrokeIndex(index + 1);
      }
    },
    [strokes.length, onStrokeDone, onComplete],
  );

  const handleMiss = useCallback(() => {
    onMiss?.();
  }, [onMiss]);

  const reset = useCallback(() => {
    activeStroke.set(0);
    ink.set([]);
    inkOpacity.set(1);
    tracking.set(false);
    setStrokeIndex(0);
    setCompleted(false);
  }, [activeStroke, ink, inkOpacity, tracking]);

  const gesture = useMemo(() => {
    const strokeCount = strokes.length;
    const params = makeJudgeParams(size);

    /** Accept the current stroke: ink is replaced by the neat rainbow stroke. */
    const acceptStroke = (s: number) => {
      'worklet';
      tracking.set(false);
      activeStroke.set(s + 1);
      ink.set([]);
      scheduleOnRN(handleStrokeDone, s);
    };

    /** Gently wipe the ink away; the child simply tries again. */
    const miss = () => {
      'worklet';
      tracking.set(false);
      inkOpacity.set(
        withTiming(0, { duration: 450 }, (finished) => {
          if (finished) ink.set([]);
        }),
      );
      scheduleOnRN(handleMiss);
    };

    return Gesture.Pan()
      .minDistance(0)
      .maxPointers(1)
      .onBegin((e) => {
        'worklet';
        const s = activeStroke.get();
        if (s >= strokeCount) return; // glyph already finished
        cancelAnimation(inkOpacity);
        inkOpacity.set(1);
        ink.set([{ x: e.x, y: e.y }]);
        // Must start near the start dot, otherwise this touch can't make progress.
        const start = judgeStart({ x: e.x, y: e.y }, checkpoints[s], params);
        progress.set(start);
        offPath.set(0);
        tracking.set(true);
        // A dot (i, j, ö, ü...) is done as soon as it's tapped.
        if (isDotStroke(checkpoints[s]) && start === 0) acceptStroke(s);
      })
      .onUpdate((e) => {
        'worklet';
        if (!tracking.get()) return;
        const s = activeStroke.get();
        const cps = checkpoints[s];
        const finger = { x: e.x, y: e.y };

        // Extend the ink (skip tiny jitters).
        const pts = ink.get();
        const last = pts[pts.length - 1];
        const moved = last ? distance(last, finger) : 0;
        if (moved < 2) return;
        ink.modify((arr) => {
          'worklet';
          arr.push(finger);
          return arr;
        });

        const r = judgeMove(progress.get(), offPath.get(), finger, moved, strokes[s], cps, params);
        progress.set(r.progress);
        offPath.set(r.offPath);
        if (r.verdict === 'accept') acceptStroke(s);
        else if (r.verdict === 'miss') miss();
      })
      .onFinalize(() => {
        'worklet';
        if (!tracking.get()) return;
        const s = activeStroke.get();
        // Where the finger lifted = the last point of the ink.
        const pts = ink.get();
        const lift = pts[pts.length - 1] ?? { x: -1e6, y: -1e6 };
        if (judgeRelease(progress.get(), checkpoints[s], lift, params)) acceptStroke(s);
        else miss();
      });
  }, [strokes, checkpoints, size, activeStroke, progress, offPath, tracking, ink, inkOpacity, handleStrokeDone, handleMiss]);

  return {
    gesture,
    strokes,
    checkpoints,
    strokeIndex,
    completed,
    activeStroke,
    ink,
    inkOpacity,
    tracking,
    tolerance,
    reset,
  };
}
