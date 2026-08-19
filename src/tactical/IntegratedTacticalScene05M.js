// 05M PriZim presentation wrapper.
// Keeps 05I Tactical state/environment behavior and swaps only the active-turn presenter.

import IntegratedTacticalScene05I from './IntegratedTacticalScene05I.js?v=1';
import ActiveTurnBattleSlice05M from './ActiveTurnBattleSlice05M.js?v=1';

export default class IntegratedTacticalScene05M extends IntegratedTacticalScene05I {
  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice05M(this);
  }
}
