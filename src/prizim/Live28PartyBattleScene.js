// LIVE28J MAIN party-battle scene.
// Production authority:
// - Prismel returns to approved direct-PNG character lineage:
//   passive/off-turn = high-resolution movement-master contact pose;
//   active/on-turn = approved staff-materialization ready pose.
// - The wrong generic 900x900 Prismel stand-in is retired from MAIN.
// - Auryi keeps the direct approved JRPG master; formation derives the crownless idle.
// - Kineza keeps the locked HC right-facing PNG authority.
import Live26PartyBattleScene from './Live26PartyBattleScene.js?v=live26g';
import Live28PartyFormationView from './Live28PartyFormationView.js?v=live28j';

const PRISMEL_PASSIVE_KEY = 'prismel_live28j_passive';
const PRISMEL_ACTIVE_KEY = 'prismel_live28j_active';
const AURYI_MAIN_KEY = 'auryi_main_highres';
const KINEZA_MAIN_IDLE_KEY = 'kineza_main_battle_idle_hc';
const KINEZA_FALLBACK_KEY = 'kineza_live28_blitzer_frame01';

export default class Live28PartyBattleScene extends Live26PartyBattleScene {
  preload() {
    super.preload();

    // MAIN/iPhone battle-critical character art is direct PNG only.
    this.load.image(
      PRISMEL_PASSIVE_KEY,
      './assets/prismel/walk/prismel_walk_01_contact_a.png?pvasset=live28j'
    );
    this.load.image(
      PRISMEL_ACTIVE_KEY,
      './assets/poses/prismel_active_turn/prismel_ready_6.png?pvasset=live28j'
    );
    this.load.image(
      AURYI_MAIN_KEY,
      './assets/party_formation/AURYI_JRPG_NORMALIZED_900x900.png?pvasset=live28j'
    );
    this.load.image(
      KINEZA_MAIN_IDLE_KEY,
      './assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png?pvasset=live28j'
    );
    this.load.image(
      KINEZA_FALLBACK_KEY,
      './assets/characters/kineza/animations/blitzer/frames/Kineza_BlitzRush_01.png?pvasset=live28j'
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
    globalThis.__PV_LIVE28J_PRISMEL_SCALE_FIX__ = true;
  }
}
