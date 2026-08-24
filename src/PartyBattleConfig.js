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

// Height hierarchy Auryi > Prismel > Kineza is already encoded in
// BattleConfig's own scaleMul (Prismel 1 / Kineza 0.78 / Auryi 1.29) —
// derived from the SAME source canvases (assets/poses/**) this scene
// composites directly, in the same "real proportions" context BP already
// uses it for. That's a legitimate reuse, not the tactical-map-icon
// anti-pattern documented in CLAUDE.md (those are a separately
// pre-processed asset family with different padding) — this scene draws
// from the identical pose PNGs BP does.
export function heightScaleFor(heroId) {
  const hero = HEROES[heroId];
  return (hero && hero.scaleMul) || 1;
}

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
