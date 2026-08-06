
export default class BattleAtmosphere {
  constructor(scene) {
    this.scene = scene;
    this.motes = [];
  }

  w(obj) {
    if (this.scene.worldAdd) this.scene.worldAdd(obj);
    return obj;
  }

  create() {
    this.backdrop = this.w(this.scene.add.graphics().setDepth(-100));
    this.bands = this.w(this.scene.add.graphics().setDepth(-90));
    this.fog = this.w(this.scene.add.graphics().setDepth(-30));
    this.floor = this.w(this.scene.add.graphics().setDepth(-40));
    this.foreground = this.w(this.scene.add.graphics().setDepth(90));

    // Package 08: layers drift at different rates against the camera, so
    // the field has depth rather than sliding as one flat plate.
    this.parallax = [
      { obj: this.bands, factor: -0.16 },
      { obj: this.fog, factor: -0.07 },
      // v38A: the combat platform reads as a fixed stage floor the
      // fighters stand on, not another drifting depth layer — zeroed so
      // it's genuinely static rather than a near-zero factor that still
      // moved a few px on a hard camera push.
      { obj: this.floor, factor: 0 },
      { obj: this.foreground, factor: 0.22 }
    ];
    this.parallax.forEach(l => { l.homeX = 0; });
    this.scene.events.on('update', this.updateParallax, this);

    this.buildFog();
    this.buildMotes();
    this.layout();

    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => {
      this.scene.scale.off('resize', this.layout, this);
      this.scene.events.off('update', this.updateParallax, this);
    });
  }

  // Offset each layer against the camera's travel from centre.
  updateParallax() {
    if (!this.parallax) return;
    const cam = this.scene.cameras.main;
    const cx = cam.scrollX + cam.width / 2 - this.scene.scale.width / 2;
    const cy = cam.scrollY + cam.height / 2 - this.scene.scale.height / 2;
    this.parallax.forEach(l => {
      l.obj.x = cx * l.factor;
      l.obj.y = cy * l.factor * 0.6;
    });
  }

  buildFog() {
    this.fogBanks = [];
    for (let i = 0; i < 3; i++) {
      const e = this.w(this.scene.add.ellipse(0, 0, 10, 10, 0x6a4fa8, 0.05).setDepth(-30));
      this.fogBanks.push(e);
    }
  }

  layout() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    this.backdrop.clear();
    this.backdrop.fillGradientStyle(0x17102d, 0x0b0a18, 0x070611, 0x070611, 1);
    this.backdrop.fillRect(0, 0, w, h);

    // Distant Veil bands and light shafts, on their own parallax layer.
    this.bands.clear();
    for (let i = 0; i < 5; i++) {
      const x = w * (0.08 + i * 0.22);
      this.bands.fillStyle(i % 2 ? 0x5e39a6 : 0x276c85, 0.055);
      this.bands.fillTriangle(x, 0, x + w * 0.18, 0, x + w * 0.04, h * 0.72);
    }

    // Slow fog banks drifting across the midground.
    if (this.fogBanks) {
      this.fogBanks.forEach((e, i) => {
        this.scene.tweens.killTweensOf(e);
        e.setSize(w * (0.7 + i * 0.2), h * (0.10 + i * 0.03));
        e.setPosition(w * (0.1 + i * 0.3), h * (0.5 + i * 0.07));
        e.setAlpha(0.05 + i * 0.012);
        this.scene.tweens.add({
          targets: e,
          x: e.x + w * 0.26,
          duration: 14000 + i * 4200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });
    }

    this.floor.clear();
    this.floor.fillStyle(0x100d1d, 0.96);
    this.floor.fillEllipse(w * 0.5, h * 0.74, w * 1.18, h * 0.34);
    this.floor.lineStyle(1, 0xb586ff, 0.11);
    for (let i = 0; i < 7; i++) {
      this.floor.strokeEllipse(w * 0.5, h * (0.69 + i * 0.018), w * (0.25 + i * 0.13), h * (0.035 + i * 0.016));
    }

    this.foreground.clear();
    this.foreground.fillStyle(0x05040a, 0.55);
    this.foreground.fillTriangle(0, h, w * 0.16, h * 0.83, w * 0.27, h);
    this.foreground.fillTriangle(w, h, w * 0.86, h * 0.82, w * 0.72, h);

    this.positionMotes();
  }

  buildMotes() {
    for (let i = 0; i < 24; i++) {
      const mote = this.w(this.scene.add.circle(0, 0, Phaser.Math.FloatBetween(0.8, 2.2),
        i % 3 === 0 ? 0x70d9ff : i % 3 === 1 ? 0xaa76ff : 0xffd56a,
        Phaser.Math.FloatBetween(0.12, 0.34)).setDepth(-10));
      this.motes.push(mote);
      this.scene.tweens.add({
        targets: mote,
        y: '-=24',
        x: `+=${Phaser.Math.Between(-12, 12)}`,
        alpha: { from: mote.alpha, to: 0.04 },
        duration: Phaser.Math.Between(2200, 4300),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  positionMotes() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    this.motes.forEach((m, i) => {
      m.setPosition(
        ((i * 83) % 997) / 997 * w,
        h * (0.18 + (((i * 151) % 719) / 719) * 0.62)
      );
    });
  }

  gather(heroId) {
    if (heroId !== 'kineza') return;
    const h = this.scene.heroPoses && this.scene.heroPoses.sprite;
    if (!h) return;
    for (let i = 0; i < 10; i++) {
      const p = this.w(this.scene.add.circle(
        h.x + Phaser.Math.Between(-45, 45),
        h.y + Phaser.Math.Between(-15, 22),
        Phaser.Math.FloatBetween(1, 2.5),
        0x68ff8c,
        0.6
      ).setDepth(26));
      this.scene.tweens.add({
        targets: p,
        x: h.x + Phaser.Math.Between(-12, 12),
        y: h.y - h.displayHeight * Phaser.Math.FloatBetween(0.28, 0.62),
        alpha: 0,
        duration: Phaser.Math.Between(360, 620),
        ease: 'Quad.easeIn',
        onComplete: () => p.destroy()
      });
    }
  }

  // Ground compression ripple beneath a combatant.
  compressionRipple(x, y, tint) {
    const ring = this.w(this.scene.add.ellipse(x, y, 30, 9, 0x000000, 0)
      .setStrokeStyle(2, tint || 0xb586ff, 0.5).setDepth(-20));
    this.scene.tweens.add({
      targets: ring,
      scaleX: 5.5,
      scaleY: 2.4,
      alpha: 0,
      duration: 620,
      ease: 'Expo.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  impact(heroId) {
    const target = this.scene.battleFx && this.scene.battleFx.targetPoint
      ? this.scene.battleFx.targetPoint()
      : { x: this.scene.scale.width * 0.73, y: this.scene.scale.height * 0.58 };

    if (heroId === 'kineza') {
      // Ground shockline, dust and pebbles. Mostly physics, little glow.
      const line = this.w(this.scene.add.graphics().setDepth(32));
      line.lineStyle(4, 0x8fff9e, 0.72);
      line.beginPath();
      line.moveTo(target.x - 145, target.y + 68);
      line.lineTo(target.x - 72, target.y + 54);
      line.lineTo(target.x - 20, target.y + 70);
      line.lineTo(target.x + 48, target.y + 58);
      line.lineTo(target.x + 116, target.y + 74);
      line.strokePath();
      this.scene.tweens.add({
        targets: line,
        alpha: 0,
        duration: 460,
        ease: 'Quad.easeOut',
        onComplete: () => line.destroy()
      });

      for (let i = 0; i < 18; i++) {
        const rock = this.w(this.scene.add.rectangle(
          target.x + Phaser.Math.Between(-42, 42),
          target.y + 58,
          Phaser.Math.Between(3, 8),
          Phaser.Math.Between(3, 7),
          i % 4 === 0 ? 0x69ff8a : 0x5d4f63,
          0.9
        ).setDepth(34).setAngle(Phaser.Math.Between(0, 180)));
        this.scene.tweens.add({
          targets: rock,
          x: rock.x + Phaser.Math.Between(-105, 105),
          y: rock.y - Phaser.Math.Between(28, 105),
          angle: rock.angle + Phaser.Math.Between(120, 420),
          alpha: 0,
          duration: Phaser.Math.Between(460, 780),
          ease: 'Quad.easeOut',
          onComplete: () => rock.destroy()
        });
      }

      const dust = this.w(this.scene.add.ellipse(target.x, target.y + 64, 40, 14, 0xb9a99d, 0.22).setDepth(30));
      this.scene.tweens.add({
        targets: dust,
        scaleX: 5.2,
        scaleY: 2.1,
        alpha: 0,
        duration: 650,
        ease: 'Expo.easeOut',
        onComplete: () => dust.destroy()
      });
    }
  }
}
