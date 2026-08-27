#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path, old, new, label):
    p = ROOT / path
    s = p.read_text(encoding='utf-8')
    if s.count(old) != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {s.count(old)}')
    p.write_text(s.replace(old, new, 1), encoding='utf-8')


def regex_once(path, pattern, repl, label, flags=0):
    p = ROOT / path
    s = p.read_text(encoding='utf-8')
    out, n = re.subn(pattern, repl, s, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'{label}: expected exactly one regex match, found {n}')
    p.write_text(out, encoding='utf-8')


# 1) PartyBattleConfig: three real Basic Attack sheets, one generic lookup.
config_block = r"export const KINEZA_ATTACK_SHEET = Object\.freeze\(\{.*?export const HERO_ATTACK_SHEETS = Object\.freeze\(\{ kineza: KINEZA_ATTACK_SHEET \}\);"
config_repl = """export const PRISMEL_ATTACK_SHEET = Object.freeze({
  key: 'prismel_attack_jrpg_10a',
  path: './assets/sequences/production/prismel_attack_jrpg_10a_runtime.png',
  frameWidth: 397,
  frameHeight: 397,
  frameCount: 10,
  baselinePx: 394,
  referenceBodyHeightPx: 285,
  scaleMode: 'formation-body-height',
  frameDurations: Object.freeze([110, 85, 90, 95, 115, 80, 75, 105, 95, 150]),
  markerFrames: Object.freeze({ gather: [2, 3, 4], release: [6], impact: [7], recover: [9] })
});

export const AURYI_ATTACK_SHEET = Object.freeze({
  key: 'auryi_attack_jrpg_10a',
  path: './assets/sequences/production/auryi_attack_jrpg_10a_runtime.png',
  frameWidth: 397,
  frameHeight: 397,
  frameCount: 10,
  baselinePx: 380,
  referenceBodyHeightPx: 355,
  scaleMode: 'formation-body-height',
  frameDurations: Object.freeze([115, 85, 90, 95, 105, 80, 80, 110, 105, 155]),
  markerFrames: Object.freeze({ gather: [2, 3, 4], release: [6], impact: [7], recover: [8, 9] })
});

export const KINEZA_ATTACK_SHEET = Object.freeze({
  key: 'kineza_basic_attack_v1',
  path: './assets/characters/kineza/animations/kineza_basic_attack_v1.png',
  frameWidth: 520,
  frameHeight: 660,
  frameCount: 6,
  baselinePx: 620,
  scaleMode: 'standby-display-height',
  frameDurations: Object.freeze([140, 220, 90, 160, 120, 200]),
  markerFrames: Object.freeze({ gather: [0, 1], release: [2], impact: [3], recover: [4, 5] })
});

// H2.8: every hero now has a current Basic Attack sheet. This remains a
// data lookup, never a hero-id branch in PartyFormationView.
export const HERO_ATTACK_SHEETS = Object.freeze({
  prismel: PRISMEL_ATTACK_SHEET,
  auryi: AURYI_ATTACK_SHEET,
  kineza: KINEZA_ATTACK_SHEET
});"""
regex_once('src/PartyBattleConfig.js', config_block, config_repl, 'attack-sheet config block', re.S)

# 2) PartyFormationView: scale high-res JRPG sheets by apparent body height,
# while preserving Kineza's already-fixed sheet calibration.
old_scale = """    const originY = cfg.baselinePx / cfg.frameHeight;
    // H2.8: the Party Battle standby is already independently calibrated.
    // hero.scaleMul belongs to the legacy 1v1 pose library (Kineza = 0.78)
    // and must never be applied again to a current Party Battle attack sheet.
    const scale = sprite.displayHeight / cfg.frameHeight;"""
new_scale = """    const originY = cfg.baselinePx / cfg.frameHeight;
    // H2.8 PriZim normalization: JRPG attack sheets are cropped differently
    // from the 900x900 formation masters, so raw canvas height is not body
    // height authority. Match visible body height back to the locked
    // formation hierarchy instead. Kineza keeps his proven standalone sheet
    // calibration. Legacy hero.scaleMul is never applied to either path.
    let scale;
    if (cfg.scaleMode === 'formation-body-height' && cfg.referenceBodyHeightPx) {
      const targetBodyHeight = PARTY_ASSET_LOCK.normalizedHeightPx[heroId] * sprite.scaleX;
      scale = targetBodyHeight / cfg.referenceBodyHeightPx;
    } else {
      scale = sprite.displayHeight / cfg.frameHeight;
    }"""
replace_once('src/PartyFormationView.js', old_scale, new_scale, 'formation attack scaling')

# 3) Audio: expose the already-loaded per-hero recovery banks as a real marker event.
old_audio = """  attackGather(characterId) { this._play(`attackGather:${characterId}`); }
  attackRelease(characterId) { this._play(`attackRelease:${characterId}`); }
  attackImpact(characterId) { this._play(`attackImpact:${characterId}`); }"""
new_audio = """  attackGather(characterId) { this._play(`attackGather:${characterId}`); }
  attackRelease(characterId) { this._play(`attackRelease:${characterId}`); }
  attackImpact(characterId) { this._play(`attackImpact:${characterId}`); }
  attackRecover(characterId) { this._play(`_recover:${characterId}`); }"""
replace_once('src/PartyBattleAudioController.js', old_audio, new_audio, 'recover audio method')

# 4) Scene: Basic Attack uses current sheets only. Resonart remains on its
# existing technique path. A missing Basic Attack sheet may fall to the
# restrained non-art tween fallback, never the retired pose artwork.
replace_once(
    'src/PartyBattleScene.js',
    "    if (this.formation.hasAttackSheet(hero.id)) {",
    "    if (command === 'Attack' && this.formation.hasAttackSheet(hero.id)) {",
    'basic attack sheet guard'
)
replace_once(
    'src/PartyBattleScene.js',
    """        } else if (isMarkerFrame(frameIndex, 'recover') && !seen.has('recover')) {
          seen.add('recover');
        }""",
    """        } else if (isMarkerFrame(frameIndex, 'recover') && !seen.has('recover')) {
          seen.add('recover');
          this.audio.attackRecover(hero.id);
        }""",
    'recover marker audio'
)
replace_once(
    'src/PartyBattleScene.js',
    "    const useRealPoses = this.formation.hasActionPoses(hero.id);",
    "    const useRealPoses = command !== 'Attack' && this.formation.hasActionPoses(hero.id);",
    'retire old basic-attack pose fallback'
)

# 5) Sanity checks.
for path in ['src/PartyBattleConfig.js', 'src/PartyFormationView.js', 'src/PartyBattleAudioController.js', 'src/PartyBattleScene.js']:
    text = (ROOT / path).read_text(encoding='utf-8')
    if '\r' in text:
        raise SystemExit(f'{path}: unexpected CR characters')

config = (ROOT / 'src/PartyBattleConfig.js').read_text(encoding='utf-8')
for token in ['prismel: PRISMEL_ATTACK_SHEET', 'auryi: AURYI_ATTACK_SHEET', 'kineza: KINEZA_ATTACK_SHEET']:
    if token not in config:
        raise SystemExit(f'missing runtime sheet entry: {token}')

scene = (ROOT / 'src/PartyBattleScene.js').read_text(encoding='utf-8')
if "command === 'Attack' && this.formation.hasAttackSheet(hero.id)" not in scene:
    raise SystemExit('Basic Attack sheet guard missing')
if "command !== 'Attack' && this.formation.hasActionPoses(hero.id)" not in scene:
    raise SystemExit('retired Basic Attack pose fallback still active')

print('PASS: H2.8 three-hero Basic Attack runtime migration staged.')
