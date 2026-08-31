// Party Battle production audio mapping.
// Hero identity cues stay character-specific; Blitzer's presentation pass
// changes runtime balance/layering only and does not replace source assets.
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
  debris: './assets/sfx/kineza/kineza_debris.mp3',
  idlePulse: './assets/sfx/kineza/kineza_idle_pulse.mp3'
});
const AURYI_BANK = Object.freeze({
  step: './assets/sfx/auryi/auryi_step.mp3',
  gather: './assets/sfx/auryi/auryi_gather.mp3',
  release: './assets/sfx/auryi/auryi_release.mp3',
  impact: './assets/sfx/auryi/auryi_impact.mp3',
  recover: './assets/sfx/auryi/auryi_recompose.mp3',
  idlePulse: './assets/sfx/auryi/auryi_idle_pulse.mp3'
});

const HERO_BANKS = Object.freeze({ prismel: PRISMEL_BANK, kineza: KINEZA_BANK, auryi: AURYI_BANK });

function heroEventEntries() {
  const entries = {};
  Object.entries(HERO_BANKS).forEach(([heroId, bank]) => {
    const kinezaMix = heroId === 'kineza'
      ? { step: 0.78, gather: 0.72, release: 0.86, impact: 0.78 }
      : { step: 1, gather: 1, release: 1, impact: 1 };
    if (bank.step) entries[`turnStart:${heroId}`] = { key: `pb_hero_${heroId}_step`, path: bank.step, bus: 'sfx', tag: 'PRODUCTION_BANK', volumeMul: kinezaMix.step };
    if (bank.gather) entries[`attackGather:${heroId}`] = { key: `pb_hero_${heroId}_gather`, path: bank.gather, bus: 'sfx', tag: 'PRODUCTION_BANK', volumeMul: kinezaMix.gather };
    if (bank.release) entries[`attackRelease:${heroId}`] = { key: `pb_hero_${heroId}_release`, path: bank.release, bus: 'sfx', tag: 'PRODUCTION_BANK', volumeMul: kinezaMix.release };
    if (bank.impact) entries[`attackImpact:${heroId}`] = { key: `pb_hero_${heroId}_impact`, path: bank.impact, bus: 'sfx', tag: 'PRODUCTION_BANK', volumeMul: kinezaMix.impact };
    if (bank.recover) entries[`_recover:${heroId}`] = { key: `pb_hero_${heroId}_recover`, path: bank.recover, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    if (bank.debris) entries[`_layer:${heroId}:debris`] = { key: `pb_hero_${heroId}_debris`, path: bank.debris, bus: 'sfx', tag: 'PRODUCTION_BANK' };
    if (bank.idlePulse) entries[`_layer:${heroId}:idlePulse`] = { key: `pb_hero_${heroId}_idlePulse`, path: bank.idlePulse, bus: 'sfx', tag: 'PRODUCTION_BANK' };
  });
  return entries;
}

export const AUDIO_LAYER_MAP = Object.freeze({
  'attackGather:auryi': [
    { key: 'pb_hero_auryi_idlePulse', volumeMul: 0.3, rate: 0.9, delayMs: 30 }
  ],
  'attackImpact:auryi': [
    { key: 'pb_hero_auryi_idlePulse', volumeMul: 0.4, rate: 0.75, delayMs: 80 }
  ],

  // Blitzer: tension has room, release gets a quick energy wake, impact
  // gets the body/debris transient, then the existing recover cue becomes
  // a short settling tail instead of another simultaneous loud hit.
  'attackGather:kineza': [
    { key: 'pb_hero_kineza_idlePulse', volumeMul: 0.22, rate: 0.84, delayMs: 35 }
  ],
  'attackRelease:kineza': [
    { key: 'pb_hero_kineza_idlePulse', volumeMul: 0.18, rate: 1.12, delayMs: 10 }
  ],
  'attackImpact:kineza': [
    { key: 'pb_hero_kineza_debris', volumeMul: 0.42, rate: 0.88, delayMs: 20 },
    { key: 'pb_hero_kineza_recover', volumeMul: 0.30, rate: 0.96, delayMs: 175 }
  ]
});

const LEGACY = './assets/party_battle_audio/legacy_reference_sfx';

export const AUDIO_EVENT_MAP = Object.freeze({
  uiMove: { key: 'pb_sfx_select', path: `${LEGACY}/legacy_select.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  uiConfirm: { key: 'pb_sfx_select', path: `${LEGACY}/legacy_select.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  uiReject: { key: 'pb_sfx_reject', path: `${LEGACY}/legacy_reject.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  targetAcquire: { key: 'pb_sfx_select', path: `${LEGACY}/legacy_select.wav`, bus: 'ui', tag: 'LEGACY_REFERENCE_ONLY' },
  victory: { key: 'pb_sfx_victory', path: './assets/sfx/sfx_victory.mp3', bus: 'sfx', tag: 'PRODUCTION_BANK' },
  ...heroEventEntries()
});

export const MUSIC_ASSET = Object.freeze({
  key: 'pb_music_dev_placeholder', path: './Veilbreak.mp3', tag: 'CANDIDATE_BATTLE_MUSIC'
});
