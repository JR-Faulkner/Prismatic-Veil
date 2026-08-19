// 05G presentation wrapper.
// Inherits 05F's fast Pool Splash QA opening and validated Tactical behavior,
// then swaps only the gated Prismel-vs-Hushling active-turn presentation.

import IntegratedTacticalScene05F from './IntegratedTacticalScene05F.js?v=2';
import ActiveTurnBattleSlice05G from './ActiveTurnBattleSlice05G.js?v=1';

export default class IntegratedTacticalScene05G extends IntegratedTacticalScene05F {
  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice05G(this);
  }
}
