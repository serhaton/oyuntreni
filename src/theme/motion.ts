/**
 * Shared animation timing so the whole game "feels" consistent.
 * Durations are in milliseconds. Spring configs are for Reanimated `withSpring`.
 */
export const durations = {
  fast: 120,
  normal: 250,
  slow: 450,
  /** One idle "breathing" cycle for characters. */
  breathe: 1800,
  /** Pause between blinks. */
  blinkInterval: 3200,
} as const;

export const springs = {
  /** Quick, bouncy pop back after a tap (squash & stretch release). */
  bouncy: { damping: 6, stiffness: 260, mass: 0.6 },
  /** Softer spring for larger movements (cards, panels). */
  gentle: { damping: 14, stiffness: 140, mass: 1 },
  /** Snappy with very little overshoot. */
  snappy: { damping: 20, stiffness: 400, mass: 0.8 },
} as const;

/** Squash & stretch amounts applied on press. */
export const squash = {
  scaleX: 1.15,
  scaleY: 0.85,
} as const;
