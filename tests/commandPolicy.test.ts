import { describe, expect, it } from 'vitest';
import { deriveCommandAvailability } from '../src/core/commandPolicy';

describe('deriveCommandAvailability', () => {
  it('disables every command for a dead hero', () => {
    expect(deriveCommandAvailability({
      alive: false, currentRp: 99, resonartCost: 20, guarding: false, currentHp: 0, maxHp: 100
    })).toEqual({ attack: false, resonart: false, guard: false, item: false });
  });

  it('gates Resonart by RP without affecting basic attack', () => {
    expect(deriveCommandAvailability({
      alive: true, currentRp: 19, resonartCost: 20, guarding: false, currentHp: 80, maxHp: 100
    })).toMatchObject({ attack: true, resonart: false });
  });

  it('disables Guard while already guarding', () => {
    expect(deriveCommandAvailability({
      alive: true, currentRp: 20, resonartCost: 20, guarding: true, currentHp: 80, maxHp: 100
    }).guard).toBe(false);
  });

  it('enables Item only when HP is missing', () => {
    const full = deriveCommandAvailability({
      alive: true, currentRp: 20, resonartCost: 20, guarding: false, currentHp: 100, maxHp: 100
    });
    const damaged = deriveCommandAvailability({
      alive: true, currentRp: 20, resonartCost: 20, guarding: false, currentHp: 99, maxHp: 100
    });
    expect(full.item).toBe(false);
    expect(damaged.item).toBe(true);
  });
});
