// FAI-HUD-01 Phase A — party battle data model.
//
// Deliberately separate from BattleConfig.js's single-hero BATTLE_CONFIG:
// this is a different combat shape (3 active party members vs. enemies,
// per NEW_PARTY_DATA_CONTRACT.json), not a variant of the existing 1v1
// scene. Character stats/art/attack data still come from BattleConfig's
// HEROES — no duplicated roster — this file only adds the party-specific
// shape (formation slots, the 4-command rail, RP-gated Resonart) on top.
import { HEROES } from './BattleConfig.js?v=44';

const LIVE_MODULE_VERSION = new URL(import.meta.url).searchParams.get('v') || 'main';
const liveAsset = path => `${path}${path.includes('?') ? '&' : '?'}pvasset=${encodeURIComponent(LIVE_MODULE_VERSION)}`;

export const PARTY_SLOTS = Object.freeze([
  Object.freeze({ slot: 'back', heroId: 'prismel' }),
  Object.freeze({ slot: 'middle', heroId: 'auryi' }),
  Object.freeze({ slot: 'front', heroId: 'kineza' })
]);

export const PARTY_ASSET_LOCK = Object.freeze({
  referenceCanvas: 900,
  normalizedHeightPx: Object.freeze({ auryi: 650, prismel: 570, kineza: 475 }),
  textures: Object.freeze({
    prismel: { key: 'party_prismel', path: './assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png', canvas: true, contentBottomFrac: 0.906 },
    auryi: { key: 'party_auryi', path: './assets/party_formation/AURYI_JRPG_NORMALIZED_900x900.png', canvas: true, contentBottomFrac: 0.886 },
    kineza: { key: 'party_kineza', path: './assets/party_formation/KINEZA_RIGHT_FACING_IDLE_APPROVED.png', canvas: false, contentBottomFrac: 0.873, contentHeightPx: 364 }
  })
});

export function heightScaleFor(heroId, commonScale) {
  const tex = PARTY_ASSET_LOCK.textures[heroId];
  if (tex && !tex.canvas) {
    return (PARTY_ASSET_LOCK.normalizedHeightPx[heroId] * commonScale) / tex.contentHeightPx;
  }
  return commonScale;
}

// Legacy compatibility sheet only. Live Hybrid Kineza Blitzer is owned by
// PriZim Duo-Hybrid Sequence Mode and its neutral per-frame PNG manifest.
// Keep this constant available for older/non-Hybrid harnesses, but do not
// expose it through HERO_ATTACK_SHEETS or preload it on the live party route.
export const KINEZA_ATTACK_SHEET = Object.freeze({
  key: 'kineza_blitzer_basic_v1_live',
  name: 'Blitzer',
  path: './assets/characters/kineza/animations/kineza_blitzer_basic_v1.webp',
  frameWidth: 128,
  frameHeight: 128,
  frameCount: 18,
  baselinePx: 118,
  contentHeightPx: 93,
  frameDurations: Object.freeze([180,110,110,110,110,95,85,180,110,110,110,180,110,110,95,85,180,180]),
  markerFrames: Object.freeze({
    gather: [1,2,3],
    release: [4,5,6],
    impact: [11],
    recover: [14,15,16,17]
  }),
  povFrames: Object.freeze([6,7,8,9,10,11,12,13]),
  travel: Object.freeze({
    contactXOffsetFrac: 0.11,
    frameProgress: Object.freeze([
      0.00,0.00,0.04,0.14,0.34,0.58,0.82,
      1.00,1.00,1.00,1.00,1.00,0.96,0.86,
      0.62,0.34,0.10,0.00
    ])
  })
});

export const KINEZA_STATE_SHEET = Object.freeze({
  key: 'kineza_battle_states_v1',
  path: liveAsset('./assets/characters/kineza/battle/kineza_battle_states_v1.png'),
  frameWidth: 640,
  frameHeight: 520,
  frameCount: 8,
  baselinePx: 474,
  contentHeightPx: 335,
  passiveFrame: 0,
  activeFrame: 1,
  turnFrames: Object.freeze([2,3,4,5,6,7]),
  turnDurations: Object.freeze([90,95,110,120,120,155])
});

export const HERO_STATE_SHEETS = Object.freeze({ kineza: KINEZA_STATE_SHEET });

export const PRISMEL_ATTACK_SHEET = Object.freeze({
  key: 'prismel_basic_attack_v1',
  path: liveAsset('./assets/characters/prismel/animations/prismel_basic_attack_v1.webp'),
  frameWidth: 720,
  frameHeight: 580,
  frameCount: 12,
  baselinePx: 520,
  frameDurations: Object.freeze([167,167,167,167,167,167,167,133,133,133,167,167]),
  markerFrames: Object.freeze({ gather: [1,2,3,4,5], release: [6,7], impact: [8], recover: [9,10,11] })
});

export const HERO_ATTACK_SHEETS = Object.freeze({
  prismel: PRISMEL_ATTACK_SHEET
});

export const BASE_COMMANDS = Object.freeze(['Attack', 'Resonart', 'Guard', 'Item']);
export const RESONART_RP_COST = 20;
export const BASIC_ATTACK_DAMAGE_MULT = 0.6;
export const BASIC_ATTACK_HIT_CHANCE = 0.96;
export const RESONART_HIT_CHANCE = 0.92;

export const ITEM_DEFS = Object.freeze([
  Object.freeze({ id: 'potion', name: 'Veil Tonic', heal: 30 })
]);

export function partyRoster() {
  return PARTY_SLOTS.map(({ slot, heroId }) => {
    const base = HEROES[heroId];
    return {
      ...base,
      slot,
      currentHp: base.hp,
      currentRp: base.rp,
      guarding: false,
      alive: true
    };
  });
}

export function projectedDamage(hero, command) {
  const base = command === 'Resonart' ? hero.attack.damage : Math.round(hero.attack.damage * BASIC_ATTACK_DAMAGE_MULT);
  return { low: Math.round(base * 0.85), high: Math.round(base * 1.15) };
}

export function hitChanceFor(command) {
  return command === 'Resonart' ? RESONART_HIT_CHANCE : BASIC_ATTACK_HIT_CHANCE;
}
