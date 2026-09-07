#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCENE = ROOT / 'src/prizim/Live28K2PartyBattleScene.js'
PREFLIGHT = ROOT / 'tools/prizim/preflight_live28k.py'
SYNC = ROOT / 'tools/prizim/sync_live_authority.py'
AUTH = ROOT / 'PV_LIVE_AUTHORITY.json'


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'K16 patch refused: missing {label}')
    return text.replace(old, new, 1)


scene = SCENE.read_text(encoding='utf-8')
scene = replace_once(
    scene,
    "const AURORA_BEAUTY_TIMELINE = Object.freeze({ invocation: 0.70, silence: 4.56, pulse: 5.18, reconnect: 6.58, end: 6.65 });",
    "const AURORA_BEAUTY_TIMELINE = Object.freeze({ invocation: 0.70, silence: 4.56, pulse: 5.18, reveal: 6.08, impactReveal: 6.30, reconnect: 6.58, end: 6.65 });",
    'Beauty reconnect timeline',
)
scene = replace_once(
    scene,
    "  async _hideAuroraBeautyVideo(video, fadeMs = 90) {\n    if (!video) return;\n    video.style.opacity = '0';\n    await this._wait(fadeMs);\n    try { video.pause(); } catch (err) { /* ignore */ }\n    video.style.display = 'none';\n    try { video.currentTime = 0; } catch (err) { /* ignore */ }\n  }\n\n  async _playAuryiAuroraPulseBeauty(hero) {",
    "  async _hideAuroraBeautyVideo(video, fadeMs = 90) {\n    if (!video) return;\n    video.style.transition = `opacity ${Math.max(0, fadeMs)}ms linear`;\n    video.style.opacity = '0';\n    await this._wait(fadeMs);\n    try { video.pause(); } catch (err) { /* ignore */ }\n    video.style.display = 'none';\n    video.style.transition = 'opacity 90ms linear';\n    try { video.currentTime = 0; } catch (err) { /* ignore */ }\n  }\n\n  _beginAuroraBeautyBattlefieldReveal(video) {\n    if (!video) return;\n    // Blend the approved Beauty Pulse over the real Hybrid battlefield instead\n    // of cutting from full-screen video to gameplay in one frame.\n    video.style.transition = 'opacity 550ms cubic-bezier(0.22, 1, 0.36, 1)';\n    video.style.opacity = '0';\n  }\n\n  _playAuroraEnemyReconnectImpact(dmg, lethal) {\n    const view = this.enemyView;\n    const anchor = view?.container;\n    const sprite = view?.sprite;\n    if (!anchor) return;\n\n    const x = anchor.x;\n    const y = anchor.y - (sprite?.displayHeight || 140) * 0.52;\n    const r = Math.max(42, Math.min(this.scale.width, this.scale.height) * 0.085);\n    const core = this.add.circle(x, y, r * 0.62, 0xc48cff, 0.34)\n      .setDepth(31).setBlendMode(Phaser.BlendModes.ADD);\n    const ring = this.add.circle(x, y, r, 0x000000, 0)\n      .setStrokeStyle(6, 0xf6e8ff, 0.96).setDepth(31.1).setBlendMode(Phaser.BlendModes.ADD);\n    const echo = this.add.circle(x, y, r * 0.72, 0x000000, 0)\n      .setStrokeStyle(3, 0x82ffd8, 0.88).setDepth(31.2).setBlendMode(Phaser.BlendModes.ADD);\n    this.worldAdd([core, ring, echo]);\n    this.world?.bringToTop?.(core);\n    this.world?.bringToTop?.(ring);\n    this.world?.bringToTop?.(echo);\n\n    this.tweens.add({ targets: core, scale: 2.25, alpha: 0, duration: 360, ease: 'Cubic.easeOut', onComplete: () => core.destroy() });\n    this.tweens.add({ targets: ring, scale: 2.85, alpha: 0, duration: 430, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });\n    this.tweens.add({ targets: echo, scale: 3.45, alpha: 0, duration: 510, ease: 'Cubic.easeOut', onComplete: () => echo.destroy() });\n    this.cameras.main.shake(160, 0.0048, true);\n\n    // The logical HP change already happened on the 5.18s Pulse beat. This is\n    // deliberately the visible hit/recoil beat during the battlefield crossfade.\n    view.hit();\n    this._floatText(`-${dmg}`, '#FFE8A0');\n    if (lethal) {\n      this.time.delayedCall(185, () => {\n        view.die();\n        this.audio.enemyDefeat();\n      });\n    }\n  }\n\n  async _playAuryiAuroraPulseBeauty(hero) {",
    'Beauty hide/reveal helpers',
)
scene = replace_once(
    scene,
    "    let ownsBloom = false;\n    let impactResolved = false;",
    "    let ownsBloom = false;\n    let impactResolved = false;\n    let pendingImpact = null;",
    'pending live impact state',
)
scene = replace_once(
    scene,
    "        this._updateTargetCard();\n        this.enemyView.hit();\n        this._floatText(`-${dmg}`, '#FFE8A0');\n        this._setBanner(`${hero.name} uses ${hero.resonart.name} for ${dmg} damage!`);\n        this.audio.attackImpact(hero.id);\n        this.audio.enemyHit();\n        if (this.enemy.hp <= 0) {\n          this.enemyView.die();\n          this.audio.enemyDefeat();\n        }",
    "        this._updateTargetCard();\n        pendingImpact = { dmg, lethal: this.enemy.hp <= 0 };\n        this._setBanner(`${hero.name} uses ${hero.resonart.name} for ${dmg} damage!`);\n        this.audio.attackImpact(hero.id);\n        this.audio.enemyHit();",
    'hidden enemy impact removal',
)
scene = replace_once(
    scene,
    "      // The approved Beauty attack ends cleanly here. Do NOT show the baked\n      // placeholder/demo reconnect tail. The live Hybrid battlefield underneath\n      // already owns the real enemy, camera, HUD, and post-impact state.\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.reconnect);\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.end, 14000);",
    "      // Smooth Hybrid reconnect: the real battlefield begins bleeding through\n      // the tail of the Beauty Pulse, then the live enemy visibly takes the hit\n      // inside that crossfade. Never show the baked placeholder/demo reconnect.\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.reveal);\n      this._beginAuroraBeautyBattlefieldReveal(video);\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.impactReveal);\n      if (pendingImpact) this._playAuroraEnemyReconnectImpact(pendingImpact.dmg, pendingImpact.lethal);\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.reconnect);\n      await this._waitForAuroraBeautyTime(video, AURORA_BEAUTY_TIMELINE.end, 14000);",
    'smooth battlefield reconnect sequence',
)
SCENE.write_text(scene, encoding='utf-8')

# Machine authority: record K15 as the successful core presentation gate and K16
# as a handoff-only polish pass. Do not erase earlier K14 failure evidence.
auth = json.loads(AUTH.read_text(encoding='utf-8'))
aur = auth.setdefault('auryi', {})
aur['aurora_beauty_sync'] = {
    'battlefield_handoff': 0.0,
    'celestial_bloom_scheduled_from_user_gesture': 0.70,
    'compression_silence': 4.56,
    'pulse_release_and_damage_logic': 5.18,
    'battlefield_reveal_crossfade': 6.08,
    'live_enemy_visual_impact': 6.30,
    'live_battlefield_reconnect': 6.58,
    'beauty_video_hidden_before_demo_tail': 6.65,
}
aur['aurora_handoff_policy'] = (
    'Keep gameplay damage locked to the 5.18s Pulse beat, but reveal the real Hybrid battlefield '
    'through a 550ms Beauty-video crossfade beginning at 6.08s and show the live enemy hit/recoil '
    'plus prismatic impact at 6.30s before full reconnect. Never use the Beauty demo reconnect tail.'
)
evidence = auth.setdefault('device_evidence', {})
evidence['live28k15_celestial_bloom_audible'] = True
evidence['live28k15_demo_tail_absent'] = True
evidence['live28k15_core_aurora_presentation_passed'] = True
evidence['live28k15_remaining_issue'] = 'Needs smoother cinematic-to-battlefield handoff with the real enemy visibly affected during reconnect.'
evidence['live28k16_pending_iphone_validation'] = True
AUTH.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')

# Canonical preflight gains a K16 visual-handoff contract.
pre = PREFLIGHT.read_text(encoding='utf-8')
pre = replace_once(
    pre,
    "    'pulse: 5.18',\n    'reconnect: 6.58',\n    'end: 6.65'",
    "    'pulse: 5.18',\n    'reveal: 6.08',\n    'impactReveal: 6.30',\n    'reconnect: 6.58',\n    'end: 6.65'",
    'Beauty runtime timing tokens',
)
anchor = "if auth['auryi'].get('aurora_beauty_sync', {}).get('beauty_video_hidden_before_demo_tail') != 6.65:\n    errors.append('Aurora Beauty runtime is not locked to hide before the demo reconnect tail')\n"
addition = anchor + "\n# 8c. K16 handoff guard: battlefield must crossfade in before the demo tail and\n# the real live enemy reaction must be visible during that crossfade.\nfor token in [\n    '_beginAuroraBeautyBattlefieldReveal',\n    \"video.style.transition = 'opacity 550ms cubic-bezier(0.22, 1, 0.36, 1)'\",\n    '_playAuroraEnemyReconnectImpact',\n    'pendingImpact = { dmg, lethal: this.enemy.hp <= 0 }',\n    'AURORA_BEAUTY_TIMELINE.reveal',\n    'AURORA_BEAUTY_TIMELINE.impactReveal',\n]:\n    if token not in k_scene:\n        errors.append(f'K16 Aurora battlefield handoff token missing: {token}')\nsync = auth['auryi'].get('aurora_beauty_sync', {})\nif sync.get('battlefield_reveal_crossfade') != 6.08:\n    errors.append('K16 Aurora battlefield reveal must begin at 6.08s')\nif sync.get('live_enemy_visual_impact') != 6.30:\n    errors.append('K16 Aurora live enemy visual impact must occur at 6.30s')\nif 'real Hybrid battlefield' not in auth['auryi'].get('aurora_handoff_policy', ''):\n    errors.append('K16 Aurora Hybrid handoff policy missing from machine authority')\n"
pre = replace_once(pre, anchor, addition, 'K16 preflight insertion point')
PREFLIGHT.write_text(pre, encoding='utf-8')

# Make the human PriZim lane derive its live timings from machine authority so
# later timing changes cannot silently leave the notepad behind again.
sync_text = SYNC.read_text(encoding='utf-8')
pattern = re.compile(r"    current_aurora = '''## Auryi Resonart / Aurora Pulse current lane.*?'''\n", re.S)
if not pattern.search(sync_text):
    raise SystemExit('K16 patch refused: current_aurora block not found in sync script')
replacement = '''    aur = auth.get('auryi', {})\n    beat = aur.get('aurora_beauty_sync', {})\n    device = auth.get('device_evidence', {})\n    current_aurora = f\'''## Auryi Resonart / Aurora Pulse current lane\n\n- Basic Attack authority remains **Aurorb Slice**.\n- Resonart authority is **Aurora Pulse**.\n- Aurora Pulse live production belongs in the Hybrid/K adapter stack, not standalone `PartyBattleScene.js`.\n- Approved composition/timing reference: `pz-a-aurora-pulse-lab.html`.\n- **Primary live presentation:** exact `Auryi_AuroraPulse_Resonart_Beauty_v1_1080p.mp4` inside the Hybrid/K adapter. Verified 1920×1080 H.264, 24 FPS, 7.375s, SHA-256 `e70fc0f987646b1c1428c8797c0d95e8a38c2327448d3607826febb1e0065b1a`.\n- Live sync is derived from `PV_LIVE_AUTHORITY.json`: Bloom {beat.get('celestial_bloom_scheduled_from_user_gesture', 0.70):.2f}s -> silence {beat.get('compression_silence', 4.56):.2f}s -> Pulse/damage logic {beat.get('pulse_release_and_damage_logic', 5.18):.2f}s -> battlefield reveal {beat.get('battlefield_reveal_crossfade', 6.08):.2f}s -> live enemy impact {beat.get('live_enemy_visual_impact', 6.30):.2f}s -> reconnect {beat.get('live_battlefield_reconnect', 6.58):.2f}s -> Beauty hidden {beat.get('beauty_video_hidden_before_demo_tail', 6.65):.2f}s.\n- The real Hybrid battlefield owns the final handoff and enemy reaction; the Beauty master\'s baked demo reconnect tail is never displayed.\n- The Phaser Aurora mock is fail-safe presentation only if native video playback fails. The old Aurorb Slice pose sequence is never an Aurora Pulse fallback.\n- Celestial Bloom owns the cinematic foreground mix; normal battle BGM clears underneath it.\n- Triumph of Light loops while the victory/results screen remains open.\n- Aurora Pulse itself remains **crownless**.\n- LIVE28K15 phone evidence: choir audible = {device.get('live28k15_celestial_bloom_audible', False)}; demo tail absent = {device.get('live28k15_demo_tail_absent', False)}; core presentation passed = {device.get('live28k15_core_aurora_presentation_passed', False)}.\n- Current pending gate: smoother Beauty-to-live battlefield crossfade with visible enemy impact.\n- Future non-Aurora crown authority: match the Main Splash Screen crown as a **hovered/offset element above Auryi**, not head-worn.\n\'''\n'''
sync_text = pattern.sub(replacement, sync_text, count=1)

# Add/update a compact Aurora device gate in the resume anchor on every sync.
resume_hook = "    RESUME_PATH.write_text(resume, encoding='utf-8')\n"
resume_block = "    aurora_gate = f'''## Aurora Pulse live device gate\\n\\n- Current witness: `{witness}`.\\n- K15 phone result: core Beauty presentation passed, Celestial Bloom audible, demo tail absent.\\n- Pending K16 gate: smooth Beauty-to-live battlefield crossfade with real enemy hit/recoil visible during reconnect.\\n- Machine timing authority: `PV_LIVE_AUTHORITY.json` -> `auryi.aurora_beauty_sync`.\\n'''\n    if '## Aurora Pulse live device gate' in resume:\n        resume = replace_section(resume, '## Aurora Pulse live device gate', aurora_gate)\n    else:\n        marker = '\\n## Hard constraints'\n        if marker in resume:\n            resume = resume.replace(marker, '\\n' + aurora_gate + marker, 1)\n        else:\n            resume += '\\n\\n' + aurora_gate\n\n" + resume_hook
sync_text = replace_once(sync_text, resume_hook, resume_block, 'resume Aurora gate hook')
SYNC.write_text(sync_text, encoding='utf-8')

print('LIVE28K16 Aurora battlefield handoff corrections staged')
