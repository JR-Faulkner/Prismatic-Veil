// LIVE30E progression state + encounter payout authority.
//
// Purpose: make the Overworld -> encounter -> reward -> Party loop real without
// prematurely locking the final level curve or per-level stat-point economy.
// Natural-growth profiles remain owned by the Party UI authority.

export const PROGRESSION_STORAGE_KEY = 'pv.progression.v1';
export const PROGRESSION_SCHEMA = 1;

export const CORE_BATTLE_BEARERS = Object.freeze(['prismel', 'auryi', 'kineza']);
export const ALL_BEARERS = Object.freeze(['prismel', 'auryi', 'kineza', 'sarallel', 'vyan']);

// TUNING NOTE: XP payout is deliberately isolated here so it can be rebalanced
// without changing persistence, battle resolution, or the locked stat-growth split.
// The level curve remains intentionally unlocked until production balance authority
// is established. XP is banked now and will survive that later curve assignment.
export const PROGRESSION_TUNING = Object.freeze({
  revision: 'live30e-provisional1',
  levelCurveLocked: false,
  encounters: Object.freeze({
    echo: Object.freeze({
      firstClear: Object.freeze({ xpEach: 50, items: Object.freeze({ veilShard: 1, memoryFragment: 1 }) }),
      repeat: Object.freeze({ xpEach: 20, items: Object.freeze({}) })
    })
  })
});

const now = () => Date.now();
const asInt = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : fallback;

function blankHero() {
  return { level: null, xp: 0 };
}

export function createDefaultProgression() {
  return {
    schema: PROGRESSION_SCHEMA,
    tuningRevision: PROGRESSION_TUNING.revision,
    levelCurveLocked: PROGRESSION_TUNING.levelCurveLocked,
    heroes: Object.fromEntries(ALL_BEARERS.map(id => [id, blankHero()])),
    inventory: { veilShard: 0, memoryFragment: 0 },
    encounters: {},
    claims: {},
    updatedAt: now()
  };
}

function normalize(raw) {
  const base = createDefaultProgression();
  const src = raw && typeof raw === 'object' ? raw : {};
  for (const id of ALL_BEARERS) {
    const h = src.heroes?.[id];
    base.heroes[id] = {
      level: Number.isFinite(Number(h?.level)) ? Math.max(1, Math.floor(Number(h.level))) : null,
      xp: asInt(h?.xp, 0)
    };
  }
  base.inventory.veilShard = asInt(src.inventory?.veilShard, 0);
  base.inventory.memoryFragment = asInt(src.inventory?.memoryFragment, 0);
  base.encounters = src.encounters && typeof src.encounters === 'object' ? { ...src.encounters } : {};
  base.claims = src.claims && typeof src.claims === 'object' ? { ...src.claims } : {};
  base.updatedAt = asInt(src.updatedAt, now());
  return base;
}

export function loadProgression(storage = globalThis.localStorage) {
  try {
    return normalize(JSON.parse(storage?.getItem(PROGRESSION_STORAGE_KEY) || 'null'));
  } catch (_) {
    return createDefaultProgression();
  }
}

export function saveProgression(state, storage = globalThis.localStorage) {
  const normalized = normalize(state);
  normalized.updatedAt = now();
  normalized.tuningRevision = PROGRESSION_TUNING.revision;
  normalized.levelCurveLocked = PROGRESSION_TUNING.levelCurveLocked;
  try { storage?.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(normalized)); } catch (_) {}
  return normalized;
}

function trimClaims(claims, max = 40) {
  const entries = Object.entries(claims || {}).sort((a, b) => asInt(b[1]?.at) - asInt(a[1]?.at));
  return Object.fromEntries(entries.slice(0, max));
}

export function applyEncounterReward(locationId, options = {}, storage = globalThis.localStorage) {
  const state = loadProgression(storage);
  const table = PROGRESSION_TUNING.encounters[locationId];
  if (!table) return { awarded: false, reason: 'no-reward-table', locationId };

  const firstClear = !!options.firstClear;
  const encounterId = String(options.encounterId || `${locationId}:${options.enteredAt || now()}`);
  if (state.claims[encounterId]) {
    return { ...state.claims[encounterId].payout, awarded: false, duplicate: true };
  }

  const reward = firstClear ? table.firstClear : table.repeat;
  const xpEach = asInt(reward.xpEach, 0);
  const heroXp = {};
  for (const id of CORE_BATTLE_BEARERS) {
    state.heroes[id].xp += xpEach;
    heroXp[id] = state.heroes[id].xp;
  }

  const items = {};
  for (const [id, qtyRaw] of Object.entries(reward.items || {})) {
    const qty = asInt(qtyRaw, 0);
    if (!qty) continue;
    state.inventory[id] = asInt(state.inventory[id], 0) + qty;
    items[id] = qty;
  }

  const encounter = state.encounters[locationId] && typeof state.encounters[locationId] === 'object'
    ? { ...state.encounters[locationId] }
    : { wins: 0, firstClearClaimed: false };
  encounter.wins = asInt(encounter.wins, 0) + 1;
  if (firstClear) encounter.firstClearClaimed = true;
  encounter.lastWinAt = now();
  state.encounters[locationId] = encounter;

  const payout = {
    awarded: true,
    locationId,
    firstClear,
    xpEach,
    bearers: [...CORE_BATTLE_BEARERS],
    heroXp,
    items,
    levelCurveLocked: PROGRESSION_TUNING.levelCurveLocked,
    tuningRevision: PROGRESSION_TUNING.revision
  };
  state.claims[encounterId] = { at: now(), payout };
  state.claims = trimClaims(state.claims);
  saveProgression(state, storage);
  return payout;
}

export function progressionSummary(storage = globalThis.localStorage) {
  const state = loadProgression(storage);
  return {
    schema: state.schema,
    tuningRevision: state.tuningRevision,
    levelCurveLocked: state.levelCurveLocked,
    heroes: structuredClone ? structuredClone(state.heroes) : JSON.parse(JSON.stringify(state.heroes)),
    inventory: { ...state.inventory },
    encounters: JSON.parse(JSON.stringify(state.encounters || {}))
  };
}
