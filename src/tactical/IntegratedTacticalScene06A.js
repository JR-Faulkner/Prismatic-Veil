// 06A.4 — Three-hero Too Quiet tactical wrapper.
//
// Keeps the validated 05M/05I tactical stack and current mobile shell, then:
// 1) preloads the existing LOCKED high-resolution Auryi/Kineza battle-pose PNGs;
// 2) preloads Kineza's LOCKED gauntlet-ignition authority sheet QA proxy;
// 3) swaps in ActiveTurnBattleSlice06A so all three heroes use the active-turn path;
// 4) stages a close lawn-side battleslice=1 test cluster with immediate legal targets.
//
// The Kineza authority-sheet proxy is used ONLY to restore the correct entrance
// choreography until the approved production master binary is ingested. The old
// Idle -> Step -> Coil -> Strike sequence is no longer allowed to stand in for
// Kineza's entrance.

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

const KINEZA_IGNITION_RUNTIME_FRAMES = Object.freeze([
  'kineza_ignition_1', 'kineza_ignition_2', 'kineza_ignition_3',
  'kineza_ignition_4', 'kineza_ignition_5', 'kineza_ignition_6'
]);

class ActiveTurnBattleSlice06AKinezaCorrected extends ActiveTurnBattleSlice06A {
  _sequenceConfig() {
    if (this._activeHero06A && this._activeHero06A.id === 'kineza') {
      return {
        intro: KINEZA_IGNITION_RUNTIME_FRAMES,
        holds: [220, 220, 250, 250, 280, 320],
        label: 'MOMENTUM FIST',
        colour: 0x62ff98,
        accent: 0x18c86b
      };
    }
    return super._sequenceConfig();
  }
}

export default class IntegratedTacticalScene06A extends IntegratedTacticalScene05M {
  preload() {
    super.preload();
    [...AURYI_BATTLE_ASSETS, ...KINEZA_BATTLE_ASSETS].forEach(([key, path]) => {
      this.load.image(key, path);
    });
    this.load.image('kineza_ignition_authority_sheet', './assets/sequences/qa/kineza_gauntlet_ignition.webp');
  }

  _buildKinezaIgnitionRuntimeFrames() {
    const tex = this.textures.get('kineza_ignition_authority_sheet');
    if (!tex || !tex.key || tex.key === '__MISSING') return;
    const source = tex.getSourceImage();
    if (!source || !source.width || !source.height) return;

    const cellW = Math.floor(source.width / 3);
    const cellH = Math.floor(source.height / 2);

    KINEZA_IGNITION_RUNTIME_FRAMES.forEach((key, i) => {
      if (this.textures.exists(key)) return;
      const canvasTex = this.textures.createCanvas(key, cellW, cellH);
      const ctx = canvasTex.context;
      const col = i % 3;
      const row = Math.floor(i / 3);
      ctx.clearRect(0, 0, cellW, cellH);
      ctx.drawImage(source, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);

      // Conservative cleanup of the proxy's uniform white transport matte.
      // Only near-pure white pixels are removed so green energy, gold trim,
      // highlights, and character edges remain intact.
      try {
        const img = ctx.getImageData(0, 0, cellW, cellH);
        const px = img.data;
        for (let p = 0; p < px.length; p += 4) {
          if (px[p] > 248 && px[p + 1] > 248 && px[p + 2] > 248) px[p + 3] = 0;
        }
        ctx.putImageData(img, 0, 0);
      } catch (err) {
        // If pixel reads are unavailable, keep the proxy playable rather than fail boot.
      }
      canvasTex.refresh();
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

    this.time.delayedCall(150, () => {
      const compact = this.scale.width < 560 || this.scale.height < 520;
      this.tacticalCamera.setZoom(compact ? 0.88 : 0.96);
      this.tacticalCamera.focusOn(8.7, 6.2, 0);
      this.setMessage('06A.4 QA: three heroes on the lawn with canonical Kineza ignition entrance.');
      this.refreshHUD();
    });
  }

  create() {
    super.create();
    this._buildKinezaIgnitionRuntimeFrames();
    this.activeTurnBattleSlice = new ActiveTurnBattleSlice06AKinezaCorrected(this);
    this._stageThreeHeroQaStart();
  }
}
