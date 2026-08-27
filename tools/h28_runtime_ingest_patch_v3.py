#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(path, old, new, label):
    s = read(path)
    if s.count(old) != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {s.count(old)}')
    write(path, s.replace(old, new, 1))

# PartyBattleConfig.js: replace only the bounded attack-sheet authority section.
path = 'src/PartyBattleConfig.js'
s = read(path)
start_marker = 'export const KINEZA_ATTACK_SHEET = Object.freeze({'
end_marker = 'export const BASE_COMMANDS'
start = s.find(start_marker)
end = s.find(end_marker)
if start < 0 or end < 0 or end <= start:
    raise SystemExit(f'attack config markers missing/invalid: start={start}, end={end}')
new_block = """export const PRISMEL_ATTACK_SHEET = Object.freeze({
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

// H2.8 current Basic Attack authority map. Renderer remains hero-agnostic.
export const HERO_ATTACK_SHEETS = Object.freeze({
  prismel: PRISMEL_ATTACK_SHEET,
  auryi: AURYI_ATTACK_SHEET,
  kineza: KINEZA_ATTACK_SHEET
});

"""
write(path, s[:start] + new_block + s[end:])

# PartyFormationView.js: high-res JRPG sheets scale by apparent body height.
replace_once(
    'src/PartyFormationView.js',
    """    const originY = cfg.baselinePx / cfg.frameHeight;
    // H2.8: the Party Battle standby is already independently calibrated.
    // hero.scaleMul belongs to the legacy 1v1 pose library (Kineza = 0.78)
    // and must never be applied again to a current Party Battle attack sheet.
    const scale = sprite.displayHeight / cfg.frameHeight;""",
    """    const originY = cfg.baselinePx / cfg.frameHeight;
    // H2.8 PriZim: source canvas height is not body-size authority. New
    // JRPG sheets match their locked formation-body height; Kineza keeps
    // his proven sheet calibration. Legacy hero.scaleMul is never reused.
    let scale;
    if (cfg.scaleMode === 'formation-body-height' && cfg.referenceBodyHeightPx) {
      const targetBodyHeight = PARTY_ASSET_LOCK.normalizedHeightPx[heroId] * sprite.scaleX;
      scale = targetBodyHeight / cfg.referenceBodyHeightPx;
    } else {
      scale = sprite.displayHeight / cfg.frameHeight;
    }""",
    'formation attack scaling'
)

# Audio: activate the already-loaded recovery bank on the Recover marker.
replace_once(
    'src/PartyBattleAudioController.js',
    """  attackGather(characterId) { this._play(`attackGather:${characterId}`); }
  attackRelease(characterId) { this._play(`attackRelease:${characterId}`); }
  attackImpact(characterId) { this._play(`attackImpact:${characterId}`); }""",
    """  attackGather(characterId) { this._play(`attackGather:${characterId}`); }
  attackRelease(characterId) { this._play(`attackRelease:${characterId}`); }
  attackImpact(characterId) { this._play(`attackImpact:${characterId}`); }
  attackRecover(characterId) { this._play(`_recover:${characterId}`); }""",
    'recover audio method'
)

# Scene: current sheets belong to Basic Attack only. Resonart keeps its
# technique choreography. Old pose art cannot masquerade as Basic Attack.
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

# Fail closed if the intended authority boundaries are not present.
config = read('src/PartyBattleConfig.js')
for token in ('prismel: PRISMEL_ATTACK_SHEET', 'auryi: AURYI_ATTACK_SHEET', 'kineza: KINEZA_ATTACK_SHEET'):
    if token not in config:
        raise SystemExit(f'missing sheet entry: {token}')
scene = read('src/PartyBattleScene.js')
if "command === 'Attack' && this.formation.hasAttackSheet(hero.id)" not in scene:
    raise SystemExit('Basic Attack sheet guard missing')
if "command !== 'Attack' && this.formation.hasActionPoses(hero.id)" not in scene:
    raise SystemExit('retired Basic Attack pose fallback still active')
print('PASS: H2.8 three-hero Basic Attack runtime migration staged.')
