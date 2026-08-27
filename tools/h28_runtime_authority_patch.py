#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path, old, new):
    p = ROOT / path
    s = p.read_text(encoding='utf-8')
    count = s.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {count}: {old[:80]!r}')
    p.write_text(s.replace(old, new, 1), encoding='utf-8')


def regex_once(path, pattern, repl):
    p = ROOT / path
    s = p.read_text(encoding='utf-8')
    out, count = re.subn(pattern, repl, s, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'{path}: regex expected one match, found {count}: {pattern[:100]!r}')
    p.write_text(out, encoding='utf-8')

# 1) One Basic Attack authority source. Remove PartyBattleConfig's duplicate Kineza sheet.
replace_once(
    'src/PartyFormationView.js',
    "import { PARTY_SLOTS, PARTY_ASSET_LOCK, HERO_ATTACK_SHEETS, heightScaleFor } from './PartyBattleConfig.js?v=4';",
    "import { PARTY_SLOTS, PARTY_ASSET_LOCK, heightScaleFor } from './PartyBattleConfig.js?v=4';\nimport { PARTY_ATTACK_AUTHORITY } from './PartyAttackAuthority.js?v=2';"
)
replace_once(
    'src/PartyFormationView.js',
    '      const sheetCfg = HERO_ATTACK_SHEETS[heroId];\n      if (sheetCfg && this.scene.textures.exists(sheetCfg.key)) {',
    "      const sheetCfg = PARTY_ATTACK_AUTHORITY[heroId];\n      if (sheetCfg && sheetCfg.enabled !== false && sheetCfg.mode === 'sheet' && this.scene.textures.exists(sheetCfg.key)) {"
)

# 2) Runtime sheet sizing derives from visible standby body height, never raw canvas height.
replace_once(
    'src/PartyFormationView.js',
    "    const { sprite, attackSprite } = actor;\n    const cfg = actor.attackSheetConfig;\n    const originY = cfg.baselinePx / cfg.frameHeight;\n    // H2.8: the Party Battle standby is already independently calibrated.\n    // hero.scaleMul belongs to the legacy 1v1 pose library (Kineza = 0.78)\n    // and must never be applied again to a current Party Battle attack sheet.\n    const scale = sprite.displayHeight / cfg.frameHeight;",
    "    const { sprite, attackSprite } = actor;\n    const cfg = actor.attackSheetConfig;\n    const formationTex = PARTY_ASSET_LOCK.textures[heroId];\n    const standbyBodyDisplayH = formationTex && formationTex.canvas\n      ? sprite.displayHeight * (PARTY_ASSET_LOCK.normalizedHeightPx[heroId] / PARTY_ASSET_LOCK.referenceCanvas)\n      : sprite.scaleY * (formationTex?.contentHeightPx || sprite.height);\n    const referenceBodyH = cfg.referenceBodyHeightPx || cfg.frameHeight;\n    const scale = standbyBodyDisplayH / referenceBodyH;\n    const homeX = sprite.x;\n    const homeY = sprite.y;\n    const baselineFor = i => (cfg.baselinePxByFrame && cfg.baselinePxByFrame[i] != null)\n      ? cfg.baselinePxByFrame[i]\n      : (cfg.baselinePx ?? cfg.frameHeight);\n    const regFor = i => (cfg.registration && cfg.registration[i]) || { scale: 1, x: 0, y: 0 };\n    const applyFrameRegistration = i => {\n      const reg = regFor(i);\n      attackSprite\n        .setOrigin(0.5, baselineFor(i) / cfg.frameHeight)\n        .setScale(scale * (reg.scale ?? 1))\n        .setPosition(homeX + (reg.x || 0) * scale, homeY + (reg.y || 0) * scale);\n    };\n    applyFrameRegistration(0);"
)
replace_once(
    'src/PartyFormationView.js',
    "    attackSprite\n      .setOrigin(0.5, originY)\n      .setScale(scale)\n      .setPosition(sprite.x, sprite.y)\n      .setFlipX(sprite.flipX)",
    "    attackSprite\n      .setFlipX(sprite.flipX)"
)
replace_once(
    'src/PartyFormationView.js',
    "      const onUpdate = (_anim, frame) => { if (onFrame) onFrame(frame.index - 1); };",
    "      const onUpdate = (_anim, frame) => {\n        const frameIndex = frame.index - 1;\n        applyFrameRegistration(frameIndex);\n        if (onFrame) onFrame(frameIndex);\n      };"
)

# 3) Remove the duplicate old Kineza sheet authority from PartyBattleConfig.
regex_once(
    'src/PartyBattleConfig.js',
    r"// FAI-BATTLE-PRESENTATION-04 \(ANIMATION_AUTHORITY_CORRECTION\.md\): BP03's\n// Kineza attack used.*?export const HERO_ATTACK_SHEETS = Object\.freeze\(\{ kineza: KINEZA_ATTACK_SHEET \}\);\n\n",
    "// H2.8: Basic Attack presentation authority now lives exclusively in\n// PartyAttackAuthority.js. Do not define a second per-hero attack-sheet map\n// here; that created two competing 'current' Kineza authorities.\n\n"
)

# 4) Scene preload uses the single authority module, and Basic Attack sheets never impersonate Resonart.
replace_once(
    'src/PartyBattleScene.js',
    "  partyRoster, BASE_COMMANDS, RESONART_RP_COST, ITEM_DEFS,\n  PARTY_ASSET_LOCK, HERO_ATTACK_SHEETS, projectedDamage, hitChanceFor\n} from './PartyBattleConfig.js?v=4';",
    "  partyRoster, BASE_COMMANDS, RESONART_RP_COST, ITEM_DEFS,\n  PARTY_ASSET_LOCK, projectedDamage, hitChanceFor\n} from './PartyBattleConfig.js?v=4';\nimport { preloadPartyAttackAuthority } from './PartyAttackAuthority.js?v=2';"
)
regex_once(
    'src/PartyBattleScene.js',
    r"    // FAI-BATTLE-PRESENTATION-04: real current-authority attack sheets\n.*?    Object\.values\(HERO_ATTACK_SHEETS\)\.forEach\(sheet => \{\n      this\.load\.spritesheet\(sheet\.key, sheet\.path, \{\n        frameWidth: sheet\.frameWidth, frameHeight: sheet\.frameHeight\n      \}\);\n    \}\);",
    "    // H2.8: preload only hero Basic Attacks promoted by PartyAttackAuthority.\n    // Pending Prismel/Auryi sheets stay disabled until their binaries are ingested;\n    // retired pose art is never silently promoted by the loader.\n    preloadPartyAttackAuthority(this);"
)
replace_once(
    'src/PartyBattleScene.js',
    '    if (this.formation.hasAttackSheet(hero.id)) {',
    "    if (command === 'Attack' && this.formation.hasAttackSheet(hero.id)) {"
)
replace_once(
    'src/PartyBattleScene.js',
    '    const useRealPoses = this.formation.hasActionPoses(hero.id);',
    "    // Retired five/six-pose art may still support Resonart presentation,\n    // but it may not masquerade as a current Party Battle Basic Attack.\n    const useRealPoses = command !== 'Attack' && this.formation.hasActionPoses(hero.id);"
)

# 5) Pending 10-frame authorities are now sheet-shaped runtime contracts.
auth = ROOT / 'src/PartyAttackAuthority.js'
s = auth.read_text(encoding='utf-8')
s = s.replace("    mode: 'pending-frames',\n    frameCount: 10,\n    registrationPath: './pv-data/sequence_authority/prismel_attack_jrpg_10a.registration.json',",
              "    mode: 'sheet',\n    key: 'prismel_party_attack_jrpg_10a',\n    path: './assets/sequences/runtime/prismel_attack_jrpg_10a.png',\n    frameWidth: 397,\n    frameHeight: 397,\n    frameCount: 10,\n    referenceBodyHeightPx: 287,\n    baselinePxByFrame: Object.freeze([393, 393, 393, 393, 393, 315, 315, 316, 316, 319]),\n    registrationPath: './pv-data/sequence_authority/prismel_attack_jrpg_10a.registration.json',", 1)
s = s.replace("    mode: 'pending-frames',\n    frameCount: 10,\n    registrationPath: './pv-data/sequence_authority/auryi_attack_jrpg_10a.refresh.json',",
              "    mode: 'sheet',\n    key: 'auryi_party_attack_jrpg_10a',\n    path: './assets/sequences/runtime/auryi_attack_jrpg_10a.png',\n    frameWidth: 397,\n    frameHeight: 397,\n    frameCount: 10,\n    referenceBodyHeightPx: 355,\n    baselinePxByFrame: Object.freeze([378, 380, 380, 380, 379, 371, 372, 373, 372, 372]),\n    registrationPath: './pv-data/sequence_authority/auryi_attack_jrpg_10a.refresh.json',", 1)
if s.count("mode: 'sheet'") < 3:
    raise SystemExit('PartyAttackAuthority: expected all three heroes to be sheet-shaped contracts')
auth.write_text(s, encoding='utf-8')

# 6) PriZim gate also protects the runtime authority split.
p = ROOT / 'tools/prizim/attack_authority_check.py'
s = p.read_text(encoding='utf-8')
needle = "    require(\"status: 'production-current'\" in authority_text, \"Kineza must remain production-current\")\n"
insert = needle + "    require(authority_text.count(\"mode: 'sheet'\") >= 3, \"all three Basic Attack contracts must be sheet-shaped\")\n    require(\"assets/sequences/runtime/prismel_attack_jrpg_10a.png\" in authority_text, \"Prismel runtime path missing\")\n    require(\"assets/sequences/runtime/auryi_attack_jrpg_10a.png\" in authority_text, \"Auryi runtime path missing\")\n"
if s.count(needle) != 1:
    raise SystemExit('attack_authority_check.py: insertion point drifted')
s = s.replace(needle, insert, 1)
p.write_text(s, encoding='utf-8')

# Guardrails: no duplicate config map, no Basic Attack legacy pose fallback.
config = (ROOT / 'src/PartyBattleConfig.js').read_text(encoding='utf-8')
scene = (ROOT / 'src/PartyBattleScene.js').read_text(encoding='utf-8')
formation = (ROOT / 'src/PartyFormationView.js').read_text(encoding='utf-8')
if 'HERO_ATTACK_SHEETS' in config or 'KINEZA_ATTACK_SHEET' in config:
    raise SystemExit('duplicate PartyBattleConfig attack authority survived')
if "command !== 'Attack' && this.formation.hasActionPoses" not in scene:
    raise SystemExit('Basic Attack legacy-pose retirement guard missing')
if 'PARTY_ATTACK_AUTHORITY[heroId]' not in formation:
    raise SystemExit('formation does not consume PartyAttackAuthority')

print('PASS: H2.8 runtime attack authority patch applied cleanly.')
