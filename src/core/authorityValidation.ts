import type { AttackAuthorityContract } from './contracts';

export interface AuthorityValidationResult {
  valid: boolean;
  errors: readonly string[];
}

export function validateAttackAuthority(authority: AttackAuthorityContract): AuthorityValidationResult {
  const errors: string[] = [];

  if (authority.current !== true) errors.push('authority must be marked current');
  if (authority.frameCount !== 6) errors.push('current Party Battle attack authority must have six frames');

  const markerNames = ['gather', 'release', 'impact', 'recover'] as const;
  for (const marker of markerNames) {
    const frames = authority.markerFrames[marker];
    if (frames.length === 0) errors.push(`${marker} marker must contain at least one frame`);
    for (const frame of frames) {
      if (!Number.isInteger(frame) || frame < 0 || frame >= authority.frameCount) {
        errors.push(`${marker} marker frame ${frame} is outside attack frame range`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
