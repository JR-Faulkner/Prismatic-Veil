// The Prismatic Veil — v32 Battle Feel Director.
//
// Centralizes impact timing so attack weight is consistent across heroes.
// This module does not change battle rules, damage, turn order, or assets.
// It only coordinates hit stop, camera impulse, lighting, and tiny settle beats.

export const BATTLE_FEEL = Object.freeze({
  lockImpulseMs: 46,
  releaseImpulseMs: 54,
  normalHitStopMs: 58,
  criticalHitStopMs: 92,
  normalShakeMs: 92,
  criticalShakeMs: 138,
  normalShakeIntensity: 0.0022,
  criticalShakeIntensity: 0.0044,
  settleMs: 180
});

export default class BattleFeel {
  constructor(scene) {
    this.scene = scene;
    this._lastImpactAt = -Infinity;
    this._criticalEscalatedAt = -Infinity;
  }

  commandConfirmed() {
    const cam = this.scene.cameras && this.scene.cameras.main;
    if (cam) cam.shake(BATTLE_FEEL.lockImpulseMs, 0.0007);
  }

  lock() {
    const cam = this.scene.cameras && this.scene.cameras.main;
    if (cam) cam.shake(BATTLE_FEEL.lockImpulseMs, 0.0009);
  }

  release() {
    const cam = this.scene.cameras && this.scene.cameras.main;
    if (cam) cam.shake(BATTLE_FEEL.releaseImpulseMs, 0.0011);
  }

  impact({ critical = false } = {}) {
    const now = performance.now();
    const cam = this.scene.cameras && this.scene.cameras.main;

    // Critical() can follow the normal impact callback within the same beat.
    // Escalate that beat instead of creating a second full stop and a muddy
    // double-shake.
    const sameBeat = now - this._lastImpactAt < 150;
    if (critical && sameBeat) {
      // Extend the current freeze to the critical deadline instead of
      // starting a separate freeze after it. VeilBattleScene.hitStop()
      // supports deadline extension in v32.
      if (typeof this.scene.hitStop === 'function') {
        this.scene.hitStop(BATTLE_FEEL.criticalHitStopMs);
      }
      if (now - this._criticalEscalatedAt > 150 && cam) {
        cam.shake(92, 0.0031);
        this._criticalEscalatedAt = now;
      }
      return;
    }

    this._lastImpactAt = now;
    if (typeof this.scene.hitStop === 'function') {
      this.scene.hitStop(critical
        ? BATTLE_FEEL.criticalHitStopMs
        : BATTLE_FEEL.normalHitStopMs);
    }
    if (cam) {
      cam.shake(
        critical ? BATTLE_FEEL.criticalShakeMs : BATTLE_FEEL.normalShakeMs,
        critical ? BATTLE_FEEL.criticalShakeIntensity : BATTLE_FEEL.normalShakeIntensity
      );
    }
    if (typeof this.scene.abilityLight === 'function') {
      this.scene.abilityLight('impact');
    }
  }

  recover() {
    // A tiny vertical settle keeps the return to idle from feeling like a
    // hard cut without moving the camera or UI. The recover pose motion
    // only ever animates x, so sprite.y is already sitting at baseY by
    // the time this fires — animating y toward baseY from baseY would be
    // a no-op. Seed a small offset first so there's an actual landing
    // bob to ease out of.
    const poses = this.scene.heroPoses;
    const sprite = poses && poses.sprite;
    if (!sprite || !Number.isFinite(poses.baseY)) return;
    this.scene.tweens.killTweensOf(sprite);
    sprite.y = poses.baseY + 4;
    this.scene.tweens.add({
      targets: sprite,
      y: poses.baseY,
      duration: BATTLE_FEEL.settleMs,
      ease: 'Sine.easeOut'
    });
  }
}
