// The Prismatic Veil — Party Battle attack presentation authority.
//
// H2.8 migrates Party Battle away from the old BP03 five-pose attack fallback.
// PriZim promotion is hero-specific: an attack becomes current only after its
// visual-family review, registration, runtime extraction, and phone acceptance.
//
// IMPORTANT:
// - formation idle art remains assets/party_formation/*
// - this module owns ONLY the acting hero's Basic Attack presentation
// - missing current authority must NOT silently fall back to retired attack art
// - per-frame registration is deterministic presentation correction, not redrawn art

export const PARTY_ATTACK_AUTHORITY = Object.freeze({
  prismel: Object.freeze({
    id: 'prismel_attack_jrpg_10a',
    heroId: 'prismel',
    enabled: false,
    status: 'conditional-pz-pass-pending-runtime-ingestion',
    mode: 'sheet',
    key: 'prismel_party_attack_jrpg_10a',
    path: './assets/sequences/runtime/prismel_attack_jrpg_10a.png',
    frameWidth: 397,
    frameHeight: 397,
    frameCount: 10,
    referenceBodyHeightPx: 287,
    baselinePxByFrame: Object.freeze([393, 393, 393, 393, 393, 315, 315, 316, 316, 319]),
    registrationPath: './pv-data/sequence_authority/prismel_attack_jrpg_10a.registration.json',
    normalization: 'alpha-weighted-body-registration',
    frameDurations: Object.freeze([110, 85, 90, 95, 115, 80, 75, 105, 95, 150]),
    markerFrames: Object.freeze({
      gather: Object.freeze([2, 3, 4]),
      release: Object.freeze([6]),
      impact: Object.freeze([7]),
      recover: Object.freeze([9])
    }),
    replaces: 'legacy-prismel-six-frame-active-turn-set'
  }),

  auryi: Object.freeze({
    id: 'auryi_attack_jrpg_10a',
    heroId: 'auryi',
    enabled: false,
    status: 'conditional-pz-pass-pending-runtime-ingestion',
    mode: 'sheet',
    key: 'auryi_party_attack_jrpg_10a',
    path: './assets/sequences/runtime/auryi_attack_jrpg_10a.png',
    frameWidth: 397,
    frameHeight: 397,
    frameCount: 10,
    referenceBodyHeightPx: 355,
    baselinePxByFrame: Object.freeze([378, 380, 380, 380, 379, 371, 372, 373, 372, 372]),
    registrationPath: './pv-data/sequence_authority/auryi_attack_jrpg_10a.refresh.json',
    normalization: 'body-and-robe-registration-with-fx-exclusion',
    frameDurations: Object.freeze([115, 85, 90, 95, 105, 80, 80, 110, 105, 155]),
    markerFrames: Object.freeze({
      gather: Object.freeze([2, 3, 4]),
      release: Object.freeze([6]),
      impact: Object.freeze([7]),
      recover: Object.freeze([8, 9])
    }),
    referenceAuthority: Object.freeze({
      id: 'auryi_attack_master_a',
      path: './assets/sequences/production/auryi_attack_master_a.png',
      role: 'canonical-choreography-reference-not-current-jrpg-visual-authority'
    }),
    replaces: 'legacy-auryi-five-pose-party-attack'
  }),

  kineza: Object.freeze({
    id: 'kineza_attack_master_a',
    heroId: 'kineza',
    enabled: true,
    status: 'production-current',
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
      gather: Object.freeze([0, 1]),
      release: Object.freeze([2]),
      impact: Object.freeze([3, 4]),
      recover: Object.freeze([5])
    })
  })
});

export function preloadPartyAttackAuthority(scene) {
  Object.values(PARTY_ATTACK_AUTHORITY).forEach(cfg => {
    if (cfg.enabled === false) return;

    if (cfg.mode === 'sheet') {
      scene.load.spritesheet(cfg.key, cfg.path, {
        frameWidth: cfg.frameWidth,
        frameHeight: cfg.frameHeight
      });
      return;
    }

    if (cfg.mode === 'frames') {
      cfg.frameKeys.forEach((key, i) => scene.load.image(key, cfg.framePaths[i]));
    }
  });
}
