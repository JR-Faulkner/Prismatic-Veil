// 05E-3 active-turn composition wrapper.
// Keeps the validated IntegratedTacticalScene stack intact, but swaps the
// ?battleslice=1 controller for the 05E-3 composition pass and preloads the
// battle-sized Hushling art it needs.

import IntegratedTacticalScene from './IntegratedTacticalScene.js?v=7';
import ActiveTurnBattleSliceV3, {
  ACTIVE_HUSHLING_TEXTURES
} from './ActiveTurnBattleSliceV3.js?v=1';

export default class IntegratedTacticalSceneV3 extends IntegratedTacticalScene {
  preload() {
    super.preload();
    this.load.image(
      ACTIVE_HUSHLING_TEXTURES.idle,
      './assets/enemy/hushling/Hushling_v34_Idle.png'
    );
    this.load.image(
      ACTIVE_HUSHLING_TEXTURES.hit,
      './assets/enemy/hushling/Hushling_v34_Hit.png'
    );
  }

  create() {
    super.create();

    // IntegratedTacticalScene creates the 05E-2 slice. Replace only that
    // controller; its existing enterLinkedBattle() interception point then
    // delegates to 05E-3 without touching normal Tactical or linked BP.
    this.activeTurnBattleSlice = new ActiveTurnBattleSliceV3(this);
  }
}
