// Battle Presentation v3 — FX polish.
// Crystal glow, orbiting shards, prismatic beam, diamond fragments,
// lingering sparkles. All procedural so nothing new needs to load.
const PRISM = [0xff6b6b, 0xffb36b, 0xffef7d, 0x71ff88, 0x67c8ff, 0xc477ff, 0xff65c8];

export default class BattleFX {
  constructor(scene) {
    this.scene = scene;
    this.shards = [];
  }

  // Where the hero's crystal sits, derived from the pose view so it
  // tracks the portrait/landscape layouts.
  castPoint() {
    const poses = this.scene.heroPoses;
    if (!poses || !poses.sprite) {
      return { x: this.scene.scale.width * 0.3, y: this.scene.scale.height * 0.6 };
    }
    // Roughly the crystal at the top of the raised wand.
    const s = poses.sprite;
    return { x: s.x + s.displayWidth * 0.34, y: s.y - s.displayHeight * 0.89 };
  }

  targetPoint() {
    const enemy = this.scene.enemyView;
    if (!enemy || !enemy.container) {
      return { x: this.scene.scale.width * 0.75, y: this.scene.scale.height * 0.6 };
    }
    return { x: enemy.container.x, y: enemy.container.y - 40 * enemy.container.scaleY };
  }

  // Charge-up: a growing core with shards spiralling inward.
  gather(duration = 450) {
    const p = this.castPoint();
    this.clearGather();

    this.glow = this.scene.add.circle(p.x, p.y, 6, 0xdff0ff, 0.85).setDepth(40);
    this.scene.tweens.add({
      targets: this.glow,
      radius: 20,
      alpha: 0.95,
      duration,
      ease: 'Sine.easeInOut'
    });

    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const dist = 46 + (i % 3) * 10;
      const shard = this.scene.add.star(
        p.x + Math.cos(angle) * dist,
        p.y + Math.sin(angle) * dist,
        4, 2.5, 8,
        PRISM[i % PRISM.length],
        0.9
      ).setDepth(41);
      this.shards.push(shard);
      this.scene.tweens.add({
        targets: shard,
        x: p.x,
        y: p.y,
        angle: 180,
        scaleX: 0.4,
        scaleY: 0.4,
        duration: duration + 120,
        ease: 'Quad.In'
      });
    }
  }

  clearGather() {
    if (this.glow) { this.glow.destroy(); this.glow = null; }
    this.shards.forEach(s => s.destroy());
    this.shards = [];
  }

  // Prismatic beam from the crystal to the enemy, layered rainbow lines.
  beam(duration = 160) {
    const a = this.castPoint();
    const b = this.targetPoint();
    const g = this.scene.add.graphics().setDepth(45);

    PRISM.forEach((color, i) => {
      const off = (i - 3) * 3;
      g.lineStyle(3, color, 0.85);
      g.beginPath();
      g.moveTo(a.x, a.y + off);
      g.lineTo(b.x, b.y + off * 1.6);
      g.strokePath();
    });

    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: duration + 220,
      ease: 'Quad.Out',
      onComplete: () => g.destroy()
    });

    if (this.glow) {
      this.scene.tweens.add({
        targets: this.glow,
        radius: 4,
        alpha: 0,
        duration,
        onComplete: () => this.clearGather()
      });
    }
  }

  // Impact: diamond fragments burst out, then lingering sparkles drift.
  impact() {
    const p = this.targetPoint();

    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + 0.2;
      const frag = this.scene.add.star(p.x, p.y, 4, 3, 9, PRISM[i % PRISM.length], 0.95).setDepth(46);
      this.scene.tweens.add({
        targets: frag,
        x: p.x + Math.cos(angle) * (60 + (i % 4) * 18),
        y: p.y + Math.sin(angle) * (46 + (i % 3) * 16),
        angle: 220,
        alpha: 0,
        scaleX: 0.25,
        scaleY: 0.25,
        duration: 620 + (i % 5) * 60,
        ease: 'Quad.Out',
        onComplete: () => frag.destroy()
      });
    }

    const ring = this.scene.add.circle(p.x, p.y, 8, 0xffffff, 0)
      .setStrokeStyle(3, 0xdff0ff, 0.9).setDepth(45);
    this.scene.tweens.add({
      targets: ring,
      radius: 70,
      alpha: 0,
      duration: 460,
      ease: 'Expo.Out',
      onComplete: () => ring.destroy()
    });

    this.scene.time.delayedCall(160, () => this.sparkles(p));
  }

  sparkles(p) {
    for (let i = 0; i < 9; i++) {
      const sp = this.scene.add.circle(
        p.x + Phaser.Math.Between(-46, 46),
        p.y + Phaser.Math.Between(-34, 34),
        Phaser.Math.FloatBetween(1.6, 3.2),
        PRISM[i % PRISM.length],
        0.9
      ).setDepth(44);
      this.scene.tweens.add({
        targets: sp,
        y: sp.y - Phaser.Math.Between(26, 58),
        alpha: 0,
        duration: 900 + i * 70,
        ease: 'Sine.easeOut',
        onComplete: () => sp.destroy()
      });
    }
  }
}
