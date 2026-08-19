// AUTO-GENERATED QA tuning profile for 05M.
// Source: pv-data/animations/prismel_active_turn.05m_tuning.json
// Keep this profile isolated until phone QA approves promotion into canonical registration.

export const PRISMEL_05M_FRAME_OVERRIDES = Object.freeze({
  prismel_attack_1: Object.freeze({ scale: 1.028, x: -2, y: -2 }),
  prismel_attack_2: Object.freeze({ scale: 1.026, x: -1, y: -2 }),
  prismel_attack_3: Object.freeze({ scale: 1.022, x: 0, y: -1 }),
  prismel_attack_4: Object.freeze({ scale: 1.014, x: 1, y: 0 }),
  prismel_attack_5: Object.freeze({ scale: 1.008, x: 1, y: 0 }),
  prismel_attack_6: Object.freeze({ scale: 1.003, x: 0, y: 0 })
});

export const PRISMEL_05M_MATERIALIZATION = Object.freeze({
  frameHoldMs: Object.freeze([145, 175, 205, 285, 320, 400]),
  cueFrames: Object.freeze({
    shimmer: 2,
    staffEmerges: 3,
    staffDraw: 4,
    staffLock: 6
  })
});

export const PRISMEL_05M_ATTACK_TRANSITION = Object.freeze({
  readyToAttackHoldMs: 145,
  attackStartFrameMs: 184,
  attackReleaseFrameMs: 160
});
