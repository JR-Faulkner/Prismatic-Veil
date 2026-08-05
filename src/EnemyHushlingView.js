// The Prismatic Veil — v33 Hushling battle view.
//
// Hushlings are wider and heavier than Veil Wraiths. The animation
// language emphasizes mass: slow weight shift, short lunge, hard recoil,
// and a downward collapse.

export const HUSHLING_TEXTURES = Object.freeze({
  idle: 'Hushling_Idle_LOCKED',
  attack: 'Hushling_Attack_LOCKED',
  hit: 'Hushling_Hit_LOCKED',
  shatter: 'Hushling_Shatter_LOCKED'
});

export default class EnemyHushlingView {
  constructor(scene) {
    this.scene = scene;
    this.pose = 'idle';
    this._transitioning = false;
    this._idleTween = null;
  }

  create() {
    this.container = this.scene.add.container(0, 0).setDepth(18);
    this.sprite = this.scene.add.image(0, 0, HUSHLING_TEXTURES.idle).setOrigin(0.5, 1);
    this.ghost = this.scene.add.image(0, 0, HUSHLING_TEXTURES.idle)
      .setOrigin(0.5, 1)
      .setAlpha(0);

    this.container.add([this.ghost, this.sprite]);
    if (this.scene.worldAdd) this.scene.worldAdd(this.container);

    this.layout();
    this.startIdleWeight();

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
      this.baseY = Math.round(height * 0.91);
      const targetH = Math.min(226, height * 0.58);
      this.sprite.setDisplaySize(targetH, targetH);
      this.ghost.setDisplaySize(targetH, targetH);
    } else {
      this.baseX = Math.round(width * (compact ? 0.76 : 0.78));
      this.baseY = Math.round(height - (compact ? 292 : 270));
      const targetH = compact
        ? Math.min(250, height * 0.33)
        : Math.min(320, height * 0.42);
      this.sprite.setDisplaySize(targetH, targetH);
      this.ghost.setDisplaySize(targetH, targetH);
    }

    this.container.setPosition(this.baseX, this.baseY);
  }

  startIdleWeight() {
    if (this._idleTween) this._idleTween.stop();
    this._idleTween = this.scene.tweens.add({
      targets: this.container,
      y: this.baseY - 3,
      scaleX: 1.018,
      scaleY: 0.992,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  setPose(name, duration = 110) {
    const texture = HUSHLING_TEXTURES[name] || HUSHLING_TEXTURES.idle;
    if (this.pose === name || this._transitioning) {
      this.sprite.setTexture(texture);
      this.pose = name;
      return;
    }

    this._transitioning = true;
    this.ghost.setTexture(this.sprite.texture.key).setAlpha(0.66);
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

  introSlide(duration = 520) {
    this.layout();
    const from = this.baseX - this.scene.scale.width * 0.65;
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
      duration: duration * 0.46,
      ease: 'Quad.easeOut'
    });
  }

  hit() {
    this.setPose('hit', 60);
    this.scene.tweens.killTweensOf(this.container);

    // One compression-and-recoil beat, matching the standard v32
    // established for the Wraith — a bigger silhouette gets a bigger
    // shove and a slower settle, not more bounces.
    const landscape = this.scene.scale.width > this.scene.scale.height;
    const shove = landscape ? 24 : 20;
    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX + shove,
      angle: 2.6,
      scaleX: 0.95,
      scaleY: 1.045,
      duration: 68,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.container,
          x: this.baseX,
          angle: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 170,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.container.setPosition(this.baseX, this.container.y).setAngle(0).setScale(1);
            this.setPose('idle', 120);
            this.startIdleWeight();
          }
        });
      }
    });
  }

  attack() {
    this.setPose('attack', 90);
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX - 62,
      scaleX: 1.06,
      scaleY: 0.98,
      duration: 210,
      yoyo: true,
      hold: 34,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.container.setX(this.baseX).setScale(1);
        this.setPose('idle', 130);
        this.startIdleWeight();
      }
    });
  }

  die() {
    this.setPose('shatter', 80);
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      y: this.baseY + 28,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 0.54,
      angle: -6,
      duration: 820,
      ease: 'Quad.easeIn'
    });
  }

  reset() {
    this.scene.tweens.killTweensOf(this.container);
    this.container.setAlpha(1).setAngle(0).setScale(1);
    this.sprite.setVisible(true).setAlpha(1).setTexture(HUSHLING_TEXTURES.idle);
    this.ghost.setAlpha(0);
    this.pose = 'idle';
    this.layout();
    this.startIdleWeight();
  }
}
