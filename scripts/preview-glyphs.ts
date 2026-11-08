/// <reference types="node" />
/**
 * Renders every glyph in src/data/glyphs.ts into one SVG contact sheet so the
 * stroke data can be checked by eye: each stroke has its own color, a numbered
 * start dot and an arrow at its end (dots are drawn as rings).
 *
 *   npm run glyphs:preview            -> writes glyph-preview.svg (open it in a browser)
 *   npm run glyphs:preview -- out.svg -> custom output path
 *   npm run glyphs:preview -- out.svg numbers -> digits and numbers only
 */
import { writeFileSync } from 'node:fs';

import { GLYPHS, numberGlyph, type Glyph } from '../src/data/glyphs';
import { NUMBERS } from '../src/data/numbers';

const CELL = 160;
const PAD = 14;
const COLS = 8;
const COLORS = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA'];

// `npm run glyphs:preview -- out.svg numbers` draws only digits and multi-digit numbers.
const onlyNumbers = process.argv[3] === 'numbers';
const entries = Object.entries(GLYPHS).filter(([char]) => !onlyNumbers || /^[0-9]$/.test(char));
const rows = Math.ceil(entries.length / COLS);
const size = CELL - PAD * 2;
const parts: string[] = [];

/** Draws one glyph into a box at (ox, oy) of w x h pixels. */
function drawGlyph(char: string, glyph: Glyph, ox: number, oy: number, w: number, h: number) {
  const X = (x: number) => (ox + x * w).toFixed(1);
  const Y = (y: number) => (oy + y * h).toFixed(1);
  parts.push(`<rect x="${ox}" y="${oy}" width="${w}" height="${h}" rx="10" fill="#fff" stroke="#ddd"/>`);
  parts.push(`<text x="${ox + 6}" y="${oy + 20}" font-size="18" font-family="Helvetica" fill="#999">${char}</text>`);
  glyph.strokes.forEach((stroke, s) => {
    const color = COLORS[s % COLORS.length];
    const first = stroke[0];
    if (stroke.length === 1) {
      parts.push(`<circle cx="${X(first.x)}" cy="${Y(first.y)}" r="7" fill="none" stroke="${color}" stroke-width="3"/>`);
    } else {
      const d = stroke.map((pt, i) => `${i ? 'L' : 'M'}${X(pt.x)} ${Y(pt.y)}`).join(' ');
      parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`);
      // Arrow head at the end, pointing along the last segment.
      const a = stroke[stroke.length - 2];
      const b = stroke[stroke.length - 1];
      const ang = Math.atan2((b.y - a.y) * h, (b.x - a.x) * w);
      const L = 10;
      const tip = [Number(X(b.x)), Number(Y(b.y))];
      const w1 = [tip[0] - L * Math.cos(ang - 0.5), tip[1] - L * Math.sin(ang - 0.5)];
      const w2 = [tip[0] - L * Math.cos(ang + 0.5), tip[1] - L * Math.sin(ang + 0.5)];
      parts.push(`<path d="M${w1[0]} ${w1[1]} L${tip[0]} ${tip[1]} L${w2[0]} ${w2[1]}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`);
    }
    parts.push(`<circle cx="${X(first.x)}" cy="${Y(first.y)}" r="8" fill="${color}"/>`);
    parts.push(`<text x="${X(first.x)}" y="${Number(Y(first.y)) + 4}" font-size="11" font-family="Helvetica" fill="#fff" text-anchor="middle">${s + 1}</text>`);
  });
}

entries.forEach(([char, glyph], idx) => {
  drawGlyph(char, glyph, (idx % COLS) * CELL + PAD, Math.floor(idx / COLS) * CELL + PAD, size, size);
});

// Multi-digit numbers (built from digits), one per row, scaled to fit.
const multi = NUMBERS.filter((n) => n.value >= 10).map((n) => [String(n.value), numberGlyph(n.value)] as const);
multi.forEach(([label, glyph], i) => {
  if (!glyph) return;
  const aspect = glyph.aspect ?? 1;
  const w = Math.min(size * aspect, COLS * CELL - PAD * 2);
  drawGlyph(label, glyph, PAD, (rows + i) * CELL + PAD, w, w / aspect);
});
const totalRows = rows + multi.length;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * CELL}" height="${totalRows * CELL}" viewBox="0 0 ${COLS * CELL} ${totalRows * CELL}"><rect width="100%" height="100%" fill="#f4f4f4"/>${parts.join('')}</svg>`;
const out = process.argv[2] ?? 'glyph-preview.svg';
writeFileSync(out, svg);
console.log(`Wrote ${entries.length} glyphs to ${out}`);
