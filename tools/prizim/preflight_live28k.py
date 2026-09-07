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

# 8. Future crown authority must preserve the corrected splash-screen hover semantics.
crown = auth['auryi'].get('future_crown_authority', '').lower()
if 'hovered' not in crown or 'not head-worn' not in crown:
    errors.append('future Auryi crown authority lost splash-screen hovered/not-head-worn semantics')

# 9. Human PriZim ledger must explicitly state the Hybrid hard gate.
for phrase in ['HYBRID STACK HARD GATE', 'ALL live battle/cinematic production work stays inside the Hybrid stack']:
    if phrase not in notepad:
        errors.append(f'PriZim notepad missing hard-gate phrase: {phrase}')

# 10. Aurora 01-08 durability gate: user delivery and durable installation are distinct states.
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
print('Aurora Pulse authority: K adapter + approved mock choreography + crownless')
print('Aurora frame history: user-supplied and previously separated; exact-frame mode only after durable 8-file verification')
print('Audio masters: exact SHA/size verified')
