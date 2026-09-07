#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCENE = ROOT / 'src/prizim/Live28K2PartyBattleScene.js'
PREFLIGHT = ROOT / 'tools/prizim/preflight_live28k.py'
SYNC = ROOT / 'tools/prizim/sync_live_authority.py'
AUTH = ROOT / 'PV_LIVE_AUTHORITY.json'


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'K19 patch refused: missing {label}')
    return text.replace(old, new, 1)


# ------------------------------------------------------------------
# 1. Wire the exact approved PNG as a DOM title-card overlay above Beauty V1.
# ------------------------------------------------------------------
scene = SCENE.read_text(encoding='utf-8')
scene = replace_once(
    scene,
    "const AURORA_BEAUTY_VIDEO_PATH = './assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4?pvasset=live28k14-beauty';\n",
    "const AURORA_BEAUTY_VIDEO_PATH = './assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4?pvasset=live28k14-beauty';\n"
    "const AURORA_TITLE_CARD_READY = true;\n"
    "const AURORA_TITLE_CARD_PATH = './assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_TitleCard_Approved.png?pvasset=live28k19-title';\n"
    "const AURORA_TITLE_CARD_TIMING = Object.freeze({ show: 0.08, fadeOut: 1.28, hide: 1.55 });\n",
    'Aurora Beauty title-card constants anchor',
)

scene = replace_once(
    scene,
    "    // Prewarm the exact Beauty V1 cinematic inside the live Hybrid/K scene.\n"
    "    this._prepareAuroraBeautyVideo();\n"
    "    this.events.once('shutdown', () => this._disposeAuroraBeautyVideo());\n",
    "    // Prewarm the exact Beauty V1 cinematic and approved move-title PNG inside\n"
    "    // the live Hybrid/K scene. K19 is presentation-only; K18 audio/handoff stay intact.\n"
    "    this._prepareAuroraBeautyVideo();\n"
    "    this._prepareAuroraTitleCard();\n"
    "    this.events.once('shutdown', () => {\n"
    "      this._disposeAuroraBeautyVideo();\n"
    "      this._disposeAuroraTitleCard();\n"
    "    });\n",
    'Aurora prewarm/shutdown block',
)

method_anchor = "  _disposeAuroraBeautyVideo() {\n"
title_methods = r'''  _prepareAuroraTitleCard() {
    if (!AURORA_TITLE_CARD_READY || typeof document === 'undefined') return null;
    if (this._auroraTitleCard) return this._auroraTitleCard;

    const image = document.createElement('img');
    image.src = new URL(AURORA_TITLE_CARD_PATH, window.location.href).href;
    image.alt = 'Aurora Pulse';
    image.decoding = 'async';
    image.loading = 'eager';
    image.setAttribute('aria-hidden', 'true');
    Object.assign(image.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      background: '#11071f',
      zIndex: '2147483001',
      pointerEvents: 'none',
      opacity: '0',
      display: 'none',
      transition: 'opacity 180ms cubic-bezier(0.22, 1, 0.36, 1)'
    });
    document.body.appendChild(image);
    image.decode?.().catch?.(() => {});
    this._auroraTitleCard = image;
    return image;
  }

  _disposeAuroraTitleCard() {
    const image = this._auroraTitleCard;
    if (!image) return;
    try { image.remove(); } catch (err) { /* ignore cleanup errors */ }
    this._auroraTitleCard = null;
  }

  async _hideAuroraTitleCard(image, fadeMs = 80) {
    if (!image) return;
    image.style.transition = `opacity ${Math.max(0, fadeMs)}ms linear`;
    image.style.opacity = '0';
    if (fadeMs > 0) await this._wait(fadeMs);
    image.style.display = 'none';
    image.style.transition = 'opacity 180ms cubic-bezier(0.22, 1, 0.36, 1)';
  }

  async _runAuroraTitleCardSequence(video, image) {
    if (!video || !image) return;
    image.style.display = 'block';
    image.style.opacity = '0';
    image.style.transition = 'opacity 180ms cubic-bezier(0.22, 1, 0.36, 1)';

    await this._waitForAuroraBeautyTime(video, AURORA_TITLE_CARD_TIMING.show);
    requestAnimationFrame(() => { if (image) image.style.opacity = '1'; });

    await this._waitForAuroraBeautyTime(video, AURORA_TITLE_CARD_TIMING.fadeOut);
    image.style.transition = 'opacity 270ms cubic-bezier(0.4, 0, 1, 1)';
    image.style.opacity = '0';

    await this._waitForAuroraBeautyTime(video, AURORA_TITLE_CARD_TIMING.hide);
    image.style.display = 'none';
    image.style.transition = 'opacity 180ms cubic-bezier(0.22, 1, 0.36, 1)';
  }

'''
if method_anchor not in scene:
    raise SystemExit('K19 patch refused: title-card method insertion anchor missing')
scene = scene.replace(method_anchor, title_methods + method_anchor, 1)

scene = replace_once(
    scene,
    "  async _playAuryiAuroraPulseBeauty(hero) {\n"
    "    const video = this._prepareAuroraBeautyVideo();\n"
    "    if (!video) return false;\n",
    "  async _playAuryiAuroraPulseBeauty(hero) {\n"
    "    const video = this._prepareAuroraBeautyVideo();\n"
    "    const titleCard = this._prepareAuroraTitleCard();\n"
    "    if (!video) return false;\n",
    'Beauty playback title-card declaration',
)

scene = replace_once(
    scene,
    "      requestAnimationFrame(() => { video.style.opacity = '1'; });\n\n"
    "      // Beauty V1 is the presentation clock.",
    "      requestAnimationFrame(() => { video.style.opacity = '1'; });\n"
    "      const titleCardTask = this._runAuroraTitleCardSequence(video, titleCard)\n"
    "        .catch(err => console.warn('[PV] Aurora Pulse title-card sequence skipped:', err));\n\n"
    "      // Beauty V1 is the presentation clock.",
    'Beauty title-card sequence start',
)

scene = replace_once(
    scene,
    "      if (ownsBloom) this.audio.auroraBloomStop?.(120);\n"
    "      this.audio.endCinematicAttack?.();\n"
    "      await this._hideAuroraBeautyVideo(video, 40);\n",
    "      if (ownsBloom) this.audio.auroraBloomStop?.(120);\n"
    "      this.audio.endCinematicAttack?.();\n"
    "      await this._hideAuroraTitleCard(titleCard, 40);\n"
    "      await this._hideAuroraBeautyVideo(video, 40);\n",
    'Beauty failure cleanup title card',
)

scene = replace_once(
    scene,
    "    if (ownsBloom) this.audio.auroraBloomStop?.(120);\n"
    "    await this._hideAuroraBeautyVideo(video, 90);\n",
    "    if (ownsBloom) this.audio.auroraBloomStop?.(120);\n"
    "    await this._hideAuroraTitleCard(titleCard, 0);\n"
    "    await this._hideAuroraBeautyVideo(video, 90);\n",
    'Beauty success cleanup title card',
)

SCENE.write_text(scene, encoding='utf-8')

# ------------------------------------------------------------------
# 2. Machine authority: exact asset, timing, K18 pass, K19 pending device gate.
# ------------------------------------------------------------------
auth = json.loads(AUTH.read_text(encoding='utf-8'))
auth['updated'] = '2026-09-07'
hard = auth.setdefault('hard_gates', {})
hard['aurora_title_card_exact_png_required'] = True
hard['aurora_title_card_must_hide_before_growth'] = True
hard['k19_title_card_must_not_change_k18_audio_or_handoff'] = True

aur = auth.setdefault('auryi', {})
aur['aurora_title_card'] = 'assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_TitleCard_Approved.png'
aur['aurora_title_card_sha256'] = '455276790353db64f997326e8caf9d00cc096d8179c299e2f49eb57cb8c91ccb'
aur['aurora_title_card_bytes'] = 1886155
aur['aurora_title_card_dimensions'] = [1672, 941]
aur['aurora_title_card_source_dropbox_path'] = '/Photo Sep 07 2026, 00 37 15.png'
aur['aurora_title_card_source_dropbox_file_id'] = 'id:fSSjhQEdL7EAAAAAAAAAFA'
aur['aurora_title_card_timing'] = {
    'show': 0.08,
    'fade_out': 1.28,
    'hide': 1.55,
}
aur['aurora_title_card_policy'] = (
    'Use the exact approved PNG as a full-screen DOM overlay above Beauty V1 during the early '
    'Aurora Pulse invocation. Fade in at 0.08s, begin fade at 1.28s, and be fully hidden by 1.55s '
    'before Aurora Growth. No regeneration, recompression, redesign, or K18 audio/handoff changes.'
)

evidence = auth.setdefault('device_evidence', {})
evidence['live28k18_pending_iphone_validation'] = False
evidence['live28k18_boot_clean'] = True
evidence['live28k18_celestial_bloom_audible'] = True
evidence['live28k18_battlefield_enemy_handoff_accepted'] = True
evidence['live28k18_core_aurora_presentation_passed'] = True
evidence['live28k18_result'] = (
    'PASS core Aurora phone gate: user reported looks and sounds good; native M4A lane, Beauty V1, '
    'and live battlefield/enemy reconnect accepted. Next requested polish is visible move title.'
)
evidence['latest_device_witness'] = 'main-20260906-live28k18'
evidence['latest_device_result'] = evidence['live28k18_result']
evidence['pending_witness'] = 'main-20260907-live28k19'
evidence['pending_iphone_validation'] = True
evidence['live28k19_pending_iphone_validation'] = True
evidence['pending_gate_summary'] = (
    'LIVE28K19: exact approved AURORA PULSE title card appears cleanly during invocation, fades before '
    'Aurora Growth, while K18 choir/audio, Beauty cinematic, Pulse timing, and live enemy handoff remain unchanged.'
)
AUTH.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')

# ------------------------------------------------------------------
# 3. PriZim preflight: exact PNG and timing become machine-enforced.
# ------------------------------------------------------------------
pre = PREFLIGHT.read_text(encoding='utf-8')
anchor = "if 'native HTMLMediaElement' not in auth['auryi'].get('exact_m4a_playback_lane', ''):\n    errors.append('K18 exact M4A playback lane missing from machine authority')\n"
k19_guard = anchor + r'''

# 8f. K19 exact move-title guard: the approved PNG is immutable and must live
# above Beauty V1 only during Invocation, disappearing before Aurora Growth.
title_card = pathlib.Path('assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_TitleCard_Approved.png')
title_expected = (1886155, '455276790353db64f997326e8caf9d00cc096d8179c299e2f49eb57cb8c91ccb', (1672, 941))
if not (ROOT / title_card).exists():
    errors.append(f'missing approved Aurora Pulse title card: {title_card}')
else:
    p = ROOT / title_card
    if p.stat().st_size != title_expected[0]:
        errors.append(f'Aurora title-card size drift: {p.stat().st_size}, expected {title_expected[0]}')
    actual = sha256(title_card)
    if actual != title_expected[1]:
        errors.append(f'Aurora title-card SHA drift: {actual}, expected {title_expected[1]}')
    try:
        dims = png_dimensions(title_card)
        if dims != title_expected[2]:
            errors.append(f'Aurora title-card dimensions drift: {dims}, expected {title_expected[2]}')
    except Exception as exc:
        errors.append(f'Aurora title-card PNG validation failed: {exc}')

for token in [
    'AURORA_TITLE_CARD_READY = true',
    'AURORA_TITLE_CARD_PATH',
    'AURORA_TITLE_CARD_TIMING = Object.freeze({ show: 0.08, fadeOut: 1.28, hide: 1.55 })',
    '_prepareAuroraTitleCard()',
    '_runAuroraTitleCardSequence(video, image)',
    "zIndex: '2147483001'",
    "objectFit: 'contain'",
    'this._runAuroraTitleCardSequence(video, titleCard)',
]:
    if token not in k_scene:
        errors.append(f'K19 Aurora title-card runtime token missing: {token}')
if 'Auryi_AuroraPulse_TitleCard_Approved.png' in base_scene:
    errors.append('K19 Aurora title card leaked into standalone PartyBattleScene')
if auth.get('hard_gates', {}).get('aurora_title_card_exact_png_required') is not True:
    errors.append('K19 exact title-card PNG hard gate missing')
if auth.get('hard_gates', {}).get('aurora_title_card_must_hide_before_growth') is not True:
    errors.append('K19 title-card-before-growth hard gate missing')
if auth.get('hard_gates', {}).get('k19_title_card_must_not_change_k18_audio_or_handoff') is not True:
    errors.append('K19 K18-audio/handoff preservation hard gate missing')
title_timing = auth.get('auryi', {}).get('aurora_title_card_timing', {})
if title_timing != {'show': 0.08, 'fade_out': 1.28, 'hide': 1.55}:
    errors.append(f'K19 title-card timing drift: {title_timing}')
if float(title_timing.get('hide', 99)) > 1.55:
    errors.append('K19 title card remains visible into Aurora Growth')
if auth.get('auryi', {}).get('aurora_title_card_sha256') != title_expected[1]:
    errors.append('K19 title-card SHA missing/drifted in machine authority')
'''
pre = replace_once(pre, anchor, k19_guard, 'K19 preflight insertion anchor')
PREFLIGHT.write_text(pre, encoding='utf-8')

# ------------------------------------------------------------------
# 4. Keep the human ledgers automatically synchronized with the exact title card.
# ------------------------------------------------------------------
sync = SYNC.read_text(encoding='utf-8')
sync = replace_once(
    sync,
    "    beat = aur.get('aurora_beauty_sync', {})\n    device = auth.get('device_evidence', {})\n",
    "    beat = aur.get('aurora_beauty_sync', {})\n"
    "    title_beat = aur.get('aurora_title_card_timing', {})\n"
    "    device = auth.get('device_evidence', {})\n",
    'sync title timing variable',
)
sync = replace_once(
    sync,
    "- **Primary live presentation:** exact `Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4` inside the Hybrid/K adapter. Verified 1920×1080 H.264, 24 FPS, 7.375s, SHA-256 `e70fc0f987646b1c1428c8797c0d95e8a38c2327448d3607826febb1e0065b1a`.\n",
    "- **Primary live presentation:** exact `Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4` inside the Hybrid/K adapter. Verified 1920×1080 H.264, 24 FPS, 7.375s, SHA-256 `e70fc0f987646b1c1428c8797c0d95e8a38c2327448d3607826febb1e0065b1a`.\n"
    "- **Approved move-title card:** exact `Auryi_AuroraPulse_TitleCard_Approved.png`, 1672×941 PNG, SHA-256 `455276790353db64f997326e8caf9d00cc096d8179c299e2f49eb57cb8c91ccb`; show {title_beat.get('show', 0.08):.2f}s -> fade {title_beat.get('fade_out', 1.28):.2f}s -> hidden {title_beat.get('hide', 1.55):.2f}s before Aurora Growth.\n",
    'sync current Aurora title-card line',
)
sync = replace_once(
    sync,
    "- LIVE28K15 core presentation remains recorded as passed: choir audible = {device.get('live28k15_celestial_bloom_audible', False)}; demo tail absent = {device.get('live28k15_demo_tail_absent', False)}.\n",
    "- LIVE28K18 core presentation is recorded as passed: boot clean = {device.get('live28k18_boot_clean', False)}; Bloom audible = {device.get('live28k18_celestial_bloom_audible', False)}; battlefield/enemy handoff accepted = {device.get('live28k18_battlefield_enemy_handoff_accepted', False)}.\n",
    'sync latest accepted phone baseline',
)
sync = replace_once(
    sync,
    "- K15 baseline: core Beauty presentation passed, Celestial Bloom audible, demo tail absent.\n",
    "- K18 baseline: core Beauty presentation, native Celestial Bloom, and live battlefield/enemy handoff passed on iPhone.\n"
    "- K19 title polish: exact approved PNG title card overlays early Invocation and is hidden by 1.55s before Aurora Growth.\n",
    'resume Aurora baseline/title line',
)
SYNC.write_text(sync, encoding='utf-8')

print('LIVE28K19 exact Aurora Pulse title-card corrections staged')
