import json, re
from pathlib import Path

W = 'main-20260908-live28k23'

p = Path('PV_LIVE_AUTHORITY.json')
a = json.loads(p.read_text())
a['updated'] = '2026-09-08'
a['witness'] = W
hg = a.setdefault('hard_gates', {})
hg.update({
    'aurora_v2_exact_master_required': True,
    'aurora_v2_native_sfx_lane_required': True,
    'aurora_v2_battle_bgm_silence_required': True,
    'aurora_v2_choir_tail_bridge_required': True,
})
au = a['auryi']
au.update({
    'aurora_presentation': 'Beauty V2 exact KingAI master inside the Hybrid K adapter; live battlefield intro, native V2 SFX, battle BGM fully silent during cinematic, Celestial Bloom choir-tail bridge at final blast, and live battlefield/enemy reconnect.',
    'aurora_beauty_video': 'assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v2_KingAI_MASTER.mp4',
    'aurora_beauty_video_sha256': '57101593d7bee82ab444f3f556dd634ad71928975f43cf1a4eebadce020825ac',
    'aurora_beauty_video_bytes': 6256162,
    'aurora_beauty_resolution': '910x512',
    'aurora_beauty_fps': 30,
    'aurora_beauty_duration_seconds': 10.033333,
    'aurora_beauty_timeline': 'assets/characters/auryi/animations/aurora_pulse/cinematic/AuroraPulse_Beauty_v2_runtime_timeline.json',
    'aurora_v2_sfx': 'assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v2_KingAI_AUDIO.m4a',
    'aurora_v2_sfx_sha256': '9d3da298c2f5712e3a52446ecaca9b7eb3100e030d0d3acf04f6e041b1f727d0',
    'aurora_v2_sfx_bytes': 164264,
    'aurora_beauty_sync': {
        'live_intro_ms': 900,
        'live_handoff_ms': 220,
        'video_sfx_reveal': 0.0,
        'celestial_bloom_choir_tail_video_time': 9.35,
        'celestial_bloom_choir_tail_source_time': 3.86,
        'battlefield_reveal_crossfade': 9.50,
        'live_enemy_visual_impact': 9.72,
        'live_battlefield_reconnect': 9.90,
        'beauty_video_hidden': 10.02,
    },
    'aurora_bloom_mix_policy': 'Beauty V2 embedded AAC is packet-copied to a native M4A lane with no re-encode. Normal battle BGM is fully silent from Aurora action start through reconnect. Celestial Bloom remains exact native M4A and reveals only its choir tail from source ~3.86s at Beauty V2 ~9.35s to bridge the final blast into the live battlefield.',
    'aurora_handoff_policy': 'Hybrid commits briefly to live Auryi, hands off to Beauty V2, begins real battlefield reveal at 9.50s, resolves live enemy hit/recoil at 9.72s, restores live battlefield ownership by 9.90s, hides Beauty by 10.02s, then restores battle BGM. Crownless Aurora and Aurorb Slice separation remain locked.',
})
dev = a.setdefault('device_evidence', {})
dev['pending_witness'] = W
dev['pending_iphone_validation'] = True
dev['live28k23_pending_iphone_validation'] = True
dev['pending_gate_summary'] = 'LIVE28K23: Aurora Pulse Beauty V2, silent battle BGM during cinematic, native V2 SFX, Celestial Bloom choir-tail bridge, clean live battlefield/enemy reconnect, then battle BGM restore. Preserve K22 Kineza settle-before-Victory and all stable lanes.'
p.write_text(json.dumps(a, indent=2) + '\n')

p = Path('live-build.json')
d = json.loads(p.read_text())
d['id'] = W
p.write_text(json.dumps(d, indent=2) + '\n')

p = Path('PRIZIM_LIVE_NOTEPAD.md')
s = p.read_text()
s = re.sub(r'Current promoted build: `[^`]+`[^\n]*', f'Current promoted build: `{W}` — **Aurora Pulse Beauty V2 promotion; iPhone evidence remains final runtime gate.**', s, count=1)
block = f'''\n## LIVE28K23 Aurora Pulse V2\n\n- Promoted witness: `{W}`.\n- Exact Beauty V2 is production Aurora Pulse: 910×512, 30 FPS, 10.033333s, SHA-256 `57101593d7bee82ab444f3f556dd634ad71928975f43cf1a4eebadce020825ac`.\n- Exact packet-copied native V2 SFX SHA-256: `9d3da298c2f5712e3a52446ecaca9b7eb3100e030d0d3acf04f6e041b1f727d0`.\n- Battle BGM is fully silent during the cinematic. Celestial Bloom enters only as the final choir-tail bridge.\n- Timing: choir 9.35s → battlefield reveal 9.50s → live enemy impact 9.72s → live ownership 9.90s → video hidden 10.02s → battle BGM restore.\n- Aurora remains crownless; Aurorb Slice remains separate; K22 Kineza settle-before-Victory remains locked.\n- Pending final gate: normal iPhone MAIN route.\n\n'''
if '## LIVE28K23 Aurora Pulse V2' not in s:
    s = s.replace('## Current truths\n', block + '## Current truths\n', 1)
p.write_text(s)

p = Path('PV_RESUME_ANCHOR.md')
s = p.read_text()
s = re.sub(r'- Promoted witness: `[^`]+`', f'- Promoted witness: `{W}`', s, count=1)
block = f'''\n## LIVE28K23 Aurora Pulse V2 current lane\n\n- Current witness: `{W}`.\n- Beauty V2 exact master is production Aurora Pulse.\n- Battle BGM is silent during Beauty V2; V2 SFX uses native M4A; Celestial Bloom supplies only the choir-tail bridge.\n- Reconnect timing: choir 9.35s, battlefield reveal 9.50s, live enemy impact 9.72s, live ownership 9.90s, video hidden 10.02s, then battle BGM restore.\n- Final validation is the normal iPhone MAIN route. Preserve K22 Kineza settle-before-Victory behavior and stable Prismel/Auryi Basic/Kineza lanes.\n\n'''
if '## LIVE28K23 Aurora Pulse V2 current lane' not in s:
    s = s.replace('## Auryi command authority\n', block + '## Auryi command authority\n', 1)
p.write_text(s)
