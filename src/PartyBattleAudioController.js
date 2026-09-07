// Party Battle audio controller.
// Centralized event/mix layer: missing assets fail silently, hero cues remain
// character-specific, and cinematic attacks can shape the music without
// changing the user's persistent volume preferences.
import { AUDIO_EVENT_MAP, AUDIO_LAYER_MAP, MUSIC_ASSET } from './PartyBattleAudioConfig.js?v=4';
import EnemyAudioDirector, { preloadEnemyAudio } from './EnemyAudioDirector.js?v=42';

const PREFS_KEY = 'pv_party_battle_audio_prefs_v1';
const DEFAULT_PREFS = Object.freeze({ master: 0.9, music: 0.6, sfx: 0.95, ui: 0.72, muted: false });
const SFX_MIX_GAIN = 1.05;
const AURORA_BLOOM_PATH = './assets/music/Celestial Bloom.m4a?pvasset=live28k18-native';
const TRIUMPH_LIGHT_PATH = './assets/music/Triumph of Light.m4a?pvasset=live28k18-native';
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

function makeNativeAudio(path, loop = false) {
  const audio = new Audio(new URL(path, window.location.href).href);
  audio.preload = 'auto';
  audio.loop = !!loop;
  audio.playsInline = true;
  return audio;
}

function resetNativeAudio(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (err) { /* ignore */ }
}

export default class PartyBattleAudioController {
  constructor(scene) {
    this.scene = scene;
    this.prefs = loadPrefs();
    this.sounds = {};
    this.music = null;
    this._auroraBloom = null;
    this._triumph = null;
    this._auroraBloomStartTimer = null;
    this._nativeResume = { bloom: false, triumph: false };
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
    this._auroraBloom = makeNativeAudio(AURORA_BLOOM_PATH, false);
    this._triumph = makeNativeAudio(TRIUMPH_LIGHT_PATH, true);
    try { this._auroraBloom.load(); this._triumph.load(); } catch (err) { /* native preload is best-effort */ }
    this._visHandler = () => {
      if (document.hidden) {
        if (this.music?.isPlaying) this.music.pause();
        this._nativeResume.bloom = !!(this._auroraBloom && !this._auroraBloom.paused && !this._auroraBloom.ended);
        this._nativeResume.triumph = !!(this._triumph && !this._triumph.paused && !this._triumph.ended);
        if (this._nativeResume.bloom) this._auroraBloom.pause();
        if (this._nativeResume.triumph) this._triumph.pause();
      } else {
        if (this.music?.isPaused) this.music.resume();
        if (this._nativeResume.bloom) this._auroraBloom?.play?.().catch?.(() => {});
        if (this._nativeResume.triumph) this._triumph?.play?.().catch?.(() => {});
        this._nativeResume.bloom = false;
        this._nativeResume.triumph = false;
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
    if (this._auroraBloom && !this._auroraBloom.paused) this._auroraBloom.volume = this._effectiveVolume('sfx', 1.0);
    if (this._triumph && !this._triumph.paused) this._triumph.volume = this._effectiveVolume('music', 0.92);
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

  // Aurora Pulse and Triumph keep their exact M4A source bytes, but iPhone
  // Safari receives them through native HTMLMediaElement rather than Phaser's
  // WebAudio decodeAudioData path. This removes non-fatal M4A decode failures
  // from battle boot while preserving the exact production masters.
  primeNativeMedia() {
    const prime = sound => {
      if (!sound) return;
      const targetVolume = sound.volume;
      resetNativeAudio(sound);
      sound.volume = 0;
      try {
        const pending = sound.play();
        if (pending?.then) {
          pending.then(() => {
            resetNativeAudio(sound);
            sound.volume = targetVolume;
          }).catch(() => { sound.volume = targetVolume; });
        } else {
          resetNativeAudio(sound);
          sound.volume = targetVolume;
        }
      } catch (err) {
        sound.volume = targetVolume;
      }
    };
    prime(this._auroraBloom);
    prime(this._triumph);
  }

  auroraBloomStart(delaySeconds = 0) {
    const sound = this._auroraBloom;
    if (!sound) return false;
    if (this._auroraBloomStartTimer) {
      try { this._auroraBloomStartTimer.remove(false); } catch (err) { /* ignore */ }
      this._auroraBloomStartTimer = null;
    }
    if (this.music?.isPlaying) {
      this.scene.tweens.killTweensOf(this.music);
      this.scene.tweens.add({ targets: this.music, volume: 0, duration: 100, ease: 'Sine.easeOut' });
    }

    resetNativeAudio(sound);
    sound.loop = false;
    sound.volume = 0;
    // Start a silent native-media preroll immediately while still inside the
    // Resonart user gesture. At Invocation we seek back to 0 and raise volume.
    // Safari therefore never has to grant a brand-new delayed play request.
    try {
      const pending = sound.play();
      pending?.catch?.(err => console.warn('[PV] Celestial Bloom native preroll blocked:', err));
    } catch (err) {
      console.warn('[PV] Celestial Bloom native preroll failed:', err);
    }

    const reveal = () => {
      if (this._auroraBloom !== sound) return;
      try { sound.currentTime = 0; } catch (err) { /* metadata may still be settling */ }
      sound.volume = this._effectiveVolume('sfx', 1.0);
      try {
        const pending = sound.play();
        pending?.catch?.(err => console.warn('[PV] Celestial Bloom native start blocked:', err));
      } catch (err) {
        console.warn('[PV] Celestial Bloom native start failed:', err);
      }
    };
    const delayMs = Math.max(0, Number(delaySeconds) || 0) * 1000;
    if (delayMs > 0) this._auroraBloomStartTimer = this.scene.time.delayedCall(delayMs, reveal);
    else reveal();
    return true;
  }

  auroraBloomIsPlaying() {
    const sound = this._auroraBloom;
    return !!(sound && !sound.paused && !sound.ended && sound.readyState >= 2 && sound.volume > 0);
  }

  auroraBloomEnsurePlaying() {
    const sound = this._auroraBloom;
    if (!sound) return false;
    if (this.auroraBloomIsPlaying()) return true;
    try { sound.currentTime = 0; } catch (err) { /* ignore */ }
    sound.volume = this._effectiveVolume('sfx', 1.0);
    try {
      const pending = sound.play();
      pending?.catch?.(err => console.warn('[PV] Celestial Bloom native watchdog restart blocked:', err));
    } catch (err) {
      console.warn('[PV] Celestial Bloom native watchdog restart failed:', err);
      return false;
    }
    return !sound.paused;
  }

  auroraBloomSilence() {
    if (this._auroraBloom && !this._auroraBloom.paused) this._auroraBloom.pause();
  }

  auroraBloomResume() {
    const sound = this._auroraBloom;
    if (!sound || !sound.paused || sound.ended) return;
    sound.play()?.catch?.(err => console.warn('[PV] Celestial Bloom native resume blocked:', err));
  }

  auroraBloomStop(fadeMs = 360) {
    const sound = this._auroraBloom;
    if (!sound) return;
    if (this._auroraBloomStartTimer) {
      try { this._auroraBloomStartTimer.remove(false); } catch (err) { /* ignore */ }
      this._auroraBloomStartTimer = null;
    }
    if (sound.paused || sound.ended) {
      resetNativeAudio(sound);
      sound.volume = this._effectiveVolume('sfx', 1.0);
      return;
    }
    this.scene.tweens.killTweensOf(sound);
    this.scene.tweens.add({
      targets: sound,
      volume: 0,
      duration: fadeMs,
      ease: 'Sine.easeOut',
      onComplete: () => {
        resetNativeAudio(sound);
        sound.volume = this._effectiveVolume('sfx', 1.0);
      }
    });
  }

  playTriumphOfLight() {
    const sound = this._triumph;
    if (!sound) return false;
    this.battleMusicStop(260);
    resetNativeAudio(sound);
    sound.loop = true;
    sound.volume = this._effectiveVolume('music', 0.92);
    const fire = () => {
      if (!sound.paused && !sound.ended) return;
      try {
        const pending = sound.play();
        pending?.catch?.(err => console.warn('[PV] Triumph of Light native play blocked:', err));
      } catch (err) {
        console.warn('[PV] Triumph of Light native play failed:', err);
      }
    };
    this.scene.time.delayedCall(180, fire);
    return true;
  }

  auroraReentryWave() {
    // K20 battlefield-return wave: layer Auryi's existing production bank
    // at lower rates for a broad energy front, then give it a body transient.
    // Celestial Bloom itself remains the untouched exact native M4A master.
    this._duckMusic(0.34, 460);
    this._playLayer({ key: 'pb_hero_auryi_release', volumeMul: 0.92, rate: 0.72 }, 'sfx');
    this._playLayer({ key: 'pb_hero_auryi_idlePulse', volumeMul: 0.56, rate: 0.62, delayMs: 28 }, 'sfx');
    this._playLayer({ key: 'pb_hero_auryi_impact', volumeMul: 0.88, rate: 0.82, delayMs: 72 }, 'sfx');
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
    if (this._auroraBloomStartTimer) { try { this._auroraBloomStartTimer.remove(false); } catch (err) { /* ignore */ } this._auroraBloomStartTimer = null; }
    if (this._auroraBloom) { try { this._auroraBloom.pause(); this._auroraBloom.removeAttribute('src'); this._auroraBloom.load(); } catch (err) { /* ignore */ } this._auroraBloom = null; }
    if (this._triumph) { try { this._triumph.pause(); this._triumph.removeAttribute('src'); this._triumph.load(); } catch (err) { /* ignore */ } this._triumph = null; }
    Object.values(this.sounds).forEach(s => { try { s.stop(); s.destroy(); } catch (err) { /* ignore */ } });
    this.sounds = {};
    if (this.enemyDirector) { this.enemyDirector.destroy(); this.enemyDirector = null; }
  }
}
