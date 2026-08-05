// The Prismatic Veil — enemy catalog.
//
// The base Wraith data still comes from BattleConfig.js. This catalog
// adds a stable enemy id/view/audio identity and overlays Hushling data
// when selected.

export const ENEMY_IDS = Object.freeze({
  wraith: 'wraith',
  hushling: 'hushling'
});

// The gauntlet order: beating the last one loops back to the first, so
// this never dead-ends as more enemies join the roster.
export const ENEMY_ORDER = Object.freeze([ENEMY_IDS.wraith, ENEMY_IDS.hushling]);

export function nextEnemyId(id) {
  const i = ENEMY_ORDER.indexOf(id);
  return ENEMY_ORDER[(i + 1) % ENEMY_ORDER.length] || ENEMY_ORDER[0];
}

const HUSHLING = Object.freeze({
  id: ENEMY_IDS.hushling,
  viewId: ENEMY_IDS.hushling,
  audioBank: ENEMY_IDS.hushling,
  name: 'Hushling',
  hp: 52,
  maxHp: 52,
  portrait: 'portrait_hushling',
  accent: 0xe24145,
  frameColourway: 'violet',
  attack: Object.freeze({
    name: 'Hush Crush',
    damage: 12,
    critChance: 0.12,
    critMultiplier: 2
  })
});

// Resolution order: an explicit override (the in-game switch button, or
// a gauntlet advance on victory — both come in via the scene registry,
// same mechanism as the hero switch) beats the URL's `?enemy=`, which
// beats the default Wraith.
export function requestedEnemyId(search = '', override = null) {
  if (override && ENEMY_ORDER.includes(override)) return override;
  const raw = new URLSearchParams(search).get('enemy');
  return raw === ENEMY_IDS.hushling ? ENEMY_IDS.hushling : ENEMY_IDS.wraith;
}

export function selectEnemy(baseEnemy, search = '', override = null) {
  const id = requestedEnemyId(search, override);
  if (id === ENEMY_IDS.hushling) {
    return {
      ...HUSHLING,
      attack: { ...HUSHLING.attack }
    };
  }

  return {
    ...baseEnemy,
    id: ENEMY_IDS.wraith,
    viewId: ENEMY_IDS.wraith,
    audioBank: ENEMY_IDS.wraith,
    attack: { ...baseEnemy.attack }
  };
}
