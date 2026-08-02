export const BATTLE_CONFIG = Object.freeze({
  hero: Object.freeze({
    id: 'prismel',
    name: 'Prismel',
    hp: 100,
    maxHp: 100,
    veil: 100,
    attack: Object.freeze({
      name: 'Prismatic Release',
      damage: 14,
      flavor: 'Crystal energy gathers...'
    })
  }),
  enemy: Object.freeze({
    id: 'veil-wraith',
    name: 'Veil Wraith',
    hp: 30,
    maxHp: 30,
    attack: Object.freeze({
      name: 'Veil Lash',
      damage: 9
    })
  }),
  text: Object.freeze({
    playerTurn: 'PLAYER TURN',
    enemyTurn: 'ENEMY TURN'
  })
});
