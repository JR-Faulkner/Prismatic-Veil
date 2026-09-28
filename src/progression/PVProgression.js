// LIVE31E progression, stat-growth, and skill-map authority.
// Existing XP remains under the stable pv.progression.v1 storage key.
// Schema 3 makes level thresholds cumulative and records non-battle progress.

export const PROGRESSION_STORAGE_KEY = 'pv.progression.v1';
export const PROGRESSION_SCHEMA = 3;

export const CORE_BATTLE_BEARERS = Object.freeze(['prismel', 'auryi', 'kineza']);
export const ALL_BEARERS = Object.freeze(['prismel', 'auryi', 'kineza', 'sarallel', 'vyan']);
export const RESONART_UNLOCK_LEVEL = 2;
export const STAT_KEYS = Object.freeze(['Might', 'Mind', 'Spirit', 'Agility', 'Resilience', 'Harmony']);

export const NATURAL_GROWTH = Object.freeze({
  prismel: Object.freeze({ Might: 1, Mind: 5, Spirit: 4, Agility: 3, Resilience: 2, Harmony: 3 }),
  kineza: Object.freeze({ Might: 5, Mind: 2, Spirit: 2, Agility: 4, Resilience: 4, Harmony: 3 }),
  auryi: Object.freeze({ Might: 1, Mind: 4, Spirit: 5, Agility: 2, Resilience: 3, Harmony: 5 })
});

// Prismel's deterministic Level 2 gains produce the approved Ascension mock's
// 12 / 16 / 15 / 13 / 14 / 12 stat row.
export const BASE_STATS = Object.freeze({
  prismel: Object.freeze({ Might: 12, Mind: 15, Spirit: 14, Agility: 12, Resilience: 14, Harmony: 12 }),
  kineza: Object.freeze({ Might: 15, Mind: 11, Spirit: 11, Agility: 14, Resilience: 14, Harmony: 12 }),
  auryi: Object.freeze({ Might: 10, Mind: 14, Spirit: 15, Agility: 11, Resilience: 13, Harmony: 15 }),
  sarallel: Object.freeze({ Might: 11, Mind: 16, Spirit: 15, Agility: 13, Resilience: 12, Harmony: 16 }),
  vyan: Object.freeze({ Might: 14, Mind: 15, Spirit: 14, Agility: 15, Resilience: 15, Harmony: 13 })
});

const NATURAL_ROTATION = Object.freeze({
  prismel: Object.freeze(['Mind', 'Spirit', 'Agility', 'Harmony', 'Mind', 'Spirit', 'Resilience', 'Mind', 'Agility', 'Harmony']),
  kineza: Object.freeze(['Might', 'Agility', 'Resilience', 'Might', 'Harmony', 'Agility', 'Resilience', 'Might', 'Mind', 'Spirit']),
  auryi: Object.freeze(['Spirit', 'Harmony', 'Mind', 'Spirit', 'Harmony', 'Resilience', 'Mind', 'Spirit', 'Harmony', 'Agility'])
});

export const SKILL_NODES = Object.freeze({
  prismel: Object.freeze([
    Object.freeze({ id: 'prism_focus', branch: 'identity', name: 'Prism Focus', description: 'Refractive Burst gains +4% accuracy.', cost: 1, requires: null }),
    Object.freeze({ id: 'split_spectrum', branch: 'identity', name: 'Split Spectrum', description: 'Refracted-Reflections opens a second mastery path.', cost: 1, requires: 'prism_focus' }),
    Object.freeze({ id: 'guiding_light', branch: 'bond', name: 'Guiding Light', description: 'While Prismel is Leader, party basic attacks gain +2% accuracy.', cost: 1, requires: null }),
    Object.freeze({ id: 'shared_lens', branch: 'bond', name: 'Shared Lens', description: 'Allies read Prismel’s refracted openings more clearly.', cost: 1, requires: 'guiding_light' }),
    Object.freeze({ id: 'resonance_sight', branch: 'veilcraft', name: 'Resonance Sight', description: 'Tower rings reveal the shortest rotation toward their target glyphs.', cost: 1, requires: null }),
    Object.freeze({ id: 'scriptweave', branch: 'veilcraft', name: 'Scriptweave', description: 'Makes partially synchronized Grimoire script more readable.', cost: 1, requires: 'resonance_sight' })
  ]),
  kineza: Object.freeze([
    Object.freeze({ id: 'momentum_drive', branch: 'identity', name: 'Momentum Drive', description: 'Kineza carries more force through consecutive actions.', cost: 1, requires: null }),
    Object.freeze({ id: 'breakthrough', branch: 'identity', name: 'Breakthrough', description: 'Momentum techniques press harder against guarded targets.', cost: 1, requires: 'momentum_drive' }),
    Object.freeze({ id: 'rally_link', branch: 'bond', name: 'Rally Link', description: 'Raises assist readiness after Kineza takes action.', cost: 1, requires: null }),
    Object.freeze({ id: 'tandem_rush', branch: 'bond', name: 'Tandem Rush', description: 'Linked attacks preserve part of Kineza’s momentum.', cost: 1, requires: 'rally_link' }),
    Object.freeze({ id: 'impact_sense', branch: 'veilcraft', name: 'Impact Sense', description: 'Reads unstable routes and physical resonance points.', cost: 1, requires: null }),
    Object.freeze({ id: 'kinetic_key', branch: 'veilcraft', name: 'Kinetic Key', description: 'Allows momentum to activate certain dormant mechanisms.', cost: 1, requires: 'impact_sense' })
  ]),
  auryi: Object.freeze([
    Object.freeze({ id: 'aurora_focus', branch: 'identity', name: 'Aurora Focus', description: 'Auryi holds a denser Aurora field before release.', cost: 1, requires: null }),
    Object.freeze({ id: 'horizon_pulse', branch: 'identity', name: 'Horizon Pulse', description: 'Aurora Pulse expands farther through the field.', cost: 1, requires: 'aurora_focus' }),
    Object.freeze({ id: 'warm_accord', branch: 'bond', name: 'Warm Accord', description: 'Healing and buffs gain strength from party Harmony.', cost: 1, requires: null }),
    Object.freeze({ id: 'united_radiance', branch: 'bond', name: 'United Radiance', description: 'Linked support effects linger for an additional beat.', cost: 1, requires: 'warm_accord' }),
    Object.freeze({ id: 'aura_reading', branch: 'veilcraft', name: 'Aura Reading', description: 'Reveals emotional and living resonance traces.', cost: 1, requires: null }),
    Object.freeze({ id: 'veil_lantern', branch: 'veilcraft', name: 'Veil Lantern', description: 'Illuminates concealed resonance paths and warnings.', cost: 1, requires: 'aura_reading' })
  ])
});

export const PROGRESSION_TUNING = Object.freeze({
  revision: 'live31e-progression1',
  levelCurveLocked: true,
  levelCurve: Object.freeze({ baseXp: 100, growth: 1.35, maxLevel: 50 }),
  encounters: Object.freeze({
    whisper: Object.freeze({
      firstClear: Object.freeze({ xpEach: 100, items: Object.freeze({ veilShard: 1, memoryFragment: 1 }) }),
      repeat: Object.freeze({ xpEach: 20, items: Object.freeze({}) })
    }),
    echo: Object.freeze({
      firstClear: Object.freeze({ xpEach: 100, items: Object.freeze({ veilShard: 1, memoryFragment: 1 }) }),
      repeat: Object.freeze({ xpEach: 20, items: Object.freeze({}) })
    })
  }),
  activities: Object.freeze({
    'tower:ring-console': Object.freeze({ xpEach: 20, label: 'Echo Ring Console' }),
    'tower:harmonic-calibration': Object.freeze({ xpEach: 20, label: 'Harmonic Calibration' }),
    'tower:resonance-routing': Object.freeze({ xpEach: 35, label: 'Resonance Routing' })
  })
});

const now = () => Date.now();
const asInt = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : fallback;

export function xpForLevel(level) {
  const n = Math.max(1, Math.floor(Number(level) || 1));
  if (n <= 1) return 0;
  const { baseXp, growth } = PROGRESSION_TUNING.levelCurve;
  let total = 0;
  for (let target = 2; target <= n; target += 1) {
    total += Math.round(baseXp * Math.pow(growth, target - 2));
  }
  return total;
}

export function levelForXp(xp) {
  const value = asInt(xp, 0);
  const { maxLevel } = PROGRESSION_TUNING.levelCurve;
  let level = 1;
  while (level < maxLevel && value >= xpForLevel(level + 1)) level += 1;
  return level;
}

export function nextLevelXp(levelOrXp, fromXp = null) {
  const level = fromXp == null ? levelForXp(levelOrXp) : Math.max(1, Math.floor(Number(levelOrXp) || 1));
  return xpForLevel(Math.min(PROGRESSION_TUNING.levelCurve.maxLevel, level + 1));
}

export function isResonartUnlocked(levelOrHero) {
  const level = typeof levelOrHero === 'object'
    ? (levelOrHero?.level || levelForXp(levelOrHero?.xp))
    : levelOrHero;
  return Math.max(1, Math.floor(Number(level) || 1)) >= RESONART_UNLOCK_LEVEL;
}

function naturalGainCount(level) {
  return level <= 1 ? 0 : (level % 2 === 0 ? 3 : 2);
}

export function naturalGainsForLevel(heroId, level) {
  const rotation = NATURAL_ROTATION[heroId] || STAT_KEYS;
  const n = Math.max(1, asInt(level, 1));
  if (n <= 1) return [];
  let offset = 0;
  for (let prior = 2; prior < n; prior += 1) offset += naturalGainCount(prior);
  return Array.from({ length: naturalGainCount(n) }, (_, index) => rotation[(offset + index) % rotation.length]);
}

export function naturalStatsForLevel(heroId, level) {
  const base = BASE_STATS[heroId] || Object.fromEntries(STAT_KEYS.map(stat => [stat, 10]));
  const stats = Object.fromEntries(STAT_KEYS.map(stat => [stat, asInt(base[stat], 10)]));
  const n = Math.max(1, asInt(level, 1));
  for (let current = 2; current <= n; current += 1) {
    for (const stat of naturalGainsForLevel(heroId, current)) stats[stat] += 1;
  }
  return stats;
}

function normalizeAllocations(raw) {
  return Object.fromEntries(STAT_KEYS.map(stat => [stat, asInt(raw?.[stat], 0)]));
}

function nodeIdsFor(heroId) {
  return new Set((SKILL_NODES[heroId] || []).map(node => node.id));
}

function normalizeHero(heroId, raw, sourceSchema = PROGRESSION_SCHEMA) {
  let xp = asInt(raw?.xp, 0);
  const recordedLevel = raw?.level == null || raw?.level === '' ? 1 : Math.max(1, asInt(raw.level, 1));
  // Schema 1/2 compared total XP against non-cumulative thresholds. Preserve
  // every already-earned level by moving legacy XP to the equivalent schema-3
  // threshold once; never lower a Bearer during migration.
  if (asInt(sourceSchema, 1) < 3 && recordedLevel > levelForXp(xp)) {
    xp = Math.max(xp, xpForLevel(recordedLevel));
  }
  const effectiveLevel = levelForXp(xp);
  const focusAllocations = normalizeAllocations(raw?.focusAllocations);
  const allowed = nodeIdsFor(heroId);
  const unlockedNodes = [...new Set(Array.isArray(raw?.unlockedNodes) ? raw.unlockedNodes.filter(id => allowed.has(id)) : [])];
  const natural = naturalStatsForLevel(heroId, effectiveLevel);
  const stats = Object.fromEntries(STAT_KEYS.map(stat => [stat, natural[stat] + focusAllocations[stat]]));
  const focusEarned = Math.max(0, effectiveLevel - 1) + asInt(raw?.bonusFocusPoints, 0);
  const focusSpent = STAT_KEYS.reduce((sum, stat) => sum + focusAllocations[stat], 0);
  const skillEarned = Math.floor(effectiveLevel / 2) + asInt(raw?.bonusSkillPoints, 0);
  const skillSpent = unlockedNodes.reduce((sum, id) => sum + asInt((SKILL_NODES[heroId] || []).find(node => node.id === id)?.cost, 1), 0);
  return {
    level: effectiveLevel,
    xp,
    stats,
    focusAllocations,
    focusPoints: Math.max(0, focusEarned - focusSpent),
    skillPoints: Math.max(0, skillEarned - skillSpent),
    unlockedNodes,
    bonusFocusPoints: asInt(raw?.bonusFocusPoints, 0),
    bonusSkillPoints: asInt(raw?.bonusSkillPoints, 0)
  };
}

function blankHero(heroId) {
  return normalizeHero(heroId, { level: 1, xp: 0 });
}

export function createDefaultProgression() {
  return {
    schema: PROGRESSION_SCHEMA,
    tuningRevision: PROGRESSION_TUNING.revision,
    levelCurveLocked: PROGRESSION_TUNING.levelCurveLocked,
    heroes: Object.fromEntries(ALL_BEARERS.map(id => [id, blankHero(id)])),
    inventory: { veilShard: 0, memoryFragment: 0 },
    encounters: {},
    activities: {},
    claims: {},
    updatedAt: now()
  };
}

function normalize(raw) {
  const base = createDefaultProgression();
  const src = raw && typeof raw === 'object' ? raw : {};
  const sourceSchema = asInt(src.schema, 1);
  for (const id of ALL_BEARERS) base.heroes[id] = normalizeHero(id, src.heroes?.[id], sourceSchema);
  base.inventory.veilShard = asInt(src.inventory?.veilShard, 0);
  base.inventory.memoryFragment = asInt(src.inventory?.memoryFragment, 0);
  base.encounters = src.encounters && typeof src.encounters === 'object' ? { ...src.encounters } : {};
  base.activities = src.activities && typeof src.activities === 'object' ? { ...src.activities } : {};
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
  normalized.schema = PROGRESSION_SCHEMA;
  normalized.updatedAt = now();
  normalized.tuningRevision = PROGRESSION_TUNING.revision;
  normalized.levelCurveLocked = PROGRESSION_TUNING.levelCurveLocked;
  try { storage?.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(normalized)); } catch (_) {}
  return normalized;
}

export function allocateFocus(heroId, stat, storage = globalThis.localStorage) {
  if (!ALL_BEARERS.includes(heroId) || !STAT_KEYS.includes(stat)) return { ok: false, reason: 'invalid-selection' };
  const state = loadProgression(storage);
  const hero = state.heroes[heroId];
  if (!hero?.focusPoints) return { ok: false, reason: 'no-focus-points', hero };
  hero.focusAllocations[stat] = asInt(hero.focusAllocations[stat], 0) + 1;
  const saved = saveProgression(state, storage);
  return { ok: true, hero: saved.heroes[heroId], stat };
}

export function unlockSkillNode(heroId, nodeId, storage = globalThis.localStorage) {
  const node = (SKILL_NODES[heroId] || []).find(candidate => candidate.id === nodeId);
  if (!node) return { ok: false, reason: 'unknown-node' };
  const state = loadProgression(storage);
  const hero = state.heroes[heroId];
  if (hero.unlockedNodes.includes(nodeId)) return { ok: false, reason: 'already-unlocked', hero, node };
  if (node.requires && !hero.unlockedNodes.includes(node.requires)) return { ok: false, reason: 'prerequisite', hero, node };
  if (hero.skillPoints < node.cost) return { ok: false, reason: 'no-skill-points', hero, node };
  hero.unlockedNodes.push(nodeId);
  const saved = saveProgression(state, storage);
  return { ok: true, hero: saved.heroes[heroId], node };
}

function trimClaims(claims, max = 40) {
  const entries = Object.entries(claims || {}).sort((a, b) => asInt(b[1]?.at) - asInt(a[1]?.at));
  return Object.fromEntries(entries.slice(0, max));
}

function awardCoreXp(state, xpEach) {
  const heroXpBefore = {};
  const heroXp = {};
  const levelUps = {};
  const growth = {};
  for (const id of CORE_BATTLE_BEARERS) {
    const hero = state.heroes[id];
    const beforeXp = asInt(hero.xp, 0);
    const beforeLevel = levelForXp(beforeXp);
    heroXpBefore[id] = beforeXp;
    hero.xp = beforeXp + xpEach;
    hero.level = levelForXp(hero.xp);
    state.heroes[id] = normalizeHero(id, hero);
    const afterLevel = state.heroes[id].level;
    const naturalByLevel = [];
    for (let level = beforeLevel + 1; level <= afterLevel; level += 1) {
      naturalByLevel.push({ level, stats: naturalGainsForLevel(id, level) });
    }
    heroXp[id] = state.heroes[id].xp;
    levelUps[id] = Math.max(0, afterLevel - beforeLevel);
    growth[id] = {
      natural: naturalByLevel.flatMap(entry => entry.stats),
      naturalByLevel,
      focusPoints: state.heroes[id].focusPoints,
      skillPoints: state.heroes[id].skillPoints,
      stats: { ...state.heroes[id].stats }
    };
  }
  return {
    heroXpBefore,
    heroXp,
    levels: Object.fromEntries(CORE_BATTLE_BEARERS.map(id => [id, state.heroes[id].level])),
    levelUps,
    growth,
    nextLevelXp: Object.fromEntries(CORE_BATTLE_BEARERS.map(id => [id, nextLevelXp(state.heroes[id].level)])),
    unlocks: { resonart: Object.fromEntries(CORE_BATTLE_BEARERS.map(id => [id, isResonartUnlocked(state.heroes[id])])) }
  };
}

export function applyEncounterReward(locationId, options = {}, storage = globalThis.localStorage) {
  const state = loadProgression(storage);
  const table = PROGRESSION_TUNING.encounters[locationId];
  if (!table) return { awarded: false, reason: 'no-reward-table', locationId };
  const encounterId = String(options.encounterId || `${locationId}:${options.enteredAt || now()}`);
  if (state.claims[encounterId]) return { ...state.claims[encounterId].payout, awarded: false, duplicate: true };

  const encounter = state.encounters[locationId] && typeof state.encounters[locationId] === 'object'
    ? { ...state.encounters[locationId] }
    : { wins: 0, firstClearClaimed: false };
  const firstClear = !!options.firstClear && encounter.firstClearClaimed !== true;
  const reward = firstClear ? table.firstClear : table.repeat;
  const xpEach = asInt(reward.xpEach, 0);
  const advancement = awardCoreXp(state, xpEach);

  const items = {};
  for (const [id, qtyRaw] of Object.entries(reward.items || {})) {
    const qty = asInt(qtyRaw, 0);
    if (!qty) continue;
    state.inventory[id] = asInt(state.inventory[id], 0) + qty;
    items[id] = qty;
  }

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
    ...advancement,
    items,
    levelCurveLocked: PROGRESSION_TUNING.levelCurveLocked,
    tuningRevision: PROGRESSION_TUNING.revision
  };
  state.claims[encounterId] = { at: now(), payout };
  state.claims = trimClaims(state.claims);
  saveProgression(state, storage);
  return payout;
}

export function applyProgressReward(activityId, options = {}, storage = globalThis.localStorage) {
  const activity = PROGRESSION_TUNING.activities[activityId];
  if (!activity) return { awarded: false, reason: 'no-activity-table', activityId };
  const state = loadProgression(storage);
  const claimId = String(options.claimId || `activity:${activityId}`);
  if (state.claims[claimId]) return { ...state.claims[claimId].payout, awarded: false, duplicate: true };
  const xpEach = asInt(activity.xpEach, 0);
  const advancement = awardCoreXp(state, xpEach);
  const payout = {
    awarded: true,
    type: 'progress',
    activityId,
    label: activity.label,
    xpEach,
    bearers: [...CORE_BATTLE_BEARERS],
    ...advancement,
    levelCurveLocked: PROGRESSION_TUNING.levelCurveLocked,
    tuningRevision: PROGRESSION_TUNING.revision
  };
  state.activities[activityId] = {
    completed: true,
    completedAt: now(),
    xpEach
  };
  state.claims[claimId] = { at: now(), payout };
  state.claims = trimClaims(state.claims);
  saveProgression(state, storage);
  return payout;
}

export function progressionSummary(storage = globalThis.localStorage) {
  const state = loadProgression(storage);
  const clone = value => typeof globalThis.structuredClone === 'function' ? globalThis.structuredClone(value) : JSON.parse(JSON.stringify(value));
  return {
    schema: state.schema,
    tuningRevision: state.tuningRevision,
    levelCurveLocked: state.levelCurveLocked,
    heroes: clone(state.heroes),
    inventory: { ...state.inventory },
    encounters: clone(state.encounters || {}),
    activities: clone(state.activities || {})
  };
}
