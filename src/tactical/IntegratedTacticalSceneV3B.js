// 05E-3B active-turn composition wrapper.
// Keeps the validated Tactical stack untouched and swaps only the gated
// ?battleslice=1 controller for the normalized Prismel/Hushling presentation.
//
// Real-device QA also showed the test itself was wasting 3-4 turns before the
// player could reach the thing under review. When battleslice=1 is present,
// this wrapper now stages a deliberately short QA opening beside Pool Splash:
// Prismel is one step in front of the party and one Hushling begins exactly
// two tiles away, inside Prismel's legal 2-4 tile attack band. Normal Tactical
// (no battleslice flag) keeps the authored map coordinates unchanged.

import IntegratedTacticalScene from './IntegratedTacticalScene.js?v=7';
import ActiveTurnBattleSliceV3B from './ActiveTurnBattleSliceV3B.js?v=1';

export default class IntegratedTacticalSceneV3B extends IntegratedTacticalScene {
  _battleSliceEnabled() {
    if (typeof window === 'undefined') return false;
    const raw = (new URLSearchParams(window.location.search).get('battleslice') || '').toLowerCase();
    return ['1', 'true', 'on', 'yes'].includes(raw);
  }

  _moveUnitForQa(unit, x, y) {
    if (!unit) return;
    this.grid.clearOccupant(unit.x, unit.y);
    unit.x = x;
    unit.y = y;
    this.grid.setOccupant(x, y, unit);
    this._placeUnitSprite(unit);
  }

  _stageFastPoolQaStart() {
    if (!this._battleSliceEnabled()) return;

    const prismel = (this.heroes || []).find(h => h.id === 'prismel');
    const hushling = (this.enemies || []).find(e => e.type === 'hushling' && e.alive);
    if (!prismel || !hushling) return;

    // Pool Splash is at (2,9). Auryi/Kineza already begin around that corner,
    // so only push Prismel to the front of the formation and bring one target
    // into clean minimum-range attack distance. Terrain at (3,8) and (5,8)
    // is open in backyard_too_quiet_v2.
    this._moveUnitForQa(prismel, 3, 8);
    this._moveUnitForQa(hushling, 5, 8);

    // Clear any stale selection/preview left from create-time helpers, then
    // frame the QA cluster after the base scene's own delayed recenter fires.
    if (this.unitController && this.unitController.clearSelection) {
      this.unitController.clearSelection();
    }
    this.grid.clearAllOverlays();
    this.refreshHUD();

    this.time.delayedCall(100, () => {
      const compact = this.scale.width < 560 || this.scale.height < 520;
      const desiredZoom = compact ? 0.82 : 0.92;
      this.tacticalCamera.setZoom(desiredZoom);
      this.tacticalCamera.focusOn(4, 8, 0);
      this.setMessage('QA start: Prismel can attack the nearby Hushling immediately.');
      this.refreshHUD();
    });
  }

  create() {
    super.create();
    this.activeTurnBattleSlice = new ActiveTurnBattleSliceV3B(this);
    this._stageFastPoolQaStart();
  }
}
