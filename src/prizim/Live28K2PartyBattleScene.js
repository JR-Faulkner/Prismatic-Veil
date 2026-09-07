// LIVE28K2/K3/K4/K5/K6/K7 production battle-scene adapter.
// Keeps LIVE28J battle behavior intact while using the approved LIVE28K full-resolution authorities.
import Live28PartyBattleScene from './Live28PartyBattleScene.js?v=live28j';
import Live28K7PartyFormationView from './Live28K7PartyFormationView.js?v=live28k7-halo';

const PRISMEL_K2_PASSIVE_KEY = 'prismel_live28k2_passive';
const PRISMEL_K2_PASSIVE_PATH = './assets/party_formation/PRISMEL_LIVE28K2_RIGHT_FACING.png?pvasset=live28k3';
const PRISMEL_K2_ACTIVE_KEY = 'prismel_live28k2_staff_ready';
const PRISMEL_K2_ACTIVE_PATH = './assets/party_formation/PRISMEL_LIVE28K2_STAFF_READY.png?pvasset=live28k3';
const AURYI_K2_PRIMARY_KEY = 'auryi_live28k2_primary';
const AURYI_K2_PRIMARY_PATH = './assets/party_formation/AURYI_LIVE28K2_PRIMARY.png?pvasset=live28k3';

export default class Live28K2PartyBattleScene extends Live28PartyBattleScene {
  preload() {
    super.preload();
    // Battle-critical LIVE28K art is direct repo-served PNG only. No WebP wrappers.
    this.load.image(PRISMEL_K2_PASSIVE_KEY, PRISMEL_K2_PASSIVE_PATH);
    this.load.image(PRISMEL_K2_ACTIVE_KEY, PRISMEL_K2_ACTIVE_PATH);
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

    this.formation = new Live28K7PartyFormationView(this);
    this.formation.create(this.party);
    if (this.activeHeroId) this.formation.setActive(this.activeHeroId);

    globalThis.__PV_LIVE28K2_RUNTIME__ = true;
    globalThis.__PV_LIVE28K2_FULLRES_PRIMARIES__ = true;
    globalThis.__PV_LIVE28K2_PRISMEL_STATE_PAIR__ = true;
    globalThis.__PV_LIVE28K6_AURYI_CROWN_HYBRID__ = true;
    globalThis.__PV_LIVE28K7_ATTACK_HALO_CLEAN__ = true;
  }

  _onCommand(label) {
    super._onCommand(label);
    if (label !== 'Resonart') return;

    const hero = this._activeHero();
    if (hero?.id !== 'auryi' || !hero.resonart || !this._drawer) return;

    // Auryi's Basic Attack and Resonart are separate authorities:
    // Aurorb Slice remains Attack; Aurora Pulse owns the Resonart drawer.
    this._drawer.title.setText(hero.resonart.name.toUpperCase());
    this._drawer.detail.setText(hero.resonart.flavor || 'A signature technique.');
  }

  _setBanner(msg) {
    const hero = this._activeHero();
    if (hero?.id === 'auryi' && hero.resonart && typeof msg === 'string' && msg.includes(hero.attack.name)) {
      msg = msg.replaceAll(hero.attack.name, hero.resonart.name);
    }
    super._setBanner(msg);
  }
}
