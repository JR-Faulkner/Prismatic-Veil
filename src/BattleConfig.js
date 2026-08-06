// Hero roster. Each entry carries its own pose set, per-pose facing, and
// combat data, so adding a character is data only — no code changes.
//
// Facing standard: hero art should be authored facing RIGHT (toward the
// enemy). `flip` is only for legacy sets that were authored inconsistently.
//
// Alpha v1.0 additions:
//   frameColourway  which portrait frame family the HUD draws
//   commands        the tactical console's glyph row. Exactly one entry
//                   is bound to the hero's attack; the rest are slots
//                   with nothing behind them yet, and say so when
//                   selected. No command consumes or gates a resource —
//                   that stays a later mechanic.
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
      name: 'Prismatic Release',
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
    frameColourway: 'blue',
    commands: Object.freeze([
      Object.freeze({ glyph: 'fracture', label: 'Release', kind: 'attack' }),
      Object.freeze({ glyph: 'barrier', label: 'Barrier', locked: true }),
      Object.freeze({ glyph: 'returnpath', label: 'Return', locked: true })
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
      Object.freeze({ glyph: 'barrier', label: 'Barrier', locked: true }),
      Object.freeze({ glyph: 'returnpath', label: 'Return', locked: true })
    ])
  })
});

export const HERO_ORDER = Object.freeze(['prismel', 'kineza']);

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
