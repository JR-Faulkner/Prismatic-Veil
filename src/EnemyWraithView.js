// v34 — full-fidelity Wraith art, matching the approved concept design.
// The Wraith reads as a floating, drifting silhouette that fractures and
// unravels rather than a grounded fighter — a low-alpha ADD-blended aura
// layer breathes behind the sprite, and idle motion is a slow drifting
// sway rather than a plain vertical bob.
export const WRAITH_TEXTURES = Object.freeze({
  idle: 'VeilWraith_v34_Idle',
  attack: 'VeilWraith_v34_Attack',
  hit: 'VeilWraith_v34_Hit',
  shatter: 'VeilWraith_v34_Shatter'
});

export default class EnemyWraithView {
  constructor(scene) {
    this.scene = scene;
    this.pose = 'idle';
    this._transitioning = false;
    this._idleTweens = [];
  }

  create() {
    this.container = this.scene.add.container(0, 0).setDepth(18);

    // Aura sits behind everything: a low-alpha, additively-blended copy
    // of the current pose that gives the silhouette a soft glow without
    // needing a second art pass.
    this.aura = this.scene.add.image(0, 0, WRAITH_TEXTURES.idle)
      .setOrigin(0.5, 1).setAlpha(0.16).setBlendMode('ADD');
    // Ghost holds the outgoing pose at full opacity during a crossfade —
    // see setPose(). Fading both layers at once (rather than parking the
    // outgoing frame solid underneath) is the trap already hit once on
    // the hero's own pose view: a hit stop freezing the tween mid-blend
    // leaves the background showing straight through the character.
    this.ghost = this.scene.add.image(0, 0, WRAITH_TEXTURES.idle)
      .setOrigin(0.5, 1).setAlpha(0);
    this.sprite = this.scene.add.image(0, 0, WRAITH_TEXTURES.idle).setOrigin(0.5, 1);

    this.container.add([this.aura, this.ghost, this.sprite]);
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
    const largeLandscape = landscape && width >= 1100 && height >= 600;

    if (landscape) {
      this.baseX = Math.round(width * (largeLandscape ? 0.76 : 0.74));
      this.baseY = Math.round(height * 0.88);
    } else {
      this.baseX = Math.round(width * (compact ? 0.78 : 0.79));
      this.baseY = Math.round(height - (compact ? 310 : 286));
    }
    const targetHeight = landscape
      ? (largeLandscape ? Math.min(285, height * 0.66) : Math.min(250, height * 0.62))
      : Math.min(compact ? 250 : 310, height * (compact ? 0.31 : 0.39));

    // The v34 art is tall and narrow, not square like the old locked
    // sprites — forcing a square display box would squash it. Derive
    // the width from the source image's own aspect ratio instead.
    const ratio = this.sprite.width / this.sprite.height;
    const targetWidth = targetHeight * ratio;
    this.sprite.setDisplaySize(targetWidth, targetHeight);
    this.ghost.setDisplaySize(targetWidth, targetHeight);
    this.aura.setDisplaySize(targetWidth * 1.04, targetHeight * 1.04);

    this.container.setPosition(this.baseX, this.baseY);
  }

  startIdle() {
    this.stopIdle();
    this._idleTweens = [
      this.scene.tweens.add({
        targets: this.container,
        y: this.baseY - 9,
        angle: 0.65,
        duration: 1650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      }),
      this.scene.tweens.add({
        targets: this.aura,
        alpha: { from: 0.10, to: 0.25 },
        duration: 920,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      }),
      // v38A: spectral idle — the sprite itself flickers faintly toward
      // translucent, distinct from the aura's own pulse, reading as a
      // non-corporeal shimmer on the body rather than just its glow.
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 1, to: 0.86 },
        duration: 2400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    ];
  }

  stopIdle() {
    this._idleTweens.forEach(t => t && t.stop());
    this._idleTweens = [];
    this.scene.tweens.killTweensOf([this.container, this.aura, this.sprite]);
  }

  setPose(name, duration = 110) {
    const texture = WRAITH_TEXTURES[name] || WRAITH_TEXTURES.idle;
    this.aura.setTexture(texture);

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

  // Mirrors the hero: enters from the far left travelling right.
  introSlide(duration = 520) {
    this.layout();
    this.container.setX(this.baseX - this.scene.scale.width * 0.72).setAlpha(0);
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
    this.setPose('hit', 58);

    // One compression-and-recoil beat, not repeated vibration.
    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX + 18,
      angle: 3.2,
      scaleX: 0.93,
      scaleY: 1.06,
      duration: 62,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.container,
          x: this.baseX,
          y: this.baseY,
          angle: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 160,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.container.setPosition(this.baseX, this.baseY).setAngle(0).setScale(1);
            this.setPose('idle', 95);
            this.startIdle();
          }
        });
      }
    });
  }

  attack() {
    this.stopIdle();
    this.setPose('attack', 100);

    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX - 52,
      y: this.baseY - 4,
      scaleX: 1.045,
      duration: 175,
      yoyo: true,
      hold: 24,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.container.setPosition(this.baseX, this.baseY).setScale(1);
        this.setPose('idle', 120);
        this.startIdle();
      }
    });
  }

  die() {
    this.stopIdle();
    this.setPose('shatter', 90);

    // v38A: fragmented dissolve — small shard fragments scatter outward
    // as the silhouette breaks apart, layered on top of the existing
    // shrink/fade/skew tween rather than replacing it.
    const cx = this.container.x;
    const cy = this.container.y - this.sprite.displayHeight * 0.5;
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 60;
      const frag = this.scene.add.rectangle(
        cx, cy, Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 7), 0xb586ff, 0.75
      ).setDepth(19).setAngle(Phaser.Math.Between(0, 180));
      if (this.scene.worldAdd) this.scene.worldAdd(frag);
      this.scene.tweens.add({
        targets: frag,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist - 20,
        angle: frag.angle + Phaser.Math.Between(90, 260),
        alpha: 0,
        duration: Phaser.Math.Between(520, 780),
        ease: 'Quad.easeOut',
        onComplete: () => frag.destroy()
      });
    }

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      y: this.baseY - 24,
      scaleX: this.container.scaleX * 1.22,
      scaleY: this.container.scaleY * 0.72,
      angle: 11,
      duration: 760,
      ease: 'Quad.easeIn'
    });
  }

  reset() {
    this.stopIdle();
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAlpha(1).setAngle(0).setScale(1);
    this.sprite.setVisible(true).setAlpha(1).setTexture(WRAITH_TEXTURES.idle);
    this.ghost.setAlpha(0);
    this.aura.setTexture(WRAITH_TEXTURES.idle);
    this.pose = 'idle';
    this.layout();
    this.startIdle();
  }
}
