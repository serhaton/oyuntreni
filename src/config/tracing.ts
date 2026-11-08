/**
 * Tracing difficulty, all in ONE place.
 *
 * Distances are fractions of the tracing canvas side, so they scale
 * automatically between iPhone and iPad. Tuned to be generous for 4–5 year
 * olds: it's much worse to frustrate a child than to accept a wobbly line.
 */
export const TRACING = {
  /** Finger counts as "on the path" within this distance of it. */
  tolerance: 0.09,
  /** Never let the tolerance get smaller than this (points), for small phones. */
  minTolerancePt: 28,
  /** Beyond tolerance × this, the finger is considered off the path... */
  offPathFactor: 1.9,
  /** ...and after wandering off for this many tolerances, the stroke gently resets. */
  offPathGrace: 3,
  /** A stroke must begin within tolerance × this of its start dot. */
  startFactor: 1.5,
  /**
   * Touching the end of a stroke accepts it right away. If the finger lifts
   * just before the end, the stroke still counts when at least this share was
   * covered (in the right direction)...
   */
  minCoverage: 0.8,
  /**
   * ...and the finger lifted within tolerance × this of the stroke's end.
   * Measured as a distance (not a percentage) so long strokes like W behave
   * like short ones. Stopping visibly short is NOT auto-completed: the child
   * gently tries again, so a letter never "finishes itself".
   */
  endRadiusFactor: 1.5,
  /** Spacing of the internal checkpoints along each stroke. */
  checkpointStep: 0.015,

  // --- Look ---------------------------------------------------------------
  /** Width of the light "road" behind the dotted guide. */
  laneWidth: 0.14,
  /** Width of the child's rainbow ink. */
  inkWidth: 0.075,
  /** Diameter of the guide dots, and the gap between them. */
  dotSize: 0.022,
  dotGap: 0.045,
} as const;
