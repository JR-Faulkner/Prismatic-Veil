// LIVE29F encounter bridge.
// Keeps LIVE28K27 as the untouched combat/render authority and adds only
// Overworld encounter completion/return behavior when the battle was entered
// from a location route.
import Live28K27BattleGuardScene from './Live28K27BattleGuardScene.js?v=live29f1';

const CLEAR_PREFIX = 'pv.locationClear.';
const RESULT_KEY = 'pv.encounterResult';
const PENDING_KEY = 'pv.pendingEncounter';

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
}

export default class Live29FEncounterBattleScene extends Live28K27BattleGuardScene {
  create() {
    super.create();
    const params = new URLSearchParams(globalThis.location?.search || '');
    const locationId = params.get('pvloc');
    const mode = params.get('pvencounter');
    const pending = safeParse(globalThis.localStorage?.getItem(PENDING_KEY));
    this._pvEncounter = locationId ? {
      locationId,
      mode: mode || pending?.mode || 'first-clear',
      enteredAt: pending?.enteredAt || Date.now()
    } : null;
    globalThis.__PV_LIVE29F_ENCOUNTER_BRIDGE__ = !!this._pvEncounter;
  }

  _onVictory() {
    super._onVictory();
    if (!this._pvEncounter || this._pvEncounterReturnQueued) return;
    this._pvEncounterReturnQueued = true;

    const { locationId, mode } = this._pvEncounter;
    const clearKey = `${CLEAR_PREFIX}${locationId}`;
    const wasCleared = globalThis.localStorage?.getItem(clearKey) === '1';
    const firstClear = !wasCleared;

    try {
      globalThis.localStorage?.setItem(clearKey, '1');
      globalThis.localStorage?.setItem(RESULT_KEY, JSON.stringify({
        locationId,
        result: 'victory',
        firstClear,
        mode,
        completedAt: Date.now()
      }));
      globalThis.localStorage?.removeItem(PENDING_KEY);
    } catch (_) { /* encounter completion still returns even if storage is blocked */ }

    // Leave the existing victory presentation and audio intact before returning.
    this.time.delayedCall(2300, () => {
      const q = new URLSearchParams({ pvreturn: locationId, pvresult: 'victory' });
      globalThis.location.href = `./hybrid-overworld.html?${q.toString()}`;
    });
  }
}
