// 05L — PriZim active-turn refinement.
// Matched-pair attack registration, authored staff cadence/cue points, and
// second-pass PV presentation polish. Combat rules/state stay unchanged.

import ActiveTurnBattleSlice05I from './ActiveTurnBattleSlice05I.js?v=1';
import {
  PRISMEL_READY_FRAMES,
  PRISMEL_ATTACK_FRAMES
} from './ActiveTurnBattleSlice.js?v=3';
import {
  PRISMEL_FRAME_REGISTRATION,
  PRISMEL_MATERIALIZATION,
  PRISMEL_ATTACK_TRANSITION
} from '../generated/prismelActiveTurnRegistration.js?v=2';

const OPENING_ATTACK = new Set(PRISMEL_ATTACK_FRAMES.slice(0, 3));

export default class ActiveTurnBattleSlice05L extends ActiveTurnBattleSlice05I {
  _heroLayerLayout(img) {
    if (!img) return;

    const c = this._layoutMetrics().cutin;
    const env = this._frameEnvelope();
    const meta = this._visualMetrics(img.texture.key);
    const profile = this._registrationProfile();
    const tune = PRISMEL_FRAME_REGISTRATION[img.texture.key] || { scale: 1, x: 0, y: 0 };

    const referenceScale = Math.min(c.maxW / env.maxW, c.maxH / env.maxH);
    const targetBodyPx = profile.medianBodyHeight * referenceScale;
    const measuredScale = targetBodyPx / Math.max(1, meta.bodyHeight);

    // 05L treats ready_6 -> attack_1..3 as one authored handoff. The extra
    // neutral-data multiplier compensates for the opening poses reading
    // perceptually narrower/smaller even when alpha body-height is identical.
    const handoffGuard = OPENING_ATTACK.has(img.texture.key) ? 1.006 : 1;
    const finalScale = Phaser.Math.Clamp(
      measuredScale * tune.scale * handoffGuard,
      referenceScale * 0.84,
      referenceScale * 1.20
    );

    img
      .setOrigin(meta.anchorX / meta.sw, meta.anchorY / meta.sh)
      .setScale(finalScale)
      .setPosition(tune.x, tune.y);
  }

  _emitMaterializationCue(frameNumber) {
    const cueFrames = PRISMEL_MATERIALIZATION.cueFrames;
    const cue = Object.keys(cueFrames).find(name => cueFrames[name] === frameNumber);
    if (!cue) return;

    // No audio is required yet. Future sound can subscribe to the same neutral
    // cue without changing animation timing or Phaser presentation code.
    if (this.scene && this.scene.events) {
      this.scene.events.emit('pv:prismel-materialization-cue', {
        cue,
        frame: frameNumber,
        character: 'prismel'
      });
    }

    // A tiny visual acknowledgement makes the authored beats readable now.
    const img = this._ensureCutin();
    if (!img || !img.active) return;
    if (cue === 'staffLock') {
      this.scene.tweens.add({
        targets: img,
        alpha: 0.94,
        duration: 65,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  async _introCutin() {
    const img = this._ensureCutin();
    img.setTexture(PRISMEL_READY_FRAMES[0]);
    this._layoutCutin();

    this.scene.tweens.add({
      targets: img,
      alpha: 1,
      duration: 240,
      ease: 'Sine.easeOut'
    });

    const holds = PRISMEL_MATERIALIZATION.frameHoldMs;
    for (let i = 0; i < PRISMEL_READY_FRAMES.length; i++) {
      const frameNumber = i + 1;
      img.setTexture(PRISMEL_READY_FRAMES[i]);
      this._layoutCutin();
      this._emitMaterializationCue(frameNumber);
      await this._delay(holds[i] || 180);
    }

    img.setTexture(PRISMEL_READY_FRAMES[PRISMEL_READY_FRAMES.length - 1]);
    this._layoutCutin();
  }

  async _cycleFrames(frameKeys, frameMs) {
    let tunedMs = frameMs;
    if (frameKeys && frameKeys[0] === PRISMEL_ATTACK_FRAMES[0]) {
      tunedMs = PRISMEL_ATTACK_TRANSITION.attackStartFrameMs;
    } else if (frameKeys && frameKeys[0] === PRISMEL_ATTACK_FRAMES[4]) {
      tunedMs = PRISMEL_ATTACK_TRANSITION.attackReleaseFrameMs;
    }
    return super._cycleFrames(frameKeys, tunedMs);
  }

  async _playAttackPresentation(hero, target) {
    const s = this.scene;
    const img = this._ensureCutin();
    const finalReady = PRISMEL_READY_FRAMES[PRISMEL_READY_FRAMES.length - 1];

    if (img.texture.key !== finalReady) img.setTexture(finalReady);
    img.setAlpha(1);
    this._layoutCutin();

    const ambient = this._ensureAmbientShards();
    if (ambient && ambient.active) {
      s.tweens.add({
        targets: ambient,
        scale: 1.14,
        alpha: 0.96,
        duration: PRISMEL_ATTACK_TRANSITION.readyToAttackHoldMs,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
    if (this._heroGlow && this._heroGlow.active) {
      s.tweens.add({
        targets: this._heroGlow,
        alpha: 0.20,
        duration: PRISMEL_ATTACK_TRANSITION.readyToAttackHoldMs,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    await this._delay(PRISMEL_ATTACK_TRANSITION.readyToAttackHoldMs);

    // Bypass 05K's now-stale v1 generated-data wrapper and enter the validated
    // 05I/05H/05G presentation chain directly. 05L's _cycleFrames remains
    // polymorphic, so the new PriZim cadence still drives the inherited attack.
    await ActiveTurnBattleSlice05I.prototype._playAttackPresentation.call(this, hero, target);
  }
}
