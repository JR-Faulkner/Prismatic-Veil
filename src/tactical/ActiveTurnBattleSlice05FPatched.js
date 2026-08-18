// 05F screen-space coordinate hotfix.
// Phaser child getBounds() can report local/container-space bounds depending on
// version. 05F's shard volley must always launch from Prismel's visible hand on
// the real phone, so compute the composed screen point explicitly.

import ActiveTurnBattleSlice05F from './ActiveTurnBattleSlice05F.js?v=1';

export default class ActiveTurnBattleSlice05FPatched extends ActiveTurnBattleSlice05F {
  _heroHandPoint() {
    this._ensureCutin();
    const img = this._cutinImage;
    const rig = this._heroRig;
    const left = rig.x + img.x - img.displayWidth * img.originX;
    const top = rig.y + img.y - img.displayHeight * img.originY;
    return {
      x: left + img.displayWidth * 0.79,
      y: top + img.displayHeight * 0.42
    };
  }
}
