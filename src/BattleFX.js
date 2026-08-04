// Battle Presentation v3 — FX polish.
// Crystal glow, orbiting shards, prismatic beam, diamond fragments,
// lingering sparkles. All procedural so nothing new needs to load.
const PRISM = [0xff6b6b, 0xffb36b, 0xffef7d, 0x71ff88, 0x67c8ff, 0xc477ff, 0xff65c8];

export default class BattleFX {
  constructor(scene) {
    this.scene = scene;
    this.shards = [];
  }

  // FX are battlefield visuals — they must zoom with the world camera.
  _w(obj) {
    if (this.scene.worldAdd) this.scene.worldAdd(obj);
    return obj;
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
    const heroId = this.scene.battleConfig && this.scene.battleConfig.hero.id;
    if (heroId === 'kineza') return this.gatherKineza(duration);
    const p = this.castPoint();
    this.clearGather();

    this.glow = this._w(this.scene.add.circle(p.x, p.y, 6, 0xdff0ff, 0.85).setDepth(40));
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
      const shard = this._w(this.scene.add.star(
        p.x + Math.cos(angle) * dist,
        p.y + Math.sin(angle) * dist,
        4, 2.5, 8,
        PRISM[i % PRISM.length],
        0.9
      ).setDepth(41));
      this.shards.push(shard);
      this.scene.tweens.add({
        targets: shard,
        x: p.x,
        y: p.y,
        angle: 180,
        scaleX: 0.4,
        scaleY: 0.4,
        duration: duration + 120,
        ease: 'Quad.easeIn'
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
    const heroId = this.scene.battleConfig && this.scene.battleConfig.hero.id;
    if (heroId === 'kineza') return this.strikeKineza(duration);
    const a = this.castPoint();
    const b = this.targetPoint();
    const g = this._w(this.scene.add.graphics().setDepth(45));

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
      ease: 'Quad.easeOut',
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
    const heroId = this.scene.battleConfig && this.scene.battleConfig.hero.id;
    if (heroId === 'kineza') return this.impactKineza();
    const p = this.targetPoint();

    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + 0.2;
      const frag = this._w(this.scene.add.star(p.x, p.y, 4, 3, 9, PRISM[i % PRISM.length], 0.95).setDepth(46));
      this.scene.tweens.add({
        targets: frag,
        x: p.x + Math.cos(angle) * (60 + (i % 4) * 18),
        y: p.y + Math.sin(angle) * (46 + (i % 3) * 16),
        angle: 220,
        alpha: 0,
        scaleX: 0.25,
        scaleY: 0.25,
        duration: 620 + (i % 5) * 60,
        ease: 'Quad.easeOut',
        onComplete: () => frag.destroy()
      });
    }

    const ring = this._w(this.scene.add.circle(p.x, p.y, 8, 0xffffff, 0)
      .setStrokeStyle(3, 0xdff0ff, 0.9).setDepth(45));
    this.scene.tweens.add({
      targets: ring,
      radius: 70,
      alpha: 0,
      duration: 460,
      ease: 'Expo.easeOut',
      onComplete: () => ring.destroy()
    });

    this.scene.time.delayedCall(160, () => this.sparkles(p));
  }


  gatherKineza(duration = 450) {
    const hero = this.scene.heroPoses && this.scene.heroPoses.sprite;
    if (!hero) return;
    this.clearGather();
    const y = hero.y - hero.displayHeight * 0.43;
    this.glow = this._w(this.scene.add.circle(hero.x + hero.displayWidth * 0.18, y, 5, 0x68ff8c, 0.18).setDepth(40));
    this.scene.tweens.add({
      targets: this.glow,
      radius: 27,
      alpha: 0.52,
      duration,
      ease: 'Sine.easeInOut'
    });
    for (let i = 0; i < 5; i++) {
      const ring = this._w(this.scene.add.ellipse(
        hero.x + hero.displayWidth * 0.18,
        y + i * 4,
        26 + i * 12,
        10 + i * 4,
        0x68ff8c,
        0
      ).setStrokeStyle(2, 0x68ff8c, 0.42).setDepth(39));
      this.shards.push(ring);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 0.35,
        scaleY: 0.65,
        angle: 70 + i * 24,
        alpha: 0.85,
        duration: duration + i * 55,
        ease: 'Quad.easeIn'
      });
    }
    if (this.scene.atmosphere) this.scene.atmosphere.gather('kineza');
  }

  strikeKineza(duration = 160) {
    const hero = this.scene.heroPoses && this.scene.heroPoses.sprite;
    const b = this.targetPoint();
    if (!hero) return;
    const a = {
      x: hero.x + hero.displayWidth * 0.31,
      y: hero.y - hero.displayHeight * 0.48
    };
    const trail = this._w(this.scene.add.graphics().setDepth(45));
    trail.lineStyle(11, 0x65ff87, 0.20);
    trail.beginPath(); trail.moveTo(a.x - 55, a.y + 12); trail.lineTo(b.x, b.y); trail.strokePath();
    trail.lineStyle(3, 0xd8ffe1, 0.86);
    trail.beginPath(); trail.moveTo(a.x - 18, a.y); trail.lineTo(b.x, b.y); trail.strokePath();
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: duration + 170,
      ease: 'Quad.easeOut',
      onComplete: () => trail.destroy()
    });
    this.clearGather();
  }

  impactKineza() {
    const p = this.targetPoint();
    const ring = this._w(this.scene.add.ellipse(p.x, p.y, 14, 44, 0x68ff8c, 0)
      .setStrokeStyle(5, 0x68ff8c, 0.72).setDepth(46));
    this.scene.tweens.add({
      targets: ring,
      scaleX: 7,
      scaleY: 2.2,
      alpha: 0,
      duration: 360,
      ease: 'Expo.easeOut',
      onComplete: () => ring.destroy()
    });
    for (let i = 0; i < 12; i++) {
      const streak = this._w(this.scene.add.rectangle(
        p.x, p.y,
        Phaser.Math.Between(22, 58), 2,
        i % 3 === 0 ? 0xd8ffe1 : 0x68ff8c,
        0.7
      ).setDepth(45).setAngle(Phaser.Math.Between(-65, 65)));
      this.scene.tweens.add({
        targets: streak,
        x: p.x + Phaser.Math.Between(-110, 110),
        y: p.y + Phaser.Math.Between(-70, 70),
        alpha: 0,
        duration: Phaser.Math.Between(250, 450),
        ease: 'Quad.easeOut',
        onComplete: () => streak.destroy()
      });
    }
    if (this.scene.atmosphere) this.scene.atmosphere.impact('kineza');
  }

  // v4: target reticle over the enemy while the player's round is live.
  showTargetCursor() {
    if (this.cursor) return;
    const p = this.targetPoint();
    const accent = (this.scene.battleConfig && this.scene.battleConfig.hero.accent) || 0xffd56a;
    const g = this._w(this.scene.add.graphics().setDepth(38));

    // Package 07: a floating Veil glyph rather than a plain crosshair —
    // an outer diamond, an inner counter-rotating diamond, tick arms.
    g.lineStyle(2, accent, 0.9);
    g.beginPath();
    g.moveTo(0, -42); g.lineTo(34, 0); g.lineTo(0, 42); g.lineTo(-34, 0);
    g.closePath(); g.strokePath();

    g.lineStyle(1, accent, 0.5);
    g.beginPath();
    g.moveTo(0, -22); g.lineTo(18, 0); g.lineTo(0, 22); g.lineTo(-18, 0);
    g.closePath(); g.strokePath();

    g.lineStyle(2, accent, 0.75);
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx,dy]) => {
      g.beginPath();
      g.moveTo(dx * 46, dy * 52);
      g.lineTo(dx * 58, dy * 64);
      g.strokePath();
    });

    g.setPosition(p.x, p.y);
    this.cursor = g;
    this.scene.tweens.add({
      targets: g, angle: 360, duration: 9000, repeat: -1, ease: 'Linear'
    });
    this.scene.tweens.add({
      targets: g, alpha: 0.45, scaleX: 1.06, scaleY: 1.06,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  // The glyph shatters outward instead of simply vanishing.
  fractureTargetCursor() {
    if (!this.cursor) return;
    const g = this.cursor;
    this.cursor = null;
    this.scene.tweens.killTweensOf(g);
    const accent = (this.scene.battleConfig && this.scene.battleConfig.hero.accent) || 0xffd56a;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const shard = this._w(this.scene.add.rectangle(g.x, g.y, 24, 2, accent, 0.85).setDepth(39)
        .setAngle(Phaser.Math.RadToDeg(a)));
      this.scene.tweens.add({
        targets: shard,
        x: g.x + Math.cos(a) * 70,
        y: g.y + Math.sin(a) * 70,
        alpha: 0,
        duration: 380,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }
    this.scene.tweens.add({
      targets: g, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 260,
      ease: 'Quad.easeOut', onComplete: () => g.destroy()
    });
  }

  hideTargetCursor() {
    if (!this.cursor) return;
    this.scene.tweens.killTweensOf(this.cursor);
    this.cursor.destroy();
    this.cursor = null;
  }

  // v4: critical hit flourish — gold burst plus a CRITICAL! callout.
  critical() {
    const p = this.targetPoint();
    const label = this._w(this.scene.add.text(p.x, p.y - 74, 'CRITICAL!', {
      fontSize: Math.round(Math.max(22, this.scene.scale.width * 0.045)) + 'px',
      fontStyle: 'bold',
      color: '#FFF3B0',
      stroke: '#7A3A00',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(62).setScale(0.5));

    this.scene.tweens.add({
      targets: label, scaleX: 1.15, scaleY: 1.15, duration: 180, ease: 'Back.easeOut'
    });
    this.scene.tweens.add({
      targets: label, y: label.y - 42, alpha: 0, duration: 1000, delay: 260, ease: 'Quad.easeOut',
      onComplete: () => label.destroy()
    });

    for (let i = 0; i < 3; i++) {
      const ring = this._w(this.scene.add.circle(p.x, p.y, 10, 0xffffff, 0)
        .setStrokeStyle(3, 0xffd56a, 0.85).setDepth(47));
      this.scene.tweens.add({
        targets: ring, radius: 92 + i * 16, alpha: 0,
        duration: 520 + i * 130, delay: i * 90, ease: 'Expo.easeOut',
        onComplete: () => ring.destroy()
      });
    }
  }

  // v4: victory stinger — prismatic motes rise as the veil clears.
  victoryStinger() {
    const w = this.scene.scale.width, h = this.scene.scale.height;
    for (let i = 0; i < 22; i++) {
      const m = this._w(this.scene.add.star(
        Phaser.Math.Between(w * 0.1, w * 0.9),
        Phaser.Math.Between(h * 0.55, h * 0.8),
        4, 3, 10, PRISM[i % PRISM.length], 0.9
      ).setDepth(58));
      this.scene.tweens.add({
        targets: m,
        y: m.y - Phaser.Math.Between(180, 340),
        angle: 180,
        alpha: 0,
        duration: 1400 + i * 40,
        delay: i * 45,
        ease: 'Sine.easeOut',
        onComplete: () => m.destroy()
      });
    }
    this.scene.cameras.main.flash(320, 255, 240, 190);
  }

  sparkles(p) {
    for (let i = 0; i < 9; i++) {
      const sp = this._w(this.scene.add.circle(
        p.x + Phaser.Math.Between(-46, 46),
        p.y + Phaser.Math.Between(-34, 34),
        Phaser.Math.FloatBetween(1.6, 3.2),
        PRISM[i % PRISM.length],
        0.9
      ).setDepth(44));
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
