// LIVE28 party-battle scene.
// MAIN production authority:
// - Prefer the locked HC Kineza right-facing battle idle when present.
// - Keep Blitzer frame 01 only as a safety fallback until the binary asset is present.
// - Use the enlarged Auryi + re-locked Prismel JRPG formation pass.
import Live26PartyBattleScene from './Live26PartyBattleScene.js?v=live26g';
import Live28PartyFormationView from './Live28PartyFormationView.js?v=live28c';

const KINEZA_MAIN_IDLE_KEY = 'kineza_main_battle_idle_hc';
const KINEZA_FALLBACK_KEY = 'kineza_live28_blitzer_frame01';

export default class Live28PartyBattleScene extends Live26PartyBattleScene {
  preload() {
    super.preload();

    this.load.image(
      KINEZA_MAIN_IDLE_KEY,
      './assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png?pvasset=live28c'
    );

    this.load.image(
      KINEZA_FALLBACK_KEY,
      './assets/characters/kineza/animations/blitzer/frames/Kineza_BlitzRush_01.png?pvasset=live28c'
    );
  }

  create() {
    super.create();
    const old = this.formation;
    if (old) {
      this.scale.off('resize', old.layout, old);
      old.actors?.forEach(actor => {
        [actor.sprite, actor.ghost, actor.ring, actor.attackSprite, actor.duoCrown, actor.duoAuorb]
          .filter(Boolean)
          .forEach(obj => obj.destroy?.());
      });
    }
    this.formation = new Live28PartyFormationView(this);
    this.formation.create(this.party);
    if (this.activeHeroId) this.formation.setActive(this.activeHeroId);
    globalThis.__PV_LIVE28_RUNTIME__ = true;
  }
}
