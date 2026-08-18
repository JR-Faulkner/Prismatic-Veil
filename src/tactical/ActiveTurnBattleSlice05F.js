// 05F — mock-driven active-turn battle presentation.
//
// This pass stops treating active-turn combat as "zoomed Tactical" and builds
// the approved Too Quiet mock as a dedicated presentation layer while Tactical
// stays underneath as the state/environment authority.
//
// Goals:
// - Prismel foreground-left, Hushling mid/right, backyard clearly readable.
// - Mock-style turn/enemy/hero/ability/objective HUD hierarchy.
// - Stable authored Prismel key poses using common scale/feet anchoring plus
//   cross-dissolves instead of hard texture pops.
// - Living prismatic shards during ready + a real moving shard volley on fire.
// - Clean opaque Hushling rig and deterministic Tactical damage/state return.

import ActiveTurnBattleSliceV3B from './ActiveTurnBattleSliceV3B.js?v=1';
import ActiveTurnBattleSlice, {
  PRISMEL_READY_FRAMES,
  PRISMEL_ATTACK_FRAMES
} from './ActiveTurnBattleSlice.js?v=3';

const GOLD = 0xc9a45d;
const GOLD_BRIGHT = 0xffe6a0;
const NAVY = 0x070b18;
const NAVY_2 = 0x0d1425;
const VIOLET_BRIGHT = 0xd29cff;
const PRISM_BLUE = 0x78d8ff;
const HP_GREEN = 0x5fcf78;
const RP_PURPLE = 0x7e54d8;
const ENEMY_RED = 0xa92645;

export default class ActiveTurnBattleSlice05F extends ActiveTurnBattleSliceV3B {
  constructor(scene) {
    super(scene);
    this._heroRig = null;
    this._cutinGhost = null;
    this._ambientShardRig = null;
    this._ambientShardTween = null;
    this._stageWash = null;
    this._mockHud = null;
  }

  _layoutMetrics() {
    const m = super._layoutMetrics();
    const { w, h } = m;
    const landscape = w > h;
    const compact = w < 620 || h < 520;

    if (landscape) {
      m.cutin = {
        x: w * (compact ? 0.22 : 0.24),
        bottomY: h * 0.91,
        maxW: w * (compact ? 0.42 : 0.40),
        maxH: h * 0.78
      };
      m.enemy = {
        x: w * (compact ? 0.72 : 0.73),
        bottomY: h * 0.83,
        maxW: w * (compact ? 0.25 : 0.23),
        maxH: h * 0.55
      };
      return m;
    }

    m.cutin = {
      x: w * 0.27,
      bottomY: h * 0.67,
      maxW: w * 0.58,
      maxH: h * 0.48
    };
    m.enemy = {
      x: w * 0.76,
      bottomY: h * 0.60,
      maxW: w * 0.31,
      maxH: h * 0.34
    };
    return m;
  }

  _heroLayerLayout(img) {
    if (!img) return;
    const c = this._layoutMetrics().cutin;
    const env = this._frameEnvelope();
    const meta = this._frameMeta(img.texture.key);
    const scale = Math.min(c.maxW / env.maxW, c.maxH / env.maxH);
    img
      .setOrigin(meta.anchorX / meta.sw, meta.anchorY / meta.sh)
      .setScale(Math.max(0.001, scale))
      .setPosition(0, 0);
  }

  _ensureCutin() {
    if (this._heroRig && this._cutinImage) return this._cutinImage;
    const s = this.scene;
    const c = this._layoutMetrics().cutin;

    const rig = s.add.container(c.x, c.bottomY).setDepth(9400).setAlpha(0);
    this._uiObject(rig);

    const shadow = s.add.ellipse(0, 2, Math.max(120, c.maxW * 0.60), 24, 0x02030a, 0.46)
      .setStrokeStyle(1.2, 0x4f347f, 0.40);
    const glow = s.add.ellipse(c.maxW * 0.15, -c.maxH * 0.42, 92, 92, 0x6c43d5, 0.10)
      .setBlendMode('ADD');

    const ghost = s.add.image(0, 0, PRISMEL_READY_FRAMES[0]).setAlpha(0);
    const img = s.add.image(0, 0, PRISMEL_READY_FRAMES[0]).setAlpha(1);
    rig.add([shadow, glow, ghost, img]);

    this._heroRig = rig;
    this._cutinGhost = ghost;
    this._cutinImage = img;
    this._heroShadow = shadow;
    this._heroGlow = glow;
    this._layoutCutin();
    return img;
  }

  _layoutCutin() {
    if (!this._heroRig || !this._cutinImage) return;
    const c = this._layoutMetrics().cutin;
    this._heroRig.setPosition(c.x, c.bottomY);
    this._heroLayerLayout(this._cutinImage);
    this._heroLayerLayout(this._cutinGhost);

    if (this._heroShadow) {
      this._heroShadow.setSize(Math.max(115, c.maxW * 0.56), Math.max(18, c.maxH * 0.035));
    }
    if (this._heroGlow) {
      this._heroGlow.setPosition(c.maxW * 0.12, -c.maxH * 0.40);
    }
  }

  async _cycleFrames(frameKeys, frameMs) {
    const img = this._ensureCutin();
    const ghost = this._cutinGhost;

    for (const key of frameKeys) {
      if (!img.active) return;
      if (img.texture.key === key) {
        this._layoutCutin();
        await this._delay(Math.max(70, frameMs));
        continue;
      }

      ghost.setTexture(img.texture.key).setAlpha(1);
      this._heroLayerLayout(ghost);
      img.setTexture(key).setAlpha(0);
      this._heroLayerLayout(img);

      const blendMs = Math.min(95, Math.max(55, Math.round(frameMs * 0.58)));
      this.scene.tweens.add({ targets: ghost, alpha: 0, duration: blendMs, ease: 'Sine.easeInOut' });
      this.scene.tweens.add({ targets: img, alpha: 1, duration: blendMs, ease: 'Sine.easeInOut' });
      await this._delay(Math.max(blendMs + 18, frameMs));
    }
  }

  _heroHandPoint() {
    this._ensureCutin();
    const b = this._cutinImage.getBounds();
    return {
      x: b.left + b.width * 0.79,
      y: b.top + b.height * 0.42
    };
  }

  _diamond(x, y, size, colour, alpha = 1) {
    const s = this.scene;
    return s.add.polygon(x, y, [0, -size, size * 0.62, 0, 0, size, -size * 0.62, 0], colour, alpha)
      .setStrokeStyle(1.4, GOLD_BRIGHT, Math.min(1, alpha + 0.08));
  }

  _ensureAmbientShards() {
    if (this._ambientShardRig) return this._ambientShardRig;
    const s = this.scene;
    const rig = s.add.container(0, 0).setDepth(9440).setAlpha(0);
    this._uiObject(rig);

    const shards = [
      this._diamond(0, 0, 7, 0x8b6cff, 0.90),
      this._diamond(0, 0, 5, 0x69caff, 0.85),
      this._diamond(0, 0, 6, 0xd66bff, 0.82),
      this._diamond(0, 0, 4, 0xffc76e, 0.82),
      this._diamond(0, 0, 5.5, 0x9b7cff, 0.78)
    ];
    rig.add(shards);
    this._ambientShardRig = rig;
    this._ambientShards = shards;

    const driver = { t: 0 };
    this._ambientShardTween = s.tweens.add({
      targets: driver,
      t: Math.PI * 2,
      duration: 3000,
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => {
        if (!rig.active) return;
        const p = this._heroHandPoint();
        rig.setPosition(p.x, p.y);
        shards.forEach((shard, i) => {
          const a = driver.t + i * (Math.PI * 2 / shards.length);
          const rx = 28 + i * 3.5;
          const ry = 13 + (i % 2) * 7;
          shard.setPosition(Math.cos(a) * rx, Math.sin(a * 1.18) * ry - 4);
          shard.setRotation(-a * 1.5 + i * 0.6);
          shard.setScale(0.84 + Math.sin(a * 2 + i) * 0.12);
        });
      }
    });
    return rig;
  }

  async _introCutin() {
    const img = this._ensureCutin();
    const rig = this._heroRig;
    img.setTexture(PRISMEL_READY_FRAMES[0]).setAlpha(1);
    this._layoutCutin();

    const shards = this._ensureAmbientShards();
    this.scene.tweens.add({ targets: rig, alpha: 1, duration: 260, ease: 'Sine.easeOut' });
    this.scene.tweens.add({ targets: shards, alpha: 1, duration: 360, ease: 'Sine.easeOut', delay: 180 });
    await this._cycleFrames(PRISMEL_READY_FRAMES, 145);
    img.setTexture(PRISMEL_READY_FRAMES[PRISMEL_READY_FRAMES.length - 1]).setAlpha(1);
    this._layoutCutin();
  }

  _projectileEndpoints() {
    const start = this._heroHandPoint();
    const rig = this._enemyRig;
    const enemy = this._enemyImage;
    if (!rig || !enemy) return super._projectileEndpoints();
    return {
      start,
      end: {
        x: rig.x - enemy.displayWidth * 0.22,
        y: rig.y - enemy.displayHeight * 0.48
      }
    };
  }

  _releaseShardVolley() {
    const s = this.scene;
    const { start, end } = this._projectileEndpoints();
    const rig = s.add.container(0, 0).setDepth(9460);
    this._uiObject(rig);

    const promises = [];
    const offsets = [-20, -11, -4, 5, 13, 21];
    offsets.forEach((off, i) => {
      const shard = this._diamond(start.x, start.y, 7 + (i % 3) * 2.3,
        [0x78d8ff, 0xa97bff, 0xe281ff, 0xffc46b][i % 4], 0.96)
        .setDepth(9461 + i)
        .setRotation(i * 0.7);
      rig.add(shard);

      promises.push(new Promise(resolve => {
        const driver = { t: 0 };
        s.tweens.add({
          targets: driver,
          t: 1,
          duration: 300 + i * 18,
          delay: i * 26,
          ease: 'Cubic.easeIn',
          onUpdate: () => {
            const t = driver.t;
            const arc = Math.sin(Math.PI * t) * (18 + i * 2);
            shard.setPosition(
              start.x + (end.x - start.x) * t,
              start.y + (end.y - start.y) * t + off * (1 - t) - arc
            );
            shard.setRotation(shard.rotation + 0.16);
            shard.setScale(1 + t * 0.22);
          },
          onComplete: () => {
            shard.destroy();
            resolve();
          }
        });
      }));
    });

    const trail = s.add.graphics().setDepth(9459);
    rig.add(trail);
    const driver = { t: 0 };
    promises.push(new Promise(resolve => {
      s.tweens.add({
        targets: driver,
        t: 1,
        duration: 390,
        ease: 'Cubic.easeIn',
        onUpdate: () => {
          const t = driver.t;
          const x = start.x + (end.x - start.x) * t;
          const y = start.y + (end.y - start.y) * t - Math.sin(Math.PI * t) * 16;
          trail.clear();
          trail.lineStyle(7, PRISM_BLUE, 0.09 * (1 - t * 0.35));
          trail.beginPath(); trail.moveTo(start.x, start.y); trail.lineTo(x, y); trail.strokePath();
          trail.lineStyle(2.2, VIOLET_BRIGHT, 0.62 * (1 - t * 0.2));
          trail.beginPath(); trail.moveTo(start.x, start.y); trail.lineTo(x, y); trail.strokePath();
        },
        onComplete: resolve
      });
    }));

    return Promise.all(promises).then(() => {
      if (rig.active) rig.destroy();
      this.layers = this.layers.filter(o => o !== rig);
    });
  }

  async _playAttackPresentation() {
    this._ensureCutin();
    this._ensureEnemy();
    const ambient = this._ensureAmbientShards();

    this.scene.tweens.add({ targets: ambient, scale: 1.22, duration: 360, yoyo: true, ease: 'Sine.easeInOut' });
    await this._cycleFrames(PRISMEL_ATTACK_FRAMES.slice(0, 4), 155);
    this.scene.tweens.add({ targets: ambient, alpha: 0.22, duration: 110 });
    await Promise.all([
      this._cycleFrames(PRISMEL_ATTACK_FRAMES.slice(4), 170),
      this._releaseShardVolley()
    ]);
    this.scene.tweens.add({ targets: ambient, alpha: 0.78, duration: 180 });
  }

  _spawnImpactFragments() {
    const s = this.scene;
    const { end } = this._projectileEndpoints();
    const container = s.add.container(0, 0).setDepth(9472);
    this._uiObject(container);

    for (let i = 0; i < 9; i++) {
      const shard = this._diamond(end.x, end.y, 3 + (i % 3),
        [0x78d8ff, 0xa97bff, 0xe281ff, 0xffd26f][i % 4], 0.94);
      container.add(shard);
      const angle = (Math.PI * 2 * i / 9) + 0.2;
      const dist = 34 + (i % 4) * 10;
      s.tweens.add({
        targets: shard,
        x: end.x + Math.cos(angle) * dist,
        y: end.y + Math.sin(angle) * dist,
        rotation: angle * 2.4,
        alpha: 0,
        duration: 360 + i * 20,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }
    this._timer(620, () => {
      if (container.active) container.destroy();
      this.layers = this.layers.filter(o => o !== container);
    });
  }

  _impactBurst() {
    super._impactBurst();
    this._spawnImpactFragments();
  }

  _stageBackdropWash() {
    if (this._stageWash) return;
    const s = this.scene;
    const w = s.scale.width, h = s.scale.height;
    const top = s.add.rectangle(0, 0, w, Math.max(50, h * 0.14), 0x050814, 0.18).setOrigin(0, 0);
    const bottom = s.add.rectangle(0, h * 0.74, w, h * 0.26, 0x050814, 0.14).setOrigin(0, 0);
    const c = s.add.container(0, 0).setDepth(9310).setAlpha(0);
    c.add([top, bottom]);
    this._uiObject(c);
    this._stageWash = c;
    s.tweens.add({ targets: c, alpha: 1, duration: 260, ease: 'Sine.easeOut' });
  }

  _panelRect(x, y, w, h, alpha = 0.90) {
    return this.scene.add.rectangle(x, y, w, h, NAVY, alpha)
      .setOrigin(0, 0)
      .setStrokeStyle(1.6, GOLD, 0.82);
  }

  _label(x, y, text, size, colour = '#F7E8B6', originX = 0, originY = 0) {
    return this.scene.add.text(x, y, text, {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: `${Math.round(size)}px`,
      color: colour,
      stroke: '#050712',
      strokeThickness: size >= 18 ? 2 : 1
    }).setOrigin(originX, originY);
  }

  _buildMockHud(hero, target) {
    const s = this.scene;
    const w = s.scale.width, h = s.scale.height;
    const landscape = w > h;
    const compact = w < 680 || h < 520;
    const layer = s.add.container(0, 0).setDepth(9500).setAlpha(0);
    const p = [];

    const turnX = compact ? 12 : 20;
    const turnY = compact ? 10 : 16;
    const turnLabel = this._label(turnX, turnY, 'TURN', compact ? 12 : 14, '#D7B97D');
    const turnNum = this._label(turnX, turnY + (compact ? 13 : 16), String(s.turn || 1).padStart(2, '0'), compact ? 28 : 34, '#F1D79C');
    p.push(turnLabel, turnNum);

    const orderPortraits = [hero.portraitKey, 'portrait_auryi', 'portrait_kineza', target.portraitKey];
    let ox = turnX + (compact ? 62 : 78);
    orderPortraits.forEach((key, i) => {
      const d = compact ? 34 : 42;
      const bg = s.add.circle(ox + i * (d + 8), turnY + d * 0.72, d * 0.5, NAVY_2, 0.95)
        .setStrokeStyle(1.4, i === 0 ? GOLD_BRIGHT : GOLD, i === 0 ? 1 : 0.55);
      const img = s.add.image(bg.x, bg.y, key);
      const src = img.texture.getSourceImage();
      const ratio = (src && src.width && src.height) ? src.width / src.height : 1;
      const ih = d * 0.82;
      img.setDisplaySize(ih * ratio, ih);
      bg.setScale(1, 0.92);
      p.push(bg, img);
    });

    const enemyW = Math.min(compact ? w * 0.44 : 360, w * 0.48);
    const enemyH = compact ? 62 : 76;
    const enemyX = w - enemyW - (compact ? 10 : 18);
    const enemyY = compact ? 10 : 16;
    const enemyBg = this._panelRect(enemyX, enemyY, enemyW, enemyH, 0.86);
    const enemyPortraitD = enemyH * 0.82;
    const enemyPortraitFrame = s.add.circle(enemyX + enemyW - enemyPortraitD * 0.55, enemyY + enemyH * 0.5, enemyPortraitD * 0.50, NAVY_2, 0.96)
      .setStrokeStyle(1.6, VIOLET_BRIGHT, 0.85);
    const enemyPortrait = s.add.image(enemyPortraitFrame.x, enemyPortraitFrame.y, target.portraitKey);
    const eps = enemyPortrait.texture.getSourceImage();
    const er = eps && eps.width && eps.height ? eps.width / eps.height : 1;
    enemyPortrait.setDisplaySize(enemyPortraitD * 0.78 * er, enemyPortraitD * 0.78);
    const enemyName = this._label(enemyX + 18, enemyY + 8, target.name.toUpperCase(), compact ? 18 : 22, '#F5DFB1');
    const barX = enemyX + 18;
    const barY = enemyY + enemyH - (compact ? 20 : 25);
    const barW = enemyW - enemyPortraitD - 32;
    const barH = compact ? 10 : 13;
    const enemyTrack = s.add.rectangle(barX, barY, barW, barH, 0x260c17, 0.96).setOrigin(0, 0);
    const enemyFill = s.add.rectangle(barX, barY, barW, barH, ENEMY_RED, 1).setOrigin(0, 0);
    const enemyHpText = this._label(barX + barW * 0.5, barY + barH * 0.5, `${target.hp} / ${target.maxHp}`, compact ? 10 : 12, '#FFFFFF', 0.5, 0.5);
    p.push(enemyBg, enemyPortraitFrame, enemyPortrait, enemyName, enemyTrack, enemyFill, enemyHpText);

    let heroRect, abilityRect, objectiveRect;
    if (landscape) {
      const bottomMargin = compact ? 8 : 14;
      const bottomH = Math.min(compact ? 132 : 176, h * (compact ? 0.34 : 0.30));
      heroRect = { x: bottomMargin, y: h - bottomH - bottomMargin, w: w * (compact ? 0.30 : 0.31), h: bottomH };
      abilityRect = { x: heroRect.x + heroRect.w - 3, y: heroRect.y + bottomH * 0.18, w: w * (compact ? 0.34 : 0.32), h: bottomH * 0.82 };
      objectiveRect = { x: w - w * (compact ? 0.25 : 0.23) - bottomMargin, y: h - bottomH * 0.82 - bottomMargin, w: w * (compact ? 0.25 : 0.23), h: bottomH * 0.70 };
    } else {
      const margin = 10;
      heroRect = { x: margin, y: h * 0.72, w: w - margin * 2, h: h * 0.12 };
      abilityRect = { x: margin, y: h * 0.845, w: w - margin * 2, h: h * 0.14 };
      objectiveRect = { x: w * 0.54, y: h * 0.61, w: w * 0.43, h: h * 0.10 };
    }

    const heroBg = this._panelRect(heroRect.x, heroRect.y, heroRect.w, heroRect.h, 0.91);
    const portraitD = Math.min(heroRect.h * 0.76, heroRect.w * 0.25);
    const portraitFrame = s.add.circle(heroRect.x + portraitD * 0.62, heroRect.y + heroRect.h * 0.52, portraitD * 0.5, NAVY_2, 0.98)
      .setStrokeStyle(1.8, PRISM_BLUE, 0.88);
    const portrait = s.add.image(portraitFrame.x, portraitFrame.y, hero.portraitKey);
    const ps = portrait.texture.getSourceImage();
    const pr = ps && ps.width && ps.height ? ps.width / ps.height : 1;
    portrait.setDisplaySize(portraitD * 0.82 * pr, portraitD * 0.82);
    const hx = portraitFrame.x + portraitD * 0.62;
    const name = this._label(hx, heroRect.y + 10, hero.name.toUpperCase(), compact ? 17 : 22, '#F6DEAC');
    const title = this._label(hx, heroRect.y + (compact ? 31 : 38), hero.title || 'Prism Weaver', compact ? 10 : 12, '#BBA98D');
    const heroBarW = Math.max(70, heroRect.x + heroRect.w - hx - 16);
    const heroBarH = compact ? 10 : 13;
    const hpY = heroRect.y + heroRect.h - (compact ? 47 : 58);
    const rpY = hpY + (compact ? 22 : 27);
    const hpTrack = s.add.rectangle(hx, hpY, heroBarW, heroBarH, 0x172015, 0.96).setOrigin(0, 0);
    const hpFill = s.add.rectangle(hx, hpY, heroBarW, heroBarH, HP_GREEN, 1).setOrigin(0, 0);
    const hpText = this._label(hx + heroBarW * 0.5, hpY + heroBarH * 0.5, `${hero.hp}/${hero.maxHp}`, compact ? 9 : 11, '#FFFFFF', 0.5, 0.5);
    const rpTrack = s.add.rectangle(hx, rpY, heroBarW, heroBarH, 0x171328, 0.96).setOrigin(0, 0);
    const rpFill = s.add.rectangle(hx, rpY, heroBarW, heroBarH, RP_PURPLE, 1).setOrigin(0, 0);
    const rpText = this._label(hx + heroBarW * 0.5, rpY + heroBarH * 0.5, `${hero.rp}/${hero.maxRp}`, compact ? 9 : 11, '#FFFFFF', 0.5, 0.5);
    p.push(heroBg, portraitFrame, portrait, name, title, hpTrack, hpFill, hpText, rpTrack, rpFill, rpText);

    const abilityBg = this._panelRect(abilityRect.x, abilityRect.y, abilityRect.w, abilityRect.h, 0.93);
    const abilityTitle = this._label(abilityRect.x + 14, abilityRect.y + 10, '✦  PRISMATIC SHARD', compact ? 15 : 19, '#D8BEFF');
    const abilitySub = this._label(abilityRect.x + 14, abilityRect.y + (compact ? 32 : 39), 'Weave Attack', compact ? 10 : 12, '#A89AC1');
    const desc = this._label(abilityRect.x + 14, abilityRect.y + (compact ? 50 : 61), 'Launch a prismatic shard through\nVeil-corrupted targets.', compact ? 10 : 12, '#E8E0D1');
    const damageLabel = this._label(abilityRect.x + abilityRect.w - 14, abilityRect.y + 16, 'PREDICTED', compact ? 9 : 10, '#B8A782', 1, 0);
    const damage = this._label(abilityRect.x + abilityRect.w - 14, abilityRect.y + (compact ? 32 : 38), `${ActiveTurnBattleSlice.FIXED_DAMAGE}`, compact ? 25 : 31, '#D9A4FF', 1, 0);

    const btnH = compact ? 30 : 38;
    const btnY = abilityRect.y + abilityRect.h - btnH - 8;
    const half = (abilityRect.w - 36) / 2;
    const confirmBg = s.add.rectangle(abilityRect.x + 12, btnY, half, btnH, 0x152419, 0.96)
      .setOrigin(0, 0).setStrokeStyle(1.4, HP_GREEN, 0.82).setInteractive({ useHandCursor: true });
    const confirmText = this._label(confirmBg.x + half * 0.5, confirmBg.y + btnH * 0.5, 'CONFIRM', compact ? 11 : 13, '#D9FFD9', 0.5, 0.5);
    const backBg = s.add.rectangle(abilityRect.x + 24 + half, btnY, half, btnH, 0x24151c, 0.96)
      .setOrigin(0, 0).setStrokeStyle(1.4, 0xb36b7b, 0.78).setInteractive({ useHandCursor: true });
    const backText = this._label(backBg.x + half * 0.5, backBg.y + btnH * 0.5, 'BACK', compact ? 11 : 13, '#F2D8DE', 0.5, 0.5);
    p.push(abilityBg, abilityTitle, abilitySub, desc, damageLabel, damage, confirmBg, confirmText, backBg, backText);

    const objectiveBg = this._panelRect(objectiveRect.x, objectiveRect.y, objectiveRect.w, objectiveRect.h, 0.88);
    const objectiveTitle = this._label(objectiveRect.x + 12, objectiveRect.y + 9, '✦  TOO QUIET', compact ? 13 : 16, '#F2DBA8');
    const objectiveText = this._label(objectiveRect.x + 13, objectiveRect.y + (compact ? 31 : 37), '◇ Defeat the Hushling\n◇ Prismel must survive', compact ? 9 : 11, '#E7DFD4');
    const corrY = objectiveRect.y + objectiveRect.h - (compact ? 20 : 25);
    const corr = this._label(objectiveRect.x + 13, corrY, '◆ VEIL CORRUPTION   36%', compact ? 9 : 11, '#CDA7FF');
    p.push(objectiveBg, objectiveTitle, objectiveText, corr);

    layer.add(p);
    this._uiObject(layer);
    this._mockHud = layer;

    return {
      container: layer,
      hpFill, hpText, hpBarW: heroBarW,
      tgtHpFill: enemyFill, tgtHpText: enemyHpText, tgtHpBarW: barW,
      confirmBg, backBg
    };
  }

  _buildHud(hero, target) {
    return this._buildMockHud(hero, target);
  }

  async _fadePresentation(hud) {
    const targets = [
      hud && hud.container,
      this._heroRig,
      this._enemyRig,
      this._ambientShardRig,
      this._stageWash
    ].filter(Boolean);
    if (!targets.length) return;
    await new Promise(resolve => {
      this.scene.tweens.add({ targets, alpha: 0, duration: 260, ease: 'Sine.easeIn', onComplete: resolve });
    });
  }

  _teardownVisuals() {
    if (this._ambientShardTween) {
      try { this._ambientShardTween.stop(); } catch (err) {}
      this._ambientShardTween = null;
    }
    if (this._ambientShards) {
      this._ambientShards.forEach(o => {
        try { this.scene.tweens.killTweensOf(o); } catch (err) {}
      });
    }
    super._teardownVisuals();
    this._heroRig = null;
    this._cutinGhost = null;
    this._ambientShardRig = null;
    this._ambientShards = null;
    this._stageWash = null;
    this._mockHud = null;
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
    this._stageBackdropWash();

    s.tacticalCamera.saveCinematicState();

    const w = s.scale.width, h = s.scale.height;
    const compact = w < 620 || h < 520;
    const landscape = w > h;
    const desiredZoom = landscape ? (compact ? 0.84 : 0.92) : 0.78;
    const focusX = (hero.x + target.x) / 2;
    const focusY = (hero.y + target.y) / 2;
    s.tacticalCamera.setZoom(desiredZoom);
    s.tacticalCamera.focusOn(focusX, focusY, 360);
    await this._delay(390);

    const enemyIntro = this._introEnemy();
    const heroIntro = this._introCutin();
    const hud = this._buildHud(hero, target);
    s.tweens.add({ targets: hud.container, alpha: 1, duration: 280, ease: 'Sine.easeOut' });
    await Promise.all([Promise.resolve(enemyIntro), heroIntro]);

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

    hud.confirmBg.disableInteractive().setAlpha(0.48);
    hud.backBg.disableInteractive().setAlpha(0.48);

    const preAttackZoom = s.cameras.main.zoom;
    s.cameras.main.zoomTo(preAttackZoom * 1.055, 220, 'Sine.easeInOut', true);
    await this._playAttackPresentation();

    target.hp = Math.max(0, target.hp - ActiveTurnBattleSlice.FIXED_DAMAGE);
    this._impactBurst();
    this._updateHudHp(hud, hero, target);
    s.setMessage(`${target.name} suffers ${ActiveTurnBattleSlice.FIXED_DAMAGE} damage!`);
    if (target.hp <= 0) s.defeatEnemy(target);

    await this._delay(760);
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
