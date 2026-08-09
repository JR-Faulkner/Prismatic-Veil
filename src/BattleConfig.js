// Hero roster. Each entry carries its own pose set, per-pose facing, and
// combat data, so adding a character is data only — no code changes.
//
// Facing standard: hero art should be authored facing RIGHT (toward the
// enemy). `flip` is only for legacy sets that were authored inconsistently.
//
// Alpha v1.0 additions:
//   frameColourway  which portrait frame family the HUD draws
//   commands        the battle console's glyph row. Exactly one entry
//                   is bound to the hero's attack; the rest are slots
//                   with nothing behind them yet, and say so when
//                   selected. No command consumes or gates a resource —
//                   that stays a later mechanic. Resonate/Veilshift (v0.3
//                   Battle Presentation Base) are the same kind of empty
//                   slot as Barrier/Return were — RESONANCE_VEILSHIFT_
//                   DESIGN_ONLY.md is explicit that full implementation
//                   isn't requested yet, just the naming direction.
export const HEROES = Object.freeze({
  prismel: Object.freeze({
    id: 'prismel',
    name: 'Prismel',
    hp: 100,
    maxHp: 100,
    veil: 100,
    portrait: 'portrait_prismel',
    // HUD identity: bar fill, frame accents, damage-number styling.
    accent: 0x67c8ff,
    accentAlt: 0xc477ff,
    frameStyle: 'diamond',
    damageStyle: 'refraction',
    poses: Object.freeze({
      idle: 'Pose01_Idle_LOCKED',
      step: 'Pose02_StepForward_LOCKED',
      gather: 'Pose03_Gather_LOCKED',
      release: 'Pose04_PrismaticRelease_LOCKED',
      recover: 'Pose05_Recover_LOCKED'
    }),
    posePath: './assets/poses/',
    scaleMul: 1,
    // Prismel's v1 set is mixed-orientation: Release already fires right,
    // the rest look left.
    flip: Object.freeze({
      idle: true, step: true, gather: true, release: false, recover: true
    }),
    attack: Object.freeze({
      // Player-facing name locked to Refractive Burst (v0.3 Battle
      // Presentation Base handoff). The internal pose/state name stays
      // `release` throughout the codebase — only the string the player
      // reads changes.
      name: 'Refractive Burst',
      damage: 14,
      flavor: 'Crystal energy gathers...',
      critChance: 0.25,
      critMultiplier: 2
    }),
    // Overrides BattleController's default POSE_TIMING beats for this
    // hero only. Prismel's step and gather poses read as a blur back to
    // back at the default pace, so both get more room before the next
    // pose cuts in.
    attackTiming: Object.freeze({ step: 340, hold: 220 }),
    // v38A Battle Presence Pass: routes this hero's charge/projectile/
    // impact FX through BattleFXDirector instead of BattleFX's own
    // gather()/beam()/impact(). Kineza has no fxVersion and keeps his
    // existing BattleFX-driven identity untouched.
    fxVersion: 'v2',
    frameColourway: 'blue',
    commands: Object.freeze([
      Object.freeze({ glyph: 'fracture', label: 'Burst', kind: 'attack' }),
      Object.freeze({ glyph: 'barrier', label: 'Resonate', locked: true }),
      Object.freeze({ glyph: 'returnpath', label: 'Veilshift', locked: true })
    ])
  }),

  kineza: Object.freeze({
    id: 'kineza',
    name: 'Kineza',
    hp: 115,
    maxHp: 115,
    veil: 100,
    portrait: 'portrait_kineza',
    accent: 0x68ff8c,
    accentAlt: 0xd8ffe1,
    frameStyle: 'forged',
    damageStyle: 'slam',
    poses: Object.freeze({
      idle: 'Kineza01_Idle_LOCKED',
      step: 'Kineza02_Step_LOCKED',
      gather: 'Kineza03_Coil_LOCKED',
      release: 'Kineza04_Strike_LOCKED',
      recover: 'Kineza05_Recover_LOCKED'
    }),
    posePath: './assets/poses/kineza/',
    // His masters are framed wider and taller than Prismel's, and the
    // strike carries a long dust trail, so he needs pulling back.
    scaleMul: 0.78,
    // Authored facing right, per the animation standard. No flipping.
    flip: Object.freeze({
      idle: false, step: false, gather: false, release: false, recover: false
    }),
    attack: Object.freeze({
      name: 'Momentum Fist',
      damage: 17,
      flavor: 'Kinetic force coils tight...',
      critChance: 0.22,
      critMultiplier: 2
    }),
    frameColourway: 'teal',
    commands: Object.freeze([
      Object.freeze({ glyph: 'resonance', label: 'Momentum', kind: 'attack' }),
      Object.freeze({ glyph: 'barrier', label: 'Resonate', locked: true }),
      Object.freeze({ glyph: 'returnpath', label: 'Veilshift', locked: true })
    ])
  }),

  auryi: Object.freeze({
    id: 'auryi',
    name: 'Auryi',
    hp: 100,
    maxHp: 100,
    veil: 100,
    portrait: 'portrait_auryi',
    accent: 0xc8a8ff,
    accentAlt: 0xffd76a,
    frameStyle: 'diamond',
    damageStyle: 'aura',
    poses: Object.freeze({
      idle: 'Pose01_BattleReady_BattleMasterA_LOCKED',
      step: 'Pose02_VeilStep_LOCKED',
      gather: 'Pose03_OrbGather_LOCKED',
      release: 'Pose04_Attack_VeilPulse_POSE_LOCKED',
      recover: 'Pose05_Recompose_LOCKED'
    }),
    posePath: './assets/poses/auryi/',
    // v0.3 Battle Presentation Base's trio scale calibration reference
    // measures Auryi at ~1.29x Prismel's head-to-foot height (897px vs
    // 693px in the locked lineup art). Her pose canvases carry almost
    // exactly the same content-to-canvas ratio as Prismel's idle pose
    // (~0.827 either way), so that ratio carries straight through to
    // scaleMul without a separate padding correction the way Kineza's
    // needed one.
    scaleMul: 1.29,
    // Locked poses 1/2/3/5 hold the orb in her screen-left-raised hand;
    // pose 4 (Attack/Veil Pulse) already breaks from that to release
    // toward screen-right — same "release already fires right, the rest
    // look left" pattern as Prismel's set.
    flip: Object.freeze({
      idle: true, step: true, gather: true, release: false, recover: true
    }),
    attack: Object.freeze({
      // Veil Pulse is a working player-facing name (pose is locked;
      // naming may still evolve per AURYI_BATTLE_MANIFEST.json).
      name: 'Veil Pulse',
      damage: 13,
      flavor: 'Veil light gathers, then surges outward...',
      critChance: 0.2,
      critMultiplier: 2
    }),
    frameColourway: 'violet',
    commands: Object.freeze([
      Object.freeze({ glyph: 'resonance', label: 'Pulse', kind: 'attack' }),
      Object.freeze({ glyph: 'barrier', label: 'Resonate', locked: true }),
      Object.freeze({ glyph: 'returnpath', label: 'Veilshift', locked: true })
    ])
  })
});

export const HERO_ORDER = Object.freeze(['prismel', 'kineza', 'auryi']);

export const BATTLE_CONFIG = Object.freeze({
  hero: HEROES.prismel,
  enemy: Object.freeze({
    id: 'veil-wraith',
    name: 'Veil Wraith',
    hp: 30,
    maxHp: 30,
    portrait: 'portrait_wraith',
    accent: 0xc477ff,
    frameColourway: 'violet',
    attack: Object.freeze({
      name: 'Veil Lash',
      damage: 9,
      critChance: 0.15,
      critMultiplier: 2
    })
  }),
  text: Object.freeze({
    playerTurn: 'PLAYER TURN',
    enemyTurn: 'ENEMY TURN'
  })
});
