// FAI-HUD-01 Phase A — renders the 3 active party members as independent
// layered actors in a fixed formation, per NEW_PARTY_DATA_CONTRACT.json.
import { PARTY_SLOTS, PARTY_ASSET_LOCK, HERO_ATTACK_SHEETS, HERO_STATE_SHEETS, heightScaleFor } from './PartyBattleConfig.js?v=blitzer-2';

const SLOT_LAYOUT = Object.freeze({
  back: { xFrac: 0.30, yFrac: 0.60, depth: 10 },
  middle: { xFrac: 0.42, yFrac: 0.74, depth: 12 },
  front: { xFrac: 0.54, yFrac: 0.79, depth: 14 }
});

const BLITZER_CINEMATIC = Object.freeze({
  referenceHomeX: 190,
  referenceContactX: 765,
  x: Object.freeze([190,195,220,275,350,455,575,615,650,700,745,765,735,690,585,430,265,190]),
  y: Object.freeze([365,365,365,360,355,350,345,365,360,355,350,350,355,350,348,350,365,365]),
  scale: Object.freeze([0.44,0.44,0.45,0.46,0.47,0.48,0.49,0.48,0.50,0.52,0.53,0.54,0.51,0.49,0.48,0.47,0.45,0.44]),
  referenceY: 365,
  referenceScale: 0.44
});

export default class PartyFormationView {
  constructor(scene) {
    this.scene = scene;
    this.actors = new Map();
  }

  create(roster) {
    PARTY_SLOTS.forEach(({ slot, heroId }) => {
      const hero = roster.find(h => h.id === heroId);
      if (!hero) return;
      const tex = PARTY_ASSET_LOCK.textures[heroId];
      const texKey = tex && this.scene.textures.exists(tex.key) ? tex.key : null;
      if (!texKey) return;
      const originY = tex.contentBottomFrac;
      const sprite = this.scene.add.sprite(0, 0, texKey).setOrigin(0.5, originY);
      const ghost = this.scene.add.sprite(0, 0, texKey).setOrigin(0.5, originY).setAlpha(0);
      const ring = this.scene.add.ellipse(0, 0, 40, 14, 0x000000, 0)
        .setStrokeStyle(2.2, 0xffe8a0, 0).setDepth(SLOT_LAYOUT[slot].depth - 0.5);
      this.scene.worldAdd([ring, ghost, sprite]);
      sprite.setDepth(SLOT_LAYOUT[slot].depth);
      ghost.setDepth(SLOT_LAYOUT[slot].depth);

      let poseTex = null;
      if (hero.poses) {
        const map = {};
        let allLoaded = true;
        Object.entries(hero.poses).forEach(([pose, ptex]) => {
          if (this.scene.textures.exists(ptex)) map[pose] = ptex;
          else allLoaded = false;
        });
        if (allLoaded) poseTex = map;
      }

      let attackSprite = null;
      let attackSheetConfig = null;
      const sheetCfg = HERO_ATTACK_SHEETS[heroId];
      if (sheetCfg && this.scene.textures.exists(sheetCfg.key)) {
        attackSprite = this.scene.add.sprite(0, 0, sheetCfg.key, 0).setVisible(false);
        this.scene.worldAdd(attackSprite);
        attackSprite.setDepth(SLOT_LAYOUT[slot].depth);
        const animKey = `${sheetCfg.key}_play`;
        if (!this.scene.anims.exists(animKey)) {
          const frames = this.scene.anims.generateFrameNumbers(sheetCfg.key, { start: 0, end: sheetCfg.frameCount - 1 });
          frames.forEach((f, i) => { f.duration = sheetCfg.frameDurations[i] || 150; });
          this.scene.anims.create({ key: animKey, frames, repeat: 0 });
        }
        attackSheetConfig = sheetCfg;
      }

      let stateSheetConfig = null;
      let stateAnimKey = null;
      const stateCfg = HERO_STATE_SHEETS[heroId];
      if (stateCfg && this.scene.textures.exists(stateCfg.key)) {
        stateSheetConfig = stateCfg;
        const stateOriginY = stateCfg.baselinePx / stateCfg.frameHeight;
        sprite.setTexture(stateCfg.key, stateCfg.passiveFrame).setOrigin(0.5, stateOriginY);
        ghost.setTexture(stateCfg.key, stateCfg.passiveFrame).setOrigin(0.5, stateOriginY);
        stateAnimKey = `${stateCfg.key}_turn_entry`;
        if (!this.scene.anims.exists(stateAnimKey)) {
          const frames = stateCfg.turnFrames.map((frame, i) => ({ key: stateCfg.key, frame, duration: stateCfg.turnDurations[i] || 110 }));
          this.scene.anims.create({ key: stateAnimKey, frames, repeat: 0 });
        }
      }

      this.actors.set(heroId, {
        sprite, ghost, ring, slot, hero, poseTex,
        standbyTex: stateSheetConfig ? stateSheetConfig.key : texKey,
        standbyOriginY: stateSheetConfig ? stateSheetConfig.baselinePx / stateCfg.frameHeight : originY,
        _snapshot: null, _poseScale: null,
        attackSprite, attackSheetConfig,
        stateSheetConfig, stateAnimKey
      });
    });
    this.layout();
    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => this.scene.scale.off('resize', this.layout, this));
  }

  layout() {
    const w = this.scene.scale.width, h = this.scene.scale.height;
    const targetAuryiContentH = h * 0.40;
    const commonScale = targetAuryiContentH / PARTY_ASSET_LOCK.normalizedHeightPx.auryi;
    this.actors.forEach((actor, heroId) => {
      if (actor._snapshot) return;
      const { sprite, ghost, ring, slot } = actor;
      const pos = SLOT_LAYOUT[slot];
      const scale = actor.stateSheetConfig
        ? (PARTY_ASSET_LOCK.normalizedHeightPx[heroId] * commonScale) / actor.stateSheetConfig.contentHeightPx
        : heightScaleFor(heroId, commonScale);
      sprite.setScale(scale); ghost.setScale(scale);
      const x = Math.round(w * pos.xFrac), y = Math.round(h * pos.yFrac);
      sprite.setPosition(x, y); ghost.setPosition(x, y); ring.setPosition(x, y + 6);
      ring.setSize(sprite.displayWidth * 0.5, sprite.displayWidth * 0.18);
    });
  }

  setActive(heroId) {
    this.actors.forEach((actor, id) => {
      const on = id === heroId;
      this.scene.tweens.killTweensOf(actor.ring);
      this.scene.tweens.add({ targets: actor.ring, alpha: on ? 1 : 0, duration: 180, ease: 'Sine.easeOut' });
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
      const done = () => { sprite.off('animationcomplete', done); sprite.setFrame(stateSheetConfig.activeFrame); resolve(); };
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
  }

  hit(heroId) {
    const actor = this.actors.get(heroId); if (!actor) return;
    const { sprite } = actor, homeX = sprite.x;
    this.scene.tweens.killTweensOf(sprite);
    this.scene.tweens.add({ targets: sprite, x: homeX + 10, angle: 2.5, duration: 60, yoyo: true, ease: 'Quad.easeOut', onComplete: () => sprite.setPosition(homeX, sprite.y).setAngle(0) });
  }

  attackGatherPulse(heroId) {
    const actor = this.actors.get(heroId); if (!actor) return Promise.resolve();
    const { sprite } = actor, baseScale = sprite.scaleX;
    return new Promise(resolve => this.scene.tweens.add({ targets: sprite, scaleX: baseScale * 1.05, scaleY: baseScale * 1.05, duration: 260, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => { sprite.setScale(baseScale); resolve(); } }));
  }

  attackLunge(heroId) {
    const actor = this.actors.get(heroId); if (!actor) return Promise.resolve();
    const { sprite } = actor, homeX = sprite.x;
    return new Promise(resolve => this.scene.tweens.add({ targets: sprite, x: homeX + 34, duration: 160, yoyo: true, hold: 90, ease: 'Back.easeOut', onComplete: () => { sprite.setPosition(homeX, sprite.y); resolve(); } }));
  }

  hasAttackSheet(heroId) {
    const actor = this.actors.get(heroId);
    if (heroId === 'kineza' && (!actor || !actor.attackSprite || !actor.attackSheetConfig)) {
      throw new Error('[PV BLITZER] Kineza Blitzer 18F failed to bind. Old fallback intentionally blocked.');
    }
    return !!(actor && actor.attackSprite);
  }

  playAttackSheet(heroId, onFrame) {
    const actor = this.actors.get(heroId);
    if (!actor || !actor.attackSprite) return Promise.resolve();
    const { sprite, attackSprite, hero } = actor;
    const cfg = actor.attackSheetConfig;
    const originY = cfg.baselinePx / cfg.frameHeight;
    const baseScale = (actor.stateSheetConfig && cfg.contentHeightPx)
      ? (sprite.scaleY * actor.stateSheetConfig.contentHeightPx) / cfg.contentHeightPx
      : (sprite.displayHeight / cfg.frameHeight) * (hero.scaleMul || 1);
    const homeX = sprite.x;
    const homeY = sprite.y;
    const enemyX = this.scene.enemyView?.container?.x ?? (this.scene.scale.width * 0.74);
    const contactX = enemyX - (this.scene.scale.width * (cfg.travel?.contactXOffsetFrac ?? 0.10));

    this.scene.tweens.killTweensOf(attackSprite);
    attackSprite.setOrigin(0.5, originY).setScale(baseScale).setPosition(homeX, homeY)
      .setFlipX(sprite.flipX).setAlpha(1).setVisible(true);
    sprite.setVisible(false);

    return new Promise(resolve => {
      const animKey = `${cfg.key}_play`;
      const onUpdate = (_anim, frame) => {
        const i = frame.index - 1;
        if (heroId === 'kineza' && cfg.frameCount === 18) {
          const refSpan = BLITZER_CINEMATIC.referenceContactX - BLITZER_CINEMATIC.referenceHomeX;
          const refX = BLITZER_CINEMATIC.x[i] ?? BLITZER_CINEMATIC.referenceHomeX;
          const xProgress = Phaser.Math.Clamp((refX - BLITZER_CINEMATIC.referenceHomeX) / refSpan, 0, 1);
          attackSprite.x = Phaser.Math.Linear(homeX, contactX, xProgress);
          const yDelta = (BLITZER_CINEMATIC.y[i] ?? BLITZER_CINEMATIC.referenceY) - BLITZER_CINEMATIC.referenceY;
          attackSprite.y = homeY + (yDelta / 540) * this.scene.scale.height;
          const scaleMul = (BLITZER_CINEMATIC.scale[i] ?? BLITZER_CINEMATIC.referenceScale) / BLITZER_CINEMATIC.referenceScale;
          attackSprite.setScale(baseScale * scaleMul);
        } else if (cfg.travel?.frameProgress) {
          const p = Phaser.Math.Clamp(cfg.travel.frameProgress[i] ?? 0, 0, 1);
          attackSprite.x = Phaser.Math.Linear(homeX, contactX, p);
        }
        if (onFrame) onFrame(i);
      };
      attackSprite.on('animationupdate', onUpdate);
      attackSprite.once('animationcomplete', () => {
        attackSprite.off('animationupdate', onUpdate);
        attackSprite.setPosition(homeX, homeY).setScale(baseScale).setVisible(false);
        sprite.setVisible(true);
        resolve();
      });
      attackSprite.play(animKey);
    });
  }

  hasActionPoses(heroId) {
    const actor = this.actors.get(heroId);
    return !!(actor && actor.poseTex);
  }

  setActionPose(heroId, pose) {
    const actor = this.actors.get(heroId); if (!actor || !actor.poseTex) return false;
    const { sprite, hero } = actor;
    if (pose === 'idle') {
      if (!actor._snapshot) return true;
      const snap = actor._snapshot;
      this._crossfade(actor, actor.standbyTex, false, snap.originY, snap);
      actor._snapshot = null; actor._poseScale = null; return true;
    }
    const texKey = actor.poseTex[pose]; if (!texKey) return false;
    if (!actor._snapshot) {
      actor._snapshot = { x: sprite.x, y: sprite.y, scaleX: sprite.scaleX, scaleY: sprite.scaleY, originY: sprite.originY };
      const idleTex = this.scene.textures.get(actor.poseTex.idle), idleImg = idleTex && idleTex.getSourceImage();
      const mul = hero.scaleMul || 1;
      actor._poseScale = (idleImg && idleImg.height) ? (sprite.displayHeight / idleImg.height) * mul : sprite.scaleX;
    }
    const flip = !!(hero.flip && hero.flip[pose]);
    const nudge = (pose === 'release' && heroId !== 'prismel') ? 18 : 0;
    this._crossfade(actor, texKey, flip, 1, { x: actor._snapshot.x + nudge, y: actor._snapshot.y, scaleX: actor._poseScale, scaleY: actor._poseScale });
    return true;
  }

  _crossfade(actor, texKey, flipX, originY, transform) {
    const { sprite, ghost } = actor;
    this.scene.tweens.killTweensOf(sprite); this.scene.tweens.killTweensOf(ghost);
    if (sprite.texture.key !== texKey) {
      ghost.setTexture(sprite.texture.key).setOrigin(sprite.originX, sprite.originY).setPosition(sprite.x, sprite.y)
        .setScale(sprite.scaleX, sprite.scaleY).setFlipX(sprite.flipX).setAlpha(1);
      sprite.setTexture(texKey).setAlpha(0);
    }
    sprite.setOrigin(0.5, originY).setFlipX(flipX).setScale(transform.scaleX, transform.scaleY);
    this.scene.tweens.add({ targets: sprite, x: transform.x, y: transform.y, alpha: 1, duration: 130, ease: 'Sine.easeInOut', onComplete: () => { sprite.setAlpha(1); ghost.setAlpha(0); } });
  }

  guardPose(heroId, on) {
    const actor = this.actors.get(heroId); if (!actor) return;
    this.scene.tweens.add({ targets: actor.sprite, alpha: on ? 0.82 : 1, duration: 160, ease: 'Sine.easeOut' });
  }
}
