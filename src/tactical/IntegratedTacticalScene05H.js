// 05H presentation wrapper.
// Inherits the validated 05G/05F Tactical and fast Pool Splash QA behavior,
// replacing only the gated Prismel-vs-Hushling active-turn presentation.

import IntegratedTacticalScene05G from './IntegratedTacticalScene05G.js?v=1';
import ActiveTurnBattleSlice05H from './ActiveTurnBattleSlice05H.js?v=1';

export default class IntegratedTacticalScene05H extends IntegratedTacticalScene05G {
  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice05H(this);
  }
}
