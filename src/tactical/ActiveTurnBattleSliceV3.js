// Active-Turn Battle Slice — 05E-3 composition correction.
//
// 05E-2 proved state mutation and authored Prismel frames, but framed combat
// by zooming the live Tactical camera at an enemy grid coordinate. On phone
// that magnified a tiny patch of backyard scenery while the Hushling stayed a
// map-scale token. 05E-3 changes only presentation: Tactical remains the live
// state/background, while Prismel + the target are promoted to battle-sized
// screen-space actors. No separate BP scene is launched.

import ActiveTurnBattleSlice, {
  PRISMEL_READY_FRAMES,
  PRISMEL_ATTACK_FRAMES
} from './ActiveTurnBattleSlice.js?v=3';

export { PRISMEL_READY_FRAMES, PRISMEL_ATTACK_FRAMES };

export const ACTIVE_HUSHLING_TEXTURES = Object.freeze({
  idle: 'hushling_active_idle',
  hit: 'hushling_active_hit'
});

export default class ActiveTurnBattleSliceV3 extends ActiveTurnBattleSlice {
  constructor(scene) {
    super(scene);
    this._enemyImage = null;
    this._enemySigil = null;
    this._worldActorState = [];
  }

  // Reuse 05E-2's proven HUD geometry, but give the central live-view area
  // explicit fighter anchors instead of squeezing Prismel into the space
  // between bottom cards.
  _layoutMetrics() {
    const m = super._layoutMetrics();

    if (m.landscape) {
      m.cutin = {
        x: m.margin + 4,
        bottomY: m.h - m.margin + 8,
        maxW: Math.min(m.w * 0.40, 390),
        maxH: Math.max(150, m.h * 0.70)
      };
      m.enemy = {
        x: m.w * 0.73,
        bottomY: m.h - m.margin + 4,
        maxW: Math.min(m.w * 0.30, 285),
        maxH: Math.max(135, m.h * 0.56)
      };
      return m;
    }

    const stageTop = m.target.y + m.target.h + 8;
    const stageBottom = m.hero.y + 12;
    const stageH = Math.max(180, stageBottom - stageTop);

    m.cutin = {
      x: m.margin,
      bottomY: stageBottom,
      maxW: m.w * (m.compact ? 0.55 : 0.43),
      maxH: stageH * 1.02
    };
    m.enemy = {
      x: m.w * (m.compact ? 0.74 : 0.73),
      bottomY: stageBottom - 4,
      maxW: m.w * (m.compact ? 0.32 : 0.28),
      maxH: stageH * 0.72
    };
    return m;
  }

  _fitImage(img, maxW, maxH) {
    const tex = img.texture.getSourceImage();
    const sw = tex && tex.width ? tex.width : 1;
    const sh = tex && tex.height ? tex.height : 1;
    let h = Math.min(maxH, sh);
    let w = h * (sw / sh);
    if (w > maxW) {
      w = maxW;
      h = w * (sh / sw);
    }
    img.setDisplaySize(Math.max(1, w), Math.max(1, h));
  }

  // Keep the existing authored Prismel frame cycling, but anchor the actor
  // to the left side of the battle composition.
  _layoutCutin() {
    if (!this._cutinImage) return;
    const c = this._layoutMetrics().cutin;
    this._fitImage(this._cutinImage, c.maxW, c.maxH);
    this._cutinImage.setPosition(c.x, c.bottomY);
  }

  _ensureEnemy() {
    if (this._enemyImage) return this._enemyImage;

    const s = this.scene;
    const sigil = s.add.ellipse(0, 0, 100, 26, 0x241238, 0.30)
      .setStrokeStyle(2, 0xd878ff, 0.76)
      .setDepth(9340)
      .setAlpha(0);
    this._uiObject(sigil);
    this._enemySigil = sigil;

    const img = s.add.image(0, 0, ACTIVE_HUSHLING_TEXTURES.idle)
      .setOrigin(0.5, 1)
      .setDepth(9350)
      .setAlpha(0);
    this._uiObject(img);
    this._enemyImage = img;
    this._layoutEnemy();
    return img;
  }

  _layoutEnemy() {
    if (!this._enemyImage) return;
    const e = this._layoutMetrics().enemy;
    this._fitImage(this._enemyImage, e.maxW, e.maxH);
    this._enemyImage.setPosition(e.x, e.bottomY);

    if (this._enemySigil) {
      const w = Math.max(72, this._enemyImage.displayWidth * 0.78);
      const h = Math.max(18, w * 0.22);
      this._enemySigil
        .setSize(w, h)
        .setPosition(e.x, e.bottomY - 2);
    }
  }

  async _introEnemy() {
    const s = this.scene;
    const enemy = this._ensureEnemy();
    this._layoutEnemy();
    const homeX = enemy.x;
    enemy.setX(homeX + Math.max(24, s.scale.width * 0.04));

    s.tweens.add({
      targets: [enemy, this._enemySigil],
      alpha: 1,
      duration: 260,
      ease: 'Sine.easeOut'
    });
    s.tweens.add({
      targets: enemy,
      x: homeX,
      duration: 320,
      ease: 'Quad.easeOut'
    });
  }

  _projectileEndpoints() {
    const hero = this._cutinImage;
    const enemy = this._enemyImage;

    if (!hero || !enemy) {
      const m = this._layoutMetrics();
      return {
        start: { x: m.w * 0.34, y: m.h * 0.48 },
        end: { x: m.w * 0.69, y: m.h * 0.48 }
      };
    }

    return {
      start: {
        x: hero.x + hero.displayWidth * 0.78,
        y: hero.y - hero.displayHeight * 0.55
      },
      end: {
        x: enemy.x - enemy.displayWidth * 0.28,
        y: enemy.y - enemy.displayHeight * 0.48
      }
    };
  }

  _launchVisibleProjectile() {
    const s = this.scene;
    const { start, end } = this._projectileEndpoints();
    const g = s.add.graphics().setDepth(9460);
    this._uiObject(g);

    return new Promise(resolve => {
      const driver = { t: 0 };
      s.tweens.add({
        targets: driver,
        t: 1,
        duration: 250,
        ease: 'Cubic.easeIn',
        onUpdate: () => {
          const t = driver.t;
          const x = start.x + (end.x - start.x) * t;
          const y = start.y + (end.y - start.y) * t
            - Math.sin(Math.PI * t) * 10;

          g.clear();
          g.lineStyle(5, 0x6bcfff, 0.16 * (1 - t * 0.25));
          g.beginPath();
          g.moveTo(start.x, start.y);
          g.lineTo(x, y);
          g.strokePath();

          g.lineStyle(2.2, 0xe2c4ff, 0.72);
          g.beginPath();
          g.moveTo(start.x, start.y);
          g.lineTo(x, y);
          g.strokePath();

          g.fillStyle(0xffe8a0, 0.96);
          g.fillCircle(x, y, 5.5);
          g.fillStyle(0x9fe0ff, 0.82);
          g.fillCircle(x - 5, y + 2, 2.6);
          g.fillStyle(0xd878ff, 0.78);
          g.fillCircle(x + 3, y - 4, 2.2);
        },
        onComplete: () => {
          g.destroy();
          this.layers = this.layers.filter(o => o !== g);
          resolve();
        }
      });
    });
  }

  // The visible projectile now connects the visible Prismel artwork to the
  // visible Hushling artwork. No hidden map-token-to-map-token shot.
  async _playAttackPresentation() {
    this._ensureCutin();
    this._ensureEnemy();

    await this._cycleFrames(PRISMEL_ATTACK_FRAMES.slice(0, 4), 100);
    await Promise.all([
      this._cycleFrames(PRISMEL_ATTACK_FRAMES.slice(4), 110),
      this._launchVisibleProjectile()
    ]);
  }

  // Impact belongs to the promoted target actor. The Tactical Hushling token
  // stays hidden until the presentation closes, then returns with its real HP.
  _impactBurst() {
    const s = this.scene;
    const enemy = this._ensureEnemy();
    enemy.setTexture(ACTIVE_HUSHLING_TEXTURES.hit);
    this._layoutEnemy();

    const baseX = enemy.x;
    s.tweens.add({
      targets: enemy,
      x: baseX + 16,
      angle: 2.4,
      duration: 72,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!enemy.active) return;
        enemy.setX(baseX).setAngle(0);
      }
    });

    const { end } = this._projectileEndpoints();
    const ring = s.add.ellipse(end.x, end.y, 34, 18, 0x000000, 0)
      .setStrokeStyle(2.6, 0xffe8a0, 0.92)
      .setDepth(9465);
    this._uiObject(ring);
    s.tweens.add({
      targets: ring,
      scaleX: 3.0,
      scaleY: 2.3,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        ring.destroy();
        this.layers = this.layers.filter(o => o !== ring);
      }
    });

    const dmg = s.add.text(
      enemy.x,
      enemy.y - enemy.displayHeight * 0.72,
      `-${ActiveTurnBattleSlice.FIXED_DAMAGE}`,
      {
        fontFamily: 'Georgia, serif',
        fontStyle: 'bold',
        fontSize: Math.round(Math.max(24, s.scale.width * 0.055)) + 'px',
        color: '#FFE8A0',
        stroke: '#2A1024',
        strokeThickness: 4
      }
    ).setOrigin(0.5).setDepth(9470);
    this._uiObject(dmg);
    s.tweens.add({
      targets: dmg,
      y: dmg.y - 34,
      alpha: 0,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => {
        dmg.destroy();
        this.layers = this.layers.filter(o => o !== dmg);
      }
    });

    s.cameras.main.shake(135, 0.0045);

    this._timer(380, () => {
      if (!enemy.active) return;
      enemy.setTexture(ACTIVE_HUSHLING_TEXTURES.idle);
      this._layoutEnemy();
    });
  }

  _stageWorldActors(hero, target) {
    const units = [
      ...(this.scene.heroes || []),
      ...(this.scene.enemies || [])
    ];

    this._worldActorState = units.map(unit => ({
      unit,
      visible: unit.sprite ? unit.sprite.visible : true,
      alpha: unit.sprite ? unit.sprite.alpha : 1
    }));

    units.forEach(unit => {
      if (!unit.sprite) return;
      if (unit === hero || unit === target) {
        unit.sprite.setVisible(false);
      } else {
        unit.sprite.setAlpha(0.22);
      }
    });
  }

  _restoreWorldActors() {
    this._worldActorState.forEach(({ unit, visible, alpha }) => {
      if (!unit || !unit.sprite) return;
      unit.sprite.setVisible(visible);
      unit.sprite.setAlpha(alpha);
    });
    this._worldActorState = [];
  }

  _teardownVisuals() {
    super._teardownVisuals();
    this._enemyImage = null;
    this._enemySigil = null;
  }

  async _fadePresentation(hud) {
    const targets = [
      hud && hud.container,
      this._cutinImage,
      this._enemyImage,
      this._enemySigil
    ].filter(Boolean);

    if (!targets.length) return;

    await new Promise(resolve => {
      this.scene.tweens.add({
        targets,
        alpha: 0,
        duration: 220,
        ease: 'Sine.easeIn',
        onComplete: resolve
      });
    });
  }

  async run(hero, target) {
    if (this._running) return;
    this._running = true;
    this._resolved = false;

    const s = this.scene;
    s.inputLocked = true;
    s.grid.clearAllOverlays();
    this._hideBackgroundHud();
    this._stageWorldActors(hero, target);

    s.tacticalCamera.saveCinematicState();
    this._vignettePulse();

    // The camera now supplies environmental context only. A restrained push
    // keeps house/lawn/pool/props readable instead of zooming to 2x on one
    // raw target tile. Fighter placement is handled explicitly above.
    const w = s.scale.width;
    const h = s.scale.height;
    const compact = w < 560 || h < 520;
    const landscape = w > h;
    const desiredZoom = compact
      ? (landscape ? 1.02 : 0.88)
      : 1.08;

    const focusX = (hero.x + target.x) / 2;
    const focusY = (hero.y + target.y) / 2;
    s.tacticalCamera.setZoom(desiredZoom);
    s.tacticalCamera.focusOn(focusX, focusY, 420);
    await this._delay(450);

    this._introEnemy();
    const introDone = this._introCutin();
    const hud = this._buildHud(hero, target);
    s.tweens.add({
      targets: hud.container,
      alpha: 1,
      duration: 220,
      ease: 'Sine.easeOut'
    });
    await introDone;

    const choice = await new Promise(resolve => {
      hud.confirmBg.once('pointerdown', () => resolve('confirm'));
      hud.backBg.once('pointerdown', () => resolve('back'));
    });

    if (choice === 'back') {
      await this._fadePresentation(hud);
      this._restoreWorldActors();
      this._teardownVisuals();
      await s.tacticalCamera.restoreCinematicState(340);
      this._restoreBackgroundHud();
      this._cancelToTacticalSelection();
      s.inputLocked = false;
      this._running = false;
      this._resolved = true;
      return;
    }

    hud.confirmBg.disableInteractive().setAlpha(0.5);
    hud.backBg.disableInteractive().setAlpha(0.5);

    await this._playAttackPresentation();

    target.hp = Math.max(0, target.hp - ActiveTurnBattleSlice.FIXED_DAMAGE);
    this._impactBurst();
    this._updateHudHp(hud, hero, target);
    s.setMessage(`${target.name} suffers ${ActiveTurnBattleSlice.FIXED_DAMAGE} damage!`);
    if (target.hp <= 0) s.defeatEnemy(target);

    await this._delay(700);

    await this._fadePresentation(hud);
    this._restoreWorldActors();
    this._teardownVisuals();
    await s.tacticalCamera.restoreCinematicState(360);
    this._restoreBackgroundHud();

    s.grid.clearAllOverlays();
    s.finishHeroAction(hero);
    s.checkVictoryDefeat();

    s.inputLocked = false;
    this._running = false;
    this._resolved = true;
  }
}
