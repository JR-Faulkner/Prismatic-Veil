// 06A canon Too Quiet tactical wrapper.
//
// Keeps the validated 05M/05I tactical stack, installs the three-hero
// active-turn bridge, and preserves the proven lawn-side QA staging.

import IntegratedTacticalScene05M from './IntegratedTacticalScene05M.js?v=2';
import ActiveTurnBattleSlice06A from './ActiveTurnBattleSlice06A.js?v=10';

export default class IntegratedTacticalScene06A extends IntegratedTacticalScene05M {
  preload() {
    super.preload();

    const sheet = { frameWidth: 512, frameHeight: 512 };
    this.load.spritesheet(
      'auryi_auorb_entrance_master_a',
      './assets/sequences/production/auryi_auorb_entrance_master_a.png',
      sheet
    );
    this.load.spritesheet(
      'auryi_attack_master_a',
      './assets/sequences/production/auryi_attack_master_a.png',
      sheet
    );
    this.load.spritesheet(
      'kineza_gauntlet_ignition_master_a',
      './assets/sequences/production/kineza_gauntlet_ignition_master_a.png',
      sheet
    );
    this.load.spritesheet(
      'kineza_attack_master_a',
      './assets/sequences/production/kineza_attack_master_a.png',
      sheet
    );
  }

  _stageThreeHeroQaStart() {
    if (!this._battleSliceEnabled()) return;

    const byHero = id => (this.heroes || []).find(h => h.id === id);
    const byEnemy = id => (this.enemies || []).find(e => e.id === id && e.alive);
    const prismel = byHero('prismel');
    const auryi = byHero('auryi');
    const kineza = byHero('kineza');
    const h1 = byEnemy('hushling_1');
    const h2 = byEnemy('hushling_2');
    const h3 = byEnemy('hushling_3');
    if (!prismel || !auryi || !kineza || !h1 || !h2 || !h3) return;

    this._moveUnitForQa(auryi, 7, 5);
    this._moveUnitForQa(prismel, 8, 6);
    this._moveUnitForQa(kineza, 9, 6);
    this._moveUnitForQa(h1, 9, 5);
    this._moveUnitForQa(h2, 10, 6);
    this._moveUnitForQa(h3, 9, 7);

    if (this.unitController && this.unitController.clearSelection) {
      this.unitController.clearSelection();
    }
    this.grid.clearAllOverlays();
    this.refreshHUD();

    this.time.delayedCall(150, () => {
      const compact = this.scale.width < 560 || this.scale.height < 520;
      this.tacticalCamera.setZoom(compact ? 0.88 : 0.96);
      this.tacticalCamera.focusOn(8.7, 6.2, 0);
      this.setMessage('06A QA • lawn-side cluster • three-hero canon active-turn');
      this.refreshHUD();
    });
  }

  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice06A(this);
    this._stageThreeHeroQaStart();
  }
}
