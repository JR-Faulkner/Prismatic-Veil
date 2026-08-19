// 06D — cleanup harness after PriZim Tactical Shell 06C.
// Purpose: expose the compact HUD without the legacy encounter slab and
// prevent deprecated Auryi/Kineza substitute pose sequences from presenting
// themselves as canon while their approved production masters await ingestion.

import IntegratedTacticalScene06C from './IntegratedTacticalScene06C.js?v=7';

export default class IntegratedTacticalScene06D extends IntegratedTacticalScene06C {
  _suppressLegacyEncounterHUD06D() {
    if (this.encounterHUD && this.encounterHUD.container) {
      this.encounterHUD.container.setVisible(false);
    }
  }

  create() {
    super.create();
    this._suppressLegacyEncounterHUD06D();

    this.time.delayedCall(260, () => {
      this._suppressLegacyEncounterHUD06D();
      this.layoutHUD();
      this.setMessage('06D PRIZIM CLEAN SHELL • shallow tactical');
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
    // 06A's old high-res pose substitutions are explicitly deprecated for
    // Auryi/Kineza. Do not display them in this cleanup harness. Their locked
    // entrance + Attack Master A sequences remain the authority and will be
    // re-enabled only after proper production asset ingestion.
    if (hero && (hero.id === 'auryi' || hero.id === 'kineza')) {
      this.setMessage(`${hero.name.toUpperCase()} • CANON ENTRANCE + ATTACK QUEUED`);
      return;
    }

    return super.enterLinkedBattle(hero, target, actionKind);
  }
}
