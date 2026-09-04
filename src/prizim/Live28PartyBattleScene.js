// LIVE28H party-battle scene.
// MAIN production authority:
// - Preload Prismel HC passive/active idle pair for correct turn-state swap.
// - Kineza HC right-facing idle physically exists and is the production authority.
// - Live28H formation hardens Prismel post-attack restore and Auryi master-body recovery.
import Live26PartyBattleScene from './Live26PartyBattleScene.js?v=live26g';
import Live28PartyFormationView from './Live28PartyFormationView.js?v=live28h';

const PRISMEL_PASSIVE_KEY = 'prismel_idle_passive_hc';
const PRISMEL_ACTIVE_KEY = 'prismel_idle_active_hc';
const KINEZA_MAIN_IDLE_KEY = 'kineza_main_battle_idle_hc';
const KINEZA_FALLBACK_KEY = 'kineza_live28_blitzer_frame01';

export default class Live28PartyBattleScene extends Live26PartyBattleScene {
  preload() {
    super.preload();

    this.load.image(
      PRISMEL_PASSIVE_KEY,
      './assets/characters/prismel/live_hc/prismel_idle_passive_hc.svg?pvasset=live28h'
    );
    this.load.image(
      PRISMEL_ACTIVE_KEY,
      './assets/characters/prismel/live_hc/prismel_idle_active_hc.svg?pvasset=live28h'
    );

    this.load.image(
      KINEZA_MAIN_IDLE_KEY,
      './assets/party_formation/KINEZA_MAIN_BATTLE_IDLE_HC.png?pvasset=live28h'
    );

    this.load.image(
      KINEZA_FALLBACK_KEY,
      './assets/characters/kineza/animations/blitzer/frames/Kineza_BlitzRush_01.png?pvasset=live28h'
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
    globalThis.__PV_LIVE28H_HYBRID_FIX__ = true;
  }
}
