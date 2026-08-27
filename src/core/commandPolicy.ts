import type { CommandAvailability } from './contracts';

export interface CommandPolicyInput {
  alive: boolean;
  currentRp: number;
  resonartCost: number;
  guarding: boolean;
  currentHp: number;
  maxHp: number;
}

export function deriveCommandAvailability(input: CommandPolicyInput): CommandAvailability {
  const alive = input.alive;
  return {
    attack: alive,
    resonart: alive && input.currentRp >= input.resonartCost,
    guard: alive && !input.guarding,
    item: alive && input.currentHp < input.maxHp
  };
}
