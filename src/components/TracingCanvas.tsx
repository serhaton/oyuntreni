import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { TRACING } from '@/config/tracing';
import type { Glyph, Point } from '@/data/glyphs';
import { useTracing, type TracingCallbacks } from '@/hooks/useTracing';
import { colors, rainbow } from '@/theme';
import { pointAlong } from '@/utils/geometry';

interface TracingCanvasProps extends TracingCallbacks {
  glyph: Glyph;
  /** Height of the drawing area in points (see useDeviceLayout().tracingSize). Square unless the glyph has an aspect. */
  size: number;
}

/**
 * Polyline -> Skia path. A single point (a dot to tap) becomes a tiny segment,
 * which round stroke caps draw as a circle in every layer (lane, guide, ink).
 */
function toPath(points: Point[]): SkPath {
  const b = Skia.PathBuilder.Make();
  points.forEach((pt, i) => (i === 0 ? b.moveTo(pt.x, pt.y) : b.lineTo(pt.x, pt.y)));
  if (points.length === 1) b.lineTo(points[0].x + 0.01, points[0].y);
  return b.build();
}

/**
 * Letter/number tracing surface.
 *
 * Shows the glyph as a light "road" with a dotted center line, hints for the
 * next stroke (pulsing start dot, direction arrow, a little caterpillar that
 * crawls the way), and draws the child's finger as a rainbow line.
 *
 * To trace a different glyph or size, give the component a new `key` so all
 * state starts fresh.
 */
export function TracingCanvas({ glyph, size, onStrokeDone, onMiss, onComplete }: TracingCanvasProps) {
  const t = useTracing(glyph, size, { onStrokeDone, onMiss, onComplete });
  // Multi-digit numbers are wider than tall; everything else is square.
  const width = size * (glyph.aspect ?? 1);
  // Pull shared values out first: worklets must capture only these, never the
  // whole `t` object (it also holds the gesture, which can't go to the UI thread).
  const { ink, tracking } = t;

  const laneW = size * TRACING.laneWidth;
  const inkW = size * TRACING.inkWidth;
  const dotSize = size * TRACING.dotSize;
  const dotGap = size * TRACING.dotGap;

  const strokePaths = useMemo(() => t.strokes.map(toPath), [t.strokes]);

  // The child's ink as a Skia path, rebuilt on the UI thread as the finger moves.
  const inkPath = useDerivedValue(() => {
    const pts = ink.value;
    const b = Skia.PathBuilder.Make();
    if (pts.length > 0) {
      b.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) b.lineTo(pts[i].x, pts[i].y);
      if (pts.length === 1) b.lineTo(pts[0].x + 0.1, pts[0].y); // show a dot on first touch
    }
    return b.build();
  });

  // Sparkle that follows the fingertip while drawing.
  const tip = useDerivedValue(() => {
    const pts = ink.value;
    return pts.length ? pts[pts.length - 1] : { x: -100, y: -100 };
  });
  const tipOpacity = useDerivedValue(() => (tracking.value ? 1 : 0));

  // Celebration glow once the whole glyph is done.
  const glow = useSharedValue(0);
  useEffect(() => {
    if (t.completed) {
      glow.set(
        withRepeat(
          withSequence(withTiming(1, { duration: 500 }), withTiming(0.35, { duration: 500 })),
          -1,
          true,
        ),
      );
    } else {
      glow.set(0);
    }
  }, [t.completed, glow]);

  const rainbowShader = (
    <LinearGradient start={vec(0, 0)} end={vec(width, size)} colors={[...rainbow]} />
  );

  const current = t.completed ? null : t.strokeIndex;

  return (
    <GestureDetector gesture={t.gesture}>
      <View style={[styles.board, { width, height: size, borderRadius: size * 0.08 }]}>
        <Canvas style={{ width, height: size }}>
          <RoundedRect x={0} y={0} width={width} height={size} r={size * 0.08} color={colors.white} />

          {/* Guide: light road + dotted center line */}
          {strokePaths.map((p, i) => (
            <Path key={`lane${i}`} path={p} style="stroke" strokeWidth={laneW} strokeCap="round" strokeJoin="round" color={colors.tracingLane} />
          ))}
          {strokePaths.map((p, i) => (
            <Path key={`dots${i}`} path={p} style="stroke" strokeWidth={dotSize} strokeCap="round" color={colors.inkSoft} opacity={0.55}>
              <DashPathEffect intervals={[0.1, dotGap]} />
            </Path>
          ))}

          {/* Glow behind the finished letter */}
          <Group opacity={glow}>
            {strokePaths.map((p, i) => (
              <Path key={`glow${i}`} path={p} style="stroke" strokeWidth={inkW * 1.8} strokeCap="round" color={colors.sunGlow}>
                <BlurMask blur={size * 0.025} style="normal" />
              </Path>
            ))}
          </Group>

          {/* Finished strokes, neatly redrawn in rainbow colors */}
          {strokePaths.map((p, i) => (
            <DoneStroke key={`done${i}`} index={i} path={p} width={inkW} activeStroke={t.activeStroke}>
              {rainbowShader}
            </DoneStroke>
          ))}

          {/* Hints for the next stroke */}
          {current != null && (
            <StrokeHints
              key={`hint${current}`}
              points={t.checkpoints[current]}
              size={size}
              tracking={t.tracking}
            />
          )}

          {/* The child's rainbow ink */}
          <Path path={inkPath} style="stroke" strokeWidth={inkW} strokeCap="round" strokeJoin="round" opacity={t.inkOpacity}>
            {rainbowShader}
          </Path>
          <Group opacity={tipOpacity}>
            <Circle c={tip} r={inkW * 0.75} color={colors.white} opacity={0.9} />
            <Circle c={tip} r={inkW * 0.35} color={colors.sun} />
          </Group>
        </Canvas>
      </View>
    </GestureDetector>
  );
}

interface DoneStrokeProps {
  index: number;
  path: SkPath;
  width: number;
  activeStroke: SharedValue<number>;
  children: React.ReactNode;
}

/** A finished stroke: appears the instant the UI thread accepts it (no React lag). */
function DoneStroke({ index, path, width, activeStroke, children }: DoneStrokeProps) {
  const opacity = useDerivedValue(() => (activeStroke.value > index ? 1 : 0));
  return (
    <Path path={path} style="stroke" strokeWidth={width} strokeCap="round" strokeJoin="round" opacity={opacity}>
      {children}
    </Path>
  );
}

interface StrokeHintsProps {
  /** Evenly spaced points of the stroke to draw next. */
  points: Point[];
  size: number;
  tracking: SharedValue<boolean>;
}

const CATERPILLAR_SEGMENTS = 5;

/**
 * Hints for the next stroke: a pulsing start dot, a direction arrow and a
 * caterpillar crawling along the way. They hide while the finger is down.
 */
function StrokeHints({ points, size, tracking }: StrokeHintsProps) {
  const start = points[0];
  const isDot = points.length === 1;
  const dotR = size * 0.045;

  const pulse = useSharedValue(0);
  const crawl = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 650, easing: Easing.inOut(Easing.sin) }), -1, true));
    crawl.set(
      withRepeat(
        withSequence(
          withDelay(400, withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) })),
          withDelay(600, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );
  }, [pulse, crawl]);

  const visible = useDerivedValue(() => (tracking.value ? 0 : 1));
  const startR = useDerivedValue(() => dotR * (1 + pulse.value * 0.35));
  const ringR = useDerivedValue(() => dotR * (1.4 + pulse.value * 0.8));
  const ringOpacity = useDerivedValue(() => 0.5 * (1 - pulse.value));

  // Arrow (chevron) a little way along the stroke, pointing the drawing direction.
  const arrow = useMemo(() => {
    // Place it a fixed distance from the start (but within the first third of short strokes).
    const frac = Math.min(0.35, (size * 0.16) / Math.max(1, strokeLength(points)));
    const at = pointAlong(points, frac);
    const ahead = pointAlong(points, Math.min(1, frac + 0.05));
    const ang = Math.atan2(ahead.y - at.y, ahead.x - at.x);
    const a = size * 0.035;
    // Direction (dx, dy) and its perpendicular (px, py).
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const px = -dy;
    const py = dx;
    return Skia.PathBuilder.Make()
      .moveTo(at.x - dx * a + px * a, at.y - dy * a + py * a)
      .lineTo(at.x + dx * a, at.y + dy * a)
      .lineTo(at.x - dx * a - px * a, at.y - dy * a - py * a)
      .build();
  }, [points, size]);

  return (
    <Group opacity={visible}>
      {/* A dot has no direction: just the pulsing "tap me" circle. */}
      {!isDot && <Caterpillar points={points} crawl={crawl} size={size} />}
      {!isDot && (
        <Path path={arrow} style="stroke" strokeWidth={size * 0.022} strokeCap="round" strokeJoin="round" color={colors.orange} />
      )}
      <Circle cx={start.x} cy={start.y} r={ringR} color={colors.grass} opacity={ringOpacity} />
      <Circle cx={start.x} cy={start.y} r={startR} color={colors.white} />
      <Circle cx={start.x} cy={start.y} r={dotR * 0.75} color={colors.grass} />
    </Group>
  );
}

function strokeLength(points: Point[]) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

interface CaterpillarProps {
  points: Point[];
  crawl: SharedValue<number>;
  size: number;
}

/** A little caterpillar that crawls along the stroke to show the way. */
function Caterpillar({ points, crawl, size }: CaterpillarProps) {
  const r = size * 0.028;
  // Spacing between body segments, as a fraction of the stroke length.
  const spacing = Math.min(0.08, (r * 1.5) / Math.max(1, strokeLength(points)));
  return (
    <Group>
      {Array.from({ length: CATERPILLAR_SEGMENTS }, (_, k) => CATERPILLAR_SEGMENTS - 1 - k).map((k) => (
        <CaterpillarSegment key={k} points={points} crawl={crawl} offset={k * spacing} r={r * (k === 0 ? 1.25 : 1 - k * 0.06)} head={k === 0} />
      ))}
    </Group>
  );
}

interface SegmentProps {
  points: Point[];
  crawl: SharedValue<number>;
  /** How far behind the head this segment is (fraction of the stroke). */
  offset: number;
  r: number;
  head: boolean;
}

function CaterpillarSegment({ points, crawl, offset, r, head }: SegmentProps) {
  const c = useDerivedValue(() => {
    const p = pointAlong(points, crawl.value - offset);
    // A little up-and-down wiggle as it crawls.
    return { x: p.x, y: p.y - Math.abs(Math.sin((crawl.value - offset) * 40)) * r * 0.3 };
  });
  const leftEye = useDerivedValue(() => ({ x: c.value.x - r * 0.38, y: c.value.y - r * 0.15 }));
  const rightEye = useDerivedValue(() => ({ x: c.value.x + r * 0.38, y: c.value.y - r * 0.15 }));
  const opacity = useDerivedValue(() => (crawl.value - offset < 0 ? 0 : 1));

  return (
    <Group opacity={opacity}>
      <Circle c={c} r={r} color={head ? colors.grass : colors.grassLight} />
      {head && (
        <>
          <Circle c={leftEye} r={r * 0.2} color={colors.ink} />
          <Circle c={rightEye} r={r * 0.2} color={colors.ink} />
        </>
      )}
    </Group>
  );
}

const styles = StyleSheet.create({
  board: {
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
});
