// The Prismatic Veil — v32 hollow-center Veil targeting rig.
//
// Same public API as the v31 reticle: seek, lock, confirm, shatter, hide.
// The baked center gem is intentionally removed. Four separated brackets
// frame the enemy while the eye line and face remain completely unobstructed.

export default class TargetReticle {
  constructor(scene) {
    this.scene = scene;
    this.graphics = null;
    this.state = null;
    this.radius = 64;
  }

  _targetPoint() {
    const enemy = this.scene.enemyView;
    if (!enemy || !enemy.sprite || !enemy.container) {
      return { x: this.scene.scale.width * 0.75, y: this.scene.scale.height * 0.6, r: 68 };
    }
    const c = enemy.container;
    const s = enemy.sprite;
    const h = s.displayHeight * Math.abs(c.scaleY || 1);
    const room = this.scene.scale.width * 0.42 - 12;
    return {
      x: c.x,
      y: c.y - h * 0.43,
      r: Math.max(48, Math.min(h * 0.40, room / 0.82))
    };
  }

  _accent() {
    const hero = this.scene.battleConfig && this.scene.battleConfig.hero;
    return (hero && hero.accent) || 0xffd56a;
  }

  _ensure() {
    if (this.graphics && this.graphics.scene) return this.graphics;
    this.graphics = this.scene.add.graphics().setDepth(16);
    this.scene.worldAdd(this.graphics);
    return this.graphics;
  }

  _diamond(g, x, y, size, alpha) {
    g.lineStyle(2, this._accent(), alpha);
    g.beginPath();
    g.moveTo(x, y - size);
    g.lineTo(x + size, y);
    g.lineTo(x, y + size);
    g.lineTo(x - size, y);
    g.closePath();
    g.strokePath();
  }

  _corner(g, sx, sy, r, len, alpha) {
    const x = sx * r;
    const y = sy * r;
    g.lineStyle(3, this._accent(), alpha);
    g.beginPath();
    g.moveTo(x - sx * len, y);
    g.lineTo(x, y);
    g.lineTo(x, y - sy * len);
    g.strokePath();
  }

  _draw(state, r) {
    const g = this._ensure();
    g.clear();
    this.radius = r;

    const seeking = state === 'seeking';
    const confirmed = state === 'confirmed';
    const alpha = seeking ? 0.54 : (confirmed ? 0.95 : 0.76);
    const len = r * (seeking ? 0.22 : 0.29);
    const edge = r * (seeking ? 0.68 : 0.61);

    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx, sy]) => {
      this._corner(g, sx, sy, edge, len, alpha);
    });

    // Cardinal anchor diamonds sit outside the body, never in its center.
    const d = Math.max(3, r * 0.055);
    this._diamond(g, 0, -r * 0.78, d, alpha * 0.9);
    this._diamond(g, r * 0.78, 0, d, alpha * 0.9);
    this._diamond(g, 0, r * 0.78, d, alpha * 0.9);
    this._diamond(g, -r * 0.78, 0, d, alpha * 0.9);

    // Broken arc segments communicate analysis without becoming a modern
    // crosshair. The middle stays empty by design.
    g.lineStyle(seeking ? 1 : 2, this._accent(), alpha * 0.52);
    for (let i = 0; i < 8; i++) {
      const a0 = i * Math.PI / 4 + 0.08;
      const a1 = a0 + (seeking ? 0.18 : 0.28);
      g.beginPath();
      g.arc(0, 0, r * 0.52, a0, a1, false);
      g.strokePath();
    }

    if (confirmed) {
      g.lineStyle(2, 0xffffff, 0.66);
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + i * Math.PI / 2;
        const x0 = Math.cos(a) * r * 0.82;
        const y0 = Math.sin(a) * r * 0.82;
        const x1 = Math.cos(a) * r * 1.02;
        const y1 = Math.sin(a) * r * 1.02;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokePath();
      }
    }
  }

  seek() {
    const p = this._targetPoint();
    const g = this._ensure();
    this.state = 'seeking';
    this.scene.tweens.killTweensOf(g);
    this._draw('seeking', p.r);
    g.setPosition(p.x + p.r * 0.34, p.y - p.r * 0.18)
      .setScale(1.20).setAlpha(0).setAngle(-18);

    this.scene.tweens.add({
      targets: g,
      x: p.x,
      y: p.y,
      alpha: 0.78,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Quad.easeOut'
    });
    this._drift = this.scene.tweens.add({
      targets: g,
      angle: 360,
      duration: 13000,
      delay: 320,
      repeat: -1,
      ease: 'Linear'
    });
    if (this.scene.uiAudio) this.scene.uiAudio.hover();
  }

  lock(onDone) {
    const p = this._targetPoint();
    const g = this._ensure();
    this.state = 'locked';
    this.scene.tweens.killTweensOf(g);
    if (this._drift) { this._drift.stop(); this._drift = null; }
    this._draw('locked', p.r);
    g.setPosition(p.x, p.y).setAngle(0).setScale(1.18).setAlpha(0.9);

    this.scene.tweens.add({
      targets: g,
      scaleX: 1,
      scaleY: 1,
      alpha: 0.74,
      duration: 155,
      ease: 'Back.easeOut',
      onComplete: () => {
        this._pulse = this.scene.tweens.add({
          targets: g,
          alpha: 0.50,
          duration: 920,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        if (this.scene.battleFeel) this.scene.battleFeel.lock();
        if (onDone) onDone();
      }
    });
    if (this.scene.uiAudio) this.scene.uiAudio.cursor();
  }

  confirm() {
    if (!this.graphics || !this.graphics.scene) return;
    const p = this._targetPoint();
    const g = this.graphics;
    this.state = 'confirmed';
    this.scene.tweens.killTweensOf(g);
    if (this._pulse) { this._pulse.stop(); this._pulse = null; }
    this._draw('confirmed', p.r);
    g.setPosition(p.x, p.y).setAlpha(1).setScale(1);
    this.scene.tweens.add({
      targets: g,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 108,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  shatter() {
    if (!this.graphics || !this.graphics.scene) return;
    const g = this.graphics;
    this.graphics = null;
    this.state = null;
    this.scene.tweens.killTweensOf(g);
    if (this._pulse) { this._pulse.stop(); this._pulse = null; }
    if (this._drift) { this._drift.stop(); this._drift = null; }

    const accent = this._accent();
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2;
      const shard = this.scene.add.rectangle(g.x, g.y, 22, 2, accent, 0.82)
        .setDepth(39).setAngle(a * 180 / Math.PI);
      this.scene.worldAdd(shard);
      this.scene.tweens.add({
        targets: shard,
        x: g.x + Math.cos(a) * 62,
        y: g.y + Math.sin(a) * 62,
        alpha: 0,
        duration: 330,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }
    this.scene.tweens.add({
      targets: g,
      scaleX: 1.28,
      scaleY: 1.28,
      alpha: 0,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => g.destroy()
    });
  }

  hide() {
    if (!this.graphics || !this.graphics.scene) return;
    this.scene.tweens.killTweensOf(this.graphics);
    if (this._pulse) { this._pulse.stop(); this._pulse = null; }
    if (this._drift) { this._drift.stop(); this._drift = null; }
    this.graphics.destroy();
    this.graphics = null;
    this.state = null;
  }
}
