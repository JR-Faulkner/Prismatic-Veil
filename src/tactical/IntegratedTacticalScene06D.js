// 06D — PriZim Tactical cleanup harness.
// Purpose: expose the compact HUD without the legacy encounter slab,
// preserve the proven lawn-side quick-start staging, and force the validated
// active-turn path for all three canon heroes.
//
// IMPORTANT: 06D is a dedicated QA harness. It force-enables the active-turn
// slice internally so this page can never silently fall through to legacy BP
// because a query parameter was omitted or stripped by the browser.

import IntegratedTacticalScene06C from './IntegratedTacticalScene06C.js?v=13';

export default class IntegratedTacticalScene06D extends IntegratedTacticalScene06C {
  _suppressLegacyEncounterHUD06D() {
    if (this.encounterHUD && this.encounterHUD.container) {
      this.encounterHUD.container.setVisible(false);
    }
  }

  _forceActiveTurnHarness06D() {
    if (!this.activeTurnBattleSlice) return;
    this.activeTurnBattleSlice.isEnabled = () => true;
  }

  _stageLawnSideQuickStart06D() {
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
    if (this.grid) this.grid.clearAllOverlays();

    this.hudExpanded = false;
    if (this.heroCardsDrawer) {
      this.heroCardsDrawer.x = -(this._hudDrawerHiddenOffset || 280);
    }

    this.time.delayedCall(120, () => {
      const compact = this.scale.width < 560 || this.scale.height < 520;
      this.tacticalCamera.setZoom(compact ? 0.88 : 0.96);
      this.tacticalCamera.focusOn(8.7, 6.2, 0);
      this.layoutHUD();
      this._suppressLegacyEncounterHUD06D();
      this.setMessage('TOO QUIET • LAWN ENGAGEMENT');
      this.refreshHUD();
    });
  }

  create() {
    super.create();
    this._forceActiveTurnHarness06D();
    this._suppressLegacyEncounterHUD06D();
    this._stageLawnSideQuickStart06D();

    this.time.delayedCall(260, () => {
      this._forceActiveTurnHarness06D();
      this._suppressLegacyEncounterHUD06D();
      this.layoutHUD();
      this.refreshHUD();
    });
  }

  layoutHUD() {
    super.layoutHUD();
    this._suppressLegacyEncounterHUD06D();
  }

  refreshHUD() {
    super.refreshHUD();
    this._suppressLegacyEncounterHUD06D();
  }

  async enterLinkedBattle(hero, target, actionKind) {
    this._forceActiveTurnHarness06D();
    return super.enterLinkedBattle(hero, target, actionKind);
  }
}
