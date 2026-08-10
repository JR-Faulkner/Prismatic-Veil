// Tactical Field Foundation v2 — TacticalConfig.
// Owns grid dimensions, movement rules, zoom limits, timing, and viewport
// breakpoints. Every other tactical module reads from here rather than
// hardcoding its own copy of these numbers.

export const GRID = Object.freeze({
  columns: 12,
  rows: 10,
  movement: 'orthogonal'
});

// Isometric diamond half-width/half-height for one tile at zoom 1.0. Scaled
// per viewport in TacticalScene.layout() the same way HeroPoseView derives
// one scale factor from a reference frame rather than fitting per-pose.
export const TILE = Object.freeze({
  baseHalfW: 34,
  baseHalfH: 17
});

export const ZOOM = Object.freeze({
  min: 0.6,
  max: 1.6,
  default: 1.0,
  buttonStep: 0.15
});

export const TIMING = Object.freeze({
  stepMoveMs: 140,
  cinematicInMs: 220,
  // Bumped from 520/200 — playtest feedback: the enemy cut-in's own
  // "X uses Y!" line was gone before there was any real chance to read
  // it, on top of having no text box behind it (see BattleCinematic.js).
  cinematicHoldMs: 1500,
  cinematicOutMs: 350,
  cameraFocusMs: 260,
  cameraRestoreMs: 220,
  enemyStepPauseMs: 90,
  enemyIntentPauseMs: 420
});

export const BREAKPOINTS = Object.freeze({
  compactWidth: 560,
  compactHeight: 520
});

export const INPUT = Object.freeze({
  // Separates a tap (select/move) from the start of a camera drag.
  dragThresholdPx: 8
});
