import type {
  AttackAuthorityContract,
  PriZimRuntimeContract,
  RuntimeSurfaceContract
} from '../../src/core/contracts';

const attacks = {
  prismel: {
    heroId: 'prismel', authorityId: 'prismel-prismatic-shard-current', mode: 'frames', frameCount: 6,
    markerFrames: { gather: [0, 1], release: [3], impact: [4], recover: [5] }, current: true
  },
  auryi: {
    heroId: 'auryi', authorityId: 'auryi-attack-master-a', mode: 'sheet', frameCount: 6,
    markerFrames: { gather: [0, 1, 2], release: [3], impact: [4], recover: [5] }, current: true
  },
  kineza: {
    heroId: 'kineza', authorityId: 'kineza-attack-master-a', mode: 'sheet', frameCount: 6,
    markerFrames: { gather: [0, 1], release: [2], impact: [3, 4], recover: [5] }, current: true
  }
} satisfies Readonly<Record<'prismel' | 'auryi' | 'kineza', AttackAuthorityContract>>;

const surfaces = [
  { id: 'hybrid', path: './hybrid-battle-live.html', status: 'current', reachableFromCurrentMenu: true },
  { id: 'tactical-legacy', path: './tactical-field-v2-legacy.html', status: 'preserved-legacy', reachableFromCurrentMenu: false },
  { id: 'survival-legacy', path: './survival-legacy.html', status: 'preserved-legacy', reachableFromCurrentMenu: false }
] satisfies readonly RuntimeSurfaceContract[];

const probe: Pick<PriZimRuntimeContract, 'attacks' | 'surfaces'> = { attacks, surfaces };

const root = document.querySelector<HTMLElement>('#probe');
if (!root) throw new Error('PriZim modernization probe root is missing');

root.innerHTML = `
  <strong>PriZim Modernization Probe</strong>
  <span>TypeScript boundary: PASS</span>
  <span>Vite browser pipeline: PASS</span>
  <span>Current attack authorities: ${Object.keys(probe.attacks).length}</span>
  <span>Declared runtime surfaces: ${probe.surfaces.length}</span>
`;
