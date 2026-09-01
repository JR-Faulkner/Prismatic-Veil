// LIVE23 party-battle scene shim.
// Adds the crownless/Auorb-free Auryi entry-start art to the preload set.
// All battle logic stays in the existing PartyBattleScene.
import PartyBattleScene from '../PartyBattleScene.js?v=live23-base';

export const AURYI_LIVE23_RAW_KEY = 'auryi_live23_entry_start_raw';
export const AURYI_LIVE23_RAW_PATH = './assets/characters/auryi/animations/entry/frames/Auryi_Entry_01.png?pvasset=live23';

export default class Live23PartyBattleScene extends PartyBattleScene {
  preload() {
    super.preload();
    if (!this.textures.exists(AURYI_LIVE23_RAW_KEY)) {
      this.load.image(AURYI_LIVE23_RAW_KEY, AURYI_LIVE23_RAW_PATH);
    }
  }
}
