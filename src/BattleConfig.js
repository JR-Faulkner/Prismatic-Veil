export const BATTLE_CONFIG = Object.freeze({
  hero: Object.freeze({
    id: 'prismel',
    name: 'Prismel',
    hp: 100,
    maxHp: 100,
    veil: 100,
    portrait: 'portrait_prismel',
    attack: Object.freeze({
      name: 'Prismatic Release',
      damage: 14,
      flavor: 'Crystal energy gathers...',
      critChance: 0.25,
      critMultiplier: 2
    })
  }),
  enemy: Object.freeze({
    id: 'veil-wraith',
    name: 'Veil Wraith',
    hp: 30,
    maxHp: 30,
    portrait: null,
    attack: Object.freeze({
      name: 'Veil Lash',
      damage: 9,
      critChance: 0.15,
      critMultiplier: 2
    })
  }),
  text: Object.freeze({
    playerTurn: 'PLAYER TURN',
    enemyTurn: 'ENEMY TURN'
  })
});
