// A-LAB v1 — reusable animation/ability test registry.
// Production tool only: lets us validate character animation, world movement,
// camera beats, enemy reaction, FX and audio without entering a full battle.

export const A_LAB_HEROES = Object.freeze({
  kineza: Object.freeze({
    id: 'kineza',
    name: 'Kineza',
    attacks: Object.freeze({
      basic: Object.freeze({
        id: 'basic',
        name: 'Basic Attack v2 (12f authority)',
        sheet: './assets/characters/kineza/animations/kineza_basic_attack_v2.png',
        frameWidth: 720,
        frameHeight: 580,
        frameCount: 12,
        durations: Object.freeze([150,150,150,150,150,150,120,110,125,125,145,160]),
        baselinePx: 525,
        contentHeightPx: 350,
        formationX: 0.26,
        enemyX: 0.72,
        baselineY: 0.79,
        movement: Object.freeze({
          type: 'blinkMelee',
          launchFrames: Object.freeze([4,5]),
          enemyFrames: Object.freeze([6,7,8,9]),
          impactFrame: 8,
          returnFrames: Object.freeze([10,11])
        }),
        audio: Object.freeze({
          launch: './assets/sfx/kineza/kineza_strike.mp3',
          impact: './assets/sfx/kineza/kineza_impact.mp3'
        })
      })
    })
  }),
  prismel: Object.freeze({
    id: 'prismel',
    name: 'Prismel',
    attacks: Object.freeze({
      basic: Object.freeze({
        id: 'basic',
        name: "Prism's Projectile Punch",
        sheet: './assets/characters/prismel/animations/prismel_basic_attack_v1.webp',
        frameWidth: 720,
        frameHeight: 580,
        frameCount: 12,
        durations: Object.freeze([167,167,167,167,167,167,167,133,133,133,167,167]),
        baselinePx: 520,
        contentHeightPx: 390,
        formationX: 0.27,
        enemyX: 0.72,
        baselineY: 0.79,
        movement: Object.freeze({ type: 'stationary', impactFrame: 8 }),
        audio: Object.freeze({
          launch: './assets/sfx/sfx_release.mp3',
          impact: './assets/sfx/sfx_impact.mp3'
        })
      })
    })
  })
});

export const A_LAB_ENEMIES = Object.freeze({
  wraith: Object.freeze({
    id: 'wraith',
    name: 'Veil Wraith',
    idle: './assets/enemy/veil_wraith/VeilWraith_v34_Idle.png',
    hit: './assets/enemy/veil_wraith/VeilWraith_v34_Hit.png',
    baselineY: 0.79,
    x: 0.74
  })
});

export function getLabAttack(heroId, attackId) {
  return A_LAB_HEROES[heroId]?.attacks?.[attackId] || null;
}
