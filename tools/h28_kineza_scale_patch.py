#!/usr/bin/env python3
from pathlib import Path
import re

p = Path('src/PartyFormationView.js')
s = p.read_text(encoding='utf-8')

old = "    const { sprite, attackSprite, hero } = actor;\n    const cfg = actor.attackSheetConfig;\n    const originY = cfg.baselinePx / cfg.frameHeight;\n    const scale = (sprite.displayHeight / cfg.frameHeight) * (hero.scaleMul || 1);"
new = "    const { sprite, attackSprite } = actor;\n    const cfg = actor.attackSheetConfig;\n    const originY = cfg.baselinePx / cfg.frameHeight;\n    // H2.8: the Party Battle standby is already independently calibrated.\n    // hero.scaleMul belongs to the legacy 1v1 pose library (Kineza = 0.78)\n    // and must never be applied again to a current Party Battle attack sheet.\n    const scale = sprite.displayHeight / cfg.frameHeight;"

if s.count(old) != 1:
    raise SystemExit(f'expected one legacy attack-scale block, found {s.count(old)}')
s = s.replace(old, new, 1)

if 'hero.scaleMul' in s[s.index('  playAttackSheet('):s.index('  hasActionPoses(')]:
    raise SystemExit('legacy hero.scaleMul still present inside playAttackSheet')

p.write_text(s, encoding='utf-8')
print('PASS: Kineza current sheet no longer inherits legacy 1v1 scaleMul.')
