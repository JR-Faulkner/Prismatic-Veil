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
  recover: './assets/sfx/kineza/kineza_recover.mp3'
});
const AURYI_BANK = Object.freeze({
  step: './assets/sfx/auryi/auryi_step.mp3',
  gather: './assets/sfx/auryi/auryi_gather.mp3',
  release: './assets/sfx/auryi/auryi_release.mp3',
  impact: './assets/sfx/auryi/auryi_impact.mp3',
  recover: './assets/sfx/auryi/auryi_recompose.mp3' // Auryi's own name for her recovery beat
});

// IMPLEMENT_NOW_02's own naming: kineza_idle_pulse/auryi_idle_pulse and
// kineza_debris exist in the repo but aren't wired to any event in this
// pass — "Debris only used where visually appropriate" (no debris visual
// exists in the current lunge animation) and idle-pulse has no matching
// "idle" event in IMPLEMENT_NOW.md's vocabulary at all. Left unmapped
// rather than force-fit onto something that doesn't fit; a future pass
// can add them once there's a real idle-state hook or debris visual.
const HERO_BANKS = Object.freeze({ prismel: PRISMEL_BANK, kineza: KINEZA_BANK, auryi: AURYI_BANK });

function heroEventEntries() {
  const entries = {};
  Object.entries(HERO_BANKS).forEach(([heroId, bank]) => {
    if (bank.step) entries[`turnStart:${heroId}`] = { key: `pb_hero_${heroId}_step`, path: bank.step, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    if (bank.gather) entries[`attackGather:${heroId}`] = { key: `pb_hero_${heroId}_gather`, path: bank.gather, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    if (bank.release) entries[`attackRelease:${heroId}`] = { key: `pb_hero_${heroId}_release`, path: bank.release, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    if (bank.impact) entries[`attackImpact:${heroId}`] = { key: `pb_hero_${heroId}_impact`, path: bank.impact, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    // recover is loaded (available for a future "recover" event) but not
    // fired anywhere yet — IMPLEMENT_NOW.md's vocabulary has no recover
    // hook, only gather/release/impact.
    if (bank.recover) entries[`_recover:${heroId}`] = { key: `pb_hero_${heroId}_recover`, path: bank.recover, bus: 'sfx', tag: 'PRODUCTION_BANK' };
  });
  return entries;
}

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
