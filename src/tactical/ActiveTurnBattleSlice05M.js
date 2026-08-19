// 05M — PriZim motion-registration pass.
// Uses the 2026-08-19 phone recording as motion authority.
// Combat/state behavior stays inherited. 05L remains intact for comparison.

import ActiveTurnBattleSlice05I from './ActiveTurnBattleSlice05I.js?v=1';
import {
  PRISMEL_READY_FRAMES,
  PRISMEL_ATTACK_FRAMES
} from './ActiveTurnBattleSlice.js?v=3';
import {
  PRISMEL_FRAME_REGISTRATION
} from '../generated/prismelActiveTurnRegistration.js?v=2';
import {
  PRISMEL_05M_FRAME_OVERRIDES,
  PRISMEL_05M_MATERIALIZATION,
  PRISMEL_05M_ATTACK_TRANSITION
} from '../generated/prismelActiveTurn05MTuning.js?v=1';

export default class ActiveTurnBattleSlice05M extends ActiveTurnBattleSlice05I {
  _heroLayerLayout(img) {
    if (!img) return;

    const c = this._layoutMetrics().cutin;
    const env = this._frameEnvelope();
    const meta = this._visualMetrics(img.texture.key);
    const profile = this._registrationProfile();
    const canonical = PRISMEL_FRAME_REGISTRATION[img.texture.key] || { scale: 1, x: 0, y: 0 };
    const tune = PRISMEL_05M_FRAME_OVERRIDES[img.texture.key] || canonical;

    const referenceScale = Math.min(c.maxW / env.maxW, c.maxH / env.maxH);
    const targetBodyPx = profile.medianBodyHeight * referenceScale;
    const measuredScale = targetBodyPx / Math.max(1, meta.bodyHeight);
    const finalScale = Phaser.Math.Clamp(
      measuredScale * tune.scale,
      referenceScale * 0.84,
      referenceScale * 1.20
    );

    img
      .setOrigin(meta.anchorX / meta.sw, meta.anchorY / meta.sh)
      .setScale(finalScale)
      .setPosition(tune.x, tune.y);
  }

  _emitMaterializationCue(frameNumber) {
    const cueFrames = PRISMEL_05M_MATERIALIZATION.cueFrames;
    const cue = Object.keys(cueFrames).find(name => cueFrames[name] === frameNumber);
    if (!cue) return;

    if (this.scene && this.scene.events) {
      this.scene.events.emit('pv:prismel-materialization-cue', {
        cue,
        frame: frameNumber,
        character: 'prismel',
        profile: '05m'
      });
    }

    const img = this._ensureCutin();
    if (!img || !img.active) return;

    if (cue === 'staffDraw' && this._heroGlow && this._heroGlow.active) {
      this.scene.tweens.add({
        targets: this._heroGlow,
        alpha: 0.16,
        duration: 120,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    if (cue === 'staffLock') {
      this.scene.tweens.add({
        targets: img,
        alpha: 0.94,
        duration: 70,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  async _introCutin() {
    const img = this._ensureCutin();
    const rig = this._heroRig;
    const ghost = this._cutinGhost;
    const shards = this._ensureAmbientShards();

    img.setTexture(PRISMEL_READY_FRAMES[0]).setAlpha(1);
    if (ghost && ghost.active) ghost.setAlpha(0);
    if (rig && rig.active) rig.setAlpha(0);
    if (shards && shards.active) shards.setAlpha(0);
    this._layoutCutin();

    if (rig && rig.active) {
      this.scene.tweens.add({
        targets: rig,
        alpha: 1,
        duration: 280,
        ease: 'Sine.easeOut'
      });
    }

    if (shards && shards.active) {
      this.scene.tweens.add({
        targets: shards,
        alpha: 1,
        duration: 420,
        delay: 170,
        ease: 'Sine.easeOut'
      });
    }

    const holds = PRISMEL_05M_MATERIALIZATION.frameHoldMs;
    for (let i = 0; i < PRISMEL_READY_FRAMES.length; i++) {
      const frameNumber = i + 1;
      img.setTexture(PRISMEL_READY_FRAMES[i]).setAlpha(1);
      this._layoutCutin();
      this._emitMaterializationCue(frameNumber);
      await this._delay(holds[i] || 180);
    }

    img.setTexture(PRISMEL_READY_FRAMES[PRISMEL_READY_FRAMES.length - 1]).setAlpha(1);
    if (rig && rig.active) rig.setAlpha(1);
    if (shards && shards.active) shards.setAlpha(1);
    this._layoutCutin();
  }

  async _cycleFrames(frameKeys, frameMs) {
    let tunedMs = frameMs;
    if (frameKeys && frameKeys[0] === PRISMEL_ATTACK_FRAMES[0]) {
      tunedMs = PRISMEL_05M_ATTACK_TRANSITION.attackStartFrameMs;
    } else if (frameKeys && frameKeys[0] === PRISMEL_ATTACK_FRAMES[4]) {
      tunedMs = PRISMEL_05M_ATTACK_TRANSITION.attackReleaseFrameMs;
    }
    return super._cycleFrames(frameKeys, tunedMs);
  }

  async _playAttackPresentation(hero, target) {
    const s = this.scene;
    const img = this._ensureCutin();
    const finalReady = PRISMEL_READY_FRAMES[PRISMEL_READY_FRAMES.length - 1];

    if (img.texture.key !== finalReady) img.setTexture(finalReady);
    img.setAlpha(1);
    if (this._heroRig && this._heroRig.active) this._heroRig.setAlpha(1);
    this._layoutCutin();

    const ambient = this._ensureAmbientShards();
    if (ambient && ambient.active) {
      s.tweens.add({
        targets: ambient,
        scale: 1.10,
        alpha: 0.96,
        duration: PRISMEL_05M_ATTACK_TRANSITION.readyToAttackHoldMs,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    if (this._heroGlow && this._heroGlow.active) {
      s.tweens.add({
        targets: this._heroGlow,
        alpha: 0.18,
        duration: PRISMEL_05M_ATTACK_TRANSITION.readyToAttackHoldMs,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    await this._delay(PRISMEL_05M_ATTACK_TRANSITION.readyToAttackHoldMs);
    await super._playAttackPresentation(hero, target);
  }
}
