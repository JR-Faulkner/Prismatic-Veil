// 06A.3 — Three-hero active-turn wiring using production-quality locked PNGs.
//
// The earlier 06A prototype proved the three-hero state/presentation path but
// temporarily reused small Sequence Lab WebP proxy sheets for Auryi/Kineza.
// Those assets are QA transport only and looked blurry / paper-like when blown
// up in Tactical. 06A.3 removes that path from live combat entirely.
//
// Prismel keeps the current 05M materialization + Prismatic Shard sequence.
// Auryi and Kineza use their existing locked high-resolution battle-pose PNG
// sequences already in assets/poses/. No runtime sheet slicing, no white-edge
// flood removal, and no QA proxy backgrounds are used here.

import ActiveTurnBattleSlice05M from './ActiveTurnBattleSlice05M.js?v=2';
import {
  PRISMEL_READY_FRAMES,
  PRISMEL_ATTACK_FRAMES
} from './ActiveTurnBattleSlice.js?v=3';

export const AURYI_BATTLE_FRAMES = Object.freeze([
  'auryi_battle_1', 'auryi_battle_2', 'auryi_battle_3',
  'auryi_battle_4', 'auryi_battle_5'
]);

export const KINEZA_BATTLE_FRAMES = Object.freeze([
  'kineza_battle_1', 'kineza_battle_2', 'kineza_battle_3',
  'kineza_battle_4', 'kineza_battle_5'
]);

const HERO_SEQUENCE = Object.freeze({
  prismel: Object.freeze({
    intro: PRISMEL_READY_FRAMES,
    attack: PRISMEL_ATTACK_FRAMES,
    label: 'PRISMATIC SHARD',
    colour: 0x8fdfff,
    accent: 0xc58cff
  }),
  auryi: Object.freeze({
    intro: AURYI_BATTLE_FRAMES,
    holds: [220, 210, 250, 270, 230],
    label: 'VEIL PULSE • ATTACK',
    colour: 0xffdc72,
    accent: 0xcba7ff
  }),
  kineza: Object.freeze({
    intro: KINEZA_BATTLE_FRAMES,
    holds: [210, 180, 210, 250, 220],
    label: 'MOMENTUM FIST',
    colour: 0x62ff98,
    accent: 0x18c86b
  })
});

const VALID_HEROES = new Set(Object.keys(HERO_SEQUENCE));

export default class ActiveTurnBattleSlice06A extends ActiveTurnBattleSlice05M {
  constructor(scene) {
    super(scene);
    this._activeHero06A = null;
    this._frameMetricsCache06A = new Map();
  }

  shouldIntercept(hero, target) {
    return this.isEnabled()
      && !!hero && VALID_HEROES.has(hero.id)
      && !!target && target.type === 'hushling' && target.alive;
  }

  async run(hero, target) {
    this._activeHero06A = hero;
    try {
      return await super.run(hero, target);
    } finally {
      this._activeHero06A = null;
    }
  }

  _sequenceConfig() {
    const id = this._activeHero06A && this._activeHero06A.id;
    return HERO_SEQUENCE[id] || HERO_SEQUENCE.prismel;
  }

  _isPrismel() {
    return !this._activeHero06A || this._activeHero06A.id === 'prismel';
  }

  // High-res locked PNGs have different transparent-canvas sizes. Measure the
  // actual visible subject so their canvases cannot create apparent scale pops.
  _frameMetrics06A(key) {
    if (this._frameMetricsCache06A.has(key)) return this._frameMetricsCache06A.get(key);
    const src = this.scene.textures.get(key).getSourceImage();
    const sw = src && src.width ? src.width : 1;
    const sh = src && src.height ? src.height : 1;
    let out = { sw, sh, width: sw, height: sh, anchorX: sw * 0.5, anchorY: sh };

    try {
      if (typeof document !== 'undefined' && sw > 1 && sh > 1) {
        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(src, 0, 0);
        const px = ctx.getImageData(0, 0, sw, sh).data;
        let left = sw, right = -1, top = sh, bottom = -1;

        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            const a = px[(y * sw + x) * 4 + 3];
            if (a <= 18) continue;
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
          }
        }

        if (right >= left && bottom >= top) {
          const height = bottom - top + 1;
          const lowerStart = Math.max(top, Math.floor(bottom - height * 0.16));
          let sumX = 0, sumW = 0;
          for (let y = lowerStart; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
              const a = px[(y * sw + x) * 4 + 3];
              if (a > 42) { sumX += x * a; sumW += a; }
            }
          }
          out = {
            sw, sh,
            width: right - left + 1,
            height,
            anchorX: sumW ? sumX / sumW : (left + right) * 0.5,
            anchorY: Math.min(sh, bottom + 1)
          };
        }
      }
    } catch (err) {
      // Fallback leaves the presentation playable if pixel reads fail.
    }

    this._frameMetricsCache06A.set(key, out);
    return out;
  }

  _heroLayerLayout(img) {
    if (!img) return;
    if (this._isPrismel() || String(img.texture.key).startsWith('prismel_')) {
      return super._heroLayerLayout(img);
    }

    const c = this._layoutMetrics().cutin;
    const meta = this._frameMetrics06A(img.texture.key);
    const heroId = this._activeHero06A ? this._activeHero06A.id : 'auryi';
    const heightFactor = heroId === 'auryi' ? 0.84 : 0.80;
    const scale = Math.min(
      (c.maxW * 0.90) / Math.max(1, meta.width),
      (c.maxH * heightFactor) / Math.max(1, meta.height)
    );

    img
      .setOrigin(meta.anchorX / meta.sw, meta.anchorY / meta.sh)
      .setScale(Math.max(0.001, scale))
      .setPosition(0, 0);
  }

  _ensureCutin() {
    const img = super._ensureCutin();
    if (!img || this._isPrismel()) return img;

    const first = this._sequenceConfig().intro[0];
    if (img.texture.key !== first && String(img.texture.key).startsWith('prismel_')) {
      img.setTexture(first).setAlpha(1);
      if (this._cutinGhost && this._cutinGhost.active) {
        this._cutinGhost.setTexture(first).setAlpha(0);
      }
      this._layoutCutin();
    }
    return img;
  }

  async _cycleTimed(frames, holds) {
    for (let i = 0; i < frames.length; i++) {
      await this._cycleFrames([frames[i]], holds[i] || 220);
    }
  }

  async _introCutin() {
    if (this._isPrismel()) return super._introCutin();

    const cfg = this._sequenceConfig();
    const img = this._ensureCutin();
    const rig = this._heroRig;
    const ghost = this._cutinGhost;

    img.setTexture(cfg.intro[0]).setAlpha(1);
    if (ghost && ghost.active) ghost.setAlpha(0);
    if (rig && rig.active) rig.setAlpha(0);
    this._layoutCutin();

    if (this._heroGlow && this._heroGlow.active) {
      this._heroGlow.setFillStyle(cfg.colour, 0.10);
    }
    if (rig && rig.active) {
      this.scene.tweens.add({ targets: rig, alpha: 1, duration: 240, ease: 'Sine.easeOut' });
    }

    await this._cycleTimed(cfg.intro, cfg.holds);
    img.setTexture(cfg.intro[cfg.intro.length - 1]).setAlpha(1);
    if (rig && rig.active) rig.setAlpha(1);
    this._layoutCutin();
  }

  _renderShell(hero, target) {
    super._renderShell(hero, target);
    const e = this._collectShell();
    if (!e) return;
    const cfg = HERO_SEQUENCE[hero.id] || HERO_SEQUENCE.prismel;
    if (e.active) e.active.textContent = String(hero.name || hero.id).toUpperCase();
    if (e.ability) e.ability.textContent = cfg.label;
    if (e.damage) e.damage.textContent = '4';
  }

  _releaseOrb() {
    const s = this.scene;
    const { start, end } = this._projectileEndpoints();
    const cfg = this._sequenceConfig();
    const trail = s.add.graphics().setDepth(9461);
    const orb = s.add.circle(start.x, start.y, 10, cfg.colour, 0.96)
      .setStrokeStyle(2, cfg.accent, 0.95)
      .setDepth(9462)
      .setBlendMode('ADD');
    this._uiObject(trail);
    this._uiObject(orb);

    return new Promise(resolve => {
      const driver = { t: 0 };
      s.tweens.add({
        targets: driver,
        t: 1,
        duration: 330,
        ease: 'Cubic.easeIn',
        onUpdate: () => {
          const t = driver.t;
          const x = start.x + (end.x - start.x) * t;
          const y = start.y + (end.y - start.y) * t - Math.sin(Math.PI * t) * 22;
          orb.setPosition(x, y).setScale(1 + t * 0.35);
          trail.clear();
          trail.lineStyle(7, cfg.accent, 0.10 * (1 - t));
          trail.beginPath(); trail.moveTo(start.x, start.y); trail.lineTo(x, y); trail.strokePath();
          trail.lineStyle(2.2, cfg.colour, 0.72 * (1 - t * 0.25));
          trail.beginPath(); trail.moveTo(start.x, start.y); trail.lineTo(x, y); trail.strokePath();
        },
        onComplete: () => {
          [trail, orb].forEach(obj => { if (obj && obj.active) obj.destroy(); });
          this.layers = this.layers.filter(obj => obj !== trail && obj !== orb);
          resolve();
        }
      });
    });
  }

  async _kineticRelease() {
    const s = this.scene;
    const { start, end } = this._projectileEndpoints();
    const cfg = this._sequenceConfig();
    const streak = s.add.graphics().setDepth(9461);
    this._uiObject(streak);

    if (this._heroRig && this._heroRig.active) {
      s.tweens.add({
        targets: this._heroRig,
        x: this._heroRig.x + 10,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    }

    await new Promise(resolve => {
      const driver = { t: 0 };
      s.tweens.add({
        targets: driver,
        t: 1,
        duration: 210,
        ease: 'Quad.easeIn',
        onUpdate: () => {
          const t = driver.t;
          const x = start.x + (end.x - start.x) * t;
          const y = start.y + (end.y - start.y) * t;
          streak.clear();
          streak.lineStyle(12, cfg.accent, 0.08 * (1 - t * 0.5));
          streak.beginPath(); streak.moveTo(start.x, start.y); streak.lineTo(x, y); streak.strokePath();
          streak.lineStyle(3.2, cfg.colour, 0.80 * (1 - t * 0.2));
          streak.beginPath(); streak.moveTo(start.x, start.y); streak.lineTo(x, y); streak.strokePath();
        },
        onComplete: resolve
      });
    });

    if (streak.active) streak.destroy();
    this.layers = this.layers.filter(obj => obj !== streak);
  }

  async _playAttackPresentation(hero) {
    // 05F invokes this presenter without arguments. Resolve the active hero
    // from the run-scoped state so every inherited caller stays compatible.
    const active = hero || this._activeHero06A;
    if (!active || active.id === 'prismel') return super._playAttackPresentation();

    const cfg = HERO_SEQUENCE[active.id] || HERO_SEQUENCE.prismel;
    const img = this._ensureCutin();
    const strikeIndex = active.id === 'auryi' ? 3 : 3;
    img.setTexture(cfg.intro[strikeIndex]).setAlpha(1);
    this._layoutCutin();

    if (this._heroGlow && this._heroGlow.active) {
      this.scene.tweens.add({
        targets: this._heroGlow,
        alpha: 0.24,
        scale: 1.5,
        duration: 150,
        yoyo: true,
        ease: 'Sine.easeOut'
      });
    }
    await this._delay(90);

    if (active.id === 'auryi') await this._releaseOrb();
    else await this._kineticRelease();

    img.setTexture(cfg.intro[cfg.intro.length - 1]).setAlpha(1);
    this._layoutCutin();
  }

  _impactBurst(target) {
    if (this._isPrismel()) return super._impactBurst(target);

    const s = this.scene;
    const active = this._activeHero06A;
    const cfg = this._sequenceConfig();
    const { end } = this._projectileEndpoints();
    const ring = s.add.ellipse(end.x, end.y, 24, 16, cfg.colour, 0.06)
      .setStrokeStyle(2.6, cfg.colour, 0.92)
      .setDepth(9470)
      .setBlendMode('ADD');
    const core = s.add.circle(end.x, end.y, 12, cfg.accent, 0.30)
      .setDepth(9471)
      .setBlendMode('ADD');
    this._uiObject(ring);
    this._uiObject(core);

    s.tweens.add({ targets: ring, scaleX: 3.4, scaleY: 2.5, alpha: 0, duration: 340, ease: 'Cubic.easeOut' });
    s.tweens.add({ targets: core, scale: 2.4, alpha: 0, duration: 250, ease: 'Quad.easeOut' });
    const kineza = active && active.id === 'kineza';
    s.cameras.main.shake(kineza ? 160 : 100, kineza ? 0.006 : 0.003);

    this._timer(430, () => {
      [ring, core].forEach(obj => {
        if (obj && obj.active) obj.destroy();
        this.layers = this.layers.filter(item => item !== obj);
      });
    });
  }
}
