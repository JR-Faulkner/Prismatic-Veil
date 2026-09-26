// LIVE29F encounter bridge.
// Keeps LIVE28K27 as the untouched combat/render authority and adds only
// Overworld encounter completion/return behavior when the battle was entered
// from a location route.
import Live28K27BattleGuardScene from './Live28K27BattleGuardScene.js?v=live29f1';
import { applyEncounterReward, isResonartUnlocked, loadProgression } from '../progression/PVProgression.js?v=live30e3';

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

  _pvResonartUnlocked() {
    const state = loadProgression(globalThis.localStorage);
    const hero = state.heroes?.[this.activeHeroId];
    return isResonartUnlocked(hero);
  }

  _confirmDrawer() {
    if (this._drawerOpen === 'Resonart' && !this._pvResonartUnlocked()) {
      this._setBanner('Resonart sealed · reach Level 2 to awaken it.');
      this.audio?.uiReject?.();
      return;
    }
    return super._confirmDrawer();
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

    // The player can leave the result screen for MAIN before the map shell
    // gets a chance to run its normal autosave. Snapshot the completed route
    // here as well so CONTINUE cannot restore a pre-encounter run over a
    // freshly recorded Whispering Grove clear and reward ledger.
    try { globalThis.PVSaveState?.saveRun?.(); } catch (_) { /* map autosave remains the fallback */ }

    const returnToOverworld = () => {
      const q = new URLSearchParams({ pvreturn: locationId, pvresult: result });
      globalThis.location.href = `./hybrid-overworld.html?${q.toString()}`;
    };

    // Hybrid has a real victory/results overlay with explicit navigation.
    // Do not tear that screen down on a timer. It stays until the player
    // chooses VIEW LEVEL-UP, RETURN TO MAP, or MENU. Defeat and direct
    // non-Hybrid routes keep their timed fallback so no route can strand.
    const hasResultOverlay = !!globalThis.document?.querySelector?.('#result');
    if (victory && hasResultOverlay) return;

    this.time.delayedCall(delayMs, returnToOverworld);
  }

  _onVictory() {
    super._onVictory();
    // Keep the existing victory presentation/audio visible before returning.
    this._queueEncounterReturn('victory', 2300);
  }

  _onDefeat() {
    super._onDefeat();
    // A failed route never marks the location clear, never awards progression,
    // and never strands the player in battle. Preserve the defeat beat, return.
    this._queueEncounterReturn('defeat', 2300);
  }
}


