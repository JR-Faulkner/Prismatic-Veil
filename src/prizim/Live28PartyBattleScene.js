// LIVE28I MAIN party-battle scene.
// Production authority:
// - Prismel uses the direct 900x900 PNG master. Tiny raster-in-SVG HC wrappers are retired from MAIN.
// - Auryi uses the direct 900x900 approved JRPG master; formation derives the already-proven crownless idle without resampling.
// - Kineza keeps the locked HC right-facing PNG authority.
import Live26PartyBattleScene from './Live26PartyBattleScene.js?v=live26g';
import Live28PartyFormationView from './Live28PartyFormationView.js?v=live28i';

const PRISMEL_MAIN_KEY = 'prismel_main_highres';
const AURYI_MAIN_KEY = 'auryi_main_highres';
const KINEZA_MAIN_IDLE_KEY = 'kineza_main_battle_idle_hc';
const KINEZA_FALLBACK_KEY = 'kineza_live28_blitzer_frame01';

export default class Live28PartyBattleScene extends Live26PartyBattleScene {
  preload() {
    super.preload();

    // MAIN/iPhone battle-critical character art is direct PNG only.
    this.load.image(
      PRISMEL_MAIN_KEY,
      './assets/party_formation/PRISMEL_JRPG_NORMALIZED_900x900.png?pvasset=live28i'
    );
    this.load.image(
      AURYI_MAIN_KEY,
      './assets/party_formation/AURYI_JRPG_NORMALIZED_900x900.png?pvasset=live28i'
    );
    this.load.image(
      KINEZA_MAIN_IDLE_KEY,
      './assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png?pvasset=live28i'
    );
    this.load.image(
      KINEZA_FALLBACK_KEY,
      './assets/characters/kineza/animations/blitzer/frames/Kineza_BlitzRush_01.png?pvasset=live28i'
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
    globalThis.__PV_LIVE28I_MAIN_SCALE_CLARITY_FIX__ = true;
  }
}
