#!/usr/bin/env python3
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
FORMATION = ROOT / 'src/prizim/Live28K2PartyFormationView.js'
AUTH = ROOT / 'PV_LIVE_AUTHORITY.json'
PREFLIGHT = ROOT / 'tools/prizim/preflight_live28k.py'
NOTEPAD = ROOT / 'PRIZIM_LIVE_NOTEPAD.md'
RESUME = ROOT / 'PV_RESUME_ANCHOR.md'


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f'K22 patch refused: missing {label}')
    return text.replace(old, new, 1)


def main():
    formation = FORMATION.read_text(encoding='utf-8')

    const_anchor = "const PRISMEL_BODY_RATIO = 1 / 1.29;\n"
    formation = replace_once(
        formation,
        const_anchor,
        const_anchor + "const KINEZA_LETHAL_HOME_SETTLE_MS = 240;\n",
        'Kineza settle constant anchor',
    )

    method_anchor = '''  _fitActorToBodyHeight(actor, key, targetBodyH) {\n'''
    method = '''  async playAttackSheet(heroId, onFrame) {\n    if (heroId !== 'kineza') return super.playAttackSheet(heroId, onFrame);\n\n    const actor = this.actors.get('kineza');\n    const result = await super.playAttackSheet(heroId, onFrame);\n\n    // K22: on a lethal Blitzer, do not let turn/victory logic outrun the\n    // visual recovery. The Duo-Hybrid sequence must fully hand control back,\n    // then Kineza is restored to his exact HC formation home and given a\n    // short readable settle beat before PartyBattleScene can schedule Victory.\n    if (this.scene.enemy?.hp > 0 || !actor?.sprite) return result;\n\n    this.scene.tweens.killTweensOf(actor.sprite);\n    if (actor.ghost) this.scene.tweens.killTweensOf(actor.ghost);\n    actor._snapshot = null;\n    actor._poseScale = null;\n    if (actor.attackSprite) actor.attackSprite.setVisible(false).setAlpha(1);\n    if (actor.ghost) actor.ghost.setVisible(true).setAlpha(0);\n    actor.sprite.setVisible(true).setAlpha(1).setAngle(0);\n    this.layout();\n    this._forceActiveRing(this.scene?.activeHeroId);\n    await new Promise(resolve => this.scene.time.delayedCall(KINEZA_LETHAL_HOME_SETTLE_MS, resolve));\n    return result;\n  }\n\n'''
    formation = replace_once(formation, method_anchor, method + method_anchor, 'Kineza playAttackSheet insertion anchor')
    FORMATION.write_text(formation, encoding='utf-8')

    auth = json.loads(AUTH.read_text(encoding='utf-8'))
    auth['updated'] = '2026-09-07'
    hard = auth.setdefault('hard_gates', {})
    hard['kineza_lethal_attack_must_settle_at_home_before_victory'] = True
    hard['k22_must_preserve_k21_runtime_pass'] = True

    kineza = auth.setdefault('kineza', {})
    kineza['lethal_victory_home_settle_ms'] = 240
    kineza['victory_timing_policy'] = (
        'On a lethal Kineza Basic Attack, await the complete Duo-Hybrid sequence, restore the exact HC idle at formation home, '
        'hold a 240ms readable settle beat, and only then allow PartyBattleScene to schedule the normal end-turn/victory transition.'
    )

    device = auth.setdefault('device_evidence', {})
    device['live28k21_pending_iphone_validation'] = False
    device['live28k21_runtime_passed'] = True
    device['live28k21_result'] = (
        'PASS runtime gate: iPhone battle ran correctly after the K21 cleanup-scope hotfix. '
        'New presentation issue observed: a lethal Kineza attack can show Victory before his return-to-formation reads as complete.'
    )
    device['latest_device_witness'] = 'main-20260907-live28k21'
    device['latest_device_result'] = device['live28k21_result']
    device['pending_witness'] = 'main-20260907-live28k22'
    device['pending_iphone_validation'] = True
    device['live28k22_pending_iphone_validation'] = True
    device['pending_gate_summary'] = (
        'LIVE28K22: on a lethal Kineza Basic Attack, Blitzer must finish and Kineza must visibly restore/settle at his exact formation home '
        'before Victory appears; K21 boot/runtime stability, Aurora Pulse presentation/audio, and all stable character lanes must remain unchanged.'
    )
    device['promotion_reason'] = (
        'Promote LIVE28K22 after K21 passed the iPhone runtime gate. Fix only Kineza lethal-victory timing by awaiting the full Duo-Hybrid '
        'attack, restoring his exact HC home formation state, and holding a 240ms settle beat before the existing end-turn timer can schedule Victory. '
        'Preserve K21 runtime stability, K20 Aurora presentation, K18 native M4A playback, Beauty V1 exact master, and all other combat timing.'
    )
    AUTH.write_text(json.dumps(auth, indent=2) + '\n', encoding='utf-8')

    pre = PREFLIGHT.read_text(encoding='utf-8')
    read_anchor = "k_scene = read('src/prizim/Live28K2PartyBattleScene.js')\n"
    if "k_formation = read('src/prizim/Live28K2PartyFormationView.js')" not in pre:
        pre = replace_once(
            pre,
            read_anchor,
            read_anchor + "k_formation = read('src/prizim/Live28K2PartyFormationView.js')\n",
            'preflight K formation read anchor',
        )

    marker = "# 9. Future crown authority must preserve the corrected splash-screen hover semantics.\n"
    if marker not in pre:
        raise RuntimeError('K22 patch refused: preflight insertion marker missing')
    k22_guard = r'''# 8i. K22 lethal-Kineza victory recovery gate. Victory must not outrun the
# Hybrid Blitzer return. The formation promise stays unresolved until Kineza is
# restored to his exact home state and a short settle beat has completed.
for token in [
    'const KINEZA_LETHAL_HOME_SETTLE_MS = 240;',
    "async playAttackSheet(heroId, onFrame) {",
    "if (heroId !== 'kineza') return super.playAttackSheet(heroId, onFrame);",
    "const result = await super.playAttackSheet(heroId, onFrame);",
    "if (this.scene.enemy?.hp > 0 || !actor?.sprite) return result;",
    'actor.sprite.setVisible(true).setAlpha(1).setAngle(0);',
    'this.layout();',
    'this._forceActiveRing(this.scene?.activeHeroId);',
    'await new Promise(resolve => this.scene.time.delayedCall(KINEZA_LETHAL_HOME_SETTLE_MS, resolve));',
]:
    if token not in k_formation:
        errors.append(f'K22 Kineza lethal-home-settle token missing: {token}')

k22_method = re.search(r"  async playAttackSheet\(heroId, onFrame\) \{(.*?)\n  \}\n\n  _fitActorToBodyHeight", k_formation, re.S)
if not k22_method:
    errors.append('K22 Kineza playAttackSheet override missing/unreadable')
else:
    body = k22_method.group(1)
    ordered = [
        "const result = await super.playAttackSheet(heroId, onFrame);",
        "if (this.scene.enemy?.hp > 0 || !actor?.sprite) return result;",
        'actor.sprite.setVisible(true).setAlpha(1).setAngle(0);',
        'this.layout();',
        'await new Promise(resolve => this.scene.time.delayedCall(KINEZA_LETHAL_HOME_SETTLE_MS, resolve));',
        'return result;',
    ]
    positions = [body.find(token) for token in ordered]
    if any(pos < 0 for pos in positions) or positions != sorted(positions):
        errors.append('K22 Kineza recovery ordering drifted: sequence -> lethal check -> home restore -> settle -> resolve is required')

if auth.get('hard_gates', {}).get('kineza_lethal_attack_must_settle_at_home_before_victory') is not True:
    errors.append('K22 Kineza lethal-victory home-settle hard gate missing')
if auth.get('hard_gates', {}).get('k22_must_preserve_k21_runtime_pass') is not True:
    errors.append('K22 K21 runtime-pass preservation hard gate missing')
if auth.get('kineza', {}).get('lethal_victory_home_settle_ms') != 240:
    errors.append('K22 Kineza lethal home settle authority must be exactly 240ms')
if auth.get('device_evidence', {}).get('live28k21_runtime_passed') is not True:
    errors.append('K22 machine authority lost K21 iPhone runtime PASS evidence')

'''
    if '# 8i. K22 lethal-Kineza victory recovery gate.' not in pre:
        pre = pre.replace(marker, k22_guard + marker, 1)
    PREFLIGHT.write_text(pre, encoding='utf-8')

    notepad = NOTEPAD.read_text(encoding='utf-8')
    kineza_anchor = '- Generic Kineza state sheets must not overwrite the HC idle.\n'
    kineza_note = (
        '- K22 lethal-victory gate: Blitzer must finish, Kineza must restore to exact HC formation home, '
        'and a 240ms visible settle beat must complete before Victory can be scheduled.\n'
    )
    if kineza_note not in notepad:
        notepad = replace_once(notepad, kineza_anchor, kineza_anchor + kineza_note, 'PriZim Kineza section anchor')
    NOTEPAD.write_text(notepad, encoding='utf-8')

    resume = RESUME.read_text(encoding='utf-8')
    section = '''## Kineza victory timing gate

- K21 iPhone runtime gate passed: battle ran correctly after the cleanup-scope repair.
- K22 pending: a lethal Kineza Basic Attack must complete the Duo-Hybrid sequence, restore the exact HC idle at formation home, visibly settle for 240ms, and only then permit Victory.
- This is a timing/presentation fix only. Do not alter Kineza identity, Blitzer frames, damage markers, Aurora Pulse, Prismel, or Auryi stable lanes.
'''
    if '## Kineza victory timing gate' not in resume:
        marker_resume = '\n## Hard constraints\n'
        if marker_resume not in resume:
            raise RuntimeError('K22 patch refused: resume Hard constraints marker missing')
        resume = resume.replace(marker_resume, '\n' + section + marker_resume, 1)
    RESUME.write_text(resume, encoding='utf-8')

    print('LIVE28K22 Kineza lethal-victory settle patch applied.')


if __name__ == '__main__':
    main()
