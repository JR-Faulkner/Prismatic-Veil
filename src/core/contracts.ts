export type HeroId = 'prismel' | 'auryi' | 'kineza';
export type BattleActorId = HeroId | 'enemy';
export type CommandId = 'attack' | 'resonart' | 'guard' | 'item';
export type BattleOutcome = 'victory' | 'defeat' | null;

export interface HeroBattleState {
  id: HeroId;
  name: string;
  hp: number;
  maxHp: number;
  rp: number;
  maxRp: number;
  active: boolean;
  alive: boolean;
  guarding: boolean;
  portrait?: string;
}

export interface EnemyBattleState {
  name: string;
  hp: number;
  maxHp: number;
}

export interface CommandAvailability {
  attack: boolean;
  resonart: boolean;
  guard: boolean;
  item: boolean;
}

export interface BattleSnapshot {
  actor: BattleActorId | null;
  party: readonly HeroBattleState[];
  enemy: EnemyBattleState;
  available: CommandAvailability;
  railVisible: boolean;
  outcome: BattleOutcome;
  banner: string;
  lock: boolean;
  audioLocked: boolean;
}

export type AttackAuthorityMode = 'frames' | 'sheet';

export interface AttackEventMarkers {
  gather: readonly number[];
  release: readonly number[];
  impact: readonly number[];
  recover: readonly number[];
}

export interface AttackAuthorityContract {
  heroId: HeroId;
  authorityId: string;
  mode: AttackAuthorityMode;
  frameCount: 6;
  markerFrames: AttackEventMarkers;
  current: true;
}

export type RuntimeSurfaceStatus = 'current' | 'preserved-legacy' | 'experimental';

export interface RuntimeSurfaceContract {
  id: string;
  path: string;
  status: RuntimeSurfaceStatus;
  reachableFromCurrentMenu: boolean;
}

/**
 * PriZim modernization rule:
 * typed contracts define boundaries before existing proven JavaScript is
 * migrated. Runtime modules can adopt these types incrementally without a
 * rewrite-first requirement.
 */
export interface PriZimRuntimeContract {
  battle: BattleSnapshot;
  attacks: Readonly<Record<HeroId, AttackAuthorityContract>>;
  surfaces: readonly RuntimeSurfaceContract[];
}
