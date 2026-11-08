/**
 * Letter and number shapes for tracing.
 *
 * Each glyph is a list of strokes in the order a child should draw them.
 * Each stroke is an ordered list of points: the child traces from the first
 * point towards the last (direction matters). A stroke with a SINGLE point
 * is a dot (i, j, İ, ö, ü): the child just taps it.
 *
 * Coordinates are normalized to a 0..1 square (x right, y down), so the same
 * data scales to any canvas size on iPhone and iPad. Keep ~0.08 margin inside
 * the square so the thick guide lane doesn't touch the edges.
 *
 * Vertical guide lines used below:
 *   Uppercase: cap top 0.10, baseline 0.90 (lower body if it has diacritics).
 *   Lowercase: ascender 0.10, x-height 0.40, baseline 0.90; letters with a
 *   descender (g ğ j p q y) are lifted: x-height 0.22, baseline 0.62, tail to ~0.95.
 *
 * Straight segments only need their end points (they're resampled densely at
 * runtime). Curves use the `arc()` helper. After editing, run
 * `npm run test:tracing` and `npm run glyphs:preview`.
 */

export interface Point {
  x: number;
  y: number;
}

export type Stroke = Point[];

export interface Glyph {
  strokes: Stroke[];
  /**
   * Width / height of the glyph's box (default 1 = square). Multi-digit
   * numbers are wider than tall: x is normalized over the width, y over the height.
   */
  aspect?: number;
}

/** Shorthand for a point. */
const p = (x: number, y: number): Point => ({ x, y });

/**
 * Points along an elliptical arc. Angles in degrees: 0 = right, 90 = down,
 * -90 = up (screen coordinates). The arc runs from `startDeg` to `endDeg`,
 * so increasing angles go clockwise and decreasing angles counter-clockwise.
 */
export function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startDeg: number,
  endDeg: number,
  steps = Math.max(6, Math.round(Math.abs(endDeg - startDeg) / 12)),
): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((startDeg + ((endDeg - startDeg) * i) / steps) * Math.PI) / 180;
    out.push(p(cx + rx * Math.cos(a), cy + ry * Math.sin(a)));
  }
  return out;
}

/** A dot to tap. */
const dot = (x: number, y: number): Stroke => [p(x, y)];

/** Cedilla hook under Ç / ç / Ş / ş, starting at (x, y). */
const cedilla = (x: number, y: number): Stroke => [p(x, y), p(x + 0.07, y + 0.07), p(x - 0.04, y + 0.13)];

/** Breve (the little cup) over Ğ / ğ, centered at x with its top at y. */
const breve = (x: number, y: number): Stroke => arc(x, y, 0.13, 0.07, 180, 0);

// ---------------------------------------------------------------------------
// Reusable shapes (so letters with diacritics share their base)
// ---------------------------------------------------------------------------

/** "C" shape: open on the right, drawn counter-clockwise from the upper right. */
const cShape = (cx: number, cy: number, rx: number, ry: number) => arc(cx, cy, rx, ry, -40, -320);

/** Full "O" loop, counter-clockwise from the top. */
const oShape = (cx: number, cy: number, rx: number, ry: number) => arc(cx, cy, rx, ry, -90, -450);

/** "S" curve between y0 and y1. */
function sShape(cx: number, y0: number, y1: number, rx: number): Point[] {
  const ry = (y1 - y0) / 4;
  const top = arc(cx, y0 + ry, rx, ry, -20, -270);
  const bottom = arc(cx, y1 - ry, rx, ry, -90, 160);
  return [...top, ...bottom.slice(1)];
}

/** "U" shape from (x0, top) down, around and up to (x1, top). */
function uShape(x0: number, x1: number, top: number, bottom: number): Point[] {
  const rx = (x1 - x0) / 2;
  const ry = Math.min(rx, (bottom - top) * 0.45);
  return [p(x0, top), ...arc(x0 + rx, bottom - ry, rx, ry, 180, 0), p(x1, top)];
}

/** "G" in one stroke: a C that comes back in to the middle. */
function gShape(cx: number, cy: number, rx: number, ry: number): Point[] {
  return [...arc(cx, cy, rx, ry, -40, -360), p(cx + rx * 0.2, cy)];
}

// Lowercase helpers
/** Hump of n/h/m: from the stem at x0 up over to x1 and down to the baseline. */
const hump = (x0: number, x1: number, top: number, baseline: number): Point[] => {
  const rx = (x1 - x0) / 2;
  const ry = Math.min(rx, 0.18);
  return [p(x0, top + ry), ...arc(x0 + rx, top + ry, rx, ry, 180, 360), p(x1, baseline)];
};

// ---------------------------------------------------------------------------
// Glyph table, keyed by the character as displayed ('A', 'ğ', '3', ...).
// Letters shared by Turkish and English are defined once.
// ---------------------------------------------------------------------------
export const GLYPHS: Record<string, Glyph> = {
  // ===== Uppercase =====
  A: { strokes: [[p(0.5, 0.1), p(0.16, 0.9)], [p(0.5, 0.1), p(0.84, 0.9)], [p(0.3, 0.62), p(0.7, 0.62)]] },
  B: {
    strokes: [
      [p(0.27, 0.1), p(0.27, 0.9)],
      [p(0.27, 0.1), p(0.5, 0.1), ...arc(0.5, 0.29, 0.2, 0.19, -90, 90), p(0.27, 0.48)],
      [p(0.27, 0.48), p(0.53, 0.48), ...arc(0.53, 0.69, 0.22, 0.21, -90, 90), p(0.27, 0.9)],
    ],
  },
  C: { strokes: [cShape(0.54, 0.5, 0.36, 0.4)] },
  Ç: { strokes: [cShape(0.54, 0.42, 0.34, 0.32), cedilla(0.52, 0.76)] },
  D: { strokes: [[p(0.25, 0.1), p(0.25, 0.9)], [p(0.25, 0.1), p(0.42, 0.1), ...arc(0.42, 0.5, 0.36, 0.4, -90, 90), p(0.25, 0.9)]] },
  E: {
    strokes: [
      [p(0.28, 0.1), p(0.28, 0.9)],
      [p(0.28, 0.1), p(0.76, 0.1)],
      [p(0.28, 0.5), p(0.68, 0.5)],
      [p(0.28, 0.9), p(0.76, 0.9)],
    ],
  },
  F: { strokes: [[p(0.3, 0.1), p(0.3, 0.9)], [p(0.3, 0.1), p(0.76, 0.1)], [p(0.3, 0.5), p(0.68, 0.5)]] },
  G: { strokes: [gShape(0.52, 0.5, 0.36, 0.4)] },
  Ğ: { strokes: [gShape(0.52, 0.58, 0.34, 0.32), breve(0.52, 0.06)] },
  H: { strokes: [[p(0.22, 0.1), p(0.22, 0.9)], [p(0.78, 0.1), p(0.78, 0.9)], [p(0.22, 0.5), p(0.78, 0.5)]] },
  I: { strokes: [[p(0.5, 0.1), p(0.5, 0.9)]] },
  İ: { strokes: [[p(0.5, 0.28), p(0.5, 0.9)], dot(0.5, 0.1)] },
  J: { strokes: [[p(0.64, 0.1), p(0.64, 0.66), ...arc(0.43, 0.66, 0.21, 0.24, 0, 180)]] },
  K: { strokes: [[p(0.27, 0.1), p(0.27, 0.9)], [p(0.76, 0.1), p(0.27, 0.56)], [p(0.42, 0.42), p(0.8, 0.9)]] },
  L: { strokes: [[p(0.3, 0.1), p(0.3, 0.9)], [p(0.3, 0.9), p(0.76, 0.9)]] },
  M: {
    strokes: [
      [p(0.15, 0.1), p(0.15, 0.9)],
      [p(0.15, 0.1), p(0.5, 0.66), p(0.85, 0.1)],
      [p(0.85, 0.1), p(0.85, 0.9)],
    ],
  },
  N: { strokes: [[p(0.22, 0.1), p(0.22, 0.9)], [p(0.22, 0.1), p(0.78, 0.9)], [p(0.78, 0.9), p(0.78, 0.1)]] },
  O: { strokes: [oShape(0.5, 0.5, 0.36, 0.4)] },
  Ö: { strokes: [oShape(0.5, 0.6, 0.34, 0.3), dot(0.38, 0.12), dot(0.62, 0.12)] },
  P: { strokes: [[p(0.28, 0.1), p(0.28, 0.9)], [p(0.28, 0.1), p(0.5, 0.1), ...arc(0.5, 0.31, 0.24, 0.21, -90, 90), p(0.28, 0.52)]] },
  Q: { strokes: [oShape(0.5, 0.48, 0.36, 0.38), [p(0.58, 0.68), p(0.86, 0.92)]] },
  R: {
    strokes: [
      [p(0.28, 0.1), p(0.28, 0.9)],
      [p(0.28, 0.1), p(0.5, 0.1), ...arc(0.5, 0.31, 0.24, 0.21, -90, 90), p(0.28, 0.52)],
      [p(0.46, 0.52), p(0.8, 0.9)],
    ],
  },
  S: { strokes: [sShape(0.5, 0.1, 0.9, 0.28)] },
  Ş: { strokes: [sShape(0.5, 0.08, 0.74, 0.26), cedilla(0.5, 0.76)] },
  T: { strokes: [[p(0.15, 0.1), p(0.85, 0.1)], [p(0.5, 0.1), p(0.5, 0.9)]] },
  U: { strokes: [uShape(0.22, 0.78, 0.1, 0.9)] },
  Ü: { strokes: [uShape(0.24, 0.76, 0.28, 0.9), dot(0.38, 0.1), dot(0.62, 0.1)] },
  V: { strokes: [[p(0.15, 0.1), p(0.5, 0.9), p(0.85, 0.1)]] },
  W: { strokes: [[p(0.08, 0.1), p(0.29, 0.9), p(0.5, 0.36), p(0.71, 0.9), p(0.92, 0.1)]] },
  X: { strokes: [[p(0.2, 0.1), p(0.8, 0.9)], [p(0.8, 0.1), p(0.2, 0.9)]] },
  Y: { strokes: [[p(0.18, 0.1), p(0.5, 0.5)], [p(0.82, 0.1), p(0.5, 0.5)], [p(0.5, 0.5), p(0.5, 0.9)]] },
  Z: { strokes: [[p(0.2, 0.1), p(0.8, 0.1), p(0.2, 0.9), p(0.8, 0.9)]] },

  // ===== Lowercase =====
  a: { strokes: [cShape(0.48, 0.65, 0.26, 0.25), [p(0.74, 0.4), p(0.74, 0.9)]] },
  b: { strokes: [[p(0.28, 0.1), p(0.28, 0.9)], arc(0.52, 0.65, 0.24, 0.25, 180, 540)] },
  c: { strokes: [cShape(0.53, 0.65, 0.27, 0.25)] },
  ç: { strokes: [cShape(0.53, 0.5, 0.27, 0.24), cedilla(0.52, 0.76)] },
  d: { strokes: [arc(0.47, 0.65, 0.25, 0.25, 0, -360), [p(0.72, 0.1), p(0.72, 0.9)]] },
  e: { strokes: [[p(0.25, 0.64), p(0.77, 0.64), ...arc(0.51, 0.64, 0.26, 0.25, 0, -320)]] },
  f: { strokes: [[...arc(0.62, 0.26, 0.16, 0.16, -20, -180), p(0.46, 0.9)], [p(0.27, 0.46), p(0.68, 0.46)]] },
  g: {
    strokes: [arc(0.47, 0.42, 0.23, 0.2, 0, -360), [p(0.7, 0.22), p(0.7, 0.72), ...arc(0.47, 0.72, 0.23, 0.2, 0, 160)]],
  },
  ğ: {
    strokes: [
      arc(0.47, 0.48, 0.22, 0.18, 0, -360),
      [p(0.69, 0.3), p(0.69, 0.76), ...arc(0.47, 0.76, 0.22, 0.17, 0, 160)],
      breve(0.47, 0.07),
    ],
  },
  h: { strokes: [[p(0.28, 0.1), p(0.28, 0.9)], hump(0.28, 0.72, 0.42, 0.9)] },
  ı: { strokes: [[p(0.5, 0.4), p(0.5, 0.9)]] },
  i: { strokes: [[p(0.5, 0.4), p(0.5, 0.9)], dot(0.5, 0.2)] },
  j: { strokes: [[p(0.58, 0.34), p(0.58, 0.74), ...arc(0.4, 0.74, 0.18, 0.18, 0, 160)], dot(0.58, 0.14)] },
  k: { strokes: [[p(0.3, 0.1), p(0.3, 0.9)], [p(0.72, 0.42), p(0.3, 0.7)], [p(0.44, 0.6), p(0.75, 0.9)]] },
  l: { strokes: [[p(0.5, 0.1), p(0.5, 0.9)]] },
  m: {
    strokes: [[p(0.14, 0.4), p(0.14, 0.9)], hump(0.14, 0.5, 0.4, 0.9), hump(0.5, 0.86, 0.4, 0.9)],
  },
  n: { strokes: [[p(0.27, 0.4), p(0.27, 0.9)], hump(0.27, 0.73, 0.4, 0.9)] },
  o: { strokes: [oShape(0.5, 0.65, 0.27, 0.25)] },
  ö: { strokes: [oShape(0.5, 0.65, 0.27, 0.25), dot(0.38, 0.2), dot(0.62, 0.2)] },
  p: { strokes: [[p(0.3, 0.22), p(0.3, 0.96)], arc(0.52, 0.42, 0.22, 0.2, 180, 540)] },
  q: { strokes: [arc(0.48, 0.42, 0.22, 0.2, 0, -360), [p(0.7, 0.22), p(0.7, 0.96)]] },
  r: { strokes: [[p(0.34, 0.4), p(0.34, 0.9)], [p(0.34, 0.6), ...arc(0.54, 0.6, 0.2, 0.18, 180, 300)]] },
  s: { strokes: [sShape(0.5, 0.4, 0.9, 0.21)] },
  ş: { strokes: [sShape(0.5, 0.26, 0.74, 0.21), cedilla(0.5, 0.77)] },
  t: { strokes: [[p(0.45, 0.14), p(0.45, 0.75), ...arc(0.6, 0.75, 0.15, 0.15, 180, 60)], [p(0.24, 0.4), p(0.7, 0.4)]] },
  u: { strokes: [uShape(0.27, 0.71, 0.4, 0.9), [p(0.71, 0.4), p(0.71, 0.9)]] },
  ü: { strokes: [uShape(0.27, 0.71, 0.4, 0.9), [p(0.71, 0.4), p(0.71, 0.9)], dot(0.38, 0.2), dot(0.62, 0.2)] },
  v: { strokes: [[p(0.2, 0.4), p(0.5, 0.9), p(0.8, 0.4)]] },
  w: { strokes: [[p(0.1, 0.4), p(0.3, 0.9), p(0.5, 0.5), p(0.7, 0.9), p(0.9, 0.4)]] },
  x: { strokes: [[p(0.25, 0.4), p(0.75, 0.9)], [p(0.75, 0.4), p(0.25, 0.9)]] },
  y: { strokes: [[p(0.22, 0.22), p(0.5, 0.62)], [p(0.78, 0.22), p(0.32, 0.96)]] },
  z: { strokes: [[p(0.25, 0.4), p(0.75, 0.4), p(0.25, 0.9), p(0.75, 0.9)]] },

  // ===== Digits =====
  // 0: an oval, counter-clockwise from the top.
  '0': { strokes: [oShape(0.5, 0.5, 0.3, 0.4)] },
  // 1: a little flag up to the top, then straight down.
  '1': { strokes: [[p(0.32, 0.28), p(0.56, 0.1), p(0.56, 0.9)]] },
  // 2: hook over the top, diagonal down to the left, then the base.
  '2': { strokes: [[...arc(0.5, 0.32, 0.27, 0.22, -170, 20), p(0.22, 0.9), p(0.8, 0.9)]] },
  // 3: two bumps, top then bottom, in one stroke.
  '3': {
    strokes: [[...arc(0.47, 0.3, 0.26, 0.2, -160, 90), ...arc(0.47, 0.7, 0.3, 0.2, -90, 160).slice(1)]],
  },
  // 4: down-left and across, then the tall line.
  '4': { strokes: [[p(0.6, 0.1), p(0.18, 0.64), p(0.85, 0.64)], [p(0.62, 0.1), p(0.62, 0.9)]] },
  // 5: down, round belly, then the hat on top.
  '5': { strokes: [[p(0.32, 0.1), p(0.3, 0.46), ...arc(0.48, 0.66, 0.28, 0.25, -130, 150)], [p(0.32, 0.1), p(0.74, 0.1)]] },
  // 6: down the left side, then a loop around the bottom.
  '6': { strokes: [[...arc(0.62, 0.62, 0.38, 0.5, -100, -180), ...arc(0.5, 0.68, 0.26, 0.22, 180, -180)]] },
  // 7: across the top, then the long slant down.
  '7': { strokes: [[p(0.2, 0.1), p(0.8, 0.1), p(0.42, 0.9)]] },
  // 8: two strokes — the small top circle, then the bigger bottom circle
  // (each starts at its top and goes counter-clockwise, like 0 and O).
  '8': { strokes: [oShape(0.5, 0.3, 0.22, 0.2), oShape(0.5, 0.7, 0.27, 0.2)] },
  // 9: two strokes — first the round head (counter-clockwise from its right
  // side), then the line straight down along the right.
  '9': { strokes: [arc(0.48, 0.32, 0.26, 0.22, 0, -360), [p(0.74, 0.3), p(0.72, 0.9)]] },
};

/** Horizontal box a digit uses inside its square, and the gap between digits. */
const DIGIT_LEFT = 0.15;
const DIGIT_WIDTH = 0.7;
const DIGIT_GAP = 0.12;
/** Empty space at both ends, so the thick guide lane never touches the canvas edge. */
const NUMBER_MARGIN = 0.12;

/**
 * Glyph for any whole number: single digits come straight from GLYPHS;
 * multi-digit numbers (12, 50, 1000...) are built by placing the digit
 * glyphs side by side in a wider box (see `Glyph.aspect`), traced left to right.
 */
export function numberGlyph(value: number): Glyph | undefined {
  const digits = String(value).split('');
  if (digits.length === 1) return GLYPHS[digits[0]];
  if (digits.some((d) => !GLYPHS[d])) return undefined;
  // Width in "digit heights": each digit is DIGIT_WIDTH wide, plus gaps and margins.
  const total = digits.length * DIGIT_WIDTH + (digits.length - 1) * DIGIT_GAP + 2 * NUMBER_MARGIN;
  const strokes: Stroke[] = [];
  digits.forEach((d, i) => {
    const left = NUMBER_MARGIN + i * (DIGIT_WIDTH + DIGIT_GAP);
    for (const stroke of GLYPHS[d].strokes) {
      strokes.push(stroke.map((pt) => p((left + (pt.x - DIGIT_LEFT)) / total, pt.y)));
    }
  });
  return { strokes, aspect: total };
}

export function getGlyph(char: string): Glyph | undefined {
  return GLYPHS[char];
}
