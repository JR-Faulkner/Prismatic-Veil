// 05L PriZim presentation wrapper.
import IntegratedTacticalScene05I from './IntegratedTacticalScene05I.js?v=1';
import ActiveTurnBattleSlice05L from './ActiveTurnBattleSlice05L.js?v=1';

export default class IntegratedTacticalScene05L extends IntegratedTacticalScene05I {
  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice05L(this);
  }
}
