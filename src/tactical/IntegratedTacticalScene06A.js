// 06A.3 — Three-hero Too Quiet tactical wrapper.
//
// Keeps the validated 05M/05I tactical stack and current mobile shell, then:
// 1) preloads the existing LOCKED high-resolution Auryi/Kineza battle-pose PNGs;
// 2) swaps in ActiveTurnBattleSlice06A so all three heroes use the active-turn path;
// 3) stages a close lawn-side battleslice=1 test cluster with immediate legal targets.
//
// Sequence Lab WebP proxies are intentionally NOT loaded here. They are QA
// transport assets, not live combat art. Normal Tactical coordinates remain
// untouched when battleslice is absent.

import IntegratedTacticalScene05M from './IntegratedTacticalScene05M.js?v=2';
import ActiveTurnBattleSlice06A from './ActiveTurnBattleSlice06A.js?v=4';

const AURYI_BATTLE_ASSETS = Object.freeze([
  ['auryi_battle_1', './assets/poses/auryi/Pose01_BattleReady_BattleMasterA_LOCKED.png'],
  ['auryi_battle_2', './assets/poses/auryi/Pose02_VeilStep_LOCKED.png'],
  ['auryi_battle_3', './assets/poses/auryi/Pose03_OrbGather_LOCKED.png'],
  ['auryi_battle_4', './assets/poses/auryi/Pose04_Attack_VeilPulse_POSE_LOCKED.png'],
  ['auryi_battle_5', './assets/poses/auryi/Pose05_Recompose_LOCKED.png']
]);

const KINEZA_BATTLE_ASSETS = Object.freeze([
  ['kineza_battle_1', './assets/poses/kineza/Kineza01_Idle_LOCKED.png'],
  ['kineza_battle_2', './assets/poses/kineza/Kineza02_Step_LOCKED.png'],
  ['kineza_battle_3', './assets/poses/kineza/Kineza03_Coil_LOCKED.png'],
  ['kineza_battle_4', './assets/poses/kineza/Kineza04_Strike_LOCKED.png'],
  ['kineza_battle_5', './assets/poses/kineza/Kineza05_Recover_LOCKED.png']
]);

export default class IntegratedTacticalScene06A extends IntegratedTacticalScene05M {
  preload() {
    super.preload();
    [...AURYI_BATTLE_ASSETS, ...KINEZA_BATTLE_ASSETS].forEach(([key, path]) => {
      this.load.image(key, path);
    });
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

    // Lawn-side QA cluster, deliberately away from Pool Splash at (2,9).
    // All occupied tiles are open terrain in tactical_map_v2.
    // Auryi range 1-2: (7,5) -> (9,5)
    // Prismel range 2-4: (8,6) -> (10,6)
    // Kineza range 1:   (8,7) -> (9,7)
    this._moveUnitForQa(auryi, 7, 5);
    this._moveUnitForQa(prismel, 8, 6);
    this._moveUnitForQa(kineza, 8, 7);
    this._moveUnitForQa(h1, 9, 5);
    this._moveUnitForQa(h2, 10, 6);
    this._moveUnitForQa(h3, 9, 7);

    if (this.unitController && this.unitController.clearSelection) {
      this.unitController.clearSelection();
    }
    this.grid.clearAllOverlays();
    this.refreshHUD();

    // Runs after the inherited Prismel-only QA recenter so lawn framing wins.
    this.time.delayedCall(150, () => {
      const compact = this.scale.width < 560 || this.scale.height < 520;
      this.tacticalCamera.setZoom(compact ? 0.88 : 0.96);
      this.tacticalCamera.focusOn(8.7, 6.2, 0);
      this.setMessage('06A.3 QA: three heroes on the lawn with immediate targets.');
      this.refreshHUD();
    });
  }

  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice06A(this);
    this._stageThreeHeroQaStart();
  }
}
