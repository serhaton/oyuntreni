/**
 * Landscape description for the parallax background. Pure data: change the
 * scenery here without touching any drawing code.
 *
 * Units:
 *  - x positions are fractions (0..1) of a layer's tile period (it repeats).
 *  - heights / y values are fractions of the screen height.
 *  - speed is how fast a layer moves relative to the train (1 = with the ground).
 */
import type { ColorName } from '@/theme';

export interface HillBump {
  from: number;
  to: number;
  /** Visible peak height of the bump (fraction of screen height). */
  peak: number;
}

export interface HillLayer {
  speed: number;
  /** Tile period as a multiple of the screen width. */
  period: number;
  /** Baseline (valley) y as a fraction of the screen height. */
  base: number;
  color: ColorName;
  bumps: HillBump[];
}

/** Hill layers from far (slow, pale) to near (faster, greener). */
export const HILL_LAYERS: HillLayer[] = [
  {
    speed: 0.1,
    period: 1.2,
    base: 0.6,
    color: 'hillFarthest',
    bumps: [
      { from: 0, to: 0.45, peak: 0.16 },
      { from: 0.45, to: 1, peak: 0.12 },
    ],
  },
  {
    speed: 0.25,
    period: 1.1,
    base: 0.68,
    color: 'hillFar',
    bumps: [
      { from: 0, to: 0.35, peak: 0.1 },
      { from: 0.35, to: 0.7, peak: 0.13 },
      { from: 0.7, to: 1, peak: 0.09 },
    ],
  },
];

/** The near hill holds the trees and flowers, so it is described separately. */
export const NEAR_HILL: HillLayer = {
  speed: 0.55,
  // Longer than the screen so sprites can leave on the left before re-entering on the right.
  period: 1.35,
  base: 0.82,
  color: 'grassLight',
  bumps: [
    { from: 0, to: 0.5, peak: 0.07 },
    { from: 0.5, to: 1, peak: 0.06 },
  ],
};

/** Ground strip in front (where the train track will run). */
export const GROUND = {
  speed: 1,
  top: 0.86,
  /** Grass tufts repeat every this fraction of the screen width. */
  tuftPeriod: 0.5,
} as const;

/**
 * Railway track on the ground (moves with the ground, speed 1).
 * `y` is where wheels touch the rail; kept above the iPhone home-indicator area.
 */
export const TRACK = {
  y: 0.93,
  /** Distance between sleepers, as a fraction of the screen height. */
  sleeperSpacing: 0.07,
} as const;

export type ScenerySprite =
  | { kind: 'tree'; variant: 'round' | 'pine'; x: number; height: number }
  | { kind: 'flower'; x: number; height: number; colorIndex: number };

/** Sprites planted on the near hill. */
export const NEAR_SCENERY: ScenerySprite[] = [
  { kind: 'tree', variant: 'round', x: 0.06, height: 0.27 },
  { kind: 'flower', x: 0.17, height: 0.09, colorIndex: 6 },
  { kind: 'tree', variant: 'pine', x: 0.3, height: 0.3 },
  { kind: 'flower', x: 0.42, height: 0.08, colorIndex: 4 },
  { kind: 'flower', x: 0.47, height: 0.1, colorIndex: 0 },
  { kind: 'tree', variant: 'round', x: 0.6, height: 0.24 },
  { kind: 'tree', variant: 'pine', x: 0.78, height: 0.32 },
  { kind: 'flower', x: 0.9, height: 0.09, colorIndex: 5 },
];

export interface CloudSpec {
  /** Start position as a fraction of the drift span. */
  x: number;
  /** Top y as a fraction of the screen height. */
  y: number;
  /** Size as a fraction of the screen height. */
  size: number;
  /** Drift speed in design points per second (wind). */
  drift: number;
}

export const CLOUDS: CloudSpec[] = [
  { x: 0.02, y: 0.05, size: 0.09, drift: 10 },
  { x: 0.38, y: 0.17, size: 0.07, drift: 14 },
  { x: 0.62, y: 0.03, size: 0.11, drift: 8 },
  { x: 0.86, y: 0.22, size: 0.065, drift: 12 },
];

/** Sun position (center) and size, as fractions of the screen. */
// Left side, clear of the centered title and the top-right language button.
export const SUN = { x: 0.13, y: 0.3, size: 0.3 } as const;
