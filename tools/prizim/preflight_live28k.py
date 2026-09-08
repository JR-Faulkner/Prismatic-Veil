#!/usr/bin/env python3
import hashlib
import json
import pathlib
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

errors = []
auth = json.loads(read('PV_LIVE_AUTHORITY.json'))
build = json.loads(read('live-build.json'))
witness = auth['witness']
k_scene = read('src/prizim/Live28K2PartyBattleScene.js')
audio = read('src/PartyBattleAudioController.js')
base = read('src/PartyBattleScene.js')
hybrid_main = read('hybrid-main.html')
hybrid_template = read('hybrid-battle-live.html')
notepad = read('PRIZIM_LIVE_NOTEPAD.md')
resume = read('PV_RESUME_ANCHOR.md')

if build.get('id') != witness:
    errors.append('live-build witness drift')
if witness not in notepad:
    errors.append('notepad missing current witness')
if witness not in resume:
    errors.append('resume anchor missing current witness')

for token in [
    "const live28kLineage=/live28k\\d+/i.test(id)",
    'Live28K2PartyBattleScene.js',
    'Live28K7PartyFormationView.js',
]:
    if token not in hybrid_main:
        errors.append(f'Hybrid route token missing: {token}')

if "h.resonart?.name" not in hybrid_template or "h.resonart?.flavor" not in hybrid_template:
    errors.append('Hybrid Resonart drawer authority drift')

if "hero?.id === 'auryi' && command === 'Resonart'" not in k_scene or '_playAuryiAuroraPulseBeauty' not in k_scene:
    errors.append('Aurora Pulse K-adapter authority missing')
if 'Aurora Pulse' in base or '_playAuryiAuroraPulse' in base:
    errors.append('Aurora Pulse leaked into base scene')
if '.webp' in k_scene.lower():
    errors.append('WebP reference in LIVE28K battle adapter')

fixed = {
    'assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v2_KingAI_MASTER.mp4': (6256162, '57101593d7bee82ab444f3f556dd634ad71928975f43cf1a4eebadce020825ac'),
    'assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v2_KingAI_AUDIO.m4a': (164264, '9d3da298c2f5712e3a52446ecaca9b7eb3100e030d0d3acf04f6e041b1f727d0'),
    'assets/music/Celestial Bloom.m4a': (113740, '0e8762907bf36650cbdebab8f6497079350054f9819c81e6cb1ba4f3b14cff3d'),
    'assets/music/Triumph of Light.m4a': (186602, '98c77e8bc536425b8da8ad4212ed26011335c5ac3b9dadbce0ec28c201cca437'),
    'assets/characters/kineza/animations/thunder_tornado/cinematic/Kineza_ThunderTornado_Resonart_MASTER.mp4': (6312497, '77e8fe6e9fcf430d013f0189355b0f725e150c850b240fd5b53060a4f94f9b93'),
}
for rel, (size, digest) in fixed.items():
    p = ROOT / rel
    if not p.exists():
        errors.append(f'missing exact media: {rel}')
        continue
    if p.stat().st_size != size:
        errors.append(f'media size drift: {rel}')
    elif sha256(rel) != digest:
        errors.append(f'media SHA drift: {rel}')

for token in [
    'Auryi_AuroraPulse_Resonart_Beauty_v2_KingAI_MASTER.mp4',
    'choirTail: 9.35',
    'reveal: 9.50',
    'impactReveal: 9.72',
    'reconnect: 9.90',
    'end: 10.02',
    'AURORA_BLOOM_TAIL_SOURCE = 3.86',
    'video.muted = true',
    'video.defaultMuted = true',
    'beginAuroraVideoMix',
    'auroraV2SfxPrime',
    'auroraV2SfxReveal',
    'auroraBloomTailPrime',
    'auroraBloomTailReveal',
]:
    if token not in k_scene and token not in audio:
        errors.append(f'Aurora V2 runtime token missing: {token}')

for token in [
    'AURORA_V2_SFX_PATH',
    'beginAuroraVideoMix()',
    'endAuroraVideoMix()',
    'auroraV2SfxPrime()',
    'auroraV2SfxReveal()',
    'auroraBloomTailPrime()',
    'auroraBloomTailReveal(sourceSeconds = 3.86)',
    '_cinematicBgmSilenced',
]:
    if token not in audio:
        errors.append(f'Aurora V2 native audio token missing: {token}')

hard = auth.get('hard_gates', {})
for key in [
    'aurora_v2_exact_master_required',
    'aurora_v2_native_sfx_lane_required',
    'aurora_v2_battle_bgm_silence_required',
    'aurora_v2_choir_tail_bridge_required',
    'aurora_pulse_is_crownless',
]:
    if hard.get(key) is not True:
        errors.append(f'hard gate missing: {key}')

if 'AURORA_TITLE_CARD_READY' in k_scene or '_runAuroraTitleCardSequence' in k_scene:
    errors.append('retired Aurora title runtime returned')

sync = auth.get('auryi', {}).get('aurora_beauty_sync', {})
for key, expected in {
    'celestial_bloom_choir_tail_video_time': 9.35,
    'battlefield_reveal_crossfade': 9.50,
    'live_enemy_visual_impact': 9.72,
    'live_battlefield_reconnect': 9.90,
    'beauty_video_hidden': 10.02,
}.items():
    if abs(float(sync.get(key, -99)) - expected) > 0.001:
        errors.append(f'Aurora V2 sync drift: {key}')

if auth.get('kineza', {}).get('lethal_victory_home_settle_ms') != 240:
    errors.append('K22 Kineza settle-before-Victory drift')

for token in [
    "hero?.id === 'kineza' && command === 'Resonart'",
    'Kineza_ThunderTornado_Resonart_MASTER.mp4',
    'THUNDER_TORNADO_TIMELINE',
    'reveal: 9.18',
    'livePass: 9.40',
    'impact: 9.66',
    'hide: 9.92',
    '_playKinezaThunderTornado',
    '_createThunderTornadoLivePass',
]:
    if token not in k_scene:
        errors.append(f'K24 Thunder Tornado runtime token missing: {token}')

for key in [
    'kineza_thunder_tornado_exact_master_required',
    'kineza_thunder_tornado_must_be_owned_by_k_adapter',
    'kineza_thunder_tornado_live_enemy_handoff_required',
    'kineza_thunder_tornado_lethal_home_settle_required',
]:
    if hard.get(key) is not True:
        errors.append(f'K24 hard gate missing: {key}')

ksync = auth.get('kineza', {}).get('thunder_tornado_sync', {})
for key, expected in {
    'battlefield_reveal_crossfade': 9.18,
    'live_tornado_pass': 9.40,
    'live_enemy_visual_impact': 9.66,
    'cinematic_hide': 9.92,
}.items():
    if abs(float(ksync.get(key, -99)) - expected) > 0.001:
        errors.append(f'K24 Thunder Tornado sync drift: {key}')

if errors:
    print('PRIZIM LIVE28K PREFLIGHT FAILED')
    for err in errors:
        print(' -', err)
    sys.exit(1)

print('PRIZIM LIVE28K PREFLIGHT PASS ·', witness)
