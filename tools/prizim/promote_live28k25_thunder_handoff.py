#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
scene_path = ROOT / 'src/prizim/Live28K2PartyBattleScene.js'
scene = scene_path.read_text(encoding='utf-8')

old = '''  _createThunderTornadoLivePass() {
    const w = this.scale.width;
    const h = this.scale.height;
    const enemyX = this.enemyView?.container?.x ?? w * 0.76;
    const enemyY = this.enemyView?.container?.y ?? h * 0.55;
    const startX = w * 0.18;
    const startY = enemyY - h * 0.04;
    const core = this.add.ellipse(startX, startY, w * 0.30, h * 0.13, 0x86ffac, 0.42)
      .setDepth(28).setBlendMode(Phaser.BlendModes.ADD);
    const shellA = this.add.ellipse(startX - w * 0.03, startY, w * 0.34, h * 0.18, 0x000000, 0)
      .setStrokeStyle(Math.max(3, h * 0.010), 0x41ff75, 0.92).setDepth(28.1).setAngle(-8)
      .setBlendMode(Phaser.BlendModes.ADD);
    const shellB = this.add.ellipse(startX - w * 0.06, startY, w * 0.40, h * 0.22, 0x000000, 0)
      .setStrokeStyle(Math.max(2, h * 0.006), 0xd8ffe0, 0.78).setDepth(28.2).setAngle(9)
      .setBlendMode(Phaser.BlendModes.ADD);
    const flash = this.add.ellipse(startX, startY, w * 0.13, h * 0.09, 0xf2fff3, 0.62)
      .setDepth(28.3).setBlendMode(Phaser.BlendModes.ADD);
    const objects = [core, shellA, shellB, flash];
    this.worldAdd(objects);
    objects.forEach((obj, i) => {
      this.tweens.add({
        targets: obj,
        x: enemyX + w * (0.20 + i * 0.015),
        scaleX: 1.15 + i * 0.06,
        scaleY: 0.88 + i * 0.04,
        angle: obj.angle + (i % 2 ? 38 : -34),
        duration: 520 + i * 25,
        ease: 'Cubic.easeIn'
      });
    });
    return { objects, enemyX, enemyY };
  }
'''

new = '''  _createThunderTornadoLivePass() {
    const w = this.scale.width;
    const h = this.scale.height;
    const enemyX = this.enemyView?.container?.x ?? w * 0.76;
    const enemyY = this.enemyView?.container?.y ?? h * 0.55;
    const startX = w * 0.16;
    const startY = enemyY - h * 0.035;

    // LIVE28K25: preserve the cinematic tornado's readable funnel language on
    // the live battlefield. The old continuation was a broad green wash; this
    // version is a narrower white-hot core wrapped by separated emerald spiral
    // bands so it reads as the SAME tornado continuing through the real enemy.
    const core = this.add.ellipse(startX, startY, w * 0.19, h * 0.075, 0xbfffd0, 0.24)
      .setDepth(28).setBlendMode(Phaser.BlendModes.ADD);
    const hotCore = this.add.ellipse(startX + w * 0.018, startY, w * 0.075, h * 0.045, 0xf4fff5, 0.68)
      .setDepth(28.45).setBlendMode(Phaser.BlendModes.ADD);
    const spiralA = this.add.ellipse(startX - w * 0.018, startY, w * 0.235, h * 0.105, 0x000000, 0)
      .setStrokeStyle(Math.max(2, h * 0.0065), 0x42ff72, 0.92).setDepth(28.1).setAngle(-16)
      .setBlendMode(Phaser.BlendModes.ADD);
    const spiralB = this.add.ellipse(startX - w * 0.045, startY, w * 0.275, h * 0.135, 0x000000, 0)
      .setStrokeStyle(Math.max(2, h * 0.0048), 0xd9ffe1, 0.74).setDepth(28.2).setAngle(12)
      .setBlendMode(Phaser.BlendModes.ADD);
    const spiralC = this.add.ellipse(startX - w * 0.075, startY, w * 0.315, h * 0.165, 0x000000, 0)
      .setStrokeStyle(Math.max(1.5, h * 0.0038), 0x2eea62, 0.66).setDepth(28.05).setAngle(-7)
      .setBlendMode(Phaser.BlendModes.ADD);
    const lightning = this.add.ellipse(startX - w * 0.012, startY, w * 0.145, h * 0.055, 0x000000, 0)
      .setStrokeStyle(Math.max(1.5, h * 0.0035), 0xf0fff2, 0.88).setDepth(28.35).setAngle(4)
      .setBlendMode(Phaser.BlendModes.ADD);

    const objects = [core, spiralC, spiralB, spiralA, lightning, hotCore];
    this.worldAdd(objects);

    const travelX = enemyX + w * 0.25;
    objects.forEach((obj, i) => {
      const outer = i > 0 && i < 4;
      this.tweens.add({
        targets: obj,
        x: travelX + w * (i * 0.008),
        scaleX: outer ? 1.12 + i * 0.035 : 1.06,
        scaleY: outer ? 0.90 + i * 0.018 : 0.84,
        angle: obj.angle + (i % 2 ? 62 : -58),
        alpha: outer ? 0.78 : obj.alpha,
        duration: 430 + i * 18,
        ease: 'Cubic.easeIn'
      });
    });

    // A brief compression as the live funnel crosses the enemy gives stronger
    // forward velocity without covering the battlefield in opaque green.
    this.tweens.add({
      targets: [core, hotCore],
      scaleX: 1.24,
      scaleY: 0.72,
      duration: 360,
      ease: 'Quad.easeIn'
    });

    return { objects, enemyX, enemyY };
  }
'''

if old not in scene:
    raise SystemExit('LIVE28K25 Thunder Tornado live-pass anchor missing')
scene = scene.replace(old, new, 1)

marker = "const THUNDER_TORNADO_HIT_CHANCE = 0.92;"
replacement = "const THUNDER_TORNADO_HIT_CHANCE = 0.92;\nconst THUNDER_TORNADO_LIVE_PASS_STYLE = 'structured-spiral-v2';"
if marker not in scene:
    raise SystemExit('LIVE28K25 style marker anchor missing')
scene = scene.replace(marker, replacement, 1)
scene_path.write_text(scene, encoding='utf-8')

witness = 'main-20260908-live28k25'
authp = ROOT / 'PV_LIVE_AUTHORITY.json'
auth = json.loads(authp.read_text(encoding='utf-8'))
auth['updated'] = '2026-09-08'
auth['witness'] = witness
hard = auth.setdefault('hard_gates', {})
hard['kineza_thunder_tornado_live_handoff_harmonized'] = True
k = auth.setdefault('kineza', {})
k['thunder_tornado_live_pass_style'] = 'structured-spiral-v2'
k['thunder_tornado_live_pass_visual_policy'] = (
    'Live continuation must preserve the cinematic funnel read: narrow luminous core, separated emerald/white spiral bands, '
    'reduced opaque green fill, and fast forward travel through the real enemy. It must not read as a full-screen green wash.'
)
dev = auth.setdefault('device_evidence', {})
dev['pending_witness'] = witness
dev['pending_iphone_validation'] = True
dev['live28k25_pending_iphone_validation'] = True
dev['pending_gate_summary'] = (
    'LIVE28K25: Thunder Tornado handoff harmonization only. Verify cinematic-to-live tornado continuity, narrower spiral structure, '
    'reduced green wash, clear real-enemy pass, unchanged damage/death/recovery/Victory behavior, and preserved LIVE28K23 Aurora V2.'
)
authp.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')

buildp = ROOT / 'live-build.json'
build = json.loads(buildp.read_text(encoding='utf-8'))
build['id'] = witness
buildp.write_text(json.dumps(build, indent=2) + '\n', encoding='utf-8')

for name in ['PRIZIM_LIVE_NOTEPAD.md', 'PV_RESUME_ANCHOR.md']:
    p = ROOT / name
    s = p.read_text(encoding='utf-8')
    if witness not in s:
        s += f'''\n\n## LIVE28K25 Thunder Tornado handoff harmonization\n\n- Current promoted witness: `{witness}`.\n- Scope is visual handoff only. Thunder Tornado cinematic master/timing/damage authority remain unchanged.\n- Live continuation style: `structured-spiral-v2`.\n- Narrow luminous core + separated emerald/white spiral bands + reduced opaque green wash + faster forward enemy pass.\n- Preserve K22 240ms lethal Kineza home settle and LIVE28K23 Aurora V2.\n- iPhone MAIN remains the final gate.\n'''
        p.write_text(s, encoding='utf-8')

pre = ROOT / 'tools/prizim/preflight_live28k.py'
s = pre.read_text(encoding='utf-8')
anchor = "if errors:\n    print('PRIZIM LIVE28K PREFLIGHT FAILED')"
insert = """if \"THUNDER_TORNADO_LIVE_PASS_STYLE = 'structured-spiral-v2'\" not in k_scene:\n    errors.append('K25 Thunder Tornado live-pass style token missing')\nif hard.get('kineza_thunder_tornado_live_handoff_harmonized') is not True:\n    errors.append('K25 Thunder Tornado harmonization hard gate missing')\nif auth.get('kineza', {}).get('thunder_tornado_live_pass_style') != 'structured-spiral-v2':\n    errors.append('K25 Thunder Tornado live-pass authority drift')\n\n""" + anchor
if anchor not in s:
    raise SystemExit('LIVE28K25 preflight insertion anchor missing')
s = s.replace(anchor, insert, 1)
pre.write_text(s, encoding='utf-8')

print('LIVE28K25 Thunder Tornado handoff harmonization applied')
