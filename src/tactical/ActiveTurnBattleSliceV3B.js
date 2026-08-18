// Active-Turn Battle Slice — 05E-3B normalization pass.
//
// Real-device QA of 05E-3 confirmed the composition architecture, but exposed
// two visual defects: Prismel's tightly-trimmed authored frames were re-fit
// independently (visible scale/anchor popping), and the old full-size Hushling
// BP art carried a diffuse translucent glow canvas. This pass fixes only those
// presentation issues. Combat/state behavior remains inherited from 05E-3.

import ActiveTurnBattleSliceV3, {
  PRISMEL_READY_FRAMES,
  PRISMEL_ATTACK_FRAMES
} from './ActiveTurnBattleSliceV3.js?v=1';
import ActiveTurnBattleSlice from './ActiveTurnBattleSlice.js?v=3';

const HUSHLING_IDLE = 'hushling_stomp_01_contact_a';
const HUSHLING_SILHOUETTE = 'hushling_stomp_01_contact_a_silhouette';
const HUSHLING_ORIGIN_Y = 0.947456;

export default class ActiveTurnBattleSliceV3B extends ActiveTurnBattleSliceV3 {
  constructor(scene) {
    super(scene);
    this._enemyRig = null;
    this._enemyOutline = null;
    this._enemyShadow = null;
    this._prismelFrameMeta = new Map();
    this._prismelEnvelope = null;
  }

  _layoutMetrics() {
    const m = super._layoutMetrics();

    // In 05E-3 `cutin.x` was a left edge. In 05E-3B it is a fixed lower-
    // silhouette anchor. That is what keeps Prismel planted while different
    // trimmed frame canvases swap around him.
    if (m.landscape) {
      m.cutin = {
        x: m.w * 0.245,
        bottomY: m.h - m.margin + 8,
        maxW: Math.min(m.w * 0.43, 410),
        maxH: Math.max(150, m.h * 0.72)
      };
      m.enemy = {
        x: m.w * 0.73,
        bottomY: m.h - m.margin + 3,
        maxW: Math.min(m.w * 0.30, 285),
        maxH: Math.max(135, m.h * 0.58)
      };
      return m;
    }

    const stageTop = m.target.y + m.target.h + 8;
    const stageBottom = m.hero.y + 12;
    const stageH = Math.max(180, stageBottom - stageTop);
    m.cutin = {
      x: m.w * (m.compact ? 0.27 : 0.25),
      bottomY: stageBottom,
      maxW: m.w * (m.compact ? 0.58 : 0.46),
      maxH: stageH * 1.02
    };
    m.enemy = {
      x: m.w * (m.compact ? 0.75 : 0.74),
      bottomY: stageBottom - 3,
      maxW: m.w * (m.compact ? 0.31 : 0.27),
      maxH: stageH * 0.74
    };
    return m;
  }

  // Find a stable lower-silhouette anchor inside each trimmed Prismel frame.
  // The alpha analysis is one-time/cached and does not modify the art.
  _frameMeta(key) {
    if (this._prismelFrameMeta.has(key)) return this._prismelFrameMeta.get(key);

    const src = this.scene.textures.get(key).getSourceImage();
    const sw = src && src.width ? src.width : 1;
    const sh = src && src.height ? src.height : 1;
    let anchorX = sw * 0.5;
    let anchorY = sh;

    try {
      if (typeof document !== 'undefined' && sw > 1 && sh > 1) {
        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(src, 0, 0);
        const px = ctx.getImageData(0, 0, sw, sh).data;
        let minY = sh, maxY = 0;

        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            if (px[(y * sw + x) * 4 + 3] > 28) {
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxY > minY) {
          const lowerBand = Math.max(minY, Math.floor(maxY - (maxY - minY) * 0.115));
          let sumX = 0, sumW = 0;
          for (let y = lowerBand; y <= maxY; y++) {
            for (let x = 0; x < sw; x++) {
              const a = px[(y * sw + x) * 4 + 3];
              if (a > 48) {
                sumX += x * a;
                sumW += a;
              }
            }
          }
          if (sumW > 0) anchorX = sumX / sumW;
          anchorY = Math.min(sh, maxY + 1);
        }
      }
    } catch (err) {
      // Browser-safe fallback: centre-bottom. The shared scale below still
      // removes the major 05E-3 size pulse even if pixel reads are blocked.
    }

    const meta = { sw, sh, anchorX, anchorY };
    this._prismelFrameMeta.set(key, meta);
    return meta;
  }

  _frameEnvelope() {
    if (this._prismelEnvelope) return this._prismelEnvelope;
    let maxW = 1, maxH = 1;
    [...PRISMEL_READY_FRAMES, ...PRISMEL_ATTACK_FRAMES].forEach(key => {
      const meta = this._frameMeta(key);
      maxW = Math.max(maxW, meta.sw);
      maxH = Math.max(maxH, meta.sh);
    });
    this._prismelEnvelope = { maxW, maxH };
    return this._prismelEnvelope;
  }

  // The important fix: ONE scale for all 12 authored Prismel frames. The
  // sheet already has a common art scale, so runtime must not independently
  // fit each trimmed crop box.
  _layoutCutin() {
    const img = this._cutinImage;
    if (!img) return;
    const c = this._layoutMetrics().cutin;
    const env = this._frameEnvelope();
    const meta = this._frameMeta(img.texture.key);
    const scale = Math.min(c.maxW / env.maxW, c.maxH / env.maxH);

    img
      .setOrigin(meta.anchorX / meta.sw, meta.anchorY / meta.sh)
      .setScale(Math.max(0.001, scale))
      .setPosition(c.x, c.bottomY);
  }

  // Promote the already-clean Tactical Hushling master instead of the old BP
  // Idle/Hit art. Tactical's map icon is ~400px content-height, so at this
  // active-turn size it still downscales cleanly. A matching opaque silhouette
  // behind it prevents grass/pool detail from bleeding through soft pixels.
  _ensureEnemy() {
    if (this._enemyRig) return this._enemyRig;

    const s = this.scene;
    const rig = s.add.container(0, 0).setDepth(9350).setAlpha(0);
    this._uiObject(rig);

    const shadow = s.add.ellipse(0, -1, 100, 24, 0x05040a, 0.46)
      .setStrokeStyle(1.5, 0x8e5ec7, 0.50);
    const outline = s.add.image(0, 0, HUSHLING_SILHOUETTE)
      .setOrigin(0.5, HUSHLING_ORIGIN_Y)
      .setTint(0x080710)
      .setAlpha(0.94);
    const img = s.add.image(0, 0, HUSHLING_IDLE)
      .setOrigin(0.5, HUSHLING_ORIGIN_Y)
      .setAlpha(1);

    rig.add([shadow, outline, img]);
    this._enemyRig = rig;
    this._enemyImage = img;
    this._enemyOutline = outline;
    this._enemyShadow = shadow;
    // Keep parent cleanup/fade code from treating the removed purple sigil as
    // a separate actor. 05E-3B owns its own fade below.
    this._enemySigil = null;
    this._layoutEnemy();
    return rig;
  }

  _layoutEnemy() {
    if (!this._enemyRig || !this._enemyImage) return;
    const e = this._layoutMetrics().enemy;
    const src = this._enemyImage.texture.getSourceImage();
    const sw = src && src.width ? src.width : 1;
    const sh = src && src.height ? src.height : 1;
    const scale = Math.min(e.maxW / sw, e.maxH / sh);

    this._enemyImage.setScale(scale);
    this._enemyOutline.setScale(scale * 1.035);
    const bodyW = sw * scale;
    this._enemyShadow
      .setSize(Math.max(72, bodyW * 0.66), Math.max(18, bodyW * 0.15))
      .setPosition(0, 0);
    this._enemyRig.setPosition(e.x, e.bottomY);
  }

  async _introEnemy() {
    const s = this.scene;
    const rig = this._ensureEnemy();
    this._layoutEnemy();
    const homeX = rig.x;
    rig.setX(homeX + Math.max(24, s.scale.width * 0.04));
    s.tweens.add({
      targets: rig,
      alpha: 1,
      x: homeX,
      duration: 300,
      ease: 'Quad.easeOut'
    });
  }

  _projectileEndpoints() {
    const hero = this._cutinImage;
    const rig = this._enemyRig;
    const enemy = this._enemyImage;
    if (!hero || !rig || !enemy) {
      const m = this._layoutMetrics();
      return {
        start: { x: m.w * 0.37, y: m.h * 0.49 },
        end: { x: m.w * 0.70, y: m.h * 0.49 }
      };
    }

    const hb = hero.getBounds();
    return {
      start: {
        x: hb.right - hb.width * 0.08,
        y: hb.top + hb.height * 0.46
      },
      end: {
        x: rig.x - enemy.displayWidth * 0.26,
        y: rig.y - enemy.displayHeight * 0.50
      }
    };
  }

  async _playAttackPresentation() {
    this._ensureCutin();
    this._ensureEnemy();
    // A hair slower than 05E-3. With scale/anchor now fixed, the detailed
    // drawings read as deliberate key poses rather than rapid pop-cuts.
    await this._cycleFrames(PRISMEL_ATTACK_FRAMES.slice(0, 4), 125);
    await Promise.all([
      this._cycleFrames(PRISMEL_ATTACK_FRAMES.slice(4), 135),
      this._launchVisibleProjectile()
    ]);
  }

  // Keep one clean Hushling texture throughout. Hit readability comes from
  // squash/recoil/tint + impact FX, avoiding the translucent BP hit canvas.
  _impactBurst() {
    const s = this.scene;
    const rig = this._ensureEnemy();
    const enemy = this._enemyImage;
    const outline = this._enemyOutline;
    this._layoutEnemy();

    const baseX = rig.x;
    enemy.setTint(0xffd6d6);
    outline.setTint(0x2b0d18);
    s.tweens.add({
      targets: rig,
      x: baseX + 18,
      angle: 2.6,
      scaleX: 0.94,
      scaleY: 1.04,
      duration: 78,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!rig.active) return;
        rig.setX(baseX).setAngle(0).setScale(1);
        enemy.clearTint();
        outline.setTint(0x080710);
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
      rig.x,
      rig.y - enemy.displayHeight * 0.72,
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
  }

  async _fadePresentation(hud) {
    const targets = [
      hud && hud.container,
      this._cutinImage,
      this._enemyRig
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

  _teardownVisuals() {
    super._teardownVisuals();
    this._enemyRig = null;
    this._enemyOutline = null;
    this._enemyShadow = null;
    this._prismelFrameMeta.clear();
    this._prismelEnvelope = null;
  }
}
