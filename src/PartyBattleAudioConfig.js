// FAI-AUDIO-02 — real hero/enemy banks replace the FAI-AUDIO-01 legacy
// reference set as primary battle-action content, per DAI's phone-test
// verdict ("legacy prototype bleeps are still audible as battle
// production content... PRESENTATION FAIL/REWORK").
//
// PartyBattleAudioController.js never hardcodes a file path; every event
// either has an entry here or plays nothing (gracefully).
const PRISMEL_BANK = Object.freeze({
  step: './assets/sfx/sfx_step.mp3',
  gather: './assets/sfx/sfx_gather.mp3',
  release: './assets/sfx/sfx_release.mp3',
  impact: './assets/sfx/sfx_impact.mp3',
  recover: './assets/sfx/sfx_recover.mp3'
});
const KINEZA_BANK = Object.freeze({
  step: './assets/sfx/kineza/kineza_step.mp3',
  gather: './assets/sfx/kineza/kineza_coil.mp3',
  release: './assets/sfx/kineza/kineza_strike.mp3',
  impact: './assets/sfx/kineza/kineza_impact.mp3',
  recover: './assets/sfx/kineza/kineza_recover.mp3',
  // FAI-BATTLE-PRESENTATION-03: previously loaded-but-unwired (see the
  // old comment below) — now consumed as runtime LAYERS (AUDIO_LAYER_MAP)
  // under his primary cues, not as their own standalone events.
  debris: './assets/sfx/kineza/kineza_debris.mp3',
  idlePulse: './assets/sfx/kineza/kineza_idle_pulse.mp3'
});
const AURYI_BANK = Object.freeze({
  step: './assets/sfx/auryi/auryi_step.mp3',
  gather: './assets/sfx/auryi/auryi_gather.mp3',
  release: './assets/sfx/auryi/auryi_release.mp3',
  impact: './assets/sfx/auryi/auryi_impact.mp3',
  recover: './assets/sfx/auryi/auryi_recompose.mp3', // Auryi's own name for her recovery beat
  idlePulse: './assets/sfx/auryi/auryi_idle_pulse.mp3'
});

const HERO_BANKS = Object.freeze({ prismel: PRISMEL_BANK, kineza: KINEZA_BANK, auryi: AURYI_BANK });

function heroEventEntries() {
  const entries = {};
  Object.entries(HERO_BANKS).forEach(([heroId, bank]) => {
    if (bank.step) entries[`turnStart:${heroId}`] = { key: `pb_hero_${heroId}_step`, path: bank.step, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    if (bank.gather) entries[`attackGather:${heroId}`] = { key: `pb_hero_${heroId}_gather`, path: bank.gather, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    if (bank.release) entries[`attackRelease:${heroId}`] = { key: `pb_hero_${heroId}_release`, path: bank.release, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    if (bank.impact) entries[`attackImpact:${heroId}`] = { key: `pb_hero_${heroId}_impact`, path: bank.impact, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    // recover is loaded (available for a future "recover" event) but not
    // fired anywhere yet — ANIMATION_EVENT_MARKERS.md's vocabulary has a
    // "recover" marker but no dedicated audio hook in IMPLEMENT_NOW.md.
    if (bank.recover) entries[`_recover:${heroId}`] = { key: `pb_hero_${heroId}_recover`, path: bank.recover, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    // debris/idlePulse: not events of their own — AUDIO_LAYER_MAP below
    // fires these alongside a primary cue as a second simultaneous layer
    // (DYNAMIC_AUDIO_DIRECTION.md's "identity layer"/"energy layer"),
    // never as a standalone hero SFX.
    if (bank.debris) entries[`_layer:${heroId}:debris`] = { key: `pb_hero_${heroId}_debris`, path: bank.debris, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    if (bank.idlePulse) entries[`_layer:${heroId}:idlePulse`] = { key: `pb_hero_${heroId}_idlePulse`, path: bank.idlePulse, bus: 'sfx', tag: 'PRODUCTION_BANK' };
  });
  return entries;
}

// FAI-BATTLE-PRESENTATION-03 (DYNAMIC_AUDIO_DIRECTION.md, AUDIO_EVOLVE_
// POLICY.md): a one-shot cue per marker no longer carries enough weight/
// buildup/payoff on its own. Rather than replacing any file (no new audio
// was created or sourced from outside the repo — AUDIO_EVOLVE_POLICY.md's
// "not sacred finals" list explicitly allows this), each hero's primary
// marker cue gets a second, already-owned cue layered underneath it at
// runtime — "runtime layering for synchronization" — at a reduced volume
// and a shaped `rate` (Phaser's live playback-rate control; "modest time
// stretching"/"moderate pitch shaping" from the same allowed list,
// applied at playback rather than pre-baked into a new file). Every
// layer's source is named in its own key (pb_hero_<id>_<source>) so
// provenance stays traceable — nothing here claims to be new material.
//
// Per-hero identity is enforced by construction, not by convention: a
// hero's layers only ever reference that hero's own bank (DYNAMIC_AUDIO_
// DIRECTION.md's explicit "avoid" lines — Auryi must not read as
// Kineza's crack). Kineza's layers pitch DOWN (heavier, kinetic); Auryi's
// pitch DOWN but softer (warm/resonant, not brittle). Prismel has none —
// see the note at the top of this map.
export const AUDIO_LAYER_MAP = Object.freeze({
  // FAI-BATTLE-PRESENTATION-04 (AUDIO_CHOREOGRAPHY_STATUS.md): "Do not
  // over-tune audio to the legacy fallback attack. Keep the mapping easy
  // to move when DAI supplies the current Basic Attack." BP03's Prismel
  // layering (a pitched gather/release echo under his release/impact) was
  // built around his legacy TEMPORARY FALLBACK pose sequence specifically
  // — removed rather than carried forward, so nothing has to be undone or
  // re-tuned the moment his real Basic Attack lands; he plays on his
  // plain primary cues only until then.

  // Auryi — harmonic inward bloom -> airy luminous release -> warm
  // resonant impact -> resolving recompose tail. Built only from her own
  // idle-pulse identity cue, pitched down for warmth (never brittle).
  'attackGather:auryi': [
    { key: 'pb_hero_auryi_idlePulse', volumeMul: 0.3, rate: 0.9, delayMs: 30 }
  ],
  'attackImpact:auryi': [
    { key: 'pb_hero_auryi_idlePulse', volumeMul: 0.4, rate: 0.75, delayMs: 80 }
  ],

  // Kineza — coil/tension -> gauntlet ignition + strike transient ->
  // heavy kinetic body impact -> energy/debris tail -> settle. Built only
  // from his own idle-pulse/debris cues, pitched down for weight (never
  // soft chimes).
  'attackGather:kineza': [
    { key: 'pb_hero_kineza_idlePulse', volumeMul: 0.35, rate: 0.85, delayMs: 40 }
  ],
  'attackImpact:kineza': [
    { key: 'pb_hero_kineza_debris', volumeMul: 0.55, rate: 0.92, delayMs: 30 }
  ]
});

// UI_AUDIO_SEMANTICS.md's explicit exception: "UI can temporarily keep a
// minimal non-character cursor/confirm tone only if no better shared UI
// cue exists" — no dedicated UI SFX exist in the repo outside the legacy
// reference set, so uiMove/uiConfirm/uiReject/targetAcquire keep using
// it. Everything battle-action (attack/turn/victory) has moved off it.
const LEGACY = './assets/party_battle_audio/legacy_reference_sfx';

export const AUDIO_EVENT_MAP = Object.freeze({
  uiMove: { key: 'pb_sfx_select', path: `${LEGACY}/legacy_select.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  uiConfirm: { key: 'pb_sfx_select', path: `${LEGACY}/legacy_select.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  uiReject: { key: 'pb_sfx_reject', path: `${LEGACY}/legacy_reject.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  targetAcquire: { key: 'pb_sfx_select', path: `${LEGACY}/legacy_select.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  victory: { key: 'pb_sfx_victory', path: './assets/sfx/sfx_victory.mp3', bus: 'sfx', tag: 'PRODUCTION_BANK' },
  ...heroEventEntries()
  // guard / itemUse: deliberately unmapped. No dedicated Guard/Item SFX
  // exist anywhere in this repo (checked directly), and IMPLEMENTATION_
  // DIRECTIVE.md's "do not force a character attack cue onto Guard or
  // Item... prefer silence" rules out reusing a hero's attack bank or a
  // legacy bleep as a substitute. Silent until real assets exist — a
  // real, disclosed blocker, not an oversight.
  // enemyHit / enemyDefeat: NOT listed here on purpose — routed through
  // EnemyAudioDirector directly (see PartyBattleAudioController.js),
  // reusing its existing bank-selection logic instead of duplicating it.
});

// DEV placeholder music — Veilbreak.mp3 remains the current battle-music
// candidate per FAI-AUDIO-02 ("continue testing... do not call it
// permanently locked yet"), reused from VeilBattleScene.js's own preload.
export const MUSIC_ASSET = Object.freeze({
  key: 'pb_music_dev_placeholder', path: './Veilbreak.mp3', tag: 'CANDIDATE_BATTLE_MUSIC'
});
