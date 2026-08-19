// 05J Mobile Shell refinement wrapper.
// Keeps all validated 05I/05H/05G combat and environment behavior, replacing
// only the active-turn presenter with the hard-registered 05J variant.

import IntegratedTacticalScene05I from './IntegratedTacticalScene05I.js?v=1';
import ActiveTurnBattleSlice05J from './ActiveTurnBattleSlice05J.js?v=1';

export default class IntegratedTacticalScene05J extends IntegratedTacticalScene05I {
  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice05J(this);
  }
}
