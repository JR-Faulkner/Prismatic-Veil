// Party Battle audio controller.
// Centralized event/mix layer: missing assets fail silently, hero cues remain
// character-specific, and cinematic attacks can shape the music without
// changing the user's persistent volume preferences.
import { AUDIO_EVENT_MAP, AUDIO_LAYER_MAP, MUSIC_ASSET } from './PartyBattleAudioConfig.js?v=4';
import EnemyAudioDirector, { preloadEnemyAudio } from './EnemyAudioDirector.js?v=42';

const PREFS_KEY = 'pv_party_battle_audio_prefs_v1';
const DEFAULT_PREFS = Object.freeze({ master: 0.9, music: 0.6, sfx: 0.95, ui: 0.72, muted: false });
const SFX_MIX_GAIN = 1.05;
const AURORA_BLOOM_KEY = 'pv_auryi_celestial_bloom';
const TRIUMPH_LIGHT_KEY = 'pv_triumph_of_light';
// Cinematic weight now comes from contrast, not louder SFX. Give Blitzer a
// deeper temporary music pocket while preserving the normal battle mix.
const CINEMATIC_MUSIC_MULT = 0.36;

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch (err) {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (err) { /* ignore */ }
}

export default class PartyBattleAudioController {
  constructor(scene) {
    this.scene = scene;
    this.prefs = loadPrefs();
    this.sounds = {};
    this.music = null;
    this._auroraBloom = null;
    this._triumph = null;
    this._visHandler = null;
    this._unlockPending = false;
    this._cinematicActive = false;
  }

  preload() {
    Object.values(AUDIO_EVENT_MAP).forEach(def => {
      if (!def || !def.key || !def.path) return;
      this.scene.load.audio(def.key, def.path);
    });
    if (MUSIC_ASSET) this.scene.load.audio(MUSIC_ASSET.key, MUSIC_ASSET.path);
    preloadEnemyAudio(this.scene);
  }

  create() {
    this.enemyDirector = new EnemyAudioDirector(this.scene, this.scene.enemy);
    this.enemyDirector.create();
    this._visHandler = () => {
      if (document.hidden) {
        if (this.music?.isPlaying) this.music.pause();
        if (this._auroraBloom?.isPlaying) this._auroraBloom.pause();
        if (this._triumph?.isPlaying) this._triumph.pause();
      } else {
        if (this.music?.isPaused) this.music.resume();
        if (this._auroraBloom?.isPaused) this._auroraBloom.resume();
        if (this._triumph?.isPaused) this._triumph.resume();
      }
    };
    document.addEventListener('visibilitychange', this._visHandler);
    this.scene.events.once('shutdown', () => this.destroy());
  }

  isLocked() { return this.scene.sound.locked; }
  onUnlocked(cb) { this.scene.sound.once('unlocked', cb); }

  setBusVolume(bus, value) {
    this.prefs[bus] = Phaser.Math.Clamp(value, 0, 1);
    savePrefs(this.prefs);
    this._applyMusicVolume();
  }

  getBusVolume(bus) { return this.prefs[bus]; }

  setMuted(muted) {
    this.prefs.muted = !!muted;
    savePrefs(this.prefs);
    this._applyMusicVolume();
    if (this._auroraBloom) this._auroraBloom.setVolume(this._effectiveVolume('sfx', 0.86));
    if (this._triumph) this._triumph.setVolume(this._effectiveVolume('music', 0.92));
  }

  isMuted() { return !!this.prefs.muted; }

  _effectiveVolume(bus, base = 1) {
    if (this.prefs.muted) return 0;
    const busVol = this.prefs[bus] != null ? this.prefs[bus] : 1;
    const mixGain = bus === 'sfx' ? SFX_MIX_GAIN : 1;
    return Phaser.Math.Clamp(this.prefs.master * busVol * base * mixGain, 0, 1);
  }

  _musicTargetVolume() {
    return this._effectiveVolume('music') * (this._cinematicActive ? CINEMATIC_MUSIC_MULT : 1);
  }

  _applyMusicVolume() {
    if (this.music) this.music.setVolume(this._musicTargetVolume());
  }

  beginCinematicAttack() {
    this._cinematicActive = true;
    if (!this.music || !this.music.isPlaying) return;
    this._duckToken = (this._duckToken || 0) + 1;
    this.scene.tweens.killTweensOf(this.music);
    this.scene.tweens.add({
      targets: this.music,
      volume: this._musicTargetVolume(),
      duration: 80,
      ease: 'Sine.easeOut'
    });
  }

  endCinematicAttack() {
    this._cinematicActive = false;
    if (!this.music || !this.music.isPlaying) return;
    this._duckToken = (this._duckToken || 0) + 1;
    this.scene.tweens.killTweensOf(this.music);
    this.scene.tweens.add({
      targets: this.music,
      volume: this._musicTargetVolume(),
      duration: 260,
      ease: 'Sine.easeIn'
    });
  }

  _duckMusic(mult = 0.82, holdMs = 240) {
    if (!this.music || !this.music.isPlaying) return;
    this._duckToken = (this._duckToken || 0) + 1;
    const token = this._duckToken;
    const target = this._musicTargetVolume();
    this.scene.tweens.killTweensOf(this.music);
    this.scene.tweens.add({ targets: this.music, volume: target * mult, duration: 40, ease: 'Sine.easeOut' });
    this.scene.time.delayedCall(holdMs, () => {
      if (token !== this._duckToken || !this.music) return;
      this.scene.tweens.add({ targets: this.music, volume: this._musicTargetVolume(), duration: 150, ease: 'Sine.easeIn' });
    });
  }

  _play(eventName) {
    const def = AUDIO_EVENT_MAP[eventName] || AUDIO_EVENT_MAP[eventName.split(':')[0]];
    if (!def || !def.key) return;
    if (!this.scene.cache.audio.exists(def.key)) return;
    const fire = () => {
      const sound = this.scene.sound.add(def.key, {
        volume: this._effectiveVolume(def.bus, def.volumeMul != null ? def.volumeMul : 1),
        rate: def.rate || 1
      });
      sound.play();
      sound.once('complete', () => sound.destroy());
    };
    if (this.scene.sound.locked) this.scene.sound.once('unlocked', fire);
    else fire();

    const layers = AUDIO_LAYER_MAP[eventName];
    if (layers) layers.forEach(layer => this._playLayer(layer, def.bus));
  }

  _playLayer(layer, bus) {
    if (!this.scene.cache.audio.exists(layer.key)) return;
    const fire = () => {
      const sound = this.scene.sound.add(layer.key, {
        volume: this._effectiveVolume(bus, layer.volumeMul != null ? layer.volumeMul : 1),
        rate: layer.rate || 1
      });
      sound.play();
      sound.once('complete', () => sound.destroy());
    };
    const start = () => {
      if (layer.delayMs) this.scene.time.delayedCall(layer.delayMs, fire);
      else fire();
    };
    if (this.scene.sound.locked) this.scene.sound.once('unlocked', start);
    else start();
  }

  battleEnter() { this._play('battleEnter'); }

  battleMusicStart() {
    if (!MUSIC_ASSET || !this.scene.cache.audio.exists(MUSIC_ASSET.key)) return;
    if (this.music && this.music.isPlaying) return;
    if (!this.music) this.music = this.scene.sound.add(MUSIC_ASSET.key, { loop: true, volume: 0 });
    const start = () => {
      if (this.music.isPlaying) return;
      this.music.play();
      this.scene.tweens.add({
        targets: this.music,
        volume: this._musicTargetVolume(),
        duration: 900,
        ease: 'Sine.easeIn'
      });
    };
    if (this.scene.sound.locked) this.scene.sound.once('unlocked', start);
    else start();
  }

  battleMusicStop(fadeMs = 700) {
    if (!this.music || !this.music.isPlaying) return;
    this.scene.tweens.add({
      targets: this.music, volume: 0, duration: fadeMs, ease: 'Sine.easeOut',
      onComplete: () => { if (this.music) this.music.stop(); }
    });
  }

  // Aurora Pulse owns a dedicated full-length cue. These methods are
  // intentionally cache-guarded so older/non-K battle routes keep working
  // until the exact masters are physically installed and preloaded.
  auroraBloomStart() {
    if (!this.scene.cache.audio.exists(AURORA_BLOOM_KEY)) return false;
    if (this._auroraBloom) {
      try { this._auroraBloom.stop(); this._auroraBloom.destroy(); } catch (err) { /* ignore */ }
    }
    this._auroraBloom = this.scene.sound.add(AURORA_BLOOM_KEY, {
      loop: false,
      volume: this._effectiveVolume('sfx', 0.86)
    });
    const fire = () => this._auroraBloom?.play();
    if (this.scene.sound.locked) this.scene.sound.once('unlocked', fire);
    else fire();
    return true;
  }

  auroraBloomSilence() {
    if (this._auroraBloom?.isPlaying) this._auroraBloom.pause();
  }

  auroraBloomResume() {
    if (this._auroraBloom?.isPaused) this._auroraBloom.resume();
  }

  auroraBloomStop(fadeMs = 360) {
    const sound = this._auroraBloom;
    if (!sound) return;
    if (!sound.isPlaying && !sound.isPaused) {
      try { sound.destroy(); } catch (err) { /* ignore */ }
      this._auroraBloom = null;
      return;
    }
    if (sound.isPaused) sound.resume();
    this.scene.tweens.killTweensOf(sound);
    this.scene.tweens.add({
      targets: sound,
      volume: 0,
      duration: fadeMs,
      ease: 'Sine.easeOut',
      onComplete: () => {
        try { sound.stop(); sound.destroy(); } catch (err) { /* ignore */ }
        if (this._auroraBloom === sound) this._auroraBloom = null;
      }
    });
  }

  playTriumphOfLight() {
    if (!this.scene.cache.audio.exists(TRIUMPH_LIGHT_KEY)) return false;
    this.battleMusicStop(260);
    if (this._triumph) {
      try { this._triumph.stop(); this._triumph.destroy(); } catch (err) { /* ignore */ }
    }
    this._triumph = this.scene.sound.add(TRIUMPH_LIGHT_KEY, {
      loop: true,
      volume: this._effectiveVolume('music', 0.92)
    });
    const fire = () => {
      if (!this._triumph || this._triumph.isPlaying) return;
      this._triumph.play();
    };
    const start = () => this.scene.time.delayedCall(180, fire);
    if (this.scene.sound.locked) this.scene.sound.once('unlocked', start);
    else start();
    return true;
  }

  uiMove() { this._play('uiMove'); }
  uiConfirm() { this._play('uiConfirm'); }
  uiReject() { this._play('uiReject'); }
  turnStart(characterId) { this._play(`turnStart:${characterId}`); }
  targetAcquire() { this._play('targetAcquire'); }
  attackGather(characterId) { this._play(`attackGather:${characterId}`); }
  attackRelease(characterId) { this._duckMusic(0.72, 200); this._play(`attackRelease:${characterId}`); }
  attackImpact(characterId) { this._duckMusic(0.48, 330); this._play(`attackImpact:${characterId}`); }
  guard(characterId) { this._play('guard'); }
  itemUse(itemId) { this._play('itemUse'); }
  enemyHit() { if (this.enemyDirector) this.enemyDirector.play('hurt'); }
  enemyDefeat() { if (this.enemyDirector) this.enemyDirector.play('defeat'); }
  victory() {
    // K-line production preloads Triumph. Older harnesses still fall back
    // to the established short victory cue instead of failing silently.
    if (!this.playTriumphOfLight()) this._play('victory');
  }
  battleExit() { this.battleMusicStop(); this._play('battleExit'); }

  destroy() {
    if (this._visHandler) { document.removeEventListener('visibilitychange', this._visHandler); this._visHandler = null; }
    if (this.music) { try { this.music.stop(); this.music.destroy(); } catch (err) { /* ignore */ } this.music = null; }
    if (this._auroraBloom) { try { this._auroraBloom.stop(); this._auroraBloom.destroy(); } catch (err) { /* ignore */ } this._auroraBloom = null; }
    if (this._triumph) { try { this._triumph.stop(); this._triumph.destroy(); } catch (err) { /* ignore */ } this._triumph = null; }
    Object.values(this.sounds).forEach(s => { try { s.stop(); s.destroy(); } catch (err) { /* ignore */ } });
    this.sounds = {};
    if (this.enemyDirector) { this.enemyDirector.destroy(); this.enemyDirector = null; }
  }
}
