// FAI-AUDIO-01 — battle-audio controller for PartyBattleScene.
//
// One centralized event layer (IMPLEMENT_NOW.md's own method names, used
// verbatim) rather than sound calls scattered through the HUD-building
// code. Every event is safe to call even when its asset never loaded —
// "missing assets must fail gracefully rather than crashing the battle"
// — so wiring this in never risks the battle itself.
//
// This is plumbing, not final sound design. Every asset it plays is
// explicitly tagged below as either LEGACY_REFERENCE_ONLY (DAI-supplied
// WAVs, proving the event wiring/timing/volume buses work) or
// DEV_PLACEHOLDER_ONLY (Veilbreak.mp3, reused from VeilBattleScene.js's
// own preload only to prove the music lifecycle — load/fade-in/loop/
// fade-out — not chosen as final BGM). Per DO_NOT_DO.md, this file does
// not compose or select final music/SFX.
import { AUDIO_EVENT_MAP, AUDIO_LAYER_MAP, MUSIC_ASSET } from './PartyBattleAudioConfig.js?v=2';
import EnemyAudioDirector, { preloadEnemyAudio } from './EnemyAudioDirector.js?v=42';

const PREFS_KEY = 'pv_party_battle_audio_prefs_v1';
const DEFAULT_PREFS = Object.freeze({ master: 0.9, music: 0.6, sfx: 0.85, ui: 0.7, muted: false });

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch (err) {
    // Private browsing / storage disabled — in-memory defaults, never a
    // crash. Nothing else in this project persists audio state (checked
    // directly: zero localStorage usage anywhere else in the repo), so
    // this is a new, self-contained preference set, not a second
    // competing settings system.
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
    this.sounds = {}; // event name -> Phaser Sound instance (SFX only)
    this.music = null;
    this._visHandler = null;
    this._unlockPending = false;
  }

  // --- asset loading ----------------------------------------------------
  preload() {
    Object.values(AUDIO_EVENT_MAP).forEach(def => {
      if (!def || !def.key || !def.path) return;
      this.scene.load.audio(def.key, def.path);
    });
    if (MUSIC_ASSET) this.scene.load.audio(MUSIC_ASSET.key, MUSIC_ASSET.path);
    // FAI-AUDIO-02 §4: "prefer sharing/reusing EnemyAudioDirector logic
    // rather than duplicating enemy-bank selection in Party Battle" —
    // reuses the exact same preload helper VeilBattleScene.js already
    // calls, not a re-implementation of its enemy/cue-key convention.
    preloadEnemyAudio(this.scene);
  }

  // --- lifecycle ----------------------------------------------------------
  // `scene.enemy` must already be assigned before this runs — PartyBattleScene
  // calls this after setting it, not before (see that file's create()).
  create() {
    this.enemyDirector = new EnemyAudioDirector(this.scene, this.scene.enemy);
    this.enemyDirector.create();

    // Background/resume must not stack a second BGM loop — pause on
    // hide, resume (never re-create) on show. Named + stored so a future
    // scene teardown can actually remove it; an inline arrow here would
    // leak one more listener on every create() the way CLAUDE.md's own
    // resize-listener trap describes.
    this._visHandler = () => {
      if (!this.music) return;
      if (document.hidden) { if (this.music.isPlaying) this.music.pause(); }
      else if (this.music.isPaused) this.music.resume();
    };
    document.addEventListener('visibilitychange', this._visHandler);
    this.scene.events.once('shutdown', () => this.destroy());
  }

  // Whether a mobile-unlock gate is needed right now — PartyBattleScene
  // uses this to decide whether to show an explicit "Tap to Enable Audio"
  // overlay (MOBILE_AUDIO_UNLOCK.md's required treatment for a direct dev
  // route with no prior title-screen gesture) rather than letting unlock
  // happen invisibly on whatever the player happens to tap first.
  isLocked() { return this.scene.sound.locked; }
  onUnlocked(cb) { this.scene.sound.once('unlocked', cb); }

  // --- volume buses --------------------------------------------------------
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
  }

  isMuted() { return !!this.prefs.muted; }

  _effectiveVolume(bus, base = 1) {
    if (this.prefs.muted) return 0;
    const busVol = this.prefs[bus] != null ? this.prefs[bus] : 1;
    return Phaser.Math.Clamp(this.prefs.master * busVol * base, 0, 1);
  }

  _applyMusicVolume() {
    if (this.music) this.music.setVolume(this._effectiveVolume('music'));
  }

  // --- SFX playback (shared by every UI/character event below) -----------
  // Graceful-missing-asset: `cache.audio.exists` check first, so an event
  // fired before its asset loads (or one with no asset mapped at all,
  // like the currently-unmapped enemyDefeat — see PartyBattleAudioConfig.js's
  // own header) is a silent no-op, never a thrown error.
  // Character-suffixed events (e.g. "attackImpact:kineza") fall back to
  // the base event ("attackImpact") when no per-character asset exists
  // yet — CHARACTER_AUDIO_DIRECTION.md locks distinct sonic identities
  // per hero, but none of the supplied legacy WAVs are per-character, so
  // every hero shares one generic cue today rather than three identical
  // ones pretending to be differentiated. Swapping in real per-character
  // assets later only means adding entries to PartyBattleAudioConfig.js —
  // this lookup already prefers the specific key over the generic one.
  _play(eventName) {
    const def = AUDIO_EVENT_MAP[eventName] || AUDIO_EVENT_MAP[eventName.split(':')[0]];
    if (!def || !def.key) return; // no asset mapped for this event yet
    if (!this.scene.cache.audio.exists(def.key)) return;
    const fire = () => {
      const sound = this.scene.sound.add(def.key, { volume: this._effectiveVolume(def.bus) });
      sound.play();
      sound.once('complete', () => sound.destroy());
    };
    if (this.scene.sound.locked) this.scene.sound.once('unlocked', fire);
    else fire();

    // FAI-BATTLE-PRESENTATION-03 (DYNAMIC_AUDIO_DIRECTION.md): a second,
    // already-owned cue layered underneath the primary one — runtime
    // layering, never a new file. Only exact `heroEvent:heroId` keys carry
    // a layer entry (never the bare event name), so uiConfirm/uiReject/
    // victory etc. are untouched.
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

  // --- IMPLEMENT_NOW.md's event vocabulary, used verbatim -----------------
  battleEnter() { this._play('battleEnter'); }

  battleMusicStart() {
    if (!MUSIC_ASSET || !this.scene.cache.audio.exists(MUSIC_ASSET.key)) return;
    if (this.music && this.music.isPlaying) return; // idempotent — no duplicate loops
    if (!this.music) {
      this.music = this.scene.sound.add(MUSIC_ASSET.key, { loop: true, volume: 0 });
    }
    const start = () => {
      if (this.music.isPlaying) return;
      this.music.play();
      this.scene.tweens.add({
        targets: this.music, volume: this._effectiveVolume('music'),
        duration: 900, ease: 'Sine.easeIn'
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

  uiMove() { this._play('uiMove'); }
  uiConfirm() { this._play('uiConfirm'); }
  uiReject() { this._play('uiReject'); }
  // Uses each hero's own "step" cue — a real per-character turn-start
  // beat rather than one shared sting, matching CHARACTER_AUDIO_DIRECTION.md's
  // spirit even for a moment that isn't technically an "attack."
  turnStart(characterId) { this._play(`turnStart:${characterId}`); }
  targetAcquire() { this._play('targetAcquire'); }
  attackGather(characterId) { this._play(`attackGather:${characterId}`); }
  attackRelease(characterId) { this._play(`attackRelease:${characterId}`); }
  attackImpact(characterId) { this._play(`attackImpact:${characterId}`); }
  // No dedicated Guard/Item SFX exist anywhere in this repo — see
  // PartyBattleAudioConfig.js's own header for why these stay silent
  // rather than borrowing a hero's attack cue or a legacy bleep.
  guard(characterId) { this._play('guard'); }
  itemUse(itemId) { this._play('itemUse'); }
  // Routed through EnemyAudioDirector (constructed in create()) instead
  // of AUDIO_EVENT_MAP — reuses its bank-resolution/volume tuning rather
  // than re-implementing "which enemy, which cue, what volume" here.
  enemyHit() { if (this.enemyDirector) this.enemyDirector.play('hurt'); }
  enemyDefeat() { if (this.enemyDirector) this.enemyDirector.play('defeat'); }
  victory() { this._play('victory'); }
  battleExit() { this.battleMusicStop(); this._play('battleExit'); }

  // --- teardown ------------------------------------------------------------
  destroy() {
    if (this._visHandler) { document.removeEventListener('visibilitychange', this._visHandler); this._visHandler = null; }
    if (this.music) { try { this.music.stop(); this.music.destroy(); } catch (err) { /* ignore */ } this.music = null; }
    Object.values(this.sounds).forEach(s => { try { s.stop(); s.destroy(); } catch (err) { /* ignore */ } });
    this.sounds = {};
    if (this.enemyDirector) { this.enemyDirector.destroy(); this.enemyDirector = null; }
  }
}
