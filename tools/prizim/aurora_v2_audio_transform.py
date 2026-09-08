from pathlib import Path

p = Path('src/PartyBattleAudioController.js')
s = p.read_text()

def once(old, new, label):
    global s
    assert old in s, f'missing audio transform anchor: {label}'
    s = s.replace(old, new, 1)

once("const AURORA_BLOOM_PATH = './assets/music/Celestial Bloom.m4a?pvasset=live28k18-native';",
     "const AURORA_BLOOM_PATH = './assets/music/Celestial Bloom.m4a?pvasset=live28k18-native';\nconst AURORA_V2_SFX_PATH = './assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v2_KingAI_AUDIO.m4a?pvasset=live28k23-aurora-v2';",
     'V2 SFX constant')
once("    this._auroraBloom = null;\n    this._triumph = null;",
     "    this._auroraBloom = null;\n    this._auroraV2Sfx = null;\n    this._triumph = null;",
     'constructor native media')
once("    this._nativeResume = { bloom: false, triumph: false };",
     "    this._nativeResume = { bloom: false, v2sfx: false, triumph: false };",
     'native resume state')
once("    this._cinematicActive = false;",
     "    this._cinematicActive = false;\n    this._cinematicBgmSilenced = false;",
     'cinematic silence state')
once("    this._auroraBloom = makeNativeAudio(AURORA_BLOOM_PATH, false);\n    this._triumph = makeNativeAudio(TRIUMPH_LIGHT_PATH, true);\n    try { this._auroraBloom.load(); this._triumph.load(); } catch (err) { /* native preload is best-effort */ }",
     "    this._auroraBloom = makeNativeAudio(AURORA_BLOOM_PATH, false);\n    this._auroraV2Sfx = makeNativeAudio(AURORA_V2_SFX_PATH, false);\n    this._triumph = makeNativeAudio(TRIUMPH_LIGHT_PATH, true);\n    try { this._auroraBloom.load(); this._auroraV2Sfx.load(); this._triumph.load(); } catch (err) { /* native preload is best-effort */ }",
     'native media create')
once("        this._nativeResume.bloom = !!(this._auroraBloom && !this._auroraBloom.paused && !this._auroraBloom.ended);\n        this._nativeResume.triumph = !!(this._triumph && !this._triumph.paused && !this._triumph.ended);\n        if (this._nativeResume.bloom) this._auroraBloom.pause();\n        if (this._nativeResume.triumph) this._triumph.pause();",
     "        this._nativeResume.bloom = !!(this._auroraBloom && !this._auroraBloom.paused && !this._auroraBloom.ended);\n        this._nativeResume.v2sfx = !!(this._auroraV2Sfx && !this._auroraV2Sfx.paused && !this._auroraV2Sfx.ended);\n        this._nativeResume.triumph = !!(this._triumph && !this._triumph.paused && !this._triumph.ended);\n        if (this._nativeResume.bloom) this._auroraBloom.pause();\n        if (this._nativeResume.v2sfx) this._auroraV2Sfx.pause();\n        if (this._nativeResume.triumph) this._triumph.pause();",
     'visibility pause')
once("        if (this._nativeResume.bloom) this._auroraBloom?.play?.().catch?.(() => {});\n        if (this._nativeResume.triumph) this._triumph?.play?.().catch?.(() => {});\n        this._nativeResume.bloom = false;\n        this._nativeResume.triumph = false;",
     "        if (this._nativeResume.bloom) this._auroraBloom?.play?.().catch?.(() => {});\n        if (this._nativeResume.v2sfx) this._auroraV2Sfx?.play?.().catch?.(() => {});\n        if (this._nativeResume.triumph) this._triumph?.play?.().catch?.(() => {});\n        this._nativeResume.bloom = false;\n        this._nativeResume.v2sfx = false;\n        this._nativeResume.triumph = false;",
     'visibility resume')
once("    if (this._auroraBloom && !this._auroraBloom.paused) this._auroraBloom.volume = this._effectiveVolume('sfx', 1.0);\n    if (this._triumph && !this._triumph.paused) this._triumph.volume = this._effectiveVolume('music', 0.92);",
     "    if (this._auroraBloom && !this._auroraBloom.paused) this._auroraBloom.volume = this._effectiveVolume('sfx', 1.0);\n    if (this._auroraV2Sfx && !this._auroraV2Sfx.paused) this._auroraV2Sfx.volume = this._effectiveVolume('sfx', 1.0);\n    if (this._triumph && !this._triumph.paused) this._triumph.volume = this._effectiveVolume('music', 0.92);",
     'mute propagation')
once("  _musicTargetVolume() {\n    return this._effectiveVolume('music') * (this._cinematicActive ? CINEMATIC_MUSIC_MULT : 1);\n  }",
     "  _musicTargetVolume() {\n    if (this._cinematicBgmSilenced) return 0;\n    return this._effectiveVolume('music') * (this._cinematicActive ? CINEMATIC_MUSIC_MULT : 1);\n  }",
     'music target silence')

marker = "  beginCinematicAttack() {"
assert marker in s, 'missing beginCinematicAttack marker'
methods = """  beginAuroraVideoMix() {
    this._cinematicActive = true;
    this._cinematicBgmSilenced = true;
    if (!this.music || !this.music.isPlaying) return;
    this._duckToken = (this._duckToken || 0) + 1;
    this.scene.tweens.killTweensOf(this.music);
    this.scene.tweens.add({ targets: this.music, volume: 0, duration: 110, ease: 'Sine.easeOut' });
  }

  endAuroraVideoMix() {
    this._cinematicBgmSilenced = false;
    this._cinematicActive = false;
    if (!this.music || !this.music.isPlaying) return;
    this._duckToken = (this._duckToken || 0) + 1;
    this.scene.tweens.killTweensOf(this.music);
    this.scene.tweens.add({ targets: this.music, volume: this._musicTargetVolume(), duration: 320, ease: 'Sine.easeIn' });
  }

  auroraV2SfxPrime() {
    const sound = this._auroraV2Sfx;
    if (!sound) return false;
    resetNativeAudio(sound);
    sound.loop = false;
    sound.volume = 0;
    try {
      const pending = sound.play();
      pending?.catch?.(err => console.warn('[PV] Aurora V2 SFX native prime blocked:', err));
    } catch (err) {
      console.warn('[PV] Aurora V2 SFX native prime failed:', err);
      return false;
    }
    return true;
  }

  auroraV2SfxReveal() {
    const sound = this._auroraV2Sfx;
    if (!sound) return false;
    try { sound.currentTime = 0; } catch (err) { /* metadata may still be settling */ }
    sound.volume = this._effectiveVolume('sfx', 1.0);
    try {
      const pending = sound.play();
      pending?.catch?.(err => console.warn('[PV] Aurora V2 SFX native reveal blocked:', err));
    } catch (err) {
      console.warn('[PV] Aurora V2 SFX native reveal failed:', err);
      return false;
    }
    return true;
  }

  auroraV2SfxStop(fadeMs = 120) {
    const sound = this._auroraV2Sfx;
    if (!sound) return;
    if (sound.paused || sound.ended) {
      resetNativeAudio(sound);
      sound.volume = this._effectiveVolume('sfx', 1.0);
      return;
    }
    this.scene.tweens.killTweensOf(sound);
    this.scene.tweens.add({
      targets: sound, volume: 0, duration: fadeMs, ease: 'Sine.easeOut',
      onComplete: () => { resetNativeAudio(sound); sound.volume = this._effectiveVolume('sfx', 1.0); }
    });
  }

  auroraBloomTailPrime() {
    const sound = this._auroraBloom;
    if (!sound) return false;
    resetNativeAudio(sound);
    sound.loop = true;
    sound.volume = 0;
    try {
      const pending = sound.play();
      pending?.catch?.(err => console.warn('[PV] Celestial Bloom tail prime blocked:', err));
    } catch (err) {
      console.warn('[PV] Celestial Bloom tail prime failed:', err);
      return false;
    }
    return true;
  }

  auroraBloomTailReveal(sourceSeconds = 3.86) {
    const sound = this._auroraBloom;
    if (!sound) return false;
    sound.loop = false;
    try { sound.currentTime = Math.max(0, Number(sourceSeconds) || 0); } catch (err) { /* metadata may still be settling */ }
    sound.volume = this._effectiveVolume('sfx', 1.0);
    try {
      const pending = sound.play();
      pending?.catch?.(err => console.warn('[PV] Celestial Bloom choir-tail reveal blocked:', err));
    } catch (err) {
      console.warn('[PV] Celestial Bloom choir-tail reveal failed:', err);
      return false;
    }
    return true;
  }

"""
s = s.replace(marker, methods + marker, 1)
once("    prime(this._auroraBloom);\n    prime(this._triumph);",
     "    prime(this._auroraBloom);\n    prime(this._auroraV2Sfx);\n    prime(this._triumph);",
     'prime native V2')
once("    if (this._auroraBloom) { try { this._auroraBloom.pause(); this._auroraBloom.removeAttribute('src'); this._auroraBloom.load(); } catch (err) { /* ignore */ } this._auroraBloom = null; }\n    if (this._triumph)",
     "    if (this._auroraBloom) { try { this._auroraBloom.pause(); this._auroraBloom.removeAttribute('src'); this._auroraBloom.load(); } catch (err) { /* ignore */ } this._auroraBloom = null; }\n    if (this._auroraV2Sfx) { try { this._auroraV2Sfx.pause(); this._auroraV2Sfx.removeAttribute('src'); this._auroraV2Sfx.load(); } catch (err) { /* ignore */ } this._auroraV2Sfx = null; }\n    if (this._triumph)",
     'destroy V2 native')
p.write_text(s)
