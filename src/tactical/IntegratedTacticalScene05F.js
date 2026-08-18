// 05F mock-driven active-turn wrapper.
// Reuses 05E-3B's fast Pool Splash QA opening, then swaps only the gated
// Prismel-vs-Hushling active-turn presentation for 05F.

import IntegratedTacticalSceneV3B from './IntegratedTacticalSceneV3B.js?v=2';
import ActiveTurnBattleSlice05F from './ActiveTurnBattleSlice05F.js?v=1';

export default class IntegratedTacticalScene05F extends IntegratedTacticalSceneV3B {
  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice05F(this);
  }
}
