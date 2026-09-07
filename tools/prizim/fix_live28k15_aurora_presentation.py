#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCENE = ROOT / 'src/prizim/Live28K2PartyBattleScene.js'
AUDIO = ROOT / 'src/PartyBattleAudioController.js'
AUTH = ROOT / 'PV_LIVE_AUTHORITY.json'
PREFLIGHT = ROOT / 'tools/prizim/preflight_live28k.py'
SYNC = ROOT / 'tools/prizim/sync_live_authority.py'


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'K15 patch refused: missing {label}')
    return text.replace(old, new, 1)


scene = SCENE.read_text(encoding='utf-8')
scene = replace_once(
    scene,
    "const AURORA_BEAUTY_TIMELINE = Object.freeze({ invocation: 0.70, silence: 4.56, pulse: 5.18, reconnect: 6.82, end: 7.375 });",
    "// The Beauty master contains a placeholder/demo reconnect after ~6.65s.\n// LIVE28K never shows that tail: the real Hybrid battlefield owns reconnect.\nconst AURORA_BEAUTY_TIMELINE = Object.freeze({ invocation: 0.70, silence: 4.56, pulse: 5.18, reconnect: 6.58, end: 6.65 });",
    'Beauty timeline constant',
)
scene = replace_once(
    scene,
    "    let ownsBloom = false;\n    let impactResolved = false;\n\n    this.audio.beginCinematicAttack?.();\n    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);\n\n    try {",
    "    let ownsBloom = false;\n    let impactResolved = false;\n\n    this.audio.beginCinematicAttack?.();\n    // iPhone/Safari: arm the exact choir cue while still inside the user-gesture\n    // execution chain. Phaser/WebAudio schedules its 0.70s Invocation start,\n    // instead of attempting a fresh delayed play after native video has begun.\n    ownsBloom = this.audio.auroraBloomStart?.(AURORA_BEAUTY_TIMELINE.invocation) === true;\n    this._setBanner(`${hero.name} invokes ${hero.resonart.name}!`);\n\n    try {",
    'pre-video Bloom arming',
)
scene = replace_once(
    scene,
    "      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.invocation);\n      ownsBloom = this.audio.auroraBloomStart?.() === true;\n      if (!ownsBloom) this.audio.attackGather(hero.id);",
    "      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.invocation);\n      if (!ownsBloom) this.audio.attackGather(hero.id);",
    'delayed Bloom start removal',
)
scene = replace_once(
    scene,
    "      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.reconnect);\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.end, 14000);",
    "      // The approved Beauty attack ends cleanly here. Do NOT show the baked\n      // placeholder/demo reconnect tail. The live Hybrid battlefield underneath\n      // already owns the real enemy, camera, HUD, and post-impact state.\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.reconnect);\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.end, 14000);",
    'live reconnect guard',
)
SCENE.write_text(scene, encoding='utf-8')

audio = AUDIO.read_text(encoding='utf-8')
audio = replace_once(
    audio,
    "    if (this._auroraBloom) this._auroraBloom.setVolume(this._effectiveVolume('sfx', 0.86));",
    "    if (this._auroraBloom) this._auroraBloom.setVolume(this._effectiveVolume('sfx', 1.0));",
    'Bloom mute-volume authority',
)
audio = replace_once(
    audio,
    "  auroraBloomStart() {\n    if (!this.scene.cache.audio.exists(AURORA_BLOOM_KEY)) return false;",
    "  auroraBloomStart(delaySeconds = 0) {\n    if (!this.scene.cache.audio.exists(AURORA_BLOOM_KEY)) return false;",
    'Bloom function signature',
)
audio = replace_once(
    audio,
    "    this._auroraBloom = this.scene.sound.add(AURORA_BLOOM_KEY, {\n      loop: false,\n      volume: this._effectiveVolume('sfx', 0.86)\n    });\n    const fire = () => this._auroraBloom?.play();",
    "    // Aurora Pulse owns the musical foreground. Fully clear the normal\n    // battle BGM so Celestial Bloom is not masked by the regular combat loop.\n    if (this.music?.isPlaying) {\n      this.scene.tweens.killTweensOf(this.music);\n      this.scene.tweens.add({ targets: this.music, volume: 0, duration: 100, ease: 'Sine.easeOut' });\n    }\n    this._auroraBloom = this.scene.sound.add(AURORA_BLOOM_KEY, {\n      loop: false,\n      volume: this._effectiveVolume('sfx', 1.0)\n    });\n    const fire = () => {\n      if (!this._auroraBloom) return;\n      this._auroraBloom.play(undefined, { delay: Math.max(0, Number(delaySeconds) || 0) });\n    };",
    'Bloom scheduled foreground mix',
)
AUDIO.write_text(audio, encoding='utf-8')

auth = json.loads(AUTH.read_text(encoding='utf-8'))
aur = auth.setdefault('auryi', {})
aur['aurora_beauty_sync'] = {
    'battlefield_handoff': 0.0,
    'celestial_bloom_scheduled_from_user_gesture': 0.70,
    'compression_silence': 4.56,
    'pulse_release_and_damage': 5.18,
    'live_battlefield_reconnect': 6.58,
    'beauty_video_hidden_before_demo_tail': 6.65,
}
aur['aurora_demo_tail_policy'] = 'Never display Beauty V1 placeholder reconnect material at/after ~6.65s; live Hybrid battlefield owns reconnect.'
aur['aurora_bloom_mix_policy'] = 'Celestial Bloom is armed/scheduled before native video play on iPhone and owns the cinematic foreground mix; normal battle BGM is cleared beneath it.'
evidence = auth.setdefault('device_evidence', {})
evidence['live28k14_beauty_video_played'] = True
evidence['live28k14_attack_sfx_played'] = True
evidence['live28k14_celestial_bloom_inaudible'] = True
evidence['live28k14_demo_tail_visible'] = True
evidence['live28k14_result'] = 'FAIL presentation gate: choir absent and baked demo reconnect tail visible on iPhone recording.'
evidence['live28k15_pending_iphone_validation'] = True
AUTH.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')

preflight = PREFLIGHT.read_text(encoding='utf-8')
preflight = replace_once(
    preflight,
    "k_scene = read('src/prizim/Live28K2PartyBattleScene.js')\nbase_scene = read('src/PartyBattleScene.js')",
    "k_scene = read('src/prizim/Live28K2PartyBattleScene.js')\naudio_controller = read('src/PartyBattleAudioController.js')\nbase_scene = read('src/PartyBattleScene.js')",
    'preflight audio controller read',
)
preflight = replace_once(preflight, "    'reconnect: 6.82',\n    'end: 7.375'", "    'reconnect: 6.58',\n    'end: 6.65'", 'preflight Beauty runtime cut tokens')
needle = "if 'Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4' in base_scene:\n    errors.append('Aurora Beauty V1 leaked into standalone PartyBattleScene')\n"
insert = needle + "\n# 8b. K15 presentation guard: iPhone-safe choir start and no baked demo tail.\nfor token in [\n    'auroraBloomStart(delaySeconds = 0)',\n    'this._auroraBloom.play(undefined, { delay:',\n    'targets: this.music, volume: 0',\n    \"volume: this._effectiveVolume('sfx', 1.0)\"\n]:\n    if token not in audio_controller:\n        errors.append(f'K15 Aurora Bloom presentation token missing: {token}')\nfor token in [\n    'auroraBloomStart?.(AURORA_BEAUTY_TIMELINE.invocation)',\n    'reconnect: 6.58',\n    'end: 6.65',\n    'placeholder/demo reconnect tail'\n]:\n    if token not in k_scene:\n        errors.append(f'K15 Aurora live reconnect/choir token missing: {token}')\nif auth['auryi'].get('aurora_beauty_sync', {}).get('beauty_video_hidden_before_demo_tail') != 6.65:\n    errors.append('Aurora Beauty runtime is not locked to hide before the demo reconnect tail')\nif 'scheduled before native video play' not in auth['auryi'].get('aurora_bloom_mix_policy', ''):\n    errors.append('Aurora Bloom iPhone scheduling policy missing from machine authority')\n"
preflight = replace_once(preflight, needle, insert, 'preflight K15 presentation guard')
PREFLIGHT.write_text(preflight, encoding='utf-8')

sync = SYNC.read_text(encoding='utf-8')
sync = replace_once(
    sync,
    '- Beauty V1 timing authority: handoff 0.00s -> Bloom starts 0.70s -> compression silence 4.56s -> Pulse/damage 5.18s -> reconnect 6.82s -> return 7.375s.',
    '- Beauty V1 source master remains 7.375s, but LIVE presentation intentionally exits at **6.65s** before the baked placeholder/demo reconnect. Live Hybrid battlefield reconnect begins at 6.58s underneath the fade.',
    'PriZim Beauty timing note',
)
sync = replace_once(
    sync,
    '- Celestial Bloom production audio is installed and has already played correctly on iPhone evidence.',
    '- Celestial Bloom production audio is exact and installed. K14 phone evidence showed it was inaudible once native Beauty video was introduced, so K15 schedules Bloom from the original user gesture at +0.70s and clears normal battle BGM beneath it. This remains pending iPhone validation.',
    'PriZim Bloom phone evidence note',
)
SYNC.write_text(sync, encoding='utf-8')

print('LIVE28K15 Aurora presentation corrections + canonical guards staged')
