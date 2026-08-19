// 06A canon-safe active-turn bridge.
//
// Prismel remains fully validated and production-wired through 05M.
// Auryi and Kineza are intentionally NOT intercepted here until their locked
// entrance + Attack Master A production binaries are ingested. This removes
// the former high-resolution substitute-pose path from executable authority.

import ActiveTurnBattleSlice05M from './ActiveTurnBattleSlice05M.js?v=2';

export default class ActiveTurnBattleSlice06A extends ActiveTurnBattleSlice05M {
  shouldIntercept(hero, target) {
    return this.isEnabled()
      && !!hero && hero.id === 'prismel'
      && !!target && target.type === 'hushling' && target.alive;
  }
}
