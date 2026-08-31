// 06J — Current PHONE-08 Tactical scene with Kineza BLITZER promoted.
// HUD, tactical rules, camera shell, and all non-Kineza combat behavior stay
// inherited from the validated 06I stack.

import IntegratedTacticalScene06I from './IntegratedTacticalScene06I.js?v=2';
import ActiveTurnBattleSlice06J from './ActiveTurnBattleSlice06J.js?v=1';

export default class IntegratedTacticalScene06J extends IntegratedTacticalScene06I {
  preload() {
    super.preload();
    this.load.spritesheet(
      'kineza_blitzer_basic_v1',
      './assets/characters/kineza/animations/kineza_blitzer_basic_v1.webp',
      { frameWidth: 128, frameHeight: 128 }
    );
  }

  create() {
    super.create();
    // Replace only the presenter installed by 06A. The current Tactical scene,
    // unit controller, HUD, targeting, and state machine remain untouched.
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice06J(this);
  }
}
