// 05F screen-space coordinate hotfix.
// Phaser child getBounds() can report local/container-space bounds depending on
// version. 05F's shard volley must always launch from the visible hero hand on
// the real phone, so compute the composed screen point explicitly.
//
// IMPORTANT: Prismel uses _heroRig, while Auryi/Kineza 06A canon cut-ins are
// already screen-positioned sprites and intentionally do not create that rig.
// This helper therefore treats the rig as an optional parent transform.

import ActiveTurnBattleSlice05F from './ActiveTurnBattleSlice05F.js?v=1';

export default class ActiveTurnBattleSlice05FPatched extends ActiveTurnBattleSlice05F {
  _heroHandPoint() {
    this._ensureCutin();
    const img = this._cutinImage;
    if (!img || !img.active) {
      const m = this._layoutMetrics();
      return { x: m.w * 0.38, y: m.h * 0.48 };
    }

    const rig = this._heroRig;
    const parentX = rig && rig.active ? rig.x : 0;
    const parentY = rig && rig.active ? rig.y : 0;
    const left = parentX + img.x - img.displayWidth * img.originX;
    const top = parentY + img.y - img.displayHeight * img.originY;

    // Keep the proven Prismel anchor while allowing canon heroes without a
    // container rig to reach the shared projectile/impact path safely.
    return {
      x: left + img.displayWidth * 0.79,
      y: top + img.displayHeight * 0.42
    };
  }
}
