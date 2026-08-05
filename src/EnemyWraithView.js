export const WRAITH_TEXTURES = Object.freeze({
  idle: 'VeilWraith_Idle_LOCKED',
  attack: 'VeilWraith_Attack_LOCKED',
  hit: 'VeilWraith_Hit_LOCKED',
  shatter: 'VeilWraith_Shatter_LOCKED'
});

export default class EnemyWraithView {
  constructor(scene) {
    this.scene = scene;
    this.pose = 'idle';
    this._transitioning = false;
  }

  create() {
    this.container = this.scene.add.container(0, 0).setDepth(18);

    this.sprite = this.scene.add.image(0, 0, WRAITH_TEXTURES.idle).setOrigin(0.5, 1);
    this.ghost = this.scene.add.image(0, 0, WRAITH_TEXTURES.idle)
      .setOrigin(0.5, 1)
      .setAlpha(0);

    this.container.add([this.ghost, this.sprite]);
    if (this.scene.worldAdd) this.scene.worldAdd(this.container);

    this.scene.tweens.add({
      targets: this.container,
      y: '-=8',
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.layout();
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
      // Landscape phones are ~390px tall with a top HUD row and a
      // bottom console/narration dock eating most of that height, so
      // the Wraith is sized off the short dimension, not the v1 formula
      // tuned for a tall portrait canvas — that one put its top edge
      // above y=0.
      this.baseX = Math.round(width * 0.72);
      this.baseY = Math.round(height * 0.86);
      const targetHeight = Math.min(190, height * 0.50);
      this.sprite.setDisplaySize(targetHeight, targetHeight);
      this.ghost.setDisplaySize(targetHeight, targetHeight);
    } else {
      // Background: further right and higher up the ground plane, which
      // reads as distance, and smaller to match.
      this.baseX = Math.round(width * (compact ? 0.78 : 0.79));
      this.baseY = Math.round(height - (compact ? 330 : 300));
      const targetHeight = compact ? Math.min(215, height * 0.28) : Math.min(280, height * 0.38);
      this.sprite.setDisplaySize(targetHeight, targetHeight);
      this.ghost.setDisplaySize(targetHeight, targetHeight);
    }
    this.container.setPosition(this.baseX, this.baseY);
  }

  setPose(name, duration = 110) {
    const texture = WRAITH_TEXTURES[name] || WRAITH_TEXTURES.idle;
    if (this.pose === name || this._transitioning) {
      this.sprite.setTexture(texture);
      this.pose = name;
      return;
    }

    this._transitioning = true;
    this.ghost.setTexture(this.sprite.texture.key).setAlpha(0.62);
    this.sprite.setTexture(texture).setAlpha(0);

    this.scene.tweens.add({
      targets: this.ghost,
      alpha: 0,
      duration,
      ease: 'Sine.easeOut'
    });

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      duration,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.pose = name;
        this._transitioning = false;
      }
    });
  }

  // Mirrors the hero: enters from the far left travelling right.
  introSlide(duration = 520) {
    this.layout();
    const from = this.baseX - this.scene.scale.width * 0.75;
    this.container.setX(from).setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX,
      duration,
      ease: 'Quad.easeOut'
    });
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: duration * 0.4,
      ease: 'Quad.easeOut'
    });
  }

  hit() {
    this.setPose('hit', 58);

    // One readable compression-and-recoil beat replaces the old four-cycle
    // vibration. The silhouette now absorbs the hit, snaps away, and settles.
    const landscape = this.scene.scale.width > this.scene.scale.height;
    const shove = landscape ? 18 : 15;
    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX + shove,
      angle: 2.2,
      scaleX: 0.94,
      scaleY: 1.055,
      duration: 62,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.container,
          x: this.baseX,
          angle: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 155,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.container.setPosition(this.baseX, this.container.y).setAngle(0).setScale(1);
            if (this.sprite.visible) this.setPose('idle', 95);
          }
        });
      }
    });
  }

  attack() {
    this.setPose('attack', 100);

    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX - 46,
      scaleX: this.container.scaleX * 1.03,
      duration: 180,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.container.setX(this.baseX);
        this.setPose('idle', 120);
      }
    });
  }

  die() {
    this.setPose('shatter', 90);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: this.container.scaleX * 1.18,
      scaleY: this.container.scaleY * 0.72,
      angle: 10,
      duration: 720,
      ease: 'Quad.easeIn'
    });
  }

  reset() {
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAlpha(1).setAngle(0).setScale(1);
    this.sprite.setVisible(true).setAlpha(1);
    this.ghost.setAlpha(0);
    this.pose = 'idle';
    this.sprite.setTexture(WRAITH_TEXTURES.idle);
    this.layout();

    this.scene.tweens.add({
      targets: this.container,
      y: '-=8',
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}
