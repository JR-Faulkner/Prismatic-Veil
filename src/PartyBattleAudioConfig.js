// FAI-AUDIO-01 — data-driven audio asset map. PartyBattleAudioController.js
// never hardcodes a file path; every event either has an entry here or
// plays nothing (gracefully — see _play()'s cache.audio.exists guard).
//
// LEGACY_REFERENCE_ONLY: every WAV below is one of DAI's own supplied
// legacy_reference_sfx files, explicitly not approved as final SFX
// (LEGACY_REFERENCE_POLICY.md). They exist here to prove the event
// wiring, timing, and volume buses actually work end to end — replacing
// any of them later is a one-line path change in this file, nothing in
// PartyBattleAudioController.js or PartyBattleScene.js needs to change.
//
// Several IMPLEMENT_NOW.md events have no entry at all and are left
// unmapped on purpose rather than force-fit onto a mismatched legacy
// asset: attackGather/attackRelease (no legacy asset distinguishes
// anticipation from release — only one generic "attack" cue exists, used
// for attackImpact), enemyHit/enemyDefeat (no legacy asset reads as an
// enemy-side cue rather than a hero one). Calling these events today is
// still safe — PartyBattleAudioController._play() no-ops on a missing
// entry — they're just silent until real assets exist.
const LEGACY = './assets/party_battle_audio/legacy_reference_sfx';

export const AUDIO_EVENT_MAP = Object.freeze({
  uiMove: { key: 'pb_sfx_select', path: `${LEGACY}/legacy_select.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  uiConfirm: { key: 'pb_sfx_select', path: `${LEGACY}/legacy_select.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  uiReject: { key: 'pb_sfx_reject', path: `${LEGACY}/legacy_reject.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  turnStart: { key: 'pb_sfx_step', path: `${LEGACY}/legacy_step.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  targetAcquire: { key: 'pb_sfx_select', path: `${LEGACY}/legacy_select.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  attackImpact: { key: 'pb_sfx_attack', path: `${LEGACY}/legacy_attack.wav`, bus: 'sfx', tag: 'LEGACY_REFERENCE_ONLY' },
  guard: { key: 'pb_sfx_hush', path: `${LEGACY}/legacy_hush.wav`, bus: 'sfx', tag: 'LEGACY_REFERENCE_ONLY' },
  itemUse: { key: 'pb_sfx_restore', path: `${LEGACY}/legacy_restore.wav`, bus: 'sfx', tag: 'LEGACY_REFERENCE_ONLY' },
  victory: { key: 'pb_sfx_win', path: `${LEGACY}/legacy_win.wav`, bus: 'sfx', tag: 'LEGACY_REFERENCE_ONLY' }
});

// DEV_PLACEHOLDER_ONLY — reused from VeilBattleScene.js's own preload,
// not a chosen final track. Proves the music lifecycle (load, fade in,
// loop, fade out, pause/mute respect) without inventing new audio.
export const MUSIC_ASSET = Object.freeze({
  key: 'pb_music_dev_placeholder', path: './Veilbreak.mp3', tag: 'DEV_PLACEHOLDER_ONLY'
});
