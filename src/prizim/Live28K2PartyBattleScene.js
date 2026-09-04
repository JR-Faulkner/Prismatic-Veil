// LIVE28K2 staging battle-scene adapter.
// Keeps LIVE28J battle behavior intact while swapping the approved new full-resolution primaries.
// Remains dormant until both exact PNG assets exist in the repo and LIVE28K2 is promoted.
import Live28PartyBattleScene from './Live28PartyBattleScene.js?v=live28j';
import Live28K2PartyFormationView from './Live28K2PartyFormationView.js?v=live28k2';

const PRISMEL_K2_PASSIVE_KEY = 'prismel_live28k2_passive';
const PRISMEL_K2_PASSIVE_PATH = './assets/party_formation/PRISMEL_LIVE28K2_RIGHT_FACING.png?pvasset=live28k2';
const AURYI_K2_PRIMARY_KEY = 'auryi_live28k2_primary';
const AURYI_K2_PRIMARY_PATH = './assets/party_formation/AURYI_LIVE28K2_PRIMARY.png?pvasset=live28k2';

export default class Live28K2PartyBattleScene extends Live28PartyBattleScene {
  preload() {
    super.preload();
    // Battle-critical LIVE28K2 art is direct repo-served PNG only. No WebP wrappers.
    this.load.image(PRISMEL_K2_PASSIVE_KEY, PRISMEL_K2_PASSIVE_PATH);
    this.load.image(AURYI_K2_PRIMARY_KEY, AURYI_K2_PRIMARY_PATH);
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

    this.formation = new Live28K2PartyFormationView(this);
    this.formation.create(this.party);
    if (this.activeHeroId) this.formation.setActive(this.activeHeroId);

    globalThis.__PV_LIVE28K2_RUNTIME__ = true;
    globalThis.__PV_LIVE28K2_FULLRES_PRIMARIES__ = true;
  }
}
