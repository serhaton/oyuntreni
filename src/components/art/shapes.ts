import { Skia } from '@shopify/react-native-skia';

/**
 * Builds a 5-point star path centered at (cx, cy).
 * `rotation` in radians; 0 points the first tip to the right, -π/2 up.
 */
export function starPath(cx: number, cy: number, outer: number, inner: number, rotation = -Math.PI / 2) {
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / 5;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) b.moveTo(x, y);
    else b.lineTo(x, y);
  }
  b.close();
  return b.build();
}
