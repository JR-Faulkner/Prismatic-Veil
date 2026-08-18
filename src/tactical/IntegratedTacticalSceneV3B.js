// 05E-3B active-turn composition wrapper.
// Keeps the validated Tactical stack untouched and swaps only the gated
// ?battleslice=1 controller for the normalized Prismel/Hushling presentation.

import IntegratedTacticalScene from './IntegratedTacticalScene.js?v=7';
import ActiveTurnBattleSliceV3B from './ActiveTurnBattleSliceV3B.js?v=1';

export default class IntegratedTacticalSceneV3B extends IntegratedTacticalScene {
  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSliceV3B(this);
  }
}
