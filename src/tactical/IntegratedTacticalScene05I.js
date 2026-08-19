// 05I Mobile Shell wrapper.
// Inherits 05H's presentation/registration work and swaps only the active-turn
// controller for the HTML/CSS mobile-shell version.

import IntegratedTacticalScene05H from './IntegratedTacticalScene05H.js?v=1';
import ActiveTurnBattleSlice05I from './ActiveTurnBattleSlice05I.js?v=1';

export default class IntegratedTacticalScene05I extends IntegratedTacticalScene05H {
  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice05I(this);
  }
}
