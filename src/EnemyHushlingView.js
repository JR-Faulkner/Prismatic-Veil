// v34 — full-fidelity Hushling art, matching the approved concept design.
// Hushlings are wider and heavier than Veil Wraiths. The animation
// language emphasizes mass: slow weight shift, short lunge, hard recoil,
// and a downward collapse. A low-alpha ADD-blended glow layer breathes
// behind the sprite, echoing its molten-core design.
export const HUSHLING_TEXTURES = Object.freeze({
  idle: 'Hushling_v34_Idle',
  attack: 'Hushling_v34_Attack',
  hit: 'Hushling_v34_Hit',
  shatter: 'Hushling_v34_Shatter'
});

export default class EnemyHushlingView {
  constructor(scene) {
    this.scene = scene;
    this.pose = 'idle';
    this._transitioning = false;
    this._idleTweens = [];
  }

  create() {
    this.container = this.scene.add.container(0, 0).setDepth(18);

    this.glow = this.scene.add.image(0, 0, HUSHLING_TEXTURES.idle)
      .setOrigin(0.5, 1).setAlpha(0.14).setBlendMode('ADD');
    // Ghost holds the outgoing pose at full opacity during a crossfade —
    // see setPose(). Matches the pattern already fixed on the hero's own
    // pose view: fading both layers at once leaves neither solid, and a
    // hit stop freezing mid-blend would show the background through it.
    this.ghost = this.scene.add.image(0, 0, HUSHLING_TEXTURES.idle)
      .setOrigin(0.5, 1).setAlpha(0);
    this.sprite = this.scene.add.image(0, 0, HUSHLING_TEXTURES.idle).setOrigin(0.5, 1);

    this.container.add([this.glow, this.ghost, this.sprite]);
    if (this.scene.worldAdd) this.scene.worldAdd(this.container);

    this.layout();
    this.startIdle();

    this.scene.scale.on('resize', this.layout, this);
    this.scene.events.once('shutdown', () => {
      this.scene.scale.off('resize', this.layout, this);
    });
  }

  layout() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const landscape = width > height;
    const compact = width < 560 || height < 520;

    if (landscape) {
      this.baseX = Math.round(width * 0.72);
      this.baseY = Math.round(height * 0.92);
    } else {
      this.baseX = Math.round(width * (compact ? 0.76 : 0.78));
      this.baseY = Math.round(height - (compact ? 284 : 264));
    }
    const targetHeight = landscape
      ? Math.min(255, height * 0.66)
      : Math.min(compact ? 286 : 350, height * (compact ? 0.36 : 0.45));

    // The v34 art is tall and narrow, not square like the old locked
    // sprites — forcing a square display box would squash it. Derive
    // the width from the source image's own aspect ratio instead.
    const ratio = this.sprite.width / this.sprite.height;
    const targetWidth = targetHeight * ratio;
    this.sprite.setDisplaySize(targetWidth, targetHeight);
    this.ghost.setDisplaySize(targetWidth, targetHeight);
    this.glow.setDisplaySize(targetWidth * 1.02, targetHeight * 1.02);

    this.container.setPosition(this.baseX, this.baseY);
  }

  startIdle() {
    this.stopIdle();
    this._idleTweens = [
      this.scene.tweens.add({
        targets: this.container,
        y: this.baseY - 3,
        scaleX: 1.014,
        scaleY: 0.992,
        duration: 1850,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      }),
      this.scene.tweens.add({
        targets: this.glow,
        alpha: { from: 0.08, to: 0.22 },
        duration: 1120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    ];
  }

  stopIdle() {
    this._idleTweens.forEach(t => t && t.stop());
    this._idleTweens = [];
    this.scene.tweens.killTweensOf([this.container, this.glow]);
  }

  setPose(name, duration = 110) {
    const texture = HUSHLING_TEXTURES[name] || HUSHLING_TEXTURES.idle;
    this.glow.setTexture(texture);

    if (this.pose === name || this._transitioning) {
      this.sprite.setTexture(texture);
      this.pose = name;
      return;
    }

    this.scene.tweens.killTweensOf(this.sprite);
    this._transitioning = true;
    this.ghost.setTexture(this.sprite.texture.key)
      .setDisplaySize(this.sprite.displayWidth, this.sprite.displayHeight)
      .setAlpha(1);
    this.sprite.setTexture(texture).setAlpha(0);

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.sprite.setAlpha(1);
        this.ghost.setAlpha(0);
        this.pose = name;
        this._transitioning = false;
      }
    });
  }

  introSlide(duration = 560) {
    this.layout();
    this.container.setX(this.baseX - this.scene.scale.width * 0.62).setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX,
      alpha: 1,
      duration,
      ease: 'Quad.easeOut'
    });
  }

  hit() {
    this.stopIdle();
    this.setPose('hit', 60);

    // v38A: light dust response — a few motes puff off the impact point,
    // reading as light debris rather than the hero's own heavier ground
    // impact effects.
    for (let i = 0; i < 6; i++) {
      const dust = this.scene.add.circle(
        this.container.x + Phaser.Math.Between(-20, 20),
        this.container.y - 6,
        Phaser.Math.FloatBetween(1.5, 3),
        0xcdbfa8,
        0.5
      ).setDepth(19);
      if (this.scene.worldAdd) this.scene.worldAdd(dust);
      this.scene.tweens.add({
        targets: dust,
        x: dust.x + Phaser.Math.Between(-30, 30),
        y: dust.y - Phaser.Math.Between(10, 26),
        alpha: 0,
        duration: Phaser.Math.Between(280, 420),
        ease: 'Quad.easeOut',
        onComplete: () => dust.destroy()
      });
    }

    // One compression-and-recoil beat, matching the standard v32
    // established for the Wraith — a bigger silhouette gets a bigger
    // shove and a slower settle, not more bounces.
    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX + 24,
      angle: 2.8,
      scaleX: 0.94,
      scaleY: 1.04,
      duration: 72,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.container,
          x: this.baseX,
          y: this.baseY,
          angle: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 190,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.container.setPosition(this.baseX, this.baseY).setAngle(0).setScale(1);
            this.setPose('idle', 120);
            this.startIdle();
          }
        });
      }
    });
  }

  attack() {
    this.stopIdle();
    this.setPose('attack', 90);

    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX - 68,
      y: this.baseY + 4,
      scaleX: 1.07,
      scaleY: 0.97,
      duration: 230,
      yoyo: true,
      hold: 38,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.container.setPosition(this.baseX, this.baseY).setScale(1);
        this.setPose('idle', 130);
        this.startIdle();
      }
    });
  }

  die() {
    this.stopIdle();
    this.setPose('shatter', 80);

    this.scene.tweens.add({
      targets: this.container,
      y: this.baseY + 34,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 0.50,
      angle: -7,
      duration: 880,
      ease: 'Quad.easeIn'
    });
  }

  reset() {
    this.stopIdle();
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAlpha(1).setAngle(0).setScale(1);
    this.sprite.setVisible(true).setAlpha(1).setTexture(HUSHLING_TEXTURES.idle);
    this.ghost.setAlpha(0);
    this.glow.setTexture(HUSHLING_TEXTURES.idle);
    this.pose = 'idle';
    this.layout();
    this.startIdle();
  }
}
