// 05M.1 PriZim presentation wrapper.
// Preserves 05I Tactical state/environment and swaps in the 05M.1 transition-cleanup presenter.

import IntegratedTacticalScene05I from './IntegratedTacticalScene05I.js?v=1';
import ActiveTurnBattleSlice05M1 from './ActiveTurnBattleSlice05M1.js?v=1';

export default class IntegratedTacticalScene05M1 extends IntegratedTacticalScene05I {
  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice05M1(this);
  }
}
