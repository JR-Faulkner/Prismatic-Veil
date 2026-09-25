// LIVE29F encounter bridge.
// Keeps LIVE28K27 as the untouched combat/render authority and adds only
// Overworld encounter completion/return behavior when the battle was entered
// from a location route.
import Live28K27BattleGuardScene from './Live28K27BattleGuardScene.js?v=live29f1';
import { applyEncounterReward } from '../progression/PVProgression.js?v=live30e1';

const CLEAR_PREFIX = 'pv.locationClear.';
const RESULT_KEY = 'pv.encounterResult';
const PENDING_KEY = 'pv.pendingEncounter';
const RETURN_LABEL = 'RETURN TO MAP';

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
}

function encounterReturnUrl(locationId, result) {
  const q = new URLSearchParams({ pvreturn: locationId, pvresult: result });
  return `./hybrid-overworld.html?${q.toString()}`;
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

    const { locationId, mode, enteredAt } = this._pvEncounter;
    const clearKey = `${CLEAR_PREFIX}${locationId}`;
    const wasCleared = globalThis.localStorage?.getItem(clearKey) === '1';
    const victory = result === 'victory';
    const firstClear = victory && !wasCleared;
    let payout = null;

    // LIVE30E owns persistence/reward bookkeeping only. K27 still owns every
    // combat frame, damage decision, cinematic, result beat, and audio handoff.
    if (victory) {
      try {
        payout = applyEncounterReward(locationId, {
          firstClear,
          mode,
          enteredAt,
          encounterId: `${locationId}:${enteredAt}`
        });
      } catch (err) {
        console.warn('[PV] progression payout failed; encounter return will continue', err);
      }
    }

    try {
      if (victory) globalThis.localStorage?.setItem(clearKey, '1');
      globalThis.localStorage?.setItem(RESULT_KEY, JSON.stringify({
        locationId,
        result,
        firstClear,
        mode,
        payout,
        completedAt: Date.now()
      }));
      globalThis.localStorage?.removeItem(PENDING_KEY);
    } catch (_) { /* return still proceeds if storage is blocked */ }

    const returnUrl = encounterReturnUrl(locationId, result);
    globalThis.__PV_ENCOUNTER_RETURN_URL__ = returnUrl;
    globalThis.__PV_ENCOUNTER_RETURN_LABEL__ = RETURN_LABEL;

    const patchResultCard = () => {
      const resultPanel = globalThis.document?.getElementById?.('result');
      const actions = resultPanel?.querySelector?.('.result-actions');
      const link = actions?.querySelector?.('a');
      if (!link) return false;
      link.href = returnUrl;
      link.textContent = RETURN_LABEL;
      link.setAttribute('data-pv-return-map', '1');
      link.setAttribute('aria-label', 'Return to the Prismatic Veil overworld map');
      return true;
    };

    this.time.delayedCall(Math.max(120, delayMs || 0), () => {
      if (patchResultCard()) return;
      const timer = globalThis.setInterval?.(() => {
        if (patchResultCard()) globalThis.clearInterval?.(timer);
      }, 180);
      if (timer) globalThis.setTimeout?.(() => globalThis.clearInterval?.(timer), 3600);
    });
  }

  _onVictory() {
    super._onVictory();
    // Keep the existing victory presentation/audio visible, then expose an explicit map return.
    this._queueEncounterReturn('victory', 520);
  }

  _onDefeat() {
    super._onDefeat();
    // A failed route never marks the location clear, never awards progression,
    // and never strands the player in battle. Preserve the defeat beat, then expose map return.
    this._queueEncounterReturn('defeat', 520);
  }
}
