// PZ-A LAB registry — BLITZER 18F current authority.
import { BLITZER_SHEET_DATA_URI } from './BlitzerRuntime.js?v=2';

export const A_LAB_HEROES = Object.freeze({
  kineza: Object.freeze({
    id: 'kineza',
    name: 'Kineza',
    attacks: Object.freeze({
      basic: Object.freeze({
        id: 'basic',
        name: 'Blitzer',
        sheet: BLITZER_SHEET_DATA_URI,
        frameWidth: 128,
        frameHeight: 128,
        frameCount: 18,
        durations: Object.freeze([180,110,110,110,110,95,85,180,110,110,110,180,110,110,95,85,180,180]),
        baselinePx: 118,
        contentHeightPx: 93,
        formationX: 0.26,
        enemyX: 0.74,
        baselineY: 0.79,
        movement: Object.freeze({
          type: 'blinkMelee',
          launchFrames: Object.freeze([3,4,5,6]),
          enemyFrames: Object.freeze([7,8,9,10,11,12,13]),
          impactFrame: 11,
          returnFrames: Object.freeze([14,15,16])
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
        audio: Object.freeze({ launch: './assets/sfx/sfx_release.mp3', impact: './assets/sfx/sfx_impact.mp3' })
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
