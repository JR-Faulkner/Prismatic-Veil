// 05K — PV Hybrid Stack integration + attack-start continuity.
//
// First active-turn presenter to consume renderer-neutral PV data through a
// PV Forge-generated adapter. Phaser still owns the battle presentation, but
// Prismel's authored registration/timing values no longer live in this class.

import ActiveTurnBattleSlice05I from './ActiveTurnBattleSlice05I.js?v=1';
import {
  PRISMEL_READY_FRAMES,
  PRISMEL_ATTACK_FRAMES
} from './ActiveTurnBattleSlice.js?v=3';
import {
  PRISMEL_FRAME_REGISTRATION,
  PRISMEL_ATTACK_TRANSITION
} from '../generated/prismelActiveTurnRegistration.js?v=1';

export default class ActiveTurnBattleSlice05K extends ActiveTurnBattleSlice05I {
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
    const finalScale = Phaser.Math.Clamp(
      measuredScale * tune.scale,
      referenceScale * 0.84,
      referenceScale * 1.18
    );

    img
      .setOrigin(meta.anchorX / meta.sw, meta.anchorY / meta.sh)
      .setScale(finalScale)
      .setPosition(tune.x, tune.y);
  }

  // 05G supplies the frame groups. PV data supplies their cadence so timing is
  // now tuneable without rewriting the presenter.
  _cycleFrames(frameKeys, frameMs) {
    let tunedMs = frameMs;
    if (frameKeys && frameKeys[0] === PRISMEL_ATTACK_FRAMES[0]) {
      tunedMs = PRISMEL_ATTACK_TRANSITION.attackStartFrameMs;
    } else if (frameKeys && frameKeys[0] === PRISMEL_ATTACK_FRAMES[4]) {
      tunedMs = PRISMEL_ATTACK_TRANSITION.attackReleaseFrameMs;
    }
    return super._cycleFrames(frameKeys, tunedMs);
  }

  async _playAttackPresentation() {
    const s = this.scene;
    const img = this._ensureCutin();
    const finalReady = PRISMEL_READY_FRAMES[PRISMEL_READY_FRAMES.length - 1];

    // Establish one known handoff pose before attack_1. The hero itself never
    // scales during this anticipation beat; only prismatic energy tightens.
    if (img.texture.key !== finalReady) img.setTexture(finalReady);
    img.setAlpha(1);
    this._layoutCutin();

    const ambient = this._ensureAmbientShards();
    if (ambient && ambient.active) {
      s.tweens.add({
        targets: ambient,
        scale: 1.12,
        alpha: 0.94,
        duration: PRISMEL_ATTACK_TRANSITION.readyToAttackHoldMs,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
    if (this._heroGlow && this._heroGlow.active) {
      s.tweens.add({
        targets: this._heroGlow,
        alpha: 0.18,
        duration: PRISMEL_ATTACK_TRANSITION.readyToAttackHoldMs,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    await this._delay(PRISMEL_ATTACK_TRANSITION.readyToAttackHoldMs);
    await super._playAttackPresentation();
  }
}
