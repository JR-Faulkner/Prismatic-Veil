#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCENE = ROOT / 'src/prizim/Live28K2PartyBattleScene.js'
AUDIO = ROOT / 'src/PartyBattleAudioController.js'
PREFLIGHT = ROOT / 'tools/prizim/preflight_live28k.py'
SYNC = ROOT / 'tools/prizim/sync_live_authority.py'
AUTH = ROOT / 'PV_LIVE_AUTHORITY.json'


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'K20 patch refused: missing {label}')
    return text.replace(old, new, 1)


def regex_once(text: str, pattern: str, replacement: str, label: str) -> str:
    out, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'K20 patch refused: {label} matched {count} times')
    return out


# ------------------------------------------------------------------
# 1. Hybrid/K scene: retire K19 title presentation and let Hybrid direct
#    the exact Beauty V1 master with camera/framing/reconnect choreography.
# ------------------------------------------------------------------
scene = SCENE.read_text(encoding='utf-8')

scene = replace_once(
    scene,
    "const AURORA_TITLE_CARD_READY = true;\n"
    "const AURORA_TITLE_CARD_PATH = './assets/characters/auryi/animations/aurora_pulse/cinematic/Auryi_AuroraPulse_TitleCard_Approved.png?pvasset=live28k19-title';\n"
    "const AURORA_TITLE_CARD_TIMING = Object.freeze({ show: 0.08, fadeOut: 1.28, hide: 1.55 });\n",
    '',
    'K19 title constants',
)

scene = replace_once(
    scene,
    "    // Prewarm the exact Beauty V1 cinematic and approved move-title PNG inside\n"
    "    // the live Hybrid/K scene. K19 is presentation-only; K18 audio/handoff stay intact.\n"
    "    this._prepareAuroraBeautyVideo();\n"
    "    this._prepareAuroraTitleCard();\n"
    "    this.events.once('shutdown', () => {\n"
    "      this._disposeAuroraBeautyVideo();\n"
    "      this._disposeAuroraTitleCard();\n"
    "    });\n",
    "    // K20: prewarm only the exact Beauty V1 motion master. Hybrid owns the\n"
    "    // cinematic camera/framing/reconnect; no move-title overlay is shown.\n"
    "    this._prepareAuroraBeautyVideo();\n"
    "    this.events.once('shutdown', () => this._disposeAuroraBeautyVideo());\n",
    'K19 prewarm/title cleanup block',
)

scene = regex_once(
    scene,
    r"\n  _prepareAuroraTitleCard\(\) \{.*?\n  _disposeAuroraBeautyVideo\(\) \{",
    "\n  _disposeAuroraBeautyVideo() {",
    'K19 title methods',
)

# The fallback/mock remains a fail-safe only. Its old in-cinematic text title is
# intentionally blank as well so Aurora Pulse never flashes a move-name card.
scene = replace_once(
    scene,
    "'RESONART\\nAURORA PULSE'",
    "''",
    'fallback cinematic title text',
)

scene = replace_once(
    scene,
    "      display: 'none',\n"
    "      transition: 'opacity 90ms linear'\n",
    "      display: 'none',\n"
    "      transform: 'scale(1.018)',\n"
    "      transformOrigin: '50% 50%',\n"
    "      filter: 'brightness(0.96) contrast(1.04) saturate(1.04)',\n"
    "      willChange: 'opacity, transform, filter',\n"
    "      transition: 'opacity 120ms linear, transform 620ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease'\n",
    'Beauty DOM cinematic style',
)

scene = replace_once(
    scene,
    "    video.style.display = 'none';\n"
    "    video.style.transition = 'opacity 90ms linear';\n"
    "    try { video.currentTime = 0; } catch (err) { /* ignore */ }\n"
    "  }\n\n"
    "  _beginAuroraBeautyBattlefieldReveal(video) {",
    "    video.style.display = 'none';\n"
    "    video.style.transform = 'scale(1.018)';\n"
    "    video.style.filter = 'brightness(0.96) contrast(1.04) saturate(1.04)';\n"
    "    video.style.transition = 'opacity 120ms linear, transform 620ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease';\n"
    "    try { video.currentTime = 0; } catch (err) { /* ignore */ }\n"
    "  }\n\n"
    "  async _runAuroraBeautyDirector(video) {\n"
    "    if (!video) return;\n"
    "    // Hybrid is the director; Beauty V1 remains the exact motion master.\n"
    "    video.style.transition = 'opacity 180ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease';\n"
    "    video.style.transform = 'scale(1.035)';\n"
    "    video.style.filter = 'brightness(0.92) contrast(1.06) saturate(0.96)';\n"
    "\n"
    "    await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.invocation);\n"
    "    video.style.transform = 'scale(1.025)';\n"
    "    video.style.filter = 'brightness(1.00) contrast(1.05) saturate(1.04)';\n"
    "\n"
    "    await this._waitForAuroraBeautyTime(video, 1.55);\n"
    "    video.style.transition = 'opacity 180ms ease, transform 900ms cubic-bezier(0.22, 1, 0.36, 1), filter 380ms ease';\n"
    "    video.style.transform = 'scale(1.010)';\n"
    "    video.style.filter = 'brightness(1.03) contrast(1.04) saturate(1.07)';\n"
    "\n"
    "    await this._waitForAuroraBeautyTime(video, 2.45);\n"
    "    video.style.transform = 'scale(1.000)';\n"
    "    video.style.filter = 'brightness(1.05) contrast(1.03) saturate(1.08)';\n"
    "\n"
    "    await this._waitForAuroraBeautyTime(video, 3.35);\n"
    "    video.style.transition = 'opacity 180ms ease, transform 540ms cubic-bezier(0.55, 0, 1, 0.45), filter 300ms ease';\n"
    "    video.style.transform = 'scale(1.028)';\n"
    "\n"
    "    await this._waitForAuroraBeautyTime(video, 4.15);\n"
    "    video.style.transition = 'opacity 180ms ease, transform 260ms cubic-bezier(0.55, 0, 1, 0.45), filter 180ms ease';\n"
    "    video.style.transform = 'scale(1.058)';\n"
    "    video.style.filter = 'brightness(0.91) contrast(1.09) saturate(0.98)';\n"
    "\n"
    "    await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.silence);\n"
    "    video.style.transition = 'opacity 90ms linear, transform 90ms linear, filter 90ms linear';\n"
    "    video.style.transform = 'scale(1.066)';\n"
    "    video.style.filter = 'brightness(0.82) contrast(1.11) saturate(0.88)';\n"
    "\n"
    "    await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.pulse);\n"
    "    video.style.transition = 'opacity 120ms linear, transform 150ms cubic-bezier(0.22, 1, 0.36, 1), filter 140ms ease';\n"
    "    video.style.transform = 'scale(1.016)';\n"
    "    video.style.filter = 'brightness(1.18) contrast(1.05) saturate(1.14)';\n"
    "  }\n\n"
    "  _playAuroraBattlefieldAfterglow() {\n"
    "    const w = this.scale.width;\n"
    "    const h = this.scale.height;\n"
    "    const wash = this.add.rectangle(w * 0.5, h * 0.5, w * 1.5, h * 1.5, 0xf5ecff, 0.30)\n"
    "      .setDepth(30.7).setBlendMode(Phaser.BlendModes.ADD);\n"
    "    const sweep = this.add.ellipse(w * 0.56, h * 0.47, w * 1.26, h * 0.74, 0xb58cff, 0.17)\n"
    "      .setDepth(30.6).setAngle(-12).setBlendMode(Phaser.BlendModes.ADD);\n"
    "    wash.setScrollFactor?.(0);\n"
    "    sweep.setScrollFactor?.(0);\n"
    "    this.worldAdd([wash, sweep]);\n"
    "    this.world?.bringToTop?.(sweep);\n"
    "    this.world?.bringToTop?.(wash);\n"
    "    this.tweens.add({ targets: wash, alpha: 0, duration: 430, ease: 'Cubic.easeOut', onComplete: () => wash.destroy() });\n"
    "    this.tweens.add({ targets: sweep, scaleX: 1.12, scaleY: 1.18, alpha: 0, duration: 560, ease: 'Cubic.easeOut', onComplete: () => sweep.destroy() });\n"
    "  }\n\n"
    "  _restoreAuroraBeautyDirector(heroId, cameraState) {\n"
    "    this.formation.setPovFocus?.(heroId, false);\n"
    "    const cam = this.cameras.main;\n"
    "    if (!cam || !cameraState) return;\n"
    "    this.tweens.killTweensOf(cam);\n"
    "    this.tweens.add({\n"
    "      targets: cam,\n"
    "      zoom: cameraState.zoom,\n"
    "      scrollX: cameraState.scrollX,\n"
    "      scrollY: cameraState.scrollY,\n"
    "      duration: 220,\n"
    "      ease: 'Sine.easeOut'\n"
    "    });\n"
    "  }\n\n"
    "  _beginAuroraBeautyBattlefieldReveal(video) {",
    'Beauty hide/director insertion anchor',
)

scene = replace_once(
    scene,
    "    // Blend the approved Beauty Pulse over the real Hybrid battlefield instead\n"
    "    // of cutting from full-screen video to gameplay in one frame.\n"
    "    video.style.transition = 'opacity 550ms cubic-bezier(0.22, 1, 0.36, 1)';\n"
    "    video.style.opacity = '0';\n",
    "    // K20: the Pulse itself carries the viewer back into the real Hybrid\n"
    "    // battlefield. The slight push/bloom turns the crossfade into a wave exit.\n"
    "    video.style.transition = 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease';\n"
    "    video.style.transform = 'scale(1.065)';\n"
    "    video.style.filter = 'brightness(1.24) contrast(1.02) saturate(1.12)';\n"
    "    video.style.opacity = '0';\n",
    'K16 Beauty battlefield reveal body',
)

scene = replace_once(
    scene,
    "  async _playAuryiAuroraPulseBeauty(hero) {\n"
    "    const video = this._prepareAuroraBeautyVideo();\n"
    "    const titleCard = this._prepareAuroraTitleCard();\n"
    "    if (!video) return false;\n",
    "  async _playAuryiAuroraPulseBeauty(hero) {\n"
    "    const video = this._prepareAuroraBeautyVideo();\n"
    "    if (!video) return false;\n",
    'Beauty title-card declaration',
)

scene = replace_once(
    scene,
    "    let ownsBloom = false;\n"
    "    let impactResolved = false;\n"
    "    let pendingImpact = null;\n\n"
    "    this.audio.beginCinematicAttack?.();\n",
    "    let ownsBloom = false;\n"
    "    let impactResolved = false;\n"
    "    let pendingImpact = null;\n"
    "    const cam = this.cameras.main;\n"
    "    const cameraState = { zoom: cam.zoom, scrollX: cam.scrollX, scrollY: cam.scrollY };\n\n"
    "    this.audio.beginCinematicAttack?.();\n",
    'Beauty camera-state anchor',
)

scene = replace_once(
    scene,
    "    try {\n"
    "      video.pause();\n",
    "    try {\n"
    "      // Let the live battlefield hold for one last beat while the camera\n"
    "      // commits to Auryi, then let Beauty take over without a static card.\n"
    "      this.tweens.killTweensOf(cam);\n"
    "      this.tweens.add({ targets: cam, zoom: cameraState.zoom * 1.05, duration: 170, ease: 'Sine.easeOut' });\n"
    "      await this._wait(110);\n"
    "      this.formation.setPovFocus?.(hero.id, true);\n"
    "      video.pause();\n",
    'Beauty pre-cinematic POV handoff',
)

scene = replace_once(
    scene,
    "      video.style.display = 'block';\n"
    "      video.style.opacity = '0';\n"
    "      const playPromise = video.play();\n"
    "      if (playPromise) await playPromise;\n"
    "      requestAnimationFrame(() => { video.style.opacity = '1'; });\n"
    "      const titleCardTask = this._runAuroraTitleCardSequence(video, titleCard)\n"
    "        .catch(err => console.warn('[PV] Aurora Pulse title-card sequence skipped:', err));\n",
    "      video.style.display = 'block';\n"
    "      video.style.opacity = '0';\n"
    "      video.style.transform = 'scale(1.035)';\n"
    "      const playPromise = video.play();\n"
    "      if (playPromise) await playPromise;\n"
    "      requestAnimationFrame(() => { video.style.opacity = '1'; });\n"
    "      const directorTask = this._runAuroraBeautyDirector(video)\n"
    "        .catch(err => console.warn('[PV] Aurora Pulse Hybrid director skipped:', err));\n",
    'Beauty title sequence -> director sequence',
)

scene = replace_once(
    scene,
    "      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.impactReveal);\n"
    "      if (pendingImpact) this._playAuroraEnemyReconnectImpact(pendingImpact.dmg, pendingImpact.lethal);\n",
    "      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.impactReveal);\n"
    "      this.audio.auroraReentryWave?.();\n"
    "      this._playAuroraBattlefieldAfterglow();\n"
    "      if (pendingImpact) this._playAuroraEnemyReconnectImpact(pendingImpact.dmg, pendingImpact.lethal);\n",
    'battlefield re-entry wave/afterglow beat',
)

scene = replace_once(
    scene,
    "      this.audio.endCinematicAttack?.();\n"
    "      await this._hideAuroraTitleCard(titleCard, 40);\n"
    "      await this._hideAuroraBeautyVideo(video, 40);\n",
    "      this.audio.endCinematicAttack?.();\n"
    "      await this._hideAuroraBeautyVideo(video, 40);\n"
    "      this._restoreAuroraBeautyDirector(hero.id, cameraState);\n",
    'Beauty failure title cleanup -> director restore',
)

scene = replace_once(
    scene,
    "    if (ownsBloom) this.audio.auroraBloomStop?.(120);\n"
    "    await this._hideAuroraTitleCard(titleCard, 0);\n"
    "    await this._hideAuroraBeautyVideo(video, 90);\n"
    "    this.audio.endCinematicAttack?.();\n",
    "    if (ownsBloom) this.audio.auroraBloomStop?.(120);\n"
    "    await this._hideAuroraBeautyVideo(video, 90);\n"
    "    this._restoreAuroraBeautyDirector(hero.id, cameraState);\n"
    "    this.audio.endCinematicAttack?.();\n",
    'Beauty success title cleanup -> director restore',
)

SCENE.write_text(scene, encoding='utf-8')


# ------------------------------------------------------------------
# 2. Audio: create a broad re-entry wave from Auryi's existing production
#    bank. No new binary and no change to the exact native M4A lane.
# ------------------------------------------------------------------
audio = AUDIO.read_text(encoding='utf-8')
audio = replace_once(
    audio,
    "  uiMove() { this._play('uiMove'); }\n",
    "  auroraReentryWave() {\n"
    "    // K20 battlefield-return wave: layer Auryi's existing production bank\n"
    "    // at lower rates for a broad energy front, then give it a body transient.\n"
    "    // Celestial Bloom itself remains the untouched exact native M4A master.\n"
    "    this._duckMusic(0.34, 460);\n"
    "    this._playLayer({ key: 'pb_hero_auryi_release', volumeMul: 0.92, rate: 0.72 }, 'sfx');\n"
    "    this._playLayer({ key: 'pb_hero_auryi_idlePulse', volumeMul: 0.56, rate: 0.62, delayMs: 28 }, 'sfx');\n"
    "    this._playLayer({ key: 'pb_hero_auryi_impact', volumeMul: 0.88, rate: 0.82, delayMs: 72 }, 'sfx');\n"
    "  }\n\n"
    "  uiMove() { this._play('uiMove'); }\n",
    'audio public-method insertion anchor',
)
AUDIO.write_text(audio, encoding='utf-8')


# ------------------------------------------------------------------
# 3. Machine authority: record K19 rejection and define K20 hard gates.
# ------------------------------------------------------------------
auth = json.loads(AUTH.read_text(encoding='utf-8'))
auth['updated'] = '2026-09-07'
hard = auth.setdefault('hard_gates', {})
for key in [
    'aurora_title_card_exact_png_required',
    'aurora_title_card_must_hide_before_growth',
    'k19_title_card_must_not_change_k18_audio_or_handoff',
]:
    hard.pop(key, None)
hard['aurora_runtime_title_forbidden'] = True
hard['aurora_hybrid_director_required'] = True
hard['aurora_reentry_wave_required'] = True
hard['aurora_reentry_live_enemy_reaction_required'] = True
hard['k20_must_preserve_k18_native_m4a_lane'] = True
hard['k20_must_preserve_beauty_exact_master'] = True

aur = auth.setdefault('auryi', {})
aur['aurora_presentation'] = (
    'Beauty V1 exact master staged by the K20 Hybrid cinematic director; no move-title overlay; '
    'Pulse-driven battlefield reconnect with live enemy reaction and residual Aurora afterglow.'
)
aur['aurora_title_card_runtime_enabled'] = False
aur['aurora_title_card_policy'] = (
    'Retained only as an archived visual/reference asset. It is not loaded, displayed, or required '
    'by the Aurora Pulse runtime after K19 phone review.'
)
aur['aurora_cinematic_director_policy'] = (
    'Hybrid owns presentation around the exact Beauty V1 master: brief live-camera commitment to Auryi, '
    'subtle invocation push, wider perceived Aurora scale, compression push-in, silent frozen tension, '
    'Pulse snap, then a wave-driven reveal of the real battlefield. Do not re-encode or upscale Beauty V1.'
)
aur['aurora_handoff_policy'] = (
    'Keep gameplay damage locked to the 5.18s Pulse beat. Begin the Pulse-driven reveal of the real Hybrid battlefield '
    'at 6.08s; at 6.30s fire the Auryi re-entry wave, residual Aurora afterglow, and live enemy hit/recoil; '
    'restore live battlefield ownership by 6.58s and hide Beauty before 6.65s. Never show the Beauty demo tail.'
)
aur['aurora_reentry_wave_policy'] = (
    'At 6.30s layer Auryi production release + idlePulse + impact cues at lower rates to create a broad '
    'wave-blast synchronized to battlefield re-entry. No new binary and no modification to Celestial Bloom M4A.'
)
aur.setdefault('aurora_beauty_sync', {})['battlefield_reentry_wave'] = 6.30

evidence = auth.setdefault('device_evidence', {})
evidence['live28k19_pending_iphone_validation'] = False
evidence['live28k19_title_presentation_rejected'] = True
evidence['live28k19_result'] = (
    'REJECT presentation gate: the full-screen title card interrupted Aurora Pulse and reduced cinematic '
    'continuity. User requested the move name removed entirely and the Hybrid transition/camera/reconnect presentation upgraded.'
)
evidence['latest_device_witness'] = 'main-20260907-live28k19'
evidence['latest_device_result'] = evidence['live28k19_result']
evidence['pending_witness'] = 'main-20260907-live28k20'
evidence['pending_iphone_validation'] = True
evidence['live28k20_pending_iphone_validation'] = True
evidence['pending_gate_summary'] = (
    'LIVE28K20: no cinematic move-title card; smoother live battlefield-to-Beauty camera commitment; stronger '
    'expansion/compression/Pulse framing; Auryi wave-blast on battlefield return; live Wraith reaction and residual '
    'Aurora afterglow remain integrated, while K18 native M4A/boot reliability and exact Beauty V1 stay unchanged.'
)
AUTH.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')


# ------------------------------------------------------------------
# 4. Canonical preflight: retire K19 title requirement and enforce K20.
# ------------------------------------------------------------------
pre = PREFLIGHT.read_text(encoding='utf-8')
k20_guard = r'''# 8f. K20 Hybrid cinematic-director guard. K19's full-screen move-title card
# is retired from runtime. Beauty V1 and the exact native M4A lane stay immutable.
for forbidden in [
    'AURORA_TITLE_CARD_READY',
    'AURORA_TITLE_CARD_PATH',
    'AURORA_TITLE_CARD_TIMING',
    '_prepareAuroraTitleCard',
    '_runAuroraTitleCardSequence',
    "'RESONART\\nAURORA PULSE'",
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
'''
pre = regex_once(
    pre,
    r"# 8f\. K19 exact move-title guard:.*?(?=bloom_policy = auth\['auryi'\]\.get\('aurora_bloom_mix_policy', ''\))",
    k20_guard,
    'K19 preflight guard replacement',
)
PREFLIGHT.write_text(pre, encoding='utf-8')


# ------------------------------------------------------------------
# 5. Authority synchronizer: make PriZim/resume describe K20, not K19.
# ------------------------------------------------------------------
sync = SYNC.read_text(encoding='utf-8')
sync = sync.replace("    title_beat = aur.get('aurora_title_card_timing', {})\n", '', 1)
sync = replace_once(
    sync,
    "- **Approved move-title card:** exact `Auryi_AuroraPulse_TitleCard_Approved.png`, 1672×941 PNG, SHA-256 `455276790353db64f997326e8caf9d00cc096d8179c299e2f49eb57cb8c91ccb`; show {title_beat.get('show', 0.08):.2f}s -> fade {title_beat.get('fade_out', 1.28):.2f}s -> hidden {title_beat.get('hide', 1.55):.2f}s before Aurora Growth.\n",
    "- **K20 cinematic presentation:** no move-title card. Hybrid directs the exact Beauty V1 master with live-camera commitment, expansion/compression framing, Pulse-driven reconnect, Auryi re-entry wave, live enemy reaction, and residual Aurora afterglow.\n"
    "- The K19 title-card PNG is retained as an archived/reference asset only and is not loaded by Aurora Pulse runtime.\n",
    'PriZim title-card summary line',
)
sync = replace_once(
    sync,
    "- K19 title polish: exact approved PNG title card overlays early Invocation and is hidden by 1.55s before Aurora Growth.",
    "- K19 phone review: full-screen title presentation was rejected because it interrupted cinematic continuity.\n"
    "- K20 presentation: title removed; Hybrid camera/framing and Pulse-driven battlefield re-entry are the active polish lane.\n",
    'resume K19 title line',
)
SYNC.write_text(sync, encoding='utf-8')

print('LIVE28K20 Aurora Pulse presentation patch applied.')
