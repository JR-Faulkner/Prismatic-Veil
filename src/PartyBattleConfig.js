// FAI-HUD-01 Phase A — party battle data model.
//
// Deliberately separate from BattleConfig.js's single-hero BATTLE_CONFIG:
// this is a different combat shape (3 active party members vs. enemies,
// per NEW_PARTY_DATA_CONTRACT.json), not a variant of the existing 1v1
// scene. Character stats/art/attack data still come from BattleConfig's
// HEROES — no duplicated roster — this file only adds the party-specific
// shape (formation slots, the 4-command rail, RP-gated Resonart) on top.
import { HEROES } from './BattleConfig.js?v=44';

// Locked formation (NEW_PARTY_DATA_CONTRACT.json / FAI_ARCHITECTURE
// addendum): Prismel back -> Auryi middle -> Kineza front -> enemies.
// formation_changes_on_turn: false — slots are fixed for the whole
// encounter; only the active-actor highlight moves.
export const PARTY_SLOTS = Object.freeze([
  Object.freeze({ slot: 'back', heroId: 'prismel' }),
  Object.freeze({ slot: 'middle', heroId: 'auryi' }),
  Object.freeze({ slot: 'front', heroId: 'kineza' })
]);

// FAI-HUD-01B correction: BP's assets/poses/**_LOCKED.png (and its
// scaleMul calibration) is a DIFFERENT asset library from the party
// formation's own locked JRPG masters — exactly the "don't reach for
// whichever asset library is already loaded" trap CLAUDE.md documents
// elsewhere. The formation now runs on ASSET_LOCK_CONTRACT.json's own
// exact approved masters (assets/party_formation/) with FAI-HUD-01B's
// own calibration, not BattleConfig's.
//
// PRISMEL/AURYI are the locked masters' own 900x900 "normalized" layers
// — pre-matted to a shared canvas where relative content height already
// encodes the correct real-world proportions (confirmed by measuring:
// content heights 562/636px on the 900-tall canvas match the contract's
// declared normalized_heights_px_on_reference of 570/650 to within
// matting-threshold noise). Because both are on the same 900px canvas, a
// single shared scale factor (canvas-height-based, same as HeroPoseView's
// own "one scale for the whole pose set, derived from the idle frame"
// principle) reproduces the locked height hierarchy with no per-hero
// multiplier needed.
//
// KINEZA is the one exception: FAI-HUD-01B's own "EXACT" master is
// front/camera-facing, not right-facing toward the enemy side — the
// same facing problem FAIPZ01's evidence report already flagged for this
// exact character in the frontline slot. Per FAI-HUD-01B's own missing-
// pose protocol ("use the closest approved existing pose temporarily,
// return the request to DAI, do not invent a replacement"), this uses
// FAI-HUD-01's earlier already-APPROVED right-facing companion asset
// instead — same character, confirmed visually (identical armor/cape/
// fist-glow design), just a different crop convention (full-bleed, no
// canvas padding) than the other two's 900x900 normalized layers, so it
// needs its own scale derived from the SAME locked target height rather
// than the shared canvas-based scale. Flagged back to DAI in the FAI
// feedback for this pass — not a silent substitution.
export const PARTY_ASSET_LOCK = Object.freeze({
  referenceCanvas: 900,
  // ASSET_LOCK_CONTRACT.json's normalized_heights_px_on_reference.
  normalizedHeightPx: Object.freeze({ auryi: 650, prismel: 570, kineza: 475 }),
  // contentBottomFrac: measured offline (alpha-threshold connected-
  // component bbox, same method this project's earlier asset-extraction
  // passes used) — where the character's actual feet sit as a fraction
  // of the full canvas height. The three source files pad differently
  // below the feet (Prismel to 90.6%, Auryi to 88.6%, Kineza's substitute
  // to 87.3%), so anchoring every sprite's origin at a blind 1.0 (canvas
  // bottom) would put their feet at three different heights and break the
  // "standing on the same ground" read — this lets each one's origin
  // land on its own actual feet instead.
  textures: Object.freeze({
    prismel: { key: 'party_prismel', path: './assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png', canvas: true, contentBottomFrac: 0.906 },
    auryi: { key: 'party_auryi', path: './assets/party_formation/AURYI_JRPG_NORMALIZED_900x900.png', canvas: true, contentBottomFrac: 0.886 },
    // Substituted per the missing-pose protocol above — not the pack's
    // own KINEZA_JRPG_MASTER (front-facing). This file shipped with a
    // fully opaque alpha channel (RGBA in name only — every pixel at
    // alpha=255, flat white background baked in, confirmed by direct
    // pixel inspection) and needed matting before it was usable at all;
    // that matting is the one departure from "mechanical placement only"
    // this pass took, and it's exactly the "masking" operation the
    // correction pack's own rules permit (not a redraw/regenerate).
    // canvas: false + contentHeightPx: matting revealed real padding
    // above and below the character (content spans only 364 of the
    // canvas's 512px, not the full canvas as assumed before matting) —
    // heightScaleFor() needs the actual content height, not the raw
    // texture height, or Kineza renders undersized relative to the
    // locked target.
    kineza: { key: 'party_kineza', path: './assets/party_formation/KINEZA_RIGHT_FACING_IDLE_APPROVED.png', canvas: false, contentBottomFrac: 0.873, contentHeightPx: 364 }
  })
});

// One shared scale for the two canvas-based masters (their relative
// height is already baked into the 900px canvas, so scaling the raw
// canvas uniformly reproduces the locked heights with no per-hero
// multiplier). The substituted Kineza asset is a different crop
// convention with its own real padding (see contentHeightPx's comment
// above — 364 of its 512px canvas, not the full canvas) — it needs its
// own scale derived from its actual measured CONTENT height (not raw
// texture height, which would undersize him relative to the locked
// target by the ratio of padding involved) so his displayed content
// still lands on the same locked 475-reference-unit target the
// canvas-based pair would have put him at.
export function heightScaleFor(heroId, commonScale) {
  const tex = PARTY_ASSET_LOCK.textures[heroId];
  if (tex && !tex.canvas) {
    return (PARTY_ASSET_LOCK.normalizedHeightPx[heroId] * commonScale) / tex.contentHeightPx;
  }
  return commonScale;
}

// FAI-BATTLE-PRESENTATION-04 (ANIMATION_AUTHORITY_CORRECTION.md): BP03's
// Kineza attack used the legacy Kineza02-05 pose-slide/crossfade set
// (assets/poses/kineza/) — DAI's own correction: "those are NOT the
// current Party Battle Basic Attack authority." The real authority is
// Kineza's PriZim-cleared 7-animation pack's Basic Attack entry — a real
// 6-frame sprite sheet (`six_frame_emerald_punch_animation.png`,
// PriZim bleed-isolation "pass"), copied in at
// assets/characters/kineza/animations/kineza_basic_attack_v1.png per
// that pack's own suggested naming convention (ASSET_NAMING.md). Frame
// geometry (frameWidth/frameHeight/baselinePx) comes directly from the
// pack's own pz_report.json — a uniform 520x660 6-column grid, every
// frame independently registered to the same baseline (feet) position,
// so no per-frame position correction is needed at runtime.
// markerFrames maps ANIMATION_EVENT_MARKERS.md's vocabulary onto the
// real frames the source content actually shows (confirmed by viewing
// each extracted frame, not guessed from the file name): 1-2 are the
// coil/wind-up, 3 is the punch committing, 4 is full extension with the
// energy burst (the impact beat), 5-6 are the retract/settle back toward
// the frame-1 guard stance.
export const KINEZA_ATTACK_SHEET = Object.freeze({
  key: 'kineza_basic_attack_v2',
  path: './assets/characters/kineza/animations/kineza_basic_attack_v2.png',
  frameWidth: 720,
  frameHeight: 580,
  frameCount: 12,
  baselinePx: 525,
  contentHeightPx: 350,
  frameDurations: Object.freeze([150,150,150,150,150,150,120,110,125,125,145,160]),
  markerFrames: Object.freeze({ gather: [1,2,3,4,5], release: [6,7], impact: [8], recover: [9,10,11] }),
  povFrames: Object.freeze([6,7,8,9])
});


export const KINEZA_STATE_SHEET = Object.freeze({
  key: 'kineza_battle_states_v1',
  path: './assets/characters/kineza/battle/kineza_battle_states_v1.png',
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

// Keyed lookup so PartyFormationView's sheet-attack support stays generic
// (checks this map, never a hardcoded hero id) — adding a second hero's
// current-authority sheet later is a data entry here, not a code branch.
export const PRISMEL_ATTACK_SHEET = Object.freeze({
  key: 'prismel_basic_attack_v1',
  path: './assets/characters/prismel/animations/prismel_basic_attack_v1.webp',
  frameWidth: 720,
  frameHeight: 580,
  frameCount: 12,
  baselinePx: 520,
  frameDurations: Object.freeze([167,167,167,167,167,167,167,133,133,133,167,167]),
  markerFrames: Object.freeze({ gather: [1,2,3,4,5], release: [6,7], impact: [8], recover: [9,10,11] })
});

export const HERO_ATTACK_SHEETS = Object.freeze({
  kineza: KINEZA_ATTACK_SHEET,
  prismel: PRISMEL_ATTACK_SHEET
});

export const BASE_COMMANDS = Object.freeze(['Attack', 'Resonart', 'Guard', 'Item']);

// Prototype placeholders for plumbing/UI QA (matching BattleConfig.js's
// own rp/attunement comment) — not a balance lock. A basic Attack is
// always available and free; Resonart is the hero's own named technique
// (BattleConfig's `attack` entry — Refractive Burst / Momentum Fist /
// Veil Pulse) and costs RP, matching the reference mock's "RP 18" cost
// and the Grimoire spec's "RP cost" field on technique detail.
export const RESONART_RP_COST = 20;
export const BASIC_ATTACK_DAMAGE_MULT = 0.6; // vs. the hero's Resonart damage
export const BASIC_ATTACK_HIT_CHANCE = 0.96;
export const RESONART_HIT_CHANCE = 0.92;

// No inventory/item system exists anywhere else in this codebase yet
// (grep-confirmed). This single stub entry is a placeholder so the Item
// command is functionally real (heals on use) rather than a dead button —
// not a claim that a real item/economy system has been designed. That's
// out of FAI-HUD-01's scope; FAI-UX-03's Grimoire "Items" tab is the
// eventual real home for this.
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
