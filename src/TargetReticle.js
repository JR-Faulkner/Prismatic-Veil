// Battle Presentation Alpha v1.0 — Veil targeting.
//
// Replaces the drawn crosshair with the kit's interaction reticle set,
// run as three separate states rather than one baked animation:
//
//   seeking   — drifts in wide and loose, hunting
//   locked    — snaps to the target, holds
//   confirmed — flares as the attack releases, then shatters
//
// The reticle is a battlefield visual, so it registers through
// scene.worldAdd() and zooms with the main camera. The kit's design note
// asks that it "frame the target without covering it", so it sits behind
// the FX depth band and scales off the enemy's own footprint.

const STATE_TEX = {
  seeking: 'kit_reticle_seeking',
  locked: 'kit_reticle_locked',
  confirmed: 'kit_reticle_confirmed'
};

export default class TargetReticle {
  constructor(scene) {
    this.scene = scene;
    this.image = null;
    this.state = null;
  }

  _targetPoint() {
    const enemy = this.scene.enemyView;
    if (!enemy || !enemy.sprite) {
      return { x: this.scene.scale.width * 0.75, y: this.scene.scale.height * 0.6, r: 90 };
    }
    // The Wraith's sprite is bottom-anchored inside its container, so the
    // body centre is half a sprite up from the container origin.
    const c = enemy.container;
    const s = enemy.sprite;
    const h = s.displayHeight * Math.abs(c.scaleY || 1);
    // Radius is set off the sprite so the rings clear the silhouette —
    // the kit asks that the reticle frame the target, not cover it.
    // ...and capped so a wide reticle never runs off a 390px screen.
    const room = this.scene.scale.width * 0.5 - 10;
    return {
      x: c.x,
      y: c.y - h * 0.5,
      r: Math.max(64, Math.min(h * 0.58, room / 0.86))
    };
  }

  _ensure() {
    if (this.image && this.image.scene) return this.image;
    // Behind the Wraith (its container sits at depth 18). In front, the
    // reticle's centre gem lands squarely on the Wraith's chest.
    this.image = this.scene.add.image(0, 0, STATE_TEX.seeking).setDepth(16);
    this.scene.worldAdd(this.image);
    return this.image;
  }

  _accent() {
    const hero = this.scene.battleConfig && this.scene.battleConfig.hero;
    return (hero && hero.accent) || 0xffd56a;
  }

  // step 4a — reticle seeks
  seek() {
    const p = this._targetPoint();
    const img = this._ensure();
    this.state = 'seeking';

    this.scene.tweens.killTweensOf(img);
    img.setTexture(STATE_TEX.seeking)
      .setTint(this._accent())
      .setDisplaySize(p.r * 2.4, p.r * 2.4)
      .setPosition(p.x + p.r * 0.5, p.y - p.r * 0.3)
      .setAlpha(0)
      .setAngle(-22);

    this.scene.tweens.add({
      targets: img,
      alpha: 0.8,
      x: p.x,
      y: p.y,
      angle: 0,
      displayWidth: p.r * 1.9,
      displayHeight: p.r * 1.9,
      duration: 340,
      ease: 'Quad.easeOut'
    });
    // a slow drift while it hunts, killed the moment it locks
    this._drift = this.scene.tweens.add({
      targets: img,
      angle: 360,
      duration: 11000,
      delay: 340,
      repeat: -1,
      ease: 'Linear'
    });
    if (this.scene.uiAudio) this.scene.uiAudio.hover();
  }

  // step 4b — lock
  lock(onDone) {
    const p = this._targetPoint();
    const img = this._ensure();
    this.state = 'locked';

    this.scene.tweens.killTweensOf(img);
    if (this._drift) { this._drift.stop(); this._drift = null; }
    img.setTexture(STATE_TEX.locked).setAngle(0)
      .setDisplaySize(p.r * 2.6, p.r * 2.6)
      .setPosition(p.x, p.y)
      .setAlpha(0.75);

    this.scene.tweens.add({
      targets: img,
      displayWidth: p.r * 1.72,
      displayHeight: p.r * 1.72,
      alpha: 0.85,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        this._pulse = this.scene.tweens.add({
          targets: img,
          alpha: 0.55,
          duration: 760,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        if (onDone) onDone();
      }
    });
    if (this.scene.uiAudio) this.scene.uiAudio.cursor();
  }

  // step 5 — the attack releases through the lock
  confirm() {
    if (!this.image || !this.image.scene) return;
    const img = this.image;
    const p = this._targetPoint();
    this.state = 'confirmed';

    this.scene.tweens.killTweensOf(img);
    if (this._pulse) { this._pulse.stop(); this._pulse = null; }
    img.setTexture(STATE_TEX.confirmed).setAlpha(0.95)
      .setDisplaySize(p.r * 1.72, p.r * 1.72);
    this.scene.tweens.add({
      targets: img,
      displayWidth: p.r * 2.05,
      displayHeight: p.r * 2.05,
      duration: 140,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  // The reticle breaks apart on impact rather than blinking out.
  shatter() {
    if (!this.image || !this.image.scene) return;
    const img = this.image;
    this.image = null;
    this.state = null;
    this.scene.tweens.killTweensOf(img);
    if (this._pulse) { this._pulse.stop(); this._pulse = null; }
    if (this._drift) { this._drift.stop(); this._drift = null; }

    const accent = this._accent();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const shard = this.scene.add.rectangle(img.x, img.y, 26, 2, accent, 0.9)
        .setDepth(39).setAngle(Phaser.Math.RadToDeg(a));
      this.scene.worldAdd(shard);
      this.scene.tweens.add({
        targets: shard,
        x: img.x + Math.cos(a) * 78,
        y: img.y + Math.sin(a) * 78,
        alpha: 0,
        duration: 380,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }
    this.scene.tweens.add({
      targets: img,
      displayWidth: img.displayWidth * 1.5,
      displayHeight: img.displayHeight * 1.5,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => img.destroy()
    });
  }

  hide() {
    if (!this.image || !this.image.scene) return;
    this.scene.tweens.killTweensOf(this.image);
    if (this._pulse) { this._pulse.stop(); this._pulse = null; }
    if (this._drift) { this._drift.stop(); this._drift = null; }
    this.image.destroy();
    this.image = null;
    this.state = null;
  }
}
