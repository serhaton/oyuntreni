/// <reference types="node" />
/**
 * Tracing rules test: simulates children's finger traces against every glyph
 * in src/data/glyphs.ts, on a phone-sized and a tablet-sized canvas.
 *
 *   npm run test:tracing
 *
 * Run it after adding or changing glyphs or the TRACING config.
 */
import { GLYPHS, numberGlyph, type Glyph, type Point } from '../src/data/glyphs';
import { NUMBERS } from '../src/data/numbers';
import { pointAlong, resample } from '../src/utils/geometry';
import { isDotStroke, judgeMove, judgeRelease, judgeStart, makeJudgeParams } from '../src/utils/tracingJudge';

type Outcome = 'accept' | 'miss';

/** Feeds a finger path to the judge exactly like the gesture handler does. */
function run(finger: Point[], stroke: Point[], size: number): { outcome: Outcome; coverage: number } {
  const p = makeJudgeParams(size);
  const cps = resample(stroke, Math.max(2, size * 0.015));
  let progress = judgeStart(finger[0], cps, p);
  // A dot is accepted the moment it's tapped (same as the gesture handler).
  if (isDotStroke(cps)) return { outcome: progress === 0 ? 'accept' : 'miss', coverage: progress === 0 ? 1 : 0 };
  let off = 0;
  let last = finger[0];
  for (const f of finger.slice(1)) {
    const moved = Math.hypot(f.x - last.x, f.y - last.y);
    if (moved < 2) continue;
    last = f;
    const r = judgeMove(progress, off, f, moved, stroke, cps, p);
    progress = r.progress;
    off = r.offPath;
    if (r.verdict !== 'continue') return { outcome: r.verdict, coverage: progress / (cps.length - 1) };
  }
  return {
    outcome: judgeRelease(progress, cps, finger[finger.length - 1], p) ? 'accept' : 'miss',
    coverage: Math.max(0, progress / (cps.length - 1)),
  };
}

/**
 * Finger samples following the stroke (straight or curved) from fraction t0
 * to t1, every ~`step` points. `side(k, n)` shifts each sample sideways
 * (perpendicular to the stroke) to simulate wobble or slips.
 */
function trace(
  stroke: Point[],
  t0: number,
  t1: number,
  step: number,
  side: (k: number, n: number) => number = () => 0,
): Point[] {
  const dense = resample(stroke, 1);
  const len = dense.length - 1;
  const n = Math.max(2, Math.ceil((Math.abs(t1 - t0) * len) / step));
  const out: Point[] = [];
  for (let k = 0; k <= n; k++) {
    const t = t0 + ((t1 - t0) * k) / n;
    // Extrapolate a little before the start (t < 0) along the first direction.
    const tc = Math.max(0, Math.min(1, t));
    const at = pointAlong(dense, tc);
    const ahead = pointAlong(dense, Math.min(1, tc + 0.01));
    const behind = pointAlong(dense, Math.max(0, tc - 0.01));
    const dx = ahead.x - behind.x;
    const dy = ahead.y - behind.y;
    const dl = Math.hypot(dx, dy) || 1;
    const extra = t < 0 ? t * len : 0;
    const w = side(k, n);
    out.push({
      x: at.x + (dx / dl) * extra - (dy / dl) * w,
      y: at.y + (dy / dl) * extra + (dx / dl) * w,
    });
  }
  return out;
}

// Every single glyph, plus the multi-digit numbers built from digits (12, 1000...).
const ALL_GLYPHS: [string, Glyph][] = [
  ...Object.entries(GLYPHS),
  ...NUMBERS.filter((n) => n.value >= 10).map((n) => [String(n.value), numberGlyph(n.value)!] as [string, Glyph]),
];

let failures = 0;
let total = 0;
function expect(name: string, got: Outcome, want: Outcome, coverage: number) {
  total++;
  if (got !== want) {
    failures++;
    console.log(`FAIL  ${name.padEnd(60)} -> ${got}, expected ${want} (coverage ${(coverage * 100).toFixed(0)}%)`);
  }
}

for (const size of [300, 690]) {
  const tol = makeJudgeParams(size).tolerance;
  for (const [char, glyph] of ALL_GLYPHS) {
    glyph.strokes.forEach((s, i) => {
      const width = size * (glyph.aspect ?? 1);
      const stroke = s.map((q) => ({ x: q.x * width, y: q.y * size }));
      const label = `[${size}pt] ${char} stroke ${i + 1}`;
      const check = (name: string, finger: Point[], want: Outcome) => {
        const r = run(finger, stroke, size);
        expect(`${label}: ${name}`, r.outcome, want, r.coverage);
      };

      // Dots: tapping on or near them counts, tapping far away doesn't.
      if (stroke.length === 1) {
        const d = stroke[0];
        check('tap on the dot', [d], 'accept');
        check('tap a little off the dot', [{ x: d.x + tol * 0.9, y: d.y + tol * 0.5 }], 'accept');
        check('tap far from the dot', [{ x: d.x + tol * 2.5, y: d.y }], 'miss');
        return;
      }

      // Strokes shorter than a few tolerances (e.g. the cedilla hook) are too
      // short to judge direction: the start circle covers most of them.
      const length = resample(stroke, 1).length - 1;
      const canJudgeDirection = length > tol * 3;

      // Should be accepted (be generous!)
      check('perfect', trace(stroke, 0, 1, 4), 'accept');
      check('wobbly (±0.8 tolerance)', trace(stroke, 0, 1, 4, (k) => Math.sin(k * 0.7) * tol * 0.8), 'accept');
      check('0.9 tolerance to one side', trace(stroke, 0, 1, 4, () => tol * 0.9), 'accept');
      check('very fast finger (30pt jumps)', trace(stroke, 0, 1, 30), 'accept');
      check('lifted half a tolerance before the end', trace(stroke, 0, 1 - (tol * 0.5) / length, 4), 'accept');
      // "A bit before" and "a small slip" are fixed distances, not shares of
      // the stroke: a child's finger doesn't slip further on long letters.
      check('started a bit before the dot', trace(stroke, -(tol * 0.8) / length, 1, 4, () => tol * 0.4), 'accept');
      const slipStart = 0.15;
      const slipEnd = Math.min(0.9, slipStart + (tol * 2.5) / length);
      check(
        'small slip off the path and back',
        [
          ...trace(stroke, 0, slipStart, 4),
          ...trace(stroke, slipStart, slipEnd, 3, (k, n) => Math.sin((k / n) * Math.PI) * tol * 2.2),
          ...trace(stroke, slipEnd, 1, 4),
        ],
        'accept',
      );

      // Should be a (gentle) miss
      check('lifted at 60%', trace(stroke, 0, 0.6, 4), 'miss');
      // Stopping visibly short must NOT finish the stroke by itself.
      const short = 1 - (tol * 2.5) / length;
      if (short > 0.3) check('lifted 2.5 tolerances before the end', trace(stroke, 0, short, 4), 'miss');
      if (canJudgeDirection) {
        check('wrong direction', trace(stroke, 1, 0, 4), 'miss');
        check('started in the middle', trace(stroke, 0.5, 1, 4), 'miss');
      }
      check(
        'wanders far off midway',
        [...trace(stroke, 0, 0.4, 4), ...trace(stroke, 0.4, 0.75, 4, () => tol * 3), ...trace(stroke, 0.75, 1, 4)],
        'miss',
      );
    });
  }
}

console.log(failures === 0 ? `All ${total} tracing checks passed.` : `${failures} of ${total} tracing checks FAILED.`);
process.exit(failures ? 1 : 0);
