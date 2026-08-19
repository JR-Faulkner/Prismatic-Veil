// 05K Hybrid Stack presentation wrapper.
// Keeps validated Tactical state/environment behavior and swaps only the
// active-turn presenter for the PV Forge-backed 05K variant.

import IntegratedTacticalScene05I from './IntegratedTacticalScene05I.js?v=1';
import ActiveTurnBattleSlice05K from './ActiveTurnBattleSlice05K.js?v=1';

export default class IntegratedTacticalScene05K extends IntegratedTacticalScene05I {
  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice05K(this);
  }
}
