// 05J — Mobile Shell refinement + hard Prismel frame registration.
//
// Inherits 05I's DOM HUD separation, 05G's Too Quiet presentation, and the
// validated stateful Prismel-vs-Hushling loop. This pass makes two targeted
// corrections from real iPhone screenshots:
// 1) replace alpha-only size correction with an explicit authored nudge table
//    for all 12 Prismel poses, keeping perceived body size/baseline steadier;
// 2) presentation markup/CSS in tactical-field-05j.html collapses the two
//    bottom cards into one compact command dock.

import ActiveTurnBattleSlice05I from './ActiveTurnBattleSlice05I.js?v=1';

// 05H's alpha-mass registration remains the base measurement. These tiny,
// explicit per-pose corrections are intentionally boring and deterministic:
// once a frame is tuned on-device, it no longer changes with viewport or DPR.
// Values are relative to the already-normalized 05H body-height result.
const PRISMEL_FRAME_REGISTRATION = Object.freeze({
  prismel_ready_1:  { scale: 1.000, x:  0, y:  0 },
  prismel_ready_2:  { scale: 0.997, x: -1, y:  0 },
  prismel_ready_3:  { scale: 0.994, x: -1, y:  0 },
  prismel_ready_4:  { scale: 0.996, x:  0, y:  0 },
  prismel_ready_5:  { scale: 0.998, x:  0, y:  0 },
  prismel_ready_6:  { scale: 1.000, x:  0, y:  0 },
  prismel_attack_1: { scale: 0.995, x:  0, y:  0 },
  prismel_attack_2: { scale: 0.985, x:  1, y:  0 },
  prismel_attack_3: { scale: 0.975, x:  2, y:  1 },
  prismel_attack_4: { scale: 0.970, x:  2, y:  1 },
  prismel_attack_5: { scale: 0.982, x:  1, y:  0 },
  prismel_attack_6: { scale: 0.992, x:  0, y:  0 }
});

export default class ActiveTurnBattleSlice05J extends ActiveTurnBattleSlice05I {
  _heroLayerLayout(img) {
    if (!img) return;

    const c = this._layoutMetrics().cutin;
    const env = this._frameEnvelope();
    const meta = this._visualMetrics(img.texture.key);
    const profile = this._registrationProfile();
    const tune = PRISMEL_FRAME_REGISTRATION[img.texture.key] || { scale: 1, x: 0, y: 0 };

    // First hold the measured visible body to one screen-space height, then
    // apply the authored sub-3% pose correction above. Do not animate scale.
    const referenceScale = Math.min(c.maxW / env.maxW, c.maxH / env.maxH);
    const targetBodyPx = profile.medianBodyHeight * referenceScale;
    const measuredScale = targetBodyPx / Math.max(1, meta.bodyHeight);
    const finalScale = Phaser.Math.Clamp(
      measuredScale * tune.scale,
      referenceScale * 0.84,
      referenceScale * 1.16
    );

    img
      .setOrigin(meta.anchorX / meta.sw, meta.anchorY / meta.sh)
      .setScale(finalScale)
      .setPosition(tune.x, tune.y);
  }
}
