// Small, read-only content authority shared by battle, progression, and
// reference surfaces. Keep player-facing names here so a title cannot drift
// between the Overworld, battle HUD, victory card, and Prismodial Grimoire.
export const PV_BEARERS = Object.freeze({
  prismel: Object.freeze({
    id: 'prismel', name: 'Prismel', title: 'Prism Weaver',
    basicAttack: 'Refractive Burst', resonart: 'Refracted-Reflections'
  }),
  auryi: Object.freeze({
    id: 'auryi', name: 'Auryi', title: 'Aura Spoken',
    basicAttack: 'Aurorb Slice', resonart: 'Aurora Pulse'
  }),
  kineza: Object.freeze({
    id: 'kineza', name: 'Kineza', title: 'Momentum Born',
    basicAttack: 'Momentum Fist', resonart: 'Thunder Tornado'
  })
});

export const PV_LOCATIONS = Object.freeze({
  whisperingGrove: 'Whispering Grove',
  resonanceTower: 'Resonance Tower',
  echoCastle: 'Echo Castle',
  frigidHills: 'Frigid Hills'
});

export const PV_ENEMIES = Object.freeze({
  veilWraith: 'Veil Wraith',
  hushling: 'Hushling'
});

export const PV_PROGRESSION = Object.freeze({
  resonartUnlockLevel: 2,
  firstEncounterXp: 100
});

