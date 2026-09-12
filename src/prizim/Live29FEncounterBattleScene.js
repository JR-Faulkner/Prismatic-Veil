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

  _queueEncounterReturn(result, delayMs) {
    if (!this._pvEncounter || this._pvEncounterReturnQueued) return;
    this._pvEncounterReturnQueued = true;

    const { locationId, mode } = this._pvEncounter;
    const clearKey = `${CLEAR_PREFIX}${locationId}`;
    const wasCleared = globalThis.localStorage?.getItem(clearKey) === '1';
    const victory = result === 'victory';
    const firstClear = victory && !wasCleared;

    try {
      if (victory) globalThis.localStorage?.setItem(clearKey, '1');
      globalThis.localStorage?.setItem(RESULT_KEY, JSON.stringify({
        locationId,
        result,
        firstClear,
        mode,
        completedAt: Date.now()
      }));
      globalThis.localStorage?.removeItem(PENDING_KEY);
    } catch (_) { /* return still proceeds if storage is blocked */ }

    this.time.delayedCall(delayMs, () => {
      const q = new URLSearchParams({ pvreturn: locationId, pvresult: result });
      globalThis.location.href = `./hybrid-overworld.html?${q.toString()}`;
    });
  }

  _onVictory() {
    super._onVictory();
    // Keep the existing victory presentation/audio visible before returning.
    this._queueEncounterReturn('victory', 2300);
  }

  _onDefeat() {
    super._onDefeat();
    // A failed route never marks the location clear, but it should not strand
    // the player in the battle scene. Preserve the defeat beat, then return.
    this._queueEncounterReturn('defeat', 2300);
  }
}
