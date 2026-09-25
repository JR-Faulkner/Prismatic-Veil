// LIVE29G — location-specific encounter identity layered over LIVE29F.
//
// K27 remains the locked battle authority. LIVE29F still owns encounter
// victory/defeat, progression payout, and return-to-Overworld behavior.
// This child only selects the enemy identity for a location and swaps the
// presentation/audio view after the inherited scene has initialized.
import Live29FEncounterBattleScene from './Live29FEncounterBattleScene.js?v=live29g2';
import { ENEMY_IDS, selectEnemy } from '../EnemyCatalog.js?v=live29g1';
import { HUSHLING_TEXTURES } from '../EnemyHushlingView.js?v=live29g2';
import { createEnemyView } from './Live25EnemyViewFactory.js?v=live29g1';
import EnemyAudioDirector from '../EnemyAudioDirector.js?v=live29g1';

const LOCATION_ENEMY = Object.freeze({
  // Whispering Grove is the first location-specific encounter lane.
  // Echo remains mapped for save/back-compat, but the Overworld now launches
  // the first encounter from Whispering Grove.
  whisper: ENEMY_IDS.hushling,
  echo: ENEMY_IDS.hushling
});

export function enemyForLocation(locationId = '') {
  return LOCATION_ENEMY[String(locationId || '').trim().toLowerCase()] || ENEMY_IDS.wraith;
}

export default class Live29GEncounterBattleScene extends Live29FEncounterBattleScene {
  preload() {
    super.preload();

    // PartyBattleScene currently preloads only the Wraith visuals. LIVE29G
    // owns the extra Hushling payload so the locked base/K27 lane stays clean.
    Object.values(HUSHLING_TEXTURES).forEach(texture => {
      if (!this.textures.exists(texture)) {
        this.load.image(texture, `./assets/enemy/hushling/${texture}.png`);
      }
    });
    if (!this.textures.exists('portrait_hushling')) {
      this.load.image('portrait_hushling', './assets/ui/portrait_hushling_v34.png');
    }
  }

  create() {
    super.create();

    const locationId = String(this._pvEncounter?.locationId || '').trim().toLowerCase();
    const enemyId = enemyForLocation(locationId);
    this._pvLocationEnemyId = enemyId;

    if (enemyId !== this.enemy?.id) this._swapLocationEnemy(enemyId);

    document.documentElement.dataset.pvEncounterEnemy = this.enemy?.id || ENEMY_IDS.wraith;
    window.__PV_LIVE29G_ENCOUNTER__ = Object.freeze({
      locationId,
      enemyId: this.enemy?.id || ENEMY_IDS.wraith,
      bridge: 'LIVE29F',
      battleAuthority: 'K27'
    });
  }

  _swapLocationEnemy(enemyId) {
    const previousView = this.enemyView;
    const previousPortrait = this.enemy?.portrait;
    const selected = selectEnemy(this.enemy, '', enemyId);

    // Keep the original enemy object identity. Existing battle/audio/HUD
    // code can safely retain its reference while the selected data changes.
    Object.keys(this.enemy).forEach(key => delete this.enemy[key]);
    Object.assign(this.enemy, selected, { attack: { ...selected.attack } });

    if (previousView) {
      previousView.stopIdle?.();
      if (previousView.layout) this.scale.off('resize', previousView.layout, previousView);
      // Do not destroy the inherited Wraith view during scene boot. The live
      // K27 stack has resize/tween callbacks still settling at this point;
      // destroying the container can trip Phaser's internal sys lookup. Hide
      // it and let the scene shutdown own cleanup while LIVE29G creates the
      // location-specific view below.
      previousView.container?.setVisible?.(false);
      previousView.container?.setActive?.(false);
      previousView.sprite?.setVisible?.(false);
      previousView.glow?.setVisible?.(false);
      previousView.ghost?.setVisible?.(false);
    }

    this.enemyView = createEnemyView(this, this.enemy);
    this.enemyView.create();

    // PartyBattleAudioController snapshots enemy.audioBank when its director
    // is created, so replace only that child director after the data swap.
    // The controller/music/mix itself remains untouched.
    if (this.audio) {
      this.audio.enemyDirector?.destroy?.();
      this.audio.enemyDirector = new EnemyAudioDirector(this, this.enemy);
      this.audio.enemyDirector.create();
      this.audio.enemyDirector.startIdle();
    }

    // The inherited target card reads this.enemy dynamically, but its text
    // and portrait objects were already built during super.create(). Re-layout
    // it, then retarget the enemy portrait chip in the turn-order strip.
    this._layoutTargetCard?.();
    const enemyChip = (this._turnOrderContainer?.list || []).find(node =>
      node?.texture?.key === previousPortrait && typeof node.setTexture === 'function'
    );
    enemyChip?.setTexture(this.enemy.portrait);
    this._updateTargetCard?.();
  }
}
