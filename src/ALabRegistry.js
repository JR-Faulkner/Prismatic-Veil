// PZ-A LAB registry — current attack presentation authorities.

const LIVE_MODULE_VERSION = new URL(import.meta.url).searchParams.get('v') || 'main';
const liveAsset = path => `${path}${path.includes('?') ? '&' : '?'}pvasset=${encodeURIComponent(LIVE_MODULE_VERSION)}`;
const auryiFrame = index => liveAsset(`./assets/characters/auryi/animations/attack/frames/Auryi_Auorb_Attack_${String(index).padStart(2,'0')}.png`);

export const A_LAB_HEROES = Object.freeze({
  kineza: Object.freeze({
    id: 'kineza',
    name: 'Kineza',
    attacks: Object.freeze({
      basic: Object.freeze({
        id: 'basic',
        name: 'Blitzer',
        sourceType: 'sheet',
        sheet: liveAsset('./assets/characters/kineza/animations/kineza_blitzer_basic_v1.webp'),
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
  auryi: Object.freeze({
    id: 'auryi',
    name: 'Auryi',
    attacks: Object.freeze({
      basic: Object.freeze({
        id: 'basic',
        name: 'Aurorb Slice',
        sourceType: 'frames',
        frames: Object.freeze(Array.from({ length: 18 }, (_, i) => auryiFrame(i + 1))),
        frameWidth: 483,
        frameHeight: 543,
        frameCount: 18,
        durations: Object.freeze([170,120,110,105,100,110,95,105,100,100,115,170,110,105,100,105,130,180]),
        baselinePx: 542,
        contentHeightPx: 543,
        formationX: 0.30,
        enemyX: 0.74,
        baselineY: 0.79,
        movement: Object.freeze({
          type: 'stationaryRanged',
          impactFrame: 11,
          riseFrames: Object.freeze([0,1,2,3,4,5]),
          releaseFrames: Object.freeze([9,10]),
          settleFrames: Object.freeze([15,16,17]),
          liftFrac: 0.085
        }),
        audio: Object.freeze({
          launch: './assets/sfx/sfx_release.mp3',
          impact: './assets/sfx/sfx_impact.mp3'
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
        sourceType: 'sheet',
        sheet: liveAsset('./assets/characters/prismel/animations/prismel_basic_attack_v1.webp'),
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
