import type { SharedValue } from 'react-native-reanimated';

/**
 * Props every character drawing receives. A drawing renders its own square
 * <Canvas> of `size` points, standing on the bottom edge (so it can sit in a
 * wagon). Idle motions (tails, ears, wings) are handled inside each drawing.
 */
export interface CharacterArtProps {
  size: number;
  /** Big ^ ^ smile (after a tap or a success). */
  happy: boolean;
  /** Eye openness from useBlink(): 1 open, 0 closed. */
  blink: SharedValue<number>;
  /** Offsets idle animations so identical characters don't move in sync. */
  seed: number;
  /** Main body color, for drawings that can be recolored (e.g. "find the red car"). */
  tint?: string;
}
