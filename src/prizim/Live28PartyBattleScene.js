// LIVE28 party-battle scene.
// Enforces the clean LIVE28 formation and preloads Kineza's actual Blitzer frame 01
// as the temporary battlefield standby.
import Live26PartyBattleScene from './Live26PartyBattleScene.js?v=live26g';
import Live28PartyFormationView from './Live28PartyFormationView.js?v=live28';

const KINEZA_STANDBY_KEY = 'kineza_live28_blitzer_frame01';

export default class Live28PartyBattleScene extends Live26PartyBattleScene {
  preload() {
    super.preload();
    this.load.image(
      KINEZA_STANDBY_KEY,
      './assets/characters/kineza/animations/blitzer/frames/Kineza_BlitzRush_01.png?pvasset=live28'
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
