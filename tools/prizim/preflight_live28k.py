#!/usr/bin/env python3
import hashlib
import json
import pathlib
import re
import struct
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def sha256(path):
    h = hashlib.sha256()
    with (ROOT / path).open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def png_dimensions(path):
    p = ROOT / path
    with p.open('rb') as f:
        header = f.read(24)
    if len(header) < 24 or header[:8] != b'\x89PNG\r\n\x1a\n' or header[12:16] != b'IHDR':
        raise ValueError('not a valid PNG/IHDR header')
    return struct.unpack('>II', header[16:24])


def fail(errors):
    print('PRIΖIM LIVE28K PREFLIGHT FAILED')
    for e in errors:
        print(' -', e)
    sys.exit(1)


auth = json.loads(read('PV_LIVE_AUTHORITY.json'))
build = json.loads(read('live-build.json'))
hybrid_main = read('hybrid-main.html')
hybrid_template = read('hybrid-battle-live.html')
k_scene = read('src/prizim/Live28K2PartyBattleScene.js')
audio_controller = read('src/PartyBattleAudioController.js')
base_scene = read('src/PartyBattleScene.js')
notepad = read('PRIZIM_LIVE_NOTEPAD.md')
resume = read('PV_RESUME_ANCHOR.md')

errors = []
witness = auth['witness']

# 1. Single source of truth must match the promoted build and both human ledgers.
if build.get('id') != witness:
    errors.append(f"live-build witness {build.get('id')!r} != authority {witness!r}")
if witness not in notepad:
    errors.append('PRIZIM_LIVE_NOTEPAD.md does not contain current authority witness')
if witness not in resume:
    errors.append('PV_RESUME_ANCHOR.md does not contain current authority witness')

# 2. Hybrid stack is mandatory for production.
if build.get('hybrid') != auth['runtime']['hybrid_entry']:
    errors.append('live-build hybrid entry drifted from machine authority')
for path in auth['production_route']:
    if not (ROOT / path).exists():
        errors.append(f'missing production-route file: {path}')

required_main = [
    'const live28kLineage=/live28k\\d+/i.test(id)',
    "const battleAdapter=live28kLineage?'Live28K2PartyBattleScene.js':'Live28PartyBattleScene.js'",
    "const formationAdapter=live28kLineage?'Live28K7PartyFormationView.js':'Live28PartyFormationView.js'",
    "import('./src/PartyBattleScene.js?v=blitzer-2')",
    "import('./src/prizim/${battleAdapter}"
]
for token in required_main:
    if token not in hybrid_main:
        errors.append(f'hybrid-main missing required Hybrid/LIVE28K token: {token}')

# 3. Hybrid HUD must publish Resonart identity, never Basic Attack identity.
if "h.resonart?.name" not in hybrid_template or "h.resonart?.flavor" not in hybrid_template:
    errors.append('Hybrid Resonart drawer is not reading hero.resonart authority')
if "else if(d==='resonart')" in hybrid_template:
    block = hybrid_template.split("else if(d==='resonart')", 1)[1].split("else if(d==='guard')", 1)[0]
    if 'h.attack?.name' in block or 'h.attack?.flavor' in block:
        errors.append('Hybrid Resonart drawer regressed to hero.attack / Aurorb Slice authority')

# 4. Aurora Pulse belongs in the K adapter while the standalone base remains generic.
for token in [
    "hero?.id === 'auryi' && command === 'Resonart'",
    '_playAuryiAuroraPulse',
    'auroraBloomStart',
    'AURORA_PULSE_TIMING'
]:
    if token not in k_scene:
        errors.append(f'K adapter missing Aurora Pulse authority token: {token}')
if 'Aurora Pulse' in base_scene or '_playAuryiAuroraPulse' in base_scene:
    errors.append('Aurora Pulse leaked into standalone PartyBattleScene')

# 5. Mock stays reference-only, never the live Hybrid endpoint.
if build.get('hybrid') == auth['auryi']['aurora_mock']:
    errors.append('Aurora Pulse mock lab was promoted as live Hybrid entry')

# 6. Aurora Pulse hard art/semantic gates.
if '.webp' in k_scene.lower():
    errors.append('WebP reference found in LIVE28K battle adapter')
for forbidden in ['duoCrown', 'crown_manifest', 'halo']:
    # Existing K adapter may expose old global flags/comments, but Aurora Pulse function itself must not own them.
    if '_playAuryiAuroraPulse' in k_scene:
        aurora_block = k_scene.split('async _playAuryiAuroraPulse', 1)[1].split('\n  _setBanner(', 1)[0]
        if forbidden.lower() in aurora_block.lower():
            errors.append(f'Aurora Pulse block contains forbidden crown/halo token: {forbidden}')

# 7. Audio masters are immutable production authorities.
audio = {
    pathlib.Path('assets/music/Celestial Bloom.m4a'): (113740, '0e8762907bf36650cbdebab8f6497079350054f9819c81e6cb1ba4f3b14cff3d'),
    pathlib.Path('assets/music/Triumph of Light.m4a'): (186602, '98c77e8bc536425b8da8ad4212ed26011335c5ac3b9dadbce0ec28c201cca437'),
}
for rel, (size, digest) in audio.items():
    p = ROOT / rel
    if not p.exists():
        errors.append(f'missing audio master: {rel}')
        continue
    if p.stat().st_size != size:
        errors.append(f'audio size drift: {rel} = {p.stat().st_size}, expected {size}')
    actual = sha256(rel)
    if actual != digest:
        errors.append(f'audio SHA drift: {rel} = {actual}, expected {digest}')

# 8. Aurora Beauty V1 exact master is the primary live cinematic presentation.
beauty_video = pathlib.Path('assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4')
beauty_timeline = pathlib.Path('assets/characters/auryi/animations/aurora_pulse/cinematic/AuroraPulse_Beauty_v1_timeline.json')
beauty_expected = {
    beauty_video: (3400903, 'e70fc0f987646b1c1428c8797c0d95e8a38c2327448d3607826febb1e0065b1a'),
    beauty_timeline: (1345, 'fe0116a3068ffb4614188099926ac6ae68affcf22dfcda5723e1b3c7e35f2c58'),
}
for rel, (size, digest) in beauty_expected.items():
    p = ROOT / rel
    if not p.exists():
        errors.append(f'missing Aurora Beauty V1 production asset: {rel}')
        continue
    if p.stat().st_size != size:
        errors.append(f'Aurora Beauty V1 size drift: {rel} = {p.stat().st_size}, expected {size}')
    actual = sha256(rel)
    if actual != digest:
        errors.append(f'Aurora Beauty V1 SHA drift: {rel} = {actual}, expected {digest}')

for token in [
    'AURORA_BEAUTY_VIDEO_READY = true',
    'AURORA_BEAUTY_VIDEO_PATH',
    'AURORA_BEAUTY_TIMELINE',
    '_playAuryiAuroraPulseBeauty',
    'const handled = await this._playAuryiAuroraPulseBeauty(hero)',
    "objectFit: 'contain'",
    'invocation: 0.70',
    'silence: 4.56',
    'pulse: 5.18',
    'reveal: 6.08',
    'impactReveal: 6.30',
    'reconnect: 6.58',
    'end: 6.65'
]:
    if token not in k_scene:
        errors.append(f'K adapter missing Aurora Beauty V1 runtime token: {token}')
if 'Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4' in base_scene:
    errors.append('Aurora Beauty V1 leaked into standalone PartyBattleScene')

# 8b. K15+ presentation guard: foreground Bloom ownership and no baked demo tail.
for token in [
    'auroraBloomStart(delaySeconds = 0)',
    'targets: this.music, volume: 0',
    "this._effectiveVolume('sfx', 1.0)"
]:
    if token not in audio_controller:
        errors.append(f'Aurora Bloom presentation token missing: {token}')
for token in [
    'auroraBloomStart?.(AURORA_BEAUTY_TIMELINE.invocation)',
    'reconnect: 6.58',
    'end: 6.65',
    'placeholder/demo reconnect tail'
]:
    if token not in k_scene:
        errors.append(f'K15 Aurora live reconnect/choir token missing: {token}')
if auth['auryi'].get('aurora_beauty_sync', {}).get('beauty_video_hidden_before_demo_tail') != 6.65:
    errors.append('Aurora Beauty runtime is not locked to hide before the demo reconnect tail')

# 8c. K16 handoff guard: battlefield must crossfade in before the demo tail and
# the real live enemy reaction must be visible during that crossfade.
for token in [
    '_beginAuroraBeautyBattlefieldReveal',
    'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1)',
    '_playAuroraEnemyReconnectImpact',
    'pendingImpact = { dmg, lethal: this.enemy.hp <= 0 }',
    'AURORA_BEAUTY_TIMELINE.reveal',
    'AURORA_BEAUTY_TIMELINE.impactReveal',
]:
    if token not in k_scene:
        errors.append(f'K16 Aurora battlefield handoff token missing: {token}')
sync = auth['auryi'].get('aurora_beauty_sync', {})
if sync.get('battlefield_reveal_crossfade') != 6.08:
    errors.append('K16 Aurora battlefield reveal must begin at 6.08s')
if sync.get('live_enemy_visual_impact') != 6.30:
    errors.append('K16 Aurora live enemy visual impact must occur at 6.30s')
if 'real Hybrid battlefield' not in auth['auryi'].get('aurora_handoff_policy', ''):
    errors.append('K16 Aurora Hybrid handoff policy missing from machine authority')

# 8d. K17 resilience guard: transient Hybrid boot fetches retry, and Bloom must
# be verified as actually playing rather than merely scheduled.
for token in [
    'const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))',
    'const read=async (url,attempts=4)=>',
    'for(let attempt=1;attempt<=attempts;attempt++)',
    'await sleep(180*Math.pow(2,attempt-1))',
]:
    if token not in hybrid_main:
        errors.append(f'K17 Hybrid boot resilience token missing: {token}')
for token in [
    'auroraBloomIsPlaying()',
    'auroraBloomEnsurePlaying()',
]:
    if token not in audio_controller:
        errors.append(f'K17 Aurora Bloom watchdog audio token missing: {token}')
for token in [
    'bloomWatchdog: 0.84',
    'AURORA_BEAUTY_TIMELINE.bloomWatchdog',
    'this.audio.auroraBloomIsPlaying?.()',
    'this.audio.auroraBloomEnsurePlaying?.()',
]:
    if token not in k_scene:
        errors.append(f'K17 Aurora Bloom runtime watchdog token missing: {token}')
if auth.get('auryi', {}).get('aurora_beauty_sync', {}).get('bloom_playback_watchdog') != 0.84:
    errors.append('K17 Bloom playback watchdog must be locked to 0.84s')
if auth.get('hard_gates', {}).get('hybrid_boot_retry_required') is not True:
    errors.append('K17 Hybrid boot retry hard gate missing')
if auth.get('hard_gates', {}).get('aurora_bloom_actual_playback_watchdog_required') is not True:
    errors.append('K17 Bloom actual-playback hard gate missing')

# 8e. K18 iPhone media-decode guard: exact M4A masters must bypass Phaser
# WebAudio decode and be primed through native HTMLMediaElement on the explicit
# Hybrid audio-enable gesture. A late non-critical decode rejection after the
# scene is live must not replace gameplay with a fatal boot overlay.
for forbidden in [
    'this.load.audio(AURORA_BLOOM_KEY',
    'this.load.audio(TRIUMPH_LIGHT_KEY',
]:
    if forbidden in k_scene:
        errors.append(f'K18 exact M4A master regressed into Phaser/WebAudio preload: {forbidden}')
for token in [
    "const AURORA_BLOOM_PATH = './assets/music/Celestial Bloom.m4a?pvasset=live28k18-native'",
    "const TRIUMPH_LIGHT_PATH = './assets/music/Triumph of Light.m4a?pvasset=live28k18-native'",
    'function makeNativeAudio(path, loop = false)',
    'primeNativeMedia()',
    'sound.volume = 0',
    'sound.currentTime = 0',
    "new Audio(new URL(path, window.location.href).href)",
]:
    if token not in audio_controller:
        errors.append(f'K18 native exact-M4A token missing: {token}')
for token in [
    'scene.audio?.primeNativeMedia?.();',
    '/decoding failed/i.test(msg)',
    "console.warn('[PV] non-fatal media decode rejection after live scene start:'",
]:
    if token not in hybrid_template:
        errors.append(f'K18 Hybrid native-media resilience token missing: {token}')
if auth.get('hard_gates', {}).get('exact_m4a_masters_must_not_enter_phaser_webaudio_decode') is not True:
    errors.append('K18 exact M4A/WebAudio prohibition hard gate missing')
if auth.get('hard_gates', {}).get('native_media_prime_required_for_exact_m4a') is not True:
    errors.append('K18 native media prime hard gate missing')
if auth.get('hard_gates', {}).get('post_scene_media_decode_rejection_nonfatal') is not True:
    errors.append('K18 post-scene media decode resilience hard gate missing')
if 'native HTMLMediaElement' not in auth['auryi'].get('exact_m4a_playback_lane', ''):
    errors.append('K18 exact M4A playback lane missing from machine authority')


# 8f. K20 Hybrid cinematic-director guard. K19's full-screen move-title card
# is retired from runtime. Beauty V1 and the exact native M4A lane stay immutable.
for forbidden in [
    'AURORA_TITLE_CARD_READY',
    'AURORA_TITLE_CARD_PATH',
    'AURORA_TITLE_CARD_TIMING',
    '_prepareAuroraTitleCard',
    '_runAuroraTitleCardSequence',
    "'RESONART\nAURORA PULSE'",
]:
    if forbidden in k_scene:
        errors.append(f'K20 retired Aurora move-title runtime token returned: {forbidden}')

for token in [
    '_runAuroraBeautyDirector(video)',
    '_playAuroraBattlefieldAfterglow()',
    '_restoreAuroraBeautyDirector(heroId, cameraState)',
    'this.formation.setPovFocus?.(hero.id, true)',
    'this.audio.auroraReentryWave?.();',
    "video.style.transform = 'scale(1.065)'",
    'AURORA_BEAUTY_TIMELINE.impactReveal',
]:
    if token not in k_scene:
        errors.append(f'K20 Aurora Hybrid director token missing: {token}')

for token in [
    'auroraReentryWave()',
    "key: 'pb_hero_auryi_release'",
    "key: 'pb_hero_auryi_idlePulse'",
    "key: 'pb_hero_auryi_impact'",
]:
    if token not in audio_controller:
        errors.append(f'K20 Aurora re-entry wave audio token missing: {token}')

for gate in [
    'aurora_runtime_title_forbidden',
    'aurora_hybrid_director_required',
    'aurora_reentry_wave_required',
    'aurora_reentry_live_enemy_reaction_required',
    'k20_must_preserve_k18_native_m4a_lane',
    'k20_must_preserve_beauty_exact_master',
]:
    if auth.get('hard_gates', {}).get(gate) is not True:
        errors.append(f'K20 hard gate missing: {gate}')

if auth.get('auryi', {}).get('aurora_title_card_runtime_enabled') is not False:
    errors.append('K20 Aurora title-card runtime must be explicitly disabled')
if 'archived visual/reference asset' not in auth.get('auryi', {}).get('aurora_title_card_policy', ''):
    errors.append('K20 title-card reference-only policy missing from machine authority')
if auth.get('auryi', {}).get('aurora_beauty_sync', {}).get('battlefield_reentry_wave') != 6.30:
    errors.append('K20 battlefield re-entry wave must be locked to 6.30s')
if 'release + idlePulse + impact' not in auth.get('auryi', {}).get('aurora_reentry_wave_policy', ''):
    errors.append('K20 re-entry wave construction policy missing from machine authority')
bloom_policy = auth['auryi'].get('aurora_bloom_mix_policy', '')
if 'scheduled before native video play' not in bloom_policy and 'native HTMLMediaElement' not in bloom_policy:
    errors.append('Aurora Bloom iPhone scheduling/native-media policy missing from machine authority')

if beauty_timeline.exists():
    try:
        beauty = json.loads((ROOT / beauty_timeline).read_text(encoding='utf-8'))
        if beauty.get('resolution') != '1920x1080' or beauty.get('fps') != 24:
            errors.append('Aurora Beauty V1 timeline metadata drifted from 1920x1080 / 24 FPS authority')
        beats = {b['label']: (float(b['start']), float(b['end'])) for b in beauty.get('beats', [])}
        expected_beats = {
            'Battlefield Handoff': (0.0, 0.7),
            'Invocation': (0.7, 1.55),
            'Compression Silence': (4.56, 5.18),
            'Pulse Release': (5.18, 6.82),
            'Battlefield Reconnect': (6.82, 7.4),
        }
        for label, expected in expected_beats.items():
            if beats.get(label) != expected:
                errors.append(f'Aurora Beauty V1 timeline beat drift: {label} = {beats.get(label)}, expected {expected}')
    except Exception as exc:
        errors.append(f'could not validate Aurora Beauty V1 timeline: {exc}')

# 9. Future crown authority must preserve the corrected splash-screen hover semantics.
crown = auth['auryi'].get('future_crown_authority', '').lower()
if 'hovered' not in crown or 'not head-worn' not in crown:
    errors.append('future Auryi crown authority lost splash-screen hovered/not-head-worn semantics')

# 10. Human PriZim ledger must explicitly state the Hybrid hard gate.
for phrase in ['HYBRID STACK HARD GATE', 'ALL live battle/cinematic production work stays inside the Hybrid stack']:
    if phrase not in notepad:
        errors.append(f'PriZim notepad missing hard-gate phrase: {phrase}')

# 11. Aurora 01-08 durability gate: user delivery and durable installation are distinct states.
frame_manifest_path = auth['auryi'].get('aurora_frame_authority')
if not frame_manifest_path or not (ROOT / frame_manifest_path).exists():
    errors.append('missing Aurora Pulse frame authority manifest')
else:
    frame_manifest = json.loads(read(frame_manifest_path))
    if frame_manifest.get('user_supplied') is not True or frame_manifest.get('previously_separated') is not True:
        errors.append('Aurora frame authority incorrectly lost user-supplied / previously-separated history')
    if auth['auryi'].get('aurora_frames_user_supplied') is not True:
        errors.append('machine authority incorrectly reclassified supplied Aurora frames as missing delivery')
    if auth['auryi'].get('aurora_frames_previously_separated') is not True:
        errors.append('machine authority incorrectly lost prior Aurora frame separation state')

    exact_mode = bool(auth['auryi'].get('aurora_exact_frame_mode'))
    if exact_mode != bool(frame_manifest.get('exact_frame_mode')):
        errors.append('Aurora exact-frame mode differs between machine authority and frame manifest')

    expected_dims = tuple(frame_manifest.get('expected_dimensions', []))
    expected_frames = frame_manifest.get('expected_frames', [])
    if len(expected_frames) != 8:
        errors.append(f'Aurora frame manifest must define exactly 8 production frames; found {len(expected_frames)}')

    if exact_mode:
        hashes = frame_manifest.get('sha256', {})
        for rel in expected_frames:
            p = ROOT / rel
            if not p.exists():
                errors.append(f'exact Aurora frame mode enabled but production frame is missing: {rel}')
                continue
            if p.suffix.lower() != '.png':
                errors.append(f'exact Aurora frame is not PNG: {rel}')
                continue
            try:
                dims = png_dimensions(rel)
            except Exception as exc:
                errors.append(f'invalid Aurora PNG {rel}: {exc}')
                continue
            if expected_dims and dims != expected_dims:
                errors.append(f'Aurora frame dimensions drift: {rel} = {dims}, expected {expected_dims}')
            expected_hash = hashes.get(rel)
            if not expected_hash:
                errors.append(f'exact Aurora frame mode enabled without durable SHA-256 manifest entry: {rel}')
            elif sha256(rel) != expected_hash:
                errors.append(f'Aurora frame SHA drift: {rel}')
    else:
        if frame_manifest.get('current_durable_state') in {'complete', 'installed', 'durable'}:
            errors.append('Aurora frame manifest claims durable completion while exact-frame mode is disabled')

if errors:
    fail(errors)

print(f'PriZim LIVE28K preflight PASS · {witness}')
print('Hybrid route: hybrid-main -> hybrid-battle-live -> LIVE28K K adapters')
print('Aurora Pulse authority: exact Beauty V1 Hybrid video primary + Phaser mock fail-safe + crownless')
print('Aurora frame history: user-supplied and previously separated; exact-frame mode only after durable 8-file verification')
print('Audio masters: exact SHA/size verified')
