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

  // Kineza's charge-up: ground rings and a rising core glow. Prismel's
  // charge now runs through BattleFXDirector.playChargeFX() instead (see
  // BattleController — hero.fxVersion === 'v2' routes there), so this is
  // Kineza-only; there's no other caller of gather()/beam()/impact().
  gather(duration = 450) {
    this.gatherKineza(duration);
  }

  clearGather() {
    if (this.glow) { this.glow.destroy(); this.glow = null; }
    this.shards.forEach(s => s.destroy());
    this.shards = [];
  }

  // Kineza's strike trail. Prismel's projectile now runs through
  // BattleFXDirector.playProjectileFX() instead.
  beam(duration = 160) {
    if (this.scene.battleFeel) this.scene.battleFeel.release();
    this.strikeKineza(duration, true);
  }

  // Kineza's ground-shock impact. Prismel's impact now runs through
  // BattleFXDirector.playImpactFX() instead.
  impact() {
    if (this.scene.battleFeel) this.scene.battleFeel.impact({ critical: false });
    this.impactKineza(true);
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

  strikeKineza(duration = 160, alreadySignalled = false) {
    if (!alreadySignalled && this.scene.battleFeel) this.scene.battleFeel.release();
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

  impactKineza(alreadySignalled = false) {
    if (!alreadySignalled && this.scene.battleFeel) this.scene.battleFeel.impact({ critical: false });
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

  // The drawn target crosshair that lived here through v4-v8 is now
  // src/TargetReticle.js, built from the Alpha v1.0 targeting kit with
  // seeking / locked / confirmed as separate states.

  // v4: critical hit flourish — gold burst plus a CRITICAL! callout.
  // The gold numeral treatment (BattleFeedback) now carries the "this
  // was critical" signal on its own, so this callout only needs to be a
  // quick accent, not a second headline fighting the number for
  // attention — smaller, and gone well before the numeral's own fade.
  critical() {
    if (this.scene.battleFeel) this.scene.battleFeel.impact({ critical: true });
    const p = this.targetPoint();
    // v32's reticle is a hollow ring, not a fixed-size baked image, so a
    // constant offset here can land back on the Wraith's face depending
    // on the reticle's actual radius at this viewport — scale off it.
    const reticle = this.scene.reticle;
    const clearance = reticle && reticle.radius ? reticle.radius * 1.15 : 70;
    const label = this._w(this.scene.add.text(p.x, p.y - clearance, 'CRIT', {
      fontSize: Math.round(Math.max(11, this.scene.scale.width * 0.021)) + 'px',
      fontStyle: 'bold',
      color: '#FFF3B0',
      stroke: '#7A3A00',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(62).setScale(0.5));

    this.scene.tweens.add({
      targets: label, scaleX: 0.92, scaleY: 0.92, duration: 105, ease: 'Back.easeOut'
    });
    this.scene.tweens.add({
      targets: label, y: label.y - 18, alpha: 0, duration: 260, delay: 70, ease: 'Quad.easeOut',
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
}
