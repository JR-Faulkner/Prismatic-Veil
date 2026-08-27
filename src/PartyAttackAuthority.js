// The Prismatic Veil — Party Battle attack presentation authority.
//
// H2.8 migrates Party Battle away from the old BP03 five-pose attack fallback.
// These are the currently approved six-beat attack continuations already present in the repo.
//
// IMPORTANT:
// - formation idle art remains assets/party_formation/*
// - this module owns ONLY the acting hero's Basic Attack presentation
// - missing current authority must NOT silently fall back to the retired five-pose attack
// - per-frame registration is deterministic presentation correction, not redrawn art

export const PARTY_ATTACK_AUTHORITY = Object.freeze({
  prismel: Object.freeze({
    id: 'prismel_prismatic_shard_current',
    heroId: 'prismel',
    mode: 'frames',
    frameKeys: Object.freeze([
      'prismel_party_attack_1', 'prismel_party_attack_2', 'prismel_party_attack_3',
      'prismel_party_attack_4', 'prismel_party_attack_5', 'prismel_party_attack_6'
    ]),
    framePaths: Object.freeze([
      './assets/poses/prismel_active_turn/prismel_attack_1.png',
      './assets/poses/prismel_active_turn/prismel_attack_2.png',
      './assets/poses/prismel_active_turn/prismel_attack_3.png',
      './assets/poses/prismel_active_turn/prismel_attack_4.png',
      './assets/poses/prismel_active_turn/prismel_attack_5.png',
      './assets/poses/prismel_active_turn/prismel_attack_6.png'
    ]),
    registration: Object.freeze([
      Object.freeze({ scale: 1.036, x: 0, y: 0 }),
      Object.freeze({ scale: 1.031, x: 1, y: 0 }),
      Object.freeze({ scale: 1.025, x: 2, y: 0 }),
      Object.freeze({ scale: 1.015, x: 2, y: 0 }),
      Object.freeze({ scale: 1.008, x: 1, y: 0 }),
      Object.freeze({ scale: 1.003, x: 0, y: 0 })
    ]),
    normalization: 'alpha-body-height',
    originY: 1.0,
    frameDurations: Object.freeze([188, 170, 155, 145, 165, 220]),
    markerFrames: Object.freeze({
      gather: Object.freeze([0, 1]), release: Object.freeze([3]),
      impact: Object.freeze([4]), recover: Object.freeze([5])
    })
  }),

  auryi: Object.freeze({
    id: 'auryi_attack_master_a',
    heroId: 'auryi',
    mode: 'sheet',
    key: 'auryi_party_attack_master_a',
    path: './assets/sequences/production/auryi_attack_master_a.png',
    frameWidth: 512,
    frameHeight: 512,
    frameCount: 6,
    referenceBodyHeightPx: 437,
    baselinePx: 499,
    registration: Object.freeze([
      Object.freeze({ scale: 0.98869, x: -5.07, y: 0.70 }),
      Object.freeze({ scale: 0.98869, x: -13.66, y: 0.70 }),
      Object.freeze({ scale: 0.98423, x: 4.09, y: 1.96 }),
      Object.freeze({ scale: 1.01628, x: 0.49, y: -8.12 }),
      Object.freeze({ scale: 1.01628, x: 19.92, y: -8.12 }),
      Object.freeze({ scale: 1.01628, x: -5.87, y: -8.12 })
    ]),
    normalization: 'registered-body-height',
    frameDurations: Object.freeze([150, 125, 115, 110, 150, 190]),
    markerFrames: Object.freeze({
      gather: Object.freeze([0, 1, 2]), release: Object.freeze([3]),
      impact: Object.freeze([4]), recover: Object.freeze([5])
    })
  }),

  kineza: Object.freeze({
    id: 'kineza_attack_master_a',
    heroId: 'kineza',
    mode: 'sheet',
    key: 'kineza_party_attack_master_a',
    path: './assets/sequences/production/kineza_attack_master_a.png',
    frameWidth: 512,
    frameHeight: 512,
    frameCount: 6,
    referenceBodyHeightPx: 425,
    baselinePx: 463,
    registration: Object.freeze([
      Object.freeze({ scale: 0.94027, x: -63.80, y: -33.00 }),
      Object.freeze({ scale: 0.99532, x: -58.12, y: -12.76 }),
      Object.freeze({ scale: 1.02163, x: -68.02, y: -17.17 }),
      Object.freeze({ scale: 1.01432, x: -73.30, y: -19.82 }),
      Object.freeze({ scale: 1.03659, x: -84.66, y: -27.30 }),
      Object.freeze({ scale: 0.97254, x: -50.06, y: -10.63 })
    ]),
    normalization: 'registered-body-height',
    frameDurations: Object.freeze([145, 115, 95, 105, 145, 190]),
    markerFrames: Object.freeze({
      gather: Object.freeze([0, 1]), release: Object.freeze([2]),
      impact: Object.freeze([3, 4]), recover: Object.freeze([5])
    })
  })
});

export function preloadPartyAttackAuthority(scene) {
  Object.values(PARTY_ATTACK_AUTHORITY).forEach(cfg => {
    if (cfg.mode === 'sheet') {
      scene.load.spritesheet(cfg.key, cfg.path, {
        frameWidth: cfg.frameWidth,
        frameHeight: cfg.frameHeight
      });
      return;
    }
    cfg.frameKeys.forEach((key, i) => scene.load.image(key, cfg.framePaths[i]));
  });
}
