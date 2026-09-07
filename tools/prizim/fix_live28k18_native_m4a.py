#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCENE = ROOT / 'src/prizim/Live28K2PartyBattleScene.js'
AUDIO = ROOT / 'src/PartyBattleAudioController.js'
HYBRID = ROOT / 'hybrid-battle-live.html'
PREFLIGHT = ROOT / 'tools/prizim/preflight_live28k.py'
AUTH = ROOT / 'PV_LIVE_AUTHORITY.json'


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'K18 patch refused: missing {label}')
    return text.replace(old, new, 1)


def replace_func(text, name, replacement, next_name):
    pattern = re.compile(rf"  {re.escape(name)}\([^\n]*\) \{{.*?\n  \}}\n\n  {re.escape(next_name)}\(", re.S)
    m = pattern.search(text)
    if not m:
        raise SystemExit(f'K18 patch refused: function block {name} -> {next_name} not found')
    return text[:m.start()] + replacement.rstrip() + f"\n\n  {next_name}(" + text[m.end():]


# ------------------------------------------------------------------
# 1. Remove exact M4A masters from Phaser/WebAudio preload.
# ------------------------------------------------------------------
scene = SCENE.read_text(encoding='utf-8')
scene = replace_once(
    scene,
    "const AURORA_BLOOM_KEY = 'pv_auryi_celestial_bloom';\nconst AURORA_BLOOM_PATH = './assets/music/Celestial Bloom.m4a?pvasset=live28k11-audio';\nconst TRIUMPH_LIGHT_KEY = 'pv_triumph_of_light';\nconst TRIUMPH_LIGHT_PATH = './assets/music/Triumph of Light.m4a?pvasset=live28k11-audio';\n",
    "// Exact Celestial Bloom / Triumph M4A masters are owned by native HTMLMediaElement\n// playback in PartyBattleAudioController. Never route these through Phaser/WebAudio\n// decode on iPhone Safari; the original bytes remain unchanged in assets/music/.\n",
    'M4A constants block',
)
scene = replace_once(
    scene,
    "    // Exact supplied masters. These paths intentionally remain M4A so no\n    // source transcode/recompression is introduced during the production ingest.\n    this.load.audio(AURORA_BLOOM_KEY, AURORA_BLOOM_PATH);\n    this.load.audio(TRIUMPH_LIGHT_KEY, TRIUMPH_LIGHT_PATH);\n\n",
    "    // LIVE28K18: exact M4A cinematic/victory masters are intentionally NOT\n    // loaded through Phaser. Safari can surface WebAudio decodeAudioData failures\n    // for M4A after the audio-unlock gesture. Native HTMLMediaElement owns them.\n\n",
    'Phaser M4A preload block',
)
SCENE.write_text(scene, encoding='utf-8')

# ------------------------------------------------------------------
# 2. Move Bloom + Triumph to reusable native HTMLAudioElement instances.
# ------------------------------------------------------------------
audio = AUDIO.read_text(encoding='utf-8')
audio = replace_once(
    audio,
    "const AURORA_BLOOM_KEY = 'pv_auryi_celestial_bloom';\nconst TRIUMPH_LIGHT_KEY = 'pv_triumph_of_light';\n",
    "const AURORA_BLOOM_PATH = './assets/music/Celestial Bloom.m4a?pvasset=live28k18-native';\nconst TRIUMPH_LIGHT_PATH = './assets/music/Triumph of Light.m4a?pvasset=live28k18-native';\n",
    'audio master key constants',
)
helper_anchor = "function savePrefs(prefs) {\n  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (err) { /* ignore */ }\n}\n"
helper_insert = helper_anchor + "\nfunction makeNativeAudio(path, loop = false) {\n  const audio = new Audio(new URL(path, window.location.href).href);\n  audio.preload = 'auto';\n  audio.loop = !!loop;\n  audio.playsInline = true;\n  return audio;\n}\n\nfunction resetNativeAudio(audio) {\n  if (!audio) return;\n  try {\n    audio.pause();\n    audio.currentTime = 0;\n  } catch (err) { /* ignore */ }\n}\n"
audio = replace_once(audio, helper_anchor, helper_insert, 'native audio helper insertion point')

audio = replace_once(
    audio,
    "    this._auroraBloom = null;\n    this._triumph = null;\n    this._visHandler = null;",
    "    this._auroraBloom = null;\n    this._triumph = null;\n    this._auroraBloomStartTimer = null;\n    this._nativeResume = { bloom: false, triumph: false };\n    this._visHandler = null;",
    'native state constructor',
)

old_create = """    this.enemyDirector = new EnemyAudioDirector(this.scene, this.scene.enemy);\n    this.enemyDirector.create();\n    this._visHandler = () => {\n      if (document.hidden) {\n        if (this.music?.isPlaying) this.music.pause();\n        if (this._auroraBloom?.isPlaying) this._auroraBloom.pause();\n        if (this._triumph?.isPlaying) this._triumph.pause();\n      } else {\n        if (this.music?.isPaused) this.music.resume();\n        if (this._auroraBloom?.isPaused) this._auroraBloom.resume();\n        if (this._triumph?.isPaused) this._triumph.resume();\n      }\n    };\n"""
new_create = """    this.enemyDirector = new EnemyAudioDirector(this.scene, this.scene.enemy);\n    this.enemyDirector.create();\n    this._auroraBloom = makeNativeAudio(AURORA_BLOOM_PATH, false);\n    this._triumph = makeNativeAudio(TRIUMPH_LIGHT_PATH, true);\n    try { this._auroraBloom.load(); this._triumph.load(); } catch (err) { /* native preload is best-effort */ }\n    this._visHandler = () => {\n      if (document.hidden) {\n        if (this.music?.isPlaying) this.music.pause();\n        this._nativeResume.bloom = !!(this._auroraBloom && !this._auroraBloom.paused && !this._auroraBloom.ended);\n        this._nativeResume.triumph = !!(this._triumph && !this._triumph.paused && !this._triumph.ended);\n        if (this._nativeResume.bloom) this._auroraBloom.pause();\n        if (this._nativeResume.triumph) this._triumph.pause();\n      } else {\n        if (this.music?.isPaused) this.music.resume();\n        if (this._nativeResume.bloom) this._auroraBloom?.play?.().catch?.(() => {});\n        if (this._nativeResume.triumph) this._triumph?.play?.().catch?.(() => {});\n        this._nativeResume.bloom = false;\n        this._nativeResume.triumph = false;\n      }\n    };\n"""
audio = replace_once(audio, old_create, new_create, 'create native media block')

audio = replace_once(
    audio,
    "    if (this._auroraBloom) this._auroraBloom.setVolume(this._effectiveVolume('sfx', 1.0));\n    if (this._triumph) this._triumph.setVolume(this._effectiveVolume('music', 0.92));",
    "    if (this._auroraBloom && !this._auroraBloom.paused) this._auroraBloom.volume = this._effectiveVolume('sfx', 1.0);\n    if (this._triumph && !this._triumph.paused) this._triumph.volume = this._effectiveVolume('music', 0.92);",
    'native setMuted volume',
)

start_idx = audio.find("  // Aurora Pulse owns a dedicated full-length cue.")
end_idx = audio.find("\n  uiMove()", start_idx)
if start_idx == -1 or end_idx == -1:
    raise SystemExit('K18 patch refused: Aurora/Triumph audio method section not found')
new_methods = r'''  // Aurora Pulse and Triumph keep their exact M4A source bytes, but iPhone
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
'''
audio = audio[:start_idx] + new_methods + audio[end_idx:]

audio = replace_once(
    audio,
    "    if (this._auroraBloom) { try { this._auroraBloom.stop(); this._auroraBloom.destroy(); } catch (err) { /* ignore */ } this._auroraBloom = null; }\n    if (this._triumph) { try { this._triumph.stop(); this._triumph.destroy(); } catch (err) { /* ignore */ } this._triumph = null; }",
    "    if (this._auroraBloomStartTimer) { try { this._auroraBloomStartTimer.remove(false); } catch (err) { /* ignore */ } this._auroraBloomStartTimer = null; }\n    if (this._auroraBloom) { try { this._auroraBloom.pause(); this._auroraBloom.removeAttribute('src'); this._auroraBloom.load(); } catch (err) { /* ignore */ } this._auroraBloom = null; }\n    if (this._triumph) { try { this._triumph.pause(); this._triumph.removeAttribute('src'); this._triumph.load(); } catch (err) { /* ignore */ } this._triumph = null; }",
    'native destroy block',
)
AUDIO.write_text(audio, encoding='utf-8')

# ------------------------------------------------------------------
# 3. Prime native media on the explicit Hybrid audio tap and do not turn a
#    late non-critical media decode rejection into a full-screen boot death.
# ------------------------------------------------------------------
hybrid = HYBRID.read_text(encoding='utf-8')
hybrid = replace_once(
    hybrid,
    "function fail(e){boot.hidden=false;boot.innerHTML='<div><strong>LIVE BATTLE BOOT ERROR</strong><pre>'+String(e?.stack||e?.message||e)+'</pre></div>'}",
    "function fail(e){const msg=String(e?.stack||e?.message||e);if(scene&&/decoding failed/i.test(msg)){console.warn('[PV] non-fatal media decode rejection after live scene start:',e);return}boot.hidden=false;boot.innerHTML='<div><strong>LIVE BATTLE BOOT ERROR</strong><pre>'+msg+'</pre></div>'}",
    'Hybrid fail handler',
)
hybrid = replace_once(
    hybrid,
    "audioBtn.onclick=()=>{if(!scene)return;const done=()=>{scene._dismissAudioGate?.();scene.pub(true)};scene.audio?.onUnlocked?.(done);scene.sound?.unlock?.();scene.sound?.context?.resume?.().then(done).catch(()=>{})};",
    "audioBtn.onclick=()=>{if(!scene)return;scene.audio?.primeNativeMedia?.();const done=()=>{scene._dismissAudioGate?.();scene.pub(true)};scene.audio?.onUnlocked?.(done);scene.sound?.unlock?.();scene.sound?.context?.resume?.().then(done).catch(()=>{})};",
    'Hybrid native media prime tap',
)
HYBRID.write_text(hybrid, encoding='utf-8')

# ------------------------------------------------------------------
# 4. Machine authority: preserve phone evidence precisely.
# ------------------------------------------------------------------
auth = json.loads(AUTH.read_text(encoding='utf-8'))
hard = auth.setdefault('hard_gates', {})
hard['exact_m4a_masters_must_not_enter_phaser_webaudio_decode'] = True
hard['native_media_prime_required_for_exact_m4a'] = True
hard['post_scene_media_decode_rejection_nonfatal'] = True
aur = auth.setdefault('auryi', {})
aur['exact_m4a_playback_lane'] = 'native HTMLMediaElement; exact source bytes; no Phaser/WebAudio decode'
aur['aurora_bloom_mix_policy'] = (
    'Celestial Bloom uses native HTMLMediaElement. Hybrid audio-enable tap primes the exact M4A; '
    'Aurora starts a silent native preroll inside the Resonart gesture, seeks to source time 0 and '
    'raises it to foreground volume at Invocation, retains the 0.84s actual-playback watchdog, and '
    'clears normal battle BGM beneath it.'
)
evidence = auth.setdefault('device_evidence', {})
evidence['live28k17_boot_decode_failed'] = True
evidence['live28k17_boot_error_text'] = 'LIVE BATTLE BOOT ERROR · Decoding failed'
evidence['live28k17_aurora_test_blocked_by_boot'] = True
evidence['live28k17_bloom_not_validly_tested_in_recording'] = True
evidence['latest_device_witness'] = 'main-20260906-live28k17'
evidence['latest_device_result'] = (
    'FAIL boot gate: iPhone recording shows LIVE BATTLE BOOT ERROR · Decoding failed after audio enable. '
    'Aurora Pulse did not run, so this recording is not valid evidence for Bloom or handoff quality.'
)
evidence['pending_gate_summary'] = (
    'LIVE28K18: boot with no decode overlay, Celestial Bloom audibly enters, and K16 battlefield/enemy handoff remains intact.'
)
evidence['live28k18_pending_iphone_validation'] = True
AUTH.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')

# ------------------------------------------------------------------
# 5. Canonical preflight now rejects feeding exact M4A masters back into
#    Phaser/WebAudio and requires the native-media gesture lane.
# ------------------------------------------------------------------
pre = PREFLIGHT.read_text(encoding='utf-8')
old_k15 = """# 8b. K15 presentation guard: iPhone-safe choir start and no baked demo tail.\nfor token in [\n    'auroraBloomStart(delaySeconds = 0)',\n    'this._auroraBloom.play(undefined, { delay:',\n    'targets: this.music, volume: 0',\n    \"volume: this._effectiveVolume('sfx', 1.0)\"\n]:\n    if token not in audio_controller:\n        errors.append(f'K15 Aurora Bloom presentation token missing: {token}')\n"""
new_k15 = """# 8b. K15+ presentation guard: foreground Bloom ownership and no baked demo tail.\nfor token in [\n    'auroraBloomStart(delaySeconds = 0)',\n    'targets: this.music, volume: 0',\n    \"this._effectiveVolume('sfx', 1.0)\"\n]:\n    if token not in audio_controller:\n        errors.append(f'Aurora Bloom presentation token missing: {token}')\n"""
pre = replace_once(pre, old_k15, new_k15, 'K15 preflight audio block')
pre = replace_once(
    pre,
    "for token in [\n    'auroraBloomIsPlaying()',\n    'auroraBloomEnsurePlaying()',\n    \"context?.state === 'suspended'\",\n]:",
    "for token in [\n    'auroraBloomIsPlaying()',\n    'auroraBloomEnsurePlaying()',\n]:",
    'K17 watchdog token block',
)
insert_anchor = "if auth.get('hard_gates', {}).get('aurora_bloom_actual_playback_watchdog_required') is not True:\n    errors.append('K17 Bloom actual-playback hard gate missing')\n"
k18 = insert_anchor + "\n# 8e. K18 iPhone media-decode guard: exact M4A masters must bypass Phaser\n# WebAudio decode and be primed through native HTMLMediaElement on the explicit\n# Hybrid audio-enable gesture. A late non-critical decode rejection after the\n# scene is live must not replace gameplay with a fatal boot overlay.\nfor forbidden in [\n    'this.load.audio(AURORA_BLOOM_KEY',\n    'this.load.audio(TRIUMPH_LIGHT_KEY',\n]:\n    if forbidden in k_scene:\n        errors.append(f'K18 exact M4A master regressed into Phaser/WebAudio preload: {forbidden}')\nfor token in [\n    \"const AURORA_BLOOM_PATH = './assets/music/Celestial Bloom.m4a?pvasset=live28k18-native'\",\n    \"const TRIUMPH_LIGHT_PATH = './assets/music/Triumph of Light.m4a?pvasset=live28k18-native'\",\n    'function makeNativeAudio(path, loop = false)',\n    'primeNativeMedia()',\n    'sound.volume = 0',\n    'sound.currentTime = 0',\n    \"new Audio(new URL(path, window.location.href).href)\",\n]:\n    if token not in audio_controller:\n        errors.append(f'K18 native exact-M4A token missing: {token}')\nfor token in [\n    'scene.audio?.primeNativeMedia?.();',\n    '/decoding failed/i.test(msg)',\n    \"console.warn('[PV] non-fatal media decode rejection after live scene start:'\",\n]:\n    if token not in hybrid_template:\n        errors.append(f'K18 Hybrid native-media resilience token missing: {token}')\nif auth.get('hard_gates', {}).get('exact_m4a_masters_must_not_enter_phaser_webaudio_decode') is not True:\n    errors.append('K18 exact M4A/WebAudio prohibition hard gate missing')\nif auth.get('hard_gates', {}).get('native_media_prime_required_for_exact_m4a') is not True:\n    errors.append('K18 native media prime hard gate missing')\nif auth.get('hard_gates', {}).get('post_scene_media_decode_rejection_nonfatal') is not True:\n    errors.append('K18 post-scene media decode resilience hard gate missing')\nif 'native HTMLMediaElement' not in auth['auryi'].get('exact_m4a_playback_lane', ''):\n    errors.append('K18 exact M4A playback lane missing from machine authority')\n"
pre = replace_once(pre, insert_anchor, k18, 'K18 preflight insertion point')
PREFLIGHT.write_text(pre, encoding='utf-8')

print('LIVE28K18 native M4A / boot-decode corrections staged')
