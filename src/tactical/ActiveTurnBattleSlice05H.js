// 05H — registration + mobile HUD refinement.
//
// Presentation-only follow-up to 05G. Combat/state behavior, fast Pool Splash
// QA staging, environment masters, and deterministic Prismel-vs-Hushling loop
// stay inherited. This pass attacks the two loudest remaining prototype tells:
// 1) Prismel's apparent body size changing between authored frames, and
// 2) the phone HUD presenting too many equally loud boxes at once.

import ActiveTurnBattleSlice05G from './ActiveTurnBattleSlice05G.js?v=1';
import {
  PRISMEL_READY_FRAMES,
  PRISMEL_ATTACK_FRAMES
} from './ActiveTurnBattleSlice.js?v=3';

const ALL_PRISMEL_FRAMES = Object.freeze([...PRISMEL_READY_FRAMES, ...PRISMEL_ATTACK_FRAMES]);
const GOLD = 0xd7b868;
const NAVY = 0x050914;
const PANEL = 0x07111f;
const PANEL_2 = 0x0b1628;
const PRISM = 0x79ddff;
const VIOLET = 0xb77cff;
const HP = 0x61d57f;
const RP = 0x8464e7;
const ENEMY = 0xc13b59;

export default class ActiveTurnBattleSlice05H extends ActiveTurnBattleSlice05G {
  constructor(scene) {
    super(scene);
    this._visualFrameMetrics = new Map();
    this._visualRegistration = null;
  }

  _weightedQuantile(values, total, q) {
    if (!values || !values.length || total <= 0) return 0;
    const goal = total * q;
    let acc = 0;
    for (let i = 0; i < values.length; i++) {
      acc += values[i];
      if (acc >= goal) return i;
    }
    return values.length - 1;
  }

  // Measure the visible silhouette, not the PNG canvas. Thin staff/FX pixels
  // contribute very little alpha mass, so weighted quantiles track Prismel's
  // actual body/cloak scale far better than trimmed-image width/height.
  _visualMetrics(key) {
    if (this._visualFrameMetrics.has(key)) return this._visualFrameMetrics.get(key);

    const src = this.scene.textures.get(key).getSourceImage();
    const sw = src && src.width ? src.width : 1;
    const sh = src && src.height ? src.height : 1;
    let out = {
      sw, sh,
      bodyTop: 0,
      bodyBottom: sh,
      bodyHeight: sh,
      anchorX: sw * 0.5,
      anchorY: sh
    };

    try {
      if (typeof document !== 'undefined' && sw > 1 && sh > 1) {
        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(src, 0, 0);
        const px = ctx.getImageData(0, 0, sw, sh).data;
        const rowMass = new Float64Array(sh);
        let total = 0;

        for (let y = 0; y < sh; y++) {
          let row = 0;
          for (let x = 0; x < sw; x++) {
            const a = px[(y * sw + x) * 4 + 3];
            if (a > 18) row += a;
          }
          rowMass[y] = row;
          total += row;
        }

        if (total > 0) {
          // Ignore the thinnest outer alpha-mass tails. This rejects staff tips,
          // floating shards, hair wisps, and extraction fringe while retaining
          // the dominant figure from hood through cloak/feet.
          const top = this._weightedQuantile(rowMass, total, 0.020);
          const bottom = this._weightedQuantile(rowMass, total, 0.993);
          const bodyHeight = Math.max(1, bottom - top + 1);

          // Lock horizontal registration to the lower silhouette. The cloak and
          // feet dominate this band and are much more stable than an extended arm
          // or staff, so cross-dissolves stop skating left/right between poses.
          const lowerStart = Math.max(top, Math.floor(bottom - bodyHeight * 0.13));
          let sumX = 0;
          let sumW = 0;
          for (let y = lowerStart; y <= Math.min(sh - 1, bottom); y++) {
            for (let x = 0; x < sw; x++) {
              const a = px[(y * sw + x) * 4 + 3];
              if (a > 42) {
                sumX += x * a;
                sumW += a;
              }
            }
          }

          out = {
            sw, sh,
            bodyTop: top,
            bodyBottom: bottom,
            bodyHeight,
            anchorX: sumW > 0 ? sumX / sumW : sw * 0.5,
            anchorY: Math.min(sh, bottom + 1)
          };
        }
      }
    } catch (err) {
      // Browser-safe fallback keeps the test playable if pixel reads fail.
    }

    this._visualFrameMetrics.set(key, out);
    return out;
  }

  _registrationProfile() {
    if (this._visualRegistration) return this._visualRegistration;
    const heights = ALL_PRISMEL_FRAMES
      .map(key => this._visualMetrics(key).bodyHeight)
      .filter(v => Number.isFinite(v) && v > 0)
      .sort((a, b) => a - b);
    const mid = Math.floor(heights.length / 2);
    const median = heights.length
      ? (heights.length % 2 ? heights[mid] : (heights[mid - 1] + heights[mid]) / 2)
      : 1;
    this._visualRegistration = { medianBodyHeight: Math.max(1, median) };
    return this._visualRegistration;
  }

  // 05F/05G shared one scale for every trimmed canvas. 05H preserves the
  // baseline frame size while applying a per-frame correction so the measured
  // BODY height is constant on screen.
  _heroLayerLayout(img) {
    if (!img) return;
    const c = this._layoutMetrics().cutin;
    const env = this._frameEnvelope();
    const meta = this._visualMetrics(img.texture.key);
    const reg = this._registrationProfile();

    const referenceScale = Math.min(c.maxW / env.maxW, c.maxH / env.maxH);
    const targetBodyPx = reg.medianBodyHeight * referenceScale;
    const scale = targetBodyPx / Math.max(1, meta.bodyHeight);

    img
      .setOrigin(meta.anchorX / meta.sw, meta.anchorY / meta.sh)
      .setScale(Phaser.Math.Clamp(scale, referenceScale * 0.82, referenceScale * 1.20))
      .setPosition(0, 0);
  }

  _hudPanel(x, y, w, h, alpha = 0.94) {
    return this.scene.add.rectangle(x, y, w, h, PANEL, alpha)
      .setOrigin(0, 0)
      .setStrokeStyle(1.25, GOLD, 0.82);
  }

  _hudBar(x, y, w, h, trackColour, fillColour, fraction) {
    const track = this.scene.add.rectangle(x, y, w, h, trackColour, 0.96).setOrigin(0, 0);
    const fill = this.scene.add.rectangle(x, y, Math.max(1, w * Phaser.Math.Clamp(fraction, 0, 1)), h, fillColour, 1).setOrigin(0, 0);
    return { track, fill };
  }

  _fitPortrait(img, diameter) {
    const src = img.texture.getSourceImage();
    const ratio = src && src.width && src.height ? src.width / src.height : 1;
    const h = diameter * 0.76;
    img.setDisplaySize(h * ratio, h);
  }

  // Dedicated phone-first hierarchy. The active turn only needs four loud
  // things: whose turn, target health, Prismel state, and the action decision.
  _buildMockHud(hero, target) {
    const s = this.scene;
    const w = s.scale.width;
    const h = s.scale.height;
    const landscape = w > h;
    const compact = w < 720 || h < 520;
    const layer = s.add.container(0, 0).setDepth(9500).setAlpha(0);
    const parts = [];

    if (!landscape) return super._buildMockHud(hero, target);

    const margin = compact ? 9 : 14;
    const topH = compact ? 54 : 66;

    const orderW = Math.min(w * 0.43, compact ? 338 : 410);
    const orderBg = this._hudPanel(margin, margin, orderW, topH, 0.90);
    const turn = this._label(margin + 12, margin + 8, `TURN ${String(s.turn || 1).padStart(2, '0')}`, compact ? 13 : 16, '#F4DDA8');
    const orderLabel = this._label(margin + 12, margin + (compact ? 29 : 37), 'ACTIVE  •  PRISMEL', compact ? 9 : 11, '#8EDFFF');
    parts.push(orderBg, turn, orderLabel);

    const orderKeys = [hero.portraitKey, 'portrait_auryi', 'portrait_kineza', target.portraitKey];
    const pd = compact ? 27 : 34;
    const step = pd + (compact ? 5 : 7);
    let px = margin + orderW - (orderKeys.length * step) + 4;
    orderKeys.forEach((key, i) => {
      const frame = s.add.circle(px + pd * 0.5, margin + topH * 0.5, pd * 0.5, PANEL_2, 0.98)
        .setStrokeStyle(1.2, i === 0 ? PRISM : GOLD, i === 0 ? 0.95 : 0.42);
      const img = s.add.image(frame.x, frame.y, key);
      this._fitPortrait(img, pd);
      parts.push(frame, img);
      px += step;
    });

    const enemyW = Math.min(w * 0.39, compact ? 320 : 390);
    const enemyX = w - margin - enemyW;
    const enemyBg = this._hudPanel(enemyX, margin, enemyW, topH, 0.91);
    const enemyName = this._label(enemyX + 12, margin + 7, target.name.toUpperCase(), compact ? 15 : 19, '#FFE2B0');
    const enemySub = this._label(enemyX + 12, margin + (compact ? 26 : 31), 'TOO QUIET  •  TARGET', compact ? 8 : 10, '#C3A9D8');
    const ePortraitD = topH * 0.78;
    const eFrame = s.add.circle(enemyX + enemyW - ePortraitD * 0.56, margin + topH * 0.5, ePortraitD * 0.50, PANEL_2, 0.98)
      .setStrokeStyle(1.4, VIOLET, 0.82);
    const ePortrait = s.add.image(eFrame.x, eFrame.y, target.portraitKey);
    this._fitPortrait(ePortrait, ePortraitD);
    const eBarX = enemyX + 12;
    const eBarW = enemyW - ePortraitD - 30;
    const eBarH = compact ? 9 : 11;
    const eBarY = margin + topH - eBarH - 8;
    const eBar = this._hudBar(eBarX, eBarY, eBarW, eBarH, 0x2b0d18, ENEMY, target.hp / target.maxHp);
    const eHp = this._label(eBarX + eBarW * 0.5, eBarY + eBarH * 0.5, `${target.hp}/${target.maxHp}`, compact ? 8 : 10, '#FFFFFF', 0.5, 0.5);
    parts.push(enemyBg, enemyName, enemySub, eFrame, ePortrait, eBar.track, eBar.fill, eHp);

    const chipW = Math.min(w * 0.28, compact ? 230 : 280);
    const chipX = (w - chipW) * 0.5;
    const chipY = margin + topH + (compact ? 7 : 10);
    const chip = s.add.rectangle(chipX, chipY, chipW, compact ? 22 : 26, NAVY, 0.72)
      .setOrigin(0, 0).setStrokeStyle(1, VIOLET, 0.30);
    const chipText = this._label(chipX + chipW * 0.5, chipY + (compact ? 11 : 13), 'DEFEAT HUSHLING  •  VEIL 36%', compact ? 8 : 10, '#D5C6E9', 0.5, 0.5);
    parts.push(chip, chipText);

    const bottomMargin = margin;
    const heroW = Math.min(w * 0.30, compact ? 252 : 310);
    const heroH = compact ? 102 : 124;
    const heroX = bottomMargin;
    const heroY = h - bottomMargin - heroH;
    const heroBg = this._hudPanel(heroX, heroY, heroW, heroH, 0.93);
    const heroPortraitD = heroH * 0.66;
    const heroFrame = s.add.circle(heroX + heroPortraitD * 0.58, heroY + heroH * 0.51, heroPortraitD * 0.5, PANEL_2, 0.98)
      .setStrokeStyle(1.5, PRISM, 0.88);
    const heroPortrait = s.add.image(heroFrame.x, heroFrame.y, hero.portraitKey);
    this._fitPortrait(heroPortrait, heroPortraitD);
    const hx = heroX + heroPortraitD + 14;
    const heroName = this._label(hx, heroY + 10, hero.name.toUpperCase(), compact ? 15 : 19, '#FFE3AE');
    const heroTitle = this._label(hx, heroY + (compact ? 29 : 34), hero.title || 'Prism Weaver', compact ? 8 : 10, '#AFCBE0');
    const heroBarW = Math.max(70, heroX + heroW - hx - 11);
    const heroBarH = compact ? 9 : 11;
    const hpY = heroY + heroH - (compact ? 43 : 52);
    const rpY = hpY + (compact ? 21 : 26);
    const hpBar = this._hudBar(hx, hpY, heroBarW, heroBarH, 0x102016, HP, hero.hp / hero.maxHp);
    const rpBar = this._hudBar(hx, rpY, heroBarW, heroBarH, 0x171229, RP, hero.rp / hero.maxRp);
    const hpText = this._label(hx + 4, hpY + heroBarH * 0.5, `HP ${hero.hp}/${hero.maxHp}`, compact ? 8 : 9, '#FFFFFF', 0, 0.5);
    const rpText = this._label(hx + 4, rpY + heroBarH * 0.5, `RP ${hero.rp}/${hero.maxRp}`, compact ? 8 : 9, '#FFFFFF', 0, 0.5);
    parts.push(heroBg, heroFrame, heroPortrait, heroName, heroTitle, hpBar.track, hpBar.fill, hpText, rpBar.track, rpBar.fill, rpText);

    const actionW = Math.min(w * 0.37, compact ? 318 : 390);
    const actionH = compact ? 116 : 140;
    const actionX = w - bottomMargin - actionW;
    const actionY = h - bottomMargin - actionH;
    const actionBg = this._hudPanel(actionX, actionY, actionW, actionH, 0.95);
    const ability = this._label(actionX + 13, actionY + 10, '✦ PRISMATIC SHARD', compact ? 15 : 19, '#DDB7FF');
    const predicted = this._label(actionX + actionW - 13, actionY + 9, 'PREDICTED', compact ? 8 : 9, '#AFA184', 1, 0);
    const damage = this._label(actionX + actionW - 13, actionY + (compact ? 21 : 24), '4', compact ? 25 : 32, '#F0C6FF', 1, 0);
    const targetLine = this._label(actionX + 13, actionY + (compact ? 34 : 42), `TARGET  ${target.name.toUpperCase()}`, compact ? 9 : 11, '#B9D9E8');

    const gap = compact ? 8 : 10;
    const btnH = compact ? 43 : 50;
    const btnY = actionY + actionH - btnH - (compact ? 8 : 10);
    const backW = actionW * 0.29;
    const confirmW = actionW - backW - gap - 24;
    const confirmBg = s.add.rectangle(actionX + 12, btnY, confirmW, btnH, 0x163622, 0.98)
      .setOrigin(0, 0).setStrokeStyle(1.6, HP, 0.92).setInteractive({ useHandCursor: true });
    const confirmText = this._label(confirmBg.x + confirmW * 0.5, confirmBg.y + btnH * 0.5, 'CONFIRM ATTACK', compact ? 11 : 13, '#E3FFE9', 0.5, 0.5);
    const backBg = s.add.rectangle(confirmBg.x + confirmW + gap, btnY, backW, btnH, 0x27151d, 0.98)
      .setOrigin(0, 0).setStrokeStyle(1.4, 0xbb7180, 0.76).setInteractive({ useHandCursor: true });
    const backText = this._label(backBg.x + backW * 0.5, backBg.y + btnH * 0.5, 'BACK', compact ? 10 : 12, '#F5DCE2', 0.5, 0.5);
    parts.push(actionBg, ability, predicted, damage, targetLine, confirmBg, confirmText, backBg, backText);

    layer.add(parts);
    this._uiObject(layer);
    this._mockHud = layer;

    return {
      container: layer,
      hpFill: hpBar.fill,
      hpText,
      hpBarW: heroBarW,
      tgtHpFill: eBar.fill,
      tgtHpText: eHp,
      tgtHpBarW: eBarW,
      confirmBg,
      backBg
    };
  }

  _buildHud(hero, target) {
    return this._buildMockHud(hero, target);
  }

  async _playAttackPresentation() {
    const s = this.scene;
    const rig = this._heroRig;
    const homeX = rig ? rig.x : 0;
    const homeY = rig ? rig.y : 0;

    // Movement, not scaling, provides the attack's physical emphasis.
    if (rig) {
      s.tweens.add({
        targets: rig,
        x: homeX + Math.max(7, s.scale.width * 0.012),
        y: homeY - 2,
        duration: 360,
        ease: 'Sine.easeInOut'
      });
    }

    await super._playAttackPresentation();

    if (rig && rig.active) {
      await new Promise(resolve => {
        s.tweens.add({
          targets: rig,
          x: homeX,
          y: homeY,
          duration: 180,
          ease: 'Quad.easeOut',
          onComplete: resolve
        });
      });
    }
  }

  _impactBurst() {
    super._impactBurst();
    const s = this.scene;
    const rig = this._enemyRig;
    if (!rig || !rig.active) return;

    const homeX = rig.x;
    s.tweens.add({
      targets: rig,
      x: homeX + Math.max(12, s.scale.width * 0.018),
      duration: 90,
      yoyo: true,
      ease: 'Cubic.easeOut'
    });
  }

  _teardownVisuals() {
    super._teardownVisuals();
    this._visualFrameMetrics.clear();
    this._visualRegistration = null;
  }
}
