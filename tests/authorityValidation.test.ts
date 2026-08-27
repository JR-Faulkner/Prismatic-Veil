import { describe, expect, it } from 'vitest';
import type { AttackAuthorityContract } from '../src/core/contracts';
import { validateAttackAuthority } from '../src/core/authorityValidation';

const valid: AttackAuthorityContract = {
  heroId: 'kineza',
  authorityId: 'kineza-attack-master-a',
  mode: 'sheet',
  frameCount: 6,
  markerFrames: { gather: [0, 1], release: [2], impact: [3, 4], recover: [5] },
  current: true
};

describe('validateAttackAuthority', () => {
  it('accepts a complete six-frame current authority', () => {
    expect(validateAttackAuthority(valid)).toEqual({ valid: true, errors: [] });
  });

  it('rejects missing event markers', () => {
    const broken = {
      ...valid,
      markerFrames: { ...valid.markerFrames, recover: [] }
    } satisfies AttackAuthorityContract;
    const result = validateAttackAuthority(broken);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('recover marker must contain at least one frame');
  });

  it('rejects marker frames outside the six-frame sequence', () => {
    const broken = {
      ...valid,
      markerFrames: { ...valid.markerFrames, impact: [6] }
    } satisfies AttackAuthorityContract;
    expect(validateAttackAuthority(broken).valid).toBe(false);
  });
});
