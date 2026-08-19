// 06D — cleanup harness after PriZim Tactical Shell 06C.
// Purpose: expose the compact HUD without the legacy encounter slab,
// preserve the proven lawn-side quick-start staging, and prevent deprecated
// Auryi/Kineza substitute pose sequences from presenting themselves as canon.

import IntegratedTacticalScene06C from './IntegratedTacticalScene06C.js?v=8';

export default class IntegratedTacticalScene06D extends IntegratedTacticalScene06C {
  _suppressLegacyEncounterHUD06D() {
    if (this.encounterHUD && this.encounterHUD.container) {
      this.encounterHUD.container.setVisible(false);
    }
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

    // Proven 06A lawn-side QA cluster, deliberately away from Pool Splash
    // and shifted toward the right-hand side of the backyard.
    this._moveUnitForQa(auryi, 7, 5);
    this._moveUnitForQa(prismel, 8, 6);
    this._moveUnitForQa(kineza, 8, 7);
    this._moveUnitForQa(h1, 9, 5);
    this._moveUnitForQa(h2, 10, 6);
    this._moveUnitForQa(h3, 9, 7);

    if (this.unitController && this.unitController.clearSelection) {
      this.unitController.clearSelection();
    }
    if (this.grid) this.grid.clearAllOverlays();

    // PriZim 06D: detail stays available on demand, but battlefield view is
    // the default. The drawer should not open as a giant first impression.
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
    this._suppressLegacyEncounterHUD06D();
    this._stageLawnSideQuickStart06D();

    this.time.delayedCall(260, () => {
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
    // Deprecated high-res pose substitutions are not canon entrances/attacks.
    // Refuse to present them until the approved production entrance + Attack
    // Master A assets are ingested.
    if (hero && (hero.id === 'auryi' || hero.id === 'kineza')) {
      this.setMessage(`${hero.name.toUpperCase()} • CANON ENTRANCE + ATTACK QUEUED`);
      return;
    }

    return super.enterLinkedBattle(hero, target, actionKind);
  }
}
