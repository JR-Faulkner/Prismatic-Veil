// 06A — Three-hero active-turn wiring.
//
// Production goal: move the best current signature-sequence work out of
// Sequence Lab and back into the real Too Quiet tactical loop without
// pretending Auryi/Kineza already have finished attack strips.
//
// Prismel keeps the validated 05M materialization + Prismatic Shard path.
// Auryi uses the approved six-beat Auorb materialization as her turn-open
// signature, followed by a simple gold/lavender release beat.
// Kineza uses the approved six-beat gauntlet ignition as his turn-open
// signature, followed by a simple kinetic impact beat.
//
// Combat authority remains inherited from ActiveTurnBattleSlice. This class
// changes presentation and expands the battleslice=1 interception gate only.

import ActiveTurnBattleSlice05M from './ActiveTurnBattleSlice05M.js?v=2';
import {
  PRISMEL_READY_FRAMES,
  PRISMEL_ATTACK_FRAMES
} from './ActiveTurnBattleSlice.js?v=3';

export const AURYI_AUORB_FRAMES = Object.freeze([
  'auryi_auorb_tactical_1', 'auryi_auorb_tactical_2', 'auryi_auorb_tactical_3',
  'auryi_auorb_tactical_4', 'auryi_auorb_tactical_5', 'auryi_auorb_tactical_6'
]);

export const KINEZA_IGNITION_FRAMES = Object.freeze([
  'kineza_ignition_tactical_1', 'kineza_ignition_tactical_2', 'kineza_ignition_tactical_3',
  'kineza_ignition_tactical_4', 'kineza_ignition_tactical_5', 'kineza_ignition_tactical_6'
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
    intro: AURYI_AUORB_FRAMES,
    holds: [220, 260, 300, 340, 360, 400],
    label: 'AUORB • ATTACK',
    colour: 0xffdc72,
    accent: 0xcba7ff
  }),
  kineza: Object.freeze({
    intro: KINEZA_IGNITION_FRAMES,
    holds: [220, 180, 220, 180, 260, 320],
    label: 'GAUNTLET IGNITION • ATTACK',
    colour: 0x62ff98,
    accent: 0x18c86b
  })
});

const VALID_HEROES = new Set(Object.keys(HERO_SEQUENCE));

export default class ActiveTurnBattleSlice06A extends ActiveTurnBattleSlice05M {
  constructor(scene) {
    super(scene);
    this._activeHero06A = null;
    this._qaMetricsCache = new Map();
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

  _qaMetrics(key) {
    if (this._qaMetricsCache.has(key)) return this._qaMetricsCache.get(key);
    const src = this.scene.textures.get(key).getSourceImage();
    const sw = src && src.width ? src.width : 1;
    const sh = src && src.height ? src.height : 1;
    let result = { sw, sh, left: 0, right: sw - 1, top: 0, bottom: sh - 1, width: sw, height: sh, anchorX: sw * 0.5, anchorY: sh };

    try {
      if (typeof document !== 'undefined' && sw > 1 && sh > 1) {
        const canvas = document.createElement('canvas');
        canvas.width = sw; canvas.height = sh;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(src, 0, 0);
        const px = ctx.getImageData(0, 0, sw, sh).data;
        let left = sw, right = -1, top = sh, bottom = -1;
        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            if (px[(y * sw + x) * 4 + 3] <= 18) continue;
            left = Math.min(left, x); right = Math.max(right, x);
            top = Math.min(top, y); bottom = Math.max(bottom, y);
          }
        }
        if (right >= left && bottom >= top) {
          const height = bottom - top + 1;
          const lowerStart = Math.max(top, Math.floor(bottom - height * 0.17));
          let sumX = 0, sumW = 0;
          for (let y = lowerStart; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
              const a = px[(y * sw + x) * 4 + 3];
              if (a > 42) { sumX += x * a; sumW += a; }
            }
          }
          result = {
            sw, sh, left, right, top, bottom,
            width: right - left + 1,
            height,
            anchorX: sumW ? sumX / sumW : (left + right) * 0.5,
            anchorY: Math.min(sh, bottom + 1)
          };
        }
      }
    } catch (err) {
      // Browser-safe fallback keeps the active turn playable.
    }

    this._qaMetricsCache.set(key, result);
    return result;
  }

  _heroLayerLayout(img) {
    if (!img) return;
    if (this._isPrismel() || String(img.texture.key).startsWith('prismel_')) {
      return super._heroLayerLayout(img);
    }

    const c = this._layoutMetrics().cutin;
    const meta = this._qaMetrics(img.texture.key);
    const maxVisibleW = Math.max(1, c.maxW * 0.90);
    const maxVisibleH = Math.max(1, c.maxH * (this._activeHero06A.id === 'auryi' ? 0.82 : 0.78));
    const scale = Math.min(maxVisibleW / Math.max(1, meta.width), maxVisibleH / Math.max(1, meta.height));

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
      if (this._cutinGhost && this._cutinGhost.active) this._cutinGhost.setTexture(first).setAlpha(0);
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

    if (this._heroGlow && this._heroGlow.active) this._heroGlow.setFillStyle(cfg.colour, 0.10);
    if (rig && rig.active) this.scene.tweens.add({ targets: rig, alpha: 1, duration: 260, ease: 'Sine.easeOut' });

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
    const orb = s.add.circle(start.x, start.y, 9, cfg.colour, 0.96)
      .setStrokeStyle(2, cfg.accent, 0.95)
      .setDepth(9462)
      .setBlendMode('ADD');
    this._uiObject(trail); this._uiObject(orb);

    return new Promise(resolve => {
      const driver = { t: 0 };
      s.tweens.add({
        targets: driver, t: 1, duration: 330, ease: 'Cubic.easeIn',
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
      s.tweens.add({ targets: this._heroRig, x: this._heroRig.x + 10, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    }

    await new Promise(resolve => {
      const driver = { t: 0 };
      s.tweens.add({
        targets: driver, t: 1, duration: 210, ease: 'Quad.easeIn',
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

  async _playAttackPresentation(hero, target) {
    if (hero && hero.id === 'prismel') return super._playAttackPresentation(hero, target);

    const cfg = HERO_SEQUENCE[hero.id] || HERO_SEQUENCE.prismel;
    const img = this._ensureCutin();
    img.setTexture(cfg.intro[cfg.intro.length - 1]).setAlpha(1);
    this._layoutCutin();

    if (this._heroGlow && this._heroGlow.active) {
      this.scene.tweens.add({ targets: this._heroGlow, alpha: 0.24, scale: 1.5, duration: 150, yoyo: true, ease: 'Sine.easeOut' });
    }
    await this._delay(110);

    if (hero.id === 'auryi') await this._releaseOrb();
    else await this._kineticRelease();
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
    this._uiObject(ring); this._uiObject(core);

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
