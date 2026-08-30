from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'missing patch anchor: {label}')
    return text.replace(old, new, 1)

# PartyBattleConfig.js
p = Path('src/PartyBattleConfig.js')
s = p.read_text()
new_attack = """export const KINEZA_ATTACK_SHEET = Object.freeze({
  key: 'kineza_basic_attack_v2',
  path: './assets/characters/kineza/animations/kineza_basic_attack_v2.png',
  frameWidth: 720,
  frameHeight: 580,
  frameCount: 12,
  baselinePx: 525,
  contentHeightPx: 350,
  frameDurations: Object.freeze([150,150,150,150,150,150,120,110,125,125,145,160]),
  markerFrames: Object.freeze({ gather: [1,2,3,4,5], release: [6,7], impact: [8], recover: [9,10,11] }),
  povFrames: Object.freeze([6,7,8,9])
});"""
s, n = re.subn(r"export const KINEZA_ATTACK_SHEET = Object\.freeze\(\{.*?\n\}\);", new_attack, s, count=1, flags=re.S)
if n != 1:
    raise RuntimeError('KINEZA_ATTACK_SHEET block not found')

if 'export const KINEZA_STATE_SHEET' not in s:
    state_block = """
export const KINEZA_STATE_SHEET = Object.freeze({
  key: 'kineza_battle_states_v1',
  path: './assets/characters/kineza/battle/kineza_battle_states_v1.png',
  frameWidth: 640,
  frameHeight: 520,
  frameCount: 8,
  baselinePx: 474,
  contentHeightPx: 335,
  passiveFrame: 0,
  activeFrame: 1,
  turnFrames: Object.freeze([2,3,4,5,6,7]),
  turnDurations: Object.freeze([90,95,110,120,120,155])
});

export const HERO_STATE_SHEETS = Object.freeze({ kineza: KINEZA_STATE_SHEET });

"""
    s = replace_once(s, '// Keyed lookup so PartyFormationView', state_block + '// Keyed lookup so PartyFormationView', 'state sheet insertion')
p.write_text(s)

# PartyFormationView.js
p = Path('src/PartyFormationView.js')
s = p.read_text()
s = s.replace(
    "import { PARTY_SLOTS, PARTY_ASSET_LOCK, HERO_ATTACK_SHEETS, heightScaleFor } from './PartyBattleConfig.js?v=prismel-live-1';",
    "import { PARTY_SLOTS, PARTY_ASSET_LOCK, HERO_ATTACK_SHEETS, HERO_STATE_SHEETS, heightScaleFor } from './PartyBattleConfig.js?v=kineza-sprintA-1';"
)
s = s.replace('const sprite = this.scene.add.image(0, 0, texKey).setOrigin(0.5, originY);', 'const sprite = this.scene.add.sprite(0, 0, texKey).setOrigin(0.5, originY);')
s = s.replace('const ghost = this.scene.add.image(0, 0, texKey).setOrigin(0.5, originY).setAlpha(0);', 'const ghost = this.scene.add.sprite(0, 0, texKey).setOrigin(0.5, originY).setAlpha(0);')

actor_anchor = """      this.actors.set(heroId, {
        sprite, ghost, ring, slot, hero, poseTex,
        standbyTex: texKey, standbyOriginY: originY,
        _snapshot: null, _poseScale: null,
        attackSprite, attackSheetConfig
      });"""
actor_repl = """      let stateSheetConfig = null;
      let stateAnimKey = null;
      const stateCfg = HERO_STATE_SHEETS[heroId];
      if (stateCfg && this.scene.textures.exists(stateCfg.key)) {
        stateSheetConfig = stateCfg;
        const stateOriginY = stateCfg.baselinePx / stateCfg.frameHeight;
        sprite.setTexture(stateCfg.key, stateCfg.passiveFrame).setOrigin(0.5, stateOriginY);
        ghost.setTexture(stateCfg.key, stateCfg.passiveFrame).setOrigin(0.5, stateOriginY);
        stateAnimKey = `${stateCfg.key}_turn_entry`;
        if (!this.scene.anims.exists(stateAnimKey)) {
          const frames = stateCfg.turnFrames.map((frame, i) => ({
            key: stateCfg.key, frame, duration: stateCfg.turnDurations[i] || 110
          }));
          this.scene.anims.create({ key: stateAnimKey, frames, repeat: 0 });
        }
      }

      this.actors.set(heroId, {
        sprite, ghost, ring, slot, hero, poseTex,
        standbyTex: stateSheetConfig ? stateSheetConfig.key : texKey,
        standbyOriginY: stateSheetConfig ? stateSheetConfig.baselinePx / stateSheetConfig.frameHeight : originY,
        _snapshot: null, _poseScale: null,
        attackSprite, attackSheetConfig,
        stateSheetConfig, stateAnimKey
      });"""
s = replace_once(s, actor_anchor, actor_repl, 'actor setup')
s = replace_once(
    s,
    'const scale = heightScaleFor(heroId, commonScale);',
    "const scale = actor.stateSheetConfig\n        ? (PARTY_ASSET_LOCK.normalizedHeightPx[heroId] * commonScale) / actor.stateSheetConfig.contentHeightPx\n        : heightScaleFor(heroId, commonScale);",
    'formation scale'
)
old_setactive = """  setActive(heroId) {
    this.actors.forEach((actor, id) => {
      const on = id === heroId;
      this.scene.tweens.killTweensOf(actor.ring);
      this.scene.tweens.add({
        targets: actor.ring,
        alpha: on ? 1 : 0,
        duration: 180,
        ease: 'Sine.easeOut'
      });
      // Manually drive strokeAlpha via a plain tween target object, since
      // Graphics/Shape stroke alpha isn't itself tweenable as `alpha` on
      // an Ellipse's stroke — setStrokeStyle again each tick is cheapest.
      actor.ring.setStrokeStyle(2.2, 0xffe8a0, on ? 0.85 : 0);
    });
  }"""
new_setactive = """  setActive(heroId) {
    this.actors.forEach((actor, id) => {
      const on = id === heroId;
      this.scene.tweens.killTweensOf(actor.ring);
      this.scene.tweens.add({
        targets: actor.ring,
        alpha: on ? 1 : 0,
        duration: 180,
        ease: 'Sine.easeOut'
      });
      actor.ring.setStrokeStyle(on ? 3.2 : 2.2, on ? 0x9fefff : 0xffe8a0, on ? 0.95 : 0);
      if (actor.stateSheetConfig && actor.sprite.visible && !actor.sprite.anims?.isPlaying) {
        actor.sprite.setFrame(on ? actor.stateSheetConfig.activeFrame : actor.stateSheetConfig.passiveFrame);
      }
    });
  }

  hasTurnEntry(heroId) {
    const actor = this.actors.get(heroId);
    return !!(actor && actor.stateSheetConfig && actor.stateAnimKey);
  }

  playTurnEntry(heroId) {
    const actor = this.actors.get(heroId);
    if (!actor || !actor.stateSheetConfig || !actor.stateAnimKey) return Promise.resolve();
    const { sprite, stateSheetConfig } = actor;
    sprite.setVisible(true).setAlpha(1).setFrame(stateSheetConfig.turnFrames[0]);
    return new Promise(resolve => {
      const done = () => {
        sprite.off('animationcomplete', done);
        sprite.setFrame(stateSheetConfig.activeFrame);
        resolve();
      };
      sprite.once('animationcomplete', done);
      sprite.play(actor.stateAnimKey);
    });
  }

  setPovFocus(heroId, on) {
    this.actors.forEach((actor, id) => {
      if (id === heroId) return;
      const target = on ? 0.72 : 1;
      this.scene.tweens.killTweensOf(actor.sprite);
      this.scene.tweens.add({ targets: actor.sprite, alpha: target, duration: on ? 110 : 160, ease: 'Sine.easeOut' });
    });
  }"""
s = replace_once(s, old_setactive, new_setactive, 'setActive')
s = replace_once(
    s,
    'const scale = (sprite.displayHeight / cfg.frameHeight) * (hero.scaleMul || 1);',
    "const scale = (actor.stateSheetConfig && cfg.contentHeightPx)\n      ? (sprite.scaleY * actor.stateSheetConfig.contentHeightPx) / cfg.contentHeightPx\n      : (sprite.displayHeight / cfg.frameHeight) * (hero.scaleMul || 1);",
    'attack scale'
)
p.write_text(s)

# PartyBattleScene.js
p = Path('src/PartyBattleScene.js')
s = p.read_text()
s = s.replace("PartyFormationView from './PartyFormationView.js?v=prismel-live-1';", "PartyFormationView from './PartyFormationView.js?v=kineza-sprintA-1';")
s = s.replace('PARTY_ASSET_LOCK, HERO_ATTACK_SHEETS, projectedDamage, hitChanceFor', 'PARTY_ASSET_LOCK, HERO_ATTACK_SHEETS, HERO_STATE_SHEETS, projectedDamage, hitChanceFor')
s = s.replace("} from './PartyBattleConfig.js?v=prismel-live-1';", "} from './PartyBattleConfig.js?v=kineza-sprintA-1';")
attack_preload = """    Object.values(HERO_ATTACK_SHEETS).forEach(sheet => {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight
      });
    });"""
state_preload = attack_preload + """
    Object.values(HERO_STATE_SHEETS).forEach(sheet => {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight
      });
    });"""
s = replace_once(s, attack_preload, state_preload, 'state preload')
wait_anchor = """  _wait(ms) {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }"""
wait_repl = wait_anchor + """

  _setAttackPov(heroId, on) {
    if (heroId !== 'kineza') return;
    if (on && this._attackPovActive) return;
    if (!on && !this._attackPovActive) return;
    this._attackPovActive = on;
    this.cameras.main.zoomTo(on ? 1.045 : 1, on ? 120 : 170, 'Sine.easeOut');
    this.formation?.setPovFocus(heroId, on);
  }"""
s = replace_once(s, wait_anchor, wait_repl, 'POV helper')
old_turn = """    this._highlightHeroCard(actor);
    this.formation.setActive(actor);
    this._setBanner(`${hero.name}'s Turn`);
    this._showCommandRail();
    this.audio.turnStart(actor);"""
new_turn = """    this._highlightHeroCard(actor);
    this.formation.setActive(actor);
    this._setBanner(`${hero.name}'s Turn`);
    this.audio.turnStart(actor);
    if (this.formation.hasTurnEntry(actor)) {
      this._turnLock = true;
      this._hideCommandRail();
      this.formation.playTurnEntry(actor).then(() => {
        if (this.activeHeroId !== actor) return;
        this._turnLock = false;
        this._showCommandRail();
      });
    } else {
      this._showCommandRail();
    }"""
s = replace_once(s, old_turn, new_turn, 'turn entry')
s = replace_once(s, 'if (this.formation.hasAttackSheet(hero.id)) {', "if (command === 'Attack' && this.formation.hasAttackSheet(hero.id)) {", 'basic attack sheet guard')
marker_anchor = """      await this.formation.playAttackSheet(hero.id, frameIndex => {
        if (isMarkerFrame(frameIndex, 'gather') && !seen.has('gather')) {"""
marker_repl = """      await this.formation.playAttackSheet(hero.id, frameIndex => {
        const povFrames = cfg.povFrames || [];
        if (povFrames.length) {
          if (frameIndex === povFrames[0]) this._setAttackPov(hero.id, true);
          if (frameIndex > povFrames[povFrames.length - 1]) this._setAttackPov(hero.id, false);
        }
        if (isMarkerFrame(frameIndex, 'gather') && !seen.has('gather')) {"""
s = replace_once(s, marker_anchor, marker_repl, 'POV frame markers')
end_anchor = """      });

      this._turnLock = false;
      this._endHeroTurn();
      return;
    }"""
end_repl = """      });
      this._setAttackPov(hero.id, false);

      this._turnLock = false;
      this._endHeroTurn();
      return;
    }"""
s = replace_once(s, end_anchor, end_repl, 'POV reset')
p.write_text(s)

# Hybrid cache-busting + cool active-card outer layer.
p = Path('hybrid-battle-live.html')
s = p.read_text()
s = s.replace('.hero.on{box-shadow:0 0 0 2px #fff8,0 0 17px #9f62ff}', '.hero.on{box-shadow:0 0 0 2px #fff8,0 0 0 4px #76ddff66,0 0 18px #9f62ff}')
s = s.replace('prismel-live-1', 'kineza-sprintA-1')
p.write_text(s)

print('Kineza Sprint A code wiring complete')
