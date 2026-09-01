// LIVE25 Wraith runtime stabilizer.
// Preserves approved art/poses while preventing stale transition alpha/transform state.
import EnemyWraithView from '../EnemyWraithView.js?v=40';

export default class Live25EnemyWraithView extends EnemyWraithView {
  constructor(scene) {
    super(scene);
    this._live25Dead = false;
  }

  _restoreLiveBody() {
    if (this._live25Dead || !this.container) return;
    this.container.setVisible(true).setAlpha(1).setAngle(0).setScale(1);
    if (Number.isFinite(this.baseX)) this.container.x = this.baseX;
    if (Number.isFinite(this.baseY)) this.container.y = this.baseY;
    this.sprite?.setVisible(true).setAlpha(1);
    this.ghost?.setAlpha(0);
    if (this.aura && this.aura.alpha <= 0) this.aura.setAlpha(0.16);
  }

  layout() {
    super.layout();
    if (!this._live25Dead) this._restoreLiveBody();
  }

  startIdle() {
    if (!this.container || this._live25Dead) return;
    this.stopIdle();
    this._restoreLiveBody();
    this._idleTweens = [
      this.scene.tweens.add({
        targets: this.container,
        y: this.baseY - 5,
        angle: 0.38,
        duration: 1750,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      }),
      this.scene.tweens.add({
        targets: this.aura,
        alpha: { from: 0.12, to: 0.23 },
        duration: 980,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      }),
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 1, to: 0.90 },
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    ];
  }

  setPose(name, duration = 110) {
    if (this._transitioning) {
      this.scene.tweens.killTweensOf([this.sprite, this.ghost]);
      this._transitioning = false;
      this.ghost?.setAlpha(0);
      this.sprite?.setVisible(true).setAlpha(1);
    }
    return super.setPose(name, duration);
  }

  hit() {
    this._restoreLiveBody();
    return super.hit();
  }

  attack() {
    this._restoreLiveBody();
    return super.attack();
  }

  introSlide(duration = 520) {
    this._live25Dead = false;
    this.layout();
    return super.introSlide(duration);
  }

  die() {
    this._live25Dead = true;
    return super.die();
  }

  reset() {
    this._live25Dead = false;
    super.reset();
    this._restoreLiveBody();
  }
}
