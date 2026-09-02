// LIVE27 party-battle scene.
// Hard-enforces the corrected JRPG formation after LIVE26's Veil-stage setup.
import Live26PartyBattleScene from './Live26PartyBattleScene.js?v=live26g';
import Live27PartyFormationView from './Live27PartyFormationView.js?v=live27';

const KINEZA_STANDBY_KEY = 'kineza_live27_jrpg_standby';

export default class Live27PartyBattleScene extends Live26PartyBattleScene {
  preload() {
    super.preload();
    // Reuse the proven Stylized-JRPG Sprint-A production sheet as the
    // battlefield body authority. Frame 0 is the approved right-facing ready stance.
    this.load.spritesheet(
      KINEZA_STANDBY_KEY,
      './assets/characters/kineza/animations/kineza_basic_attack_v2.png?pvasset=live27',
      { frameWidth: 720, frameHeight: 580 }
    );
  }

  create() {
    super.create();

    if (this.formation?.constructor?.name !== 'Live27PartyFormationView') {
      const old = this.formation;
      if (old) {
        this.scale.off('resize', old.layout, old);
        old.actors?.forEach(actor => {
          [actor.sprite, actor.ghost, actor.ring, actor.attackSprite, actor.duoCrown, actor.duoAuorb]
            .filter(Boolean)
            .forEach(obj => obj.destroy?.());
        });
      }
      this.formation = new Live27PartyFormationView(this);
      this.formation.create(this.party);
      if (this.activeHeroId) this.formation.setActive(this.activeHeroId);
    }

    globalThis.__PV_LIVE27_RUNTIME__ = true;
  }
}
