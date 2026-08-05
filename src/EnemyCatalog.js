// The Prismatic Veil — v33 enemy catalog.
//
// The base Wraith data still comes from BattleConfig.js. This catalog
// adds a stable enemy id/view/audio identity and overlays Hushling data
// when ?enemy=hushling is present.

export const ENEMY_IDS = Object.freeze({
  wraith: 'wraith',
  hushling: 'hushling'
});

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

export function requestedEnemyId(search = '') {
  const raw = new URLSearchParams(search).get('enemy');
  return raw === ENEMY_IDS.hushling ? ENEMY_IDS.hushling : ENEMY_IDS.wraith;
}

export function selectEnemy(baseEnemy, search = '') {
  const id = requestedEnemyId(search);
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
